import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const smartNotesAgent = async (
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
      ? "Hindi (Devanagari script). Use simple Hindi."
      : language === "hinglish"
        ? "Hinglish (Hindi in Roman script). Use organization like 'Mukhya points:'"
        : "clear, simple English.";

  const systemPrompt = `You are an expert educational notes organizer for school students.
Clean messy notes, create structured summaries, identify gaps, add headers and bullets.

Respond ENTIRELY in ${languageDesc}

JSON format:
{
  "cleanedNotes": "string (markdown)",
  "structuredSummary": "string",
  "keyDefinitions": [{"term": "string", "definition": "string"}],
  "missingConcepts": ["concept1"],
  "studyTips": ["tip1"],
  "importantFormulas": ["formula1"]
}`;

  const userMessage = `${buildStudentContext(input)}
Subject: ${input.subject}
Topic: ${input.topic}
Language: ${language === "hindi" ? "हिंदी (Hindi)" : language === "hinglish" ? "Hinglish" : "English"}

Raw Notes / Content:
${input.content}

Please clean, organize and improve these notes.`;

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 1200);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [SmartNotes] Token Usage Summary:");
    console.log(`   Model: ${aiResponse.model}`);
    console.log(`   Input Tokens: ${aiResponse.inputTokens}`);
    console.log(`   Output Tokens: ${aiResponse.outputTokens}`);
    console.log(`   Total Tokens: ${aiResponse.totalTokens}`);
    console.log(
      `   Token Breakdown: ${aiResponse.inputTokens} (input) + ${aiResponse.outputTokens} (output) = ${aiResponse.totalTokens} (total)`,
    );

    const parsed = safeJsonParse(result);

    // If the result is empty object (from fallback), provide default data
    if (Object.keys(parsed).length === 0) {
      console.log(
        "[SmartNotes] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.smartNotes[
          language as keyof typeof AGENT_FALLBACKS.smartNotes
        ] || AGENT_FALLBACKS.smartNotes.english;

      return {
        success: true,
        agentName: "SmartNotesAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "SmartNotesAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "SmartNotesAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
