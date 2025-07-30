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

    bodyTypes.sort((a, b) => b.length - a.length);

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

function getTopEntries<T>(map: Map<T, number>, limit?: number): T[] {
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return limit ? sorted.slice(0, limit).map(([key]) => key) : sorted.map(([key]) => key);
}

function generateLabelRichText(vehicles: any[]): { text: string; richText: ExcelJS.RichText[] } {
    const maxLines = 5;
    const maxLineLength = 65;
    const brandModelMap = new Map<string, Map<string, number>>();
    const brandCountMap = new Map<string, number>();

    for (const v of vehicles) {
        const rawBrand = v.manufacturer.trim().toUpperCase();
        const brand = brandAliases.get(rawBrand) || rawBrand;

        brandCountMap.set(brand, (brandCountMap.get(brand) || 0) + 1);
        if (!brandModelMap.has(brand)) brandModelMap.set(brand, new Map());
        const modelMap = brandModelMap.get(brand)!;

        for (const model of v.models) {
            const models = extractAndShortenModels(model.modelSeries);

            let madeYaear: { from: string, to: string } | null = null;
            let minFrom: number | null = Number.MAX_SAFE_INTEGER;
            let maxTo: number | null = Number.MIN_SAFE_INTEGER;
            for (const target of model.targets) {
                let from = Number(target.constructionYearFrom);
                let to = Number(target.constructionYearTo);
                from = from < 30 ? from + 2000 : from + 1900;
                to = to < 30 ? to + 2000 : to + 1900;
                minFrom = from < minFrom ? from : minFrom;
                maxTo = to > maxTo ? to : maxTo;
            }

            madeYaear = { from: minFrom!.toString().slice(-2), to: maxTo!.toString().slice(-2) };

            for (const m of models) {
                modelMap.set(
                    m.concat(` ${madeYaear!.from}-${madeYaear!.to}`),
                    (modelMap.get(m) || 0) + 1
                );
            }
        }
    }

    const sortedBrands = getTopEntries(brandCountMap);
    const brandModelsToUse = new Map<string, string[]>();
    for (const brand of sortedBrands) {
        const sortedModels = getTopEntries(brandModelMap.get(brand)!);
        brandModelsToUse.set(brand, [...sortedModels]);
    }

    const brandLineAllocation = new Map<string, number>();
    let remainingLines = maxLines;
    if (sortedBrands.length === 1) {
        brandLineAllocation.set(sortedBrands[0], maxLines);
    } else if (sortedBrands.length > 0) {
        const main = sortedBrands[0];
        const alloc = Math.min(2, remainingLines);
        brandLineAllocation.set(main, alloc);
        remainingLines -= alloc;
        for (let i = 1; i < sortedBrands.length && remainingLines > 0; i++) {
            brandLineAllocation.set(sortedBrands[i], 1);
            remainingLines--;
        }
        let idx = 0;
        while (remainingLines > 0) {
            const b = sortedBrands[idx % sortedBrands.length];
            brandLineAllocation.set(b, (brandLineAllocation.get(b) || 0) + 1);
            remainingLines--;
            idx++;
        }
    }

    const richTextParts: ExcelJS.RichText[] = [];
    let currentLineIndex = 0;
    let lastBrandUsed: string | null = null;

    for (const brand of sortedBrands) {
        const allocated = brandLineAllocation.get(brand)!;
        const models = brandModelsToUse.get(brand)!;

        for (let i = 0; i < allocated && currentLineIndex < maxLines; i++) {
            const writeBrand = (lastBrandUsed !== brand) || (currentLineIndex === 0);

            let currentLinePrefixLen = 0;
            if (writeBrand) {
                currentLinePrefixLen = brand.length + 1; // Marka + boşluk
            } else {
                // Marka yazılmayacaksa, artık boşluk da eklemiyoruz.
                currentLinePrefixLen = 0; // Bu satırda prefix uzunluğu 0 olacak.
            }

            let currentLen = currentLinePrefixLen;
            const modelsOnLine: string[] = [];

            while (models.length > 0) {
                const m = models[0];
                // potentialLen hesaplarken boşluk ekleme mantığını güncelliyoruz.
                // Eğer marka yazılmayacaksa, ilk modelden önce ", " eklemeyeceğiz.
                const separatorLen = modelsOnLine.length > 0 ? 2 : (writeBrand ? 0 : 0); // Sadece modeller arasına ", "
                const potentialLen = currentLen + separatorLen + m.length;

                if (potentialLen <= maxLineLength) {
                    modelsOnLine.push(models.shift()!);
                    currentLen = potentialLen;
                } else {
                    break;
                }
            }

            if (modelsOnLine.length > 0) {
                if (writeBrand) {
                    richTextParts.push({ text: brand, font: { bold: true } });
                    richTextParts.push({ text: " " }); // Marka ile model arasına boşluk
                    lastBrandUsed = brand;
                } else {
                    // *** BURADAKİ DEĞİŞİKLİK: ARTIK BOŞLUK EKLEMİYORUZ ***
                    // richTextParts.push({ text: "  " }); // Bu satırı kaldırdık.
                }

                richTextParts.push({ text: modelsOnLine.join(", ") });

                const isLastLineOfAllocation = i === allocated - 1;
                const isLastBrandOverall = sortedBrands.indexOf(brand) === sortedBrands.length - 1;
                const hasMoreModelsForThisBrand = models.length > 0;

                if (
                    currentLineIndex < maxLines - 1 && // Maksimum satır limitini aşmadıysak (son satır hariç)
                    (hasMoreModelsForThisBrand || // Bu marka için daha model varsa
                     (!isLastLineOfAllocation || !isLastBrandOverall)) // Veya bu markaya ayrılan son satırda değilsek ya da genel olarak son marka değilsek
                ) {
                    richTextParts.push({ text: "\n" });
                }
                currentLineIndex++;
            }
        }
    }

    if (richTextParts.length > 0) {
        const lastPart = richTextParts[richTextParts.length - 1];
        if (lastPart.text === "\n") {
            const tempText = richTextParts.slice(0, richTextParts.length - 1).map(p => p.text).join("");
            if (tempText.trim().length > 0) {
                richTextParts.pop();
            }
        }
    }

    const fullText = richTextParts.map((part) => part.text).join("");

    return { text: fullText.trim(), richText: richTextParts };
}

const inputFilePath = path.resolve(__dirname, `../output/${productType}/jsons/marka_hareket/MARKA_HAREKET.json`);
const outputFilePath = path.resolve(__dirname, `../output/${productType}/excels/Label/${productType}_Label_Modified.xlsx`);

async function processAndWriteExcel() {
    const inputData = JSON.parse(fs.readFileSync(inputFilePath, "utf-8"));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Etiketler");

    worksheet.addRow(["YV", "CROSS", "ETIKET"]);
    worksheet.getRow(1).font = { bold: true };

    for (const item of inputData) {
        if (!item.compatibleVehicles || item.compatibleVehicles.length === 0) continue;

        const labelData = generateLabelRichText(item.compatibleVehicles);
        const row = worksheet.addRow([item.yvNo, item.crossNumber, { richText: labelData.richText }]);

        const labelCell = row.getCell(3);
        labelCell.alignment = { wrapText: true };
    }

    worksheet.columns = [
        { header: "YV", key: "yv", width: 15 },
        { header: "CROSS", key: "cross", width: 15 },
        { header: "ETIKET", key: "label", width: 60 },
    ];

    await workbook.xlsx.writeFile(outputFilePath);
    console.log("Etiket dosyası oluşturuldu:", outputFilePath);
}

processAndWriteExcel().catch((error) => console.error("Excel oluşturulurken hata oluştu:", error));