import { test } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { readProductReferencesFromExcel } from "../../utils/Excel_Utils";
import { processProductFor_CrossNumbers, processProductFor_OE, processProductFor_VehicleCompatibility } from "../../utils/api-workers";
import { referenceArray } from "../../utils/Variables";

dotenv.config({ path: path.resolve(".env") });
const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = (process.env.FILTER_BRAND as string) !== "" ? process.env.FILTER_BRAND as string : "LOADED_NOT_FOUND_commercialVehicles";

async function processProducts(processFunction: Function, fileName: string, threadLimit: number, processFor: string) {
  //const productReferences = readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(threadLimit);

  const results = (await Promise.all(
    //productReferences
    referenceArray
      .filter(
        (productRef) =>
          //productRef.brand === filterBrand &&               // process only given brand in .env file
          productRef.crossNumber.trim() !== ""              // skip empty cells comes from excel
          //&& !productRef.crossNumber.trim().includes(" ")    // skip cross numbers with spaces
      )
      //.slice(40)
      .map((productRef) => limit(() => processFunction(productRef)))
  )).filter((r) => r !== null);

  const outputFilePath = path.resolve(`src/output/${productType}/jsons/${processFor}/${fileName}`);
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), "utf8");
}

test("Get OE numbers for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing OE numbers for brand: ${filterBrand}`);
  await processProducts(processProductFor_OE, `oe-numbers_${filterBrand}.json`, 3, "OE");
});

test("Get Vehicle Compatibility for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Vehicle Compatibility for brand: ${filterBrand}`);
  await processProducts(processProductFor_VehicleCompatibility, `Vehicle-Compatibility_${filterBrand}.json`, 2, "Vehicle-Compatibility");
});

test("Get cross numbers via given cross/OE numbers", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Cross Numbers for brand: ${filterBrand}`);
  await processProducts(processProductFor_CrossNumbers, `Cross-Numbers_${productType}_${filterBrand}.json`, 3, "Cross-Numbers");
});


test('Get token only', async ({request}) => {
  const requestBody = new URLSearchParams({
    grant_type: process.env.grant_type || "password",
    client_id: process.env.client_id || "repxpert-GB",
    client_secret: process.env.client_secret || "client_secret",
    username: process.env.username || "username",
    password: process.env.password || "password",
  });

  const tokenHeaders = {
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "application/json",
  };

  const tokenResponse = await request.post("https://api-aftermarket.schaeffler.de/authorizationserver/oauth/token?catalogCountry=GB", {
    headers: tokenHeaders,
    data: requestBody.toString(),
  });

  const jsonData = await tokenResponse.json();
  console.log("Token Response:", jsonData);


 
})