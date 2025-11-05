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

    const inputFilepath = path.resolve(__dirname, '../../resources/catalog/excels/ORJ_NO.xlsx');

    const wb = xlsx.readFile(inputFilepath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: any = xlsx.utils.sheet_to_json(ws);

    return data.filter((row: any) => row["KATOLOG::grupId"] === PRODUCT_GROUP_ID[PRODUCT_TYPE])
}

/**
 * Returns a Map where the key is the YV number and the value is a Set of ORJ numbers
 * that correspond to the given YV number.
 * @returns {Map<string, Set<string>>} A Map of YV numbers to their corresponding ORJ numbers
 */
export function get_ORJ_NO_DATA_map(): Map<string, Set<string>> {

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
    const oeSet = new Set<string>();
    data.forEach((value, key) => {
        value.forEach(oe => oeSet.add(oe));
    })
    console.log(`${PRODUCT_TYPE} Ürün Sayısı: ${data.size}, OE sayısı: ${oeSet.size}`);
    return data;
}
