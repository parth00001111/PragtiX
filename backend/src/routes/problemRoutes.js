import express from "express";
import {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  verifyProblem,
  deleteProblem,
  upvoteProblem,
  addComment,
  addFeedback,
} from "../controller/problemController.js";
import {
  createProblemSchema,
  updateProblemSchema,
  verifyProblemSchema,
  addCommentSchema,
  addFeedbackSchema,
  validate,
} from "../validations/problemValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { ALL_ROLES, STAFF_ROLES } from "../config/rbac.js";
import { requireProblemAccess } from "../middleware/problemAccessMiddleware.js";

const router = express.Router();
router.use(protect, authorize(...ALL_ROLES));

// Every supported role can submit; reads and changes also check problem access.
router.post(
  "/",
  upload.array("attachments", 5),
  validate(createProblemSchema),
  createProblem
);
router.get("/", getAllProblems);
router.get("/:id", requireProblemAccess(), getProblemById);
router.patch("/:id", validate(updateProblemSchema), requireProblemAccess("update"), updateProblem);
router.delete("/:id", requireProblemAccess("delete"), deleteProblem);

// engagement routes
router.post("/:id/upvote", requireProblemAccess(), upvoteProblem);
router.post("/:id/comment", requireProblemAccess(), validate(addCommentSchema), addComment);
router.post("/:id/feedback", requireProblemAccess(), validate(addFeedbackSchema), addFeedback);

// official-only routes
router.patch(
  "/:id/verify",
  authorize(...STAFF_ROLES),
  requireProblemAccess(),
  validate(verifyProblemSchema),
  verifyProblem
);

export default router;
