import { APIRequest, APIRequestContext, request } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { CrossNumberApiProduct, OutputManufacturer, OutputModelSeries, ProductCompatibilityResult, ProductReference } from "../../../../utils/Types";
import { delay, getAuthHeaders, getEncryptedSearchCode, getManufacturerCodes, getmodelCodes, getTargets } from "./API_Helpers";
import { writeToFileIfNotExistsProducts } from "../../../../utils/outOfScopeHelpers/TextUtils";
import { productGroupNumbersOfRepxpert } from "../../../../utils/Variables";

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;


export async function processProductFor_OE(element: ProductReference, apiContext: APIRequestContext): Promise<any> {

  const { yvNo, supplier, crossNumber } = element;

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${supplier}`);
    return null;
  }

  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}`);

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

export async function processProductFor_VehicleCompatibility(element: ProductReference, apiContext: APIRequestContext): Promise<ProductCompatibilityResult | null> {

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

export async function processProductFor_CrossNumbers(element: ProductReference, apiContext: APIRequestContext) {
  const { yvNo, supplier, crossNumber } = element;
  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}`);

  if (!crossNumber?.trim()) return null;

  const baseURI = process.env.BASE_URI as string;
  const groupNumber = productGroupNumbersOfRepxpert[productType];
  const pageSize = 100;

  let currentPage = 0;
  let totalPages = 1;
  const products: any[] = [];
  const MAX_PAGES = 5;

  do {
    const params = {
      currentPage: `${currentPage}`,
      query: `${crossNumber}::assemblyGroups:${groupNumber}`,
      pageSize: `${pageSize}`,
    };
    const URL = `${baseURI}?${new URLSearchParams(params).toString()}`;

    try {
      const data = await fetchWithRetry(apiContext, URL);
      if (!data?.products) break;
      products.push(...data.products);
      totalPages = data.pagination?.totalPages ?? 1;
    } catch (error) {
      console.error(`Sorgu başarısız: ${crossNumber}`, error);
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

  return { yvNo, OE: crossNumber, crossNumbers };
}


export async function processProductForArticleAttributes(element: ProductReference, apiContext: APIRequestContext) {

  const { yvNo, supplier, crossNumber } = element;

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${supplier}`);
    return null;
  }

  console.log(`Processing YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}`);

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode(crossNumber, supplier, apiContext);

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
