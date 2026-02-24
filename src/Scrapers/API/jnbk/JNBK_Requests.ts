import { APIRequestContext, request } from "@playwright/test";
import { JNBK } from "../../../config/API_Scrapers_Data";
import { delay } from "../repxpert/helpers/API_Helpers";
import { ProductReference } from "../../../utils/Types";
import * as cheerio from 'cheerio';
import { processForCompatibilities, processForOE_Numbers, processForArticleAttributes } from "./JNBK_Processors";
export async function getProduct_URL(ref: ProductReference): Promise<{ product_id: string; currentUrl: string }> {

    const apiContext = await request.newContext();
    const { yvNo, supplier, freeTextSearch: jnbkNo } = ref;

    try {
        const response = await apiContext.post(JNBK.BASE_URI, {
            headers: {
                referer: JNBK.BASE_URI
            },
            form: {
                txtPartNo: jnbkNo,
                txtClass: "1",
                btnProductSearch: "Search",
            },
        });

        const bodyText = await response.text(); // response.body() yerine
        const $ = cheerio.load(bodyText);

        const productID = $("h2.search-title").text().split("»")[1].trim() || '';
        const currentUrl = $('input[name="currentUrl"]').val()?.toString() || '';
        //console.log(`Product ID: ${productID}`);
        console.log(`${yvNo} - ${jnbkNo} - Current URL: ${currentUrl}`);
        return { product_id: productID, currentUrl };
    } catch (err) {
        console.error(`❌ ${yvNo} - ${jnbkNo} - Product Info için hata:`, err);
        return { product_id: '', currentUrl: '' };
    } finally {
        await apiContext.dispose();
        await delay(300);
    }
}

export async function getRootBody(currentUrl: string, apiContext: APIRequestContext): Promise<cheerio.Root | null> {
    try {
        const response = await apiContext.post(currentUrl, { headers: { referer: JNBK.BASE_URI } });

        if (!response.ok()) {
            throw new Error(`API isteği başarısız oldu: ${response.status()} ${response.statusText()}`);
        }
        const bodyText = await response.text();
        const $ = cheerio.load(bodyText);
        return $;
    } catch (error) {
        console.error(`❌ HTML kökü alınamadı:`, error);
        return null;
    }
}

export async function getResults(ref: ProductReference) {
  const { yvNo, supplier, freeTextSearch } = ref;
  const apiContext = await request.newContext();

  try {
    const { product_id, currentUrl } = await getProduct_URL(ref);
    if (!currentUrl) throw new Error(`No URL for ${freeTextSearch}`);

    const $ = await getRootBody(currentUrl, apiContext);
    if (!$) throw new Error(`Empty HTML for ${freeTextSearch}`);

    const [compat, oe, attr] = await Promise.all([
      processForCompatibilities(freeTextSearch, $),
      processForOE_Numbers(freeTextSearch, $),
      processForArticleAttributes(freeTextSearch, $),
    ]);

    return [
      { yvNo, crossNumber: product_id, brand: supplier, compatibleVehicles: compat },
      { yvNo, supplier, crossNumber: freeTextSearch, oeNumbers: Array.from(oe, ([manufacturer, numbers]) => ({ manufacturer, numbers })) },
      { yvNo, supplier, crossNumber: freeTextSearch, attributes: attr },
    ];
  } catch (error: Error | any) {
    console.error(`❌ ${freeTextSearch} failed: ${error.message}`);
    return null;
  } finally {
    await apiContext.dispose();
    await delay(200);
  }
}