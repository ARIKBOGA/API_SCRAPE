import path from "path";
import xlsx from "xlsx";
import dotenv from "dotenv";

const PRODUCT_GROUP_ID: Record<string, number> = {
    BrakeDisc: 1,
    BrakeDrum: 2,
    BrakePad: 3,
    BeltPulley: 5
}

dotenv.config({ path: path.resolve(".env") });
const PRODUCT_TYPE = process.env.PRODUCT_TYPE!;

export function getORJ_NO_DATA() {

    const inputFilepath = path.resolve(__dirname, '../../resources/data/catalogInfo/excels/ORJ_NO_KATALOG.xlsx');

    const wb = xlsx.readFile(inputFilepath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: any = xlsx.utils.sheet_to_json(ws);

    return data.filter((row: any) => row["KATOLOG::grupId"] === PRODUCT_GROUP_ID[PRODUCT_TYPE])
}

export function get_ORJ_NO_DATA_map() {
    const data = new Map<string, Set<string>>();

    getORJ_NO_DATA().forEach((row: any) => {
        const oe = row["orjNo"];
        const yv = row["yvNo"];
        if (data.has(yv)) {
            const existing = data.get(yv) || new Set<string>();
            existing.add(oe);
            data.set(yv, existing);
        } else {
            data.set(yv, new Set([oe]));
        }
    })
    return data;
}
