import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { OutputManufacturer, OutputModelSeries, OutputTarget, RootJsonData } from './Types';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;


/**
 * JSON verisini okur ve her crossNumber için ayrı bir Excel sayfasına yazdırır.
 *
 * @param inputDirPath JSON dosyalarının bulunduğu dizin.
 * @param outputFilePath Oluşturulacak Excel dosyasının yolu ve adı.
 */
export function convertJsonToExcel(inputDirPath: string, outputFilePath: string): void {
  const workbook = XLSX.utils.book_new();

  try {
    const files = fs.readdirSync(inputDirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json') && file.includes('ICER'));

    if (jsonFiles.length === 0) {
      console.warn(`Uyarı: '${inputDirPath}' dizininde hiçbir JSON dosyası bulunamadı.`);
      return;
    }

    jsonFiles.forEach(file => {
      const filePath = path.join(inputDirPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data: RootJsonData = JSON.parse(fileContent); // RootJsonData tipini kullanıyoruz

      data.forEach(item => {
        const sheetName = item.crossNumber;

        let worksheet: XLSX.WorkSheet;
        let sheetIndex = workbook.SheetNames.indexOf(sheetName);

        const sheetRows: any[][] = [];

        // Başlık satırı sadece yeni bir sayfa oluşturulduğunda eklenmeli
        if (sheetIndex === -1) {
          sheetRows.push([
            'yvNo',
            'brand',
            'manufacturer',
            'modelSeries',
            'engine', // OutputTarget'taki 'name' alanı buna karşılık geliyor
            'fullName',
            'constructionYearFrom',
            'constructionYearTo',
            'enginePowerKW',
            'enginePowerHP',
            'cc', // displacementCCM'den gelecek
            'engineCodes',
            'kbaNumbers',
            'bodyType',
            'TecDocID' // Veya sabit bir değer ('24490')
          ]);
        }

        item.compatibleVehicles.forEach((vehicle: OutputManufacturer) => {
          vehicle.models.forEach((model: OutputModelSeries) => {
            model.targets.forEach((target: OutputTarget) => {
              // String'den number'a dönüşüm burada yapılıyor
              const enginePowerKW = Number(target.enginePowerKW) || 0;
              const enginePowerHP = Number(target.enginePowerHP) || 0;
              const cc = Number(target.cc) || 0; // OutputTarget'a cc eklendiğini varsayıyoruz

              sheetRows.push([
                item.yvNo,
                item.brand,
                vehicle.manufacturer,
                model.modelSeries,
                target.name, // 'engine' yerine OutputTarget'taki 'name' alanı
                target.fullName,
                target.constructionYearFrom,
                target.constructionYearTo,
                enginePowerKW,
                enginePowerHP,
                cc,
                target.engineCodes, // Diziyi string'e çeviriyoruz
                target.kbaNumbers, // Diziyi string'e çeviriyoruz
                target.bodyType,
                target.TecDocID || '' // Eğer TecDocID yoksa boş bırak, veya sabit değer '24490'
              ]);
            });
          });
        });

        if (sheetIndex === -1) {
          worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        } else {
          // Mevcut sayfayı güncelle: Başlık satırı hariç yeni verileri ekle
          worksheet = workbook.Sheets[sheetName];
          const currentData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          const updatedData = [...currentData, ...sheetRows.slice(1)]; // Mevcut veriye başlık hariç yeni satırları ekle

          delete workbook.Sheets[sheetName]; // Mevcut sayfayı sil
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(updatedData), sheetName); // Güncellenmiş veriyle yeniden oluştur
        }
      });
    });

    XLSX.writeFile(workbook, outputFilePath);
    console.log(`Veriler başarıyla Excel'e aktarıldı: ${outputFilePath}`);
  } catch (error) {
    console.error('Excel dosyası oluşturulurken bir hata oluştu:', error);
  }
}


function main(){

    const inputDir = path.resolve(__dirname, `../output/${productType}`);
    const outputDir = path.resolve(__dirname, `../output/${productType}/excels`);
    convertJsonToExcel(inputDir, outputDir);
}

main();