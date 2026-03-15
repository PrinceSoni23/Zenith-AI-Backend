import { Router, Response } from "express";
import mongoose from "mongoose";
import axios, { AxiosError } from "axios";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { AIOrchestrator } from "../agents/orchestrator";
import { StudentProfile } from "../models/StudentProfile.model";
import { WeakTopic } from "../models/WeakTopic.model";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_API_URL =
  process.env.NVIDIA_API_URL ||
  "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";

const router = Router();
router.use(authenticate);

router.get(
  "/message",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [profile, weakTopics] = await Promise.all([
      StudentProfile.findOne({ userId: userObjectId }),
      WeakTopic.find({ userId: userObjectId, needsRevision: true }).limit(3),
    ]);

    const result = await AIOrchestrator.dispatch("mentor", {
      userId,
      classLevel: profile?.classLevel,
      board: profile?.board,
      preferredLanguage: profile?.preferredLanguage,
      additionalContext: {
        streakDays: profile?.streakDays || 0,
        studyScore: profile?.studyScore || 0,
        weakSubjects: weakTopics.map(w => w.subject),
      },
    });

    res.json({ success: true, data: result.data });
  }),
);

// ── Mentor Chat ──────────────────────────────────────────────────────────────
// POST /mentor/chat
// Body: { messages: Array<{ role: "user"|"assistant", content: string }> }
// Streams back plain text using Server-Sent Events so the reply appears word-by-word
router.post(
  "/chat",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { messages } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw createError("messages array is required", 400);
    }

    // Fetch student profile for personalised context
    const [profile, weakTopics] = await Promise.all([
      StudentProfile.findOne({ userId: userObjectId }),
      WeakTopic.find({ userId: userObjectId, needsRevision: true }).limit(5),
    ]);

    const systemPrompt = `You are an empathetic, supportive AI Mentor for school students.
Your role is to have natural, warm conversations — like a wise elder sibling or trusted teacher.
You help students with:
- Academic problems (explaining concepts, homework help, exam prep)
- Emotional and motivational support (stress, anxiety, feeling overwhelmed)
- Study strategies and planning
- Career and subject guidance
- Any problem they want to talk through

Student Profile:
- Name: ${profile?.userId || "Student"}
- Class: ${profile?.classLevel || "Not specified"}
- Board: ${profile?.board || "CBSE"}
- Language: ${profile?.preferredLanguage || "English"}
- Study score: ${profile?.studyScore || 0} points
- Streak: ${profile?.streakDays || 0} days
- Weak topics: ${weakTopics.map(w => `${w.subject} - ${w.topic}`).join(", ") || "None"}

Guidelines:
- Be conversational, warm, and encouraging — never robotic or overly formal
- Keep replies concise (2-4 short paragraphs max) unless the student asks for detail
- Use emojis sparingly but naturally to feel friendly
- If the student seems stressed or sad, acknowledge their feelings FIRST before giving advice
- Always end with a gentle question or encouragement to keep the conversation going
- Respond in the same language the student is using`;

    // Set SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      const headers = {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      const payload = {
        model: NVIDIA_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 600,
        temperature: 0.8,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stream: false,
      };

      const response = await axios.post(NVIDIA_API_URL, payload, {
        headers,
        responseType: "json",
        timeout: 30000,
      });

      const content = response.data?.choices?.[0]?.message?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ delta: content })}\n\n`);
      } else {
        res.write(
          `data: ${JSON.stringify({ delta: "Sorry, I didn't get a response. Please try again 🙏" })}\n\n`,
        );
      }
    } catch (err: unknown) {
      let errorMsg =
        "Sorry, I'm having trouble connecting right now. Please try again in a moment 🙏";

      if ((err as AxiosError).response) {
        const axiosErr = err as AxiosError;
        console.error(
          `[NVIDIA API Error]:`,
          `Status: ${axiosErr.response?.status}, Data: ${JSON.stringify(axiosErr.response?.data)}`,
        );
      } else if (err instanceof Error) {
        console.error(`[NVIDIA API Error]:`, err.message);
      }

      res.write(`data: ${JSON.stringify({ delta: errorMsg })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  }),
);

export default router;
