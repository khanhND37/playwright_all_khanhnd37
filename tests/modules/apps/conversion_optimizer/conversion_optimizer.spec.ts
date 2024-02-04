import { expect, test } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { BoostConvertInsidePage } from "@pages/dashboard/apps/boost_convert/boost_convert_inside";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { Apps } from "@pages/dashboard/apps";
import { SFHome } from "@pages/storefront/homepage";
import { PageSettingsData, settingSalesNotifications } from "@types";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { ProducDetailV3 } from "@pages/new_ecom/storefront/product_page";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { loadData } from "@core/conf/conf";
import { DashboardAPI } from "@pages/api/dashboard";

test.describe("Convert Optimize notification with theme v3", async () => {
  let themeSettingAPI: SettingThemeAPI;
  let themeSetting: number;
  let checkoutAPI: CheckoutAPI;
  let checkoutPage: SFCheckout;
  let appsPage: Apps;
  let dashboardPage;
  let domain;
  let app;
  let coptPage: BoostConvertInsidePage;

  /**
   * get Sales Notifications On SF
   * @param homepage
   * @returns
   */
  const getSalesNotificationsOnSF = async (homepage): Promise<settingSalesNotifications> => {
    const noti = {
      message: {
        title: "",
        product_name: "",
        time: "",
      },
    };
    const xpathNoti = coptPage.xpathNotificationsSF();
    await Promise.all([
      await homepage.page.waitForSelector(coptPage.xpathNotiActivated),
      (noti.message.title = await homepage.genLoc(xpathNoti.title).textContent()),
      (noti.message.product_name = await homepage.genLoc(xpathNoti.product_name).textContent()),
      (noti.message.time = await homepage.genLoc(xpathNoti.time).textContent()),
    ]);
    return noti;
  };

  /**
   * need gennerate to each run auto data not same
   * @returns
   */
  const generateRandomTitle = (): string => {
    const timestamp = new Date().getTime();
    return ` test_${timestamp}`;
  };

  test.beforeEach(async ({ dashboard, conf, theme, authRequest }) => {
    domain = conf.suiteConf.domain;
    app = conf.suiteConf.app;
    coptPage = new BoostConvertInsidePage(dashboard, domain, authRequest);

    await test.step(`setting theme V3`, async () => {
      themeSetting = conf.suiteConf.themes_setting;
      themeSettingAPI = new SettingThemeAPI(theme);
      await themeSettingAPI.publishTheme(themeSetting);
    });
    await test.step(`Tại Menu > Chọn Apps > Setting toggle của app Convert= On`, async () => {
      appsPage = new Apps(dashboard, domain);
      dashboardPage = new DashboardPage(dashboard, domain);
      await dashboardPage.navigateToMenu("Apps");
      await appsPage.turnOnOffApp(app, true);
    });
  });

  test.afterEach(async ({}) => {
    await test.step(`delete noti and delete cache noti`, async () => {
      await coptPage.deleteAllNoti();
      await coptPage.deleteCacheNoti("Sale noti");
    });
  });

  test(`@SB_NEWECOM_CVO_83 Verify hiển thị setting Sale notification thành công`, async ({ page, conf }) => {
    const popType = conf.caseConf.pop_types;
    const product = conf.caseConf.product;
    const dataEditSettingSaleNoti = conf.caseConf.data_edit;
    let dataNoti;
    const homepage = new SFHome(page, domain);

    await test.step(`Trong dashboard, Click on app name > Click Toggle của Sale notification là On`, async () => {
      await appsPage.gotoAppsNE(app);
      await dashboardPage.navigateToMenu("Social Proof");
      await coptPage.turnOnOffNotifications(popType, true);
      // create noti
      await dashboardPage.navigateToMenu("Notification list");
      await coptPage.addCustomNoti(conf.caseConf.data_create_noti);
      await coptPage.deleteCacheNoti("Sale noti");
    });

    await test.step(`Open SF> search product name > Click product name `, async () => {
      await homepage.gotoProduct(product);
      dataNoti = await coptPage.getDataSalesNotificationsList();
      const showNotiSF = await getSalesNotificationsOnSF(homepage);
      let checkNoti = false;
      dataNoti.forEach(item => {
        if (
          showNotiSF.message.title.includes(item.title) &&
          showNotiSF.message.product_name.includes(item.product_name) &&
          showNotiSF.message.time.includes(
            item.time.substring(showNotiSF.message.time.length - 4, showNotiSF.message.time.length - 1),
          )
        ) {
          checkNoti = true;
        }
      });
      expect(checkNoti).toBe(true);
    });

    await test.step(`Trong dashboard, Click button Setting của Sale notification > Edit các field > Click button Save`, async () => {
      await dashboardPage.navigateToMenu("Pop types");
      // generate title random to save
      dataEditSettingSaleNoti.title = generateRandomTitle() + ` ${dataEditSettingSaleNoti.title}`;
      await coptPage.editSalesNotifications(dataEditSettingSaleNoti);
      await expect(coptPage.genLoc(dashboardPage.xpathToastMessage)).toBeVisible();
    });

    await test.step(`Open SF> search product name > Click product name`, async () => {
      //data Noti Affter Edit Setting Sale Noti
      dataNoti = await coptPage.getDataSalesNotificationsList();
      await homepage.gotoProduct(product);
      const showNotiSF = await getSalesNotificationsOnSF(homepage);
      let checkNoti = false;
      dataNoti.forEach(item => {
        if (
          showNotiSF.message.title.includes(item.title) &&
          showNotiSF.message.product_name.includes(item.product_name) &&
          showNotiSF.message.time.includes(
            item.time.substring(showNotiSF.message.time.length - 4, showNotiSF.message.time.length - 1),
          )
        ) {
          checkNoti = true;
        }
      });
      expect(checkNoti).toBe(true);
    });
  });

  test(`@SB_NEWECOM_CVO_85 Verify hiển thị setting Checkout notification thành công`, async ({
    page,
    conf,
    authRequest,
  }) => {
    const popType = conf.caseConf.pop_types;
    const dataEdit = conf.caseConf.data_edit;
    const product = conf.caseConf.product;
    const productsCheckout = conf.caseConf.products_checkout;
    const shippingAddress = conf.caseConf.shipping_address;
    dataEdit.message = dataEdit.message + generateRandomTitle();
    const productID = conf.caseConf.product_id;
    const homepage = new SFHome(page, conf.suiteConf.domain);
    const productDetail = new ProducDetailV3(page, conf.suiteConf.domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);

    await test.step(`Click app name > Click button Setting cuả Checkout notification > Edit các field > Click button Save`, async () => {
      await appsPage.gotoAppsNE(app);
      await dashboardPage.navigateToMenu("Social Proof");
      // checkout success to sync noti
      const dataNotiBeforeCheckout = await coptPage.getDataSalesNotificationsList();
      let dataNotiAfterCheckout;
      await checkoutAPI.addProductThenSelectShippingMethod(
        productsCheckout,
        checkoutAPI.defaultCustomerInfo.emailBuyer,
        shippingAddress,
      );
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.completeOrderWithMethod();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible();
      await expect(async () => {
        dataNotiAfterCheckout = await coptPage.getDataSalesNotificationsList();
        expect(dataNotiAfterCheckout.length).toEqual(dataNotiBeforeCheckout.length + 1);
      }).toPass();
      await coptPage.turnOnOffNotifications(popType, true);
      await coptPage.editCheckoutNotifications(dataEdit);
      await expect(coptPage.genLoc(dashboardPage.xpathToastMessage)).toBeVisible();
    });

    await test.step(`Open SF> search product name > Click product name > Add to cart`, async () => {
      const messageNotiCheckout = await coptPage.getContentCheckoutNotificationsList(conf.caseConf.product_id);
      await coptPage.deleteCacheNoti("Checkout noti", productID);
      await homepage.gotoProduct(product);
      await homepage.page.click(productDetail.xpathBtnATC);
      await homepage.page.waitForSelector(productDetail.xpathTitleCartPage);
      await homepage.goto(`/cart`);
      await homepage.page.waitForSelector(coptPage.xpathNotiActivated);
      const messageNotiCheckoutSF = await homepage.genLoc(coptPage.xpathTitleCheckoutNotiSF).textContent();
      expect(messageNotiCheckoutSF).toContain(messageNotiCheckout);
    });
  });

  test(`@SB_NEWECOM_CVO_86 Verrify hiển thị sync noti về app Convert`, async ({ page, conf, authRequest }) => {
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    const productsCheckout = conf.caseConf.products_checkout;
    const shippingAddress = conf.caseConf.shipping_address;
    const product = conf.caseConf.product;

    const dataNotiBeforeCheckout = await coptPage.getDataSalesNotificationsList();
    let dataNotiAfterCheckout;

    await test.step(`Open SF> search product name > Click product name > Add to cart> thực hiện checkout thành công `, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(
        productsCheckout,
        checkoutAPI.defaultCustomerInfo.emailBuyer,
        shippingAddress,
      );
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.completeOrderWithMethod();

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkoutPage.thankyouPageLoc).toBeVisible();
    });

    await test.step(`Back lại app Convert> Click Notification list  `, async () => {
      await expect(async () => {
        dataNotiAfterCheckout = await coptPage.getDataSalesNotificationsList();
        expect(dataNotiAfterCheckout.length).toEqual(dataNotiBeforeCheckout.length + 1);
      }).toPass();
      await coptPage.deleteCacheNoti("Sale noti");
      const listNoti = await coptPage.getInfoSaleNotificationsList();
      const infoSyncNoti = listNoti[listNoti.length - 1];
      expect(infoSyncNoti.customer_name).toEqual(`${shippingAddress.first_name} ${shippingAddress.last_name}`);
      expect(infoSyncNoti.customer_address).toEqual(`${shippingAddress.city}, ${shippingAddress.country_name}`);
      expect(infoSyncNoti.product_name).toEqual(productsCheckout[0].name);
    });

    await test.step(`Open SF> search product name > Click product name `, async () => {
      const homepage = new SFHome(page, domain);
      await homepage.gotoProduct(product);
      const showNotiSF = await getSalesNotificationsOnSF(homepage);
      let checkNoti = false;
      dataNotiAfterCheckout.forEach(item => {
        if (
          showNotiSF.message.title.includes(item.title) &&
          showNotiSF.message.product_name.includes(item.product_name) &&
          showNotiSF.message.time.includes(
            item.time.substring(showNotiSF.message.time.length - 4, showNotiSF.message.time.length - 1),
          )
        ) {
          checkNoti = true;
        }
      });
      expect(checkNoti).toBe(true);
    });
  });

  test(`@SB_NEWECOM_CVO_88 Verify hiển thị khi kết hợp fillter type và search product name`, async ({ conf }) => {
    const dataSearch = conf.caseConf.data_search;
    let listNoti;
    await test.step(` Click Notification list > Chọn fillter type = Alll notifications> Input product name không tồn tại`, async () => {
      await appsPage.gotoAppsNE(app);
      await dashboardPage.navigateToMenu("Social Proof");
      await dashboardPage.page.click(coptPage.xpathNotificationList);
      await coptPage.searchNotifications(dataSearch.step_1.option, dataSearch.step_1.product_search);
      await expect(coptPage.page.locator(coptPage.xpathBlankListNoti)).toBeVisible();
    });

    await test.step(` Click Notification list > Chọn fillter type = Alll notifications> Input product name  tồn tại`, async () => {
      await coptPage.searchNotifications(dataSearch.step_2.option, dataSearch.step_2.product_search);
      const countNoti = await coptPage.countNoti(dataSearch.step_2.product_search);
      listNoti = await coptPage.getInfoSaleNotificationsList();
      let findNotiInList = 0;
      for (let i = 0; i < listNoti.length; i++) {
        if (
          (listNoti[i].product_name === dataSearch.step_2.product_search && listNoti[i].type === "manual") ||
          (listNoti[i].product_name === dataSearch.step_2.product_search && listNoti[i].type === "sync")
        ) {
          findNotiInList += 1;
        }
      }
      expect(countNoti).toEqual(findNotiInList);
    });

    await test.step(` Click Notification list > Chọn fillter type = Sync notifications> Input product name  tồn tại`, async () => {
      await coptPage.searchNotifications(dataSearch.step_3.option, dataSearch.step_3.product_search);
      const countNoti = await coptPage.countNoti(dataSearch.step_3.product_search, "sync");
      let findNotiInList = 0;
      for (let i = 0; i < listNoti.length; i++) {
        if (listNoti[i].product_name === dataSearch.step_2.product_search && listNoti[i].type === "sync") {
          findNotiInList += 1;
        }
      }
      expect(countNoti).toEqual(findNotiInList);
    });
  });

  test(`@SB_NEWECOM_CVO_89 Verify tạo thành công custom notifications`, async ({ conf, page }) => {
    const dataEdit = conf.caseConf.data_edit;
    const product = conf.caseConf.product;
    const dataNotiCreated = conf.caseConf.data_noti_created;
    let dataNoti;
    const homepage = new SFHome(page, domain);
    await test.step(`Click Notification list > click button Add a custom notifications > Click button Select product > Chọn Product name > Click button Continue with selected products`, async () => {
      await appsPage.gotoAppsNE(app);
      await dashboardPage.navigateToMenu("Social Proof");
      await dashboardPage.navigateToMenu("Notification list");
    });

    await test.step(`Chọn Random locations > Chọn Location > Click button Create now`, async () => {
      await coptPage.addCustomNoti(dataEdit.step_1);
      await coptPage.deleteCacheNoti("Sale noti");
      dataNoti = await coptPage.getDataSalesNotificationsList();
      const checkNoti = {};
      for (const noti of dataNoti) {
        checkNoti[noti] = true;
      }
      for (const noticreated of dataNotiCreated.step_1) {
        const checkResult = checkNoti[noticreated];
        expect(checkResult).toEqual(true);
      }
    });

    await test.step(`Open SF> search product name > Click product name `, async () => {
      await homepage.gotoProduct(product);
      const showNotiSF = await getSalesNotificationsOnSF(homepage);
      let checkNoti = false;
      dataNoti.forEach(item => {
        if (
          showNotiSF.message.title.includes(item.title) &&
          showNotiSF.message.product_name.includes(item.product_name) &&
          showNotiSF.message.time.includes(
            item.time.substring(showNotiSF.message.time.length - 4, showNotiSF.message.time.length - 1),
          )
        ) {
          checkNoti = true;
        }
      });
      expect(checkNoti).toBe(true);
    });

    await test.step(`Back lại app Convert> Click Notification list  > click button Add a custom notifications > Chọn Collections > Click button Select collection name> Chọn Product name > Click button Continue with selected products`, async () => {
      await coptPage.addCustomNoti(dataEdit.step_2);
      await coptPage.deleteCacheNoti("Sale noti");
    });

    await test.step(`Chọn Manually select locations > Input Location > Click button Create now`, async () => {
      dataNoti = await coptPage.getDataSalesNotificationsList();
      const checkNoti = {};
      for (const noti of dataNoti) {
        checkNoti[noti] = true;
      }
      for (const noticreated of dataNotiCreated.step_2) {
        const checkResult = checkNoti[noticreated];
        expect(checkResult).toEqual(true);
      }
    });

    await test.step(`Open SF> search product name > Click product name `, async () => {
      await homepage.gotoProduct(product);
      const showNotiSF = await getSalesNotificationsOnSF(homepage);
      let checkNoti = false;
      dataNoti.forEach(item => {
        if (
          showNotiSF.message.title.includes(item.title) &&
          showNotiSF.message.product_name.includes(item.product_name) &&
          showNotiSF.message.time.includes(
            item.time.substring(showNotiSF.message.time.length - 4, showNotiSF.message.time.length - 1),
          )
        ) {
          checkNoti = true;
        }
      });
      expect(checkNoti).toBe(true);
    });

    await test.step(`Back lại app Convert> Click Notification list  > click button Add a custom notifications > Chọn All product  > Click button Select collection name> Chọn Product name > Click button Continue with selected products`, async () => {
      await coptPage.addCustomNoti(dataEdit.step_3);
      await coptPage.deleteCacheNoti("Sale noti");
    });

    await test.step(`Chọn Manually select locations > Input Location > Click button Create now`, async () => {
      dataNoti = await coptPage.getDataSalesNotificationsList();
      const checkNoti = {};
      for (const noti of dataNoti) {
        checkNoti[noti] = true;
      }
      for (const noticreated of dataNotiCreated.step_3) {
        const checkResult = checkNoti[noticreated];
        expect(checkResult).toEqual(true);
      }
    });

    await test.step(`Open SF> search product name > Click product name `, async () => {
      await homepage.gotoProduct(product);
      const showNotiSF = await getSalesNotificationsOnSF(homepage);
      let checkNoti = false;
      dataNoti.forEach(item => {
        if (
          showNotiSF.message.title.includes(item.title) &&
          showNotiSF.message.product_name.includes(item.product_name) &&
          showNotiSF.message.time.includes(
            item.time.substring(showNotiSF.message.time.length - 4, showNotiSF.message.time.length - 1),
          )
        ) {
          checkNoti = true;
        }
      });
      expect(checkNoti).toBe(true);
    });
  });
});

test.describe("Convert Optimize notification with theme v3", async () => {
  let themeSettingAPI: SettingThemeAPI;
  let themeSetting: number;
  let appsPage: Apps;
  let dashboardPage;
  let domain;
  let app;
  let coptPage: BoostConvertInsidePage;
  let webBuilder: WebBuilder;
  let settingsData: PageSettingsData;
  let blockVisitorCounter: string, blockAdded: string, expected, dataContent, variantID;
  let inventoryQuantity: number;
  const softAssertion = expect.configure({ soft: true });

  test.beforeEach(async ({ dashboard, conf, theme, authRequest, builder }) => {
    domain = conf.suiteConf.domain;
    app = conf.suiteConf.app;
    expected = conf.caseConf.expected;
    dataContent = conf.caseConf.data_content;
    variantID = conf.caseConf.variant_id;
    coptPage = new BoostConvertInsidePage(dashboard, domain, authRequest);
    webBuilder = new WebBuilder(dashboard, domain);

    await test.step(`setting theme V3`, async () => {
      themeSetting = conf.suiteConf.themes_setting;
      themeSettingAPI = new SettingThemeAPI(theme);
      await themeSettingAPI.publishTheme(themeSetting);
    });
    await test.step(`Tại Menu > Chọn Apps > Setting toggle của app Convert= On`, async () => {
      appsPage = new Apps(dashboard, domain);
      dashboardPage = new DashboardPage(dashboard, domain);
      await dashboardPage.navigateToMenu("Apps");
      await appsPage.turnOnOffApp(app, true);
    });

    await test.step(`get data setting web`, async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.themes_setting);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.afterEach(async ({ conf, builder }) => {
    await builder.updateSiteBuilder(conf.suiteConf.themes_setting, settingsData);
  });

  test(`@SB_NEWECOM_CVO_102 [Stock Countdown] Verify set up Stock Countdown thành công với new  Style và  new Setting`, async ({
    conf,
    dashboard,
    context,
  }) => {
    await test.step(`Tại Menu, Chọn Counting Tool > Click buttn [ Use Stock Countdown Block] `, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(` Thực hiện edit các field Style `, async () => {
      await webBuilder.expandCollapseLayer(conf.caseConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.caseConf.open_layer);
      await webBuilder.switchToTab("Design");
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_design);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_content);
    });

    await test.step(`Click button Save`, async () => {
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });

    await test.step(`Click icon con mắt ( Preview on new tab) > Verify hiển thị Stock countdown`, async () => {
      // Verify SF preview
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(webBuilder.xpathButtonPreview),
      ]);
      // the wait url pass to start timer count down
      await sfTab.waitForResponse(
        response => response.url().includes("/apps/assets/locales/en.json") && response.status() === 200,
      );
      const content = await sfTab.locator(coptPage.contentStockCountdownSF).textContent();
      expect(content).toEqual(conf.caseConf.expect_content_stock_count_down);
    });
  });

  test(`@SB_NEWECOM_CVO_103 [Countdown Timer] Verify hiển thị hiển thị default của Countdown Timer`, async ({
    context,
    conf,
    dashboard,
  }) => {
    await test.step(`Tại Menu, Chọn Counting Tool > Click buttn [ Use Countdown Timer Block]`, async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(`Verify thông tin default các field của Style`, async () => {
      await webBuilder.expandCollapseLayer(conf.caseConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.caseConf.open_layer);
      await webBuilder.switchToTab("Design");
      const dataDesign = await webBuilder.getDesignAndContentWithSDK();
      await expect(JSON.stringify(dataDesign)).toEqual(JSON.stringify(conf.caseConf.expect_default_design));
    });

    await test.step(`Chọn Setting > Verify thông tin default`, async () => {
      await webBuilder.switchToTab("Content");
      const dataContent = await webBuilder.getDesignAndContentWithSDK();
      await expect(JSON.stringify(dataContent)).toEqual(JSON.stringify(conf.caseConf.expect_default_content));
    });

    await test.step(`Click icon con mắt ( Preview on new tab) > Verify hiển thị Countdown Timer`, async () => {
      // Verify SF preview
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(webBuilder.xpathButtonPreview),
      ]);
      const sfHome = new SFHome(sfTab, domain);
      await expect(async () => {
        const contentCountTimer = await sfHome.page.locator(webBuilder.xpathBlockCountTimer).textContent();
        expect(contentCountTimer).toEqual(conf.caseConf.data_expect.timer);
      }).toPass();
    });
  });

  const confCountDownTimer = loadData(__dirname, "COUNT_DOWN_TIMER_WITH_LAYOUT");
  for (let caseIndex = 0; caseIndex < confCountDownTimer.caseConf.data.length; caseIndex++) {
    const dataSetting = confCountDownTimer.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ dashboard, context }) => {
      await test.step(`Tại Menu, Chọn Counting Tool > Click buttn [ UseCountdown Timer  Block] `, async () => {
        await webBuilder.openWebBuilder({
          type: "site",
          id: themeSetting,
          page: "home",
        });
        await webBuilder.loadingScreen.waitFor();
        await webBuilder.page.waitForLoadState("networkidle");
      });

      await test.step(` Thực hiện edit các field Style `, async () => {
        await webBuilder.expandCollapseLayer(dataSetting.collapse_layer);
        await webBuilder.openLayerSettings(dataSetting.open_layer);
        await webBuilder.switchToTab("Design");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting.data_design);
      });

      await test.step(`Click button Save`, async () => {
        await webBuilder.clickOnBtnWithLabel("Save");
        await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      });

      await test.step(`Click icon con mắt ( Preview on new tab) > Verify hiển thị Countdown Timer `, async () => {
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        const sfHome = new SFHome(sfTab, domain);

        await expect(async () => {
          const contentCountTimer = await sfHome.page.locator(webBuilder.xpathBlockCountTimer).textContent();
          expect(contentCountTimer).toEqual(dataSetting.data_expect.timer);
        }).toPass();
        const layout = await sfHome.genLoc(webBuilder.countdownItem).nth(0).getAttribute("class");
        expect(layout).toContain(dataSetting.data_expect.layout);
      });
    });
  }

  test(`@SB_NEWECOM_CVO_117 [Visitor Counter] Verify action with block Visitor Counter on web builder`, async ({
    conf,
  }) => {
    const addBlockVisitorCounter = conf.caseConf.add_block_visitor_counter;

    await test.step(`Tại Menu, Chọn Counting Tool > Click buttn [ Use Real-Time Visitor Block] > Kéo block Visitor Counter tới vị trí block dưới Sale price> Edit text`, async () => {
      await appsPage.gotoAppsNE(app);
      await dashboardPage.navigateToMenu("Counting Tools");
      await dashboardPage.clickOnBtnWithLabel("Use Visitor Counter Block");
      await webBuilder.dragAndDropInWebBuilder(addBlockVisitorCounter);
    });

    await test.step(`Click button Duplicate `, async () => {
      blockVisitorCounter = webBuilder.getSelectorByIndex({
        section: 3,
        row: 2,
        column: 2,
        block: 3,
      });
      await webBuilder.clickOnElement(blockVisitorCounter, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      await expect(webBuilder.frameLocator.locator(webBuilder.getXpathVisitorCounter(2))).toBeVisible();
    });

    await test.step(`Click button Remove của Visitor Counter gốc `, async () => {
      await webBuilder.selectOptionOnQuickBar("Delete");
      await expect(webBuilder.frameLocator.locator(webBuilder.getXpathVisitorCounter())).toBeVisible();
    });

    await test.step(`Click butotn Hide`, async () => {
      await webBuilder.clickOnElement(blockVisitorCounter, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Hide");
      await expect(webBuilder.frameLocator.locator(webBuilder.getXpathVisitorCounter())).toHaveAttribute(
        "visible",
        "false",
      );
    });
  });

  const confVisitorCounter = loadData(__dirname, "VISITOR_COUNTER");
  for (let caseIndex = 0; caseIndex < confVisitorCounter.caseConf.data.length; caseIndex++) {
    const dataSetting = confVisitorCounter.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ context, dashboard }) => {
      const dataContent = dataSetting.data_content;

      await test.step(`Tại Menu, Chọn Counting Tool > Click buttn [ Use Real-Time Visitor Block] `, async () => {
        await webBuilder.openWebBuilder({
          type: "site",
          id: themeSetting,
          page: "home",
        });
        await webBuilder.loadingScreen.waitFor();
        await webBuilder.page.waitForLoadState("networkidle");
      });

      await test.step(` Thực hiện edit các field Style `, async () => {
        await webBuilder.expandCollapseLayer(dataSetting.collapse_layer);
        await webBuilder.openLayerSettings(dataSetting.open_layer);
        await webBuilder.switchToTab("Design");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting.data_design);
        await webBuilder.switchToTab("Content");
        await webBuilder.settingDesignAndContentWithSDK(dataSetting.data_content);
      });

      await test.step(`Click button Save`, async () => {
        await webBuilder.clickOnBtnWithLabel("Save");
        await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      });

      await test.step(`Click icon con mắt ( Preview on new tab) > Verify hiển thị Real-Time Visitor`, async () => {
        // Verify SF preview
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          dashboard.click(webBuilder.xpathButtonPreview),
        ]);
        await sfTab.waitForLoadState("networkidle");
        const sfHome = new SFHome(sfTab, domain);
        await webBuilder.genLoc(webBuilder.btnDeleteInSidebar).click();
        await webBuilder.clickOnBtnWithLabel("Save");
        await expect(webBuilder.toastMessage).toContainText("All changes are saved");
        const visitorRandom = parseInt(await sfTab.locator(webBuilder.xpathContentVisitorRandom).textContent());
        expect(visitorRandom).toBeGreaterThanOrEqual(dataContent.random_visitor.minValue);
        expect(visitorRandom).toBeLessThanOrEqual(dataContent.random_visitor.maxValue);
        const highlightType = await sfHome.genLoc(webBuilder.blockVisitor).nth(0).getAttribute("class");
        expect(highlightType).toContain(dataSetting.data_expect.highlight_type);
      });
    });
  }

  test(`@SB_NEWECOM_CVO_124 Kiểm tra hiển thị placeholder khi kéo block Stock countdown vào section chưa có data source và không chọn data source trong block`, async ({
    conf,
    page,
  }) => {
    const homepage = new SFHome(page, domain);

    await test.step(`Tại Customize page, click icon (+) trên Navigation Bar -> trên Insert Panel: -> kéo thả Section vào vị trí bất kỳ, không chọn data source cho section-> kéo thả block Stock countdown đến section vừa chọn- Không chọn data source cho block-> kiểm tra hiển thị Stock countdown `, async () => {
      blockAdded = await webBuilder.getSelectorByIndex({ section: 3, row: 1, column: 1, block: 1 });
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.openLayerSettings(conf.caseConf.open_layer);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(conf.caseConf.data_content);
      await webBuilder.hoverElementInIframe(webBuilder.frameLocator, blockAdded, webBuilder.page);
      await softAssertion(webBuilder.breadCrumb.getByRole("paragraph")).toHaveText(expected.missing_data_source);
    });

    await test.step(`- click button Save- kiểm tra hiển thị của block ngoài Storefront trên Desktop bằng cách truy cập url với domain shop `, async () => {
      await webBuilder.clickOnBtnWithLabel("Save");
      await homepage.gotoHomePage();
      await expect(homepage.genLoc(webBuilder.xpathContentStockCountdown)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_CVO_127 Kiểm tra hiển thị Stock countdown khi kéo block Stock countdown vào section chưa có data source và chọn data source`, async ({
    conf,
    dashboard,
    authRequest,
    page,
  }) => {
    const dasboardAPI = new DashboardAPI(domain, authRequest, dashboard);
    const homepage = new SFHome(page, domain);

    await test.step(`Tại Customize page, click icon (+) trên Navigation Bar -> trên Insert Panel: -> kéo thả Section vào vị trí bất kỳ, không chọn data source cho section-> kéo thả block Stock countdown đến section vừa chọn- Tại popup required select data source, click chọn data sourece là product -> kiểm tra hiển thị Stock countdown `, async () => {
      // get inventory Quantity off variant
      inventoryQuantity = await dasboardAPI.getInventoryVariantInfoByIds(variantID);
      blockAdded = await webBuilder.getSelectorByIndex({ section: 3, row: 1, column: 1, block: 1 });
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.openLayerSettings(conf.caseConf.open_layer);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(dataContent.source_none);
      await webBuilder.hoverElementInIframe(webBuilder.frameLocator, blockAdded, webBuilder.page);
      await softAssertion(webBuilder.breadCrumb.getByRole("paragraph")).toHaveText(expected.missing_data_source);

      // setting data source product
      await webBuilder.settingDesignAndContentWithSDK(dataContent.product_source);
    });

    await test.step(`- click button Save- kiểm tra hiển thị của block ngoài Storefront trên Desktop bằng cách truy cập url với domain shop `, async () => {
      await webBuilder.clickOnBtnWithLabel("Save");
      await homepage.gotoHomePage();
      const inventoryQuantitySF = parseInt(await homepage.genLoc(webBuilder.xpathContentStockCountdown).textContent());
      expect(inventoryQuantity).toEqual(inventoryQuantitySF);
    });
  });

  test(`@SB_NEWECOM_CVO_128 Kiểm tra hiển thị Stock countdown khi kéo block Stock countdown vào section chưa có data source và chọn data source là Product với variant có track inventory <=0`, async ({
    conf,
    page,
  }) => {
    const homepage = new SFHome(page, domain);

    await test.step(`Tại Customize page, click icon (+) trên Navigation Bar -> trên Insert Panel: -> kéo thả Section vào vị trí bất kỳ, không chọn data source cho section-> kéo thả block Stock countdown đến section vừa chọn- Tại popup required select data source, click chọn data sourece là product -> kiểm tra hiển thị Stock countdown `, async () => {
      // get inventory Quantity off variant
      blockAdded = await webBuilder.getSelectorByIndex({ section: 3, row: 1, column: 1, block: 1 });
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.openLayerSettings(conf.caseConf.open_layer);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(dataContent.source_none);
      await webBuilder.hoverElementInIframe(webBuilder.frameLocator, blockAdded, webBuilder.page);
      await softAssertion(webBuilder.breadCrumb.getByRole("paragraph")).toHaveText(expected.missing_data_source);

      // Chọn data source product has inventory quantity <=0
      await webBuilder.settingDesignAndContentWithSDK(dataContent.product_source);
      const inventoryQuantity = await webBuilder.frameLocator
        .locator(webBuilder.xpathContentStockCountdown)
        .textContent();
      expect(inventoryQuantity).toEqual("X");
    });

    await test.step(`- click button Save- kiểm tra hiển thị của block ngoài Storefront trên Desktop bằng cách truy cập url với domain shop > Chọn Variant L`, async () => {
      await webBuilder.clickOnBtnWithLabel("Save");
      await homepage.gotoHomePage();
      await expect(homepage.genLoc(webBuilder.xpathContentStockCountdown)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_CVO_129 Kiểm tra hiển thị Stock countdown khi kéo block Stock countdown vào section đã có data source  là Product track inventory >0`, async ({
    conf,
    dashboard,
    page,
    authRequest,
  }) => {
    const dasboardAPI = new DashboardAPI(domain, authRequest, dashboard);
    const homepage = new SFHome(page, domain);

    await test.step(`Tại Customize page, click icon (+) trên Navigation Bar -> trên Insert Panel: -> kéo thả Section vào vị trí bất kỳ, không chọn data source cho section-> kéo thả block Stock countdown đến section vừa chọn- Tại popup required select data source, click chọn data sourece là product -> kiểm tra hiển thị Stock countdown `, async () => {
      // get inventory Quantity off variant
      inventoryQuantity = await dasboardAPI.getInventoryVariantInfoByIds(variantID);
      blockAdded = await webBuilder.getSelectorByIndex({ section: 3, row: 1, column: 1, block: 1 });
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.openLayerSettings(conf.caseConf.open_layer);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK(dataContent.source_none);
      await webBuilder.hoverElementInIframe(webBuilder.frameLocator, blockAdded, webBuilder.page);
      await softAssertion(webBuilder.breadCrumb.getByRole("paragraph")).toHaveText(expected.missing_data_source);

      // setting data source product
      await webBuilder.settingDesignAndContentWithSDK(dataContent.product_source);
    });

    await test.step(`- click button Save- kiểm tra hiển thị của block ngoài Storefront trên Desktop bằng cách truy cập url với domain shop  > Chọn Size S`, async () => {
      await webBuilder.clickOnBtnWithLabel("Save");
      await homepage.gotoHomePage();
      const inventoryQuantitySF = parseInt(await homepage.genLoc(webBuilder.xpathContentStockCountdown).textContent());
      expect(inventoryQuantity).toEqual(inventoryQuantitySF);
    });
  });
});
