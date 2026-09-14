import prisma from "../../PrismaClient.js";
import { getAttachmentType } from "../middleware/uploadMiddleware.js";
import { problemVisibilityWhere, canAccessProblem, STAFF_ROLES, MODERATION_FIELDS } from "../config/rbac.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { transaction, audit, notify } from "../utils/transaction.js";
import { cleanupUploads, pageArgs } from "../validations/common.js";
import { validateLocation, canReadProblem } from "../services/problemService.js";
const include={submittedBy:{select:{id:true,name:true}},attachments:true,_count:{select:{upvotes:true,comments:true}}};
const current=async(db,id)=>{const p=await db.problem.findUnique({where:{id}});ensure(p&&!p.deletedAt,404,"Problem not found");return p;};
const editable=(user,p)=>{ensure(canAccessProblem(user,p,"update"),403,"You cannot edit this problem");ensure(STAFF_ROLES.includes(user.role)||p.status==="SUBMITTED",409,"A reviewed problem can only be edited by staff");};
export const createProblem=endpoint(async(req,res)=>{
 let result;
 try{
  result=await transaction(async db=>{
   const location=await validateLocation(req.body,db);
   const problem=await db.problem.create({data:{...req.body,...location,domain:req.body.domain||"OTHER",isPublic:req.body.isPublic??true,submittedById:req.user.id}});
   if(req.files?.length)await db.attachment.createMany({data:req.files.map(f=>({url:"/uploads/problems/"+f.filename,type:getAttachmentType(f.mimetype),problemId:problem.id}))});
   await audit(db,req.user.id,problem.id,"CREATED","Problem submitted");
   return db.problem.findUnique({where:{id:problem.id},include});
  });
 }catch(error){await cleanupUploads(req.files);throw error;}
 ok(res,result,201,"Problem submitted successfully");
});
export const getAllProblems=endpoint(async(req,res)=>{
 const q=req.validatedQuery;
 const where={AND:[problemVisibilityWhere(req.user)],...(q.domain&&{domain:q.domain}),...(q.status&&{status:q.status}),...(q.blockId&&{blockId:q.blockId}),...(q.districtId&&{districtId:q.districtId}),...(q.search&&{OR:[{title:{contains:q.search,mode:"insensitive"}},{description:{contains:q.search,mode:"insensitive"}}]})};
 const [data,total]=await Promise.all([prisma.problem.findMany({where,include,...pageArgs(q),orderBy:{createdAt:"desc"}}),prisma.problem.count({where})]);
 res.json({success:true,data,pagination:{total,page:q.page,limit:q.limit,totalPages:Math.ceil(total/q.limit)}});
});
export const getProblemById=endpoint(async(req,res)=>{
 const p=await prisma.problem.findUnique({where:{id:req.params.id},include:{...include,verifiedBy:{select:{id:true,name:true}},comments:{take:100,include:{author:{select:{id:true,name:true}}},orderBy:{createdAt:"desc"}},tags:{include:{tag:true}}}});
 ensure(await canReadProblem(req.user,p),404,"Problem not found");
 await prisma.problem.update({where:{id:p.id},data:{viewCount:{increment:1}}});ok(res,p);
});
export const updateProblem=endpoint(async(req,res)=>{
 const result=await transaction(async db=>{
  const p=await current(db,req.params.id);editable(req.user,p);
  const data={...req.body};
  if(!STAFF_ROLES.includes(req.user.role))ensure(!MODERATION_FIELDS.some(k=>Object.hasOwn(data,k)),403,"Only staff can change status or scores");
  Object.assign(data,await validateLocation({...p,...data},db));
  if(data.status&&data.status!==p.status){
   const transitions={SUBMITTED:["REJECTED","ESCALATED"],VERIFIED:["PRIORITIZED","REJECTED","ESCALATED"],PRIORITIZED:["REJECTED","ESCALATED"],ASSIGNED:["ESCALATED"],IN_PROGRESS:["ESCALATED"],ESCALATED:["REJECTED"]};
   ensure(transitions[p.status]?.includes(data.status),409,"Use verification, assignment and project lifecycle routes for this status transition");
   if(data.status==="REJECTED")ensure(!await db.assignment.findFirst({where:{problemId:p.id}}),409,"An assigned problem cannot be rejected");
   if(data.status==="ESCALATED"){data.isEscalated=true;data.escalatedAt=new Date();}
  }
  const scores=["severityScore","urgencyScore","geographicImpactScore","feasibilityScore","communitySupportScore"];
  if(scores.some(k=>Object.hasOwn(data,k)))data.priorityScore=Number((scores.reduce((sum,k)=>sum+(data[k]??p[k]??0),0)*2).toFixed(2));
  const updated=await db.problem.update({where:{id:p.id},data});
  await audit(db,req.user.id,p.id,data.status&&data.status!==p.status?"STATUS_CHANGED":"UPDATED",data.status?"Problem status: "+data.status:"Problem details updated");
  if(data.status)await notify(db,[p.submittedById],"Problem status changed to "+data.status);
  return updated;
 });ok(res,result);
});
export const verifyProblem=endpoint(async(req,res)=>{
 const result=await transaction(async db=>{
  const p=await current(db,req.params.id);
  ensure(["SUBMITTED","ESCALATED"].includes(p.status),409,"Only submitted or escalated challenges can be verified");
  ensure(!await db.assignment.findFirst({where:{problemId:p.id}}),409,"An assigned challenge cannot be verified again");
  const {isDuplicateOf,duplicateNote}=req.body;
  if(isDuplicateOf){ensure(isDuplicateOf!==p.id,400,"A problem cannot duplicate itself");const target=await current(db,isDuplicateOf);ensure(!target.isDuplicateOf,400,"Choose the original problem, not another duplicate");}
  const updated=await db.problem.update({where:{id:p.id},data:{status:isDuplicateOf?"REJECTED":"VERIFIED",verifiedById:req.user.id,verifiedAt:new Date(),isDuplicateOf:isDuplicateOf||null,duplicateNote:duplicateNote||null,isEscalated:false}});
  await audit(db,req.user.id,p.id,"VERIFIED",isDuplicateOf?"Duplicate of "+isDuplicateOf:"Problem verified");
  await notify(db,[p.submittedById],"Your problem was "+(isDuplicateOf?"marked as a duplicate":"verified"));return updated;
 });ok(res,result);
});
export const deleteProblem=endpoint(async(req,res)=>{
 await transaction(async db=>{
  const p=await current(db,req.params.id);
  ensure(canAccessProblem(req.user,p,"delete"),403,"You cannot delete this problem");
  ensure(["DEPT_ADMIN","SUPER_ADMIN"].includes(req.user.role)||p.status==="SUBMITTED",409,"Only admins can delete reviewed problems");
  ensure(!await db.assignment.findFirst({where:{problemId:p.id}}),409,"Assigned problems must retain their project history");
  await db.problem.update({where:{id:p.id},data:{deletedAt:new Date()}});
  await audit(db,req.user.id,p.id,"DELETED","Problem soft-deleted");
 });ok(res,null,200,"Problem deleted successfully");
});
export const upvoteProblem=endpoint(async(req,res)=>{
 const result=await transaction(async db=>{
  const p=await current(db,req.params.id);ensure(await canReadProblem(req.user,p,db),404,"Problem not found");
  const where={problemId_userId:{problemId:p.id,userId:req.user.id}};
  const existing=await db.problemUpvote.findUnique({where});
  if(existing){await db.problemUpvote.delete({where:{id:existing.id}});return {upvoted:false};}
  await db.problemUpvote.create({data:{problemId:p.id,userId:req.user.id}});return {upvoted:true};
 });ok(res,result);
});
export const addComment=endpoint(async(req,res)=>{
 const result=await transaction(async db=>{
  const p=await current(db,req.params.id);ensure(await canReadProblem(req.user,p,db),404,"Problem not found");
  const comment=await db.comment.create({data:{content:req.body.content,authorId:req.user.id,problemId:p.id},include:{author:{select:{id:true,name:true}}}});
  if(p.submittedById!==req.user.id)await notify(db,[p.submittedById],"A comment was added to your problem");return comment;
 });ok(res,result,201);
});
export const addFeedback=endpoint(async(req,res)=>{
 const result=await transaction(async db=>{
  const p=await current(db,req.params.id);ensure(await canReadProblem(req.user,p,db),404,"Problem not found");
  ensure(p.status==="RESOLVED",409,"Feedback is available after a problem is resolved");
  const existing=await db.feedback.findFirst({where:{problemId:p.id,userId:req.user.id}});
  return existing?db.feedback.update({where:{id:existing.id},data:req.body}):db.feedback.create({data:{...req.body,problemId:p.id,userId:req.user.id}});
 });ok(res,result,201);
});
export const getProblemHistory=endpoint(async(req,res)=>ok(res,await prisma.auditLog.findMany({where:{problemId:req.params.id},...pageArgs(req.validatedQuery),select:{id:true,action:true,createdAt:true,performedBy:{select:{id:true,name:true}}},orderBy:{createdAt:"desc"}})));
export const getDuplicateSuggestions=endpoint(async(req,res)=>{
 const p=req.problem;
 const tokens=text=>new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]);
 const source=tokens(p.title+" "+p.description);
 const candidates=await prisma.problem.findMany({where:{deletedAt:null,id:{not:p.id},isDuplicateOf:null,domain:p.domain,...(p.districtId&&{districtId:p.districtId})},select:{id:true,title:true,description:true,domain:true},take:200,orderBy:{createdAt:"desc"}});
 const suggestions=candidates.map(row=>{const words=tokens(row.title+" "+row.description);const common=[...source].filter(word=>words.has(word)).length;return {id:row.id,title:row.title,similarity:Number((common/(new Set([...source,...words]).size||1)).toFixed(3))};}).filter(row=>row.similarity>=0.2).sort((a,b)=>b.similarity-a.similarity).slice(0,10);
 ok(res,{method:"word-overlap",requiresHumanReview:true,candidateLimit:200,suggestions});
});
