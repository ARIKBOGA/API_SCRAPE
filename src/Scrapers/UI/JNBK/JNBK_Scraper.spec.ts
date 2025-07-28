import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { OutputManufacturer, OutputModelSeries, OutputTarget, ProductCompatibilityResult, ProductReference } from '../../../utils/Types';
import { referenceArray } from '../../../utils/Variables';
import { extractYears } from '../../../utils/Utility';
import { Locale } from 'locale-enum';



const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

async function processJNBKProducts(page: Page, processFunction: Function, fileName: string, threadLimit: number, processFor: string) {
  //const productReferences = readProductReferencesFromExcel();

  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(threadLimit);

  console.log(referenceArray.length);

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
      .map((productRef) => limit(() => processFunction(page, productRef)))
  )).filter((r) => r !== null).flat();

  const outputDir = path.resolve(`src/output/${productType}/jsons/${processFor}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(results, null, 2), "utf8");
}

test("JNBK scrapers with parellel threads", async ({ page }) => {
    test.setTimeout(20 * 60 * 1000);
    console.log(`Processing OE numbers for brand: ${filterBrand}`);
    await processJNBKProducts(page, JNBK_Compatibility, `Vehicle-Compatibility_${filterBrand}.json`, 1, "Vehicle-Compatibility");

})

export async function JNBK_Compatibility(page: Page, reference: ProductReference): Promise<ProductCompatibilityResult[] | undefined> {
    const { yvNo, supplier, crossNumber } = reference;
   
    try {

        // Search results sayfasına git
        await page.goto(process.env.JNKB_BRAKES_URL as string);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000); // Sayfanın yüklenmesini bekle
        await page.getByRole('textbox', { name: 'Enter OEM, NiBK, WVA, FMSI or' }).waitFor(); // Arama çubuğunun yüklendiğinden emin olmak için bekle
        const searchInput = page.getByRole('textbox', { name: 'Enter OEM, NiBK, WVA, FMSI or' });
        await searchInput.fill(crossNumber); // OE numarasını arama çubuğuna yaz
        await page.getByRole('button', { name: 'Search' }).click(); // Arama butonuna tıkla

        //await page.pause(); // Arama sonuçlarının yüklenmesini bekle


        await page.waitForTimeout(2000); // Arama sonuçlarının yüklenmesini bekle
        await page.waitForLoadState('domcontentloaded'); // Sayfanın yüklenmesini bekle
        await page.locator('#divImgCrossSpec').getByText('Specification').waitFor(); // Ürün detaylarının yüklendiğinden emin olmak için bekle

        const productTitle = await page.locator("//*[@id='msg']/following-sibling::div//h2").textContent();
        console.log(`Ürün Başlığı: ${productTitle}`);

        let productType = "";
        let productID = "";

        if (productTitle && productTitle.includes("»")) {
            const parts = productTitle.split("»").map(p => p.trim());
            productType = parts[0]; // ROTOR DISC
            productID = parts[1];   // RN2264V
        } else {
            const words = productTitle ? productTitle.trim().split(" ") : [];
            productType = words.slice(0, -1).join(" ");
            productID = words.length > 0 ? words[words.length - 1] : "";
        }

        // Application Gatheiring process
        const compatibilityResults: ProductCompatibilityResult[] = [];
        const compatibilityVehicles: OutputManufacturer[] = [];
        

        const manufacturer_model_locator = "//div[contains(@class, 'model-title')]";  // çoklu locating, dizi döndürür
        const manufacturer_models = page.locator(manufacturer_model_locator);
        const manufacturer_model_count = await manufacturer_models.count();

        // Compatibilities bölümündeki açılır-kapanır menüleri tek tek aç ve kapat
        for (let i = 1; i <= manufacturer_model_count; i++) {

            const manufacturer_model_element = await page.locator(`(${manufacturer_model_locator})[${i}]`).textContent();
            const marka_model_text = manufacturer_model_element?.trim();
            const manufacturer_name = marka_model_text?.split("»")[0].trim() || "";
            const model_name = marka_model_text?.split("»")[1].trim() || "";

            const rows_locator = `(//div[contains(@class, 'model-body')])[${i}]//tr`; // Mosulu locate et
            const app_rows = await page.locator(rows_locator).all();

            const targets: OutputTarget[] = [];

            // Her satırı dönerek verileri "target" nesnesi olarak "targets" dizisine ekle
            for (let j = 1; j <= app_rows.length; j++) {

                const madeYear = await page.locator(`${rows_locator}[${j}]//td[1]`).textContent() || "";
                const cc = await page.locator(`${rows_locator}[${j}]//td[2]`).textContent() || "";
                const engineCodes = await page.locator(`${rows_locator}[${j}]//td[3]`).textContent() || "";
                const engineType_body = await page.locator(`${rows_locator}[${j}]//td[4]`).textContent() || "";
                const years = await extractYears(madeYear, Locale.en_US);

                targets.push({
                    engine: cc + " | " + engineType_body, // Genelde 'engine' alanına karşılık gelir
                    fullName: marka_model_text || "",// Excel'e yazılmayacak olsa da, veride bu alan olabilir
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

            const manufacturers: OutputManufacturer[] = [];
            const modelSeries: OutputModelSeries[] = [];

            modelSeries.push({ modelSeries: model_name, targets: targets });
            manufacturers.push({ manufacturer: manufacturer_name, models: modelSeries });
            compatibilityVehicles.push(...manufacturers);

            
        }
        
        compatibilityResults.push({ yvNo, crossNumber, brand: supplier, compatibleVehicles: compatibilityVehicles });
        return compatibilityResults;

    } catch (err) {
        console.error(`❌ ${crossNumber} için hata:`, err);
    }
}