import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { importJsonSeed } from "@/domain/import/json-importer";
import { importWorkbookSeed } from "@/domain/import/workbook-importer";
import { canonicalRecordsEqual, reconcileCatalogs } from "@/domain/import/reconciliation";
import { validateCatalog } from "@/domain/import/integrity";
import { InMemoryRevisionStore } from "@/domain/import/revision-store";

const revisionDir = path.join(process.cwd(), "data", "revisions", "v1.0.1");
const jsonPath = path.join(revisionDir, "kent_lgbtq_homelessness_resource_seed.json");
const workbookPath = path.join(revisionDir, "Kent_LGBTQ_Homelessness_Resource_Database_v1.0.1.xlsx");
const workbookOptions = { triageVerifiedOn: "2026-07-31" } as const;

async function imports() {
  const [jsonBytes, workbookBytes] = await Promise.all([fs.readFile(jsonPath), fs.readFile(workbookPath)]);
  return Promise.all([Promise.resolve(importJsonSeed(jsonBytes)), importWorkbookSeed(workbookBytes, undefined, workbookOptions)]);
}

describe("controlled dataset imports", () => {
  it("imports the required v1.0.1 counts and resolves every reference", async () => {
    const [jsonImport] = await imports();
    const result = validateCatalog(jsonImport.catalog);
    expect(result).toMatchObject({ passed: true, counts: { services: 60, councils: 13, triageRoutes: 12, scripts: 12, evidenceChecklist: 12, sources: 73 } });
    expect(jsonImport.catalog.services.find((service) => service.id === "srv_samaritans")?.sourceId).toBe("src_samaritans");
  });

  it("produces identical canonical records from JSON and workbook", async () => {
    const [jsonImport, workbookImport] = await imports();
    expect(canonicalRecordsEqual(jsonImport.catalog, workbookImport.catalog)).toBe(true);
  });

  it("keeps the Samaritans email transition out of public contact channels", async () => {
    const [jsonImport] = await imports();
    const samaritans = jsonImport.catalog.services.find((service) => service.id === "srv_samaritans");
    expect(samaritans?.contacts.map((contact) => contact.type)).toEqual(["telephone", "website"]);
    expect(samaritans?.contacts.some((contact) => contact.value.includes("jo@"))).toBe(false);
  });

  it("is idempotent and creates review items for conflicting imports", async () => {
    const [jsonImport] = await imports();
    const store = new InMemoryRevisionStore();
    const first = store.stage(jsonImport);
    const second = store.stage(jsonImport);
    expect(second.id).toBe(first.id);
    store.publish(first.id, { version: "v1.0.1", parentVersion: "v1", reason: "authorised repair", effectiveDate: "2026-08-01" });
    const conflictingCatalog = structuredClone(jsonImport.catalog);
    conflictingCatalog.services[0]!.name = "Changed without approval";
    const conflict = store.stage({ ...jsonImport, fileSha256: "A".repeat(64), catalog: conflictingCatalog });
    expect(conflict.status).toBe("review_required");
    expect(conflict.reviewItems).toContainEqual(expect.objectContaining({ collection: "services", externalId: "srv_999", field: "name", classification: "changed" }));
    expect(() => store.publish(conflict.id, { version: "v1.0.2", parentVersion: "v1.0.1", reason: "unapproved", effectiveDate: "2026-08-02" })).toThrow(/explicit approval/);
  });

  it("quarantines unresolved source references", async () => {
    const [jsonImport] = await imports();
    const catalog = structuredClone(jsonImport.catalog);
    catalog.services[0]!.sourceId = "src_missing";
    const store = new InMemoryRevisionStore();
    const staged = store.stage({ ...jsonImport, fileSha256: "B".repeat(64), catalog });
    expect(staged.status).toBe("rejected");
    expect(staged.integrity.issues).toContainEqual(expect.objectContaining({ code: "UNRESOLVED_SOURCE" }));
    expect(() => store.publish(staged.id, { version: "bad", parentVersion: null, reason: "bad", effectiveDate: "2026-08-01" })).toThrow(/cannot be published/);
  });

  it("retains semantic parity after the controlled artifact export and re-import", async () => {
    const bytes = await fs.readFile(workbookPath);
    const workbookImport = await importWorkbookSeed(bytes, undefined, workbookOptions);
    const jsonImport = importJsonSeed(await fs.readFile(jsonPath));
    const audit = JSON.parse(await fs.readFile(path.join(process.cwd(), "artifacts", "v1.0.1", "audit", "reconciliation-report.json"), "utf8")) as { comparisons: Record<string, { cellDifferences: unknown[] }> };
    expect(canonicalRecordsEqual(workbookImport.catalog, jsonImport.catalog)).toBe(true);
    expect(Object.values(audit.comparisons).every((collection) => collection.cellDifferences.length === 0)).toBe(true);
  });

  it("records only the authorised v1 to v1.0.1 content changes", async () => {
    const originalBytes = await fs.readFile(path.join(process.cwd(), "data", "source", "kent_lgbtq_homelessness_resource_seed.json"));
    const revisedBytes = await fs.readFile(jsonPath);
    const original = importJsonSeed(originalBytes).catalog;
    const revised = importJsonSeed(revisedBytes).catalog;
    const changes = reconcileCatalogs(original, revised);
    expect(changes.filter((change) => change.collection === "sources")).toEqual([expect.objectContaining({ externalId: "src_samaritans", classification: "added" })]);
    expect(new Set(changes.filter((change) => change.collection === "services").map((change) => change.externalId))).toEqual(new Set(["srv_samaritans"]));
    expect(changes.some((change) => !["services", "sources"].includes(change.collection))).toBe(false);
  });
});
