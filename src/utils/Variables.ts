import { ProductReference } from "./Types";

export const SUPPLIER_NUMBERS: Record<string, string> = {
  "0AMS": "7510",
  "Dr!ve+": "4948",
  "HERTH+BUSS": "55",
  "KAVO PARTS": "201",
  ABE: "4426",
  AP: "283",
  "A.B.S.": "206",
  "ALLIED NIPPON": "7662",
  "BORG & BECK": "475",
  BREMBO: "65",
  BREMSI: "4872",
  BSG: "4455",
  CAUTEX: "405",
  CHITAO: "7675",
  CIFAM: "311",
  CORTECO: "140",
  DANAHER: "4587",
  DELPHI: "89",
  "EBC Brakes": "6368",
  EUROBRAKE: "4770",
  FAI: "267",
  FEBI: "101",
  FERODO: "62",
  FREMAX: "409",
  FROW: "7373",
  ICER: "158",
  JAPANPARTS: "156",
  JAPKO: "481",
  KAWE: "286",
  KRAFTVOLL: "6923",
  MANDO: "4008",
  MAXTECH: "4899",
  METELLI: "121",
  NipoKM: "7770",
  NK: "127",
  NPS: "440",
  "RED-LINE": "4869",
  RIDEX: "6358",
  ROADHOUSE: "152",
  ROTINGER: "4676",
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
  "Box Body/MPV",
  "Bus",
  "Cab with engine",
  "Cabrio",
  "Closed Off-Road Van",
  "Closed Off-Road Vehicle",
  "Convertible",
  "Coupe",
  "Dump Truck",
  "Estate",
  "Estate Van",
  "Hatchback",
  "Hatchback Van",
  "HB",
  "Limousine",
  "MPV",
  "Municipal Vehicle",
  "Open Off-Road Vehicle",
  "Pickup",
  "Platform/Chassis",
  "Roadster",
  "Saloon",
  "Sedan",
  "Station Wagon",
  "SUV",
  "SUV Van",
  "SW",
  "Targa",
  "Truck Tractor",
  "Van"
];

export const referenceArray: ProductReference[] = [
  { yvNo: "13047", brand: "EBC Brakes", crossNumber: "D032"}
];