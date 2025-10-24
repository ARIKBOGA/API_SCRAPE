import fs from "fs/promises";
import path from "path";

export async function mkdirIfNotExists(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeJSONSafe(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  await mkdirIfNotExists(dir);
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, "utf8");
}
