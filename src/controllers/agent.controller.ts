import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { AIOrchestrator, AgentType } from "../agents/orchestrator";
import { StudentProfile } from "../models/StudentProfile.model";
import { StudyLog } from "../models/StudyLog.model";
import { WeakTopic } from "../models/WeakTopic.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { cacheService } from "../services/cache.service";
import {
  generatePredefinedMentorMessage,
  generatePredefinedDailyTasks,
} from "../services/predefinedMessages.service";

export const dispatchAgent = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      agentType,
      subject,
      topic,
      content,
      mode,
      additionalContext,
      imageBase64,
      mimeType,
      question,
      language,
    } = req.body;
    const userId = req.user?.id;

    // Debug logging
    logger.info(`[dispatchAgent] Received language parameter: ${language}`);
    logger.info(
      `[dispatchAgent] Full request body keys: ${Object.keys(req.body).join(", ")}`,
    );
    logger.info(
      `[dispatchAgent] Full request body: ${JSON.stringify(req.body)}`,
    );

    if (!userId) throw createError("Unauthorized", 401);
    if (!agentType) throw createError("Agent type is required", 400);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const profile = await StudentProfile.findOne({ userId: userObjectId });

    // Ensure profile exists with defaults
    if (!profile) {
      throw createError(
        "Student profile not found. Please complete your profile setup.",
        404,
      );
    }

    const agentInput = {
      userId,
      classLevel: profile?.classLevel || "Class 6",
      board: profile?.board || "CBSE",
      preferredLanguage: profile?.preferredLanguage || "English",
      subject,
      topic,
      content,
      mode,
      question,
      imageBase64,
      mimeType,
      additionalContext: {
        ...(additionalContext || {}),
        language: language || "english",
      },
    };

    const result = await AIOrchestrator.dispatch(
      agentType as AgentType,
      agentInput,
    );

    logger.info(
      `[dispatchAgent] Agent response - success: ${result.success}, agent: ${result.agentName}`,
    );

    if (!result.success) {
      logger.error(`[Agent Error] ${agentType} failed: ${result.error}`);
      throw createError(result.error || "Agent processing failed", 500);
    }

    // Log usage
    if (subject && topic) {
      await StudyLog.create({
        userId: userObjectId,
        subject,
        topic,
        moduleUsed: agentType,
        agentUsed: result.agentName,
        inputSummary: content?.substring(0, 200),
        outputSummary: JSON.stringify(result.data).substring(0, 200),
        scoreEarned: 5,
        durationMinutes: Math.ceil(result.processingTime / 60000) || 1,
      });
    }

    res.json({
      success: true,
      agentName: result.agentName,
      data: result.data,
      processingTime: result.processingTime,
    });
  },
);

/**
 * getDailyFlow - Returns predefined mentor message + daily tasks
 * Uses template-based messages instead of AI to:
 * - Eliminate API calls
 * - Improve response speed
 * - Provide consistent, high-quality messages
 * Uses 24-hour cache to avoid regenerating messages unnecessarily
 */
export const getDailyFlow = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ── Check cache first (TTL: 24 hours) ──
    const cacheKey = `daily-flow:${userId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      logger.info(`[getDailyFlow] Serving from cache for user ${userId}`);
      res.json({
        success: true,
        data: cached,
        fromCache: true,
        processingTime: 0,
      });
      return;
    }

    const start = Date.now();

    try {
      const profile = await StudentProfile.findOne({ userId: userObjectId });
      if (!profile) {
        throw createError(
          "Student profile not found. Please complete your profile setup.",
          404,
        );
      }

      // Extract student name (before @ in email)
      const studentName = req.user?.email?.split("@")[0] || "Student";

      // Generate predefined mentor message (no AI call needed)
      const mentorMessage = generatePredefinedMentorMessage({
        studentName,
        streakDays: profile?.streakDays || 0,
        classLevel: profile?.classLevel || "Class 10",
        board: profile?.board || "ICSE",
      });

      // Generate predefined daily tasks (no AI call needed)
      const dailyTasks = generatePredefinedDailyTasks({
        subjects: profile?.subjects || ["Maths", "Science", "English"],
        classLevel: profile?.classLevel || "Class 10",
        availableMinutes: 60,
      });

      const responseData = {
        mentor: mentorMessage,
        tasks: dailyTasks,
      };

      // ── Cache the response for 24 hours ──
      cacheService.set(cacheKey, responseData, 86400); // 24 hours
      logger.info(
        `[getDailyFlow] Generated predefined message for user ${userId} in ${Date.now() - start}ms`,
      );

      res.json({
        success: true,
        data: responseData,
        fromCache: false,
        processingTime: Date.now() - start,
      });
    } catch (error) {
      logger.error(
        `[getDailyFlow] Error generating predefined message: ${error}`,
      );

      // Try to serve stale cache as fallback
      const staleCache = cacheService.get(cacheKey);
      if (staleCache) {
        res.json({
          success: true,
          data: staleCache,
          fromCache: true,
          isStale: true,
          message: "Serving from cache due to error",
          processingTime: Date.now() - start,
        });
        return;
      }

      throw error;
    }
  },
);

/**
 * getFreshDailyFlow - Force refresh of predefined message (bypasses cache)
 * Use this for explicit refresh requests
 */
export const getFreshDailyFlow = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const start = Date.now();

    // Clear cache to force refresh
    const cacheKey = `daily-flow:${userId}`;
    cacheService.delete(cacheKey);

    const profile = await StudentProfile.findOne({ userId: userObjectId });
    if (!profile) {
      throw createError(
        "Student profile not found. Please complete your profile setup.",
        404,
      );
    }

    // Extract student name (before @ in email)
    const studentName = req.user?.email?.split("@")[0] || "Student";

    // Generate predefined mentor message (no AI call needed)
    const mentorMessage = generatePredefinedMentorMessage({
      studentName,
      streakDays: profile?.streakDays || 0,
      classLevel: profile?.classLevel || "Class 10",
      board: profile?.board || "ICSE",
    });

    // Generate predefined daily tasks (no AI call needed)
    const dailyTasks = generatePredefinedDailyTasks({
      subjects: profile?.subjects || ["Maths", "Science", "English"],
      classLevel: profile?.classLevel || "Class 10",
      availableMinutes: 60,
    });

    const responseData = {
      mentor: mentorMessage,
      tasks: dailyTasks,
    };

    // Cache the response for 24 hours
    cacheService.set(cacheKey, responseData, 86400);
    logger.info(
      `[getFreshDailyFlow] Generated fresh predefined message for user ${userId}`,
    );

    res.json({
      success: true,
      data: responseData,
      fromCache: false,
      processingTime: Date.now() - start,
    });
  },
);
