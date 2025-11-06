import { request, test } from "@playwright/test";
import path from "path";
import fs from "fs";
import xlsx from 'xlsx';
import { getAuthHeaders, getToken } from "./helpers/API_Helpers";
import { Model } from "../../../utils/Types";


/*
export function readBrandNames(): string[] {
    const filepath = path.resolve(__dirname, "../../../resources/catalog/excels/eldeki_markalar.xlsx");
    const workbook = xlsx.readFile(filepath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data.map((each: any) => each["BRAND_NAME"]);
}
const MARAKALAR = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../resources/catalog/jsons/MARKALAR.json'), 'utf-8'));

const currentBrandList: string[] = Object.values(MARAKALAR);
*/


test.describe("🌍 Brand-Model Process", () => {

    const carTypes: string[] = ["passengerCar", "commercialVehicle"];
    // Map'i private ve readonly gibi düşünebiliriz.
    const BRANDS_MASTER_MAP = new Map<string, Map<string, string>>()
    const MODELS_MASTER_RESULT: Record<string, Record<string, Model[]>> = {};
    const MODEL_RESULT: Record<string, Model[]> = {};

    let authHeaders: any; // Header'ları beforeAll'da almak için
    let apiContext: any; // Context'i beforeAll'da oluşturmak için

    // API Context ve Marka verilerini tek seferde al
    test.beforeAll("1. Get Auth & Brands UUID Codes", async () => {
        // API Context'i bir kere oluştur
        apiContext = await request.newContext();
        authHeaders = await getAuthHeaders(); // Auth header'ları al
        const myHeader = {
            "Authorization": authHeaders.Authorization,
            "Cookie": authHeaders.Cookie
        };

        for (const carType of carTypes) {
            const brandMap: Map<string, string> = new Map();
            const URL = `https://www.repxpert.co.uk/api/Repxpert-GB/manufacturers?globalCarPark=true&targetTypeCodes=${carType}`;

            // Hata yakalamayı da eklemek iyi olur.
            try {
                const response = await apiContext.get(URL, { header: myHeader });
                // Status kontrolü eklemek önemli
                if (!response.ok()) {
                    console.error(`Error fetching brands for ${carType}: ${response.status()}`);
                    continue; // Bir sonraki carType'a geç
                }

                const data = await response.json();
                console.log(`Fetched ${data.manufacturers.length} brands for ${carType}`);

                data.manufacturers.forEach((manufacturer: { name: string; uuid: string; }) => {
                    brandMap.set(manufacturer.name, manufacturer.uuid);
                })
                BRANDS_MASTER_MAP.set(carType, brandMap);
            } catch (error) {
                console.error(`CRITICAL: Failed to get brands for ${carType}.`, error);
            }
        }

        // Hardcoded eklemeler
        BRANDS_MASTER_MAP.get("passengerCar")?.set("ZASTAVA", "TA-124");
        BRANDS_MASTER_MAP.get("passengerCar")?.set("ZAZ", "TA-1139");
        BRANDS_MASTER_MAP.get("passengerCar")?.set("YUGO", "TA-2816");
    });

    // Modelleri Çekme Testi
    test("2. Get all models of given brands", async () => {
        // TimeOut'u test blok seviyesine indirmek daha doğru
        test.setTimeout(2 * 60 * 1000);

        const token = await getToken();
        const headers = { headers: { Authorization: `Bearer ${token}` } };

        for (const carType of carTypes) {
            const brandMap = BRANDS_MASTER_MAP.get(carType);
            if (!brandMap) continue;

            // 2. İyileştirme: Map'in kendi anahtar listesini al
            const brandNames = Array.from(brandMap.keys());

            for (const brandName of brandNames.slice(0, 3)) {

                const uuid = brandMap.get(brandName);
                if (!uuid) continue;

                const uri = `https://www.repxpert.co.uk/api/Repxpert-GB/manufacturers/${uuid}/modelSeries?targetTypeCodes=${carType}&globalCarPark=true`;

                try {
                    const response = await apiContext.get(uri, headers);

                    if (!response.ok()) {
                        console.log(`Warning: Status ${response.status()} for ${brandName} (${carType})`);
                        continue;
                    }

                    const data = await response.json();
                    const modelSeries: any[] = data.modelSeries;

                    modelSeries.forEach((each: any) => {
                        const model: Model = {
                            name: each.name,
                            code: each.uuid,
                            type: each.type.code,
                            constructionYearFrom: each.constructionYearFrom
                        };
                        // Daha kısa yazım:
                        MODEL_RESULT[brandName] = (MODEL_RESULT[brandName] || []).concat(model);
                    });

                } catch (error) {
                    // JSON parse veya Network hatasını yakala
                    console.error(`Error processing ${brandName} ${carType} -> ${uri}`, error);
                }
            }
            MODELS_MASTER_RESULT[carType] = MODEL_RESULT;
        }
    });

    // Çıktıyı JSON dosyasına yaz
    test.afterAll(async () => {

        const RESULT = {
            REPXPERT_MODELS: MODELS_MASTER_RESULT
        };

        const outputPath = path.resolve(__dirname, "output/jsons/ALL_MODELS_REPXPERT.json");
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        fs.writeFileSync(outputPath, JSON.stringify(RESULT, null, 2), "utf-8");
        console.log(`✅ Model verileri başarıyla yazıldı: ${outputPath}`);
    });
});
