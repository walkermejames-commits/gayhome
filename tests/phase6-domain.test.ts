import { describe, expect, it } from "vitest";
import { adapterMayExecute, canCachePublicPath, canPublishRegion, councilAdapterMaySubmit, createFunderPack, createPortableCaseExport, createPublicOfflinePack, defaultAccessibilityPreferences, emergencyHideService, explainRecommendation, invalidateContent, mapTaxonomyTerm, minimiseAdapterPayload, nextEasyReadStatus, nextPublicationStage, offlineExpiryMessage, partnerCanAccessCase, partnerPermissions, phase6FeatureEnabled, proposalInput, regionRegistry, renderLockScreenNotification, resolveRegion, scenarioCost, scheduleReview, serviceGap, shareableAccessibilityPreferences, suppressSmallCells, transitionProposal, translationCanPublish, validateRegionalIdentifier } from "@/phase6";
import { analyseServiceChange } from "@/phase6/verification";

const regionConfig = { authorityToRegion: { "synthetic kent authority": "kent-medway", "synthetic sussex authority": "sussex" }, postcodeToAuthorities: { ZZ1: ["Synthetic Kent Authority"], ZZ2: ["Authority A", "Authority B"] } };

describe("Phase 6 regional platform", () => {
  it("resolves a configured synthetic postcode deterministically", () => expect(resolveRegion({ postcode: "ZZ1 1ZZ" }, regionConfig)).toMatchObject({ regionId: "kent-medway", authority: "Synthetic Kent Authority", confidence: "high", method: "configured_postcode" }));
  it("requires manual selection for ambiguous postcodes", () => expect(resolveRegion({ postcode: "ZZ2 2ZZ" }, regionConfig)).toMatchObject({ alternatives: ["Authority A", "Authority B"], manualSelectionRequired: true }));
  it("keeps location, local connection, preference and safeguarding separate", () => expect(resolveRegion({ selectedCouncil: "Synthetic Kent Authority", currentLocation: "Current place", previousAuthority: "Historic authority", preferredArea: "Preferred place", safeguardingRelocationNeeded: true }, regionConfig)).toMatchObject({ physicalLocation: "Current place", localConnectionInformation: "Historic authority", preferredArea: "Preferred place", safeguardingRelocationNeeded: true }));
  it("does not activate Sussex routing", () => expect(resolveRegion({ selectedCouncil: "Synthetic Sussex Authority" }, regionConfig)).toMatchObject({ regionId: "sussex", datasetRevision: null, manualSelectionRequired: true }));
  it("retains legacy IDs without rewriting", () => expect(validateRegionalIdentifier("srv_legacy", "east-sussex", new Set(), new Set(["srv_legacy"]))).toMatchObject({ valid: true, legacy: true }));
  it("detects regional identifier collisions", () => expect(validateRegionalIdentifier("srv_esx_example", "east-sussex", new Set(["srv_esx_example"])).valid).toBe(false));
  it("blocks Sussex publication regardless of staged approvals", () => expect(canPublishRegion("sussex", 15, new Set(["safeguarding", "legal", "accessibility", "regional_owner", "production"]))).toBe(false));
  it("exposes only Kent as published", () => expect(regionRegistry.filter((item) => item.status === "published").map((item) => item.id)).toEqual(["kent-medway"]));
});

describe("partner and provider controls", () => {
  it("gives a verified partner only partner-domain permissions", () => expect([...partnerPermissions("verified", true)]).toEqual(["manage_own_services", "submit_proposals", "view_own_proposals"]));
  it("never derives case access from partner status", () => expect(partnerCanAccessCase()).toBe(false));
  it("validates proposal fields and rejects unknown data", () => expect(proposalInput.safeParse({ organisationId: "00000000-0000-4000-8000-000000000001", serviceId: "srv_test", field: "service_name", currentValue: "Old", proposedValue: "New", reason: "Synthetic correction evidence", urgency: "standard", caseId: "forbidden" }).success).toBe(false));
  it("denies direct provider publication", () => expect(transitionProposal("approved_for_revision", "published", "provider")).toBe(false));
  it("permits only a publisher to complete reviewed publication", () => expect(transitionProposal("approved_for_revision", "published", "publisher")).toBe(true));
  it("preserves history on emergency hide", () => expect(emergencyHideService("Synthetic safety concern", "data_steward")).toMatchObject({ publicVisibility: "temporarily_hidden", preserveHistory: true, requiresReview: true }));
});

describe("verification and intelligence", () => {
  it("schedules very-high risk review within one day", () => expect(scheduleReview({ urgency: 5, serviceTypeRisk: 5, historicalChangeRate: 4, contactInstability: 4, fundingUncertainty: 4, seasonalOperation: 3, userErrorReports: 5, brokenLinks: 4, providerAttestationAge: 3, councilStatusRisk: 3, safeguardingImportance: 5 }, new Date("2026-01-01T00:00:00Z"))).toMatchObject({ priority: "very_high", dueAt: new Date("2026-01-02T00:00:00Z") }));
  it("blocks critical service changes and reveals no identities", () => expect(analyseServiceChange("srv_test", ["phone"], [{ kind: "triage_route", id: "srv_test:route", critical: true }], 7)).toMatchObject({ publicationBlocked: true, currentUsersPotentiallyAffected: 7 }));
  it("generates deterministic search explanations with disclosure labels", () => expect(explainRecommendation({ ageMatched: true, regionMatched: true, usedFactLabels: ["age band"], withheldFactLabels: ["medical detail"], datasetRevision: "v-test" })).toMatchObject({ factsUsed: ["age band"], factsNotShared: ["medical detail"], datasetRevision: "v-test" }));
  it("maps plain-language taxonomy aliases without making a legal decision", () => expect(mapTaxonomyTerm("staying with friends",[{vocabulary:"homelessness_circumstance",canonical:"temporarily_staying_with_others",aliases:["staying with friends","sofa surfing"],misspellings:[],regionalTerms:{},deprecated:false,sensitive:false}])).toMatchObject({matches:[{canonical:"temporarily_staying_with_others"}],legalDetermination:null}));
  it("labels absence as a possible gap, not proof of absence", () => expect(serviceGap("Synthetic route", 0, 0)).toMatchObject({ type: "possible_gap" }));
  it("suppresses small cells", () => expect(suppressSmallCells([{ label: "Synthetic", count: 4, actual: true }], 5)[0]).toMatchObject({ count: null, suppressed: true }));
  it("rejects unsafe reporting thresholds", () => expect(() => suppressSmallCells([], 4)).toThrow());
});

describe("content, accessibility and offline safety", () => {
  it("isolates accessibility sharing to consented keys", () => expect(shareableAccessibilityPreferences({ ...defaultAccessibilityPreferences, easyRead: true, voiceInput: true }, ["easyRead"])).toEqual({ easyRead: true }));
  it("invalidates outdated critical translations", () => expect(invalidateContent([{ sourceVersion: "1", currentSourceVersion: "2", derivativeId: "synthetic", derivativeType: "translation", risk: "critical" }])[0]).toMatchObject({ outdated: true, publicationBlocked: true }));
  it("requires sequential Easy Read review", () => { expect(nextEasyReadStatus("draft", "plain_language_reviewed")).toBe(true); expect(nextEasyReadStatus("draft", "approved")).toBe(false); });
  it("requires human legal and safeguarding review for high-risk translation", () => { expect(translationCanPublish("emergency", true, false, true, true)).toBe(false); expect(translationCanPublish("emergency", true, true, true, true)).toBe(true); });
  it("creates public-only offline packs", () => expect(createPublicOfflinePack({ datasetRevision: "v-test", generatedAt: new Date(), expiresAt: new Date(), emergencyNumbers: [], councilRoutes: [], rights: [], scripts: [], evidenceChecklist: [], services: [] })).toMatchObject({ privateDataIncluded: false }));
  it("shows an expiry warning for stale packs", () => expect(offlineExpiryMessage("2025-01-01T00:00:00Z", new Date("2026-01-01T00:00:00Z"))).toContain("Check again"));
  it("prevents private routes entering public cache", () => { expect(canCachePublicPath("/offline-help")).toBe(true); expect(canCachePublicPath("/api/v1/cases/123")).toBe(false); });
  it("redacts unsafe lock-screen wording", () => expect(renderLockScreenNotification({ purpose: "reminder", sensitivity: "high", channels: ["push"], variables: [], normal: "Housing case", discreet: "Your housing case changed", ultraNeutral: "Saved reminder", approved: true, translationStatus: "approved" }, "discreet")).toBe("You have a saved reminder."));
});

describe("adapters, publication, flags and exports", () => {
  const adapter = { id: "synthetic", state: "disabled" as const, timeoutMs: 1000, maxRetries: 0, allowedDataFields: ["reference"], circuitOpen: false };
  it("keeps disabled adapters inert and minimises payloads", () => { expect(adapterMayExecute(adapter, "test", true)).toBe(false); expect(minimiseAdapterPayload({ reference: "ok", secret: "no" }, adapter)).toEqual({ reference: "ok" }); });
  it("prohibits council submission in sandbox or with CAPTCHA", () => expect(councilAdapterMaySubmit({ id: "synthetic", council: "Synthetic", formName: "Form", formVersion: "1", url: "https://example.invalid", fieldMappings: {}, requiredFields: [], optionalFields: [], attachments: false, authenticationRequired: false, captchaRestriction: true, accessibilityLimitations: [], submissionMethod: "direct", receiptHandling: "manual", lastVerified: null, status: "sandbox" }, true)).toBe(false));
  it("does not allow publication stages to be skipped", () => expect(nextPublicationStage("validation", "source_review", "evidence", "owner", "approve").allowed).toBe(false));
  it("keeps every Phase 6 flag disabled even when approval is claimed", () => expect(phase6FeatureEnabled("sussex_routing", "test", true)).toBe(false));
  it("creates checksummed internal portable exports without evidence bytes", () => expect(createPortableCaseExport({ sensitivity: "sensitive", datasetRevision: "v-test", exportedAt: new Date(0).toISOString(), manifest: {}, evidenceIndex: [{ id: "ev-test", included: false }], documentList: [], consentSummary: [], timeline: [], deadlines: [], references: ["srv_test"] }).checksum).toMatch(/^[a-f0-9]{64}$/));
  it("requires status-qualified funder claims and supports editable costs", () => { expect(createFunderPack([{ statement: "Synthetic capability", status: "tested" }]).claims[0]?.status).toBe("tested"); expect(scenarioCost([{ category: "hosting", value: 10, currency: "GBP", asOf: "2026-01-01", source: "editable assumption", confidence: "low", notes: "synthetic" }])).toBe(10); });
});

describe("performance budgets", () => {
  it("resolves 10,000 regional requests within a synthetic unit budget", () => { const started = performance.now(); for (let index=0; index<10_000; index++) resolveRegion({ postcode: "ZZ1 1ZZ" }, regionConfig); expect(performance.now()-started).toBeLessThan(1500); });
  it("suppresses 25,000 aggregate cells within a synthetic unit budget", () => { const cells=Array.from({length:25_000},(_,index)=>({label:`cell-${index}`,count:index%10,actual:true}));const started=performance.now();expect(suppressSmallCells(cells).length).toBe(25_000);expect(performance.now()-started).toBeLessThan(500); });
});
