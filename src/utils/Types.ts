
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

  // { yvNo: "13047", brand: "BREMBO", crossNumber: "08.1299.10"},
  // { yvNo: "24262", brand: "BREMBO", crossNumber: "09.9362.11"},
  // { yvNo: "24521", brand: "BREMBO", crossNumber: "09.A613.40"},
  // { yvNo: "52523", brand: "BREMBO", crossNumber: "09.9173.14"},
  // { yvNo: "34575", brand: "BREMBO", crossNumber: "09.B627.10"},
  // { yvNo: "24626CS", brand: "BREMBO", crossNumber: "09.7960.11"},
  // { yvNo: "25733", brand: "BREMBO", crossNumber: "09.A637.20"},
  // { yvNo: "36920", brand: "BREMBO", crossNumber: "09.A062.11"},
  // { yvNo: "36920", brand: "BREMBO", crossNumber: "09.A063.11"},
  // { yvNo: "55942C", brand: "BREMBO", crossNumber: "09.N236.11"},
  // { yvNo: "36460CS", brand: "BREMBO", crossNumber: "09.9868.11" },
  // { yvNo: "341532", brand: "BREMBO", crossNumber: "09.C066.10" },
  // { yvNo: "151536", brand: "BREMBO", crossNumber: "09.E236.11" },
  // 
  // { yvNo: "601518", brand: "BREMBO", crossNumber: "09.A562.10" },
  { yvNo: "20002201", brand: "BREMBO", crossNumber: "3250077" },
  { yvNo: "20011401", brand: "BREMBO", crossNumber: "0060713601" },
  { yvNo: "20073401", brand: "BREMBO", crossNumber: "SE127165005A" },
  { yvNo: "20168401", brand: "BREMBO", crossNumber: "357698151A" },
  { yvNo: "20168409", brand: "BREMBO", crossNumber: "357698151B" },
  { yvNo: "20217401", brand: "BREMBO", crossNumber: "107856041" },
  { yvNo: "20336201", brand: "BREMBO", crossNumber: "7701602289" },
  { yvNo: "20341401", brand: "BREMBO", crossNumber: "0004205920" },
  { yvNo: "20392401", brand: "BREMBO", crossNumber: "0004206320" },
  { yvNo: "20494201", brand: "BREMBO", crossNumber: "9938109" },
  { yvNo: "20510201", brand: "BREMBO", crossNumber: "4050050000" },
  { yvNo: "20574401", brand: "BREMBO", crossNumber: "321698151" },
  { yvNo: "20581401", brand: "BREMBO", crossNumber: "LR110084" },
  { yvNo: "20634401", brand: "BREMBO", crossNumber: "7701202227" },
  { yvNo: "20660401", brand: "BREMBO", crossNumber: "21213501090" },
  { yvNo: "20687401", brand: "BREMBO", crossNumber: "0004209820" },
  { yvNo: "20747401", brand: "BREMBO", crossNumber: "9074208101" },
  { yvNo: "20764208", brand: "BREMBO", crossNumber: "1635254980" },
  { yvNo: "20775401", brand: "BREMBO", crossNumber: "0000000793325" },
  { yvNo: "20838401", brand: "BREMBO", crossNumber: "5888147" },
  { yvNo: "20870401", brand: "BREMBO", crossNumber: "94840677" },
  { yvNo: "20887201", brand: "BREMBO", crossNumber: "867698151" },
  { yvNo: "20906201", brand: "BREMBO", crossNumber: "425137" },
  { yvNo: "20906207", brand: "BREMBO", crossNumber: "425102" },
  { yvNo: "20939401", brand: "BREMBO", crossNumber: "90398759" },
  { yvNo: "20941401", brand: "BREMBO", crossNumber: "0004200720" },
  { yvNo: "20950401", brand: "BREMBO", crossNumber: "5951671" },
  { yvNo: "20959201", brand: "BREMBO", crossNumber: "06450S3Y010" },
  { yvNo: "20968201", brand: "BREMBO", crossNumber: "34111157039" },
  { yvNo: "20974401", brand: "BREMBO", crossNumber: "1617247980" },
  { yvNo: "20995201", brand: "BREMBO", crossNumber: "34211157044" },
  { yvNo: "21012201", brand: "BREMBO", crossNumber: "5810132300" },
  { yvNo: "21035401", brand: "BREMBO", crossNumber: "0004205720" },
  { yvNo: "21055401", brand: "BREMBO", crossNumber: "0004208920" },
  { yvNo: "21056401", brand: "BREMBO", crossNumber: "291698151" },
  { yvNo: "21105103", brand: "BREMBO", crossNumber: "5888781" },
  { yvNo: "21140401", brand: "BREMBO", crossNumber: "93225005" },
  { yvNo: "21158401", brand: "BREMBO", crossNumber: "AY040TY008" },
  { yvNo: "21171401", brand: "BREMBO", crossNumber: "1015598" },
  { yvNo: "21179205", brand: "BREMBO", crossNumber: "425090" },
  { yvNo: "21193201", brand: "BREMBO", crossNumber: "ZBC698151A" },
  { yvNo: "21197401", brand: "BREMBO", crossNumber: "0014200220" },
  { yvNo: "21201201", brand: "BREMBO", crossNumber: "11046152" },
  { yvNo: "21210204", brand: "BREMBO", crossNumber: "1611458780" },
  { yvNo: "21278401", brand: "BREMBO", crossNumber: "1611456880" },
  { yvNo: "21303401", brand: "BREMBO", crossNumber: "0024200420" },
  { yvNo: "21305401", brand: "BREMBO", crossNumber: "05143633AA" },
  { yvNo: "21312201", brand: "BREMBO", crossNumber: "06022SP8000" },
  { yvNo: "21347201", brand: "BREMBO", crossNumber: "4100010G08" },
  { yvNo: "21353201", brand: "BREMBO", crossNumber: "92100964" },
  { yvNo: "21355201", brand: "BREMBO", crossNumber: "E8BZ2001A" },
  { yvNo: "21365401", brand: "BREMBO", crossNumber: "46565733" },
  { yvNo: "21366204", brand: "BREMBO", crossNumber: "357698151C" },
  { yvNo: "21370408", brand: "BREMBO", crossNumber: "425387" },
  { yvNo: "21373201", brand: "BREMBO", crossNumber: "DBP511111" },
  { yvNo: "21388204", brand: "BREMBO", crossNumber: "32321800" },
  { yvNo: "21421201", brand: "BREMBO", crossNumber: "34206888825" },
  { yvNo: "21432204", brand: "BREMBO", crossNumber: "1617252380" },
  { yvNo: "21436406", brand: "BREMBO", crossNumber: "5892736" },
  { yvNo: "21439401", brand: "BREMBO", crossNumber: "0024202120" },
  { yvNo: "21463401", brand: "BREMBO", crossNumber: "6025071042" },
  { yvNo: "21469401", brand: "BREMBO", crossNumber: "5028764" },
  { yvNo: "21470401", brand: "BREMBO", crossNumber: "5028763" },
  { yvNo: "21471401", brand: "BREMBO", crossNumber: "34111161975" },
  { yvNo: "21479203", brand: "BREMBO", crossNumber: "7D0698151B" },
  { yvNo: "21481401", brand: "BREMBO", crossNumber: "1203933" },
  { yvNo: "21486201", brand: "BREMBO", crossNumber: "34111163227" },
  { yvNo: "21487201", brand: "BREMBO", crossNumber: "34213403241" },
  { yvNo: "21515201", brand: "BREMBO", crossNumber: "45022S6DE01" },
  { yvNo: "21515401", brand: "BREMBO", crossNumber: "SFP100360" },
  { yvNo: "21539201", brand: "BREMBO", crossNumber: "F1CZ2001B" },
  { yvNo: "21545401", brand: "BREMBO", crossNumber: "440603F025" },
  { yvNo: "21546401", brand: "BREMBO", crossNumber: "410602F025" },
  { yvNo: "21553201", brand: "BREMBO", crossNumber: "583022CA00" },
  { yvNo: "21562201", brand: "BREMBO", crossNumber: "410602Y091" },
  { yvNo: "21576201", brand: "BREMBO", crossNumber: "2D0698151" },
  { yvNo: "21576206", brand: "BREMBO", crossNumber: "2D0698151" },
  { yvNo: "21601201", brand: "BREMBO", crossNumber: "94855746" },
  { yvNo: "21621201", brand: "BREMBO", crossNumber: "0024203820" },
  { yvNo: "21626401", brand: "BREMBO", crossNumber: "410601F025" },
  { yvNo: "21631206", brand: "BREMBO", crossNumber: "1617251980" },
  { yvNo: "21654208", brand: "BREMBO", crossNumber: "F1CZ2001A" },
  { yvNo: "21662401", brand: "BREMBO", crossNumber: "115430261" },
  { yvNo: "21664201", brand: "BREMBO", crossNumber: "0024204420" },
  { yvNo: "21670201", brand: "BREMBO", crossNumber: "00K05139218AB" },
  { yvNo: "21674205", brand: "BREMBO", crossNumber: "1617254180" },
  { yvNo: "21677201", brand: "BREMBO", crossNumber: "34111163387" },
  { yvNo: "21679101", brand: "BREMBO", crossNumber: "J0446535040" },
  { yvNo: "21691201", brand: "BREMBO", crossNumber: "34211163395" },
  { yvNo: "21694201", brand: "BREMBO", crossNumber: "45022S7A000" },
  { yvNo: "21697201", brand: "BREMBO", crossNumber: "06450S2G000" },
  { yvNo: "21719201", brand: "BREMBO", crossNumber: "43022SY8A02" },
  { yvNo: "21724205", brand: "BREMBO", crossNumber: "425131" },
  { yvNo: "21725201", brand: "BREMBO", crossNumber: "4813005010" },
  { yvNo: "21738201", brand: "BREMBO", crossNumber: "43022504000" },
  { yvNo: "21797204", brand: "BREMBO", crossNumber: "1611458080" },
  { yvNo: "21827201", brand: "BREMBO", crossNumber: "1611458480" },
  { yvNo: "21857201", brand: "BREMBO", crossNumber: "172066" },
  { yvNo: "21866201", brand: "BREMBO", crossNumber: "1H0698151A" },
  { yvNo: "21868203", brand: "BREMBO", crossNumber: "6Q0698151B" },
  { yvNo: "21883201", brand: "BREMBO", crossNumber: "7D0698151" },
  { yvNo: "21885203", brand: "BREMBO", crossNumber: "7D0698151D" },
  { yvNo: "21886201", brand: "BREMBO", crossNumber: "1H0698151B" },
  { yvNo: "21898201", brand: "BREMBO", crossNumber: "0024205220" },
  { yvNo: "21900401", brand: "BREMBO", crossNumber: "0024205120" },
  { yvNo: "21904204", brand: "BREMBO", crossNumber: "425081" },
  { yvNo: "21919401", brand: "BREMBO", crossNumber: "05126300AA" },
  { yvNo: "21920408", brand: "BREMBO", crossNumber: "128410517" },
  { yvNo: "21927201", brand: "BREMBO", crossNumber: "71752986" },
  { yvNo: "21927203", brand: "BREMBO", crossNumber: "71753041" },
  { yvNo: "21930203", brand: "BREMBO", crossNumber: "9947118" },
  { yvNo: "21934201", brand: "BREMBO", crossNumber: "34211160533" },
  { yvNo: "21938104", brand: "BREMBO", crossNumber: "4B0615116" },
  { yvNo: "21938408", brand: "BREMBO", crossNumber: "4605A658" },
  { yvNo: "21945204", brand: "BREMBO", crossNumber: "8E0615115B" },
  { yvNo: "21945401", brand: "BREMBO", crossNumber: "8E0698151" },
  { yvNo: "21961408", brand: "BREMBO", crossNumber: "AY040TY037" },
  { yvNo: "21975201", brand: "BREMBO", crossNumber: "0446505020" },
  { yvNo: "21980201", brand: "BREMBO", crossNumber: "4106000Q0A" },
  { yvNo: "21998201", brand: "BREMBO", crossNumber: "0001431V0030000" },
  { yvNo: "22031201", brand: "BREMBO", crossNumber: "0004208700" },
  { yvNo: "22034406", brand: "BREMBO", crossNumber: "1824121" },
  { yvNo: "22035203", brand: "BREMBO", crossNumber: "5Q0698151C" },
  { yvNo: "22041204", brand: "BREMBO", crossNumber: "1612434180" },
  { yvNo: "22061401", brand: "BREMBO", crossNumber: "0004206700" },
  { yvNo: "22062401", brand: "BREMBO", crossNumber: "4474200020" },
  { yvNo: "22065408", brand: "BREMBO", crossNumber: "D10604BT0C" },
  { yvNo: "22076201", brand: "BREMBO", crossNumber: "0004209300" },
  { yvNo: "22087401", brand: "BREMBO", crossNumber: "0006000620046" },
  { yvNo: "22101401", brand: "BREMBO", crossNumber: "4474200120" },
  { yvNo: "22103401", brand: "BREMBO", crossNumber: "MQ005265" },
  { yvNo: "22117201", brand: "BREMBO", crossNumber: "D10603WU0A" },
  { yvNo: "22123208", brand: "BREMBO", crossNumber: "1605281" },
  { yvNo: "22129201", brand: "BREMBO", crossNumber: "13454674" },
  { yvNo: "22139201", brand: "BREMBO", crossNumber: "23001397" },
  { yvNo: "22141201", brand: "BREMBO", crossNumber: "J9C14009" },
  { yvNo: "22143208", brand: "BREMBO", crossNumber: "1605280" },
  { yvNo: "22146201", brand: "BREMBO", crossNumber: "C2C41984" },
  { yvNo: "22147408", brand: "BREMBO", crossNumber: "65508206000" },
  { yvNo: "22165201", brand: "BREMBO", crossNumber: "77369311" },
  { yvNo: "22178408", brand: "BREMBO", crossNumber: "65508206001" },
  { yvNo: "22187201", brand: "BREMBO", crossNumber: "34106874034" },
  { yvNo: "22220101", brand: "BREMBO", crossNumber: "1605285" },
  { yvNo: "22227208", brand: "BREMBO", crossNumber: "58101H6A15" },
  { yvNo: "22231201", brand: "BREMBO", crossNumber: "5181858" },
  { yvNo: "22235201", brand: "BREMBO", crossNumber: "D0Y13328ZA" },
  { yvNo: "22302201", brand: "BREMBO", crossNumber: "J9C20036" },
  { yvNo: "22307401", brand: "BREMBO", crossNumber: "4KE698451A" },
  { yvNo: "22308201", brand: "BREMBO", crossNumber: "4N0698451" },
  { yvNo: "22317201", brand: "BREMBO", crossNumber: "31445975" },
  { yvNo: "22329208", brand: "BREMBO", crossNumber: "58101D3A00" },
  { yvNo: "22342208", brand: "BREMBO", crossNumber: "13478300" },
  { yvNo: "22344401", brand: "BREMBO", crossNumber: "34106860020" },
  { yvNo: "22345208", brand: "BREMBO", crossNumber: "13478301" },
  { yvNo: "22347401", brand: "BREMBO", crossNumber: "410606124R" },
  { yvNo: "22383203", brand: "BREMBO", crossNumber: "8W0698151AA" },
  { yvNo: "22397201", brand: "BREMBO", crossNumber: "6832998AA" },
  { yvNo: "22402101", brand: "BREMBO", crossNumber: "4K0698151AB" },
  { yvNo: "22421201", brand: "BREMBO", crossNumber: "5810159A00" },
  { yvNo: "22425401", brand: "BREMBO", crossNumber: "34116872750" },
  { yvNo: "22429201", brand: "BREMBO", crossNumber: "43022TJBA02" },
  { yvNo: "22434401", brand: "BREMBO", crossNumber: "044660E060" },
  { yvNo: "22437201", brand: "BREMBO", crossNumber: "0004206000" },
  { yvNo: "22439201", brand: "BREMBO", crossNumber: "D10304JA0A" },
  { yvNo: "22449201", brand: "BREMBO", crossNumber: "77367717" },
  { yvNo: "22468401", brand: "BREMBO", crossNumber: "9V0698451K" },
  { yvNo: "22469401", brand: "BREMBO", crossNumber: "95B698151AA" },
  { yvNo: "22485201", brand: "BREMBO", crossNumber: "J9C21385" },
  { yvNo: "22518201", brand: "BREMBO", crossNumber: "58101F2A00" },
  { yvNo: "22525201", brand: "BREMBO", crossNumber: "410605536R" },
  { yvNo: "22531201", brand: "BREMBO", crossNumber: "2110582" },
  { yvNo: "22588201", brand: "BREMBO", crossNumber: "1617936880" },
  { yvNo: "22593201", brand: "BREMBO", crossNumber: "1613260780" },
  { yvNo: "22610401", brand: "BREMBO", crossNumber: "410603407R" },
  { yvNo: "22618401", brand: "BREMBO", crossNumber: "34106883510" },
  { yvNo: "22631201", brand: "BREMBO", crossNumber: "2Q0698151B" },
  { yvNo: "22664408", brand: "BREMBO", crossNumber: "2H6698151" },
  { yvNo: "22675201", brand: "BREMBO", crossNumber: "58302G4A30" },
  // ...continue for all other lines in the same format...
];