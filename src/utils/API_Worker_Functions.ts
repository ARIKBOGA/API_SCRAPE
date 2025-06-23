import { request, APIRequestContext } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { SUPPLIER_NUMBERS } from "./Variables";
import { ApiCompatibility, ApiTarget, OutputTarget } from "./Types";

dotenv.config({ path: path.resolve(".env") });

let cachedToken: string | null = null;

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const tokenHeaders = {
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "application/json",
};

async function getAuthHeaders() {
  return {
    Authorization: `Bearer ${await getToken()}`,
  };
}

export async function getToken(): Promise<string | null> {

  if (cachedToken) return cachedToken;

  const apiContext = await request.newContext();
  const getTokenURI = process.env.TOKEN_URI as string;

  const formBody = new URLSearchParams({
    grant_type: process.env.grant_type || "password",
    client_id: process.env.client_id || "repxpert-GB",
    client_secret: process.env.client_secret || "client_secret",
    username: process.env.email || "username",
    password: process.env.password || "password",
  });

  const tokenResponse = await apiContext.post(getTokenURI, {
    headers: tokenHeaders,
    data: formBody.toString(),
  });

  if (!tokenResponse.ok()) {
    throw new Error(`Failed to get token: ${tokenResponse.status()}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = tokenData.access_token;

  await apiContext.dispose();
  return cachedToken;
}


export async function getEncryptedSearchCode(
  crossNumber: string,
  filterBrand: string,
  apiContext: APIRequestContext
): Promise<string | null> {

  try {
    const abu_1 = process.env.ENCRYPTED_SEARCH_URL_1 || "";
    const abu_2 = process.env.ENCRYPTED_SEARCH_URL_2 || "";
    const abu_3 = process.env.ENCRYPTED_SEARCH_URL_3 || "";
    const normalizedCrossNumber = crossNumber.replace(/ /g, '').trim();
    const searchURL = `${abu_1}${encodeURIComponent(normalizedCrossNumber)}${abu_2}${SUPPLIER_NUMBERS[filterBrand]}${abu_3}`;

    await delay(300);
    
    const searchResp = await apiContext.get(searchURL, { headers: { Authorization: `Bearer ${await getToken()}` } });

    const searchData = await searchResp.json();
    const result = searchData.products?.[0]?.code;
    
    return result;
  } catch (err) {
    console.error(`Error fetching encrypted code for ${crossNumber}: ${err}`);
    return null;
  }
}

export async function getManufacturerCodes(
  encryptedSearchCode: string,
  apiContext: APIRequestContext
): Promise<ApiCompatibility[]> {

  const manu_1 = process.env.COMPATIBILITY_MANUFACTURERS_URL_1 as string;
  const manu_2 = process.env.COMPATIBILITY_MANUFACTURERS_URL_2 as string;
  const manufacturer_codes_url = `${manu_1}${encryptedSearchCode}${manu_2}`;
  // console.log(`MANUFACTURERS URL: ${manufacturer_codes_url}`); // Detaylı loglar için uncomment edilebilir

  const manufacturer_codes_response = await apiContext.get(
    manufacturer_codes_url,
    { headers: await getAuthHeaders() }
  );

  const manufacturer_codes_json = await manufacturer_codes_response.json();
  // `map` kullanarak daha temiz bir dönüşüm
  return manufacturer_codes_json.manufacturers.map(
    (each: ApiCompatibility) => ({ name: each.name, uuid: each.uuid })
  );
}

export async function getmodelCodes(
  encryptedSearchCode: string,
  apiContext: APIRequestContext,
  manufacturer_uuid: string // parametre adını değiştirdim, `_code` yerine `_uuid` daha doğru
): Promise<ApiCompatibility[]> {

  const model_1 = process.env.COMPATIBILITY_MODEL_URL_1 as string;
  const model_2 = process.env.COMPATIBILITY_MODEL_URL_2 as string;
  const model_3 = process.env.COMPATIBILITY_MODEL_URL_3 as string;
  const model_codes_url = `${model_1}${encryptedSearchCode}${model_2}${manufacturer_uuid}${model_3}`;

  const response = await apiContext.get(model_codes_url, {
    headers: await getAuthHeaders(),
  });
  const data = await response.json();

  // `map` kullanarak daha temiz bir dönüşüm
  return data.modelSeries.map((each: ApiCompatibility) => ({
    name: each.name,
    uuid: each.uuid,
  }));
}

export async function getTargets(
  encryptedSearchCode: string,
  apiContext: APIRequestContext,
  model_uuid: string
): Promise<OutputTarget[]> {
  const target_url_1 = process.env.COMPATIBILITY_TARGET_URL_1 as string;
  const target_url_2 = process.env.COMPATIBILITY_TARGET_URL_2 as string;
  const target_url_3 = process.env.COMPATIBILITY_TARGET_URL_3 as string;

  const target_url = `${target_url_1}${encryptedSearchCode}${target_url_2}${model_uuid}${target_url_3}`;

  const response = await apiContext.get(target_url, { headers: await getAuthHeaders() });

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
