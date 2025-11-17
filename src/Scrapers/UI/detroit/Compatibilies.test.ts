import { request, expect, test } from '@playwright/test';
import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import { parseCompatibilityYears } from '../kentpar/utils/YearExtracter';
import initialMarkaData from '../../../resources/catalog/jsons/MARKALAR.json';
import { brandAliases } from '../../api/resources/Variables';
import { modelDataMap } from '../../io/Utils';
import { PRODUCT_TYPE } from '../../../config/env';



type DetroitCompatibility = {
    DETROIT_NO: string;
    YV_NO: string;
    Year: string;
    From: string;
    To: string;
    'Brand ID': number | null;
    Make: string;
    "Model ID": number | string;
    Model: string;
    Submodel: string;
    BodyType: string;
    Note: string;
}

type DetroitProduct = {
    DETROIT_NO: string;
    YV_NO: string;
    URL: string;
}

const apiData: DetroitProduct[] = [
    {
        DETROIT_NO: '53012',
        YV_NO: '451135',
        URL: 'https://www.detroitaxle.com/part/brake_rotors-drums/front-brake-rotors-pair/r-53012x2/',
    },
    {
        DETROIT_NO: '55093',
        YV_NO: '531125',
        URL: 'https://www.detroitaxle.com/part/brake_rotors-drums/front-brake-rotors-pair/r-55093x2/',
    },
    {
        DETROIT_NO: '55094',
        YV_NO: '531126',
        URL: 'https://www.detroitaxle.com/part/brake_rotors-drums/rear-brake-rotors-pair/r-55094x2/',
    },
    {
        DETROIT_NO: '54111',
        YV_NO: '131130',
        URL: 'https://www.detroitaxle.com/part/brake_rotors-drums/rear-brake-rotors-pair/r-54111x2/',
    },
];

// Import Marka (Brand) data and store it in a map for easy lookup
const markaNameToIdMap = new Map<string, number>();
for (const [idString, name] of Object.entries(initialMarkaData)) {
    markaNameToIdMap.set(name.trim().toUpperCase(), parseInt(idString));
}

const TR_SELECTOR = '.table__row';
const CELL_SELECTOR = 'th.table__cell';

async function scrapeAPI(
    detroitProducts: DetroitProduct[] = apiData
): Promise<DetroitCompatibility[]> {
    console.log(`🚀 API Request ile TH verileri çekiliyor...`);
    const results: DetroitCompatibility[] = [];
    const apiContext = await request.newContext();

    for (const product of detroitProducts) {
        console.log(`🔍 Processing DETROIT_NO: ${product.DETROIT_NO}, YV_NO: ${product.YV_NO}`);
        const response = await apiContext.get(product.URL);

        if (!response.ok()) {
            console.error(`🚨 HATA: İstek başarısız oldu! Durum Kodu: ${response.status()}`);
            return [];
        }

        const responseHTML = await response.text();
        const $ = cheerio.load(responseHTML);

        const trList = $(TR_SELECTOR);

        // Cheerio koleksiyonu üzerinde .each() döngüsü
        trList.each((index, element) => {
            const tr = $(element);

            // Sadece TH etiketlerini buluyoruz
            const thList = tr.find(CELL_SELECTOR);

            // En az 6 sütun bekliyoruz
            if (thList.length >= 6) {
                if (thList.eq(0).text().trim() === 'Year') return;
                const make = thList.eq(1).text().trim().toUpperCase();
                const model = thList.eq(2).text().trim().toUpperCase();
                results.push({
                    DETROIT_NO: product.DETROIT_NO,
                    YV_NO: product.YV_NO,
                    'Brand ID':
                        markaNameToIdMap.get(thList.eq(1).text().trim().toUpperCase()) ||
                        markaNameToIdMap.get(brandAliases.get(thList.eq(1).text().trim().toUpperCase()) as string) || null,
                    Make: thList.eq(1).text().trim(),
                    "Model ID": modelDataMap.get(`${brandAliases.get(make)}_${model}`)?.id || modelDataMap.get(`${(make)}_${model}`)?.id || "",
                    Model: thList.eq(2).text().trim(),
                    Submodel: thList.eq(3).text().trim(),
                    BodyType: thList.eq(4).text().trim(),
                    Year: thList.eq(0).text().trim(),
                    From: parseCompatibilityYears(thList.eq(0).text().trim()).startYear || '',
                    To: parseCompatibilityYears(thList.eq(0).text().trim()).endYear || '',
                    Note: thList.eq(5).text().trim(),
                });
            }
        });
    }

    // Veri temizleme adımı: Başlık satırlarını veya boş satırları atla
    const filteredResults = results.filter(
        (item) => item.Year !== '' && item.Make !== ''
    );
    fs.writeFileSync(path.resolve(__dirname, `../../../output/${PRODUCT_TYPE}/jsons/Vehicle-Compatibility/Detroit_compatibilities.json`),
        JSON.stringify(filteredResults, null, 2)
    );
    return filteredResults;
}

// Playwright test runner ile çalıştır
test('API Request: Scrape compatibility table data with TH selector', async () => {
    const data: DetroitCompatibility[] = await scrapeAPI();
    expect(data.length).toBeGreaterThan(0);

    // write data to excel
    const outputFilePath = path.resolve(__dirname, `../../../output/${PRODUCT_TYPE}/excels/Vehicle-Compatibility/Detroit-compatibilities.xlsx`);
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    await xlsx.writeFile(workbook, outputFilePath);
});

// Eğer sayfa dinamik yükleniyorsa ve bu API requestinde veriler gelmiyorsa,
// (ki API request ile tam HTML gelmeli) mecburen UI (page.goto) kullanırız.
// Ama şu an TH selector'ı ile bu sorunu çözdük.
