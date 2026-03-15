import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth.middleware";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { AIOrchestrator } from "../agents/orchestrator";
import { StudentProfile } from "../models/StudentProfile.model";
import { WeakTopic } from "../models/WeakTopic.model";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "stepfun/step-3.5-flash:free",
  "z-ai/glm-4.5-air:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "qwen/qwen3-coder:free",
];

const router = Router();
router.use(authenticate);

router.get(
  "/message",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError("Unauthorized", 401);

    const [profile, weakTopics] = await Promise.all([
      StudentProfile.findOne({ userId }),
      WeakTopic.find({ userId, needsRevision: true }).limit(3),
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

    const { messages } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw createError("messages array is required", 400);
    }

    // Fetch student profile for personalised context
    const [profile, weakTopics] = await Promise.all([
      StudentProfile.findOne({ userId }),
      WeakTopic.find({ userId, needsRevision: true }).limit(5),
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

    const primaryModel = process.env.OPENAI_MODEL || FREE_MODELS[0];
    const allModels = [
      primaryModel,
      ...FREE_MODELS.filter(m => m !== primaryModel),
    ];

    let streamed = false;
    for (const model of allModels) {
      try {
        const stream = await openai.chat.completions.create({
          model,
          stream: true,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 600,
          temperature: 0.8,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        }
        streamed = true;
        break;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("429") ||
          msg.includes("404") ||
          msg.includes("No endpoints")
        ) {
          continue;
        }
        throw err;
      }
    }

    if (!streamed) {
      res.write(
        `data: ${JSON.stringify({ delta: "Sorry, I'm having trouble connecting right now. Please try again in a moment 🙏" })}\n\n`,
      );
    }

    res.write("data: [DONE]\n\n");
    res.end();
  }),
);

export default router;
