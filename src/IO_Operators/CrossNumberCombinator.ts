import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { CrossNumberJson, CrossNumberElement } from '../utils/Types';
import { exportToExcel } from './CombinedCrossNumberToExcel';
import { delay } from '../utils/API_Worker_Functions';
import { Page } from '@playwright/test';

// Yeni veri yapısını tanımla
type FullCrossNumberData = {
    yvNo: string;
    oeNumbers: string[];
    crossNumbers: CrossNumberElement[];
};

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const workFolderPath = path.resolve(__dirname, `../output/${productType}/jsons/Cross-Numbers`);
const outputFilePath = path.resolve(__dirname, `../output/${productType}/jsons/Cross-Numbers/Cross-Numbers_${productType}_Full_Data.json`);

export async function combineAllCrossNumberJsonFiles() {
    try {
        const jsonFiles = fs.readdirSync(workFolderPath)
            .filter(file => file.startsWith("Cross-Numbers") && file.endsWith(".json"));

        // Yeni FullCrossNumberData yapısını tutacak Map
        const dataMap = new Map<string, FullCrossNumberData>();

        // Her bir JSON dosyasını işle
        for (const file of jsonFiles) {
            const filePath = path.resolve(workFolderPath, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent) as CrossNumberJson[];

            for (const element of data) {
                const { yvNo, OE, crossNumbers } = element;

                if (dataMap.has(yvNo)) {
                    // Eğer yvNo zaten Map'te varsa
                    const existingData = dataMap.get(yvNo)!;

                    // OE numarasını benzersiz olarak ekle
                    if (!existingData.oeNumbers.includes(OE)) {
                        existingData.oeNumbers.push(OE);
                    }

                    // crossNumbers'ı benzersiz olarak birleştir
                    const existingCrossNumberApiCodes = new Set(existingData.crossNumbers.map(cn => cn.ApiCode));
                    for (const crossNumber of crossNumbers) {
                        if (!existingCrossNumberApiCodes.has(crossNumber.ApiCode)) {
                            existingData.crossNumbers.push(crossNumber);
                        }
                    }
                } else {
                    // Eğer yvNo yoksa, yeni bir FullCrossNumberData girişi oluştur
                    const newData: FullCrossNumberData = {
                        yvNo: yvNo,
                        oeNumbers: [OE], // OE'yi bir diziye ekle
                        crossNumbers: crossNumbers
                    };
                    dataMap.set(yvNo, newData);
                }
            }
        }

        const fullData = Array.from(dataMap.values());
        fs.writeFileSync(outputFilePath, JSON.stringify(fullData, null, 2), "utf8");

        console.log(`Veri başarıyla birleştirilerek ${outputFilePath} dosyasına yazıldı.`);

    } catch (error) {
        console.error("Bir hata oluştu:", error);
    }
}


async function main() {
    //await combineAllCrossNumberJsonFiles();
    await exportToExcel();
}

main();