// routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
} from "../controller/authController.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validate,
} from "../validations/authValidation.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshTokenSchema), refreshAccessToken);
router.post("/logout", validate(refreshTokenSchema), logout);
router.get("/me", protect, getMe);

export default router;
