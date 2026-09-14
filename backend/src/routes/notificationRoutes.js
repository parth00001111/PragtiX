import express from "express";
import * as c from "../controller/notificationController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate, validateIds, query, pageSchema, uuid, domain } from "../validations/common.js";
import { z } from "zod";
import { STAFF_ROLES, ADMIN_ROLES } from "../config/rbac.js";

const router=express.Router();
router.use(protect);
router.get("/",query(pageSchema.extend({unread:z.enum(["true","false"]).transform(v=>v==="true").optional()})),c.getMyNotifications);
router.patch("/read-all",c.markAllAsRead);
router.patch("/:id/read",validateIds("id"),c.markNotificationAsRead);
export default router;
