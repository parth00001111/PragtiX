import prisma from "../../PrismaClient.js";
import { endpoint, ok } from "../utils/http.js";
export const getDashboard=endpoint(async(req,res)=>{
  const q=req.validatedQuery;
  const where={deletedAt:null,...(q.districtId&&{districtId:q.districtId}),...(q.domain&&{domain:q.domain})};
  const projectWhere={assignment:{problem:where}};
  const [challenges,domains,statuses,districts,universities,industries,projects,projectStatuses,partnerships,impact,innovations]=await Promise.all([
    prisma.problem.count({where}),
    prisma.problem.groupBy({by:["domain"],where,_count:{_all:true}}),
    prisma.problem.groupBy({by:["status"],where,_count:{_all:true}}),
    prisma.problem.groupBy({by:["districtId"],where,_count:{_all:true}}),
    prisma.universityProfile.count({where:{user:{isActive:true,deletedAt:null}}}),
    prisma.industryProfile.count({where:{user:{isActive:true,deletedAt:null}}}),
    prisma.project.count({where:projectWhere}),
    prisma.project.groupBy({by:["status"],where:projectWhere,_count:{_all:true}}),
    prisma.partnership.count({where:{project:projectWhere}}),
    prisma.impactRecord.aggregate({where:{project:projectWhere},_sum:{citizensBenefited:true,villagesCovered:true,costSaved:true,jobsCreated:true},_count:true}),
    Promise.all([prisma.project.count({where:{...projectWhere,patentFiled:true}}),prisma.project.count({where:{...projectWhere,startupCreated:true}})]),
  ]);
  ok(res,{challenges,domains,statuses,districts,registeredUniversities:universities,registeredIndustries:industries,projects,projectStatuses,partnerships,impact,patentsFiled:innovations[0],startupsCreated:innovations[1],generatedAt:new Date(),note:"Impact totals are sums of project reports and can include overlapping beneficiaries; institution counts are platform-wide."});
});
