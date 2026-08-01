import "server-only";
import type { CanonicalCatalog } from "@/domain/catalog";
import { getCatalogRepository } from "@/server/repository";

export function getCatalog(): Promise<CanonicalCatalog> {
  return getCatalogRepository().getCatalog();
}
