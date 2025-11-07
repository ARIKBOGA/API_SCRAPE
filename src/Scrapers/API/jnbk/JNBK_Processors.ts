import { Locale } from "locale-enum";
import { OutputManufacturer, OutputTarget } from "../../../utils/Types";
import { extractYears } from "../../../utils/Utility";
import { delay } from "../Repxpert/helpers/API_Helpers";
import * as cheerio from "cheerio";

export async function processForOE_Numbers(freeTextSearch: string, $: cheerio.Root): Promise<Map<string, string[]>> {

    try {
        const selector = ".detail__plate > .detail__body > .d-lg-flex > .column > .str";

        const oeMap = new Map<string, Set<string>>();

        $(selector).each(async (index, element) => {
            const owner = $(element).find(".owner").text().trim();
            const field = $(element).find(".field").text().trim();

            if (owner && field) {
                if (oeMap.has(owner)) {
                    oeMap.get(owner)!.add(field);
                } else {
                    oeMap.set(owner, new Set([field]));
                }
            }
        });

        const resultMap = new Map<string, string[]>();
        oeMap.forEach((value, key) => {
            resultMap.set(key, Array.from(value));
        });

        return resultMap;

    } catch (error) {
        console.error(`❌ ${freeTextSearch} için hata:`, error);
        return new Map<string, string[]>();
    } finally {
        await delay(300);
    }
}

export async function processForCompatibilities(freeTextSearch: string, $: cheerio.Root): Promise<OutputManufacturer[]> {

    try {
        const compatibilityVehicles: OutputManufacturer[] = [];

        // Her bir 'model-title' div'ini iterate edelim
        // Bu yapıya göre her 'model-title' hemen ardından kendi 'model-body'si ile takip ediyor.
        const modelTitles = $(".model-title");

        for (let i = 0; i < modelTitles.length; i++) {
            const titleElement = modelTitles.eq(i);
            const fullTitle = titleElement.find("a.achrBrandModel").text().trim();

            if (!fullTitle) {
                console.warn(`Boş başlık atlandı.`);
                continue;
            }

            const [marka, model] = fullTitle.split("»").map(s => s.trim());

            // İlgili 'model-body' div'ini bulmak için doğrudan .next() kullanıyoruz
            const modelBodyDiv = titleElement.next(".model-body");

            if (modelBodyDiv.length === 0) {
                console.warn(`Model Body bulunamadı: ${fullTitle}`);
                continue; // Bu başlık için devam etme
            }

            // Tabloyu modelBodyDiv içinden bulalım
            const dataTable = modelBodyDiv.find("table.search-result-table");

            if (dataTable.length === 0) {
                console.warn(`Veri tablosu bulunamadı: ${fullTitle}`);
                continue;
            }

            const targets: OutputTarget[] = [];

            // Tablodaki her bir 'tr' elementini iterate edeyoruz
            // tr elementleri direkt <tbody> içinde olmayabilir, bu yüzden direkt tr'leri seçtik.
            // Başlık satırı olmadığı için ilk satırdan itibaren 
            const trElements = dataTable.find("tr").get(); // Tüm veri satırlarını array olarak al

            for (const rowElement of trElements) {

                const $row = $(rowElement);

                const madeYear = $row.find("td:nth-child(1)").text().trim();
                const years = await extractYears(madeYear, Locale.en_US); // extractYears fonksiyonunu revize ettim
                const cc = $row.find("td:nth-child(2)").text().trim();
                const engineCodes = $row.find("td:nth-child(3)").text().trim();
                const engineType_body = $row.find("td:nth-child(4)").text().trim(); // BODY sütunu

                targets.push({
                    engine: [cc, engineType_body].filter(Boolean).join(" | "), // Filter out empty strings and join them efficiently
                    fullName: fullTitle,
                    constructionYearFrom: years.start,
                    constructionYearTo: years.end,
                    engineCodes,
                    enginePowerKW: '',
                    enginePowerHP: '',
                    cc: cc,
                    kbaNumbers: '',
                    bodyType: engineType_body, // bodyType'ı ilgili sütundan al
                });
            }

            compatibilityVehicles.push({
                manufacturer: marka,
                models: [{
                    modelSeries: model,
                    targets: targets
                }]
            });
        }

        return compatibilityVehicles;

    } catch (error) {
        console.error(`❌ ${freeTextSearch} için hata:`, error);
        return [];
    } finally {
        await delay(300);
    }
}

export async function processForArticleAttributes(freeTextSearch: string, $: cheerio.Root) {

    const attributes: { name: string, value: string }[] = [];
    try {
        const selector = ".detail__specification > .d-lg-flex > .col > .str";
        $(selector).each((index, element) => {
            const name = $(element).find(".param-title").text().replace("Ø", "").trim();
            const value = $(element).find(".param-field").text().trim();
            if (name && value) {
                attributes.push({ name, value });
            }
        })
    } catch (error) {
        console.error(`❌ ${freeTextSearch} için hata:`, error);
        return {};
    }

    return attributes;
}