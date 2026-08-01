import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { CanonicalCatalog } from "@/domain/catalog";
import { importJsonSeed } from "@/domain/import/json-importer";
import { validateCatalog } from "@/domain/import/integrity";
import type { CatalogRepository, RepositoryHealth } from "@/server/repository/types";

export class FileCatalogRepository implements CatalogRepository {
  private catalogPromise: Promise<CanonicalCatalog> | undefined;

  private async load(): Promise<CanonicalCatalog> {
    const filePath = path.join(process.cwd(), "data", "revisions", "v1.0.1", "kent_lgbtq_homelessness_resource_seed.json");
    const imported = importJsonSeed(await fs.readFile(filePath), path.basename(filePath));
    const integrity = validateCatalog(imported.catalog);
    if (!integrity.passed) throw new Error(`Published dataset failed integrity validation: ${integrity.issues.map((issue) => issue.code).join(", ")}`);
    return imported.catalog;
  }

  getCatalog(): Promise<CanonicalCatalog> {
    this.catalogPromise ??= this.load();
    return this.catalogPromise;
  }

  async getHealth(): Promise<RepositoryHealth> {
    const catalog = await this.getCatalog();
    return { storage: "controlled_files", connected: true, migrationCurrent: false, activeRevision: catalog.metadata.version, integrityPassed: validateCatalog(catalog).passed };
  }
}
