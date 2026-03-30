import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";
import {
  translateQuestionsResponse,
  translateText,
} from "../utils/translator.util";

const buildFallbackQuestions = (
  language: string,
  subject: string,
  topic: string,
  questionsPerLevel: number,
) => {
  const n = Math.max(1, Math.min(questionsPerLevel, 5));

  const hindi = {
    easyStem: `"${topic}" की मूल परिभाषा लिखिए।`,
    mediumStem: `"${topic}" का एक सरल उदाहरण ${subject} में बताइए।`,
    hardStem: `"${topic}" के सिद्धांत को विस्तार से समझाइए और चरणों में लिखिए।`,
    thinkingStem: `दैनिक जीवन की किसी स्थिति में "${topic}" का उपयोग करके समाधान प्रस्तावित कीजिए।`,
    easyAnswer: `${topic} की स्पष्ट और संक्षिप्त परिभाषा।`,
    mediumAnswer: `${subject} से जुड़ा एक सही अनुप्रयोग उदाहरण।`,
    hardAnswer: `${topic} का कारण, प्रक्रिया और परिणाम सहित विश्लेषण।`,
    thinkingAnswer: `समस्या-आधारित तर्क के साथ व्यावहारिक समाधान।`,
    easyExp: "यह प्रश्न बुनियादी समझ जाँचता है।",
    mediumExp: "यह प्रश्न अवधारणा के अनुप्रयोग को जाँचता है।",
    hardExp: "यह प्रश्न गहन विश्लेषण क्षमता को जाँचता है।",
    thinkingExp: "यह प्रश्न रचनात्मक और आलोचनात्मक सोच को जाँचता है।",
    coverage: [topic, `${subject} में अनुप्रयोग`],
  };

  const hinglish = {
    easyStem: `"${topic}" ki basic definition likho.`,
    mediumStem: `"${topic}" ka ek simple example ${subject} me batao.`,
    hardStem: `"${topic}" ke principle ko detail me explain karo aur steps me likho.`,
    thinkingStem: `Daily life ki kisi situation me "${topic}" use karke solution propose karo.`,
    easyAnswer: `${topic} ki clear aur short definition.`,
    mediumAnswer: `${subject} se linked sahi application example.`,
    hardAnswer: `${topic} ka cause, process aur outcome ke sath analysis.`,
    thinkingAnswer: `Problem-based practical solution with reasoning.`,
    easyExp: "Yeh question basic understanding check karta hai.",
    mediumExp: "Yeh question concept application check karta hai.",
    hardExp: "Yeh question deep analysis check karta hai.",
    thinkingExp: "Yeh question creative aur critical thinking check karta hai.",
    coverage: [topic, `${subject} me application`],
  };

  const english = {
    easyStem: `Write the basic definition of "${topic}".`,
    mediumStem: `Give one simple example of "${topic}" in ${subject}.`,
    hardStem: `Explain the principle of "${topic}" in detail with steps.`,
    thinkingStem: `Propose a solution to a real-life situation using "${topic}".`,
    easyAnswer: `A clear and concise definition of ${topic}.`,
    mediumAnswer: `A valid application example connected to ${subject}.`,
    hardAnswer: `A structured analysis with cause, process, and outcome.`,
    thinkingAnswer: `A practical solution supported by reasoning.`,
    easyExp: "This checks foundational understanding.",
    mediumExp: "This checks conceptual application.",
    hardExp: "This checks deep analytical ability.",
    thinkingExp: "This checks creative and critical thinking.",
    coverage: [topic, `Application in ${subject}`],
  };

  const pack =
    language === "hindi" ? hindi : language === "hinglish" ? hinglish : english;

  const makeSet = (
    stem: string,
    type: "short" | "long",
    answer: string,
    explanation: string,
  ) =>
    Array.from({ length: n }, (_, i) => ({
      question: n === 1 ? stem : `${i + 1}. ${stem}`,
      type,
      correctAnswer: answer,
      explanation,
    }));

  return {
    questions: {
      easy: makeSet(pack.easyStem, "short", pack.easyAnswer, pack.easyExp),
      medium: makeSet(
        pack.mediumStem,
        "short",
        pack.mediumAnswer,
        pack.mediumExp,
      ),
      hard: makeSet(pack.hardStem, "long", pack.hardAnswer, pack.hardExp),
      thinking: makeSet(
        pack.thinkingStem,
        "long",
        pack.thinkingAnswer,
        pack.thinkingExp,
      ),
    },
    totalQuestions: n * 4,
    topicCoverage: pack.coverage,
  };
};

export const questionGeneratorAgent = async (
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

  // ALWAYS generate in English (free models work reliably with English)
  // Frontend will translate to target language if needed
  const systemPrompt = `You are a question generator. Create 4 sets of questions (easy, medium, hard, thinking).

RETURN ONLY VALID JSON. NO OTHER TEXT.

Return this exact structure:
{
  "questions": {
    "easy": [{"question":"Q", "type":"short", "correctAnswer":"A", "explanation":"E"}],
    "medium": [{"question":"Q", "type":"short", "correctAnswer":"A", "explanation":"E"}],
    "hard": [{"question":"Q", "type":"long", "correctAnswer":"A", "explanation":"E"}],
    "thinking": [{"question":"Q", "type":"long", "correctAnswer":"A", "explanation":"E"}]
  },
  "totalQuestions": 4,
  "topicCoverage": ["topic"]
}

All questions/answers MUST be in clear English. Simple, understandable language for students.`;

  const userMessage = `${buildStudentContext(input)}
Subject: ${input.subject}
Topic: ${input.topic}
Number of questions per level: ${input.additionalContext?.questionsPerLevel || 3}

Generate questions at all 4 difficulty levels: easy, medium, hard, and thinking (application-based).`;

  const subject = String(input.subject || "General Science").trim();
  const topic = String(input.topic || "the given topic").trim();
  const questionsPerLevel = Number(
    input.additionalContext?.questionsPerLevel || 3,
  );

  // Helper: Check if text contains Devanagari script (Hindi)
  const isHindi = (text: string): boolean => /[\u0900-\u097F]/.test(text);

  try {
    // Prepare API inputs - translate subject/topic if in Hindi
    let apiSubject = subject;
    let apiTopic = topic;

    if (isHindi(subject) || isHindi(topic)) {
      console.log(
        `[QuestionGenerator] 🇮🇳 Detected Hindi in input. Translating to English for API...`,
      );
      if (isHindi(subject)) {
        apiSubject = await translateText(subject, "english");
        console.log(
          `[QuestionGenerator] Subject translation: "${subject}" → "${apiSubject}"`,
        );
      }
      if (isHindi(topic)) {
        apiTopic = await translateText(topic, "english");
        console.log(
          `[QuestionGenerator] Topic translation: "${topic}" → "${apiTopic}"`,
        );
      }
    }

    // Update the user message with translated inputs
    const translatedUserMessage = `${buildStudentContext(input)}
Subject: ${apiSubject}
Topic: ${apiTopic}
Number of questions per level: ${questionsPerLevel}

Generate questions at all 4 difficulty levels: easy, medium, hard, and thinking (application-based).`;

    // Always try API first (generate in English - free models work reliably)
    console.log(
      `[QuestionGenerator] 🔄 Attempting API call to generate questions in English...`,
    );
    const result = await callOpenAI(systemPrompt, translatedUserMessage, 3000);
    const parsed = safeJsonParse(result);

    console.log(
      `[QuestionGenerator] API response: Language=${language}, Response length=${result.length}, Has questions=${"questions" in parsed}`,
    );

    if (Object.keys(parsed).length === 0 || !parsed.questions) {
      // API failed - use fallback
      console.warn(
        `[QuestionGenerator] ⚠️  API returned empty/invalid. Using fallback with language: ${language}`,
      );
      return {
        success: true,
        agentName: "QuestionGeneratorAgent",
        isFallback: true,
        data: {
          ...buildFallbackQuestions(
            language,
            subject,
            topic,
            questionsPerLevel,
          ),
          generatedBy: "fallback",
          targetLanguage: language,
        },
        processingTime: Date.now() - start,
      };
    }

    // API succeeded - translate if needed (using optimized batch translation)
    let finalData = parsed;
    if (language !== "english") {
      console.log(
        `[QuestionGenerator] 🌐 Batch translating ${Object.keys(parsed.questions).length * questionsPerLevel * 3} items to ${language}...`,
      );
      finalData = await translateQuestionsResponse(
        parsed as any,
        language as "hindi" | "hinglish",
      );
      console.log(`[QuestionGenerator] ✅ Translation complete`);
    }

    return {
      success: true,
      agentName: "QuestionGeneratorAgent",
      data: {
        ...finalData,
        generatedBy: "api",
        targetLanguage: language,
      },
      processingTime: Date.now() - start,
    };
  } catch (error) {
    console.error(`[QuestionGenerator] ❌ Error:`, error);
    // Fallback on exception
    return {
      success: true,
      agentName: "QuestionGeneratorAgent",
      isFallback: true,
      data: {
        ...buildFallbackQuestions(language, subject, topic, questionsPerLevel),
        generatedBy: "error-fallback",
        targetLanguage: language,
      },
      processingTime: Date.now() - start,
    };
  }
};
