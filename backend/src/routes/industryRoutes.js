import express from "express";
import * as c from "../controller/industryController.js";
import * as v from "../validations/industryValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.get("/",query(),c.getAllIndustries);
router.get("/me",protect,authorize("INDUSTRY"),c.getMyIndustry);
router.get("/:id",validateIds("id"),c.getIndustryById);
router.post("/",protect,authorize("INDUSTRY"),validate(v.createIndustryProfileSchema),c.createIndustryProfile);
router.patch("/:id",protect,authorize("INDUSTRY",...ADMIN_ROLES),validateIds("id"),validate(v.updateIndustrySchema),c.updateIndustry);
export default router;
