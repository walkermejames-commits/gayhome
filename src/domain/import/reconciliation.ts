import type { CanonicalCatalog } from "@/domain/catalog";

export interface ReconciliationItem {
  collection: string;
  externalId: string;
  field: string | null;
  classification: "added" | "removed" | "changed";
  currentValue: unknown;
  proposedValue: unknown;
}

type Identified = Record<string, unknown>;

function compareCollection(collection: string, left: Identified[], right: Identified[], idField: string): ReconciliationItem[] {
  const current = new Map(left.map((row) => [String(row[idField]), row]));
  const proposed = new Map(right.map((row) => [String(row[idField]), row]));
  const items: ReconciliationItem[] = [];
  for (const [id, row] of current) {
    if (!proposed.has(id)) items.push({ collection, externalId: id, field: null, classification: "removed", currentValue: row, proposedValue: null });
  }
  for (const [id, row] of proposed) {
    const previous = current.get(id);
    if (!previous) {
      items.push({ collection, externalId: id, field: null, classification: "added", currentValue: null, proposedValue: row });
      continue;
    }
    const fields = new Set([...Object.keys(previous), ...Object.keys(row)]);
    for (const field of fields) {
      if (JSON.stringify(previous[field]) !== JSON.stringify(row[field])) {
        items.push({ collection, externalId: id, field, classification: "changed", currentValue: previous[field], proposedValue: row[field] });
      }
    }
  }
  return items;
}

export function reconcileCatalogs(current: CanonicalCatalog, proposed: CanonicalCatalog): ReconciliationItem[] {
  return [
    ...compareCollection("services", current.services as unknown as Identified[], proposed.services as unknown as Identified[], "id"),
    ...compareCollection("councils", current.councils as unknown as Identified[], proposed.councils as unknown as Identified[], "id"),
    ...compareCollection("triageRoutes", current.triageRoutes as unknown as Identified[], proposed.triageRoutes as unknown as Identified[], "id"),
    ...compareCollection("scripts", current.scripts as unknown as Identified[], proposed.scripts as unknown as Identified[], "script_id"),
    ...compareCollection("evidenceChecklist", current.evidenceChecklist as unknown as Identified[], proposed.evidenceChecklist as unknown as Identified[], "evidence_id"),
    ...compareCollection("sources", current.sources as unknown as Identified[], proposed.sources as unknown as Identified[], "source_id"),
  ];
}

export function canonicalRecordsEqual(left: CanonicalCatalog, right: CanonicalCatalog): boolean {
  return reconcileCatalogs(left, right).length === 0;
}
