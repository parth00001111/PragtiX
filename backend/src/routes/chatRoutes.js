import express from "express";
import { createChatReply, fallbackChatReply } from "../services/chatService.js";

const router = express.Router();
const requestLog = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;

const rateLimit = (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    return res.status(429).json({ message: "Please wait a moment before sending another message." });
  }
  recent.push(now);
  requestLog.set(key, recent);
  return next();
};

router.post("/", rateLimit, async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];

  if (!message) return res.status(400).json({ message: "Please enter a message." });
  if (message.length > 1000) return res.status(400).json({ message: "Message must be 1,000 characters or fewer." });

  const history = rawHistory
    .filter((item) => ["user", "assistant"].includes(item?.role) && typeof item?.content === "string")
    .slice(-10)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }));

  try {
    const result = await createChatReply({ message, history });
    return res.json({ data: result });
  } catch (error) {
    console.error("Chat provider error:", error.message);
    return res.json({ data: { reply: fallbackChatReply(message), mode: "fallback" } });
  }
});

export default router;
