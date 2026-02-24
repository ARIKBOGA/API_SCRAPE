import fs from 'fs';
import path from 'path';
import { writeExcelSafe } from '../../../io/utils/ExcelUtils';

async function toExcelWatem() {
  const INPUT_FILE = path.resolve(__dirname, 'ShateMag_PriceResults.json');

  const OUTPUT_PATH = path.resolve(__dirname, 'ShateMag_PriceResults.xlsx');

  const jsonData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

  const outputData = jsonData
    .map((item: any) => {
      const yv = item.yv;
      const oeNumber = item.oeNumber;
      return item.results.map((result: any) => ({
        YV: yv,
        OE: oeNumber,
        Brand: result.brand,
        BrandNumber: result.brandNumber,
        DiscountedPrice: result.discountedPrice,
        SellingPrice: result.sellingPrice,
      }));
    })
    .flat();

  await writeExcelSafe(OUTPUT_PATH, { name: 'ShateMag', data: outputData });
}


toExcelWatem().catch((err) => {
  console.error('Error converting to Excel:', err);
});
