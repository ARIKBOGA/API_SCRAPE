import { APIRequest, APIRequestContext, request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { CrossNumberApiProduct, OutputManufacturer, OutputModelSeries, ProductCompatibilityResult, ProductReference } from "../../../../utils/Types";
import { delay, getAuthHeaders, getEncryptedSearchCode, getManufacturerCodes, getmodelCodes, getTargets } from "./API_Helpers";
import { writeToFileIfNotExistsProducts } from "../../../../utils/outOfScopeHelpers/TextUtils";
import { REPXPERT } from "../config/ApiData";

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;


export async function processProductFor_OE(
  element: ProductReference,
  apiContext: APIRequestContext
): Promise<any> {
  const { yvNo, supplier, freeTextSearch } = element;
  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${freeTextSearch}`);

  try {
    const encryptedSearchCode = await getEncryptedSearchCode(freeTextSearch, supplier, apiContext);
    if (!encryptedSearchCode) {
      console.warn(`No encrypted search code found for ${freeTextSearch} - YV: ${yvNo}, Brand: ${supplier}`);
      await writeToFileIfNotExistsProducts(`YV: ${yvNo}, Brand: ${supplier} - ${freeTextSearch}`);
      return null;
    }

    const oeURL = REPXPERT.getOE_URL(encryptedSearchCode);
    const oeResp = await apiContext.get(oeURL, { headers: await getAuthHeaders() });
    const oeData = await oeResp.json();

    const result = {
      yvNo,
      crossNumber: freeTextSearch,
      supplier,
      oeNumbers: oeData.oenumbers.map((oe: any) => ({
        manufacturer: oe.manufacturer.name,
        numbers: oe.numbers.map((n: any) => n.number),
      })),
    };

    await delay(300);
    return result;
  } catch (err) {
    console.error(`Error for YV ${yvNo} : ${freeTextSearch}: ${err}`);
    return null;
  }
}

export async function processProductFor_VehicleCompatibility(element: ProductReference, apiContext: APIRequestContext): Promise<ProductCompatibilityResult | null> {

  const { yvNo, supplier, freeTextSearch } = element;

  // Çıktı için ana nesne yapısı
  const result: ProductCompatibilityResult = { yvNo, crossNumber: freeTextSearch, brand: supplier, compatibleVehicles: [] };

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode(freeTextSearch, supplier, apiContext);

    if (!encryptedSearchCode) {
      console.warn(`No encrypted search code found for ${freeTextSearch} - YV: ${yvNo}, Brand: ${supplier} - Product couldn't be found !!!`);
      await writeToFileIfNotExistsProducts(`YV: ${yvNo}, Brand: ${supplier} -  ${freeTextSearch}`);
      return null;
    }

    // 2️⃣ Üretici kodlarını alma
    const manufacturers = await getManufacturerCodes(encryptedSearchCode, apiContext);
    console.log(`Found ${manufacturers.length} manufacturers for ${freeTextSearch}`);

    // Her bir üretici için döngü
    for (const manufacturer of manufacturers) {
      const manufacturerData: OutputManufacturer = {
        manufacturer: manufacturer.name,
        models: [],
      };

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
      console.warn(`No compatible vehicles found for YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${freeTextSearch}`);
    }
    return result;
  } catch (err) {
    console.error(`Error for YV ${yvNo} (${freeTextSearch}): ${err}`);
    return null;
  } finally {
    //await apiContext.dispose();
    await delay(300);
  }
}

export async function processProductFor_CrossNumbers(element: ProductReference, apiContext: APIRequestContext) {
  const { yvNo, supplier, freeTextSearch } = element;
  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${freeTextSearch}`);

  if (!freeTextSearch?.trim()) return null;

  let currentPage = 0, totalPages = 1;
  const products: any[] = [];
  const MAX_PAGES = 5;
  const URL = REPXPERT.getCrossNumbersURL(freeTextSearch);
  let returnedFreeTextSearch;

  do {
    try {
      const data = await fetchWithRetry(apiContext, URL);
      if (!data?.products) break;
      products.push(...data.products);
      totalPages = data.pagination?.totalPages ?? 1;
      returnedFreeTextSearch = data.freeTextSearch;
      if (returnedFreeTextSearch?.toLowerCase() !== freeTextSearch.toLowerCase()) {
        console.warn(`Warning: Search term mismatch. Expected: ${freeTextSearch}, Got: ${returnedFreeTextSearch}`);
      }
    } catch (error) {
      console.error(`Sorgu başarısız: ${freeTextSearch}`, error);
      break;
    }
    currentPage++;
    await delay(500);

  } while (currentPage < totalPages && currentPage < MAX_PAGES);

  const crossNumbers = products.map(p => ({
    Supplier: p.brand?.name ?? "Unknown",
    ArticleNumber: p.catalogArticleNumber ?? "",
    StatusCode: p.catalogStatus?.code ?? "",
    StatusMessage: p.catalogStatus?.name ?? "",
    ApiCode: p.code ?? ""
  } as CrossNumberApiProduct));

  return { yvNo, OE: returnedFreeTextSearch, crossNumbers };
}


export async function processProductForArticleAttributes(element: ProductReference, apiContext: APIRequestContext) {

  const { yvNo, supplier, freeTextSearch: crossNumber } = element;

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${supplier}`);
    return null;
  }

  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}`);

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode(crossNumber, supplier, apiContext);
    if (!encryptedSearchCode) {
      console.warn(`No encrypted search code found for ${crossNumber} - YV: ${yvNo}, Brand: ${supplier} - Product couldn't be found !!!`);
      return null;
    }
    // 2️⃣ Article Attributes alma
    const URL = REPXPERT.getArticleAttributesURL(encryptedSearchCode);
    const response = await apiContext.get(URL, { headers: await getAuthHeaders() });

    const data = await response.json();
    const result: any = {
      yvNo,
      crossNumber: data.catalogArticleNumber,
      supplier: data.brand.name,
      attributes: [],
    };

    const features = data.classifications[0].features;
    for (const feature of features) {

      const values = Object.values(feature.featureValues.map((value: any) => value.value)).join(', ');

      result.attributes.push({
        name: feature.name,
        value: values
      });
    }

    return result;

  } catch (err) {
    console.error(`Error for YV ${yvNo} : ${crossNumber}: ${err}`);
    return null;
  } finally {
    //await apiContext.dispose();
    await delay(300);
  }
}


// RE-TRY mechanism
async function fetchWithRetry(apiContext: APIRequestContext, url: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await apiContext.get(url, { headers: await getAuthHeaders() });
      if (response.ok()) return response.json();
      console.warn(`Attempt ${attempt}: ${response.status()} for ${url}`);
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error);
    }
    await new Promise(r => setTimeout(r, 1000 * attempt)); // exponential backoff
  }
  throw new Error(`Failed after ${retries} attempts: ${url}`);
}


