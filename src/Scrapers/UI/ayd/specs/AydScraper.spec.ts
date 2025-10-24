import {  test } from '@playwright/test';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { baseURL } from '../config/Variables';

const OUTPUT_DIR = path.resolve(__dirname, '../output/jsons/')


const totalPages = 50;
const groupNo = 10;

test.describe("AYD SCRAPER with Cheerio parser via UI", () => {
    const productLinks: string[] = [];
    for (let i = 1; i <= totalPages; i++) {

        test(`AYD SCRAPER - Page ${i}`, async ({ request }) => {
            const response = await request.get(`${baseURL}/products?groups=${groupNo}&page=${i}`);
            const body = await response.text();
            const $ = cheerio.load(body);

            console.log($('.productList > .pItem').length);

            $('.productList > .pItem').each((index, element) => {
                const link = $(element).find('a').attr('href')
                link && productLinks.push(link);
            })
            
            fs.promises.appendFile(`${OUTPUT_DIR}/ProductLinks.jsonl`, productLinks.map(link => JSON.stringify({ link })).join(',\n') + ',\n');
        });
    }
})