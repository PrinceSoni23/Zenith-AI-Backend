import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const mentorAgent = async (input: AgentInput): Promise<AgentOutput> => {
  const start = Date.now();

  // Extract language from additionalContext or use direct property or fallback
  const rawLanguage =
    (input.additionalContext?.language as string) ||
    (input as any)?.language ||
    input.preferredLanguage ||
    "english";

  // Normalize to lowercase for consistent comparison
  const language = rawLanguage.toLowerCase().trim();

  const languageDesc =
    language === "hindi"
      ? "Hindi (Devanagari script). Use simple, warm Hindi with examples like 'बहुत बढ़िया प्रयास!'"
      : language === "hinglish"
        ? "Hinglish (Hindi in Roman script). Be warm: 'Bahut badhiya try! Tu bilkul sahi raste par hai.'"
        : "clear, simple English. Be warm and supportive.";

  const systemPrompt = `You are a supportive, wise AI mentor for school students.
Track student behavior and provide personalized guidance, encouragement, and suggestions.
Be warm, understanding, and motivating.

Respond ENTIRELY in ${languageDesc}

JSON format:

{
  "greeting": "string",
  "todayMessage": "string",
  "feedback": "string",
  "encouragement": "string",
  "actionSuggestion": "string",
  "moodCheck": "string",
  "streakMessage": "string",
  "weeklyInsight": "string",
  "motivationalQuote": "string"
}`;

  const userMessage = `${buildStudentContext(input)}

Name: ${input.additionalContext?.studentName || "Student"}
Streak: ${input.additionalContext?.streakDays || 0} days
Score: ${input.additionalContext?.studyScore || 0}
Mood: ${input.additionalContext?.mood || "Unknown"}
Completed: ${input.additionalContext?.completedTasks || 0}/${input.additionalContext?.totalTasks || 0}
Weak subjects: ${(input.additionalContext?.weakSubjects as string[])?.join(", ") || "None"}

Provide personalized mentor guidance.`.trim();

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 1000);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [Mentor] Token Usage Summary:");
    console.log(`   Model: ${aiResponse.model}`);
    console.log(`   Input Tokens: ${aiResponse.inputTokens}`);
    console.log(`   Output Tokens: ${aiResponse.outputTokens}`);
    console.log(`   Total Tokens: ${aiResponse.totalTokens}`);
    console.log(
      `   Token Breakdown: ${aiResponse.inputTokens} (input) + ${aiResponse.outputTokens} (output) = ${aiResponse.totalTokens} (total)`,
    );

    const parsed = safeJsonParse(result);

    if (Object.keys(parsed).length === 0) {
      console.log(
        "[Mentor] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.mentor[
          language as keyof typeof AGENT_FALLBACKS.mentor
        ] || AGENT_FALLBACKS.mentor.english;

      return {
        success: true,
        agentName: "MentorAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "MentorAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "MentorAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
