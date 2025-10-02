import path from 'path';
import xlsx from 'xlsx';
import { normalize_OE } from '../utils/Utility';

const ORJ_NO_POOL_FILE_PATH = path.resolve(__dirname, `../output/ALL/excels/OE/ORJ_NO.xlsx`);
const QUERY_FILE_PATH = path.resolve(__dirname, `../output/ALL/excels/OE/ETBK.xlsx`);
const RESULT_OUTPUT_PATH = path.resolve(__dirname, `../output/ALL/excels/OE/FOUND.xlsx`);


function excelToObjects(inputFilePath: string, sheetName: string): [Map<string, string>, Set<string>] {
    const wb = xlsx.readFile(inputFilePath, { cellDates: true });
    const ws = wb.Sheets[sheetName];

    const jsonData: any[] = xlsx.utils.sheet_to_json(ws);
    const oe_map = new Map<string, string>();
    const oe_set: Set<string> = new Set();

    jsonData.forEach(row => {
        const yv = row["YV"] || "";
        Object.keys(row).forEach(key => {
            if (key.includes("OE") && row[key]) {
                const oeValue = row[key].toString().trim();
                oe_map.set(normalize_OE(oeValue), yv);
                oe_set.add(normalize_OE(oeValue));
            }
        });
    });

    return [oe_map, oe_set];
}


function findOENumbers(pool_map: Map<string, string>, query_set: Set<string>): Map<string, string[]> {

    const query_OE_array = Array.from(query_set);
    const found: Map<string, string[]> = new Map();

    query_OE_array.forEach(query_item => {
        const YV_NO = pool_map.get(query_item);
        if (YV_NO) {
            const existing = found.get(YV_NO);
            if (existing) {
                existing.push(query_item); // Map içindeki referansa push
            } else {
                found.set(YV_NO, [query_item]);
            }
        }
    });

    return found;
}


export function mapToExcel(resultMap: Map<string, string[]>) {
    const rowData: { YV: string, OE: string }[] = [];

    for (const [key, value] of resultMap.entries()) {
        rowData.push(
            {
                YV: key,
                OE: value.join(", ")
            })
    }

    const ws = xlsx.utils.json_to_sheet(rowData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Found OE Numbers");
    xlsx.writeFile(wb, RESULT_OUTPUT_PATH)
}


function main() {
    const [full_oe_pool_map, full_oe_pool_set] = excelToObjects(ORJ_NO_POOL_FILE_PATH, "NORMALIZED_OE_NUMBERS");
    const [query_OE_map, query_OE_set] = excelToObjects(QUERY_FILE_PATH, "Sayfa1");

    const found = findOENumbers(full_oe_pool_map, query_OE_set);
    mapToExcel(found);
    console.log("Bulunan YV-OE çiftlerini içeren excel dosyası oluşturuldu.")

}

main();
