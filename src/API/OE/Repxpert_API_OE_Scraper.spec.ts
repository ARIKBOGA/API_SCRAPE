import { test } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { readProductReferencesFromExcel } from "../../utils/Excel_Utils";
import { processProductFor_CrossNumbers, processProductFor_OE, processProductFor_VehicleCompatibility } from "../../utils/api-workers";

dotenv.config({ path: path.resolve(".env") });
const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

async function processProducts(processFunction: Function, fileName: string, limitCount: number) {
  const productReferences = readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(limitCount);

  const results = (await Promise.all(
    productReferences
      .filter(
        (productRef) =>
          productRef.brand === filterBrand &&
          !productRef.crossNumber.trim().includes(" ")
      )
      .map((productRef) => limit(() => processFunction(productRef)))
  )).filter((r) => r !== null);

  const outputFilePath = path.resolve(`src/output/${productType}/${fileName}`);
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), "utf8");
}

test("Get OE numbers for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  await processProducts(processProductFor_OE, `oe-numbers_${filterBrand}_5.json`, 3);
});

test("Get Vehicle Compatibility for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Vehicle Compatibility for brand: ${filterBrand}`);
  await processProducts(processProductFor_VehicleCompatibility, `Vehicle-Compatibility_${filterBrand}_ADD.json`, 3);
});

test("Get cross numbers via given cross/OE numbers", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Cross Numbers for brand: ${filterBrand}`);
  await processProducts(processProductFor_CrossNumbers, `Cross-Numbers_2.json`, 3);
});
