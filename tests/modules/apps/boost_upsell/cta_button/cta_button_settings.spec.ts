import { loadData } from "@core/conf/conf";
import { expect, test } from "@fixtures/upsell_offers";
import { AppsAPI } from "@pages/api/apps";
import { Apps } from "@pages/dashboard/apps";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFApps } from "@pages/storefront/apps";
import { SFCart } from "@pages/storefront/cart";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

test.beforeAll(async ({ authRequest, conf }) => {
  let offerList;
  const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
  await test.step("Get offer list đã tạo", async () => {
    offerList = await appsAPI.getListUpsellOffers();
  });

  const requestData = conf.suiteConf.delete_offer;
  const offerIds = requestData.ids;
  await test.step("Delete offer đã tạo sau khi test", async () => {
    for (let i = 0; i < offerList.length; i++) {
      offerIds.push(offerList[i].id);
    }
    if (offerIds.length) {
      await appsAPI.deleteAllUpsellOffers(offerIds);
    }
  });
});

test("Verify change settings on dashboard with API @SB_BUS_CTA", async ({ dashboard, authRequest, conf }) => {
  const ctaSettings = new Apps(dashboard, conf.suiteConf.domain);
  const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
  const db = new DashboardPage(dashboard, conf.suiteConf.domain);
  await test.step("Go to CTA button settings", async () => {
    await db.goto(conf.suiteConf.settings_path);
  });

  const setting = conf.suiteConf.behaviors;
  for (let i = 0; i < setting.length; i++) {
    await test.step(`Edit settings for ${conf.suiteConf.type.others} with setting ${setting[i]}`, async () => {
      await ctaSettings.customizeCTABtnSettings(conf.suiteConf.type.others, setting[i]);
    });

    await test.step("Verify API response after edited settings", async () => {
      const response = await appsAPI.getCTABtnSettings();
      expect(response).toMatchObject({
        call_to_action: {
          redirect_pre_purchase_page: setting[i],
          redirect_in_cart_offers_page: setting[i],
          redirect_cross_sell_page: setting[i],
          redirect_accessories_page: setting[i],
        },
      });
    });
  }

  for (let i = 0; i < setting.length - 1; i++) {
    await test.step(`Edit settings for ${conf.suiteConf.type.quantity} with setting ${setting[i]}`, async () => {
      await ctaSettings.customizeCTABtnSettings(conf.suiteConf.type.quantity, setting[i]);
    });
    await test.step("Verify API response after edited settings", async () => {
      const response = await appsAPI.getCTABtnSettings();
      expect(response).toMatchObject({
        call_to_action: {
          redirect_quantity_discount_page: conf.suiteConf.behaviors[i],
        },
      });
    });
  }
});

let caseName;
let conf;
test.describe("Check offers với 3 settings @SB_BUS_CTA", async () => {
  test.slow();
  caseName = "PRE_PURCHASE";
  conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ case_id: caseId, option: option, setting: setting, expected: expectedResult }) => {
    test(`Check Pre-purchase offer khi chọn settings ${option} @${caseId}`, async ({ page, authRequest }) => {
      const homepage = new SFHome(page, conf.suiteConf.domain);
      const productDetail = new SFProduct(page, conf.suiteConf.domain);
      const cart = new SFCart(page, conf.suiteConf.domain);
      const app = new SFApps(page, conf.suiteConf.domain);
      const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
      await test.step("Tạo Pre-purchase offer qua API", async () => {
        await appsAPI.createNewUpsellOffer(conf.suiteConf.pre_purchase_offer.data);
      });

      await test.step(`Set CTA button settings Pre-purchase Offer to ${option} by API`, async () => {
        await appsAPI.changeCTABtnSettings(setting.data.settings);
      });

      await test.step("Đi đến storefront của target product", async () => {
        await homepage.gotoProduct(conf.suiteConf.pre_purchase_offer.handle);
      });

      await test.step("Add target product vào cart", async () => {
        await productDetail.addToCart();
      });

      await test.step("Verify Pre-purchase offer hiển thị trong product detail", async () => {
        await expect(
          app.prePurchaseRecommendedProduct(conf.suiteConf.pre_purchase_offer.recommended_product),
        ).toBeVisible();
      });

      await test.step("Add recommended product vào cart", async () => {
        await app.addPrePurchaseProductToCart(conf.suiteConf.pre_purchase_offer.recommended_product);
      });

      await test.step(`Verify trạng thái của user ${option}`, async () => {
        await expect(productDetail.page).toHaveURL(new RegExp(expectedResult));
      });

      await test.step("Đi tới cart", async () => {
        await productDetail.gotoCart();
      });

      const productsInCart = cart.productsInCart();
      await test.step("Verify cả 2 product đã được add thành công vào cart", async () => {
        await expect(productsInCart).toContainText(
          conf.suiteConf.pre_purchase_offer.target_product && conf.suiteConf.pre_purchase_offer.recommended_product,
        );
      });
    });
  });

  caseName = "IN_CART";
  conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ case_id: caseId, option: option, setting: setting, expected: expectedResult }) => {
    test(`Check In-cart offer khi chọn settings ${option} @${caseId}`, async ({ page, authRequest, conf }) => {
      const homepage = new SFHome(page, conf.suiteConf.domain);
      const productDetail = new SFProduct(page, conf.suiteConf.domain);
      const cart = new SFCart(page, conf.suiteConf.domain);
      const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
      await test.step("Tạo In-cart offer qua API", async () => {
        await appsAPI.createNewUpsellOffer(conf.suiteConf.in_cart_offer.data);
      });

      await test.step(`Set CTA button settings In-cart Offer to ${option} by API`, async () => {
        await appsAPI.changeCTABtnSettings(setting.data.settings);
      });

      await test.step("Đi đến storefront của target product", async () => {
        await homepage.gotoProduct(conf.suiteConf.in_cart_offer.handle);
      });

      await test.step("Add target product vào cart", async () => {
        await productDetail.addToCart();
      });

      await test.step("Verify In-cart offer hiển thị trong cart drawer", async () => {
        await expect(
          cart.inCartOfferRecommendedProduct(conf.suiteConf.in_cart_offer.recommended_product),
        ).toBeVisible();
      });

      await test.step("Add recommended product vào cart", async () => {
        await cart.addInCartOfferProductToCart();
      });

      await test.step("Verify add products to cart thành công", async () => {
        await expect(cart.productsInCart()).toContainText(
          conf.suiteConf.in_cart_offer.target_product && conf.suiteConf.in_cart_offer.recommended_product,
        );
      });

      await test.step(`Verify trạng thái của user ${option}`, async () => {
        await expect(productDetail.page).toHaveURL(new RegExp(expectedResult));
      });

      await test.step("Đi tới cart", async () => {
        await productDetail.gotoCart();
      });

      await test.step("Xoá recommend product khỏi draw cart", async () => {
        await cart.removeInCartProduct(conf.suiteConf.in_cart_offer.recommended_product);
      });

      await test.step("Verify In-cart offer hiển thị trong cart", async () => {
        await expect(
          cart.inCartOfferRecommendedProduct(conf.suiteConf.in_cart_offer.recommended_product),
        ).toBeVisible();
      });

      await test.step("Add recommended product vào cart", async () => {
        await cart.addInCartOfferProductToCart();
      });

      await test.step("Verify add products to cart thành công", async () => {
        await expect(cart.productsInCart()).toContainText(
          conf.suiteConf.in_cart_offer.target_product && conf.suiteConf.in_cart_offer.recommended_product,
        );
      });
    });
  });

  caseName = "ACCESSORIES";
  conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ case_id: caseId, option: option, setting: setting, expected: expectedResult }) => {
    test(`Check Accessories offer khi settings ${option} @${caseId}`, async ({ page, authRequest, conf }) => {
      const homepage = new SFHome(page, conf.suiteConf.domain);
      const productDetail = new SFProduct(page, conf.suiteConf.domain);
      const cart = new SFCart(page, conf.suiteConf.domain);
      const app = new SFApps(page, conf.suiteConf.domain);
      const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
      await test.step("Tạo Accessories offer qua API", async () => {
        await appsAPI.createNewUpsellOffer(conf.suiteConf.accessories_offer.data);
      });

      await test.step(`Set CTA button settings Accessories Offer to ${option} by API`, async () => {
        await appsAPI.changeCTABtnSettings(setting.data.settings);
      });

      await test.step("Đi đến storefront của target product", async () => {
        await homepage.gotoProduct(conf.suiteConf.accessories_offer.handle);
      });

      const accessoryLoc = page.locator("//section[@type='accessory']");
      await test.step("Verify accessories offer hiển thị ở product detail", async () => {
        await expect(accessoryLoc).toBeVisible();
      });

      await test.step("Add accessories vào cart", async () => {
        await app.addAccessoriesToCart(conf.suiteConf.accessories_offer.accessories[0]);
      });

      await test.step(`Verify trạng thái của user ${option}`, async () => {
        await expect(productDetail.page).toHaveURL(new RegExp(expectedResult));
      });

      await test.step("Đi đến cart", async () => {
        await productDetail.gotoCart();
      });

      await test.step("Verify accessories được add vào cart thành công", async () => {
        await expect(cart.productsInCart()).toContainText(conf.suiteConf.accessories_offer.accessories[0]);
      });
    });
  });

  caseName = "BUNDLE";
  conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ case_id: caseId, option: option, setting: setting, expected: expectedResult }) => {
    test(`Check Bundles offer khi chọn settings ${option} @${caseId}`, async ({ context, page, authRequest, conf }) => {
      const homepage = new SFHome(page, conf.suiteConf.domain);
      const productDetail = new SFProduct(page, conf.suiteConf.domain);
      const cart = new SFCart(page, conf.suiteConf.domain);
      const app = new SFApps(page, conf.suiteConf.domain);
      const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);

      const bundle1 = conf.suiteConf.bundles_offer_1;
      const bundle2 = conf.suiteConf.bundles_offer_2;
      let cartNewTab;

      await test.step("Tạo Bundles offer với product có custom options qua API", async () => {
        await appsAPI.createNewUpsellOffer(bundle1.data);
      });

      await test.step("Tạo Bundles offer với product không có custom options qua API", async () => {
        await appsAPI.createNewUpsellOffer(bundle2.data);
      });

      await test.step(`Set CTA button settings Bundles Offer to ${option} by API`, async () => {
        await appsAPI.changeCTABtnSettings(setting.data.settings);
      });

      await test.step("Đi đến storefront của target product có custom option", async () => {
        await homepage.gotoProduct(bundle1.handle);
      });

      const bundlesLoc = page.locator("//section[@type='bundle']");
      await test.step("Verify Bundles offer hiển thị trong product detail", async () => {
        await expect(bundlesLoc).toBeVisible();
      });

      await test.step("Add tất cả bundles vào cart", async () => {
        await app.addAllBundlesToCart(3, bundle1.custom_text);
      });

      await test.step(`Verify trạng thái của user ${option}`, async () => {
        await expect(productDetail.page).toHaveURL(new RegExp(expectedResult[0]));
        await productDetail.page.waitForLoadState("networkidle");
      });

      await test.step("Đi đến cart page", async () => {
        await productDetail.gotoCart();
      });

      await test.step("Verify add products to cart thành công", async () => {
        await expect(cart.productInCartByName(bundle1.target_product)).toBeVisible();
        await expect(cart.productInCartByName(bundle1.product_1)).toBeVisible();
        await expect(cart.productInCartByName(bundle1.product_2)).toBeVisible();
      });

      await test.step("Đi đến storefront của target product không có custom option", async () => {
        await homepage.gotoProduct(bundle2.handle);
      });

      await test.step("Verify Bundles offer hiển thị trong product detail", async () => {
        await expect(bundlesLoc).toBeVisible();
      });

      await test.step("Add tất cả bundles vào cart", async () => {
        await app.addAllBundlesToCart(3);
      });

      await test.step(`Verify trạng thái của user ${option}`, async () => {
        await expect(productDetail.page).toHaveURL(new RegExp(expectedResult[1]));
        await productDetail.page.waitForLoadState("networkidle");
      });

      await test.step("Đi đến cart page", async () => {
        cartNewTab = await context.newPage();
        await cartNewTab.goto(`https://${conf.suiteConf.domain}/cart`);
      });

      await test.step("Verify add products to cart thành công", async () => {
        const newCart = new SFCart(cartNewTab, conf.suiteConf.domain);
        await expect(newCart.productInCartByName(bundle2.target_product)).toBeVisible();
        await expect(newCart.productInCartByName(bundle2.product_1)).toBeVisible();
        await expect(newCart.productInCartByName(bundle2.product_2)).toBeVisible();
        await newCart.page.close();
      });
    });
  });

  caseName = "QUANTITY";
  conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ case_id: caseId, option: option, setting: setting, expected: expectedResult }) => {
    test(`Check Quantity discounts offer khi chọn settings ${option} @${caseId}`, async ({
      page,
      authRequest,
      conf,
    }) => {
      let productInCartQuantity;
      const homepage = new SFHome(page, conf.suiteConf.domain);
      const productDetail = new SFProduct(page, conf.suiteConf.domain);
      const cart = new SFCart(page, conf.suiteConf.domain);
      const app = new SFApps(page, conf.suiteConf.domain);
      const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
      let upsellOffer;
      const OfferData = conf.suiteConf.quantity_offer.data;
      await test.step("Tạo Quantity offer qua API", async () => {
        upsellOffer = await appsAPI.createNewUpsellOffer(OfferData);
      });

      await test.step(`Set CTA button settings Quantity Offer to ${option} by API`, async () => {
        await appsAPI.changeCTABtnSettings(setting.data.settings);
      });

      await test.step("Đi đến storefront của target product", async () => {
        await expect(async () => {
          const listOfferId = await appsAPI.getListOfferIdOfProductOnSF(conf.suiteConf.domain, OfferData.target_ids[0]);
          const foundMatchId = listOfferId.some(item => item === upsellOffer.id);
          expect(foundMatchId).toBe(true);
        }).toPass();
        await homepage.gotoProduct(conf.suiteConf.quantity_offer.handle);
      });

      const quantityDiscountLoc = page.locator("//section[@type='quantity']");
      await test.step("Verify Quantity discounts offer hiển thị trong product detail", async () => {
        await expect(quantityDiscountLoc).toBeVisible();
      });

      await test.step("Add Quantity discounts 1 vào cart", async () => {
        await app.addQuantityDiscountsToCart(conf.suiteConf.quantity_offer.title_1);
      });

      await test.step(`Verify trạng thái của user ${option}`, async () => {
        await expect(productDetail.page).toHaveURL(new RegExp(expectedResult));
      });

      await test.step("Đi đến cart page", async () => {
        await productDetail.gotoCart();
      });

      productInCartQuantity = await cart.getProductInCartQuantity(conf.suiteConf.quantity_offer.target_product);
      await test.step("Verify add products với đúng quantity vào cart thành công", async () => {
        await expect(productInCartQuantity).toBe(conf.suiteConf.quantity_offer.quantity_1);
      });

      const subTotal = await cart.getSubTotal();
      await test.step("Verify discount đúng như setup", async () => {
        await expect(subTotal).toEqual(conf.suiteConf.quantity_offer.discount_1);
      });

      await test.step("Đến storefront target product", async () => {
        await homepage.gotoProduct(conf.suiteConf.quantity_offer.handle);
      });

      await test.step("Add Quantity discount 2 vào cart", async () => {
        await app.addQuantityDiscountsToCart(conf.suiteConf.quantity_offer.title_2);
      });

      await test.step(`Verify trạng thái của user ${option}`, async () => {
        await expect(productDetail.page).toHaveURL(new RegExp(expectedResult));
      });

      await test.step("Đi đến cart page", async () => {
        await productDetail.gotoCart();
      });

      productInCartQuantity = await cart.getProductInCartQuantity(conf.suiteConf.quantity_offer.target_product);
      await test.step("Verify add product với đúng quantity vào cart thành công", async () => {
        await expect(productInCartQuantity).toBe(conf.suiteConf.quantity_offer.quantity_2);
      });

      const actualOfferDiscount = await cart.offerDiscountAmount();
      const expectedOfferDiscount =
        conf.suiteConf.quantity_offer.quantity_2 *
        conf.suiteConf.quantity_offer.discount_2 *
        (await cart.getProductPriceWithoutCurrency(conf.suiteConf.quantity_offer.target_product));
      await test.step("Verify discount đúng như setup", async () => {
        await expect(actualOfferDiscount).toEqual(Math.round(expectedOfferDiscount));
      });
    });
  });
});
