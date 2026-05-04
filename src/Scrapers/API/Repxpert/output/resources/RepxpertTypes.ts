export type Target = {
  brandName: string;
  modelName: string;
  targetName: string;
  fullName: string;
  bodyType: string;
  constructionYearFrom: string;
  constructionYearTo: string;
  displacementCCM: number;
  enginePowerHP: number;
  enginePowerKW: number;
  engineCodes: string[] | string;
  kbaNumbers: string[] | string;
  engineType: string;
  cylinders: number;
  valves: number;
  driveType: string;
  externalID: string;
  referenceNumber: number;
  fuelMixtureFormation: string;
  fuelType: string;
  productsQuery: string;
  seoPath: string[] | string;
  type?: Type | string;
  uuid: string;
  [key: string]: any;
};

export interface Type {
  code: string;
  name: string;
  referenceCode: string;
  superType: SuperType;
}

export interface SuperType {
  code: string;
  name: string;
}

export type Model_Result = {
  brandName: string;
  modelName: string;
  uuid: string;
};

export type Manufacturer = {
  name: string;
  seoPath: string[] | string;
  uuid: string;
};
