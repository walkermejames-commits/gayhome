import fs from "node:fs/promises";
import path from "node:path";
import { importJsonSeed } from "../src/domain/import/json-importer";
import { importWorkbookSeed } from "../src/domain/import/workbook-importer";
import { canonicalRecordsEqual, reconcileCatalogs } from "../src/domain/import/reconciliation";
import { InMemoryRevisionStore } from "../src/domain/import/revision-store";

const root = process.cwd();
const revisionDir = path.join(root, "data", "revisions", "v1.0.1");
const jsonPath = path.join(revisionDir, "kent_lgbtq_homelessness_resource_seed.json");
const workbookPath = path.join(revisionDir, "Kent_LGBTQ_Homelessness_Resource_Database_v1.0.1.xlsx");
const manifestPath = path.join(revisionDir, "revision-manifest.json");
const [jsonBytes, workbookBytes, manifestBytes] = await Promise.all([fs.readFile(jsonPath), fs.readFile(workbookPath), fs.readFile(manifestPath)]);
const manifest = JSON.parse(manifestBytes.toString("utf8")) as { workbookSupplementalFields: { triageRoutesVerifiedOn: string } };
const [jsonImport, workbookImport] = await Promise.all([
  Promise.resolve(importJsonSeed(jsonBytes, path.basename(jsonPath))),
  importWorkbookSeed(workbookBytes, path.basename(workbookPath), { triageVerifiedOn: manifest.workbookSupplementalFields.triageRoutesVerifiedOn }),
]);
if (!canonicalRecordsEqual(jsonImport.catalog, workbookImport.catalog)) {
  console.error(JSON.stringify(reconcileCatalogs(jsonImport.catalog, workbookImport.catalog).slice(0, 20), null, 2));
  throw new Error("JSON and workbook canonical records do not match");
}
const store = new InMemoryRevisionStore();
const jsonStaged = store.stage(jsonImport);
const jsonStagedAgain = store.stage(jsonImport);
if (jsonStaged.id !== jsonStagedAgain.id) throw new Error("Import idempotency failed");
const revision = store.publish(jsonStaged.id, {
  version: "v1.0.1",
  parentVersion: "v1",
  reason: "Resolve DATA-001 and update Samaritans 2026 contact transition",
  effectiveDate: "2026-08-01",
});
console.log(JSON.stringify({
  revision: { id: revision.id, version: revision.version, parentVersion: revision.parentVersion },
  jsonImport: { id: jsonStaged.id, status: jsonStaged.status, sha256: jsonImport.fileSha256 },
  workbook: { sha256: workbookImport.fileSha256, equivalentCanonicalRecords: true },
  counts: jsonStaged.integrity.counts,
  idempotent: true,
}, null, 2));
