import { z } from "zod";
import { uuid } from "./common.js";
export { validate } from "./common.js";
export const createTagSchema = z.object({ name: z.string().trim().min(2).max(60) });
export const attachTagSchema = z.object({ problemId: uuid, tagId: uuid });
