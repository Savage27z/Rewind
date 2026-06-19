import { ulid } from "ulid";
import { putItem, queryItems, getItem } from "./dynamo";
import type { Anomaly, RewindEvent, InferredSchema } from "./types";

// In-memory sliding windows for velocity tracking
const velocityWindows = new Map<string, number[]>();

export async function checkAnomalies(event: RewindEvent): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  const velocityAnomaly = checkVelocity(event);
  if (velocityAnomaly) anomalies.push(velocityAnomaly);

  const schemaAnomaly = await checkSchemaDrift(event);
  if (schemaAnomaly) anomalies.push(schemaAnomaly);

  const seqAnomaly = await checkSequenceGap(event);
  if (seqAnomaly) anomalies.push(seqAnomaly);

  for (const anomaly of anomalies) {
    await storeAnomaly(anomaly);
  }

  return anomalies;
}

function checkVelocity(event: RewindEvent): Anomaly | null {
  const key = `${event.tenantId}:${event.entityType}:${event.eventType}`;
  const now = Date.now();
  const window = velocityWindows.get(key) || [];

  // Keep only last 60 seconds
  const cutoff = now - 60_000;
  const filtered = window.filter((t) => t > cutoff);
  filtered.push(now);
  velocityWindows.set(key, filtered);

  if (filtered.length < 10) return null;

  // Simple threshold: more than 50 events in 60 seconds for DELETE, 200 for others
  const threshold = event.eventType === "DELETE" ? 50 : 200;

  if (filtered.length > threshold) {
    return {
      anomalyId: ulid(),
      tenantId: event.tenantId,
      timestamp: event.timestamp,
      type: "velocity",
      severity: "critical",
      entityType: event.entityType,
      message: `${event.eventType} events for '${event.entityType}' spiked to ${filtered.length}/min (threshold: ${threshold}/min)`,
      details: { rate: filtered.length, threshold, eventType: event.eventType },
    };
  }

  return null;
}

async function checkSchemaDrift(event: RewindEvent): Promise<Anomaly | null> {
  if (!event.payload.after || event.eventType === "DELETE") return null;

  const currentFields = inferFieldTypes(event.payload.after);
  const schemaItem = await getItem(
    `TENANT#${event.tenantId}`,
    `META#SCHEMA#${event.entityType}`
  );

  if (!schemaItem) {
    // First time seeing this entity type — store schema
    await putItem({
      PK: `TENANT#${event.tenantId}`,
      SK: `META#SCHEMA#${event.entityType}`,
      entityType: event.entityType,
      fields: currentFields,
      lastUpdated: event.timestamp,
    });
    return null;
  }

  const storedFields = schemaItem.fields as Record<string, string>;
  const drifts: string[] = [];

  for (const [field, type] of Object.entries(currentFields)) {
    if (storedFields[field] && storedFields[field] !== type) {
      drifts.push(
        `Field '${field}' changed from ${storedFields[field]} to ${type}`
      );
    }
  }

  if (drifts.length > 0) {
    // Update stored schema
    await putItem({
      PK: `TENANT#${event.tenantId}`,
      SK: `META#SCHEMA#${event.entityType}`,
      entityType: event.entityType,
      fields: { ...storedFields, ...currentFields },
      lastUpdated: event.timestamp,
    });

    return {
      anomalyId: ulid(),
      tenantId: event.tenantId,
      timestamp: event.timestamp,
      type: "schema_drift",
      severity: "warning",
      entityType: event.entityType,
      entityId: event.entityId,
      message: drifts.join("; "),
      details: { drifts, currentFields, storedFields },
    };
  }

  return null;
}

async function checkSequenceGap(event: RewindEvent): Promise<Anomaly | null> {
  if (event.sequenceNumber <= 1) return null;

  // Query the previous event for this entity
  const result = await queryItems({
    pk: `ENTITY#${event.entityId}`,
    skPrefix: "EVENT#",
    limit: 2,
    scanForward: false,
  });

  if (result.items.length < 2) return null;

  const prevEvent = result.items[1] as unknown as RewindEvent;
  const expectedSeq = prevEvent.sequenceNumber + 1;

  if (event.sequenceNumber > expectedSeq) {
    return {
      anomalyId: ulid(),
      tenantId: event.tenantId,
      timestamp: event.timestamp,
      type: "sequence_gap",
      severity: "warning",
      entityType: event.entityType,
      entityId: event.entityId,
      message: `Sequence gap detected: expected ${expectedSeq}, got ${event.sequenceNumber} (${event.sequenceNumber - expectedSeq} events missing)`,
      details: {
        expectedSeq,
        actualSeq: event.sequenceNumber,
        gap: event.sequenceNumber - expectedSeq,
      },
    };
  }

  return null;
}

function inferFieldTypes(obj: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null) result[key] = "null";
    else if (Array.isArray(val)) result[key] = "array";
    else result[key] = typeof val;
  }
  return result;
}

async function storeAnomaly(anomaly: Anomaly): Promise<void> {
  await putItem({
    PK: `TENANT#${anomaly.tenantId}`,
    SK: `ANOMALY#${anomaly.timestamp}#${anomaly.anomalyId}`,
    GSI1PK: `TENANT#${anomaly.tenantId}`,
    GSI1SK: `ANOMALY#${anomaly.timestamp}`,
    ...anomaly,
  });
}

export async function getAnomalies(
  tenantId: string,
  from?: string,
  to?: string,
  limit = 50
): Promise<Anomaly[]> {
  const startSk = from ? `ANOMALY#${from}` : "ANOMALY#";
  const endSk = to ? `ANOMALY#${to}~` : "ANOMALY#~";

  const result = await queryItems({
    pk: `TENANT#${tenantId}`,
    skBetween: [startSk, endSk],
    limit,
    scanForward: false,
  });

  return result.items as unknown as Anomaly[];
}
