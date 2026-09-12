import express from "express";
import * as c from "../controller/userController.js";
import * as v from "../validations/userValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.patch("/me",validate(v.updateMeSchema),c.updateMe);
router.patch("/me/password",validate(v.changePasswordSchema),c.changePassword);
router.get("/",authorize("SUPER_ADMIN"),query(v.userQuerySchema),c.listUsers);
router.patch("/:id",authorize("SUPER_ADMIN"),validateIds("id"),validate(v.updateUserSchema),c.updateUser);
export default router;
