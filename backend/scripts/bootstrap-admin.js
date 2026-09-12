import prisma from '../PrismaClient.js';
import {transaction} from '../src/utils/transaction.js';
import {ensure} from '../src/utils/http.js';
const email=process.argv[2]?.trim().toLowerCase();
try{
 ensure(email,400,'Usage: npm run admin:bootstrap -- your-registered-email');
 await transaction(async db=>{
  ensure(await db.user.count({where:{role:'SUPER_ADMIN'}})===0,409,'A super admin already exists. Use the authenticated user-management API.');
  const user=await db.user.findFirst({where:{email:{equals:email,mode:'insensitive'},isActive:true,deletedAt:null}});
  ensure(user,404,'Register this account first');
  await db.user.update({where:{id:user.id},data:{role:'SUPER_ADMIN'}});
  await db.session.deleteMany({where:{userId:user.id}});
  await db.auditLog.create({data:{performedById:user.id,action:'UPDATED',details:'Initial administrator bootstrapped from backend CLI'}});
 });
 console.log('Initial administrator configured. Sign in again.');
}catch(error){console.error(error.status?error.message:'Admin setup failed: '+(error.code||error.name));process.exitCode=1;}
finally{await prisma.$disconnect();}
