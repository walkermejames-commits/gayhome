import type pg from "pg";
import type { ImportEnvelope } from "@/domain/import/json-importer";
import { addDays } from "@/domain/verification";
import { stableUuid } from "@/server/db/identifiers";

export interface SeedResult {
  version: string;
  importId: string;
  revisionId: string | null;
  status: "published" | "idempotent" | "review_required";
  counts: Record<string, number>;
}

async function counts(client: pg.PoolClient | pg.Client): Promise<Record<string, number>> {
  const names = ["services", "councils", "triage_routes", "scripts", "evidence_categories", "sources"] as const;
  const result: Record<string, number> = {};
  for (const name of names) result[name] = Number((await client.query(`SELECT count(*)::int AS count FROM ${name} t JOIN dataset_revisions r ON r.id = t.dataset_revision_id WHERE r.is_active = true`)).rows[0]?.count ?? 0);
  return result;
}

export async function seedCatalog(client: pg.PoolClient | pg.Client, envelope: ImportEnvelope): Promise<SeedResult> {
  const catalog = envelope.catalog;
  const version = catalog.metadata.version;
  const existing = await client.query<{ revision_id: string; file_sha256: string }>("SELECT r.id AS revision_id, i.file_sha256 FROM dataset_revisions r JOIN dataset_imports i ON i.id = r.created_from_import_id WHERE r.external_version = $1", [version]);
  if (existing.rowCount) {
    if (existing.rows[0]!.file_sha256 === envelope.fileSha256) return { version, importId: stableUuid(`import:${envelope.fileSha256}:${envelope.parserVersion}:${envelope.kind}`), revisionId: existing.rows[0]!.revision_id, status: "idempotent", counts: await counts(client) };
    const conflictImportId = stableUuid(`import:${envelope.fileSha256}:${envelope.parserVersion}:${envelope.kind}`);
    await client.query("INSERT INTO dataset_imports (id, file_sha256, parser_version, import_kind, source_filename, status, raw_metadata) VALUES ($1,$2,$3,$4,$5,'review_required',$6) ON CONFLICT (file_sha256, parser_version, import_kind) DO UPDATE SET status = 'review_required'", [conflictImportId, envelope.fileSha256, envelope.parserVersion, envelope.kind, envelope.fileName, { proposedVersion: version }]);
    await client.query("INSERT INTO reconciliation_items (id, import_id, collection_name, external_id, classification, proposed_value) VALUES ($1,$2,'dataset_revision',$3,'changed',$4) ON CONFLICT DO NOTHING", [stableUuid(`reconciliation:${conflictImportId}`), conflictImportId, version, { fileSha256: envelope.fileSha256 }]);
    return { version, importId: conflictImportId, revisionId: existing.rows[0]!.revision_id, status: "review_required", counts: await counts(client) };
  }

  const importId = stableUuid(`import:${envelope.fileSha256}:${envelope.parserVersion}:${envelope.kind}`);
  const revisionId = stableUuid(`revision:${version}`);
  await client.query("BEGIN");
  try {
    await client.query("UPDATE dataset_revisions SET is_active = false WHERE is_active = true");
    await client.query("INSERT INTO dataset_imports (id, file_sha256, parser_version, import_kind, source_filename, status, raw_metadata) VALUES ($1,$2,$3,$4,$5,'validated',$6)", [importId, envelope.fileSha256, envelope.parserVersion, envelope.kind, envelope.fileName, { counts: { services: catalog.services.length, councils: catalog.councils.length, routes: catalog.triageRoutes.length, scripts: catalog.scripts.length, evidence: catalog.evidenceChecklist.length, sources: catalog.sources.length } }]);
    await client.query("INSERT INTO dataset_revisions (id, external_version, reason, effective_at, published_at, is_active, created_from_import_id) VALUES ($1,$2,$3,$4,now(),true,$5)", [revisionId, version, catalog.metadata.note, catalog.metadata.verifiedOn, importId]);
    for (const source of catalog.sources) {
      const sourceId = stableUuid(`${version}:source:${source.source_id}`);
      await client.query("INSERT INTO sources (id, external_id, dataset_revision_id, name, url, publisher_type, verified_on, review_after_days, notes, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'verified')", [sourceId, source.source_id, revisionId, source.source_name, source.source_url, source.publisher_type, source.verified_on, source.review_after_days, source.notes]);
      await client.query("INSERT INTO source_verifications (id, source_id, checked_at, method, outcome, next_review_date, notes) VALUES ($1,$2,$3,'controlled_import','verified',$4,'Imported from approved revision')", [stableUuid(`${version}:verification:${source.source_id}`), sourceId, `${source.verified_on}T00:00:00Z`, addDays(source.verified_on, source.review_after_days)]);
    }
    for (const service of catalog.services) {
      const serviceId = stableUuid(`${version}:service:${service.id}`);
      const sourceId = stableUuid(`${version}:source:${service.sourceId}`);
      await client.query("INSERT INTO services (id, external_id, dataset_revision_id, source_id, name, provider, service_type, coverage, ages, access_modes, hours, referral, lgbtq_focus, urgency, notes, verified_on, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)", [serviceId, service.id, revisionId, sourceId, service.name, service.provider, service.type, service.coverage, service.ages, service.accessModes, service.hours, service.referral, service.lgbtq, service.urgency, service.notes, service.verifiedOn, service.status]);
      for (const [sourceOrder, tag] of service.tags.entries()) await client.query("INSERT INTO service_tags (service_id, tag, source_order) VALUES ($1,$2,$3)", [serviceId, tag, sourceOrder]);
      for (const contact of service.contacts) await client.query("INSERT INTO contact_channels (id, service_id, channel_type, value, status, valid_from, valid_until, last_verified, intended_audience, new_users_accepted, existing_users_accepted, public_display_rule, replacement_route, transition_note, source_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)", [stableUuid(`${version}:contact:${service.id}:${contact.type}:${contact.value}`), serviceId, contact.type, contact.value, contact.status, contact.validFrom, contact.validUntil, contact.lastVerified, contact.intendedAudience, contact.newUsersAccepted, contact.existingUsersAccepted, contact.publicDisplayRule, contact.replacementRoute, contact.transitionNote, contact.sourceOrder]);
    }
    for (const council of catalog.councils) await client.query("INSERT INTO councils (id, external_id, dataset_revision_id, source_id, name, area, homelessness_url, phone, hours_notes, route_notes, verified_on, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", [stableUuid(`${version}:council:${council.id}`), council.id, revisionId, stableUuid(`${version}:source:${council.sourceId}`), council.name, council.area, council.homelessnessUrl, council.phone, council.hoursNotes, council.routeNotes, council.verifiedOn, council.status]);
    const serviceIds = new Set(catalog.services.map((service) => service.id));
    const councilIds = new Set(catalog.councils.map((council) => council.id));
    for (const route of catalog.triageRoutes) {
      const routeId = stableUuid(`${version}:route:${route.id}`);
      await client.query("INSERT INTO triage_routes (id, external_id, dataset_revision_id, trigger_name, recommended_action, urgency, safety_note, verified_on, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'verified')", [routeId, route.id, revisionId, route.triggerName, route.recommendedAction, route.urgency, route.safetyNote, route.verifiedOn]);
      for (const [sourceOrder, condition] of route.conditionTags.entries()) await client.query("INSERT INTO route_conditions (route_id, condition_tag, source_order) VALUES ($1,$2,$3)", [routeId, condition, sourceOrder]);
      for (const [sourceOrder, target] of route.targetIds.entries()) await client.query("INSERT INTO route_targets (route_id, target_external_id, target_kind, source_order) VALUES ($1,$2,$3,$4)", [routeId, target, target === "council_by_area" ? "resolver" : serviceIds.has(target) ? "service" : councilIds.has(target) ? "council" : "resolver", sourceOrder]);
    }
    for (const script of catalog.scripts) await client.query("INSERT INTO scripts (id, external_id, dataset_revision_id, title, audience, script_text, use_note, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'verified')", [stableUuid(`${version}:script:${script.script_id}`), script.script_id, revisionId, script.title, script.audience, script.script_text, script.use_note]);
    for (const evidence of catalog.evidenceChecklist) await client.query("INSERT INTO evidence_categories (id, external_id, dataset_revision_id, area, useful_evidence, safety_note, status) VALUES ($1,$2,$3,$4,$5,$6,'verified')", [stableUuid(`${version}:evidence:${evidence.evidence_id}`), evidence.evidence_id, revisionId, evidence.area, evidence.useful_evidence, evidence.safety_note]);
    await client.query("UPDATE dataset_imports SET status = 'published' WHERE id = $1", [importId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
  return { version, importId, revisionId, status: "published", counts: await counts(client) };
}
