import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { teamAccess, universityAccess, isStaff, publicUser } from "../services/accessService.js";
import { transaction, notify } from "../utils/transaction.js";
import { pageArgs } from "../validations/common.js";

export const createTeam=endpoint(async(req,res)=>{
  const {name,universityId}=req.body;
  const university=universityId?await universityAccess(req.user,universityId):await prisma.universityProfile.findUnique({where:{userId:req.user.id}});
  ensure(university,404,"Create a university profile first");
  ok(res,await prisma.team.create({data:{name,universityId:university.id}}),201);
});
export const getAllTeams=endpoint(async(req,res)=>{
  const q=req.validatedQuery;
  ok(res,await prisma.team.findMany({where:{...(q.universityId && {universityId:q.universityId}),...(!isStaff(req.user)&&{OR:[...(req.user.role==="FACULTY"?[{university:{userId:req.user.id}}]:[]),{members:{some:{userId:req.user.id,role:req.user.role==="FACULTY"?"FACULTY_MENTOR":{in:req.user.role==="STUDENT"?["STUDENT_LEAD","STUDENT_MEMBER"]:[]}}}}]})},...pageArgs(q),orderBy:{createdAt:"desc"}}));
});
export const addTeamMember=endpoint(async(req,res)=>{
  const member=await transaction(async db=>{
    const team=await teamAccess(req.user,req.params.teamId,"manage",db);
    const {userId,role}=req.body;
    const user=await db.user.findUnique({where:{id:userId},include:{facultyProfile:{include:{department:true}}}});
    ensure(user&&user.isActive&&!user.deletedAt,400,"Select an active user");
    if(role==="FACULTY_MENTOR"){
      ensure(user.role==="FACULTY",400,"A faculty mentor must have the FACULTY account role");
      ensure(team.university.userId===user.id||user.facultyProfile?.department.universityId===team.universityId,400,"Faculty mentor must belong to this university");
    } else ensure(user.role==="STUDENT",400,"A student member must have the STUDENT account role");
    if(role==="STUDENT_LEAD")ensure(!team.members.some(m=>m.role==="STUDENT_LEAD"),409,"This team already has a student lead");
    const result=await db.teamMember.create({data:{teamId:team.id,userId,role}});
    await notify(db,[userId],"You were added to team "+team.name); return result;
  });ok(res,member,201);
});
export const removeTeamMember=endpoint(async(req,res)=>{
  await transaction(async db=>{
    await teamAccess(req.user,req.params.teamId,"manage",db);
    await db.teamMember.delete({where:{teamId_userId:{teamId:req.params.teamId,userId:req.params.userId}}});
    await notify(db,[req.params.userId],"Your team membership was removed");
  });ok(res,null,200,"Team member removed");
});
export const getTeamById=endpoint(async(req,res)=>{
  await teamAccess(req.user,req.params.id);
  ok(res,await prisma.team.findUnique({where:{id:req.params.id},include:{members:{include:{user:{select:publicUser}}},project:{select:{id:true,title:true,status:true}}}}));
});
