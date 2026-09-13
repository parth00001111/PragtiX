<<<<<<< HEAD
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import authRoutes from "./src/routes/authRoutes.js";

const app = express();
const configuredOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const developmentOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

=======
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
>>>>>>> origin/main
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
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

<<<<<<< HEAD
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  return res.status(500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
=======
const PORT = process.env.PORT || 5000;
>>>>>>> origin/main
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
