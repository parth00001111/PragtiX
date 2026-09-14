import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { projectAccess } from "../services/accessService.js";
import { transaction, audit, notify } from "../utils/transaction.js";
export const createProposal=endpoint(async(req,res)=>{
  const proposal=await transaction(async db=>{
    const project=await projectAccess(req.user,req.body.projectId,"contribute",db);
    ensure(project.status==="PROPOSED",409,"Proposals can be prepared while the project is proposed");
    const latest=await db.proposal.findFirst({where:{projectId:project.id},orderBy:{version:"desc"}});
    ensure(!latest||["REJECTED","REVISION_REQUESTED"].includes(latest.status),409,"Complete the existing proposal before creating a revision");
    return db.proposal.create({data:{...req.body,version:(latest?.version||0)+1,status:"DRAFT"}});
  });ok(res,proposal,201);
});
export const updateProposal=endpoint(async(req,res)=>{
  const proposal=await transaction(async db=>{
    const row=await db.proposal.findUnique({where:{id:req.params.id}});
    ensure(row,404,"Proposal not found");const project=await projectAccess(req.user,row.projectId,"contribute",db);
    const latest=await db.proposal.findFirst({where:{projectId:row.projectId},orderBy:{version:"desc"}});
    ensure(project.status==="PROPOSED"&&latest.id===row.id,409,"Edit the latest proposal on an open project");
    ensure(["DRAFT","REVISION_REQUESTED"].includes(row.status),409,"Only drafts or requested revisions can be edited");
    return db.proposal.update({where:{id:row.id},data:{content:req.body.content}});
  });ok(res,proposal);
});
export const submitProposal=endpoint(async(req,res)=>{
  const proposal=await transaction(async db=>{
    const row=await db.proposal.findUnique({where:{id:req.params.id}});
    ensure(row,404,"Proposal not found");
    const project=await projectAccess(req.user,row.projectId,"contribute",db);
    ensure(project.status==="PROPOSED"&&["DRAFT","REVISION_REQUESTED"].includes(row.status),409,"Proposal cannot be submitted in its current state");
    const latest=await db.proposal.findFirst({where:{projectId:row.projectId},orderBy:{version:"desc"}});
    ensure(latest.id===row.id,409,"Submit the latest proposal version");
    const result=await db.proposal.update({where:{id:row.id},data:{status:"SUBMITTED",submittedAt:new Date(),reviewedAt:null,reviewNote:null}});
    await audit(db,req.user.id,project.assignment.problemId,"UPDATED","Proposal submitted for review");
    const reviewers=await db.user.findMany({where:{role:{in:["OFFICIAL","DEPT_ADMIN","SUPER_ADMIN"]},isActive:true,deletedAt:null},select:{id:true}});
    await notify(db,reviewers.map(u=>u.id),"Proposal submitted: "+project.title);return result;
  });ok(res,proposal);
});
export const reviewProposal=endpoint(async(req,res)=>{
  const proposal=await transaction(async db=>{
    const row=await db.proposal.findUnique({where:{id:req.params.id}});
    ensure(row,404,"Proposal not found");
    const project=await projectAccess(req.user,row.projectId,"manage",db);
    ensure(project.assignment.university.userId!==req.user.id&&!project.team.members.some(m=>m.userId===req.user.id),403,"A proposal reviewer must be independent of its team");
    ensure(project.status==="PROPOSED"&&["SUBMITTED","UNDER_REVIEW"].includes(row.status),409,"Only a submitted proposal can be reviewed");
    const latest=await db.proposal.findFirst({where:{projectId:row.projectId},orderBy:{version:"desc"}});
    ensure(latest.id===row.id,409,"Review the latest proposal version");
    const result=await db.proposal.update({where:{id:row.id},data:{...req.body,reviewedAt:new Date()}});
    if(req.body.status==="APPROVED")await db.project.update({where:{id:row.projectId},data:{status:"APPROVED"}});
    await audit(db,req.user.id,project.assignment.problemId,req.body.status==="APPROVED"?"APPROVED":req.body.status==="REJECTED"?"REJECTED":"UPDATED","Proposal review: "+req.body.status);
    await notify(db,[project.assignment.university.userId,...project.team.members.map(m=>m.userId)],"Proposal "+req.body.status+": "+project.title);return result;
  });ok(res,proposal);
});
export const getProposalsByProject=endpoint(async(req,res)=>{
  await projectAccess(req.user,req.params.projectId,"collaborate");
  ok(res,await prisma.proposal.findMany({where:{projectId:req.params.projectId},orderBy:{version:"desc"},take:100}));
});
