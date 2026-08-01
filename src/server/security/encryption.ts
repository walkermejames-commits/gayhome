import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getEnvironment } from "@/server/env";

const VERSION = "a256gcm-v1";

function key(): { id: string; bytes: Buffer } {
  const environment = getEnvironment();
  if (!environment.ENCRYPTION_KEY_ID || !environment.ENCRYPTION_MASTER_KEY) throw new Error("Encrypted persistence is unavailable.");
  const bytes = Buffer.from(environment.ENCRYPTION_MASTER_KEY, "base64");
  if (bytes.length !== 32) throw new Error("ENCRYPTION_MASTER_KEY must be a base64-encoded 256-bit key.");
  return { id: environment.ENCRYPTION_KEY_ID, bytes };
}

export function encryptSensitive(plaintext: string, context: string): string {
  const active = key();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", active.bytes, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [VERSION, active.id, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSensitive(envelope: string, context: string): string {
  const [version, keyId, iv, tag, ciphertext] = envelope.split(".");
  const active = key();
  if (version !== VERSION || keyId !== active.id || !iv || !tag || ciphertext === undefined) throw new Error("Encrypted value cannot be opened with the active key.");
  const decipher = createDecipheriv("aes-256-gcm", active.bytes, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}
