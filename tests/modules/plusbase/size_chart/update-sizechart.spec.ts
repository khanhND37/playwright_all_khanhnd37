/* eslint-disable no-irregular-whitespace */
import { test } from "@fixtures/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";
import { SizeChartPage } from "@pages/dashboard/products/size_chart";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { expect } from "@playwright/test";
import type { SbPlbOtmsc1, SbPlbOtmsc10, SbPlbOtmsc11, SbPlbOtmsc12 } from "./update-sizechart";

test.describe("Update sizechart", async () => {
  let domain: string;
  let productPage: ProductPage;
  let dropshipCatalogPage: DropshipCatalogPage;
  let dashboardPage: DashboardPage;

  let productPageSf: SFProduct;
  let plbTemplateDashboardPage: DashboardPage;
  let sizeChartPage: SizeChartPage;
  let plbToken: string;
  let plbTemplateShopDomain: string;

  test.beforeEach(async ({ dashboard, conf, page }) => {
    domain = conf.suiteConf.domain;
    productPage = new ProductPage(dashboard, domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);

    dropshipCatalogPage = new DropshipCatalogPage(dashboard, domain);

    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    sizeChartPage = new SizeChartPage(page, plbTemplateShopDomain);

    plbToken = await plbTemplateDashboardPage.getAccessToken({
      shopId: conf.suiteConf.plb_template["shop_id"],
      userId: conf.suiteConf.plb_template["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf.plb_template["username"],
      password: conf.suiteConf.plb_template["password"],
    });
  });

  test(`Verify show message sau khi product được send báo giá và product đã được mapping size chart @SB_PLB_OTMSC_10`, async ({
    cConf,
  }) => {
    const caseConf = cConf as SbPlbOtmsc10;
    await test.step(`Vào Products -> Search product-> Verify message trong product detail sau khi báo giá`, async () => {
      await dashboardPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProdByName(caseConf.product_name);

      await productPage.chooseProduct(caseConf.product_name);
      const previewMessage = productPage.page.locator(productPage.xpathPreviewSizeChartMessage).textContent();
      expect((await previewMessage).replace(/\s\s+/g, " ").trim()).toEqual(caseConf.alert_message);
    });

    await test.step(`Click Here hyperlink`, async () => {
      await productPage.clickOnTextLinkWithLabel("here");
      await expect(productPage.page.locator(productPage.xpathPreviewSizeChartModal)).toHaveCount(1);
    });

    await test.step(`Click X button`, async () => {
      await productPage.closePreviewSizeGuide();
      await expect(productPage.page.locator(productPage.xpathPreviewSizeChartModal)).toHaveCount(0);
    });
  });

  test(`@SB_PLB_OTMSC_16 Verify tính năng convert size chart ngoài SF khi enable setting convert size chart all column trong config shop template`, async ({
    dashboard,
    conf,
    page,
    cConf,
  }) => {
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const caseConf = cConf as SbPlbOtmsc1;
    const sizeChartName = caseConf.sizechart_name;
    await test.step(`Vào Products > Size chart > Enable convert size chart all column `, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await sizeChartPage.gotoSizeChart();
      await sizeChartPage.searchAndChooseSizecharts(sizeChartName);
      await sizeChartPage.page.waitForSelector(sizeChartPage.xpathUpdateButton);
      const currentSizeChartName = await sizeChartPage.getSizeChartName();
      if (currentSizeChartName.toString() === sizeChartName) {
        // Đúng size chart test thì mới thực hiện update
        const columnSizeType = await sizeChartPage.getColumnSizeType();
        for (let i = 3; i <= columnSizeType; i++) {
          const sizeChartStatus = await sizeChartPage.getStatusSizeChart(i);
          if (sizeChartStatus.trim() === "false") {
            await sizeChartPage.clickSwitchSizechartType(i);
          }
        }
      }
      await sizeChartPage.clickElementWithLabel("span", "Update");
      expect(await sizeChartPage.isTextVisible(caseConf.message)).toBeTruthy();
    });
    await test.step(`Đi đến SF của shop merchant > Search product > verify button convert size chart`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(caseConf.product_handle, caseConf.product_name);
      await productPageSf.clickElementWithLabel("label", "Size Guide");
      await expect(productPageSf.page.locator(productPageSf.xpathBtnInSizeGuidePopup)).toHaveCount(2);
    });
    await test.step(`- Click qua lại giữa Inch/Cm > verify cột được convert size chart (quy đổi số, làm tròn...)`, async () => {
      const rowSizeGuide = await productPageSf.countLineSizeChart("row");
      const columnSizeGuide = await productPageSf.countLineSizeChart("column");
      const listSize: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSize.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      expect(listSize).toEqual(caseConf.data_size_guide[0]);
      await productPageSf.page.locator(productPageSf.xpathBtnInch).click();

      const listSizeInch: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSizeInch.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      expect(listSizeInch).toEqual(caseConf.data_size_guide[1]);
    });
  });

  test(`@SB_PLB_OTMSC_15 Verify tính năng convert size chart ngoài SF khi disbale setting convert size chart all column trong config shop template`, async ({
    dashboard,
    page,
    conf,
    cConf,
  }) => {
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const caseConf = cConf as SbPlbOtmsc1;
    const sizeChartName = caseConf.sizechart_name;
    await test.step(`Vào Products > Size chart > Disable convert size chart all column `, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await sizeChartPage.gotoSizeChart();
      await sizeChartPage.searchAndChooseSizecharts(sizeChartName);
      await sizeChartPage.page.waitForSelector(sizeChartPage.xpathUpdateButton);
      const currentSizeChartName = await sizeChartPage.getSizeChartName();
      if (currentSizeChartName.toString() === sizeChartName) {
        // Đúng size chart test thì mới thực hiện update
        const columnSizeType = await sizeChartPage.getColumnSizeType();
        for (let i = 3; i <= columnSizeType; i++) {
          const sizeChartStatus = await sizeChartPage.getStatusSizeChart(i);
          if (sizeChartStatus.trim() === "true") {
            await sizeChartPage.clickSwitchSizechartType(i);
          }
        }
      }
      await sizeChartPage.clickElementWithLabel("span", "Update");
      expect(await sizeChartPage.isTextVisible(caseConf.message)).toBeTruthy();
    });
    await test.step(`Đi đến SF của shop merchant > Search product > verify button convert size chart`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(caseConf.product_handle, caseConf.product_name);
      await productPageSf.clickElementWithLabel("label", "Size Guide");
      await expect(productPageSf.page.locator(productPageSf.xpathBtnInSizeGuidePopup)).toHaveCount(0);
    });
  });

  test(`@SB_PLB_OTMSC_14 Verify tính năng convert size chart ngoài SF khi disbale setting convert size chart 1 column trong config shop template, các cột còn lại setting enable`, async ({
    dashboard,
    page,
    conf,
    cConf,
  }) => {
    const plbTemplateShopDomain = conf.suiteConf["plb_template"]["domain"];
    const plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    const caseConf = cConf as SbPlbOtmsc1;
    const sizeChartName = caseConf.sizechart_name;
    await test.step(`Vào Products > Size chart > Disable convert size chart `, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await sizeChartPage.gotoSizeChart();
      await sizeChartPage.searchAndChooseSizecharts(sizeChartName);
      await sizeChartPage.page.waitForSelector(sizeChartPage.xpathUpdateButton);
      const currentSizeChartName = await sizeChartPage.getSizeChartName();
      if (currentSizeChartName.toString() === sizeChartName) {
        // Đúng size chart test thì mới thực hiện update
        const columnSizeType = await sizeChartPage.getColumnSizeType();
        for (let i = 3; i <= columnSizeType; i++) {
          const sizeChartStatus = await sizeChartPage.getStatusSizeChart(i);
          if (sizeChartStatus.trim() === "false") {
            await sizeChartPage.clickSwitchSizechartType(i);
          }
        }
        await sizeChartPage.clickSwitchSizechartType(4);
      }
      await sizeChartPage.clickElementWithLabel("span", "Update");
      expect(await sizeChartPage.isTextVisible(caseConf.message)).toBeTruthy();
    });
    await test.step(`Đi đến SF của shop merchant > Search product > verify button convert size chart`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(caseConf.product_handle, caseConf.product_name);
      await productPageSf.clickElementWithLabel("label", "Size Guide");
      await expect(productPageSf.page.locator(productPageSf.xpathBtnInSizeGuidePopup)).toHaveCount(2);
    });
    await test.step(`- Click qua lại giữa Inch/Cm > verify cột được convert size chart (quy đổi số, làm tròn...)`, async () => {
      const rowSizeGuide = await productPageSf.countLineSizeChart("row");
      const columnSizeGuide = await productPageSf.countLineSizeChart("column");
      const listSize: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSize.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      expect(listSize).toEqual(caseConf.data_size_guide[0]);
      await productPageSf.page.locator(productPageSf.xpathBtnInch).click();

      const listSizeInch: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSizeInch.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      expect(listSizeInch).toEqual(caseConf.data_size_guide[1]);
    });
  });

  test(`@SB_PLB_OTMSC_17 Verify detect khi size chart nhập data định dạng {number}x{number}`, async ({
    dashboard,
    cConf,
  }) => {
    const caseConf = cConf as SbPlbOtmsc1;
    await test.step(`Đi đến SF của shop merchant > Search product > verify button convert size chart`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(caseConf.product_handle, caseConf.product_name);
      await productPageSf.clickElementWithLabel("label", "Size Guide");
      await expect(productPageSf.page.locator(productPageSf.xpathBtnInSizeGuidePopup)).toHaveCount(2);
    });
    await test.step(`- Click qua lại giữa Inch/Cm > verify cột được convert size chart (quy đổi số, làm tròn...)`, async () => {
      const rowSizeGuide = await productPageSf.countLineSizeChart("row");
      const columnSizeGuide = await productPageSf.countLineSizeChart("column");
      const listSize: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSize.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      expect(listSize).toEqual(caseConf.data_size_guide[0]);
      await productPageSf.page.locator(productPageSf.xpathBtnInch).click();

      const listSizeInch: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSizeInch.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      expect(listSizeInch).toEqual(caseConf.data_size_guide[1]);
    });
  });

  test(`@SB_PLB_OTMSC_11 Verify action sửa variant sau khi product được send báo giá trong trường hợp variant detail = variant được mapping`, async ({
    cConf,
  }) => {
    const caseConf = cConf as SbPlbOtmsc11;
    const productName = caseConf.product_name;
    await test.step(`Vào Products > Search product `, async () => {
      await dashboardPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProdByName(productName);
      await productPage.chooseProduct(productName);
      await productPage.page.waitForSelector(productPage.xpathTitleProductDetail);
      const productTitle = await productPage.getProductName();
      expect(productTitle.trim()).toEqual(productName);
    });
    await test.step(`Verify action edit variant trong variant detail`, async () => {
      await productPage.clickElementWithLabel("span", "Edit");
      for (let i = 0; i < caseConf.variants.length; i++) {
        const value = await productPage.getStatusVariantValue(caseConf.variants.at(i));
        expect(value).toEqual("disabled");
      }
    });
  });

  test(`@SB_PLB_OTMSC_12 Verify action sửa variant sau khi product được send báo giá trong trường hợp variant detail khác variant được mapping`, async ({
    cConf,
  }) => {
    const caseConf = cConf as SbPlbOtmsc12;
    const productName = caseConf.product_name;
    await test.step(`Vào product > Search product > Verify action edit variant trong variant detail`, async () => {
      await dashboardPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProdByName(productName);
      await productPage.chooseProduct(productName);
      await productPage.page.waitForSelector(productPage.xpathTitleProductDetail);
      const productTitle = await productPage.getProductName();
      expect(productTitle.trim()).toEqual(productName);
    });
    await test.step(`Edit variant > Click Save changes`, async () => {
      await productPage.clickElementWithLabel("span", "Edit", 2);
      const numberOfInputFields = await productPage.page.locator(productPage.xpathDisabledInput).count();
      for (let i = 1; i <= numberOfInputFields; i++) {
        await expect(productPage.page.locator(`(${productPage.xpathDisabledInput})[${i}]`)).toBeDisabled();
      }
      await productPage.clickElementWithLabel("span", "Save");
      await productPage.clickElementWithLabel("span", "Edit", 1);
      await productPage.page
        .locator(productPage.xpathVariantItem(2))
        .fill(`${caseConf.new_variant}${Math.random() + 1}`);
      await productPage.clickElementWithLabel("span", "Save");
      await productPage.clickElementWithLabel("button", "Save changes");
      expect(await dropshipCatalogPage.isTextVisible(caseConf.message)).toBeTruthy();
    });
  });
});
