// Per-process protection for the single-instance demo. Use a shared store when scaling.
export const rateLimit=({limit=30,windowMs=60000,key=req=>req.user?.id||req.ip}={})=>{
 const entries=new Map();
 return (req,res,next)=>{
  const now=Date.now(),id=key(req);
  if(entries.size>10000)for(const [k,v] of entries)if(v.reset<=now)entries.delete(k);
  let entry=entries.get(id);
  if(!entry||entry.reset<=now){if(entries.size>=20000&&!entries.has(id))return res.status(429).json({success:false,message:"Too many requests; retry later"});entry={count:0,reset:now+windowMs};entries.set(id,entry);}
  if(++entry.count>limit){res.set("Retry-After",String(Math.ceil((entry.reset-now)/1000)));return res.status(429).json({success:false,message:"Too many requests; retry later"});}
  next();
 };
};
