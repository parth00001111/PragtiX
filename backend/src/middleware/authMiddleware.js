import jwt from "jsonwebtoken";
import prisma from "../../PrismaClient.js";
import { ALL_ROLES } from "../config/rbac.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

// ---------------- Protect: verify access token ----------------
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token expired",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (typeof decoded.id !== 'string' || typeof decoded.sid !== 'string') {
      return res.status(401).json({success:false,message:'Please sign in again'});
    }
    const session = await prisma.session.findUnique({where:{id:decoded.sid}});
    if (!session || session.userId !== decoded.id || session.expiresAt <= new Date()) {
      return res.status(401).json({success:false,message:'Session expired or revoked; please sign in again'});
    }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
        districtId: true,
        departmentId: true,
      },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    if (!user.isActive || !ALL_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive or has an unsupported role",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return next(error);
  }
};

// ---------------- Authorize by role ----------------
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login first",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed to access this resource`,
      });
    }

    next();
  };
};
