import { putItem } from "./dynamo";
import { getEventsForEntity, getLatestSnapshotBefore } from "./event-store";
import type { RewindEvent, Snapshot } from "./types";
import { getFromCache, setInCache } from "./cache";

export async function createSnapshot(
  entityId: string,
  timestamp: string,
  state: Record<string, unknown>,
  eventCount: number
): Promise<void> {
  await putItem({
    PK: `ENTITY#${entityId}`,
    SK: `SNAPSHOT#${timestamp}`,
    entityId,
    timestamp,
    state,
    eventCount,
    snapshotVersion: 1,
  });
}

export async function reconstructStateAt(
  entityId: string,
  timestamp: string
): Promise<Record<string, unknown> | null> {
  const cacheKey = `state:${entityId}:${timestamp}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached as Record<string, unknown>;

  // Find latest snapshot before timestamp
  const snapshot = await getLatestSnapshotBefore(entityId, timestamp);

  let state: Record<string, unknown> = {};
  let fromTimestamp = "1970-01-01T00:00:00.000Z";

  if (snapshot) {
    state = { ...(snapshot.state || {}) };
    fromTimestamp = snapshot.timestamp;
  }

  // Get events between snapshot and target timestamp
  const events = await getEventsForEntity(entityId, fromTimestamp, timestamp);

  // Sort by sequenceNumber for deterministic replay
  events.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  // Replay events
  for (const event of events) {
    state = applyEvent(state, event);
  }

  setInCache(cacheKey, state);
  return Object.keys(state).length > 0 ? state : null;
}

function applyEvent(
  state: Record<string, unknown>,
  event: RewindEvent
): Record<string, unknown> {
  switch (event.eventType) {
    case "CREATE":
      return { ...(event.payload.after || {}) };
    case "UPDATE":
      return { ...state, ...(event.payload.after || {}) };
    case "DELETE":
      return {};
    default:
      return state;
  }
}
