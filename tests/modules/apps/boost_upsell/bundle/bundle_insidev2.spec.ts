import { verifyRedirectUrl } from "@utils/theme";
import { test, expect } from "@fixtures/website_builder";
import { AppsAPI } from "@pages/api/apps";
import { ProductAPI } from "@pages/api/product";
import { BundleV2PageDB, BundleV2PageSF } from "@pages/dashboard/bundle_insidev2";
import { Page } from "@playwright/test";

import { CreateUpsellOffer, CreateNEProductResponse, CreateUpsellOfferResponse } from "@types";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFUpSellAPI } from "@pages/new_ecom/storefront/apps/upsell/cross-sell";

let productPage: Page,
  newPage: Page,
  checkoutPage: SFCheckout,
  app: AppsAPI,
  prodAPI: ProductAPI,
  prodA: CreateNEProductResponse,
  prodB: CreateNEProductResponse,
  prodC: CreateNEProductResponse,
  bundleOffer: CreateUpsellOffer,
  upsell: SFUpSellAPI,
  productsTitle: string[];
let bundleDB: BundleV2PageDB;
let bundleSF: BundleV2PageSF;
const productIds = [];

test.beforeAll(async ({ authRequest, conf, api }) => {
  prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
  app = new AppsAPI(conf.suiteConf.domain, authRequest);
  productsTitle = conf.suiteConf.products_title;
  upsell = new SFUpSellAPI(conf.suiteConf.domain, api, authRequest);

  await test.step("Pre-condition: Clear old product & Create product test", async () => {
    const listProducts = await prodAPI.getAllProduct(conf.suiteConf.domain);
    const preconditionProduct = ["product có custom option", "product có variant"];
    listProducts.forEach(prod => {
      if (!preconditionProduct.includes(prod.title)) {
        productIds.push(prod.id);
        return;
      }
    });
    if (productIds.length > 0) {
      await prodAPI.deleteProducts(productIds, conf.suiteConf.password);
    }
    const dataProdA = Object.assign({}, conf.suiteConf.product_data, { title: productsTitle[0] });
    prodA = await prodAPI.createNewProduct(dataProdA);
    const dataProdB = Object.assign({}, conf.suiteConf.product_data, { title: productsTitle[1] });
    prodB = await prodAPI.createNewProduct(dataProdB);
    const dataProdC = Object.assign({}, conf.suiteConf.product_data, { title: productsTitle[2] });
    prodC = await prodAPI.createNewProduct(dataProdC);
    productIds.push([prodA, prodB, prodC]);
  });
});

test.beforeEach(async () => {
  await test.step("Pre-condition: Clear bundle offer", async () => {
    const listOffer1 = await app.getListUpsellOffers();
    if (listOffer1.length > 0) {
      const offerIds = listOffer1.map(offer => offer.id);
      await app.deleteAllUpsellOffers(offerIds);
    }
  });
});

test.describe("Check bundle inside v2", () => {
  test("@SB_SF_CSB_01 Bundle in product - Bundle in product admin khi có discount", async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);

    // Pre-condition: Create offer"
    bundleOffer = Object.assign({}, conf.suiteConf.bundle_offer, {
      target_ids: [prodB.id, prodC.id],
    });
    await app.createNewUpsellOffer(bundleOffer);

    await test.step("Tạo bundle trong product admin có discount", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboard.locator(`//div[text()='${conf.caseConf.target_product}']`).click();

      await dashboard.locator(bundleDB.xpathCreateBundleButtonOnProductAdmin).click();
      await dashboard.locator(bundleDB.getAddProductButtonXpath(conf.caseConf.another_product)).click();
      await dashboard.locator(bundleDB.xpathContinueCreateBundle).click();

      await dashboard.locator(bundleDB.xpathTextBoxBundleName).click();
      await dashboard.locator(bundleDB.xpathTextBoxBundleName).fill(conf.caseConf.bundle_name);
      await dashboard.locator(bundleDB.xpathCheckboxDiscountOnProductAdmin).click();
      await dashboard.locator(bundleDB.xpathTextBoxDiscountOnProductAdmin).click();
      await dashboard.locator(bundleDB.xpathTextBoxDiscountOnProductAdmin).fill(conf.caseConf.offer_discount);
      await dashboard.locator(bundleDB.xpathCreateBundleButtonOnProductAdmin).last().click();

      await expect(dashboard.locator(bundleDB.selectorToastCreateBundleSuccess)).toBeVisible();
      await expect(dashboard.locator(bundleDB.selectorBundleNameOnEditPopupProductAdmin).first()).toHaveText(
        `${conf.caseConf.bundle_name}`,
      );
    });

    await test.step("Check hiển thị bundle trong app", async () => {
      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      await dashboard.waitForSelector(bundleDB.xpathBundleList);

      await dashboard.waitForSelector(
        `${bundleDB.selectorBundleNameOnListApp}:text-is('${conf.caseConf.bundle_name}')`,
      );
      await dashboard.waitForSelector(
        bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name, conf.caseConf.target_product),
      );
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: bundleDB.xpathBundleList,
        snapshotName: "01.verify_bundle_have_discount_onlist.png",
      });
    });

    await test.step("Check apply bundle ngoài sf", async () => {
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name, conf.caseConf.target_product),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('${conf.caseConf.target_product}')`,
      });
      await expect(productPage.locator(bundleSF.selectorBundleContentOnSF)).toBeVisible();

      newPage = await verifyRedirectUrl({
        page: productPage,
        selector: bundleSF.xpathAtcButtonOnSF,
        redirectUrl: `https://${conf.suiteConf.domain}/checkouts`,
        waitForElement: bundleSF.xpathDiscountLineOnCheckoutPage,
      });

      await expect(newPage.locator(bundleSF.xpathDiscountLineOnCheckoutPage)).toHaveText(conf.caseConf.total_discount);
    });
  });

  test("@SB_SF_CSB_02 Bundle in product - Bundle in product admin khi khong có discount", async ({
    dashboard,
    conf,
    context,
  }) => {
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);
    await test.step("Tạo bundle trong product admin khong có discount", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboard.locator(`//div[text()='${conf.caseConf.target_product}']`).click();

      await dashboard.locator(bundleDB.xpathCreateBundleButtonOnProductAdmin).click();
      await dashboard.locator(bundleDB.getAddProductButtonXpath(conf.caseConf.another_product)).click();
      await dashboard.locator(bundleDB.xpathContinueCreateBundle).click();

      await dashboard.locator(bundleDB.xpathTextBoxBundleName).click();
      await dashboard.locator(bundleDB.xpathTextBoxBundleName).fill(conf.caseConf.bundle_name);
      await dashboard.locator(bundleDB.xpathCreateBundleButtonOnProductAdmin).last().click();

      await expect(dashboard.locator(bundleDB.selectorToastCreateBundleSuccess)).toBeVisible();
      await expect(dashboard.locator(bundleDB.selectorBundleNameOnEditPopupProductAdmin).first()).toHaveText(
        `${conf.caseConf.bundle_name}`,
      );
    });

    await test.step("Check hiển thị bundle trong app", async () => {
      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      await dashboard.waitForSelector(bundleDB.xpathBundleList);

      await dashboard.waitForSelector(
        bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name, conf.caseConf.target_product),
      );
      await expect(dashboard.locator(bundleDB.selectorBundleNameOnListApp).first()).toHaveText(
        `${conf.caseConf.bundle_name}`,
      );
    });

    await test.step("Check apply bundle ngoài sf", async () => {
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name, conf.caseConf.target_product),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('${conf.caseConf.target_product}')`,
      });
      await expect(productPage.locator(bundleSF.selectorBundleContentOnSF)).toBeVisible();
      newPage = await verifyRedirectUrl({
        page: productPage,
        selector: bundleSF.xpathAtcButtonOnSF,
        redirectUrl: `https://${conf.suiteConf.domain}/checkouts`,
        waitForElement: bundleSF.xpathSubtotalLineOnCheckoutPage,
      });
      checkoutPage = new SFCheckout(newPage, conf.suiteConf.domain);
      await checkoutPage.countryLoc.click();
      await checkoutPage.genLoc(bundleSF.xpathCountryUK).click();
      await expect(newPage.locator(bundleSF.xpathTotalPrice)).toHaveText(conf.caseConf.total_no_discount);
    });
  });

  test("@SB_SF_CSB_03 Bundle in product admin khi tạo offer bomo", async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    let offer: CreateUpsellOfferResponse;
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);
    await test.step("Tạo offer bomo (tất cả product trong bundle giống nhau)", async () => {
      // Pre-condition: Create offer"
      bundleOffer = Object.assign({}, conf.suiteConf.bundle_offer, {
        target_ids: [prodA.id, prodB.id],
      });
      offer = await app.createNewUpsellOffer(bundleOffer);

      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      await bundleDB.page.locator(bundleDB.xpathCreateBundleButtonOnApp).click();
      await bundleDB.page.locator(bundleDB.xpathTextBoxBundleName).click();
      await bundleDB.page.locator(bundleDB.xpathTextBoxBundleName).fill(conf.caseConf.bundle_name);
      await bundleDB.page.locator(bundleDB.xpathSelectProductOnApp).click();
      await bundleDB.page.locator(bundleDB.getAddProductButtonXpath(conf.caseConf.target_product)).dblclick();

      await bundleDB.page.locator(bundleDB.xpathContinueCreateBundle).click();
      await bundleDB.page.locator(bundleDB.xpathSubmitBundlebuttonOnApp).click();

      await expect(bundleDB.page.locator(bundleDB.selectorToastCreateBundleSuccess)).toBeVisible();
      await expect(bundleDB.page.locator(bundleDB.selectorBundleNameOnListApp).first()).toHaveText(
        `${conf.caseConf.bundle_name}`,
      );
    });

    await test.step("Check hiển thị bundle trong app", async () => {
      await bundleDB.page.waitForSelector(bundleDB.selectorToastCreateBundleSuccess, { state: "hidden" });
      await bundleDB.page.waitForSelector(bundleDB.xpathBundleList);

      await expect(bundleDB.page.locator(bundleDB.xpathFirstBundleOnList)).toHaveText(conf.caseConf.bundle_name);
      await snapshotFixture.verifyWithAutoRetry({
        page: bundleDB.page,
        selector: bundleDB.xpathBundleList,
        snapshotName: "03.verify_bundle_bomo_onlist.png",
      });
    });

    await test.step("Check apply bundle ngoài sf", async () => {
      await upsell.waitOfferUntilNotCache([prodA.id], [{ id: offer.id, offer_type: "bundle" }]);
      productPage = await verifyRedirectUrl({
        page: bundleDB.page,
        selector: bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name, conf.caseConf.target_product),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('${conf.caseConf.target_product}')`,
      });
      await productPage.waitForResponse(/theme.css/);
      await expect(productPage.locator(bundleSF.selectorBundleContentOnSF)).toBeVisible();

      newPage = await verifyRedirectUrl({
        page: productPage,
        selector: bundleSF.xpathAtcButtonOnSF,
        redirectUrl: `https://${conf.suiteConf.domain}/checkouts`,
        waitForElement: bundleSF.xpathSubtotalLineOnCheckoutPage,
      });

      await expect(newPage.locator(bundleSF.xpathSubtotalLineOnCheckoutPage)).toHaveText(conf.caseConf.total_price);
    });
  });

  test("@SB_SF_CSB_04 Bundle in product - Check hiển thị khi turn on/off bundle trong product admin", async ({
    dashboard,
    conf,
    context,
  }) => {
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);
    let offer: CreateUpsellOfferResponse;
    await test.step("Tạo bundle, check status default", async () => {
      // Pre-condition: Create offer"
      bundleOffer = Object.assign({}, conf.suiteConf.bundle_offer, {
        target_ids: [prodA.id, prodB.id, prodC.id],
      });
      offer = await app.createNewUpsellOffer(bundleOffer);

      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      await expect(
        dashboard.locator(bundleDB.getStatusBundleOnList(conf.suiteConf.bundle_offer.offer_name)),
      ).toHaveText("Active");
    });

    await test.step("Check apply bundle ngoài sf khi On status", async () => {
      await upsell.waitOfferUntilNotCache([prodA.id], [{ id: offer.id, offer_type: "bundle" }]);
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(
          conf.suiteConf.bundle_offer.offer_name,
          conf.caseConf.target_product,
        ),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('${conf.caseConf.target_product}')`,
      });

      await expect(productPage.locator(bundleSF.selectorBundleContentOnSF)).toBeVisible();
    });

    await test.step("Turn off bundle trong product admin", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboard.locator(`//div[text()='${conf.caseConf.target_product}']`).click();
      await dashboard.locator(bundleDB.xpathEditBundleButtonOnProductAdmin).click();

      await dashboard.locator(bundleDB.getToggleActiveBundleXpath(conf.suiteConf.bundle_offer.offer_name)).click();
      await expect(dashboard.locator(bundleDB.selectorToastDeactivatedBundleSuccess)).toBeVisible();
    });

    await test.step("Check hiển thị bundle trong app khi Off status", async () => {
      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      await expect(dashboard.locator(bundleDB.selectorBundleStatusOnApp)).toHaveText("Inactive");
    });

    await test.step("Check apply bundle ngoài sf khi Off status", async () => {
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(
          conf.suiteConf.bundle_offer.offer_name,
          conf.caseConf.target_product,
        ),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('${conf.caseConf.target_product}')`,
      });

      await expect(productPage.locator(bundleSF.selectorBundleContentOnSF)).toBeHidden();
    });
  });

  test("@SB_SF_CSB_05 Bundle in product - Check update thông tin của bundle", async ({
    conf,
    dashboard,
    snapshotFixture,
    context,
  }) => {
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);
    await test.step("Edit thông tin offer name/offer message/discount/products của bundle trong product admin", async () => {
      // Pre-condition: Create offer"
      bundleOffer = Object.assign({}, conf.suiteConf.bundle_offer, {
        target_ids: [prodA.id, prodB.id],
      });
      await app.createNewUpsellOffer(bundleOffer);

      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboard.locator(`//div[text()='${conf.caseConf.target_product}']`).click();
      await dashboard.locator(bundleDB.xpathEditBundleButtonOnProductAdmin).click();
      await dashboard
        .locator(
          `${bundleDB.selectorBundleNameOnEditPopupProductAdmin}:text-is("${conf.suiteConf.bundle_offer.offer_name}")`,
        )
        .click();

      await dashboard.locator(bundleDB.xpathTextBoxBundleName).click();
      await dashboard.locator(bundleDB.xpathTextBoxBundleName).fill(conf.caseConf.bundle_name_edit);
      await dashboard.locator(bundleDB.xpathTextBoxDiscountOnProductAdmin).click();
      await dashboard.locator(bundleDB.xpathTextBoxDiscountOnProductAdmin).fill(conf.caseConf.offer_discount_edit);
      await dashboard.locator(bundleDB.xpathMessageTextBoxOnProductAdmin).click();
      await dashboard.locator(bundleDB.xpathMessageTextBoxOnProductAdmin).fill(conf.caseConf.bundle_message_edit);
      await dashboard.locator(bundleDB.xpathSaveBundleButtonOnProductAdmin).last().click();

      await expect(dashboard.locator(bundleDB.selectorToastUpdateBundleSuccess)).toBeVisible();
    });

    await test.step("Check hiển thị bundle trong app", async () => {
      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      await dashboard.waitForResponse(/products.json/);
      await dashboard.waitForSelector(bundleDB.selectorToastUpdateBundleSuccess, { state: "hidden" });
      await dashboard.waitForSelector(bundleDB.xpathBundleList);
      await expect(dashboard.locator(bundleDB.xpathFirstBundleOnList)).toHaveText(conf.caseConf.bundle_name_edit);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: bundleDB.xpathBundleList,
        snapshotName: "05.edit_bundle.png",
      });
    });

    await test.step("Check apply bundle ngoài sf", async () => {
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name_edit, conf.caseConf.target_product),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('${conf.caseConf.target_product}')`,
      });

      await expect(productPage.locator(".bundle__offer-heading")).toHaveText(conf.caseConf.bundle_message_edit);

      newPage = await verifyRedirectUrl({
        page: productPage,
        selector: bundleSF.xpathAtcButtonOnSF,
        redirectUrl: `https://${conf.suiteConf.domain}/checkouts`,
        waitForElement: bundleSF.xpathDiscountLineOnCheckoutPage,
      });

      await expect(newPage.locator(bundleSF.xpathDiscountLineOnCheckoutPage)).toHaveText(conf.caseConf.total_discount);
    });
  });

  test("@SB_SF_CSB_07 Bundle in product - Check tạo bundle trong app", async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);
    let offers;
    await test.step("Tạo bundle trong app", async () => {
      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      await dashboard.locator(bundleDB.xpathCreateBundleButtonOnApp).click();
      await dashboard.locator(bundleDB.xpathTextBoxBundleName).click();
      await dashboard.locator(bundleDB.xpathTextBoxBundleName).fill(conf.caseConf.bundle_name);
      await dashboard.locator(bundleDB.xpathSelectProductOnApp).click();
      await bundleDB.page.locator(bundleDB.getAddProductButtonXpath(conf.caseConf.target_product)).click();
      await bundleDB.page.locator(bundleDB.getAddProductButtonXpath(conf.caseConf.another_product)).click();
      await dashboard.locator(bundleDB.xpathContinueCreateBundle).click();
      await dashboard.locator(bundleDB.xpathSubmitBundlebuttonOnApp).click();
      await expect(dashboard.locator(bundleDB.selectorToastCreateBundleSuccess)).toBeVisible();
      offers = await app.getListUpsellOffers();
    });

    await test.step("Check hiển thị bundle trong product admin", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboard.locator(`//div[text()='${conf.caseConf.target_product}']`).click();

      await dashboard.locator(bundleDB.xpathEditBundleButtonOnProductAdmin).click();
      await dashboard.waitForSelector(
        `${bundleDB.selectorBundleNameOnEditPopupProductAdmin}:text-is("${conf.caseConf.bundle_name}")`,
      );
      await dashboard.waitForSelector(
        bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name, conf.caseConf.target_product),
      );
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: ".s-animation-content",
        snapshotName: "07.popup_edit_bundle.png",
      });
    });

    await test.step("Check hiển thị bunlde ngoài sf", async () => {
      const offer = offers.find(o => o.offer_name === conf.caseConf.bundle_name);
      await upsell.waitOfferUntilNotCache([prodA.id], [{ id: offer.id, offer_type: "bundle" }]);
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name, conf.caseConf.target_product),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('${conf.caseConf.target_product}')`,
      });
      await expect(productPage.locator(bundleSF.selectorBundleContentOnSF)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: productPage,
        selector: bundleSF.selectorBundleContainOnSF,
        snapshotName: "07.bundle_on_SF.png",
      });

      newPage = await verifyRedirectUrl({
        page: productPage,
        selector: bundleSF.xpathAtcButtonOnSF,
        redirectUrl: `https://${conf.suiteConf.domain}/checkouts`,
        waitForElement: bundleSF.xpathSubtotalLineOnCheckoutPage,
      });

      await expect(newPage.locator(bundleSF.xpathSubtotalLineOnCheckoutPage)).toHaveText(conf.caseConf.total_price);
    });
  });

  test("@SB_SF_CSB_08 Bundle in product - Check edit bundle trong app", async ({
    conf,
    dashboard,
    context,
    snapshotFixture,
  }) => {
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);
    await test.step("Edit bundle trong app", async () => {
      // Pre-condition: Create offer"
      bundleOffer = Object.assign({}, conf.suiteConf.bundle_offer, {
        target_ids: [prodA.id, prodB.id],
      });
      await app.createNewUpsellOffer(bundleOffer);

      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      await dashboard.locator(bundleDB.xpathFirstBundleOnList).click();
      await dashboard.waitForSelector(bundleDB.xpathHeadingEditBundleTab);

      await dashboard.locator(bundleDB.xpathTextBoxBundleName).click();
      await dashboard.locator(bundleDB.xpathTextBoxBundleName).fill(conf.caseConf.bundle_name_edit);

      await dashboard.locator(bundleDB.xpathTextBoxBundleMessage).click();
      await dashboard.locator(bundleDB.xpathTextBoxBundleMessage).fill(conf.caseConf.bundle_message);

      await dashboard.locator(bundleDB.selectorDiscountTextBoxOnApp).click();
      await dashboard.locator(bundleDB.selectorDiscountTextBoxOnApp).fill(conf.caseConf.offer_discount);

      await dashboard.locator(bundleDB.xpathChangeProductOnAppXpath).click();
      await dashboard.locator(bundleDB.getAddProductButtonXpath(conf.caseConf.added_product)).click();

      await dashboard.locator(bundleDB.xpathContinueCreateBundle).click();
      await dashboard.locator(bundleDB.setTargetProductXpath(conf.caseConf.added_product)).click();

      await dashboard.locator(bundleDB.xpathSaveButton).click();
      await expect(dashboard.locator(bundleDB.selectorToastUpdateBundleSuccess)).toBeVisible();
    });

    await test.step("Check hiển thị bundle trong product admin", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboard.locator(`//div[text()='${conf.caseConf.added_product}']`).click();
      await dashboard.locator(bundleDB.xpathEditBundleButtonOnProductAdmin).click();

      await expect(dashboard.locator(bundleDB.selectorBundleNameOnEditPopupProductAdmin).first()).toHaveText(
        `${conf.caseConf.bundle_name_edit}`,
      );
      await expect(
        dashboard.locator(
          `${bundleDB.selectorBundleNameOnEditPopupProductAdmin}:text-is('${conf.caseConf.bundle_name_edit}')`,
        ),
      ).toBeVisible();
      await expect(
        dashboard.locator(`//div[contains(., "${conf.caseConf.bundle_name_edit}")]/ancestor::tr//a`).last(),
      ).toHaveText(`${conf.caseConf.added_product}`);
    });

    await test.step("Check apply bundle ngoài sf", async () => {
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(conf.caseConf.bundle_name_edit, conf.caseConf.added_product),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('${conf.caseConf.added_product}')`,
      });
      await expect(productPage.locator(".bundle__offer-heading")).toHaveText(conf.caseConf.bundle_message);
      await productPage.waitForResponse(/theme.css/);
      await snapshotFixture.verifyWithAutoRetry({
        page: productPage,
        selector: bundleSF.selectorBundleContainOnSF,
        snapshotName: "08.bundle_on_SF.png",
      });

      newPage = await verifyRedirectUrl({
        page: productPage,
        selector: bundleSF.xpathAtcButtonOnSF,
        redirectUrl: `https://${conf.suiteConf.domain}/checkouts`,
        waitForElement: bundleSF.xpathDiscountLineOnCheckoutPage,
      });
      await expect(newPage.locator(bundleSF.xpathDiscountLineOnCheckoutPage)).toHaveText(conf.caseConf.total_discount);
    });
  });

  test("@SB_SF_CSB_10 Check bundle ngoài SF khi product không có custom option", async ({
    conf,
    dashboard,
    context,
  }) => {
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);
    await test.step("View product Y", async () => {
      // Pre-condition: Create offer"
      bundleOffer = Object.assign({}, conf.suiteConf.bundle_offer, {
        target_ids: [prodA.id, prodB.id, conf.suiteConf.product_have_variant],
      });
      await app.createNewUpsellOffer(bundleOffer);

      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(conf.suiteConf.bundle_offer.offer_name, "product có variant"),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('product có variant')`,
      });
    });

    await test.step("Chọn variant cho product Y", async () => {
      await productPage.locator(bundleSF.selectorVariantOnProductPage).click();
      await expect(productPage.locator(bundleSF.selectorTotalPriceOnProductPage)).toHaveText(
        `${conf.caseConf.total_price}`,
      );
    });

    await test.step("Click Add all to cart button tại bundle", async () => {
      newPage = await verifyRedirectUrl({
        page: productPage,
        selector: bundleSF.xpathAtcButtonOnSF,
        redirectUrl: `https://${conf.suiteConf.domain}/checkouts`,
        waitForElement: bundleSF.xpathSubtotalLineOnCheckoutPage,
      });
      checkoutPage = new SFCheckout(newPage, conf.suiteConf.domain);
      await checkoutPage.countryLoc.click();
      await newPage.locator(bundleSF.xpathCountryUK).click();
      await expect(newPage.locator(bundleSF.xpathTotalPrice)).toHaveText(conf.caseConf.total_price);
    });
  });

  test("@SB_SF_CSB_27 Check bundle ngoài SF khi product có custom option", async ({ conf, dashboard, context }) => {
    bundleDB = new BundleV2PageDB(dashboard, conf.suiteConf.domain);
    bundleSF = new BundleV2PageSF(dashboard, conf.suiteConf.domain);
    await test.step("View product có custom option", async () => {
      // Pre-condition: Create offer"
      bundleOffer = Object.assign({}, conf.suiteConf.bundle_offer, {
        target_ids: [prodA.id, prodB.id, conf.suiteConf.product_have_custom_option],
      });
      await app.createNewUpsellOffer(bundleOffer);

      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(conf.suiteConf.bundle_offer.offer_name, "product có custom option"),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('product có custom option')`,
      });
    });

    await test.step("Add all to cart bundle", async () => {
      await productPage.locator(bundleSF.xpathAtcButtonOnSF).click();
      await expect(productPage.locator(bundleSF.selectorBundlePopupOnProductPage)).toBeVisible();
    });

    await test.step("Click button Continue", async () => {
      await productPage.locator(bundleSF.selectorContinueButtonOnPopup).click();

      await expect(
        productPage.locator(`//div[text()="${conf.suiteConf.products_title[0]}"]/ancestor::div[3]`),
      ).not.toHaveAttribute("style", "display: none;");
      await expect(productPage.locator(".product-slide-image--active")).toBeVisible();
    });

    await test.step("Tiếp tục click Continue", async () => {
      await productPage.locator(bundleSF.selectorContinueButtonOnPopup).click();

      await expect(
        productPage.locator(`//div[text()="${conf.suiteConf.products_title[1]}"]/ancestor::div[3]`),
      ).not.toHaveAttribute("style", "display: none;");
      await expect(productPage.locator(`${bundleSF.xpathImageProductOnPopup}[2]//div[2]`)).toHaveAttribute(
        "class",
        "product-slide-image--saved",
      );
      await expect(productPage.locator("//div[contains(@class,'product-slide-image--saved')]//div")).toHaveAttribute(
        "class",
        "product-slide-image__check-icon",
      );
    });

    await test.step("Tiếp tục click Continue", async () => {
      await productPage.locator(bundleSF.selectorContinueButtonOnPopup).click();
      await productPage.waitForSelector(
        `${bundleSF.xpathImageProductOnPopup}[3]//div[@class='product-slide-image--saved']`,
      );

      await expect(
        productPage.locator('//div[text()="product có custom option"]/ancestor::div[3]'),
      ).not.toHaveAttribute("style", "display: none;");
      await expect(productPage.locator(bundleSF.selectorValidateMessOnPopup)).toHaveText(
        conf.caseConf.validate_message,
      );
    });

    await test.step("Custom option product có cutsom option trong popup và add all to cart", async () => {
      await productPage.locator(bundleSF.selectorCustomOptionTextArea).click();
      await productPage.locator(bundleSF.selectorCustomOptionTextArea).fill(`${conf.caseConf.fill_custom_option}`);

      newPage = await verifyRedirectUrl({
        page: productPage,
        selector: bundleSF.selectorAtcButtonOnPopup,
        redirectUrl: `https://${conf.suiteConf.domain}/checkouts`,
        waitForElement: bundleSF.xpathSubtotalLineOnCheckoutPage,
      });

      await expect(newPage.locator(bundleSF.xpathSubtotalLineOnCheckoutPage)).toHaveText(
        `${conf.caseConf.total_price}`,
      );
      await expect(newPage.locator(bundleSF.selectorCustomOptionOnCheckoutPage)).toHaveText(
        `${conf.caseConf.custom_option_name}: ${conf.caseConf.fill_custom_option}`,
      );
    });

    await test.step("Khi popup custom option của bundle được hiển thị , click close icon hoặc overlay", async () => {
      bundleDB.openBundleListPage(conf.suiteConf.domain, dashboard);
      productPage = await verifyRedirectUrl({
        page: dashboard,
        selector: bundleDB.getProductXpathInBundle(conf.suiteConf.bundle_offer.offer_name, "product có custom option"),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/products`,
        waitForElement: `${bundleSF.xpathProductNameOnProductPage}:text-is('product có custom option')`,
      });

      await productPage.waitForSelector(bundleSF.xpathAtcButtonOnSF);
      await productPage.locator(bundleSF.xpathAtcButtonOnSF).click();
      await productPage.waitForSelector(bundleSF.selectorBundlePopupOnProductPage);
      await productPage.locator(bundleSF.selectorContinueButtonOnPopup).click();
      await productPage.locator(bundleSF.selectorContinueButtonOnPopup).click();
      await productPage.locator(bundleSF.selectorClosePopup).click();

      productPage.on("dialog", dialog => expect(dialog.message()).toEqual(conf.caseConf.dialog_message));
      await productPage.close();
    });
  });
});
