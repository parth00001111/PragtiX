import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { projectAccess, projectVisibilityWhere, projectInclude, teamAccess, isStaff } from "../services/accessService.js";
import { transaction, audit, notify } from "../utils/transaction.js";
import { pageArgs } from "../validations/common.js";

export const createProject=endpoint(async(req,res)=>{
  const project=await transaction(async db=>{
    const {title,description,assignmentId,teamId,budgetAllocated}=req.body;
    ensure(!budgetAllocated,400,"Record budget allocations through the funding endpoint");
    const assignment=await db.assignment.findUnique({where:{id:assignmentId},include:{problem:true}});
    ensure(assignment&&!assignment.problem.deletedAt,404,"Assignment not found");
    ensure(assignment.problem.status==="ASSIGNED",409,"Problem must be assigned before creating a project");
    const team=await teamAccess(req.user,teamId,"manage",db);
    ensure(team.universityId===assignment.universityId,400,"Team and assignment must belong to the same university");
    ensure(team.members.some(m=>m.role==="FACULTY_MENTOR")&&team.members.some(m=>m.role==="STUDENT_LEAD"),409,"Assign a faculty mentor and student lead before creating the project");
    const result=await db.project.create({data:{title,description,assignmentId,teamId,budgetAllocated:0}});
    await audit(db,req.user.id,assignment.problemId,"CREATED","Project created: "+title);
    await notify(db,[assignment.problem.submittedById],"Project proposed for your challenge: "+title);return result;
  });ok(res,project,201);
});
export const getAllProjects=endpoint(async(req,res)=>{
  const q=req.validatedQuery;
  ok(res,await prisma.project.findMany({where:{...projectVisibilityWhere(req.user),...(q.status&&{status:q.status})},select:{id:true,title:true,description:true,status:true,createdAt:true,updatedAt:true,assignmentId:true,teamId:true,patentFiled:true,startupCreated:true},...pageArgs(q),orderBy:{createdAt:"desc"}}));
});
export const getProjectById=endpoint(async(req,res)=>{
  const project=await projectAccess(req.user,req.params.id);
  const {partnerships,team,assignment,...fields}=project;
  const {budgetAllocated,budgetSpent,...publicFields}=fields;
  ok(res,{...publicFields,problem:{id:assignment.problem.id,title:assignment.problem.title,status:assignment.problem.status},university:{id:assignment.university.id,name:assignment.university.universityName},team:{id:team.id,name:team.name},partners:partnerships.map(p=>({id:p.id,role:p.role,industry:{id:p.industry.id,orgName:p.industry.orgName}}))});
});
export const updateProject=endpoint(async(req,res)=>{
  const updated=await transaction(async db=>{
    const project=await projectAccess(req.user,req.params.id,"manage",db);
    const status=req.body.status;
    ensure(!["DROPPED","IMPACT_MEASURED"].includes(project.status),409,"This project is closed");
    if(status&&status!==project.status){
      ensure(!["APPROVED","IMPACT_MEASURED"].includes(status),409,"Use proposal review or impact recording for this status");
      const allowed={PROPOSED:["DROPPED"],APPROVED:["PROTOTYPE","DROPPED"],PROTOTYPE:["PILOT_TESTING","DROPPED"],PILOT_TESTING:["DEPLOYED","DROPPED"],DEPLOYED:[]};
      ensure(allowed[project.status]?.includes(status),409,"Invalid project status transition");
      if(["DEPLOYED","DROPPED"].includes(status))ensure(isStaff(req.user),403,"Only officials/admins can authorize deployment or closure");
      if(status==="DEPLOYED"){
        const milestones=await db.milestone.findMany({where:{projectId:project.id}});
        ensure(milestones.length>0&&milestones.every(m=>m.status==="COMPLETED"),409,"Complete the project milestones before deployment");
      }
    }
    const result=await db.project.update({where:{id:project.id},data:req.body});
    if(status==="PROTOTYPE")await db.problem.update({where:{id:project.assignment.problemId},data:{status:"IN_PROGRESS"}});
    await audit(db,req.user.id,project.assignment.problemId,"UPDATED","Project updated: "+project.title+(status?" ("+status+")":""));
    await notify(db,[project.assignment.problem.submittedById,project.assignment.university.userId],"Project updated: "+project.title);return result;
  });ok(res,updated);
});
