
// Mevcut ProductReference tipiniz
export type ProductReference = {
  yvNo: string;
  brand: string;
  crossNumber: string;
};

// API'den gelen genel uyumluluk nesnesi (manufacturer ve model için) - Excel için doğrudan kullanılmıyor
export type ApiCompatibility = {
  name: string;
  uuid: string;
};

// API'den gelen Target nesnesi - Excel için doğrudan kullanılmıyor
export type ApiTarget = {
  name: string;
  fullName: string;
  constructionYearFrom: string;
  constructionYearTo: string;
  enginePowerKW: string;
  enginePowerHP: string;
  displacementCCM: string;
  engineCodes: string[];
  kbaNumbers: string[];
  bodyType: string;
  referenceNumber: string;
};

// Çıktı JSON'u için Target nesnesi
export type OutputTarget = {
  engine: string; // Genelde 'engine' alanına karşılık gelir
  fullName: string; // Excel'e yazılmayacak olsa da, veride bu alan olabilir
  constructionYearFrom: string;
  constructionYearTo: string;
  enginePowerKW: string;
  enginePowerHP: string;
  cc: string;
  engineCodes: string;
  kbaNumbers: string;
  bodyType: string;
  TecDocID?: string;
};


// Çıktı JSON'u için Model Series nesnesi - Mevcut OutputModelSeries tipiniz
export type OutputModelSeries = {
  modelSeries: string; // Modelin adı (örn. "3 Series")
  targets: OutputTarget[]; // Bu modele ait hedefler
};

// Çıktı JSON'u için Manufacturer nesnesi - Mevcut OutputManufacturer tipiniz
export type OutputManufacturer = {
  manufacturer: string; // Üreticinin adı (örn. "BMW")
  models: OutputModelSeries[]; // Bu üreticiye ait model serileri
};

// Genel çıktı yapısı - Mevcut ProductCompatibilityResult tipiniz
export type ProductCompatibilityResult = {
  yvNo: string;
  brand: string;
  crossNumber: string;
  compatibleVehicles: OutputManufacturer[];
};

// JSON dosyanızın kök yapısı bir ProductCompatibilityResult dizisi olduğu için
export type RootJsonData = ProductCompatibilityResult[];

// Sizin eklediğiniz tipler:
export interface ModelData {
  id: number;
  marka_id: number;
  "modeller_markalar::marka": string;
  model: string; // Kataloğunuzdaki model adı
  model_Web: string;
}

export interface ModelMatch {
  original: string;
  normalized: string;
  model_id: number;
  marka_id: number | null;
}

export interface MarkaData {
  [key: string]: string;
}


export interface CrossNumberApiProduct {
  Supplier: string;
  ArticleNumber: string;
  StatusCode: string;
  StatusMessage: string;
  ApiCode: string;
}

export interface CrossNumbersYV_Pair {
  yvNo: string;
  crossNumbers: CrossNumberApiProduct[];
}

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
  { yvNo: "20002201", brand: "OE", crossNumber: "3250077" },

];