import { APIRequestContext, request } from "@playwright/test";
import { getToken } from "./token-manager";
import dotenv from "dotenv";
import path from "path";
import { ProductReference } from "./Excel_Utils";

dotenv.config({ path: path.resolve(".env") });

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BRAND_CODES: Record<string, string> = {
  ICER: "158",
  BREMBO: "65",
  TRW: "161",
  TEXTAR: "39",
};

export async function getEncryptedSearchCode( crossNumber: string, filterBrand: string, apiContext: APIRequestContext, token: string | null
): Promise<string | null> {

  try {
    // 1️⃣ Encrypted Search Code alma
    const abu_1 = process.env.API_BASE_URL_1 || "";
    const abu_2 = process.env.API_BASE_URL_2 || "";
    const abu_3 = process.env.API_BASE_URL_3 || "";
    const searchURL = `${abu_1}${encodeURIComponent(crossNumber)}${abu_2}${BRAND_CODES[filterBrand]}${abu_3}`;

    const searchResp = await apiContext.get(searchURL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const searchData = await searchResp.json();
    return searchData.products?.[0]?.code || null;
  } catch (err) {
    console.error(`Error fetching encrypted code for ${crossNumber}: ${err}`);
    return null;
  } finally {
    //await apiContext.dispose();
  }
}

export async function processProductFor_OE(element: ProductReference): Promise<any> {
  
  const { yvNo, brand: filterBrand, crossNumber } = element;
  const token = await getToken();

  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${filterBrand}`);
    return null;
  }

  const apiContext = await request.newContext();

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode( crossNumber, filterBrand, apiContext, token);

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


export async function processProductFor_VehicleCompatibility(element: ProductReference): Promise<any> {

  type ModelInfo = { manufacturer: string; models: string[] };
  const { yvNo, brand: filterBrand, crossNumber } = element;

  const result: { yvNo: string; crossNumber: string; brand: string; models: ModelInfo[] } = {
    yvNo,
    crossNumber,
    brand: filterBrand,
    models: []
  };


  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${filterBrand}`);
    return null;
  }

  const token = await getToken();
  const apiContext = await request.newContext();

  try {
    // 1️⃣ Encrypted Search Code alma
    const encryptedSearchCode = await getEncryptedSearchCode( crossNumber, filterBrand, apiContext, token);

    // 2️⃣ Vehicle Compatibility alma
    const vcbru_1 = process.env.COMPATIBILITY_BRANDS_URL_1 as string;
    const vcbru_2 = process.env.COMPATIBILITY_BRANDS_URL_2 as string;
    const vcURL = `${vcbru_1}${encryptedSearchCode}${vcbru_2}`;

    const vcResp = await apiContext.get(vcURL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const vcData = await vcResp.json();
    const manufacturerCodes = vcData.manufacturers.map((each: any) => each.uuid)

    console.log(`Manufacturer Codes: ${manufacturerCodes.join(", ")}`);

    

    return result;
  } catch (err) {
    console.error(`Error for YV ${yvNo}: ${err}`);
    return null;
  } finally {
    await apiContext.dispose();
    await delay(300);
  }
}