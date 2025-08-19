import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

import dotenv from 'dotenv';


dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

// JSON verisinin yolu
const jsonFilePath = path.resolve(__dirname, `../output/${productType}/jsons/Cross-Numbers/Cross-Numbers_${productType}_Full_Data.json`); // Dosya yolunu kendi product type'ınıza göre güncelleyin.

// Excel dosyasının kaydedileceği yol
const excelFilePath = path.resolve(__dirname, `../output/${productType}/excels/Cross-Numbers/${productType}_Combined_CrossNumbers_wip.xlsx`); // İstediğiniz ismi verebilirsiniz.

// JSON'dan dönüştürülen tip
type FullCrossNumberData = {
    yvNo: string;
    oeNumbers: string[];
    crossNumbers: {
        Supplier: string;
        ArticleNumber: string;
    }[];
};

export async function exportToExcel() {
    try {
        const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
        const data: FullCrossNumberData[] = JSON.parse(fileContent);

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
                OE_NUMBERS: item.oeNumbers.join(', ') // OE numaralarını birleştir
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
        await workbook.xlsx.writeFile(excelFilePath);

        console.log(`Veri başarıyla ${excelFilePath} dosyasına aktarıldı.`);

    } catch (error) {
        console.error("Bir hata oluştu:", error);
    }
}

exportToExcel();