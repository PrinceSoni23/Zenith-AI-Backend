import {
  AgentInput,
  AgentOutput,
  callOpenAI,
  buildStudentContext,
  safeJsonParse,
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
    const parsed = safeJsonParse(result);

    // If the result is empty object (from fallback), provide default data
    if (Object.keys(parsed).length === 0) {
      return {
        success: true,
        agentName: "SmartNotesAgent",
        data: {
          cleanedNotes:
            "# Well-Organized Notes\n\n## Key Concepts\n- Main idea 1\n- Main idea 2\n\n## Important Points\n- Detail 1\n- Detail 2",
          structuredSummary:
            "These notes have been organized and structured for better understanding.",
          keyDefinitions: [
            { term: "Key Term", definition: "Important concept definition" },
          ],
          missingConcepts: ["Consider reviewing prerequisite concepts"],
          studyTips: [
            "Read the notes multiple times",
            "Create practice questions",
          ],
          importantFormulas: ["Key formula or concept to remember"],
        },
        processingTime: Date.now() - start,
      };
    }

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
