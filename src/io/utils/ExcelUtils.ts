import path from 'path';
import xlsx from 'xlsx';
import { mkdirIfNotExists } from './Workspace_IO_Utils';


// EXCEL IO functions

export async function readExcelSafe(filepath: string, sheetName?: string) {

    const wb = xlsx.readFile(filepath);
    const ws = wb.Sheets[sheetName || wb.SheetNames[0]];
    const data: any = xlsx.utils.sheet_to_json(ws);
    return data;
}

export async function writeExcelSafe(filepath: string, sheetName: string, data: any[]) {

    mkdirIfNotExists(path.dirname(filepath));
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    xlsx.writeFile(wb, filepath);
}
