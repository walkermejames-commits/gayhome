import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workbook = Workbook.create();
const definitions = [
  ["Services", ["stable_id","subregion","name","coverage_display","structured_coverage_json","contact_methods_json","accessibility_json","source_ids","publication_status"]],
  ["Councils", ["stable_id","subregion","name","route_reference","source_ids","publication_status"]],
  ["Triage Routes", ["stable_id","subregion","trigger","target_id","fallback_id","source_ids","publication_status"]],
  ["Scripts", ["stable_id","subregion","title","body","source_ids","review_status"]],
  ["Evidence Checklists", ["stable_id","subregion","title","body","source_ids","review_status"]],
  ["Sources", ["stable_id","subregion","title","url","publisher","retrieved_at"]],
  ["Regional Metadata", ["region_id","subregion","name","revision","status","source_owner","supplied_at"]],
  ["Governance", ["subregion","responsibility","owner_reference","status","reviewed_at"]],
  ["Verification", ["subregion","subject_type","subject_id","assignee_reference","status","due_at"]],
];
const instructions = workbook.worksheets.add("Instructions");
const lists = workbook.worksheets.add("Controlled Lists");
for (const [name] of definitions) workbook.worksheets.add(name);

instructions.showGridLines = false;
instructions.getRange("A1:F1").merge();
instructions.getRange("A1").values = [["Sussex controlled regional import template"]];
instructions.getRange("A1:F1").format = { fill: "#321436", font: { bold: true, color: "#FFFFFF", size: 18 }, rowHeight: 32 };
instructions.getRange("A3:F3").merge();
instructions.getRange("A3").values = [["Template only — no Sussex service or contact data is included, and publication is blocked by SUSSEX-DATA-001."]];
instructions.getRange("A3:F3").format = { fill: "#FFF3CF", font: { bold: true, color: "#20242C" }, wrapText: true, rowHeight: 38 };
instructions.getRange("A5:C15").values = [["Sheet","Purpose","Rows entered"], ...definitions.map(([name]) => [name, `Controlled ${name.toLowerCase()} import`, null])];
instructions.getRange("A5:C5").format = { fill: "#0C6B68", font: { bold: true, color: "#FFFFFF" }, borders: { preset: "all", style: "thin", color: "#D7D8DC" } };
definitions.forEach(([name], index) => { instructions.getRange(`C${index + 6}`).formulas = [[`=COUNTA('${name}'!A2:A201)`]]; });
instructions.getRange("A5:C15").format.borders = { preset: "all", style: "thin", color: "#D7D8DC" };
instructions.getRange("A17:F22").values = [["Control","Requirement",null,null,null,null],["Stable IDs","Use registered srv_esx/srv_wsx/srv_bnh, council_* or route_* prefixes.",null,null,null,null],["Sources","Every imported record must resolve to an authoritative HTTPS source.",null,null,null,null],["Status","Use draft only. This workbook cannot publish data.",null,null,null,null],["Safety","Do not add real user data, case data, secrets, formulas, macros or executable content.",null,null,null,null],["Review","Quarantine failures and complete reconciliation plus human safeguarding, legal and accessibility reviews.",null,null,null,null]];
instructions.getRange("A17:F17").format = { fill: "#4B1F4F", font: { bold: true, color: "#FFFFFF" } };
instructions.getRange("A1:F22").format.wrapText = true;
instructions.getRange("A1:F22").format.autofitColumns();
instructions.getRange("B:B").format.columnWidth = 58;
instructions.freezePanes.freezeRows(5);

lists.showGridLines = false;
lists.getRange("A1:F1").values = [["subregion","publication_status","review_status","owner_status","assignment_status","urgency"]];
lists.getRange("A2:F6").values = [
  ["east-sussex","draft","draft","unassigned","unassigned","standard"],
  ["west-sussex",null,"plain_language_reviewed","proposed","assigned","urgent"],
  ["brighton-hove",null,"easy_read_reviewed","approved","complete","safety_critical"],
  [null,null,"lived_experience_reviewed",null,null,null],
  [null,null,"approved",null,null,null],
];
lists.getRange("A1:F1").format = { fill: "#0C6B68", font: { bold: true, color: "#FFFFFF" } };
lists.getRange("A1:F6").format.borders = { preset: "all", style: "thin", color: "#D7D8DC" };
lists.getRange("A1:F6").format.autofitColumns();
lists.freezePanes.freezeRows(1);

for (const [name, headers] of definitions) {
  const sheet = workbook.worksheets.getItem(name);
  sheet.showGridLines = false;
  const lastColumn = String.fromCharCode(64 + headers.length);
  sheet.getRange(`A1:${lastColumn}1`).values = [headers];
  sheet.getRange(`A1:${lastColumn}1`).format = { fill: "#321436", font: { bold: true, color: "#FFFFFF" }, wrapText: true, rowHeight: 34, borders: { preset: "all", style: "thin", color: "#D7D8DC" } };
  sheet.getRange(`A2:${lastColumn}201`).format = { borders: { preset: "all", style: "thin", color: "#E5E7EB" }, wrapText: true };
  sheet.getRange(`A1:${lastColumn}12`).format.autofitColumns();
  sheet.getRange("A:A").format.columnWidth = 24;
  sheet.freezePanes.freezeRows(1);
  if (headers.includes("subregion")) sheet.getRange(`B2:B201`).dataValidation = { rule: { type: "list", formula1: "='Controlled Lists'!$A$2:$A$4" } };
  const publicationIndex = headers.indexOf("publication_status");
  if (publicationIndex >= 0) sheet.getRangeByIndexes(1, publicationIndex, 200, 1).dataValidation = { rule: { type: "list", formula1: "='Controlled Lists'!$B$2:$B$2" } };
  const reviewIndex = headers.indexOf("review_status");
  if (reviewIndex >= 0) sheet.getRangeByIndexes(1, reviewIndex, 200, 1).dataValidation = { rule: { type: "list", formula1: "='Controlled Lists'!$C$2:$C$6" } };
}

const outputDir = "outputs/phase6-platform-expansion";
const repoTemplateDir = "data/regions/sussex/templates";
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(`${outputDir}/previews`, { recursive: true });
const file = await SpreadsheetFile.exportXlsx(workbook);
await file.save(`${outputDir}/sussex-import-template.xlsx`);
await file.save(`${repoTemplateDir}/sussex-import-template.xlsx`);
for (const sheetName of ["Instructions","Controlled Lists", ...definitions.map(([name]) => name)]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/previews/${sheetName.replaceAll(" ", "-").toLowerCase()}.png`, new Uint8Array(await preview.arrayBuffer()));
}
const inspection = await workbook.inspect({ kind: "sheet,formula", maxChars: 12000, options: { maxResults: 200 } });
await fs.writeFile(`${outputDir}/workbook-inspection.ndjson`, inspection.ndjson, "utf8");
console.log(inspection.ndjson);
