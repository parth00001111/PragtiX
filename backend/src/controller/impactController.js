import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { projectAccess } from "../services/accessService.js";
import { transaction, audit, notify } from "../utils/transaction.js";
export const createImpactRecord=endpoint(async(req,res)=>{
  const impact=await transaction(async db=>{
    const project=await projectAccess(req.user,req.body.projectId,"manage",db);
    ensure(project.status==="DEPLOYED",409,"Impact can only be recorded after deployment");
    const result=await db.impactRecord.create({data:req.body});
    await db.project.update({where:{id:project.id},data:{status:"IMPACT_MEASURED"}});
    await db.problem.update({where:{id:project.assignment.problemId},data:{status:"RESOLVED"}});
    await audit(db,req.user.id,project.assignment.problemId,"UPDATED","Impact recorded and challenge resolved");
    await notify(db,[project.assignment.problem.submittedById,project.assignment.university.userId],"Impact recorded for "+project.title);return result;
  });ok(res,impact,201);
});
export const getImpactByProject=endpoint(async(req,res)=>{
  await projectAccess(req.user,req.params.projectId);
  const impact=await prisma.impactRecord.findUnique({where:{projectId:req.params.projectId}});
  ensure(impact,404,"No impact record found");ok(res,impact);
});
export const getOverallImpactStats=endpoint(async(req,res)=>{
  ok(res,await prisma.impactRecord.aggregate({where:{project:{assignment:{problem:{deletedAt:null}}}},_sum:{citizensBenefited:true,villagesCovered:true,costSaved:true,jobsCreated:true},_count:true}));
});
