import { PrismaClient } from "@prisma/client";
import { getAttachmentType } from "../middleware/uploadMiddleware.js";
import { problemVisibilityWhere } from "../config/rbac.js";

const prisma = new PrismaClient();

// Public catalogue: exposes only non-sensitive fields from challenges marked public.
export const getPublicProblems = async (req, res) => {
  try {
    const { domain, status, search, page = 1, limit = 24 } = req.query;
    const where = {
      deletedAt: null,
      isPublic: true,
      status: status || { not: "REJECTED" },
      ...(domain && { domain }),
      ...(search && { OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ] }),
    };
    const skip = (Number(page) - 1) * Number(limit);
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        select: {
          id: true, title: true, description: true, domain: true, status: true,
          peopleAffected: true, priorityScore: true, viewCount: true, createdAt: true,
          block: { select: { name: true, district: { select: { name: true } } } },
          submittedBy: { select: { department: { select: { name: true } } } },
          _count: { select: { upvotes: true, comments: { where: { content: { startsWith: "SOLUTION_IDEA:" } } }, attachments: true } },
        },
        orderBy: { createdAt: "desc" }, skip, take: Number(limit),
      }),
      prisma.problem.count({ where }),
    ]);
    const publicProblems = problems.map(problem => ({
      ...problem,
      description: problem.description.replace(/\nContact:.*(?=\n|$)/gi, ""),
    }));
    return res.status(200).json({ success: true, data: publicProblems, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch public challenges", error: error.message });
  }
};

const IDEA_PREFIX = "SOLUTION_IDEA:";

export const getSolutionIdeas = async (req, res) => {
  try {
    const problem = await prisma.problem.findFirst({ where: { id: req.params.id, deletedAt: null, isPublic: true }, select: { id: true } });
    if (!problem) return res.status(404).json({ success: false, message: "Public challenge not found" });
    const comments = await prisma.comment.findMany({ where: { problemId: req.params.id, content: { startsWith: IDEA_PREFIX } }, include: { author: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "desc" } });
    const data = comments.map(comment => { try { return { id: comment.id, ...JSON.parse(comment.content.slice(IDEA_PREFIX.length)), author: comment.author, createdAt: comment.createdAt }; } catch { return null; } }).filter(Boolean);
    return res.status(200).json({ success: true, data });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to fetch solution ideas", error: error.message }); }
};

export const addSolutionIdea = async (req, res) => {
  try {
    const { title, summary, impact, skills } = req.body;
    if (!title?.trim() || !summary?.trim()) return res.status(400).json({ success: false, message: "Idea title and proposed solution are required" });
    const problem = await prisma.problem.findFirst({ where: { id: req.params.id, deletedAt: null, isPublic: true }, select: { id: true } });
    if (!problem) return res.status(404).json({ success: false, message: "Public challenge not found" });
    const content = IDEA_PREFIX + JSON.stringify({ title: title.trim().slice(0, 160), summary: summary.trim().slice(0, 3000), impact: String(impact || '').trim().slice(0, 1200), skills: String(skills || '').trim().slice(0, 500) });
    const comment = await prisma.comment.create({ data: { content, authorId: req.user.id, problemId: req.params.id }, include: { author: { select: { id: true, name: true, role: true } } } });
    return res.status(201).json({ success: true, message: "Solution idea submitted", data: { id: comment.id, title, summary, impact, skills, author: comment.author, createdAt: comment.createdAt } });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to submit solution idea", error: error.message }); }
};

export const getMySolutionIdeas = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({ where: { authorId: req.user.id, content: { startsWith: IDEA_PREFIX }, problem: { deletedAt: null } }, include: { problem: { select: { id: true, title: true, domain: true, status: true, isPublic: true } } }, orderBy: { createdAt: "desc" } });
    const data = comments.map(comment => { try { return { id: comment.id, ...JSON.parse(comment.content.slice(IDEA_PREFIX.length)), problem: comment.problem, createdAt: comment.createdAt }; } catch { return null; } }).filter(Boolean);
    return res.status(200).json({ success: true, data });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to fetch your solution ideas", error: error.message }); }
};

// ---------------- CREATE PROBLEM ----------------
export const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      domain,
      blockId,
      panchayatId,
      latitude,
      longitude,
      peopleAffected,
      isPublic,
    } = req.body;

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        domain: domain || "OTHER",
        blockId: blockId || undefined,
        panchayatId: panchayatId || undefined,
        latitude,
        longitude,
        peopleAffected,
        isPublic: isPublic ?? true,
        submittedById: req.user.id,
      },
    });

    // handle uploaded files (if any, via multer)
    if (req.files && req.files.length > 0) {
      const attachmentsData = req.files.map((file) => ({
        url: `/uploads/problems/${file.filename}`,
        type: getAttachmentType(file.mimetype),
        problemId: problem.id,
      }));

      await prisma.attachment.createMany({ data: attachmentsData });
    }

    // audit log
    await prisma.auditLog.create({
      data: {
        problemId: problem.id,
        performedById: req.user.id,
        action: "CREATED",
        details: `Problem "${title}" submitted`,
      },
    });

    const fullProblem = await prisma.problem.findUnique({
      where: { id: problem.id },
      include: { attachments: true },
    });

    return res.status(201).json({
      success: true,
      message: "Problem submitted successfully",
      data: fullProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit problem",
      error: error.message,
    });
  }
};

// ---------------- GET ALL PROBLEMS (with filters) ----------------
export const getAllProblems = async (req, res) => {
  try {
    const { domain, status, blockId, search, page = 1, limit = 10 } = req.query;

    const where = {
      AND: [problemVisibilityWhere(req.user)],
      ...(domain && { domain }),
      ...(status && { status }),
      ...(blockId && { blockId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: {
          submittedBy: { select: { id: true, name: true, email: true } },
          attachments: true,
          _count: { select: { upvotes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.problem.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: problems,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch problems",
      error: error.message,
    });
  }
};

// ---------------- GET SINGLE PROBLEM ----------------
export const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } },
        attachments: true,
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        tags: { include: { tag: true } },
        _count: { select: { upvotes: true } },
      },
    });

    if (!problem || problem.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    // increment view count
    await prisma.problem.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch problem",
      error: error.message,
    });
  }
};

// ---------------- UPDATE PROBLEM ----------------
export const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProblem = req.problem;

    const updatedProblem = await prisma.problem.update({
      where: { id },
      data: req.body,
    });

    // log status change specifically
    if (req.body.status && req.body.status !== existingProblem.status) {
      await prisma.auditLog.create({
        data: {
          problemId: id,
          performedById: req.user.id,
          action: "STATUS_CHANGED",
          details: `Status changed from ${existingProblem.status} to ${req.body.status}`,
        },
      });
    } else {
      await prisma.auditLog.create({
        data: {
          problemId: id,
          performedById: req.user.id,
          action: "UPDATED",
          details: "Problem details updated",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      data: updatedProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update problem",
      error: error.message,
    });
  }
};

// ---------------- VERIFY PROBLEM (Official only) ----------------
export const verifyProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDuplicateOf, duplicateNote } = req.body;

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const updatedProblem = await prisma.problem.update({
      where: { id },
      data: {
        status: isDuplicateOf ? "REJECTED" : "VERIFIED",
        verifiedById: req.user.id,
        verifiedAt: new Date(),
        isDuplicateOf: isDuplicateOf || undefined,
        duplicateNote: duplicateNote || undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        problemId: id,
        performedById: req.user.id,
        action: "VERIFIED",
        details: isDuplicateOf
          ? `Marked as duplicate of ${isDuplicateOf}`
          : "Problem verified",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Problem verification updated",
      data: updatedProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify problem",
      error: error.message,
    });
  }
};

// ---------------- DELETE PROBLEM (soft delete) ----------------
export const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    await prisma.problem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        problemId: id,
        performedById: req.user.id,
        action: "DELETED",
        details: "Problem soft-deleted",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Problem deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete problem",
      error: error.message,
    });
  }
};

// ---------------- UPVOTE PROBLEM ----------------
export const upvoteProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const existingUpvote = await prisma.problemUpvote.findUnique({
      where: {
        problemId_userId: {
          problemId: id,
          userId: req.user.id,
        },
      },
    });

    if (existingUpvote) {
      // toggle off (remove upvote)
      await prisma.problemUpvote.delete({ where: { id: existingUpvote.id } });
      return res.status(200).json({
        success: true,
        message: "Upvote removed",
        data: { upvoted: false },
      });
    }

    await prisma.problemUpvote.create({
      data: { problemId: id, userId: req.user.id },
    });

    return res.status(200).json({
      success: true,
      message: "Problem upvoted",
      data: { upvoted: true },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upvote problem",
      error: error.message,
    });
  }
};

// ---------------- ADD COMMENT ----------------
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: req.user.id,
        problemId: id,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    return res.status(201).json({
      success: true,
      message: "Comment added",
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

// ---------------- ADD FEEDBACK ----------------
export const addFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        problemId: id,
        userId: req.user.id,
        rating,
        comment,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted",
      data: feedback,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
};
