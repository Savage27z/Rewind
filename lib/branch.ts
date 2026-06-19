import { getEventsForEntity } from "./event-store";
import { computeDiff } from "./differ";
import { reconstructStateAt } from "./snapshot";
import type { BranchRequest, BranchResult, RewindEvent } from "./types";

export async function branchReality(
  request: BranchRequest
): Promise<BranchResult> {
  const allEvents = await getEventsForEntity(request.entityId);

  // Sort by sequence number
  allEvents.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  // Get original final state
  const originalState =
    (await reconstructStateAt(
      request.entityId,
      new Date().toISOString()
    )) || {};

  // Fork: take events up to forkTimestamp
  let forkedEvents = allEvents.filter(
    (e) => e.timestamp <= request.forkTimestamp
  );

  // Remove omitted events
  if (request.omitEventIds?.length) {
    forkedEvents = forkedEvents.filter(
      (e) => !request.omitEventIds!.includes(e.eventId)
    );
  }

  // Add events after fork point (minus omitted)
  const afterFork = allEvents
    .filter((e) => e.timestamp > request.forkTimestamp)
    .filter((e) => !request.omitEventIds?.includes(e.eventId));
  forkedEvents.push(...afterFork);

  // Insert synthetic events
  if (request.syntheticEvents?.length) {
    for (const synthetic of request.syntheticEvents) {
      forkedEvents.push({
        eventId: `synthetic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        tenantId: "",
        entityType: "",
        entityId: request.entityId,
        eventType: synthetic.eventType || "UPDATE",
        payload: synthetic.payload || { after: {} },
        sequenceNumber: synthetic.sequenceNumber || 0,
        timestamp: synthetic.timestamp || request.forkTimestamp,
        metadata: { synthetic: true },
      } as RewindEvent);
    }
  }

  // Sort by timestamp then sequence number
  forkedEvents.sort((a, b) => {
    const tDiff = a.timestamp.localeCompare(b.timestamp);
    if (tDiff !== 0) return tDiff;
    return a.sequenceNumber - b.sequenceNumber;
  });

  // Replay to produce hypothetical state
  let hypotheticalState: Record<string, unknown> = {};
  for (const event of forkedEvents) {
    switch (event.eventType) {
      case "CREATE":
        hypotheticalState = { ...(event.payload.after || {}) };
        break;
      case "UPDATE":
        hypotheticalState = {
          ...hypotheticalState,
          ...(event.payload.after || {}),
        };
        break;
      case "DELETE":
        hypotheticalState = {};
        break;
    }
  }

  const diff = computeDiff(
    request.entityId,
    "original",
    "hypothetical",
    originalState,
    hypotheticalState
  );

  return { originalState, hypotheticalState, diff };
}
