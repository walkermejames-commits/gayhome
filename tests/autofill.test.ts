import { describe, expect, it } from "vitest";
import { buildPrefill, maySubmit, renderConfirmedScript, suggestEvidence, type FormContract } from "@/domain/autofill";
import { canShareFact, foundationFieldDefinitions, sessionModePolicies, type ConsentReceipt, type ProfileFact } from "@/domain/profile";

const contract: FormContract = {
  id: "test", version: "1", title: "Test", purpose: "housing_application", reviewRequired: true,
  fields: [
    { key: "name", label: "Name", profileFieldKey: "person.full_name", required: true, allowOneTimeValue: true },
    { key: "identity", label: "Identity", profileFieldKey: "identity.lgbtq", required: false, allowOneTimeValue: true },
  ],
};
const facts: ProfileFact[] = [
  { fieldKey: "person.full_name", value: "Alex", provenance: { kind: "user", reference: null }, confirmed: true, updatedAt: "2026-08-01T00:00:00Z", savePreference: "save" },
  { fieldKey: "identity.lgbtq", value: "optional identity", provenance: { kind: "user", reference: null }, confirmed: true, updatedAt: "2026-08-01T00:00:00Z", savePreference: "save" },
];

describe("profile, consent and autofill", () => {
  it("prefills confirmed allowed facts but never inserts LGBTQIA+ identity automatically", () => {
    const result = buildPrefill(contract, foundationFieldDefinitions, facts, "2026-08-01T12:00:00Z");
    expect(result.find((item) => item.formFieldKey === "name")?.value).toBe("Alex");
    expect(result.find((item) => item.formFieldKey === "identity")?.value).toBeNull();
  });

  it("requires complete fields and an explicit final review", () => {
    expect(maySubmit(contract, { name: "Alex", identity: null }, false)).toBe(false);
    expect(maySubmit(contract, { name: "Alex", identity: null }, true)).toBe(true);
    expect(maySubmit(contract, { name: null, identity: null }, true)).toBe(false);
  });

  it("enforces field-level purpose and revocation", () => {
    const definition = foundationFieldDefinitions.find((item) => item.key === "person.full_name")!;
    const receipt: ConsentReceipt = { id: "c1", fieldKeys: [definition.key], recipient: "council", purpose: "housing_application", channel: "form", grantedAt: "2026-08-01", expiresAt: null, revokedAt: null };
    expect(canShareFact(definition, facts[0]!, receipt, "2026-08-01")).toBe(true);
    expect(canShareFact(definition, facts[0]!, { ...receipt, revokedAt: "2026-08-01" }, "2026-08-01")).toBe(false);
  });

  it("keeps guest, private-device and public-device storage distinct", () => {
    expect(sessionModePolicies.guest.persistence).toBe("none");
    expect(sessionModePolicies.private_device.persistence).toBe("server_encrypted");
    expect(sessionModePolicies.public_device.persistence).toBe("session_only");
    expect(sessionModePolicies.public_device.maxAgeMinutes).toBeLessThan(sessionModePolicies.private_device.maxAgeMinutes);
  });

  it("renders scripts only from confirmed facts", () => {
    const result = renderConfirmedScript("Hello {{name}}. Council: {{area}}.", { name: "person.full_name", area: "location.council_area" }, [
      facts[0]!,
      { fieldKey: "location.council_area", value: "Canterbury", provenance: { kind: "user", reference: null }, confirmed: false, updatedAt: "2026-08-01", savePreference: "use_once" },
    ]);
    expect(result).toEqual({ text: "Hello Alex. Council: {{area}}.", missingTokens: ["area"] });
  });

  it("suggests evidence without attaching it", () => {
    const suggestions = suggestEvidence([
      { evidence_id: "ev_1", area: "Identity", useful_evidence: "Photo ID if safely available", safety_note: "Do not delay help." },
    ], ["Identity"]);
    expect(suggestions).toEqual([expect.objectContaining({ evidenceId: "ev_1", autoAttach: false })]);
  });
});
