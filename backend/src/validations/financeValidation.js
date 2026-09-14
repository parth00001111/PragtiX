import { z } from "zod";
import { uuid } from "./common.js";
export { validate } from "./common.js";
const amount = z.number().positive().max(1e12).multipleOf(0.01);
export const createPartnershipSchema = z.object({ projectId: uuid, industryId: uuid, role: z.enum(["MENTOR", "FUNDER", "IMPLEMENTER", "TESTING_PARTNER", "TECH_PROVIDER"]) });
export const createFundingSchema = z.object({ projectId: uuid, source: z.enum(["INDUSTRY", "CSR", "GOVERNMENT_GRANT", "UNIVERSITY_INTERNAL"]), industryId: uuid.optional(), amount }).refine(data => ["INDUSTRY","CSR"].includes(data.source) === !!data.industryId, { message: "industryId is required only for INDUSTRY/CSR funding" });
export const createExpenseSchema = z.object({ projectId: uuid, description: z.string().trim().min(3).max(300), amount });
