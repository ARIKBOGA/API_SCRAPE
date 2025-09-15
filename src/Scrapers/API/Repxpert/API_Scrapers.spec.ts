import { request, test } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { processProductFor_CrossNumbers, processProductFor_OE, processProductFor_VehicleCompatibility, processProductForArticleAttributes } from "./helpers/api-workers";
import { referenceArray } from "../../../utils/Variables";
import { readProductReferencesFromExcel } from "../../../utils/Excel_Utils";
import { getAuthHeaders, getEncryptedSearchCode } from "../../../utils/API_Worker_Functions";

dotenv.config({ path: path.resolve(".env") });
const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = (process.env.FILTER_BRAND as string) !== "" ? process.env.FILTER_BRAND as string : "LOADED_NOT_FOUND_COMMERCIAL_REMINDER";

const start = 550;
const end: number = 0;
const end_str = end !== 0 ? end : "end";

async function processProducts(processFunction: Function, fileName: string, threadLimit: number, processFor: string) {
  const productReferences = readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(threadLimit);

  const results = (await Promise.all(
    //productReferences
    referenceArray
      .filter(
        (productRef) =>
          //productRef.supplier === filterBrand &&               // process only given brand in .env file
          productRef.crossNumber.trim() !== ""              // skip empty cells comes from excel
        //&& !productRef.crossNumber.trim().includes(" ")    // skip cross numbers with spaces
      )
      //.slice(start)
      .map((productRef) => limit(() => processFunction(productRef)))
  )).filter((r) => r !== null);

  const outputDir = path.resolve(`src/output/${productType}/jsons/${processFor}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(results, null, 2), "utf8");
}

test("Get OE numbers for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing OE numbers for brand: ${filterBrand}`);
  await processProducts(processProductFor_OE, `oe-numbers_${filterBrand}.json`, 3, "OE");
});

test("Get Vehicle Compatibility for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Vehicle Compatibility for brand: ${filterBrand}`);
  await processProducts(processProductFor_VehicleCompatibility, `Vehicle-Compatibility_${filterBrand}.json`, 3, "Vehicle-Compatibility");
});

test("Get cross numbers via given cross/OE numbers", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Cross Numbers for brand: ${filterBrand}`);
  await processProducts(processProductFor_CrossNumbers, `Cross-Numbers_${productType}_${filterBrand}.json`, 5, "Cross-Numbers");
});

test("Get Article Attributes of the products", async () => {
  test.setTimeout(10 * 60 * 1000);
  console.log(`Processing Article Attributes for : ${productType} - ${filterBrand}`)
  await processProducts(processProductForArticleAttributes, `Attributes_${productType}_${filterBrand}.json`, 5, 'Attributes');
})



test('Get token only', async ({ request }) => {
  const env = process.env;
  const requestBody = new URLSearchParams({
    grant_type: env.grant_type || "",
    client_id: env.client_id || "",
    client_secret: env.client_secret || "",
    username: env.email || "",
    password: env.password || "",
  });

  const tokenHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  const tokenResponse = await request.post("https://www.repxpert.co.uk/authorizationserver/oauth/token?catalogCountry=GB", {
    headers: tokenHeaders,
    data: requestBody.toString(),
  });

  const jsonData = await tokenResponse.json();
  console.log("Token Response:", jsonData);



})


test("Get only ICER products WVA numbers", async ({ request }) => {

  for (const ref of referenceArray) {
    const { yvNo, supplier, crossNumber } = ref;
    const searchCode = await getEncryptedSearchCode(crossNumber, supplier, request);
    const response = await request.get(`https://www.repxpert.co.uk/api/Repxpert-GB/products/${searchCode}`, { headers: await getAuthHeaders() });
    const data = await response.json();

    const tradeNumbers: string[] = data.tradeNumbers.filter((tn: string) => !tn.includes("-"));
    console.log(`YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}, Trade Numbers: ${tradeNumbers}`);
  }
})