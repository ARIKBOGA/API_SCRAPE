import { request } from "@playwright/test";
import { getToken } from "./token-manager";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env") });

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function processProduct(ref: { yvNo: string, brandRefs: { [brand: string]: string } }): Promise<any> {
  const { yvNo, brandRefs } = ref;
  const filterBrand = Object.keys(brandRefs)[0];
  const crossNumber = brandRefs[filterBrand]?.trim();
  if (!crossNumber) {
    console.warn(`No cross number found for YV: ${yvNo}, Brand: ${filterBrand}`);
    return null;
  }

  const token = await getToken();
  const apiContext = await request.newContext();

  try {
    // 1️⃣ Encrypted Search Code alma
    const abu_1 = process.env.API_BASE_URL_1 || "";
    const abu_2 = process.env.API_BASE_URL_2 || "";
    const searchURL = `${abu_1}${encodeURIComponent(crossNumber)}${abu_2}`;

    const searchResp = await apiContext.get(searchURL, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const searchData = await searchResp.json();
    const encryptedSearchCode = searchData.products?.[0]?.code;

    if (!encryptedSearchCode) {
      console.warn(`Encrypted code not found for: ${crossNumber}`);
      return null;
    }

    // 2️⃣ OE Numbers alma
    const oeru_1 = process.env.OE_REQUEST_URL_1 as string;
    const oeru_2 = process.env.OE_REQUEST_URL_2 as string;
    const oeURL = `${oeru_1}${encryptedSearchCode}${oeru_2}`;

    const oeResp = await apiContext.get(oeURL, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const oeData = await oeResp.json();

    const result: any = {
      yvNo,
      crossNumber,
      oeNumbers: []
    };

    oeData.oenumbers.forEach((oe: any) => {
      const numbers = oe.numbers.map((n: any) => n.number);
      result.oeNumbers.push({
        manufacturer: oe.manufacturer.name,
        numbers
      });
    });

    return result;

  } catch (err) {
    console.error(`Error for YV ${yvNo}: ${err}`);
    return null;
  } finally {
    await apiContext.dispose();
    await delay(300);
  }
}
