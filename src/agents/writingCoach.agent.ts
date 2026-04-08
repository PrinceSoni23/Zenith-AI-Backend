import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const writingCoachAgent = async (
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

  const systemPrompt = `You are an expert writing coach for school students.
Your job is to improve students' essays, answers, and writing with constructive feedback.
Be encouraging and explain every correction clearly.

${
  language === "hindi"
    ? `LANGUAGE: Provide ALL feedback and improved text in Hindi (Devanagari script).
Be supportive in Hindi. Examples: "बहुत अच्छा!","सुधारें:"`
    : language === "hinglish"
      ? `LANGUAGE: Provide ALL feedback and improved text in HINGLISH (Hindi in Roman script).
Be supportive: "Bahut accha!" "Isse acha banao:"`
      : `LANGUAGE: Provide ALL feedback and improved text in clear, simple English.`
}

Respond with valid JSON in this format:
{
  "improvedText": "string (rewritten/improved version)",
  "grammarFeedback": ["issue1: correction", "issue2: correction"],
  "structureFeedback": "string",
  "vocabularyEnhancements": [{"original": "string", "suggestion": "string", "reason": "string"}],
  "corrections": [{"original": "string", "corrected": "string", "explanation": "string"}],
  "overallScore": number,
  "strengths": ["strength1", "strength2"],
  "areasToImprove": ["area1", "area2"],
  "encouragement": "string"
}`;

  const userMessage = `${buildStudentContext(input)}

Subject: ${input.subject}
Type: ${input.additionalContext?.writingType || "answer"}
Topic: ${input.topic}

${input.content}`.trim();

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 1400);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [WritingCoach] Token Usage Summary:");
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
        "[WritingCoach] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.writingCoach[
          language as keyof typeof AGENT_FALLBACKS.writingCoach
        ] || AGENT_FALLBACKS.writingCoach.english;

      return {
        success: true,
        agentName: "WritingCoachAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "WritingCoachAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "WritingCoachAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
