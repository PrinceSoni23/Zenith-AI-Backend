import { Router, Response } from "express";
import { User } from "../models/User.model";
import { Parent } from "../models/Parent.model";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { devEndpointLimiter } from "../middleware/rateLimiter.advanced";

const router = Router();

/**
 * ADMIN ONLY - Migrate parent accounts from User collection to Parent collection
 * This endpoint should be called once after deploying the new Parent model
 */
router.post(
  "/migrate-parents",
  devEndpointLimiter,
  asyncHandler(async (_req, res: Response) => {
    console.log("[Migration] Starting parent migration...");

    // Find all parent accounts in User collection
    const parents = await User.find({ role: "parent" });
    console.log(
      `[Migration] Found ${parents.length} parent accounts to migrate`,
    );

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const parentUser of parents) {
      try {
        // Check if already exists in Parent collection
        const existing = await Parent.findOne({ email: parentUser.email });

        if (existing) {
          console.log(
            `[Migration] Skipping - already exists: ${parentUser.email}`,
          );
          skippedCount++;
          continue;
        }

        // Create parent in Parent collection
        // Important: Use create with validateBeforeSave to avoid re-hashing
        const newParent = new Parent({
          name: parentUser.name,
          email: parentUser.email,
          password: parentUser.password, // Already hashed, don't hash again
          isActive: parentUser.isActive,
          lastLogin: parentUser.lastLogin,
          createdAt: parentUser.createdAt,
          updatedAt: parentUser.updatedAt,
        });

        // Save without pre-hooks to preserve hashed password
        await newParent.save({ validateBeforeSave: false });

        console.log(
          `[Migration] Migrated: ${parentUser.email} (${newParent._id})`,
        );
        migratedCount++;

        // Optional: Delete from User collection (commented out for safety)
        // await User.deleteOne({ _id: parentUser._id });
      } catch (error) {
        console.error(
          `[Migration] Error migrating ${parentUser.email}:`,
          error,
        );
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: "Migration completed",
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: parents.length,
    });
  }),
);

/**
 * Check migration status
 */
router.get(
  "/migration-status",
  asyncHandler(async (_req, res: Response) => {
    const parentsInUserCollection = await User.countDocuments({
      role: "parent",
    });
    const parentsInParentCollection = await Parent.countDocuments();

    res.json({
      success: true,
      data: {
        parentsInUserCollection,
        parentsInParentCollection,
        migrationNeeded: parentsInUserCollection > 0,
      },
    });
  }),
);

export default router;
