import path from "path";
import dotenv from "dotenv";
import { productGroupNumbersOfRepxpert, SUPPLIER_NUMBERS } from "../../../../utils/Variables";

dotenv.config({ path: path.resolve(".env") });

const generalInfo = {
  productType: process.env.PRODUCT_TYPE as string,
  filterBrand: process.env.FILTER_BRAND as string,
  vehicleType: "passengerCar",
  BASE_URI: "https://www.repxpert.co.uk/api/Repxpert-GB/products/",
  crossNumbersPageSize : 100,
  crossNumbersCurrentPage : 0,
};

export const REPXPERT = {

  ...generalInfo,

  tokenRequest: {
    requestBody: {
      grant_type: "password",
      client_id: "repxpert-spa",
      client_secret: process.env.client_secret!,
      username: process.env.username!,
      password: process.env.password!,
    },

    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },

    URL: "https://api-aftermarket.schaeffler.de/authorizationserver/oauth/token?catalogCountry=GB",
  },

  getCrossNumbersURL: (freeTextSearch: string) => {
    const params = {
      currentPage: `${generalInfo.crossNumbersCurrentPage}`,
      query: `${freeTextSearch}::assemblyGroups:${productGroupNumbersOfRepxpert[generalInfo.productType]}`,
      pageSize: `${generalInfo.crossNumbersPageSize}`,
    };
    return `${generalInfo.BASE_URI}search?${new URLSearchParams(params).toString()}`;
  },

  getEncrSrcURL: (freeTextSearch: string, filterBrand: string) => {
    return (
      generalInfo.BASE_URI +
      "search?query=" +
      freeTextSearch +
      "::brand:" +
      SUPPLIER_NUMBERS[filterBrand] +
      "assemblyGroups:" +
      productGroupNumbersOfRepxpert[generalInfo.productType] +
      "&pageSize=20"
    );
  },

  getOE_URL: (encryptedSearchCode: string) => {
    return generalInfo.BASE_URI + encryptedSearchCode + "/oenumbers?lang=en_GB&curr=RXP&catalogCountry=GB"
  },

  getManufacturersURL: (encryptedSearchCode: string) => {
    return (
      generalInfo.BASE_URI  +
      encryptedSearchCode +
      "/linkages/manufacturers?targetTypeCodes=" +
      generalInfo.vehicleType
    );
  },

  getModelSeriesURL: (
    encryptedSearchCode: string,
    manufacturer_uuid: string
  ) => {
    return (
      generalInfo.BASE_URI +
      encryptedSearchCode +
      "/linkages/manufacturers/" +
      manufacturer_uuid +
      "/modelSeries?targetTypeCodes=" +
      generalInfo.vehicleType
    );
  },


  getTargetsURL: (encryptedSearchCode: string, model_uuid: string) => {
    return (
      generalInfo.BASE_URI +
      encryptedSearchCode +
      "/linkages/modelSeries/" +
      model_uuid +
      "/targets?targetTypeCodes=" +
      generalInfo.vehicleType
    );
  },
};
