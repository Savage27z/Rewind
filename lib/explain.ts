import Anthropic from "@anthropic-ai/sdk";
import type { RewindEvent } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function explainEvent(
  targetEvent: RewindEvent,
  contextEvents: RewindEvent[]
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = `You are a database forensics expert. Given an event and its surrounding context from a database event stream, explain in plain language what likely caused this change. Be specific about causal chains. Reference other events in the context if they're related. Keep it under 3 sentences.`;

  const contextStr = contextEvents
    .map(
      (e, i) =>
        `[${i + 1}] ${e.timestamp} | ${e.eventType} ${e.entityType}#${e.entityId} | seq:${e.sequenceNumber}${
          e.eventId === targetEvent.eventId ? " ← TARGET" : ""
        }\n    payload: ${JSON.stringify(e.payload).slice(0, 200)}`
    )
    .join("\n");

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Explain this database event:\n\nTarget event:\n${targetEvent.eventType} on ${targetEvent.entityType}#${targetEvent.entityId}\nTimestamp: ${targetEvent.timestamp}\nPayload: ${JSON.stringify(targetEvent.payload)}\n\nSurrounding context (chronological):\n${contextStr}`,
      },
    ],
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}
