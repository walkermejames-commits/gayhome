import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = process.env.DATASET_DIR ? path.resolve(root, process.env.DATASET_DIR) : path.join(root, "data", "source");
const outDir = process.env.AUDIT_DIR ? path.resolve(root, process.env.AUDIT_DIR) : path.join(root, "artifacts", "phase0");
const seed = JSON.parse(await fs.readFile(path.join(dataDir, "kent_lgbtq_homelessness_resource_seed.json"), "utf8"));
const extract = JSON.parse(await fs.readFile(path.join(outDir, "dataset-extract.json"), "utf8"));

const configs = {
  services: {
    sheet: "Services",
    columns: {
      "Service ID": "id", Name: "name", Provider: "provider", Type: "type", Coverage: "coverage", Ages: "ages",
      "Condition tags": "tags", Access: "modes", Phone: "phone", Email: "email", URL: "url", Hours: "hours",
      "Referral / access": "referral", "LGBTQ+ focus": "lgbtq", Urgency: "urgency", Notes: "notes",
      "Source ID": "sourceId", Verified: "verifiedOn", Status: "status",
    },
    id: "id",
  },
  councils: {
    sheet: "Councils",
    columns: {
      "Council ID": "council_id", Council: "council_name", Area: "area", "Homelessness URL": "homelessness_url",
      Phone: "phone", "Hours / emergency": "hours_notes", "Route notes": "route_notes", "Source ID": "source_id",
      Verified: "verified_on", Status: "status",
    },
    id: "council_id",
  },
  triage_routes: {
    sheet: "Triage routes",
    columns: {
      "Route ID": "route_id", Trigger: "trigger_name", "Condition tags": "condition_tags",
      "Recommended action": "recommended_action", "Target IDs": "target_ids", Urgency: "urgency", "Safety note": "safety_note",
    },
    id: "route_id",
  },
  scripts: {
    sheet: "Scripts",
    columns: { "Script ID": "script_id", Title: "title", Audience: "audience", Script: "script_text", "Use note": "use_note" },
    id: "script_id",
  },
  evidence_checklist: {
    sheet: "Evidence checklist",
    columns: { "Evidence ID": "evidence_id", Area: "area", "Useful evidence": "useful_evidence", "Safety / handling note": "safety_note" },
    id: "evidence_id",
  },
  sources: {
    sheet: "Sources & QA",
    columns: {
      "Source ID": "source_id", "Source name": "source_name", URL: "source_url", "Publisher type": "publisher_type",
      Verified: "verified_on", "Review after (days)": "review_after_days", "QA note": "notes",
    },
    id: "source_id",
  },
};

function clean(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(clean).join("|");
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).replace(/\r\n/g, "\n").trim();
}

function sheetRows(name) {
  const sheet = extract.workbook.sheets.find((item) => item.name === name);
  const headers = sheet.rows[1].map(clean);
  return sheet.rows.slice(2).filter((row) => row.some((cell) => clean(cell) !== "")).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
}

const comparisons = {};
for (const [collection, config] of Object.entries(configs)) {
  const workbookRows = sheetRows(config.sheet).map((row) =>
    Object.fromEntries(Object.entries(config.columns).map(([header, field]) => [field, row[header]])),
  );
  const jsonRows = seed[collection];
  const workbookById = new Map(workbookRows.map((row) => [clean(row[config.id]), row]));
  const jsonById = new Map(jsonRows.map((row) => [clean(row[config.id]), row]));
  const missingInWorkbook = [...jsonById.keys()].filter((id) => !workbookById.has(id));
  const extraInWorkbook = [...workbookById.keys()].filter((id) => !jsonById.has(id));
  const cellDifferences = [];
  for (const [id, jsonRow] of jsonById) {
    const workbookRow = workbookById.get(id);
    if (!workbookRow) continue;
    for (const field of Object.values(config.columns)) {
      if (clean(jsonRow[field]) !== clean(workbookRow[field])) {
        cellDifferences.push({ id, field, json: clean(jsonRow[field]), workbook: clean(workbookRow[field]) });
      }
    }
  }
  comparisons[collection] = {
    jsonCount: jsonRows.length,
    workbookCount: workbookRows.length,
    missingInWorkbook,
    extraInWorkbook,
    cellDifferences,
    jsonOnlyFields: [...new Set(jsonRows.flatMap(Object.keys))].filter((field) => !Object.values(config.columns).includes(field)),
  };
}

const duplicateIds = {};
for (const name of Object.keys(configs)) {
  const idField = configs[name].id;
  const counts = new Map();
  for (const row of seed[name]) counts.set(clean(row[idField]), (counts.get(clean(row[idField])) ?? 0) + 1);
  duplicateIds[name] = [...counts.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
}

const sourceIds = new Set(seed.sources.map((row) => row.source_id));
const serviceIds = new Set(seed.services.map((row) => row.id));
const councilIds = new Set(seed.councils.map((row) => row.council_id));
const permittedRouteTokens = new Set(["council_by_area"]);
const splitPipe = (value) => Array.isArray(value) ? value : clean(value).split("|").map((part) => part.trim()).filter(Boolean);
const unresolvedServiceSources = seed.services.filter((row) => !sourceIds.has(row.sourceId)).map((row) => ({ id: row.id, sourceId: row.sourceId }));
const unresolvedCouncilSources = seed.councils.filter((row) => !sourceIds.has(row.source_id)).map((row) => ({ id: row.council_id, sourceId: row.source_id }));
const unresolvedRouteTargets = seed.triage_routes.flatMap((route) => splitPipe(route.target_ids)
  .filter((target) => !serviceIds.has(target) && !councilIds.has(target) && !permittedRouteTokens.has(target))
  .map((target) => ({ routeId: route.route_id, target })),
);

const asOf = new Date(`${process.env.AS_OF_DATE ?? "2026-08-01"}T00:00:00Z`);
const reviewSchedule = seed.sources.map((source) => {
  const next = new Date(`${source.verified_on}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + Number(source.review_after_days));
  return { sourceId: source.source_id, nextReviewDate: next.toISOString().slice(0, 10), overdue: next < asOf };
});

const report = {
  generatedAt: new Date().toISOString(),
  comparisons,
  integrity: {
    duplicateIds,
    unresolvedServiceSources,
    unresolvedCouncilSources,
    unresolvedRouteTargets,
    criticalRoutesWithoutTargets: seed.triage_routes.filter((row) => row.urgency === "critical" && splitPipe(row.target_ids).length === 0).map((row) => row.route_id),
  },
  verification: {
    asOf: asOf.toISOString().slice(0, 10),
    overdueCount: reviewSchedule.filter((row) => row.overdue).length,
    earliestNextReviewDate: reviewSchedule.map((row) => row.nextReviewDate).sort()[0],
    reviewSchedule,
  },
};

await fs.writeFile(path.join(outDir, "reconciliation-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({
  comparisons: Object.fromEntries(Object.entries(comparisons).map(([name, result]) => [name, {
    jsonCount: result.jsonCount,
    workbookCount: result.workbookCount,
    missing: result.missingInWorkbook.length,
    extra: result.extraInWorkbook.length,
    differences: result.cellDifferences.length,
    jsonOnlyFields: result.jsonOnlyFields,
  }])),
  integrity: {
    duplicateIdCount: Object.values(duplicateIds).flat().length,
    unresolvedServiceSources: unresolvedServiceSources.length,
    unresolvedCouncilSources: unresolvedCouncilSources.length,
    unresolvedRouteTargets,
    criticalRoutesWithoutTargets: report.integrity.criticalRoutesWithoutTargets,
  },
  verification: report.verification,
}, null, 2));
