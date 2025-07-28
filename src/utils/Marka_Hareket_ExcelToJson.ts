import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { RootJsonData, OutputManufacturer, OutputModelSeries, OutputTarget, ProductCompatibilityResult } from './Types'; // Types dosyanızdan import edin

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
        const sheetName = workbook.SheetNames.includes('FULL LİSTE') ? 'FULL LİSTE' : workbook.SheetNames[0];
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
            const yvNo = String(rowData['YV']);
            const crossNumber = String(rowData['CROSS NUMBER']);
            const brand = String(rowData['MARKA']); // 'MARKA' sütunu hem brand hem de manufacturer için kullanılacak
            const manufacturer = String(rowData['MARKA']); // 'MARKA' sütunu hem brand hem de manufacturer için kullanılacak
            const modelSeries = String(rowData['MODEL']);

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

            // Target verilerini oluştur
            const target: OutputTarget = {
                engine: String(rowData['MOTOR']),
                // fullName alanı Excel'de doğrudan bulunmadığı için uygun bir değer atanabilir
                fullName: `${String(rowData['MARKA'])} ${String(rowData['MODEL'])} ${String(rowData['MOTOR'])}`, 
                // Yıl bilgilerini "YY" formatından "YYYY" formatına dönüştür
                constructionYearFrom: rowData['Baş. Yil'] ? `20${String(rowData['Baş. Yil'])}` : '',
                constructionYearTo: rowData['Bit. Yil'] ? `20${String(rowData['Bit. Yil'])}` : '',
                enginePowerKW: String(rowData['KW']),
                enginePowerHP: String(rowData['HP']),
                cc: String(rowData['CC']), // Kullanıcının isteği üzerine string olarak bırakıldı
                engineCodes: String(rowData['MOTOR KODU']),
                kbaNumbers: String(rowData['KBA']),
                bodyType: String(rowData['KASA Tipi']),
                TecDocID: rowData['TecDocID'] ? String(rowData['TecDocID']) : undefined, // Opsiyonel
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
    const inputFilePath = path.resolve(__dirname, `../output/${productType}/excels/marka_hareket/MARKA_HAREKET.xlsx`);
    // Çıkış JSON dosyasının kaydedileceği dizin
    const outputDirectory = path.resolve(__dirname, `../output/${productType}/jsons/marka_hareket`);

    convertExcelToJson(inputFilePath, outputDirectory);
}

main();
