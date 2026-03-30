import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { AIOrchestrator, AgentType } from "../agents/orchestrator";
import { StudentProfile } from "../models/StudentProfile.model";
import { StudyLog } from "../models/StudyLog.model";
import { WeakTopic } from "../models/WeakTopic.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { redisCacheService } from "../services/redis.cache.service";
import { requestTracker } from "../services/requestTracker.service";
import {
  generatePredefinedMentorMessage,
  generatePredefinedDailyTasks,
} from "../services/predefinedMessages.service";

/**
 * Generate cache key for agent dispatch
 * Ensures identical questions use the same cache entry
 * @param agentType - Type of agent (e.g., "question-generator", "maths-solver")
 * @param params - Request parameters to generate key from
 * @returns Cache key string
 */
const generateAgentCacheKey = (
  agentType: string,
  params: Record<string, any>,
): string => {
  // Create a deterministic key from sorted parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${JSON.stringify(params[k])}`)
    .join("|");

  return `agent:${agentType}:${sortedParams}`;
};

/**
 * TTL configuration for different agent types (in seconds)
 * Question answers can be cached longer since they're static
 */
const AGENT_CACHE_TTL: Record<string, number> = {
  "question-generator": 86400, // 24 hours - questions don't change
  "maths-solver": 86400, // 24 hours
  "class-translator": 86400, // 24 hours
  "writing-coach": 43200, // 12 hours
  mentor: 3600, // 1 hour - more personal
  "smart-notes": 86400, // 24 hours
  revision: 43200, // 12 hours
  "story-mode": 86400, // 24 hours
  "study-planner": 3600, // 1 hour - personalized
};

/**
 * Type for cached agent response
 */
interface CachedAgentResponse {
  agentName: string;
  data: any;
  isFallback?: boolean;
}

/**
 * Validate if response data is worth caching
 * Prevents caching errors, empty responses, or fallback text
 */
const isValidResponseForCache = (result: any): boolean => {
  // If result itself is null/undefined
  if (!result) return false;

  // Don't cache fallback responses (check at result level, not data level)
  if (result.isFallback === true) {
    console.log(
      "⚠️ NOT storing fallback response (AI failed to generate content)",
    );
    return false;
  }

  const data = result.data;
  if (!data) return false;

  // Empty object
  if (typeof data === "object" && Object.keys(data).length === 0) {
    return false;
  }

  // Empty array
  if (Array.isArray(data) && data.length === 0) {
    return false;
  }

  // Empty string
  if (typeof data === "string" && (!data || data.trim().length === 0)) {
    return false;
  }

  // Check for common error indicators
  if (typeof data === "object" && data !== null) {
    // If response has error field, don't cache
    if (data.error || data.isError) return false;

    // If all values are empty, don't cache
    const values = Object.values(data);
    if (values.every(v => !v || (Array.isArray(v) && v.length === 0))) {
      return false;
    }
  }

  return true;
};

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
      preferredLanguage,
      language,
      questionsPerLevel,
      skipCache,
    } = req.body;
    const userId = req.user?.id;

    // Debug logging
    logger.info(
      `[dispatchAgent] Received preferredLanguage parameter: ${preferredLanguage}`,
    );
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

    // Prioritize page-level language selection over dashboard setting
    // language (from page dropdown) > preferredLanguage (from request) > profile setting > default
    const finalLanguage =
      language || preferredLanguage || profile?.preferredLanguage || "english";

    // ── CACHE LOOKUP ──
    // Generate cache key based on agent type and parameters
    const cacheParams = {
      agentType,
      subject,
      topic,
      content,
      mode,
      question,
      questionsPerLevel,
      finalLanguage,
    };

    // Check cache if not explicitly skipped
    if (!skipCache) {
      const cached = await redisCacheService.get<CachedAgentResponse>(
        agentType,
        cacheParams,
      );
      if (cached && !cached.isFallback) {
        // Track this cache hit request
        requestTracker.trackRequest(agentType, true);

        logger.info(`[dispatchAgent] Cache HIT for ${agentType}`);
        res.json({
          success: true,
          agentName: cached.agentName,
          isFallback: cached.isFallback,
          data: cached.data,
          processingTime: 0,
          fromCache: true,
          cacheStats: await redisCacheService.getStats(),
          requestStats: requestTracker.getStats(),
        });
        return;
      }
    }

    logger.info(`[dispatchAgent] Cache MISS for ${agentType}, calling API...`);

    // Track this cache miss request (AI will be called)
    requestTracker.trackRequest(agentType, false);

    const agentInput = {
      userId,
      classLevel: profile?.classLevel || "Class 6",
      board: profile?.board || "CBSE",
      preferredLanguage: finalLanguage,
      subject,
      topic,
      content,
      mode,
      question,
      imageBase64,
      mimeType,
      additionalContext: {
        ...(additionalContext || {}),
        language: finalLanguage,
        questionsPerLevel,
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

    // ── CACHE STORAGE ──
    // Store result in cache with appropriate TTL
    // Only cache if response is valid (not empty/error/fallback)
    if (isValidResponseForCache(result)) {
      const ttl = AGENT_CACHE_TTL[agentType] || 3600; // Default 1 hour
      if (!result.isFallback) {
        await redisCacheService.set(
          agentType,
          cacheParams,
          {
            agentName: result.agentName,
            data: result.data,
            isFallback: result.isFallback,
          },
          ttl,
        );
      }

      logger.info(
        `[dispatchAgent] ✅ Cached valid result for ${agentType} (TTL: ${ttl}s)`,
      );
    } else {
      logger.warn(
        `[dispatchAgent] ⚠️ NOT caching invalid/empty response for ${agentType}. Data will not be reused.`,
      );
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
      isFallback: result.isFallback,
      data: result.data,
      processingTime: result.processingTime,
      fromCache: false,
      requestStats: requestTracker.getStats(),
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
    const cached = await redisCacheService.get("daily-flow", { userId });
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
      await redisCacheService.set(
        "daily-flow",
        { userId },
        responseData,
        86400,
      ); // 24 hours
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
      const staleCache = await redisCacheService.get("daily-flow", { userId });
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
    await redisCacheService.invalidateAgent("daily-flow");

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
    await redisCacheService.set("daily-flow", { userId }, responseData, 86400);
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
