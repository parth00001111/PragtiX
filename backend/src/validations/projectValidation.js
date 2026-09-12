import { z } from "zod";
import { uuid, nonEmpty, pageSchema } from "./common.js";
export { validate } from "./common.js";
export const projectStatus = z.enum(["PROPOSED", "APPROVED", "PROTOTYPE", "PILOT_TESTING", "DEPLOYED", "IMPACT_MEASURED", "DROPPED"]);
export const createProjectSchema = z.object({ title: z.string().trim().min(3).max(200), description: z.string().trim().min(10).max(20000), assignmentId: uuid, teamId: uuid, budgetAllocated: z.number().nonnegative().max(1e12).multipleOf(0.01).optional() });
export const updateProjectSchema = nonEmpty(z.object({ title: z.string().trim().min(3).max(200).optional(), description: z.string().trim().min(10).max(20000).optional(), status: projectStatus.optional(), patentFiled: z.boolean().optional(), startupCreated: z.boolean().optional() }));
export const projectQuerySchema = pageSchema.extend({ status: projectStatus.optional() });
