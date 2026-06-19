import { NextRequest, NextResponse } from "next/server";
import { ingestEvent } from "@/lib/event-store";
import { validateApiKey } from "@/lib/api-keys";
import type { IngestPayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key. Pass it via x-api-key header or Authorization: Bearer <key>" },
        { status: 401 }
      );
    }

    const keyData = await validateApiKey(apiKey);
    if (!keyData) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = (await request.json()) as IngestPayload;

    body.tenantId = keyData.userId;

    if (!body.entityType || !body.entityId || !body.eventType) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId, eventType" },
        { status: 400 }
      );
    }

    if (!["CREATE", "UPDATE", "DELETE"].includes(body.eventType)) {
      return NextResponse.json(
        { error: "eventType must be CREATE, UPDATE, or DELETE" },
        { status: 400 }
      );
    }

    if (body.eventType === "CREATE" && !body.payload?.after) {
      return NextResponse.json(
        { error: "CREATE events require payload.after" },
        { status: 400 }
      );
    }

    const result = await ingestEvent(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
