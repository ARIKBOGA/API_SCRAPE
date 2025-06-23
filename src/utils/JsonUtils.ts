import fs from "fs";
import path from "path";

export function mergeJsons(...jsons: any[]): any[] {
  return jsons.flatMap((json) => Object.values(json));
}

function main() {
  const jsonsFolder = path.resolve(__dirname, "../output");
  const jsonFiles = fs.readdirSync(jsonsFolder)
  .filter((file) => file.endsWith(".json") && file.includes("Pad_vehicle-compatibility_BREMBO"));
  
  const mergedJson = jsonFiles
    .sort((a, b) => a.localeCompare(b))
    .reduce<any[]>((acc, file) => acc.concat(JSON.parse(fs.readFileSync(path.join(jsonsFolder, file), "utf8"))), []);
  const outputFilePath = path.join(jsonsFolder, "Merged_Pad_vehicle-compatibility_BREMBO.json");
  fs.writeFileSync(outputFilePath, JSON.stringify(mergedJson, null, 2), "utf8");
  console.log(`Merged JSON saved to ${outputFilePath}`);
}

main();
