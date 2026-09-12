import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { projectAccess } from "../services/accessService.js";
import { transaction, audit } from "../utils/transaction.js";
export const createMilestone=endpoint(async(req,res)=>{
  const milestone=await transaction(async db=>{
    const project=await projectAccess(req.user,req.body.projectId,"manage",db);
    ensure(!["DROPPED","DEPLOYED","IMPACT_MEASURED"].includes(project.status),409,"Project milestones are closed");
    const result=await db.milestone.create({data:req.body});
    await audit(db,req.user.id,project.assignment.problemId,"CREATED","Milestone created: "+result.title);return result;
  });ok(res,milestone,201);
});
export const getMilestonesByProject=endpoint(async(req,res)=>{
  await projectAccess(req.user,req.params.projectId);
  ok(res,await prisma.milestone.findMany({where:{projectId:req.params.projectId},orderBy:{dueDate:"asc"},take:100}));
});
export const updateMilestone=endpoint(async(req,res)=>{
  const milestone=await transaction(async db=>{
    const row=await db.milestone.findUnique({where:{id:req.params.id}});
    ensure(row,404,"Milestone not found");
    const project=await projectAccess(req.user,row.projectId,"contribute",db);
    ensure(!["DROPPED","DEPLOYED","IMPACT_MEASURED"].includes(project.status),409,"Project milestones are closed");
    const result=await db.milestone.update({where:{id:row.id},data:req.body});
    await audit(db,req.user.id,project.assignment.problemId,"UPDATED","Milestone updated: "+row.title);return result;
  });ok(res,milestone);
});
