export type AdapterState = "disabled" | "sandbox" | "test" | "production";
export type AdapterConfig = { id: string; state: AdapterState; timeoutMs: number; maxRetries: number; allowedDataFields: readonly string[]; circuitOpen: boolean };
export function adapterMayExecute(config: AdapterConfig, environment: "development" | "test" | "production", approved: boolean) { return approved && !config.circuitOpen && config.state !== "disabled" && (config.state !== "production" || environment === "production"); }
export function minimiseAdapterPayload(payload: Record<string, unknown>, config: AdapterConfig) { return Object.fromEntries(Object.entries(payload).filter(([key]) => config.allowedDataFields.includes(key))); }

export type CouncilAdapterStatus = "research_only" | "draft" | "sandbox" | "verified" | "disabled" | "retired";
export type CouncilAdapter = { id: string; council: string; formName: string; formVersion: string; url: string; fieldMappings: Record<string, string>; requiredFields: string[]; optionalFields: string[]; attachments: boolean; authenticationRequired: boolean; captchaRestriction: boolean; accessibilityLimitations: string[]; submissionMethod: "manual" | "assisted_copy" | "direct"; receiptHandling: string; lastVerified: string | null; status: CouncilAdapterStatus };
export function councilAdapterMaySubmit(adapter: CouncilAdapter, directSubmissionFlag: boolean) { return directSubmissionFlag && adapter.status === "verified" && adapter.submissionMethod === "direct" && !adapter.captchaRestriction; }
