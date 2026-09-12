import express from "express";
import * as c from "../controller/assignmentController.js";
import * as v from "../validations/assignmentValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.post("/",authorize(...STAFF_ROLES),validate(v.createAssignmentSchema),c.createAssignment);
router.get("/suggestions/:problemId",authorize(...STAFF_ROLES),validateIds("problemId"),c.suggestUniversitiesForProblem);
router.get("/university/:universityId",validateIds("universityId"),query(),c.getAssignmentsForUniversity);
router.get("/:id",validateIds("id"),c.getAssignmentById);
export default router;
