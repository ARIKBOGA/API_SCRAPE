import path from "path";
import xlsx from "xlsx";
import fs from 'fs'
import { normalize_OE } from "./Utils";
import { FILTER_BRAND, PRODUCT_TYPE } from "../../config/env";
import { HORIZONTAL_OE_rowData } from "../../utils/Types";



function jsonToExcelHorizontal() {
    const jsonPath = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/jsons/OE/oe-numbers_${FILTER_BRAND}.json`);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const rowData: HORIZONTAL_OE_rowData[] = [];

    for (const item of jsonData) {
        const yv = item.yvNo;
        const crossNo = item.crossNumber;
        const oe = item.oeNumbers.map((element: any) => element.numbers.map((oe: string) => oe)).join(", ");
        const oeNormalized = item.oeNumbers.map((element: any) => element.numbers.map((oe: string) => normalize_OE(oe))).join(", ");
        const markalar = Array.from(new Set<string>(item.oeNumbers.map((element: any) => element.manufacturer))).join(", ");

        rowData.push({
            YV: yv,
            "CROSS NO": crossNo,
            BRANDS: markalar,
            OE_Numbers: oe,
            NORMALIZED_OE_Numbers: oeNormalized
        });
    }

    const outputFilePath = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/excels/OE/OE_Numbers_${FILTER_BRAND}_Yatay.xlsx`);
    const headers = Object.keys(rowData[0]);
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rowData, { header: headers });
    xlsx.utils.book_append_sheet(wb, ws, "OE_Numbers");
    xlsx.writeFile(wb, path.resolve(__dirname, outputFilePath));
    console.log(`${FILTER_BRAND} OE Numbers Excel dosyası oluşturuldu ==>> ${outputFilePath}`);
}


function main() {
    jsonToExcelHorizontal();
}

main();