import path from "path";
import fs from 'fs';
import { Mutex } from 'async-mutex';

const writeMutex = new Mutex();

export async function writeToFileIfNotExistsProducts(text: string) {
    const filePath = path.resolve(__dirname, "../output/NotExistProducts.txt");
    await writeMutex.runExclusive(() => {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "", "utf8");
        }
        fs.appendFileSync(filePath, `${text}\n`, "utf8");
    });
}
