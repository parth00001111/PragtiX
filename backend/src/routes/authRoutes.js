    // routes/authRoutes.js
import express from "express";
import { register, login } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
