import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
const expected=["Instructions","Controlled Lists","Services","Councils","Triage Routes","Scripts","Evidence Checklists","Sources","Regional Metadata","Governance","Verification"];
const workbook=await SpreadsheetFile.importXlsx(await FileBlob.load("data/regions/sussex/templates/sussex-import-template.xlsx"));
const sheets=(await workbook.inspect({kind:"sheet",include:"name",maxChars:8000})).ndjson;
const errors=[];for(const name of expected){const sheet=workbook.worksheets.getItem(name);const range=sheet.getUsedRange();const values=range?.values??[];const formulas=range?.formulas??[];for(const matrix of [values,formulas])for(const row of matrix)for(const value of row)if(typeof value==="string"&&/#(?:REF|DIV\/0|VALUE|NAME\?|N\/A|NUM|NULL)!?/i.test(value))errors.push({sheet:name,value});}
const counts=workbook.worksheets.getItem("Instructions").getRange("C6:C14").values.flat();
const result={expectedSheets:expected.length,sheetNamesPresent:expected.every((name)=>sheets.includes(`"name":"${name}"`)),formulaCounts:counts,formulaCountsAllZero:counts.every((value)=>value===0),formulaErrors:errors,passed:expected.every((name)=>sheets.includes(`"name":"${name}"`))&&counts.every((value)=>value===0)&&errors.length===0};console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
