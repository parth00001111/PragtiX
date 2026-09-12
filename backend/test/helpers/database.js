import {randomUUID} from "node:crypto";
import {Prisma} from "@prisma/client";
const models=Object.fromEntries(Prisma.dmmf.datamodel.models.map(m=>[m.name,m]));
const nameOf=name=>name[0].toLowerCase()+name.slice(1);
export function createDatabase(){
 const tables=Object.fromEntries(Object.keys(models).map(name=>[name,[]]));
 const db={};
 const failure=code=>{throw Object.assign(new Error(code),{code});};
 const relation=(name,row,field)=>{
  if(field.relationFromFields.length)return tables[field.type].find(target=>field.relationToFields.every((key,i)=>target[key]===row[field.relationFromFields[i]]))||null;
  const back=models[field.type].fields.find(f=>f.kind==="object"&&f.relationName===field.relationName&&f.relationFromFields.length);
  const found=tables[field.type].filter(target=>back.relationFromFields.every((key,i)=>target[key]===row[back.relationToFields[i]]));
  return field.isList?found:found[0]||null;
 };
 const scalar=(value,filter)=>{
  if(filter===null)return value==null;
  if(typeof filter!=="object"||filter instanceof Date)return filter instanceof Date?+value===+filter:value===filter;
  return Object.entries(filter).every(([key,v])=>{
   if(key==="equals")return filter.mode==="insensitive"?String(value).toLowerCase()===String(v).toLowerCase():scalar(value,v);
   if(key==="not")return !scalar(value,v);
   if(key==="in")return v.includes(value);
   if(key==="notIn")return !v.includes(value);
   if(key==="contains")return filter.mode==="insensitive"?String(value).toLowerCase().includes(v.toLowerCase()):String(value).includes(v);
   if(key==="mode")return true;
   if(key==="has")return value.includes(v);
   if(key==="lt")return value<v;if(key==="lte")return value<=v;if(key==="gt")return value>v;if(key==="gte")return value>=v;
   throw new Error("Unsupported test scalar filter "+key);
  });
 };
 const matches=(name,row,where={})=>{
  if(!row)return false;
  return Object.entries(where).every(([key,value])=>{
   if(value===undefined)return true;
   if(key==="AND")return (Array.isArray(value)?value:[value]).every(w=>matches(name,row,w));
   if(key==="OR")return value.some(w=>matches(name,row,w));
   if(key==="NOT")return !(Array.isArray(value)?value:[value]).some(w=>matches(name,row,w));
   const field=models[name].fields.find(f=>f.name===key);
   if(!field){const fields=models[name].uniqueFields.find(fields=>fields.join("_")===key);if(fields)return fields.every(f=>scalar(row[f],value[f]));throw new Error("Unknown test query field "+name+"."+key);}
   if(field.kind!=="object")return scalar(row[key],value);
   const linked=relation(name,row,field);
   if(field.isList)return Object.entries(value).every(([op,w])=>op==="some"?linked.some(r=>matches(field.type,r,w)):op==="none"?!linked.some(r=>matches(field.type,r,w)):op==="every"?linked.every(r=>matches(field.type,r,w)):false);
   if(value===null)return linked===null;
   if(Object.hasOwn(value,"is"))return value.is===null?linked===null:matches(field.type,linked,value.is);
   if(Object.hasOwn(value,"isNot"))return !matches(field.type,linked,value.isNot);
   return matches(field.type,linked,value);
  });
 };
 const list=(name,args={})=>{
  let rows=tables[name].filter(row=>matches(name,row,args.where));
  for(const order of [...(Array.isArray(args.orderBy)?args.orderBy:args.orderBy?[args.orderBy]:[])].reverse()){
   const [key,direction]=Object.entries(order)[0];rows.sort((a,b)=>(a[key]>b[key]?1:a[key]<b[key]?-1:0)*(direction==="desc"?-1:1));
  }
  return rows.slice(args.skip||0,args.take===undefined?undefined:(args.skip||0)+args.take);
 };
 const shape=(name,row,args={})=>{
  if(!row)return null;
  const result=args.select?{}:structuredClone(row);
  for(const [key,spec] of Object.entries(args.select||args.include||{})){
   if(!spec)continue;
   if(key==="_count"){result._count={};for(const k of Object.keys(spec.select)){const field=models[name].fields.find(f=>f.name===k);result._count[k]=relation(name,row,field).length;}continue;}
   const field=models[name].fields.find(f=>f.name===key);if(!field)throw new Error("Unknown test selection "+name+"."+key);
   if(field.kind!=="object"){result[key]=row[key];continue;}
   const linked=relation(name,row,field);
   result[key]=field.isList?linked.filter(r=>matches(field.type,r,spec.where)).slice(spec.skip||0,spec.take===undefined?undefined:(spec.skip||0)+spec.take).map(r=>shape(field.type,r,spec===true?{}:spec)):shape(field.type,linked,spec===true?{}:spec);
  }return structuredClone(result);
 };
 const defaults=name=>Object.fromEntries(models[name].fields.filter(f=>f.kind!=="object").map(f=>{
  let value=f.isList?[]:null;
  if(f.hasDefaultValue){const d=f.default;value=typeof d==="object"&&!Array.isArray(d)?d.name==="uuid"?randomUUID():d.name==="now"?new Date():null:d;}
  if(f.isUpdatedAt)value=new Date();return [f.name,value];
 }));
 const check=(name,row,exclude)=>{
  for(const fields of [["id"],...models[name].fields.filter(f=>f.isUnique).map(f=>[f.name]),...models[name].uniqueFields]){
   if(fields.every(f=>row[f]!=null)&&tables[name].some(r=>r.id!==exclude&&fields.every(f=>r[f]===row[f])))failure("P2002");
  }
  for(const f of models[name].fields.filter(f=>f.kind==="object"&&f.relationFromFields.length)){
   if(f.relationFromFields.every(k=>row[k]!=null)&&!relation(name,row,f))failure("P2003");
  }
 };
 const merge=(row,data)=>{const next={...row};for(const [key,value] of Object.entries(data)){if(value===undefined)continue;next[key]=value&&typeof value==="object"&&"increment" in value?(row[key]||0)+value.increment:value;}return next;};
 for(const name of Object.keys(models)){
  db[nameOf(name)]={
   findUnique:async args=>shape(name,list(name,{where:args.where})[0],args),
   findFirst:async args=>shape(name,list(name,args)[0],args),
   findMany:async(args={})=>list(name,args).map(r=>shape(name,r,args)),
   count:async(args={})=>list(name,args).length,
   create:async args=>{const row=merge(defaults(name),args.data);check(name,row);tables[name].push(row);return shape(name,row,args);},
   createMany:async args=>{for(const data of args.data)await db[nameOf(name)].create({data});return {count:args.data.length};},
   update:async args=>{const row=list(name,{where:args.where})[0];if(!row)failure("P2025");const next=merge(row,args.data);check(name,next,row.id);Object.assign(row,next);return shape(name,row,args);},
   updateMany:async args=>{const rows=list(name,{where:args.where});for(const row of rows)await db[nameOf(name)].update({where:{id:row.id},data:args.data});return {count:rows.length};},
   delete:async args=>{const row=list(name,{where:args.where})[0];if(!row)failure("P2025");tables[name].splice(tables[name].indexOf(row),1);return shape(name,row,args);},
   deleteMany:async args=>{const rows=list(name,{where:args.where});for(const row of rows)await db[nameOf(name)].delete({where:{id:row.id}});return {count:rows.length};},
   aggregate:async args=>{
    const rows=list(name,args),result={};
    for(const op of ["_sum","_avg"])if(args[op])result[op]=Object.fromEntries(Object.keys(args[op]).map(k=>[k,rows.length?rows.reduce((sum,r)=>sum+(r[k]||0),0)/(op==="_avg"?rows.length:1):null]));
    if(args._count)result._count=rows.length;return result;
   },
   groupBy:async args=>{const groups=new Map();for(const row of list(name,args)){const key=JSON.stringify(args.by.map(k=>row[k]));const group=groups.get(key)||{...Object.fromEntries(args.by.map(k=>[k,row[k]])),_count:{_all:0}};group._count._all++;groups.set(key,group);}return [...groups.values()];}
  };
 }
 db.$transaction=async operation=>{
  const before=structuredClone(tables);
  try{return await operation(db);}catch(error){for(const name of Object.keys(tables))tables[name]=before[name];throw error;}
 };
 db.$disconnect=async()=>{};
 return {db,tables,reset:()=>{for(const name of Object.keys(tables))tables[name]=[];}};
}
