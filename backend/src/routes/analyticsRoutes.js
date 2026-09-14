import express from "express";
import * as c from "../controller/analyticsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect,authorize(...STAFF_ROLES));
router.get("/",query(pageSchema.extend({districtId:uuid.optional(),domain:domain.optional()})),c.getDashboard);
export default router;
