// src/generateLabelsFromSingleJson.ts
import fs from "fs";
import path from "path";
import * as ExcelJS from "exceljs";
import { bodyTypes, brandAliases, modelAliases } from "./Variables";
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

const lineCount = 5;
const lineLength = 65;
const modelsNeedsToBePascalCased = new Set(JSON.parse(fs.readFileSync(path.resolve(__dirname, `../resources/data/catalogInfo/jsons/modelsNeedsToBePascalCased.json`), "utf-8")));
const inputFilePath = path.resolve(__dirname, `../output/${productType}/jsons/marka_hareket/MARKA_HAREKET.json`);
const outputFilePath = path.resolve(__dirname, `../output/${productType}/excels/Label/${productType}_Label_Optimized_Weighted_Brand_Models_ItalicYears_WithOptions_${lineCount}x${lineLength}_windsurf.xlsx`);

function toPascalCase(str: string): string {
    return str
        .replace(/\b(\p{L}+)\b/gu, (word) => {
            if (word.length <= 3) return word;
            return modelsNeedsToBePascalCased.has(word) ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .trim();
}


// Güncellenmiş extractAndShortenModels fonksiyonu
function extractAndShortenModels(modelString: string, includeBodyTypes: boolean): string[] {
    const extractedModels = new Set<string>();
    const modelAliasesRegex = new RegExp(Object.keys(modelAliases).join("|"), "gi");
    const bodyTypesRegex = new RegExp(includeBodyTypes ? bodyTypes.join("|") : "", "gi");

    modelString
        .replace(/\([^)]*\)/g, "")
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .forEach((part) => {
            let currentModel = part
                .replace(modelAliasesRegex, (match) => modelAliases.get(match) as string)
                .replace(bodyTypesRegex, (match) => includeBodyTypes ? ` ${match}` : "");

            extractedModels.add(toPascalCase(currentModel));
        });

    return Array.from(extractedModels);
}

interface ModelWithInfo {
    modelText: string;
    yearText: string;
    targetsCount: number;
}

function getRankedBrandAndModels(vehicles: any[], includeBodyTypes: boolean): Map<string, ModelWithInfo[]> {
    const brandData = new Map<string, { models: Map<string, ModelWithInfo> }>();

    for (const v of vehicles) {
        const rawBrand = v.manufacturer.trim().toUpperCase();
        const brand = brandAliases.get(rawBrand) || rawBrand;

        if (!brandData.has(brand)) {
            brandData.set(brand, { models: new Map() });
        }
        const brandInfo = brandData.get(brand)!;

        for (const model of v.models) {
            const extractedModels = extractAndShortenModels(model.modelSeries, includeBodyTypes);

            for (const m of extractedModels) {
                const modelKey = m.trim();

                if (!brandInfo.models.has(modelKey)) {
                    const year = getMinMaxYears(model.targets);
                    brandInfo.models.set(modelKey, {
                        modelText: modelKey,
                        yearText: year.from + "|" + year.to,
                        targetsCount: model.targets.length
                    });
                } else {
                    const existingModelInfo = brandInfo.models.get(modelKey)!;
                    const newYear = getMinMaxYears(model.targets);

                    existingModelInfo.yearText = getUnionYears(existingModelInfo.yearText, newYear);
                    existingModelInfo.targetsCount += model.targets.length;
                }
            }
        }
    }

    const sortedBrandMap = new Map<string, ModelWithInfo[]>();
    const sortedBrands = Array.from(brandData.entries()).sort(([, a], [, b]) => b.models.size - a.models.size);

    for (const [brandName, brandInfo] of sortedBrands) {
        const sortedModels = Array.from(brandInfo.models.entries())
            .sort(([, a], [, b]) => b.targetsCount - a.targetsCount)
            .map(([modelKey, modelInfo]) => modelInfo);
        sortedBrandMap.set(brandName, sortedModels);
    }
    return sortedBrandMap;
}

function getMinMaxYears(targets: any[]): { from: string; to: string } {
    let minFrom = Number.MAX_SAFE_INTEGER;
    let maxTo = Number.MIN_SAFE_INTEGER;

    for (const target of targets) {
        if (!isNaN(target.constructionYearFrom) && Number(target.constructionYearFrom) > 0) {
            const from = Number(target.constructionYearFrom);
            minFrom = Math.min(minFrom, from);
        }
        if (!isNaN(target.constructionYearTo) && Number(target.constructionYearTo) > 0) {
            const to = Number(target.constructionYearTo);
            maxTo = Math.max(maxTo, to);
        }
    }

    return {
        from: minFrom < 2100 && minFrom !== Number.MAX_SAFE_INTEGER ? minFrom.toString().slice(-2) : "-",
        to: maxTo > 1900 && maxTo !== Number.MIN_SAFE_INTEGER ? maxTo.toString().slice(-2) : "-"
    };
}

function getUnionYears(years1: string, years2: { from: string; to: string }): string {
    const year1From = years1.split("|")[0] !== "-" ? Number(years1.split("|")[0]) : Number.MAX_SAFE_INTEGER;
    const year1To = years1.split("|")[1] !== "-" ? Number(years1.split("|")[1]) : Number.MIN_SAFE_INTEGER;

    const year2From = years2.from !== "-" ? Number(years2.from) : Number.MAX_SAFE_INTEGER;
    const year2To = years2.to !== "-" ? Number(years2.to) : Number.MIN_SAFE_INTEGER;

    const finalFrom = Math.min(year1From, year2From);
    const finalTo = Math.max(year1To, year2To);

    return `${finalFrom === Number.MAX_SAFE_INTEGER ? "-" : finalFrom.toString().padStart(2, "0")}|${finalTo === Number.MIN_SAFE_INTEGER ? "-" : finalTo.toString().padStart(2, "0")}`;
}

function generateLabelRichText(vehicles: any[], includeYears: boolean, includeBodyTypes: boolean): { text: string; richText: ExcelJS.RichText[] } {
    const brandSortedModelsMap = getRankedBrandAndModels(vehicles, includeBodyTypes);
    const sortedBrands = Array.from(brandSortedModelsMap.keys());
    const lineCount = 5;
    const lineLength = 65;

    const richTextParts: ExcelJS.RichText[] = [];
    let linesUsed = 0;

    // ----- Satır Tahsisi Mantığı -----
    const brandLineAllocation = new Map<string, number>();
    const totalModels = Array.from(brandSortedModelsMap.values()).reduce((sum, models) => sum + models.length, 0);

    let allocatedLines = 0;
    if (totalModels > 0) {
        const preciseAllocations = sortedBrands.map(brand => {
            const modelCount = brandSortedModelsMap.get(brand)!.length;
            const allocation = (modelCount / totalModels) * lineCount;
            return { brand, allocation, integerPart: Math.floor(allocation) }; // Floor kullanıp kalanları sonra dağıt
        });

        for (const { brand, integerPart } of preciseAllocations) {
            brandLineAllocation.set(brand, integerPart);
            allocatedLines += integerPart;
        }

        let remainingLines = lineCount - allocatedLines;
        if (remainingLines > 0) {
            const fractions = preciseAllocations
                .map(({ brand, allocation }) => ({ brand, fraction: allocation - Math.floor(allocation) }))
                .sort((a, b) => b.fraction - a.fraction);
            
            for (let i = 0; i < remainingLines; i++) {
                const brandToAllocate = fractions[i]?.brand;
                if (brandToAllocate) {
                    brandLineAllocation.set(brandToAllocate, (brandLineAllocation.get(brandToAllocate) || 0) + 1);
                }
            }
        }
    }
    // -------------------------------------------------------------

    // Marka başına kaç modelin yazıldığını takip eden Map
    const modelsWrittenPerBrand = new Map<string, number>();
    for (const brand of sortedBrands) {
        modelsWrittenPerBrand.set(brand, 0);
    }
    
    // Satır tahsisine göre etiketi doldurma döngüsü
    for (const brand of sortedBrands) {
        const allocatedLinesForBrand = brandLineAllocation.get(brand) || 0;
        const modelsQueue = brandSortedModelsMap.get(brand)!;

        if (allocatedLinesForBrand === 0 && modelsQueue.length > 0) {
            // Hiç satır tahsis edilmemiş ama modeli olan markalar için 1 satır yer aç
            if (linesUsed < lineCount) {
                brandLineAllocation.set(brand, 1);
            }
        }

        let modelPointer = 0;
        let linesForThisBrandUsed = 0;

        while (linesForThisBrandUsed < (brandLineAllocation.get(brand) || 0) && modelPointer < modelsQueue.length && linesUsed < lineCount) {
            const currentLineParts: ExcelJS.RichText[] = [];
            let currentLineLength = 0;
            let modelsAddedToLine = false;

            if (linesForThisBrandUsed === 0) {
                currentLineParts.push({ text: brand, font: { bold: true } });
                currentLineParts.push({ text: " " });
                currentLineLength += brand.length + 1;
            }

            while (modelPointer < modelsQueue.length && currentLineLength < lineLength) {
                const modelInfo = modelsQueue[modelPointer];
                const separator = modelsAddedToLine ? ", " : "";
                const yearLen = includeYears && modelInfo.yearText && modelInfo.yearText !== "-|-" ? 1 + modelInfo.yearText.length : 0;
                const potentialModelLen = modelInfo.modelText.length + yearLen;
                const potentialLineLen = currentLineLength + separator.length + potentialModelLen;

                if (potentialLineLen <= lineLength) {
                    if (modelsAddedToLine) currentLineParts.push({ text: separator });
                    currentLineParts.push({ text: modelInfo.modelText });
                    if (includeYears && modelInfo.yearText && modelInfo.yearText !== "-|-") {
                        currentLineParts.push({ text: " " });
                        currentLineParts.push({ text: modelInfo.yearText, font: { italic: true } });
                    }
                    currentLineLength = potentialLineLen;
                    modelPointer++;
                    modelsAddedToLine = true;
                } else {
                    break;
                }
            }

            if (modelsAddedToLine) {
                if (linesUsed > 0) richTextParts.push({ text: "\n" });
                richTextParts.push(...currentLineParts);
                linesUsed++;
                linesForThisBrandUsed++;
            } else {
                // Eğer bir satıra hiç model sığmıyorsa, döngüden çık
                break;
            }
        }
    }

    // Ekstra adım: Tahsisat bittikten sonra hala boş satırlar varsa,
    // en çok modele sahip markalardan döngüsel olarak doldurmaya devam et.
    // Bu, "Innocenti" gibi markaların atlanmamasını sağlar.
    const unwrittenModels = new Map<string, number>();
    for(const brand of sortedBrands) {
        const modelsWritten = (modelsWrittenPerBrand.get(brand) || 0);
        unwrittenModels.set(brand, modelsWritten);
    }
    
    let brandIndex = 0;
    while (linesUsed < lineCount && totalModels > richTextParts.filter(p => p.text !== '\n').length) {
        const brandToFill = sortedBrands[brandIndex % sortedBrands.length];
        const modelsQueue = brandSortedModelsMap.get(brandToFill)!;
        let modelPointer = unwrittenModels.get(brandToFill) || 0;

        // Bu markanın tüm modelleri yazıldıysa, bir sonrakine geç
        if (modelPointer >= modelsQueue.length) {
            brandIndex++;
            continue;
        }

        const currentLineParts: ExcelJS.RichText[] = [];
        let currentLineLength = 0;
        let modelsAddedToLine = false;

        if (unwrittenModels.get(brandToFill) === 0) { // Sadece ilk kez yazılıyorsa marka adını ekle
            currentLineParts.push({ text: brandToFill, font: { bold: true } });
            currentLineParts.push({ text: " " });
            currentLineLength += brandToFill.length + 1;
        }

        let tempModelPointer = modelPointer;
        while (tempModelPointer < modelsQueue.length && currentLineLength < lineLength) {
            const modelInfo = modelsQueue[tempModelPointer];
            const separator = modelsAddedToLine ? ", " : "";
            const yearLen = includeYears && modelInfo.yearText && modelInfo.yearText !== "-|-" ? 1 + modelInfo.yearText.length : 0;
            const potentialModelLen = modelInfo.modelText.length + yearLen;
            const potentialLineLen = currentLineLength + separator.length + potentialModelLen;
            
            if (potentialLineLen <= lineLength) {
                if (modelsAddedToLine) currentLineParts.push({ text: separator });
                currentLineParts.push({ text: modelInfo.modelText });
                if (includeYears && modelInfo.yearText && modelInfo.yearText !== "-|-") {
                    currentLineParts.push({ text: " " });
                    currentLineParts.push({ text: modelInfo.yearText, font: { italic: true } });
                }
                currentLineLength = potentialLineLen;
                modelsAddedToLine = true;
                tempModelPointer++;
            } else {
                break;
            }
        }

        if (modelsAddedToLine) {
            if (linesUsed > 0) richTextParts.push({ text: "\n" });
            richTextParts.push(...currentLineParts);
            linesUsed++;
            unwrittenModels.set(brandToFill, tempModelPointer); // Yazılan model sayısını güncelle
        }

        brandIndex++;
    }
    
    // Kalan boş satırları doldur
    while(linesUsed < lineCount) {
        if(richTextParts.length > 0) richTextParts.push({text: "\n"});
        richTextParts.push({text: ""});
        linesUsed++;
    }

    const cleanedRichTextParts = richTextParts.filter(p => p.text !== undefined && p.text !== null);
    const fullText = cleanedRichTextParts.map(part => part.text).join("");
    return { text: fullText.trim(), richText: cleanedRichTextParts };
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

        // Örnek kullanım: Yılları ve kasa tiplerini dahil et.
        // const labelData = generateLabelRichText(item.compatibleVehicles, true, true);

        // Örnek kullanım: Sadece yılları dahil et, kasa tiplerini hariç tut.
        // const labelData = generateLabelRichText(item.compatibleVehicles, true, false);

        // Örnek kullanım: Sadece kasa tiplerini dahil et, yılları hariç tut.
        const labelData = generateLabelRichText(item.compatibleVehicles, true, true);

        const row = worksheet.addRow([item.yvNo, item.crossNumber, { richText: labelData.richText }]);

        const labelCell = row.getCell(3);
        labelCell.alignment = { wrapText: true };
    }

    worksheet.columns = [
        { header: "YV", key: "yv", width: 15 },
        { header: "CROSS", key: "cross", width: 15 },
        { header: "ETIKET", key: "label", width: 65 },
    ];

    await workbook.xlsx.writeFile(outputFilePath);
    console.log("Etiket dosyası oluşturuldu:", outputFilePath);
}

processAndWriteExcel()
    .catch((error) => console.error("Excel oluşturulurken hata oluştu:", error));