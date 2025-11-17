import fs from 'fs';
import path from 'path';

const SOURCE_PATH = path.resolve(__dirname, '../../resources/catalog/jsons/modelsNeedsToBePascalCased.json');
const jasonData = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf-8'));
const modelsNeedsToBePascalCased = new Set(jasonData);

export function toPascalCase(str: string): string {

    const romanNumeralRegex = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/i;

    return str
        .replace(/\b(\p{L}+)\b/gu, (word) => {

            // 1. Romen rakamları veya 4 karakterden kısaysa ve modelsNeedsToBePascalCased de yoksa dokunma
            if (romanNumeralRegex.test(word) || (word.length <= 4 && !modelsNeedsToBePascalCased.has(word))) {
                return word;
            }

            // 2. Aksi halde PascalCase formatına çevir
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .trim();
}
