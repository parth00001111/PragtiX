import { PrismaClient } from "@prisma/client";
import { canAccessProblem, MODERATION_FIELDS, STAFF_ROLES } from "../config/rbac.js";

const prisma = new PrismaClient();

export const requireProblemAccess = (action = "read") => async (req, res, next) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!problem || problem.deletedAt) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }
    if (!canAccessProblem(req.user, problem, action)) {
      return res.status(action === "read" ? 404 : 403).json({
        success: false,
        message: action === "read" ? "Problem not found" : `You are not allowed to ${action} this problem`,
      });
    }
    if (action === "update" && !STAFF_ROLES.includes(req.user.role)
      && MODERATION_FIELDS.some((field) => Object.hasOwn(req.body, field))) {
      return res.status(403).json({
        success: false, message: "Only officials and admins can change problem status or scores",
      });
    }
    req.problem = problem;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAttachmentAccess = async (req, res, next) => {
  try {
    const attachment = await prisma.attachment.findFirst({
      where: { url: `/uploads/problems/${req.params.filename}` },
      include: { problem: true },
    });
    if (!attachment || !canAccessProblem(req.user, attachment.problem)) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }
    res.set("Cache-Control", "private, no-store");
    next();
  } catch (error) {
    next(error);
  }
};
