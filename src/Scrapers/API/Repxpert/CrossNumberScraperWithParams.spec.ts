import { test } from "@playwright/test";
import { getAuthHeaders } from "./helpers/API_Helpers";


test("Get All Cross numbers from repxpert with global text search by filters in params", async ({ request }) => {
  const baseURI = "https://www.repxpert.co.uk/api/Repxpert-GB/products/search";
  const pageSize = 100;
  const queryText = "4B0698151AC";
  const groupNumber = 402092;

  

  let currentPage = 0;
  let totalPages = 1;
  do {
    const params = {
      currentPage: `${currentPage}`,
      query: `${queryText}::assemblyGroups:${groupNumber}`,
      pageSize: `${pageSize}`,
    };

    const URL = `${baseURI}?${new URLSearchParams(params).toString()}`;

    const response = await request.get(URL, {
      headers: await getAuthHeaders(),
    });

    const data = await response.json();
    totalPages = data.pagination.totalPages;

    console.log(`Page ${currentPage} → ${data.products.length} ürün`);
    currentPage++;

  } while (currentPage < totalPages);

});
