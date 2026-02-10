import { test } from '@playwright/test';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { get_YV_OE_Map } from '../../../io/utils/ORJ_NO_Utils';


type PriceScraperResult = {
  brand: string;
  brandNumber: string;
  discountedPrice: string;
  sellingPrice: string;
};

const baseUrl = 'https://shate-mag.by/';

test.describe('Shate Mag Price Scraper', () => {

  test('Scrape prices', async ({ request }) => {

    const dummyMap = new Map<string, string[]>();
    dummyMap.set('24830', ['A2464230112']);

    const catalogMap = await get_YV_OE_Map();
    console.log('Catalog Map Size:', catalogMap.size);

    for (const [yv, oeNumbers] of dummyMap.entries()) {

      for (const oeNumber of oeNumbers) {

        const requestURL = `${baseUrl}search?pcode=${oeNumber}`;
        const responseHTML = await (await request.get(requestURL)).text();
        const $ = cheerio.load(responseHTML);

        const arr: PriceScraperResult[] = [];

        $('.resultTr2Route').each((_, element) => {
          arr.push({
            brand: $(element).find('td.resultBrand > div > a').text().trim(),
            brandNumber: $(element).find('td.resultBrandNumber > div > a').text().trim(),
            discountedPrice: $(element).find('td.resultPrice').text().trim(),
            sellingPrice: $(element).find('td.resultRetailPrice').text().trim(),
          });
        });

        console.log(`Results for OE Number: ${oeNumber}`, arr);
        await fs.promises.appendFile(
          'ShateMag_PriceResults.jsonl',
          JSON.stringify({ yv, oeNumber, results: arr }, null, 2) + ',\n',
          'utf-8'
        )

        break; // Process only the first OE number for each YV
      }
    }
  });
});
