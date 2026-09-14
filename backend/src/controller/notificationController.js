import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { pageArgs } from "../validations/common.js";
export const getMyNotifications=endpoint(async(req,res)=>ok(res,await prisma.notification.findMany({where:{userId:req.user.id,...(req.validatedQuery.unread===true&&{isRead:false})},...pageArgs(req.validatedQuery),orderBy:{createdAt:"desc"}})));
export const markNotificationAsRead=endpoint(async(req,res)=>{
  const result=await prisma.notification.updateMany({where:{id:req.params.id,userId:req.user.id},data:{isRead:true}});
  ensure(result.count,404,"Notification not found");ok(res,null,200,"Notification marked as read");
});
export const markAllAsRead=endpoint(async(req,res)=>{
  const result=await prisma.notification.updateMany({where:{userId:req.user.id,isRead:false},data:{isRead:true}});
  ok(res,result);
});
