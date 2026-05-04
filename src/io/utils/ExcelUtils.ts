import path from 'path';
import xlsx from 'xlsx';
import { mkdirIfNotExists } from './Workspace_IO_Utils';
import * as fs from 'fs/promises';


// EXCEL IO functions

export async function readExcelSafe(filepath: string, sheetName?: string) {

    const wb = xlsx.readFile(filepath);
    const ws = wb.Sheets[sheetName || wb.SheetNames[0]];
    const data: any = xlsx.utils.sheet_to_json(ws);
    return data;
}

export async function writeExcelSafe(filepath: string, ...sheets: { name: string, data: any[] }[]) {
    try {
        const dir = path.dirname(filepath);
        await mkdirIfNotExists(dir);   // varsayalım bu fonksiyon var

        const wb = xlsx.utils.book_new();

        for (const sheet of sheets) {
            const ws = xlsx.utils.json_to_sheet(
                sheet.data.length === 0
                    ? [{ "DİKKAT": "SAYFA BOŞ, DEĞER BULUNAMADI" }]
                    : sheet.data
            );
            xlsx.utils.book_append_sheet(wb, ws, sheet.name);
        }

        xlsx.writeFile(wb, filepath);   // senkron
        console.log(`✅ Excel başarıyla yazıldı: ${filepath}`);

    } catch (error: any) {
        console.error('❌ Excel yazma hatası:', error.message);
        console.error('Hata stack:', error.stack);
        throw error;   // istersen main'e de fırlat
    }
}
