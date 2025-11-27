import { FILTER_BRAND, PRODUCT_TYPE } from "../../config/env";
import { PathRepo } from '../../config/PathRepo';
import { writeExcelSafe } from '../../io/utils/ExcelUtils';
import { readJSONSafe } from '../../io/utils/Json_Utils';
import { HORIZONTAL_OE_rowData } from "../../utils/Types";
import { normalize_OE } from "./Utils";



async function jsonToExcelHorizontal() {
    
    const jsonPath = PathRepo.output(`${PRODUCT_TYPE}/jsons/OE/oe-numbers_${FILTER_BRAND}.json`);
    const jsonData = await readJSONSafe(jsonPath);
    const rowData: HORIZONTAL_OE_rowData[] = [];

    for (const item of jsonData) {
        const yv = item.yvNo;
        const crossNo = item.crossNumber;

        const oe = item.oeNumbers.map((element: any) =>
            element.numbers.map((oe: string) =>
                oe)).join(", ");

        const oeNormalized = item.oeNumbers.map((element: any) =>
            element.numbers.map((oe: string) =>
                normalize_OE(oe))).join(", ");

        const markalar = Array.from(new Set<string>(item.oeNumbers.map((element: any) => element.manufacturer))).join(", ");

        rowData.push({
            YV: yv,
            "CROSS NO": crossNo,
            BRANDS: markalar,
            OE_Numbers: oe,
            NORMALIZED_OE_Numbers: oeNormalized
        });
    }

    const outputFilePath = PathRepo.output(`${PRODUCT_TYPE}/excels/OE/OE_Numbers_${FILTER_BRAND}_Yatay.xlsx`);
    await writeExcelSafe(outputFilePath, { name: "OE_Numbers", data: rowData });
    console.log(`${FILTER_BRAND} OE Numbers Excel dosyası oluşturuldu ==>> ${outputFilePath}`);
}


async function main() {
    await jsonToExcelHorizontal();
}

main();