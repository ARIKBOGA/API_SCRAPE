import path from 'path';
import { writeExcelSafe } from '../../../../../io/utils/ExcelUtils';
import { getAuthHeaders } from '../../helpers/API_Helpers';
import { Manufacturer, Model_Result, Target, Type } from './RepxpertTypes';
import { readJSONSafe, writeJSONSafe } from '../../../../../io/utils/Json_Utils';

async function safeFetch(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init);

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    const text = await response.text().catch(() => 'Could not read body');
    console.error(`❌ HTTP ${response.status} ${response.statusText} → ${url}`);
    console.error(`Response body: ${text.substring(0, 600)}...`);
    throw new Error(`HTTP ${response.status} - ${url}`);
  }

  if (!isJson) {
    const text = await response.text().catch(() => 'Could not read body');
    console.error(`❌ JSON bekleniyordu ama farklı içerik geldi → ${url}`);
    console.error(`Content-Type: ${contentType}`);
    console.error(`İlk 500 karakter: ${text.substring(0, 500)}`);
    throw new Error(`Non-JSON response from ${url}`);
  }

  return response.json();
}

const carTypes = 'passengerCar'; // 'commercialVehicle' veya 'passengerCar' gibi diğer tipler de olabilir


async function models() {
  
  const manufacturersData: Manufacturer[] = await readJSONSafe(path.resolve(__dirname, `../jsons/manufacturers_${carTypes}.json`)).then(data => data.manufacturers);
  const models_results: any[] = [];

  console.log(`Toplam ${manufacturersData.length} manufacturer işlenecek.`);

  for (const manufacturer of manufacturersData) { // İlk 10 manufacturer ile test, sonra tamamını açabilirsin
    try {
      const modelSeries_API_URL = `https://www.repxpert.co.uk/api/Repxpert-GB/manufacturers/${manufacturer.uuid}/modelSeries?targetTypeCodes=${carTypes}&globalCarPark=true`;

      const data = await safeFetch(modelSeries_API_URL, {
        method: 'GET',
        headers: await getAuthHeaders(),
      });

      console.log(`✅ ${manufacturer.name} → ${data.modelSeries?.length || 0} model`);

      const mapped = data.modelSeries?.map((model: any) => ({
        brandName: manufacturer.name,
        modelName: model.name,
        uuid: model.uuid,
      })) || [];

      models_results.push(...mapped);

      // Cloudflare'ı kızdırmamak için uzun bekleme
      await new Promise(r => setTimeout(r, 500)); // 1.2 saniye

    } catch (err: any) {
      console.error(`❌ Manufacturer ${manufacturer.name} başarısız: ${err.message}`);
      await new Promise(r => setTimeout(r, 500)); // hata durumunda daha uzun bekle
    }
  }
  await writeJSONSafe(path.resolve(__dirname, `../jsons/models_${carTypes}.json`), { modelSeries: models_results });
  console.log(`Toplam ${models_results.length} model kaydedildi.`);
  return models_results;
}

async function targets() {
  const modelsData: Model_Result[] = await readJSONSafe(path.resolve(__dirname, `../jsons/models_${carTypes}.json`)).then(data => data.modelSeries);
  const start = 0, end = modelsData.length;;

  console.log(`Total ${modelsData.length} models will be processed for targets.`);

  const targets_results: Target[] = [];

  // Sequential + kontrollü delay (en stabil yöntem)
  for (const model of modelsData.slice(start, end)) {
    try {
      const targets_API_URL = `https://www.repxpert.co.uk/api/Repxpert-GB/modelSeries/${model.uuid}/targets?targetTypeCodes=${carTypes}&globalCarPark=true`;

      // safeFetch direkt JSON döndürdüğü için .json() YOK!
      const data = await safeFetch(targets_API_URL, {
        method: 'GET',
        headers: await getAuthHeaders(),
      });

      console.log(
        `Processing model: ${model.brandName} - ${model.modelName} - ${data.targets?.length || 0} targets`
      );

      const mappedTargets = data.targets?.map((target: any) => ({
        brandName: model.brandName,
        modelName: model.modelName,
        targetName: target.name,
        fullName: target.fullName,
        bodyType: target.bodyType,
        constructionYearFrom: target.constructionYearFrom,
        constructionYearTo: target.constructionYearTo,
        displacementCCM: target.displacementCCM,
        enginePowerHP: target.enginePowerHP,
        enginePowerKW: target.enginePowerKW,
        engineCodes: Array.isArray(target.engineCodes)
          ? target.engineCodes.map((code: string) => code.trim()).join(', ')
          : target.engineCodes || '',
        kbaNumbers: Array.isArray(target.kbaNumbers)
          ? target.kbaNumbers.map((num: string) => num.trim()).join(', ')
          : target.kbaNumbers || '',
        engineType: target.engineType,
        cylinders: target.cylinders,
        valves: target.valves,
        driveType: target.driveType,
        externalID: target.externalID,
        referenceNumber: target.referenceNumber,
        fuelMixtureFormation: target.fuelMixtureFormation,
        fuelType: target.fuelType,
        productsQuery: target.productsQuery,
        seoPath: Array.isArray(target.seoPath)
          ? target.seoPath.map((path: string) => path.trim()).join(', ')
          : target.seoPath || '',
        typeCode: target.type?.code,
        typeName: target.type?.name,
        typeReferenceCode: target.type?.referenceCode,
        typeSuperTypeCode: target.type?.superType?.code,
        typeSuperTypeName: target.type?.superType?.name,
      })) || [];

      targets_results.push(...mappedTargets);

      // Cloudflare koruması için bekleme (1 - 1.5 saniye arası öneririm)
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.error(`❌ Target fetch failed for model ${model.modelName}: ${error.message}`);
      // Hata durumunda biraz daha uzun bekle
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`Total targets collected: ${targets_results.length}`);
  await writeJSONSafe(path.resolve(__dirname, `../jsons/targets/targets_${carTypes}_${start}-${end}.json`), { targets: targets_results });
  return targets_results;
}

async function main() {
  const startTime = Date.now();

  try {
    const targetsData = await targets();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `Total targets fetched: ${targetsData.length} in ${duration}ms`,
    );

    // Mutlak yol kullan (daha güvenli)
    const absolutePath = path.resolve(
      __dirname,
      '../../output/excels/REPXPERT_ALL_TARGETS_Results.xlsx',
    );

    await writeExcelSafe(absolutePath, {
      name: 'Repxpert_Targets',
      data: targetsData,
    });

    console.log(`Excel file has been written successfully in ${duration}ms.`);
    console.log(`Path: ${absolutePath}`);
  } catch (error: any) {
    console.error('❌ Ana süreçte hata oluştu:', error.message);
  }
}



async function finalStep() {
  const targetsData: Target[] = await readJSONSafe(path.resolve(__dirname, `../jsons/targets/targets_${carTypes}.json`)).then(data => data.targets);

  await writeExcelSafe(path.resolve(__dirname, `../excels/REPXPERT_ALL_TARGETS_${carTypes}.xlsx`), {
    name: 'Passenger Cars Targets',
    data: targetsData,
  })
}



//main().catch(console.error);
//models().catch(console.error);
//targets();
finalStep().catch(console.error);

