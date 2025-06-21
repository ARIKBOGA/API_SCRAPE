import path from "path";
import xlsx from "xlsx";
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

export type ProductReference = {
  yvNo: string;
  brand: string;
  crossNumber: string;
};

export function readProductReferencesFromExcel(): ProductReference[] {
  const excelPath = path.resolve(__dirname, `../resources/data/catalogInfo/excels/${productType}_katalog_full.xlsx`);
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

  const references: ProductReference[] = [];

  for (const row of data) {
    const yvNo = row['YV']?.toString()?.trim();
    if (!yvNo) continue;

    for (const key of Object.keys(row)) {
      if (key === 'YV') continue;

      const cellValue = row[key]?.toString()?.trim();
      if (!cellValue) continue;

      const refs = cellValue.split(',').map(r => r.trim());

      refs.forEach(crosses => {
        if (crosses) {
          crosses.split(',').forEach(crossNumber => {
            references.push({
              yvNo,
              brand: key.trim(),
              crossNumber: crossNumber.trim()
            });
          })
        }
      });
    }
  }
  console.log(`Read ${references.length} product references from Excel.`);
  return references;
}