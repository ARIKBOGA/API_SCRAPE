import { test, expect, APIRequestContext } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { readProductReferencesFromExcel } from "../../utils/Excel_Utils";
import fs from "fs";
import { serializeArrayOfMaps } from "../../utils/Utility";

dotenv.config({ path: path.resolve(".env") });

async function getToken(request: APIRequestContext): Promise<string> {
  const getTokenURI = process.env.TOKEN_URI as string;
  const formBody = new URLSearchParams({
    grant_type: process.env.grant_type || "password",
    client_id: process.env.client_id || "repxpert-GB",
    client_secret: process.env.client_secret || "client_secret",
    username: process.env.username || "username",
    password: process.env.password || "password",
  });

  const tokenResponse = await request.post(getTokenURI, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    data: formBody.toString(),
  });
  expect(tokenResponse.ok()).toBeTruthy();
  expect(tokenResponse.status()).toBe(200);

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function getRequestOptions(token: string): Promise<any> {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };
}

async function getEncryptedSearchCode(
  request: APIRequestContext,
  token: string,
  searchQuery: string
): Promise<string> {
  const abu_1 = process.env.API_BASE_URL_1 || "";
  const abu_2 = process.env.API_BASE_URL_2 || "";
  const API_BASE_URL = `${abu_1}${searchQuery}${abu_2}`;
  const response = await request.get(
    API_BASE_URL,
    await getRequestOptions(token)
  );
  var jsonData = await response.json();
  return jsonData.products[0].code;
}

test.describe("Get all OE numbers for a list of products", () => {

  test("Get OE numbers for all products", async ({ request }) => {

    // Set a timeout for this test to allow for API calls 20 mins
    test.setTimeout(20 * 60 * 1000);

    const all_OE_array = new Array<Map<string, Map<string, string[]>>>();
    const productReferences = readProductReferencesFromExcel();

    const token = await getToken(request);

    productReferences.slice(0, 20).forEach(async (ref) =>{
      const {yvNo, brandRefs} = ref;
      const filterBrand = Object.keys(brandRefs)[0] as string;
      const crossNumber = brandRefs[filterBrand]?.trim();
      if (!crossNumber) {
        console.warn(`No cross number found for YV: ${yvNo}, Brand: ${filterBrand}`);
        return;
      }

      const product_OE_map = new Map<string, Map<string, string[]>>();

      
      
      const oeru_1 = process.env.OE_REQUEST_URL_1 as string;
      const oeru_2 = process.env.OE_REQUEST_URL_2 as string;
      const encryptedSearchCode = await getEncryptedSearchCode( request, token, crossNumber);
      const oe_request_url = `${oeru_1}${encryptedSearchCode}${oeru_2}`;
      
      const requestOptions = await getRequestOptions(token);
      const oe_response = await request.get(oe_request_url, requestOptions);
      const oe_jsonData = await oe_response.json();

      const brand_OE_Map = new Map<string, string[]>();

      oe_jsonData.oenumbers.forEach((oe: any) => {

        const oeList: string[] = [];

        oe.numbers.forEach((element: any) => {
          expect(element).toBeDefined();
          oeList.push(element.number);
        });
        //console.log(`${oe.manufacturer.name} : ${oeList.join(", ")}`);
        brand_OE_Map.set(oe.manufacturer.name, oeList);
      });

      product_OE_map.set(crossNumber, brand_OE_Map);
      all_OE_array.push(product_OE_map);
    })

    const serializedMap = serializeArrayOfMaps(all_OE_array);
    const outputFilePath = path.resolve("src/output", "oe-numbers.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(serializedMap, null, 2));
  });
});
