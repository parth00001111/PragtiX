import prisma from "../../PrismaClient.js";
import { endpoint, ensure, ok } from "../utils/http.js";
import { transaction, audit } from "../utils/transaction.js";
import { pageArgs } from "../validations/common.js";
export const createTag=endpoint(async(req,res)=>ok(res,await prisma.tag.create({data:req.body}),201));
export const getAllTags=endpoint(async(req,res)=>ok(res,await prisma.tag.findMany({...pageArgs(req.validatedQuery),orderBy:{name:"asc"}})));
export const addTagToProblem=endpoint(async(req,res)=>{
  const result=await transaction(async db=>{
    const problem=await db.problem.findUnique({where:{id:req.body.problemId}});
    ensure(problem&&!problem.deletedAt,404,"Problem not found");
    const tag=await db.problemTag.create({data:req.body});
    await audit(db,req.user.id,problem.id,"UPDATED","Tag attached");return tag;
  });ok(res,result,201);
});
export const removeTagFromProblem=endpoint(async(req,res)=>{
  const result=await transaction(async db=>{
    const problem=await db.problem.findUnique({where:{id:req.params.problemId}});
    ensure(problem&&!problem.deletedAt,404,"Problem not found");
    await db.problemTag.delete({where:{problemId_tagId:{problemId:req.params.problemId,tagId:req.params.tagId}}});
    await audit(db,req.user.id,problem.id,"UPDATED","Tag removed");return null;
  });ok(res,result);
});
