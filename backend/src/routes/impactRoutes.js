import express from "express";
import * as c from "../controller/impactController.js";
import * as v from "../validations/impactValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.post("/",authorize(...STAFF_ROLES),validate(v.createImpactRecordSchema),c.createImpactRecord);
router.get("/project/:projectId",validateIds("projectId"),c.getImpactByProject);
router.get("/stats/overall",authorize(...STAFF_ROLES),c.getOverallImpactStats);
export default router;
