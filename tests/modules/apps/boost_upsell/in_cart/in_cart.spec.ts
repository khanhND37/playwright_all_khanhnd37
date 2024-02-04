import { expect } from "@core/fixtures";
import { test } from "@fixtures/upsell_offers";
import { SFHome } from "@pages/storefront/homepage";
import { SFCart } from "@pages/storefront/cart";
import { SFProduct } from "@pages/storefront/product";
import { InCartPageDB, InCartPageSF } from "@pages/dashboard/upsell_in_cart";
import { SFCheckout } from "@sf_pages/checkout";
import { AppsAPI } from "@pages/api/apps";
import { ProductAPI } from "@pages/api/product";

test.describe(" In cart theme inside", async () => {
  let homepage: SFHome,
    productDetail: SFProduct,
    cart: SFCart,
    inCartDB: InCartPageDB,
    inCartSF: InCartPageSF,
    checkoutPage: SFCheckout,
    appsAPI: AppsAPI,
    productAPI: ProductAPI,
    caseConf,
    suiteConf,
    domain;

  test.beforeEach(async ({ conf, dashboard, page, authRequest }) => {
    caseConf = conf.caseConf;
    suiteConf = conf.suiteConf;
    domain = suiteConf.domain;
    homepage = new SFHome(page, conf.suiteConf.domain);
    productDetail = new SFProduct(page, conf.suiteConf.domain);
    cart = new SFCart(page, conf.suiteConf.domain);
    inCartDB = new InCartPageDB(dashboard, conf.suiteConf.domain);
    appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
    inCartSF = new InCartPageSF(page, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);

    await test.step("Pre-condition: Delete offer", async () => {
      const offers = await appsAPI.getListUpsellOffers({
        offer_types: "in-cart",
      });

      const offerByNames = offers.filter(offer => offer.offer_name === "Offer incart").map(offer => offer.id);
      if (offerByNames.length) {
        await appsAPI.deleteAllUpsellOffers(offerByNames);
      }
    });
  });

  test(`@SB_BUS_ICO_11 In-cart - Check hiện thị offer ngoài sf khi inactive offer`, async ({
    page,
    snapshotFixture,
    dashboard,
  }) => {
    await test.step(`Precondition: Trong dashboard, active offer 1`, async () => {
      await dashboard.goto(`https://${domain}/admin/apps/boost-upsell/up-sell/list`);
      await inCartDB.activeOffer(caseConf.offer_name);
    });

    await test.step(`Ngoài SF, add product A vào cart`, async () => {
      await homepage.gotoProduct(caseConf.target_product_handle);
      await productDetail.addToCart();
      await productDetail.page.waitForSelector(cart.xpathCartContent);
    });

    await test.step(`Mở cart page`, async () => {
      await productDetail.gotoCart();
      await expect(cart.productsInCart()).toContainText(caseConf.target_product);
      await expect(cart.inCartOfferRecommendedProduct(caseConf.recommended_product)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: cart.xpathCartOffer,
        snapshotName: "case_11_offer_in_cart_sf.png",
      });
    });

    await test.step(`Trong dashboard, inactive offer 1`, async () => {
      await inCartDB.inactiveOffer(caseConf.offer_name);
      const status = await inCartDB.genLoc(inCartDB.getStatusOfferXpath(caseConf.offer_name)).textContent();
      expect(status).toEqual("Inactive");
    });

    await test.step(`Mở cart page ngoài SF`, async () => {
      await cart.page.reload({ waitUntil: "networkidle" });
      await expect(cart.genLoc(cart.xpathCartOffer)).toBeHidden();
    });
  });

  test(`@SB_BUS_ICO_10 In cart - Check hiển thị quick view khi recommend product không có custom option và variant`, async ({
    page,
    snapshotFixture,
  }) => {
    await test.step(`Ngoài SF, add product A vào cart.`, async () => {
      await homepage.gotoProduct(caseConf.target_product_handle);
      await productDetail.addToCart();
      await productDetail.page.waitForSelector(cart.xpathCartContent);
    });

    await test.step(`Mở cart page`, async () => {
      await productDetail.gotoCart();
      await expect(cart.productsInCart()).toContainText(caseConf.target_product);
      await expect(cart.inCartOfferRecommendedProduct(caseConf.recommended_product)).toBeVisible();
    });

    await test.step(`Click vào image/product name`, async () => {
      await cart.inCartOfferRecommendedProduct(caseConf.recommended_product).click();
      await expect(cart.genLoc(cart.selectorUpsellPopup)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: cart.selectorUpsellPopup,
        snapshotName: "case_10_popup_offer_in_cart_sf.png",
      });
    });

    await test.step(`Đóng popup quick view`, async () => {
      await cart.genLoc(cart.selectorClosePopup).click();
    });

    await test.step(`Click button Add ở product B`, async () => {
      await cart.genLoc(cart.xpathInCartOfferBtnAdd).click();
      await expect(cart.genLoc(cart.selectorUpsellPopup)).toBeHidden();
      await expect(cart.inCartOfferRecommendedProduct(caseConf.recommended_product)).toBeHidden();
      await expect(cart.productsInCart()).toContainText(caseConf.recommended_product);
    });
  });

  test(`@SB_BUS_ICO_9 In cart - Check hiển thị quick view khi recommend product có custom option`, async ({
    page,
    snapshotFixture,
  }) => {
    await test.step(`Ngoài SF, add product A vào cart.`, async () => {
      await homepage.gotoProduct(caseConf.target_product_handle);
      await productDetail.addToCart();
      await productDetail.page.waitForSelector(cart.xpathCartContent);
    });

    await test.step(`Mở cart page`, async () => {
      await productDetail.gotoCart();
      await expect(cart.productsInCart()).toContainText(caseConf.target_product);
      await expect(cart.inCartOfferRecommendedProduct(caseConf.recommended_product)).toBeVisible();
    });

    await test.step(`Click vào image/product name`, async () => {
      await cart.inCartOfferRecommendedProduct(caseConf.recommended_product).click();
      await expect(cart.genLoc(cart.selectorUpsellPopup)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: cart.selectorUpsellPopup,
        snapshotName: "case_9_popup_offer_in_cart_sf.png",
      });
    });

    await test.step(`Đóng popup quick view`, async () => {
      await cart.genLoc(cart.selectorClosePopup).click();
    });

    await test.step(`Click button Add ở product B`, async () => {
      await cart.genLoc(cart.xpathInCartOfferBtnAdd).click();
      await expect(cart.genLoc(cart.selectorUpsellPopup)).toBeVisible();
    });

    await test.step(`Chọn variant và nhập thông tin custom option`, async () => {
      await inCartSF.selectUpsellVariant(caseConf.recommended_product_variant);
      await cart.genLoc(inCartSF.selectorUpsellCustomOption).click();
      await cart.genLoc(inCartSF.selectorUpsellCustomOption).fill(`${caseConf.fill_custom_option}`);
      await inCartSF.addUpsellProductToCart();

      await expect(cart.inCartOfferRecommendedProduct(caseConf.recommended_product)).toBeHidden();
      await expect(cart.productsInCart()).toContainText(caseConf.recommended_product);
      await expect(cart.productsInCart()).toContainText(caseConf.recommended_product_variant);
      await expect(cart.productsInCart()).toContainText(caseConf.fill_custom_option);
    });
  });

  test("@SB_BUS_ICO_108 Check performance của offer in-cart", async ({ conf, page }) => {
    test.slow(); // Update performance có thể lâu
    const offer = conf.caseConf.data.offer;
    const verify = conf.caseConf.data.verify;
    const data = verify.checkout_info;
    let offerId: number, res;

    await test.step("Create offer in-cart", async () => {
      const recommendIds = await productAPI.getProductIdByHandle(offer.handle);
      const createdOffer = await appsAPI.createNewUpsellOffer(
        Object.assign({}, offer.create, {
          recommend_ids: [recommendIds],
          shop_id: conf.suiteConf.shop_id,
        }),
      );
      offerId = createdOffer.id;
    });

    await test.step(`Ngoài SF, add product A vào cart > add product ở in-cart offer`, async () => {
      await homepage.gotoProduct(verify.target_product_handle);
      await productDetail.addToCart();
      await productDetail.page.waitForSelector(cart.xpathCartContent);
      await homepage.goto(`https://${domain}/cart`);
      await cart.page.waitForLoadState("networkidle");
      await Promise.all([
        page.locator(cart.xpathInCartOfferBtnAdd).click(),
        homepage.waitResponseWithUrl("api/actions.json"),
        homepage.waitResponseWithUrl("api/offers/cart-recommend.json"),
      ]);
      await expect(cart.productsInCart()).toContainText(verify.add_to_order);
    });

    await test.step(`Checkout order success`, async () => {
      await homepage.clickOnBtnWithLabel("Checkout");
      await page.waitForURL(/\/checkouts/);
      await expect(page.locator(checkoutPage.xpathProductCartV2).first()).toBeVisible();
      await checkoutPage.completeOrderThemeV2(data);
      await expect(page.getByText("Thank you!").first()).toBeVisible();
    });

    await test.step(`Verify offer performance`, async () => {
      await expect(async () => {
        res = await appsAPI.getPerformanceOffer(offerId);
        expect(res).toMatchObject(verify.performance);
      }).toPass({ intervals: [1000], timeout: 120_000 });
    });
  });
});
