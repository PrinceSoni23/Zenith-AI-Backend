import { Request, Response, NextFunction } from "express";
import { rateLimitMonitor } from "../services/rateLimitMonitor";
import { isIPBlacklisted, isIPWhitelisted } from "../services/limiter.service";
import { logger } from "../utils/logger";

interface RateLimitRequest extends Request {
  user?: { id: string; role: string; email: string };
  rateLimit?: { resetTime: number };
}

/**
 * IP-level blocking middleware
 * Checks blacklist/whitelist before processing request
 * Prevents known attackers from consuming resources
 */
export async function ipBlockingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Check whitelist first
    if (await isIPWhitelisted(ip)) {
      return next();
    }

    // Check blacklist
    if (await isIPBlacklisted(ip)) {
      logger.warn(`Blocked request from blacklisted IP: ${ip}`);
      res.status(403).json({
        success: false,
        message: "Your IP has been temporarily blocked. Contact support.",
      });
      return;
    }

    next();
  } catch (error) {
    logger.error("Error in IP blocking middleware:", error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
}

/**
 * Rate limit monitoring middleware
 * Logs violations and detects suspicious patterns
 */
export async function rateLimitMonitoringMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Store original send function
  const originalSend = res.send;

  // Override send to intercept response
  res.send = function (data: any) {
    // Check if this was a rate limit response (429 status)
    if (res.statusCode === 429) {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const rateLimitReq = req as RateLimitRequest;
      const userId = rateLimitReq.user?.id;
      const endpoint = req.path;

      // Record the violation
      rateLimitMonitor.recordViolation(ip, userId, endpoint);

      // Detect patterns
      rateLimitMonitor.detectBruteForcePattern(ip);
      if (userId) {
        rateLimitMonitor.detectSpamPattern(userId, endpoint);
      }
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Enhanced rate limit middleware with monitoring
 * Wraps express-rate-limit with additional checks
 */
export function createMonitoredRateLimiter(
  baseRateLimiter: any,
  options: {
    shouldDetectDDoS?: boolean;
    shouldDetectBruteForce?: boolean;
    endpointDescription?: string;
  } = {},
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Check IP blacklist/whitelist first
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (await isIPBlacklisted(ip)) {
      res.status(403).json({
        success: false,
        message: "Your IP has been blocked.",
      });
      return;
    }

    // Apply base rate limiter
    baseRateLimiter(req, res, async () => {
      // Detect patterns if enabled
      if (options.shouldDetectBruteForce) {
        await rateLimitMonitor.detectBruteForcePattern(ip);
      }

      if (options.shouldDetectDDoS) {
        await rateLimitMonitor.detectDDoSPattern(req.path);
      }

      next();
    });
  };
}

/**
 * Adaptive rate limiting middleware
 * Adjusts limits based on system load
 */
export function adaptiveRateLimitMiddleware(baseLimiter: any) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Get current system load (simplified example)
    const currentLoad = Math.random(); // In real app, use os.loadavg()

    if (currentLoad > 0.9) {
      // Critical load: deny requests with higher rate
      logger.warn(
        `High system load: ${currentLoad.toFixed(2)}. Tightening limits.`,
      );
    }

    // Apply rate limiter
    baseLimiter(req, res, next);
  };
}

/**
 * Graceful degradation middleware
 * If rate limit is hit, queue request instead of immediate rejection
 */
export function gracefulDegradationMiddleware(baseLimiter: any) {
  const requestQueue = new Map<string, any[]>();
  const maxQueueSize = 100;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const rateLimitReq = req as RateLimitRequest;
    const key = rateLimitReq.user?.id || req.ip || "unknown";

    baseLimiter(req, res, (error?: any) => {
      if (res.statusCode === 429) {
        // Rate limited - add to queue
        if (!requestQueue.has(key)) {
          requestQueue.set(key, []);
        }

        const queue = requestQueue.get(key)!;
        if (queue.length < maxQueueSize) {
          queue.push({ req, res, next });
          res.status(202).json({
            success: false,
            message: "Request queued. You will be processed shortly.",
            queuePosition: queue.length,
          });

          // Process queue items with delay
          setTimeout(
            () => {
              const item = queue.shift();
              if (item) {
                next();
              }
            },
            Math.random() * 5000 + 1000,
          ); // Random delay 1-6 seconds
        } else {
          // Queue full, reject
          res.status(429).json({
            success: false,
            message: "System overloaded. Please try again in a few moments.",
          });
        }
      } else {
        next();
      }
    });
  };
}
