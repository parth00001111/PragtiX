import express from "express";
import {
  createDistrict, getAllDistricts,
  createBlock, getBlocksByDistrict,
  createPanchayat, getPanchayatsByBlock,
  createGovDepartment, getAllGovDepartments,
} from "../controller/locationController.js";
import {
  createDistrictSchema, createBlockSchema, createPanchayatSchema, createDepartmentSchema, validate,
} from "../validations/locationValidation.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

import { validateIds } from "../validations/common.js";
const router = express.Router();

// public reads (dropdown lists for forms)
router.get("/districts", getAllDistricts);
router.get("/districts/:districtId/blocks", validateIds("districtId"), getBlocksByDistrict);
router.get("/blocks/:blockId/panchayats", validateIds("blockId"), getPanchayatsByBlock);
router.get("/departments", getAllGovDepartments);

// admin-only writes
router.post("/districts", protect, authorize("SUPER_ADMIN"), validate(createDistrictSchema), createDistrict);
router.post("/blocks", protect, authorize("SUPER_ADMIN"), validate(createBlockSchema), createBlock);
router.post("/panchayats", protect, authorize("SUPER_ADMIN"), validate(createPanchayatSchema), createPanchayat);
router.post("/departments", protect, authorize("SUPER_ADMIN"), validate(createDepartmentSchema), createGovDepartment);

export default router;