import prisma from "../../PrismaClient.js";

export const transaction = async (operation) => {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(operation, { isolationLevel: "Serializable" }); }
    catch (error) { if (error.code !== "P2034" || attempt >= 2) throw error; }
  }
};

export const audit = (db, userId, problemId, action, details) => db.auditLog.create({
  data: { performedById: userId, problemId, action, details },
});
export const notify = async (db, userIds, message) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length) await db.notification.createMany({ data: ids.map(userId => ({ userId, message })) });
};
