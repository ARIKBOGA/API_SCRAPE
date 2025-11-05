import xlsx from 'xlsx';
import path from 'path';

const INPUT_PATH = path.resolve(__dirname, `../resources/catalog/excels/etiket_tüm.xlsx`);
const OUTPUT_PATH = path.resolve(__dirname, `../resources/catalog/excels/etiket_tüm_merged.xlsx`);

type Etiket = {
    YV: string;
    [key: string]: any; // Excel'deki diğer tüm sütunlar
}

/**
 * Okunan excel dosyasındaki verilerin okunup Etiket tipinde bir dizi haline getirilmesini sağlar.
 * @returns {Etiket[]} Okunan excel dosyasındaki verilerin Etiket tipinde bir dizi haline getirilmiş  formu.
 */
function readEtiketExcel(): Etiket[] {

    const wb = xlsx.readFile(INPUT_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: Etiket[] = xlsx.utils.sheet_to_json(ws);

    return data;
}

/**
 * Etiket verilerini okunan excel dosyasındaki verilerin yv no'suna göre birleştirmesini sağlar.
 * Eğer bir yv no'suna ait bir satır varsa ve okunan verilerde de aynı yv no'suna ait bir satır varsa bu 
 * satırlar birleştirilir. Eğer okunan verilerde de bir satır yoksa bu satır eklenir.
 * @param {Etiket[]} etiketler_data Okunan excel dosyasındaki verilerin Etiket tipinde bir dizi haline getirilmiş  formu.
 * @returns {Map<string, Etiket>} Birleştirilmiş Etiket verilerini Map olarak döner.
 */
function mergeEtiketRows(etiketler_data: Etiket[]): Map<string, Etiket> {

    const mergedMap = new Map<string, Etiket>();

    for(const etiket of etiketler_data) {
        const yv = etiket.YV;

        if(!mergedMap.has(yv)) {
            mergedMap.set(yv, etiket);
        } else {
            for(const [key, value] of Object.entries(etiket) ){
                const existing = mergedMap.get(yv);
                if (existing) {
                    if(!existing[key] || existing[key] === null || existing[key] === undefined || existing[key] === "") {
                        existing[key] = value;
                    }
                }
            }
        }
    }

    return mergedMap;
}

function writeEtiketExcel(merged: Map<string, Etiket>) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(Array.from(merged.values()));
    xlsx.utils.book_append_sheet(wb, ws, "Etiketler");
    xlsx.writeFile(wb, OUTPUT_PATH);
}

function main() {
    const etiketler_data = readEtiketExcel();
    const merged = mergeEtiketRows(etiketler_data);
    writeEtiketExcel(merged);
    
}

main();