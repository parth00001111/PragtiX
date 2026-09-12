import { z } from "zod";

export const createDistrictSchema = z.object({
  name: z.string().min(2).max(100),
});

export const createBlockSchema = z.object({
  name: z.string().min(2).max(100),
  districtId: z.string().uuid(),
});

export const createPanchayatSchema = z.object({
  name: z.string().min(2).max(100),
  blockId: z.string().uuid(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(150),
  domains: z.array(
    z.enum([
      "EDUCATION", "HEALTHCARE", "AGRICULTURE", "WATER_MANAGEMENT",
      "SANITATION", "ENVIRONMENT", "RURAL_LIVELIHOOD", "ACCESSIBILITY",
      "URBAN_INFRASTRUCTURE", "PUBLIC_SERVICE_DELIVERY", "ENERGY", "OTHER",
    ])
  ).min(1),
});

export { validate } from "./common.js";
