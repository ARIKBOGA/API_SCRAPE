import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { Result, ResultRow } from './DataTypes';



export function writeOE_NumbersToExcel() {

    const INPUT_FILE_PATH = path.resolve(__dirname, `../output/jsons/Results.json`);
    const OUTPUT_DIR = path.resolve(__dirname, `../output/excels`);

    const joined: ResultRow[] = [];
    const single: ResultRow[] = [];
    const data: Result[] = JSON.parse(fs.readFileSync(INPUT_FILE_PATH, 'utf-8'));

    data.forEach((item: Result) => {
        if (item.freeTextSearch.includes(item.foundSupplierNumber) || item.foundSupplierNumber.includes(item.freeTextSearch)) {
            joined.push({
                FreeTextSearch: item.freeTextSearch,
                FoundSupplierNumber: item.foundSupplierNumber,
                OE: item.oeNumbers.join(', ')
            })
            item.oeNumbers.forEach(oeNum => {
                single.push({
                    FreeTextSearch: item.freeTextSearch,
                    FoundSupplierNumber: item.foundSupplierNumber,
                    OE: oeNum
                });
            });
        }
    })

    const joinedSheet = xlsx.utils.json_to_sheet(joined);
    const singleSheet = xlsx.utils.json_to_sheet(single);
    const joinedWorkbook = xlsx.utils.book_new();
    const singleWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(joinedWorkbook, joinedSheet, 'Joined_OE_Numbers');
    xlsx.utils.book_append_sheet(singleWorkbook, singleSheet, 'Single_OE_Numbers');
    xlsx.writeFile(joinedWorkbook, `${OUTPUT_DIR}/Rockauto_Raybestos_OE_Numbers_Joined.xlsx`);
    xlsx.writeFile(singleWorkbook, `${OUTPUT_DIR}/Rockauto_Raybestos_OE_Numbers_Single.xlsx`);
}

writeOE_NumbersToExcel();