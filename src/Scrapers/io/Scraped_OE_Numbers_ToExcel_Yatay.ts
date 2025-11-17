import path from "path";
import xlsx from "xlsx";
import fs from 'fs'
import { normalize_OE } from "../../utils/Utility";
import { FILTER_BRAND, PRODUCT_TYPE } from "../../config/env";




type OE_rowData = {
    YV: string;
    "CROSS NO": string;
    MARKALAR: string;
    OE: string;
    NORMALIZED_OE: string;
}



function jsonToExcelHorizontal() {
    const jsonPath = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/jsons/OE/oe-numbers_${FILTER_BRAND}.json`);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const rowData: OE_rowData[] = [];

    for (const item of jsonData) {
        const yv = item.yvNo;
        const crossNo = item.crossNumber;
        const oe = item.oeNumbers.map((element: any) => element.numbers.map((oe: string) => oe)).join(", ");
        const oeNormalized = item.oeNumbers.map((element: any) => element.numbers.map((oe: string) => normalize_OE(oe))).join(", ");
        const markalar = Array.from(new Set<string>(item.oeNumbers.map((element: any) => element.manufacturer))).join(", ");

        rowData.push({
            YV: yv,
            "CROSS NO": crossNo,
            MARKALAR: markalar,
            OE: oe,
            NORMALIZED_OE: oeNormalized
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

function OENumbers_verticalToHorizontal() {

    const INPUT_PATH = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/excels/OE/OE_Numbers_${FILTER_BRAND}.xlsx`)
    const wb = xlsx.readFile(INPUT_PATH);
    const ws = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

function main() {
    jsonToExcelHorizontal();
    //OENumbers_verticalToHorizontal();
}

main();