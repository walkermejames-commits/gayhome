import type { CanonicalCatalog } from "@/domain/catalog";

export interface VerificationState {
  sourceId: string;
  verifiedOn: string;
  nextReviewDate: string;
  state: "current" | "due_soon" | "overdue";
}

export function addDays(dateText: string, days: number): string {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function verificationQueue(catalog: CanonicalCatalog, asOf: string, dueSoonDays = 14): VerificationState[] {
  const asOfDate = new Date(`${asOf}T00:00:00Z`);
  return catalog.sources.map((source) => {
    const nextReviewDate = addDays(source.verified_on, source.review_after_days);
    const next = new Date(`${nextReviewDate}T00:00:00Z`);
    const days = Math.ceil((next.getTime() - asOfDate.getTime()) / 86_400_000);
    const state: VerificationState["state"] = days < 0 ? "overdue" : days <= dueSoonDays ? "due_soon" : "current";
    return { sourceId: source.source_id, verifiedOn: source.verified_on, nextReviewDate, state };
  }).sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
}
