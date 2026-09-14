import { z } from "zod";

export const createIndustryProfileSchema = z.object({
  orgName: z.string().min(2).max(200),
  type: z.enum(["STARTUP", "MSME", "CSR", "RESEARCH_LAB", "CORPORATE", "GOVERNMENT_BODY"]),
  sector: z.string().max(150).optional(),
});

export { validate } from "./common.js";

export const updateIndustrySchema=createIndustryProfileSchema.partial().refine(d=>Object.keys(d).length>0,"Provide at least one field");
