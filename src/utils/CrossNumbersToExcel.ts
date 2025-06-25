import path from "path";
import xlsx from "xlsx";
import fs from 'fs'
import { CrossNumberApiProduct, CrossNumbersYV_Pair } from "./Types";
import dotenv from 'dotenv';


dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

const jsonPath = path.resolve(__dirname, `../output/${productType}/Cross-Numbers_with_OE_Numbers.json`);
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const rowData : Record<string, Record<string, string>> = {}; // yvNo: <supplier: crossNumber(joined with ",")>

for(const element of jsonData){
    //const element: CrossNumbersYV_Pair = JSON.parse(each);
    const crossNumber: CrossNumberApiProduct[] = element.crossNumbers;
    const crossPairs : Record<string, string> = {};   // supplier: crossNumber(joined with ",")

    for(const each of crossNumber){
        const supplier = each.Supplier;
        const crossNumber = each.ArticleNumber;
        crossPairs[supplier] = crossPairs[supplier] ? `${crossPairs[supplier]}, ${crossNumber}` : crossNumber;
    }
    
    rowData[element.yvNo] = crossPairs;
}
const headers = Object.keys(rowData[Object.keys(rowData)[0]]);
const dataArray = Object.entries(rowData).map(([yvNo, crossPairs]) => ({
    yvNo,
    ...crossPairs
}));
const ws = xlsx.utils.json_to_sheet(dataArray, { header: ['yvNo', ...headers] });
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Cross Numbers with OE Numbers");
xlsx.writeFile(wb, path.resolve(__dirname, `../output/${productType}/Cross-Numbers_with_OE_Numbers.xlsx`));