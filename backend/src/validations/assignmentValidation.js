import { z } from "zod";
import { uuid } from "./common.js";
export { validate } from "./common.js";
export const createAssignmentSchema = z.object({ problemId: uuid, universityId: uuid, matchScore: z.number().min(0).max(100).optional() });
