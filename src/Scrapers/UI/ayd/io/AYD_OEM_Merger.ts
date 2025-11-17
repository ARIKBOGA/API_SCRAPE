import path from 'path';
import xlsx from 'xlsx';

const inputFilePath = path.resolve(__dirname, '../resources/AYD.xlsx');

const wb = xlsx.readFile(inputFilePath);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(ws);

const rows = data.map((row: any) => {
    const joined: string[] = []
    joined.push(row["OE_1"] ? row["OE_1"].toString().trim() : "");
    joined.push(row["OE_2"] ? row["OE_2"].toString().trim() : "");
    joined.push(row["OE_3"] ? row["OE_3"].toString().trim() : "");
    joined.push(row["OE_4"] ? row["OE_4"].toString().trim() : "");
    joined.push(row["OE_5"] ? row["OE_5"].toString().trim() : "");


    return {
        ...row,
        JOINED_OEM: joined.map(item => item).filter(item => item !== "").join(", ")
    }
})

const outputFilePath = path.resolve(__dirname, '../output/excels/AYD_OEM_Merged.xlsx');
const newWb = xlsx.utils.book_new();
const newWs = xlsx.utils.json_to_sheet(rows);
xlsx.utils.book_append_sheet(newWb, newWs, 'MergedData');
xlsx.writeFile(newWb, outputFilePath);