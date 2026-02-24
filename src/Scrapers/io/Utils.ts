import { ModelData } from "../../utils/Types";
import initialModelData from "../../resources/catalog/jsons/MODELLER.json";
import initialMarkaData from '../../resources/catalog/jsons/MARKALAR.json';
import { Locale } from "locale-enum";

export const modelDataMap = new Map<string, ModelData>();
(initialModelData as ModelData[]).forEach(model => {
  const key = `${model["modeller_markalar::marka"].trim().toUpperCase()}_${model.model.trim().toUpperCase()}`;
  modelDataMap.set(key, model);
});

// Import Marka (Brand) data and store it in a map for easy lookup
export const markaNameToIdMap = new Map<string, number>();
for (const [idString, name] of Object.entries(initialMarkaData)) {
  markaNameToIdMap.set(name.trim().toUpperCase(), parseInt(idString));
}

export function normalize_OE(oe: string): string {
  return oe.replace(/[^a-zA-Z0-9]/g, '');
}

export async function extractYears(madeYear: string, locale: Locale): Promise<{ start: string; end: string; }> {

  madeYear = madeYear.trim();
  // 2. JNBK - Tam aralık: "04.16~11.20"
  const jnbkFullMatch = madeYear.match(/(\d{2})\.(\d{2})~(\d{2})\.(\d{2})/);
  if (jnbkFullMatch) {
    return {
      start: jnbkFullMatch[2],
      end: jnbkFullMatch[4],
    };
  }

  // 3. JNBK - Bitiş yılı belirtilmiş: "~11.20"
  const jnbkEndMatch = madeYear.match(/~?(\d{2})\.(\d{2})$/); // "~" ile başlayabilir veya başlamayabilir
  if (jnbkEndMatch && madeYear.startsWith("~")) { // Sadece "~" ile başlayanları yakala
    return {
      start: "",
      end: jnbkEndMatch[2],
    };
  }

  // 4. JNBK - Başlangıç yılı belirtilmiş: "04.16~"
  const jnbkStartMatch = madeYear.match(/^(\d{2})\.(\d{2})~$/);
  if (jnbkStartMatch) {
    return {
      start: jnbkStartMatch[2],
      end: "",
    };
  }

  // In case of no match
  return { start: "", end: "" };
}