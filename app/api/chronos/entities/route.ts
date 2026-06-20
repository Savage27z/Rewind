import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryItems } from "@/lib/dynamo";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  try {
    const result = await queryItems({
      pk: `TENANT#${userId}`,
      skPrefix: "ENTITY#",
      limit,
    });

    return NextResponse.json({
      items: result.items,
      hasMore: !!result.lastKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
