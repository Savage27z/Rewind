import type { DiffChange, DiffResult } from "./types";

export function deepDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  parentPath = ""
): DiffChange[] {
  const changes: DiffChange[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const path = parentPath ? `${parentPath}.${key}` : key;
    const bVal = before[key];
    const aVal = after[key];

    if (!(key in before)) {
      changes.push({ path, type: "addition", after: aVal });
    } else if (!(key in after)) {
      changes.push({ path, type: "deletion", before: bVal });
    } else if (
      typeof bVal === "object" &&
      bVal !== null &&
      typeof aVal === "object" &&
      aVal !== null &&
      !Array.isArray(bVal) &&
      !Array.isArray(aVal)
    ) {
      changes.push(
        ...deepDiff(
          bVal as Record<string, unknown>,
          aVal as Record<string, unknown>,
          path
        )
      );
    } else if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      changes.push({ path, type: "modification", before: bVal, after: aVal });
    }
  }

  return changes;
}

export function computeDiff(
  entityId: string,
  t1: string,
  t2: string,
  state1: Record<string, unknown>,
  state2: Record<string, unknown>
): DiffResult {
  const changes = deepDiff(state1, state2);
  return {
    entityId,
    t1,
    t2,
    additions: changes.filter((c) => c.type === "addition"),
    deletions: changes.filter((c) => c.type === "deletion"),
    modifications: changes.filter((c) => c.type === "modification"),
  };
}
