import OpenAI from "openai";
import { MockAiService } from "./mock";
import type {
  ExtractedTender,
  GeneratedBid,
  SourcingRecommendation,
} from "./types";

/** Pull the first JSON object out of a model response. */
function parseJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in model response.");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/**
 * Free / open-source AI provider via Groq's OpenAI-compatible endpoint
 * (https://api.groq.com/openai/v1). Selected with AI_PROVIDER=groq and
 * GROQ_API_KEY; the model is AI_MODEL (default llama-3.3-70b-versatile).
 *
 * It extends the mock so the deterministic methods (eligibility, match score)
 * are reused, and overrides only the generative ones. Every generative call is
 * wrapped so that a missing/failed/rate-limited request falls back to the mock
 * output — the demo never breaks (Build Spec sections 3, 9.5). The LLM is never
 * in the scoring or money path: savings/margin are computed deterministically
 * upstream and only phrased here.
 */
export class GroqAiService extends MockAiService {
  private client: OpenAI;
  private model: string;

  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    this.model = process.env.AI_MODEL ?? "llama-3.3-70b-versatile";
  }

  private async complete<T>(system: string, user: string): Promise<T> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = res.choices[0]?.message?.content ?? "";
    return parseJson<T>(text);
  }

  override async extractRequirements(input: {
    rawText: string;
  }): Promise<ExtractedTender> {
    const system =
      "You extract structured data from Pakistani government tender notices. " +
      "Respond with ONLY a JSON object, no prose, matching this schema: " +
      '{"requirements":string[],"documentsNeeded":string[],' +
      '"keyDates":{"preBid"?:string,"close"?:string},"scope":string}.';
    try {
      return await this.complete<ExtractedTender>(
        system,
        `Tender text:\n${input.rawText}`,
      );
    } catch (err) {
      logFallback("extractRequirements", err);
      return super.extractRequirements(input);
    }
  }

  override async generateBid(input: {
    tenderTitle: string;
    extracted: ExtractedTender;
    company: {
      legalName: string;
      categoryExperience: string[];
      certifications: string[];
    };
  }): Promise<GeneratedBid> {
    const system =
      "You draft bid-pack sections for a supplier bidding on a Pakistani tender. " +
      "Never claim certifications or experience the company does not have. " +
      'Respond with ONLY a JSON object: {"blocks":[{"type":"cover_letter"|' +
      '"technical_proposal"|"financial_bid","title":string,"content":string,' +
      '"aiGenerated":true}]}.';
    const user =
      `Company: ${input.company.legalName}\n` +
      `Experience: ${input.company.categoryExperience.join(", ") || "none stated"}\n` +
      `Certifications on file: ${input.company.certifications.join(", ") || "none"}\n` +
      `Tender: ${input.tenderTitle}\n` +
      `Requirements: ${input.extracted.requirements.join("; ")}\n` +
      `Scope: ${input.extracted.scope}`;
    try {
      return await this.complete<GeneratedBid>(system, user);
    } catch (err) {
      logFallback("generateBid", err);
      return super.generateBid(input);
    }
  }

  override async sourcingRecommendation(input: {
    tenderTitle: string;
    inputCostPkr: number;
    bestSupplier?: string;
    bestOrigin?: "local" | "import";
    savingsPkr?: number;
    marginLiftPct?: number;
  }): Promise<SourcingRecommendation> {
    // Savings and margin lift are computed deterministically upstream (Supplier
    // Hub, Build Spec section 9.6). The model only writes the sentence and must
    // echo the supplied figures, never invent its own (section 9.5).
    const system =
      "You write a one-sentence sourcing recommendation for a Pakistani " +
      "supplier bidding on a tender. If savings figures are provided, use them " +
      "verbatim and do NOT invent different numbers. Respond with ONLY a JSON " +
      'object: {"text":string,"estimatedMarginLiftPct":number}.';
    const facts =
      input.bestSupplier && input.savingsPkr
        ? `Cheapest supplier: ${input.bestSupplier} (${input.bestOrigin ?? "local"}). ` +
          `Procurement saving: PKR ${input.savingsPkr}. ` +
          `Margin lift: ${input.marginLiftPct ?? 0} points.`
        : `Estimated input cost: PKR ${input.inputCostPkr}.`;
    try {
      return await this.complete<SourcingRecommendation>(
        system,
        `Tender: ${input.tenderTitle}\n${facts}`,
      );
    } catch (err) {
      logFallback("sourcingRecommendation", err);
      return super.sourcingRecommendation(input);
    }
  }
}

function logFallback(method: string, err: unknown) {
  const reason = err instanceof Error ? err.message : String(err);
  console.warn(
    `[lib/ai] Groq ${method} failed (${reason}); falling back to the mock provider.`,
  );
}
