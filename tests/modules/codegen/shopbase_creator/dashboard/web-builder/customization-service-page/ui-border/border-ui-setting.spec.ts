import { expect, test } from "@core/fixtures";
import { Page } from "@playwright/test";
import { WbPageCustomizationService } from "@pages/dashboard/wb_page_customization_service";
import { MyCustomizationServicePage } from "@pages/shopbase_creator/storefront/my_customization_service";
import { waitForImageLoaded } from "@utils/theme";
import { generateRandomMailToThisEmail } from "@utils/mail";
import { SbWebBuilderBcreBcs11 } from "./border-ui-setting";

test.describe("Verify setting border của customization service block", () => {
  let dashboard: Page;
  let wbCsPage: WbPageCustomizationService;
  let productHandle: string;

  test.beforeEach(async ({ dashboard: db, conf }) => {
    dashboard = db;
    wbCsPage = new WbPageCustomizationService(dashboard, conf.suiteConf.domain);
    await test.step(`Login vào shop creator, vào web builder, click vào page selector, chọn page "Customization service" trên page selector`, async () => {
      await wbCsPage.openCustomizationServicePage();
      await wbCsPage.clickCustomizationServiceBlock();
      await wbCsPage.resetCustomizationServiceBlockSetting();
    });

    // TODO: update logic to search product & get handle after API search product stable
    productHandle = conf.suiteConf.product_handle;
  });

  test(`@SB_WEB_BUILDER_BCRE_BCS_11 Verify block customization service khi thực hiện setting border`, async ({
    page,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const myCSPage = new MyCustomizationServicePage(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbWebBuilderBcreBcs11;

    const steps = caseConf.steps;

    for (const step of steps) {
      await test.step(step.name, async () => {
        const data = step.data;
        for (const datum of data) {
          await wbCsPage.clickCustomizationServiceBlock();
          if (datum.style) {
            // update style
            await wbCsPage.changeDesign(datum.style);
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
            selector: wbCsPage.getXpathSidebarSetting("border"),
            snapshotName: datum.screenshot_name.wb_sidebar,
          });

          await wbCsPage.backBtn.click({
            delay: 2000, // Need to click slow because wb load slow
          });
          await snapshotFixture.verifyWithIframe({
            page: wbCsPage.page,
            iframe: wbCsPage.iframe,
            selector: "#app",
            snapshotName: datum.screenshot_name.wb,
            screenshotOptions: {
              mask: [wbCsPage.frameLocator.locator(wbCsPage.xpathServiceQuestionBlock)],
            },
          });

          // Verify SF preview
          const [sfTab] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(wbCsPage.xpathButtonPreview),
          ]);

          const sfTabUrl = sfTab.url();
          await sfTab.goto(sfTabUrl);

          // wait all css + image loaded
          await expect(sfTab.locator(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );
          await waitForImageLoaded(sfTab, wbCsPage.xpathSFPreviewImage);

          await snapshotFixture.verify({
            page: sfTab,
            selector: "body",
            snapshotName: datum.screenshot_name.sf_preview,
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

          // wait all css + image loaded
          await expect(myCSPage.genLoc(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );
          await waitForImageLoaded(myCSPage.page, wbCsPage.xpathSFPreviewImage);

          await snapshotFixture.verify({
            page: myCSPage.page,
            selector: "html",
            snapshotName: datum.screenshot_name.sf,
            screenshotOptions: {
              mask: [myCSPage.genLoc(myCSPage.xpathSectionMyProductQuestion)],
            },
          });
          await myCSPage.removeCustomerToken();
        }
      });
    }
  });
});

test.describe("Verify setting border của question block", () => {
  let dashboard: Page;
  let wbCsPage: WbPageCustomizationService;
  let productHandle: string;

  test.beforeEach(async ({ dashboard: db, conf }) => {
    dashboard = db;
    wbCsPage = new WbPageCustomizationService(dashboard, conf.suiteConf.domain);
    await test.step(`Login vào shop creator, vào web builder, click vào page selector, chọn page "Customization service" trên page selector`, async () => {
      await wbCsPage.openCustomizationServicePage();
      await wbCsPage.clickQuestionBlock();
      await wbCsPage.resetQuestionBlockSetting();
    });

    // TODO: update logic to search product & get handle after API search product stable
    productHandle = conf.suiteConf.product_handle;
  });

  test(`@SB_WEB_BUILDER_BCRE_BSQ_12 - Verify block service question khi thực hiện setting border`, async ({
    page,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const myCSPage = new MyCustomizationServicePage(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbWebBuilderBcreBcs11;

    const steps = caseConf.steps;

    for (const step of steps) {
      await test.step(step.name, async () => {
        const data = step.data;
        for (const datum of data) {
          await wbCsPage.clickQuestionBlock();
          if (datum.style) {
            // update style
            await wbCsPage.changeDesign(datum.style);
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
            selector: wbCsPage.getXpathSidebarSetting("border"),
            snapshotName: datum.screenshot_name.wb_sidebar,
          });

          await wbCsPage.backBtn.click({
            delay: 2000, // Need to click slow because wb load slow
          });
          await snapshotFixture.verifyWithIframe({
            page: wbCsPage.page,
            iframe: wbCsPage.iframe,
            selector: "#app",
            snapshotName: datum.screenshot_name.wb,
            screenshotOptions: {
              mask: [wbCsPage.frameLocator.locator(wbCsPage.xpathServiceQuestionBlock)],
            },
          });

          // Verify SF preview
          const [sfTab] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(wbCsPage.xpathButtonPreview),
          ]);

          const sfTabUrl = sfTab.url();
          await sfTab.goto(sfTabUrl);

          // wait all css + image loaded
          await expect(sfTab.locator(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );
          await waitForImageLoaded(sfTab, wbCsPage.xpathSFPreviewImage);

          await snapshotFixture.verify({
            page: sfTab,
            selector: "body",
            snapshotName: datum.screenshot_name.sf_preview,
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

          // wait all css + image loaded
          await expect(myCSPage.genLoc(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );
          await waitForImageLoaded(myCSPage.page, wbCsPage.xpathSFPreviewImage);

          await snapshotFixture.verify({
            page: myCSPage.page,
            selector: "html",
            snapshotName: datum.screenshot_name.sf,
            screenshotOptions: {
              mask: [myCSPage.genLoc(myCSPage.xpathSectionMyProductQuestion)],
            },
          });
          await myCSPage.removeCustomerToken();
        }
      });
    }
  });
});
