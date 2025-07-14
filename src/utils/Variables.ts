import { ProductReference } from "./Types";

export const SUPPLIER_NUMBERS: Record<string, string> = {
  "0AMS": "7510",
  "Dr!ve+": "4948",
  "HERTH+BUSS": "55",
  "KAVO PARTS": "201",
  "RED-LINE": "4869",
  ABE: "4426",
  "ALLIED NIPPON": "7662",
  BREMBO: "65",
  BSG: "4455",
  CAUTEX: "405",
  CIFAM: "311",
  CORTECO: "140",
  DANAHER: "4587",
  DELPHI: "89",
  EUROBRAKE: "4770",
  FAI: "267",
  FEBI: "101",
  FERODO: "62",
  FREMAX: "409",
  ICER: "158",
  JAPANPARTS: "156",
  KAWE: "286",
  KRAFTVOLL: "6923",
  MAXTECH: "4899",
  METELLI: "121",
  NipoKM: "7770",
  NK: "127",
  NPS: "440",
  RIDEX: "6358",
  RUVILLE: "23",
  SWAG: "151",
  TEXTAR: "39",
  TRW: "161",
  WILMINK: "4832",
  YUMAK: "6708",
};

export const productGroupNumbersOfRepxpert: Record<string, string> = {
  Disc: "100032",
  Drum: "100033",
  Pad: "100030",
  Crankshaft: "101971",
};

export function getGroupNumberOfProductType(productType: string) {
  return productGroupNumbersOfRepxpert[productType];
}

export const excelTitles = [
  "YV",
  "SUPPLIER",
  "CROSS NUMBER",
  "MARKA ID",
  "MARKA",
  "MODEL ID",
  "MODEL",
  "MOTOR", // OutputTarget'taki 'name' alanı buna karşılık geliyor
  "Baş. Yil",
  "Bit. Yil",
  "KW",
  "HP",
  "CC",
  "MOTOR KODU",
  "KBA",
  "KASA Tipi",
  "TecDocID",
];

// Marka ve Model için kısaltma/çeviri haritaları
export const brandAliases = new Map<string, string>([
  ["MERCEDES-BENZ", "MERCEDES"],
  ["VOLKSWAGEN", "VW"],
  ["VW", "VOLKSWAGEN"],
  ["BMW AG", "BMW"],
  ["AUDI AG", "AUDI"],
  ["FIAT CHRYSLER AUTOMOBILES", "FIAT"],
  ["IRISBUS", "IVECO"],
  ["GENERAL MOTORS", "GMC"],
  ["FERQUI", "MERCEDES-BENZ"],
  ["DMB", "BMW"],
  // Daha fazla marka kısaltması eklenebilir
]);

// This map is used to tranlate the addition of the model names to their abbreviations in English
export const modelAliases = new Map<string, string>([
  ["Minibüs/Otobüs", "Bus"],
  ["Kasa/eğik arka", "HB Van"],
  ["Panelvan/Van", "Van"],
  ["Platform şasi", "Platform/Chassis"],
  ["Kasa/Büyük Limuzin", "Box Body/MPV"],
  ["STATION WAGON ", "SW"],
  ["Station Wagon", "SW"],
  ["CABRIOLET", "Cabrio"],
  ["Cabriolet", "Cabrio"],
  ["SERISI", "Class"],
  ["Hatchback", "HB"],
  ["Kombi van", "Estate Van"],
]);

// Body types in English and in PascalCase
// Bu liste, gövde tipi kelimelerini içerecek (artık aliased halleriyle de eşleşebilir)
// modelAliases map'inin değerlerini kullanıyoruz
// BU LİSTE ARTIK BÜYÜK HARFE ÇEVRİLMEYECEK.
export const bodyTypes = [
  "Sedan",
  "Hatchback",
  "Estate",
  "Cabrio",
  "Coupe",
  "Van",
  "Bus",
  "Platform/Chassis",
  "Hatchback Van",
  "Estate Van",
  "Box Body/MPV",
  "SW",
  "Station Wagon",
  "Cabrio",
  "Pickup",
  "HB",
  "Limousine",
  "Roadster",
  "SUV",
];

export const referenceArray: ProductReference[] = [
  //{ yvNo: "60206", brand: "FERODO", crossNumber: "FCR106A"},
  //{ yvNo: "25906", brand: "TRW", crossNumber: "DF6307S"},
  //{ yvNo: "21158401", brand: "BREMBO", crossNumber: "P 83 013" },
  //{ yvNo: "21471401", brand: "BREMBO", crossNumber: "P 06 018" },
  //{ yvNo: "21827201", brand: "BREMBO", crossNumber: "P 61 051" },
  //{ yvNo: "21934201", brand: "BREMBO", crossNumber: "P 06 025" },
  //{ yvNo: "24727203", brand: "BREMBO", crossNumber: "P 23 130" }

  // Example of how to add more ProductReference objects:
  //{ yvNo: "30997", brand: "0AMS", crossNumber: "TFR-017K" },
  //{ yvNo: "251075", brand: "0AMS", crossNumber: "TJU-039" },
  //{ yvNo: "291066", brand: "0AMS", crossNumber: "TFP-003KC" },
  //{ yvNo: "401071", brand: "0AMS", crossNumber: "TUG/TKD-018" },

  //{ yvNo: "36349", brand: "TRW", crossNumber: "DB4143" },
  //{ yvNo: "22714", brand: "TRW", crossNumber: "DB4132" },
  //{ yvNo: "261091", brand: "TRW", crossNumber: "DB4349" },
  //{ yvNo: "341092", brand: "TEXTAR", crossNumber: "94045200" },
  //{ yvNo: "161065", brand: "0AMS", crossNumber: "TKK-113" },
  //{ yvNo: "341083", brand: "Dr!ve+", crossNumber: "DP1010.11.1846" },
  //{ yvNo: "20002201", brand: "OE", crossNumber: "3250077" },

  // LOADED NOT FOUND DISC
  
  
  { yvNo: "201076", brand: "BREMBO", crossNumber: "09.B564.10" },
  { yvNo: "201077", brand: "BREMBO", crossNumber: "09.B562.10" },
  { yvNo: "601079", brand: "BREMBO", crossNumber: "09.A315.10" },
  
];
