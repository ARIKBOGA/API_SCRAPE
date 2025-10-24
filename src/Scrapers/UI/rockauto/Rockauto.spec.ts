import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Reference, Result } from './rockauto_utils/DataTypes';
import { ProductTypeCodes, referenceArray } from './rockauto_utils/Variables';
import { readCrossNumbersOfManufacturers } from './rockauto_utils/ExcelReader';

// NOTE: Check the Results.json file extension before run the test. It should be ".jsonl" for appending results line by line.

const OUTPUT_DIR = path.resolve(__dirname, `output/jsons/`);

const manufacturerFilter = "RAYBESTOS";
const crossNumbers = readCrossNumbersOfManufacturers(manufacturerFilter);
const singleCrossNumber: Reference[] = [{ manufacturer: "RAYBESTOS", crossNumber: "9764" }];

const sliceNumbers = [500, 1000];

test.describe("Rockauto OE number Scraping", async () => {

    test.setTimeout(3 * 60 * 60 * 1000);

    //crossNumbers
    Array.from(new Set(referenceArray))
        //singleCrossNumber
        .filter(each => each !== undefined)
        .slice(sliceNumbers[0], sliceNumbers[1])
        .forEach(cross => {

            test(`Get OE numbers of: ${cross}`, async ({ page }) => {
                const results: Result[] = []

                for (const productType of [ProductTypeCodes.Disc, ProductTypeCodes.Drum]) {
                    await page.goto(`https://www.rockauto.com/en/parts/${manufacturerFilter.toLowerCase()},${cross},rotor,${productType}`, { waitUntil: 'networkidle' });
                    await page.waitForTimeout(1000);

                    const productLink = page.getByRole('link', { name: 'Info' }).first();
                    if (await productLink.isVisible()) {

                        // get product number from the found link
                        const description = await page.locator('.listing-final-partnumber').first().innerText();

                        const [page1] = await Promise.all([
                            page.context().waitForEvent('page'),
                            productLink.click()
                        ]);

                        await page1.waitForTimeout(2000);
                        const oeNumbersElement = page1.locator("//section[starts-with(.,'OEM / Interchange Numbers:')]");
                        if (await oeNumbersElement.isVisible({ timeout: 3000 })) {
                            const oeNumbers = await oeNumbersElement.evaluate((section) => {
                                const text = section.textContent || '';
                                return text.replace('OEM / Interchange Numbers:', '').split(',').map(num => num.trim());
                            });

                            results.push({
                                freeTextSearch: cross,
                                foundSupplierNumber: description,
                                oeNumbers: oeNumbers
                            });

                        } else {
                            console.warn(`OEM / Interchange Numbers section not found for cross number: ${cross}. Skipping...`);
                        }
                        await page1.close();
                        break;
                    }
                }
                // !!! Don't forget to change the extension of the Results.json file as ".jsonl" before run the test !!!
                await fs.promises.appendFile(path.join(OUTPUT_DIR, `Results.jsonl`), JSON.stringify(results, null, 2) + ',\n', 'utf-8');
                await page.close();
            });
        })
})