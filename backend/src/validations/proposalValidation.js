import { z } from "zod";
import { uuid } from "./common.js";
export { validate } from "./common.js";
export const createProposalSchema = z.object({ projectId: uuid, content: z.string().trim().min(20).max(50000) });
export const reviewProposalSchema = z.object({ status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUESTED"]), reviewNote: z.string().trim().max(2000).optional() }).refine(data => !["REJECTED","REVISION_REQUESTED"].includes(data.status) || !!data.reviewNote, { message: "A review note is required for rejection or revision" });
