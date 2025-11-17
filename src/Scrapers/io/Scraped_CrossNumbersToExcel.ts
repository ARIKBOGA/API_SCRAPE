import path from "path";
import xlsx from "xlsx";
import fs from 'fs'
import { CrossNumberApiProduct } from "../../utils/Types";
import { FILTER_BRAND, PRODUCT_TYPE } from "../../config/env";


const jsonPath = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/jsons/Cross-Numbers/Cross-Numbers_${PRODUCT_TYPE}_${FILTER_BRAND}.json`);
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const yv_OE_map = new Map<string, string>();
jsonData.forEach((element: any) => {
    yv_OE_map.set(element.yvNo, element.OE);
});

const rowData: Record<string, Record<string, string>> = {}; // key: yvNo, value: Record<string, string>

for (const element of jsonData) {
    //const element: CrossNumbersYV_Pair = JSON.parse(each);
    const crossNumber: CrossNumberApiProduct[] = element.crossNumbers;
    const crossPairs: Record<string, string> = {};   // supplier: crossNumber(joined with ",")

    for (const each of crossNumber) {
        const supplier = each.Supplier;
        const crossNumber = each.ArticleNumber;
        crossPairs[supplier] = crossPairs[supplier] ? `${crossPairs[supplier]}, ${crossNumber}` : crossNumber;
    }

    rowData[element.yvNo] = crossPairs;
}
const headers = Object.keys(rowData[Object.keys(rowData)[0]]);
const dataArray = Object.entries(rowData).map(([yvNo, crossPairs]) => ({
    yvNo,
    OE: yv_OE_map.get(yvNo),
    ...crossPairs
}));

const outputFilePath = `../../output/${PRODUCT_TYPE}/excels/Cross-Numbers/Cross-Numbers_by_${FILTER_BRAND}_Numbers.xlsx`;
const ws = xlsx.utils.json_to_sheet(dataArray, { header: ['yvNo', "OE", ...headers] });
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Cross Numbers BY OE Numbers");
xlsx.writeFile(wb, path.resolve(__dirname, outputFilePath));