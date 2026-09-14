import express from "express";
import * as c from "../controller/ratingController.js";
import * as v from "../validations/ratingValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.post("/",protect,validate(v.createRatingSchema),c.createRating);
router.get("/university/:universityId",validateIds("universityId"),query(),c.getRatingsForUniversity);
router.get("/industry/:industryId",validateIds("industryId"),query(),c.getRatingsForIndustry);
export default router;
