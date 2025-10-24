import fs from "fs";
import path from "path";
import * as ExcelJS from "exceljs";
import { bodyTypes, brandAliases, modelAliases } from "../scrapers/api/resources/Variables";
import dotenv from 'dotenv';
import { toPascalCase } from "./helpers/Functions";
import { ModelWithInfo } from "./helpers/Types";

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;

const lineCount = 20;
const lineLength = 50;

const inputFilePath = path.resolve(__dirname, `../resources/data/catalogInfo/jsons/MARKA_HAREKET_KATALOG.json`);
const outputFilePath = path.resolve(__dirname, `../output/${productType}/excels/label/${productType}_Label_WOD_${lineCount}x${lineLength}_With_Options.xlsx`);



// Güncellenmiş extractAndShortenModels fonksiyonu
function extractAndShortenModels(modelString: string, includeBodyTypes: boolean): string[] {
    const extractedModels: string[] = [];
    let preAliasedModelString = "";
    try {
        preAliasedModelString = modelString.replace(/\([^)]*\)/g, "");
    } catch (error) {
        console.error(error, modelString)
    }
    let aliasedModelsAndBodyTypes = new Map<string, string>();

    // Önce modelAliasları işle
    for (const [key, value] of modelAliases.entries()) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        preAliasedModelString = preAliasedModelString.replace(regex, value);
    }

    const parts = preAliasedModelString
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    // bodyTypes'ı en uzun kelimeden en kısaya sırala
    bodyTypes.sort((a, b) => b.length - a.length);

    for (let part of parts) {
        let currentModel = part;
        let bodyType = "";

        // includeBodyTypes false ise, body type'ları temizle
        for (const bt of bodyTypes) {
            const regex = new RegExp(`\\b${bt}\\b`, "gi");
            if (currentModel.match(regex)) {
                if (includeBodyTypes) {
                    bodyType = bt;
                    currentModel = currentModel.replace(regex, "").trim();
                } else {
                    currentModel = currentModel.replace(regex, "").trim();
                    break; // Sadece temizle ve çık
                }
            }
        }

        let finalModel = toPascalCase(currentModel);
        if (bodyType && includeBodyTypes && !finalModel.toUpperCase().includes(bodyType.toUpperCase())) {
            finalModel = `${finalModel} ${toPascalCase(bodyType)}`.trim();
        }

        if (!extractedModels.includes(finalModel)) {
            extractedModels.push(finalModel);
        }
    }
    return extractedModels;
}


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
                    const from = Number(target.constructionYearFrom);
                    minFrom = Math.min(minFrom, from);
                }
                if (!isNaN(target.constructionYearTo) && Number(target.constructionYearTo) > 0) {
                    const to = Number(target.constructionYearTo);
                    maxTo = Math.max(maxTo, to);
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

                    // Yılları birleştirmeden önce geçerli sayısal değerlere dönüştür
                    const existingFrom = existingModelInfo.year.from !== "-" ? Number(existingModelInfo.year.from) : Number.MAX_SAFE_INTEGER;
                    const existingTo = existingModelInfo.year.to !== "-" ? Number(existingModelInfo.year.to) : Number.MIN_SAFE_INTEGER;

                    const newFrom = madeYear.from !== "-" ? Number(madeYear.from) : Number.MAX_SAFE_INTEGER;
                    const newTo = madeYear.to !== "-" ? Number(madeYear.to) : Number.MIN_SAFE_INTEGER;

                    // Yıl aralıklarını genişlet
                    const finalFrom = Math.min(existingFrom, newFrom);
                    const finalTo = Math.max(existingTo, newTo);

                    // Sonuçları tekrar stringe çevirirken kenar durumları kontrol et
                    existingModelInfo.year.from = finalFrom === Number.MAX_SAFE_INTEGER ? "-" : finalFrom.toString().padStart(2, "0");
                    existingModelInfo.year.to = finalTo === Number.MIN_SAFE_INTEGER ? "-" : finalTo.toString().padStart(2, "0");
                }
                const modelInfo = brandInfo.models.get(modelKey)!;
                modelInfo.targetsCount += model.targets.length;
            }
        }
    }

    // ... (rest of the function is the same, but now it sorts based on the refined year data)
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

function generateLabelRichText(vehicles: any[], includeYears: boolean, includeBodyTypes: boolean): { text: string; richText: ExcelJS.RichText[] } {

    const brandSortedModelsMap = getRankedBrandAndModels(vehicles, includeBodyTypes);
    const sortedBrands = Array.from(brandSortedModelsMap.keys());

    // Satır tahsisi için yeni bir Map oluşturalım
    const brandLineAllocation = new Map<string, number>();
    const totalModels = Array.from(brandSortedModelsMap.values()).reduce((sum, models) => sum + models.length, 0);

    let allocatedLines = 0;
    const fractionalAllocations: { brand: string; fraction: number }[] = [];

    // Oranlara göre satır tahsisi yap (yuvarlama kuralı ile)
    if (totalModels > 0) {
        for (const brand of sortedBrands) {
            const modelCount = brandSortedModelsMap.get(brand)!.length;
            const allocation = (modelCount / totalModels) * lineCount;
            const integerPart = Math.floor(allocation + 0.5); // .5 ve üstünü yukarı yuvarla
            brandLineAllocation.set(brand, integerPart);
            allocatedLines += integerPart;
        }
    }

    // Kalan satırları en yüksek kesirli kısımlara göre dağıt
    let remainingLines = lineCount - allocatedLines;
    if (remainingLines > 0) {
        // Yeniden hesaplayalım: .5 ve üstü yuvarlaması tam sonucu vermiyor olabilir.
        // Daha iyi bir yaklaşım, yine kesirli kısımları kullanmak.
        const preciseAllocations = sortedBrands.map(brand => {
            const modelCount = brandSortedModelsMap.get(brand)!.length;
            const allocation = (modelCount / totalModels) * lineCount;
            return { brand, allocation };
        });

        // Tamsayı tahsisleri ayarla
        let totalAllocated = 0;
        for (const { brand, allocation } of preciseAllocations) {
            const integerPart = Math.floor(allocation + 0.5);
            brandLineAllocation.set(brand, integerPart);
            totalAllocated += integerPart;
        }

        remainingLines = lineCount - totalAllocated;

        // Kesirli kısımları ayıklayıp sırala
        const fractions = preciseAllocations
            .map(({ brand, allocation }) => ({ brand, fraction: allocation - Math.floor(allocation + 0.5) + (allocation < 0.5 ? 1 : 0) }))
            .sort((a, b) => b.fraction - a.fraction);

        // Kalan satırları dağıt
        for (let i = 0; i < remainingLines; i++) {
            const brandToAllocate = fractions[i]?.brand;
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

        while (linesForThisBrandUsed < allocatedLinesForBrand && modelPointer < modelsQueue.length && linesUsed < lineCount) {
            currentBrand = brand;

            const currentLineParts: ExcelJS.RichText[] = [];
            let currentLineLength = 0;
            let modelsAddedToLine = false;

            if (linesForThisBrandUsed === 0) {
                currentLineParts.push({ text: currentBrand, font: { bold: true } });
                currentLineParts.push({ text: " " });
                currentLineLength += currentBrand.length + 1;
            }

            while (modelPointer < modelsQueue.length && currentLineLength < lineLength) {
                const modelInfo = modelsQueue[modelPointer];
                const separator = modelsAddedToLine ? ", " : "";

                const yearLen = includeYears && modelInfo.yearText ? 1 + modelInfo.yearText.length : 0;
                const potentialModelLen = modelInfo.modelText.length + yearLen;
                const potentialLineLen = currentLineLength + separator.length + potentialModelLen;

                if (potentialLineLen <= lineLength) {
                    if (modelsAddedToLine) {
                        currentLineParts.push({ text: separator });
                    }

                    currentLineParts.push({ text: modelInfo.modelText });
                    if (includeYears && modelInfo.yearText) {
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
                break;
            }
        }
    }

    // Ekstra adım: Eğer 5 satır dolmadıysa, kalan satırları en çok modele sahip markalardan doldurmaya devam et.
    // Bu, "5 ten az satır görmek istemiyorum" kuralını karşılar.
    // Eğer tüm modeller bittiyse zaten döngüden çıkmış olacağız.
    let remainingBrandModels = Array.from(brandSortedModelsMap.entries()).filter(([brand]) => {
        const allocatedLines = brandLineAllocation.get(brand) || 0;
        const modelsQueue = brandSortedModelsMap.get(brand)!;
        const usedModels = modelsQueue.slice(0, modelsQueue.length).length;

        return allocatedLines < lineCount && usedModels < modelsQueue.length;
    });

    let currentBrandIndex = 0;
    while (linesUsed < lineCount && remainingBrandModels.length > 0) {
        const brand = remainingBrandModels[currentBrandIndex % remainingBrandModels.length][0];
        const modelsQueue = brandSortedModelsMap.get(brand)!;
        let modelPointer = brandLineAllocation.get(brand) || 0;

        const currentLineParts: ExcelJS.RichText[] = [];
        let currentLineLength = 0;
        let modelsAddedToLine = false;

        // Marka adını sadece ilk satırda yaz
        if (brandLineAllocation.get(brand) === 0) {
            currentLineParts.push({ text: brand, font: { bold: true } });
            currentLineParts.push({ text: " " });
            currentLineLength += brand.length + 1;
        }

        while (modelPointer < modelsQueue.length && currentLineLength < lineLength) {
            const modelInfo = modelsQueue[modelPointer];
            const separator = modelsAddedToLine ? ", " : "";

            const yearLen = includeYears && modelInfo.yearText ? 1 + modelInfo.yearText.length : 0;
            const potentialModelLen = modelInfo.modelText.length + yearLen;
            const potentialLineLen = currentLineLength + separator.length + potentialModelLen;

            if (potentialLineLen <= lineLength) {
                if (modelsAddedToLine) {
                    currentLineParts.push({ text: separator });
                }
                currentLineParts.push({ text: modelInfo.modelText });
                if (includeYears && modelInfo.yearText) {
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
            if (linesUsed > 0) {
                richTextParts.push({ text: "\n" });
            }
            richTextParts.push(...currentLineParts);
            linesUsed++;
            brandLineAllocation.set(brand, (brandLineAllocation.get(brand) || 0) + 1); // Satır tahsisini güncelle
        }

        currentBrandIndex++;

        // Eğer o markanın tüm modelleri yazıldıysa, kalan markalar listesinden çıkar
        if (modelPointer === modelsQueue.length) {
            remainingBrandModels = remainingBrandModels.filter(m => m[0] !== brand);
            currentBrandIndex = 0;
        }
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
        const labelData = generateLabelRichText(item.compatibleVehicles, true, false);

        const row = worksheet.addRow([item.yvNo, item.crossNumber, { richText: labelData.richText }]);

        const labelCell = row.getCell(3);
        labelCell.alignment = { wrapText: true };
    }

    worksheet.columns = [
        { header: "YV", key: "yv", width: 15 },
        { header: "CROSS", key: "cross", width: 15 },
        { header: "ETIKET", key: "label", width: lineLength + 10 },
    ];

    await workbook.xlsx.writeFile(outputFilePath);
    console.log("Etiket dosyası oluşturuldu:", outputFilePath);
}

processAndWriteExcel()
    .catch((error) => console.error("Excel oluşturulurken hata oluştu:", error));