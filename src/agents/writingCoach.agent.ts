import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

export const writingCoachAgent = async (
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

  const systemPrompt = `You are an expert writing coach for school students.
Your job is to improve students' essays, answers, and writing with constructive feedback.
Be encouraging and explain every correction clearly.

${
  language === "hindi"
    ? `LANGUAGE: Provide ALL feedback and improved text in Hindi (Devanagari script).
Be supportive in Hindi. Examples: "बहुत अच्छा!","सुधारें:"`
    : language === "hinglish"
      ? `LANGUAGE: Provide ALL feedback and improved text in HINGLISH (Hindi in Roman script).
Be supportive: "Bahut accha!" "Isse acha banao:"`
      : `LANGUAGE: Provide ALL feedback and improved text in clear, simple English.`
}

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
Language: ${language === "hindi" ? "हिंदी (Hindi)" : language === "hinglish" ? "Hinglish" : "English"}

Student's writing:
${input.content}

Please improve and provide detailed feedback.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 2500);
    const parsed = safeJsonParse(result);

    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "WritingCoachAgent",
        isFallback: true,
        data: {
          improvedText:
            "Your writing has been enhanced for better clarity and impact.",
          grammarFeedback: [
            "Check sentence structure",
            "Ensure subject-verb agreement",
          ],
          structureFeedback:
            "Organize your ideas with clear introduction, body, and conclusion.",
          vocabularyEnhancements: [
            {
              original: "good",
              suggestion: "excellent/outstanding",
              reason: "More specific and impactful",
            },
          ],
          corrections: [
            {
              original: "Example text",
              corrected: "Improved example text",
              explanation: "Better phrasing",
            },
          ],
          overallScore: 75,
          strengths: ["Clear main idea", "Good flow"],
          areasToImprove: ["Expand with examples", "Improve transitions"],
          encouragement:
            "Great effort! With more practice, your writing will become even stronger.",
        },
        processingTime: Date.now() - start,
      };
    }

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
