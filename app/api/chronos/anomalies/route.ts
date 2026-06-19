import { NextRequest, NextResponse } from "next/server";
import { getAnomalies } from "@/lib/anomaly";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") || "playground";
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    const anomalies = await getAnomalies(tenantId, from, to, limit);
    return NextResponse.json({ items: anomalies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
