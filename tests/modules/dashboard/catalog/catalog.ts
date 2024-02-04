import { expect } from "@playwright/test";
import type { ShowProducts, CatalogProductItem } from "@types";

/*
 Capitalize the first character of all words
 */
export const capitalizeWords = (str: string): string => {
  const splitStr = str.toLowerCase().split(" ");
  for (let i = 0; i < splitStr.length; i++) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(" ");
};

/*
 Verify show product on catalog dashboard
 */
export const verifyShowProducts = async (args: ShowProducts): Promise<void> => {
  const firstProduct = args.offset ? args.offset : 0;
  const lastProduct = args.limit ? args.limit + firstProduct : args.products.length;

  for (let i = firstProduct; i < lastProduct; i++) {
    const selector = args.parentSelector
      ? args.parentSelector + ` .product__name >> nth=${i - firstProduct}`
      : `.product__name >> nth=${i - firstProduct}`;

    const productName = await args.page.locator(selector).textContent();
    expect(productName.trim()).toEqual(args.products[i].name);
  }
};

/*
 Check account test or account merchant
 */
export const checkAccountTest = (userName: string) => {
  return !!(userName.includes("beeketing") || userName.includes("brodev"));
};

/**
 Verify data of collection after select sort option
 * @param data is data used to verify (src/pages/api/plusbase/product.ts - getCatalogProducts)
 * @returns void
 */
export const verifyDataAfterSorting = async (data: CatalogProductItem[], sortType: string): Promise<void> => {
  if (data.length > 1) {
    for (let index = 0; index < data.length; index++) {
      if (index + 1 == data.length) {
        break;
      }

      switch (sortType) {
        case "Product cost: low to high":
          expect(data[index].min_base_cost).toBeLessThanOrEqual(data[index + 1].min_base_cost);
          break;
        case "Product cost: high to low":
          expect(data[index].min_base_cost).toBeGreaterThanOrEqual(data[index + 1].min_base_cost);
          break;
        case "Most views":
          expect(data[index].total_view).toBeGreaterThanOrEqual(data[index + 1].total_view);
          break;
      }
    }
  }
};
