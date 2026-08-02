export const publicationStages = ["draft_import", "validation", "quarantine", "reconciliation", "source_review", "safeguarding_review", "legal_content_review", "accessibility_review", "regional_owner_approval", "staging_publication", "test_journeys", "production_approval", "publication", "monitoring", "rollback"] as const;
export type PublicationStage = typeof publicationStages[number];
export function nextPublicationStage(current: PublicationStage, requested: PublicationStage, evidence: string, owner: string, decision: "approve" | "reject") { const currentIndex = publicationStages.indexOf(current); const nextIndex = publicationStages.indexOf(requested); if (!evidence.trim() || !owner.trim() || decision !== "approve" || nextIndex !== currentIndex + 1) return { allowed: false, reason: "Mandatory stages cannot be skipped and approval evidence is required." }; return { allowed: true, reason: "Sequential review recorded." }; }

export const phase6FeatureFlags = {
  sussex_routing: false, provider_self_service_publication: false, commissioner_live_reports: false, pwa_installation: false, push_notifications: false,
  council_direct_submission: false, live_translation: false, bsl_streaming: false, partner_analytics: false, multi_region_case_transfer: false,
} as const;
export function phase6FeatureEnabled(flag: keyof typeof phase6FeatureFlags, environment: string, approved: boolean) { return environment !== "production" && approved && phase6FeatureFlags[flag]; }
