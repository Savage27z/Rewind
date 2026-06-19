import { NextRequest } from "next/server";

// In-memory event bus for SSE
type Listener = (event: string) => void;
const listeners = new Set<Listener>();

export function broadcastEvent(event: Record<string, unknown>) {
  const data = JSON.stringify(event);
  for (const listener of listeners) {
    listener(data);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") || "playground";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const listener: Listener = (data: string) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.tenantId === tenantId || !parsed.tenantId) {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        } catch {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      };

      listeners.add(listener);

      // Send heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          listeners.delete(listener);
        }
      }, 30_000);

      // Cleanup on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        listeners.delete(listener);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
