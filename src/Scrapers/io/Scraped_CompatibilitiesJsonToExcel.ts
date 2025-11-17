import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { OutputManufacturer, OutputModelSeries, OutputTarget, ProductCompatibilityResult } from '../../utils/Types';
import { brandAliases, excelTitles } from '../api/resources/Variables';
import { markaNameToIdMap, modelDataMap } from './Utils';
import { FILTER_BRAND, PRODUCT_TYPE } from '../../config/env';



/**
 * Converts a Vehicle-Compatibility JSON file to an Excel workbook and saves it.
 * @param inputFilePath The path to the JSON file to be read
 * @param outputDirectory The directory where the Excel file will be saved
 */
export async function scraped_Compatibilities_JsonToExcel(results: any[]): Promise<void> {


  const OUTPUT_FILEPATH = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/excels/Vehicle-Compatibility/Vehicle-Compatibility_${FILTER_BRAND}.xlsx`);

  // Create a new Excel workbook
  const workbook = XLSX.utils.book_new();

  // Map to keep track of sheet name counts to handle duplicate sheet names
  const sheetNameCounts = new Map<string, number>();

  // An array to avoid duplicte rows even if they belongs to different cross numbers with same YV
  const rowKeys: string[] = [];
  const allRows: any[][] = [];

  try {
    // Read and parse the JSON data from the input file
    const data: ProductCompatibilityResult[] = results;

    // Map to store data for each sheet
    const sheetDataMap = new Map<string, any[][]>();

    // Iterate through each item in the JSON data
    data.forEach(item => {
      // Skip processing if the YV number has already been processed
      //if (processedYVNUmbers.includes(item.yvNo)) return;
      //processedYVNUmbers.push(item.yvNo);

      // Use the cross number as the base name for the sheet
      let baseSheetName = item.crossNumber;
      let actualSheetName = baseSheetName;

      // Initialize the sheet data with titles if the sheet doesn't exist yet
      if (!sheetDataMap.has(baseSheetName)) {
        sheetDataMap.set(baseSheetName, [excelTitles]);
      }

      // Handle duplicate sheet names by appending a letter to the sheet name
      if ((sheetNameCounts.get(baseSheetName) || 0) > 0) {
        let currentCount = sheetNameCounts.get(baseSheetName) || 0;
        actualSheetName = `${baseSheetName}-${String.fromCharCode(65 + currentCount)}`;
        sheetNameCounts.set(baseSheetName, currentCount + 1);
      } else {
        sheetNameCounts.set(baseSheetName, 1);
      }

      // Retrieve or initialize the sheet rows for the current sheet
      const sheetRows = sheetDataMap.get(baseSheetName) ?? [];

      // Iterate through each compatible vehicle
      item.compatibleVehicles.forEach((vehicle: OutputManufacturer) => {
        // Lookup the marka ID using the manufacturer name
        const marka_id = markaNameToIdMap.get(vehicle.manufacturer.trim().toUpperCase()) ||
          markaNameToIdMap.get((brandAliases.get(vehicle.manufacturer.trim().toUpperCase())) as string) || null;

        // Iterate through each model series
        vehicle.models.forEach((model: OutputModelSeries) => {
          // Construct the model key and lookup the model ID
          const modelKey = `${brandAliases.get(vehicle.manufacturer.trim().toUpperCase()) || vehicle.manufacturer.trim().toUpperCase()}_${model.modelSeries.trim().toUpperCase()}`;
          const foundModelData = modelDataMap.get(modelKey);
          const model_id = foundModelData ? foundModelData.id : null;

          // Iterate through each target
          model.targets.forEach((target: OutputTarget) => {
            // Extract year information and slice to two digits
            const fromYear = target.constructionYearFrom?.slice(-2) || '';
            const toYear = target.constructionYearTo?.slice(-2) || '';

            // Add a row to the sheet with the extracted and calculated data
            const rowKey = `${item.yvNo}_${marka_id}_${vehicle.manufacturer}_${model_id}_${model.modelSeries}_${target.engine}_
                            ${fromYear}_${toYear}_${target.enginePowerKW}_${target.enginePowerHP}_
                            ${target.cc}_${target.engineCodes}_${target.kbaNumbers}_${target.bodyType}_
                            ${target.TecDocID || ''}`;
            if (!rowKeys.includes(rowKey)) {
              const row = [
                item.yvNo,
                item.brand,
                item.crossNumber,
                marka_id,
                vehicle.manufacturer,
                model_id,
                model.modelSeries,
                target.engine,
                fromYear,
                toYear,
                target.enginePowerKW,
                target.enginePowerHP,
                target.cc,
                target.engineCodes,
                target.kbaNumbers,
                target.bodyType,
                target.TecDocID || ''
              ];
              //sheetRows.push(row);
              allRows.push(row);

              rowKeys.push(rowKey);
            }
          });
        });
      });

      // If the sheet has more than just the titles, append it to the workbook
      if (sheetRows.length > 1) {
        sheetDataMap.set(actualSheetName, sheetRows);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheetRows), actualSheetName);
      }
    });

    const allInfoSheet = [
      excelTitles,
      ...allRows
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(allInfoSheet), 'All Sheets');

    // Ensure the output directory exists, create it if not
    if (!fs.existsSync(OUTPUT_FILEPATH)) fs.mkdirSync(OUTPUT_FILEPATH, { recursive: true });

    // Write the workbook to a file with a modified name
    XLSX.writeFile(workbook, OUTPUT_FILEPATH);
    console.log(`Data successfully exported to Excel: ${OUTPUT_FILEPATH}`);

  } catch (error) {
    // Log an error if the process fails
    console.error('An error occurred while creating the Excel file:', error);
  }
}

function main() {
  //scraped_Compatibilities_JsonToExcel();
}

main();