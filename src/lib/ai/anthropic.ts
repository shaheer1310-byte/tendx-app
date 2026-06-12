import Anthropic from "@anthropic-ai/sdk";
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
 * Real Anthropic Claude provider (Build Spec section 3). Selected with
 * AI_PROVIDER=anthropic. It extends the mock so the deterministic methods
 * (eligibility, match score) are reused, and overrides only the generative
 * methods: requirement extraction, bid drafting and the sourcing sentence.
 * Each prompt asks for strict JSON (Build Spec sections 9.1-9.6).
 */
export class AnthropicAiService extends MockAiService {
  private client: Anthropic;
  private model: string;

  constructor() {
    super();
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";
  }

  private async complete<T>(system: string, user: string): Promise<T> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return parseJson<T>(text);
  }

  override async extractRequirements({
    rawText,
  }: {
    rawText: string;
  }): Promise<ExtractedTender> {
    const system =
      'You extract structured data from Pakistani government tender notices. ' +
      'Respond with ONLY a JSON object, no prose, matching this schema: ' +
      '{"requirements":string[],"documentsNeeded":string[],' +
      '"keyDates":{"preBid"?:string,"close"?:string},"scope":string}.';
    return this.complete<ExtractedTender>(system, `Tender text:\n${rawText}`);
  }

  override async generateBid(input: {
    tenderTitle: string;
    extracted: ExtractedTender;
    company: { legalName: string; categoryExperience: string[]; certifications: string[] };
  }): Promise<GeneratedBid> {
    const system =
      'You draft bid-pack sections for a supplier bidding on a Pakistani tender. ' +
      'Never claim certifications or experience the company does not have. ' +
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
    return this.complete<GeneratedBid>(system, user);
  }

  override async sourcingRecommendation(input: {
    tenderTitle: string;
    inputCostPkr: number;
    bestSupplier?: string;
    bestOrigin?: "local" | "import";
    savingsPkr?: number;
    marginLiftPct?: number;
  }): Promise<SourcingRecommendation> {
    // The savings and margin lift are computed deterministically upstream (the
    // Supplier Hub, Build Spec section 9.6). The model only writes the sentence
    // and must echo the supplied figures, never invent its own (section 9.5).
    const system =
      'You write a one-sentence sourcing recommendation for a Pakistani ' +
      'supplier bidding on a tender. If savings figures are provided, use them ' +
      'verbatim and do NOT invent different numbers. Respond with ONLY a JSON ' +
      'object: {"text":string,"estimatedMarginLiftPct":number}.';
    const facts =
      input.bestSupplier && input.savingsPkr
        ? `Cheapest supplier: ${input.bestSupplier} (${input.bestOrigin ?? "local"}). ` +
          `Procurement saving: PKR ${input.savingsPkr}. ` +
          `Margin lift: ${input.marginLiftPct ?? 0} points.`
        : `Estimated input cost: PKR ${input.inputCostPkr}.`;
    return this.complete<SourcingRecommendation>(
      system,
      `Tender: ${input.tenderTitle}\n${facts}`,
    );
  }
}
