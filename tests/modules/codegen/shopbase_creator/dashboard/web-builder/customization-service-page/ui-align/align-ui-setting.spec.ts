import { expect, test } from "@core/fixtures";
import { Page } from "@playwright/test";
import { WbPageCustomizationService } from "@pages/dashboard/wb_page_customization_service";
import { MyCustomizationServicePage } from "@pages/shopbase_creator/storefront/my_customization_service";
import { generateRandomMailToThisEmail } from "@utils/mail";
import { SbWebBuilderBcreBsq08 } from "./align-ui-setting";
import { getStyle } from "@utils/css";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

test.describe("Verify setting align của customization service block", () => {
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

    productHandle = conf.suiteConf.product_handle;
  });

  test(`@SB_WEB_BUILDER_BCRE_BSQ_08 Verify block customization service khi thực hiện setting Align`, async ({
    page,
    conf,
    context,
  }) => {
    test.slow();
    const myCSPage = new MyCustomizationServicePage(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbWebBuilderBcreBsq08;

    const steps = caseConf.steps;

    for (const step of steps) {
      await test.step(step.name, async () => {
        const aligns = step.aligns;
        for (const align of aligns) {
          await wbCsPage.clickCustomizationServiceBlock();
          if (align.style) {
            // update style
            await wbCsPage.changeDesign(align.style);
            await wbCsPage.clickSaveButton();
          }

          // Verify wb (sidebar ~> center item is active)
          const sidebarAlign = await wbCsPage.genLoc(wbCsPage.xpathSidebarAligns).all();
          expect(sidebarAlign.length).toEqual(3);

          // check active item
          const sidebarItemClasses = await sidebarAlign[align.active_index].getAttribute("class");
          expect(sidebarItemClasses).toBeTruthy();
          const isContainActive = sidebarItemClasses.includes("active");
          expect(isContainActive).toEqual(true);

          await wbCsPage.backBtn.click({});

          // Verify WB
          const wbLoc = wbCsPage.frameLocator.locator(wbCsPage.xpathSectionCustomizationServiceBlock);
          const verifyProperties = align.verify_properties;
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(wbLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
          }

          // Verify SF preview
          const [sfTab] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(wbCsPage.xpathButtonPreview),
          ]);

          await expect(sfTab.locator(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );

          const wbPreviewLoc = sfTab.locator(myCSPage.xpathSectionCustomizationService);
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(wbPreviewLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
          }
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

          const sfLoc = myCSPage.genLoc(myCSPage.xpathSectionCustomizationService);
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(sfLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
          }
          await myCSPage.removeCustomerToken();
        }
      });
    }
  });
});

test.describe("Verify setting align của question block", () => {
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

    productHandle = conf.suiteConf.product_handle;
  });

  test(`@SB_WEB_BUILDER_BCRE_BSQ_10 Verify block customization service khi thực hiện setting Align`, async ({
    page,
    conf,
    context,
  }) => {
    test.slow();
    const myCSPage = new MyCustomizationServicePage(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbWebBuilderBcreBsq08;

    const steps = caseConf.steps;

    for (const step of steps) {
      await test.step(step.name, async () => {
        const aligns = step.aligns;
        for (const align of aligns) {
          await wbCsPage.clickQuestionBlock();
          if (align.style) {
            // update style
            await wbCsPage.changeDesign(align.style);
            await wbCsPage.clickSaveButton();
          }

          // Verify wb (sidebar ~> center item is active)
          const sidebarAlign = await wbCsPage.genLoc(wbCsPage.xpathSidebarAligns).all();
          expect(sidebarAlign.length).toEqual(3);

          // check active item
          const sidebarItemClasses = await sidebarAlign[align.active_index].getAttribute("class");
          expect(sidebarItemClasses).toBeTruthy();
          const isContainActive = sidebarItemClasses.includes("active");
          expect(isContainActive).toEqual(true);

          await wbCsPage.backBtn.click({});

          // Verify WB
          const wbLoc = wbCsPage.frameLocator.locator(wbCsPage.xpathSectionCustomizationServiceBlock);
          const verifyProperties = align.verify_properties;
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(wbLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
          }

          // Verify SF preview
          const [sfTab] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(wbCsPage.xpathButtonPreview),
          ]);

          await expect(sfTab.locator(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
            myCSPage.defaultCssButtonSubmitQuestion.name,
            myCSPage.defaultCssButtonSubmitQuestion.value,
          );

          const wbPreviewLoc = sfTab.locator(myCSPage.xpathSectionMyProductQuestion);
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(wbPreviewLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
          }
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

          const sfLoc = myCSPage.genLoc(myCSPage.xpathSectionMyProductQuestion);
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(sfLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
          }
          await myCSPage.removeCustomerToken();
        }
      });
    }
  });
});
