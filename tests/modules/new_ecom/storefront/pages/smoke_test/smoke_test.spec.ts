import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { ProducDetailV3 } from "@pages/new_ecom/storefront/product_page";
import { SFCartv3 } from "@pages/storefront/cart";
import { HomePageV3 } from "@pages/new_ecom/storefront/home_page_sf";

test.describe(" [Smoke test] Verify  full luồng add to cart 1 product ", () => {
  let homePage: HomePageV3, checkout: SFCheckout, productPage: ProducDetailV3, cart: SFCartv3;

  test(`@SB_SKT_01 [Smoke test] Verify  full luồng add to cart 1 product`, async ({ page, conf, snapshotFixture }) => {
    const domain = conf.suiteConf.domain;
    homePage = new HomePageV3(page, domain);
    productPage = new ProducDetailV3(page, domain);
    cart = new SFCartv3(page, domain);
    checkout = new SFCheckout(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`1. Go to home page ngoài SF của store`, async () => {
      await homePage.gotoHomePage();
      await expect(homePage.genLoc(homePage.xpathIconSearch)).toBeVisible();
    });

    await test.step(`2. Click icon search, input name product, enter`, async () => {
      await homePage.searchProduct(caseConf.product_name);
      await expect(homePage.genLoc(homePage.xpathProductItemProductCard(caseConf.product_name))).toBeVisible();
    });

    await test.step(`3.Click chọn vào product A`, async () => {
      await homePage.clickProductCardName(caseConf.product_name);

      await expect(productPage.genLoc(productPage.xpathVariantPicker)).toBeVisible();
      await expect(productPage.genLoc(productPage.xpathBlockQuantity)).toBeVisible();
      await expect(productPage.genLoc(productPage.xpathBtnATC)).toBeVisible();
      await expect(productPage.genLoc(productPage.xpathBtnBuyNow)).toBeVisible();
      await expect(productPage.genLoc(productPage.xpathBlockGallery)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productPage.xpathBlockGallery,
        snapshotName: `product-detail-block-gallery-${process.env.ENV}.png`,
      });
    });

    await test.step(`4. Chọn varaint và click Add to cart `, async () => {
      await productPage.selectVariantByTitle(caseConf.variants);
      await productPage.clickBtnATC();
      await productPage.page.waitForSelector(productPage.xpathCartDrawer);

      await expect(cart.genLoc(productPage.xpathCartDrawer)).toContainText(caseConf.product_name);
      await expect(cart.genLoc(productPage.xpathCartDrawer)).toContainText(caseConf.product_variant);
      await expect(cart.genLoc(productPage.xpathCartDrawer)).toContainText(caseConf.product_variant_pricing);
      const productInCartQuantity = await cart.getProductInCartQuantityv3(caseConf.product_name);
      await expect(productInCartQuantity).toEqual(caseConf.product_quantity);
    });

    await test.step(`5. Go to cart page`, async () => {
      await productPage.gotoCart();
      await productPage.page.waitForSelector(cart.xpathProductsInCartv3);

      await expect(cart.productsInCartv3()).toContainText(caseConf.product_name);
      await expect(cart.productsInCartv3()).toContainText(caseConf.product_variant);
      await expect(cart.productsInCartv3()).toContainText(caseConf.product_variant_pricing);
      const productInCartQuantity = await cart.getProductInCartQuantityv3(caseConf.product_name);
      await expect(productInCartQuantity).toEqual(caseConf.product_quantity);
    });

    await test.step(`6. Go to product A, chọn variant và  Click button Buy now`, async () => {
      await homePage.gotoProduct(caseConf.product_handle);
      await productPage.selectVariantByTitle(caseConf.step6.variants);
      await productPage.clickBtnBuyNow();
      await productPage.page.waitForSelector(checkout.xpathCheckOutContent);

      await expect(checkout.orderSummaryBlock).toBeVisible();
      await expect(checkout.genLoc(cart.xpathProductsInOder)).toContainText(caseConf.step6.product_variant);
      await expect(checkout.genLoc(cart.xpathProductsInOder)).toContainText(caseConf.step6.product_variant_pricing);
      const productInOrderQuantity = await cart.getVariantInOrderQuantityv3(caseConf.step6.product_variant);
      await expect(productInOrderQuantity).toEqual(caseConf.step6.product_quantity);
    });
  });
});
