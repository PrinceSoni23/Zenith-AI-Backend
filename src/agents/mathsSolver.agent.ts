import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
  AIResponse,
} from "./base.agent";
import { AGENT_FALLBACKS } from "../constants/fallback.constants";

export const mathsSolverAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();
  const mode = input.mode || "step-by-step";

  // Extract language from additionalContext or use direct property or fallback
  const rawLanguage =
    (input.additionalContext?.language as string) ||
    (input as any)?.language ||
    input.preferredLanguage ||
    "english";

  // Normalize to lowercase for consistent comparison
  const language = rawLanguage.toLowerCase().trim();

  const languageDesc =
    language === "hindi"
      ? "Hindi (Devanagari script). Provide clear explanations with examples like 'Pehle data samajhte hain'"
      : language === "hinglish"
        ? "Hinglish (Hindi in Roman script). Mix naturally: 'Pehle humko data ko samajhna hai'"
        : "clear, simple English. Explain every step.";

  const systemPrompt = `You are an expert maths teacher for school students.
Solve problems in the requested mode:
- hint mode: Give 2-3 hints only
- step-by-step: Clear numbered steps with explanations
- full-solution: Complete solution with all working

Respond ENTIRELY in ${languageDesc}

JSON format:
{
  "mode": "string",
  "hints": ["hint1", "hint2"],
  "steps": [{"stepNumber": number, "description": "string", "calculation": "string"}],
  "fullSolution": "string",
  "answer": "string",
  "conceptsUsed": ["concept1"],
  "formulasApplied": ["formula1"],
  "commonMistakes": ["mistake1"],
  "similarExamples": ["example1"]
}`;

  const userMessage = `${buildStudentContext(input)}

Math Problem
Topic: ${input.topic || "General"}
Mode: ${mode}

${input.content}`.trim();

  try {
    const aiResponse = await callOpenAI(systemPrompt, userMessage, 1300);
    const result = aiResponse.content;

    // Log token usage for this request
    console.log("📊 [MathsSolver] Token Usage Summary:");
    console.log(`   Model: ${aiResponse.model}`);
    console.log(`   Input Tokens: ${aiResponse.inputTokens}`);
    console.log(`   Output Tokens: ${aiResponse.outputTokens}`);
    console.log(`   Total Tokens: ${aiResponse.totalTokens}`);
    console.log(
      `   Token Breakdown: ${aiResponse.inputTokens} (input) + ${aiResponse.outputTokens} (output) = ${aiResponse.totalTokens} (total)`,
    );

    const parsed = safeJsonParse(result);

    // If the result is empty object (from fallback), provide default data
    if (Object.keys(parsed).length === 0) {
      console.log(
        "[MathsSolver] - Empty parsed result, using fallback data for language:",
        language,
      );
      const fallbackData =
        AGENT_FALLBACKS.mathsSolver[
          language as keyof typeof AGENT_FALLBACKS.mathsSolver
        ] || AGENT_FALLBACKS.mathsSolver.english;

      return {
        success: true,
        agentName: "MathsSolverAgent",
        isFallback: true,
        data: { ...fallbackData, mode },
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "MathsSolverAgent",
      data: { ...parsed, mode },
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "MathsSolverAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
