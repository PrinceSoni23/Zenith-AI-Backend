import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

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
Student Name: ${input.additionalContext?.studentName || "Student"}
Study logs (last 7 days): ${JSON.stringify(input.additionalContext?.studyLogs || [])}
Weak topics: ${(input.additionalContext?.weakTopics as string[])?.join(", ") || "None"}
Streak: ${input.additionalContext?.streakDays || 0} days
Study score: ${input.additionalContext?.studyScore || 0}
Total study time this week: ${input.additionalContext?.weeklyMinutes || 0} minutes
Language: ${language === "hindi" ? "हिंदी (Hindi)" : language === "hinglish" ? "Hinglish" : "English"}

Generate comprehensive parent insights.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 2000);
    const parsed = safeJsonParse(result);

    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "ParentInsightAgent",
        isFallback: true,
        data: {
          overallSummary:
            "Your child is showing steady progress in their studies with consistent engagement.",
          learningConsistency: {
            score: 75,
            trend: "improving",
            message:
              "Your child's study habits are getting stronger and more consistent.",
          },
          subjectPerformance: [
            {
              subject: "Mathematics",
              status: "average",
              insight: "More practice needed in problem-solving",
            },
            {
              subject: "Science",
              status: "strong",
              insight: "Excellent conceptual understanding",
            },
          ],
          studyActivity: {
            todayMinutes: 45,
            weeklyMinutes: 280,
            averageDailyMinutes: 40,
            bestStudyTime: "Evening (6-8 PM)",
          },
          weakAreas: ["Math problem-solving", "Essay writing"],
          strengths: ["Science concepts", "Quick learning"],
          recommendations: [
            "Encourage more group study sessions",
            "Try practice tests weekly",
          ],
          parentTips: [
            "Create a dedicated study space",
            "Use positive reinforcement",
          ],
          encouragementForStudent:
            "You're doing great! Keep up this momentum and celebrate your progress.",
        },
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
