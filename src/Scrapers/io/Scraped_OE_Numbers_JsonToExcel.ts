import { FILTER_BRAND, PRODUCT_TYPE } from "../../config/env";
import { PathRepo } from "../../config/PathRepo";
import { writeExcelSafe } from "../../io/utils/ExcelUtils";
import { OE_rowData } from "../../utils/Types";
import { brandAliases } from "../api/resources/Variables";
import { markaNameToIdMap, normalize_OE } from "./Utils";



export async function scraped_OE_Numbers_JsonToExcel(results: any[]) {

    const rowData: OE_rowData[] = [];

    const rowKeys: string[] = [];
    const oe_numbersPairedSomeMarka_ID: string[] = [];
    const oe_numbersWithoutMarka_ID: string[] = [];

    for (const element of results) {

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

    const outputFilePath = PathRepo.output(`${PRODUCT_TYPE}/excels/OE/OE_Numbers_${FILTER_BRAND}.xlsx`);

    await writeExcelSafe(outputFilePath, { name: 'OE_Numbers', data: rowData });
    console.log(`${FILTER_BRAND} OE Numbers Excel dosyası oluşturuldu ==>> ${outputFilePath}`);
}
