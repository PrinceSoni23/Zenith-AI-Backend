import {
  AgentInput,
  AgentOutput,
  callVision,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const visionLensAgent = async (
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

  const imageBase64 = input.imageBase64 || "";
  const mimeType = input.mimeType || "image/jpeg";
  const question = input.question || "Please explain what is in this image.";

  if (!imageBase64) {
    return {
      success: false,
      agentName: "VisionLensAgent",
      data: {},
      error: "No image provided.",
      processingTime: Date.now() - start,
    };
  }

  const languageDesc =
    language === "hindi"
      ? "Hindi (Devanagari script). Use simple examples: 'Yeh dikhata hai ki...'"
      : language === "hinglish"
        ? "Hinglish (Hindi in Roman script). Use familiar phrases."
        : "clear, simple English.";

  const systemPrompt = `You are a helpful AI tutor for school students analyzing an image.
Analyze the image and: answer the question, extract key points, suggest topics, give a study tip.

Respond ENTIRELY in ${languageDesc}

JSON format:
{
  "explanation": "string",
  "keyPoints": ["point1", "point2"],
  "relatedTopics": ["topic1", "topic2"],
  "studyTip": "string"
}`;

  const userQuestion = `${buildStudentContext(input)}

Question: ${question}`;

  try {
    const aiResponse = await callVision(
      systemPrompt,
      userQuestion,
      imageBase64,
      mimeType,
      1500,
    );
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [VisionLens] Token Usage Summary:");
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
        "[VisionLens] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.visionLens[
          language as keyof typeof AGENT_FALLBACKS.visionLens
        ] || AGENT_FALLBACKS.visionLens.english;

      return {
        success: true,
        agentName: "VisionLensAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "VisionLensAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "VisionLensAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
