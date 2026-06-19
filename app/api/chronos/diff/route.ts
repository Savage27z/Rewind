import { NextRequest, NextResponse } from "next/server";
import { reconstructStateAt } from "@/lib/snapshot";
import { computeDiff } from "@/lib/differ";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const t1 = searchParams.get("t1");
  const t2 = searchParams.get("t2");

  if (!entityId || !t1 || !t2) {
    return NextResponse.json(
      { error: "Missing required params: entityId, t1, t2" },
      { status: 400 }
    );
  }

  try {
    const [state1, state2] = await Promise.all([
      reconstructStateAt(entityId, t1),
      reconstructStateAt(entityId, t2),
    ]);

    const diff = computeDiff(entityId, t1, t2, state1 || {}, state2 || {});
    return NextResponse.json(diff);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
