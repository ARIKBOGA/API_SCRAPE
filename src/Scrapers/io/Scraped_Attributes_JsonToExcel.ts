import XLSX from 'xlsx';
import path from 'path';
import { FILTER_BRAND, PRODUCT_TYPE } from '../../config/env';
import { AttributeItem, AttributeRow } from '../../utils/Types';
import { mkdirIfNotExists } from '../../io/utils/Workspace_IO_Utils';





export async function scraped_Attributes_JsonToExcel(results: AttributeItem[]): Promise<void> {

    // Dosya yolları
    const OUTPUT_DIR = path.resolve(__dirname, `../../output/${PRODUCT_TYPE}/excels/Attributes`);
    const OUTPUT_FILE = path.resolve(OUTPUT_DIR, `Attributes_${PRODUCT_TYPE}_${FILTER_BRAND}.xlsx`);
    mkdirIfNotExists(OUTPUT_DIR);


    // Tüm olası attribute (öznitelik) isimlerini topla.
    // Bu, Excel sütun başlıklarını dinamik olarak oluşturmak için kritik.
    const allAttributeNames = new Set<string>();
    results.forEach((item: AttributeItem) => {
        item.attributes.forEach(attr => {
            allAttributeNames.add(attr.name);
        });
    });

    // Temel başlıklar
    const baseHeaders = ['yvNo', 'crossNumber', 'supplier'];

    // Tüm sütun başlıklarını birleştir
    const headers: string[] = [...baseHeaders, ...Array.from(allAttributeNames)];


    // Veriyi düz (flat) satır yapısına dönüştür.
    const rows: AttributeRow[] = results.map((item: AttributeItem) => {
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


    // Veri dizisini (rows) ve başlıkları (headers) kullanarak nihai satırları oluştur
    const excelData = rows.map(row =>
        headers.map(header => row[header] || "") // Başlık sırasına göre değerleri yerleştir, bulunamazsa "" kullan
    );

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...excelData]);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attributes');

    try {
        XLSX.writeFile(workbook, OUTPUT_FILE);
        console.log(`Başarılı: Veri "${OUTPUT_FILE}" dosyasına aktarıldı. 🎉`);
    } catch (error) {
        console.error("Hata: Excel dosyası yazılırken bir sorun oluştu.", error);
    }

}

function main() {
    //scraped_Attributes_JsonToExcel();
}

main();