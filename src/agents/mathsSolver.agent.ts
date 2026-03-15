import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
} from "./base.agent";

export const mathsSolverAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();
  const mode = input.mode || "step-by-step";

  const systemPrompt = `You are an expert maths teacher for school students.
Solve mathematics problems in the requested mode:
- hint mode: Give 2-3 hints only, don't reveal full solution
- step-by-step mode: Break into clear numbered steps with explanation
- full-solution mode: Complete solution with all working shown
Always explain concepts used, not just the answer.
Respond with valid JSON in this format:
{
  "mode": "string",
  "hints": ["hint1", "hint2"] (only for hint mode),
  "steps": [{"stepNumber": number, "description": "string", "calculation": "string"}] (for step-by-step),
  "fullSolution": "string" (for full-solution),
  "answer": "string",
  "conceptsUsed": ["concept1", "concept2"],
  "formulasApplied": ["formula1", "formula2"],
  "commonMistakes": ["mistake1"],
  "similarExamples": ["example1"]
}`;

  const userMessage = `${buildStudentContext(input)}
Subject: Mathematics
Topic: ${input.topic || "General"}
Mode requested: ${mode}

Problem:
${input.content}

Solve this in ${mode} mode.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 2000);
    const parsed = JSON.parse(result);

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
