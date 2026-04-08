import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const storyModeAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
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
      ? "Hindi (Devanagari script). Make it engaging and fun."
      : language === "hinglish"
        ? "Hinglish (Hindi in Roman script). Mix Hindi and English naturally."
        : "clear, engaging English. Keep it relatable.";

  const systemPrompt = `You are a creative educational storyteller for school students.
Explain chapters as engaging stories that are fun, relatable, and memorable.

Language: Respond ENTIRELY in ${languageDesc}

JSON Requirements:
- storyTitle: Catchy story name
- story: Engaging narrative (main content)
- moralOrLesson: Key learning point
- conceptsExplained: ONE-LINER definitions only (max 15 words each)
- funFact: Interesting related fact

JSON format:
{
  "storyTitle": "string",
  "story": "string",
  "moralOrLesson": "string",
  "conceptsExplained": {
    "concept1": "one-liner (max 15 words)",
    "concept2": "one-liner (max 15 words)"
  },
  "funFact": "string"
}`;

  const userMessage = `${buildStudentContext(input)}

Subject: ${input.subject}
Topic: ${input.topic || input.content}
Class Level: ${input.classLevel || "General"}

Make this engaging and memorable!`.trim();

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 1200);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [StoryMode] Token Usage Summary:");
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
        "[StoryMode] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.storyMode[
          language as keyof typeof AGENT_FALLBACKS.storyMode
        ] || AGENT_FALLBACKS.storyMode.english;

      return {
        success: true,
        agentName: "StoryModeAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "StoryModeAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "StoryModeAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
