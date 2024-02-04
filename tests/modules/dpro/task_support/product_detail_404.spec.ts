import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { ProductCard } from "@pages/dashboard/product_card";

test.describe("task support Product page ", () => {
  let storefrontPage: SFHome, productPage: SFProduct, productCard: ProductCard;

  test(`@SB_SP_01 Test task support Product page hoạt động không ổn định trendtee20.onshopbase.com`, async ({
    page,
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    const domain = conf.suiteConf.domain;
    storefrontPage = new SFHome(page, domain);
    productCard = new ProductCard(page, domain);
    productPage = new SFProduct(page, domain);

    await test.step(`Vào trang all collections >  click collection detail > click product card`, async () => {
      await storefrontPage.goto("/collections");
      await storefrontPage
        .genLoc(productCard.xpathPC.collectionName(caseConf.data_all_colletions.collection_name))
        .click();
      await storefrontPage.page.locator("#v-progressbar").waitFor({ state: "detached" });

      await productCard.clickFirstProductCardName();
      await expect(productPage.page.locator(productCard.productTitleInProductPage)).toBeVisible();
    });

    await test.step(`Vào trang all collection detail > click product card`, async () => {
      for (const dataCollection of caseConf.data_collections) {
        await storefrontPage.goto(dataCollection.collection_handle);
        await storefrontPage.page.locator("#v-progressbar").waitFor({ state: "detached" });

        await productCard.clickFirstProductCardName();
        await expect(productPage.page.locator(productCard.productTitleInProductPage)).toBeVisible();
      }
    });

    await test.step(`Vào trang Home > all collection detail > click product card`, async () => {
      for (const dataHome of caseConf.data_home) {
        await storefrontPage.gotoHomePage();
        await storefrontPage.genLoc(productCard.xpathPC.btnSeeCollection(dataHome.index)).scrollIntoViewIfNeeded();
        await storefrontPage.genLoc(productCard.xpathPC.btnSeeCollection(dataHome.index)).click();
        await storefrontPage.page.locator("#v-progressbar").waitFor({ state: "detached" });

        await productCard.clickFirstProductCardName();
        await expect(productPage.page.locator(productCard.productTitleInProductPage)).toBeVisible();
      }
    });
  });
});
