import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getBid } from "@/server/bids";
import { isProfessional } from "@/server/plan";
import { getActiveCompany } from "@/server/tenant";

const STATUS_LABEL: Record<string, string> = {
  ai_generated: "AI-GENERATED",
  drafted: "DRAFTED",
  ready: "READY",
  missing: "MISSING - upload required",
};

/** Render the bid pack to a PDF (Build Spec section 8). Professional only. */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!isProfessional()) {
    return NextResponse.json(
      { error: "Bid generation requires the Professional plan." },
      { status: 403 },
    );
  }

  const bid = await getBid(params.id);
  if (!bid) {
    return NextResponse.json({ error: "Bid not found." }, { status: 404 });
  }

  const company = await getActiveCompany();
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(10 / 255, 37 / 255, 64 / 255);
  const slate = rgb(100 / 255, 118 / 255, 138 / 255);
  const margin = 56;
  const pageWidth = 595; // A4 portrait
  const pageHeight = 842;
  const maxWidth = pageWidth - margin * 2;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function ensureSpace(needed: number) {
    if (y - needed < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function wrap(text: string, size: number, f: typeof font): string[] {
    const lines: string[] = [];
    for (const rawLine of text.split("\n")) {
      let current = "";
      for (const word of rawLine.split(/\s+/)) {
        const candidate = current ? `${current} ${word}` : word;
        if (f.widthOfTextAtSize(candidate, size) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      lines.push(current);
    }
    return lines;
  }

  function draw(
    text: string,
    size: number,
    f: typeof font,
    color = rgb(0.04, 0.1, 0.17),
    gap = 4,
  ) {
    for (const line of wrap(text, size, f)) {
      ensureSpace(size + gap);
      page.drawText(line, { x: margin, y, size, font: f, color });
      y -= size + gap;
    }
  }

  draw("TendX Bid Pack", 22, bold, navy, 8);
  draw(bid.tenderTitle, 13, font, slate, 6);
  draw(
    `${company.legalName}  -  generated ${bid.createdAt}  -  status: ${bid.status.replace("_", " ")}`,
    10,
    font,
    slate,
    14,
  );

  for (const doc of bid.documents) {
    y -= 8;
    ensureSpace(40);
    draw(`${doc.title}  (${STATUS_LABEL[doc.status] ?? doc.status})`, 13, bold, navy, 6);
    if (doc.content) {
      draw(doc.content, 11, font);
    } else if (doc.status === "ready") {
      draw("All mandatory compliance items are in order.", 11, font, slate);
    } else if (doc.status === "missing") {
      draw("This document is required and has not been uploaded yet.", 11, font, slate);
    }
  }

  const bytes = await pdf.save();
  const fileName = `bid-pack-${bid.id.slice(0, 8)}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
