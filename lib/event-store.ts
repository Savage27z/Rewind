import { ulid } from "ulid";
import { putItem, queryItems, getItem, updateItem } from "./dynamo";
import type { RewindEvent, IngestPayload, Snapshot } from "./types";
import { createSnapshot } from "./snapshot";
import { checkAnomalies } from "./anomaly";

const SNAPSHOT_INTERVAL = 50;

export async function ingestEvent(payload: IngestPayload): Promise<{
  eventId: string;
  timestamp: string;
  sequenceNumber: number;
}> {
  const timestamp = new Date().toISOString();
  const eventId = ulid();

  const event: RewindEvent = {
    eventId,
    tenantId: payload.tenantId,
    entityType: payload.entityType,
    entityId: payload.entityId,
    eventType: payload.eventType,
    payload: payload.payload,
    causationId: payload.causationId,
    sequenceNumber: payload.sequenceNumber,
    timestamp,
    metadata: payload.metadata,
  };

  // 1. Write event item
  await putItem(
    {
      PK: `ENTITY#${payload.entityId}`,
      SK: `EVENT#${timestamp}#${eventId}`,
      GSI1PK: `TENANT#${payload.tenantId}`,
      GSI1SK: `EVENT#${timestamp}`,
      GSI2PK: `TYPE#${payload.entityType}`,
      GSI2SK: timestamp,
      ...event,
    },
    "attribute_not_exists(SK)"
  );

  // 2. Update CURRENT state
  const currentState = payload.eventType === "DELETE" ? null : payload.payload.after;
  await putItem({
    PK: `TENANT#${payload.tenantId}`,
    SK: `CURRENT#${payload.entityId}`,
    entityId: payload.entityId,
    entityType: payload.entityType,
    currentState,
    lastEventAt: timestamp,
    lastEventType: payload.eventType,
  });

  // 3. Update or create entity record
  await putItem({
    PK: `TENANT#${payload.tenantId}`,
    SK: `ENTITY#${payload.entityId}`,
    entityId: payload.entityId,
    entityType: payload.entityType,
    lastEventAt: timestamp,
    createdAt: payload.eventType === "CREATE" ? timestamp : undefined,
  });

  // 4. Check if snapshot needed
  const eventsSinceSnapshot = await countEventsSinceLastSnapshot(
    payload.entityId,
    timestamp
  );
  if (eventsSinceSnapshot >= SNAPSHOT_INTERVAL && currentState) {
    await createSnapshot(
      payload.entityId,
      timestamp,
      currentState as Record<string, unknown>,
      eventsSinceSnapshot
    );
  }

  // 5. Run anomaly checks (non-blocking)
  checkAnomalies(event).catch(() => {});

  return { eventId, timestamp, sequenceNumber: payload.sequenceNumber };
}

async function countEventsSinceLastSnapshot(
  entityId: string,
  currentTimestamp: string
): Promise<number> {
  // Find latest snapshot
  const snapshots = await queryItems({
    pk: `ENTITY#${entityId}`,
    skPrefix: "SNAPSHOT#",
    limit: 1,
    scanForward: false,
  });

  const lastSnapshotSk = snapshots.items[0]?.SK as string | undefined;
  const sinceTimestamp = lastSnapshotSk
    ? lastSnapshotSk.replace("SNAPSHOT#", "")
    : "1970-01-01T00:00:00.000Z";

  const events = await queryItems({
    pk: `ENTITY#${entityId}`,
    skBetween: [`EVENT#${sinceTimestamp}`, `EVENT#${currentTimestamp}~`],
  });

  return events.items.length;
}

export async function getEventsForEntity(
  entityId: string,
  from?: string,
  to?: string
): Promise<RewindEvent[]> {
  const startSk = from ? `EVENT#${from}` : "EVENT#";
  const endSk = to ? `EVENT#${to}~` : "EVENT#~";

  const result = await queryItems({
    pk: `ENTITY#${entityId}`,
    skBetween: [startSk, endSk],
  });

  return result.items as unknown as RewindEvent[];
}

export async function getLatestSnapshotBefore(
  entityId: string,
  timestamp: string
): Promise<Snapshot | null> {
  const result = await queryItems({
    pk: `ENTITY#${entityId}`,
    skLessThan: `SNAPSHOT#${timestamp}~`,
    limit: 1,
    scanForward: false,
  });

  const snapshotItems = result.items.filter((item) =>
    (item.SK as string).startsWith("SNAPSHOT#")
  );

  if (snapshotItems.length === 0) return null;

  return snapshotItems[0] as unknown as Snapshot;
}
