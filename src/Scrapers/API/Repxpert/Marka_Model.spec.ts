import { request, test } from "@playwright/test";
import path from "path";
import fs from "fs";
import xlsx from 'xlsx';
import { getToken } from "./helpers/API_Helpers";
import { ApiCompatibility, Model } from "../../../utils/Types";

export function readBrandNames(): string[] {
    const filepath = path.resolve(__dirname, "../../../resources/catalog/excels/eldeki_markalar.xlsx");
    const workbook = xlsx.readFile(filepath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data.map((each: any) => each["BRAND_NAME"]);
}



test.describe("Brand-Model Process", async () => {

    const carTypes: string[] = ["passengerCar", "commercialVehicle"];
    const brandMap: Map<string, string> = new Map();
    brandMap.set("ZASTAVA", "TA-124");
    
    const modelRecord: Record<string, Model[]> = {};

    test.beforeAll("Get Brands UUID Codes", async () => {

        const apiContext = await request.newContext();
        const token = await getToken();
        const headers = { headers: { Authorization: `Bearer ${token}` } };

        for (const carType of carTypes) {
            const uri = `https://www.repxpert.co.uk/api/Repxpert-GB/manufacturers?targetTypeCodes=${carType}&globalCarPark=true`;
            const response = await apiContext.get(uri, headers);
            const data = await response.json();
            console.log(data.manufacturers.length);
            data.manufacturers.forEach((manufacturer: { name: string; uuid: string; }) => {
                brandMap.set(manufacturer.name, manufacturer.uuid);
            })
        }
        //console.log(brandMap.size);
        //await apiContext.dispose();

    });

    test("Get all models of given brands", async () => {
        test.setTimeout(2 * 60 * 1000);

        const apiContext = await request.newContext();
        const token = await getToken();
        const headers = { headers: { Authorization: `Bearer ${token}` } };

        const currentBrandsArray = readBrandNames();

        for (const brandName of currentBrandsArray) {

            const uuid = brandMap.get(brandName);

            for (const carType of carTypes) {

                const uri = `https://www.repxpert.co.uk/api/Repxpert-GB/manufacturers/${uuid}/modelSeries?targetTypeCodes=${carType}&globalCarPark=true`;

                const response = await apiContext.get(uri, headers);
                try {
                    const data = await response.json();
                     
                    const modelSeries: any[] = data.modelSeries;

                    modelSeries.forEach((each: any) => {
                        const model: Model = {
                            name: each.name,
                            code: each.uuid,
                            type: each.type.code
                        };
                        if (modelRecord[brandName]) {
                            modelRecord[brandName].push(model);
                        } else {
                            modelRecord[brandName] = [model];
                        }
                    });

                    
                } catch (error) {
                    console.log(`Error: ${brandName} ${carType} -> ${uri}`);
                    //console.log(error);
                }

            }
        }

    })


    test.afterAll(async () => {
        // Prepare object for JSON output
        const output = {
            models: modelRecord
        };

        

        // Write to JSON file
        const outputPath = path.resolve(__dirname, "../../../resources/catalog/jsons/catalog/jsons/ALL_MODELS_REPXPERT.json");
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
    });

});
