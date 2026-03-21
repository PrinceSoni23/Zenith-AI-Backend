import { Request, Response } from "express";
import { User } from "../models/User.model";
import { StudentProfile } from "../models/StudentProfile.model";
import { logger } from "../utils/logger";

/**
 * Development utility controller for testing and debugging
 */

export const createDummyStudent = async (req: Request, res: Response) => {
  try {
    // Create a test user
    const email = `test-student-${Date.now()}@example.com`;
    const user = new User({
      email,
      password: "TestPassword123!",
      role: "student",
      isEmailVerified: true,
    });

    await user.save();

    // Create associated student profile
    const studentProfile = new StudentProfile({
      userId: user._id,
      classLevel: "10th Grade",
      board: "CBSE",
      subjects: ["Mathematics", "Science", "English"],
      profilePicture: "https://via.placeholder.com/150",
      bio: "Test student",
    });

    await studentProfile.save();

    logger.info(`✅ Created dummy student: ${email}`);

    res.json({
      success: true,
      message: "Dummy student created successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      studentProfile: {
        id: studentProfile._id,
        classLevel: studentProfile.classLevel,
        board: studentProfile.board,
      },
    });
  } catch (error) {
    logger.error("❌ Error creating dummy student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create dummy student",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const clearDummyData = async (req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is not available in production",
      });
    }

    // Delete test users (email contains 'test-student')
    const result = await User.deleteMany({
      email: { $regex: "test-student" },
    });

    logger.info(`🧹 Cleared ${result.deletedCount} dummy users`);

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} dummy records`,
    });
  } catch (error) {
    logger.error("❌ Error clearing dummy data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear dummy data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
