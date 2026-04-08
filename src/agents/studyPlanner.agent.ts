import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const studyPlannerAgent = async (
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
      ? "Hindi (Devanagari script). Use motivating phrases: 'Tum kar sakte ho!'"
      : language === "hinglish"
        ? "Hinglish (Hindi in Roman script). Be encouraging."
        : "clear, simple English.";

  const systemPrompt = `You are an expert study planner for school students.
Create bite-sized daily tasks (10-20 min each) that are realistic and achievable.

Respond ENTIRELY in ${languageDesc}

JSON format:
{
  "todaysTasks": [{"title": "string", "description": "string", "subject": "string", "taskType": "revise|read|solve|write|practice", "estimatedMinutes": number, "priority": "low|medium|high"}],
  "weeklyGoals": ["goal1"],
  "motivationalMessage": "string",
  "studyTip": "string",
  "totalEstimatedMinutes": number
}`;

  const userMessage = `${buildStudentContext(input)}

Subjects: ${(input.additionalContext?.subjects as string[])?.join(", ") || input.subject}
Weak topics: ${(input.additionalContext?.weakTopics as string[])?.join(", ") || "None"}
Time available: ${input.additionalContext?.availableMinutes || 60} min`.trim();

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 1100);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [StudyPlanner] Token Usage Summary:");
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
        "[StudyPlanner] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.studyPlanner[
          language as keyof typeof AGENT_FALLBACKS.studyPlanner
        ] || AGENT_FALLBACKS.studyPlanner.english;

      return {
        success: true,
        agentName: "StudyPlannerAgent",
        isFallback: true,
        data: fallbackData,
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "StudyPlannerAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "StudyPlannerAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
