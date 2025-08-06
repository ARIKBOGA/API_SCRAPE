import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { CrossNumberJson, CrossNumberElement } from '../utils/Types';
import { exportToExcel } from './CombinedCrossNumberToExcel';

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

export async function combineCrossNumberJsonFiles() {
    const jsonFiles = fs.readdirSync(workFolderPath)
        .filter((file) => file.startsWith("Cross-Numbers") && file.endsWith(".json"));

    const fullData: FullCrossNumberData[] = [];

    for (const file of jsonFiles) {
        const filePath = path.resolve(workFolderPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent) as CrossNumberJson[];

        for (const { yvNo, OE, crossNumbers } of data) {
            const existingData = fullData.find((entry) => entry.yvNo === yvNo);

            if (existingData) {
                // If yvNo already exists in the output array
                if (OE && !existingData.oeNumbers.includes(OE)) {
                    existingData.oeNumbers.push(OE);
                }

                const existingCrossNumberApiCodes = new Set(existingData.crossNumbers.map((cn) => cn.ApiCode));
                for (const crossNumber of crossNumbers) {
                    if (!existingCrossNumberApiCodes.has(crossNumber.ApiCode)) {
                        existingData.crossNumbers.push(crossNumber);
                    }
                }
            } else {
                // If yvNo does not exist in the output array, add a new entry
                fullData.push({
                    yvNo,
                    oeNumbers: OE ? [OE] : [],
                    crossNumbers
                });
            }
        }
    }

    fs.writeFileSync(outputFilePath, JSON.stringify(fullData, null, 2), "utf8");
    console.log(`Veri başarıyla birleştirilerek ${outputFilePath} dosyasına kaydedildi.`);
}


async function main() {
    //await combineCrossNumberJsonFiles();
    await exportToExcel();
}

main();