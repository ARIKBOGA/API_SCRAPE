import { PathRepo } from "../../config/PathRepo";
import { ORJ_NO_ExcelRow } from "../../utils/Types";
import { readExcelSafe } from "./ExcelUtils";


async function ORJ_NO_EXCEL() {
    const INPUT_FILEPATH = PathRepo.resources(`catalog/excels/ORJ_NO.xlsx`);
    const data: ORJ_NO_ExcelRow[] = await readExcelSafe(INPUT_FILEPATH);

    if (data.length === 0) {
        throw (new Error(`ORJ_NO - Excel'de veri bulunamadı.`));
    }
    return data;
}

async function convertExcelToMap(data: Promise<ORJ_NO_ExcelRow[]>, keyStr: string, valueStr: string) {

    const map = new Map<string, string[]>();

    for (const row of await data) {

        const key = String(row[keyStr]);
        const value = String(row[valueStr]);

        if (key && value) {
            if (map.has(key)) {
                const existing = map.get(key) || [];
                if (!existing.includes(value)) {
                    existing.push(value);
                    map.set(key, existing);
                }
            } else {
                map.set(key, [value]);
            }
        }
    }

    return map;
}

export async function get_OE_YV_Map() {

    return await convertExcelToMap(ORJ_NO_EXCEL(), "orjNo", "yvNo");
}

export async function get_YV_OE_Map() {

    return await convertExcelToMap(ORJ_NO_EXCEL(), "yvNo", "orjNo");
}


/**
 * Returns an array of ORJ_NO_ExcelRow objects from the Excel file located at ../../resources/catalog/excels/ORJ_NO.xlsx.
 * If groupId is provided, the function will filter the results to include only rows where the "KATOLOG::grupId" field matches the provided groupId.
 * @param {number} [groupId] - the ID of the group to filter by
 * @options BrakeDisc: 1, BrakeDrum: 2, BrakePad: 3, BeltPulley: 5
 * @returns {Promise<ORJ_NO_ExcelRow[]>}
 */
export async function ORJ_NO_EXCEL_GroupedByID(...groupId: number[]): Promise<ORJ_NO_ExcelRow[]> {

    if (groupId.length > 0) {
        return (await ORJ_NO_EXCEL()).filter(row => groupId.includes(row["KATOLOG::grupId"]));
    }

    return await ORJ_NO_EXCEL();
}


export async function ORJ_NO_MAP_GroupedByID(...groupId: number[]) {

    return await convertExcelToMap(ORJ_NO_EXCEL_GroupedByID(...groupId), "orjNo", "yvNo");

}


