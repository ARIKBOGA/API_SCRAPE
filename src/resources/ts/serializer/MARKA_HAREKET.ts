import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { ProductCompatibilityResult, OutputManufacturer, OutputModelSeries, OutputTarget } from '../../../utils/Types';


/**
 * Excel verilerini yvNo > manufacturer > modelSeries yapısına göre gruplayarak JSON'a dönüştürür.
 * Performans, dizilerde arama (find) yerine Map'ler kullanılarak iyileştirilmiştir.
 * @param inputFilePath Okunacak Excel dosyasının yolu.
 * @param outputDirectory JSON dosyasının yazılacağı dizin.
 */
export function convertExcelToJsonFast(inputFilePath: string, outputFilePath: string): void {
    try {
        const workbook = xlsx.readFile(inputFilePath);
        const sheetName = workbook.SheetNames.includes('KATALOG_AKTİF') ? 'KATALOG_AKTİF' : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // header: 1, ilk satırı başlık olarak kullanır
        const jsonData: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" }); // raw: false, defval: "" eklendi

        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);

        // yvNo -> ProductCompatibilityResult
        const groupedByYvNo = new Map<string, ProductCompatibilityResult>();

        // yvNo_manufacturerKey -> OutputManufacturer Map'leri tutan bir Map
        // Bu, yvNo içindeki manufacturer'ı hızlıca bulmak için
        const manufacturerMaps = new Map<string, Map<string, OutputManufacturer>>();

        // manufacturerKey_modelSeriesKey -> OutputModelSeries Map'leri tutan bir Map
        // Bu, manufacturer içindeki modelSeries'i hızlıca bulmak için
        const modelMaps = new Map<string, Map<string, OutputModelSeries>>();

        dataRows.forEach(row => {
            const rowData: { [key: string]: any } = {};
            headers.forEach((header: string, index: number) => {
                rowData[header] = row[index];
            });

            // Gerekli verileri çıkar
            const yvNo = String(rowData['yvNo']).trim();
            // Marka ve Üretici alanları aynı olduğu için tek bir anahtar kullanabiliriz, 
            // ama marka_aciklama 'yı üretici olarak kullandığınız için onu manufacturer olarak alalım.
            const brand = rowData['SUPPLIER'] || "";
            const manufacturer = rowData['marka_aciklama'] || "";
            const modelSeries = rowData['model_aciklama'] || "";
            const crossNumber = rowData['CROSS NUMBER'] || "";


            // 1. Adım: YV Numarasına göre ana öğeyi bul veya oluştur (Hızlı Map erişimi)
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

            // Manufacturer'lar için Map'i hazırla veya al
            const yvNoManufacturerKey = yvNo; // yvNo'yu anahtar olarak kullanabiliriz
            if (!manufacturerMaps.has(yvNoManufacturerKey)) {
                manufacturerMaps.set(yvNoManufacturerKey, new Map<string, OutputManufacturer>());
            }
            const manufacturerMap = manufacturerMaps.get(yvNoManufacturerKey)!;


            // 2. Adım: Üreticiye göre compatibleVehicle öğesini bul veya oluştur (Hızlı Map erişimi)
            let currentManufacturer = manufacturerMap.get(manufacturer);
            if (!currentManufacturer) {
                currentManufacturer = {
                    manufacturer: manufacturer,
                    models: []
                };
                manufacturerMap.set(manufacturer, currentManufacturer);
                currentItem.compatibleVehicles.push(currentManufacturer); // Ana listeye sadece bir kez ekle
            }

            // Modeller için Map'i hazırla veya al
            const manufacturerModelKey = `${yvNoManufacturerKey}_${manufacturer}`;
            if (!modelMaps.has(manufacturerModelKey)) {
                modelMaps.set(manufacturerModelKey, new Map<string, OutputModelSeries>());
            }
            const modelMap = modelMaps.get(manufacturerModelKey)!;

            // 3. Adım: Model Serisine göre model öğesini bul veya oluştur (Hızlı Map erişimi)
            let currentModel = modelMap.get(modelSeries);
            if (!currentModel) {
                currentModel = {
                    modelSeries: modelSeries,
                    targets: []
                };
                modelMap.set(modelSeries, currentModel);
                currentManufacturer.models.push(currentModel); // Ana listeye sadece bir kez ekle
            }

            // 4. Adım: Target verilerini oluştur ve ekle (Benzersizlik kontrolü için de Map kullanacağız)

            // Yıl dönüştürme mantığı
            const basYil = rowData['BasYil'];
            const bitYil = rowData['Bityil'];
            const fromYear = basYil ? (Number(basYil) > 30 ? `19${String(basYil).padStart(2, '0')}` : `20${String(basYil).padStart(2, '0')}`) : '';
            const toYear = bitYil ? (Number(bitYil) > 30 ? `19${String(bitYil).padStart(2, '0')}` : `20${String(bitYil).padStart(2, '0')}`) : '';

            // Target verilerini oluştur
            const target: OutputTarget = {
                engine: rowData['motor'] || "",
                fullName: `${manufacturer || ""} ${modelSeries || ""} ${rowData['motor'] || ""}`,
                constructionYearFrom: fromYear,
                constructionYearTo: toYear,
                enginePowerKW: rowData['motor kw'] || "",
                enginePowerHP: rowData['motor hp'] || "",
                cc: rowData['CC'] || "",
                engineCodes: rowData['motor kodu'] || "",
                kbaNumbers: rowData['KBA'] || "",
                bodyType: rowData['KASA Tipi'] || "",
                TecDocID: rowData['TecDocID'] || "",
            };


            // Tipi değiştiremediğimiz için, daha hafif bir anahtar ile `find` yapısı:
            if (!currentModel.targets.some((t: OutputTarget) => t.engineCodes === target.engineCodes && t.engine === target.engine && t.constructionYearFrom === target.constructionYearFrom && t.constructionYearTo === target.constructionYearTo)) {
                currentModel.targets.push(target);
            }
            // NOT: Buradaki benzersizlik kuralını (motor kodu, motor, yıl aralığı) sizin kuralınıza göre ayarladım, 
        });

        // Map'teki tüm değerleri rootJsonData dizisine ekle (Bu kısım zaten O(N))
        const rootJsonData: ProductCompatibilityResult[] = Array.from(groupedByYvNo.values());
            
        fs.writeFileSync(outputFilePath, JSON.stringify(rootJsonData, null, 2), 'utf-8');

        console.log(`Veriler başarıyla JSON'a aktarıldı : ${outputFilePath}`);

    } catch (error) {
        console.error('Excel dosyasını JSON\'a dönüştürürken bir hata oluştu:', error);
        // Hata durumunda boş çıktı dizisi olmaması için cleanup eklenebilir.
    }
}

function main() {
    // Giriş Excel dosyasının yolu
    const inputFilePath = path.resolve(__dirname, `../../catalog/excels/MARKA_HAREKET.xlsx`);
    // Çıkış JSON dosyasının kaydedileceği dizin
    const outputFilePath = path.resolve(__dirname, `../../catalog/jsons/${path.basename(inputFilePath, '.xlsx')}.json`);

    convertExcelToJsonFast(inputFilePath, outputFilePath);
}

main();