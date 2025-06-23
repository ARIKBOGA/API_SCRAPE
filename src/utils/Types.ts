
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
  cc: string;
  engineCodes: string[];
  kbaNumbers: string[];
  bodyType: string;
  TecDocID?: number;
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

// JSON dosyanızın kök yapısı bir ProductCompatibilityResult dizisi olduğu için
// ana Excel dönüştürme fonksiyonunuzun bekleyeceği tip budur:
export type RootJsonData = ProductCompatibilityResult[];

export const referenceArray: ProductReference[] = [
  
  
  { yvNo: "30220", brand: "BREMBO", crossNumber: "09.9078.10" },
  { yvNo: "27219", brand: "BREMBO", crossNumber: "09.7629.10" }

];