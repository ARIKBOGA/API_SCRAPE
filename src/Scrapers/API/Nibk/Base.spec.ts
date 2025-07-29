import * as cheerio from 'cheerio';
import { test, request, Browser } from '@playwright/test';
import { referenceArray } from '../../../utils/Variables';
import { extractYears } from '../../../utils/Utility';
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { delay } from '../../../utils/API_Worker_Functions';
import { ProductCompatibilityResult, ProductReference } from '../../../utils/Types';

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
    console.log(`Processing OE numbers for brand: ${filterBrand}`);
    await JNBK_API_Scraper(getVehicleCompatibilities, `Vehicle-Compatibility_${filterBrand}.json`, 3, "Vehicle-Compatibility");
});

export async function getVehicleCompatibilities(ref: ProductReference) {

    const { url_id: productId, currentUrl } = await getProduct_URL(ref);
    const apiContext = await request.newContext();

    try {
        const response = await apiContext.post(currentUrl, {
            headers: {
                referer: "https://www.jnbk-brakes.com/catalogue/cars"
            }
        });

        const bodyText = await response.text(); // response.body() yerine
        const $ = cheerio.load(bodyText);

        const titles: string[] = $("a.achrBrandModel").map((index, element) => $(element).text()).get();

        console.log(titles);

    } catch (error) {

    } finally {
        await apiContext.dispose();

    }


}

export async function getProduct_URL(ref: ProductReference): Promise<{ url_id: string; currentUrl: string }> {

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

        const url_id = $('input[name="txtProductId"]').val()?.toString() || '';
        const currentUrl = $('input[name="currentUrl"]').val()?.toString() || '';
        return { url_id: url_id, currentUrl };
    } catch (err) {
        console.error(`❌ ${yvNo} - ${crossNumber} - Product Info için hata:`, err);
        return { url_id: '', currentUrl: '' };
    } finally {
        await apiContext.dispose();
        await delay(300);
    }
}