import { z } from "zod";

export const createImpactRecordSchema = z.object({
  projectId: z.string().uuid(),
  citizensBenefited: z.number().int().nonnegative().max(2147483647).optional(),
  villagesCovered: z.number().int().nonnegative().max(2147483647).optional(),
  costSaved: z.number().nonnegative().max(1e12).optional(),
  jobsCreated: z.number().int().nonnegative().max(2147483647).optional(),
}).refine(d=>Object.keys(d).some(k=>k!=="projectId"),"Provide at least one impact metric");

export { validate } from "./common.js";
