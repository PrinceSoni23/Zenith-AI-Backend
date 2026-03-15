import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
} from "./base.agent";

export const revisionAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();

  const systemPrompt = `You are an expert revision coach for school students.
Based on study logs and weak topics, generate quick recall questions to help students revise effectively.
Respond with valid JSON in this format:
{
  "recallQuestions": [
    {
      "question": "string",
      "answer": "string",
      "hint": "string",
      "difficulty": "easy|medium|hard"
    }
  ],
  "flashCards": [
    {
      "front": "string",
      "back": "string"
    }
  ],
  "quickSummary": "string",
  "revisionTips": ["tip1", "tip2"],
  "estimatedRevisionTime": number
}`;

  const userMessage = `${buildStudentContext(input)}
Subject: ${input.subject}
Topic to revise: ${input.topic}
Weak areas: ${(input.additionalContext?.weakTopics as string[])?.join(", ") || "None"}
Last studied: ${input.additionalContext?.lastStudied || "Recently"}
Study log summary: ${input.content || "Student has been studying this topic"}

Generate effective revision questions and flashcards.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 4000);
    const parsed = JSON.parse(result);

    return {
      success: true,
      agentName: "RevisionAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "RevisionAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
