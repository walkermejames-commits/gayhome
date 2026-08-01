import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? sourceFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

describe("security foundation", () => {
  it("sets baseline security headers", async () => {
    const rules = await nextConfig.headers?.();
    const headers = new Map(rules?.flatMap((rule) => rule.headers).map((header) => [header.key, header.value]));
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(headers.has("Permissions-Policy")).toBe(true);
  });

  it("contains no unsafe HTML/code execution sinks in application source", async () => {
    const files = (await sourceFiles(path.join(process.cwd(), "src"))).filter((file) => /\.(ts|tsx)$/.test(file));
    const source = (await Promise.all(files.map((file) => fs.readFile(file, "utf8")))).join("\n");
    expect(source).not.toMatch(/dangerouslySetInnerHTML|\beval\s*\(|new Function\s*\(|document\.write|innerHTML\s*=/);
  });

  it("does not hard-code operational phone or email contacts in presentation components", async () => {
    const files = (await sourceFiles(path.join(process.cwd(), "src"))).filter((file) => file.endsWith(".tsx"));
    const source = (await Promise.all(files.map((file) => fs.readFile(file, "utf8")))).join("\n");
    expect(source).not.toContain("116 123");
    expect(source).not.toContain("jo@samaritans.org");
    expect(source).not.toMatch(/\b0\d{2,4}\s?\d{3,4}\s?\d{3,4}\b/);
  });

  it("defines immutable revisions, temporal contacts and consent in the migration", async () => {
    const sql = await fs.readFile(path.join(process.cwd(), "migrations", "0001_phase1_foundation.sql"), "utf8");
    for (const table of ["dataset_revisions", "contact_channels", "source_verifications", "profile_facts", "consent_receipts", "autofill_mappings", "sessions"]) expect(sql).toContain(`CREATE TABLE ${table}`);
    for (const field of ["valid_from", "valid_until", "new_users_accepted", "existing_users_accepted", "public_display_rule", "replacement_route", "transition_note"]) expect(sql).toContain(field);
  });
});
