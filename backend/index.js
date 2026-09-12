import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./src/config/env.js";
import authRoutes from "./src/routes/authRoutes.js";
import problemRoutes from "./src/routes/problemRoutes.js";
import { fileURLToPath } from "node:url";
import { protect, authorize } from "./src/middleware/authMiddleware.js";
import { ALL_ROLES } from "./src/config/rbac.js";
import { requireAttachmentAccess } from "./src/middleware/problemAccessMiddleware.js";

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.get("/uploads/problems/:filename", protect, authorize(...ALL_ROLES), requireAttachmentAccess, (req, res) => {
  res.sendFile(req.params.filename, {
    root: fileURLToPath(new URL("./uploads/problems/", import.meta.url)),
    cacheControl: false,
    dotfiles: "deny",
  });
});

app.get("/", (req, res) => res.send("PragatiX backend running"));
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
