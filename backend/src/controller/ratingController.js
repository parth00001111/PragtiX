import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { isStaff, activeUser, projectVisibilityWhere } from "../services/accessService.js";
import { transaction } from "../utils/transaction.js";
import { pageArgs } from "../validations/common.js";
export const createRating=endpoint(async(req,res)=>{
  const rating=await transaction(async db=>{
    const {universityId,industryId,score,remark}=req.body;
    const model=universityId?"universityProfile":"industryProfile";
    const field=universityId?"universityId":"industryId";
    const id=universityId||industryId;
    const target=await db[model].findFirst({where:{id,user:activeUser}});
    ensure(target,404,"Rating target not found");ensure(target.userId!==req.user.id,403,"You cannot rate your own organization");
    if(universityId){
      const faculty=await db.facultyProfile.findUnique({where:{userId:req.user.id},include:{department:true}});
      ensure(faculty?.department.universityId!==universityId,403,"You cannot rate your own institution");
    }
    if(!isStaff(req.user)){
      const project=await db.project.findFirst({where:{AND:[projectVisibilityWhere(req.user),{status:{in:["DEPLOYED","IMPACT_MEASURED"]}},universityId?{assignment:{universityId}}:{partnerships:{some:{industryId}}}]}});
      ensure(project,403,"Ratings require participation in a deployed project with this organization");
    }
    const where={givenById:req.user.id,[field]:id};
    const existing=await db.rating.findFirst({where});
    const result=existing?await db.rating.update({where:{id:existing.id},data:{score,remark}}):await db.rating.create({data:{...where,score,remark}});
    const average=await db.rating.aggregate({where:{[field]:id},_avg:{score:true}});
    await db[model].update({where:{id},data:{avgRating:average._avg.score}});return result;
  });ok(res,rating);
});
const getRatings=field=>endpoint(async(req,res)=>ok(res,await prisma.rating.findMany({where:{[field]:req.params[field]},select:{id:true,score:true,remark:true,createdAt:true,givenBy:{select:{name:true}}},...pageArgs(req.validatedQuery),orderBy:{createdAt:"desc"}})));
export const getRatingsForUniversity=getRatings("universityId");
export const getRatingsForIndustry=getRatings("industryId");
