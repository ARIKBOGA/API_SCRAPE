import { test, Page, Browser } from '@playwright/test'; // Browser'ı import edin
import path from 'path';
import fs from 'fs';
import { OutputManufacturer, OutputModelSeries, OutputTarget, ProductCompatibilityResult, ProductReference } from '../../../utils/Types';
import { referenceArray } from '../../api/data/Variables';
import { extractYears } from '../../../utils/Utility';
import { Locale } from 'locale-enum';

const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;
const URL = process.env.JNKB_BRAKES_URL as string;

// JNBK scrapers with parallel threads with usingp-limit and browser.newPage()

test("JNBK scrapers with parallel threads", async ({ browser }) => {

    test.setTimeout(20 * 60 * 1000); // 20 dakika
    console.log(`Processing OE numbers for brand: ${filterBrand}`);
    await processJNBKProducts(browser, JNBK_Compatibility, `Vehicle-Compatibility_${filterBrand}.json`, 4, "Vehicle-Compatibility");
});



async function processJNBKProducts(browser: Browser, processFunction: Function, fileName: string, threadLimit: number, processFor: string) {

    const { default: pLimit } = await import("p-limit");
    const limit = pLimit(threadLimit);

    const results = (await Promise.all(
        referenceArray
            .filter(
                (productRef) =>
                    productRef.freeTextSearch.trim() !== ""
            )
            .map((productRef) => limit(async () => { // Her referans için ayrı bir işlem başlatır
                const page = await browser.newPage(); // Her işlem için yeni bir sayfa oluşturur
                try {
                    return await processFunction(page, productRef);
                } finally {
                    await page.close(); // İşlem bitince sayfayı kapatır
                }
            }))
    )).filter((r) => r !== null).flat();

    const outputDir = path.resolve(`src/output/${productType}/jsons/${processFor}`);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(results, null, 2), "utf8");
}

export async function navigateAndSearch(page: Page, url: string, crossNumber: string): Promise<void> {

    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'Enter OEM, NiBK, WVA, FMSI or' }).waitFor();

    const searchInput = page.getByRole('textbox', { name: 'Enter OEM, NiBK, WVA, FMSI or' });
    await searchInput.fill(crossNumber);
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForTimeout(2000);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#divImgCrossSpec').getByText('Specification').waitFor();
}



export async function extractProductTitle(page: Page): Promise<{ productType: string; productID: string }> {

    const productTitle = await page.locator("//*[@id='msg']/following-sibling::div//h2").textContent();
    if (!productTitle) {
        throw new Error("Product title not found");
    }
    const parts = productTitle?.split("»").map(p => p.trim());
    const productType = parts?.[0] || "";
    const productID = parts?.[1] || "";
    return { productType, productID };
}



export async function extractSpecifications(page: Page): Promise<Map<string, string>> {

    const specificationTitles = await page.locator("//*[@class='d-lg-flex']//div[@class='param-title']").allTextContents();
    const specificationValues = await page.locator("//*[@class='d-lg-flex']//div[@class='param-field']").allTextContents();
    const specificationMap = new Map<string, string>();

    for (let i = 0; i < specificationTitles.length; i++) {
        const title = specificationTitles[i].trim();
        const value = specificationValues[i].trim();
        if (title && value) {
            specificationMap.set(title, value);
        }
    }
    return specificationMap;
}



export async function extractCrossReferences(page: Page): Promise<{ brand: string; oe: string }[]> {
    const crossReferenceOwners = await page.locator("//div[@class='owner']").allTextContents();
    const crossReferenceNumbers = await page.locator("//div[@class='field']").allTextContents();

    const crossReferencePairs: { brand: string; oe: string }[] = [];
    for (let i = 0; i < crossReferenceOwners.length; i++) {
        const owner = crossReferenceOwners[i].trim();
        const number = crossReferenceNumbers[i].trim();
        if (owner && number) {
            crossReferencePairs.push({ brand: owner, oe: number });
        }
    }
    return crossReferencePairs;
}



export async function extractCompatibilities(page: Page): Promise<OutputManufacturer[]> {

    const compatibilityVehicles: OutputManufacturer[] = [];
    const manufacturer_model_locator = "//div[contains(@class, 'model-title')]";
    const manufacturer_models = page.locator(manufacturer_model_locator);
    const manufacturer_model_count = await manufacturer_models.count();

    for (let i = 1; i <= manufacturer_model_count; i++) {

        const manufacturer_model_element = await page.locator(`(${manufacturer_model_locator})[${i}]`).textContent();
        const marka_model_text = manufacturer_model_element?.trim();
        // Null kontrolünü burada yapıyoruz
        if (!marka_model_text) continue; // Eğer başlık yoksa bu bölümü atla

        const [manufacturer_name, model_name] = marka_model_text.split("»").map(p => p.trim());
        const rows_locator = `(//div[contains(@class, 'model-body')])[${i}]//tr`;
        const app_rows = await page.locator(rows_locator).all();
        const targets: OutputTarget[] = [];

        for (let j = 1; j <= app_rows.length; j++) {

            const madeYear = await page.locator(`${rows_locator}[${j}]//td[1]`).textContent() || "";
            const cc = await page.locator(`${rows_locator}[${j}]//td[2]`).textContent() || "";
            const engineCodes = await page.locator(`${rows_locator}[${j}]//td[3]`).textContent() || "";
            const engineType_body = await page.locator(`${rows_locator}[${j}]//td[4]`).textContent() || "";
            const years = await extractYears(madeYear, Locale.en_US);

            targets.push({
                engine: `${cc} | ${engineType_body}`, // Şablon string daha okunaklı
                fullName: marka_model_text,
                constructionYearFrom: years.start,
                constructionYearTo: years.end,
                enginePowerKW: "",
                enginePowerHP: "",
                cc: cc,
                engineCodes: engineCodes,
                kbaNumbers: "",
                bodyType: engineType_body,
                TecDocID: "",
            });
        }
        // Manufacturer ve ModelSeries objelerini doğru şekilde oluşturup ekler
        compatibilityVehicles.push({
            manufacturer: manufacturer_name,
            models: [{ modelSeries: model_name, targets: targets }]
        });
    }
    return compatibilityVehicles;
}

export async function JNBK_Compatibility(page: Page, reference: ProductReference): Promise<ProductCompatibilityResult | undefined> {

    const { yvNo, supplier, freeTextSearch: crossNumber } = reference;
    try {
        await navigateAndSearch(page, URL, crossNumber); // navigateAndSearch fonksiyonunu await ile çağırır

        const { productType, productID } = await extractProductTitle(page);
        // const specifications = await extractSpecifications(page);
        // const crossReferences = await extractCrossReferences(page);        

        const compatibilityVehicles = await extractCompatibilities(page);
        // Tek bir ProductCompatibilityResult objesi döndürün, çünkü processJNBKProducts flat() kullanacak.
        return { yvNo, crossNumber: productID, brand: supplier, compatibleVehicles: compatibilityVehicles };
    } catch (err) {

        console.error(`❌ ${crossNumber} için hata:`, err);
        return undefined; // Hata durumunda undefined döndürerek .filter((r) => r !== null) ile elenmesini sağlar
    }
}