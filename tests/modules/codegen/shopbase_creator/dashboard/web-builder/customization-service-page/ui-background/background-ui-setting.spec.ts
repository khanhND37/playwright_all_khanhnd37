import { expect, test } from "@core/fixtures";
import { Page } from "@playwright/test";
import { WbPageCustomizationService } from "@pages/dashboard/wb_page_customization_service";
import { MyCustomizationServicePage } from "@pages/shopbase_creator/storefront/my_customization_service";
import { generateRandomMailToThisEmail } from "@utils/mail";
import { SbWebBuilderBcreB } from "./background-ui-setting";

test.describe("Verify setting shadow của customization service block", () => {
  let dashboard: Page;
  let wbCsPage: WbPageCustomizationService;
  let productHandle: string;

  test.beforeEach(async ({ dashboard: db, conf }) => {
    test.slow();
    dashboard = db;
    wbCsPage = new WbPageCustomizationService(dashboard, conf.suiteConf.domain);
    await test.step(`Login vào shop creator, vào web builder, click vào page selector, chọn page "Customization service" trên page selector`, async () => {
      await wbCsPage.openCustomizationServicePage();
      await wbCsPage.clickCustomizationServiceBlock();
      await wbCsPage.resetCustomizationServiceBlockSetting();
    });

    productHandle = conf.suiteConf.product_handle;
  });

  test(`@SB_WEB_BUILDER_BCRE_BCS_10 Verify block customization service khi thực hiện setting shadow`, async ({
    page,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const myCSPage = new MyCustomizationServicePage(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbWebBuilderBcreB;

    const steps = caseConf.steps;

    for (const step of steps) {
      await test.step(step.name, async () => {
        const aligns = step.data;
        for (const align of aligns) {
          await wbCsPage.clickCustomizationServiceBlock();
          if (align.style) {
            // update style
            await wbCsPage.changeDesign(align.style);
            const isSaveButtonEnabled = await wbCsPage.page.locator("//button[normalize-space()='Save']").isEnabled({
              timeout: 3000,
            });
            if (isSaveButtonEnabled) {
              await wbCsPage.clickBtnNavigationBar("save");
              await expect(wbCsPage.page.locator("text=i All changes are saved >> div")).toBeVisible();
              await wbCsPage.page.waitForSelector("text=i All changes are saved >> div", { state: "hidden" });
            }
          }

          // Verify wb (sidebar ~> setting = Auto + screenshot)
          await snapshotFixture.verify({
            page: wbCsPage.page,
            selector: wbCsPage.getXpathSidebarSetting("background"),
            snapshotName: align.screenshot_name.wb_sidebar,
          });

          await wbCsPage.backBtn.click({
            delay: 2000, // Need to click slow because wb load slow
          });
          await snapshotFixture.verifyWithIframe({
            page: wbCsPage.page,
            iframe: wbCsPage.iframe,
            selector: "#app",
            snapshotName: align.screenshot_name.wb,
            screenshotOptions: {
              mask: [wbCsPage.frameLocator.locator(wbCsPage.xpathQuestionBlock)],
            },
          });

          // Verify SF preview
          const [sfTab] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(wbCsPage.xpathButtonPreview),
          ]);

          await expect(sfTab.locator(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );

          await snapshotFixture.verify({
            page: sfTab,
            selector: "body",
            snapshotName: align.screenshot_name.sf_preview,
            screenshotOptions: {
              mask: [sfTab.locator(myCSPage.xpathSectionMyProductQuestion)],
            },
          });
          await sfTab.close();

          // Verify SF
          const checkoutEmail = generateRandomMailToThisEmail();
          await myCSPage.checkoutProduct(productHandle, checkoutEmail);
          await expect(myCSPage.genLoc(myCSPage.xpathOrderConfirmed)).toBeVisible();

          await myCSPage.genLoc(myCSPage.xpathBtnAccessMyContent).click();
          await myCSPage.page.waitForLoadState("domcontentloaded");

          const currentUrl = myCSPage.page.url();
          // TODO: remove hotfix after Mr. Hoang Do fix, this is workaround solution
          const workingUrl = currentUrl.replace("/start", "");
          await myCSPage.page.goto(workingUrl);

          // wait all css loaded
          await expect(myCSPage.genLoc(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );

          await snapshotFixture.verify({
            page: myCSPage.page,
            selector: "html",
            snapshotName: align.screenshot_name.sf,
            screenshotOptions: {
              mask: [myCSPage.page.locator(myCSPage.xpathBlockProductQuestion)],
            },
          });
          await myCSPage.removeCustomerToken();
        }
      });
    }
  });
});

test.describe("Verify setting shadow của question block", () => {
  let dashboard: Page;
  let wbCsPage: WbPageCustomizationService;
  let productHandle: string;

  test.beforeEach(async ({ dashboard: db, conf }) => {
    test.slow();
    dashboard = db;
    wbCsPage = new WbPageCustomizationService(dashboard, conf.suiteConf.domain);
    await test.step(`Login vào shop creator, vào web builder, click vào page selector, chọn page "Customization service" trên page selector`, async () => {
      await wbCsPage.openCustomizationServicePage();
      await wbCsPage.clickQuestionBlock();
      await wbCsPage.resetQuestionBlockSetting();
    });

    productHandle = conf.suiteConf.product_handle;
  });

  test(`@SB_WEB_BUILDER_BCRE_BSQ_11 Verify block question khi thực hiện setting shadow`, async ({
    page,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const myCSPage = new MyCustomizationServicePage(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbWebBuilderBcreB;

    const steps = caseConf.steps;

    for (const step of steps) {
      await test.step(step.name, async () => {
        const aligns = step.data;
        for (const align of aligns) {
          await wbCsPage.clickQuestionBlock();
          if (align.style) {
            // update style
            await wbCsPage.changeDesign(align.style);
            const isSaveButtonEnabled = await wbCsPage.page.locator("//button[normalize-space()='Save']").isEnabled({
              timeout: 3000,
            });
            if (isSaveButtonEnabled) {
              await wbCsPage.clickBtnNavigationBar("save");
              await expect(wbCsPage.page.locator("text=i All changes are saved >> div")).toBeVisible();
              await wbCsPage.page.waitForSelector("text=i All changes are saved >> div", { state: "hidden" });
            }
          }

          // Verify wb (sidebar ~> setting = Auto + screenshot)
          await snapshotFixture.verify({
            page: wbCsPage.page,
            selector: wbCsPage.getXpathSidebarSetting("background"),
            snapshotName: align.screenshot_name.wb_sidebar,
          });

          await wbCsPage.backBtn.click({
            delay: 2000, // Need to click slow because wb load slow
          });
          await snapshotFixture.verifyWithIframe({
            page: wbCsPage.page,
            iframe: wbCsPage.iframe,
            selector: "#app",
            snapshotName: align.screenshot_name.wb,
            screenshotOptions: {
              mask: [wbCsPage.frameLocator.locator(wbCsPage.xpathCustomizationServiceBlock)],
            },
          });

          // Verify SF preview
          const [sfTab] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(wbCsPage.xpathButtonPreview),
          ]);

          await expect(sfTab.locator(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );

          await snapshotFixture.verify({
            page: sfTab,
            selector: "body",
            snapshotName: align.screenshot_name.sf_preview,
            screenshotOptions: {
              mask: [sfTab.locator(myCSPage.xpathSectionCustomizationService)],
            },
          });
          await sfTab.close();

          // Verify SF
          const checkoutEmail = generateRandomMailToThisEmail();
          await myCSPage.checkoutProduct(productHandle, checkoutEmail);
          await expect(myCSPage.genLoc(myCSPage.xpathOrderConfirmed)).toBeVisible();

          await myCSPage.genLoc(myCSPage.xpathBtnAccessMyContent).click();
          await myCSPage.page.waitForLoadState("domcontentloaded");

          const currentUrl = myCSPage.page.url();
          // TODO: remove hotfix after Mr. Hoang Do fix, this is workaround solution
          const workingUrl = currentUrl.replace("/start", "");
          await myCSPage.page.goto(workingUrl);

          // wait all css loaded
          await expect(myCSPage.genLoc(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );

          await snapshotFixture.verify({
            page: myCSPage.page,
            selector: "html",
            snapshotName: align.screenshot_name.sf,
            screenshotOptions: {
              mask: [myCSPage.page.locator(myCSPage.xpathSectionCustomizationService)],
            },
          });
          await myCSPage.removeCustomerToken();
        }
      });
    }
  });
});
