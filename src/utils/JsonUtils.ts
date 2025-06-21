import fs from "fs";
import path from "path";

export function mergeJsons(...jsons: any[]): any[] {
  return jsons.flatMap((json) => Object.values(json));
}

function main() {
  const jsonsFolder = path.resolve(__dirname, "../output");
  const jsons = fs
    .readdirSync(jsonsFolder)
    .filter((file) => file.endsWith(".json") && file.includes("TRW"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const filePath = path.join(jsonsFolder, file);
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    });

  const mergedJson = mergeJsons(...jsons);
  const outputFilePath = path.join(jsonsFolder, "merged_TRW.json");
  fs.writeFileSync(outputFilePath, JSON.stringify(mergedJson, null, 2), "utf8");
  console.log(`Merged JSON saved to ${outputFilePath}`);
}

main();
