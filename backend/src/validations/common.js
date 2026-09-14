import { z } from "zod";
import { unlink } from "node:fs/promises";

export const uuid = z.string().uuid();
export const DOMAINS = ["EDUCATION", "HEALTHCARE", "AGRICULTURE", "WATER_MANAGEMENT", "SANITATION", "ENVIRONMENT", "RURAL_LIVELIHOOD", "ACCESSIBILITY", "URBAN_INFRASTRUCTURE", "PUBLIC_SERVICE_DELIVERY", "ENERGY", "OTHER"];
export const domain = z.enum(DOMAINS);
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const pageArgs = (query) => ({ skip: (query.page - 1) * query.limit, take: query.limit });
export const nonEmpty = (schema) => schema.refine(data => Object.keys(data).length > 0, "Provide at least one field to update");
export const cleanupUploads = async (files = []) => {
  await Promise.all(files.map(file => file.path ? unlink(file.path).catch(() => {}) : Promise.resolve()));
};
export const validate = (schema, source = "body") => async (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    await cleanupUploads(req.files);
    return res.status(400).json({ success: false, message: "Validation failed", errors: result.error.issues.map(e => ({ field: e.path.join("."), message: e.message })) });
  }
  if (source === "query") req.validatedQuery = result.data;
  else req[source] = result.data;
  next();
};
export const validateIds = (...names) => validate(z.object(Object.fromEntries(names.map(name => [name, uuid]))), "params");
export const query = (schema = pageSchema) => validate(schema, "query");
