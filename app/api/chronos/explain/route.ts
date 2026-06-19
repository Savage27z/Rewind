import { NextRequest } from "next/server";
import { explainEvent } from "@/lib/explain";
import { getEventsForEntity } from "@/lib/event-store";
import type { RewindEvent } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { eventId, entityId } = await request.json();

    if (!eventId || !entityId) {
      return new Response(
        JSON.stringify({ error: "Missing eventId or entityId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const allEvents = await getEventsForEntity(entityId);
    allEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const targetIndex = allEvents.findIndex((e) => e.eventId === eventId);
    if (targetIndex === -1) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetEvent = allEvents[targetIndex];
    const start = Math.max(0, targetIndex - 5);
    const end = Math.min(allEvents.length, targetIndex + 6);
    const contextEvents = allEvents.slice(start, end);

    const stream = await explainEvent(targetEvent, contextEvents);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
