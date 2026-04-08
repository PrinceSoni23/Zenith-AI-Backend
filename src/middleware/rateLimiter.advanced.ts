import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedisClient } from "../config/redis.config";
import { logger } from "../utils/logger";
import { Request } from "express";

interface RateLimitRequest extends Request {
  user?: { id: string; role: string; email: string };
  rateLimit?: { resetTime: number };
}

/**
 * Helper to create a rate limiter with conditional Redis store
 * Lazily evaluates Redis connection to avoid race conditions
 * Falls back to in-memory for localhost (NODE_ENV === 'development')
 * Uses Redis for production after connection is established
 */
function createRateLimitStore(prefix: string) {
  const redisClient = getRedisClient();
  // Only use Redis in production (NODE_ENV !== 'development')
  if (redisClient && process.env.NODE_ENV !== "development") {
    return new RedisStore({
      // @ts-ignore - rate-limit-redis expects client property
      client: redisClient,
      prefix,
    } as any);
  }
  // Use in-memory store for localhost/development
  return undefined;
}

/**
 * GLOBAL RATE LIMITING
 * Applies to all requests across the application
 * Prevents mass attacks and resource exhaustion
 */
export const globalRateLimiter = rateLimit({
  store: createRateLimitStore("rl:global:"),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  handler: (req, res) => {
    logger.warn(`Global rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later.",
      retryAfter: (req as RateLimitRequest).rateLimit?.resetTime,
    });
  },
});

/**
 * AUTHENTICATION ENDPOINTS
 * Strict limits for login/register to prevent brute force attacks
 * 5 attempts per 5 minutes per IP
 */
export const authRateLimiter = rateLimit({
  store: createRateLimitStore("rl:auth:"),
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Only 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again in 5 minutes.",
  },
  handler: (req, res) => {
    logger.warn(
      `Auth rate limit exceeded for IP: ${req.ip}, endpoint: ${req.path}`,
    );
    res.status(429).json({
      success: false,
      message:
        "Too many authentication attempts. Please try again in 5 minutes.",
      retryAfter: (req as RateLimitRequest).rateLimit?.resetTime,
    });
  },
});

/**
 * AI AGENT DISPATCH LIMITER
 * Protects expensive AI operations (mentor message, study plan generation)
 * 30 requests per hour for authenticated users
 * Prevents abuse of AI/GPU resources
 */
export const aiAgentRateLimiter = rateLimit({
  store: createRateLimitStore("rl:ai-agent:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    // Rate limit by user ID (authenticated only)
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message:
      "You've reached your daily AI agent limit. Please try again in 1 hour.",
  },
  handler: (req, res) => {
    const rateLimitReq = req as RateLimitRequest;
    logger.warn(
      `AI agent rate limit exceeded for user: ${rateLimitReq.user?.id}`,
    );
    res.status(429).json({
      success: false,
      message:
        "You've reached your daily AI agent limit. Please try again in 1 hour.",
      retryAfter: rateLimitReq.rateLimit?.resetTime,
    });
  },
});

/**
 * STUDY LOG CREATION LIMITER
 * Prevents spam of study log entries
 * 50 per hour (reasonable for active studying)
 */
export const studyLogRateLimiter = rateLimit({
  store: createRateLimitStore("rl:study-log:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Too many study log entries. Please try again in 1 hour.",
  },
});

/**
 * NOTES CRUD LIMITER
 * Prevents spam posting/editing notes
 * 40 per hour
 */
export const notesRateLimiter = rateLimit({
  store: createRateLimitStore("rl:notes:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Too many note operations. Please try again in 1 hour.",
  },
});

/**
 * DASHBOARD LIMITER
 * 60 requests per hour (typical user refreshes 2-4 times/day)
 */
export const dashboardRateLimiter = rateLimit({
  store: createRateLimitStore("rl:dashboard:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Dashboard request limit exceeded. Please wait before refreshing.",
  },
});

/**
 * PROFILE UPDATE LIMITER
 * Prevents spam profile updates
 * 20 per hour (typical: 1-2 updates/day)
 */
export const profileUpdateRateLimiter = rateLimit({
  store: createRateLimitStore("rl:profile-update:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Too many profile updates. Please try again in 1 hour.",
  },
});

/**
 * QUESTIONS & SEARCH LIMITER
 * Higher limit for read-only operations
 * 100 per hour (users browse many questions)
 */
export const questionsRateLimiter = rateLimit({
  store: createRateLimitStore("rl:questions:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Too many question requests. Please try again in 1 hour.",
  },
});

/**
 * PARENT PORTAL LIMITER
 * 60 per hour (parents check periodically)
 */
export const parentPortalRateLimiter = rateLimit({
  store: createRateLimitStore("rl:parent-portal:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Too many requests. Parent portal limit exceeded.",
  },
});

/**
 * LEADERBOARD LIMITER
 * High limit for read operations
 * Can be cached on frontend to reduce actual requests
 */
export const leaderboardRateLimiter = rateLimit({
  store: createRateLimitStore("rl:leaderboard:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 150, // Higher for read-only
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Leaderboard request limit exceeded. Try again in 1 hour.",
  },
});

/**
 * MIGRATION/DEV ENDPOINTS LIMITER
 * Very strict - should rarely be used in production
 * 10 per hour
 */
export const devEndpointLimiter = rateLimit({
  store: createRateLimitStore("rl:dev:"),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Dev endpoint limit exceeded.",
  },
});

/**
 * PASSWORD CHANGE LIMITER
 * Very strict - security sensitive
 * 3 attempts per 24 hours
 */
export const passwordChangeLimiter = rateLimit({
  store: createRateLimitStore("rl:password-change:"),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const rateLimitReq = req as RateLimitRequest;
    return rateLimitReq.user?.id || req.ip || "unknown";
  },
  message: {
    success: false,
    message: "Too many password change attempts. Try again in 24 hours.",
  },
});
