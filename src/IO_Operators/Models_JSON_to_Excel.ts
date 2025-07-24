import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { Model } from '../utils/Types';
import { Interface } from 'readline';

interface ModelRow {
    Brand: string;
    Model: string;
}

function initilize() {
    const INPUT_FILE = path.resolve(__dirname, `../resources/data/catalogInfo/jsons/models_output.json`);
    const OUTPUT_FILE = path.resolve(__dirname, `../resources/data/catalogInfo/excels/models_output.xlsx`);

    return { INPUT_FILE, OUTPUT_FILE };
}

function getModels(path: string) {

    const modelRowData: ModelRow[] = [];
    const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
    const brands = Object.keys(data);

    for (const brand of brands) {

        for (const element of data[brand]) {
            modelRowData.push({ Brand: brand, Model: element.name });
        }
    }

    console.log(`Json dosyası okundu: ${path}`)
    return modelRowData;
}

function writeToExcel(path: string, rowData: ModelRow[]) {
    const headers = Object.keys(rowData[0]);
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rowData, { header: headers });
    xlsx.utils.book_append_sheet(workbook, worksheet, "All Models");
    xlsx.writeFile(workbook, path);
    console.log(`Excel dosyası oluşturuldu: ${path}`);
}


function main() {

    const { INPUT_FILE, OUTPUT_FILE } = initilize();
    const rowData = getModels(INPUT_FILE);
    writeToExcel(OUTPUT_FILE, rowData);
}

main();