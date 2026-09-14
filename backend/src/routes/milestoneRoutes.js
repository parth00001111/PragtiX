import express from "express";
import * as c from "../controller/milestoneController.js";
import * as v from "../validations/milestoneValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.get("/project/:projectId",validateIds("projectId"),query(),c.getMilestonesByProject);
router.post("/",authorize("FACULTY",...STAFF_ROLES),validate(v.createMilestoneSchema),c.createMilestone);
router.patch("/:id",authorize("FACULTY","STUDENT",...STAFF_ROLES),validateIds("id"),validate(v.updateMilestoneSchema),c.updateMilestone);
export default router;
