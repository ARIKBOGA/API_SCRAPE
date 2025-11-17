
// Mevcut ProductReference tipiniz
export type ProductReference = {
  yvNo: string;
  supplier: string;
  freeTextSearch: string;
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
// (//div[contains(@class, 'model-body')])[1]//tr[1]//td[1]

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

// Sizin eklediğiniz tipler:
export type ModelData = {
  id: number;
  marka_id: number;
  "modeller_markalar::marka": string;
  model: string; // Kataloğunuzdaki model adı
  model_Web: string;
}

export type ModelMatch = {
  original: string;
  normalized: string;
  model_id: number;
  marka_id: number | null;
}

export type MarkaData = {
  [key: string]: string;
}


export type CrossNumberApiProduct = {
  Supplier: string;
  ArticleNumber: string;
  StatusCode: string;
  StatusMessage: string;
  ApiCode: string;
}

export type CrossNumbersYV_Pair = {
  yvNo: string;
  crossNumbers: CrossNumberApiProduct[];
}


export type CrossNumberJson = {
  yvNo: string;
  OE: string;
  crossNumbers: CrossNumberApiProduct[];
}

// JSON'dan dönüştürülen tip
export type FullCrossNumberData = {
  yvNo: string;
  oeNumbers: string[];
  crossNumbers: CrossNumberApiProduct[];
};

export type Model = {
  name: string;
  code: string;
  type: string;
  constructionYearFrom: string;
}

export type OERoot = {
  yvNo: string
  crossNumber: string
  supplier: string
  oeNumbers: OeNumber[]
}

export type OeNumber = {
  manufacturer: string
  numbers: string[]
}

export type OE_rowData = {
  YV: string;
  "CROSS NO": string;
  "MARKA ID": number | string;
  MANUFACTURER: string;
  OE: string;
}


export type HORIZONTAL_OE_rowData = {
  YV: string;
  "CROSS NO": string;
  BRANDS: string;
  OE_Numbers: string;
  NORMALIZED_OE_Numbers: string;
}


export type AttributeItem = {
  yvNo: string,
  crossNumber: string,
  supplier: string,
  attributes: {
    name: string,
    value: string
  }[]
}

export type AttributeRow = {
  yvNo: string,
  crossNumber: string,
  supplier: string,
  [key: string]: string | number; // Dinamik attribute'ler için
}

export type MARKA_HAREKET_ExcelRow = {
  ID?: number;
  yvno: string;
  marka: string;
  marka_aciklama: string;
  model: string;
  model_aciklama: string;
  motor: string;
  BasYil: number | string;
  Bityil: number | string;
  "KATOLOG::SecilenNo": string;
  "KATOLOG::YV NO": string;
  "KATOLOG 2::YV NO": string;
  "KATOLOG::No": string;
  "markahareket_marka::marka": string;
  "markahareket_model::model": string;
  description: string;
  "KATOLOG::Araç Grubu R90": string;
  "motor kw": string;
  "motor hp": string;
  "motor kodu": string;
  KBA: string;
  "crank_montaj açısı": string;
  "KATOLOG::grupId": string;
}
