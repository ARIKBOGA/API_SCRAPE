import path from "path";
import xlsx from "xlsx";
import fs from 'fs'
import dotenv from 'dotenv';
import initialMarkaData from '../../resources/data/catalogInfo/jsons/marka_catalog.json';
import { brandAliases } from "../../utils/Variables";
import { normalize_OE } from "../../utils/Utility";


dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

interface OE_rowData {
    YV: string;
    "CROSS NO": string;
    "MARKA ID": number | string;
    MANUFACTURER: string;
    OE: string;
}

const jsonPath = path.resolve(__dirname, `../../output/${productType}/jsons/OE/oe-numbers_${filterBrand}.json`);
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const rowData: OE_rowData[] = [];

// Import Marka (Brand) data and store it in a map for easy lookup
const markaNameToIdMap = new Map<string, number>();
for (const [idString, name] of Object.entries(initialMarkaData)) {
    markaNameToIdMap.set(name.trim().toUpperCase(), parseInt(idString));
}

const rowKeys: string[] = [];
const oe_numbersPairedSomeMarka_ID: string[] = [];
const oe_numbersWithoutMarka_ID: string[] = [];

for (const element of jsonData) {

    for (const oe_element of element.oeNumbers) {

        const markaId = markaNameToIdMap.get(oe_element.manufacturer.toUpperCase()) ||
            markaNameToIdMap.get(brandAliases.get(oe_element.manufacturer.toUpperCase()) as string) || null;

        if (markaId) {
            for (const oe of oe_element.numbers) {
                const normalized_OE = normalize_OE(oe);
                const key = `${element.yvNo}|${oe_element.manufacturer}|${oe}`;
                if (rowKeys.includes(key)) continue;
                rowKeys.push(key);
                oe_numbersPairedSomeMarka_ID.push(normalized_OE);
                rowData.push({
                    YV: element.yvNo,
                    "CROSS NO": element.crossNumber,
                    "MARKA ID": markaId,
                    MANUFACTURER: oe_element.manufacturer,
                    OE: "|".concat(oe)
                });
            }
        }
    }

    for (const oe_element of element.oeNumbers) {

        const markaId = markaNameToIdMap.get(oe_element.manufacturer.toUpperCase()) ||
            markaNameToIdMap.get(brandAliases.get(oe_element.manufacturer.toUpperCase()) as string) || null;

        if (!markaId) {
            for (const oe of oe_element.numbers) {
                const normalized_OE = normalize_OE(oe);
                if (!oe_numbersPairedSomeMarka_ID.includes(normalized_OE) && !oe_numbersWithoutMarka_ID.includes(normalized_OE)) {   // if oe number is unique and the other monufacturer's doesn't have it
                    oe_numbersWithoutMarka_ID.push(normalized_OE);
                    rowData.push({
                        YV: element.yvNo,
                        "CROSS NO": element.crossNumber,
                        "MARKA ID": "",
                        MANUFACTURER: oe_element.manufacturer,
                        OE: "|".concat(oe)
                    });
                }
            }
        }
    }

}

const outputFilePath = path.resolve(__dirname, `../../output/${productType}/excels/OE/OE_Numbers_${filterBrand}.xlsx`);
const headers = Object.keys(rowData[0]);
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(rowData, { header: headers });
xlsx.utils.book_append_sheet(wb, ws, "OE_Numbers");
xlsx.writeFile(wb, path.resolve(__dirname, outputFilePath));
console.log(`${filterBrand} OE Numbers Excel dosyası oluşturuldu ==>> ${outputFilePath}`);
