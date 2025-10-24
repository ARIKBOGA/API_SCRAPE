import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import initialMarkaData from '../../data/catalogInfo/jsons/marka_catalog.json';
import { OutputManufacturer } from '../../../utils/Types';

const MARKA_ORIGIN_PATH = path.resolve(__dirname, '../../data/catalogInfo/jsons/MARKA_ORIGIN.json');
const MARKA_HAREKET_PATH = path.resolve(__dirname, '../../data/catalogInfo/jsons/MARKA_HAREKET_KATALOG.json');

const MARKA_HAREKET = JSON.parse(fs.readFileSync(MARKA_HAREKET_PATH, 'utf-8'));
const MARKA_ORIGIN = JSON.parse(fs.readFileSync(MARKA_ORIGIN_PATH, 'utf-8'));


const OUTPUT_FILE_PATH = path.resolve(__dirname, `../../data/catalogInfo/excels/createdKatMarka.xlsx`);

interface KatMarka {
    yvNo: string;
    marka_id: string;
    marka: string;
    marka_origin: string;
    origin_code: string;
}

function getMarkaOrigin(marka: string): string {
    const markaOrigin = MARKA_ORIGIN.find((item: any) => item.MARKA === marka);
    return markaOrigin?.["MENŞE ÜLKE (ORTAKLIK)"] || "";
}

function getOriginCode(marka: string): string {
    const markaOrigin = MARKA_ORIGIN.find((item: any) => item.MARKA === marka);
    return markaOrigin?.["ÜLKE KODU (ORTAKLIK KODU)"] || "";
}

function getMarkaId(marka: string): string {
    // Import Marka (Brand) data and store it in a map for easy lookup
    const markaNameToIdMap = new Map<string, number>();
    for (const [idString, name] of Object.entries(initialMarkaData)) {
        markaNameToIdMap.set(name.trim().toUpperCase(), parseInt(idString));
    }

    return markaNameToIdMap.get(marka.trim().toUpperCase())?.toString() || "";
}

function main() {

    const rowData: KatMarka[] = [];

    for (const item of MARKA_HAREKET) {

        const uniqueVehicles = Array.from(new Set(item.compatibleVehicles)) as OutputManufacturer[];
        for (const vehicle of uniqueVehicles) {
            rowData.push({
                yvNo: item.yvNo,
                marka_id: getMarkaId(vehicle.manufacturer),
                marka: vehicle.manufacturer,
                marka_origin: getMarkaOrigin(vehicle.manufacturer),
                origin_code: getOriginCode(vehicle.manufacturer)
            })
        }

    }

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rowData);
    xlsx.utils.book_append_sheet(wb, ws, "KatMarka");
    xlsx.writeFile(wb, OUTPUT_FILE_PATH);

}

main();