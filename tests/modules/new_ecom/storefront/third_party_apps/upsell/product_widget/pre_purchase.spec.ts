import { test, expect } from "@fixtures/website_builder";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { AppsAPI } from "@pages/api/apps";
import { ProductAPI } from "@pages/api/product";
import { CollectionAPI } from "@pages/api/dashboard/collection";
import { UpSell } from "@pages/new_ecom/storefront/upsell";
import { SFHome } from "@sf_pages/homepage";
import { ThemeSettingsData } from "@types";
import { SFCheckout } from "@sf_pages/checkout";

test.describe("@PRE_PURCHASE - Pre Purchase", () => {
  const productHandles = [];
  const productIds = [];
  const productTitles = [];
  const productPrice = [];
  let appsAPI;
  let collectionAPI;
  let productAPI;
  let upsell: UpSell;
  let preProdD, preProdB, preProdC, preProdF, quantityA, quantityB, quantityD, quantityC;
  let response, set, settingsData: ThemeSettingsData;
  let suiteConf, caseConf, data;
  let countRecommendProduct: number;
  let priceAfterAddCart: string;

  test.beforeAll(async ({ authRequest, conf, token }) => {
    suiteConf = conf.suiteConf;
    productAPI = new ProductAPI(suiteConf.domain, authRequest);
    appsAPI = new AppsAPI(suiteConf.domain, authRequest);
    collectionAPI = new CollectionAPI(suiteConf.domain, authRequest);
    const smartUpsell = Object.assign({}, suiteConf.data.smart_up_sell, { enable: false });
    await appsAPI.changeCTABtnSettings({ smart_up_sell: smartUpsell });
    await test.step(`Get product information`, async () => {
      const { access_token: shopToken } = await token.getWithCredentials({
        domain: suiteConf.domain,
        username: suiteConf.username,
        password: suiteConf.password,
      });
      const listProduct = await productAPI.getAllProduct(suiteConf.domain, shopToken);
      if (listProduct.length) {
        for (let i = 0; i < listProduct.length; i++) {
          productHandles.push(listProduct[i].handle);
          productIds.push(listProduct[i].id);
          productPrice.push(listProduct[i].variants[0].price);
          productTitles.push(listProduct[i].title);
        }
      }
    });
  });

  test.beforeEach(async ({ page, conf, builder }, testInfo) => {
    data = conf.caseConf.data;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    caseConf = conf.caseConf;
    upsell = new UpSell(page, conf.suiteConf.domain);

    await test.step(`Turn off smart upsell`, async () => {
      await appsAPI.changeCTABtnSettings({
        smart_up_sell: Object.assign({}, suiteConf.data.smart_up_sell, { enable: false }),
        call_to_action: suiteConf.data.call_to_action,
      });
    });
    preProdD = upsell.prePurchaseAddCartBtnByProductName(productTitles[3]);
    preProdB = upsell.prePurchaseAddCartBtnByProductName(productTitles[1]);
    preProdC = upsell.prePurchaseAddCartBtnByProductName(productTitles[2]);
    preProdF = upsell.prePurchaseAddCartBtnByProductName(productTitles[5]);
    quantityA = upsell.inputQuantityProductByNameAtCart(productTitles[0]);
    quantityB = upsell.inputQuantityProductByNameAtCart(productTitles[1]);
    quantityD = upsell.inputQuantityProductByNameAtCart(productTitles[3]);
    quantityC = upsell.inputQuantityProductByNameAtCart(productTitles[2]);

    await test.step(`Setting default select variant trong website setting`, async () => {
      response = await builder.pageSiteBuilder(suiteConf.theme_id);
      settingsData = response.settings_data as ThemeSettingsData;
      set = Object.assign({}, settingsData, suiteConf.settings_theme);
      await builder.updateSiteBuilder(suiteConf.theme_id, set);
    });
  });

  test.afterEach(async ({ authRequest }) => {
    let offerList;
    const offerIds = [];
    const appsAPI = new AppsAPI(suiteConf.domain, authRequest);
    await test.step("Get offer list đã tạo", async () => {
      offerList = await appsAPI.getListUpsellOffers();
    });

    await test.step("Delete offer đã tạo sau khi test", async () => {
      for (let i = 0; i < offerList.length; i++) {
        offerIds.push(offerList[i].id);
      }

      if (offerIds.length) {
        await appsAPI.deleteAllUpsellOffers(offerIds);
      }
    });

    await test.step(`Delete all collection`, async () => {
      await collectionAPI.deleteAllSmartCollection();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_02 Check hiển thị pre-purchase với target All products và recommend product là Specific products`, async ({
    page,
  }) => {
    const originPrice = data.origin_price;
    const discountPrice = data.discount_price;
    const discount = data.discount;
    const quantity = data.quantity;
    const numberRecommend = data.quantity_recommend_product;
    const subtotal = data.subtotal;
    const recommendA = page.locator(upsell.prePurchaseByProductName("product A"));
    const recommendB = page.locator(upsell.prePurchaseByProductName("product B"));
    const recommendC = page.locator(upsell.prePurchaseByProductName("product C"));
    const locatorPriceB = recommendB.locator(upsell.priceProduct);
    const locatorPriceOrginB = recommendB.locator(upsell.originPriceProduct);
    await test.step("Tạo Pre-purchase offer qua API", async () => {
      const recommendIds = productIds.slice(0, 3);
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, { recommend_ids: recommendIds }),
      );
    });

    await test.step(`Click CTA button ở product D`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[3]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await expect(recommendA).toBeVisible();
      await expect(recommendB).toBeVisible();
      await expect(recommendC).toBeVisible();
      expect(await page.locator(upsell.upsellRecommend).count()).toBe(numberRecommend);
      for (let i = 0; i < numberRecommend; i++) {
        expect(await page.locator(upsell.priceProduct).nth(i).textContent()).toEqual(discountPrice);
        expect(await page.locator(upsell.originPriceProduct).nth(i).textContent()).toEqual(originPrice);
      }
    });

    await test.step(`Click CTA button ở product A`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await expect(page.locator(preProdC)).toBeVisible();
      expect(await locatorPriceB.textContent()).toEqual(discountPrice);
      expect(await locatorPriceOrginB.textContent()).toEqual(originPrice);
      expect(await page.locator(upsell.upsellRecommend).count()).toBe(numberRecommend - 1);
    });

    await test.step(`Add product B vào cart`, async () => {
      await page.locator(preProdB).click();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.locator(upsell.upsellBtnClose).click();
      await page.waitForSelector(upsell.prePurchaseDialog, { state: "hidden" });
      await page.waitForURL(/\/cart/);
      expect((await page.locator(upsell.discountPrice).first().textContent()).trim()).toEqual(discount);
      expect((await page.locator(upsell.cartTotalPrice).first().textContent()).trim()).toEqual(subtotal);
      await expect(page.locator(quantityA)).toHaveValue(quantity);
      await expect(page.locator(quantityD)).toHaveValue(quantity);
      await expect(page.locator(quantityB)).toHaveValue(quantity);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_03 Check hiển thị pre-purchase với target product All products và recommend product là Specific collection`, async ({
    page,
    conf,
  }) => {
    const collectionIds = [];
    await test.step(`Create collection precondition`, async () => {
      for (let i = 0; i < conf.caseConf.data.collections.length; i++) {
        const response = await collectionAPI.createSmartCollection(conf.caseConf.data.collections[i]);
        if (response?.smart_collection) {
          collectionIds.push(response.smart_collection.id);
        }
      }
    });

    await test.step(`- Deactivate all offers
- Tạo offer pre-purchase 1:
 + target: All products
 + recommend: collection 1 không có product nào`, async () => {
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_ids: [collectionIds[0]],
          recommend_type: "collection",
        }),
      );
    });

    await test.step(`Click CTA button ở product E`, async () => {
      await Promise.all([
        await page.goto(`https://${suiteConf.domain}/products/${productHandles[4]}`),
        await upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();
    });

    await test.step(`- Deactivate all offers
- Tạo offer pre-purchase 2:
 + target: All products
 + recommend: collection 2 chỉ có 1 product A`, async () => {
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_ids: [collectionIds[1]],
          recommend_type: "collection",
        }),
      );
    });

    await test.step(`Click CTA button ở product A`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();
    });

    await test.step(`- Deactivate all offers
- Tạo offer pre-purchase 3:
 + target: All products
 + recommend: collection 3 có nhieu products (product B, C, D)
 + turn on discount`, async () => {
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "collection",
          recommend_ids: [collectionIds[2]],
        }),
      );
    });

    await test.step(`Click CTA button ở product A`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);

      await Promise.all([
        page.locator(upsell.ctaButtonPrePurchase).click(),
        upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
      ]);
      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();
      await waitForImageLoaded(page, upsell.prePurchaseDialog);

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      expect(countRecommendProduct).toEqual(caseConf.expect.product_count);
      for (let i = 0; i < countRecommendProduct; i++) {
        const titleRecommendProduct = await page.locator(upsell.productRecommendTitle).nth(i).innerText();
        expect(titleRecommendProduct).not.toEqual(caseConf.expect.target_product);
        expect(caseConf.expect.recommend_product).toContain(titleRecommendProduct);
      }
    });

    await test.step(`Click add product B trên popup pre-purchase vào cart`, async () => {
      const productCartCount = await page.locator(upsell.upsellRecommend).count();
      await Promise.all([
        page.locator(upsell.prePurchaseBtnAddCart).first().click(),
        upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
      ]);

      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      priceAfterAddCart = await page.locator(upsell.prePurchaseCartPrice).innerText();
      expect(priceAfterAddCart).toEqual(caseConf.expect.amount);
      expect(await page.locator(upsell.upsellRecommend).count()).toEqual(productCartCount - 1);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_04 Check hiển thi pre-purchase với target All products và recommend là Same collection with target product`, async ({
    cConf,
    page,
  }) => {
    const collectionIds = [];
    await test.step("Tạo Pre-purchase offer qua API", async () => {
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "same-collection",
        }),
      );
    });

    await test.step(`Create collection precondition`, async () => {
      for (let i = 0; i < caseConf.data.collections.length; i++) {
        const response = await collectionAPI.createSmartCollection(caseConf.data.collections[i]);
        if (response?.smart_collection) {
          collectionIds.push(response.smart_collection.id);
        }
      }
    });

    await test.step(`Click CTA button tại product A`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);

      await Promise.all([
        page.locator(upsell.ctaButtonPrePurchase).click(),
        upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
      ]);
      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      await expect(countRecommendProduct).toEqual(cConf.expect.number_of_product);
      for (let i = 0; i < countRecommendProduct; i++) {
        const titleRecommendProduct = await page.locator(upsell.productRecommendTitle).nth(i).innerText();
        await expect(titleRecommendProduct).not.toEqual(cConf.expect.target_product_1);
      }
    });

    await test.step(`Click CTA button tại product B`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[1]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);

      await Promise.all([
        page.locator(upsell.ctaButtonPrePurchase).click(),
        upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
      ]);
      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();
      await waitForImageLoaded(page, upsell.prePurchaseDialog);

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      expect(countRecommendProduct).toEqual(cConf.expect.number_of_product);
      for (let i = 0; i < countRecommendProduct; i++) {
        const titleRecommendProduct = await page.locator(upsell.productRecommendTitle).nth(i).innerText();
        expect(titleRecommendProduct).not.toEqual(cConf.expect.target_product_2);
        expect(cConf.expect.collection).toContain(titleRecommendProduct);
      }
    });

    await test.step(`Click CTA button tại product C`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[2]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);

      await Promise.all([
        page.locator(upsell.ctaButtonPrePurchase).click(),
        upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
      ]);
      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();
      await waitForImageLoaded(page, upsell.prePurchaseDialog);

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      await expect(countRecommendProduct).toEqual(cConf.expect.number_of_product);
      for (let i = 0; i < countRecommendProduct; i++) {
        const titleRecommendProduct = await page.locator(upsell.productRecommendTitle).nth(i).innerText();
        await expect(titleRecommendProduct).not.toEqual(cConf.expect.target_product_3);
        await expect(cConf.expect.collection).toContain(titleRecommendProduct);
      }
    });

    await test.step(`Add product trên pre-purchase vào cart`, async () => {
      await Promise.all([
        page.locator(upsell.prePurchaseBtnAddCart).first().click(),
        upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
      ]);

      priceAfterAddCart = await page.locator(upsell.prePurchaseCartPrice).innerText();
      expect(priceAfterAddCart).toEqual(caseConf.expect.amount);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_05 Check hiển thị pre-purchase với target All products và recommend Most relevant`, async ({
    page,
  }) => {
    await test.step("Tạo Pre-purchase offer qua API", async () => {
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "relevant-collection",
        }),
      );
    });

    await test.step(`Click CTA button tại product A`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);

      await Promise.all([
        page.locator(upsell.ctaButtonPrePurchase).click(),
        upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
      ]);
      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();

      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      expect(countRecommendProduct).toEqual(caseConf.expect.product_count);
      for (let i = 0; i < countRecommendProduct; i++) {
        const titleRecommendProduct = await page.locator(upsell.productRecommendTitle).nth(i).innerText();
        expect(titleRecommendProduct).not.toEqual(caseConf.expect.target_product);
      }
    });

    await test.step(`Add product trên pre-purchase vào cart`, async () => {
      const productCartCount = await page.locator(upsell.upsellRecommend).count();
      await page.locator(preProdB).click();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      await expect(page.locator(preProdB)).toBeHidden();
      await expect(await page.locator(upsell.upsellRecommend).count()).toEqual(productCartCount - 1);

      await page.waitForLoadState("networkidle");
      await waitForImageLoaded(page, upsell.prePurchaseCart);
      priceAfterAddCart = await page.locator(upsell.prePurchaseCartPrice).innerText();
      expect(priceAfterAddCart).toEqual(caseConf.expect.amount);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_08 Check tính offer discount của pre-purchase`, async ({ page, conf, authRequest }) => {
    const originPrice = data.origin_price;
    const discountPrice = data.discount_price;
    const discount = data.discount;
    let offerId;
    const recommendIds = productIds.slice(0, 4);
    await test.step("Tạo Pre-purchase offer qua API", async () => {
      offerId = await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          recommend_ids: recommendIds,
          enable_discount: true,
          discount_data: caseConf.data.discount_data,
        }),
      );
    });

    await test.step(`Click CTA button tại product A`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      expect(await page.locator(upsell.priceProduct).first().textContent()).toEqual(discountPrice);
      expect(await page.locator(upsell.originPriceProduct).first().textContent()).toEqual(originPrice);
    });

    await test.step(`Add lần lượt product B, C, D to cart từ pre-purchase`, async () => {
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.locator(preProdC).click();
      await expect(page.locator(preProdC)).toBeHidden();
      await page.locator(preProdD).click();
      await expect(page.locator(preProdD)).toBeHidden();
      await page.waitForSelector(upsell.prePurchaseDialog, { state: "hidden" });
      await page.goto(`https://${conf.suiteConf.domain}/cart`);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Offer discount").first()).toBeVisible();
      await expect(page.locator(upsell.offerDiscountXpath).first()).toHaveText(discount[2]);
    });

    await test.step(`Turn off discount của offer`, async () => {
      await authRequest.put(`https://${suiteConf.domain}/admin/offers/${offerId.id}.json`, {
        data: Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          recommend_ids: recommendIds,
          enable_discount: false,
        }),
      });
      await page.goto(`https://${suiteConf.domain}/cart`);
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Offer discount").first()).toBeHidden();
    });

    await test.step(`Turn on discount của offer`, async () => {
      await authRequest.put(`https://${suiteConf.domain}/admin/offers/${offerId.id}.json`, {
        data: Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          recommend_ids: recommendIds,
          enable_discount: true,
          discount_data: caseConf.data.discount_data,
        }),
      });
      await page.goto(`https://${suiteConf.domain}/cart`);
      await page.waitForLoadState("networkidle");
      const offDiscountText = await page.getByText("Offer discount").first().isVisible();
      // if api discount offer cache try reload page
      if (!offDiscountText) {
        await page.reload();
        await expect(page.getByText("Offer discount").first()).toBeVisible();
      }
    });

    await test.step(`Tăng quantity của product A lên 2`, async () => {
      const prePrice = await page.locator(upsell.offerDiscountXpath).first().innerText();
      await page.locator(quantityA).fill(caseConf.data.fill_input[0]);
      await expect(page.locator(quantityA)).toHaveValue(caseConf.data.fill_input[0]);
      await expect(page.locator(upsell.offerDiscountXpath).first()).toHaveText(prePrice);
    });

    await test.step(`Tăng quantity của product B lên 3`, async () => {
      const prePrice = await page.locator(upsell.offerDiscountXpath).first().innerText();
      await page.locator(quantityB).fill(caseConf.data.fill_input[1]);
      await expect(page.locator(quantityB)).toHaveValue(caseConf.data.fill_input[1]);
      await expect(page.locator(upsell.offerDiscountXpath).first()).toHaveText(prePrice);
    });

    await test.step(`Giảm quantity của product B xuống 2`, async () => {
      const prePrice = await page.locator(upsell.offerDiscountXpath).first().innerText();
      await page.locator(quantityB).fill(caseConf.data.fill_input[2]);
      await expect(page.locator(quantityB)).toHaveValue(caseConf.data.fill_input[2]);
      await expect(page.locator(upsell.offerDiscountXpath).first()).toHaveText(prePrice);
    });

    await test.step(`Xoá product A (target product) khỏi cart`, async () => {
      const productCartCount = await upsell.productCartContent.count();
      await page.locator(quantityA).fill(caseConf.data.fill_input[3]);
      await page.waitForResponse(
        response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
      );
      await page.waitForLoadState("networkidle");
      await expect(page.locator(quantityA)).toBeHidden();
      expect(await upsell.productCartContent.count()).toEqual(productCartCount - 1);

      await expect(async () => {
        const offerDiscount = await page.locator(upsell.offerDiscountXpath).first().innerText();
        expect(offerDiscount).toBe(discount[0]);
      }).toPass({ intervals: [1000], timeout: 5000 });
    });

    await test.step(`Xoá product D (recommend product) khỏi cart`, async () => {
      const productCartCount = await upsell.productCartContent.count();
      await page.locator(quantityD).fill(caseConf.data.fill_input[3]);
      await page.waitForResponse(
        response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
      );
      await page.waitForLoadState("networkidle");
      await expect(page.locator(quantityD)).toBeHidden();
      expect(await upsell.productCartContent.count()).toEqual(productCartCount - 1);

      await expect(async () => {
        const offerDiscount = await page.locator(upsell.offerDiscountXpath).first().innerText();
        expect(offerDiscount).toBe(discount[1]);
      }).toPass({ intervals: [1000], timeout: 5000 });
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_09 Check tính discount pre-purchase khi có nhiều offer`, async ({ page, conf }) => {
    await test.step(`Add offer pre-purchase 1, pre-purchase 2 vào cart`, async () => {
      const recommendIds = productIds.slice(1, 3);
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          recommend_ids: recommendIds,
          target_type: "product",
          target_ids: [productIds[0]],
          enable_discount: true,
          offer_product_updated: true,
          discount_data: conf.caseConf.data.discount_data[0],
        }),
      );
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          target_type: "product",
          recommend_ids: [productIds[4]],
          target_ids: [productIds[3]],
          enable_discount: true,
          offer_product_updated: true,
          discount_data: conf.caseConf.data.discount_data[1],
        }),
      );
      await page.goto(`https://${conf.suiteConf.domain}/products/${productHandles[0]}`);
      await page.waitForResponse(
        response => response.url().includes("/api/offers/list.json") && response.status() === 200,
      );
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseBtnAddCart).first().click();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      await page.waitForLoadState("load");
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[3]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseBtnAddCart).first().click();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      await page.waitForLoadState("load");
      await page.goto(`https://${suiteConf.domain}/cart`);
      await page.waitForLoadState("networkidle");
      const discount = `-$${Math.round(productPrice[0] * conf.caseConf.data.discount_percent[0])}.00`;
      await await expect(page.locator(upsell.offerDiscountXpath).first()).toHaveText(discount);
    });

    await test.step(`Add offer pre-purchase 1, bundle, quantity discount vào cart`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[5]}`);
      await page.waitForLoadState("load");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.goto(`https://${suiteConf.domain}/cart`);
      await page.waitForLoadState("networkidle");
      const discount = `-$${Math.round(productPrice[5] * conf.caseConf.data.discount_percent[0])}.00`;
      await await expect(page.locator(upsell.offerDiscountXpath).first()).toHaveText(discount);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_10 Check hiển thi offer sau khi add product trên pre-purchase vào cart`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`- Tạo offer pre-purchase 1:
 + target: product A
 + recommend: product B, C, D
- Turn off smart offer`, async () => {
      // fill your code here
      const smartUpsell = Object.assign({}, suiteConf.data.smart_up_sell, { enable: false });
      await appsAPI.changeCTABtnSettings({ smart_up_sell: smartUpsell });
      const recommendIds = productIds.slice(1, 4);
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          target_type: "product",
          recommend_ids: recommendIds,
          target_ids: [productIds[0]],
        }),
      );
    });

    await test.step(`Click CTA button tại product A`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseDialog,
        snapshotName: caseConf.snapshots.popup_pre_purchase_has_3_products,
      });
    });

    await test.step(`Add product B to cart`, async () => {
      const productRecommendCount = await page.locator(upsell.upsellRecommend).count();
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      await expect(await page.locator(upsell.upsellRecommend).count()).toEqual(productRecommendCount - 1);
    });

    await test.step(`Add product C to cart`, async () => {
      const productRecommendCount = await page.locator(upsell.upsellRecommend).count();
      await page.locator(preProdC).click();
      await expect(page.locator(preProdC)).toBeHidden();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      await expect(await page.locator(upsell.upsellRecommend).count()).toEqual(productRecommendCount - 1);
    });

    await test.step(`Add product D to cart`, async () => {
      await page.locator(preProdD).click();
      await expect(page.locator(preProdD)).toBeHidden();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();
    });

    await test.step(`- Remove cart
- Tạo offer pre-purchase 2:
 + target: product A
 + recommend: product B, C, D
- Turn on smart offer`, async () => {
      await page.goto(`https://${suiteConf.domain}/cart`);
      await page.waitForLoadState("networkidle");
      await page.locator(quantityD).fill(caseConf.data.fill_input);
      await expect(page.locator(quantityD)).toBeHidden();
      await page.locator(quantityA).fill(caseConf.data.fill_input);
      await expect(page.locator(quantityA)).toBeHidden();
      await page.locator(quantityB).fill(caseConf.data.fill_input);
      await expect(page.locator(quantityB)).toBeHidden();
      await page.locator(quantityC).fill(caseConf.data.fill_input);
      await expect(page.locator(quantityC)).toBeHidden();

      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Your cart is empty").first()).toBeVisible();
      await appsAPI.changeCTABtnSettings({ smart_up_sell: conf.suiteConf.data.smart_up_sell });
    });

    await test.step(`Click CTA button tại product A`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseDialog,
        snapshotName: caseConf.snapshots.popup_pre_purchase_has_3_products,
      });
    });

    await test.step(`Add product B to cart`, async () => {
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      await expect(await page.locator(upsell.upsellRecommend).count()).toEqual(conf.caseConf.data.product_count);
    });

    await test.step(`- Remove cart
- Tạo offer pre-purchase 3:
 + target: product A
 + recommend: product B, C, D
- Turn off smart offer
- Tạo pre-purchase 4:
 + target: product B
 + recommend: product E, F`, async () => {
      await page.goto(`https://${suiteConf.domain}/cart`);
      await page.waitForLoadState("networkidle");
      await page.locator(quantityA).fill(caseConf.data.fill_input);
      await expect(page.locator(quantityA)).toBeHidden();
      await page.locator(quantityB).fill(caseConf.data.fill_input);
      await expect(page.locator(quantityB)).toBeHidden();

      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Your cart is empty").first()).toBeVisible();
      const smartUpsell = Object.assign({}, suiteConf.data.smart_up_sell, { enable: false });
      await appsAPI.changeCTABtnSettings({ smart_up_sell: smartUpsell });
      const recommendIds = productIds.slice(4, 6);
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          target_type: "product",
          recommend_ids: recommendIds,
          target_ids: [productIds[1]],
        }),
      );
    });

    await test.step(`Click CTA button tại product A`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseDialog,
        snapshotName: caseConf.snapshots.popup_pre_purchase_has_3_products,
      });
    });

    await test.step(`Add product B to cart`, async () => {
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      // upsell recommend has E, F
      expect(await page.locator(upsell.upsellRecommend).count()).toEqual(2);
      await waitForImageLoaded(page, upsell.prePurchaseCart);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseCart,
        snapshotName: caseConf.snapshots.popup_pre_purchase_cart_after_add_cart,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_11 Check hiển thị UI của poup pre-purchase`, async ({
    pageMobile,
    page,
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    await test.step("Tạo Pre-purchase offer qua API", async () => {
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          target_type: "product",
          recommend_ids: [productIds[1], productIds[2]],
          target_ids: [productIds[0]],
          enable_discount: false,
        }),
      );

      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          target_type: "product",
          recommend_ids: [productIds[3], productIds[4], productIds[5]],
          target_ids: [productIds[3]],
          enable_discount: true,
          discount_data: caseConf.data.discount_data,
        }),
      );
    });

    await test.step(`Click CTA button tại product A`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseDialog,
        snapshotName: caseConf.snapshots.popup_pre_purchase_has_2_products_off_discount,
      });
    });

    await test.step(`Click CTA button tại product D`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[3]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await expect(page.locator(preProdD)).toBeHidden();
      await expect(page.locator(upsell.selectCustomOptionByProductName(productTitles[5]))).toBeVisible();
    });

    await test.step(`Click CTA button tại product D trên mobile`, async () => {
      const navigationPage = new SFHome(pageMobile, suiteConf.domain);
      await navigationPage.gotoProduct(productHandles[3]);
      await pageMobile.waitForLoadState("networkidle");
      await pageMobile.locator(upsell.ctaButtonPrePurchase).click();
      await pageMobile.locator(upsell.prePurchaseDialog).isVisible();
      await expect(pageMobile.locator(preProdD)).toBeHidden();
      await expect(pageMobile.getByText("Customizable")).toBeVisible();
    });

    await test.step(`Điền custom option cho product F`, async () => {
      await pageMobile.locator(preProdF).click();
      await expect(pageMobile.getByText(productTitles[5]).first()).toBeVisible();
      await pageMobile.getByPlaceholder("Please fill out this field").first().fill(conf.caseConf.data.customize_text);
    });

    await test.step(`Click Back icon trên popup điền custom option`, async () => {
      await pageMobile.locator(upsell.upsellBtnClose).click();
      await expect(pageMobile.locator(upsell.upsellRecommend).first()).toBeVisible();
    });

    await test.step(`Click Add to cart product F`, async () => {
      await pageMobile.locator(preProdF).click();
      await pageMobile.getByRole("button", { name: "M" }).click();
      await pageMobile.locator(preProdF).first().click();
      await expect(pageMobile.getByPlaceholder("Please fill out this field").first()).toBeHidden();
      await expect(pageMobile.locator(preProdF)).toBeHidden();
    });

    await test.step(`Chọn variant và click Add product E vào cart`, async () => {
      const itemInCart = await pageMobile.locator(".block-cart__badge span").innerText();
      await pageMobile.locator(upsell.prePurchaseBtnAddCart).first().click();
      await expect(pageMobile.locator(upsell.prePurchaseDialog)).toBeHidden();
      await await expect(pageMobile.locator(".block-cart__badge span")).toHaveText("" + (Number(itemInCart) + 1));
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_15 Check hiển thị offer ngoài SF`, async ({ page, conf }) => {
    await test.step(`Trong dashboard app Upsell -> Settings:
- Turn off smart upsell`, async () => {
      const smartUpsell = Object.assign({}, suiteConf.data.smart_up_sell, { enable: false });
      await appsAPI.changeCTABtnSettings({ smart_up_sell: smartUpsell });
    });

    await test.step(`Ngoài SF, mở product 1 và add product vào cart`, async () => {
      await Promise.all([
        await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        await upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();
    });

    await test.step(`Trong dashboard app Upsell -> Settings:
- Turn on smart upsell
- Chọn option Is one of these product > All products
- Offer discount = OFF
- Chọn rule: Best seller same collection > Same collection > Same tag > Title similarity
- Chọn hiển thị 4 product`, async () => {
      await appsAPI.changeCTABtnSettings({ smart_up_sell: suiteConf.data.smart_up_sell });
    });

    await test.step(`Ngoài SF, mở product 1 và add product vào cart`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);

      await Promise.all([
        page.locator(upsell.ctaButtonPrePurchase).click(),
        upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
      ]);

      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();
      await waitForImageLoaded(page, upsell.prePurchaseDialog);

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      expect(countRecommendProduct).toEqual(caseConf.expect.smart_offer_rule_1.product_count);
      for (let i = 0; i < countRecommendProduct; i++) {
        const priceNoDiscount = await page.locator(upsell.priceProduct).nth(i).innerText();
        expect(priceNoDiscount).toEqual(caseConf.expect.smart_offer_rule_1.price);
      }
    });

    await test.step(`Add product bất kì trong popup pre purchase`, async () => {
      await Promise.all([
        page.locator(upsell.prePurchaseBtnAddCart).first().click(),
        upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
      ]);

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      expect(countRecommendProduct).toEqual(caseConf.expect.smart_offer_rule_1.product_count);
      priceAfterAddCart = await page.locator(upsell.prePurchaseCartPrice).innerText();
      expect(priceAfterAddCart).toEqual(caseConf.expect.smart_offer_rule_1.amount);
    });

    await test.step(`Trong dashboard app Upsell -> Settings:
- Turn on smart upsell
- Chọn option Is one of these product > Manually selected products > product 2
- Offer discount = 50%
- Chọn rule: Best seller same collection > Same collection > Same tag > Title similarity > Same type > Same product vender > Lowest price
- Chọn hiển thị 2 product`, async () => {
      const smartUpSell = Object.assign({}, suiteConf.data.smart_up_sell, {
        discount_enable: true,
        compare: "in",
        discount_percentage: caseConf.data.smart_up_sell[0].discount_percentage,
        enable: true,
        max_product: caseConf.data.smart_up_sell[0].max_product,
        product_ref_ids: [productIds[1]],
        type: "manual",
        selected_product_rule: {
          lower_price: true,
          max_product: caseConf.data.smart_up_sell[0].max_product,
          same_collection: true,
          same_product: true,
          same_tag: true,
          same_type: true,
        },
      });
      await appsAPI.changeCTABtnSettings({ smart_up_sell: smartUpSell });
    });

    await test.step(`Ngoài SF, mở product 1 và add product vào cart`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();
    });

    await test.step(`Ngoài SF, mở product 2 và add product vào cart`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[1]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);

      await Promise.all([
        page.locator(upsell.ctaButtonPrePurchase).click(),
        upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
      ]);
      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();
      await waitForImageLoaded(page, upsell.prePurchaseDialog);

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      expect(countRecommendProduct).toEqual(caseConf.expect.smart_offer_rule_2.product_count);
      for (let i = 0; i < countRecommendProduct; i++) {
        const priceWithDiscount = await page.locator(upsell.priceProduct).nth(i).innerText();
        expect(priceWithDiscount).toEqual(caseConf.expect.smart_offer_rule_2.price);
      }
    });

    await test.step(`Add product bất kì trong popup pre purchase`, async () => {
      const productRecommendCount = await page.locator(upsell.upsellRecommend).count();
      await Promise.all([
        page.locator(upsell.prePurchaseBtnAddCart).first().click(),
        upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
      ]);

      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();
      await expect(page.locator(upsell.upsellRecommend).first()).toBeVisible();
      expect(await page.locator(upsell.upsellRecommend).count()).toEqual(productRecommendCount - 1);
      priceAfterAddCart = await page.locator(upsell.prePurchaseCartPrice).innerText();
      expect(priceAfterAddCart).toEqual(caseConf.expect.smart_offer_rule_2.amount);
    });

    await test.step(`Trong dashboard app Upsell -> Settings:
- Turn on smart upsell
- Chọn option Is not one of these product > product 2
- Offer discount = OFF
- Chọn rule: Bỏ chọn all rule
- Chọn hiển thị 8 product`, async () => {
      const smartUpSell = Object.assign({}, conf.suiteConf.data.smart_up_sell, {
        discount_enable: false,
        compare: "not_in",
        enable: true,
        max_product: caseConf.data.smart_up_sell[1].max_product,
        product_ref_ids: [productIds[1]],
        type: "manual",
        product_rule: [
          {
            enable: false,
            key: "same_collection",
          },
          {
            enable: true,
            key: "same_tag",
          },
          {
            enable: true,
            key: "title_similarity",
          },
          {
            enable: true,
            key: "best_seller_same_collection",
          },
          {
            enable: true,
            key: "same_type",
          },
          {
            enable: false,
            key: "same_product",
          },
          {
            enable: true,
            key: "lower_price",
          },
        ],
        selected_product_rule: {
          lower_price: true,
          max_product: caseConf.data.smart_up_sell.max_product,
          same_collection: true,
          same_product: true,
          same_tag: true,
          same_type: true,
        },
      });
      await appsAPI.changeCTABtnSettings({ smart_up_sell: smartUpSell });
    });

    await test.step(`Ngoài SF, mở product 2 và add product vào cart`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[1]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();

      await page.waitForURL(/\/cart/);
      await page.locator(quantityB).fill(caseConf.data.fill_input);
      await page.waitForResponse(
        response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
      );
      await page.waitForLoadState("networkidle");
      await expect(page.locator(quantityB)).toBeHidden();
    });

    await test.step(`Ngoài SF, mở product 1 và add product vào cart`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);

      await Promise.all([
        page.locator(upsell.ctaButtonPrePurchase).click(),
        upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
      ]);
      await expect(page.locator(upsell.prePurchaseDialog)).toBeVisible();
      await waitForImageLoaded(page, upsell.prePurchaseDialog);

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      expect(countRecommendProduct).toEqual(caseConf.expect.smart_offer_rule_3.product_count);
      for (let i = 0; i < countRecommendProduct; i++) {
        const priceNoDiscount = await page.locator(upsell.priceProduct).nth(i).innerText();
        expect(priceNoDiscount).toEqual(caseConf.expect.smart_offer_rule_3.price);
      }
    });

    await test.step(`Add product bất kì trong popup pre purchase`, async () => {
      await Promise.all([
        page.locator(upsell.prePurchaseBtnAddCart).nth(1).click(),
        upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
      ]);

      countRecommendProduct = await page.locator(upsell.upsellRecommend).count();
      expect(countRecommendProduct).toEqual(caseConf.expect.smart_offer_rule_3.product_count);
      priceAfterAddCart = await page.locator(upsell.prePurchaseCartPrice).innerText();
      expect(priceAfterAddCart).toEqual(caseConf.expect.smart_offer_rule_3.amount);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_16 Check không hiển thị offer ngoài SF`, async ({ page }) => {
    await test.step(`Trong dashboard app Upsell -> Settings:
- Turn off smart upsell`, async () => {
      await appsAPI.changeCTABtnSettings({
        smart_up_sell: Object.assign({}, suiteConf.data.smart_up_sell, { enabel: false }),
      });
    });

    await test.step(`Ngoài SF, mở product 1 và add product vào cart`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();
    });

    await test.step(`Trong dashboard app Upsell -> Settings:
- Turn on smart upsell`, async () => {
      await appsAPI.changeCTABtnSettings({ smart_up_sell: suiteConf.data.smart_up_sell });
    });

    await test.step(`Ngoài SF, mở product 1 và add product vào cart`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[1]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_17 Check hiển thị offer ngoài SF khi setting đồng thời smart offer + offer pre purchase`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Turn on app usell, create offer`, async () => {
      const smartUpsell = Object.assign({}, suiteConf.data.smart_up_sell, caseConf.data.smart_up_sell);
      await appsAPI.changeCTABtnSettings({ smart_up_sell: smartUpsell });
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_type: "product",
          target_type: "product",
          recommend_ids: [productIds[1], productIds[2]],
          target_ids: [productIds[0]],
          enable_discount: false,
        }),
      );
    });

    await test.step(`Ngoài SF, mở product 1 và add product vào cart`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await expect(await page.locator(upsell.upsellRecommend).count()).toEqual(2);
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseDialog,
        snapshotName: caseConf.snapshots.popup_pre_purchase_has_2_products_off_discount,
      });
    });

    await test.step(`Add product 2 bất kì vào cart`, async () => {
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      // cart recommend has 4 product random by smart upsell
      await expect(await page.locator(upsell.upsellRecommend).count()).toEqual(conf.caseConf.data.product_count);
      await waitForImageLoaded(page, upsell.prePurchaseCart);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseCart,
        snapshotName: caseConf.snapshots.popup_pre_purchase_cart_after_add_product_on_discount,
      });
    });

    await test.step(`Add product bất kì trong popup pre purchase`, async () => {
      await page.locator(upsell.prePurchaseBtnAddCart).first().click();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      await page.waitForLoadState("load");
      await page.waitForResponse(
        response => response.url().includes("/api/offers/cart-recommend.json") && response.status() === 200,
      );
      await expect(await page.locator(upsell.upsellRecommend).count()).toEqual(conf.caseConf.data.product_count);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_07 Check recommend product với các product đặc biệt`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    const recommendIds = productIds.slice(8);
    const preProdI = upsell.prePurchaseAddCartBtnByProductName(productTitles[8]);
    const preProdJ = upsell.prePurchaseAddCartBtnByProductName(productTitles[9]);
    const preProdL = upsell.prePurchaseAddCartBtnByProductName(productTitles[10]);
    const preProdM = upsell.prePurchaseAddCartBtnByProductName(productTitles[11]);
    const customOptionI = upsell.selectCustomOptionByProductName(productTitles[8]);
    const customOptionJ = upsell.selectCustomOptionByProductName(productTitles[9]);
    const customOptionL = upsell.selectCustomOptionByProductName(productTitles[10]);
    const customOptionM = upsell.selectCustomOptionByProductName(productTitles[11]);

    await test.step(`Turn on app usell, create offer`, async () => {
      const smartUpsell = Object.assign({}, suiteConf.data.smart_up_sell, caseConf.data.smart_up_sell);
      await appsAPI.changeCTABtnSettings({ smart_up_sell: smartUpsell });
      //Create offer with 4 product recommends
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_ids: recommendIds,
        }),
      );
    });

    await test.step(`Click CTA button tại product F`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[5]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      expect(await page.locator(upsell.upsellRecommend).count()).toEqual(caseConf.data.product_count[0]);
      await expect(page.locator(customOptionI)).toBeHidden();
      await expect(page.locator(customOptionJ)).toBeVisible();
      await expect(page.locator(customOptionL)).toBeVisible();
      await expect(page.locator(customOptionM)).toBeHidden();
    });

    await test.step(`Click add product I vào cart`, async () => {
      await page.locator(preProdI).click();
      await expect(page.locator(preProdI)).toBeHidden();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
      expect(await page.locator(upsell.upsellRecommend).count()).toEqual(caseConf.data.product_count[1]);
      await waitForImageLoaded(page, upsell.prePurchaseCart);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseCart,
        snapshotName: caseConf.snapshots.cart_after_add_1_product_pre_purchase,
      });
    });

    await test.step(`Click select custom option textlink tại product J`, async () => {
      await page.locator(customOptionJ).click();
      await expect(page.getByText("Hide custom option").first()).toBeVisible();
    });

    await test.step(`Click Hide custom option tại product J`, async () => {
      await page.locator(upsell.hideCustomOptionByProductName(productTitles[9])).click();
      await expect(page.getByText("Select custom option").first()).toBeVisible();
    });

    await test.step(`Click add product J vào cart mà chưa điền custom option`, async () => {
      await page.locator(preProdJ).click();
      await expect(page.getByText("Please finish this field").first()).toBeVisible();
      await expect(page.locator(preProdJ)).toBeVisible();
      await expect(page.getByPlaceholder("Please fill out this field").first()).toBeVisible();
    });

    await test.step(`Điền đầy đủ custom option cho product J`, async () => {
      await page.locator(upsell.inputCustomOptionByProductName(productTitles[9])).fill(caseConf.data.custom_option);
      await expect(page.getByText("Please finish this field").first()).toBeHidden();
    });

    await test.step(`Add product J vào cart`, async () => {
      await page.locator(preProdJ).click();
      await expect(page.locator(preProdJ)).toBeHidden();
      await page.locator(upsell.prePurchaseBtnAddCart).first().isEnabled();
    });

    await test.step(`Không điền custom option mà lick add product L vào cart`, async () => {
      await page.locator(preProdL).click();
      await expect(page.locator(preProdL)).toBeHidden();
      expect(await page.locator(upsell.upsellRecommend).count()).toEqual(conf.caseConf.data.product_count[2]);
      await snapshotFixture.verify({
        page: page,
        selector: upsell.prePurchaseCart,
        snapshotName: caseConf.snapshots.cart_after_add_3_products_pre_purchase,
      });
    });

    await test.step(`Add product M vào cart`, async () => {
      await page.locator(preProdM).click();
      await expect(page.locator(upsell.prePurchaseDialog)).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_14 Check setting default select variant work với pre-purchase`, async ({
    page,
    snapshotFixture,
    builder,
  }) => {
    const recommendIds = productIds.slice(2, 5);

    await test.step(`Setting not default select variant trong website setting and Click CTA button tại product A`, async () => {
      //Create offer with 3 product recommends
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_ids: recommendIds,
        }),
      );

      set = Object.assign({}, settingsData, caseConf.data);
      await builder.updateSiteBuilder(suiteConf.theme_id, set);
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: upsell.prePurchaseByProductName("product E"),
        snapshotName: caseConf.snapshots.pre_purchase_when_setting_not_default_select,
      });

      await test.step(`Setting default select variant trong website setting and Click CTA button tại product A`, async () => {
        set = Object.assign({}, settingsData, suiteConf.settings_theme);
        await builder.updateSiteBuilder(suiteConf.theme_id, set);
        await Promise.all([
          page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
          upsell.waitResponseWithUrl("/api/offers/list.json"),
        ]);
        await page.locator(upsell.ctaButtonPrePurchase).click();
        await page.locator(upsell.prePurchaseDialog).isVisible();
        await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
        await waitForImageLoaded(page, upsell.prePurchaseDialog);
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: upsell.prePurchaseByProductName("product E"),
          snapshotName: caseConf.snapshots.pre_purchase_when_setting_default_select,
        });
      });
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_18 Check redirect khi setting Call-to-Action Pre-purchase Offers`, async ({
    page,
    builder,
  }) => {
    await test.step(`Trong dashboard app Upsell -> Settings: Call-to-Action Pre-purchase Offers = Go to checkout`, async () => {
      //Create offer with B is product recommend
      await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_ids: [productIds[1]],
        }),
      );
      await appsAPI.changeCTABtnSettings(caseConf.data[1]);
    });

    await test.step(`Ngoài SF, add product A vào cart and add product pre-purchase B, verify điều hướng đến checkout page`, async () => {
      await Promise.all([
        page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`),
        upsell.waitResponseWithUrl("/api/offers/list.json"),
      ]);
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.waitForURL(/\/checkouts/);
      await expect(page.getByText("Shipping address").first()).toBeVisible();
      await upsell.clearCachePage();
    });

    await test.step(`Trong dashboard app Upsell -> Settings: Call-to-Action Pre-purchase Offers = Go to cart page.
    Ngoài SF, add product A vào cart and add product pre-purchase B, verify điều hướng đến cart page`, async () => {
      await appsAPI.changeCTABtnSettings(caseConf.data[0]);
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.waitForURL(/\/cart/);
      await expect(page.getByText("Your cart").first()).toBeVisible();
      await upsell.clearCachePage();
    });

    await test.step(`Trong dashboard app Upsell -> Settings: Call-to-Action Pre-purchase Offers = Continue shopping,
    Customize Website builder với setting cart = Go to cart page
    Ngoài SF, add product A vào cart and add product pre-purchase B`, async () => {
      await appsAPI.changeCTABtnSettings(caseConf.data[2]);
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.waitForURL(/\/cart/);
      await expect(page.getByText("Your cart").first()).toBeVisible();
      await upsell.clearCachePage();
    });

    await test.step(`Trong dashboard app Upsell -> Settings: Call-to-Action Pre-purchase Offers = Continue shopping,
    Customize Website builder với setting cart = Open cart drawer
    Ngoài SF, add product A vào cart and add product pre-purchase B`, async () => {
      set = Object.assign({}, settingsData, caseConf.settings_theme);
      await builder.updateSiteBuilder(suiteConf.theme_id, set);
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await expect(page.locator(upsell.insideCartDrawer)).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PRP_13 Check performance của offer pre-purchase`, async ({ page }) => {
    test.slow();
    const checkout = new SFCheckout(page, suiteConf.domain);
    const data = caseConf.checkout;
    let idOffer, res;

    await test.step(`Tạo và mở offer pre-purchase trong dashboard`, async () => {
      //Create offer with B is product recommend
      const response = await appsAPI.createNewUpsellOffer(
        Object.assign({}, suiteConf.data.pre_purchase_offer, {
          recommend_ids: [productIds[1]],
        }),
      );
      idOffer = response.id;
    });

    await test.step(`Ngoài SF, add product A vào cart and add product pre-purchase B`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[0]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");

      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
    });

    await test.step(`checkout order`, async () => {
      await page.waitForURL(/\/cart/);
      await page.getByRole("link", { name: "CHECKOUT" }).click();

      await expect(page.getByText("Shipping address").first()).toBeVisible();
      await expect(page.locator(checkout.xpathProductCart).first()).toBeVisible();
      await checkout.fillCheckoutInfo(
        data.email,
        data.first_name,
        data.last_name,
        data.address,
        data.city,
        data.state,
        data.zip,
        data.country,
        data.phone,
        false,
      );
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.inputCardInfoAndCompleteOrder(data.test_card, data.card_holder, data.expired_date, data.cvv);
      await expect(page.getByText("Thank you!").first()).toBeVisible();
    });

    await test.step(`Verify performance của offer`, async () => {
      await expect(async () => {
        res = await appsAPI.getPerformanceOffer(idOffer);
        expect(res).toEqual(caseConf.data[0]);
      }).toPass({ intervals: [1000], timeout: 120_000 });
    });

    await test.step(`Click CTA button ở product D -> Add product B từ pre-purchase vào cart`, async () => {
      await page.goto(`https://${suiteConf.domain}/products/${productHandles[3]}`);
      await upsell.waitResponseWithUrl("/api/offers/list.json");
      await page.waitForLoadState("networkidle");
      await page.locator(upsell.ctaButtonPrePurchase).click();
      await page.locator(upsell.prePurchaseDialog).isVisible();
      await page.locator(upsell.prePurchaseFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(page, upsell.prePurchaseDialog);
      await page.locator(preProdB).click();
      await expect(page.locator(preProdB)).toBeHidden();
    });

    await test.step(`checkout order`, async () => {
      await page.waitForURL(/\/cart/);
      await expect(page.getByText("Your cart").first()).toBeVisible();
      await page.getByRole("link", { name: "CHECKOUT" }).click();

      await expect(page.getByText("Shipping address").first()).toBeVisible();
      await expect(page.locator(checkout.xpathProductCart).first()).toBeVisible();
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.inputCardInfoAndCompleteOrder(data.test_card, data.card_holder, data.expired_date, data.cvv);
      await expect(page.getByText("Thank you!").first()).toBeVisible();
    });

    await test.step(`Verify performance của offer`, async () => {
      await expect(async () => {
        res = await appsAPI.getPerformanceOffer(idOffer);
        expect(res).toEqual(caseConf.data[1]);
      }).toPass({ intervals: [1000], timeout: 120_000 });
    });
  });
});
