import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';


const inputDir = path.resolve(__dirname, 'jsons');
const outputDir = path.resolve(__dirname, 'excels');

type KentparData = {
    kentparNo: string;
    oeNumbersUnique: string[];
}

const files = fs.readdirSync(inputDir);

const allData: KentparData[] = [];

for (const file of files) {
    const filePath = path.join(inputDir, file);
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    allData.push(jsonData);
}

const workbook = xlsx.utils.book_new();

const worksheetData = allData.map(item => ({    
    KentparNumber: item.kentparNo,
    OENumbers: item.oeNumbersUnique.join(', ')
}));

const worksheet = xlsx.utils.json_to_sheet(worksheetData);
xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

const outputFilePath = path.join(outputDir, 'Kentpar.xlsx');
xlsx.writeFile(workbook, outputFilePath);