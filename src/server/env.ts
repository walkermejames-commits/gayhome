import { z } from "zod";

const optionalText = z.preprocess((value) => value === "" ? undefined : value, z.string().trim().min(1).optional());

const environmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_BASE_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.preprocess((value) => value === "" ? undefined : value, z.string().url().refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), "DATABASE_URL must use PostgreSQL").optional()),
  DATABASE_SSL_MODE: z.enum(["disable", "prefer", "require", "verify-full"]).default("disable"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(5_000),
  SESSION_SECRET: z.preprocess((value) => value === "" ? undefined : value, z.string().min(32).optional()),
  SESSION_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  AUTH_TEST_MODE: z.enum(["true", "false"]).default("false"),
  ENCRYPTION_KEY_ID: optionalText,
  ENCRYPTION_MASTER_KEY: optionalText,
  OBJECT_STORAGE_ENDPOINT: optionalText,
  OBJECT_STORAGE_BUCKET: optionalText,
  OBJECT_STORAGE_REGION: optionalText,
  OBJECT_STORAGE_ACCESS_KEY_ID: optionalText,
  OBJECT_STORAGE_SECRET_ACCESS_KEY: optionalText,
  MALWARE_SCANNER_ENDPOINT: optionalText,
  MAIL_PROVIDER: optionalText,
  EVIDENCE_STORAGE_ENABLED: z.enum(["true", "false"]).default("false"),
  MAIL_SENDING_ENABLED: z.enum(["true", "false"]).default("false"),
  EVIDENCE_001_APPROVED: z.enum(["true", "false"]).default("false"),
  MAIL_001_APPROVED: z.enum(["true", "false"]).default("false"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type AppEnvironment = z.infer<typeof environmentSchema>;
let cachedEnvironment: AppEnvironment | undefined;

export function getEnvironment(): AppEnvironment {
  cachedEnvironment ??= environmentSchema.parse(process.env);
  return cachedEnvironment;
}

export function resetEnvironmentForTests(): void {
  cachedEnvironment = undefined;
}

export function requireDatabaseEnvironment(): AppEnvironment & { DATABASE_URL: string } {
  const environment = getEnvironment();
  if (!environment.DATABASE_URL) throw new Error("Database unavailable: DATABASE_URL is not configured.");
  return environment as AppEnvironment & { DATABASE_URL: string };
}

export function assertDeploymentEnvironment(): AppEnvironment {
  const environment = getEnvironment();
  const missing = [
    !environment.DATABASE_URL && "DATABASE_URL",
    !environment.SESSION_SECRET && "SESSION_SECRET",
    !environment.ENCRYPTION_KEY_ID && "ENCRYPTION_KEY_ID",
  ].filter(Boolean);
  if (missing.length > 0) throw new Error(`Deployment is blocked: missing ${missing.join(", ")}.`);
  if (environment.APP_ENV === "production" && environment.APP_BASE_URL.startsWith("http://")) throw new Error("Deployment is blocked: production APP_BASE_URL must use HTTPS.");
  if ((environment.APP_ENV === "staging" || environment.APP_ENV === "production") && environment.AUTH_TEST_MODE === "true") throw new Error("Deployment is blocked: AUTH_TEST_MODE is forbidden outside development and test.");
  if (environment.EVIDENCE_STORAGE_ENABLED === "true" && (environment.EVIDENCE_001_APPROVED !== "true" || !environment.OBJECT_STORAGE_ENDPOINT || !environment.OBJECT_STORAGE_BUCKET || !environment.MALWARE_SCANNER_ENDPOINT)) throw new Error("Deployment is blocked: evidence storage requires EVIDENCE-001 approval, object storage and malware scanning.");
  if (environment.MAIL_SENDING_ENABLED === "true" && (environment.MAIL_001_APPROVED !== "true" || !environment.MAIL_PROVIDER)) throw new Error("Deployment is blocked: external mail requires MAIL-001 approval and an approved provider.");
  return environment;
}
