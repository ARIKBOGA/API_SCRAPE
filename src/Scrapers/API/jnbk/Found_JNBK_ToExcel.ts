import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const PRODUCT_TYPE = process.env.PRODUCT_TYPE!;

const INPUT_FILE_PATH = path.resolve(__dirname, `../../../output/${PRODUCT_TYPE}/jsons/JNBK_CODES/Parellel_JNBK_CODES_${PRODUCT_TYPE}.jsonl`);
const data = fs.readFileSync(INPUT_FILE_PATH, 'utf-8');

// Sadece yeni satır karakteriyle ayırın
// map ve trim kullanırken boş satırları filtreleyin (çok temiz bir yöntemdir)
const lines = data.split('\n').filter(line => line.trim() !== '' && line.trim() !== ',');

const rows = lines.map(line => {
    // Sondaki virgülü temizle, ki bu da hataya neden olabilir.
    const cleanLine = line.trim().replace(/,$/, '');
    return JSON.parse(cleanLine);
});

const mapData = new Map<string, string[]>();

rows.forEach(row => {

    if (row.jnbkCode !== "N/A") {

        const key = row.yv;

        if (mapData.has(key)) {
            const existingCodes = mapData.get(key) as string[];
            existingCodes.push(row.jnbkCode);
        } else {
            mapData.set(key, [row.jnbkCode]);
        }
    }
});


const finalRows = Array.from(mapData.entries()).map(([yvNo, jnbkCodes]) => ({
    YV: yvNo,
    JNBK: Array.from(new Set(jnbkCodes)).join(", ")
}));

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(finalRows);
xlsx.utils.book_append_sheet(wb, ws, 'JNBK_CODES');
const OUTPUT_FILE_PATH = path.resolve(__dirname, `../../../output/${PRODUCT_TYPE}/excels/JNBK_CODES/JNBK_CODES_${PRODUCT_TYPE}.xlsx`);
xlsx.writeFile(wb, OUTPUT_FILE_PATH);