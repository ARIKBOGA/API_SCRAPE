import * as fs from 'fs/promises';
import path from 'path';
import { CrossNumberJson, FullCrossNumberData } from '../../utils/Types';
import ExcelJS from 'exceljs';
import { FILTER_BRAND, PRODUCT_TYPE } from '../../config/env';


const WORK_FOLDER_PATH = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/jsons/Cross-Numbers`);
const OUTPUT_JSON_PATH = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/jsons/Cross-Numbers/Cross-Numbers_${PRODUCT_TYPE}_Full_Data.json`);
const OUTPUT_EXCEL_PATH = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/excels/Cross-Numbers/${PRODUCT_TYPE}_Combined_CrossNumbers.xlsx`);

export async function combineCrossNumberData(workFolderPath: string) {
    const fileNames = await fs.readdir(workFolderPath);
    const jsonFiles = fileNames
        .filter((file) => file.startsWith(`Cross-Numbers_${PRODUCT_TYPE}_${FILTER_BRAND}`) && file.endsWith(".json"));


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

export async function exportToExcel(data: FullCrossNumberData[], OUTPUT_EXCEL_PATH: string) {

    if (!data || data.length === 0) {
        console.warn("Excel'e yazılacak veri bulunamadı.");
        return;
    }

    try {

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cross Numbers');

        // Dinamik başlıkları ve crossNumbers verilerini hazırla
        const uniqueSuppliers = new Set<string>();
        data.forEach(row => {
            row.crossNumbers.forEach(cn => {
                uniqueSuppliers.add(cn.Supplier);
            });
        });

        // Başlıkları belirle
        const headers = ['YV', 'OE_NUMBERS', ...Array.from(uniqueSuppliers)];
        worksheet.columns = headers.map(header => ({ header, key: header, width: 15 }));

        // Excel satırlarını oluştur
        const rows = data.map(item => {
            const rowData: Record<string, string> = {
                YV: item.yvNo,
                OE_NUMBERS: Array.from(new Set(item.oeNumbers)).join(', ') // Benzersiz OE numaralarını birleştir
            };

            // CrossNumbers'ı supplier'a göre grupla
            const groupedSuppliers = item.crossNumbers.reduce((acc, current) => {
                const { Supplier, ArticleNumber } = current;
                if (!acc[Supplier]) {
                    acc[Supplier] = [];
                }
                acc[Supplier].push(ArticleNumber);
                return acc;
            }, {} as Record<string, string[]>);

            // Her bir supplier için ArticleNumber'ları birleştir
            headers.slice(2).forEach(supplier => {
                if (groupedSuppliers[supplier]) {
                    rowData[supplier] = Array.from(new Set(groupedSuppliers[supplier])).join(', ');
                }
            });

            return rowData;
        });

        // Verileri çalışma sayfasına ekle
        worksheet.addRows(rows);

        // Excel dosyasını kaydet
        await workbook.xlsx.writeFile(OUTPUT_EXCEL_PATH);

        console.log(`Veri başarıyla ${OUTPUT_EXCEL_PATH} dosyasına aktarıldı.`);

    } catch (error) {
        console.error("Excel'e aktarma sırasında bir hata oluştu:", error);
        throw error; // Hatanın yukarı taşınmasını sağla
    }
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