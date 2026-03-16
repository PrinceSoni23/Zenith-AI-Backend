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

  // Extract language from additionalContext or use direct property or fallback
  const rawLanguage =
    (input.additionalContext?.language as string) ||
    (input as any)?.language ||
    input.preferredLanguage ||
    "english";

  // Normalize to lowercase for consistent comparison
  const language = rawLanguage.toLowerCase().trim();

  console.log("ClassTranslator - Raw language:", rawLanguage);
  console.log("ClassTranslator - Normalized language:", language);
  console.log("ClassTranslator - Full input:", JSON.stringify(input, null, 2));

  // Build language instruction
  let languageInstruction = "";

  if (language === "hinglish") {
    languageInstruction = `Respond in HINGLISH (Hindi written in Roman script). 
Mix Hindi and English naturally as Indian students do. Examples:
- "Yeh concept bahut simple hai bhai!"
- "Dekho, iska matlab kya hai..."
- "Samajh gaye na?"
Use words like: yeh, wo, bhai, dekho, samajh, hain, matlab, iska, daily, etc.
Keep it casual and friendly, like talking to a friend.`;
  } else {
    languageInstruction = `Respond in clear, simple English that a student can easily understand.`;
  }

  const systemPrompt = `You are an expert educational translator helping Indian school students understand their lessons better.

${
  language === "hinglish"
    ? `
LANGUAGE: Respond ENTIRELY in HINGLISH (Hindi written in Roman script)
Mix Hindi and English naturally like: "Yeh concept bahut simple hai bhai!"
Use words: yeh, wo, bhai, dekho, samajh, hain, matlab, iska, daily, ke, ka, ki, etc.`
    : `
LANGUAGE: Respond ENTIRELY in clear, simple English
Use simple words and short sentences.
Avoid jargon and technical terms.`
}

Your task:
1. Take what a teacher taught and explain it in very simple language
2. Add relatable, real-life examples that students can relate to
3. Make it friendly and conversational
4. Keep explanations short and easy to understand
5. Respond as ONLY valid JSON - no markdown, no code fences, no extra text

CRITICAL: Return ONLY this JSON format:
{
  "simpleExplanation": "string",
  "realLifeExample": "string",
  "keyPoints": ["point1", "point2", "point3"],
  "relatedConcepts": ["concept1", "concept2"],
  "translatedContent": "string"
}`;

  const userMessage = `${buildStudentContext(input)}

${language === "hinglish" ? "🇮🇳 RESPOND IN HINGLISH (Hindi in Roman script)" : "🇬🇧 RESPOND IN ENGLISH"}

Topic to explain: ${input.subject || "General"}
Concept: ${input.content}
Student Level: ${input.classLevel || "General"}

Create a simple, friendly explanation using ${language === "hinglish" ? "Hinglish" : "English"}.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 1500);
    console.log(
      "ClassTranslator - Raw OpenAI result:",
      result.substring(0, 500),
    );
    const parsed = safeJsonParse(result);
    console.log(
      "ClassTranslator - Parsed result:",
      JSON.stringify(parsed, null, 2).substring(0, 500),
    );

    // If the result is empty object (from fallback), provide default data
    if (Object.keys(parsed).length === 0) {
      console.log(
        "ClassTranslator - Empty parsed result, using fallback data for language:",
        language,
      );
      const defaultExplanation =
        language === "hinglish"
          ? "Yeh concept bahut simple hai aur samajhne mein aasan. Iska matlab hai ki complex ideas ko chhote-chhote parts mein samjhenge."
          : `This is an important concept in ${input.subject || "your studies"}. It helps you understand the key ideas by breaking them down into simple parts that are easy to remember and apply.`;

      const defaultExample =
        language === "hinglish"
          ? "Dekho, tumhare daily life mein yeh concept aise dikhai deta hai - jaise weather badalne ke time ya objects ke movement mein."
          : `You can see this concept everywhere in your daily life. Think about everyday situations - like how you use your phone, how plants grow, or how weather changes. All of these involve the principles we're learning.`;

      const defaultPoints =
        language === "hinglish"
          ? [
              "Key Point 1: Basics samajhna zaruri hai",
              "Key Point 2: Real life mein application",
              "Key Point 3: Common galtiyan",
            ]
          : [
              "Key Point 1: Start with the basic definition and core idea",
              "Key Point 2: Understand how it works in real situations",
              "Key Point 3: Learn the most common mistakes students make",
            ];

      return {
        success: true,
        agentName: "ClassTranslatorAgent",
        data: {
          simpleExplanation: defaultExplanation,
          realLifeExample: defaultExample,
          keyPoints: defaultPoints,
          relatedConcepts:
            language === "hinglish"
              ? ["Related Topic 1", "Related Topic 2"]
              : [
                  `Previous topics related to ${input.subject || "this subject"}`,
                  "Advanced topics to explore next",
                ],
          translatedContent:
            input.content ||
            (language === "hinglish"
              ? "Content ka explanation"
              : "Content explanation"),
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
    console.error("ClassTranslator - Error occurred:", error);
    return {
      success: false,
      agentName: "ClassTranslatorAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
