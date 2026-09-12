import prisma from "../../PrismaClient.js";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";
import { ensure } from "../utils/http.js";

export const isStaff = user => STAFF_ROLES.includes(user.role);
export const isAdmin = user => ADMIN_ROLES.includes(user.role);
export const activeUser = { isActive: true, deletedAt: null };
export const publicUser = { id: true, name: true, role: true };

export const universityAccess = async (user, id, db = prisma) => {
  const university = await db.universityProfile.findUnique({ where: { id } });
  ensure(university, 404, "University not found");
  ensure(isAdmin(user) || (user.role === "FACULTY" && university.userId === user.id), 403, "Only the university coordinator or an admin can manage this institution");
  return university;
};

export const teamAccess = async (user, id, action = "read", db = prisma) => {
  const team = await db.team.findUnique({ where: { id }, include: { university: true, members: true } });
  ensure(team, 404, "Team not found");
  const member = team.members.find(item => item.userId === user.id && (user.role === "FACULTY" ? item.role === "FACULTY_MENTOR" : user.role === "STUDENT" && ["STUDENT_LEAD","STUDENT_MEMBER"].includes(item.role)));
  const manager = isAdmin(user) || (user.role === "FACULTY" && team.university.userId === user.id);
  ensure(manager || (action === "read" && (isStaff(user) || member)), 403, "You cannot access this team");
  return team;
};

export const projectInclude = {
  assignment: { include: { university: true, problem: true } },
  team: { include: { members: true } },
  partnerships: { include: { industry: true } },
};
export const projectRights = (user, project) => {
  const member = project.team.members.find(item => item.userId === user.id && (user.role === "FACULTY" ? item.role === "FACULTY_MENTOR" : user.role === "STUDENT" && ["STUDENT_LEAD","STUDENT_MEMBER"].includes(item.role)));
  const coordinator = user.role === "FACULTY" && project.assignment.university.userId === user.id;
  const mentor = user.role === "FACULTY" && member?.role === "FACULTY_MENTOR";
  const partner = user.role === "INDUSTRY" && project.partnerships.some(item => item.industry.userId === user.id);
  const staff = isStaff(user);
  return {
    read: staff || coordinator || !!member || partner || project.assignment.problem.submittedById === user.id,
    collaborate: staff || coordinator || !!member || partner,
    manage: staff || coordinator || mentor,
    contribute: staff || coordinator || mentor || (user.role === "STUDENT" && member?.role === "STUDENT_LEAD"),
    finance: isAdmin(user) || coordinator || mentor,
  };
};
export const projectAccess = async (user, id, action = "read", db = prisma) => {
  const project = await db.project.findUnique({ where: { id }, include: projectInclude });
  ensure(project && !project.assignment.problem.deletedAt, 404, "Project not found");
  ensure(projectRights(user, project)[action], 403, "You cannot perform this action on this project");
  return project;
};
export const projectVisibilityWhere = user => ({
  assignment: { problem: { deletedAt: null } },
  ...(!isStaff(user) && { OR: [
    ...(user.role === "FACULTY" ? [{ assignment: { university: { userId: user.id } } }] : []),
    { assignment: { problem: { submittedById: user.id } } },
    ...(["FACULTY","STUDENT"].includes(user.role) ? [{ team: { members: { some: { userId: user.id, role: user.role === "FACULTY" ? "FACULTY_MENTOR" : {in:["STUDENT_LEAD","STUDENT_MEMBER"]} } } } }] : []),
    ...(user.role === "INDUSTRY" ? [{ partnerships: { some: { industry: { userId: user.id } } } }] : []),
  ] }),
});
