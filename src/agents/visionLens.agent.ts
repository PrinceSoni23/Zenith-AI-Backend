import {
  AgentInput,
  AgentOutput,
  callVision,
  buildStudentContext,
  safeJsonParse,
} from "./base.agent";

export const visionLensAgent = async (
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

  const imageBase64 = input.imageBase64 || "";
  const mimeType = input.mimeType || "image/jpeg";
  const question = input.question || "Please explain what is in this image.";

  if (!imageBase64) {
    return {
      success: false,
      agentName: "VisionLensAgent",
      data: {},
      error: "No image provided.",
      processingTime: Date.now() - start,
    };
  }

  const systemPrompt = `You are a helpful AI tutor for school students.
A student has uploaded an image (could be a textbook page, diagram, whiteboard, or notes) and has a question about it.
Your job is to:
1. Carefully analyse the image
2. Answer the student's question clearly and simply
3. Pull out key learning points from the image
4. Suggest related topics they should explore
5. Give one practical study tip based on what you see

${
  language === "hindi"
    ? `LANGUAGE: Respond ENTIRELY in Hindi (Devanagari script).
Use simple Hindi: "यह दिखाता है कि..." "महत्वपूर्ण बिंदु:"`
    : language === "hinglish"
      ? `LANGUAGE: Respond ENTIRELY in HINGLISH (Hindi in Roman script).
Use familiar Hinglish: "Yeh dikhata hai ki..." "Mukhya points:"`
      : `LANGUAGE: Respond ENTIRELY in clear, simple English.`
}

Always explain things in simple language suitable for school students.

Respond with valid JSON in this exact format:
{
  "explanation": "string — clear, friendly answer to the student's question about the image",
  "keyPoints": ["point1", "point2", "point3"],
  "relatedTopics": ["topic1", "topic2"],
  "studyTip": "string — one actionable study tip based on what is in the image"
}`;

  const userQuestion = `${buildStudentContext(input)}
Language: ${language === "hindi" ? "हिंदी (Hindi)" : language === "hinglish" ? "Hinglish" : "English"}

Student's question: ${question}

Please analyse the image and answer accordingly.`;

  try {
    const result = await callVision(
      systemPrompt,
      userQuestion,
      imageBase64,
      mimeType,
      1500,
    );
    const parsed = safeJsonParse(result);

    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "VisionLensAgent",
        isFallback: true,
        data: {
          explanation:
            "This image contains educational content. Based on what's shown, here's the explanation: The key concept involves understanding the relationships between different elements shown in the image.",
          keyPoints: [
            "Main concept from the image",
            "Key relationship or principle",
            "Important detail to remember",
          ],
          relatedTopics: [
            "Related concept 1",
            "Related concept 2",
            "Related concept 3",
          ],
          studyTip:
            "When encountering similar images, focus on identifying the main elements and their relationships to understand the overall concept.",
        },
        processingTime: Date.now() - start,
      };
    }

    return {
      success: true,
      agentName: "VisionLensAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "VisionLensAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
