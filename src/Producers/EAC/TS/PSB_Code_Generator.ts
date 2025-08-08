import * as fs from "fs";
import * as path from "path";
import XLSX from "xlsx";
import { createDocxDocument, writeToWord } from "./EAC_helpers";
import { DISC_current_numbers, FULL_current_numbers, DISC_Current_PSB, DRUM_Current_PSB, shatem_psb } from "./variables";


const initial = "PSB";
const disc_centers = ["10", "20", "19", "29", "17", "27", "15", "13", "23", "11", "21"];
const drum_centers = ["30", "31", "33", "35", "37", "39"];

const disc_drum_yvno_range: string[] = Array.from({ length: 1600 }, (_, i) => String(i + 1).padStart(3, '0'));
const disc_range: string[] = Array.from({ length: 1600 }, (_, i) => String(i + 1).padStart(3, '0'))
//.filter(item => !disc_drum_current_numbers.includes(item));

const drum_range: string[] = Array.from({ length: 1600 }, (_, i) => String(i + 1).padStart(3, '0'))
//.filter(item => !disc_drum_current_numbers.includes(item));


function psbNumberGenerator(initial: string, centers: string[], disc_drum_yvno_range: string[]): Record<string, string[]> {
    const psbCodesMap: Record<string, string[]> = {};

    centers.flatMap((center) => {
        const array: string[] = [];
        disc_drum_yvno_range.forEach((yvno) => {
            array.push(initial + yvno.substring(0, 2) + center + yvno.substring(2));
        });
        psbCodesMap[center] = array;
    });

    return psbCodesMap;
}

/**
 * Generates PSB codes for the given initial, centers and disc_drum_yvno_range
 * and returns them in an array.
 * @param {string} initial - PSB initial (e.g. "PSB")
 * @param {string[]} centers - Centers (e.g. ["10", "20", ...])
 * @param {string[]} range - YVNO range (e.g. ["001", "002", ...])
 * @returns {string[]} PSB codes in an array
 */
function psbNumberGeneratetorForWord(initial: string, centers: string[], range: string[]): string[] {
    const result: string[] = [];
    centers.flatMap((center) => {
        range.forEach((yvNo: string) => {
            result.push(initial + yvNo.substring(0, 2) + center + yvNo.substring(2));
        })
    })
    return result;
}

function writeToExcel_PSB(data: { [key: string]: string[] }, fileName: string, sheetName: string): void {
    const maxRows = Math.max(...Object.values(data).map(arr => arr.length));

    const headers = Object.keys(data);
    const sheetData: any[][] = [headers]; // İlk satır başlıklar

    for (let i = 0; i < maxRows; i++) {
        const row: any[] = [];
        for (const key of headers) {
            row.push(data[key][i] || '');
        }
        sheetData.push(row);
    }

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    XLSX.writeFile(wb, fileName);
}

function main() {

    //const disc_drum_yvCodes = psbNumberGenerator(initial, centers, disc_drum_yvno_range);
    const disc_PSB_ECA = psbNumberGeneratetorForWord(initial, disc_centers, disc_range).join(',');
    const drum_PSB_ECA = psbNumberGeneratetorForWord(initial, drum_centers, drum_range).join(',');

    const current_disc_PSB_ECA = DISC_Current_PSB.join(',');
    const current_drum_PSB_ECA = DRUM_Current_PSB.join(',');

    //const OUTPUT_PATH = path.join(`src/data/Produced/ECA/`);
    //fs.writeFileSync(`${OUTPUT_PATH}PSB_map.json`, JSON.stringify(disc_drum_yvCodes, null, 2), "utf-8");
    //writeToExcel_PSB(disc_drum_yvCodes, `${OUTPUT_PATH}PSB_map.xlsx`, "PSB");
    writeToWord([
        { document: createDocxDocument(disc_PSB_ECA), filename: "PSB_Disc" },
        { document: createDocxDocument(drum_PSB_ECA), filename: "PSB_Drum" }
    ]);
}

export function isSubset(superset: string[], subset: string[]): boolean {
    const set = new Set(superset);
    return subset.every(item => set.has(item));
}


function shatemCheck() {
    const psb_full = psbNumberGeneratetorForWord(initial, disc_centers, disc_range).concat(psbNumberGeneratetorForWord(initial, drum_centers, drum_range));
    const containsPSB = isSubset(psb_full, shatem_psb);
    const missingPSB = getMissingElements(psb_full, shatem_psb);
    console.log("PSB:", containsPSB);
    console.log("Missing:", missingPSB);
}

shatemCheck();

export function getMissingElements(superset: string[], subset: string[]): string[] {
  const set = new Set(superset);
  return subset.filter(item => !set.has(item));
}


//main();

