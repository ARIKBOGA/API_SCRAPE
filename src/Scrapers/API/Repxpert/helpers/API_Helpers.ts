import { request, APIRequestContext } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { productGroupNumbersOfRepxpert, SUPPLIER_NUMBERS } from "../../resources/Variables";
import { ApiCompatibility, ApiTarget, OutputTarget } from "../../../../utils/Types";
import { Mutex } from 'async-mutex';
import { REPXPERT } from "../config/ApiData";

dotenv.config({ path: path.resolve(".env") });


let cachedToken: string | null = null;

let headers: { getHeaders: any; };
const mutex = new Mutex();

/**
 * Returns a promise that resolves after the given ms.
 * @param {number} ms The time to wait in milliseconds.
 * @returns {Promise} A promise that resolves after the given ms.
 */
export async function delay(ms: number): Promise<any> {
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
  const requestURL = REPXPERT.tokenRequest.URL;
  const tokenHeaders = REPXPERT.tokenRequest.headers;
  const requestBody = new URLSearchParams(REPXPERT.tokenRequest.body).toString();

  const tokenResponse = await apiContext.post(requestURL, {
    headers: tokenHeaders,
    data: requestBody,
  });

  if (!tokenResponse.ok()) {
    throw new Error(`Failed to get token: ${tokenResponse.status()}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = tokenData.access_token;

  await apiContext.dispose();
  return cachedToken;
}

export async function getEncryptedSearchCode(freeTextSearch: string, filterBrand: string, apiContext: APIRequestContext): Promise<string | null> {
  try {
    const normalizedFreeTextSearch = freeTextSearch.replace(/ /g, '').trim();
    const requestURL = REPXPERT.getEncrSrcURL(normalizedFreeTextSearch, filterBrand);

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

  const { passengerCarURL, commercialVehicleURL } = REPXPERT.getManufacturersURL(encryptedSearchCode);

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

  const { passengerCarURL, commercialVehicleURL } = REPXPERT.getModelSeriesURL(encryptedSearchCode, manufacturer_uuid);

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

  const { passengerCarURL, commercialVehicleURL } = REPXPERT.getTargetsURL(encryptedSearchCode, model_uuid);

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
