import { test } from "@fixtures/upsell_offers";
import { ProductWidgets } from "@pages/apps/product_widgets";
import { SFHome } from "@sf_pages/homepage";
import { snapshotDir } from "@utils/theme";

test.describe("Product widget theme Inside", async () => {
  let productWidgets: ProductWidgets;
  let suiteConf;
  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    suiteConf = conf.suiteConf;
    productWidgets = new ProductWidgets(dashboard, suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test(`@SB_BUS_PW_8 Check hiển thị widget Products from the same collections`, async ({
    dashboard,
    conf,
    cConf,
    snapshotFixture,
  }) => {
    for (const setting of cConf.settings) {
      await test.step(`Change setting của widget (setting show on product page)`, async () => {
        await dashboard.goto(`https://${suiteConf.domain}/admin/apps/boost-upsell/cross-sell/product-widgets`);
        await productWidgets.switchToggleWidget(cConf.widget_title, cConf.isOn);
        const xpathCustomizeBtn = productWidgets.xpathCustomizeWidget.replace("widgetTitle", cConf.widget_title);
        await dashboard.locator(xpathCustomizeBtn).click();
        await productWidgets.changeSetting(setting);
        await productWidgets.clickSaveBtn();
      });

      await test.step(`Check hiển thị widget tại product page`, async () => {
        const storefront = new SFHome(dashboard, conf.suiteConf.domain);
        await storefront.gotoProductWithCollection(cConf.collection_handle, cConf.product_handle);
        await storefront.page.waitForLoadState("networkidle");

        await productWidgets.verifyProductWidgetVisibleCorrectly(
          conf.caseConf.widget_handle,
          setting,
          snapshotFixture,
          storefront.page,
        );
      });
    }
  });

  test(`@SB_BUS_PW_7 Check hiển thị widget Recently viewed & featured products`, async ({
    dashboard,
    conf,
    cConf,
    snapshotFixture,
  }) => {
    for (const setting of cConf.settings) {
      await test.step(`Change setting của widget (setting show on collection page)`, async () => {
        await dashboard.goto(`https://${suiteConf.domain}/admin/apps/boost-upsell/cross-sell/product-widgets`);
        await productWidgets.switchToggleWidget(cConf.widget_title, cConf.isOn);
        const xpathCustomizeBtn = productWidgets.xpathCustomizeWidget.replace("widgetTitle", cConf.widget_title);
        await dashboard.locator(xpathCustomizeBtn).click();
        await productWidgets.changeSetting(setting);
        await productWidgets.clickSaveBtn();
      });

      await test.step(`Ngoài SF check hiển thị widget tại Collection page`, async () => {
        const storefront = new SFHome(dashboard, conf.suiteConf.domain);
        await storefront.gotoCollection(cConf.collection_handle);
        await storefront.page.waitForLoadState("networkidle");

        await productWidgets.verifyProductWidgetVisibleCorrectly(
          conf.caseConf.widget_handle,
          setting,
          snapshotFixture,
          storefront.page,
        );
      });
    }
  });

  test(`@SB_BUS_PW_6 Check hiển thị widget Cart recommend`, async ({ dashboard, conf, cConf, snapshotFixture }) => {
    for (const setting of cConf.settings) {
      await test.step(`Change setting của widget (setting show on Cart page)`, async () => {
        await dashboard.goto(`https://${suiteConf.domain}/admin/apps/boost-upsell/cross-sell/product-widgets`);
        await productWidgets.switchToggleWidget(cConf.widget_title, cConf.isOn);
        const xpathCustomizeBtn = productWidgets.xpathCustomizeWidget.replace("widgetTitle", cConf.widget_title);
        await dashboard.locator(xpathCustomizeBtn).click();
        await productWidgets.changeSetting(setting);
        await productWidgets.clickSaveBtn();
      });

      await test.step(`Check hiển thị widget tại cart page`, async () => {
        const storefront = new SFHome(dashboard, conf.suiteConf.domain);
        await storefront.gotoCart();
        await storefront.page.waitForLoadState("networkidle");

        await productWidgets.verifyProductWidgetVisibleCorrectly(
          conf.caseConf.widget_handle,
          setting,
          snapshotFixture,
          storefront.page,
        );
      });
    }
  });

  test(`@SB_BUS_PW_5 Check hiển thị widget bought also bought`, async ({ dashboard, conf, cConf, snapshotFixture }) => {
    for (const setting of cConf.settings) {
      await test.step(`Change setting của widget (setting show on Product page)`, async () => {
        await dashboard.goto(`https://${suiteConf.domain}/admin/apps/boost-upsell/cross-sell/product-widgets`);
        await productWidgets.switchToggleWidget(cConf.widget_title, cConf.isOn);
        const xpathCustomizeBtn = productWidgets.xpathCustomizeWidget.replace("widgetTitle", cConf.widget_title);
        await dashboard.locator(xpathCustomizeBtn).click();
        await productWidgets.changeSetting(setting);
        await productWidgets.clickSaveBtn();
      });

      await test.step(`Check hiển thị widget tại product page`, async () => {
        const storefront = new SFHome(dashboard, conf.suiteConf.domain);
        await storefront.gotoProductDetail(cConf.product_handle);
        await storefront.page.waitForLoadState("networkidle");

        await productWidgets.verifyProductWidgetVisibleCorrectly(
          conf.caseConf.widget_handle,
          setting,
          snapshotFixture,
          storefront.page,
        );
      });
    }
  });

  test(`@SB_BUS_PW_4 Check hiển thị widget best seller`, async ({ dashboard, conf, cConf, snapshotFixture }) => {
    for (const setting of cConf.settings) {
      await test.step(`Change setting của widget (setting show on Home page, product page)`, async () => {
        await dashboard.goto(`https://${suiteConf.domain}/admin/apps/boost-upsell/cross-sell/product-widgets`);
        await productWidgets.switchToggleWidget(cConf.widget_title, cConf.isOn);
        const xpathCustomizeBtn = productWidgets.xpathCustomizeWidget.replace("widgetTitle", cConf.widget_title);
        await dashboard.locator(xpathCustomizeBtn).click();
        await productWidgets.changeSetting(setting);
        await productWidgets.clickSaveBtn();
      });

      await test.step(`Ngoài SF check hiển thị widget tại Home page`, async () => {
        const storefront = new SFHome(dashboard, conf.suiteConf.domain);
        await storefront.gotoHomePage();
        await storefront.page.waitForLoadState("networkidle");

        await productWidgets.verifyProductWidgetVisibleCorrectly(
          conf.caseConf.widget_handle,
          setting,
          snapshotFixture,
          storefront.page,
        );
      });

      await test.step(`Check hiển thị widget tại product page`, async () => {
        const storefront = new SFHome(dashboard, conf.suiteConf.domain);
        await storefront.gotoProductDetail(cConf.product_handle);
        await storefront.page.waitForLoadState("networkidle");

        await productWidgets.verifyProductWidgetVisibleCorrectly(
          conf.caseConf.widget_handle,
          setting,
          snapshotFixture,
          storefront.page,
        );
      });
    }
  });
});
