import readExcelFile from "read-excel-file/node";
import { canonicaliseSeed, seedSchema, type Seed } from "@/domain/catalog";
import { sha256, type ImportEnvelope } from "@/domain/import/json-importer";

export const WORKBOOK_PARSER_VERSION = "1.0.0";

const expectedSheets = ["START HERE", "Services", "Councils", "Triage routes", "Scripts", "Evidence checklist", "App schema", "Sources & QA"];

function text(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

type SheetData = Awaited<ReturnType<typeof readExcelFile>>[number];

function rows(sheet: SheetData): Record<string, string>[] {
  const headers = (sheet.data[1] ?? []).map(text);
  const output: Record<string, string>[] = [];
  for (const row of sheet.data.slice(2)) {
    const record = Object.fromEntries(headers.map((header, index) => [header, text(row[index])]));
    if (Object.values(record).some(Boolean)) output.push(record);
  }
  return output;
}

function requireSheet(workbook: SheetData[], name: string): SheetData {
  const sheet = workbook.find((item) => item.sheet === name);
  if (!sheet) throw new Error(`Workbook is missing required sheet: ${name}`);
  return sheet;
}

export type WorkbookImportOptions = {
  /**
   * The workbook intentionally has no per-route verified-on column. Supply the
   * controlled sidecar value from the revision manifest instead of inventing it
   * from the workbook's overall revision date.
   */
  triageVerifiedOn: string;
};

export async function importWorkbookSeed(
  bytes: Uint8Array,
  fileName = "Kent_LGBTQ_Homelessness_Resource_Database_v1.0.1.xlsx",
  options: WorkbookImportOptions,
): Promise<ImportEnvelope> {
  const workbook = await readExcelFile(Buffer.from(bytes));
  const actualSheets = workbook.map((sheet) => sheet.sheet);
  if (JSON.stringify(actualSheets) !== JSON.stringify(expectedSheets)) throw new Error("Workbook sheet schema or order is not approved");

  const start = requireSheet(workbook, "START HERE");
  const services = rows(requireSheet(workbook, "Services"));
  const councils = rows(requireSheet(workbook, "Councils"));
  const routes = rows(requireSheet(workbook, "Triage routes"));
  const scripts = rows(requireSheet(workbook, "Scripts"));
  const evidence = rows(requireSheet(workbook, "Evidence checklist"));
  const sources = rows(requireSheet(workbook, "Sources & QA"));
  const verifiedOn = text(start.data[5]?.[1]);

  const candidate: Seed = seedSchema.parse({
    metadata: {
      title: "Kent LGBTQ+ Homelessness Resource Database",
      version: text(start.data[5]?.[0]),
      verifiedOn,
      note: "Workbook-controlled editorial and QA representation.",
    },
    services: services.map((row) => ({
      id: row["Service ID"], name: row.Name, provider: row.Provider, type: row.Type, coverage: row.Coverage, ages: row.Ages,
      tags: row["Condition tags"], modes: row.Access, phone: row.Phone, email: row.Email, url: row.URL, hours: row.Hours,
      referral: row["Referral / access"], lgbtq: row["LGBTQ+ focus"], urgency: row.Urgency, notes: row.Notes,
      sourceId: row["Source ID"], verifiedOn: row.Verified, status: row.Status,
    })),
    councils: councils.map((row) => ({
      council_id: row["Council ID"], council_name: row.Council, area: row.Area, homelessness_url: row["Homelessness URL"],
      phone: row.Phone, hours_notes: row["Hours / emergency"], route_notes: row["Route notes"], source_id: row["Source ID"],
      verified_on: row.Verified, status: row.Status,
    })),
    triage_routes: routes.map((row) => ({
      route_id: row["Route ID"], trigger_name: row.Trigger, condition_tags: row["Condition tags"], recommended_action: row["Recommended action"],
      target_ids: row["Target IDs"], urgency: row.Urgency, safety_note: row["Safety note"], verified_on: options.triageVerifiedOn,
    })),
    scripts: scripts.map((row) => ({ script_id: row["Script ID"], title: row.Title, audience: row.Audience, script_text: row.Script, use_note: row["Use note"] })),
    evidence_checklist: evidence.map((row) => ({ evidence_id: row["Evidence ID"], area: row.Area, useful_evidence: row["Useful evidence"], safety_note: row["Safety / handling note"] })),
    sources: sources.map((row) => ({
      source_id: row["Source ID"], source_name: row["Source name"], source_url: row.URL, publisher_type: row["Publisher type"],
      verified_on: row.Verified, review_after_days: row["Review after (days)"], notes: row["QA note"],
    })),
  });

  return { kind: "workbook", fileName, fileSha256: sha256(bytes), parserVersion: WORKBOOK_PARSER_VERSION, catalog: canonicaliseSeed(candidate) };
}
