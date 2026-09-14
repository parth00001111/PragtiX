import { ensure,HttpError } from "../utils/http.js";
export const generateText=async(system,prompt,json=false)=>{
 const provider=process.env.AI_PROVIDER||"disabled",model=process.env.AI_MODEL;
 ensure(["gemini","ollama"].includes(provider)&&model,503,"AI is not configured. Set AI_PROVIDER and AI_MODEL on the backend.");
 let url,body,headers={"Content-Type":"application/json"};
 if(provider==="gemini"){
  ensure(process.env.GEMINI_API_KEY,503,"Gemini API key is not configured");
  url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent";
  headers["x-goog-api-key"]=process.env.GEMINI_API_KEY;
  body={systemInstruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:2048,...(json&&{responseMimeType:"application/json"})}};
 }else{
  url=(process.env.OLLAMA_BASE_URL||"http://127.0.0.1:11434").replace(/\/$/,"")+"/api/chat";
  body={model,stream:false,messages:[{role:"system",content:system},{role:"user",content:prompt}],options:{temperature:0.2,num_predict:2048},...(json&&{format:"json"})};
 }
 let response,data;
 try{
  response=await fetch(url,{method:"POST",headers,body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
  if(!response.ok){await response.body?.cancel();throw new HttpError(response.status===429?429:502,response.status===429?"AI quota reached; retry later":"AI provider could not process this request");}
  data=await response.json();
 }catch(error){
  if(error instanceof HttpError)throw error;
  throw new HttpError(error.name==="TimeoutError"?504:502,"AI provider is unavailable; retry later");
 }
 const text=provider==="gemini"?data.candidates?.[0]?.content?.parts?.filter(p=>typeof p.text==="string"&&!p.thought).map(p=>p.text).join("\n"):data.message?.content;
 ensure(typeof text==="string"&&text.trim(),502,"AI returned no usable response");
 return {text:text.trim().slice(0,20000),provider,model};
};
