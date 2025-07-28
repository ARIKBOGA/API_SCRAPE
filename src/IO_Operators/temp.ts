import * as path from 'path';
import * as fs from 'fs';


function isAllUpperCase(word: string): boolean {
    return word === word.toUpperCase() && /[A-ZÇĞİÖŞÜ]/.test(word);
}
function hasNumerics(word: string): boolean {
    return /\d/.test(word);
}

function isAllLettersButNotRoman(word: string): boolean {
    const romanNumerals = [
        "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
        "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
        "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "C", "CC", "CCC", "CD", "D", "CM", "M"
    ];

    return /^[A-ZÇĞİÖŞÜ]+$/.test(word) && !romanNumerals.includes(word);
}


export function filterModelNames(): string[] {

    const data: string[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, `data.json`), 'utf-8'));
    const modelSet: Set<string> = new Set();
    console.log(data.length);

    for (const item of data) {


        const words = item
            .replace(/\([^()]*\)/g, " ")
            .split('|')
            .map(word => {
                return word
                    .replace(/["#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/g, "")
                    .trim()

            })
            .filter(word =>
                word.length <= 4 &&
                word.length > 3 &&
                isAllUpperCase(word) &&
                !hasNumerics(word) &&
                isAllLettersButNotRoman(word)
            );

        words.forEach(word => modelSet.add(word));


    }

    return Array.from(modelSet);
}

const models = filterModelNames();

fs.writeFileSync(path.resolve(__dirname, `4_digit_models.json`), JSON.stringify(models, null, 2), 'utf-8');

console.log(models.length);
console.log(models);