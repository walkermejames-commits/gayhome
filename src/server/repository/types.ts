import type { CanonicalCatalog } from "@/domain/catalog";

export interface RepositoryHealth {
  storage: "controlled_files" | "postgresql";
  connected: boolean;
  migrationCurrent: boolean;
  activeRevision: string | null;
  integrityPassed: boolean;
}

export interface CatalogRepository {
  getCatalog(): Promise<CanonicalCatalog>;
  getHealth(): Promise<RepositoryHealth>;
}
