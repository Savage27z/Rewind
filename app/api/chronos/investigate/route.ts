import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ulid } from "ulid";
import { putItem, queryItems, getItem } from "@/lib/dynamo";
import type { Investigation } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const investigationId = searchParams.get("id");

  try {
    if (investigationId) {
      const item = await getItem(
        `TENANT#${userId}`,
        `INVESTIGATION#${investigationId}`
      );
      if (!item) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    const result = await queryItems({
      pk: `TENANT#${userId}`,
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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const investigationId = ulid();

    const investigation: Investigation = {
      investigationId,
      tenantId: userId,
      title: body.title || "Untitled Investigation",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      pinnedTimestamps: body.pinnedTimestamps || [],
      annotations: body.annotations || [],
      permalink: `/dashboard/investigate/${investigationId}`,
    };

    await putItem({
      PK: `TENANT#${userId}`,
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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { investigationId, ...updates } = body;

    if (!investigationId) {
      return NextResponse.json(
        { error: "Missing investigationId" },
        { status: 400 }
      );
    }

    const existing = await getItem(
      `TENANT#${userId}`,
      `INVESTIGATION#${investigationId}`
    );

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = { ...existing, ...updates };
    await putItem({
      PK: `TENANT#${userId}`,
      SK: `INVESTIGATION#${investigationId}`,
      ...updated,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
