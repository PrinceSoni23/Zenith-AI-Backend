import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

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

  const systemPrompt = `You are an expert maths teacher for school students.
Solve mathematics problems in the requested mode:
- hint mode: Give 2-3 hints only, don't reveal full solution
- step-by-step mode: Break into clear numbered steps with explanation
- full-solution mode: Complete solution with all working shown
Always explain concepts used, not just the answer.

${
  language === "hindi"
    ? `LANGUAGE: Respond ENTIRELY in Hindi (Devanagari script).
Provide explanations in simple, clear Hindi.
Examples: "पहले, हम जानकारी को समझते हैं।" "अब सूत्र लागू करते हैं।"`
    : language === "hinglish"
      ? `LANGUAGE: Respond ENTIRELY in HINGLISH (Hindi in Roman script).
Mix Hindi and English naturally.
Examples: "Pehle humko data ko samajhna hai." "Ab formula use karenge."`
      : `LANGUAGE: Respond ENTIRELY in clear, simple English.`
}

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
Language: ${language === "hindi" ? "हिंदी (Hindi)" : language === "hinglish" ? "Hinglish" : "English"}

Problem:
${input.content}

Solve this in ${mode} mode.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 2000);
    const parsed = safeJsonParse(result);

    // If the result is empty object (from fallback), provide default data
    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "MathsSolverAgent",
        isFallback: true,
        data: {
          mode: mode,
          hints:
            mode === "hint"
              ? language === "hindi"
                ? [
                    "दी गई जानकारी को सावधानी से देखें",
                    "पहचानने की कोशिश करें कि कौन सा सूत्र लागू होता है",
                  ]
                : language === "hinglish"
                  ? [
                      "Given information ko carefully dekho",
                      "Pehchanne ki koshish karo ki kaunsa formula apply hoga",
                    ]
                  : [
                      "Look at the given information carefully",
                      "Try to identify which formula or concept applies",
                    ]
              : undefined,
          steps:
            mode === "step-by-step"
              ? [
                  {
                    stepNumber: 1,
                    description:
                      language === "hindi"
                        ? "दी गई जानकारी को समझें"
                        : language === "hinglish"
                          ? "Given ki hui jaankari ko samjho"
                          : "Identify the given values and what to find",
                    calculation:
                      language === "hindi"
                        ? "सभी दी गई जानकारी सूची बनाएं"
                        : language === "hinglish"
                          ? "Sab kuch list karo"
                          : "List all given information",
                  },
                  {
                    stepNumber: 2,
                    description:
                      language === "hindi"
                        ? "उपयुक्त सूत्र चुनें"
                        : language === "hinglish"
                          ? "Sahi formula select karo"
                          : "Select the appropriate formula or method",
                    calculation:
                      language === "hindi"
                        ? "सही गणितीय तरीका चुनें"
                        : language === "hinglish"
                          ? "Right tarika choose karo"
                          : "Choose the relevant mathematical approach",
                  },
                  {
                    stepNumber: 3,
                    description:
                      language === "hindi"
                        ? "गणना करें"
                        : language === "hinglish"
                          ? "Calculation karo"
                          : "Perform the calculation",
                    calculation:
                      language === "hindi"
                        ? "सूत्र को चरण दर चरण लागू करें"
                        : language === "hinglish"
                          ? "Formula ko step by step apply karo"
                          : "Apply the formula step by step",
                  },
                ]
              : undefined,
          fullSolution:
            mode === "full-solution"
              ? language === "hindi"
                ? "सभी चरणों के साथ पूरा समाधान"
                : language === "hinglish"
                  ? "Sab steps ke saath pura solution"
                  : "Complete solution with all steps shown"
              : undefined,
          answer:
            language === "hindi"
              ? "समाधान मान"
              : language === "hinglish"
                ? "Solution value"
                : "Solution value",
          conceptsUsed:
            language === "hindi"
              ? ["बीजगणित", "समस्या समाधान"]
              : language === "hinglish"
                ? ["Algebra", "Problem-solving"]
                : ["Algebra", "Problem-solving"],
          formulasApplied:
            language === "hindi"
              ? ["प्रासंगिक गणितीय सूत्र"]
              : language === "hinglish"
                ? ["Relevant mathematical formula"]
                : ["Relevant mathematical formula"],
          commonMistakes:
            language === "hindi"
              ? ["समस्या को ध्यान से न पढ़ना"]
              : language === "hinglish"
                ? ["Problem ko properly padna zaroori hai"]
                : ["Not reading the problem carefully"],
          similarExamples:
            language === "hindi"
              ? ["समान समस्या के उदाहरण"]
              : language === "hinglish"
                ? ["Similar problem examples"]
                : ["Similar problem examples"],
        },
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
