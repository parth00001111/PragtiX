import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { isStaff, universityAccess, activeUser } from "../services/accessService.js";
import { transaction, audit, notify } from "../utils/transaction.js";
import { pageArgs } from "../validations/common.js";

export const suggestUniversitiesForProblem=endpoint(async(req,res)=>{
  const problem=await prisma.problem.findUnique({where:{id:req.params.problemId}});
  ensure(problem&&!problem.deletedAt,404,"Problem not found");
  const universities=await prisma.universityProfile.findMany({where:{user:activeUser,departments:{some:{domainExpertise:{has:problem.domain}}}},include:{departments:{where:{domainExpertise:{has:problem.domain}},include:{labs:true,faculty:true}}},orderBy:{universityName:"asc"},take:50});
  ok(res,universities.map(u=>({universityId:u.id,universityName:u.universityName,matchingDepartments:u.departments.map(d=>d.name),matchScore:Math.min(100,60+(u.hasIncubationCenter?15:0)+(u.departments.some(d=>d.labs.length)?15:0)+(u.departments.some(d=>d.faculty.length)?10:0)),method:"domain-capability-rules"})).sort((a,b)=>b.matchScore-a.matchScore));
});
export const createAssignment=endpoint(async(req,res)=>{
  const assignment=await transaction(async db=>{
    const {problemId,universityId,matchScore}=req.body;
    const problem=await db.problem.findUnique({where:{id:problemId}});
    ensure(problem&&!problem.deletedAt,404,"Problem not found");
    ensure(["VERIFIED","PRIORITIZED","ASSIGNED"].includes(problem.status)&&!problem.isDuplicateOf,409,"Only verified, nonduplicate problems can be assigned");
    const university=await db.universityProfile.findFirst({where:{id:universityId,user:activeUser}});
    ensure(university,404,"Active university not found");
    ensure(!await db.assignment.findFirst({where:{problemId,universityId}}),409,"Problem is already assigned to this university");
    const result=await db.assignment.create({data:{problemId,universityId,matchScore}});
    await db.problem.update({where:{id:problemId},data:{status:"ASSIGNED"}});
    await audit(db,req.user.id,problemId,"ASSIGNED","Assigned to "+university.universityName);
    await notify(db,[university.userId,problem.submittedById],"Problem assigned: "+problem.title);return result;
  });ok(res,assignment,201);
});
export const getAssignmentsForUniversity=endpoint(async(req,res)=>{
  if(!isStaff(req.user))await universityAccess(req.user,req.params.universityId);
  ok(res,await prisma.assignment.findMany({where:{universityId:req.params.universityId,problem:{deletedAt:null}},include:{problem:true,project:{select:{id:true,title:true,status:true}}},...pageArgs(req.validatedQuery),orderBy:{assignedAt:"desc"}}));
});
export const getAssignmentById=endpoint(async(req,res)=>{
  const assignment=await prisma.assignment.findUnique({where:{id:req.params.id},include:{problem:true,university:true,project:{select:{id:true,title:true,status:true}}}});
  ensure(assignment&&!assignment.problem.deletedAt,404,"Assignment not found");
  ensure(isStaff(req.user)||(req.user.role==="FACULTY"&&assignment.university.userId===req.user.id)||assignment.problem.submittedById===req.user.id,403,"You cannot access this assignment");
  ok(res,assignment);
});
