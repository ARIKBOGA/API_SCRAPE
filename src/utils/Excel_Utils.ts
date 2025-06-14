import path from "path";
import xlsx from "xlsx";
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

type ProductReference = {
  yvNo: string;
  brandRefs: { [brand: string]: string };
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

    const brandRefs: { [brand: string]: string } = {};

    for (const key of Object.keys(row)) {
      if (key !== 'YV') {
        const ref = row[key]?.toString()?.trim();
        if (ref) {
          brandRefs[key] = ref;
        }
      }
    }
    references.push({ yvNo, brandRefs });
  }
  return references;
}