import assert from "node:assert/strict";
import { after, before, beforeEach, mock, test } from "node:test";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import express from "express";
import jwt from "jsonwebtoken";

process.env.ACCESS_TOKEN_SECRET = "rbac-test-access-secret";
process.env.REFRESH_TOKEN_SECRET = "rbac-test-refresh-secret";
process.env.PORT = "0";

const publicRoles = ["CITIZEN", "FACULTY", "STUDENT", "INDUSTRY"];
const staffRoles = ["OFFICIAL", "DEPT_ADMIN", "SUPER_ADMIN"];
const roles = [...publicRoles, ...staffRoles];
const users = new Map(roles.map(role => [role, { id: role, role, name: role, isActive: true }]));
users.set("OWNER", { id: "OWNER", role: "CITIZEN", isActive: true });
const problems = new Map();
const writes = [];
const filename = `rbac-${randomUUID()}.txt`;
const attachmentUrl = `/uploads/problems/${filename}`;
const attachmentFile = new URL(`../uploads/problems/${filename}`, import.meta.url);

const matches = (row, where) => Object.entries(where).every(([key, value]) => {
  if (key === "AND") return value.every(condition => matches(row, condition));
  if (key === "OR") return value.some(condition => matches(row, condition));
  if (value?.contains !== undefined) return row[key].toLowerCase().includes(value.contains.toLowerCase());
  return row[key] === value;
});

const prisma = {
  user: { findUnique: async ({ where }) => users.get(where.id) },
  problem: {
    findUnique: async ({ where }) => problems.get(where.id),
    findMany: async ({ where }) => [...problems.values()].filter(row => matches(row, where)),
    count: async ({ where }) => [...problems.values()].filter(row => matches(row, where)).length,
    create: async ({ data }) => {
      const problem = { id: randomUUID(), deletedAt: null, ...data };
      problems.set(problem.id, problem); writes.push("create"); return problem;
    },
    update: async ({ where, data }) => {
      writes.push("update");
      const problem = { ...problems.get(where.id), ...data };
      problems.set(where.id, problem); return problem;
    },
  },
  attachment: {
    findFirst: async ({ where }) => where.url === attachmentUrl
      ? { url: attachmentUrl, problem: problems.get("private") } : null,
  },
  auditLog: { create: async () => { writes.push("audit"); } },
  problemUpvote: {
    findUnique: async () => null,
    create: async () => { writes.push("upvote"); return {}; },
  },
  comment: { create: async () => { writes.push("comment"); return {}; } },
  feedback: { create: async () => { writes.push("feedback"); return {}; } },
};
mock.module("@prisma/client", { namedExports: { PrismaClient: class { constructor() { return prisma; } } } });

let server;
let baseUrl;
before(async () => {
  const listen = express.application.listen;
  const spy = mock.method(express.application, "listen", function (...args) {
    server = listen.apply(this, args);
    return server;
  });
  await import("../index.js");
  spy.mock.restore();
  if (!server.listening) await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  await writeFile(attachmentFile, "private attachment");
});
after(async () => {
  await unlink(attachmentFile).catch(error => { if (error.code !== "ENOENT") throw error; });
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
beforeEach(() => {
  writes.length = 0;
  problems.clear();
  for (const [id, isPublic, title] of [
    ["public", true, "Pipeline leak"], ["private", false, "Pipeline leak"],
    ["unrelated", true, "School repairs"], ["deleted", true, "Pipeline leak"],
  ]) problems.set(id, { id, isPublic, title, description: "A community problem", submittedById: "OWNER", status: "SUBMITTED", deletedAt: id === "deleted" ? new Date() : null });
});

const request = (method, path, role, body, claimedRole = role) => fetch(`${baseUrl}${path}`, {
  method,
  headers: {
    ...(role && { Authorization: `Bearer ${jwt.sign({ id: role, role: claimedRole }, process.env.ACCESS_TOKEN_SECRET)}` }),
    ...(body !== undefined && { "Content-Type": "application/json" }),
  },
  ...(body !== undefined && { body: JSON.stringify(body) }),
});
const problemPath = "/api/problems";

test("every problem operation and attachment requires authentication", async () => {
  for (const [method, path] of [
    ["GET", problemPath], ["POST", problemPath], ["GET", `${problemPath}/public`],
    ["PATCH", `${problemPath}/public`], ["DELETE", `${problemPath}/public`],
    ["PATCH", `${problemPath}/public/verify`], ["POST", `${problemPath}/public/upvote`],
    ["POST", `${problemPath}/public/comment`], ["POST", `${problemPath}/public/feedback`],
    ["GET", attachmentUrl], ["HEAD", attachmentUrl], ["GET", "/api/auth/me"],
  ]) assert.equal((await request(method, path)).status, 401, `${method} ${path}`);
  assert.deepEqual(writes, []);
});

test("all supported roles can submit; owner identity comes from the authenticated user", async () => {
  for (const role of roles) {
    const response = await request("POST", problemPath, role, {
      title: "Pipeline leak", description: "Water leaking for two weeks", submittedById: "OWNER",
    });
    assert.equal(response.status, 201, role);
    assert.equal((await response.json()).data.submittedById, role);
  }
});

test("list and search hide private problems from every ordinary role, while owners and staff can read them", async () => {
  for (const role of [...roles, "OWNER"]) {
    const response = await request("GET", `${problemPath}?search=Pipeline`, role);
    assert.equal(response.status, 200);
    const body = await response.json();
    const expected = staffRoles.includes(role) || role === "OWNER" ? ["public", "private"] : ["public"];
    assert.deepEqual(body.data.map(row => row.id), expected, role);
    assert.equal(body.pagination.total, expected.length);
    assert.equal((await request("GET", `${problemPath}/private`, role)).status, expected.length === 2 ? 200 : 404, role);
  }
});

test("private problem engagement is denied before any write; public engagement remains allowed", async () => {
  for (const role of publicRoles) {
    for (const [action, body, successStatus] of [["upvote", {}, 200], ["comment", { content: "Useful detail" }, 201], ["feedback", { rating: 4 }, 201]]) {
      const count = writes.length;
      assert.equal((await request("POST", `${problemPath}/private/${action}`, role, body)).status, 404);
      assert.equal(writes.length, count);
      assert.equal((await request("POST", `${problemPath}/public/${action}`, role, body)).status, successStatus);
    }
  }
});

test("only owners and staff edit; only staff can change status and scores even for owned problems", async () => {
  for (const role of publicRoles) {
    assert.equal((await request("PATCH", `${problemPath}/public`, role, { title: "Changed title" })).status, 403);
  }
  assert.deepEqual(writes, []);
  assert.equal((await request("PATCH", `${problemPath}/private`, "OWNER", { title: "Changed title" })).status, 200);
  for (const field of ["status", "severityScore", "urgencyScore", "geographicImpactScore", "feasibilityScore", "communitySupportScore"]) {
    const count = writes.length;
    assert.equal((await request("PATCH", `${problemPath}/private`, "OWNER", { [field]: field === "status" ? "VERIFIED" : 5 })).status, 403, field);
    assert.equal(writes.length, count);
  }
  for (const role of staffRoles) assert.equal((await request("PATCH", `${problemPath}/private`, role, { status: "IN_PROGRESS", severityScore: 5 })).status, 200, role);
});

test("verification requires the current database staff role, ignoring a forged token role claim", async () => {
  for (const role of publicRoles) assert.equal((await request("PATCH", `${problemPath}/public/verify`, role, {}, "SUPER_ADMIN")).status, 403);
  assert.deepEqual(writes, []);
  for (const role of staffRoles) assert.equal((await request("PATCH", `${problemPath}/private/verify`, role, {})).status, 200);
});

test("owners and admins can delete; officials cannot delete someone else's problem", async () => {
  for (const role of [...publicRoles, "OFFICIAL"]) assert.equal((await request("DELETE", `${problemPath}/public`, role)).status, 403);
  assert.deepEqual(writes, []);
  for (const role of ["OWNER", "DEPT_ADMIN", "SUPER_ADMIN"]) {
    problems.get("private").deletedAt = null;
    assert.equal((await request("DELETE", `${problemPath}/private`, role)).status, 200);
  }
});

test("attachments enforce problem visibility and deleted problems stay inaccessible", async () => {
  for (const role of publicRoles) assert.equal((await request("GET", attachmentUrl, role)).status, 404);
  for (const role of ["OWNER", ...staffRoles]) {
    const response = await request("GET", attachmentUrl, role);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "private attachment");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
  problems.get("private").deletedAt = new Date();
  assert.equal((await request("GET", attachmentUrl, "SUPER_ADMIN")).status, 404);
  for (const method of ["GET", "PATCH", "DELETE"]) assert.equal((await request(method, `${problemPath}/deleted`, "SUPER_ADMIN", method === "PATCH" ? {} : undefined)).status, 404);
});

test("public registration cannot assign privileged roles; inactive and unknown roles cannot access protected routes", async () => {
  for (const role of staffRoles) assert.equal((await request("POST", "/api/auth/register", undefined, {
    name: "Test User", email: "test@example.com", password: "Password1", role,
  })).status, 400);
  users.set("UNKNOWN", { id: "UNKNOWN", role: "UNKNOWN", isActive: true });
  users.set("INACTIVE", { id: "INACTIVE", role: "SUPER_ADMIN", isActive: false });
  users.set("DELETED", { id: "DELETED", role: "SUPER_ADMIN", isActive: true, deletedAt: new Date() });
  for (const path of [problemPath, "/api/auth/me", attachmentUrl]) {
    assert.equal((await request("GET", path, "UNKNOWN")).status, 403);
    assert.equal((await request("GET", path, "INACTIVE")).status, 403);
    assert.equal((await request("GET", path, "DELETED")).status, 401);
  }
});
