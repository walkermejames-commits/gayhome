import { createHash } from "node:crypto";
import { canonicaliseSeed, seedSchema, type CanonicalCatalog } from "@/domain/catalog";

export const JSON_PARSER_VERSION = "1.0.0";

export interface ImportEnvelope {
  kind: "json" | "workbook";
  fileName: string;
  fileSha256: string;
  parserVersion: string;
  catalog: CanonicalCatalog;
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

export function importJsonSeed(bytes: Uint8Array, fileName = "kent_lgbtq_homelessness_resource_seed.json"): ImportEnvelope {
  const raw: unknown = JSON.parse(new TextDecoder().decode(bytes));
  const seed = seedSchema.parse(raw);
  return {
    kind: "json",
    fileName,
    fileSha256: sha256(bytes),
    parserVersion: JSON_PARSER_VERSION,
    catalog: canonicaliseSeed(seed),
  };
}
