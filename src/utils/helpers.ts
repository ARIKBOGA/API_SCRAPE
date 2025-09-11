import path from 'path';
import fs from 'fs';
import xlsx from 'xlsx';

import OE_YV_DATA from '../resources/data/catalogInfo/jsons/ORJ_NO.json';

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


function checkDoubleIndicatorsInOEnumbers() {
    const data: { OE: string; YV: string[] }[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/data/catalogInfo/jsons/ORJ_NO.json'), 'utf-8'));

    data
        .map(item => ({
            OE: item.OE,
            YV: Array.from(new Set(item.YV.map(yv => yv.replace(/[^0-9]/g, ''))))
        }))
        .filter(item => item.YV.length > 1)
        .forEach(item => {
            console.log(item.OE, item.YV);
        });
}

//convertToJSonFromExcel("../output/ALL/excels/OE/ORJ_NO.xlsx", "NORMALIZED_OE_NUMBERS");

checkDoubleIndicatorsInOEnumbers();