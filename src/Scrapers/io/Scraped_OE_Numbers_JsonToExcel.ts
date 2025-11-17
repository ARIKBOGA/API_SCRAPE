import path from "path";
import xlsx from "xlsx";
import fs from 'fs'

import { brandAliases } from "../api/resources/Variables";
import { normalize_OE } from "../../utils/Utility";
import { markaNameToIdMap } from "./Utils";
import { FILTER_BRAND, PRODUCT_TYPE } from "../../config/env";
import { OE_rowData } from "../../utils/Types";





export async function scraped_OE_Numbers_JsonToExcel() {

    const jsonPath = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/jsons/OE/oe-numbers_${FILTER_BRAND}.json`);
    const jsonData = await JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const rowData: OE_rowData[] = [];



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

    const outputFilePath = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/excels/OE/OE_Numbers_${FILTER_BRAND}.xlsx`);
    const headers = Object.keys(rowData[0]);
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rowData, { header: headers });
    xlsx.utils.book_append_sheet(wb, ws, "OE_Numbers");
    await xlsx.writeFile(wb, path.resolve(__dirname, outputFilePath));
    console.log(`${FILTER_BRAND} OE Numbers Excel dosyası oluşturuldu ==>> ${outputFilePath}`);
}


function main() {
    scraped_OE_Numbers_JsonToExcel();
}

main();