import type { RewindEvent } from "./types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nex-agi/nex-n2-pro:free",
      max_tokens: 300,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Explain this database event:\n\nTarget event:\n${targetEvent.eventType} on ${targetEvent.entityType}#${targetEvent.entityId}\nTimestamp: ${targetEvent.timestamp}\nPayload: ${JSON.stringify(targetEvent.payload)}\n\nSurrounding context (chronological):\n${contextStr}`,
        },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      let sentDone = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            sentDone = true;
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } catch {}
        }
      }
      if (!sentDone) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
      controller.close();
    },
  });
}
