import { test } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
// import pLimit from "p-limit";
import { readProductReferencesFromExcel } from "../../utils/Excel_Utils";
import { processProduct } from "../../utils/api-workers";
import { referenceArray } from "../../utils/Types";

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

test("Get OE numbers for all products", async () => {
  test.setTimeout(20 * 60 * 1000);

  const productReferences = referenceArray //readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(5); // aynı anda 5 request sınırı
  const promises = productReferences
    .filter((productRef) => {
      return productRef.brand.toLowerCase() === filterBrand.toLowerCase() &&
        !productRef.crossNumber.trim().includes(" ");;
    })
    .slice(0, 200) // aralıkları 100, 200  gibi yap
    .map((productRef) => limit(() => processProduct(productRef)));

  const results = (await Promise.all(promises)).filter((r) => r !== null);

  const outputFilePath = path.resolve(`src/output/${productType}_oe-numbers_${filterBrand}_1.json`);
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), "utf8");
});
