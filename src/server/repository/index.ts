import "server-only";
import { getEnvironment } from "@/server/env";
import { FileCatalogRepository } from "@/server/repository/file-catalog-repository";
import { PostgresCatalogRepository } from "@/server/repository/postgres-catalog-repository";
import type { CatalogRepository } from "@/server/repository/types";

let repository: CatalogRepository | undefined;

export function getCatalogRepository(): CatalogRepository {
  if (repository) return repository;
  const environment = getEnvironment();
  if (environment.DATABASE_URL) repository = new PostgresCatalogRepository();
  else if (environment.APP_ENV === "staging" || environment.APP_ENV === "production") throw new Error("Database unavailable: staging and production require PostgreSQL.");
  else repository = new FileCatalogRepository();
  return repository;
}

export function setCatalogRepositoryForTests(next: CatalogRepository | undefined): void {
  repository = next;
}
