import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

// Dosya yolları
const INPUT_FILE = path.resolve(__dirname, `../output/jsons/ALL_MODELS_REPXPERT.json`);
const OUTPUT_PATH = path.resolve(__dirname, `../output/excels`);

// Çıktı klasörünün varlığını kontrol et ve gerekirse oluştur (Best practice)
if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}


// Veriyi oku ve parse et
const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

// Excel dosyasını oluştur
const workbook = xlsx.utils.book_new();


const carTypes = Object.keys(data);
carTypes.forEach((ct: string) => {

    // Yeni sayfaya yazılacak verileri alacak yeni bir dataset oluştur
    const rowData: any = [];

    const brandNames = Object.keys(data[ct]);

    brandNames.forEach((bn: string) => {

        // Her markanın model bilgilerini al - ARRAY
        const models = data[ct][bn];

        models.forEach((model: any) => {
            rowData.push({
                BRAND: bn,
                MODEL: model.name,
                "MODEL CODE": model.code,
                TYPE: model.type,
                CONSTRUCTION_YEAR_FROM: model.constructionYearFrom
            })
        })
    })
    // Veriyi Excel'e yaz

    const worksheet = xlsx.utils.json_to_sheet(rowData);
    xlsx.utils.book_append_sheet(workbook, worksheet, ct.toUpperCase());
})

xlsx.writeFile(workbook, path.resolve(OUTPUT_PATH, `ALL_MODELS_REPXPERT.xlsx`));