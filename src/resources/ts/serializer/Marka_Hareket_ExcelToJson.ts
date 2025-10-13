import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { RootJsonData, OutputManufacturer, OutputModelSeries, OutputTarget, ProductCompatibilityResult } from '../utils/Types'; // Types dosyanızdan import edin

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

/**
 * Converts an Excel file back to a Vehicle-Compatibility JSON file.
 * @param inputFilePath The path to the Excel file to be read.
 * @param outputDirectory The directory where the JSON file will be saved.
 */
export function convertExcelToJson(inputFilePath: string, outputDirectory: string): void {
    try {
        // Excel dosyasını oku
        const workbook = XLSX.readFile(inputFilePath);

        // 'All Sheets' adlı ilk çalışma sayfasını al
        // Eğer 'All Sheets' yoksa, ilk sayfayı kullanırız.
        const sheetName = workbook.SheetNames.includes('KATALOG_AKTİF') ? 'KATALOG_AKTİF' : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Çalışma sayfasını JSON formatına dönüştür
        // header: 1, ilk satırı başlık olarak kullanır
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Başlık satırını al (ilk satır)
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1); // Veri satırlarını al (başlık hariç)

        // JSON verilerini depolamak için boş bir RootJsonData dizisi oluştur
        const rootJsonData: RootJsonData = [];

        // YV Numarasına göre gruplamak için bir Map kullan
        const groupedByYvNo = new Map<string, ProductCompatibilityResult>();

        dataRows.forEach(row => {
            const rowData: { [key: string]: any } = {};
            headers.forEach((header: string, index: number) => {
                rowData[header] = row[index];
            });

            // Excel'den gelen verileri al ve başlıkları tam olarak eşleştir
            const yvNo = rowData['yvNo'];
            const crossNumber = rowData['CROSS NUMBER'] || "";
            const brand = rowData['SUPPLIER'] || ""; // 'MARKA' sütunu hem brand hem de manufacturer için kullanılacak
            const manufacturer = rowData['marka_aciklama'] || ""; // 'MARKA' sütunu hem brand hem de manufacturer için kullanılacak
            const modelSeries = rowData['model_aciklama'] || "";

            // YV Numarasına göre ana öğeyi bul veya oluştur
            let currentItem = groupedByYvNo.get(yvNo);
            if (!currentItem) {
                currentItem = {
                    yvNo: yvNo,
                    brand: brand,
                    crossNumber: crossNumber,
                    compatibleVehicles: []
                };
                groupedByYvNo.set(yvNo, currentItem);
            }

            // Üreticiye göre compatibleVehicle öğesini bul veya oluştur
            let currentManufacturer: OutputManufacturer | undefined = currentItem.compatibleVehicles.find(
                (v: OutputManufacturer) => v.manufacturer === manufacturer
            );
            if (!currentManufacturer) {
                currentManufacturer = {
                    manufacturer: manufacturer,
                    models: []
                };
                currentItem.compatibleVehicles.push(currentManufacturer);
            }

            // Model Serisine göre model öğesini bul veya oluştur
            let currentModel: OutputModelSeries | undefined = currentManufacturer.models.find(
                (m: OutputModelSeries) => m.modelSeries === modelSeries
            );
            if (!currentModel) {
                currentModel = {
                    modelSeries: modelSeries,
                    targets: []
                };
                currentManufacturer.models.push(currentModel);
            }

            // Yıl bilgilerini "YY" formatından "YYYY" formatına dönüştür
            const basYil = rowData['BasYil'];
            const bitYil = rowData['Bityil'];
            const fromYear = basYil ? (basYil > 30 ? `19${String(basYil)}` : `20${String(basYil)}`) : '';
            const toYear = bitYil ? (Number(bitYil) > 30 ? `19${String(bitYil)}` : `20${String(bitYil)}`) : '';
            const kw: string = rowData['motor kw'] ? rowData['motor kw'] : "";
            const hp: string = rowData['motor hp'] ? rowData['motor hp'] : "";
            const cc: string = rowData['CC'] ? rowData['CC'] : "";

            // Target verilerini oluştur
            const target: OutputTarget = {
                engine: rowData['motor'] || "",
                // fullName alanı Excel'de doğrudan bulunmadığı için uygun bir değer atanabilir
                fullName: `${rowData['marka_aciklama'] || ""} ${rowData['model_aciklama'] || ""} ${rowData['motor'] || ""}`,
                constructionYearFrom: fromYear,
                constructionYearTo: toYear,
                enginePowerKW: kw,
                enginePowerHP: hp,
                cc: cc,
                engineCodes: rowData['motor kodu'] || "",
                kbaNumbers: rowData['KBA'] || "",
                bodyType: rowData['KASA Tipi'] || "",
                TecDocID: rowData['TecDocID'] || "",
            };

            // Hedefi ekle, aynı hedefi birden fazla kez eklememek için kontrol et
            // JSON.stringify kullanarak hedef nesnesinin benzersiz bir temsilini oluştur
            const targetKey = JSON.stringify(target);
            if (!currentModel.targets.some(t => JSON.stringify(t) === targetKey)) {
                currentModel.targets.push(target);
            }
        });

        // Map'teki tüm değerleri rootJsonData dizisine ekle
        groupedByYvNo.forEach(item => {
            rootJsonData.push(item);
        });

        // Çıkış dizininin var olduğundan emin olun, yoksa oluşturun
        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, { recursive: true });
        }

        // JSON verilerini bir dosyaya yaz
        const outputFileName = `${path.basename(inputFilePath, '.xlsx')}.json`;
        const outputFilePath = path.join(outputDirectory, outputFileName);
        fs.writeFileSync(outputFilePath, JSON.stringify(rootJsonData, null, 2), 'utf-8');

        console.log(`Veriler başarıyla JSON'a aktarıldı: ${outputFilePath}`);

    } catch (error) {
        console.error('Excel dosyasını JSON\'a dönüştürürken bir hata oluştu:', error);
    }
}

function main() {
    // Giriş Excel dosyasının yolu
    const inputFilePath = path.resolve(__dirname, `../output/${productType}/excels/marka_hareket/MARKA_HAREKET_KATALOG.xlsx`);
    // Çıkış JSON dosyasının kaydedileceği dizin
    const outputDirectory = path.resolve(__dirname, `../output/${productType}/jsons/marka_hareket`);

    convertExcelToJson(inputFilePath, outputDirectory);
}

main();
