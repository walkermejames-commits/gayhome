import { z } from "zod";
import type { CanonicalCatalog, CanonicalCouncil, CanonicalRoute, CanonicalService, ContactChannel } from "@/domain/catalog";

export const triageInputSchema = z.object({
  conditions: z.array(z.string().trim().min(1)).min(1).max(30),
  area: z.string().trim().max(120).optional(),
});
export type TriageInput = z.infer<typeof triageInputSchema>;

export interface ResolvedTarget {
  kind: "service" | "council";
  id: string;
  name: string;
  service?: CanonicalService;
  council?: CanonicalCouncil;
}

export interface TriageRecommendation {
  route: CanonicalRoute;
  matchedConditions: string[];
  targets: ResolvedTarget[];
}

const urgencyRank = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export function publicContacts(service: CanonicalService, asOf: string): ContactChannel[] {
  return service.contacts.filter((contact) => {
    if (contact.publicDisplayRule === "hide" || contact.publicDisplayRule === "staff_only") return false;
    if (!contact.newUsersAccepted) return false;
    if (["retired", "existing_users_only", "temporarily_unavailable"].includes(contact.status)) return false;
    if (contact.validFrom && contact.validFrom > asOf) return false;
    if (contact.validUntil && contact.validUntil < asOf) return false;
    return true;
  });
}

export function resolveCouncilByArea(catalog: CanonicalCatalog, area?: string): CanonicalCouncil | null {
  if (!area) return null;
  const normalised = area.trim().toLocaleLowerCase("en-GB");
  return catalog.councils.find((council) => council.area.toLocaleLowerCase("en-GB") === normalised || council.name.toLocaleLowerCase("en-GB").includes(normalised)) ?? null;
}

function resolveTargets(catalog: CanonicalCatalog, route: CanonicalRoute, area?: string): ResolvedTarget[] {
  const services = new Map(catalog.services.filter((service) => service.status === "verified").map((service) => [service.id, service]));
  const councils = new Map(catalog.councils.filter((council) => council.status === "verified").map((council) => [council.id, council]));
  return route.targetIds.flatMap((target): ResolvedTarget[] => {
    if (target === "council_by_area") {
      const council = resolveCouncilByArea(catalog, area);
      return council ? [{ kind: "council", id: council.id, name: council.name, council }] : [];
    }
    const service = services.get(target);
    if (service) return [{ kind: "service", id: service.id, name: service.name, service }];
    const council = councils.get(target);
    if (council) return [{ kind: "council", id: council.id, name: council.name, council }];
    throw new Error(`Published route ${route.id} has unresolved target ${target}`);
  });
}

export function resolveTriage(catalog: CanonicalCatalog, rawInput: TriageInput): TriageRecommendation[] {
  const input = triageInputSchema.parse(rawInput);
  const conditions = new Set(input.conditions.map((condition) => condition.toLocaleLowerCase("en-GB")));
  return catalog.triageRoutes.flatMap((route): TriageRecommendation[] => {
    const matchedConditions = route.conditionTags.filter((tag) => conditions.has(tag.toLocaleLowerCase("en-GB")));
    if (matchedConditions.length === 0) return [];
    return [{ route, matchedConditions, targets: resolveTargets(catalog, route, input.area) }];
  }).sort((left, right) => urgencyRank[left.route.urgency] - urgencyRank[right.route.urgency] || left.route.id.localeCompare(right.route.id));
}
