

export const SUPPLIER_NUMBERS: Record<string, string> = {
  ICER: "158",
  BREMBO: "65",
  TRW: "161",
  TEXTAR: "39",
  KRAFTVOLL: "6923",
  CORTECO: "140",
  RIDEX: "6358",
  RUVILLE: "23",
  FAI: "267",
  FEBI: "101",
  WILMINK: "4832",
  CAUTEX: "405",
  METELLI: "121",
  SWAG: "151",
  JAPANPARTS: "156",
  FERODO: "62",
  "HERTH+BUSS": "55",
  "0AMS": "7510",
  NipoKM: "7770",
  "Dr!ve+": "4948"
};

export const producyGroupNumbersOFRepxpert: Record<string, string> = {
  Disc:"100032",
  Drum:"100033", 
  Pad:"100030", 
  Crankshaft:"101971"
}

export function getGroupNumberOfProductType(productType: string) {
  return producyGroupNumbersOFRepxpert[productType];
}

export const excelTitles = [
  'YV',
  'SUPPLIER',
  'CROSS NUMBER',
  'MARKA ID',
  'MARKA',
  'MODEL ID',
  'MODEL',
  'MOTOR', // OutputTarget'taki 'name' alanı buna karşılık geliyor
  'Baş. Yil',
  'Bit. Yil',
  'KW',
  'HP',
  'CC',
  'MOTOR KODU',
  'KBA',
  'KASA Tipi',
  'TecDocID'
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
  ["DMB", "BMW"]
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