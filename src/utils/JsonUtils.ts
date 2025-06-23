import fs from "fs";
import path from "path";
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const filterBrand = process.env.FILTER_BRAND as string;
const productType = process.env.PRODUCT_TYPE as string;

export function mergeJsons(...jsons: any[]): any[] {
  return jsons.flatMap((json) => Object.values(json));
}

function main() {
  const jsonsFolder = path.resolve(__dirname, `../output/${productType}`);
  const jsonFiles = fs.readdirSync(jsonsFolder)
        .filter(file => 
          file.endsWith(".json") && 
          file.includes(filterBrand));

  const mergedJson = jsonFiles.reduce((merged, file) => {
    const filePath = path.join(jsonsFolder, file);
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return merged.concat(json);
  }, []);

  const outputFilePath = path.join(jsonsFolder, `Vehicle-Compatibility_${filterBrand}.json`);
  fs.writeFileSync(outputFilePath, JSON.stringify(mergedJson, null, 2));
  console.log(`Merged JSON saved to ${outputFilePath}`);
}

main();