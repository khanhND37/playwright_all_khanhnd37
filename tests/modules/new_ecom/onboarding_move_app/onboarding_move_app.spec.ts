import { defaultSnapshotOptions } from "@constants/visual_compare";
import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { snapshotDir } from "@core/utils/theme";
import { AppsAPI } from "@pages/api/apps";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { Apps } from "@pages/dashboard/apps";
import { ProductPage } from "@pages/dashboard/products";
import { WbWebsitePages } from "@pages/dashboard/wb-website-page";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";

let wbWebsitePages: WbWebsitePages;
let sectionPage: Sections;
let statusBoostUpsell;
let statusConversionOptimizer;
let statusProductReviews;
let dashboardPage: ProductPage;
let appPage: Apps;
let appAPIPage: AppsAPI;
let image;
let accessToken: string;
let listApps: Array<string>;

test.describe("NE - Onboarding & move app", async () => {
  test.beforeEach(async ({ dashboard, conf, request }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPage = new ProductPage(dashboard, conf.suiteConf.domain);
    appPage = new Apps(dashboard, conf.caseConf.domain);
    wbWebsitePages = new WbWebsitePages(dashboard, conf.suiteConf.domain);
    sectionPage = new Sections(dashboard, conf.suiteConf.domain);
    appAPIPage = new AppsAPI(conf.suiteConf.domain, request, dashboard);
    test.setTimeout(conf.suiteConf.timeout);
    image = conf.caseConf.image;
  });

  test(`@SB_NEWECOM_OMA_13 kiểm tra hiển thị khi user lần lượt click checkbox "Mark as completed" tại Onboarding trên Dashboard app`, async ({
    dashboard,
    conf,
    snapshotFixture,
    token,
  }) => {
    const lastOnboardingItem = conf.suiteConf.last_onboarding_item;
    await test.step("Pre-condition: Untick all Onboarding item", async () => {
      const shopToken = await token.getWithCredentials({
        domain: conf.suiteConf.shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken.access_token;
      await appAPIPage.setupOnboarding(conf.suiteConf.domain, conf.caseConf.onboarding_untick, accessToken);
      await dashboardPage.navigateToMenu("Apps");
      await appPage.openApp("Product Reviews");
    });

    await test.step("Tại dashboard shop -> scroll đến App -> click chọn app Review tại list app, user lần lượt thực hiện các nội dung của Onboarding-> click checkbox 'Mark as completed' đánh dấu đã hoàn thành-> kiểm tra hiển thị trên Desktop và Mobile", async () => {
      await appPage.page.waitForSelector(appPage.xpathOnboardingItem);
      const countOnboarding = await appPage.page.locator(appPage.xpathOnboardingItem).count();
      for (let i = 1; i <= countOnboarding; i++) {
        await appPage.page.click(`${appPage.xpathOnboardingItem}[1]`);
        await appPage.clickElementWithLabel("span", "Mark as Completed", i);

        if (i != lastOnboardingItem) {
          await snapshotFixture.verify({
            page: dashboard,
            selector: appPage.xpathProgressBar,
            snapshotName: `${i} - ${conf.suiteConf.env} - ${image.image_progress}`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        }
      }
      // click nhanh quá page hay bị something went wrong, nên phải wait
      await appPage.page.waitForTimeout(3 * 1000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: appPage.xpathOnboardingComplete,
        snapshotName: `${image.image_banner_complete}`,
        screenshotOptions: { animations: "disabled" },
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
      await expect(appPage.genLoc(appPage.xpathOnboardingContent)).not.toBeVisible();
    });

    await test.step("click button 'Revise here'-> kiểm tra hiển thị", async () => {
      await appPage.page.click(appPage.getXpathWithLabel("Revise here"));
      await appPage.waitUntilElementInvisible(appPage.xpathIconLoading);
      await snapshotFixture.verify({
        page: dashboard,
        selector: appPage.xpathOnboardingContent,
        screenshotOptions: { animations: "disabled" },
        snapshotName: `${conf.suiteConf.env}-${image.image_onboarding_content}`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("click button 'Hide' -> kiểm tra hiển thị", async () => {
      await appPage.page.click(appPage.getXpathWithLabel("Hide"));
      await expect(appPage.genLoc(appPage.xpathOnboardingContent)).not.toBeVisible();
    });
  });

  test("@SB_NEWECOM_OMA_19 Verify  hiển thị khi thực hiện Create / Delete  app api bất kỳ cho Private Apps", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const appName = conf.caseConf.app_name;
    await test.step("Step 1: Tại Menu > Click chọn Private App > Kiểm tra hiển thị UI", async () => {
      await dashboardPage.navigateToMenu("Contacts");
      await dashboardPage.navigateToSubMenu("Apps", "Private apps");
      await dashboardPage.waitUntilElementInvisible(appPage.xpathTableLoad);
      await snapshotFixture.verify({
        page: dashboard,
        selector: appPage.xpathPrivateAppsPage,
        snapshotName: conf.caseConf.image,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Click button Create a new private app > Input infor > Click button Save > Click chọn Private App", async () => {
      await appPage.clickOnBtnWithLabel("Create a new private app");
      await appPage.createPrivateApp(appName, conf.caseConf.email);
      expect(await dashboardPage.getMessageError()).toBe("Private app created successfully");
    });

    await test.step("Chọn Private App, Click button Delete cho app bất kỳ trong list app >  hiển thị popup confirm 'Delete private app'  -> click button Delete this private app >click icon Delete cho app bất kỳ trong list app -> hiển thị popup confirm 'Delete private app'-> click button Delete this private app", async () => {
      await appPage.clickOnTextLinkWithLabel("Private apps");
      await appPage.deletePrivateApp(appName);
      expect(await dashboardPage.getTextContent(dashboardPage.xpathToastMessage)).toBe(`${appName} deleted`);
    });
  });

  test("@SB_NEWECOM_OMA_28 kiểm tra hoạt động của App khi switch theme", async ({
    dashboard,
    snapshotFixture,
    conf,
  }) => {
    const listAppsV2 = conf.caseConf.list_app_v2;
    const listBlocks = conf.caseConf.list_block;
    const status = conf.caseConf.status;
    await test.step("tại tab bar menu -> click Apps -> lần lượt click sub menu Apps, Integrations, Private App -> click lần lượt vào app name -> kiểm tra hiển thị app detail page ", async () => {
      await dashboardPage.navigateToMenu("Apps");
      statusBoostUpsell = await appPage.getStatusOnOffAppByName("Boost Upsell");
      expect(statusBoostUpsell).toEqual(status.status_boost_upsell);

      statusConversionOptimizer = await appPage.getStatusOnOffAppByName("Conversion Optimizer");
      expect(statusConversionOptimizer).toEqual(status.status_boost_conversion_optimizer);

      statusProductReviews = await appPage.getStatusOnOffAppByName("Product Reviews");
      expect(statusProductReviews).toEqual(status.product_reviews);
    });

    await test.step("tại tab bar menu -> click Online Store -> tại theme Criadora đang publish -> click button Customize -> tại page chứa block, kiểm tra hiển thị ", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();
      await wbWebsitePages.waitForElementVisibleThenInvisible(wbWebsitePages.overlay);

      for (let i = 0; i < listBlocks.length; i++) {
        await wbWebsitePages.genLoc(sectionPage.insertPanelButton).click();
        await wbWebsitePages.searchbarTemplate.fill(listBlocks[i]);
        await wbWebsitePages.page.keyboard.press("Enter");
        await snapshotFixture.verify({
          page: dashboard,
          selector: wbWebsitePages.xpathBlockInInsertPanel(listBlocks[i]),
          snapshotName: `${i + 1} - ${image.block}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });

    await test.step("tại Dashboard, tabbar menu -> click Online Store -> tại theme Inside, click button Publish -> click button Publish tại popup Publish template ", async () => {
      await wbWebsitePages.clickOnBtnWithLabel("Exit");
      if (await wbWebsitePages.page.locator(dashboardPage.selectorPopupContainer).isVisible({ timeout: 3000 })) {
        await wbWebsitePages.clickElementWithLabel("span", "Leave");
      }
      await wbWebsitePages.clickOnBtnWithLabel("Publish");
      await wbWebsitePages.clickElementWithLabel("span", "Publish", 2);
      expect(await dashboardPage.isTextVisible(conf.caseConf.message)).toBeTruthy();
    });

    await test.step("tại tab bar menu -> click Apps -> click lần lượt vào app name -> kiểm tra hiển thị app detail page", async () => {
      await dashboardPage.navigateToMenu("Apps");
      for (let i = 0; i < listAppsV2.length; i++) {
        await snapshotFixture.verify({
          page: dashboard,
          selector: appPage.xpathBlockAppV2(listAppsV2[i]),
          snapshotName: `${i + 1} - ${image.list_app_v2}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });

    await test.step("tại Dashboard, tabbar menu -> click Online Store -> click Add themes -> tại tab Theme, chọn Criadora -> click button 'Add Criadora' ->  tại theme Criadora vừa add, click button Publish -> click button Publish tại popup Publish template ", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await dashboardPage.clickOnBtnWithLabel("Publish");
      await dashboardPage.clickElementWithLabel("span", "Publish", 2);
      expect(await dashboardPage.isTextVisible(conf.caseConf.message)).toBeTruthy();
    });

    await test.step("tại tab bar menu -> click Apps -> lần lượt click sub menu Apps, Integrations, Private App -> click lần lượt vào app name -> kiểm tra hiển thị app detail page ", async () => {
      await dashboardPage.navigateToMenu("Apps");
      statusBoostUpsell = await appPage.getStatusOnOffAppByName("Boost Upsell");
      expect(statusBoostUpsell).toEqual(status.status_boost_upsell);

      statusConversionOptimizer = await appPage.getStatusOnOffAppByName("Conversion Optimizer");
      expect(statusConversionOptimizer).toEqual(status.status_boost_conversion_optimizer);

      statusProductReviews = await appPage.getStatusOnOffAppByName("Product Reviews");
      expect(statusProductReviews).toEqual(status.product_reviews);
    });

    await test.step("tại tab bar menu -> click Online Store -> tại theme Criadora đang publish -> click button Customize -> tại page chứa block, kiểm tra hiển thị ", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();
      await wbWebsitePages.waitForElementVisibleThenInvisible(wbWebsitePages.overlay);

      for (let i = 0; i < listBlocks.length; i++) {
        await wbWebsitePages.genLoc(sectionPage.insertPanelButton).click();
        await wbWebsitePages.searchbarTemplate.fill(listBlocks[i]);
        await wbWebsitePages.page.keyboard.press("Enter");
        await snapshotFixture.verify({
          page: dashboard,
          selector: wbWebsitePages.xpathBlockInInsertPanel(listBlocks[i]),
          snapshotName: `${i + 1} - ${image.block}`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
        });
      }
    });
  });

  test("@SB_NEWECOM_OMA_38 verify migrate app khi chuyển từ theme V2 Lên V3 và ngược lại", async ({
    authRequest,
    theme,
    conf,
  }) => {
    const themeId = conf.suiteConf.theme_id;
    const themeSetting = new SettingThemeAPI(theme);
    await test.step("Vào theme > Publish theme V3 > Vào App list > check app", async () => {
      await themeSetting.publishTheme(themeId);
      await dashboardPage.navigateToMenu("Apps");
      const response = await authRequest.get(`https://${conf.suiteConf.domain}/admin/shop/installed_apps.json`);
      const responseJson = await response.json();
      listApps = [];
      for (let i = 0; i < responseJson.apps.length; i++) {
        listApps.push(responseJson.apps[i].app_name);
      }
    });

    await test.step("Vào theme > Publish theme V2 > Vào App list > check app", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await dashboardPage.clickOnBtnWithLabel("Publish");
      await dashboardPage.clickElementWithLabel("span", "Publish", 2);
      await dashboardPage.navigateToMenu("Apps");
      for (let i = 0; i < listApps.length; i++) {
        expect(await dashboardPage.isTextVisible(listApps[i]));
      }
    });
  });
});
