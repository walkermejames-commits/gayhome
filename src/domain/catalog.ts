import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const urgency = z.enum(["low", "medium", "high", "critical"]);
const publishedStatus = z.enum(["verified", "archived"]);

export const seedServiceSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  provider: nonEmpty,
  type: nonEmpty,
  coverage: nonEmpty,
  ages: nonEmpty,
  tags: z.string(),
  modes: z.string(),
  phone: z.string(),
  email: z.string(),
  url: z.url(),
  hours: z.string(),
  referral: z.string(),
  lgbtq: z.string(),
  urgency,
  notes: z.string(),
  sourceId: nonEmpty,
  verifiedOn: dateText,
  status: publishedStatus,
});

export const seedCouncilSchema = z.object({
  council_id: nonEmpty,
  council_name: nonEmpty,
  area: nonEmpty,
  homelessness_url: z.url(),
  phone: z.string(),
  hours_notes: z.string(),
  route_notes: z.string(),
  source_id: nonEmpty,
  verified_on: dateText,
  status: publishedStatus,
});

export const seedRouteSchema = z.object({
  route_id: nonEmpty,
  trigger_name: nonEmpty,
  condition_tags: z.string(),
  recommended_action: nonEmpty,
  target_ids: z.string(),
  urgency,
  safety_note: nonEmpty,
  verified_on: dateText,
});

export const seedScriptSchema = z.object({
  script_id: nonEmpty,
  title: nonEmpty,
  audience: nonEmpty,
  script_text: nonEmpty,
  use_note: nonEmpty,
});

export const seedEvidenceSchema = z.object({
  evidence_id: nonEmpty,
  area: nonEmpty,
  useful_evidence: nonEmpty,
  safety_note: nonEmpty,
});

export const seedSourceSchema = z.object({
  source_id: nonEmpty,
  source_name: nonEmpty,
  source_url: z.url(),
  publisher_type: nonEmpty,
  verified_on: dateText,
  review_after_days: z.coerce.number().int().positive(),
  notes: z.string(),
});

export const seedSchema = z.object({
  metadata: z.object({ title: nonEmpty, version: nonEmpty, verifiedOn: dateText, note: z.string() }),
  services: z.array(seedServiceSchema),
  councils: z.array(seedCouncilSchema),
  triage_routes: z.array(seedRouteSchema),
  scripts: z.array(seedScriptSchema),
  evidence_checklist: z.array(seedEvidenceSchema),
  sources: z.array(seedSourceSchema),
});

export type Seed = z.infer<typeof seedSchema>;
export type SeedService = z.infer<typeof seedServiceSchema>;

export const contactChannelTypes = ["telephone", "email", "webchat", "sms", "whatsapp", "drop_in", "online_form", "referral_portal", "website"] as const;
export type ContactChannelType = (typeof contactChannelTypes)[number];
export type ContactChannelStatus = "active" | "limited" | "transitioning" | "existing_users_only" | "temporarily_unavailable" | "retired" | "unverified";

export interface ContactChannel {
  type: ContactChannelType;
  value: string;
  status: ContactChannelStatus;
  validFrom: string | null;
  validUntil: string | null;
  lastVerified: string;
  intendedAudience: string;
  newUsersAccepted: boolean;
  existingUsersAccepted: boolean;
  publicDisplayRule: "show" | "show_with_warning" | "hide" | "staff_only";
  replacementRoute: string | null;
  transitionNote: string | null;
  sourceOrder: number;
}

export interface CanonicalService extends Omit<SeedService, "tags" | "modes" | "phone" | "email" | "url"> {
  tags: string[];
  accessModes: string[];
  contacts: ContactChannel[];
}

export interface CanonicalCouncil {
  id: string;
  name: string;
  area: string;
  homelessnessUrl: string;
  phone: string;
  hoursNotes: string;
  routeNotes: string;
  sourceId: string;
  verifiedOn: string;
  status: "verified" | "archived";
}

export interface CanonicalRoute {
  id: string;
  triggerName: string;
  conditionTags: string[];
  recommendedAction: string;
  targetIds: string[];
  urgency: "low" | "medium" | "high" | "critical";
  safetyNote: string;
  verifiedOn: string;
}

export interface CanonicalCatalog {
  metadata: Seed["metadata"];
  services: CanonicalService[];
  councils: CanonicalCouncil[];
  triageRoutes: CanonicalRoute[];
  scripts: Seed["scripts"];
  evidenceChecklist: Seed["evidence_checklist"];
  sources: Seed["sources"];
}

export function splitPipe(value: string): string[] {
  return value.split("|").map((part) => part.trim()).filter(Boolean);
}

function serviceContacts(service: SeedService): ContactChannel[] {
  const contacts: ContactChannel[] = [];
  const add = (type: ContactChannelType, value: string) => {
    if (!value.trim()) return;
    contacts.push({
      type,
      value: value.trim(),
      status: "active",
      validFrom: null,
      validUntil: null,
      lastVerified: service.verifiedOn,
      intendedAudience: "all",
      newUsersAccepted: true,
      existingUsersAccepted: true,
      publicDisplayRule: "show",
      replacementRoute: null,
      transitionNote: null,
      sourceOrder: contacts.length,
    });
  };
  add("telephone", service.phone);
  add("email", service.email);
  add("website", service.url);
  return contacts;
}

export function canonicaliseSeed(seed: Seed): CanonicalCatalog {
  return {
    metadata: seed.metadata,
    services: seed.services.map((service) => ({
      id: service.id,
      name: service.name,
      provider: service.provider,
      type: service.type,
      coverage: service.coverage,
      ages: service.ages,
      tags: splitPipe(service.tags),
      accessModes: splitPipe(service.modes),
      hours: service.hours,
      referral: service.referral,
      lgbtq: service.lgbtq,
      urgency: service.urgency,
      notes: service.notes,
      sourceId: service.sourceId,
      verifiedOn: service.verifiedOn,
      status: service.status,
      contacts: serviceContacts(service),
    })),
    councils: seed.councils.map((council) => ({
      id: council.council_id,
      name: council.council_name,
      area: council.area,
      homelessnessUrl: council.homelessness_url,
      phone: council.phone,
      hoursNotes: council.hours_notes,
      routeNotes: council.route_notes,
      sourceId: council.source_id,
      verifiedOn: council.verified_on,
      status: council.status,
    })),
    triageRoutes: seed.triage_routes.map((route) => ({
      id: route.route_id,
      triggerName: route.trigger_name,
      conditionTags: splitPipe(route.condition_tags),
      recommendedAction: route.recommended_action,
      targetIds: splitPipe(route.target_ids),
      urgency: route.urgency,
      safetyNote: route.safety_note,
      verifiedOn: route.verified_on,
    })),
    scripts: seed.scripts,
    evidenceChecklist: seed.evidence_checklist,
    sources: seed.sources,
  };
}
