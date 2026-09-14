import { z } from "zod";
import { ALL_ROLES } from "../config/rbac.js";
import { uuid, nonEmpty, pageSchema } from "./common.js";
export { validate } from "./common.js";
export const updateUserSchema = nonEmpty(z.object({ role: z.enum(ALL_ROLES).optional(), isActive: z.boolean().optional(), districtId: uuid.nullable().optional(), departmentId: uuid.nullable().optional() }));
export const userQuerySchema = pageSchema.extend({ role: z.enum(ALL_ROLES).optional(), search: z.string().trim().min(1).max(100).optional() });
export const updateMeSchema = nonEmpty(z.object({ name: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().max(25).nullable().optional() }));
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(1000), newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).refine(value => Buffer.byteLength(value,"utf8") <= 72, "Password must be at most 72 bytes") });
