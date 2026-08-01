import type { CanonicalCatalog, CanonicalCouncil, CanonicalRoute, CanonicalService, ContactChannel } from "@/domain/catalog";
import { validateCatalog } from "@/domain/import/integrity";
import { getPool } from "@/server/db/pool";
import type { CatalogRepository, RepositoryHealth } from "@/server/repository/types";

type Row = Record<string, unknown>;
const dateText = (value: unknown) => value instanceof Date
  ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
  : String(value);

export class PostgresCatalogRepository implements CatalogRepository {
  async getCatalog(): Promise<CanonicalCatalog> {
    const client = await getPool().connect();
    try {
      const revision = await client.query<Row>("SELECT id, external_version, reason, effective_at FROM dataset_revisions WHERE is_active = true");
      if (revision.rowCount !== 1) throw new Error("Published catalog unavailable: exactly one active dataset revision is required.");
      const revisionId = String(revision.rows[0]!.id);
      const [sourceRows, serviceRows, tagRows, contactRows, councilRows, routeRows, conditionRows, targetRows, scriptRows, evidenceRows] = await Promise.all([
        getPool().query<Row>("SELECT external_id, name, url, publisher_type, verified_on, review_after_days, notes FROM sources WHERE dataset_revision_id = $1 AND status = 'verified' ORDER BY external_id", [revisionId]),
        getPool().query<Row>("SELECT s.external_id, s.name, s.provider, s.service_type, s.coverage, s.ages, s.access_modes, s.hours, s.referral, s.lgbtq_focus, s.urgency, s.notes, s.verified_on, s.status, so.external_id AS source_external_id FROM services s JOIN sources so ON so.id = s.source_id WHERE s.dataset_revision_id = $1 AND s.status = 'verified' ORDER BY s.external_id", [revisionId]),
        getPool().query<Row>("SELECT s.external_id, t.tag, t.source_order FROM service_tags t JOIN services s ON s.id = t.service_id WHERE s.dataset_revision_id = $1 ORDER BY s.external_id, t.source_order", [revisionId]),
        getPool().query<Row>("SELECT s.external_id, c.channel_type, c.value, c.status, c.valid_from, c.valid_until, c.last_verified, c.intended_audience, c.new_users_accepted, c.existing_users_accepted, c.public_display_rule, c.replacement_route, c.transition_note, c.source_order FROM contact_channels c JOIN services s ON s.id = c.service_id WHERE s.dataset_revision_id = $1 ORDER BY s.external_id, c.source_order", [revisionId]),
        getPool().query<Row>("SELECT c.external_id, c.name, c.area, c.homelessness_url, c.phone, c.hours_notes, c.route_notes, c.verified_on, c.status, s.external_id AS source_external_id FROM councils c JOIN sources s ON s.id = c.source_id WHERE c.dataset_revision_id = $1 AND c.status = 'verified' ORDER BY c.external_id", [revisionId]),
        getPool().query<Row>("SELECT external_id, trigger_name, recommended_action, urgency, safety_note, verified_on FROM triage_routes WHERE dataset_revision_id = $1 AND status = 'verified' ORDER BY external_id", [revisionId]),
        getPool().query<Row>("SELECT r.external_id, c.condition_tag, c.source_order FROM route_conditions c JOIN triage_routes r ON r.id = c.route_id WHERE r.dataset_revision_id = $1 ORDER BY r.external_id, c.source_order", [revisionId]),
        getPool().query<Row>("SELECT r.external_id, t.target_external_id, t.source_order FROM route_targets t JOIN triage_routes r ON r.id = t.route_id WHERE r.dataset_revision_id = $1 ORDER BY r.external_id, t.source_order", [revisionId]),
        getPool().query<Row>("SELECT external_id, title, audience, script_text, use_note FROM scripts WHERE dataset_revision_id = $1 AND status = 'verified' ORDER BY external_id", [revisionId]),
        getPool().query<Row>("SELECT external_id, area, useful_evidence, safety_note FROM evidence_categories WHERE dataset_revision_id = $1 AND status = 'verified' ORDER BY external_id", [revisionId]),
      ]);
      const group = (rows: Row[], key: string, value: string) => {
        const map = new Map<string, string[]>();
        for (const row of rows) map.set(String(row[key]), [...(map.get(String(row[key])) ?? []), String(row[value])]);
        return map;
      };
      const tags = group(tagRows.rows, "external_id", "tag");
      const conditions = group(conditionRows.rows, "external_id", "condition_tag");
      const targets = group(targetRows.rows, "external_id", "target_external_id");
      const contacts = new Map<string, ContactChannel[]>();
      for (const row of contactRows.rows) contacts.set(String(row.external_id), [...(contacts.get(String(row.external_id)) ?? []), {
        type: row.channel_type as ContactChannel["type"], value: String(row.value), status: row.status as ContactChannel["status"],
        validFrom: row.valid_from ? dateText(row.valid_from) : null, validUntil: row.valid_until ? dateText(row.valid_until) : null,
        lastVerified: dateText(row.last_verified), intendedAudience: String(row.intended_audience), newUsersAccepted: Boolean(row.new_users_accepted),
        existingUsersAccepted: Boolean(row.existing_users_accepted), publicDisplayRule: row.public_display_rule as ContactChannel["publicDisplayRule"],
        replacementRoute: row.replacement_route ? String(row.replacement_route) : null, transitionNote: row.transition_note ? String(row.transition_note) : null,
        sourceOrder: Number(row.source_order),
      }]);
      const services: CanonicalService[] = serviceRows.rows.map((row) => ({ id: String(row.external_id), name: String(row.name), provider: String(row.provider), type: String(row.service_type), coverage: String(row.coverage), ages: String(row.ages), tags: tags.get(String(row.external_id)) ?? [], accessModes: Array.isArray(row.access_modes) ? row.access_modes.map(String) : [], hours: String(row.hours), referral: String(row.referral), lgbtq: String(row.lgbtq_focus), urgency: row.urgency as CanonicalService["urgency"], notes: String(row.notes), sourceId: String(row.source_external_id), verifiedOn: dateText(row.verified_on), status: row.status as CanonicalService["status"], contacts: contacts.get(String(row.external_id)) ?? [] }));
      const councils: CanonicalCouncil[] = councilRows.rows.map((row) => ({ id: String(row.external_id), name: String(row.name), area: String(row.area), homelessnessUrl: String(row.homelessness_url), phone: String(row.phone), hoursNotes: String(row.hours_notes), routeNotes: String(row.route_notes), sourceId: String(row.source_external_id), verifiedOn: dateText(row.verified_on), status: row.status as CanonicalCouncil["status"] }));
      const triageRoutes: CanonicalRoute[] = routeRows.rows.map((row) => ({ id: String(row.external_id), triggerName: String(row.trigger_name), conditionTags: conditions.get(String(row.external_id)) ?? [], recommendedAction: String(row.recommended_action), targetIds: targets.get(String(row.external_id)) ?? [], urgency: row.urgency as CanonicalRoute["urgency"], safetyNote: String(row.safety_note), verifiedOn: dateText(row.verified_on) }));
      const catalog: CanonicalCatalog = {
        metadata: { title: "Kent LGBTQ+ Homelessness Resource Database", version: String(revision.rows[0]!.external_version), verifiedOn: dateText(revision.rows[0]!.effective_at), note: String(revision.rows[0]!.reason) },
        services, councils, triageRoutes,
        scripts: scriptRows.rows.map((row) => ({ script_id: String(row.external_id), title: String(row.title), audience: String(row.audience), script_text: String(row.script_text), use_note: String(row.use_note) })),
        evidenceChecklist: evidenceRows.rows.map((row) => ({ evidence_id: String(row.external_id), area: String(row.area), useful_evidence: String(row.useful_evidence), safety_note: String(row.safety_note) })),
        sources: sourceRows.rows.map((row) => ({ source_id: String(row.external_id), source_name: String(row.name), source_url: String(row.url), publisher_type: String(row.publisher_type), verified_on: dateText(row.verified_on), review_after_days: Number(row.review_after_days), notes: String(row.notes) })),
      };
      const integrity = validateCatalog(catalog);
      if (!integrity.passed) throw new Error(`Database catalog failed integrity validation: ${integrity.issues.map((issue) => issue.code).join(", ")}`);
      return catalog;
    } finally {
      client.release();
    }
  }

  async getHealth(): Promise<RepositoryHealth> {
    try {
      const catalog = await this.getCatalog();
      const migrations = await getPool().query<{ count: number }>("SELECT count(*)::int AS count FROM schema_migrations");
      return { storage: "postgresql", connected: true, migrationCurrent: Number(migrations.rows[0]?.count ?? 0) >= 2, activeRevision: catalog.metadata.version, integrityPassed: true };
    } catch {
      return { storage: "postgresql", connected: false, migrationCurrent: false, activeRevision: null, integrityPassed: false };
    }
  }
}
