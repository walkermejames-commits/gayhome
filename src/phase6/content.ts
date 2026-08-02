export type ContentStatus = "draft" | "plain_language_reviewed" | "easy_read_reviewed" | "lived_experience_reviewed" | "approved" | "superseded";
export type ContentDependency = { sourceVersion: string; derivativeId: string; derivativeType: "translation" | "easy_read" | "bsl" | "captions" | "script" | "form" | "letter" | "help_page" | "print"; risk: "standard" | "critical"; currentSourceVersion: string };
export function invalidateContent(dependencies: readonly ContentDependency[]) { return dependencies.filter((item) => item.sourceVersion !== item.currentSourceVersion).map((item) => ({ ...item, outdated: true, publicationBlocked: item.risk === "critical" })); }

const highRisk = new Set(["emergency", "domestic_abuse", "child_safeguarding", "immigration", "legal_deadline", "medical_emergency"]);
export function translationCanPublish(category: string, legalReviewed: boolean, safeguardingReviewed: boolean, humanReviewed: boolean, sourceCurrent: boolean) {
  if (!sourceCurrent || !humanReviewed) return false;
  return !highRisk.has(category) || (legalReviewed && safeguardingReviewed);
}
export function validatePlainContentText(value: string) { return value.length <= 100_000 && !/(<\s*script|javascript:|data:text\/html|\u202e)/i.test(value); }

export function nextEasyReadStatus(current: ContentStatus, next: ContentStatus) {
  const order: ContentStatus[] = ["draft", "plain_language_reviewed", "easy_read_reviewed", "lived_experience_reviewed", "approved", "superseded"];
  return order.indexOf(next) === order.indexOf(current) + 1;
}

export type AccessibilityPreferences = { textSize: "default" | "large" | "extra_large"; lineSpacing: "default" | "wide"; font: "system" | "readable"; contrast: "default" | "high"; reducedMotion: boolean; simplifiedLayout: boolean; plainLanguage: boolean; easyRead: boolean; bsl: boolean; captions: boolean; screenReaderOptimised: boolean; keyboardFirst: boolean; voiceInput: boolean; lowBandwidth: boolean; reducedDensity: boolean; longerSessionWarnings: boolean; repeatConfirmations: boolean };
export const defaultAccessibilityPreferences: AccessibilityPreferences = { textSize: "default", lineSpacing: "default", font: "system", contrast: "default", reducedMotion: false, simplifiedLayout: false, plainLanguage: false, easyRead: false, bsl: false, captions: true, screenReaderOptimised: false, keyboardFirst: false, voiceInput: false, lowBandwidth: false, reducedDensity: false, longerSessionWarnings: false, repeatConfirmations: false };
export const accessibilityPreferencesSchema = z.object({ textSize: z.enum(["default","large","extra_large"]), lineSpacing: z.enum(["default","wide"]), font: z.enum(["system","readable"]), contrast: z.enum(["default","high"]), reducedMotion: z.boolean(), simplifiedLayout: z.boolean(), plainLanguage: z.boolean(), easyRead: z.boolean(), bsl: z.boolean(), captions: z.boolean(), screenReaderOptimised: z.boolean(), keyboardFirst: z.boolean(), voiceInput: z.boolean(), lowBandwidth: z.boolean(), reducedDensity: z.boolean(), longerSessionWarnings: z.boolean(), repeatConfirmations: z.boolean() }).strict();
export function shareableAccessibilityPreferences(preferences: AccessibilityPreferences, consentedKeys: readonly (keyof AccessibilityPreferences)[]) { return Object.fromEntries(consentedKeys.map((key) => [key, preferences[key]])); }

export type NotificationTemplate = { purpose: string; sensitivity: "low" | "moderate" | "high"; channels: ("email" | "sms" | "push" | "in_app")[]; variables: string[]; normal: string; discreet: string; ultraNeutral: string; approved: boolean; translationStatus: string };
const forbiddenNotificationTerms = /case|homeless|housing|evidence|council|abuse|refuge|application/i;
export function renderLockScreenNotification(template: NotificationTemplate, mode: "discreet" | "ultra_neutral") {
  const value = mode === "discreet" ? template.discreet : template.ultraNeutral;
  if (forbiddenNotificationTerms.test(value) || /\{[^}]+\}/.test(value)) return "You have a saved reminder.";
  return value;
}
import { z } from "zod";
