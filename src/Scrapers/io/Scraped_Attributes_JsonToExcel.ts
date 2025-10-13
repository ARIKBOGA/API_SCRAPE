import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(".env") });

const productType = process.env.PRODUCT_TYPE as string;
const filterBrand = process.env.FILTER_BRAND as string;

const INPUT_FILE = path.resolve(__dirname, `../output/${productType}/jsons/Attributes/Attributes_${productType}_${filterBrand}.json`);
const OUTPUT_PATH = path.resolve(__dirname, `../output/${productType}/excels/Attributes`);

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

interface Attribute {
    yvNo: string,
    crossNumber: string,
    supplier: string,
    attributes: {
        name: string,
        value: string
    }[]
}

interface row {
    yvNo: string,
    crossNumber: string,
    supplier: string,
    [key: string]: string
}

const rows: row[] = data.map((item: Attribute) => {
    const { yvNo, crossNumber, supplier, attributes } = item;
    const attributeMap: Record<string, string> = {};
    attributes.forEach(attribute => {
        attributeMap[attribute.name] = attribute.value;
        if (attribute.name === "WVA Number" && !attribute.value.includes(yvNo.slice(0, 5))) {
            attributeMap[attribute.name] = yvNo.slice(0, 5) + ", " + attribute.value;
            console.log("Added: ", yvNo.slice(0, 5), " to ", attributeMap[attribute.name]);
        }
    });
    return {
        yvNo,
        crossNumber,
        supplier,
        ...attributeMap
    }
});

const workbook = XLSX.utils.book_new();
const headers = Object.keys(rows[0]);
const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    ...rows.map(row => headers.map(header => row[header] || ""))
]);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Attributes');

XLSX.writeFile(workbook, path.resolve(__dirname, `${OUTPUT_PATH}/Attributes_${productType}_${filterBrand}.xlsx`));