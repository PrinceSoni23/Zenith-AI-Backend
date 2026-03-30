import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

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

  const systemPrompt = `You are an expert study planner for school students.
Your job is to create bite-sized, realistic daily study tasks that don't overwhelm the student.
Create micro-tasks that are achievable in 10-20 minutes each.

${
  language === "hindi"
    ? `LANGUAGE: Create plan and messages ENTIRELY in Hindi (Devanagari script).
Use motivating Hindi: "तुम कर सकते हो!" "बहुत अच्छा योजना यह!"`
    : language === "hinglish"
      ? `LANGUAGE: Create plan and messages ENTIRELY in HINGLISH (Hindi in Roman script).
Use motivating Hinglish: "Tu kar sakta hai!" "Bilkul achha plan!"`
      : `LANGUAGE: Create plan and messages ENTIRELY in clear, simple English.`
}

Respond with valid JSON in this format:
{
  "todaysTasks": [
    {
      "title": "string",
      "description": "string",
      "subject": "string",
      "taskType": "revise|read|solve|write|practice",
      "estimatedMinutes": number,
      "priority": "low|medium|high"
    }
  ],
  "weeklyGoals": ["goal1", "goal2"],
  "motivationalMessage": "string",
  "studyTip": "string",
  "totalEstimatedMinutes": number
}`;

  const userMessage = `${buildStudentContext(input)}
Subjects: ${(input.additionalContext?.subjects as string[])?.join(", ") || input.subject}
Weak topics: ${(input.additionalContext?.weakTopics as string[])?.join(", ") || "None identified"}
Available study time today: ${input.additionalContext?.availableMinutes || 60} minutes
Recent study activity: ${input.additionalContext?.recentActivity || "Normal"}
Language: ${language === "hindi" ? "हिंदी (Hindi)" : language === "hinglish" ? "Hinglish" : "English"}

Generate a practical daily study plan with micro-tasks.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 1500);
    const parsed = safeJsonParse(result);

    // If the result is empty object (from fallback), provide default data
    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "StudyPlannerAgent",
        isFallback: true,
        data: {
          todaysTasks: [
            {
              title: "Review Today's Concepts",
              description: "Read through and understand the main concepts",
              subject: input.subject || "General",
              taskType: "read",
              estimatedMinutes: 15,
              priority: "high",
            },
            {
              title: "Practice Problems",
              description: "Solve 5-10 practice problems on the topic",
              subject: input.subject || "General",
              taskType: "practice",
              estimatedMinutes: 20,
              priority: "high",
            },
            {
              title: "Revision",
              description: "Review weak areas identified previously",
              subject: input.subject || "General",
              taskType: "revise",
              estimatedMinutes: 15,
              priority: "medium",
            },
          ],
          weeklyGoals: [
            "Master current topic",
            "Complete all practice problems",
          ],
          motivationalMessage:
            "You're doing great! Keep up the consistent effort.",
          studyTip: "Take breaks every 25 minutes and stay hydrated.",
          totalEstimatedMinutes: 50,
        },
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
