// src/generateLabelsFromSingleJson.ts
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { bodyTypes, brandAliases, modelAliases } from "./Variables";

function toPascalCase(str: string): string {
  return str
    .replace(/\b(\p{L}+)\b/gu, (word) => {
      if (word.length <= 4) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
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

function generateLabel(vehicles: any[]): string {
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
      for (const m of models) {
        modelMap.set(m, (modelMap.get(m) || 0) + 1);
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

  const lines: string[] = [];
  let currentLineIndex = 0;

  for (const brand of sortedBrands) {
    const allocated = brandLineAllocation.get(brand)!;
    const models = brandModelsToUse.get(brand)!;

    for (let i = 0; i < allocated && currentLineIndex < maxLines; i++) {
      let line = `${brand} - `;
      const prefixLen = line.length;
      let currentLen = prefixLen;
      const modelsOnLine: string[] = [];

      while (models.length > 0) {
        const m = models[0];
        const potentialLen = currentLen + (modelsOnLine.length > 0 ? 2 : 0) + m.length;
        if (potentialLen <= maxLineLength) {
          modelsOnLine.push(models.shift()!);
          currentLen = potentialLen;
        } else {
          break;
        }
      }

      if (modelsOnLine.length > 0) {
        line += modelsOnLine.join(", ");
        lines.push(line);
        currentLineIndex++;
      }
    }
  }

  return lines.join("\n").trim();
}

const inputFilePath = path.resolve(__dirname, "../output/Pad/Pad_vehicle-compatibility_BREMBO.json");
const outputFilePath = path.resolve(__dirname, "../output/Pad/ETIKETLER_TEK_JSON_1.xlsx");

const inputData = JSON.parse(fs.readFileSync(inputFilePath, "utf-8"));
const rows: [string, string, string][] = [];

for (const item of inputData) {
  if (!item.compatibleVehicles || item.compatibleVehicles.length === 0) continue;
  const label = generateLabel(item.compatibleVehicles);
  rows.push([item.yvNo, item.crossNumber, label]);
}

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([["YV", "CROSS", "ETIKET"], ...rows]);
XLSX.utils.book_append_sheet(wb, ws, "Etiketler");
XLSX.writeFile(wb, outputFilePath);

console.log("Etiket dosyası oluşturuldu:", outputFilePath);