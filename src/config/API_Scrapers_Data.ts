import path from "path";
import dotenv from "dotenv";
import { productGroupNumbersOfRepxpert, SUPPLIER_NUMBERS } from "../scrapers/api/resources/Variables";
import { usernameEnvKey } from "./SystemVariables";

dotenv.config({ path: path.resolve(".env") });

const generalInfo = {
  productType: process.env.PRODUCT_TYPE as string,
  filterBrand: process.env.FILTER_BRAND as string,
  vehicleType: ["passengerCar", "commercialVehicle"],
  BASE_URI: "https://www.repxpert.co.uk/api/Repxpert-GB/products/",
  crossNumbersPageSize: 100,
  crossNumbersCurrentPage: 0,
};

export const REPXPERT = {

  ...generalInfo,

  tokenRequest: {
    body: {
      grant_type: process.env.grant_type!,
      client_id: process.env.client_id!,
      client_secret: process.env.client_secret!,
      username: process.env?.[usernameEnvKey]!,
      password: process.env.password!,
    },

    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
    },

    URL: "https://api-aftermarket.schaeffler.de/authorizationserver/oauth/token",
  },

  crossNumbers_API_URL: (freeTextSearch: string) => {
    const params = {
      currentPage: `${generalInfo.crossNumbersCurrentPage}`,
      query: `${freeTextSearch}::assemblyGroups:${productGroupNumbersOfRepxpert[generalInfo.productType]}`,
      pageSize: `${generalInfo.crossNumbersPageSize}`,
    };
    return `${generalInfo.BASE_URI}search?${new URLSearchParams(params).toString()}`;
  },

  encryptedSearchCode_API_URL: (freeTextSearch: string, filterBrand: string) => {
    const params = {
      query: `${freeTextSearch}::brand:${SUPPLIER_NUMBERS[filterBrand]}::assemblyGroups:${productGroupNumbersOfRepxpert[generalInfo.productType]}`,
      pageSize: "20",
    };
    return `${generalInfo.BASE_URI}search?${new URLSearchParams(params).toString()}`;
  },

  OE_API_URL: (encryptedSearchCode: string) => `${generalInfo.BASE_URI}${encryptedSearchCode}/oenumbers`,

  manufacturers_API_URL: (encryptedSearchCode: string) => {
    const passengerCarURL = `${generalInfo.BASE_URI}${encryptedSearchCode}/linkages/manufacturers?targetTypeCodes=${generalInfo.vehicleType[0]}`;
    const commercialVehicleURL = `${generalInfo.BASE_URI}${encryptedSearchCode}/linkages/manufacturers?targetTypeCodes=${generalInfo.vehicleType[1]}`;
    return { passengerCarURL, commercialVehicleURL };
  },

  modelSeries_API_URL: (encryptedSearchCode: string, manufacturer_uuid: string) => {
    const passengerCarURL = `${generalInfo.BASE_URI}${encryptedSearchCode}/linkages/manufacturers/${manufacturer_uuid}/modelSeries?targetTypeCodes=${generalInfo.vehicleType[0]}`;
    const commercialVehicleURL = `${generalInfo.BASE_URI}${encryptedSearchCode}/linkages/manufacturers/${manufacturer_uuid}/modelSeries?targetTypeCodes=${generalInfo.vehicleType[1]}`;
    return { passengerCarURL, commercialVehicleURL };
  },

  targets_API_URL: (encryptedSearchCode: string, model_uuid: string) => {
    const passengerCarURL = `${generalInfo.BASE_URI}${encryptedSearchCode}/linkages/modelSeries/${model_uuid}/targets?targetTypeCodes=${generalInfo.vehicleType[0]}`;
    const commercialVehicleURL = `${generalInfo.BASE_URI}${encryptedSearchCode}/linkages/modelSeries/${model_uuid}/targets?targetTypeCodes=${generalInfo.vehicleType[1]}`;
    return { passengerCarURL, commercialVehicleURL };
  },

  articleAttributes_API_URL: (encryptedSearchCode: string) => `${generalInfo.BASE_URI}${encryptedSearchCode}`
};

export const JNBK = {
  BASE_URI: process.env.JNKB_BRAKES_URL as string,
}


export const KATALOG = {
  PRODUCT_GROUPS: {
    "BrakeDisc": 1,
    "BrakeDrum": 2,
    "BrakePad": 3,
    "BeltPulley": 5
  },

  PRODUCT_GROUPS_MAP: new Map([
    ["BrakeDisc", 1],
    ["BrakeDrum", 2],
    ["BrakePad", 3],
    ["BeltPulley", 5]
  ])
}