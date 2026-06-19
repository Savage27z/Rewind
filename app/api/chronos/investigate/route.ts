import { NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { putItem, queryItems, getItem } from "@/lib/dynamo";
import type { Investigation } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") || "playground";
  const investigationId = searchParams.get("id");

  try {
    if (investigationId) {
      const item = await getItem(
        `TENANT#${tenantId}`,
        `INVESTIGATION#${investigationId}`
      );
      if (!item) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    const result = await queryItems({
      pk: `TENANT#${tenantId}`,
      skPrefix: "INVESTIGATION#",
      limit: 50,
      scanForward: false,
    });

    return NextResponse.json({ items: result.items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || "playground";
    const investigationId = ulid();

    const investigation: Investigation = {
      investigationId,
      tenantId,
      title: body.title || "Untitled Investigation",
      createdBy: body.createdBy || "anonymous",
      createdAt: new Date().toISOString(),
      pinnedTimestamps: body.pinnedTimestamps || [],
      annotations: body.annotations || [],
      permalink: `/dashboard/investigate/${investigationId}`,
    };

    await putItem({
      PK: `TENANT#${tenantId}`,
      SK: `INVESTIGATION#${investigationId}`,
      ...investigation,
    });

    return NextResponse.json(investigation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || "playground";
    const { investigationId, ...updates } = body;

    if (!investigationId) {
      return NextResponse.json(
        { error: "Missing investigationId" },
        { status: 400 }
      );
    }

    const existing = await getItem(
      `TENANT#${tenantId}`,
      `INVESTIGATION#${investigationId}`
    );

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = { ...existing, ...updates };
    await putItem({
      PK: `TENANT#${tenantId}`,
      SK: `INVESTIGATION#${investigationId}`,
      ...updated,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
