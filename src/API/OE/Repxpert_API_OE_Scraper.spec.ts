import { test } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { readProductReferencesFromExcel } from "../../utils/Excel_Utils";
import { processProductFor_CrossNumbers, processProductFor_OE, processProductFor_VehicleCompatibility } from "../../utils/api-workers";
import { referenceArray } from "../../utils/Types";

dotenv.config({ path: path.resolve(".env") });
const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

test("Get OE numbers for all products", async () => {
  test.setTimeout(20 * 60 * 1000);

  const productReferences = readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(5); // aynı anda 5 request sınırı
  const promises = productReferences
    .filter((productRef) => {
      return (
        productRef.brand.toLowerCase() === filterBrand.toLowerCase() &&
        !productRef.crossNumber.trim().includes(" ")
      );
    })
    .slice(800) // aralıkları 100, 200  gibi yap
    .map((productRef) => limit(() => processProductFor_OE(productRef)));

  const results = (await Promise.all(promises)).filter((r) => r !== null);

  const outputFilePath = path.resolve(
    `src/output/${productType}_oe-numbers_${filterBrand}_5.json`
  );
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), "utf8");
});

test("Get Vehicle Compatibility for all products", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Vehicle Compatibility for brand: ${filterBrand}`);
  const productReferences = readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(3); // aynı anda n request sınırı
  const promises = productReferences.filter((productRef) => {
    return (
      productRef.brand.toLowerCase() === filterBrand.toLowerCase()
      && !productRef.crossNumber.trim().includes(" ")
    );
  })
  //.slice() // aralıkları 100, 200 gibi yap
  .map((productRef) => limit(() => processProductFor_VehicleCompatibility(productRef)));

  const results = (await Promise.all(promises)).filter((r) => r !== null);

  const outputFilePath = path.resolve(`src/output/${productType}/Vehicle-Compatibility_${filterBrand}_ADD.json`);
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), "utf8");
});

test("Get cross numbers via given cross/OE numbers", async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Vehicle Compatibility for brand: ${filterBrand}`);
  const productReferences = readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(3); // aynı anda n request sınırı
  const promises = productReferences
  .filter((ref) => ref.brand.toLowerCase() === filterBrand.toLowerCase())
  //.slice(0,10) // aralıkları 100, 200 gibi yap
  .map((productRef) => limit(() => processProductFor_CrossNumbers(productRef)));

  const results = (await Promise.all(promises)).filter((r) => r !== null);

  const outputFilePath = path.resolve(`src/output/${productType}/Cross-Numbers_2.json`);
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), "utf8");

})