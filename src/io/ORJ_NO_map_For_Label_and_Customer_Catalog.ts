import path from 'path';
import xlsx from 'xlsx';


const INPUT_FILE_PATH = path.resolve(__dirname, `../resources/data/catalogInfo/excels/ORJ_NO_KATALOG.xlsx`);

const wb = xlsx.readFile(INPUT_FILE_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

let YV_OE_NO_MAP = new Map<string, Set<string>>();

data.forEach((row: any) => {
    const yv = row["yvNo"];
    const oe = row["orjNo"];
    if (YV_OE_NO_MAP.has(yv)) {
        const existing = YV_OE_NO_MAP.get(yv) || new Set<string>();
        existing.add(oe);
        YV_OE_NO_MAP.set(yv, existing);
    } else {
        YV_OE_NO_MAP.set(yv, new Set([oe]));
    }
})

export { YV_OE_NO_MAP };