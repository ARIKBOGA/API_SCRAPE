import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const INPUT_FILE_PATH = path.resolve(__dirname, '../../data/catalogInfo/excels/MARKA_ORIGIN.xlsx');
const OUTPUT_FILE_PATH = path.resolve(__dirname, '../../data/catalogInfo/jsons/MARKA_ORIGIN.json');

function main() {

    const wb = XLSX.readFile(INPUT_FILE_PATH)
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(OUTPUT_FILE_PATH, jsonData);
}

main();