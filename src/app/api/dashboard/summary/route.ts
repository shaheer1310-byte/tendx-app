import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/server/dashboard";

export async function GET() {
  return NextResponse.json(await getDashboardSummary());
}
