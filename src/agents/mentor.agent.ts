import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
} from "./base.agent";

export const mentorAgent = async (input: AgentInput): Promise<AgentOutput> => {
  const start = Date.now();

  const systemPrompt = `You are a supportive, wise AI mentor for school students.
You track student behavior and provide personalized guidance, encouragement, and career/study suggestions.
Be warm, understanding, and motivating — like a trusted elder sibling or teacher.
Respond with valid JSON in this format:
{
  "greeting": "string (personalized greeting)",
  "todayMessage": "string (personalized message for today)",
  "feedback": "string (feedback on recent activity)",
  "encouragement": "string",
  "actionSuggestion": "string (one specific thing to do today)",
  "moodCheck": "string (question to check student's mood/wellbeing)",
  "streakMessage": "string",
  "weeklyInsight": "string",
  "motivationalQuote": "string"
}`;

  const userMessage = `${buildStudentContext(input)}
Student Name: ${input.additionalContext?.studentName || "Student"}
Streak: ${input.additionalContext?.streakDays || 0} days
Study score: ${input.additionalContext?.studyScore || 0}
Last activity: ${input.additionalContext?.lastActivity || "No recent activity"}
Mood/Status: ${input.additionalContext?.mood || "Unknown"}
Today's completed tasks: ${input.additionalContext?.completedTasks || 0}
Total tasks today: ${input.additionalContext?.totalTasks || 0}
Weak subjects: ${(input.additionalContext?.weakSubjects as string[])?.join(", ") || "None"}

Provide a personalized mentor message for today.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 1500);
    const parsed = JSON.parse(result);

    return {
      success: true,
      agentName: "MentorAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "MentorAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
