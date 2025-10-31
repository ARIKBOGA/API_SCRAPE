import { request, expect, test } from '@playwright/test';
import * as cheerio from 'cheerio'; 
import path from 'path';
import xlsx from 'xlsx';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const PRODUCT_TYPE = process.env.PRODUCT_TYPE as string;

interface CarData {
    DETROIT_NO: string;
    YV_NO: string;
    Year: string;
    Make: string;
    Model: string;
    Submodel: string;
    BodyType: string;
    Note: string;
}

const DETROIT_NO = "53012";
const YV_NO = "431135";
const TARGET_URL = 'https://www.detroitaxle.com/part/brake_rotors-drums/front-brake-rotors-pair/r-53012x2/';
const TR_SELECTOR = ".table__row";
// 🔑 DÜZELTME: Veriler TH etiketi içinde olduğu için selector'ı TH olarak belirliyoruz.
const CELL_SELECTOR = "th.table__cell"; 

async function scrapeAPI() {
    
    console.log(`🚀 API Request ile TH verileri çekiliyor...`);
    
    const apiContext = await request.newContext();
    const response = await apiContext.get(TARGET_URL);

    if (!response.ok()) {
        console.error(`🚨 HATA: İstek başarısız oldu! Durum Kodu: ${response.status()}`);
        return [];
    }

    const responseHTML = await response.text();
    const $ = cheerio.load(responseHTML);

    const results: CarData[] = [];
    
    const trList = $(TR_SELECTOR);

    // Cheerio koleksiyonu üzerinde .each() döngüsü
    trList.each((index, element) => {
        const tr = $(element);
        
        // Sadece TH etiketlerini buluyoruz
        const thList = tr.find(CELL_SELECTOR); 

        // En az 6 sütun bekliyoruz
        if (thList.length >= 6) {
            if(thList.eq(0).text().trim() === 'Year') return;
            results.push({
                DETROIT_NO: DETROIT_NO,
                YV_NO: YV_NO,
                Year: thList.eq(0).text().trim(),
                Make: thList.eq(1).text().trim(),
                Model: thList.eq(2).text().trim(),
                Submodel: thList.eq(3).text().trim(),
                BodyType: thList.eq(4).text().trim(),
                Note: thList.eq(5).text().trim(),
            });
        }
    });
    
    // Veri temizleme adımı: Başlık satırlarını veya boş satırları atla
    const filteredResults = results.filter(item => item.Year !== '' && item.Make !== '');

    return filteredResults;
}

// Playwright test runner ile çalıştır
test('API Request: Scrape compatibility table data with TH selector', async () => {
    const data: CarData[] = await scrapeAPI();
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