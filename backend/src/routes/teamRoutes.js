import express from "express";
import * as c from "../controller/teamController.js";
import * as v from "../validations/teamValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.get("/",query(v.teamQuerySchema),c.getAllTeams);
router.get("/:id",validateIds("id"),c.getTeamById);
router.use(authorize("FACULTY",...ADMIN_ROLES));
router.post("/",validate(v.createTeamSchema),c.createTeam);
router.post("/:teamId/members",validateIds("teamId"),validate(v.addTeamMemberSchema),c.addTeamMember);
router.delete("/:teamId/members/:userId",validateIds("teamId","userId"),c.removeTeamMember);
export default router;
