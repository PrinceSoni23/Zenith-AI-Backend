import axios, { AxiosError } from "axios";

export interface AgentInput {
  userId: string;
  classLevel?: string;
  board?: string;
  preferredLanguage?: string;
  subject?: string;
  topic?: string;
  content?: string;
  mode?: string;
  question?: string;
  imageBase64?: string;
  mimeType?: string;
  additionalContext?: Record<string, unknown>;
}

export interface AgentOutput {
  success: boolean;
  data: Record<string, unknown>;
  agentName: string;
  processingTime: number;
  error?: string;
}

// NVIDIA models available on build.nvidia.com
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_API_URL =
  process.env.NVIDIA_API_URL ||
  "https://integrate.api.nvidia.com/v1/chat/completions";

const FREE_MODELS = [
  "meta/llama-3.2-11b-vision-instruct", // Meta Llama 3.2 11B Vision — multimodal
];

/**
 * Attempts to repair a truncated JSON string from an LLM that hit a token limit.
 * Strategy: find the last complete top-level key-value pair and close all open
 * brackets/braces so JSON.parse can succeed.
 */
function repairJSON(raw: string): string {
  // Already valid — return as-is
  try {
    JSON.parse(raw);
    return raw;
  } catch {}

  // Truncate to the last complete value by walking back from the end
  // looking for the boundary of a complete JSON value before the cut-off
  let s = raw.trimEnd();

  // Remove trailing comma or partial key/value
  s = s.replace(/,\s*$/, "");
  s = s.replace(/,\s*"[^"]*$/, ""); // trailing partial key
  s = s.replace(/"[^"]*$/, ""); // trailing unclosed string

  // Count unclosed brackets and braces and close them
  const stack: string[] = [];
  let inString = false;
  let escape = false;
  for (const ch of s) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }

  // Close in reverse order
  for (let i = stack.length - 1; i >= 0; i--) {
    s += stack[i] === "{" ? "}" : "]";
  }

  try {
    JSON.parse(s);
    return s;
  } catch {
    // Last resort — return empty object
    return "{}";
  }
}

export const callOpenAI = async (
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1500,
): Promise<string> => {
  const model = process.env.NVIDIA_MODEL || FREE_MODELS[0];

  try {
    const headers = {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const payload = {
      model,
      messages: [
        {
          role: "system",
          content:
            systemPrompt +
            "\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just raw JSON.",
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: false,
    };

    const response = await axios.post(NVIDIA_API_URL, payload, {
      headers,
      responseType: "json",
      timeout: 30000,
    });

    const raw = response.data?.choices?.[0]?.message?.content || "{}";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return repairJSON(cleaned) || "{}";
  } catch (err: unknown) {
    let errorDetails = "";
    if ((err as AxiosError).response) {
      const axiosErr = err as AxiosError;
      errorDetails = `Status: ${axiosErr.response?.status}, Data: ${JSON.stringify(axiosErr.response?.data)}`;
      console.error(`[NVIDIA API Error with model ${model}]:`, errorDetails);
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[NVIDIA API Error with model ${model}]:`, msg);
    }
    // Return empty object as fallback
    console.warn("[NVIDIA API] Request failed, returning mock response");
    return "{}";
  }
};

// ── Vision models — multimodal, using NVIDIA API ────────────────────────────
const FREE_VISION_MODELS = [
  "meta/llama-3.2-11b-vision-instruct", // Meta Llama 3.2 11B Vision — multimodal, supports images
];

export const callVision = async (
  systemPrompt: string,
  question: string,
  imageBase64: string,
  mimeType: string,
  maxTokens = 1500,
): Promise<string> => {
  const model = process.env.NVIDIA_MODEL || FREE_VISION_MODELS[0];

  try {
    const headers = {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const payload = {
      model,
      messages: [
        {
          role: "system",
          content:
            systemPrompt +
            "\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just raw JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: question,
            },
          ],
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: false,
    };

    const response = await axios.post(NVIDIA_API_URL, payload, {
      headers,
      responseType: "json",
      timeout: 30000,
    });

    const raw = response.data?.choices?.[0]?.message?.content || "{}";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return repairJSON(cleaned) || "{}";
  } catch (err: unknown) {
    let errorDetails = "";
    if ((err as AxiosError).response) {
      const axiosErr = err as AxiosError;
      errorDetails = `Status: ${axiosErr.response?.status}, Data: ${JSON.stringify(axiosErr.response?.data)}`;
      console.error(
        `[NVIDIA API Vision Error with model ${model}]:`,
        errorDetails,
      );
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[NVIDIA API Vision Error with model ${model}]:`, msg);
    }
    // Return empty object as fallback
    console.warn("[NVIDIA API Vision] Request failed, returning mock response");
    return "{}";
  }
};

export const buildStudentContext = (input: AgentInput): string => {
  return `Student Context:
- Class: ${input.classLevel || "Not specified"}
- Board: ${input.board || "CBSE"}
- Language: ${input.preferredLanguage || "English"}
- Subject: ${input.subject || "General"}`;
};

/**
 * Safely parses AI response and returns empty object if it fails
 * Used for fallback responses when API is unavailable
 */
export const safeJsonParse = (jsonString: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(jsonString);
    // If result is empty object or minimal, it's likely a fallback
    return Object.keys(parsed).length > 0 ? parsed : {};
  } catch {
    return {};
  }
};
