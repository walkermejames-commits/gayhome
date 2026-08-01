import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(process.argv[2]));
console.log(workbook.help("table", { search: "resize|range", include: "index,examples,notes", maxChars: 6000 }).ndjson);
