import path from "path";
import xlsx from "xlsx";
import fs from 'fs'
import dotenv from 'dotenv';


dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

interface OE_rowData {
    YV: string;
    "CROSS NO": string;
    MANUFACTURER: string;
    OE: string;
}

const jsonPath = path.resolve(__dirname, `../output/${productType}/jsons/OE/oe-numbers_${filterBrand}.json`);
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const rowData : OE_rowData[] = [];

for (const element of jsonData) {
    for(const oe_numbers of element.oeNumbers){
        for(const oe of oe_numbers.numbers){
            rowData.push({
                YV: element.yvNo,
                "CROSS NO": element.crossNumber,
                MANUFACTURER: oe_numbers.manufacturer,
                OE: "|".concat(oe)
            });
        }
    }
}

const outputFilePath =  `../output/${productType}/excels/OE/OE_Numbers_${filterBrand}.xlsx`;
const headers = Object.keys(rowData[0]);
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(rowData, { header: headers });
xlsx.utils.book_append_sheet(wb, ws, "OE_Numbers");
xlsx.writeFile(wb, path.resolve(__dirname, outputFilePath));
console.log(`${filterBrand} OE Numbers Excel dosyası oluşturuldu: ${path.resolve(__dirname, `../output/${productType}/excels/OE_Numbers_${filterBrand}.xlsx`)}`);
