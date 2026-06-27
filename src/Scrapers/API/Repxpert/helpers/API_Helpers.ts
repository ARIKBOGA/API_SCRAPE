import { request, APIRequestContext } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { ApiCompatibility, ApiTarget, OutputTarget } from "../../../../utils/Types";
import { REPXPERT } from "../../../../config/API_Scrapers_Data";

dotenv.config({ path: path.resolve(".env") });


let cachedToken: string = "";
let cachedCookie: string = "";

/**
 * Returns a promise that resolves after the given ms.
 * @param {number} ms The time to wait in milliseconds.
 * @returns {Promise} A promise that resolves after the given ms.
 */
export async function delay(ms: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { token, cookie } = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "user-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    Cookie: cookie
  };
}


let cachedExpiresAt = 0;
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 dk fallback

export async function getToken(): Promise<{ token: string, cookie: string }> {
  if (cachedToken && cachedCookie && Date.now() < cachedExpiresAt)
    return { token: cachedToken, cookie: cachedCookie };

  const apiContext = await request.newContext();
  const requestURL = REPXPERT.tokenRequest.URL;
  const tokenHeaders = REPXPERT.tokenRequest.headers;
  const requestBody = new URLSearchParams(REPXPERT.tokenRequest.body).toString();

  const tokenResponse = await apiContext.post(requestURL, { headers: tokenHeaders, data: requestBody });

  if (!tokenResponse.ok()) {
    throw new Error(`Failed to get token: ${tokenResponse.status()}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = tokenData.access_token;
  cachedExpiresAt = Date.now() + (tokenData.expires_in ? tokenData.expires_in * 1000 : TOKEN_TTL_MS);

  const headersArray = tokenResponse.headersArray();
  cachedCookie = headersArray
    .filter(header => header.name.toLowerCase() === 'set-cookie') // Sadece cookie'leri bul
    .map(header => header.value.split(';')[0]) // Sadece "key=value" kısmını al (Path, Secure vb. çöpe)
    .join('; '); // Yeni request için aralarına noktalı virgül koyarak birleştir

  await apiContext.dispose();
  return { token: cachedToken, cookie: cachedCookie };
}


export async function getEncryptedSearchCode(freeTextSearch: string, filterBrand: string, apiContext: APIRequestContext): Promise<string | null> {
  try {
    const normalizedFreeTextSearch = freeTextSearch.replace(/ /g, '').trim();
    const requestURL = REPXPERT.encryptedSearchCode_API_URL(normalizedFreeTextSearch, filterBrand);

    await delay(300);

    const response = await apiContext.get(requestURL, { headers: await getAuthHeaders() });
    const data = await response.json();
    const encryptedCode = data.products?.[0]?.code;

    return encryptedCode;

  } catch (err) {
    console.error(`Error fetching encrypted code for ${freeTextSearch}: ${err}`);
    return null;
  }
}

export async function getManufacturerCodes(encryptedSearchCode: string, apiContext: APIRequestContext): Promise<ApiCompatibility[]> {

  const { passengerCarURL, commercialVehicleURL } = REPXPERT.manufacturers_API_URL(encryptedSearchCode);

  const [passengerCarResponse, commercialVehicleResponse] = await Promise.all([
    apiContext.get(passengerCarURL, { headers: await getAuthHeaders() }),
    apiContext.get(commercialVehicleURL, { headers: await getAuthHeaders() }),
  ]);

  const passengerCarData = (await passengerCarResponse.json()).manufacturers || [];
  const commercialVehicleData = (await commercialVehicleResponse.json()).manufacturers || [];

  const allManufacturers = [...passengerCarData, ...commercialVehicleData];

  return allManufacturers.map((each: ApiCompatibility) => ({
    name: each.name,
    uuid: each.uuid
  }));
}

export async function getmodelCodes(encryptedSearchCode: string, apiContext: APIRequestContext, manufacturer_uuid: string): Promise<ApiCompatibility[]> {

  const { passengerCarURL, commercialVehicleURL } = REPXPERT.modelSeries_API_URL(encryptedSearchCode, manufacturer_uuid);

  const [passengerCarResponse, commercialVehicleResponse] = await Promise.all([
    apiContext.get(passengerCarURL, { headers: await getAuthHeaders() }),
    apiContext.get(commercialVehicleURL, { headers: await getAuthHeaders() }),
  ]);
  const passengerCarData = (await passengerCarResponse.json()).modelSeries || [];
  const commercialVehicleData = (await commercialVehicleResponse.json()).modelSeries || [];

  const allModelSeries = [...passengerCarData, ...commercialVehicleData];

  return allModelSeries.map((each: ApiCompatibility) => ({
    name: each.name,
    uuid: each.uuid,
  }));
}

export async function getTargets(encryptedSearchCode: string, apiContext: APIRequestContext, model_uuid: string): Promise<OutputTarget[]> {

  const { passengerCarURL, commercialVehicleURL } = REPXPERT.targets_API_URL(encryptedSearchCode, model_uuid);

  const [passengerCarResponse, commercialVehicleResponse] = await Promise.all([
    apiContext.get(passengerCarURL, { headers: await getAuthHeaders() }),
    apiContext.get(commercialVehicleURL, { headers: await getAuthHeaders() }),
  ]);
  const passengerCarData = (await passengerCarResponse.json()).targets || [];
  const commercialVehicleData = (await commercialVehicleResponse.json()).targets || [];

  const allTargets = [...passengerCarData, ...commercialVehicleData];

  // API'den gelen `targets` dizisini doğrudan OutputTarget tipine dönüştürerek döndürüyoruz.
  // Gerekirse burada bir dönüşüm (mapping) yapabiliriz eğer API'den gelen isimler farklıysa.

  return allTargets.map((target: ApiTarget) => ({
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
