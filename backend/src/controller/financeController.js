import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { projectAccess, isAdmin, activeUser } from "../services/accessService.js";
import { transaction, audit, notify } from "../utils/transaction.js";
const openProject=p=>ensure(!["DROPPED","IMPACT_MEASURED"].includes(p.status),409,"Project is closed");
export const createPartnership=endpoint(async(req,res)=>{
  const partnership=await transaction(async db=>{
    const project=await projectAccess(req.user,req.body.projectId,"manage",db);openProject(project);
    const industry=await db.industryProfile.findFirst({where:{id:req.body.industryId,user:activeUser}});
    ensure(industry,404,"Active industry profile not found");
    ensure(!await db.partnership.findFirst({where:req.body}),409,"This partnership already exists");
    const result=await db.partnership.create({data:req.body});
    await audit(db,req.user.id,project.assignment.problemId,"UPDATED","Industry partnership added: "+industry.orgName);
    await notify(db,[industry.userId],"You were added as "+req.body.role+" to "+project.title);return result;
  });ok(res,partnership,201);
});
export const createFunding=endpoint(async(req,res)=>{
  const funding=await transaction(async db=>{
    const {projectId,amount,industryId,source}=req.body;
    const project=await projectAccess(req.user,projectId,req.user.role==="INDUSTRY"?"collaborate":"finance",db);openProject(project);
    if(industryId){
      const industry=await db.industryProfile.findFirst({where:{id:industryId,user:activeUser}});
      ensure(industry,404,"Active industry profile not found");
      ensure(isAdmin(req.user)||(req.user.role==="INDUSTRY"&&industry.userId===req.user.id),403,"You cannot record another industry's funding");
      ensure(project.partnerships.some(p=>p.industryId===industryId),409,"Add an approved project partnership before funding");
    } else if(source==="GOVERNMENT_GRANT")ensure(isAdmin(req.user),403,"Only admins can record government grants");
    else ensure(source==="UNIVERSITY_INTERNAL"&&req.user.role!=="INDUSTRY",403,"Invalid funding source for this role");
    const result=await db.funding.create({data:req.body});
    await db.project.update({where:{id:projectId},data:{budgetAllocated:Math.round(((project.budgetAllocated||0)+amount)*100)/100}});
    await audit(db,req.user.id,project.assignment.problemId,"UPDATED","Funding recorded: "+amount+" ("+source+")");
    await notify(db,[project.assignment.university.userId],"Funding recorded for "+project.title);return result;
  });ok(res,funding,201);
});
export const createExpense=endpoint(async(req,res)=>{
  const expense=await transaction(async db=>{
    const project=await projectAccess(req.user,req.body.projectId,"finance",db);openProject(project);
    ensure(["APPROVED","PROTOTYPE","PILOT_TESTING","DEPLOYED"].includes(project.status),409,"Project approval is required before expenses");
    const spent=Math.round((project.budgetSpent+req.body.amount)*100)/100;
    ensure(spent<=Math.round((project.budgetAllocated||0)*100)/100,409,"Expense exceeds the remaining allocated budget");
    const result=await db.expense.create({data:req.body});
    await db.project.update({where:{id:project.id},data:{budgetSpent:spent}});
    await audit(db,req.user.id,project.assignment.problemId,"UPDATED","Expense recorded: "+req.body.amount);return result;
  });ok(res,expense,201);
});
export const getProjectFinanceSummary=endpoint(async(req,res)=>{
  const project=await projectAccess(req.user,req.params.projectId,"finance");
  const [fundings,expenses]=await Promise.all([prisma.funding.findMany({where:{projectId:project.id},orderBy:{grantedAt:"desc"},take:100}),prisma.expense.findMany({where:{projectId:project.id},orderBy:{spentAt:"desc"},take:100})]);
  ok(res,{budgetAllocated:project.budgetAllocated||0,budgetSpent:project.budgetSpent,remaining:Math.round(((project.budgetAllocated||0)-project.budgetSpent)*100)/100,fundings,expenses});
});
