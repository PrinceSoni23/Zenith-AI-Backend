import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
} from "./base.agent";

export const smartNotesAgent = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const start = Date.now();

  const systemPrompt = `You are an expert educational notes organizer for school students.
Your job is to:
1. Clean messy or raw notes
2. Create structured, easy-to-read summaries
3. Identify missing or incomplete concepts
4. Add helpful headers and bullet points
Respond with valid JSON in this format:
{
  "cleanedNotes": "string (well-formatted markdown)",
  "structuredSummary": "string",
  "keyDefinitions": [{"term": "string", "definition": "string"}],
  "missingConcepts": ["concept1", "concept2"],
  "studyTips": ["tip1", "tip2"],
  "importantFormulas": ["formula1", "formula2"]
}`;

  const userMessage = `${buildStudentContext(input)}
Subject: ${input.subject}
Topic: ${input.topic}

Raw Notes / Content:
${input.content}

Please clean, organize and improve these notes.`;

  try {
    const result = await callOpenAI(systemPrompt, userMessage, 2000);
    const parsed = JSON.parse(result);

    return {
      success: true,
      agentName: "SmartNotesAgent",
      data: parsed,
      processingTime: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      agentName: "SmartNotesAgent",
      data: {},
      error: String(error),
      processingTime: Date.now() - start,
    };
  }
};
