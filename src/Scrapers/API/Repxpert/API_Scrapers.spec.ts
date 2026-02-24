import { APIRequestContext, expect, request, test } from '@playwright/test';
import path from 'path';
import { REPXPERT } from '../../../config/API_Scrapers_Data';
import { FILTER_BRAND, PRODUCT_TYPE } from '../../../config/env';
import { writeJSONSafe } from '../../../io/utils/Json_Utils';
import { ProductReference } from '../../../utils/Types';
import { scraped_Attributes_JsonToExcel } from '../../io/Scraped_Attributes_JsonToExcel';
import { scraped_Compatibilities_JsonToExcel } from '../../io/Scraped_CompatibilitiesJsonToExcel';
import { scraped_OE_Numbers_JsonToExcel } from '../../io/Scraped_OE_Numbers_JsonToExcel';
import { referenceArray } from '../resources/Variables';
import { processProductFor_CrossNumbers, processProductFor_OE, processProductFor_VehicleCompatibility, processProductForArticleAttributes } from './helpers/API_Functions';
import { getAuthHeaders, getEncryptedSearchCode } from './helpers/API_Helpers';

const start = 0;
const end: number = 0; // Set to 0 to process all products, or specify a number to limit the processing
const endCalc = end === 0 ? referenceArray.length : end;

async function processProducts(
  processFunction: (productRef: ProductReference, apiContext: APIRequestContext ) => Promise<any>,
  output_filename: string,
  threadLimit: number,
  processName: string,
) {
  const { default: pLimit } = await import('p-limit');
  const limit = pLimit(threadLimit);
  const apiContext = await request.newContext();

  const results = (
    await Promise.all(
      referenceArray
        .filter((productRef) => productRef.freeTextSearch.trim() !== '')
        //.slice(start, endCalc)
        .map((productRef) =>
          limit(() => processFunction(productRef, apiContext))
        )
    )
  ).filter((r) => r !== null);

  const outputDir = path.resolve(`src/output/${PRODUCT_TYPE}/jsons/${processName}`,);

  await writeJSONSafe(`${outputDir}/${output_filename}`, results);

  // Log the processing summary
  const total = referenceArray.slice(start, endCalc)
                              .filter((productRef) => productRef.freeTextSearch.trim() !== '').length;
  const success = results.length;
  console.log(`✅ Processed ${success}/${total} successfully (${((success / total) * 100).toFixed(2)}%)`,);

  await apiContext.dispose();

  return results;
}

test.describe('The suit of the main scraping branches from Rpexpert', () => {
  
  test('Get OE numbers for all products', async () => {
    test.setTimeout(20 * 60 * 1000);
    console.log(`Processing OE numbers for brand: ${FILTER_BRAND}`);
    const results = await processProducts(processProductFor_OE,`oe-numbers_${FILTER_BRAND}.json`, 4, 'OE');
    await scraped_OE_Numbers_JsonToExcel(results, start, endCalc);
  });

  test('Get Vehicle Compatibility for all products', async () => {
    test.setTimeout(20 * 60 * 1000);
    console.log(`Processing Vehicle Compatibility for brand: ${FILTER_BRAND}`);
    const results = await processProducts( processProductFor_VehicleCompatibility, `Vehicle-Compatibility_${FILTER_BRAND}_${start}_${endCalc}.json`, 1, 'Vehicle-Compatibility');
    await scraped_Compatibilities_JsonToExcel(results);
  });

  test('Get Article Attributes of the products', async () => {
    test.setTimeout(10 * 60 * 1000);
    console.log(`Processing Article Attributes for : ${PRODUCT_TYPE} - ${FILTER_BRAND}`);
    const results = await processProducts( processProductForArticleAttributes, `Attributes_${PRODUCT_TYPE}_${FILTER_BRAND}.json`, 5, 'Attributes');
    await scraped_Attributes_JsonToExcel(results);
  });
  
});

test('Get cross numbers via given cross/OE numbers', async () => {
  test.setTimeout(20 * 60 * 1000);
  console.log(`Processing Cross Numbers for brand: ${FILTER_BRAND}`);
  await processProducts(processProductFor_CrossNumbers, `Cross-Numbers_${PRODUCT_TYPE}_${FILTER_BRAND}_${start}_${endCalc}.json`, 5, 'Cross-Numbers');
});

test('Get token only', async ({ request }) => {
  const requestBody = new URLSearchParams(REPXPERT.tokenRequest.body);
  const tokenHeaders = REPXPERT.tokenRequest.headers;
  const URL = REPXPERT.tokenRequest.URL;

  const response = await request.post(URL, {
    headers: tokenHeaders,
    data: requestBody.toString(),
  });

  const data = await response.json();

  expect(data.access_token).toBeTruthy();
  
  const encryptedCode = await getEncryptedSearchCode('SDB500182', 'BREMBO', request);
  console.log(data?.access_token);
  console.log('Encrypted Code:', encryptedCode);
});

test('Get only ICER products WVA numbers', async ({ request }) => {

  for (const ref of referenceArray) {

    const { yvNo, supplier, freeTextSearch: crossNumber } = ref;
    const searchCode = await getEncryptedSearchCode(crossNumber, supplier, request);
    const response = await request.get(`https://www.repxpert.co.uk/api/Repxpert-GB/products/${searchCode}`, { 
      headers: await getAuthHeaders() 
    });
    const data = await response.json();

    const tradeNumbers: string[] = data.tradeNumbers.filter( (tn: string) => !tn.includes('-'));
    console.log(`YV: ${yvNo}, Brand: ${supplier}, Cross Number: ${crossNumber}, Trade Numbers: ${tradeNumbers}`);
  }
});
