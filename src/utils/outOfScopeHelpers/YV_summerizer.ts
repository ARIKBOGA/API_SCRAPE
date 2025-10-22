import path from 'path';
import xlsx from 'xlsx';


const inputFilePath = path.resolve(__dirname, 'ORJ_NO_KATALOG.xlsx');
const outputFilePath = path.resolve(__dirname, 'summerized_output.xlsx');


async function summarize() {
    const workbook = xlsx.readFile(inputFilePath);
    const worksheet = workbook.Sheets["dk"];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Iterate through rows and perform summarization logic
    data.forEach((row: any) => {
        // Example summarization logic (to be replaced with actual logic)
        row['son_kod'] = row['yvNo']?.toString().substring(2).replace(/[^0-9]/g, '') || '';
        row['ilk_iki'] = row['yvNo'].substring(0, 2);
        row['YV'] = row['yvNo'].substring(2);
    });

    const outputWorkbook = xlsx.utils.book_new();
    const outputWorksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(outputWorkbook, outputWorksheet, 'YV_Summerized');

    xlsx.writeFile(outputWorkbook, outputFilePath);
    console.log(`Summarized data written to ${outputFilePath}`);
}

function calculatePriceWithVAT(price: number, vatRate: number) : number {
    return price + (price * vatRate / 100);
}

function usdToT(tl: number) : number {
    const exchangeRate = 41.92 // Example exchange rate
    return tl * exchangeRate;
}


async function main() {
    //await summarize().catch(console.error);
    const priceUSD = 1250; // Example price in USD
    const priceTL = usdToT(priceUSD);
    const finalPrice = calculatePriceWithVAT(priceTL, 20);
    console.log(finalPrice);
}

main();