import ExcelJS from "exceljs";
import { MAX_ROWS } from "./import-parse";

/** The blank spreadsheet teachers fill in. Example rows live on the Instructions sheet so they can never be imported by accident. */
export async function buildStudentTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Giant Step Academy";

  const ws = wb.addWorksheet("Students", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Admission Number", key: "adm", width: 24 },
    { header: "Full Name", key: "name", width: 36 },
    { header: "Gender", key: "gender", width: 12 },
    { header: "Date of Birth", key: "dob", width: 18 },
  ];

  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF12408F" } };
    cell.alignment = { vertical: "middle" };
  });

  // Text format keeps leading zeros ("001") from being turned into numbers by Excel.
  ws.getColumn(1).numFmt = "@";
  ws.getColumn(2).numFmt = "@";
  ws.getColumn(4).numFmt = "yyyy-mm-dd";

  for (let r = 2; r <= MAX_ROWS + 1; r++) {
    ws.getCell(r, 3).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Male,Female"'],
      showErrorMessage: true,
      errorTitle: "Gender",
      error: "Choose Male or Female.",
    };
  }

  const help = wb.addWorksheet("Instructions");
  help.getColumn(1).width = 110;
  [
    "How to fill in this template",
    "",
    "1. Type one student per row on the 'Students' sheet, starting under the headings.",
    "2. Admission Number and Full Name are required. Gender and Date of Birth are optional.",
    "3. Gender: Male or Female.",
    "4. Date of Birth: write it as 25/03/2014 or 2014-03-25 (day first is fine).",
    "5. Do not rename or delete the headings. Do not add other sheets.",
    `6. Up to ${MAX_ROWS} students per file. Save as .xlsx and upload it on the Import page.`,
    "",
    "Example (do not copy this row into the Students sheet):",
    "GSA/SS2/001  |  Ada Obi  |  Female  |  2010-03-25",
    "",
    "Nothing is saved until you have reviewed the preview and confirmed it.",
  ].forEach((line, i) => {
    const cell = help.getCell(i + 1, 1);
    cell.value = line;
    if (i === 0) cell.font = { bold: true, size: 14 };
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
