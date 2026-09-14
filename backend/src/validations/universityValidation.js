import { z } from "zod";
import { domain, uuid, nonEmpty, pageSchema } from "./common.js";
export { validate } from "./common.js";
export const createUniversityProfileSchema = z.object({ universityName: z.string().trim().min(2).max(200), district: z.string().trim().min(2).max(100), hasIncubationCenter: z.boolean().optional() });
export const updateUniversitySchema = nonEmpty(createUniversityProfileSchema.partial());
export const universityQuerySchema = pageSchema.extend({ domain: domain.optional(), district: z.string().trim().min(1).max(100).optional() });
export const createDepartmentSchema = z.object({ universityId: uuid.optional(), name: z.string().trim().min(2).max(150), domainExpertise: z.array(domain).min(1).max(12) });
export const createFacultyProfileSchema = z.object({ userId: uuid.optional(), departmentId: uuid, specialization: z.string().trim().max(200).optional() });
export const createLabSchema = z.object({ name: z.string().trim().min(2).max(150), facilityType: z.string().trim().max(100).optional(), departmentId: uuid });
