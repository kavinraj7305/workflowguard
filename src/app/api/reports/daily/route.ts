import { NextResponse } from "next/server";
import { requireHr } from "@/lib/api/auth";
import { buildDailyReport } from "@/lib/reports/daily";

export async function GET() {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const report = await buildDailyReport(session.orgId);
  return NextResponse.json(report);
}
