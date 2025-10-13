import { APIRequestContext, request, test } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { processProductFor_CrossNumbers, processProductFor_OE, processProductFor_VehicleCompatibility, processProductForArticleAttributes } from "./helpers/API_Functions";
import { referenceArray } from "../data/Variables";
import { readProductReferencesFromExcel } from "../../../utils/Excel_Utils";
import { getAuthHeaders, getEncryptedSearchCode } from "./helpers/API_Helpers";
import { ProductReference } from "../../../utils/Types";
import { REPXPERT } from "./config/ApiData";

dotenv.config({ path: path.resolve(".env") });
const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = (process.env.FILTER_BRAND as string) !== "" ? process.env.FILTER_BRAND as string : "LOADED_NOT_FOUND_COMMERCIAL_REMINDER";

const start = 0;
const end: number = 600;
const end_str = end !== 0 ? end : "end";

async function processProducts(
  processFunction: (productRef: ProductReference, apiContext: APIRequestContext) => Promise<any>,
  fileName: string,
  threadLimit: number,
  processFor: string
) {
  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(threadLimit);
  const apiContext = await request.newContext();

  //const productReferences = readProductReferencesFromExcel();

  const results = (
    await Promise.all(
      //productReferences
      referenceArray
        .filter(
          (productRef) =>
            productRef.freeTextSearch.trim() !== ""
        )
        //.slice(0,1)
        .map((productRef) => limit(() => processFunction(productRef, apiContext)))
    )
  ).filter((r) => r !== null);

  const outputDir = path.resolve(`src/output/${productType}/jsons/${processFor}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(results, null, 2), "utf8");

  const total = referenceArray.slice(start).length;
  const success = results.length;
  console.log(`✅ Processed ${success}/${total} successfully (${((success / total) * 100).toFixed(2)}%)`);


  await apiContext.dispose();
}


test("Get OE numbers for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing OE numbers for brand: ${filterBrand}`);
  await processProducts(processProductFor_OE, `oe-numbers_${filterBrand}.json`, 4, "OE");
});

test("Get Vehicle Compatibility for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Vehicle Compatibility for brand: ${filterBrand}`);
  await processProducts(processProductFor_VehicleCompatibility, `Vehicle-Compatibility_${filterBrand}.json`, 4, "Vehicle-Compatibility");
});

test("Get cross numbers via given cross/OE numbers", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Cross Numbers for brand: ${filterBrand}`);
  await processProducts(processProductFor_CrossNumbers, `Cross-Numbers_${productType}_${filterBrand}_${start}-${end_str}.json`, 5, "Cross-Numbers");
});

test("Get Article Attributes of the products", async () => {
  test.setTimeout(10 * 60 * 1000);
  console.log(`Processing Article Attributes for : ${productType} - ${filterBrand}`)
  await processProducts(processProductForArticleAttributes, `Attributes_${productType}_${filterBrand}.json`, 5, 'Attributes');
})



test('Get token only', async ({ request }) => {

  const requestBody = new URLSearchParams(REPXPERT.tokenRequest.body);

  const tokenHeaders = REPXPERT.tokenRequest.headers;

  const URL = REPXPERT.tokenRequest.URL;

  const response = await request.post(URL, {
    headers: tokenHeaders,
    data: requestBody.toString(),
  });

  const data = await response.json();
  console.log(data?.access_token);

  const encryptedCode = await getEncryptedSearchCode("4B0698151AC", "BREMBO", request);
  console.log("Encrypted Code:", encryptedCode);
})


test("Get only ICER products WVA numbers", async ({ request }) => {

  for (const ref of referenceArray) {
    const { yvNo, supplier, freeTextSearch: crossNumber } = ref;
    const searchCode = await getEncryptedSearchCode(crossNumber, supplier, request);
    const response = await request.get(`https://www.repxpert.co.uk/api/Repxpert-GB/products/${searchCode}`, { headers: await getAuthHeaders() });
    const data = await response.json();

    const tradeNumbers: string[] = data.tradeNumbers.filter((tn: string) => !tn.includes("-"));
    console.log(`YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}, Trade Numbers: ${tradeNumbers}`);
  }
})