import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import * as path from "path";
import * as fs from "fs";
import XLSX from "xlsx";

export function createDocxDocument(...values: string[]) {
    const sections = values.map((value) => ({
        children: [
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [new TextRun({
                    text: value,        // Enter the text
                    size: 12,           // Enter dobled of the required font size (size = 22 for 11pt)
                    font: "Times New Roman",    // Enter the name of the required font
                    color: "000000",    // Enter the hex color code
                })],
            }),
        ],
    }));

    return new Document({
        sections,
    });
}

export function writeToWord(documents: {document: Document; filename: string;}[]) {
    documents.forEach((doc) => {
        const outputPath = path.resolve(__dirname, `../data/documents/docx/${doc.filename}.docx`);
        Packer.toBuffer(doc.document).then((buffer) => {
            fs.writeFileSync(outputPath, buffer);
        });
    })
}


export function writeToExcel(EXCEL_Sheets: { fileName: string; numbers: string[]; columnCount: number }[]) {

  const OUTPUT_FILE_PATH = path.resolve(__dirname, `../data/documents/excels/Full_EAC_Numbers.xlsx`);
  
  const wb = XLSX.utils.book_new();

  // Iterate over the data array and create a worksheet for each object
  EXCEL_Sheets.forEach((element) => {
    const { fileName, numbers, columnCount } = element;
    const sheet_data: string[][] = [];

    // Iterate over the numbers array and create chunks of columnCount length
    for (let i = 0; i < numbers.length; i += columnCount) {
      sheet_data.push(numbers.slice(i, i + columnCount)); // [1, columnCount], [columnCount+1, 2*columnCount], ...
    }

    // Create the worksheet from the worksheet data
    const ws = XLSX.utils.aoa_to_sheet(sheet_data);
    XLSX.utils.book_append_sheet(wb, ws, fileName);
  });

  XLSX.writeFile(wb, OUTPUT_FILE_PATH);

  console.log(`✨ Excel dosyası oluşturuldu: ${OUTPUT_FILE_PATH}`);
}

