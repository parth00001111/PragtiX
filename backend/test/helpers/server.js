import {once} from "node:events";
import jwt from "jsonwebtoken";
export const token=(user,sid=user.id)=>jwt.sign({id:user.id,role:user.role,sid},process.env.ACCESS_TOKEN_SECRET);
export const start=async()=>{
 const {default:app}=await import("../../app.js");
 const server=app.listen(0,"127.0.0.1");await once(server,"listening");
 const base="http://127.0.0.1:"+server.address().port;
 return {server,request:(method,path,user,body)=>fetch(base+path,{method,headers:{...(user&&{Authorization:"Bearer "+(typeof user==="string"?user:token(user))}),...(body!==undefined&&!(body instanceof FormData)&&{"Content-Type":"application/json"})},...(body!==undefined&&{body:body instanceof FormData?body:JSON.stringify(body)})})};
};
