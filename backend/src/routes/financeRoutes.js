import express from "express";
import * as c from "../controller/financeController.js";
import * as v from "../validations/financeValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.post("/partnerships",authorize("FACULTY",...STAFF_ROLES),validate(v.createPartnershipSchema),c.createPartnership);
router.post("/fundings",authorize("FACULTY","INDUSTRY",...ADMIN_ROLES),validate(v.createFundingSchema),c.createFunding);
router.post("/expenses",authorize("FACULTY",...ADMIN_ROLES),validate(v.createExpenseSchema),c.createExpense);
router.get("/project/:projectId/summary",validateIds("projectId"),c.getProjectFinanceSummary);
export default router;
