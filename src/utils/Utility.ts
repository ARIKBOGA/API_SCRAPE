import { Locale } from "locale-enum";

export function serializeMap(map: any): any {
  if (map instanceof Map) {
    const obj: any = {};
    for (const [key, value] of map.entries()) {
      obj[key] = serializeMap(value);
    }
    return obj;
  } else if (Array.isArray(map)) {
    return map.map(item => serializeMap(item));
  } else {
    return map; // primitive value (string, number, boolean vs.)
  }
}

export function serialize3LevelMap(map: Map<string, Map<string, Map<string, string[]>>>): any {
  const result: any = {};

  for (const [key1, level2Map] of map.entries()) {
    result[key1] = {};

    for (const [key2, level3Map] of level2Map.entries()) {
      result[key1][key2] = {};

      for (const [key3, stringArray] of level3Map.entries()) {
        result[key1][key2][key3] = stringArray;
      }
    }
  }

  return result;
}

export function serializeArrayOfMaps(arr: Array<Map<string, Map<string, string[]>>>): any[] {
  return arr.map(map => {
    const obj: any = {};
    for (const [key1, innerMap] of map.entries()) {
      obj[key1] = {};
      for (const [key2, stringArrayMap] of innerMap.entries()) {
        obj[key1][key2] = stringArrayMap;
      }
    }
    return obj;
  });
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