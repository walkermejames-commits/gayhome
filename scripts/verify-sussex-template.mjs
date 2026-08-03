import readXlsxFile from "read-excel-file/node";

const expected = ["Instructions", "Controlled Lists", "Services", "Councils", "Triage Routes", "Scripts", "Evidence Checklists", "Sources", "Regional Metadata", "Governance", "Verification"];
const dataSheets = new Set(expected.filter((name) => !["Instructions", "Controlled Lists"].includes(name)));
const workbook = await readXlsxFile("data/regions/sussex/templates/sussex-import-template.xlsx");
const byName = new Map(workbook.map(({ sheet, data }) => [sheet, data]));
const formulaErrors = [];
for (const [sheet, rows] of byName) {
  for (const row of rows) {
    for (const value of row) {
      if (typeof value === "string" && /#(?:REF|DIV\/0|VALUE|NAME\?|N\/A|NUM|NULL)!?/i.test(value)) formulaErrors.push({ sheet, value });
    }
  }
}
const rowCounts = Object.fromEntries([...dataSheets].map((name) => [name, Math.max(0, (byName.get(name)?.length ?? 1) - 1)]));
const result = {
  expectedSheets: expected.length,
  sheetNamesPresent: expected.every((name) => byName.has(name)),
  rowCounts,
  controlledRowsAllZero: Object.values(rowCounts).every((count) => count === 0),
  formulaErrors,
  passed: expected.every((name) => byName.has(name)) && Object.values(rowCounts).every((count) => count === 0) && formulaErrors.length === 0,
};
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
