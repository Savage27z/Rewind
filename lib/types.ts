export type EventType = "CREATE" | "UPDATE" | "DELETE";

export interface RewindEvent {
  eventId: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  eventType: EventType;
  payload: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  causationId?: string;
  sequenceNumber: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Snapshot {
  entityId: string;
  timestamp: string;
  state: Record<string, unknown>;
  eventCount: number;
  snapshotVersion: number;
}

export interface EntityRecord {
  tenantId: string;
  entityId: string;
  entityType: string;
  createdAt: string;
  lastEventAt: string;
  eventCount: number;
}

export interface IngestPayload {
  tenantId: string;
  entityType: string;
  entityId: string;
  eventType: EventType;
  payload: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  causationId?: string;
  sequenceNumber: number;
  metadata?: Record<string, unknown>;
}

export interface IngestResponse {
  eventId: string;
  timestamp: string;
  sequenceNumber: number;
}

export interface DiffChange {
  path: string;
  type: "addition" | "deletion" | "modification";
  before?: unknown;
  after?: unknown;
}

export interface DiffResult {
  entityId: string;
  t1: string;
  t2: string;
  additions: DiffChange[];
  deletions: DiffChange[];
  modifications: DiffChange[];
}

export interface Anomaly {
  anomalyId: string;
  tenantId: string;
  timestamp: string;
  type: "velocity" | "schema_drift" | "sequence_gap";
  severity: "warning" | "critical";
  entityType: string;
  entityId?: string;
  message: string;
  details: Record<string, unknown>;
}

export interface Investigation {
  investigationId: string;
  tenantId: string;
  title: string;
  createdBy: string;
  createdAt: string;
  pinnedTimestamps: PinnedTimestamp[];
  annotations: Annotation[];
  permalink: string;
}

export interface PinnedTimestamp {
  id: string;
  timestamp: string;
  label: string;
  entityId?: string;
}

export interface Annotation {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  pinnedTimestampId?: string;
}

export interface BranchRequest {
  entityId: string;
  forkTimestamp: string;
  syntheticEvents?: Partial<RewindEvent>[];
  omitEventIds?: string[];
}

export interface BranchResult {
  originalState: Record<string, unknown>;
  hypotheticalState: Record<string, unknown>;
  diff: DiffResult;
}

export interface InferredSchema {
  entityType: string;
  fields: Record<string, string>;
  lastUpdated: string;
}

export interface TimelineQuery {
  tenantId: string;
  from?: string;
  to?: string;
  entityType?: string;
  eventType?: EventType;
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  cursor?: string;
  hasMore: boolean;
}
