import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { adapterMayExecute, canAdministerRegion, canEditProviderOrganisation, canPublishRegion, canCachePublicPath, councilAdapterMaySubmit, minimiseAdapterPayload, partnerCanAccessCase, phase6FeatureEnabled, proposalInput, renderLockScreenNotification, suppressSmallCells, transitionProposal, validatePlainContentText } from "@/phase6";

describe("Phase 6 security controls", () => {
  it("blocks partner privilege escalation into cases", () => expect(partnerCanAccessCase()).toBe(false));
  it("blocks a provider editing another provider", () => expect(canEditProviderOrganisation("org-a", "org-b", "administrator")).toBe(false));
  it("blocks unapproved direct publication", () => expect(transitionProposal("approved_for_revision", "published", "provider")).toBe(false));
  it("blocks regional cross-access", () => expect(canAdministerRegion("kent-medway", "sussex", false)).toBe(false));
  it("blocks cross-region case transfer through its disabled flag", () => expect(phase6FeatureEnabled("multi_region_case_transfer", "test", true)).toBe(false));
  it("prevents commissioner re-identification with a fixed minimum", () => expect(() => suppressSmallCells([{ label: "rare combination", count: 1, actual: true }], 1)).toThrow());
  it("suppresses a small aggregate cell", () => expect(suppressSmallCells([{ label: "rare combination", count: 1, actual: true }])[0]?.count).toBeNull());
  it("rejects dangerous translation text", () => expect(validatePlainContentText('<script>alert(1)</script>')).toBe(false));
  it("rejects uploaded provider evidence bytes and unknown fields", () => expect(proposalInput.safeParse({ organisationId: "00000000-0000-4000-8000-000000000001", serviceId: "srv_test", field: "service_name", currentValue: "a", proposedValue: "b", reason: "Synthetic safe reason", urgency: "standard", evidenceBytes: "malicious" }).success).toBe(false));
  it("minimises adapter payloads and omits secrets", () => expect(minimiseAdapterPayload({ reference: "ok", apiKey: "secret" }, { id: "test", state: "sandbox", timeoutMs: 1000, maxRetries: 0, allowedDataFields: ["reference"], circuitOpen: false })).toEqual({ reference: "ok" }));
  it("blocks offline private-cache leakage", () => expect(canCachePublicPath("/case/private/evidence")).toBe(false));
  it("redacts sensitive notification details", () => expect(renderLockScreenNotification({ purpose: "test", sensitivity: "high", channels: ["push"], variables: [], normal: "Case evidence", discreet: "Council case updated", ultraNeutral: "Saved reminder", approved: true, translationStatus: "approved" }, "discreet")).toBe("You have a saved reminder."));
  it("cannot bypass disabled adapters or council submissions", () => { expect(adapterMayExecute({ id: "test", state: "disabled", timeoutMs: 1000, maxRetries: 0, allowedDataFields: [], circuitOpen: false }, "production", true)).toBe(false); expect(councilAdapterMaySubmit({ id: "test", council: "Synthetic", formName: "x", formVersion: "1", url: "https://example.invalid", fieldMappings: {}, requiredFields: [], optionalFields: [], attachments: false, authenticationRequired: false, captchaRestriction: false, accessibilityLimitations: [], submissionMethod: "direct", receiptHandling: "manual", lastVerified: null, status: "verified" }, false)).toBe(false); });
  it("blocks unapproved Sussex activation", () => expect(canPublishRegion("sussex", 15, new Set(["safeguarding","legal","accessibility","regional_owner","production"]))).toBe(false));
  it("keeps partner proposal API same-origin, validated, audited, no-store and organisation/service-scoped", () => { const source=readFileSync("src/app/api/v1/partner/proposals/route.ts","utf8"); expect(source).toContain("originIsTrusted"); expect(source).toContain("proposalInput.safeParse"); expect(source).toContain("requirePartnerUser(parsed.data.organisationId)"); expect(source).toContain("partner_managed_services"); expect(source).toContain("audit_events"); expect(source).toContain("publicNoStoreHeaders"); });
});
