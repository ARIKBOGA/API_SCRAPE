import { request, APIRequestContext } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { SUPPLIER_NUMBERS } from "./Variables";
import { ApiCompatibility, ApiTarget, OutputTarget } from "./Types";
import { Mutex } from 'async-mutex';

dotenv.config({ path: path.resolve(".env") });

let cachedToken: string | null = null;

let headers: { getHeaders: any; };
const mutex = new Mutex();

const tokenHeaders = {
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "application/json",
};

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAuthHeaders(): Promise<{ Authorization: string }> {
  if (!headers) {
    await mutex.runExclusive(async () => {
      if (!headers) {
        headers = {
          async getHeaders() {
            return {
              Authorization: `Bearer ${await getToken()}`,
            };
          },
        };
      }
    });
  }
  return headers.getHeaders();
}

export async function getToken(): Promise<string | null> {

  if (cachedToken) return cachedToken;

  const apiContext = await request.newContext();
  const requestURL = process.env.TOKEN_URI as string;

  const requestBody = new URLSearchParams({
    grant_type: process.env.grant_type || "password",
    client_id: process.env.client_id || "repxpert-spa",
    client_secret: process.env.client_secret || "client_secret",
    username: process.env.email || "username",
    password: process.env.password || "password",
  });

  const tokenResponse = await apiContext.post(requestURL, {
    headers: tokenHeaders,
    data: requestBody.toString(),
  });

  if (!tokenResponse.ok()) {
    throw new Error(`Failed to get token: ${tokenResponse.status()}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = tokenData.access_token;

  await apiContext.dispose();
  return cachedToken;
}

export async function getEncryptedSearchCode( crossNumber: string, filterBrand: string, apiContext: APIRequestContext): Promise<string | null> {

  try {
    const part_1 = process.env.ENCRYPTED_SEARCH_URL_1 || "";
    const part_2 = process.env.ENCRYPTED_SEARCH_URL_2 || "";
    const part_3 = process.env.ENCRYPTED_SEARCH_URL_3 || "";
    const normalizedCrossNumber = crossNumber.replace(/ /g, '').trim();
    const requestURL = `${part_1}${encodeURIComponent(normalizedCrossNumber)}${part_2}${SUPPLIER_NUMBERS[filterBrand]}${part_3}`;

    await delay(300);
    
    const response = await apiContext.get(requestURL, { headers: await getAuthHeaders() });

    const data = await response.json();
    const result = data.products?.[0]?.code;
    return result;
  } catch (err) {
    console.error(`Error fetching encrypted code for ${crossNumber}: ${err}`);
    return null;
  }
}

export async function getManufacturerCodes(encryptedSearchCode: string,apiContext: APIRequestContext): Promise<ApiCompatibility[]> {

  const part_1 = process.env.COMPATIBILITY_MANUFACTURERS_URL_1 as string;
  const part_2 = process.env.COMPATIBILITY_MANUFACTURERS_URL_2 as string;
  const requestURL = `${part_1}${encryptedSearchCode}${part_2}`;
  //console.log(`MANUFACTURERS URL: ${requestURL}`); // Detaylı loglar için uncomment edilebilir

  const manufacturer_codes_response = await apiContext.get(requestURL, { headers: await getAuthHeaders() });

  const manufacturer_codes_json = await manufacturer_codes_response.json();
  
  // `map` kullanarak daha temiz bir dönüşüm
  return manufacturer_codes_json.manufacturers.map((each: ApiCompatibility) => ({ 
    name: each.name, 
    uuid: each.uuid 
  }));
}

export async function getmodelCodes(encryptedSearchCode: string, apiContext: APIRequestContext, manufacturer_uuid: string ): Promise<ApiCompatibility[]> { // parametre adını değiştirdim, `_code` yerine `_uuid` daha doğru

  const part_1 = process.env.COMPATIBILITY_MODEL_URL_1 as string;
  const part_2 = process.env.COMPATIBILITY_MODEL_URL_2 as string;
  const part_3 = process.env.COMPATIBILITY_MODEL_URL_3 as string;
  const requestURL = `${part_1}${encryptedSearchCode}${part_2}${manufacturer_uuid}${part_3}`;

  const response = await apiContext.get(requestURL, { headers: await getAuthHeaders() });
  const data = await response.json();

  // `map` kullanarak daha temiz bir dönüşüm
  return data.modelSeries.map((each: ApiCompatibility) => ({
    name: each.name,
    uuid: each.uuid,
  }));
}

export async function getTargets( encryptedSearchCode: string, apiContext: APIRequestContext, model_uuid: string ): Promise<OutputTarget[]> {
  
  const part_1 = process.env.COMPATIBILITY_TARGET_URL_1 as string;
  const part_2 = process.env.COMPATIBILITY_TARGET_URL_2 as string;
  const part_3 = process.env.COMPATIBILITY_TARGET_URL_3 as string;
  const requestURL = `${part_1}${encryptedSearchCode}${part_2}${model_uuid}${part_3}`;

  const response = await apiContext.get(requestURL, { headers: await getAuthHeaders() });
  const data = await response.json();

  // API'den gelen `targets` dizisini doğrudan OutputTarget tipine dönüştürerek döndürüyoruz.
  // Gerekirse burada bir dönüşüm (mapping) yapabiliriz eğer API'den gelen isimler farklıysa.

  return data.targets.map((target: ApiTarget) => ({
    engine: target.name,
    fullName: target.fullName,
    constructionYearFrom: target.constructionYearFrom,
    constructionYearTo: target.constructionYearTo,
    enginePowerKW: target.enginePowerKW,
    enginePowerHP: target.enginePowerHP,
    cc: target.displacementCCM,
    engineCodes: target.engineCodes.join(", "),
    kbaNumbers: target.kbaNumbers.join(", "),
    bodyType: target.bodyType,
    TecDocID: target.referenceNumber,
  }));

}
