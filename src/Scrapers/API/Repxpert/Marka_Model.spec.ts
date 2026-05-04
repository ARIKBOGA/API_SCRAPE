import { test } from "@playwright/test";
import path from "path";
import fs from "fs";
import { getAuthHeaders } from "./helpers/API_Helpers";
import { Model } from "../../../utils/Types";
import { writeExcelSafe } from "../../../io/utils/ExcelUtils";

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

test.describe.configure({ mode: 'serial' });

test.describe("🌍 Brand-Model Process", () => {

    const carTypes: string[] = ["passengerCar", "commercialVehicle"];
    // Map'i private ve readonly gibi düşünebiliriz.
    const BRANDS_MASTER_MAP = new Map<string, Map<string, string>>()
    const MODELS_MASTER_RESULT: Record<string, Record<string, Model[]>> = {};

    test.beforeAll("1. Get Auth & Brands UUID Codes", async () => {

        const requestOptions = {
            method: "GET",
            headers: await getAuthHeaders(),
        };

        for (const carType of carTypes) {
            
            const brandMap: Map<string, string> = new Map();
            const URL = `https://www.repxpert.co.uk/api/Repxpert-GB/manufacturers?globalCarPark=true&targetTypeCodes=${carType}`;

            try {
                const response = await fetch(URL, requestOptions);
                // Status kontrolü eklemek önemli
                if (!response.status.toString().startsWith("2")) {
                    console.error(`Error fetching brands for ${carType}: ${response.status}`);
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
        test.setTimeout(20 * 60 * 1000);

        const requestOptions = {
            method: "GET",
            headers: await getAuthHeaders(),
        };

        for (const carType of carTypes) {

            const brandMap = BRANDS_MASTER_MAP.get(carType);
            if (!brandMap) continue;

            const MODEL_RESULT: Record<string, Model[]> = {};

            // 2. İyileştirme: Map'in kendi anahtar listesini al
            const brandNames = Array.from(brandMap.keys());
            console.log(brandNames);

            for (const brandName of brandNames) {

                const uuid = brandMap.get(brandName);
                if (!uuid) continue;

                const URL = `https://www.repxpert.co.uk/api/Repxpert-GB/manufacturers/${uuid}/modelSeries?targetTypeCodes=${carType}&globalCarPark=true`;

                try {
                    const response = await fetch(URL, requestOptions);

                    if (!response.status.toString().startsWith("2")) {
                        console.log(`Warning: Status ${response.status} for ${brandName} (${carType})`);
                        continue;
                    }

                    const data = await response.json();
                    const modelSeries: any[] = data.modelSeries;

                    modelSeries.forEach((each: any) => {
                        const model: Model = {
                            name: each.name,
                            constructionYearFrom: each.constructionYearFrom,
                            constructionYearTo: each.constructionYearTo,
                            seoPath: each.seoPath,
                            type: {
                                code: each.type.code,
                                name: each.type.name,
                                referenceCode: each.type.referenceCode
                            },
                            uuid: each.uuid
                            
                        };
                        // Daha kısa yazım:
                        MODEL_RESULT[brandName] = (MODEL_RESULT[brandName] || []).concat(model);
                    });

                } catch (error) {
                    // JSON parse veya Network hatasını yakala
                    console.error(`Error processing ${brandName} ${carType} -> ${URL}`, error);
                }
            }
            MODELS_MASTER_RESULT[carType] = MODEL_RESULT;
        }
    });

    // Çıktıyı JSON dosyasına yaz
    test("3. Output results to JSON", async () => {

        const outputPath = path.resolve(__dirname, "output/jsons/ALL_MODELS_REPXPERT_array.json");
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
        fs.writeFileSync(outputPath, JSON.stringify(MODELS_MASTER_RESULT, null, 2), "utf-8");
        console.log(`✅ Model verileri başarıyla yazıldı: ${outputPath}`);
        
    });


    // JSON dosyasını EXCEL'e yaz
    test("4. Output results to EXCEL", async () => {
        // Burada JSON'dan EXCEL'e dönüştürme işlemi yapılabilir.
        const jsonDataPath = path.resolve(__dirname, "output/jsons/ALL_MODELS_REPXPERT_array.json");
        const excelOutputPath = path.resolve(__dirname, "output/excels/ALL_MODELS_REPXPERT_array.xlsx");

        // JSON verisini oku
        const jsonData = JSON.parse(fs.readFileSync(jsonDataPath, "utf-8"));
        
        // EXCEL'e yazma işlemi (örneğin xlsx kütüphanesi ile)
        const rows: any[] = [];

        for (const carType in jsonData) {
            const brands = jsonData[carType];
            for (const brandName in brands) {
                const models = brands[brandName];
                models.forEach((model: Model) => {
                    rows.push({
                        uuid: model.uuid,
                        carType: carType,
                        brandName: brandName,
                        modelName: model.name,
                        constructionYearFrom: model.constructionYearFrom,
                        constructionYearTo: model.constructionYearTo,
                        seoPath: model.seoPath.join(", "),
                        typeCode: model.type.code,
                        typeName: model.type.name,
                        typeReferenceCode: model.type.referenceCode,
                    });
                });
            }
        }
        // Burada jsonData'yı uygun bir formata dönüştürüp EXCEL'e yazmak gerekiyor.

        await test.step("Write to EXCEL", async () => {
            await writeExcelSafe(excelOutputPath, {name: "ALL_MODELS_REPXPERT_array", data: rows });
            console.log(`✅ Model verileri başarıyla EXCEL'e yazıldı: ${excelOutputPath}`);
        });
        // Bu adımda, her carType ve brand için ayrı sayfalar oluşturulabilir.
    });

    // Test sonrası cleanup işlemleri (varsa)
    test.afterAll(async () => {

    });
});
