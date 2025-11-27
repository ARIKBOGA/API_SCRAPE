
import { FILTER_BRAND, PRODUCT_TYPE } from '../../config/env';
import { PathRepo } from '../../config/PathRepo';
import { writeExcelSafe } from '../../io/utils/ExcelUtils';
import { OutputManufacturer, OutputModelSeries, OutputTarget, ProductCompatibilityResult, ScrapedVehicleCompatibility_ExcelRow } from '../../utils/Types';
import { brandAliases } from '../api/resources/Variables';
import { markaNameToIdMap, modelDataMap } from './Utils';


/**
 * Converts a Vehicle-Compatibility JSON file to an Excel workbook and saves it.
 * @param inputFilePath The path to the JSON file to be read
 * @param outputDirectory The directory where the Excel file will be saved
 */
export async function scraped_Compatibilities_JsonToExcel(results: ProductCompatibilityResult[]): Promise<void> {


  const OUTPUT_FILEPATH = PathRepo.output(`${PRODUCT_TYPE}/excels/Vehicle-Compatibility/Vehicle-Compatibility_${FILTER_BRAND}.xlsx`);

  // An array to avoid duplicte rows even if they belongs to different cross numbers with same YV
  const rowKeys: string[] = [];
  const allRows: ScrapedVehicleCompatibility_ExcelRow[] = [];

  try {

    // Iterate through each item in the JSON data
    results.forEach(item => {

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
              const row: ScrapedVehicleCompatibility_ExcelRow = {
                "YV": item.yvNo,
                "SUPPLIER": item.brand,
                "CROSS NUMBER": item.crossNumber,
                "MARKA ID": marka_id,
                "MARKA": vehicle.manufacturer,
                "MODEL ID": model_id,
                "MODEL": model.modelSeries,
                "MOTOR": target.engine,// OutputTarget'taki 'name' alanı buna karşılık geliyor
                "Baş. Yil": fromYear,
                "Bit. Yil": toYear,
                "KW": target.enginePowerKW,
                "HP": target.enginePowerHP,
                "CC": target.cc,
                "MOTOR KODU": target.engineCodes,
                "KBA": target.kbaNumbers,
                "KASA Tipi": target.bodyType,
                "TecDocID": target.TecDocID || ''
              }

              allRows.push(row);
              rowKeys.push(rowKey);
            }
          });
        });
      });
    });


    await writeExcelSafe(OUTPUT_FILEPATH, { name: `${FILTER_BRAND}`, data: allRows });

    console.log(`Data successfully exported to Excel: ${OUTPUT_FILEPATH}`);

  } catch (error) {
    // Log an error if the process fails
    console.error('An error occurred while creating the Excel file:', error);
  }
}
