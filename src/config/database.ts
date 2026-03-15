import mongoose from "mongoose";
import { logger } from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  const mongoUri =
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/ai_learning_companion";

  try {
    await mongoose.connect(mongoUri);
    logger.info("✅ MongoDB connected successfully");

    mongoose.connection.on("error", err => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};
