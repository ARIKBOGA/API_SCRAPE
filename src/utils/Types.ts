
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
  
  
  { yvNo: "30220", brand: "BREMBO", crossNumber: "09.9078.10" },
  { yvNo: "27219", brand: "BREMBO", crossNumber: "09.7629.10" },
  { yvNo: "27064", brand: "BREMBO", crossNumber: "09.5527.24" },
  { yvNo: "49308", brand: "BREMBO", crossNumber: "08.A268.10" },
  { yvNo: "24303", brand: "BREMBO", crossNumber: "09.9508.14" },
  { yvNo: "24305", brand: "BREMBO", crossNumber: "08.9509.14" },
  { yvNo: "13357", brand: "BREMBO", crossNumber: "08.A029.20" },
  { yvNo: "16358", brand: "BREMBO", crossNumber: "09.9574.20" },
  { yvNo: "24303", brand: "BREMBO", crossNumber: "09.A895.11" },
  { yvNo: "24304", brand: "BREMBO", crossNumber: "09.9510.14" }
];