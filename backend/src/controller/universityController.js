import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { universityAccess, activeUser, publicUser } from "../services/accessService.js";
import { pageArgs } from "../validations/common.js";

const directory = { id: true, universityName: true, district: true, hasIncubationCenter: true, avgRating: true, departments: { select: { id: true, name: true, domainExpertise: true, labs: true } } };
export const createUniversityProfile = endpoint(async (req,res) => {
  ok(res, await prisma.universityProfile.create({ data: { ...req.body, userId: req.user.id } }), 201);
});
export const getMyUniversity = endpoint(async (req,res) => {
  const profile = await prisma.universityProfile.findUnique({ where: { userId: req.user.id } });
  ensure(profile,404,"University profile not found"); ok(res,profile);
});
export const getAllUniversities = endpoint(async (req,res) => {
  const q=req.validatedQuery;
  const where={ user: activeUser, ...(q.district && { district: q.district }), ...(q.domain && { departments: { some: { domainExpertise: { has:q.domain } } } }) };
  ok(res,await prisma.universityProfile.findMany({ where, select:directory, ...pageArgs(q), orderBy:{universityName:"asc"} }));
});
export const getUniversityById = endpoint(async (req,res) => {
  const university=await prisma.universityProfile.findFirst({where:{id:req.params.id,user:activeUser},select:directory});
  ensure(university,404,"University not found");ok(res,university);
});
export const updateUniversity = endpoint(async (req,res) => {
  await universityAccess(req.user,req.params.id);
  ok(res,await prisma.universityProfile.update({where:{id:req.params.id},data:req.body}));
});
export const createDepartment = endpoint(async (req,res) => {
  const {universityId,...data}=req.body;
  const university=universityId ? await universityAccess(req.user,universityId) : await prisma.universityProfile.findUnique({where:{userId:req.user.id}});
  ensure(university,404,"Create a university profile first");
  ok(res,await prisma.department.create({data:{...data,universityId:university.id}}),201);
});
export const getDepartmentsByUniversity = endpoint(async (req,res) => {
  ensure(await prisma.universityProfile.findFirst({where:{id:req.params.universityId,user:activeUser}}),404,"University not found");
  ok(res,await prisma.department.findMany({where:{universityId:req.params.universityId},include:{labs:true,faculty:{select:{id:true,specialization:true,user:{select:publicUser}}}},orderBy:{name:"asc"}}));
});
export const createFacultyProfile = endpoint(async (req,res) => {
  const {userId=req.user.id,departmentId,specialization}=req.body;
  const department=await prisma.department.findUnique({where:{id:departmentId}});
  ensure(department,404,"Department not found");
  await universityAccess(req.user,department.universityId);
  const user=await prisma.user.findUnique({where:{id:userId}});
  ensure(user && user.isActive && !user.deletedAt && user.role==="FACULTY",400,"Select an active faculty account");
  ok(res,await prisma.facultyProfile.create({data:{userId,departmentId,specialization}}),201);
});
export const createLab = endpoint(async (req,res) => {
  const department=await prisma.department.findUnique({where:{id:req.body.departmentId}});
  ensure(department,404,"Department not found");await universityAccess(req.user,department.universityId);
  ok(res,await prisma.lab.create({data:req.body}),201);
});
