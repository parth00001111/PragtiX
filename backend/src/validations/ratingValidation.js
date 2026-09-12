import { z } from "zod";
import { uuid } from "./common.js";
export { validate } from "./common.js";
export const createRatingSchema = z.object({ universityId: uuid.optional(), industryId: uuid.optional(), score: z.number().int().min(1).max(5), remark: z.string().trim().max(500).optional() }).refine(data => !!data.universityId !== !!data.industryId, { message: "Provide exactly one of universityId or industryId" });
