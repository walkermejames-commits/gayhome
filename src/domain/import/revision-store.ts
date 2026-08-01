import { randomUUID } from "node:crypto";
import type { CanonicalCatalog } from "@/domain/catalog";
import type { ImportEnvelope } from "@/domain/import/json-importer";
import { validateCatalog, type IntegrityResult } from "@/domain/import/integrity";
import { reconcileCatalogs, type ReconciliationItem } from "@/domain/import/reconciliation";

export interface StoredImport {
  id: string;
  idempotencyKey: string;
  status: "quarantined" | "validated" | "review_required" | "published" | "rejected";
  envelope: ImportEnvelope;
  integrity: IntegrityResult;
  reviewItems: ReconciliationItem[];
}

export interface DatasetRevision {
  id: string;
  version: string;
  parentVersion: string | null;
  reason: string;
  effectiveDate: string;
  sourceImportId: string;
  catalog: CanonicalCatalog;
}

export class InMemoryRevisionStore {
  readonly imports = new Map<string, StoredImport>();
  readonly revisions = new Map<string, DatasetRevision>();
  activeVersion: string | null = null;

  stage(envelope: ImportEnvelope): StoredImport {
    const key = `${envelope.fileSha256}:${envelope.parserVersion}:${envelope.kind}`;
    const existing = this.imports.get(key);
    if (existing) return existing;
    const integrity = validateCatalog(envelope.catalog);
    const current = this.activeVersion ? this.revisions.get(this.activeVersion)?.catalog : undefined;
    const reviewItems = current ? reconcileCatalogs(current, envelope.catalog) : [];
    const record: StoredImport = {
      id: randomUUID(),
      idempotencyKey: key,
      status: integrity.passed ? (reviewItems.length ? "review_required" : "validated") : "rejected",
      envelope,
      integrity,
      reviewItems,
    };
    this.imports.set(key, record);
    return record;
  }

  publish(importId: string, input: { version: string; parentVersion: string | null; reason: string; effectiveDate: string; approveReviewItems?: boolean }): DatasetRevision {
    const staged = [...this.imports.values()].find((item) => item.id === importId);
    if (!staged) throw new Error("Import does not exist");
    if (!staged.integrity.passed) throw new Error("Quarantined or invalid imports cannot be published");
    if (staged.reviewItems.length > 0 && !input.approveReviewItems) throw new Error("Conflicts require an explicit approval decision");
    const existing = this.revisions.get(input.version);
    if (existing) return existing;
    const revision: DatasetRevision = { id: randomUUID(), sourceImportId: staged.id, catalog: staged.envelope.catalog, ...input };
    this.revisions.set(input.version, revision);
    this.activeVersion = input.version;
    staged.status = "published";
    return revision;
  }
}
