import assert from "node:assert/strict";
import {test,before,beforeEach,after,mock} from "node:test";
import {randomUUID} from "node:crypto";
import {writeFile,unlink,readdir} from "node:fs/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {createDatabase} from "./helpers/database.js";
import {start,token} from "./helpers/server.js";
process.env.ACCESS_TOKEN_SECRET="backend-test-access-secret";
process.env.REFRESH_TOKEN_SECRET="backend-test-refresh-secret";
process.env.AI_PROVIDER="disabled";
const {db,reset,tables}=createDatabase();
mock.module("@prisma/client",{namedExports:{PrismaClient:class{constructor(){return db;}}}});
let server,request;
const roles=["CITIZEN","FACULTY","STUDENT","INDUSTRY","OFFICIAL","DEPT_ADMIN","SUPER_ADMIN"];
let users,ids;
const payload={title:"Pipeline leak near school",description:"Broken pipeline has wasted water for two weeks",domain:"WATER_MANAGEMENT"};
const filename="test-"+randomUUID()+".txt",file=new URL("../uploads/problems/"+filename,import.meta.url);
before(async()=>{({server,request}=await start());await writeFile(file,"private evidence");});
after(async()=>{await unlink(file);server?.closeAllConnections();if(server)await new Promise(resolve=>server.close(resolve));});
beforeEach(async()=>{
 reset();users={};ids={};
 for(const name of [...roles,"OWNER","OTHER_FACULTY","OTHER_INDUSTRY","OTHER_STUDENT"]){
  const role=name==="OWNER"?"CITIZEN":name.startsWith("OTHER_")?name.slice(6):name;
  users[name]=await db.user.create({data:{name,email:name+"@example.com",password:"not-a-real-hash",role}});
  await db.session.create({data:{id:users[name].id,userId:users[name].id,refreshToken:randomUUID(),expiresAt:new Date(Date.now()+600000)}});
 }
 for(const [key,isPublic] of [["public",true],["private",false],["deleted",true]]){
  const p=await db.problem.create({data:{...payload,isPublic,submittedById:users.OWNER.id,...(key==="deleted"&&{deletedAt:new Date()})}});ids[key]=p.id;
 }
 await db.attachment.create({data:{problemId:ids.private,url:"/uploads/problems/"+filename,type:"DOCUMENT"}});
});
const expect=async(method,path,user,body,status=200)=>{
 const response=await request(method,path,user,body);
 const result=await response.json();
 assert.equal(response.status,status,method+" "+path+" "+JSON.stringify(result));
 return result.data;
};
const p=key=>"/api/problems/"+ids[key];
const provision=async()=>{
 const university=await expect("POST","/api/universities",users.FACULTY,{universityName:"Demo University",district:"Ranchi"},201);
 const department=await expect("POST","/api/universities/departments",users.FACULTY,{name:"Water engineering",domainExpertise:["WATER_MANAGEMENT"]},201);
 await expect("POST","/api/universities/faculty-profile",users.FACULTY,{departmentId:department.id},201);
 await expect("POST","/api/universities/labs",users.FACULTY,{departmentId:department.id,name:"Water lab"},201);
 await expect("PATCH",p("private")+"/verify",users.OFFICIAL,{});
 const assignment=await expect("POST","/api/assignments",users.OFFICIAL,{problemId:ids.private,universityId:university.id},201);
 const team=await expect("POST","/api/teams",users.FACULTY,{name:"Water team"},201);
 await expect("POST","/api/teams/"+team.id+"/members",users.FACULTY,{userId:users.FACULTY.id,role:"FACULTY_MENTOR"},201);
 await expect("POST","/api/teams/"+team.id+"/members",users.FACULTY,{userId:users.STUDENT.id,role:"STUDENT_LEAD"},201);
 const project=await expect("POST","/api/projects",users.FACULTY,{title:"Repair water pipeline",description:"A monitored repair and leak detection project",assignmentId:assignment.id,teamId:team.id},201);
 return {university,department,assignment,team,project};
};

test("all private operations require a valid authenticated session",async()=>{
 for(const [method,path] of [["GET","/api/problems"],["POST","/api/problems"],["GET",p("public")],["PATCH",p("public")],["DELETE",p("public")],["POST",p("public")+"/comment"],["GET","/api/projects"],["GET","/api/teams"],["GET","/api/notifications"],["GET","/api/analytics"],["GET","/uploads/problems/"+filename],["GET","/api/auth/me"]])
  await expect(method,path,null,undefined,401);
 const oldToken=jwt.sign({id:users.CITIZEN.id,role:"SUPER_ADMIN"},process.env.ACCESS_TOKEN_SECRET);
 await expect("GET","/api/auth/me",oldToken,undefined,401);
 await db.session.delete({where:{id:users.CITIZEN.id}});
 await expect("GET","/api/auth/me",users.CITIZEN,undefined,401);
});
test("all roles can submit but cannot supply the owner, scores, or a privileged account role",async()=>{
 for(const role of roles){
  const result=await expect("POST","/api/problems",users[role],{...payload,submittedById:users.OWNER.id,priorityScore:100},201);
  assert.equal(result.submittedById,users[role].id);assert.equal(result.priorityScore,null);
 }
 for(const role of ["OFFICIAL","DEPT_ADMIN","SUPER_ADMIN"])await expect("POST","/api/auth/register",null,{name:"Test user",email:"test@example.com",password:"Password1",role},400);
});
test("private lists, search, engagement and evidence follow resource visibility",async()=>{
 for(const role of roles){
  const response=await request("GET","/api/problems?search=Pipeline",users[role]);
  const body=await response.json();assert.equal(response.status,200);
  const staff=["OFFICIAL","DEPT_ADMIN","SUPER_ADMIN"].includes(role);
  assert.equal(body.pagination.total,staff?2:1);
  await expect("GET",p("private"),users[role],undefined,staff?200:404);
  if(!staff){await expect("POST",p("private")+"/comment",users[role],{content:"Hello"},404);await expect("GET","/uploads/problems/"+filename,users[role],undefined,404);}
 }
 for(const role of ["OWNER","OFFICIAL","DEPT_ADMIN","SUPER_ADMIN"]){
  const response=await request("GET","/uploads/problems/"+filename,users[role]);
  assert.equal(response.status,200);assert.equal(await response.text(),"private evidence");assert.equal(response.headers.get("cache-control"),"private, no-store");
 }
 await expect("POST",p("public")+"/comment",users.CITIZEN,{content:"Additional detail"},201);
 await expect("POST",p("public")+"/upvote",users.CITIZEN,{});
 await expect("POST",p("public")+"/feedback",users.CITIZEN,{rating:4},409);
});
test("ownership, current database roles and lifecycle states guard edits and verification",async()=>{
 for(const role of ["CITIZEN","FACULTY","STUDENT","INDUSTRY"])
  await expect("PATCH",p("private"),users[role],{title:"Changed title"},403);
 await expect("PATCH",p("private"),users.OWNER,{title:"Changed title"});
 await expect("PATCH",p("private"),users.OWNER,{status:"VERIFIED"},403);
 const forged=jwt.sign({id:users.CITIZEN.id,sid:users.CITIZEN.id,role:"SUPER_ADMIN"},process.env.ACCESS_TOKEN_SECRET);
 await expect("PATCH",p("private")+"/verify",forged,{},403);
 await expect("PATCH",p("private")+"/verify",users.OFFICIAL,{});
 await expect("PATCH",p("private"),users.OWNER,{title:"Post-review edit"},409);
 await expect("PATCH",p("private"),users.OFFICIAL,{status:"RESOLVED"},409);
 const result=await expect("PATCH",p("private"),users.OFFICIAL,{status:"PRIORITIZED",severityScore:10,urgencyScore:5});
 assert.equal(result.priorityScore,30);
 await expect("PATCH",p("private")+"/verify",users.OFFICIAL,{},409);
});
test("only owners/admins delete, deleted resources disappear, and duplicates cannot reference themselves",async()=>{
 await expect("DELETE",p("public"),users.OFFICIAL,undefined,403);
 await expect("DELETE",p("public"),users.OWNER);
 for(const method of ["GET","DELETE"])await expect(method,p("public"),users.SUPER_ADMIN,undefined,404);
 await expect("PATCH",p("deleted"),users.SUPER_ADMIN,{},404);
 await expect("PATCH",p("private")+"/verify",users.OFFICIAL,{isDuplicateOf:ids.private},400);
 await expect("PATCH",p("private")+"/verify",users.OFFICIAL,{isDuplicateOf:randomUUID()},404);
});
test("validation rejects bad IDs, enums, pagination, blank inputs, bad JSON and empty updates",async()=>{
 for(const url of ["/api/problems?limit=-1","/api/projects?page=0","/api/problems?domain=BAD","/api/problems/not-an-id","/api/notifications?unread=maybe"])
  await expect("GET",url,users.CITIZEN,undefined,400);
 await expect("POST","/api/problems",users.CITIZEN,{...payload,title:"     "},400);
 await expect("POST","/api/problems",users.CITIZEN,{...payload,latitude:22},400);
 await expect("PATCH",p("private"),users.OWNER,{},400);
 await expect("POST","/api/ratings",users.CITIZEN,{score:4},400);
 await expect("POST","/api/ratings",users.CITIZEN,{score:4,universityId:randomUUID(),industryId:randomUUID()},400);
 const malformed=await fetch("http://127.0.0.1:"+server.address().port+"/api/problems",{method:"POST",headers:{"Content-Type":"application/json"},body:'{"title":'});
 assert.equal(malformed.status,400);assert.equal((await malformed.json()).message,"Invalid JSON body");
});
test("multipart booleans/numbers are normalized, invalid uploads removed, location hierarchy enforced",async()=>{
 const beforeFiles=await readdir(new URL("../uploads/problems/",import.meta.url));
 const form=new FormData();for(const [k,v] of Object.entries(payload))form.append(k,v);
 form.append("isPublic","false");form.append("peopleAffected","250");form.append("latitude","23.3441");form.append("longitude","85.3096");
 const result=await expect("POST","/api/problems",users.CITIZEN,form,201);
 assert.equal(result.isPublic,false);assert.equal(result.peopleAffected,250);
 const invalid=new FormData();invalid.append("title","x");invalid.append("attachments",new Blob(["test"],{type:"application/pdf"}),"test.pdf");
 await expect("POST","/api/problems",users.CITIZEN,invalid,400);
 assert.deepEqual(await readdir(new URL("../uploads/problems/",import.meta.url)),beforeFiles);
 const d1=await db.district.create({data:{name:"Ranchi"}}),d2=await db.district.create({data:{name:"Other"}});
 const block=await db.block.create({data:{name:"Demo block",districtId:d1.id}});
 await expect("POST","/api/problems",users.CITIZEN,{...payload,blockId:block.id,districtId:d2.id},400);
 const located=await expect("POST","/api/problems",users.CITIZEN,{...payload,blockId:block.id},201);assert.equal(located.districtId,d1.id);
});
test("inactive/deleted users cannot access protected routes",async()=>{
 await db.user.update({where:{id:users.CITIZEN.id},data:{isActive:false}});
 await expect("GET","/api/auth/me",users.CITIZEN,undefined,403);
 await db.user.update({where:{id:users.CITIZEN.id},data:{isActive:true,deletedAt:new Date()}});
 await expect("GET","/api/auth/me",users.CITIZEN,undefined,401);
});
test("login/refresh/logout and password changes revoke sessions",async()=>{
 const password=await bcrypt.hash("Password1",4);
 await db.user.update({where:{id:users.CITIZEN.id},data:{password}});
 const login=await expect("POST","/api/auth/login",null,{email:users.CITIZEN.email,password:"Password1"});
 await expect("GET","/api/auth/me",login.accessToken);
 const refreshed=await expect("POST","/api/auth/refresh",null,{refreshToken:login.refreshToken});assert.ok(refreshed.accessToken);
 await expect("POST","/api/auth/logout",null,{refreshToken:login.refreshToken});
 await expect("GET","/api/auth/me",login.accessToken,undefined,401);
 await expect("POST","/api/auth/refresh",null,{refreshToken:login.refreshToken},401);
 await expect("PATCH","/api/users/me/password",users.CITIZEN,{currentPassword:"bad",newPassword:"NewPassword1"},400);
 await expect("PATCH","/api/users/me/password",users.CITIZEN,{currentPassword:"Password1",newPassword:"NewPassword1"});
 await expect("GET","/api/auth/me",users.CITIZEN,undefined,401);
});
test("role management belongs to super admin and cannot demote the current administrator",async()=>{
 await expect("PATCH","/api/users/"+users.CITIZEN.id,users.DEPT_ADMIN,{role:"OFFICIAL"},403);
 await expect("PATCH","/api/users/"+users.SUPER_ADMIN.id,users.SUPER_ADMIN,{isActive:false},409);
 const result=await expect("PATCH","/api/users/"+users.CITIZEN.id,users.SUPER_ADMIN,{role:"OFFICIAL"});
 assert.equal(result.role,"OFFICIAL");assert.equal(result.password,undefined);
 await expect("GET","/api/auth/me",users.CITIZEN,undefined,401);
});
test("full challenge-to-impact lifecycle, budget checks and stakeholder permissions",async()=>{
 const {project,university,team}=await provision();
 const path="/api/projects/"+project.id;
 await expect("GET",p("private"),users.STUDENT);
 await expect("GET",p("private"),users.OTHER_STUDENT,undefined,404);
 await expect("GET",path,users.OTHER_FACULTY,undefined,403);
 await expect("POST","/api/teams/"+team.id+"/members",users.OTHER_FACULTY,{userId:users.OTHER_STUDENT.id,role:"STUDENT_MEMBER"},403);
 await expect("PATCH",path,users.FACULTY,{status:"DEPLOYED"},409);
 const proposal=await expect("POST","/api/proposals",users.STUDENT,{projectId:project.id,content:"Design a monitored water pipeline repair prototype."},201);
 await expect("PATCH","/api/proposals/"+proposal.id+"/review",users.OFFICIAL,{status:"APPROVED"},409);
 await expect("PATCH","/api/proposals/"+proposal.id+"/submit",users.STUDENT,{});
 await expect("PATCH","/api/proposals/"+proposal.id+"/review",users.FACULTY,{status:"APPROVED"},403);
 await expect("PATCH","/api/proposals/"+proposal.id+"/review",users.OFFICIAL,{status:"APPROVED"});
 const industry=await expect("POST","/api/industries",users.INDUSTRY,{orgName:"Water startup",type:"STARTUP"},201);
 await expect("POST","/api/finance/partnerships",users.INDUSTRY,{projectId:project.id,industryId:industry.id,role:"FUNDER"},403);
 await expect("POST","/api/finance/partnerships",users.FACULTY,{projectId:project.id,industryId:industry.id,role:"FUNDER"},201);
 await expect("GET",p("private"),users.INDUSTRY);
 await expect("GET","/api/finance/project/"+project.id+"/summary",users.OWNER,undefined,403);
 await expect("POST","/api/finance/fundings",users.OTHER_INDUSTRY,{projectId:project.id,industryId:industry.id,source:"INDUSTRY",amount:1000},403);
 await expect("POST","/api/finance/fundings",users.INDUSTRY,{projectId:project.id,industryId:industry.id,source:"INDUSTRY",amount:1000},201);
 await expect("POST","/api/finance/expenses",users.FACULTY,{projectId:project.id,description:"Equipment",amount:1001},409);
 await expect("POST","/api/finance/expenses",users.FACULTY,{projectId:project.id,description:"Equipment",amount:750.25},201);
 const finance=await expect("GET","/api/finance/project/"+project.id+"/summary",users.FACULTY);assert.equal(finance.remaining,249.75);
 await expect("PATCH",path,users.FACULTY,{status:"PROTOTYPE"});
 await expect("PATCH",path,users.FACULTY,{status:"PILOT_TESTING"});
 await expect("PATCH",path,users.OFFICIAL,{status:"DEPLOYED"},409);
 const milestone=await expect("POST","/api/milestones",users.FACULTY,{projectId:project.id,title:"Pilot validation"},201);
 await expect("PATCH","/api/milestones/"+milestone.id,users.STUDENT,{status:"COMPLETED"});
 await expect("PATCH",path,users.FACULTY,{status:"DEPLOYED"},403);
 await expect("PATCH",path,users.OFFICIAL,{status:"DEPLOYED"});
 await expect("POST","/api/impact",users.FACULTY,{projectId:project.id,citizensBenefited:250},403);
 await expect("POST","/api/impact",users.OFFICIAL,{projectId:project.id,citizensBenefited:250,villagesCovered:1},201);
 assert.equal((await expect("GET",p("private"),users.OWNER)).status,"RESOLVED");
 await expect("POST",p("private")+"/feedback",users.OWNER,{rating:5,comment:"Supply restored"},201);
 await expect("POST","/api/ratings",users.OWNER,{universityId:university.id,score:5});
 await expect("POST","/api/ratings",users.OWNER,{universityId:university.id,score:4});
 assert.equal(tables.Rating.length,1);assert.equal(tables.UniversityProfile[0].avgRating,4);
 await expect("POST","/api/impact",users.OFFICIAL,{projectId:project.id,citizensBenefited:250},409);
 await expect("DELETE",p("private"),users.SUPER_ADMIN,undefined,409);
 const dashboard=await expect("GET","/api/analytics",users.OFFICIAL);assert.equal(dashboard.impact._sum.citizensBenefited,250);
 const citizenProject=await expect("GET",path,users.OWNER);assert.equal(citizenProject.budgetSpent,undefined);
});
test("public directories do not leak accounts, assignments, finance or private challenges",async()=>{
 await provision();
 const departments=await expect("GET","/api/locations/departments",null);
 const universities=await expect("GET","/api/universities",null);
 const text=JSON.stringify({departments,universities});
 for(const forbidden of ["password","refreshToken","submittedById",ids.private,"not-a-real-hash","assignments","budgetSpent"])assert.ok(!text.includes(forbidden),forbidden);
 assert.equal(universities.length,1);
});
test("notifications are scoped to the recipient and mutation cannot cross accounts",async()=>{
 const notification=await db.notification.create({data:{userId:users.OWNER.id,message:"Private notification"}});
 assert.deepEqual(await expect("GET","/api/notifications",users.CITIZEN),[]);
 await expect("PATCH","/api/notifications/"+notification.id+"/read",users.CITIZEN,{},404);
 await expect("PATCH","/api/notifications/"+notification.id+"/read",users.OWNER,{});
 assert.deepEqual(await expect("GET","/api/notifications?unread=true",users.OWNER),[]);
});
test("failed transactions roll back related records and budget changes",async()=>{
 const original=db.auditLog.create;
 db.auditLog.create=async()=>{throw Object.assign(new Error("Simulated conflict"),{code:"P2034"});};
 const count=tables.Problem.length;
 try{await expect("POST","/api/problems",users.CITIZEN,payload,409);assert.equal(tables.Problem.length,count);}
 finally{db.auditLog.create=original;}
});
test("AI is optional; private status lookup uses RBAC and never calls an external provider",async()=>{
 await expect("POST","/api/assistant/analyze",users.CITIZEN,payload,503);
 await expect("POST","/api/assistant/chat",users.CITIZEN,{message:"Status?",problemId:ids.private},404);
 const result=await expect("POST","/api/assistant/chat",users.OWNER,{message:"Status?",problemId:ids.private});
 assert.equal(result.source,"database");assert.equal(result.data.status,"SUBMITTED");
});
