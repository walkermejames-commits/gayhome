import type { CanonicalCatalog } from "@/domain/catalog";

export interface IntegrityIssue {
  code: string;
  collection: string;
  externalId?: string;
  message: string;
}

export interface IntegrityResult {
  passed: boolean;
  issues: IntegrityIssue[];
  counts: Record<string, number>;
}

const expectedV101Counts = { services: 60, councils: 13, triageRoutes: 12, scripts: 12, evidenceChecklist: 12, sources: 73 };

function duplicateIds(rows: { id?: string; source_id?: string; script_id?: string; evidence_id?: string }[], id: (row: (typeof rows)[number]) => string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const value = id(row);
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export function validateCatalog(catalog: CanonicalCatalog, enforceV101Counts = true): IntegrityResult {
  const issues: IntegrityIssue[] = [];
  const counts: Record<string, number> = {
    services: catalog.services.length,
    councils: catalog.councils.length,
    triageRoutes: catalog.triageRoutes.length,
    scripts: catalog.scripts.length,
    evidenceChecklist: catalog.evidenceChecklist.length,
    sources: catalog.sources.length,
  };
  if (enforceV101Counts) {
    for (const [collection, expected] of Object.entries(expectedV101Counts)) {
      if (counts[collection] !== expected) issues.push({ code: "COUNT_MISMATCH", collection, message: `Expected ${expected}, received ${counts[collection]}` });
    }
  }

  const duplicateChecks: Array<[string, string[]]> = [
    ["services", duplicateIds(catalog.services, (row) => row.id ?? "")],
    ["councils", duplicateIds(catalog.councils, (row) => row.id ?? "")],
    ["triageRoutes", duplicateIds(catalog.triageRoutes, (row) => row.id ?? "")],
    ["scripts", duplicateIds(catalog.scripts, (row) => row.script_id ?? "")],
    ["evidenceChecklist", duplicateIds(catalog.evidenceChecklist, (row) => row.evidence_id ?? "")],
    ["sources", duplicateIds(catalog.sources, (row) => row.source_id ?? "")],
  ];
  for (const [collection, ids] of duplicateChecks) {
    for (const externalId of ids) issues.push({ code: "DUPLICATE_ID", collection, externalId, message: `Duplicate stable ID ${externalId}` });
  }

  const sourceIds = new Set(catalog.sources.map((source) => source.source_id));
  for (const service of catalog.services) {
    if (!sourceIds.has(service.sourceId)) issues.push({ code: "UNRESOLVED_SOURCE", collection: "services", externalId: service.id, message: `Missing source ${service.sourceId}` });
  }
  for (const council of catalog.councils) {
    if (!sourceIds.has(council.sourceId)) issues.push({ code: "UNRESOLVED_SOURCE", collection: "councils", externalId: council.id, message: `Missing source ${council.sourceId}` });
  }

  const serviceIds = new Set(catalog.services.map((service) => service.id));
  const councilIds = new Set(catalog.councils.map((council) => council.id));
  for (const route of catalog.triageRoutes) {
    if (route.urgency === "critical" && route.targetIds.length === 0) issues.push({ code: "CRITICAL_ROUTE_EMPTY", collection: "triageRoutes", externalId: route.id, message: "Critical route has no target" });
    for (const target of route.targetIds) {
      if (target !== "council_by_area" && !serviceIds.has(target) && !councilIds.has(target)) {
        issues.push({ code: "UNRESOLVED_ROUTE_TARGET", collection: "triageRoutes", externalId: route.id, message: `Unresolved target ${target}` });
      }
    }
  }

  return { passed: issues.length === 0, issues, counts };
}
