import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryItems } from "@/lib/dynamo";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    let result;

    if (entityId) {
      result = await queryItems({
        pk: `ENTITY#${entityId}`,
        skPrefix: "EVENT#",
        limit,
        scanForward: false,
      });
    } else if (entityType) {
      result = await queryItems({
        pk: `TYPE#${entityType}`,
        skBetween: from && to ? [from, `${to}~`] : undefined,
        limit,
        scanForward: false,
        indexName: "GSI2",
        pkField: "GSI2PK",
        skField: "GSI2SK",
      });
    } else {
      const startSk = from ? `EVENT#${from}` : "EVENT#";
      const endSk = to ? `EVENT#${to}~` : "EVENT#~";

      result = await queryItems({
        pk: `TENANT#${userId}`,
        skBetween: [startSk, endSk],
        limit,
        scanForward: false,
        indexName: "GSI1",
        pkField: "GSI1PK",
        skField: "GSI1SK",
      });
    }

    return NextResponse.json({
      items: result.items,
      cursor: result.lastKey
        ? Buffer.from(JSON.stringify(result.lastKey)).toString("base64")
        : undefined,
      hasMore: !!result.lastKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
