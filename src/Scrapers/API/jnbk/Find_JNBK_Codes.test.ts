import { test, request, APIRequestContext } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { get_ORJ_NO_DATA_map } from "../../../io/utils/Reader_Utils";
import { JNBK } from "../repxpert/config/ApiData";
import * as cheerio from "cheerio";
import { delay } from "../repxpert/helpers/API_Helpers";
import pLimit from "p-limit";

dotenv.config({ path: path.resolve(".env") });

const PRODUCT_TYPE = process.env.PRODUCT_TYPE!;
const FILTER_BRAND = process.env.FILTER_BRAND!;
const THREAD_LIMIT = 4; // Aynı anda çalışacak istek sayısı

const limiter = pLimit(THREAD_LIMIT);


get_ORJ_NO_DATA_map()
  //new Map<string, Set<string>>().set("Deneme", new Set<string>(["2034210312", "MK374048", "4351212240"]))
  .forEach((value: Set<string>, yv: string) => {
    value.forEach((oe: string) => {
      test(`Find JNBK codes for ${oe} of ${yv}`, async () => {
        const apiContext = await request.newContext();
        const response = await apiContext.post(JNBK.BASE_URI, {
          headers: {
            referer: JNBK.BASE_URI
          },
          form: {
            txtPartNo: oe,
            txtClass: "1",
            btnProductSearch: "Search",
          },
        });

        const bodyText = await response.text(); // response.body() yerine
        const $ = cheerio.load(bodyText);

        await delay(400);

        const jnbkCode = $(".search-title").text().split("» ")[1] || "N/A";
        fs.promises.appendFile(
          path.resolve(__dirname, `../../../output/${PRODUCT_TYPE}/jsons/JNBK_CODES/JNBK_CODES_${PRODUCT_TYPE}.jsonl`),
          JSON.stringify({ yv, oe, jnbkCode }) + ",\n"
        )
      });
    });
  });
