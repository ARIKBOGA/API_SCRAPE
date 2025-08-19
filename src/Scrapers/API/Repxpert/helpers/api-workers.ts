import { request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { CrossNumberApiProduct, OutputManufacturer, OutputModelSeries, ProductCompatibilityResult, ProductReference } from "../../../../utils/Types";
import { delay, getManufacturerCodes, getmodelCodes, getTargets, getEncryptedSearchCode, getAuthHeaders } from "../../../../utils/API_Worker_Functions";
import { writeToFileIfNotExistsProducts } from "../../../../utils/TextUtils";
import { productGroupNumbersOfRepxpert } from "../../../../utils/Variables";

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;


export async function processProductFor_OE(element: ProductReference): Promise<any> {

  const { yvNo, supplier, crossNumber } = element;

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${supplier}`);
    return null;
  }

  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}`);
  const apiContext = await request.newContext();

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode(
      crossNumber,
      supplier,
      apiContext,
    );

    // 2️⃣ OE Numbers alma
    const oeru_1 = process.env.OE_REQUEST_URL_1 as string;
    const oeru_2 = process.env.OE_REQUEST_URL_2 as string;
    const oeURL = `${oeru_1}${encryptedSearchCode}${oeru_2}`;
    //console.log(oeURL);

    const oeResp = await apiContext.get(oeURL, { headers: await getAuthHeaders() });
    const oeData = await oeResp.json();

    const result: any = {
      yvNo,
      crossNumber,
      supplier: supplier,
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
  const { yvNo, supplier, crossNumber } = element;

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${supplier}`);
    return null;
  }

  // Çıktı için ana nesne yapısı
  const result: ProductCompatibilityResult = { yvNo, crossNumber, brand: supplier, compatibleVehicles: [] };

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode(crossNumber, supplier, apiContext);

    if (!encryptedSearchCode) {
      console.warn(`No encrypted search code found for ${crossNumber} - YV: ${yvNo}, Brand: ${supplier} - Product couldn't be found !!!`);
      await writeToFileIfNotExistsProducts(`YV: ${yvNo}, Brand: ${supplier} -  ${crossNumber}`);
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
      const models = await getmodelCodes(encryptedSearchCode, apiContext, manufacturer.uuid);
      // console.log(`Found ${models.length} models for ${manufacturer.name}`);

      // Her bir model için döngü
      for (const model of models) {
        const modelSeriesData: OutputModelSeries = {
          modelSeries: model.name,
          targets: [],
        };
        // console.log(`  Processing model series: ${model.name}`);

        // 4️⃣ Her model için hedef (target) verilerini alma
        const targets = await getTargets(encryptedSearchCode, apiContext, model.uuid);
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
      console.warn(`No compatible vehicles found for YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}`);
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

export async function processProductFor_CrossNumbers(element: ProductReference) {
  const apiContext = await request.newContext();
  const { yvNo, supplier, crossNumber } = element;

  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}`);

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${supplier}`);
    return null;
  }

  const part_1 = process.env.CROSS_NUMBER_URL_1 || "";
  const part_2 = process.env.CROSS_NUMBER_URL_2 || "";
  const part_3 = process.env.CROSS_NUMBER_URL_3 || "";
  const queryCode = element.crossNumber;                       // The number or code will be searched
  const querySize = "200";                                       // Default size is 20 but we are extending it to 200 to get all cross numbers from all suppliers
  const groupNumber = productGroupNumbersOfRepxpert[productType]; // Each product type has a unique grroup number for API requests

  const crossNumberURL = `${part_1}${queryCode}${part_2}${groupNumber}${part_3}${querySize}`;
  //console.log(`Cross Number URL: ${crossNumberURL}`);

  const response = await apiContext.get(crossNumberURL, { headers: await getAuthHeaders() });
  const data = await response.json();
  const products: any[] = data.products;

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
    OE: element.crossNumber,
    crossNumbers: targets
  }
}

export async function processProductForArticleAttributes(element: ProductReference) {

  const { yvNo, supplier, crossNumber } = element;

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${supplier}`);
    return null;
  }

  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}`);

  const apiContext = await request.newContext();

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode( crossNumber, supplier, apiContext);

    // 2️⃣ Article Attributes alma
    const part_1 = process.env.ARTICLE_ATTRIBUTES_URL_1 as string;
    const part_2 = process.env.ARTICLE_ATTRIBUTES_URL_2 as string;
    const URL = `${part_1}${encryptedSearchCode}${part_2}`;

    //console.log(headers);
    const response = await apiContext.get(URL, { headers: await getAuthHeaders() });

    const result: any = {
      yvNo,
      crossNumber,
      supplier: supplier,
      attributes: [],
    };

    const data = await response.json();

    for (const element of data.classifications[0].features) {
      
      const values = Object.values(element.featureValues.map((value: any) => value.value)).join(', ');
      
      result.attributes.push({
        name: element.name,
        value: values
      });
    }

    return result;

  } catch (err) {
    console.error(`Error for YV ${yvNo} : ${crossNumber}: ${err}`);
    return null;
  } finally {
    await apiContext.dispose();
    await delay(300);
  }
}