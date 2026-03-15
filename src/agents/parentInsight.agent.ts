import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
} from "./base.agent";

export const parentInsightAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();

  const systemPrompt = `You are an educational analytics expert providing insights to parents about their child's learning.
Analyze study patterns and generate actionable, encouraging insights.
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

Generate comprehensive parent insights.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 2000);
    const parsed = JSON.parse(result);

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
