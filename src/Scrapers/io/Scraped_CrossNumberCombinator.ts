import * as fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { CrossNumberJson, CrossNumberElement } from '../../utils/Types';
import { exportToExcel } from './Scraped_CombinedCrossNumberToExcel';

// Yeni veri yapısını tanımla
type FullCrossNumberData = {
    yvNo: string;
    oeNumbers: string[];
    crossNumbers: CrossNumberElement[];
};

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const WORK_FOLDER_PATH = path.resolve(__dirname, `../../output/${productType}/jsons/Cross-Numbers`);
const OUTPUT_JSON_PATH = path.resolve(__dirname, `../../output/${productType}/jsons/Cross-Numbers/Cross-Numbers_${productType}_Full_Data.json`);
const OUTPUT_EXCEL_PATH = path.resolve(__dirname, `../../output/${productType}/excels/Cross-Numbers/${productType}_Combined_CrossNumbers.xlsx`);

export async function combineCrossNumberData(workFolderPath: string) {
    const fileNames = await fs.readdir(workFolderPath);
    const jsonFiles = fileNames
        .filter((file) => file.startsWith("Cross-Numbers") && file.endsWith(".json"));


    console.log(`Found ${jsonFiles.length} JSON files to process.`);

    const fullDataMap = new Map<string, FullCrossNumberData>();

    const fullData: FullCrossNumberData[] = [];

    for (const file of jsonFiles) {
        const filePath = path.resolve(workFolderPath, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent) as CrossNumberJson[];

        for (const { yvNo, OE, crossNumbers } of data) {

            let existingData = fullDataMap.get(yvNo);

            if (!existingData) {
                existingData = {
                    yvNo,
                    oeNumbers: OE ? [OE] : [],
                    crossNumbers: []
                };
                fullDataMap.set(yvNo, existingData);
            }

            // Mevcut crossNumbers ile yeni crossNumbers'ı birleştir
            if (OE && !existingData.oeNumbers.includes(OE)) {
                existingData.oeNumbers.push(OE);
            }

            // Yeni crossNumbers'ı ekle, ancak benzersiz olmalarını sağla
            const existingCrossNumberApiCodes = new Set(existingData.crossNumbers.map((cn) => cn.ApiCode));
            for (const crossNumber of crossNumbers) {
                if (!existingCrossNumberApiCodes.has(crossNumber.ApiCode)) {
                    existingData.crossNumbers.push(crossNumber);
                }
            }

        }
    }

    fullData.push(...fullDataMap.values());
    console.log("Toplam benzersiz yvNo sayısı:", fullData.length);

    return fullData;
}


async function main() {
    console.log("İşlem Başladı...");

    try {
        // 1. Veriyi topla ve birleştir (Birinci Fonksiyon)
        const combinedData = await combineCrossNumberData(WORK_FOLDER_PATH);

        if (combinedData.length === 0) {
            console.log("Birleştirilecek veri bulunamadığından işlem sonlandırıldı.");
            return;
        }

        // Opsiyonel Adım: Ara JSON dosyasını diske yaz
        await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify(combinedData, null, 2), "utf8");
        console.log(`Birleştirilen veri ${OUTPUT_JSON_PATH} dosyasına kaydedildi.`);

        // 2. Excel'e aktar (İkinci Fonksiyon, birincinin sonucunu direkt kullanıyor)
        await exportToExcel(combinedData, OUTPUT_EXCEL_PATH);

        console.log("Tüm işlemler başarıyla tamamlandı.");

    } catch (error) {
        console.error("\nAna süreçte beklenmedik bir hata oluştu, işlem durduruldu.");
    }
}

main();