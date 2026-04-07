export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// Worker wurde durch Vercel Cron ersetzt (/api/cron/publish)
export async function GET() {
  return NextResponse.json({ status: "Cron-basiertes Publishing aktiv" });
}

export async function POST() {
  return NextResponse.json({ status: "Cron-basiertes Publishing aktiv" });
}
