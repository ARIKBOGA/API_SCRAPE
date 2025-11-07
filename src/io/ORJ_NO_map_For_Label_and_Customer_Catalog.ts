import path from 'path';
import xlsx from 'xlsx';


const INPUT_FILE_PATH = path.resolve(__dirname, `../resources/catalog/excels/ORJ_NO.xlsx`);

const wb = xlsx.readFile(INPUT_FILE_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

let YV_OE_NO_Map = new Map<string, Set<string>>();

data.forEach((row: any) => {
    const yv = row["yvNo"];
    const oe = row["orjNo"];
    if (YV_OE_NO_Map.has(yv)) {
        const existing = YV_OE_NO_Map.get(yv) || new Set<string>();
        existing.add(oe);
        YV_OE_NO_Map.set(yv, existing);
    } else {
        YV_OE_NO_Map.set(yv, new Set([oe]));
    }
})

export { YV_OE_NO_Map as YV_OE_NO_MAP };