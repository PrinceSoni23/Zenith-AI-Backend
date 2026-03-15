import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { AIOrchestrator, AgentType } from "../agents/orchestrator";
import { StudentProfile } from "../models/StudentProfile.model";
import { StudyLog } from "../models/StudyLog.model";
import { WeakTopic } from "../models/WeakTopic.model";
import { asyncHandler, createError } from "../middleware/errorHandler";

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
    } = req.body;
    const userId = req.user?.id;

    if (!userId) throw createError("Unauthorized", 401);
    if (!agentType) throw createError("Agent type is required", 400);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const profile = await StudentProfile.findOne({ userId: userObjectId });

    const agentInput = {
      userId,
      classLevel: profile?.classLevel,
      board: profile?.board,
      preferredLanguage: profile?.preferredLanguage,
      subject,
      topic,
      content,
      mode,
      question,
      imageBase64,
      mimeType,
      additionalContext: additionalContext || {},
    };

    const result = await AIOrchestrator.dispatch(
      agentType as AgentType,
      agentInput,
    );

    if (!result.success) {
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

export const getDailyFlow = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const profile = await StudentProfile.findOne({ userId: userObjectId });
    const weakTopics = await WeakTopic.find({
      userId: userObjectId,
      needsRevision: true,
    }).limit(5);

    const agentInput = {
      userId,
      classLevel: profile?.classLevel,
      board: profile?.board,
      preferredLanguage: profile?.preferredLanguage,
      additionalContext: {
        studentName: req.user?.email?.split("@")[0],
        weakTopics: weakTopics.map(w => `${w.subject}: ${w.topic}`),
        streakDays: profile?.streakDays || 0,
        studyScore: profile?.studyScore || 0,
        subjects: profile?.subjects,
        availableMinutes: 60,
      },
    };

    const result = await AIOrchestrator.runDailyFlow(agentInput);

    res.json({
      success: true,
      data: {
        mentor: result.mentorMessage.data,
        tasks: result.dailyTasks.data,
      },
    });
  },
);
