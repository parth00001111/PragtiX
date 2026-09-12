import express from "express";
import * as c from "../controller/tagController.js";
import * as v from "../validations/tagValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.get("/",query(),c.getAllTags);
router.use(protect,authorize(...STAFF_ROLES));
router.post("/",validate(v.createTagSchema),c.createTag);
router.post("/attach",validate(v.attachTagSchema),c.addTagToProblem);
router.delete("/problem/:problemId/:tagId",validateIds("problemId","tagId"),c.removeTagFromProblem);
export default router;
