import fs from "fs";
import path from "path";
import * as ExcelJS from "exceljs";
import { bodyTypes, brandAliases, modelAliases } from "../scrapers/api/resources/Variables";
import dotenv from 'dotenv';
import { toPascalCase } from "./helpers/Functions";
import { ModelWithInfo } from "./helpers/Types";

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

const lineCount = 7;
const lineLength = 29;

const inputFilePath = path.resolve(__dirname, `../resources/data/catalogInfo/jsons/MARKA_HAREKET_KATALOG.json`);
const outputFilePath = path.resolve(__dirname, `../output/${productType}/excels/label/${productType}_Label_WOD_${lineCount}x${lineLength}_With_Options.xlsx`);

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
function getRankedBrandAndModels(vehicles: any[], includeBodyTypes: boolean): Map<string, ModelWithInfo[]> {
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
                from: minFrom < 2100 && minFrom !== Number.MAX_SAFE_INTEGER ? minFrom.toString().slice(-2) : "-",
                to: maxTo > 1900 && maxTo !== Number.MIN_SAFE_INTEGER ? maxTo.toString().slice(-2) : "-"
            };

            for (const m of extractedModels) {
                const modelKey = m.trim();

                if (!brandInfo.models.has(modelKey)) {
                    brandInfo.models.set(modelKey, { targetsCount: 0, year: madeYear });
                } else {
                    const existingModelInfo = brandInfo.models.get(modelKey)!;

                    const existingFrom = existingModelInfo.year.from !== "-" ? Number(existingModelInfo.year.from) : Number.MAX_SAFE_INTEGER;
                    const existingTo = existingModelInfo.year.to !== "-" ? Number(existingModelInfo.year.to) : Number.MIN_SAFE_INTEGER;
                    const newFrom = madeYear.from !== "-" ? Number(madeYear.from) : Number.MAX_SAFE_INTEGER;
                    const newTo = madeYear.to !== "-" ? Number(madeYear.to) : Number.MIN_SAFE_INTEGER;

                    const finalFrom = Math.min(existingFrom, newFrom);
                    const finalTo = Math.max(existingTo, newTo);

                    existingModelInfo.year.from = finalFrom === Number.MAX_SAFE_INTEGER ? "-" : finalFrom.toString().padStart(2, "0");
                    existingModelInfo.year.to = finalTo === Number.MIN_SAFE_INTEGER ? "-" : finalTo.toString().padStart(2, "0");
                }

                const modelInfo = brandInfo.models.get(modelKey)!;
                modelInfo.targetsCount += model.targets.length;
            }
        }
    }

    const sortedBrandMap = new Map<string, ModelWithInfo[]>();
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
                } as ModelWithInfo;
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

    const totalModels = Array.from(brandSortedModelsMap.values()).reduce((sum, models) => sum + models.length, 0);
    const modelPointers = new Map(sortedBrands.map(brand => [brand, 0]));
    let linesUsed = 0;

    for (const brand of sortedBrands) {
        if (linesUsed >= lineCount) {
            break; // Toplam satır limitine ulaştıysak döngüden çık
        }

        const modelsQueue = brandSortedModelsMap.get(brand)!;
        const brandModelCount = modelsQueue.length;
        const brandLineAllocation = totalModels > 0 ? (brandModelCount / totalModels) * lineCount : 0;
        const allocatedLines = Math.round(brandLineAllocation);

        // Kalan satır sayısından fazla tahsis etmemek için kontrol
        const linesToAllocate = Math.min(allocatedLines, lineCount - linesUsed);

        for (let i = 0; i < linesToAllocate; i++) {
            let currentLineParts: ExcelJS.RichText[] = [];
            let currentLineLength = 0;
            let modelPointer = modelPointers.get(brand)!;

            // Satır başlangıcı: Marka adı (sadece ilk tahsis edilen satır için)
            if (i === 0) {
                const brandText = brand;
                currentLineParts.push({ text: brandText, font: { bold: true } });
                currentLineLength = brandText.length;
            }

            // Modelle devam etme
            let separator = " ";

            // Eğer satır boşsa (yani marka adı bile sığmadıysa) veya marka adından sonra model ekliyorsak virgül yok
            if (currentLineLength === 0) {
                separator = "";
            } else if (currentLineParts.length === 1 && currentLineParts[0].text === brand) {
                separator = " ";
            } else {
                separator = ", ";
            }

            while (modelPointer < modelsQueue.length) {
                const modelInfo = modelsQueue[modelPointer];
                const yearText = includeYears && modelInfo.yearText && modelInfo.yearText !== "-|-" ? ` ${modelInfo.yearText}` : "";
                const potentialModelText = modelInfo.modelText + yearText;
                const potentialLineLen = currentLineLength + separator.length + potentialModelText.length;

                if (potentialLineLen <= lineLength) {
                    if (currentLineLength > 0) currentLineParts.push({ text: separator });
                    currentLineParts.push({ text: modelInfo.modelText });
                    if (yearText) currentLineParts.push({ text: yearText, font: { italic: true } });
                    currentLineLength = potentialLineLen;
                    modelPointers.set(brand, modelPointer + 1);
                    modelPointer++;
                    separator = ", "; // İlk modelden sonra virgül koy
                } else {
                    break;
                }
            }

            // Satırda hiçbir şey yoksa (ilk model bile sığmadıysa), bu tahsisi atla
            if (currentLineParts.length === 0) {
                // Eğer marka adını bile ekleyemediyse bir sonraki markaya geç
                break;
            }

            if (linesUsed > 0) {
                richTextParts.push({ text: "\n" });
            }
            richTextParts.push(...currentLineParts);
            linesUsed++;
        }
    }

    // Temizlik ve final çıktı
    const fullText = richTextParts.map(part => part.text).join("");
    return { text: fullText.trim(), richText: richTextParts };
}


async function processAndWriteExcel() {
    let inputData;
    try {
        inputData = JSON.parse(fs.readFileSync(inputFilePath, "utf-8"));
    } catch (error) {
        console.error(`Hata: JSON dosyası okunamadı veya bozuk: ${inputFilePath}`, error);
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Etiketler");

    worksheet.addRow(["YV", "CROSS", "ETIKET"]);
    worksheet.getRow(1).font = { bold: true };

    for (const item of inputData) {
        if (!item.compatibleVehicles || item.compatibleVehicles.length === 0) {
            worksheet.addRow([item.yvNo, item.crossNumber, "ETİKET ÜRETİLEMEDİ (UYUMLU ARAÇ YOK)"]);
            continue;
        }

        const labelData = generateLabelRichText(item.compatibleVehicles, true, false); // Yıllar ve kasa tipleri dahil/hariç

        const row = worksheet.addRow([item.yvNo, item.crossNumber, { richText: labelData.richText }]);

        const labelCell = row.getCell(3);
        labelCell.alignment = { wrapText: true };
    }

    worksheet.columns = [
        { header: "YV", key: "yv", width: 15 },
        { header: "CROSS", key: "cross", width: 15 },
        { header: "ETIKET", key: "label", width: lineLength + 5 },
    ];

    await workbook.xlsx.writeFile(outputFilePath);
    console.log("Etiket dosyası oluşturuldu:", outputFilePath);
}

processAndWriteExcel()
    .catch((error) => console.error("Excel oluşturulurken hata oluştu:", error));


// Uzuzn modelleri alt satıra yazan kod
/*
// Sadece generateLabelRichText fonksiyonu güncellenmiştir.

function generateLabelRichText(vehicles: any[], includeYears: boolean, includeBodyTypes: boolean): { text: string; richText: ExcelJS.RichText[] } {
    const brandSortedModelsMap = getRankedBrandAndModels(vehicles, includeBodyTypes);
    const sortedBrands = Array.from(brandSortedModelsMap.keys());
    const richTextParts: ExcelJS.RichText[] = [];

    // Yeni, daha doğru tip tanımı
    type LabelItem =
        | { type: 'brand'; text: string; isBold: true }
        | { type: 'model'; text: string; yearText?: string; isItalic: true };

    const labelItems: LabelItem[] = [];
    for (const brand of sortedBrands) {
        labelItems.push({ type: 'brand', text: brand, isBold: true });
        const modelsQueue = brandSortedModelsMap.get(brand)!;
        for (const modelInfo of modelsQueue) {
            let modelText = modelInfo.modelText;
            const yearText = includeYears && modelInfo.yearText && modelInfo.yearText !== "-|-" ? ` ${modelInfo.yearText}` : undefined;
            labelItems.push({ type: 'model', text: modelText, yearText, isItalic: true });
        }
    }

    let linesUsed = 0;
    let currentLineParts: ExcelJS.RichText[] = [];
    let currentLineLength = 0;

    for (const item of labelItems) {
        if (linesUsed >= lineCount) {
            break; // Satır limitini aştık
        }
        
        let partText = item.text;
        const separator = currentLineLength > 0 ? ", " : "";

        // Marka adı ise ve satır boş değilse, yeni satıra geç
        if (item.type === 'brand' && currentLineLength > 0) {
            richTextParts.push(...currentLineParts);
            richTextParts.push({ text: "\n" });
            linesUsed++;
            
            // Satır limitini kontrol et
            if (linesUsed >= lineCount) {
                 break;
            }

            currentLineParts = [];
            currentLineLength = 0;
        }

        let fullItemText = partText;
        if (item.type === 'model' && item.yearText) {
            fullItemText += item.yearText;
        }

        const potentialLineLen = currentLineLength + (currentLineLength > 0 ? separator.length : 0) + fullItemText.length;

        if (potentialLineLen <= lineLength) {
            // Öğe satıra sığıyor, ekle
            if (currentLineLength > 0) currentLineParts.push({ text: separator });
            currentLineParts.push({ text: partText, font: { bold: item.type === 'brand' } });
            if (item.type === 'model' && item.yearText) {
                currentLineParts.push({ text: item.yearText, font: { italic: true } });
            }
            currentLineLength = potentialLineLen;
        } else {
            // Öğe satıra sığmıyor, yeni satıra geç
            if (currentLineLength > 0) {
                richTextParts.push(...currentLineParts);
                richTextParts.push({ text: "\n" });
                linesUsed++;
                 // Satır limitini kontrol et
                if (linesUsed >= lineCount) {
                    break;
                }
            }
            
            // Yeni satırda öğeyi ekle
            currentLineParts = [];
            currentLineParts.push({ text: partText, font: { bold: item.type === 'brand' } });
            if (item.type === 'model' && item.yearText) {
                currentLineParts.push({ text: item.yearText, font: { italic: true } });
            }
            currentLineLength = fullItemText.length;
        }
    }
    
    // Son kalan satırı ekle
    if (currentLineParts.length > 0 && linesUsed < lineCount) {
        if (linesUsed > 0) {
            richTextParts.push({ text: "\n" });
        }
        richTextParts.push(...currentLineParts);
        linesUsed++;
    }

    // Kalan satırları boş string ile doldurma (richText'te boş satır olarak görünmesi için)
    while (linesUsed < lineCount) {
        if (richTextParts.length > 0 && richTextParts[richTextParts.length - 1].text !== "\n") {
            richTextParts.push({ text: "\n" });
        }
        richTextParts.push({ text: "" });
        linesUsed++;
    }
    
    const fullText = richTextParts.map(part => part.text).join("");
    return { text: fullText.trim(), richText: richTextParts };
}
*/