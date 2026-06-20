import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { branchReality } from "@/lib/branch";
import type { BranchRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as BranchRequest;

    if (!body.entityId || !body.forkTimestamp) {
      return NextResponse.json(
        { error: "Missing required fields: entityId, forkTimestamp" },
        { status: 400 }
      );
    }

    const result = await branchReality(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
