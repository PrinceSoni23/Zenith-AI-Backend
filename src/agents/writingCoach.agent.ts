import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
} from "./base.agent";

export const writingCoachAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();

  const systemPrompt = `You are an expert writing coach for school students.
Your job is to improve students' essays, answers, and writing with constructive feedback.
Be encouraging and explain every correction clearly.
Respond with valid JSON in this format:
{
  "improvedText": "string (rewritten/improved version)",
  "grammarFeedback": ["issue1: correction", "issue2: correction"],
  "structureFeedback": "string",
  "vocabularyEnhancements": [{"original": "string", "suggestion": "string", "reason": "string"}],
  "corrections": [{"original": "string", "corrected": "string", "explanation": "string"}],
  "overallScore": number,
  "strengths": ["strength1", "strength2"],
  "areasToImprove": ["area1", "area2"],
  "encouragement": "string"
}`;

  const userMessage = `${buildStudentContext(input)}
Subject: ${input.subject}
Writing Type: ${input.additionalContext?.writingType || "answer"}
Topic/Title: ${input.topic}

Student's writing:
${input.content}

Please improve and provide detailed feedback.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 2500);
    const parsed = JSON.parse(result);

    return {
      success: true,
      agentName: "WritingCoachAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "WritingCoachAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
