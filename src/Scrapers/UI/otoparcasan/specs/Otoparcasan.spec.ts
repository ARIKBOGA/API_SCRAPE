import {  expect, test } from '@playwright/test';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(__dirname, '../output/jsons/')
const tokenURL = "https://otoparcasan.com/Ajax/getCsrf/";
const tokenHeaders = {
        "Cookie": "csrf_ops_cookie=f7918ebd895328897fb0ee510d3a95a0; otoparcasan_session=l94nm4d3kr8ibodaco1um90rbkj4ol33"
        // Playwright fetch/request metotları genellikle Content-Type gibi diğer standart header'ları
        // otomatik yönetir. Ekstra header gerekirse buraya eklenmeli.
    };
const baseURL = "https://otoparcasan.com.tr/otomobil-yedek-parca";
test.describe("Otoparcasan SCRAPER with Cheerio parser via UI", () => {

    test('Otoparcasan SCRAPER - Sample Test', async ({ request }) => {
        
        const tokenResponse = await request.post(tokenURL, {
            headers: tokenHeaders
        });
        //const tokenBody = await tokenResponse.json();
        
        console.log(`CSRF Token: ${tokenResponse.json()}`);
    });
});



test('CSRF token alma API isteği', async ({ request }) => {
    // API isteği için URL
    const url = "https://otoparcasan.com/Ajax/getCsrf/";

    // Headers objesi
    const headers = {
        "Cookie": "csrf_ops_cookie=f7918ebd895328897fb0ee510d3a95a0; otoparcasan_session=l94nm4d3kr8ibodaco1um90rbkj4ol33"
        // Playwright fetch/request metotları genellikle Content-Type gibi diğer standart header'ları
        // otomatik yönetir. Ekstra header gerekirse buraya eklenmeli.
    };

    try {
        // Playwright'ın 'request' objesi ile GET isteği yapma
        // Bu, Node.js'teki 'fetch'in Playwright karşılığıdır.
        const response = await request.get(url, {
            headers: headers
            // redirect: "follow" Playwright request'lerde varsayılan davranıştır.
        });

        // Yanıtın başarılı (200-299 aralığında) olduğundan emin olma
        await expect(response.ok()).toBeTruthy();

        // Yanıt gövdesini (body) metin olarak alma
        const resultText = await response.text();
        
        // Yanıtı konsola yazdırma
        console.log(`API Yanıtı: ${resultText}`);

        // JSON dönmesi bekleniyorsa, yanıtı JSON olarak alıp bir doğrulama yapılabilir
        // try {
        //     const resultJson = await response.json();
        //     console.log('JSON olarak: ', resultJson);
        //     // Örneğin: CSRF token'ın boş olmadığını kontrol etme
        //     // expect(resultJson.csrf_token).toBeDefined(); 
        // } catch (e) {
        //     console.warn('Yanıt JSON formatında değil veya parse edilemedi.');
        // }


    } catch (error) {
        // Hata yakalama
        console.error("API isteği sırasında bir hata oluştu:", error);
        // Testin başarısız olması için hata fırlatma
        throw error; 
    }
});