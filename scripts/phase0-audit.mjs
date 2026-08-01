import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = process.cwd();
const dataDir = process.env.DATASET_DIR ? path.resolve(root, process.env.DATASET_DIR) : path.join(root, "data", "source");
const outDir = process.env.AUDIT_DIR ? path.resolve(root, process.env.AUDIT_DIR) : path.join(root, "artifacts", "phase0");
const jsonPath = path.join(dataDir, "kent_lgbtq_homelessness_resource_seed.json");
const xlsxPath = path.join(dataDir, process.env.WORKBOOK_NAME ?? "Kent_LGBTQ_Homelessness_Resource_Database_v1.xlsx");

await fs.mkdir(path.join(outDir, "workbook-renders"), { recursive: true });

const seed = JSON.parse(await fs.readFile(jsonPath, "utf8"));
const collections = ["services", "councils", "triage_routes", "scripts", "evidence_checklist", "sources"];

const jsonSummary = Object.fromEntries(collections.map((name) => {
  const rows = seed[name] ?? [];
  return [name, {
    count: rows.length,
    fields: [...new Set(rows.flatMap((row) => Object.keys(row)))],
    firstRecord: rows[0] ?? null,
  }];
}));

const input = await FileBlob.load(xlsxPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 30000,
  tableMaxRows: 5,
  tableMaxCols: 12,
  tableMaxCellChars: 120,
});
await fs.writeFile(path.join(outDir, "workbook-inspect.ndjson"), overview.ndjson, "utf8");

const sheets = [];
for (let index = 0; index < workbook.worksheets.items.length; index += 1) {
  const sheet = workbook.worksheets.getItemAt(index);
  const used = sheet.getUsedRange();
  const values = used?.values ?? [];
  const render = await workbook.render({ sheetName: sheet.name, autoCrop: "all", scale: 1.25, format: "png" });
  const safeName = sheet.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  await fs.writeFile(
    path.join(outDir, "workbook-renders", `${String(index + 1).padStart(2, "0")}-${safeName}.png`),
    new Uint8Array(await render.arrayBuffer()),
  );
  sheets.push({
    name: sheet.name,
    rowCount: values.length,
    columnCount: values.reduce((max, row) => Math.max(max, row.length), 0),
    rows: values,
  });
}

await fs.writeFile(
  path.join(outDir, "dataset-extract.json"),
  JSON.stringify({ json: jsonSummary, workbook: { sheets } }, null, 2),
  "utf8",
);

console.log(JSON.stringify({
  jsonCounts: Object.fromEntries(collections.map((name) => [name, seed[name]?.length ?? 0])),
  workbookSheets: sheets.map(({ name, rowCount, columnCount }) => ({ name, rowCount, columnCount })),
}, null, 2));
