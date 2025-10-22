import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import { KentparItem } from './FullScraper.spec';
import { parseCompatibilityYears } from './utils/YearExtracter';

// JSON dosyasını oku ve KentparItem tipine dönüştür
const data: KentparItem[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, "jsons/kentpar_products.json"), 'utf-8'));

// Düzleştirilmiş (Flattened) Satır Verisini Oluşturma
// flatMap ile hem döngü yapısı kurulur hem de sonuçlar otomatik olarak tek bir dizide toplanır.
const rowData = data.flatMap((item) => {
    // Her bir ana öğe (item) içindeki 'products' dizisini işliyoruz
    return item.products.map((prod) => {
        // Her bir 'product' objesini Excel satırına dönüştürüyoruz
        const { startYear, endYear } = parseCompatibilityYears(prod.years);
        return {
            "Kentpar_NO": item.KENTPAR_NO || "",
            "OE_NO": prod.oe || "",
            "Compatible_Model": prod.compatibility || "",
            "Year": prod.years || "",
            "Start_Year": startYear || "",
            "End_Year": endYear || "",
            "Engine": prod.engine || ""
        }
    });
});

// Artık rowData, tek boyutlu ve temiz bir Excel satırları dizisidir.
console.log(`Toplam ${rowData.length} satır verisi Excel'e yazılacak.`);

// Excel İşlemleri (Değişiklik yok, zaten doğruydu)
const header = ["Kentpar_NO", "OE_NO", "Compatible_Model", "Year", "Start_Year", "End_Year", "Engine"];
const ws = xlsx.utils.json_to_sheet(rowData, { header });
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Kentpar Products");
xlsx.writeFile(wb, path.resolve(__dirname, "excels/Kentpar_Products_V.xlsx"));

console.log("✅ Veri başarıyla Excel'e yazıldı: Kentpar_Products.xlsx");