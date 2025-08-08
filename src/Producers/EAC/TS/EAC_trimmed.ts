import * as path from "path";
import XLSX from "xlsx";
import { barcode_current_initials, PAD_current_yvNo, FULL_current_numbers, DISC_current_yvNo, DRUM_current_yvNo } from "./variables";
import { createDocxDocument, writeToWord } from "./EAC_helpers";

// Prepare the data: PAD, DISC, DRUM
const BRAND_INITIALS = Array.from(new Set(barcode_current_initials));
const PAD_WVA_RANGE: string[] = Array.from({ length: (38000 - 10000) }, (_, i) => String(i + 10000));
const DISC_DRUM_FULL_RANGE = Array.from({ length: 1600 }, (_, i) => String(i + 1).padStart(3, '0'));

let disc_range: string[], drum_range: string[];
disc_range = drum_range = DISC_DRUM_FULL_RANGE.filter(item => !FULL_current_numbers.includes(item));

const disc_additions: string[] = ["", "C", "CS"];
const drum_additions = [""];


function numberGenerator(initial: string[], centers: string[], additions: string[], productType: string): string[] {
  const result: string[] = [];
  let counter = 0;
  for (const pre of initial) {
    for (const center of centers) {
      for (const addition of additions) {
        result.push(pre + center + addition);
      }
      if (productType === "Disc") {
        result.push(pre + center + (["S", "B", "H"][result.length % 3]));
      } else if (productType === "Drum") {
        result.push(pre + center + (["B", "H"][counter++ % 2]));
      }
    }
  }
  return result;
}

const generated: { DISC: string[]; DRUM: string[]; PAD: string[]; } = {
  DISC: Array.from(new Set(numberGenerator(BRAND_INITIALS, disc_range, disc_additions, "Disc"))),
  DRUM: Array.from(new Set(numberGenerator(BRAND_INITIALS, drum_range, drum_additions, "Drum"))),
  PAD: Array.from(new Set(PAD_WVA_RANGE.filter((item) => !(new Set(PAD_current_yvNo.map(each => each.substring(0, 5)))).has(item))))
};

const WORD_Documents = [
  { document: createDocxDocument(DISC_current_yvNo.join(','), generated.DISC.join(',')), filename: "DISC_FULL" },
  { document: createDocxDocument(DRUM_current_yvNo.join(','), generated.DRUM.join(',')), filename: "DRUM_FULL_B_H" },
  { document: createDocxDocument(FULL_current_numbers.join(','), generated.PAD.join(',')), filename: "PAD_FULL" },
];

function writeToExcel() {

  // Create an array of objects that contain the file name, numbers and column count to be used when writing the Excel file
  const data: { fileName: string; numbers: string[]; columnCount: number; }[] = [
    { fileName: "DISC", numbers: [...generated.DISC, DISC_current_yvNo.join(",")], columnCount: 4 },
    { fileName: "DRUM", numbers: [...generated.DRUM, DRUM_current_yvNo.join(",")], columnCount: 10 },
    { fileName: "PAD", numbers: [...generated.PAD, PAD_current_yvNo.join(",")], columnCount: 10 },
  ];

  const wb = XLSX.utils.book_new();
  const OUTPUT_FILE_PATH = path.resolve(__dirname, `../data/documents/excels/Full_EAC_Numbers.xlsx`);

  // Iterate over the data array and create a worksheet for each object
  data.forEach((element) => {

    const { fileName, numbers, columnCount } = element;
    const ws_data: string[][] = [];

    // Iterate over the numbers array and create chunks of columnCount length
    for (let i = 0; i < numbers.length; i += columnCount) {
      ws_data.push(numbers.slice(i, i + columnCount)); // [1, columnCount], [columnCount+1, 2*columnCount], ...
    }

    // Create the worksheet from the worksheet data
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, fileName);

  });

  XLSX.writeFile(wb, OUTPUT_FILE_PATH);

  console.log(`✨ Excel dosyası oluşturuldu: ${OUTPUT_FILE_PATH}`);

}


function main() {
  //writeToExcel(); // Excel dosyasını oluştur ve kaydet
  writeToWord(WORD_Documents); // Word dosyasını oluştur ve kaydet

}

main();