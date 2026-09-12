import { PrismaClient } from "@prisma/client";
import "./src/config/env.js";
const prisma = new PrismaClient();
export default prisma;
