// src/generateLabelsFromSingleJson.ts
import fs from "fs";
import * as ExcelJS from "exceljs";
import xlsx from 'xlsx';
import { bodyTypes, brandAliases, modelAliases } from "../scrapers/api/resources/Variables";
import { ModelWithQuantity } from "./helpers/Types";
import { PRODUCT_TYPE } from "../config/env";
import { PathRepo } from "../config/PathRepo";
import { get_YV_OE_Map } from "./utils/ORJ_NO_Utils";



const lineCount = 10;
const lineLength = 50; // Test etmek için bu değeri değiştirebilirsin
const inputFilePath = PathRepo.resources(`catalog/jsons/MARKA_HAREKET.json`);
const outputFilePath = PathRepo.output(`${PRODUCT_TYPE}/excels/label/${PRODUCT_TYPE}_CUSTOMER_CATALOG_${lineCount}x${lineLength}.xlsx`);
function toPascalCase(str: string): string {
    const romanNumeralRegex = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/i;

    return str
        .replace(/\b(\p{L}+)\b/gu, (word) => {
            // Romen rakamıysa veya 3 karakterden kısaysa dokunma
            if (romanNumeralRegex.test(word) || word.length <= 3) {
                return word;
            }
            // Aksi halde PascalCase formatına çevir
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .trim();
}

/**
 * Model string'inden model ve body type bilgilerini ayrıştırır ve kısaltır.
 * @param modelString İşlenecek model metni.
 * @param includeBodyTypes Kasa tiplerinin etikete dahil edilip edilmeyeceği.
 * @returns İşlenmiş model isimlerinin dizisi.
 */
function extractAndShortenModels(modelString: string, includeBodyTypes: boolean): string[] {
    const extractedModels = new Set<string>();

    let processedString = modelString.replace(/\([^)]*\)/g, "");

    // Önce model aliaslarını işle
    for (const [key, value] of modelAliases.entries()) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        processedString = processedString.replace(regex, value);
    }

    const parts = processedString
        .split("|")
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const sortedBodyTypes = [...bodyTypes].sort((a, b) => b.length - a.length);

    for (let part of parts) {
        let currentModel = part;
        let bodyType = "";

        for (const bt of sortedBodyTypes) {
            const regex = new RegExp(`\\b${bt}\\b`, "gi");
            if (currentModel.match(regex)) {
                bodyType = bt;
                currentModel = currentModel.replace(regex, "").trim();
                break;
            }
        }

        let finalModel = toPascalCase(currentModel);
        if (includeBodyTypes && bodyType) {
            const bodyTypePascal = toPascalCase(bodyType);
            if (!finalModel.toUpperCase().includes(bodyType.toUpperCase())) {
                finalModel = `${finalModel} ${bodyTypePascal}`.trim();
            }
        }

        if (finalModel) {
            extractedModels.add(finalModel);
        }
    }

    return Array.from(extractedModels);
}

/**
 * Araç verilerini işleyerek marka ve modelleri hedeflenen araç sayısına göre sıralar.
 * @param vehicles Araç verilerinin listesi.
 * @param includeBodyTypes Kasa tiplerini dahil edip etmeyeceği.
 * @returns Sıralanmış marka ve model verilerini içeren bir Map.
 */
function getRankedBrandAndModels(vehicles: any[], includeBodyTypes: boolean): Map<string, ModelWithQuantity[]> {
    const brandData = new Map<string, { models: Map<string, { targetsCount: number; year: { from: string; to: string } }> }>();

    for (const v of vehicles) {
        const rawBrand = v.manufacturer.trim().toUpperCase();
        const brand = brandAliases.get(rawBrand) || rawBrand;

        if (!brandData.has(brand)) {
            brandData.set(brand, { models: new Map() });
        }
        const brandInfo = brandData.get(brand)!;

        for (const model of v.models) {
            const extractedModels = extractAndShortenModels(model.modelSeries, includeBodyTypes);

            let minFrom = Number.MAX_SAFE_INTEGER;
            let maxTo = Number.MIN_SAFE_INTEGER;

            for (const target of model.targets) {
                if (!isNaN(target.constructionYearFrom) && Number(target.constructionYearFrom) > 0) {
                    minFrom = Math.min(minFrom, Number(target.constructionYearFrom));
                }
                if (!isNaN(target.constructionYearTo) && Number(target.constructionYearTo) > 0) {
                    maxTo = Math.max(maxTo, Number(target.constructionYearTo));
                }
            }

            const madeYear = {
                from: minFrom < 2100 && minFrom !== Number.MAX_SAFE_INTEGER ? minFrom.toString().slice(-2) : "---",
                to: maxTo > 1900 && maxTo !== Number.MIN_SAFE_INTEGER ? maxTo.toString().slice(-2) : "---"
            };

            for (const m of extractedModels) {
                const modelKey = m.trim();

                if (!brandInfo.models.has(modelKey)) {
                    brandInfo.models.set(modelKey, { targetsCount: 0, year: madeYear });
                } else {
                    const existingModelInfo = brandInfo.models.get(modelKey)!;

                    const existingFrom = existingModelInfo.year.from !== "---" ? Number(existingModelInfo.year.from) : Number.MAX_SAFE_INTEGER;
                    const existingTo = existingModelInfo.year.to !== "---" ? Number(existingModelInfo.year.to) : Number.MIN_SAFE_INTEGER;
                    const newFrom = madeYear.from !== "---" ? Number(madeYear.from) : Number.MAX_SAFE_INTEGER;
                    const newTo = madeYear.to !== "---" ? Number(madeYear.to) : Number.MIN_SAFE_INTEGER;

                    const finalFrom = Math.min(existingFrom, newFrom);
                    const finalTo = Math.max(existingTo, newTo);

                    existingModelInfo.year.from = finalFrom === Number.MAX_SAFE_INTEGER ? "---" : finalFrom.toString().slice(-2).padStart(2, "0");
                    existingModelInfo.year.to = finalTo === Number.MIN_SAFE_INTEGER ? "---" : finalTo.toString().slice(-2).padStart(2, "0");
                }

                const modelInfo = brandInfo.models.get(modelKey)!;
                modelInfo.targetsCount += model.targets.length;
            }
        }
    }

    const sortedBrandMap = new Map<string, ModelWithQuantity[]>();
    const sortedBrands = Array.from(brandData.entries()).sort(([, a], [, b]) => b.models.size - a.models.size);

    for (const [brandName, brandInfo] of sortedBrands) {
        const sortedModels = Array.from(brandInfo.models.entries())
            .sort(([, a], [, b]) => b.targetsCount - a.targetsCount)
            .map(([modelKey, modelInfo]) => {
                const yearText = `${modelInfo.year.from}|${modelInfo.year.to}`;
                return {
                    modelText: modelKey,
                    yearText: yearText,
                    targetsCount: modelInfo.targetsCount
                } as ModelWithQuantity;
            });
        sortedBrandMap.set(brandName, sortedModels);
    }
    return sortedBrandMap;
}

/**
 * Etiket için zengin metin (RichText) formatında metin oluşturur.
 * Marka ve model sıralaması, satır tahsisi ve doluluk mantığına sadık kalarak çalışır.
 * @param vehicles Uyumlu araç verilerinin listesi.
 * @param includeYears Yıl bilgilerinin dahil edilip edilmeyeceği.
 * @param includeBodyTypes Kasa tiplerinin dahil edilip edilmeyeceği.
 * @returns Oluşturulmuş etiket metni ve zengin metin bileşenlerini içeren bir nesne.
 */
function generateLabelRichText(vehicles: any[], includeYears: boolean, includeBodyTypes: boolean): { text: string; richText: ExcelJS.RichText[] } {
    const brandSortedModelsMap = getRankedBrandAndModels(vehicles, includeBodyTypes);
    const sortedBrands = Array.from(brandSortedModelsMap.keys());
    const richTextParts: ExcelJS.RichText[] = [];
    let linesUsed = 0;

    for (const brand of sortedBrands) {
        if (linesUsed >= lineCount) {
            break; // Satır limitine ulaştıysak döngüden çık
        }

        const modelsQueue = brandSortedModelsMap.get(brand)!;
        let isFirstModelOfBrand = true;

        for (const modelInfo of modelsQueue) {
            if (linesUsed >= lineCount) {
                break; // İç döngüde de kontrol
            }

            const currentLineParts: ExcelJS.RichText[] = [];

            // Satır başı
            if (linesUsed > 0) {
                currentLineParts.push({ text: "\n" });
            }

            // Eğer markanın ilk modeli ise marka adını ekle
            if (isFirstModelOfBrand) {
                currentLineParts.push({ text: brand, font: { bold: true } });
                currentLineParts.push({ text: " " });
                isFirstModelOfBrand = false;
            }

            // Model ve yıl bilgisini ekle
            currentLineParts.push({ text: modelInfo.modelText });
            const yearText = includeYears && modelInfo.yearText && modelInfo.yearText !== "-|-" ? ` ${modelInfo.yearText}` : "";
            if (yearText) {
                currentLineParts.push({ text: yearText, font: { italic: true } });
            }

            richTextParts.push(...currentLineParts);
            linesUsed++;
        }
    }

    // Temizlik ve final çıktı
    const fullText = richTextParts.map(part => part.text).join("");
    return { text: fullText.trim(), richText: richTextParts };
}

async function getCatalogAttributes() {
    const inputFilePath = PathRepo.resources(`catalog/excels/ATTRIBUTES.xlsx`);
    const wb = xlsx.readFile(inputFilePath, { cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: any = xlsx.utils.sheet_to_json(ws);
    const map = new Map();
    data.forEach((row: any) => {
        map.set(row["YV NO"], row);
    })
    return map
}


/**
 * JSON dosyasını okur, veriyi işler ve bir Excel dosyasına yazar.
 * @returns {Promise<void>}
 */
async function processAndWriteExcel(): Promise<void> {
    // 1. Veri Okuma ve Hata Yönetimi
    let inputData: any[];
    try {
        const fileContent = fs.readFileSync(inputFilePath, "utf-8");
        inputData = JSON.parse(fileContent);
    } catch (error) {
        console.error(`❌ Hata: JSON dosyası okunamadı veya bozuk: ${inputFilePath}`, error);
        // Robustness: Hata oluşursa program akışını durdur.
        return;
    }

    // 2. Asenkron Veri Hazırlığı
    const catalogAttributes = await getCatalogAttributes();
    const YV_OE_NO_MAP = await get_YV_OE_Map();

    const workbook = new ExcelJS.Workbook();
    const FULL_CATALOG = workbook.addWorksheet("TÜM ÜRÜNLER");
    const DISC = workbook.addWorksheet("DİSK");
    const DRUM = workbook.addWorksheet("KAMPANA");
    const PAD = workbook.addWorksheet("BALATA");
    const BELTPULLEY = workbook.addWorksheet("KASNAK");

    // 3. Başlık Satırı ve Biçimlendirme
    const headerColumns = [
        { header: "YV", key: "yv", width: 12 },
        { header: "OE", key: "oe", width: 18 },
        { header: "ETIKET", key: "label", width: lineLength + 5 },
        { header: "TİP", key: "type", width: 5 },
        { header: "POZİSYON", key: "position", width: 10 },
        { header: "GRUP", key: "groupName", width: 10 },
    ];

    FULL_CATALOG.columns = headerColumns;
    DISC.columns = headerColumns;
    DRUM.columns = headerColumns;
    PAD.columns = headerColumns;
    BELTPULLEY.columns = headerColumns;

    // Başlık satırı eklenirken headers'ı otomatik kullanır, ama font ve hizalama için ilk satırı yine de manuel ayarlayalım
    FULL_CATALOG.getRow(1).font = { bold: true };
    FULL_CATALOG.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    DISC.getRow(1).font = { bold: true };
    DISC.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    DRUM.getRow(1).font = { bold: true };
    DRUM.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    PAD.getRow(1).font = { bold: true };
    PAD.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    BELTPULLEY.getRow(1).font = { bold: true };
    BELTPULLEY.getRow(1).alignment = { horizontal: "center", vertical: "middle" };


    // 4. Veri İşleme ve Excel'e Yazma Döngüsü

    for (const item of inputData) {

        // Opsiyonel Zincirleme (?.), Nullish Coalescing (??) ve Array.from/slice kullanımı çok iyi.
        const first_5_OE = Array.from(new Set(YV_OE_NO_MAP.get(item.yvNo))).slice(0, 5).join("\n");
        const attributes = catalogAttributes.get(item.yvNo);

        const type = attributes?.["Tip"] ?? ""; // Boş ise "" atama ile sağlamlık
        const position = attributes?.["Pozisyon"] ?? "";
        const groupName = attributes?.["grup::name"] ?? "";

        let labelCellContent: string | { richText: any[] };

        if (!item.compatibleVehicles || item.compatibleVehicles.length === 0) {
            // Early continue/exit mantığı temiz
            labelCellContent = "ETİKET ÜRETİLEMEDİ (UYUMLU ARAÇ YOK)";
        } else {
            const labelData = generateLabelRichText(item.compatibleVehicles, true, true);
            labelCellContent = { richText: labelData.richText };
        }

        const row = FULL_CATALOG.addRow([
            item.yvNo,
            first_5_OE,
            labelCellContent, // Hazırlanan içerik
            type,
            position,
            groupName
        ]);

        await setStyleToRow(row);

        const groupID = attributes?.["grupId"] ?? "";
        if (groupID && groupID == "1") {
            const discRow = DISC.addRow(row.values);
            await setStyleToRow(discRow);
        } else if (groupID && groupID == "2") {
            const drumRow = DRUM.addRow(row.values);
            await setStyleToRow(drumRow);
        } else if (groupID && groupID == "3") {
            const padRow = PAD.addRow(row.values);
            await setStyleToRow(padRow);
        } else if (groupID && groupID == "5") {
            const beltpulleyRow = BELTPULLEY.addRow(row.values);
            await setStyleToRow(beltpulleyRow);
        }
    }

    // 5. Dosya Yazma ve Sonlandırma
    await workbook.xlsx.writeFile(outputFilePath);
    console.log(`✅ Etiket dosyası başarıyla oluşturuldu: ${outputFilePath}`);

}

async function setStyleToRow(row: ExcelJS.Row) {
    row.getCell(1).alignment = { wrapText: true, horizontal: "center", vertical: "middle" }; // YV
    row.getCell(2).alignment = { wrapText: true, horizontal: "center", vertical: "middle" }; // OE
    row.getCell(3).alignment = { wrapText: true, horizontal: "right", vertical: "middle" };     // ETIKET
    row.getCell(4).alignment = { wrapText: true, horizontal: "center", vertical: "middle" }; // TİP
    row.getCell(5).alignment = { wrapText: true, horizontal: "center", vertical: "middle" }; // POZİSYON
    row.getCell(6).alignment = { wrapText: true, horizontal: "center", vertical: "middle" }; // GRUP
    return row;
}

// processAndWriteExcel(); // Çağrı şekliniz.

processAndWriteExcel()
    .catch((error) => console.error("Excel oluşturulurken hata oluştu:", error));


