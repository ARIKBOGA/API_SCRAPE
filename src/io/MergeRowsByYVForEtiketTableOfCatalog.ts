import { PathRepo } from '../config/PathRepo';
import { Etiket } from '../utils/Types';
import { readExcelSafe, writeExcelSafe } from './utils/ExcelUtils';

const INPUT_PATH = PathRepo.resources(`catalog/excels/etiket_tüm.xlsx`);
const OUTPUT_PATH = PathRepo.resources(`catalog/excels/etiket_tüm_merged.xlsx`);

/**
 * Etiket verilerini okunan excel dosyasındaki verilerin yv no'suna göre birleştirmesini sağlar.
 * Eğer bir yv no'suna ait bir satır varsa ve okunan verilerde de aynı yv no'suna ait bir satır varsa bu 
 * satırlar birleştirilir. Eğer okunan verilerde de bir satır yoksa bu satır eklenir.
 * @param {Promise<Etiket[]>} etiketler_data Okunan excel dosyasındaki verilerin Etiket tipinde bir dizi haline getirilmiş  formu.
 * @returns {Promise<Map<string, Etiket>>} Birleştirilmiş Etiket verilerini Map olarak döner.
 */
async function mergeEtiketRows(etiketler_data: Promise<Etiket[]>): Promise<Map<string, Etiket>> {

    const mergedMap = new Map<string, Etiket>();

    for (const etiket of await etiketler_data) {
        const yv = etiket.YV;

        if (!mergedMap.has(yv)) {
            mergedMap.set(yv, etiket);
        } else {
            for (const [key, value] of Object.entries(etiket)) {
                const existing = mergedMap.get(yv);
                if (existing) {
                    if (!existing[key] || existing[key] === null || existing[key] === undefined || existing[key] === "") {
                        existing[key] = value;
                    }
                }
            }
        }
    }

    return mergedMap;
}


async function main() {
    const etiketler_data = await readExcelSafe(INPUT_PATH);
    const merged = await mergeEtiketRows(etiketler_data);
    await writeExcelSafe(OUTPUT_PATH, { name: "Etiketler", data: Array.from(merged.values()) });
}

main();