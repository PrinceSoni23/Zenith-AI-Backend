import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const parentInsightAgent = async (
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

  const systemPrompt = `You are an educational analytics expert providing insights to parents about their child's learning.
Analyze study patterns and generate actionable, encouraging insights.

${
  language === "hindi"
    ? `LANGUAGE: Provide ALL insights and recommendations ENTIRELY in Hindi (Devanagari script).
Use encouraging Hindi for parents: "आपका बच्चा बहुत अच्छा प्रयास कर रहा है।"`
    : language === "hinglish"
      ? `LANGUAGE: Provide ALL insights and recommendations ENTIRELY in HINGLISH (Hindi in Roman script).
Use encouraging Hinglish: "Aapka beta bahut achcha try kar raha hai."`
      : `LANGUAGE: Provide ALL insights and recommendations ENTIRELY in clear, simple English.`
}

Respond with valid JSON in this format:
{
  "overallSummary": "string",
  "learningConsistency": {
    "score": number,
    "trend": "improving|stable|declining",
    "message": "string"
  },
  "subjectPerformance": [
    {"subject": "string", "status": "strong|average|weak", "insight": "string"}
  ],
  "studyActivity": {
    "todayMinutes": number,
    "weeklyMinutes": number,
    "averageDailyMinutes": number,
    "bestStudyTime": "string"
  },
  "weakAreas": ["area1", "area2"],
  "strengths": ["strength1", "strength2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "parentTips": ["tip1", "tip2"],
  "encouragementForStudent": "string"
}`;

  const userMessage = `${buildStudentContext(input)}

Name: ${input.additionalContext?.studentName || "Student"}
Streak: ${input.additionalContext?.streakDays || 0} days
Score: ${input.additionalContext?.studyScore || 0}
Weekly time: ${input.additionalContext?.weeklyMinutes || 0} min
Weak topics: ${(input.additionalContext?.weakTopics as string[])?.join(", ") || "None"}

${JSON.stringify(input.additionalContext?.studyLogs || [])}`.trim();

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 1200);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [ParentInsight] Token Usage Summary:");
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
        "[ParentInsight] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.parentInsight[
          language as keyof typeof AGENT_FALLBACKS.parentInsight
        ] || AGENT_FALLBACKS.parentInsight.english;

      return {
        success: true,
        agentName: "ParentInsightAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "ParentInsightAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "ParentInsightAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
