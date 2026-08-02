export const verificationDimensions = ["contact_details", "opening_hours", "eligibility", "geographic_coverage", "accessibility", "lgbtqia_inclusion", "accommodation_availability", "referral_route"] as const;
export type VerificationOutcome = "confirmed" | "confirmed_with_limitations" | "changed" | "temporarily_unavailable" | "unable_to_verify" | "conflicting_evidence" | "closed" | "superseded";
export type ReviewSignals = { urgency: number; serviceTypeRisk: number; historicalChangeRate: number; contactInstability: number; fundingUncertainty: number; seasonalOperation: number; userErrorReports: number; brokenLinks: number; providerAttestationAge: number; councilStatusRisk: number; safeguardingImportance: number };

export function scheduleReview(signals: ReviewSignals, from = new Date()) {
  const score = Object.values(signals).reduce((sum, value) => sum + Math.max(0, Math.min(5, value)), 0);
  const days = score >= 42 ? 1 : score >= 30 ? 7 : score >= 18 ? 30 : 90;
  const dueAt = new Date(from.getTime() + days * 86_400_000);
  return { score, priority: score >= 42 ? "very_high" : score >= 30 ? "high" : "standard", dueAt } as const;
}

export type Dependency = { kind: "triage_route" | "action_plan" | "script" | "evidence_guidance" | "council_page" | "regional_page" | "offline_cache" | "generated_form" | "partner_document" | "public_service_card"; id: string; critical: boolean };
export function analyseServiceChange(recordId: string, changedFields: string[], dependencies: readonly Dependency[], potentialUsers: number | null) {
  const affected = dependencies.filter((item) => item.id === recordId || item.id.startsWith(`${recordId}:`));
  return { changedRecord: recordId, changedFields: [...new Set(changedFields)].sort(), dependentRoutes: affected.filter((item) => item.kind === "triage_route"), dependentTemplates: affected.filter((item) => ["script", "generated_form", "partner_document"].includes(item.kind)), currentUsersPotentiallyAffected: potentialUsers, cachedContentAffected: affected.some((item) => item.kind === "offline_cache"), requiredRevalidation: [...new Set(affected.map((item) => item.kind))], rollbackPlan: "Restore the previous immutable dataset revision and invalidate derived public caches.", publicationBlocked: affected.some((item) => item.critical) };
}

export type ExplanationFacts = { ageMatched?: boolean; regionMatched?: boolean; specialistMatched?: boolean; selectedAuthority?: string; excludedAge?: boolean; usedFactLabels: string[]; withheldFactLabels: string[]; datasetRevision: string };
export function explainRecommendation(facts: ExplanationFacts) {
  const reasons = [facts.ageMatched && "published age criteria match", facts.regionMatched && "published regional coverage matches", facts.specialistMatched && "LGBTQIA+ specialism matches", facts.selectedAuthority && `the selected authority is ${facts.selectedAuthority}`, facts.excludedAge && "published age criteria do not match"].filter(Boolean);
  return { explanation: `This result ${facts.excludedAge ? "was not shown" : "is shown"} because ${reasons.join(", ") || "no matching published criteria were supplied"}.`, factsUsed: facts.usedFactLabels, factsNotShared: facts.withheldFactLabels, datasetRevision: facts.datasetRevision };
}
