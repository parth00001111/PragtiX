import { z } from "zod";

export const createMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(3).max(200),
  dueDate: z.string().datetime({offset:true}).optional(),
});

export const updateMilestoneSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  dueDate: z.string().datetime({offset:true}).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"]).optional(),
}).refine(d=>Object.keys(d).length>0,"Provide at least one field");

export { validate } from "./common.js";
