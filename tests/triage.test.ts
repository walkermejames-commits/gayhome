import fs from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { importJsonSeed } from "@/domain/import/json-importer";
import { publicContacts, resolveTriage } from "@/domain/triage";
import type { CanonicalCatalog } from "@/domain/catalog";

let catalog: CanonicalCatalog;
beforeAll(async () => {
  const bytes = await fs.readFile(path.join(process.cwd(), "data", "revisions", "v1.0.1", "kent_lgbtq_homelessness_resource_seed.json"));
  catalog = importJsonSeed(bytes).catalog;
});

describe("deterministic triage", () => {
  it("puts the immediate-danger route first and preserves target order", () => {
    const result = resolveTriage(catalog, { conditions: ["immediate danger", "medical emergency"] });
    expect(result[0]?.route.id).toBe("route_01");
    expect(result[0]?.targets.map((target) => target.id)).toEqual(["srv_999", "srv_111", "srv_release_pressure"]);
  });

  it("resolves council_by_area through a defined resolver", () => {
    const result = resolveTriage(catalog, { conditions: ["homeless tonight"], area: "Canterbury" });
    const tonight = result.find((item) => item.route.id === "route_02");
    expect(tonight?.targets.some((target) => target.id === "council_canterbury")).toBe(true);
  });

  it("keeps the under-18 safeguarding route critical", () => {
    const result = resolveTriage(catalog, { conditions: ["under_18", "homeless"] });
    expect(result.find((item) => item.route.id === "route_06")?.route.urgency).toBe("critical");
  });

  it("never exposes retired or new-user-blocked contact channels", () => {
    const service = structuredClone(catalog.services[0]!);
    service.contacts.push({ type: "email", value: "historical@example.test", status: "existing_users_only", validFrom: null, validUntil: null, lastVerified: "2026-08-01", intendedAudience: "existing users", newUsersAccepted: false, existingUsersAccepted: true, publicDisplayRule: "hide", replacementRoute: "telephone", transitionNote: "historical", sourceOrder: 99 });
    expect(publicContacts(service, "2026-08-01").some((contact) => contact.value === "historical@example.test")).toBe(false);
  });
});
