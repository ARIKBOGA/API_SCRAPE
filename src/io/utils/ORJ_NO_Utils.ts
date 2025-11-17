import path from "path";
import { PRODUCT_TYPE } from "../../config/env";
import { readExcelSafe } from "./ExcelUtils";

const PRODUCT_GROUP_ID: Record<string, number> = {
    BrakeDisc: 1,
    BrakeDrum: 2,
    BrakePad: 3,
    BeltPulley: 5
}


export async function data_ORJ_NO() {

    const inputFilepath = path.resolve(__dirname, '../../resources/catalog/excels/ORJ_NO.xlsx');

    const data = await readExcelSafe(inputFilepath);

    return data.filter((row: any) => row["KATOLOG::grupId"] === PRODUCT_GROUP_ID[PRODUCT_TYPE])
}

/**
 * Returns a Map where the key is the YV number and the value is a Set of ORJ numbers
 * that correspond to the given YV number.
 * @returns {Map<string, Set<string>>} A Map of YV numbers to their corresponding ORJ numbers
 */
export async function MAP_ORJ_NO(): Promise<Map<string, Set<string>>> {

    const data = new Map<string, Set<string>>();

    for (const row of await data_ORJ_NO()) {

        const oe = row["orjNo"];
        const yv = row["yvNo"];
        if (data.has(yv)) {
            const existing = data.get(yv) || new Set<string>();
            existing.add(oe);
            data.set(yv, existing);
        } else {
            data.set(yv, new Set([oe]));
        }

    }
    const oeSet = new Set<string>();
    data.forEach((value, key) => {
        value.forEach(oe => oeSet.add(oe));
    })
    console.log(`${PRODUCT_TYPE} Ürün Sayısı: ${data.size}, OE sayısı: ${oeSet.size}`);
    return data;
}
