interface MongooseSchema {
  post(event: string, fn: (doc: any) => void): void;
}

interface RewindOptions {
  endpoint: string;
  tenantId: string;
  entityType?: string;
}

export function rewindMiddleware(schema: MongooseSchema, options: RewindOptions) {
  const { endpoint, tenantId, entityType } = options;

  async function sendEvent(
    op: "CREATE" | "UPDATE" | "DELETE",
    entityId: string,
    eType: string,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null
  ) {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          entityType: eType,
          entityId,
          eventType: op,
          payload: { before, after },
          metadata: { source: "mongoose-middleware" },
        }),
      });
    } catch {
      // fire-and-forget
    }
  }

  schema.post("save", function (doc) {
    const eType = entityType || doc.constructor.modelName || "Unknown";
    const id = doc._id?.toString() || doc.id;
    if (doc.isNew) {
      sendEvent("CREATE", id, eType, null, doc.toObject());
    } else {
      const modified = doc.modifiedPaths();
      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      for (const path of modified) {
        before[path] = undefined;
        after[path] = doc.get(path);
      }
      sendEvent("UPDATE", id, eType, before, after);
    }
  });

  schema.post("findOneAndUpdate", function (doc) {
    if (!doc) return;
    const eType = entityType || doc.constructor.modelName || "Unknown";
    const id = doc._id?.toString() || doc.id;
    sendEvent("UPDATE", id, eType, {}, doc.toObject());
  });

  schema.post("findOneAndDelete", function (doc) {
    if (!doc) return;
    const eType = entityType || doc.constructor.modelName || "Unknown";
    const id = doc._id?.toString() || doc.id;
    sendEvent("DELETE", id, eType, doc.toObject(), null);
  });
}
