import app from "./app.js";
import prisma from "./PrismaClient.js";
const PORT=process.env.PORT||5000;
const server=app.listen(PORT,()=>console.log("Server running on port "+PORT));
const shutdown=()=>server.close(async()=>{await prisma.$disconnect();process.exit(0);});
process.once("SIGTERM",shutdown);
process.once("SIGINT",shutdown);
