import path from "path";
import xlsx from "xlsx";
import fs from 'fs'
import dotenv from 'dotenv';
import initialMarkaData from '../resources/data/catalogInfo/jsons/marka_trimmed.json';


dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

interface OE_rowData {
    YV: string;
    "CROSS NO": string;
    "MARKA ID": string;
    MANUFACTURER: string;
    OE: string;
}

const jsonPath = path.resolve(__dirname, `../output/${productType}/jsons/OE/oe-numbers_${filterBrand}.json`);
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const rowData: OE_rowData[] = [];
const processedYVNUmbers: string[] = []

// Import Marka and Model data
const markaNameToIdMap = new Map<string, string>();
for (const [id, name] of Object.entries(initialMarkaData)) {
    markaNameToIdMap.set(name.trim().toUpperCase(), id);
}

const rowKeys: string[] = [];

for (const element of jsonData) {

    //if (processedYVNUmbers.includes(element.yvNo)) continue;
    //processedYVNUmbers.push(element.yvNo);

    const elementOE_numbers: string[] = element.oeNumbers.map((item: { numbers: string; }) => item.numbers).flat();

    for (const oe_numbers of element.oeNumbers) {

        const markaId = markaNameToIdMap.get(oe_numbers.manufacturer.toUpperCase()) || "";



        if (markaId) {
            for (const oe of oe_numbers.numbers) {
                const key = `${element.yvNo}|${oe_numbers.manufacturer}|${oe}`;
                if (rowKeys.includes(key)) continue;
                rowKeys.push(key);
                rowData.push({
                    YV: element.yvNo,
                    "CROSS NO": element.crossNumber,
                    "MARKA ID": markaId,
                    MANUFACTURER: oe_numbers.manufacturer,
                    OE: "|".concat(oe)
                });
            }
        } else {
            for (const oe of oe_numbers.numbers) {
                if (elementOE_numbers.map(item => item.replace(/[^a-zA-Z0-9]/g, '')).filter(item => item.match(oe.replace(/[^a-zA-Z0-9]/g, ''))).length === 1) {   // if oe number is unique and the other monufacturer's doesn't have it
                    rowData.push({
                        YV: element.yvNo,
                        "CROSS NO": element.crossNumber,
                        "MARKA ID": "",
                        MANUFACTURER: oe_numbers.manufacturer,
                        OE: "|".concat(oe)
                    });
                }
            }
        }
    }

}

const outputFilePath = `../output/${productType}/excels/OE/OE_Numbers_${filterBrand}-multiCrossed.xlsx`;
const headers = Object.keys(rowData[0]);
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(rowData, { header: headers });
xlsx.utils.book_append_sheet(wb, ws, "OE_Numbers");
xlsx.writeFile(wb, path.resolve(__dirname, outputFilePath));
console.log(`${filterBrand} OE Numbers Excel dosyası oluşturuldu: ${path.resolve(__dirname, `../output/${productType}/excels/OE_Numbers_${filterBrand}-trimmed.xlsx`)}`);
