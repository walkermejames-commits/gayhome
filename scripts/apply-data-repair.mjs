import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = process.cwd();
const workbookPath = path.join(root, "data", "revisions", "v1.0.1", "Kent_LGBTQ_Homelessness_Resource_Database_v1.0.1.xlsx");
const renderDir = path.join(root, "artifacts", "v1.0.1", "workbook-renders");
const outputTemp = path.join(root, "artifacts", "v1.0.1", "repaired-workbook.xlsx");
await fs.mkdir(renderDir, { recursive: true });

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));

function table(sheetName) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const values = sheet.getUsedRange().values;
  const headers = values[1].map((value) => String(value ?? "").trim());
  return { sheet, values, headers };
}

function rowById(values, id) {
  const index = values.findIndex((row, rowIndex) => rowIndex >= 2 && String(row[0] ?? "").trim() === id);
  if (index < 0) throw new Error(`Missing required row ${id}`);
  return index;
}

const services = table("Services");
const expectedServiceHeaders = [
  "Service ID", "Name", "Provider", "Type", "Coverage", "Ages", "Condition tags", "Access", "Phone", "Email",
  "URL", "Hours", "Referral / access", "LGBTQ+ focus", "Urgency", "Notes", "Source ID", "Verified", "Status",
];
if (JSON.stringify(services.headers) !== JSON.stringify(expectedServiceHeaders)) throw new Error("Unexpected Services column schema");
const serviceRowIndex = rowById(services.values, "srv_samaritans");
const serviceRowRange = services.sheet.getRangeByIndexes(serviceRowIndex, 0, 1, expectedServiceHeaders.length);
serviceRowRange.values = [[
  "srv_samaritans",
  "Samaritans",
  "Samaritans",
  "Emotional support and suicide prevention",
  "UK and ROI",
  "all",
  "suicidal thoughts|distress|isolation",
  "phone",
  "116 123",
  "",
  "https://www.samaritans.org/how-we-can-help/",
  "24/7 phone",
  "Call free on 116 123 at any time. If there is an immediate threat to life or a serious medical emergency, call 999.",
  "inclusive",
  "critical",
  "No requirement to be suicidal to call. Samaritans is an emotional-support service and does not provide accommodation, housing advice or emergency medical treatment. The UK email service is closing during 2026 and must not be displayed as a standard route for new users.",
  "src_samaritans",
  "2026-08-01",
  "verified",
]];
serviceRowRange.format.autofitRows();

const sources = table("Sources & QA");
const expectedSourceHeaders = ["Source ID", "Source name", "URL", "Publisher type", "Verified", "Review after (days)", "QA note"];
if (JSON.stringify(sources.headers) !== JSON.stringify(expectedSourceHeaders)) throw new Error("Unexpected Sources & QA column schema");
const sourceValues = [
  "src_samaritans",
  "Samaritans contact and support information",
  "https://www.samaritans.org/how-we-can-help/",
  "Charity",
  "2026-08-01",
  30,
  "Official Samaritans source. Free telephone support is available on 116 123, 24 hours a day. The UK email service stopped accepting new users on 27 April 2026 and is scheduled to close completely on 30 September 2026. Do not present jo@samaritans.org as a standard contact route for new users.",
];
const existingSourceIndex = sources.values.findIndex((row, rowIndex) => rowIndex >= 2 && String(row[0] ?? "").trim() === "src_samaritans");
if (existingSourceIndex >= 0) {
  const existingSourceRange = sources.sheet.getRangeByIndexes(existingSourceIndex, 0, 1, expectedSourceHeaders.length);
  existingSourceRange.values = [sourceValues];
  existingSourceRange.getCell(0, 6).format.wrapText = true;
  existingSourceRange.format.autofitRows();
} else {
  const targetIndex = sources.values.length;
  const previous = sources.sheet.getRangeByIndexes(targetIndex - 1, 0, 1, expectedSourceHeaders.length);
  const target = sources.sheet.getRangeByIndexes(targetIndex, 0, 1, expectedSourceHeaders.length);
  target.copyFrom(previous, "all");
  target.values = [sourceValues];
  target.getCell(0, 6).format.wrapText = true;
  target.format.autofitRows();
}
const sourceTable = sources.sheet.tables.getItem("SourcesQATable");
sourceTable.delete();
const replacementSourceTable = sources.sheet.tables.add(`A2:G${sources.sheet.getUsedRange().values.length}`, true);
replacementSourceTable.name = "SourcesQATable";

const start = workbook.worksheets.getItem("START HERE");
start.getRange("A1").values = [["Kent LGBTQ+ Homelessness Resource Database — v1.0.1"]];
start.getRange("A6").values = [["v1.0.1"]];
start.getRange("B6").values = [["2026-08-01"]];

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputTemp);
await fs.copyFile(outputTemp, workbookPath);

for (let index = 0; index < workbook.worksheets.items.length; index += 1) {
  const sheet = workbook.worksheets.getItemAt(index);
  const image = await workbook.render({ sheetName: sheet.name, autoCrop: "all", scale: 1.25, format: "png" });
  const safeName = sheet.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  await fs.writeFile(path.join(renderDir, `${String(index + 1).padStart(2, "0")}-${safeName}.png`), new Uint8Array(await image.arrayBuffer()));
}

console.log(JSON.stringify({ workbookPath, serviceRow: serviceRowIndex + 1, sourceRow: (existingSourceIndex >= 0 ? existingSourceIndex : sources.values.length) + 1 }, null, 2));
