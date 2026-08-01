import { z } from "zod";

export const sensitivitySchema = z.enum(["public", "personal", "sensitive", "special_category", "criminal_offence", "safeguarding"]);
export type Sensitivity = z.infer<typeof sensitivitySchema>;

export interface FieldDefinition {
  key: string;
  label: string;
  dataType: "text" | "date" | "boolean" | "choice";
  sensitivity: Sensitivity;
  allowedPurposes: string[];
  freshnessDays: number | null;
  explicitReviewRequired: boolean;
  maySave: boolean;
}

export interface ProfileFact {
  fieldKey: string;
  value: string | boolean;
  provenance: { kind: "user" | "provider" | "import"; reference: string | null };
  confirmed: boolean;
  updatedAt: string;
  savePreference: "save" | "use_once";
}

export interface ConsentReceipt {
  id: string;
  fieldKeys: string[];
  recipient: string;
  purpose: string;
  channel: string;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

export const foundationFieldDefinitions: FieldDefinition[] = [
  { key: "person.full_name", label: "Name", dataType: "text", sensitivity: "personal", allowedPurposes: ["housing_application", "support_request"], freshnessDays: null, explicitReviewRequired: false, maySave: true },
  { key: "contact.safe_method", label: "Safe contact method", dataType: "choice", sensitivity: "safeguarding", allowedPurposes: ["housing_application", "support_request"], freshnessDays: 30, explicitReviewRequired: true, maySave: true },
  { key: "housing.current_situation", label: "Current housing situation", dataType: "text", sensitivity: "sensitive", allowedPurposes: ["housing_application"], freshnessDays: 7, explicitReviewRequired: true, maySave: true },
  { key: "location.council_area", label: "Council area", dataType: "choice", sensitivity: "personal", allowedPurposes: ["housing_application", "service_matching"], freshnessDays: 90, explicitReviewRequired: false, maySave: true },
  { key: "identity.lgbtq", label: "LGBTQIA+ identity", dataType: "text", sensitivity: "special_category", allowedPurposes: ["specialist_referral"], freshnessDays: null, explicitReviewRequired: true, maySave: true },
];

export type SessionMode = "guest" | "private_device" | "public_device";
export const sessionModePolicies: Record<SessionMode, { persistence: "none" | "server_encrypted" | "session_only"; maxAgeMinutes: number; profileRequired: boolean }> = {
  guest: { persistence: "none", maxAgeMinutes: 0, profileRequired: false },
  private_device: { persistence: "server_encrypted", maxAgeMinutes: 240, profileRequired: true },
  public_device: { persistence: "session_only", maxAgeMinutes: 30, profileRequired: false },
};

export function isStale(definition: FieldDefinition, fact: ProfileFact, asOf: string): boolean {
  if (definition.freshnessDays == null) return false;
  const updated = new Date(fact.updatedAt);
  const current = new Date(asOf);
  return current.getTime() - updated.getTime() > definition.freshnessDays * 86_400_000;
}

export function canShareFact(definition: FieldDefinition, fact: ProfileFact, receipt: ConsentReceipt, asOf: string): boolean {
  return fact.confirmed && definition.allowedPurposes.includes(receipt.purpose) && receipt.fieldKeys.includes(definition.key) && !receipt.revokedAt && (!receipt.expiresAt || receipt.expiresAt >= asOf);
}
