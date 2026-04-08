import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const classTranslatorAgent = async (
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

  console.log("ClassTranslator - Raw language:", rawLanguage);
  console.log("ClassTranslator - Normalized language:", language);
  console.log("ClassTranslator - Full input:", JSON.stringify(input, null, 2));

  const languageDesc =
    language === "hindi"
      ? "Hindi (Devanagari script). Use simple, colloquial Hindi. Example: 'यह एक महत्वपूर्ण अवधारणा है।'"
      : language === "hinglish"
        ? "Hinglish (Hindi in Roman script). Mix naturally: 'Yeh concept bahut simple hai bhai!'"
        : "clear, simple English with short sentences. Avoid jargon.";

  const systemPrompt = `You are an expert educational translator helping Indian school students understand lessons better.

Respond ENTIRELY in ${languageDesc}

Your task:
1. Explain the concept in very simple language (MUST be 50-60+ words)
2. Add relatable, real-life examples (MUST be 50-60+ words minimum)
3. Create a formal, exam-ready definition (1-3 sentences, academically appropriate)
4. Make explanations friendly and conversational
5. Keep it short but detailed enough for understanding
6. Return ONLY valid JSON - no markdown, no code fences

CRITICAL REQUIREMENTS:
- simpleExplanation: MINIMUM 50-60 words, NOT shorter
- realLifeExample: MINIMUM 50-60 words, NOT shorter
- Use complete sentences and provide context
- Break down complex ideas into understandable parts

JSON format:
{
  "simpleExplanation": "string (50-60+ words minimum)",
  "realLifeExample": "string (50-60+ words minimum)",
  "keyPoints": ["point1", "point2", "point3"],
  "translatedContent": "string",
  "formalDefinition": "concise, exam-ready definition"
}`;

  const userMessage = `${buildStudentContext(input)}

Topic: ${input.subject || "General"}
Concept: ${input.content}
Student Level: ${input.classLevel || "General"}`.trim();

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 900);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [ClassTranslator] Token Usage Summary:");
    console.log(`   Model: ${aiResponse.model}`);
    console.log(`   Input Tokens: ${aiResponse.inputTokens}`);
    console.log(`   Output Tokens: ${aiResponse.outputTokens}`);
    console.log(`   Total Tokens: ${aiResponse.totalTokens}`);
    console.log(
      `   Token Breakdown: ${aiResponse.inputTokens} (input) + ${aiResponse.outputTokens} (output) = ${aiResponse.totalTokens} (total)`,
    );

    console.log(
      "ClassTranslator - Raw OpenAI result:",
      result.substring(0, 500),
    );
    const parsed = safeJsonParse(result);
    console.log(
      "ClassTranslator - Parsed result:",
      JSON.stringify(parsed, null, 2).substring(0, 500),
    );

    // If the result is empty object (from fallback), provide default data
    if (Object.keys(parsed).length === 0) {
      console.log(
        "ClassTranslator - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.classTranslator[
          language as keyof typeof AGENT_FALLBACKS.classTranslator
        ] || AGENT_FALLBACKS.classTranslator.english;

      return {
        success: true,
        agentName: "ClassTranslatorAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "ClassTranslatorAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    console.error("ClassTranslator - Error occurred:", error);
    return {
      success: false,
      agentName: "ClassTranslatorAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
