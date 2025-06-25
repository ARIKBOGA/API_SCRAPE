import { request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { CrossNumberApiProduct, CrossNumbersYV_Pair, OutputManufacturer, OutputModelSeries, ProductCompatibilityResult, ProductReference } from "./Types";
import { delay, getManufacturerCodes, getmodelCodes, getTargets, getToken, getEncryptedSearchCode } from "./API_Worker_Functions";
import { writeToFileIfNotExistsProducts } from "./TextUtils";

dotenv.config({ path: path.resolve(".env") });



export async function processProductFor_OE(element: ProductReference): Promise<any> {
  const { yvNo, brand: filterBrand, crossNumber } = element;
  const token = await getToken();

  if (!crossNumber) {
    console.warn(
      `No cross number found for YV: ${yvNo}, Brand: ${filterBrand}`
    );
    return null;
  }

  const apiContext = await request.newContext();

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode(
      crossNumber,
      filterBrand,
      apiContext,
    );

    // 2️⃣ OE Numbers alma
    const oeru_1 = process.env.OE_REQUEST_URL_1 as string;
    const oeru_2 = process.env.OE_REQUEST_URL_2 as string;
    const oeURL = `${oeru_1}${encryptedSearchCode}${oeru_2}`;

    const oeResp = await apiContext.get(oeURL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const oeData = await oeResp.json();

    const result: any = {
      yvNo,
      crossNumber,
      supplier: filterBrand,
      oeNumbers: [],
    };

    oeData.oenumbers.forEach((oe: any) => {
      const numbers = oe.numbers.map((n: any) => n.number);
      result.oeNumbers.push({
        manufacturer: oe.manufacturer.name,
        numbers,
      });
    });

    return result;
  } catch (err) {
    console.error(`Error for YV ${yvNo} : ${crossNumber}: ${err}`);
    return null;
  } finally {
    await apiContext.dispose();
    await delay(300);
  }
}

export async function processProductFor_VehicleCompatibility(element: ProductReference): Promise<ProductCompatibilityResult | null> {

  const apiContext = await request.newContext();
  const { yvNo, brand: filterBrand, crossNumber } = element;
  const token = await getToken();

  if (!token) {
    console.error(`Failed to get token for YV: ${yvNo}, Brand: ${filterBrand}`);
    return null;
  }

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${filterBrand}`);
    return null;
  }

  // Çıktı için ana nesne yapısı
  const result: ProductCompatibilityResult = {yvNo,crossNumber,brand: filterBrand,compatibleVehicles: []};

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode( crossNumber, filterBrand, apiContext);

    if (!encryptedSearchCode) {
      console.warn(`No encrypted search code found for ${crossNumber} - YV: ${yvNo}, Brand: ${filterBrand} - Product couldn't be found !!!`);
      await writeToFileIfNotExistsProducts(`YV: ${yvNo}, Brand: ${filterBrand} -  ${crossNumber}`);
      return null;
    }

    // 2️⃣ Üretici kodlarını alma
    const manufacturers = await getManufacturerCodes(encryptedSearchCode, apiContext);
    console.log(`Found ${manufacturers.length} manufacturers for ${crossNumber}`);

    // Her bir üretici için döngü
    for (const manufacturer of manufacturers) {
      const manufacturerData: OutputManufacturer = {
        manufacturer: manufacturer.name,
        models: [],
      };
      // console.log(`Processing manufacturer: ${manufacturer.name}`);

      // 3️⃣ Her üretici için araç modellerini alma
      const models = await getmodelCodes( encryptedSearchCode, apiContext, manufacturer.uuid);
      // console.log(`Found ${models.length} models for ${manufacturer.name}`);

      // Her bir model için döngü
      for (const model of models) {
        const modelSeriesData: OutputModelSeries = {
          modelSeries: model.name,
          targets: [],
        };
        // console.log(`  Processing model series: ${model.name}`);

        // 4️⃣ Her model için hedef (target) verilerini alma
        const targets = await getTargets( encryptedSearchCode, apiContext, model.uuid);
        // console.log(`    Found ${targets.length} targets for ${model.name}`);

        // Hedef verilerini doğrudan OutputTarget dizisine ekle
        modelSeriesData.targets.push(...targets);

        // Model serisi verilerini üreticinin models dizisine ekle
        if (modelSeriesData.targets.length > 0) { // Sadece targets varsa modeli ekle
            manufacturerData.models.push(modelSeriesData);
        }
      }
      // Üretici verilerini ana sonuç nesnesinin compatibleVehicles dizisine ekle
      if (manufacturerData.models.length > 0) { // Sadece modeller varsa üreticiyi ekle
          result.compatibleVehicles.push(manufacturerData);
      }
    }

    if (result.compatibleVehicles.length === 0) {
      console.warn(`No compatible vehicles found for YV: ${yvNo}, Brand: ${filterBrand}, Cross Number: ${crossNumber}`);
    }
    return result;
  } catch (err) {
    console.error(`Error for YV ${yvNo} (${crossNumber}): ${err}`);
    return null;
  } finally {
    await apiContext.dispose();
    // Her işlem sonunda API'ye aşırı yüklenmemek için küçük bir gecikme
    await delay(500);
  }
}

export async function processProductFor_CrossNumbers(element: ProductReference){
  const apiContext = await request.newContext();
  const { yvNo, brand: filterBrand, crossNumber } = element;
  console.log(`Processing YV: ${yvNo}, Brand: ${filterBrand}, Cross Number: ${crossNumber}`);
  const token = await getToken();
  //console.log(token);

  if (!token) {
    console.error(`Failed to get token for YV: ${yvNo}, Brand: ${filterBrand}`);
    return null;
  }

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${filterBrand}`);
    return null;
  }

  const crossNumberURL_1 = process.env.CROSS_NUMBER_URL_1 || "";
  const crossNumberURL_2 = process.env.CROSS_NUMBER_URL_2 || "";
  const queryNumber = element.crossNumber;
  const querySize = "100";

  const crossNumberURL = `${crossNumberURL_1}${queryNumber}${crossNumberURL_2}${querySize}`;
  //console.log(crossNumberURL);

  const response = await apiContext.get(crossNumberURL, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  const products: any[]  = data.products;

  const result: CrossNumbersYV_Pair[] = [];
  const targets: CrossNumberApiProduct[] = [];

  for (const product of products) {
    targets.push({
      Supplier: product.brand.name,
      ArticleNumber: product.catalogArticleNumber, 
      StatusCode: product.catalogStatus.code,
      StatusMessage: product.catalogStatus.name,
      ApiCode: product.code
    })
  }

  return {
    yvNo: element.yvNo,
    crossNumbers: targets
  }

}
