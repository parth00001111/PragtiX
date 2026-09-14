import express from "express";
import * as c from "../controller/projectController.js";
import * as v from "../validations/projectValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.get("/",query(v.projectQuerySchema),c.getAllProjects);
router.get("/:id",validateIds("id"),c.getProjectById);
router.post("/",authorize("FACULTY",...ADMIN_ROLES),validate(v.createProjectSchema),c.createProject);
router.patch("/:id",authorize("FACULTY",...STAFF_ROLES),validateIds("id"),validate(v.updateProjectSchema),c.updateProject);
export default router;
