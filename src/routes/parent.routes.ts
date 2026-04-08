import { Router, Response } from "express";
import mongoose from "mongoose";
import {
  AuthRequest,
  authenticate,
  authorize,
} from "../middleware/auth.middleware";
import { ParentAccess } from "../models/ParentAccess.model";
import { StudentProfile } from "../models/StudentProfile.model";
import { StudyLog } from "../models/StudyLog.model";
import { WeakTopic } from "../models/WeakTopic.model";
import { User } from "../models/User.model";
import { Parent } from "../models/Parent.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { parentPortalRateLimiter } from "../middleware/rateLimiter.advanced";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get student insights - PROTECTED - only if parent is linked to student
router.get(
  "/student/:studentId",
  parentPortalRateLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    const parentUserId = req.user?.id;

    console.log(
      `[Parent API] /student called - parent: ${parentUserId}, student: ${studentId}`,
    );

    // Validate studentId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.error(`[Parent API] Invalid ObjectId format: ${studentId}`);
      throw createError("Invalid student ID format", 400);
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const parentObjectId = new mongoose.Types.ObjectId(parentUserId);

    // ✅ CRITICAL: Verify parent is actually linked to this student
    const parentAccess = await ParentAccess.findOne({
      parentUserId: parentObjectId,
      studentUserId: studentObjectId,
    });

    if (!parentAccess) {
      console.warn(
        `[Parent API] Access denied - parent ${parentUserId} not linked to student ${studentId}`,
      );
      throw createError(
        "You don't have access to this student. Please verify the Student ID.",
        403,
      );
    }

    console.log(`[Parent API] Access verified - parent is linked to student`);

    // Check if student profile exists
    let profile = await StudentProfile.findOne({ userId: studentObjectId });

    if (!profile) {
      console.log(`[Parent API] StudentProfile not found, creating...`);
      profile = new StudentProfile({
        userId: studentObjectId,
        classLevel: "Class 6",
        subjects: [],
        board: "CBSE",
        preferredLanguage: "English",
        learningStyle: "reading",
        studyGoalMinutes: 60,
      });
      await profile.save();
    }

    // Fetch user data
    const user = await User.findById(studentObjectId).select("name email");

    if (!user) {
      console.log(
        `[Parent API] User not found for ID: ${studentObjectId} - returning stub data`,
      );
    }

    // Get study data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [studyLogs, weakTopics] = await Promise.all([
      StudyLog.find({ userId: studentObjectId, createdAt: { $gte: weekAgo } }),
      WeakTopic.find({ userId: studentObjectId, needsRevision: true }),
    ]);

    res.json({
      success: true,
      data: {
        profile: {
          ...profile.toObject(),
          name: user?.name || `Student ${studentId}`,
          email: user?.email || "",
        },
        studyLogs,
        weakTopics,
      },
    });
    console.log(
      `[Parent API] Successfully returned student data for ${studentId}`,
    );
  }),
);

// Test endpoint to verify routing works
router.get("/test", (_req, res) => {
  res.json({ success: true, message: "Parent routes are working!" });
});

// Link parent to student
router.post(
  "/link",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parentUserId = req.user?.id;
    const { studentUserId, relationship } = req.body;

    console.log("[Parent Routes] /link endpoint called");
    console.log("[Parent Routes] parentUserId:", parentUserId);
    console.log("[Parent Routes] studentUserId:", studentUserId);
    console.log("[Parent Routes] relationship:", relationship);

    if (!studentUserId) {
      throw createError("studentUserId is required", 400);
    }

    // Validate studentId is a valid MongoDB ObjectId
    if (!parentUserId) {
      throw createError("Parent ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(studentUserId)) {
      console.error("[Parent Routes] Invalid ObjectId format:", studentUserId);
      throw createError("Invalid student ID format", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(parentUserId)) {
      console.error(
        "[Parent Routes] Invalid parent ObjectId format:",
        parentUserId,
      );
      throw createError("Invalid parent ID format", 400);
    }

    const parentObjectId = new mongoose.Types.ObjectId(parentUserId);
    const studentObjectId = new mongoose.Types.ObjectId(studentUserId);

    console.log(
      "[Parent Routes] Created ObjectIds - parent:",
      parentObjectId,
      "student:",
      studentObjectId,
    );

    try {
      // Check if student actually exists
      const student = await User.findById(studentObjectId);
      if (!student) {
        console.warn("[Parent Routes] Student not found:", studentObjectId);
        throw createError("Student not found with this ID", 404);
      }
      console.log("[Parent Routes] Student found:", student.name);

      // Check if link already exists
      const existingLink = await ParentAccess.findOne({
        parentUserId: parentObjectId,
        studentUserId: studentObjectId,
      });

      if (existingLink) {
        console.warn("[Parent Routes] Link already exists");
        throw createError("This child is already linked to your account", 409);
      }

      // Create the link
      console.log("[Parent Routes] Creating ParentAccess record...");
      const link = await ParentAccess.create({
        parentUserId: parentObjectId,
        studentUserId: studentObjectId,
        relationship: relationship || "child",
      });

      console.log("[Parent Routes] Link created successfully:", link);
      res.status(201).json({ success: true, data: link });
    } catch (error: any) {
      console.error("[Parent Routes] Error creating link:", error.message);
      console.error("[Parent Routes] Full error:", error);
      throw error;
    }
  }),
);

// Unlink parent from student
router.delete(
  "/unlink/:studentId",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parentUserId = req.user?.id;
    const { studentId } = req.params;

    console.log("[Parent Routes] /unlink endpoint called");
    console.log("[Parent Routes] parentUserId:", parentUserId);
    console.log("[Parent Routes] studentId:", studentId);

    if (!studentId) {
      throw createError("studentId is required", 400);
    }

    if (!parentUserId) {
      throw createError("Parent ID is required", 400);
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.error("[Parent Routes] Invalid ObjectId format:", studentId);
      throw createError("Invalid student ID format", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(parentUserId)) {
      console.error(
        "[Parent Routes] Invalid parent ObjectId format:",
        parentUserId,
      );
      throw createError("Invalid parent ID format", 400);
    }

    const parentObjectId = new mongoose.Types.ObjectId(parentUserId);
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    console.log("[Parent Routes] Looking for ParentAccess to delete...");

    // Find and delete the link
    const result = await ParentAccess.findOneAndDelete({
      parentUserId: parentObjectId,
      studentUserId: studentObjectId,
    });

    if (!result) {
      console.warn("[Parent Routes] No link found to delete");
      throw createError("This child is not linked to your account", 404);
    }

    console.log("[Parent Routes] Link deleted successfully");
    res.json({
      success: true,
      message: "Child unlinked successfully",
      data: result,
    });
  }),
);

// Get child's insights (any authenticated user can view)
// In a production system, you'd want to add proper parent-student linking
router.get(
  "/insights/:studentId",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    console.log(
      `[Parent API] /insights endpoint called with studentId:`,
      studentId,
    );

    // Validate studentId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.error(`[Parent API] Invalid ObjectId format: ${studentId}`);
      throw createError("Invalid student ID format", 400);
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    console.log(`[Parent API] Converted to ObjectId: ${studentObjectId}`);

    // Check if student profile exists by userId (studentId is the user ID)
    let profile = await StudentProfile.findOne({ userId: studentObjectId });
    console.log(
      `[Parent API] StudentProfile lookup result:`,
      profile ? "Found" : "Not Found",
    );

    // If profile doesn't exist, create a basic one with valid defaults
    if (!profile) {
      console.log(
        `[Parent Routes] StudentProfile not found for ${studentId}, creating one...`,
      );
      try {
        profile = new StudentProfile({
          userId: studentObjectId,
          classLevel: "Class 6", // Valid enum default
          subjects: [],
          board: "CBSE",
          preferredLanguage: "English",
          learningStyle: "reading",
          studyGoalMinutes: 60,
        });
        await profile.save();
        console.log(
          `[Parent Routes] StudentProfile created successfully for ${studentId}`,
        );
      } catch (profileError) {
        console.error(
          `[Parent Routes] Error creating profile for ${studentId}:`,
          profileError,
        );
        throw createError("Failed to create student profile", 500);
      }
    }

    // Fetch user data (name, email)
    const user = await User.findById(studentObjectId).select("name email");
    console.log(`[Parent API] User found:`, user);

    if (!user) {
      console.error(`[Parent API] User not found for ID: ${studentObjectId}`);
      throw createError("User not found", 404);
    }

    // Get study data for the student
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [studyLogs, weakTopics] = await Promise.all([
      StudyLog.find({ userId: studentObjectId, createdAt: { $gte: weekAgo } }),
      WeakTopic.find({ userId: studentObjectId, needsRevision: true }),
    ]);
    console.log(`[Parent API] Found ${studyLogs?.length || 0} study logs`);

    res.json({
      success: true,
      data: {
        profile: {
          ...profile.toObject(),
          name: user?.name || "Unknown",
          email: user?.email || "",
        },
        studyLogs,
        weakTopics,
      },
    });
    console.log(`[Parent API] Successfully returned insights for ${studentId}`);
  }),
);

// Get all linked students for this parent
router.get(
  "/students",
  authorize("parent", "admin"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parentUserId = req.user?.id;
    const parentObjectId = new mongoose.Types.ObjectId(parentUserId);
    const links = await ParentAccess.find({
      parentUserId: parentObjectId,
      isApproved: true,
    }).populate("studentUserId", "name email");
    const students = links.map((l: any) => ({
      id: (l.studentUserId as any)._id,
      name: (l.studentUserId as any).name,
      email: (l.studentUserId as any).email,
    }));
    res.json({ success: true, data: students });
  }),
);

export default router;
