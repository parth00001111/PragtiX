import { z } from "zod";
import { uuid, pageSchema } from "./common.js";
export { validate } from "./common.js";
export const createTeamSchema = z.object({ name: z.string().trim().min(2).max(150), universityId: uuid.optional() });
export const addTeamMemberSchema = z.object({ userId: uuid, role: z.enum(["FACULTY_MENTOR", "STUDENT_LEAD", "STUDENT_MEMBER"]) });
export const teamQuerySchema = pageSchema.extend({ universityId: uuid.optional() });
