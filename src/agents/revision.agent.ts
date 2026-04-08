import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const revisionAgent = async (
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
      ? "Hindi (Devanagari script). Use examples: 'Yeh kya hai?'"
      : language === "hinglish"
        ? "Hinglish (Hindi in Roman script). Mix naturally."
        : "clear, simple English.";

  const systemPrompt = `You are an expert revision coach for school students.
Generate quick recall questions and flashcards for effective revision.

Respond ENTIRELY in ${languageDesc}

JSON format:
{
  "recallQuestions": [{"question": "string", "answer": "string", "hint": "string", "difficulty": "easy|medium|hard"}],
  "flashCards": [{"front": "string", "back": "string"}],
  "quickSummary": "string",
  "revisionTips": ["tip1"],
  "estimatedRevisionTime": number
}`;

  const userMessage = `${buildStudentContext(input)}
Subject: ${input.subject}
Topic: ${input.topic}
Weak areas: ${(input.additionalContext?.weakTopics as string[])?.join(", ") || "None"}

${input.content || "Generate revision questions"}`.trim();

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 1300);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [Revision] Token Usage Summary:");
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
        "[Revision] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.revision[
          language as keyof typeof AGENT_FALLBACKS.revision
        ] || AGENT_FALLBACKS.revision.english;

      return {
        success: true,
        agentName: "RevisionAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "RevisionAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "RevisionAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
