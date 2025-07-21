
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

export type CrossNumberElement = {
  Supplier: string;
  ArticleNumber: string;
  StatusCode: string;
  StatusMessage: string;
  ApiCode: string;
}

export type CrossNumberJson = {
  yvNo: string;
  OE: string;
  crossNumbers: CrossNumberElement[];
}