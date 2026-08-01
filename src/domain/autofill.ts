import type { FieldDefinition, ProfileFact } from "@/domain/profile";
import { isStale } from "@/domain/profile";
import type { CanonicalCatalog } from "@/domain/catalog";

export interface FormFieldContract {
  key: string;
  label: string;
  profileFieldKey: string;
  required: boolean;
  allowOneTimeValue: boolean;
}

export interface FormContract {
  id: string;
  version: string;
  title: string;
  purpose: string;
  reviewRequired: true;
  fields: FormFieldContract[];
}

export interface PrefillValue {
  formFieldKey: string;
  value: string | boolean | null;
  source: "profile" | "missing";
  stale: boolean;
  sensitiveReviewRequired: boolean;
  removable: true;
}

export function buildPrefill(contract: FormContract, definitions: FieldDefinition[], facts: ProfileFact[], asOf: string): PrefillValue[] {
  const definitionsByKey = new Map(definitions.map((definition) => [definition.key, definition]));
  const factsByKey = new Map(facts.filter((fact) => fact.confirmed).map((fact) => [fact.fieldKey, fact]));
  return contract.fields.map((field) => {
    const definition = definitionsByKey.get(field.profileFieldKey);
    if (!definition) throw new Error(`Unknown profile field ${field.profileFieldKey}`);
    const fact = factsByKey.get(field.profileFieldKey);
    if (!fact) return { formFieldKey: field.key, value: null, source: "missing", stale: false, sensitiveReviewRequired: definition.explicitReviewRequired, removable: true };
    const purposeAllowed = definition.allowedPurposes.includes(contract.purpose);
    const identityField = definition.key === "identity.lgbtq";
    if (!purposeAllowed || identityField) return { formFieldKey: field.key, value: null, source: "missing", stale: false, sensitiveReviewRequired: true, removable: true };
    return { formFieldKey: field.key, value: fact.value, source: "profile", stale: isStale(definition, fact, asOf), sensitiveReviewRequired: definition.explicitReviewRequired, removable: true };
  });
}

export function maySubmit(contract: FormContract, values: Record<string, string | boolean | null>, reviewConfirmed: boolean): boolean {
  if (contract.reviewRequired && !reviewConfirmed) return false;
  return contract.fields.every((field) => !field.required || (values[field.key] !== null && values[field.key] !== ""));
}

export function renderConfirmedScript(
  template: string,
  tokenToProfileField: Record<string, string>,
  facts: ProfileFact[],
): { text: string; missingTokens: string[] } {
  const confirmedFacts = new Map(facts.filter((fact) => fact.confirmed).map((fact) => [fact.fieldKey, fact.value]));
  const missingTokens: string[] = [];
  const text = template.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (placeholder, token: string) => {
    const fieldKey = tokenToProfileField[token];
    const value = fieldKey ? confirmedFacts.get(fieldKey) : undefined;
    if (value === undefined) {
      missingTokens.push(token);
      return placeholder;
    }
    return String(value);
  });
  return { text, missingTokens: [...new Set(missingTokens)] };
}

export interface EvidenceSuggestion {
  evidenceId: string;
  area: string;
  description: string;
  safetyNote: string;
  autoAttach: false;
}

export function suggestEvidence(
  checklist: CanonicalCatalog["evidenceChecklist"],
  areas: string[],
): EvidenceSuggestion[] {
  const requested = new Set(areas.map((area) => area.trim().toLocaleLowerCase("en-GB")));
  return checklist
    .filter((item) => requested.has(item.area.toLocaleLowerCase("en-GB")))
    .map((item) => ({ evidenceId: item.evidence_id, area: item.area, description: item.useful_evidence, safetyNote: item.safety_note, autoAttach: false }));
}
