import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Çevre değişkenlerini yükle
dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

// Dosya yolları
const INPUT_FILE = path.resolve(__dirname, `../../output/${productType}/jsons/Attributes/Attributes_${productType}_${filterBrand}.json`);
const OUTPUT_PATH = path.resolve(__dirname, `../../output/${productType}/excels/Attributes`);

// Çıktı klasörünün varlığını kontrol et ve gerekirse oluştur (Best practice)
if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

// Veriyi oku ve parse et
const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

// Tip tanımları (mevcut tanımlarınız yeterince temiz)
type AttributeItem = {
    yvNo: string,
    crossNumber: string,
    supplier: string,
    attributes: {
        name: string,
        value: string
    }[]
}

type Row = {
    yvNo: string,
    crossNumber: string,
    supplier: string,
    [key: string]: string | number; // Dinamik attribute'ler için
}

// 1. Adım: Tüm olası attribute (öznitelik) isimlerini topla.
// Bu, Excel sütun başlıklarını dinamik olarak oluşturmak için kritik.
const allAttributeNames = new Set<string>();
data.forEach((item: AttributeItem) => {
    item.attributes.forEach(attr => {
        allAttributeNames.add(attr.name);
    });
});

// Temel başlıklar
const baseHeaders = ['yvNo', 'crossNumber', 'supplier'];

// Tüm sütun başlıklarını birleştir
const headers: string[] = [...baseHeaders, ...Array.from(allAttributeNames)];


// 2. Adım: Veriyi düz (flat) satır yapısına dönüştür.
const rows: Row[] = data.map((item: AttributeItem) => {
    const { yvNo, crossNumber, supplier, attributes } = item;
    const attributeMap: Record<string, string> = {};

    attributes.forEach(attribute => {
        // Özel WVA Number kuralı (mevcut kodunuzdan alındı, mantıklı)
        if (attribute.name === "WVA Number" && !attribute.value.includes(yvNo.slice(0, 5))) {
             // WVA Numarası 5 haneli yvNo önekini içermiyorsa ekle
             const newValue = yvNo.slice(0, 5) + ", " + attribute.value;
             attributeMap[attribute.name] = newValue;
             console.log(`LOG: YvNo (${yvNo}) öneki eklendi: ${newValue}`);
        } else {
            attributeMap[attribute.name] = attribute.value;
        }
    });

    // Ana verileri ve attribute'leri tek bir objede birleştir
    return {
        yvNo,
        crossNumber,
        supplier,
        ...attributeMap
    }
});


// 3. Adım: Excel dosyasını oluştur.

const workbook = XLSX.utils.book_new();

// Veri dizisini (rows) ve başlıkları (headers) kullanarak nihai satırları oluştur
const excelData = rows.map(row => 
    headers.map(header => row[header] || "") // Başlık sırasına göre değerleri yerleştir, bulunamazsa "" kullan
);

// Worksheet oluştur: Başlıklar ve veri
const worksheet = XLSX.utils.aoa_to_sheet([headers, ...excelData]);

XLSX.utils.book_append_sheet(workbook, worksheet, 'Attributes');

const OUTPUT_FILE = path.resolve(OUTPUT_PATH, `Attributes_${productType}_${filterBrand}.xlsx`);

try {
    XLSX.writeFile(workbook, OUTPUT_FILE);
    console.log(`Başarılı: Veri "${OUTPUT_FILE}" dosyasına aktarıldı. 🎉`);
} catch (error) {
    console.error("Hata: Excel dosyası yazılırken bir sorun oluştu.", error);
}
