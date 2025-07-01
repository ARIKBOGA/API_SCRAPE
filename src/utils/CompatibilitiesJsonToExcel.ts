import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { ModelData, OutputManufacturer, OutputModelSeries, OutputTarget, RootJsonData } from './Types';
import dotenv from 'dotenv';
import { excelTitles } from './Variables';
import initialMarkaData from '../resources/data/catalogInfo/jsons/marka_new.json';
import initialModelData from '../resources/data/catalogInfo/jsons/model_new.json';

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

export function convertJsonToExcel(inputFilePath: string, outputDirectory: string): void {
  const workbook = XLSX.utils.book_new();
  const sheetNameCounts = new Map<string, number>();
  
  // Import Marka and Model data
  const markaNameToIdMap = new Map<string, number>();
  for (const [idString, name] of Object.entries(initialMarkaData)) {
    markaNameToIdMap.set(name.trim().toUpperCase(), parseInt(idString));
  }

  const modelDataMap = new Map<string, ModelData>();
  (initialModelData as ModelData[]).forEach(model => {
    const key = `${model["modeller_markalar::marka"].trim().toUpperCase()}_${model.model.trim().toUpperCase()}`;
    modelDataMap.set(key, model);
  });

  const processedYVNUmbers: string[] = [];

  try {
    const data: RootJsonData = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));

    const sheetDataMap = new Map<string, any[][]>();

    data.forEach(item => {

      if(processedYVNUmbers.includes(item.yvNo)) return;
      processedYVNUmbers.push(item.yvNo);

      let baseSheetName = item.crossNumber;
      let actualSheetName = baseSheetName;

      if (!sheetDataMap.has(baseSheetName)) {
        sheetDataMap.set(baseSheetName, [excelTitles]);
      }

      if ((sheetNameCounts.get(baseSheetName) || 0) > 0) {
        let currentCount = sheetNameCounts.get(baseSheetName) || 0;
        actualSheetName = `${baseSheetName}-${String.fromCharCode(65 + currentCount)}`;
        sheetNameCounts.set(baseSheetName, currentCount + 1);
      } else {
        sheetNameCounts.set(baseSheetName, 1);
      }

      const sheetRows = sheetDataMap.get(baseSheetName) ?? [];

      item.compatibleVehicles.forEach((vehicle: OutputManufacturer) => {
        const marka_id = markaNameToIdMap.get(vehicle.manufacturer.trim().toUpperCase()) || null;

        vehicle.models.forEach((model: OutputModelSeries) => {
          const modelKey = `${vehicle.manufacturer.trim().toUpperCase()}_${model.modelSeries.trim().toUpperCase()}`;
          const foundModelData = modelDataMap.get(modelKey);
          const model_id = foundModelData ? foundModelData.id : null;

          model.targets.forEach((target: OutputTarget) => {
            const fromYear = target.constructionYearFrom?.slice(-2) || '';
            const toYear = target.constructionYearTo?.slice(-2) || '';

            sheetRows.push([
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
            ]);
          });
        });
      });

      if(sheetRows.length > 1) {
        sheetDataMap.set(actualSheetName, sheetRows);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheetRows), actualSheetName);
      }
    });

    if (!fs.existsSync(outputDirectory)) fs.mkdirSync(outputDirectory, { recursive: true });

    XLSX.writeFile(workbook, path.join(outputDirectory, `${path.basename(inputFilePath.slice(0, -4).concat('first-cross'))}.xlsx`));
    console.log(`Veriler başarıyla Excel'e aktarıldı: ${outputDirectory}`);

  } catch (error) {
    console.error('Excel dosyası oluşturulurken bir hata oluştu:', error);
  }
}

function main() {
  const inputFilePath = path.resolve(__dirname, `../output/${productType}/jsons/Vehicle-Compatibility/Vehicle-Compatibility_${filterBrand}.json`);
  const outputDirectory = path.resolve(__dirname, `../output/${productType}/excels/Vehicle-Compatibility`);

  convertJsonToExcel(inputFilePath, outputDirectory);
}

main();