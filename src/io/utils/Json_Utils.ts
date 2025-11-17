import fs from "fs";
import path from "path";
import { mkdirIfNotExists } from "./Workspace_IO_Utils";


export async function writeJSONSafe(filePath: string, data: any) {
    const dir = path.dirname(filePath);
    await mkdirIfNotExists(dir);
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, json, "utf8");
}