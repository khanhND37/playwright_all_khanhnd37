import { test } from "@fixtures/theme";
import { expect } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { ProductWidgetHelper } from "./product-widget-helper";
import { AppsAPI } from "@pages/api/apps";
import { CrossSellAPI } from "@pages/api/apps/upsell/cross-sell";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { SFHome } from "@pages/storefront/homepage";

test.describe("@SB_WEB_BUILDER_LBA_PW Verify block Upsell widget", () => {
  let helper: ProductWidgetHelper;
  let appsAPI: AppsAPI;
  let crossSellAPI: CrossSellAPI;
  let appUpsell;
  let webBuilder: WebBuilder;
  let themeSettingAPI: SettingThemeAPI;
  let themeSetting: number;

  test.beforeAll(async ({ conf, theme, authRequest }) => {
    const domain = conf.suiteConf.domain;
    const preData = conf.suiteConf.pre_data;

    appsAPI = new AppsAPI(domain, authRequest);
    crossSellAPI = new CrossSellAPI(domain, conf.suiteConf.shop_id, authRequest);

    appUpsell = preData.app_upsell;

    await test.step("Turn on app Upsell", async () => {
      await appsAPI.actionEnableDisableApp(appUpsell.name, appUpsell.status);
    });

    await test.step(`setting theme V3`, async () => {
      themeSetting = conf.suiteConf.themes_setting;
      themeSettingAPI = new SettingThemeAPI(theme);
      await themeSettingAPI.publishTheme(themeSetting);
    });
  });

  test.beforeEach(async ({ conf, context, dashboard, snapshotFixture }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    helper = new ProductWidgetHelper(conf, context, dashboard, snapshotFixture);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await test.step("Change status of product widgets", async () => {
      const crossSellWidgets = await crossSellAPI.getProductWidgets();
      for (const crossSellWidget of crossSellWidgets) {
        const enable = helper.caseData.verify.widget_types[crossSellWidget.type];
        if (typeof enable !== "undefined" && enable !== crossSellWidget.enable) {
          const isSucceeded = await crossSellAPI.changeProductWidgetStatus(crossSellWidget.type, enable);
          expect(isSucceeded).toBe(true);
        }
      }
    });
  });

  test("@SB_WEB_BUILDER_LBA_PW_01 Upsell widget_Check hiển thị type của widget ở tab Settings khi bật/tắt widget trong App upsell", async ({
    conf,
  }) => {
    await test.step(`Chọn block Widget Upsell`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
    });

    await test.step("Click tab Settings", async () => {
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
      await webBuilder.switchToTab("Content");
      const defaultContent = await webBuilder.getDesignAndContentWithSDK();
      expect(defaultContent).toEqual(conf.caseConf.default_content);
    });

    await test.step(`Chọn type của widget là type đã tắt trong màn quản lý Product widget`, async () => {
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.setting_data_content);
      const checkData = await helper.checkPlaceholderUpsellWidgets();
      expect(checkData).toBeTruthy();
    });
  });

  test("@SB_WEB_BUILDER_LBA_PW_02 Upsell widget_Check default style của block Upsell widget", async ({
    conf,
    page,
  }) => {
    const expectLayout = conf.caseConf.expect_layout;
    const homepage = new SFHome(page, conf.suiteConf.domain);

    await test.step(`Check default data của tab Design`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
      await webBuilder.switchToTab("Design");
      const defaultDesign = await webBuilder.getDesignAndContentWithSDK();
      expect(defaultDesign).toMatchObject(conf.caseConf.default_design);
    });

    await test.step("Click Save và check ngoài SF", async () => {
      await homepage.gotoHomePage();
      await homepage.page.waitForLoadState("networkidle");
      const layout = await homepage.genLoc(homepage.layoutGridBlockProductWidget);
      await expect(layout).toHaveCSS("display", expectLayout.layout);
      await expect(await layout.getAttribute("class")).toContain(expectLayout.size_card);
      await expect(layout).toHaveCSS("--spacing-item", expectLayout.spacing);
      await expect(layout).toHaveCSS("color", expectLayout.color);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_PW_03 Upsell widget_Check hiển thị layout của Upsell widget khi setting layout = Grid`, async ({
    page,
    conf,
  }) => {
    const homepage = new SFHome(page, conf.suiteConf.domain);

    await test.step(`Chọn block Widget Upsell > Click vào field Layout > Chọn Layout = Grid`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
    });

    for (let i = 0; i < conf.caseConf.data_design.length; i++) {
      const dataDesign = conf.caseConf.data_design[i];

      await test.step(`Chọn Size card = ${dataDesign.data_layout.layout.size_card}, Spacing = ${dataDesign.data_layout.layout.spacing}`, async () => {
        await webBuilder.switchToTab("Content");
        await webBuilder.settingDesignAndContentWithSDK(dataDesign.data_content);
        await webBuilder.switchToTab("Design");
        await webBuilder.settingDesignAndContentWithSDK(dataDesign.data_layout);
        await webBuilder.clickOnBtnWithLabel("Save");
        await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      });

      await test.step(`Click button Save and click button preview`, async () => {
        await homepage.gotoProduct(conf.caseConf.product_handle);
        await homepage.page.waitForLoadState("networkidle");
        const blockUpsellWidget = await homepage.genLoc(homepage.layoutGridBlockProductWidget);
        await expect(blockUpsellWidget).toHaveCSS("display", dataDesign.expect_layout.layout);
        await expect(blockUpsellWidget).toHaveCSS("--repeat-count", dataDesign.expect_layout.product_per_row);
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_PW_04 Upsell widget_Check hiển thị layout của Upsell widget khi setting layout = Carousel", async ({
    conf,
    page,
    snapshotFixture,
  }) => {
    const homepage = new SFHome(page, conf.suiteConf.domain);

    await test.step(`Chọn block Widget Upsell > Click vào field Layout > Chọn Layout = Grid`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
    });

    for (let i = 0; i < conf.caseConf.data_design.length; i++) {
      const dataDesign = conf.caseConf.data_design[i];

      await test.step(`Chọn Size card = ${dataDesign.data_layout.layout.size_card}, Spacing = ${dataDesign.data_layout.layout.spacing}`, async () => {
        await webBuilder.switchToTab("Content");
        await webBuilder.settingDesignAndContentWithSDK(dataDesign.data_content);
        await webBuilder.switchToTab("Design");
        await webBuilder.settingDesignAndContentWithSDK(dataDesign.data_layout);
        await webBuilder.clickOnBtnWithLabel("Save");
        await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      });

      await test.step(`Click button Save and click button preview`, async () => {
        await homepage.gotoProduct(conf.caseConf.product_handle);
        await homepage.page.waitForLoadState("networkidle");
        await snapshotFixture.verifyWithAutoRetry({
          page: homepage.page,
          selector: homepage.blockUpsellWidget,
          snapshotName: dataDesign.expect_snap_shot,
        });
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_PW_05 Upsell widget_Check switch device đối với upsell widget", async ({
    pageMobile,
    conf,
  }) => {
    const dataSetting = conf.caseConf.data_setting;
    const homepageMobile = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step(`Ở webfront, click switch device từ desktop sang mobile`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.switchToMobile();
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
    });

    for (let i = 0; i < dataSetting.length; i++) {
      await test.step(`Ngoài SF, check hiển thị Upsell widget trên mobile`, async () => {
        await webBuilder.switchToTab("Design");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting[i].data_design);
        await webBuilder.switchToTab("Content");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting[i].data_content);
        await webBuilder.clickOnBtnWithLabel("Save");
        await expect(webBuilder.toastMessage).toContainText("All changes are saved");
        await homepageMobile.gotoProduct(conf.caseConf.product_handle);
        if (dataSetting[i].data_design.layout.name === "Slide") {
          await expect(await homepageMobile.genLoc(homepageMobile.slideNavigation)).toBeVisible();
          await expect(await homepageMobile.genLoc(homepageMobile.arrow).nth(0)).toBeVisible();
        } else {
          await expect(await homepageMobile.genLoc(homepageMobile.slideNavigation)).toBeHidden();
          await expect(await homepageMobile.genLoc(homepageMobile.arrow).nth(0)).toBeHidden();
        }
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_PW_06 Upsell widget_Check hiển thị products khi setting items per page và text color", async ({
    conf,
  }) => {
    const dataSetting = conf.caseConf.data_design;

    await test.step(`Chọn block Widget Upsell`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
    });

    for (let i = 0; i < dataSetting.length; i++) {
      await test.step(`setting ở field Items per page`, async () => {
        await webBuilder.switchToTab("Design");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting[i].data_layout);
        await webBuilder.switchToTab("Content");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting[i].data_content);
        const countProductItem = await webBuilder.frameLocator.locator(webBuilder.productItem).count();
        expect(countProductItem).toEqual(dataSetting[i].expect_layout.product_item);
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_PW_07 Upsell widget_Check hiển thị widget khi setting data ở tab style", async ({
    conf,
    page,
    snapshotFixture,
  }) => {
    const dataSetting = conf.caseConf.data_setting;
    const homepage = new SFHome(page, conf.suiteConf.domain);

    await test.step(`Setting data cho block Upsell widget tại tab Content và tab Design`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
      await webBuilder.switchToTab("Design");
      await webBuilder.settingDesignAndContentWithSDK(dataSetting.data_design);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(dataSetting.data_content);
    });

    await test.step(`Click button Save & Click button Preview`, async () => {
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      await homepage.gotoProduct(conf.caseConf.product_handle);
      await homepage.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: homepage.page,
        selector: homepage.blockUpsellWidget,
        snapshotName: conf.caseConf.expect_snap_shot,
      });
    });
  });

  test("@SB_WEB_BUILDER_LBA_PW_08 Upsell widget_Check hiển thị layout của Upsell widget khi thực hiện resize", async ({
    conf,
    snapshotFixture,
    dashboard,
  }) => {
    const dataSetting = conf.caseConf.data_setting;
    const homepage = new SFHome(dashboard, conf.suiteConf.domain);

    await test.step(`Chọn block Widget Upsell`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
    });

    for (let i = 0; i < dataSetting.length; i++) {
      await test.step(`Setting size card`, async () => {
        await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
        await webBuilder.switchToTab("Content");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting[i].data_content);
        await webBuilder.switchToTab("Design");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting[i].data_design);
        await webBuilder.backBtn.click();
        await snapshotFixture.verifyWithAutoRetry({
          page: webBuilder.page,
          selector: webBuilder.frameLocator.locator(homepage.blockUpsellWidget),
          snapshotName: dataSetting[i].expect_snapshot,
        });
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_PW_10 Verify when click duplicate and delete block on quickbar", async ({
    conf,
    dashboard,
  }) => {
    const homepage = new SFHome(dashboard, conf.suiteConf.domain);

    await test.step(`Tại section 1, click block Upsell widget`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
      await expect(webBuilder.frameLocator.locator(webBuilder.quickBarLoc)).toBeVisible();
    });

    await test.step(`Chọn duplicate`, async () => {
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      await expect(async () => {
        const quantityBlock = await webBuilder.frameLocator.locator(homepage.blockUpsellWidget).count();
        expect(quantityBlock).toEqual(conf.caseConf.expect_duplicate);
      }).toPass({ timeout: 5000 });
    });
  });

  test("@SB_WEB_BUILDER_LBA_PW_13 Upsell widget_Check hiển thị products ở widget", async ({ conf, context }) => {
    const dataSetting = conf.caseConf.data_setting;
    const sfPage = await context.newPage();
    const homepage = new SFHome(sfPage, conf.suiteConf.domain);

    await test.step(`Ở webfront, ở Product page, preview Product A, check hiển thị product ở các widget`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
    });
    for (let i = 0; i < dataSetting.length; i++) {
      await test.step(`Ngoài SF, mở Product page, product A`, async () => {
        // setting data
        await webBuilder.switchToTab("Content");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting[i].data_content);
        await webBuilder.switchToTab("Design");
        await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_layout);
        await webBuilder.clickOnBtnWithLabel("Save");
        await expect(webBuilder.toastMessage).toContainText("All changes are saved");
        // goto homepage
        await homepage.gotoProduct(conf.caseConf.product_handle);
        await homepage.page.waitForLoadState("networkidle");
        let productCart, listProductCart, productCartMap;
        switch (dataSetting[i].data_content.type) {
          case "handpicked_products" || "products_from_same_collections":
            productCart = homepage.genLoc(homepage.productCartName);
            listProductCart = await productCart.evaluateAll(list => list.map(element => element.textContent.trim()));
            productCartMap = {};
            for (const productCart of listProductCart) {
              productCartMap[productCart] = true;
            }

            for (const productCartVerify of dataSetting[i].expect.list_product) {
              const checkResult = productCartMap[productCartVerify];
              expect(checkResult).toEqual(true);
            }
            break;
          case "best_seller" || "recently_viewed_and_featured_products" || "who_bought_this_also_bought":
            await homepage.page.reload();
            await homepage.page.waitForResponse(
              response => response.url().includes(dataSetting[i].expect.url) && response.status() === 200,
            );
            break;
        }
      });
    }

    await test.step(`Ngoài SF, khi chưa add product nào, mở Cart page`, async () => {
      await homepage.gotoCart();
      await homepage.page.waitForResponse(
        response => response.url().includes("best-selling.json") && response.status() === 200,
      );
    });

    await test.step(`Ngoài SF, add 1 product bất kì vào cart, mở Cart page`, async () => {
      await homepage.gotoProduct("product-a");
      await homepage.page.waitForLoadState("networkidle");
      await homepage.clickOnBtnWithLabel("Add to cart");
      await homepage.page.waitForResponse(
        response => response.url().includes("co-bought.json") && response.status() === 200,
      );
    });
  });

  test("@SB_WEB_BUILDER_LBA_PW_19 Verify showing special product on block", async ({ conf, page }) => {
    const dataSetting = conf.caseConf.data_setting;
    const homepage = new SFHome(page, conf.suiteConf.domain);

    await test.step("Tại tab setting, chọn type = Products from the same collections", async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(dataSetting.data_content);
      await webBuilder.switchToTab("Design");
      await webBuilder.settingDesignAndContentWithSDK(dataSetting.data_design);
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });

    await test.step(`Check hiển thị products ở widget Products from the same collections`, async () => {
      await homepage.gotoProduct(conf.caseConf.product_handle);
      const productCart = await homepage.genLoc(homepage.productCartName);
      const listProductCart = await productCart.evaluateAll(list => list.map(element => element.textContent.trim()));
      const productCartMap = {};
      for (const productCart of listProductCart) {
        productCartMap[productCart] = true;
      }

      for (const productCartVerify of conf.caseConf.expect_product_cart) {
        const checkResult = productCartMap[productCartVerify];
        expect(checkResult).toEqual(true);
      }
      await expect(homepage.genLoc(homepage.xpathItemSoldoutProduct(conf.caseConf.product_sold_out))).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_LBA_PW_23 Verify how block showing when turn on/off app Upsell and widget types", async ({
    dashboard,
    conf,
  }) => {
    const homepage = new SFHome(dashboard, conf.suiteConf.domain);

    await test.step(`Turn off app Upsell`, async () => {
      await appsAPI.actionEnableDisableApp(appUpsell.name, false);
    });

    await test.step("Turn on app Upsell and turn off all widget types", async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "product",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
      await expect(webBuilder.frameLocator.locator(homepage.blockUpsellWidget)).toBeHidden();
    });

    await test.step("- Turn on app Upsell", async () => {
      await appsAPI.actionEnableDisableApp(appUpsell.name, true);
    });

    await test.step("Mở preview product 1 trong web builder", async () => {
      await webBuilder.reload();
      await webBuilder.page.waitForLoadState("networkidle");
      await expect(webBuilder.frameLocator.locator(homepage.blockUpsellWidget)).toBeVisible();
    });
  });
});

/**
 * Gộp vào auto core và xoá khỏi RLCL
 */
// test("@SB_WEB_BUILDER_LBA_PW_09 Verify how block react when drag and drop", async () => {
//   const data = helper.caseData;
//   const section1 = helper.preData.sections[0];
//   const section2 = data.sections[0];
//   const sections = [section2, section1];

//   await test.step('Open web builder', async () => {
//     await webBuilder.openWebBuilder({
//       type: "site",
//       id: themeSetting,
//       page: "product",
//     });
//     await webBuilder.loadingScreen.waitFor();
//     await webBuilder.reloadIfNotShow("web builder");
//   });

//   for (const section of sections) {
//     await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
//       await helper.setupSectionAndBlocks(section);
//       addedSections.push(section);
//     });
//   }

//   await test.step("Drag and drop from section to another section", async () => {
//     await helper.webBuilder.dndTemplateInPreview({
//       from: {
//         position: Object.assign({}, section2.blocks[0].position_section.to.position, {
//           section: 4,
//         }),
//       },
//       to: {
//         position: section1.blocks[0].position_section.to.position,
//       },
//     });
//   });

//   await test.step(`Verify on webfront and storefront`, async () => {
//     await helper.savePage();
//     await helper.webBuilder.backBtn.click();
//     await helper.verifyWebfront({ section: section1, layer: "section" });
//   });
// });
// test("@SB_WEB_BUILDER_LBA_PW_12 Verify when click delete on sidebar", async () => {
//   const data = helper.caseData;
//   const section = helper.preData.sections[0];
//   const block = section.blocks[0];

//   await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
//     await helper.setupSectionAndBlocks(section);
//     addedSections.push(section);
//     await helper.savePage();
//   });

//   await test.step(`Click Delete block button on sidebar`, async () => {
//     await helper.webBuilder.removeCurrentLayer();
//     block.removed = true;
//   });

//   await test.step(`Verify on webfront and storefront`, async () => {
//     await helper.savePage();
//     await helper.verifyWebfront({ section, layer: "section" });
//     await helper.verifyStorefront({
//       section,
//       route: data.verify.page,
//       layer: "section",
//     });
//   });

//   block.removed = false;
// });
// test("@SB_WEB_BUILDER_LBA_PW_21 Verify when add product contain custom options and variant on block Upsell Widget",
// async () => {
//   const data = helper.caseData;
//   const section = helper.preData.sections[0];

//   await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
//     await helper.setupSectionAndBlocks(section);
//     addedSections.push(section);
//     await helper.savePage();
//   });

//   await test.step(`Verify on storefront`, async () => {
//     await helper.setupVerifyPage(data.verify.page);
//   });

//   for (let i = 0; i < data.verify.products.length; i++) {
//     const product = data.verify.products[i];
//     await test.step(`Add ${product.title} to cart`, async () => {
//       const xPathProductItem =
// `//a[normalize-space()='${product.title}']/ancestor::div[contains(@class, 'product-item')]`;
//       const productItemLocator = helper.storefront.locator(xPathProductItem);
//       await productItemLocator.scrollIntoViewIfNeeded();
//       await productItemLocator.locator("//img").hover();
//       const buttonAdd = productItemLocator.getByText("Add to cart");
//       await buttonAdd.waitFor();
//       await buttonAdd.click();
//     });

//     const upsellSF = new UpSell(helper.storefront, helper.preCondition.domain);
//     const dialogLocator = upsellSF.customizeProductPopup;
//     let dialogOpening = false;
//     if (product.variant) {
//       await expect(dialogLocator).toBeVisible();
//       await test.step(`Select variant ${product.variant}`, async () => {
//         await dialogLocator.getByRole("button", { name: product.variant }).click();
//         dialogOpening = true;
//       });
//     }

//     if (product.custom_option) {
//       await expect(dialogLocator).toBeVisible();
//       await test.step(`Fill custom option`, async () => {
//         await dialogLocator.getByPlaceholder("Please fill out this field").fill(product.custom_option.name);
//         dialogOpening = true;
//       });
//     }

//     if (dialogOpening) {
//       await test.step(`Add product to cart`, async () => {
//         await dialogLocator.getByRole("button", { name: "Add to cart" }).click();
//         await dialogLocator.waitFor({ state: "detached" });
//       });
//     }
//   }
// });
// test("@SB_WEB_BUILDER_LBA_PW_24 Verify how block showing when data source is missing", async () => {
//   test.slow();
//   const data = helper.caseData;
//   const section = data.sections[0];

//   const executeTest = async (verifyPage: string, index = 0) => {
//     await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
//       await helper.createSection(section);
//       for (const block of section.blocks) {
//         await helper.createBlock(block);
//         // setup type for Upsell widget
//         if (block.position_section.from.template === "Upsell widget") {
//           await helper.webBuilder.switchToTab("Content");
//           await helper.webBuilder.selectDropDown("type", block.tab_content.type);
//         }
//       }
//       await helper.savePage();
//     });

//     await test.step(`Verify on webfront and storefront`, async () => {
//       await helper.webBuilder.backBtn.click();
//       await helper.verifyWebfront({ section, snapshotIndex: index, layer: "section" });
//       await helper.verifyStorefront({
//         section,
//         snapshotIndex: index,
//         route: verifyPage,
//         layer: "section",
//       });
//     });

//     // remove section before change page
//     await helper.removeSection(section);
//     await helper.savePage();
//   };

//   // execute test on Product detail page
//   await executeTest(data.verify.pages[0], 0);

//   // change to collection page
//   await helper.webBuilder.openWebBuilder({
//     id: res.id,
//     type: "site",
//     page: "collection",
//   });
//   // execute test on Collection detail page
//   await executeTest(data.verify.pages[1], 1);
// });
