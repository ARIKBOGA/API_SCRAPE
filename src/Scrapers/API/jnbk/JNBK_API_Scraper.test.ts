import { test } from "@playwright/test";
import { referenceArray } from "../resources/Variables";
import path from "path";
import dotenv from "dotenv";
import pLimit from "p-limit";
import { getResults } from "./JNBK_Requests";
import { mkdirIfNotExists, writeJSONSafe } from "./JNBK_Utils";

dotenv.config({ path: path.resolve(".env") });

const PRODUCT_TYPE = process.env.PRODUCT_TYPE!;
const FILTER_BRAND = process.env.FILTER_BRAND!;
const THREAD_LIMIT = 4; // Aynı anda çalışacak istek sayısı

test.describe("JNBK API Scraper", () => {
    test.setTimeout(30 * 60 * 1000);

    test("Scrape all product compatibilities", async () => {
        const first = 0;
        const last = referenceArray.length;
        console.log(`🚀 Processing brand: ${FILTER_BRAND}`);

        const filteredRefs = referenceArray.filter(
            (r) => r.supplier === "JNBK" && r.freeTextSearch.trim() !== ""
        );

        const limiter = pLimit(THREAD_LIMIT);

        const allResults = await Promise.allSettled(
            filteredRefs
                .slice(first, last) // Sadece aralıkta olanları işle
                .map((ref) => limiter(() => getResults(ref)))
        );

        const valid = allResults
            .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
            .map((r) => r.value);

        const compats = valid.map((v) => v[0]);
        const oes = valid.map((v) => v[1]);
        const attrs = valid.map((v) => v[2]);

        const outputDir = path.resolve(`src/output/${PRODUCT_TYPE}/jsons`);
        await mkdirIfNotExists(outputDir);

        await writeJSONSafe(`${outputDir}/Vehicle-Compatibility/Vehicle-Compatibility_${FILTER_BRAND}.json`, compats);
        await writeJSONSafe(`${outputDir}/OE/oe-numbers_${FILTER_BRAND}.json`, oes);
        await writeJSONSafe(`${outputDir}/Attributes/Attributes_${FILTER_BRAND}.json`, attrs);

        console.log(
            `✅ Finished! Valid entries: ${valid.length} / ${filteredRefs.length}. Success rate: ${((valid.length / filteredRefs.length) * 100).toFixed(2)}%`
        );
    });
});
