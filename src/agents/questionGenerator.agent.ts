import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

export const questionGeneratorAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();

  const systemPrompt = `You are an expert question paper creator for school students.
Generate diverse questions at 4 difficulty levels based on the topic.
Respond with valid JSON in this format:
{
  "questions": {
    "easy": [
      {"question": "string", "type": "mcq|short|fill", "options": ["a","b","c","d"], "correctAnswer": "string", "explanation": "string"}
    ],
    "medium": [
      {"question": "string", "type": "mcq|short", "options": ["a","b","c","d"], "correctAnswer": "string", "explanation": "string"}
    ],
    "hard": [
      {"question": "string", "type": "short|long", "correctAnswer": "string", "explanation": "string"}
    ],
    "thinking": [
      {"question": "string", "type": "long", "correctAnswer": "string", "explanation": "string"}
    ]
  },
  "totalQuestions": number,
  "topicCoverage": ["subtopic1", "subtopic2"]
}`;

  const userMessage = `${buildStudentContext(input)}
Subject: ${input.subject}
Topic: ${input.topic}
Number of questions per level: ${input.additionalContext?.questionsPerLevel || 3}

Generate questions at all 4 difficulty levels: easy, medium, hard, and thinking (application-based).`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 3000);
    const parsed = safeJsonParse(result);

    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "QuestionGeneratorAgent",
        data: {
          questions: {
            easy: [
              {
                question: "Define the main concept",
                type: "short",
                options: undefined,
                correctAnswer: "Clear definition",
                explanation: "This is the basic understanding",
              },
            ],
            medium: [
              {
                question: "Apply the concept to a scenario",
                type: "short",
                correctAnswer: "Application example",
                explanation: "This shows deeper understanding",
              },
            ],
            hard: [
              {
                question: "Analyze complex relationships",
                type: "long",
                correctAnswer: "Complex analysis",
                explanation: "Advanced understanding required",
              },
            ],
            thinking: [
              {
                question: "Create a real-world solution using this concept",
                type: "long",
                correctAnswer: "Creative solution",
                explanation: "Critical thinking application",
              },
            ],
          },
          totalQuestions: 4,
          topicCoverage: ["Main subtopic", "Related concept"],
        },
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "QuestionGeneratorAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "QuestionGeneratorAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
