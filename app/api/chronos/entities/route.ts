import { NextRequest, NextResponse } from "next/server";
import { queryItems } from "@/lib/dynamo";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") || "playground";
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  try {
    const result = await queryItems({
      pk: `TENANT#${tenantId}`,
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
