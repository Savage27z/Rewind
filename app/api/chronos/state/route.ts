import { NextRequest, NextResponse } from "next/server";
import { reconstructStateAt } from "@/lib/snapshot";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const timestamp = searchParams.get("timestamp");

  if (!entityId || !timestamp) {
    return NextResponse.json(
      { error: "Missing required params: entityId, timestamp" },
      { status: 400 }
    );
  }

  try {
    const state = await reconstructStateAt(entityId, timestamp);
    return NextResponse.json({ entityId, timestamp, state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
