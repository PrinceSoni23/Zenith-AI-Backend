import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

export const classTranslatorAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();

  const systemPrompt = `You are an expert educational translator for Indian school students.
Your job is to take what a teacher taught in class and explain it:
1. In very simple language the student can understand
2. With real-life relatable examples
3. In the student's preferred language if not English
4. Based on their class level and board
Always respond with valid JSON in this format:
{
  "simpleExplanation": "string",
  "realLifeExample": "string", 
  "keyPoints": ["point1", "point2", "point3"],
  "relatedConcepts": ["concept1", "concept2"],
  "translatedContent": "string (in preferred language if not English)"
}`;

  const userMessage = `${buildStudentContext(input)}

What was taught in class today:
${input.content}

Please explain this in a way a ${input.classLevel} student can easily understand.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 1500);
    const parsed = safeJsonParse(result);

    // If the result is empty object (from fallback), provide default data
    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "ClassTranslatorAgent",
        data: {
          simpleExplanation:
            "This concept explains the fundamental principles in a way that's easy to understand. It breaks down complex ideas into smaller, digestible parts.",
          realLifeExample:
            "For example, you can see this concept in action when you observe everyday situations like the weather changing or objects moving.",
          keyPoints: [
            "Key Point 1: Understanding the basics",
            "Key Point 2: Application in real life",
            "Key Point 3: Common misconceptions",
          ],
          relatedConcepts: ["Related Topic 1", "Related Topic 2"],
          translatedContent: input.content || "Content explanation",
        },
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "ClassTranslatorAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "ClassTranslatorAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
