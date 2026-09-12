import { z } from "zod";
import { uuid,domain,pageSchema,nonEmpty } from "./common.js";
export { validate } from "./common.js";
const numeric = schema => z.preprocess(v=>typeof v==="string"&&v.trim()!==""?Number(v):v,schema.optional());
const coordinates = data => (data.latitude===undefined)===(data.longitude===undefined);
const fields={
 title:z.string().trim().min(5).max(200), description:z.string().trim().min(10).max(20000),
 domain:domain.optional(),districtId:uuid.optional(),blockId:uuid.optional(),panchayatId:uuid.optional(),
 latitude:numeric(z.number().min(-90).max(90)),longitude:numeric(z.number().min(-180).max(180)),
 peopleAffected:numeric(z.number().int().positive().max(2147483647)),
 isPublic:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean().optional())
};
export const problemStatus=z.enum(["SUBMITTED","VERIFIED","PRIORITIZED","ASSIGNED","IN_PROGRESS","RESOLVED","REJECTED","ESCALATED"]);
export const createProblemSchema=z.object(fields).refine(coordinates,"Provide latitude and longitude together");
export const updateProblemSchema=nonEmpty(z.object({...fields,title:fields.title.optional(),description:fields.description.optional(),
 status:problemStatus.optional(),severityScore:z.number().min(0).max(10).optional(),urgencyScore:z.number().min(0).max(10).optional(),
 geographicImpactScore:z.number().min(0).max(10).optional(),feasibilityScore:z.number().min(0).max(10).optional(),communitySupportScore:z.number().min(0).max(10).optional()
}).refine(coordinates,"Provide latitude and longitude together"));
export const verifyProblemSchema=z.object({isDuplicateOf:uuid.optional(),duplicateNote:z.string().trim().max(1000).optional()});
export const addCommentSchema=z.object({content:z.string().trim().min(1).max(1000)});
export const addFeedbackSchema=z.object({rating:z.number().int().min(1).max(5),comment:z.string().trim().max(1000).optional()});
export const problemQuerySchema=pageSchema.extend({domain:domain.optional(),status:problemStatus.optional(),districtId:uuid.optional(),blockId:uuid.optional(),search:z.string().trim().min(1).max(200).optional()});
