import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import OE_YV_DATA from '../../data/catalogInfo/jsons/ORJ_NO_KATALOG.json';
import { OERoot } from '../../../utils/Types';
import { normalize_OE } from '../../../utils/Utility';


dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

interface OeYvMapping {
    OE: string;
    YV: string[];
}

/**
 * Returns a Map of OE number to YV numbers. The keys are the OE numbers and the
 * values are arrays of YV numbers that match the OE number.
 *
 * @returns A Map of OE to YV numbers.
 */

export function getOE_YV_Map(): Map<string, string[]> {
    const OE_YV_MAP: Map<string, string[]> = new Map();

    OE_YV_DATA.forEach((item: OeYvMapping) => {
        OE_YV_MAP.set(item.OE, item.YV);
    });

    return OE_YV_MAP;
}

export function normalizeText(text: string) {
    return text.replace(/[^a-zA-Z0-9]/g, '');
}


export function getDateTimeAsText() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function convertScrapedOENumbersJsonTo_OE_YV_map(filename: string) {

    const inputFilepath = path.resolve(__dirname, `../output/${productType}/jsons/OE/oe-numbers_${filename}.json`);
    const outputFilepath = path.resolve(__dirname, `../resources/data/catalogInfo/jsons/OE_YV_MAP_${filename}.json`);

    const data: OERoot[] = JSON.parse(fs.readFileSync(inputFilepath, 'utf-8'));

    const resultMap: { OE: string, YV: string[] }[] = [];

    data.forEach((item: OERoot) => {
        item.oeNumbers.forEach(oeElement => {
            oeElement.numbers.forEach(oe => {
                const normalizedOE = normalize_OE(oe);
                if (!resultMap.find(result => result.OE === normalizedOE)) {
                    resultMap.push({ OE: normalizedOE, YV: [item.yvNo] });
                } else {
                    if (!resultMap.find(result => result.OE === normalizedOE)?.YV.includes(item.yvNo)) {
                        resultMap.find(result => result.OE === normalizedOE)?.YV.push(item.yvNo);
                    }
                }
            })
        })
    })

    fs.writeFileSync(outputFilepath, JSON.stringify(resultMap, null, 2));
}

/**
 * Converts an Excel file to a JSON file.
 *
 * @param filePath The path to the Excel file.
 * @param sheetName The name of the sheet to read from the Excel file.
 * @creates A JSON file contains Map of OE numbers to YV numbers as <string, string[]> 
 */
function convertToJSonFromExcel(filePath: string, sheetName: string) {

    const wb = xlsx.readFile(path.resolve(__dirname, filePath), { cellDates: true });
    const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];

    const jsonData: any[] = xlsx.utils.sheet_to_json(ws, { raw: false });

    const YV_OE_map = new Map<string, Set<string>>();

    if (jsonData.length === 0) {
        console.warn(`Excel'de veri bulunamadı.`);
        return YV_OE_map;
    }

    jsonData.forEach((item: any) => {
        const oe = item["OE"];
        const yv = item["YV"];

        if (oe && yv) {
            if (YV_OE_map.has(oe)) {
                YV_OE_map.get(oe)?.add(yv);
            } else {
                YV_OE_map.set(oe, new Set([yv]));
            }
        }
    })
    const yv_oe_records: any[] = [];

    YV_OE_map.forEach((yvSet, oeKey) => {
        yv_oe_records.push({ OE: oeKey, YV: Array.from(yvSet) });
    });

    fs.writeFileSync(path.join(__dirname, '../resources/data/catalogInfo/jsons/ORJ_NO.json'), JSON.stringify(yv_oe_records, null, 2));
}


/**
 * INFO: was created to check whether any OE number represents/belongs to more than one YV number.
 */
function checkDoubleIndicatorsInOEnumbers() {

    const data: { OE: string; YV: string[] }[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/data/catalogInfo/jsons/ORJ_NO_KATALOG.json'), 'utf-8'));

    const duplicatedData = [];

    for (const item of data) {
        if (item.YV.length > 1) {
            const yvArray = [...item.YV];
            for (let i = 0; i < yvArray.length; i++) {
                yvArray[i] = yvArray[i].replace("C", "").replace("S", "").replace("B", "").replace("H", "");
            }
            const yvSet = new Set(yvArray);
            if (yvSet.size > 1) {
                duplicatedData.push(item);
            }
        }
    }
    console.log(duplicatedData.length);

    const rowData = [];

    for (const item of duplicatedData) {
        rowData.push({ OE: item.OE, YV: item.YV.join(", ") });
    }

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rowData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    xlsx.writeFile(workbook, path.resolve(__dirname, `../output/ALL/excels/OE/duplicatedOENumbers.xlsx`));
    //fs.writeFileSync(path.resolve(__dirname, `../output/ALL/excels/OE/duplicatedOENumbers.txt`), JSON.stringify(duplicatedData, null, 2));
}

//convertScrapedOENumbersJsonTo_OE_YV_map("ICER_ALL_PAD")

//convertToJSonFromExcel("../output/ALL/excels/OE/ORJ_NO.xlsx", "KATALOG_09_25");

checkDoubleIndicatorsInOEnumbers();