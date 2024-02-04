import { expect } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { test } from "@fixtures/upsell_offers";
import { AppsAPI } from "@pages/api/apps";
import { SFProduct } from "@pages/storefront/product";
import { snapshotDir, waitSelector } from "@core/utils/theme";

test.describe("Quantity discounts theme inside", async () => {
  let domain: string;
  let dashboardPage: DashboardPage;
  let productPage: ProductPage;
  let productSTF: SFProduct;
  let caseConf;

  test.beforeEach(async ({ conf, dashboard, page }, testInfo) => {
    domain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, domain);
    productSTF = new SFProduct(page, domain);
    caseConf = conf.caseConf;
    productPage = new ProductPage(dashboard, domain);
    await dashboardPage.goto(`/admin/products/${conf.suiteConf.product_id}`);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test.afterEach(async ({ authRequest, conf }) => {
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
      await appsAPI.deleteAllUpsellOffers(offerIds);
    });
  });

  test(`@SB_SF_CSQD_1 QTD in product - Create quantity discount in product admin`, async ({
    dashboard,
    page,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Tạo quantity discount trong product admin`, async () => {
      await productPage.genLoc(productPage.btnAddQttDiscounts).click();
      await productPage.createQttDiscounts(caseConf.offer_discount);
      await productPage.closePopupCreateOffer();
      await expect(dashboard.locator(productPage.xpathToastCreateOfferSuccess)).toBeVisible();
    });

    await test.step(`Check hiển thị offer trong app`, async () => {
      await dashboardPage.goto(`/admin/apps/boost-upsell/cross-sell/quantity-offer/list`);
      await expect(dashboard.locator(productPage.getXpathQttDiscounts(caseConf.offer_discount.name))).toBeVisible();
    });

    await test.step(`Check apply offer ngoài sf`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/products/${conf.suiteConf.product_name}`);
      await expect(page.locator(productSTF.xpathUpsellQttStf)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productSTF.xpathUpsellQttStf,
        snapshotName: caseConf.snapshot_name,
      });
    });
  });

  test(`@SB_SF_CSQD_2 QTD in product - Check hiển thị khi turn on/off quantity discount trong product admin`, async ({
    dashboard,
    conf,
    page,
    snapshotFixture,
  }) => {
    await test.step(`Pre condition: Tạo quantity discounts trong product admin`, async () => {
      await productPage.genLoc(productPage.btnAddQttDiscounts).click();
      await productPage.createQttDiscounts(caseConf.offer_discount);
      await productPage.closePopupCreateOffer();
      await expect(dashboard.locator(productPage.xpathToastCreateOfferSuccess)).toBeVisible();
    });

    await test.step(`Turn off quantity discount trong product admin`, async () => {
      await productPage.genLoc(productPage.editQttDiscounts).click();
      await productPage.genLoc(productPage.switchQttDiscounts).click();
      await expect(dashboard.locator(productPage.xpathToastDeactiveOfferSuccess)).toBeVisible();
    });

    await test.step(`Check hiển thị quantity discount trong app`, async () => {
      await dashboardPage.goto(`/admin/apps/boost-upsell/cross-sell/quantity-offer/list`);
      await expect(dashboardPage.genLoc(productPage.getXpathQttDiscounts(caseConf.offer_discount.name))).toBeVisible();
      const status = await dashboardPage.genLoc(productPage.statusOfferInApp).textContent();
      expect(status).toEqual("Inactive");
    });

    await test.step(`Check apply quantity discount ngoài sf`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/products/${conf.suiteConf.product_name}`);
      await expect(page.locator(productSTF.xpathUpsellQttStf)).toBeHidden();
    });

    await test.step(`Turn on quantity discount trong product admin`, async () => {
      await dashboardPage.goto(`/admin/products/${conf.suiteConf.product_id}`);
      await productPage.genLoc(productPage.editQttDiscounts).click();
      await productPage.genLoc(productPage.switchQttDiscounts).click();
      await expect(dashboard.locator(productPage.xpathToastActiveOfferSuccess)).toBeVisible();
    });

    await test.step(`Check hiển thị quantity discount trong app`, async () => {
      await dashboardPage.goto(`/admin/apps/boost-upsell/cross-sell/quantity-offer/list`);
      await expect(dashboard.locator(productPage.getXpathQttDiscounts(caseConf.offer_discount.name))).toBeVisible();
      const status = await dashboardPage.genLoc(productPage.statusOfferInApp).textContent();
      expect(status).toEqual("Active");
    });

    await test.step(`Check apply quantity discount ngoài sf`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/products/${conf.suiteConf.product_name}`);
      await expect(page.locator(productSTF.xpathUpsellQttStf)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productSTF.xpathUpsellQttStf,
        snapshotName: caseConf.snapshot_name,
      });
    });
  });

  test(`@SB_SF_CSQD_3 QTD in product - Check update thông tin của quantity discount`, async ({
    dashboard,
    conf,
    page,
  }) => {
    const combo = caseConf.new_offer_discount.qtt_discount.length;
    const newOffer = caseConf.new_offer_discount;
    await test.step(`Pre condition: Tạo quantity discounts trong product admin`, async () => {
      await productPage.genLoc(productPage.btnAddQttDiscounts).click();
      await productPage.createQttDiscounts(caseConf.offer_discount);
      await productPage.closePopupCreateOffer();
      await expect(dashboard.locator(productPage.xpathToastCreateOfferSuccess)).toBeVisible();
    });

    await test.step(`Edit thông tin offer name/offer message/discount/products của quantity discount trong product admin`, async () => {
      await productPage.genLoc(productPage.editQttDiscounts).click();
      await productPage.genLoc(productPage.offerNameInPopup).click();
      await productPage.updateQttDiscounts(newOffer);
      await expect(dashboard.locator(productPage.xpathToastUpdateSuccess)).toBeVisible();
    });

    await test.step(`Check hiển thị quantity discount trong app`, async () => {
      await dashboardPage.goto(`/admin/apps/boost-upsell/cross-sell/quantity-offer/list`);
      await expect(dashboard.locator(productPage.getXpathQttDiscounts(newOffer.name))).toBeVisible();
      await dashboardPage.genLoc(productPage.getXpathQttDiscounts(newOffer.name)).click();
      const inputValue = await dashboard.locator(productPage.msgOfferDashboard).inputValue();
      expect(inputValue).toEqual(newOffer.message);

      for (let i = 0; i < combo; i++) {
        const minqttExpect = newOffer.qtt_discount[i].minqtt.toString();
        const minqtt = await dashboard.locator(productPage.getXpathMinQttDiscounts(i)).inputValue();
        expect(minqtt).toEqual(minqttExpect);
        const discountExpect = newOffer.qtt_discount[i].discount.toString();
        const discount = await dashboard.locator(productPage.getXpathValueDiscountQttDiscounts(i)).inputValue();
        expect(discount).toEqual(discountExpect);
      }
    });

    await test.step(`Check apply quantity discount ngoài sf`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/products/${conf.suiteConf.product_name}`);
      await expect(page.locator(productSTF.msgQttDiscountsStf)).toBeVisible();
      const newMsg = await page.locator(productSTF.msgQttDiscountsStf).textContent();
      expect(newMsg).toEqual(newOffer.message);
      const count = await page.locator(productSTF.offerQttDicountsStf).count();
      for (let i = 0; i < count; i++) {
        const offer = await page.locator(productSTF.offerQttDicountsStf).nth(i).innerText();
        const minqtt = offer.split(" ")[0];
        const value = offer.split("get")[1]?.split("%")[0]?.trim() || "";
        const minqttExpect = newOffer.qtt_discount[i].minqtt.toString();
        const discountExpect = newOffer.qtt_discount[i].discount.toString();
        expect(minqtt).toEqual(minqttExpect);
        expect(value).toEqual(discountExpect);
      }
    });
  });

  test(`@SB_SF_CSQD_7 Check offer quantity discount với all product`, async ({
    dashboard,
    conf,
    page,
    snapshotFixture,
  }) => {
    const offerDiscount = caseConf.offer_discount;
    await test.step(`Tạo offer quantity discount với: Min quantity 1 -> % salse each on productMin quantity 2 -> $ salse each on productMin quantity 3 -> $ on each product`, async () => {
      await productPage.genLoc(productPage.btnAddQttDiscounts).click();
      await productPage.createQttDiscounts(offerDiscount);
      await productPage.closePopupCreateOffer();
      await expect(dashboard.locator(productPage.xpathToastCreateOfferSuccess)).toBeVisible();
    });

    await test.step(`Mở product bất kì ngoài SF`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/products/${conf.suiteConf.product_name}`);
      await expect(page.locator(productSTF.xpathUpsellQttStf)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productSTF.xpathUpsellQttStf,
        snapshotName: caseConf.snapshot_name,
      });
    });

    await test.step(`Add 1 product vào cart`, async () => {
      await productSTF.addProductToCart();
      const discountInCart = await productSTF.getDiscountInCart();
      const priceInCart = await productSTF.genLoc(productSTF.constDiscountInCart).innerText();
      const priceProduct = parseFloat(priceInCart.replace("$", "").replace(",", ""));
      const discount = Math.round((priceProduct * offerDiscount.qtt_discount[0].discount) / 100);
      expect(discount).toEqual(discountInCart);
    });

    await test.step(`Add 2 product vào cart`, async () => {
      await productSTF.genLoc(productSTF.increaseQtt).click();
      await waitSelector(page, productSTF.constDiscountInCart);
      const expectDiscount = Math.round(offerDiscount.qtt_discount[1].discount) * 2;
      await expect(page.locator(productSTF.discountInCart)).toContainText(expectDiscount.toLocaleString());
      const discountInCart = await productSTF.getDiscountInCart();
      expect(discountInCart).toEqual(expectDiscount);
    });

    await test.step(`Add 3 product vào cart`, async () => {
      await productSTF.genLoc(productSTF.increaseQtt).click();
      await waitSelector(page, productSTF.constDiscountInCart);
      const expectPrice = Math.round(offerDiscount.qtt_discount[2].discount) * 3;
      await expect(page.locator(productSTF.subTotal)).toContainText(expectPrice.toString());
      const subTotalInCart = await productSTF.genLoc(productSTF.subTotal).innerText();
      const subTotal = parseFloat(subTotalInCart.replace("$", "").replace(",", ""));
      expect(subTotal).toEqual(expectPrice);
    });
  });
});
