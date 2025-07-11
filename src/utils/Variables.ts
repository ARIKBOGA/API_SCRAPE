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

export const producTGroupNumbersOFRepxpert: Record<string, string> = {
  Disc: "100032",
  Drum: "100033",
  Pad: "100030",
  Crankshaft: "101971"
}

export function getGroupNumberOfProductType(productType: string) {
  return producTGroupNumbersOFRepxpert[productType];
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
  { yvNo: "28052", brand: "TEXTAR", crossNumber: "92029900" },
  { yvNo: "24173", brand: "TEXTAR", crossNumber: "93191400" },
  { yvNo: "49113", brand: "TEXTAR", crossNumber: "92236100" },
  { yvNo: "45340", brand: "TEXTAR", crossNumber: "92155700" },
  { yvNo: "13577", brand: "TEXTAR", crossNumber: "92253400" },
  { yvNo: "24916", brand: "TEXTAR", crossNumber: "92279403" },
  { yvNo: "15676CS", brand: "TEXTAR", crossNumber: "92257303" },
  { yvNo: "15677CS", brand: "TEXTAR", crossNumber: "92301303" },
  { yvNo: "24814CS", brand: "TEXTAR", crossNumber: "92354325" },
  { yvNo: "24831CS", brand: "TEXTAR", crossNumber: "92257005" },
  { yvNo: "27590CS", brand: "TEXTAR", crossNumber: "92243303" },
  { yvNo: "27756CS", brand: "TEXTAR", crossNumber: "92275300" },
  { yvNo: "28405CS", brand: "TEXTAR", crossNumber: "92129603" },
  { yvNo: "28679CS", brand: "TEXTAR", crossNumber: "92232305" },
  { yvNo: "28770CS", brand: "TEXTAR", crossNumber: "92268003" },
  { yvNo: "30513CS", brand: "TEXTAR", crossNumber: "92255203" },
  { yvNo: "33375CS", brand: "TEXTAR", crossNumber: "92069600" },
  { yvNo: "36178CS", brand: "TEXTAR", crossNumber: "92120800" },
  { yvNo: "36313CS", brand: "TEXTAR", crossNumber: "92120900" },
  { yvNo: "36461CS", brand: "TEXTAR", crossNumber: "92122000" },
  { yvNo: "36567CS", brand: "TEXTAR", crossNumber: "92224903" },
  { yvNo: "36753CS", brand: "TEXTAR", crossNumber: "92255403" },
  { yvNo: "36758CS", brand: "TEXTAR", crossNumber: "92303803" },
  { yvNo: "36920CS", brand: "TEXTAR", crossNumber: "92121700" },
  { yvNo: "36925CS", brand: "TEXTAR", crossNumber: "92151403" },
  { yvNo: "41423CS", brand: "TEXTAR", crossNumber: "92120500" },
  { yvNo: "52536CS", brand: "TEXTAR", crossNumber: "92265825" },
  { yvNo: "52541CS", brand: "TEXTAR", crossNumber: "92265925" },
  { yvNo: "61861CS", brand: "TEXTAR", crossNumber: "92238703" },
  { yvNo: "15112CS", brand: "TEXTAR", crossNumber: "92060900" },
  { yvNo: "15245CS", brand: "TEXTAR", crossNumber: "92140903" },
  { yvNo: "15328CS", brand: "TEXTAR", crossNumber: "92144403" },
  { yvNo: "15498CS", brand: "TEXTAR", crossNumber: "92195000" },
  { yvNo: "24182CS", brand: "TEXTAR", crossNumber: "92105905" },
  { yvNo: "30220CS", brand: "TEXTAR", crossNumber: "92119203" },
  { yvNo: "36193CS", brand: "TEXTAR", crossNumber: "92082200" },
  { yvNo: "36750CS", brand: "TEXTAR", crossNumber: "92271903" },
  { yvNo: "36926CS", brand: "TEXTAR", crossNumber: "92229805" },
  { yvNo: "41975CS", brand: "TEXTAR", crossNumber: "92098500" },
  { yvNo: "24654CS", brand: "TEXTAR", crossNumber: "92163503" },
  { yvNo: "36116CS", brand: "TEXTAR", crossNumber: "92036800" },
  { yvNo: "161062", brand: "TEXTAR", crossNumber: "92337103" },
  { yvNo: "161063", brand: "TEXTAR", crossNumber: "92337203" },
  { yvNo: "53477CS", brand: "TEXTAR", crossNumber: "92205503" },
  { yvNo: "201076", brand: "TEXTAR", crossNumber: "93138000" },
  { yvNo: "201077", brand: "TEXTAR", crossNumber: "93143100" },
  { yvNo: "601079", brand: "TEXTAR", crossNumber: "93221300" },
  { yvNo: "13986C", brand: "TEXTAR", crossNumber: "92315503" },
  { yvNo: "36670C", brand: "TEXTAR", crossNumber: "92228903" },
  { yvNo: "13680CS", brand: "TEXTAR", crossNumber: "92303405" },
  { yvNo: "13681CS", brand: "TEXTAR", crossNumber: "92303503" },
  { yvNo: "281060", brand: "TEXTAR", crossNumber: "92313603" },
  { yvNo: "341532", brand: "TEXTAR", crossNumber: "92263203" },
  { yvNo: "36938CS", brand: "TEXTAR", crossNumber: "92313703" },
  { yvNo: "301538", brand: "TEXTAR", crossNumber: "92347603" },
  { yvNo: "151544", brand: "TEXTAR", crossNumber: "92204000" },
  { yvNo: "131553", brand: "TEXTAR", crossNumber: "92352603" },
  { yvNo: "131554", brand: "TEXTAR", crossNumber: "92352703" },
  { yvNo: "361534CS", brand: "TEXTAR", crossNumber: "92232403" },
  { yvNo: "18146C", brand: "TEXTAR", crossNumber: "92234700" },
  { yvNo: "16374C", brand: "TEXTAR", crossNumber: "92203800" },
  { yvNo: "30438C", brand: "TEXTAR", crossNumber: "92195505" },
  { yvNo: "30513C", brand: "TEXTAR", crossNumber: "92255203" },
  { yvNo: "34575C", brand: "TEXTAR", crossNumber: "92274903" },
  { yvNo: "26606C", brand: "TEXTAR", crossNumber: "92274203" },
  { yvNo: "13742C", brand: "TEXTAR", crossNumber: "92268603" },
  { yvNo: "30778C", brand: "TEXTAR", crossNumber: "92300703" },
  { yvNo: "47944C", brand: "TEXTAR", crossNumber: "92220803" },
  { yvNo: "341531C", brand: "TEXTAR", crossNumber: "92199300" },
  { yvNo: "30438CS", brand: "TEXTAR", crossNumber: "92195505" },
  { yvNo: "15443CS", brand: "TEXTAR", crossNumber: "92184803" },
  { yvNo: "18486CS", brand: "TEXTAR", crossNumber: "92166505" },
  { yvNo: "52657CS", brand: "TEXTAR", crossNumber: "92133000" },
  { yvNo: "15672CS", brand: "TEXTAR", crossNumber: "92283303" },
  { yvNo: "34759CS", brand: "TEXTAR", crossNumber: "92321203" },


];