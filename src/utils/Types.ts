
export type ProductReference = {
  yvNo: string;
  brand: string;
  crossNumber: string;
};


// API'den gelen genel uyumluluk nesnesi (manufacturer ve model için)
export type ApiCompatibility = {
  name: string;
  uuid: string;
};

// API'den gelen Target nesnesi
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
  name: string;
  fullName: string;
  constructionYearFrom: string;
  constructionYearTo: string;
  enginePowerKW: string;
  enginePowerHP: string;
  engineCodes: string[];
  kbaNumbers: string[];
  bodyType: string;
};

// Çıktı JSON'u için Model Series nesnesi
export type OutputModelSeries = {
  modelSeries: string; // Modelin adı (örn. "3 Series")
  targets: OutputTarget[]; // Bu modele ait hedefler
};

// Çıktı JSON'u için Manufacturer nesnesi
export type OutputManufacturer = {
  manufacturer: string; // Üreticinin adı (örn. "BMW")
  models: OutputModelSeries[]; // Bu üreticiye ait model serileri
};

// Genel çıktı yapısı
export type ProductCompatibilityResult = {
  yvNo: string;
  brand: string;
  crossNumber: string;
  compatibleVehicles: OutputManufacturer[];
};

export const referenceArray: ProductReference[] = [
  
  { yvNo: "24531201", brand: "ICER", crossNumber: "181828" },
 
];