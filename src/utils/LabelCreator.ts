// src/generateLabelsFromSingleJson.ts
import fs from "fs";
import path from "path";
import * as ExcelJS from "exceljs";
import { bodyTypes, brandAliases, modelAliases } from "./Variables";
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

const modelsNeedsToBePascalCased = new Set(JSON.parse(fs.readFileSync(path.resolve(__dirname, `../resources/data/catalogInfo/jsons/modelsNeedsToBePascalCased.json`), "utf-8")));

function toPascalCase(str: string): string {
    return str
        .replace(/\b(\p{L}+)\b/gu, (word) => {
            if (word.length <= 3) return word;
            return modelsNeedsToBePascalCased.has(word) ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .trim();
}

function extractAndShortenModels(modelString: string): string[] {
    const extractedModels: string[] = [];
    let preAliasedModelString = modelString.replace(/\([^)]*\)/g, "");

    for (const [key, value] of modelAliases.entries()) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        preAliasedModelString = preAliasedModelString.replace(regex, value);
    }

    const parts = preAliasedModelString
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    bodyTypes.sort((a, b) => b[1].length - a[1].length);

    for (let part of parts) {
        let currentModel = part;
        let bodyType = "";

        for (const bt of bodyTypes) {
            const regex = new RegExp(`\\b${bt}\\b`, "gi");
            if (currentModel.match(regex)) {
                bodyType = bt;
                currentModel = currentModel.replace(regex, "").trim();
                break;
            }
        }

        let finalModel = toPascalCase(currentModel);
        if (bodyType && !finalModel.toUpperCase().includes(bodyType.toUpperCase())) {
            finalModel = `${finalModel} ${toPascalCase(bodyType)}`.trim();
        }

        if (!extractedModels.includes(finalModel)) {
            extractedModels.push(finalModel);
        }
    }
    return extractedModels;
}

interface ModelWithInfo {
    modelText: string;
    yearText: string;
    targetsCount: number;
}

// Markaların ve modellerin sayısını toplayıp sıralama için hazırlayan yardımcı fonksiyon
function getRankedBrandAndModels(vehicles: any[]): Map<string, ModelWithInfo[]> {
    const brandData = new Map<string, { models: Map<string, { targetsCount: number; year: { from: string; to: string } }> }>();

    for (const v of vehicles) {
        const rawBrand = v.manufacturer.trim().toUpperCase();
        const brand = brandAliases.get(rawBrand) || rawBrand;

        if (!brandData.has(brand)) {
            brandData.set(brand, { models: new Map() });
        }
        const brandInfo = brandData.get(brand)!;

        for (const model of v.models) {
            const extractedModels = extractAndShortenModels(model.modelSeries);
            
            const minFrom = Math.min(...model.targets.map((t: { constructionYearFrom: any; }) => {
                const year = Number(t.constructionYearFrom);
                return year !== 0 && !isNaN(year) ? (year < 100 ? (year < 30 ? year + 2000 : year + 1900) : year) : 9999;
            }));
            const maxTo = Math.max(...model.targets.map((t: { constructionYearTo: any; }) => {
                const year = Number(t.constructionYearTo);
                return year !== 0 && !isNaN(year) ? (year < 100 ? (year < 30 ? year + 2000 : year + 1900) : year) : 0;
            }));
            
            const madeYear = { 
                from: minFrom < 2100 ? minFrom.toString().slice(-2) : "-", 
                to: maxTo > 1900 ? maxTo.toString().slice(-2) : "-"
            };

            for (const m of extractedModels) {
                const modelKey = `${m.trim()} ${madeYear.from}|${madeYear.to}`;
                if (!brandInfo.models.has(modelKey)) {
                    brandInfo.models.set(modelKey, { targetsCount: 0, year: madeYear });
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
                const yearMatch = modelKey.match(/(\d{2}\|-|\d{2}\|\d{2}|-\|-\)$)/);
                const yearText = yearMatch ? yearMatch[0] : "";
                const modelText = modelKey.replace(yearText, "").trim();
                
                return {
                    modelText: modelText,
                    yearText: yearText,
                    targetsCount: modelInfo.targetsCount
                } as ModelWithInfo;
            });
        
        sortedBrandMap.set(brandName, sortedModels);
    }
    return sortedBrandMap;
}

// *** Yenilenmiş generateLabelRichText fonksiyonu ***
function generateLabelRichText(vehicles: any[]): { text: string; richText: ExcelJS.RichText[] } {
    const maxLines = 5;
    const maxLineLength = 65;

    const brandSortedModelsMap = getRankedBrandAndModels(vehicles);
    const sortedBrands = Array.from(brandSortedModelsMap.keys());

    // Satır tahsisi için yeni bir Map oluşturalım
    const brandLineAllocation = new Map<string, number>();
    const totalModels = Array.from(brandSortedModelsMap.values()).reduce((sum, models) => sum + models.length, 0);

    let allocatedLines = 0;
    const fractionalAllocations: { brand: string; fraction: number }[] = [];

    // Oranlara göre satır tahsisi yap
    for (const brand of sortedBrands) {
        const modelCount = brandSortedModelsMap.get(brand)!.length;
        const allocation = (modelCount / totalModels) * maxLines;
        const integerPart = Math.floor(allocation);
        brandLineAllocation.set(brand, integerPart);
        allocatedLines += integerPart;
        fractionalAllocations.push({ brand, fraction: allocation - integerPart });
    }

    // Kalan satırları en yüksek kesirli kısımlara göre dağıt
    const remainingLines = maxLines - allocatedLines;
    if (remainingLines > 0) {
        fractionalAllocations.sort((a, b) => b.fraction - a.fraction);
        for (let i = 0; i < remainingLines; i++) {
            const brandToAllocate = fractionalAllocations[i]?.brand;
            if (brandToAllocate) {
                brandLineAllocation.set(brandToAllocate, brandLineAllocation.get(brandToAllocate)! + 1);
            }
        }
    }

    const richTextParts: ExcelJS.RichText[] = [];
    let linesUsed = 0;
    let currentBrand = "";

    // Tahsis edilen satır sayısına göre etiketi doldur
    for (const brand of sortedBrands) {
        const allocatedLinesForBrand = brandLineAllocation.get(brand) || 0;
        const modelsQueue = brandSortedModelsMap.get(brand)!;
        let modelPointer = 0;
        let linesForThisBrandUsed = 0;

        // Bu markaya tahsis edilen satırlar bitene veya modelleri bitene kadar devam et
        while (linesForThisBrandUsed < allocatedLinesForBrand && modelPointer < modelsQueue.length && linesUsed < maxLines) {
            currentBrand = brand;
            
            const currentLineParts: ExcelJS.RichText[] = [];
            let currentLineLength = 0;
            let modelsAddedToLine = false;

            // Eğer yeni bir marka ise veya ilk satırsa marka adını ekle
            if (linesForThisBrandUsed === 0) {
                currentLineParts.push({ text: currentBrand, font: { bold: true } });
                currentLineParts.push({ text: " " });
                currentLineLength += currentBrand.length + 1;
            }
            
            // Sığabildiği kadar modeli bu satıra ekle
            while (modelPointer < modelsQueue.length && currentLineLength < maxLineLength) {
                const modelInfo = modelsQueue[modelPointer];
                const separator = modelsAddedToLine ? ", " : "";
                const potentialModelLen = modelInfo.modelText.length + (modelInfo.yearText ? 1 + modelInfo.yearText.length : 0);
                const potentialLineLen = currentLineLength + separator.length + potentialModelLen;
                
                if (potentialLineLen <= maxLineLength) {
                    if (modelsAddedToLine) {
                        currentLineParts.push({ text: separator });
                    }
                    
                    currentLineParts.push({ text: modelInfo.modelText });
                    if (modelInfo.yearText) {
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

            if (modelsAddedToLine || (linesForThisBrandUsed === 0 && modelPointer > 0)) {
                if (linesUsed > 0) {
                    richTextParts.push({ text: "\n" });
                }
                richTextParts.push(...currentLineParts);
                linesUsed++;
                linesForThisBrandUsed++;
            } else {
                break; // Satıra hiç model sığmıyorsa bu markayı geç
            }
        }
    }
    
    // Temizlik adımı
    const cleanedRichTextParts = richTextParts.filter(p => p.text !== undefined && p.text !== null);
    
    const fullText = cleanedRichTextParts.map(part => part.text).join("");
    return { text: fullText.trim(), richText: cleanedRichTextParts };
}


const inputFilePath = path.resolve(__dirname, `../output/${productType}/jsons/marka_hareket/MARKA_HAREKET.json`);
const outputFilePath = path.resolve(__dirname, `../output/${productType}/excels/Label/${productType}_Label_Optimized_Weighted_Brand_Models_ItalicYears.xlsx`); 

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

        const labelData = generateLabelRichText(item.compatibleVehicles);
        const row = worksheet.addRow([item.yvNo, item.crossNumber, { richText: labelData.richText }]);

        const labelCell = row.getCell(3);
        labelCell.alignment = { wrapText: true };
    }

    worksheet.columns = [
        { header: "YV", key: "yv", width: 15 },
        { header: "CROSS", key: "cross", width: 15 },
        { header: "ETIKET", key: "label", width: 68 },
    ];

    await workbook.xlsx.writeFile(outputFilePath);
    console.log("Etiket dosyası oluşturuldu:", outputFilePath);
}

processAndWriteExcel().catch((error) => console.error("Excel oluşturulurken hata oluştu:", error));