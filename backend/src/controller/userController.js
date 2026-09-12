import prisma from "../../PrismaClient.js";
import bcrypt from "bcrypt";
import { endpoint, ensure, ok } from "../utils/http.js";
import { transaction, audit } from "../utils/transaction.js";
import { pageArgs } from "../validations/common.js";
const safe={id:true,name:true,email:true,phone:true,role:true,isActive:true,deletedAt:true,districtId:true,departmentId:true,createdAt:true};
export const listUsers=endpoint(async(req,res)=>{
  const q=req.validatedQuery;
  ok(res,await prisma.user.findMany({where:{...(q.role&&{role:q.role}),...(q.search&&{OR:[{name:{contains:q.search,mode:"insensitive"}},{email:{contains:q.search,mode:"insensitive"}}]})},select:safe,...pageArgs(q),orderBy:{createdAt:"desc"}}));
});
export const updateUser=endpoint(async(req,res)=>{
  const result=await transaction(async db=>{
    const user=await db.user.findUnique({where:{id:req.params.id}});
    ensure(user&&!user.deletedAt,404,"User not found");
    ensure(!(user.id===req.user.id&&(req.body.isActive===false||(req.body.role&&req.body.role!=="SUPER_ADMIN"))),409,"You cannot disable or demote your own administrator account");
    const result=await db.user.update({where:{id:user.id},data:req.body,select:safe});
    if(req.body.role||req.body.isActive===false)await db.session.deleteMany({where:{userId:user.id}});
    await audit(db,req.user.id,null,"UPDATED","Account permissions updated for "+user.id);return result;
  });ok(res,result);
});
export const updateMe=endpoint(async(req,res)=>ok(res,await prisma.user.update({where:{id:req.user.id},data:req.body,select:safe})));
export const changePassword=endpoint(async(req,res)=>{
  const password=await bcrypt.hash(req.body.newPassword,10);
  await transaction(async db=>{
    const user=await db.user.findUnique({where:{id:req.user.id}});
    ensure(await bcrypt.compare(req.body.currentPassword,user.password),400,"Current password is incorrect");
    await db.user.update({where:{id:user.id},data:{password}});
    await db.session.deleteMany({where:{userId:user.id}});
  });ok(res,null,200,"Password changed; sign in again");
});
