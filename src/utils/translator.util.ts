import { callOpenAI } from "../agents/base.agent";

export const translateText = async (
  text: string,
  targetLanguage: "english" | "hindi" | "hinglish",
): Promise<string> => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const systemPrompt = `You are a professional translator. Translate the given text to ${
    targetLanguage === "english"
      ? "English"
      : targetLanguage === "hindi"
        ? "Hindi (Devanagari script)"
        : "Hinglish (Hindi in Roman letters)"
  }.

IMPORTANT: Return ONLY the translated text. No explanations, no quotes, no additional text.
Keep the same meaning and tone.`;

  try {
    const result = await callOpenAI(systemPrompt, text, 1000);
    return result.replace(/^["']/, "").replace(/["']$/, "").trim();
  } catch (error) {
    console.error(
      `[Translator] Error translating to ${targetLanguage}:`,
      error,
    );
    return text;
  }
};

/**
 * Batch translate multiple strings in one API call
 * Much more efficient than translating one by one
 */
export const batchTranslateText = async (
  texts: string[],
  targetLanguage: "english" | "hindi" | "hinglish",
): Promise<string[]> => {
  if (!texts || texts.length === 0) {
    return texts;
  }

  // Filter out empty strings
  const nonEmptyTexts = texts.filter(t => t && t.trim().length > 0);
  if (nonEmptyTexts.length === 0) {
    return texts;
  }

  const systemPrompt = `You are a professional translator. Translate each line to ${
    targetLanguage === "english"
      ? "English"
      : targetLanguage === "hindi"
        ? "Hindi (Devanagari script)"
        : "Hinglish (Hindi in Roman letters)"
  }.

IMPORTANT: 
- Return translations line by line (one translation per line)
- DO NOT add line numbers, quotes, or explanations
- Keep the same meaning and tone
- Return ONLY the translations, nothing else`;

  try {
    const textInput = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");
    console.log(
      `[batchTranslateText] Translating ${texts.length} items to ${targetLanguage}...`,
    );

    const result = await callOpenAI(systemPrompt, textInput, 2000);

    if (!result || result === "{}" || result.trim().length === 0) {
      console.warn(
        `[batchTranslateText] ⚠️  Empty response from API, returning originals`,
      );
      return texts; // Return originals if API returns nothing
    }

    // Parse the result - should be line-by-line translations
    const lines = result
      .split("\n")
      .map(line => line.replace(/^\d+\.\s*/, "").trim())
      .filter(line => line.length > 0);

    console.log(
      `[batchTranslateText] ✅ Got ${lines.length} translations for ${texts.length} texts`,
    );

    // Map back to original array, preserving empty strings
    let resultIndex = 0;
    return texts.map(text => {
      if (!text || text.trim().length === 0) {
        return text;
      }
      return lines[resultIndex++] || text; // Fall back to original if translation missing
    });
  } catch (error) {
    console.error(
      `[batchTranslateText] ❌ Batch error translating to ${targetLanguage}:`,
      error,
    );
    return texts; // Return originals on error
  }
};

/**
 * Translate all questions in the response (optimized batch version)
 */
export const translateQuestionsResponse = async (
  data: {
    questions: {
      easy: any[];
      medium: any[];
      hard: any[];
      thinking: any[];
    };
    topicCoverage: string[];
    [key: string]: any;
  },
  targetLanguage: "english" | "hindi" | "hinglish",
): Promise<typeof data> => {
  if (targetLanguage === "english") {
    return data; // No translation needed
  }

  console.log(`[TranslateQuestions] Batch translating to ${targetLanguage}...`);

  // Collect ALL text that needs translation
  const textMap: { id: string; text: string }[] = [];
  const questions = data.questions;

  // Add all questions, answers, and explanations to the batch
  ["easy", "medium", "hard", "thinking"].forEach(level => {
    questions[level as keyof typeof questions].forEach((q, i) => {
      textMap.push({ id: `${level}-${i}-q`, text: q.question });
      textMap.push({ id: `${level}-${i}-a`, text: q.correctAnswer });
      textMap.push({ id: `${level}-${i}-e`, text: q.explanation });
    });
  });

  // Also translate topic coverage
  const coverageStart = textMap.length;
  data.topicCoverage.forEach(topic => {
    textMap.push({ id: `coverage-${topic}`, text: topic });
  });

  console.log(
    `[TranslateQuestions] Batch translating ${textMap.length} text items`,
  );

  // Translate all at once
  const textsToTranslate = textMap.map(item => item.text);
  const translatedTexts = await batchTranslateText(
    textsToTranslate,
    targetLanguage,
  );

  // Create a map of ID -> translated text
  const translationMap = new Map<string, string>();
  textMap.forEach((item, index) => {
    translationMap.set(item.id, translatedTexts[index]);
  });

  // Apply translations back to the data structure
  const translatedQuestions = { ...questions };
  ["easy", "medium", "hard", "thinking"].forEach(level => {
    translatedQuestions[level as keyof typeof translatedQuestions] =
      translatedQuestions[level as keyof typeof translatedQuestions].map(
        (q, i) => ({
          ...q,
          question: translationMap.get(`${level}-${i}-q`) || q.question,
          correctAnswer:
            translationMap.get(`${level}-${i}-a`) || q.correctAnswer,
          explanation: translationMap.get(`${level}-${i}-e`) || q.explanation,
        }),
      );
  });

  // Translate topic coverage
  const translatedCoverage = data.topicCoverage.map(
    (topic, i) => translationMap.get(`coverage-${i}`) || topic,
  );

  return {
    ...data,
    questions: translatedQuestions,
    topicCoverage: translatedCoverage,
  };
};
