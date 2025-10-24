import xlsx from 'xlsx';
import path from 'path';


const INPUT_FILE_PATH = path.resolve(__dirname, `../resources/excels/american_catalog.xlsx`);

export function readCrossNumbersOfManufacturers(manufacturer: string): string[] {

    const workbook = xlsx.readFile(INPUT_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    return data
        .map((row: any) => row[manufacturer])
        .filter(each => each !== undefined) as string[];
}