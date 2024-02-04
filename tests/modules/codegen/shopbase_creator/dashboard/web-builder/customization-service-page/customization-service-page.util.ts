import { APIRequestContext, expect, Page } from "@playwright/test";
import type { FixtureToken } from "@types";
import { SearchProductResp } from "./customization-service-page";

export type ShopInfo = {
  domain: string;
  email: string;
  password: string;
};

export const openPageSelector = async (page: Page, token: FixtureToken, shopInfo: ShopInfo) => {
  const credentialResponse = await token.getWithCredentials({
    domain: shopInfo.domain,
    username: shopInfo.email,
    password: shopInfo.password,
  });

  const accessToken = credentialResponse.access_token;

  // Go to design menu
  await page.goto(`https://${shopInfo.domain}/admin/themes?x_key=${accessToken}`);

  // Click web builder
  await page.getByRole("button", { name: "Customize" }).first().click();

  // Click page selector
  await page.locator('button[name="Pages"]').click();
};

export const isContainCustomizationServicePage = async (page: Page, selector: string) => {
  const locators = await page.locator(selector).all();

  for (const locator of locators) {
    const text = await locator.textContent();
    if (text.trim() === "Customization service") {
      return true;
    }
  }

  return false;
};

export const getProductHandle = async (authRequest: APIRequestContext, productName: string) => {
  const rawSearchProductResp = await authRequest.get(
    `https://au-creator-wb-page-cus-service.myshopbase.net/admin/digital-products/product.json?title=${encodeURI(
      productName,
    )}&title_mode=&product_type=&published_status=&member=&member_mode=&limit=50&page=1`,
  );
  expect(rawSearchProductResp.status()).toEqual(200);
  const searchProductResp = (await rawSearchProductResp.json()) as SearchProductResp;

  expect(searchProductResp.data.length).toEqual(1);

  return searchProductResp.data[0].handle;
};
