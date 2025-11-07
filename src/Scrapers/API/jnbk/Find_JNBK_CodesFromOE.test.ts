import { test, request, APIRequestContext } from "@playwright/test";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import { get_ORJ_NO_DATA_map } from "../../../io/utils/Reader_Utils";
import { JNBK } from "../repxpert/config/ApiData";
import * as cheerio from "cheerio";
import pLimit from "p-limit";

dotenv.config({ path: path.resolve(".env") });

const PRODUCT_TYPE = process.env.PRODUCT_TYPE!;

// APIRequestContext'i burada tanımlıyoruz, henüz başlatmıyoruz.
let apiContext: APIRequestContext;
const CONCURRENCY_LIMIT = 5;
const limit = pLimit(CONCURRENCY_LIMIT);
const DELAY_MS = 400;
const OUTPUT_FILE_PATH = path.resolve(__dirname, `../../../output/${PRODUCT_TYPE}/jsons/JNBK_CODES/Parellel_JNBK_CODES_${PRODUCT_TYPE}.jsonl`);


test.beforeAll(async () => {
    // apiContext'i burada başlatıyoruz.
    apiContext = await request.newContext();
});


// 2. Tüm veriyi tek bir düz (flat) listeye dönüştürün
const allScrapingTasks: { yv: string, oe: string }[] = [];
get_ORJ_NO_DATA_map().forEach((value: Set<string>, yv: string) => {
    value.forEach((oe: string) => {
        allScrapingTasks.push({ yv, oe });
    });
});

// 3. Her bir görev için bir Promise döndüren fonksiyon oluşturun (apiContext kullanıyor)
const scrapeTask = async ({ yv, oe }: { yv: string, oe: string }) => {

    const response = await apiContext.post(JNBK.BASE_URI, {
        headers: {
            referer: JNBK.BASE_URI
        },
        form: {
            txtPartNo: oe,
            txtClass: "1",
            btnProductSearch: "Search",
        },
    });

    const bodyText = await response.text();
    const $ = cheerio.load(bodyText);

    await new Promise(resolve => setTimeout(resolve, DELAY_MS));

    const jnbkCode = $(".search-title").text().split("» ")[1] || "N/A";

    // !!! ÖNEMLİ DEĞİŞİKLİK: fs/promises kullanıyoruz!
    // Asenkron I/O işlemi yaparken eşzamanlı olan fs.appendFileSync kullanmak
    // paralelleştirilmiş kodda **veri bozulmasına** (data corruption) neden olabilir,
    // çünkü aynı anda birden fazla iş parçacığı dosyayı yazmaya çalışır.
    await fs.appendFile(
        OUTPUT_FILE_PATH,
        JSON.stringify({ yv, oe, jnbkCode }) + ",\n"
    );
    console.log(`Completed JNBK codes for ${oe} of ${yv}`);

};

// 4. Test bloğu: Tüm görevleri p-limit ile paralel çalıştırın.
test('Bulk JNBK Code Scraping', async () => {
    test.setTimeout(120 * 60 * 1000); // 2 saat
    if (!apiContext) {
        // Bu hata hiç olmamalı, ama Type Safety ve Robustness için iyi.
        throw new Error("API Context başlatılamadı!");
    }

    const promises = allScrapingTasks
        .slice(10000, allScrapingTasks.length)
        .map(task => limit(() => scrapeTask(task)));

    // Tüm paralel görevlerin bitmesini bekleyin.
    await Promise.all(promises);
});