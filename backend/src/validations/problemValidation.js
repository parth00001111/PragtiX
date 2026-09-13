import { z } from "zod";

// ---------------- CREATE PROBLEM ----------------
export const createProblemSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  domain: z
    .enum([
      "EDUCATION",
      "HEALTHCARE",
      "AGRICULTURE",
      "WATER_MANAGEMENT",
      "SANITATION",
      "ENVIRONMENT",
      "RURAL_LIVELIHOOD",
      "ACCESSIBILITY",
      "URBAN_INFRASTRUCTURE",
      "PUBLIC_SERVICE_DELIVERY",
      "ENERGY",
      "OTHER",
    ])
    .optional(),
  blockId: z.string().uuid().optional(),
  panchayatId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  peopleAffected: z.number().int().positive().optional(),
  isPublic: z.boolean().optional(),
});

// ---------------- UPDATE PROBLEM ----------------
export const updateProblemSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).optional(),
  domain: z
    .enum([
      "EDUCATION",
      "HEALTHCARE",
      "AGRICULTURE",
      "WATER_MANAGEMENT",
      "SANITATION",
      "ENVIRONMENT",
      "RURAL_LIVELIHOOD",
      "ACCESSIBILITY",
      "URBAN_INFRASTRUCTURE",
      "PUBLIC_SERVICE_DELIVERY",
      "ENERGY",
      "OTHER",
    ])
    .optional(),
  status: z
    .enum([
      "SUBMITTED",
      "VERIFIED",
      "PRIORITIZED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "REJECTED",
      "ESCALATED",
    ])
    .optional(),
  blockId: z.string().uuid().optional(),
  panchayatId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  peopleAffected: z.number().int().positive().optional(),
  severityScore: z.number().min(0).max(10).optional(),
  urgencyScore: z.number().min(0).max(10).optional(),
  geographicImpactScore: z.number().min(0).max(10).optional(),
  feasibilityScore: z.number().min(0).max(10).optional(),
  communitySupportScore: z.number().min(0).max(10).optional(),
  isPublic: z.boolean().optional(),
});

// ---------------- VERIFY PROBLEM ----------------
export const verifyProblemSchema = z.object({
  isDuplicateOf: z.string().uuid().optional(),
  duplicateNote: z.string().optional(),
});

// ---------------- COMMENT ----------------
export const addCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
});

// ---------------- FEEDBACK ----------------
export const addFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ---------------- Generic validate middleware ----------------
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }
  req.body = result.data;
  next();
};
