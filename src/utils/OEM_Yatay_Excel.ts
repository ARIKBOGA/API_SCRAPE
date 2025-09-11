import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';


const INPUT_PATH = path.resolve(__dirname, `../output/ALL/excels/OE/ORJ_NO.xlsx`);
const OUTPUT_PATH = path.resolve(__dirname, `../output/ALL/excels/OE/OEM_Yatay.xlsx`);


const wb = xlsx.readFile(INPUT_PATH, { cellDates: true });
const ws = wb.Sheets["NORMALIZED_OE_NUMBERS"];

const data: any = xlsx.utils.sheet_to_json(ws);

const yv_oe_map = new Map<string, Set<string>>();

for (const row of data) {
    const yv = row["YV_NO"];
    const oe = row["OE"];
    if (yv_oe_map.has(yv)) {
        yv_oe_map.get(yv)?.add(oe);
    } else {
        yv_oe_map.set(yv, new Set([oe]));
    }
}

const rowData: { YV: string, OE: string }[] = [];

for (const [key, value] of yv_oe_map.entries()) {
    rowData.push(
        {
            YV: key,
            OE: Array.from(value).join(", ")
        })
}

 
const ws2 = xlsx.utils.json_to_sheet(rowData);
const wb2 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb2, ws2, "OEM Yatay");
xlsx.writeFile(wb2, OUTPUT_PATH);

