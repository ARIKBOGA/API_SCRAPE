import path from 'path';
import xlsx from 'xlsx';
import initialMarkaData from '../resources/data/catalogInfo/jsons/marka_catalog.json';

const SOURCE_FILE_PATH = path.resolve(__dirname, `../resources/data/catalogInfo/excels/katmarka.xlsx`);
const OUTPUT_FILE_PATH = path.resolve(__dirname, `../output/catalogInfo/excels/createdKatMarka.xlsx`);

const headers = ['yvNo', 'marka', 'marka_aciklama'];

// Import Marka (Brand) data and store it in a map for easy lookup
const markaNameToIdMap = new Map<string, number>();
for (const [idString, name] of Object.entries(initialMarkaData)) {
    markaNameToIdMap.set(name.trim().toUpperCase(), parseInt(idString));
}

const createdKatMarkaMap: Map<string, Set<string>> = new Map<string, Set<string>>();

export const katMarkaRows = () => {
    const workbook = xlsx.readFile(SOURCE_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    jsonData.forEach((row: any) => {
        const yvNo = row['yvNo']?.toString()?.trim();
        const brand = row['marka_aciklama']?.toString()?.trim()?.toUpperCase();

        if (!createdKatMarkaMap.has(yvNo)) {
            createdKatMarkaMap.set(yvNo, new Set<string>());
        }
        createdKatMarkaMap.get(yvNo)?.add(brand);
    });;
}


export function serializeCreatedKatMarkaMap(): Record<string, string[]> {
    const serializedMap: Record<string, string[]> = {};

    createdKatMarkaMap.forEach((brands, yvNo) => {
        serializedMap[yvNo] = Array.from(brands);
    });

    return serializedMap;
}

export function writeKatMarkaMapToFile(katMarkaMap: Record<string, string[]>) {

    const rows: (string | number | undefined)[][] = [];
    const workbook = xlsx.utils.book_new();

    for (const [yvNo, brands] of Object.entries(katMarkaMap)) {
        brands.forEach(brand => {
            const marka = markaNameToIdMap.get(brand.trim().toUpperCase());
            rows.push([yvNo, marka, brand]);
        })
    }
    const worksheet = xlsx.utils.aoa_to_sheet([headers, ...rows]);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'KatMarka');
    xlsx.writeFile(workbook, OUTPUT_FILE_PATH);
}


export function main() {

    katMarkaRows();
    const serializedMap = serializeCreatedKatMarkaMap();
    writeKatMarkaMapToFile(serializedMap);
}

main();