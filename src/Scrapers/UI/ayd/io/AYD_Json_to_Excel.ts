import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import { baseURL } from '../config/Variables';

const inputFilePath = path.resolve(__dirname, '../output/jsons/ProductLinks.json');
const outputFilePath = path.resolve(__dirname, '../output/excels/AYD_Product_Links.xlsx');

const data = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));

const rows = data.map((row: any) => {
    return {
        Link: baseURL +  row.link,
        AYD_NO: row.link.replace('/products/', '').trim()
    }
})

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(rows);
xlsx.utils.book_append_sheet(wb, ws, 'ProductLinks');
xlsx.writeFile(wb, outputFilePath);