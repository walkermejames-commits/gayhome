import { z } from "zod";

export type RegionStatus = "published" | "preparing" | "blocked" | "retired";
export type RegionRecord = { id: string; name: string; country: string; nation: string; jurisdiction: string; datasetRevision: string | null; triageConfiguration: string | null; status: RegionStatus };

export const regionRegistry: ReadonlyArray<RegionRecord> = [
  { id: "kent-medway", name: "Kent and Medway", country: "United Kingdom", nation: "England", jurisdiction: "England and Wales", datasetRevision: "v1.0.1", triageConfiguration: "kent-v1.0.1", status: "published" },
  { id: "sussex", name: "Sussex preparation area", country: "United Kingdom", nation: "England", jurisdiction: "England and Wales", datasetRevision: null, triageConfiguration: null, status: "blocked" },
];

const resolutionInput = z.object({
  postcode: z.string().trim().max(12).optional(),
  selectedCouncil: z.string().trim().max(120).optional(),
  selectedDistrict: z.string().trim().max(120).optional(),
  currentLocation: z.string().trim().max(160).optional(),
  lastSettledAddress: z.string().trim().max(240).optional(),
  roughSleepingLocation: z.string().trim().max(160).optional(),
  userSelectedRegion: z.string().trim().max(80).optional(),
  currentAuthority: z.string().trim().max(120).optional(),
  previousAuthority: z.string().trim().max(120).optional(),
  preferredArea: z.string().trim().max(160).optional(),
  safeguardingRelocationNeeded: z.boolean().default(false),
});

export type RegionResolutionInput = z.input<typeof resolutionInput>;
export type RegionResolution = {
  country: string | null; regionId: string | null; authority: string | null; confidence: "confirmed" | "high" | "low" | "unresolved";
  method: "selected_authority" | "selected_region" | "configured_postcode" | "manual_required";
  alternatives: string[]; manualSelectionRequired: boolean; datasetRevision: string | null; triageConfiguration: string | null; legalJurisdiction: string | null;
  physicalLocation: string | null; approachAuthority: string | null; lastSettledAddress: string | null; localConnectionInformation: string | null;
  preferredArea: string | null; safeguardingRelocationNeeded: boolean;
};

export type ResolutionConfiguration = { authorityToRegion: Readonly<Record<string, string>>; postcodeToAuthorities: Readonly<Record<string, readonly string[]>> };

const normalise = (value: string) => value.trim().toLocaleLowerCase("en-GB");
const outcode = (postcode?: string) => postcode?.trim().toUpperCase().replace(/\s+/g, " ").split(" ")[0] ?? "";

export function resolveRegion(raw: RegionResolutionInput, config: ResolutionConfiguration): RegionResolution {
  const input = resolutionInput.parse(raw);
  const selectedAuthority = input.selectedCouncil ?? input.currentAuthority ?? input.selectedDistrict;
  let regionId: string | null = null;
  let authority: string | null = null;
  let confidence: RegionResolution["confidence"] = "unresolved";
  let method: RegionResolution["method"] = "manual_required";
  let alternatives: string[] = [];

  if (selectedAuthority) {
    regionId = config.authorityToRegion[normalise(selectedAuthority)] ?? null;
    authority = selectedAuthority;
    confidence = regionId ? "confirmed" : "low";
    method = regionId ? "selected_authority" : "manual_required";
  } else if (input.userSelectedRegion && regionRegistry.some((region) => region.id === input.userSelectedRegion)) {
    regionId = input.userSelectedRegion;
    confidence = "high";
    method = "selected_region";
  } else {
    alternatives = [...(config.postcodeToAuthorities[outcode(input.postcode)] ?? [])];
    if (alternatives.length === 1) {
      authority = alternatives[0]!;
      regionId = config.authorityToRegion[normalise(authority)] ?? null;
      confidence = regionId ? "high" : "low";
      method = regionId ? "configured_postcode" : "manual_required";
    }
  }

  const region = regionRegistry.find((candidate) => candidate.id === regionId) ?? null;
  const blocked = !region || region.status !== "published";
  return {
    country: region?.country ?? null, regionId, authority, confidence, method, alternatives,
    manualSelectionRequired: blocked || alternatives.length > 1 || !authority,
    datasetRevision: region?.status === "published" ? region.datasetRevision : null,
    triageConfiguration: region?.status === "published" ? region.triageConfiguration : null,
    legalJurisdiction: region?.jurisdiction ?? null,
    physicalLocation: input.currentLocation ?? input.roughSleepingLocation ?? null,
    approachAuthority: authority,
    lastSettledAddress: input.lastSettledAddress ?? null,
    localConnectionInformation: input.previousAuthority ?? null,
    preferredArea: input.preferredArea ?? null,
    safeguardingRelocationNeeded: input.safeguardingRelocationNeeded,
  };
}

const prefixes = new Map([["east-sussex", ["srv_esx", "council_esx", "route_esx"]], ["west-sussex", ["srv_wsx", "council_wsx", "route_wsx"]], ["brighton-hove", ["srv_bnh", "council_bnh", "route_bnh"]]]);
export function validateRegionalIdentifier(id: string, regionId: string, existingIds: ReadonlySet<string>, legacyIds: ReadonlySet<string> = new Set()) {
  if (legacyIds.has(id)) return { valid: true, legacy: true, warnings: ["Legacy ID retained; do not rewrite historical references."] };
  const allowed = prefixes.get(regionId) ?? [];
  const syntaxValid = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/.test(id);
  const prefixValid = allowed.some((prefix) => id.startsWith(`${prefix}_`));
  const collision = existingIds.has(id);
  return { valid: syntaxValid && prefixValid && !collision, legacy: false, warnings: [...(!syntaxValid ? ["Identifier syntax is invalid."] : []), ...(!prefixValid ? ["Identifier does not use the registered region prefix."] : []), ...(collision ? ["Identifier collides with an existing stable ID."] : [])] };
}

export function canPublishRegion(regionId: string, completedStages: number, humanApprovals: ReadonlySet<string>) {
  if (regionId === "sussex") return false;
  return completedStages === 15 && ["safeguarding", "legal", "accessibility", "regional_owner", "production"].every((approval) => humanApprovals.has(approval));
}
