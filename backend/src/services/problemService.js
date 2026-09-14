import prisma from "../../PrismaClient.js";
import { canAccessProblem, problemVisibilityWhere } from "../config/rbac.js";
import { ensure } from "../utils/http.js";
export const canReadProblem=async(user,problem,db=prisma)=>{
 if(!problem||problem.deletedAt)return false;
 if(canAccessProblem(user,problem))return true;
 return !!await db.problem.findFirst({where:{id:problem.id,...problemVisibilityWhere(user)},select:{id:true}});
};
export const validateLocation=async(data,db=prisma)=>{
 const location={};
 let blockId=data.blockId;
 if(data.panchayatId){
  const p=await db.panchayat.findUnique({where:{id:data.panchayatId}});
  ensure(p,400,"Panchayat not found");
  ensure(!blockId||p.blockId===blockId,400,"Panchayat does not belong to selected block");
  blockId=p.blockId;location.blockId=blockId;
 }
 let districtId=data.districtId;
 if(blockId){
  const b=await db.block.findUnique({where:{id:blockId}});
  ensure(b,400,"Block not found");
  ensure(!districtId||b.districtId===districtId,400,"Block does not belong to selected district");
  districtId=b.districtId;location.districtId=districtId;
 }
 if(districtId)ensure(await db.district.findUnique({where:{id:districtId}}),400,"District not found");
 return location;
};
