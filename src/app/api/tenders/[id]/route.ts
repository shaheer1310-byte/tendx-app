import { NextResponse } from "next/server";
import { getTender } from "@/server/tenders";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const tender = await getTender(params.id);
  if (!tender) {
    return NextResponse.json({ error: "Tender not found." }, { status: 404 });
  }
  return NextResponse.json({ tender });
}
