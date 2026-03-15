import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

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

// Free model fallback chain — all confirmed live as of Feb 2026 (verified via OpenRouter API)
const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free", // Meta Llama 3.3 70B — high traffic, stable
  "openai/gpt-oss-20b:free", // OpenAI open-weight 20B MoE — free tier
  "openai/gpt-oss-120b:free", // OpenAI open-weight 120B MoE — free tier
  "stepfun/step-3.5-flash:free", // StepFun 196B MoE — 256K context
  "z-ai/glm-4.5-air:free", // Z.ai GLM 4.5 Air — 131K context
  "nvidia/nemotron-3-nano-30b-a3b:free", // NVIDIA Nemotron 30B — 256K context
  "qwen/qwen3-coder:free", // Qwen3 Coder 480B — 262K context
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
  const primaryModel = process.env.OPENAI_MODEL || FREE_MODELS[0];
  const allModels = [
    primaryModel,
    ...FREE_MODELS.filter(m => m !== primaryModel),
  ];

  let lastError: unknown;
  for (const model of allModels) {
    try {
      const response = await openai.chat.completions.create({
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
      });

      const raw = response.choices[0]?.message?.content || "{}";
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      return repairJSON(cleaned) || "{}";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Only fall through to next model on rate-limit or not-found errors
      if (
        msg.includes("429") ||
        msg.includes("404") ||
        msg.includes("No endpoints")
      ) {
        lastError = err;
        continue;
      }
      throw err; // re-throw any other error immediately
    }
  }

  throw lastError;
};

// ── Vision models — multimodal, free tier on OpenRouter ────────────────────
// Verified live as of March 14, 2026. Only nemotron-nano-12b-v2-vl has a
// confirmed :free endpoint. Others listed here are paid but very cheap
// fallbacks in case the free endpoint is rate-limited.
const FREE_VISION_MODELS = [
  "nvidia/nemotron-nano-12b-v2-vl:free", // NVIDIA 12B VL — $0, 99.3% uptime, confirmed free
  "meta-llama/llama-4-scout", // Llama 4 Scout — multimodal, ~$0.18/M (cheap fallback)
  "meta-llama/llama-4-maverick", // Llama 4 Maverick — multimodal, ~$0.22/M (cheap fallback)
  "qwen/qwen2.5-vl-72b-instruct", // Qwen 2.5 VL 72B — vision, ~$0.40/M (cheap fallback)
];

export const callVision = async (
  systemPrompt: string,
  question: string,
  imageBase64: string,
  mimeType: string,
  maxTokens = 1500,
): Promise<string> => {
  const primaryModel = process.env.VISION_MODEL || FREE_VISION_MODELS[0];
  const allModels = [
    primaryModel,
    ...FREE_VISION_MODELS.filter(m => m !== primaryModel),
  ];

  let lastError: unknown;
  for (const model of allModels) {
    try {
      const response = await openai.chat.completions.create({
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
      });

      const raw = response.choices[0]?.message?.content || "{}";
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      return repairJSON(cleaned) || "{}";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("429") ||
        msg.includes("404") ||
        msg.includes("No endpoints") ||
        msg.includes("unsupported")
      ) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError;
};

export const buildStudentContext = (input: AgentInput): string => {
  return `Student Context:
- Class: ${input.classLevel || "Not specified"}
- Board: ${input.board || "CBSE"}
- Language: ${input.preferredLanguage || "English"}
- Subject: ${input.subject || "General"}`;
};
