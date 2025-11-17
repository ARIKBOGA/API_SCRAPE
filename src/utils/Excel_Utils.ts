import path from "path";
import xlsx from "xlsx";
import { ProductReference } from "./Types";
import { PRODUCT_TYPE } from "../config/env";


/**
 * Reads product references from the Excel file specified in the PRODUCT_TYPE environment variable.
 * The Excel file should have a column named 'YV' containing the YV numbers of products.
 * The function returns an array of ProductReference objects, each containing the YV number,
 * supplier, and cross number of a product.
 * @returns an array of ProductReference objects
 */
export function readProductReferencesFromExcel(): ProductReference[] {
  // Get the path to the Excel file specified in the PRODUCT_TYPE environment variable
  const excelPath = path.resolve(__dirname, `../resources/catalog/excels/${PRODUCT_TYPE}_katalog_full.xlsx`);

  // Read the Excel file
  const workbook = xlsx.readFile(excelPath);

  // Get the first sheet of the workbook
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Convert the sheet to JSON data
  const data = xlsx.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

  // Initialize an empty array to store the product references
  const references: ProductReference[] = [];

  // Iterate over each row of the data
  for (const row of data) {
    // Get the YV number from the row, or an empty string if it's not present
    const yvNo = row['YV']?.toString()?.trim() || "";

    // If the YV number is empty, skip this row
    if (!yvNo) continue;

    // Iterate over each key of the row
    for (const key of Object.keys(row)) {
      // If the key is 'YV', skip this key
      if (key === 'YV') continue;

      // Get the cell value from the row, or an empty string if it's not present
      const cellValue = row[key]?.toString()?.trim() || "";

      // If the cell value is empty, skip this key
      if (!cellValue) continue;

      // Split the cell value into an array of cross numbers
      const refs = cellValue.split(',').map(r => r.trim());

      // Iterate over each cross number
      refs.forEach(crosses => {
        // Split the cross number into an array of individual cross numbers
        crosses.split(',').forEach(crossNumber => {
          // If the cross number is not empty, add a new ProductReference to the array
          if (crossNumber) {
            references.push({
              yvNo,
              supplier: key.trim(),
              freeTextSearch: crossNumber.trim()
            });
          }
        });
      });
    }
  }
  console.log(`Read ${references.length} product references from Excel.`);
  return references;
}