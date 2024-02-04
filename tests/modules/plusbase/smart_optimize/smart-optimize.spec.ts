import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

let dashboardPage: DashboardPage;
let shopDomain: string;
let themePage: ThemeDashboard;
let webBuilder: WebBuilder;
let tooltipSmartOptimize: string;
let optionCustomizePage: string;
let optionRevertPage: string;

test.describe("Smart optimize for PLB", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    shopDomain = conf.suiteConf.domain;
    tooltipSmartOptimize = conf.suiteConf.tooltip_smart_optimize;
    optionCustomizePage = conf.caseConf.option_customize_page;
    optionRevertPage = conf.caseConf.option_revert_page;
    test.setTimeout(conf.suiteConf.time_out);
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    await dashboardPage.navigateToSubMenu("Online Store", "Design");
    themePage = new ThemeDashboard(dashboard, shopDomain);
    webBuilder = new WebBuilder(dashboard, shopDomain);
    await themePage.settingSmartOptimize("Smart Optimize", "off");
  });

  test(`@SB_OLS_AP_04 Verify edit page product detail khi đang turn on autopilot page product detail`, async ({
    dashboard,
  }) => {
    await test.step(`Chọn "Customize" theme > Page`, async () => {
      //On smart optimize
      await themePage.settingSmartOptimize("Smart Optimize", "on");

      //Vào online store > Design > Click button Customize theme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
      //Click layer Pages
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toEqual("active");
    });

    await test.step(`Hover vào icon smart optimize của page product detail`, async () => {
      await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).hover();
      await expect(webBuilder.visibleTooltip).toContainText(tooltipSmartOptimize);
    });

    await test.step(`Chọn page product detail > Thêm block từ insert panel`, async () => {
      await webBuilder.clickPageByName("Product detail");
      await expect(webBuilder.insertPanel).toHaveCount(0);
    });

    await test.step(`Click side bar, quickbar setting `, async () => {
      await webBuilder.clickOnElement(webBuilder.xpathBlockRating, webBuilder.iframe);
      const blocks = new Blocks(dashboard, shopDomain);
      expect(
        await webBuilder.isElementExisted(blocks.quickBarSetting, blocks.page.frameLocator(webBuilder.iframe)),
      ).toBe(false);

      await expect(blocks.settingsTabContainer).toBeHidden();
    });
  });

  test(`@SB_OLS_AP_05 Verify edit page cart đang turn on autopilot page cart`, async ({ conf, dashboard }) => {
    await test.step(`Chọn "Customize" theme > Page`, async () => {
      //On smart optimize
      await themePage.settingSmartOptimize("Smart Optimize", "on");

      //openCustomizeTheme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("pages");
      expect(await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Cart")).getAttribute("class")).toEqual(
        "active",
      );
    });

    await test.step(`Hover vào icon smart optimize của page cart`, async () => {
      await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Cart")).hover();
      await expect(webBuilder.visibleTooltip).toContainText(tooltipSmartOptimize);
    });

    await test.step(`Chọn page cart > Thêm block từ insert panel `, async () => {
      await webBuilder.clickPageByName("Cart", 3);
      await expect(webBuilder.insertPanel).toHaveCount(0);
    });

    await test.step(`Click side bar, quickbar setting`, async () => {
      await webBuilder.clickOnElement(webBuilder.xpathBlockCartItems, webBuilder.iframe);
      const blocks = new Blocks(dashboard, conf.suiteConf.domain);
      expect(
        await webBuilder.isElementExisted(blocks.quickBarSetting, blocks.page.frameLocator(webBuilder.iframe)),
      ).toBe(false);

      await expect(blocks.settingsTabContainer).toBeHidden();
    });
  });

  test(`@SB_OLS_AP_06 Verify edit page checkout đang turn on autopilot page checkout`, async ({ conf, dashboard }) => {
    await test.step(`Chọn "Customize" theme > Page`, async () => {
      //On smart optimize
      await themePage.settingSmartOptimize("Smart Optimize", "on");

      //openCustomizeTheme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Checkout")).getAttribute("class"),
      ).toEqual("active");
    });

    await test.step(`Hover vào icon smart optimize của page checkout`, async () => {
      await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Checkout")).hover();
      await expect(webBuilder.visibleTooltip).toContainText(tooltipSmartOptimize);
    });

    await test.step(`Chọn page checkout  >Thêm block từ insert panel`, async () => {
      await webBuilder.clickPageByName("Checkout");
      await expect(webBuilder.insertPanel).toHaveCount(0);
    });

    await test.step(`Click side bar, quickbar setting`, async () => {
      const blocks = new Blocks(dashboard, conf.suiteConf.domain);
      await webBuilder.clickOnElement(webBuilder.xpathBlockCheckout, webBuilder.iframe);
      expect(
        await webBuilder.isElementExisted(blocks.quickBarSetting, blocks.page.frameLocator(webBuilder.iframe)),
      ).toBe(false);

      await expect(blocks.settingsTabContainer).toBeHidden();
    });
  });

  test(`@SB_OLS_AP_07 Verify page product detail khi turn off autopilot những vẫn dùng data setting page từ store template`, async ({
    conf,
  }) => {
    await test.step(`Turn off autopilot với page product detail > Chọn "Customize" theme > Page`, async () => {
      //Off smart optimize: chọn option: Be able to customize from Smart Optimize version
      await themePage.settingSmartOptimize("Smart Optimize", "on");
      await themePage.settingSmartOptimize("Smart Optimize", "off", optionCustomizePage);

      //openCustomizeTheme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toBe("");
    });

    await test.step(`Chọn page product detail > Edit page`, async () => {
      await webBuilder.clickPageByName("Product detail");
      await expect(webBuilder.insertPanel).toHaveCount(1);
      expect(await webBuilder.isElementExisted(webBuilder.xpathBlockRating, webBuilder.frameLocator, 15000)).toBe(true);
    });

    await test.step(`Save > Preview page`, async () => {
      //Add block count timer
      const addBlockCountTimer = conf.caseConf.add_block_timer_countdown;
      await webBuilder.dragAndDropInWebBuilder(addBlockCountTimer);
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });
  });

  test(`@SB_OLS_AP_10 Verify page product detail khi turn off autopilot, chọn trở về phiên bản trước của page`, async ({
    conf,
  }) => {
    await test.step(`Turn off autopilot với page product detail`, async () => {
      // turn off smart optimize > verify page product detail
      await themePage.settingSmartOptimize("Smart Optimize", "on");
      await themePage.settingSmartOptimize("Smart Optimize", "off");

      //openCustomizeTheme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toEqual("");
      await webBuilder.clickPageByName("Product detail");
      expect(await webBuilder.isElementExisted(webBuilder.xpathBlockRating, webBuilder.frameLocator, 15000)).toBe(true);

      //Xóa block rating
      await webBuilder.clickOnElement(webBuilder.xpathBlockRating, webBuilder.iframe);
      await webBuilder.genLoc(webBuilder.btnDeleteInSidebar).click();
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      await webBuilder.clickOnBtnWithLabel("Exit");

      //turn on smart optimize: verify page product detail hiển thị block rating
      await themePage.settingSmartOptimize("Smart Optimize", "on");

      //openCustomizeTheme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toEqual("active");
      await webBuilder.clickPageByName("Product detail");
      expect(await webBuilder.isElementExisted(webBuilder.xpathBlockRating, webBuilder.frameLocator, 15000)).toBe(true);
      await webBuilder.clickOnBtnWithLabel("Exit");

      //Off smart optimize
      await themePage.settingSmartOptimize("Smart Optimize", "off", optionRevertPage);
    });

    await test.step(`Chọn "Customize" theme > Page`, async () => {
      //Customize theme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });

      //Click page product detail
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toBe("");
    });

    await test.step(`Chọn page product detail > Edit page`, async () => {
      await webBuilder.clickPageByName("Product detail");
      await expect(webBuilder.insertPanel).toHaveCount(1);

      //Verify không hiển thị block rating
      expect(await webBuilder.isElementExisted(webBuilder.xpathBlockRating, webBuilder.frameLocator, 15000)).toBe(
        false,
      );

      //Add block count timer
      const addBlockCountTimer = conf.caseConf.add_block_timer_countdown;
      await webBuilder.dragAndDropInWebBuilder(addBlockCountTimer);
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });
  });

  test(`@SB_OLS_AP_18 Verify khi turn off autopilot nhưng chỉ turn off một số page`, async ({ conf }) => {
    await test.step(`Turn off autopilot với page product detail`, async () => {
      // turn off smart optimize > verify page product detail
      await themePage.settingSmartOptimize("Smart Optimize", "on");
      await themePage.settingSmartOptimize("Smart Optimize", "off");

      //openCustomizeTheme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toEqual("");
      await webBuilder.clickPageByName("Product detail");
      expect(await webBuilder.isElementExisted(webBuilder.xpathBlockRating, webBuilder.frameLocator, 15000)).toBe(true);

      //Xóa block rating
      await webBuilder.clickOnElement(webBuilder.xpathBlockRating, webBuilder.iframe);
      await webBuilder.genLoc(webBuilder.btnDeleteInSidebar).click();
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      await webBuilder.clickOnBtnWithLabel("Exit");

      //turn on smart optimize: verify page product detail hiển thị block rating
      await themePage.settingSmartOptimize("Smart Optimize", "on");

      //openCustomizeTheme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toEqual("active");
      await webBuilder.clickPageByName("Product detail");
      expect(await webBuilder.isElementExisted(webBuilder.xpathBlockRating, webBuilder.frameLocator, 15000)).toBe(true);
      await webBuilder.clickOnBtnWithLabel("Exit");

      //Off smart optimize
      await themePage.settingSmartOptimize("Product details", "off");
    });

    await test.step(`Chọn "Customize" theme > Page`, async () => {
      //Customize theme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });

      //Click page product detail
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toBe("");
      expect(await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Cart")).getAttribute("class")).toBe(
        "active",
      );
      expect(await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Checkout")).getAttribute("class")).toBe(
        "active",
      );
    });

    await test.step(`Chọn page product detail `, async () => {
      await webBuilder.clickPageByName("Product detail");
      await expect(webBuilder.insertPanel).toHaveCount(1);

      //Verify không hiển thị block rating
      expect(await webBuilder.isElementExisted(webBuilder.xpathBlockRating, webBuilder.frameLocator, 15000)).toBe(
        false,
      );
    });

    await test.step(`Edit page > Save`, async () => {
      //Add block count timer
      const addBlockCountTimer = conf.caseConf.add_block_timer_countdown;
      await webBuilder.dragAndDropInWebBuilder(addBlockCountTimer);
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });
  });

  test(`@SB_OLS_AP_15 Verify khi turn on autopilot nhưng chỉ turn on một số page`, async ({ dashboard }) => {
    await test.step(`Online Store > Design> Turn on autopilot vói page product detail > Chọn "Customize" theme > Page`, async () => {
      //On smart optimize
      await themePage.settingSmartOptimize("Smart Optimize", "on");

      //Off page cart and page checkout
      await themePage.settingSmartOptimize("Cart", "off");
      await themePage.settingSmartOptimize("Checkout", "off");

      //Vào online store > Design > Click button Customize theme
      await themePage.clickOnBtnWithLabel("Customize");
      await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });

      //Click layer Pages
      await webBuilder.clickBtnNavigationBar("pages");
      expect(
        await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).getAttribute("class"),
      ).toEqual("active");
      expect(await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Cart")).getAttribute("class")).toBe("");
      expect(await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Checkout")).getAttribute("class")).toBe(
        "",
      );
    });

    await test.step(`Hover vào icon smart optimize của page product detail`, async () => {
      await webBuilder.page.locator(webBuilder.xpathIconSmartOptimize("Product detail")).hover();
      await expect(webBuilder.visibleTooltip).toContainText(tooltipSmartOptimize);
    });

    await test.step(`Chọn page product detail > Thêm block từ insert panel`, async () => {
      await webBuilder.clickPageByName("Product detail");
      await expect(webBuilder.insertPanel).toHaveCount(0);
      expect(await webBuilder.isElementExisted(webBuilder.xpathBlockRating, webBuilder.frameLocator, 15000)).toBe(true);
    });

    await test.step(`Click side bar, quickbar setting `, async () => {
      await webBuilder.clickOnElement(webBuilder.xpathBlockRating, webBuilder.iframe);
      const blocks = new Blocks(dashboard, shopDomain);
      expect(
        await webBuilder.isElementExisted(blocks.quickBarSetting, blocks.page.frameLocator(webBuilder.iframe)),
      ).toBe(false);

      await expect(blocks.settingsTabContainer).toBeHidden();
    });
  });
});
