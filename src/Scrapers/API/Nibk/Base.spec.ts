import * as cheerio from 'cheerio';
import { test, request, Browser } from '@playwright/test';
import { referenceArray } from '../../../utils/Variables';
import { extractYears } from '../../../utils/Utility';
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { delay } from '../../../utils/API_Worker_Functions';
import { OutputManufacturer, OutputModelSeries, OutputTarget, ProductCompatibilityResult, ProductReference } from '../../../utils/Types';
import { Locale } from 'locale-enum';

dotenv.config({ path: path.resolve(".env") });
const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

async function JNBK_API_Scraper(process: Function, fileName: string, threadLimit: number, dataType: string) {

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
            //.slice(300)
            .map((productRef) => limit(() => process(productRef)))
    )).filter((r) => r !== null).flat();

    const outputDir = path.resolve(`src/output/${productType}/jsons/${dataType}`);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(results, null, 2), "utf8");
}

test("JNBK API test", async () => {

    test.setTimeout(20 * 60 * 1000); // 20 dakika
    console.log(`Processing OE numbers for brand: ${filterBrand}, count : ${referenceArray.length}`);
    await JNBK_API_Scraper(getCompatibilityResults, `Vehicle-Compatibility_${filterBrand}.json`, 3, "Vehicle-Compatibility");
});

export async function getCompatibilityResults(ref: ProductReference): Promise<ProductCompatibilityResult[]> {
    const { yvNo, supplier } = ref;
    const { product_id, currentUrl } = await getProduct_URL(ref);
    const compatibilityVehicles = await getVehicleCompatibilities(ref, currentUrl);

    return [{ yvNo, crossNumber: product_id, brand: supplier, compatibleVehicles: compatibilityVehicles }];
}

export async function getVehicleCompatibilities(ref: ProductReference, currentUrl: string): Promise<OutputManufacturer[]> {
    const apiContext = await request.newContext();

    try {
        const response = await apiContext.post(currentUrl, {
            headers: {
                referer: "https://www.jnbk-brakes.com/catalogue/cars"
            }
        });

        if (!response.ok()) {
            throw new Error(`API isteği başarısız oldu: ${response.status()} ${response.statusText()}`);
        }

        const bodyText = await response.text();
        const $ = cheerio.load(bodyText);

        const compatibilityVehicles: OutputManufacturer[] = [];

        // Her bir 'model-title' div'ini iterate edelim
        // Bu yapıya göre her 'model-title' hemen ardından kendi 'model-body'si ile takip ediyor.
        const modelTitles = $(".model-title");

        for (let i = 0; i < modelTitles.length; i++) {
            const titleElement = modelTitles.eq(i);
            const fullTitle = titleElement.find("a.achrBrandModel").text().trim();

            if (!fullTitle) {
                console.warn(`Boş başlık atlandı.`);
                continue;
            }

            const [marka, model] = fullTitle.split("»").map(s => s.trim());

            // İlgili 'model-body' div'ini bulmak için doğrudan .next() kullanıyoruz
            const modelBodyDiv = titleElement.next(".model-body");

            if (modelBodyDiv.length === 0) {
                console.warn(`Model Body bulunamadı: ${fullTitle}`);
                continue; // Bu başlık için devam etme
            }

            // Tabloyu modelBodyDiv içinden bulalım
            const dataTable = modelBodyDiv.find("table.search-result-table");

            if (dataTable.length === 0) {
                console.warn(`Veri tablosu bulunamadı: ${fullTitle}`);
                continue;
            }

            const targets: OutputTarget[] = [];

            // Tablodaki her bir 'tr' elementini iterate edeyoruz
            // tr elementleri direkt <tbody> içinde olmayabilir, bu yüzden direkt tr'leri seçtik.
            // Başlık satırı olmadığı için ilk satırdan itibaren 
            const trElements = dataTable.find("tr").get(); // Tüm veri satırlarını array olarak al

            for (const rowElement of trElements) {

                const $row = $(rowElement);

                const madeYear = $row.find("td:nth-child(1)").text().trim();
                const years = await extractYears(madeYear, Locale.en_US); // extractYears fonksiyonunu revize ettim
                const cc = $row.find("td:nth-child(2)").text().trim();
                const engineCodes = $row.find("td:nth-child(3)").text().trim();
                const engineType_body = $row.find("td:nth-child(4)").text().trim(); // BODY sütunu

                targets.push({
                    engine: `${cc} | ${engineType_body}`, // cc ve body tipini birleştir
                    fullName: fullTitle,
                    constructionYearFrom: years.start,
                    constructionYearTo: years.end,
                    engineCodes,
                    enginePowerKW: '',
                    enginePowerHP: '',
                    cc: cc,
                    kbaNumbers: '',
                    bodyType: engineType_body, // bodyType'ı ilgili sütundan al
                });
            }

            compatibilityVehicles.push({
                manufacturer: marka,
                models: [{
                    modelSeries: model,
                    targets: targets
                }]
            });
        }

        return compatibilityVehicles;

    } catch (error) {
        console.error(`❌ ${ref.crossNumber} için hata:`, error);
        return [];
    } finally {
        await apiContext.dispose();
        await delay(300);
    }
}

export async function getProduct_URL(ref: ProductReference): Promise<{ product_id: string; currentUrl: string }> {

    const apiContext = await request.newContext();
    const { yvNo, supplier, crossNumber } = ref;

    try {
        const response = await apiContext.post("https://www.jnbk-brakes.com/catalogue/cars", {
            headers: {
                referer: "https://www.jnbk-brakes.com/catalogue/cars"
            },
            form: {
                txtPartNo: crossNumber,
                txtClass: "1",
                btnProductSearch: "Search",
            },
        });

        const bodyText = await response.text(); // response.body() yerine
        const $ = cheerio.load(bodyText);

        const productID = $("h2.search-title").text().split("»")[1].trim() || '';
        const currentUrl = $('input[name="currentUrl"]').val()?.toString() || '';
        //console.log(`Product ID: ${productID}`);
        console.log(`${yvNo} - ${crossNumber} - Current URL: ${currentUrl}`);
        return { product_id: productID, currentUrl };
    } catch (err) {
        console.error(`❌ ${yvNo} - ${crossNumber} - Product Info için hata:`, err);
        return { product_id: '', currentUrl: '' };
    } finally {
        await apiContext.dispose();
        await delay(300);
    }
}