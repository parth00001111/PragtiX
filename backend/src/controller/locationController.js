import prisma from "../../PrismaClient.js";

// ---------- DISTRICT ----------
export const createDistrict = async (req, res, next) => {
  try {
    const district = await prisma.district.create({ data: req.body });
    return res.status(201).json({ success: true, data: district });
  } catch (error) {
    return next(error);
  }
};

export const getAllDistricts = async (req, res, next) => {
  try {
    const districts = await prisma.district.findMany({ include: { blocks: true } });
    return res.status(200).json({ success: true, data: districts });
  } catch (error) {
    return next(error);
  }
};

// ---------- BLOCK ----------
export const createBlock = async (req, res, next) => {
  try {
    const block = await prisma.block.create({ data: req.body });
    return res.status(201).json({ success: true, data: block });
  } catch (error) {
    return next(error);
  }
};

export const getBlocksByDistrict = async (req, res, next) => {
  try {
    const { districtId } = req.params;
    const blocks = await prisma.block.findMany({ where: { districtId }, include: { panchayats: true } });
    return res.status(200).json({ success: true, data: blocks });
  } catch (error) {
    return next(error);
  }
};

// ---------- PANCHAYAT ----------
export const createPanchayat = async (req, res, next) => {
  try {
    const panchayat = await prisma.panchayat.create({ data: req.body });
    return res.status(201).json({ success: true, data: panchayat });
  } catch (error) {
    return next(error);
  }
};

export const getPanchayatsByBlock = async (req, res, next) => {
  try {
    const { blockId } = req.params;
    const panchayats = await prisma.panchayat.findMany({ where: { blockId } });
    return res.status(200).json({ success: true, data: panchayats });
  } catch (error) {
    return next(error);
  }
};

// ---------- GOV DEPARTMENT ----------
export const createGovDepartment = async (req, res, next) => {
  try {
    const dept = await prisma.govDepartment.create({ data: req.body });
    return res.status(201).json({ success: true, data: dept });
  } catch (error) {
    return next(error);
  }
};

export const getAllGovDepartments = async (req, res, next) => {
  try {
    const depts = await prisma.govDepartment.findMany({ select: { id: true, name: true, domains: true } });
    return res.status(200).json({ success: true, data: depts });
  } catch (error) {
    return next(error);
  }
};