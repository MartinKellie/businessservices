import ExcelJS from 'exceljs';

/** Reads the first worksheet of an .xlsx file into a grid of strings. */
export async function parseXlsx(buffer: ArrayBuffer | Buffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  // exceljs's bundled types predate the newer resizable-ArrayBuffer Buffer
  // typings, so a plain Buffer needs an explicit cast here at the boundary.
  await workbook.xlsx.load(nodeBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      cells.push(
        v === null || v === undefined ? '' : String(v instanceof Date ? v.toISOString() : v),
      );
    });
    rows.push(cells);
  });
  return rows;
}

/** Writes a grid of values as a single-sheet .xlsx file. */
export async function toXlsxBuffer(rows: unknown[][], sheetName = 'Datos'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
