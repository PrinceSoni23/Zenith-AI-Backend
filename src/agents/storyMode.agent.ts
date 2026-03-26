import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

export const storyModeAgent = async (
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

  const systemPrompt = `You are a creative educational storyteller for school students.
Your job is to explain academic chapters and concepts as engaging stories.
Make it fun, relatable, and memorable for students.

${
  language === "hindi"
    ? `LANGUAGE: Tell the story ENTIRELY in Hindi (Devanagari script).
Make it engaging and fun in Hindi.`
    : language === "hinglish"
      ? `LANGUAGE: Tell the story ENTIRELY in HINGLISH (Hindi in Roman script).
Make it engaging and familiar to Hindi-speaking students.`
      : `LANGUAGE: Tell the story ENTIRELY in clear, engaging English.`
}

Respond with valid JSON in this format:
{
  "storyTitle": "string",
  "story": "string (engaging narrative explaining the concept)",
  "characters": ["character1", "character2"],
  "moralOrLesson": "string",
  "conceptsExplained": ["concept1", "concept2"],
  "discussionQuestions": ["question1", "question2"],
  "funFact": "string"
}`;

  const userMessage = `${buildStudentContext(input)}
Subject: ${input.subject}
Chapter/Topic: ${input.topic || input.content}
Language: ${language === "hindi" ? "हिंदी (Hindi)" : language === "hinglish" ? "Hinglish" : "English"}

Create an engaging story that explains this chapter/topic in a fun and memorable way for a ${input.classLevel} student.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 2000);
    const parsed = safeJsonParse(result);

    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "StoryModeAgent",
        data: {
          storyTitle: "An Adventure Through Learning",
          story:
            "Once upon a time, a curious student embarked on a journey to master this fascinating topic. Along the way, they discovered amazing concepts that helped them understand the world better...",
          characters: ["The Student Hero", "Wise Mentor", "Curious Guide"],
          moralOrLesson:
            "Understanding comes through curiosity and persistence",
          conceptsExplained: ["Key concept 1", "Key concept 2"],
          discussionQuestions: [
            "What was your favorite part of the story?",
            "How does this relate to real life?",
          ],
          funFact: "This concept is used in many real-world applications!",
        },
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "StoryModeAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "StoryModeAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
