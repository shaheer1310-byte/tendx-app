import type { AiService } from "./types";
import { MockAiService } from "./mock";
import { AnthropicAiService } from "./anthropic";
import { GroqAiService } from "./groq";

export * from "./types";

/**
 * Resolve the active AI provider.
 *
 * Controlled by `AI_PROVIDER` (Build Spec section 13). Defaults to "mock" so the
 * app builds and runs with no API keys.
 *  - `groq`: free / open-source models via Groq's OpenAI-compatible endpoint
 *    (GROQ_API_KEY, model AI_MODEL). Falls back to the mock per-call on any
 *    failure or rate-limit, and entirely if no key is set.
 *  - `anthropic`: real Claude (ANTHROPIC_API_KEY, ANTHROPIC_MODEL).
 * In every case the deterministic methods (eligibility, match score, tax math)
 * stay in code, never the LLM (Build Spec section 9.5).
 */
let instance: AiService | null = null;

export function getAiService(): AiService {
  if (instance) return instance;

  const provider = process.env.AI_PROVIDER ?? "mock";
  switch (provider) {
    case "groq":
      if (process.env.GROQ_API_KEY) {
        instance = new GroqAiService();
      } else {
        console.warn(
          "[lib/ai] AI_PROVIDER=groq but GROQ_API_KEY is not set; falling back to the mock provider.",
        );
        instance = new MockAiService();
      }
      break;
    case "anthropic":
      if (process.env.ANTHROPIC_API_KEY) {
        instance = new AnthropicAiService();
      } else {
        console.warn(
          "[lib/ai] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set; falling back to the mock provider.",
        );
        instance = new MockAiService();
      }
      break;
    case "mock":
    default:
      instance = new MockAiService();
      break;
  }
  return instance;
}
