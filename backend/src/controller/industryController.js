import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { activeUser, isAdmin } from "../services/accessService.js";
import { pageArgs } from "../validations/common.js";
const directory={id:true,orgName:true,type:true,sector:true,avgRating:true};
export const createIndustryProfile=endpoint(async(req,res)=>ok(res,await prisma.industryProfile.create({data:{...req.body,userId:req.user.id}}),201));
export const getMyIndustry=endpoint(async(req,res)=>{
  const profile=await prisma.industryProfile.findUnique({where:{userId:req.user.id}});
  ensure(profile,404,"Industry profile not found");ok(res,profile);
});
export const getAllIndustries=endpoint(async(req,res)=>ok(res,await prisma.industryProfile.findMany({where:{user:activeUser},select:directory,...pageArgs(req.validatedQuery),orderBy:{orgName:"asc"}})));
export const getIndustryById=endpoint(async(req,res)=>{
  const profile=await prisma.industryProfile.findFirst({where:{id:req.params.id,user:activeUser},select:directory});
  ensure(profile,404,"Industry not found");ok(res,profile);
});
export const updateIndustry=endpoint(async(req,res)=>{
  const profile=await prisma.industryProfile.findUnique({where:{id:req.params.id}});
  ensure(profile,404,"Industry not found");ensure(isAdmin(req.user)||profile.userId===req.user.id,403,"You cannot edit this industry profile");
  ok(res,await prisma.industryProfile.update({where:{id:profile.id},data:req.body}));
});
