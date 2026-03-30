import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

export const mentorAgent = async (input: AgentInput): Promise<AgentOutput> => {
  const start = Date.now();

  // Extract language from additionalContext or use direct property or fallback
  const rawLanguage =
    (input.additionalContext?.language as string) ||
    (input as any)?.language ||
    input.preferredLanguage ||
    "english";

  // Normalize to lowercase for consistent comparison
  const language = rawLanguage.toLowerCase().trim();

  const systemPrompt = `You are a supportive, wise AI mentor for school students.
You track student behavior and provide personalized guidance, encouragement, and career/study suggestions.
Be warm, understanding, and motivating — like a trusted elder sibling or teacher.

${
  language === "hindi"
    ? `LANGUAGE: Respond ENTIRELY in Hindi (Devanagari script).
Use simple, warm Hindi that students can understand.
Examples: "बहुत बढ़िया प्रयास!" "तुम सही रास्ते पर हो।"`
    : language === "hinglish"
      ? `LANGUAGE: Respond ENTIRELY in HINGLISH (Hindi in Roman script).
Be warm and supportive: "Bahut badhiya try! Tu bilkul sahi raste par hai."`
      : `LANGUAGE: Respond ENTIRELY in clear, simple English.`
}

Respond with valid JSON in this format:
{
  "greeting": "string (personalized greeting)",
  "todayMessage": "string (personalized message for today)",
  "feedback": "string (feedback on recent activity)",
  "encouragement": "string",
  "actionSuggestion": "string (one specific thing to do today)",
  "moodCheck": "string (question to check student's mood/wellbeing)",
  "streakMessage": "string",
  "weeklyInsight": "string",
  "motivationalQuote": "string"
}`;

  const userMessage = `${buildStudentContext(input)}
Student Name: ${input.additionalContext?.studentName || "Student"}
Streak: ${input.additionalContext?.streakDays || 0} days
Study score: ${input.additionalContext?.studyScore || 0}
Last activity: ${input.additionalContext?.lastActivity || "No recent activity"}
Mood/Status: ${input.additionalContext?.mood || "Unknown"}
Today's completed tasks: ${input.additionalContext?.completedTasks || 0}
Total tasks today: ${input.additionalContext?.totalTasks || 0}
Weak subjects: ${(input.additionalContext?.weakSubjects as string[])?.join(", ") || "None"}
Language: ${language === "hindi" ? "हिंदी (Hindi)" : language === "hinglish" ? "Hinglish" : "English"}

Provide a personalized mentor message for today.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 1500);
    const parsed = safeJsonParse(result);

    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "MentorAgent",
        isFallback: true,
        data: {
          greeting:
            language === "hindi"
              ? "नमस्ते, छात्र! वापसी पर स्वागत है!"
              : language === "hinglish"
                ? "Hello, Student! Welcome back!"
                : "Hello, Student! Welcome back!",
          todayMessage:
            language === "hindi"
              ? "आज एक बेहतरीन दिन है प्रगति करने का। तुम कर सकते हो!"
              : language === "hinglish"
                ? "Aaj ek behatarin din hai progress karne ke liye. Tu kar sakta hai!"
                : "Today is a great day to make progress. You've got this!",
          feedback:
            language === "hindi"
              ? "तुम बहुत अच्छा कर रहे हो। लगातार प्रयास जारी रखो और अपनी वृद्धि देखो।"
              : language === "hinglish"
                ? "Tu bahut accha kar raha hai. Lagatar mehnat karte raho!"
                : "You're doing well. Keep up the consistent effort and watch yourself grow.",
          encouragement:
            language === "hindi"
              ? "हर छोटा कदम जो तुम आज उठाते हो, वह तुम्हें अपने लक्ष्यों के करीब लाता है।"
              : language === "hinglish"
                ? "Har chhota kadam jo tu aaj uthata hai, wo tujhe apne goals ke karib lata hai."
                : "Every small step you take today brings you closer to your goals.",
          actionSuggestion:
            language === "hindi"
              ? "आज 20-30 मिनट का एक केंद्रित अध्ययन सत्र पूरा करने का प्रयास करो।"
              : language === "hinglish"
                ? "Aaj 20-30 min ka ek focused study session complete karne ki koshish karo."
                : "Try completing one focused study session of 20-30 minutes today.",
          moodCheck:
            language === "hindi"
              ? "आज तुम कैसा महसूस कर रहे हो? क्या कोई चुनौती है जिस पर बात करनी चाहिए?"
              : language === "hinglish"
                ? "Aaj tu kaisa feel kar raha hai? Kya koi challenge hai?"
                : "How are you feeling today? Any challenges you'd like to discuss?",
          streakMessage:
            language === "hindi"
              ? "तुम शानदार अध्ययन आदतें बना रहे हो!"
              : language === "hinglish"
                ? "Tu shandar study habits bana raha hai!"
                : "You're building great study habits!",
          weeklyInsight:
            language === "hindi"
              ? "इस हफ्ते, अपने कमजोर विषयों को मजबूत करने पर ध्यान दो।"
              : language === "hinglish"
                ? "Is hafta, apne weak subjects ko matabut karne par focus karo."
                : "This week, focus on strengthening your weak areas with targeted practice.",
          motivationalQuote:
            language === "hindi"
              ? "सफलता अंतिम नहीं है, विफलता घातक नहीं है। जारी रखने की हिम्मत महत्वपूर्ण है।"
              : language === "hinglish"
                ? "Success aakhri nahin hai, failure fatal nahin hai. Jaari rakhne ki himmat zaroori hai."
                : "Success is not final, failure is not fatal. It's the courage to continue that counts.",
        },
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "MentorAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "MentorAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
