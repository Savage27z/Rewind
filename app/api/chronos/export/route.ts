import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEventsForEntity } from "@/lib/event-store";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const format = searchParams.get("format") || "json";
  const since = searchParams.get("since") || undefined;

  if (!entityId) {
    return new Response(JSON.stringify({ error: "Missing entityId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const events = await getEventsForEntity(entityId, since);
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    if (format === "csv") {
      const headers = [
        "eventId",
        "timestamp",
        "eventType",
        "entityType",
        "entityId",
        "sequenceNumber",
        "payload",
      ];
      const rows = events.map((e) =>
        [
          e.eventId,
          e.timestamp,
          e.eventType,
          e.entityType,
          e.entityId,
          e.sequenceNumber,
          JSON.stringify(e.payload).replace(/"/g, '""'),
        ].join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${entityId}-history.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(events, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${entityId}-history.json"`,
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
