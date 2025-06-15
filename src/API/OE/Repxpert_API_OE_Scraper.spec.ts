import { test } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
// import pLimit from "p-limit";
import { readProductReferencesFromExcel } from "../../utils/Excel_Utils";
import { processProduct } from "../../utils/api-workers";


dotenv.config({ path: path.resolve(".env") });

test("Get OE numbers for all products", async () => {
  test.setTimeout(20 * 60 * 1000);

  const productReferences = readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(5); // aynı anda 5 request sınırı
  const promises = productReferences.slice(0, 100).map(ref => limit(() => processProduct(ref)));

  const results = (await Promise.all(promises)).filter(r => r !== null);

  const outputFilePath = path.resolve("src/output", "oe-numbers.json");
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2), "utf8");
});
