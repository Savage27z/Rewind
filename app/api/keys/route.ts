import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createApiKey, listApiKeys, deleteApiKey } from "@/lib/api-keys";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const keys = await listApiKeys(userId);
    return NextResponse.json({ keys });
  } catch {
    return NextResponse.json({ keys: [] });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const label = body.label || "Default";

  try {
    const result = await createApiKey(userId, label);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { keyId } = await request.json();
  if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

  try {
    const deleted = await deleteApiKey(userId, keyId);
    if (!deleted) return NextResponse.json({ error: "Key not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
