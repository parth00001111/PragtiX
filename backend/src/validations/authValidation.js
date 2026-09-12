import { z } from "zod";
import { PUBLIC_ROLES } from "../config/rbac.js";

// ---------------- REGISTER ----------------
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().max(254).email("Invalid email address"),
  password: z
    .string()
    .refine(v=>Buffer.byteLength(v,"utf8")<=72,"Password must be at most 72 bytes")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().trim().max(25).optional(),
  role: z
    .enum(PUBLIC_ROLES)
    .optional(),
  districtId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

// ---------------- LOGIN ----------------
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(1000),
});

// ---------------- REFRESH TOKEN ----------------
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required").max(4096),
});

// ---------------- FORGOT / RESET PASSWORD ----------------
export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ---------------- Generic validate middleware ----------------
export { validate } from "./common.js";
