import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
} from "./base.agent";

export const studyPlannerAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();

  const systemPrompt = `You are an expert study planner for school students.
Your job is to create bite-sized, realistic daily study tasks that don't overwhelm the student.
Create micro-tasks that are achievable in 10-20 minutes each.
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

Generate a practical daily study plan with micro-tasks.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 1500);
    const parsed = JSON.parse(result);

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
