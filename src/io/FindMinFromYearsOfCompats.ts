import xlsx from 'xlsx';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const PRODUCT_TYPE = process.env.PRODUCT_TYPE as string;
const FILTER_BRAND = process.env.FILTER_BRAND as string;

const INPUT_PATH = path.resolve(__dirname, `../output/${PRODUCT_TYPE}/excels/Vehicle-Compatibility/COMPATIBILITIES_AMERICAN_JNBK+REPXPERT.xlsx`);

const wb = xlsx.readFile(INPUT_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

const minYears = new Map<string, number>();

data.forEach((row: any) => {
    const detroit = row["DETROIT"];
    const from = Number(row["Baş. Yil"]) || 55;
    if (minYears.has(detroit)) {
        // has() guarantees a value exists, use non-null assertion to satisfy TS
        minYears.set(detroit, Math.min(minYears.get(detroit)!, from));
    } else {
        // initialize if not present
        minYears.set(detroit, from);
    }
})

const firstBrands: {
    DETROIT: string;
    FROM: string;
    MARKA: Set<string>;
}[] = [];


data.forEach((row: any) => {
    const detroit = row["DETROIT"];
    const rowFrom = Number(row["Baş. Yil"]) || 55;
    const detroitFrom = minYears.get(detroit);
    const brand = row["MARKA"];


    if (detroitFrom && detroitFrom === rowFrom) {
        const existing = firstBrands.find(item => item.DETROIT === detroit);
        if (existing) {
            existing.MARKA.add(brand);
        } else {
            firstBrands.push({
                DETROIT: detroit,
                FROM: String(detroitFrom).padStart(2, '0'),
                MARKA: new Set([brand])
            })
        }
    }
})

firstBrands.forEach(item => {
    console.log(`${item.DETROIT}\t${item.FROM}\t${Array.from(item.MARKA).join(', ')}`);
})