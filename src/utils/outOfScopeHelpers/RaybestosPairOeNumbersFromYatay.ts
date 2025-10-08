import xlsx from "xlsx";
import path from "path";

const inputPath = path.resolve(__dirname, `./RAYBESTOS.xlsx`);
const outputPath = path.resolve(__dirname, `./RAYBESTOS_OE_NUMBERS.xlsx`);

const wb = xlsx.readFile(inputPath, { cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];

const data: any[] = xlsx.utils.sheet_to_json(ws, { raw: false });

const rawData: Record<string, string>[] = [];

data.forEach(item => {
    const raybestos = item["RAYBESTOS"];
    item["OE Numbers"].split(",").forEach((oe: string) => {
        rawData.push({ RAYBESTOS: raybestos, OE: oe.trim() })
    });

})

console.log(rawData)

const newBook = xlsx.utils.book_new();
const newSheet = xlsx.utils.json_to_sheet(rawData);
xlsx.utils.book_append_sheet(newBook, newSheet, "RAYBESTOS OE NUMBERS");
xlsx.writeFile(newBook, outputPath);