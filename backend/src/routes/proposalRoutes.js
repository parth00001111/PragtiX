import express from "express";
import * as c from "../controller/proposalController.js";
import * as v from "../validations/proposalValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.get("/project/:projectId",validateIds("projectId"),query(),c.getProposalsByProject);
router.post("/",authorize("FACULTY","STUDENT",...STAFF_ROLES),validate(v.createProposalSchema),c.createProposal);
router.patch("/:id",authorize("FACULTY","STUDENT",...STAFF_ROLES),validateIds("id"),validate(v.createProposalSchema.pick({content:true})),c.updateProposal);
router.patch("/:id/submit",authorize("FACULTY","STUDENT",...STAFF_ROLES),validateIds("id"),c.submitProposal);
router.patch("/:id/review",authorize(...STAFF_ROLES),validateIds("id"),validate(v.reviewProposalSchema),c.reviewProposal);
export default router;
