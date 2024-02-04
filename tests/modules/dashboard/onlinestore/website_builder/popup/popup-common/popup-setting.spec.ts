import { test } from "@core/fixtures";
import { expect } from "@playwright/test";
import { WbPopUp } from "@pages/dashboard/wb_popup";
import { getStyle } from "@utils/css";
import { OcgLogger } from "@core/logger";
import { PopupSfPage } from "@pages/new_ecom/storefront/popup_sf";
import { InsertButtonWithSetting, PopupSettings } from "@types";
import { printLog, printTableLog } from "@utils/logger";
import {
  SBWEBBUILDERWBP10Class,
  SbWebBuilderWbp11,
  SBWEBBUILDERWBP12Class,
  SBWEBBUILDERWBP14Class,
  SBWEBBUILDERWBP15Class,
  SBWEBBUILDERWBP16Class,
  SbWebBuilderWbp34,
} from "./popup-setting";

const logger = OcgLogger.get();
const fixedCaseConf = {
  theme: "COMMON",
  textInside: "Popup to test",
  stringMoreThan100:
    "Popup, this is a very long string, more than 100 characters, to test popup name cannot be longer than 100 chars",
  string100Char: "Popup, this is a string with exactly 100 characters, to test popup name can be 100 characters length",
  buttonCloseLabel: "Close popup button",
};

test.describe("Verify setting của popup", () => {
  let wbPage: WbPopUp;
  let sfPage: PopupSfPage;

  test.beforeEach(async ({ dashboard, conf, context }) => {
    test.slow();
    wbPage = new WbPopUp(dashboard, conf.suiteConf.domain);
    const newTab = await context.newPage();
    sfPage = new PopupSfPage(newTab, conf.suiteConf.domain);
    await test.step(`Login vào shop, vào web builder, click vào popup`, async () => {
      await wbPage.navigateToMenu("Online Store");
      const templateId = await wbPage.getTemplateIdInListTemplate(fixedCaseConf.theme);
      logger.info(`Template id: ${templateId}`);
      if (templateId > 0) {
        await wbPage.publishTemplateById(templateId);
      }
      await wbPage.page.waitForTimeout(2 * 1000);
      await wbPage.openTemplate(fixedCaseConf.theme);

      // Delete all existing popup
      await wbPage.deleteAllExistingPopup();

      // Create popup & setting styles
      const popupSettings: PopupSettings[] = [];
      popupSettings.push({
        content: {
          name: fixedCaseConf.textInside,
          trigger: {
            type: "Delay",
            value: 0,
          },
        },
        paragraph: fixedCaseConf.textInside,
      });
      await wbPage.insertPopups(popupSettings);

      // Save setting
      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_WBP_10 - Kiểm tra vị trí hiển thị popup khi config position tương ứng`, async ({ conf }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP10Class;
    const steps = caseConf.steps;

    for (const step of steps) {
      await test.step(step.name, async () => {
        await wbPage.clickOnSectionPopup();
        const stepData = step.data;

        if (stepData.style) {
          await wbPage.setPopUpDesign(stepData.style);
          await wbPage.clickSaveButton();
        }

        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);

        // if push page down option ~> position = fixed + top = 0
        if (stepData.verify_fixed_top) {
          const positionValue = await getStyle(wbPopupLoc, "position");
          expect(positionValue).toEqual("fixed");
        }

        const rawClasses = await wbPopupLoc.getAttribute("class");
        logger.info(`WB classes: ${rawClasses}`);
        expect(rawClasses).toBeTruthy();
        const classes = rawClasses.split(" ");
        expect(classes.length).toBeGreaterThan(0);

        for (const expectedClass of stepData.classes) {
          logger.info(`Expect ${expectedClass}`);
          expect(classes.includes(expectedClass)).toEqual(true);
        }

        // Check z-index wb
        const allSections = await wbPage.frameLocator.locator(wbPage.xpathWbSections).all();
        const { popupZIndex, sectionZIndexes } = await wbPage.getSectionZIndexes(allSections);
        for (const sectionZIndex of sectionZIndexes) {
          expect(popupZIndex).toBeGreaterThan(sectionZIndex);
        }

        // Verify sf
        await sfPage.openStorefront();
        // Need wait here because popup  will appear after x second
        await sfPage.page.waitForTimeout(caseConf.popup_timeout);
        await expect(sfPage.genLoc(sfPage.xpathSfSectionPopup)).toBeVisible();

        // check class sf
        const sfPopupLoc = sfPage.page.locator(sfPage.xpathSfSectionPopup);
        const rawSfClasses = await sfPopupLoc.getAttribute("class");
        logger.info(`SF classes: ${rawSfClasses}`);
        expect(rawSfClasses).toBeTruthy();
        const sfClasses = rawSfClasses.split(" ");
        expect(sfClasses.length).toBeGreaterThan(0);

        for (const expectedClass of stepData.classes) {
          logger.info(`Expect SF ${expectedClass}`);
          expect(sfClasses.includes(expectedClass)).toEqual(true);
        }

        // Check z-index sf
        const allSfSections = await sfPage.page.locator(sfPage.xpathWbSections).all();
        const { popupZIndex: sfPopupZIdx, sectionZIndexes: sfSectionZIdx } = await wbPage.getSectionZIndexes(
          allSfSections,
        );
        for (const sectionZIndex of sfSectionZIdx) {
          expect(sfPopupZIdx).toBeGreaterThan(sectionZIndex);
        }
      });
    }
  });

  test(`@SB_WEB_BUILDER_WBP_11 - Kiểm tra hiển thị popup và nội dung page khi config overlay`, async ({ conf }) => {
    const caseConf = conf.caseConf as SbWebBuilderWbp11;
    const steps = caseConf.steps;

    for (const step of steps) {
      await test.step(step.name, async () => {
        await wbPage.clickOnSectionPopup();
        const stepData = step.data;

        if (stepData.style) {
          await wbPage.setPopUpDesign(stepData.style);
          await wbPage.clickSaveButton();
        }

        // Verify wb
        const wbOverlay = wbPage.frameLocator.locator(wbPage.xpathWbOverlay).first();
        const opacityValue = await getStyle(wbOverlay, "opacity");
        expect(opacityValue).toEqual(stepData.opacity_value);

        // Verify sf
        await sfPage.openStorefront();
        // Need wait here because popup  will appear after x second
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();
        const sfOpacityValue = await getStyle(sfPage.genLoc(sfPage.xpathWbOverlay), "opacity");
        expect(sfOpacityValue).toEqual(stepData.opacity_value);
      });
    }
  });

  test(`@SB_WEB_BUILDER_WBP_12 Kiểm tra width, height popup`, async ({ conf }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP12Class;
    await test.step(`1. Tại tab Design, kiểm tra hiển thị default width, height, 2. Mở tab mới ngoài storefront`, async () => {
      const step1Data = caseConf.step1_data;
      const step1DebugData = [];

      for (const stepData of step1Data) {
        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);
        const inlineStyles = await wbPopupLoc.getAttribute("style");
        expect(inlineStyles).toContain(stepData.expected_width_wb);
        expect(inlineStyles).toContain(stepData.expected_height_wb);
        step1DebugData.push({
          key: "wb_width",
          expected_value: stepData.expected_width_wb,
          actual_value: inlineStyles,
        });

        step1DebugData.push({
          key: "wb_height",
          expected_value: stepData.expected_height_wb,
          actual_value: inlineStyles,
        });

        // Verify sf
        await sfPage.openStorefront();
        await sfPage.waitForPopupDisplayed(caseConf.popup_timeout);
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();
        const sfWidthValue = await getStyle(sfPage.genLoc(sfPage.xpathSfSectionPopup), "width");
        expect(sfWidthValue).toEqual(stepData.expected_width_sf);

        step1DebugData.push({
          key: "sf_width",
          expected_value: stepData.expected_width_sf,
          actual_value: sfWidthValue,
        });

        const sfHeightValue = await getStyle(sfPage.genLoc(sfPage.xpathSfSectionPopup), "height");
        const actualSHeight = parseFloat(sfHeightValue.replace("px", ""));
        expect(actualSHeight).toBeGreaterThanOrEqual(stepData.expected_height_sf);

        step1DebugData.push({
          key: "sf_height",
          expected_value: stepData.expected_height_sf,
          actual_value: sfHeightValue,
        });

        printLog("Step 1");
        printTableLog(step1DebugData);
      }
    });

    await test.step(`1. Tại tab design, setting width theo data, click save, 2. Mở web ngoài storefront`, async () => {
      const step2Data = caseConf.step2_data;
      const step2DebugData = [];

      for (const stepData of step2Data) {
        await wbPage.clickOnSectionPopup();
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);
        const inlineStyles = await wbPopupLoc.getAttribute("style");
        expect(inlineStyles).toContain(stepData.expected_width_wb);
        step2DebugData.push({
          key: "wb_width",
          expected_value: stepData.expected_width_wb,
          actual_value: inlineStyles,
        });

        // Verify sf
        await sfPage.openStorefront();
        await sfPage.waitForPopupDisplayed(caseConf.popup_timeout);

        const sfWidthValue = await getStyle(sfPage.genLoc(sfPage.xpathSfSectionPopup), "width");
        let expectedWidth = stepData.expected_width_sf;

        if (expectedWidth === "viewport") {
          expectedWidth = `${sfPage.getViewportWidth()}px`;
        } else if (expectedWidth === "viewport/2") {
          expectedWidth = `${sfPage.getViewportWidth() / 2}px`;
        }

        step2DebugData.push({
          key: "sf_width",
          expected_value: expectedWidth,
          actual_value: sfWidthValue,
        });

        const approximatelyExpectWidth = parseFloat(expectedWidth.replace("px", ""));
        const approximatelyActualWidth = parseFloat(sfWidthValue.replace("px", ""));
        expect(approximatelyActualWidth).toBeGreaterThanOrEqual(approximatelyExpectWidth - 1);
        expect(approximatelyActualWidth).toBeLessThanOrEqual(approximatelyExpectWidth + 1);
        step2DebugData.push({
          key: "sf_cal_value",
          expected_value: approximatelyExpectWidth,
          actual_value: approximatelyActualWidth,
        });
      }

      printLog("Step 2");
      printTableLog(step2DebugData);
    });

    await test.step(`1. Tại tab design, setting height theo data, click save, 2. Mở web ngoài storefront`, async () => {
      const step3Data = caseConf.step3_data;
      const step3DebugData = [];

      for (const stepData of step3Data) {
        await wbPage.clickOnSectionPopup();
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);
        const inlineStyles = await wbPopupLoc.getAttribute("style");
        expect(inlineStyles).toContain(stepData.expected_height_wb);
        step3DebugData.push({
          key: "wb_height",
          expected_value: stepData.expected_height_wb,
          actual_value: inlineStyles,
        });

        // Verify sf
        await sfPage.openStorefront();
        await sfPage.waitForPopupDisplayed(caseConf.popup_timeout);

        const rawSfHeightValue = await getStyle(sfPage.genLoc(sfPage.xpathSfSectionPopup), "height");
        const sfHeightValue = sfPage.roundRawValueContainPx(rawSfHeightValue);
        let expectedHeight = stepData.expected_height_sf;
        if (expectedHeight === "viewport") {
          expectedHeight = `${sfPage.roundRawValueContainPx(`${sfPage.getViewportHeight()}`)}`;
        } else if (expectedHeight === "viewport/2") {
          expectedHeight = `${sfPage.roundRawValueContainPx(`${sfPage.getViewportHeight() / 2}`)}`;
        }
        if (stepData.style.height.value.unit === "Auto") {
          const actualSfHeight = parseFloat(sfHeightValue.replace("px", ""));
          const expectedSfHeight = parseFloat(expectedHeight.replace("px", ""));
          expect(actualSfHeight).toBeGreaterThanOrEqual(expectedSfHeight);
          step3DebugData.push({
            key: "sf_height",
            expected_value: expectedSfHeight,
            actual_value: actualSfHeight,
          });
        } else {
          step3DebugData.push({
            key: "sf_height",
            expected_value: stepData.expected_height_sf,
            actual_value: sfHeightValue,
          });
          expect(sfHeightValue).toEqual(expectedHeight);
        }
      }
      printLog("Step 3");
      printTableLog(step3DebugData);
    });
  });

  test(`@SB_WEB_BUILDER_WBP_14 Kiểm tra backgroup popup`, async ({ conf, snapshotFixture }) => {
    const env = process.env.ENV;
    test.slow();

    await test.step(`Click tab Design, click vào trường background`, async () => {
      // Click on section popup
      await wbPage.clickOnSectionPopup();
      await wbPage.switchToTab("Design");
      await wbPage.clickOnBackgroundSetting();

      // Verify image background popover
      await wbPage.getTabBackground("Image").click();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.xpathPopup.sidebar.background.popover,
        snapshotName: `${env}-background-popover-image.png`,
      });

      // Verify image video popover
      await wbPage.getTabBackground("Video").click();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.xpathPopup.sidebar.background.popover,
        snapshotName: `${env}-background-popover-video.png`,
      });

      // Verify image color popover
      await wbPage.getTabBackground("Color").click();
      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.xpathPopup.sidebar.background.popover,
        snapshotName: `${env}-background-popover-color.png`,
      });

      await wbPage.titleBar.click({ delay: 300 });

      //verify background default
      const step1Data = conf.caseConf.step1_data;

      for (const stepData of step1Data) {
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          logger.info(
            `Default - trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await sfPage.openStorefront();
        logger.info(`Step 1 SF url: ${sfPage.page.url()}`);
        await sfPage.waitForPopupDisplayed(conf.caseConf.popup_timeout);

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          logger.info(
            `Default - trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }
      }
    });

    for (const setting of conf.caseConf.setting_background_color) {
      await test.step(`${setting.description}`, async () => {
        await wbPage.clickOnSectionPopup();
        await wbPage.switchToTab("Design");
        await wbPage.setPopUpDesign(setting.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = setting.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          expect(cssValue).toEqual(verifyProperty.value);
        }

        await sfPage.openStorefront();
        logger.info(`Step 1 SF url: ${sfPage.page.url()}`);

        await sfPage.waitForPopupDisplayed(conf.caseConf.popup_timeout);

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          logger.info(
            `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }
      });
    }

    for (const setting of conf.suiteConf.SB_WEB_BUILDER_WBP_14.setting_background_image) {
      await test.step(`${setting.description}`, async () => {
        await wbPage.clickOnSectionPopup();
        await wbPage.switchToTab("Design");
        await wbPage.uploadImageBackground(setting.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = setting.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          logger.info(
            `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toContain(verifyProperty.value);
        }

        // Verify sf
        await sfPage.openStorefront();
        logger.info(`Step 1 SF url: ${sfPage.page.url()}`);

        await sfPage.waitForPopupDisplayed(conf.caseConf.popup_timeout);

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          logger.info(
            `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toContain(verifyProperty.value);
        }
      });
    }

    for (const setting of conf.caseConf.setting_background_video) {
      await test.step(`${setting.description}`, async () => {
        await wbPage.clickOnSectionPopup();
        await wbPage.switchToTab("Design");
        await wbPage.setPopUpDesign(setting.style);
        await wbPage.clickSaveButton();

        if (setting.success === true) {
          const parallax = setting.style.background.value.video.parallax;
          if (parallax === true) {
            await expect(wbPage.frameLocator.locator(wbPage.xpathPopup.popup.parallax)).toBeVisible();
            // Verify sf
            await sfPage.openStorefront();
            logger.info(`Step 1 SF url: ${sfPage.page.url()}`);
            await sfPage.waitForPopupDisplayed(conf.caseConf.popup_timeout);
            await expect(sfPage.genLoc(wbPage.xpathPopup.popup.parallax)).toBeVisible();
            return;
          }
          // Verify wb
          await expect(wbPage.frameLocator.locator(wbPage.xpathPopup.popup.videoIframe)).toBeVisible();
          const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathPopup.popup.videoBackground);
          const verifyProperties = setting.verify_properties;
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
            expect(cssValue).toContain(verifyProperty.value);
          }

          // Verify sf
          await sfPage.openStorefront();
          logger.info(`Step 1 SF url: ${sfPage.page.url()}`);
          await sfPage.waitForPopupDisplayed(conf.caseConf.popup_timeout);

          await expect(sfPage.genLoc(wbPage.xpathPopup.popup.videoIframe)).toBeVisible();
          const sfLoc = sfPage.genLoc(wbPage.xpathPopup.popup.videoBackground);
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(sfLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
            expect(cssValue).toContain(verifyProperty.value);
          }
        } else {
          // Verify wb
          const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
          const verifyProperties = setting.verify_properties;
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
            expect(cssValue).toContain(verifyProperty.value);
          }

          // Verify sf
          await sfPage.openStorefront();
          logger.info(`Step 1 SF url: ${sfPage.page.url()}`);
          await sfPage.waitForPopupDisplayed(conf.caseConf.popup_timeout);

          const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
          for (const verifyProperty of verifyProperties) {
            const cssValue = await getStyle(sfLoc, verifyProperty.property);
            logger.info(
              `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
            );
            expect(cssValue).toContain(verifyProperty.value);
          }
        }
      });
    }
  });

  test(`@SB_WEB_BUILDER_WBP_15 - Kiểm tra border của popup`, async ({ conf }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP15Class;
    await test.step(`1. Tại tab Design, kiểm tra hiển thị default background, 2. Mở tab mới ngoài storefront`, async () => {
      logger.info("Step 1");
      await wbPage.clickOnSectionPopup();
      const step1DebugData = [];

      const step1Data = caseConf.step1_data;

      for (const stepData of step1Data) {
        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          step1DebugData.push({
            key: `wb_${verifyProperty.property}`,
            expected_value: verifyProperty.value,
            actual_value: cssValue,
          });
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await sfPage.openStorefront();
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          step1DebugData.push({
            key: `sf_${verifyProperty.property}`,
            expected_value: verifyProperty.value,
            actual_value: cssValue,
          });
          expect(cssValue).toEqual(verifyProperty.value);
        }
      }

      printTableLog(step1DebugData);
    });

    await test.step(`1. Tại tab design, setting background theo data, click save, 2. Mở web ngoài storefront trên mobile`, async () => {
      logger.info("Step 2");
      await wbPage.clickOnSectionPopup();
      const step2Data = caseConf.step2_data;
      const step2DebugData = [];

      for (const stepData of step2Data) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          step2DebugData.push({
            key: `wb_${verifyProperty.property}`,
            style: JSON.stringify(stepData.style),
            expected_value: verifyProperty.value,
            actual_value: cssValue,
          });
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await sfPage.openStorefront();
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          step2DebugData.push({
            key: `sf_${verifyProperty.property}`,
            expected_value: verifyProperty.value,
            actual_value: cssValue,
          });
        }

        logger.info(`=== End of loop`);
      }

      printTableLog(step2DebugData);
    });
  });

  test(`@SB_WEB_BUILDER_WBP_16 - Kiểm tra radius, shadow, padding, margin của popup`, async ({ conf }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP16Class;
    await test.step(`1. Setting radius, shadow, padding, margin theo danh sách data, 2. Preview ngoài SF trên mobile`, async () => {
      await wbPage.clickOnSectionPopup();
      const step1Data = caseConf.step1_data;

      for (const stepData of step1Data) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const wbPopupSectionLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          let cssValue;
          if (verifyProperty.property.includes("margin")) {
            cssValue = await getStyle(wbPopupSectionLoc, verifyProperty.property);
          } else {
            cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          }

          logger.info(
            `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await sfPage.openStorefront();
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          logger.info(
            `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }
      }
    });
  });

  test(`@SB_WEB_BUILDER_WBP_17 Kiểm tra setting popup name, Icon, Close button`, async ({ snapshotFixture }) => {
    await test.step(`Ở sidebar, click tab Content >  để trống trường Popup name > click ra ngoài textbox Popup name > hover vào popup ở màn preview > kiểm tra hiển thị tên popup `, async () => {
      await wbPage.clickOnSectionPopup();
      // Hover to popup
      await wbPage.genLocFrame(wbPage.xpathWbSectionPopup).hover({
        position: { x: 3, y: 3 },
      });

      await expect(wbPage.genLocFrame('//div[@id="element-name"]')).toContainText("Popup");
    });

    await test.step(`Nhập >100 kí tự vào trường Popup name > click ra ngoài textbox Popup name > hover vào popup ở màn preview > kiểm tra hiển thị tên popup `, async () => {
      await wbPage.setPopupContentSetting({
        name: fixedCaseConf.stringMoreThan100,
      });

      // Hover to popup
      await wbPage.genLocFrame(wbPage.xpathWbSectionPopup).hover({
        position: { x: 1, y: 1 },
      });

      const expectedText = new RegExp(fixedCaseConf.stringMoreThan100.substring(0, 100));
      await expect(wbPage.genLocFrame('//div[@id="element-name"]')).toHaveText(expectedText);
    });

    await test.step(`Nhập <= 100 kí tự vào trường Popup name > click ra ngoài textbox Popup name   >hover vào popup ở màn preview, kiểm tra hiển thị tên popup.
> kiểm tra update tên popup ở Layers.`, async () => {
      await wbPage.setPopupContentSetting({
        name: fixedCaseConf.string100Char,
      });

      // Hover to popup
      await wbPage.genLocFrame(wbPage.xpathWbSectionPopup).hover({
        position: { x: 3, y: 3 },
      });

      // await expect(wbPage.genLocFrame('//div[@id="element-name"]')).toHaveText(/fixedCaseConf.string100Char/);
      const expectedText = new RegExp(fixedCaseConf.string100Char);
      await expect(wbPage.genLocFrame('//div[@id="element-name"]')).toHaveText(expectedText);
      // Verify layer name is right
      await wbPage.clickBackLayer();

      const sidebarXpath = wbPage.getSidebarSelectorByName({
        sectionName: fixedCaseConf.string100Char,
      });
      const sidebarLoc = wbPage.genLoc(sidebarXpath);
      await expect(sidebarLoc).toBeVisible();
      await wbPage.clickOnSectionPopup();
    });

    await test.step(`Tại tab Content, click droplist field Icon> hover vào các icon > kiểm tra hiển thị tên icon`, async () => {
      await wbPage.clickOnSectionPopup();

      // reset to default name popup
      await wbPage.setPopupContentSetting({
        name: "Popup",
      });

      // Click droplist
      const parentSelector = wbPage.getSelectorByLabel("icon");
      await wbPage.genLoc(`${parentSelector}//div[contains(@class,'sb-popover__reference')]`).click();

      // Search bar display
      const xpathSearchBar = "//div[contains(@class, 'widget-icon__search')]//input[@placeholder='Search icon']";
      const searchBarLoc = wbPage.genLoc(xpathSearchBar).first();
      await expect(searchBarLoc).toBeVisible();
      await expect(searchBarLoc).toBeEnabled();

      // List icon display ~> count = 49 item
      const widgetListLoc = wbPage.genLoc("//div[contains(@class, 'widget-icon__grid')]").first();
      const widgetItemLoc = widgetListLoc.locator("//span[contains(@class, 'widget-icon__item')]");
      const widgetItemCount = await widgetItemLoc.count();
      expect(widgetItemCount).toEqual(49);

      // Hover icon, show name
      const allIconLocators = await widgetItemLoc.all();
      const widgetItemHoverLocs = await wbPage
        .genLoc("//div[contains(@class, 'widget-icon__grid')]")
        .nth(1)
        .locator("//span[contains(@class, 'widget-icon__item')]//label[contains(@class, 'sb-is-capitalized')]")
        .all();
      const iconNames = [
        "accordion",
        "audience",
        "basic blocks",
        "benefits",
        "block container",
        "bullet",
        "button",
        "checkout",
        "code",
        "column",
        "contact",
        "container",
        "countdown",
        "credential",
        "divider",
        "faqs",
        "footer",
        "form",
        "guarantee",
        "header",
        "html",
        "icons",
        "image",
        "info",
        "line",
        "location",
        "paragraph",
        "popup",
        "pricing",
        "problems",
        "product",
        "quote",
        "rating",
        "recommend",
        "row",
        "saleleads",
        "sales",
        "section",
        "secure",
        "shape",
        "social",
        "store",
        "tag",
        "text",
        "title",
        "trust",
        "video",
        "group-element",
        "tab",
      ];

      for (let i = 0; i < allIconLocators.length; i++) {
        const iconLocator = allIconLocators[i];
        const hoverItem = widgetItemHoverLocs[i];
        const iconName = iconNames[i];

        await iconLocator.hover();
        const hoverContent = await hoverItem.textContent();
        expect(hoverContent).toEqual(iconName);
        // console.log('hover content: ', hoverContent);
      }
    });

    await test.step(`Nhập tên icon vào thanh search > kiểm tra kết quả search`, async () => {
      const xpathSearchBar = "//div[contains(@class, 'widget-icon__search')]//input[@placeholder='Search icon']";
      const searchBarLoc = wbPage.genLoc(xpathSearchBar).first();
      const xpathActivePopup =
        "//div[@class='sb-tab-panel sb-text sb-p-medium' and not(@style[contains(., 'display: none')])]";
      const selectIconBodyLoc = wbPage
        .genLoc(xpathActivePopup)
        .locator("//div[contains(@class, 'sb-mt-small')]")
        .nth(1);

      // Search result not found
      await searchBarLoc.fill("abcd");
      await expect(selectIconBodyLoc).toContainText("No icons found.");

      // Search result found
      await searchBarLoc.fill("Column");
      await expect(selectIconBodyLoc).not.toContainText("No icons found.");
      await expect(selectIconBodyLoc).toContainText("column");
    });

    await test.step(`Click vào icon column > click btn Save> Click vào Layer ở thanh header > kiểm tra icon của popup`, async () => {
      const xpathActivePopup =
        "//div[@class='sb-tab-panel sb-text sb-p-medium' and not(@style[contains(., 'display: none')])]";
      const selectIconBodyLoc = wbPage
        .genLoc(xpathActivePopup)
        .locator("//div[contains(@class, 'sb-mt-small')]")
        .nth(1);
      const firstIconLoc = selectIconBodyLoc.locator("//span[contains(@class, 'widget-icon__item')]").first();
      await firstIconLoc.click();

      // click save
      await wbPage.clickSaveButton();
    });

    await test.step(`- Tại tab Content, kiểm tra btn default- click droplist`, async () => {
      await wbPage.clickOnSectionPopup();

      // Verify default = line
      const closeButtonWidgetLoc = wbPage.genLoc(wbPage.getSelectorByLabel("close_button"));
      const widgetSelect = closeButtonWidgetLoc.locator(
        "//div[contains(@class, 'widget-select')]//span[contains(@class, 'sb-button--label')]",
      );
      await expect(widgetSelect).toContainText("Line");

      // Verify have 4 option: none, line, ellipse, rectangle
      await widgetSelect.click();
      const popoverLoc = wbPage.genLoc(
        "//div[contains(@class, 'w-builder__popover') and contains(normalize-space(), 'Close button')]",
      );
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: popoverLoc,
        snapshotName: "close-options.png",
      });
    });

    await test.step(`Lần lượt click vào từng lựa chọn -> kiểm tra hiển thị icon x ở phần popup màn preview> Click btn Save > mở SF của shop, tại trang hiển thị popup, kiểm tra hiển thị icon close tương ứng đã chọn`, async () => {
      const closeButtons: ("none" | "line" | "ellipse" | "rectangle")[] = ["none", "line", "ellipse", "rectangle"];
      const closeButtonClasses = [
        "none",
        "close-popup-button__line",
        "close-popup-button__ellipse",
        "close-popup-button__rectangle",
      ];
      for (let i = 0; i < closeButtons.length; i++) {
        const closeButton = closeButtons[i];
        logger.info("Process button: " + closeButton);
        const closeButtonClass = closeButtonClasses[i];

        await wbPage.setPopupContentSetting({
          close_button: closeButton,
        });

        await wbPage.clickSaveButton();

        // Verify WB
        const closePopupLoc = wbPage.genLocFrame(
          "//section[contains(@class, 'section-popup')  and not(@id='default_cart_drawer')]//div[contains(@class, 'close-popup-button__wrapper')]",
        );
        if (closeButtonClass === "none") {
          await expect(closePopupLoc).toBeHidden();
        } else {
          const childElement = closePopupLoc.locator("//div[contains(@class, 'close-popup-button')]");
          const elementClasses = await childElement.getAttribute("class");
          expect(elementClasses).toContain(closeButtonClass);
        }

        // Verify SF
        await sfPage.openStorefront();
        const closePopupSfLoc = sfPage.genLoc(
          "//section[contains(@class, 'section-popup') and not(@id='default_cart_drawer')]//div[contains(@class, 'close-popup-button__wrapper')]",
        );
        if (closeButtonClass === "none") {
          await expect(closePopupSfLoc).toBeHidden();
        } else {
          const childElement = closePopupSfLoc.locator("//div[contains(@class, 'close-popup-button')]").first();
          const elementClasses = await childElement.getAttribute("class");
          expect(elementClasses).toContain(closeButtonClass);
        }
      }
    });
  });

  test(`@SB_WEB_BUILDER_WBP_20 - Kiểm tra hiển edit layout popup khi click các button ở Quick bar`, async ({}) => {
    const quickSettingButtonLocs = await wbPage.genLocFrame("//div[@id='quick-settings']//button").all();
    const quickBarUpButtonLoc = quickSettingButtonLocs[0];
    const quickBarDownButtonLoc = quickSettingButtonLocs[1];
    const quickBarDuplicateButtonLoc = quickSettingButtonLocs[2];
    const quickBarHideButtonLoc = quickSettingButtonLocs[3];
    // const quickBarSaveAsButtonLoc = quickSettingButtonLocs[4];
    const quickBarDeleteButtonLoc = quickSettingButtonLocs[5];

    await test.step(`Kiểm tra vị trí popup khi click up/down button ở Quick bar:
    1. Tại màn preview, kiểm tra hiển thị quick bar setting ở màn preview
    2. Click Down button > kiểm tra vị trí popup A so với section B ở layers
    3. Click Up button > kiểm tra vị trí popup A so với section B ở layers
    4. Khi popup ở vị trí cuối cùng, click Down button
    5. Khi popup ở vị trí trên cùng của page, Click Up button > kiểm tra vị trí popup A`, async () => {
      await wbPage.clickOnSectionPopup();

      // Verify quickbar setting
      const quickBarLoc = wbPage.genLocFrame("//div[@id='quick-settings']");
      await expect(quickBarLoc).toHaveCSS("visibility", "visible");

      const quickBarItems = ["Move up", "Move down", "Duplicate", "Hide", "Save as template", "Delete", "Done"];
      for (let i = 0; i < quickSettingButtonLocs.length; i++) {
        const quickSettingButtonLoc = quickSettingButtonLocs[i];
        await expect(quickSettingButtonLoc).toContainText(quickBarItems[i]);
      }

      // Khi popup ở vị trí cuối cùng, verify down button disable
      await expect(quickBarDownButtonLoc).toHaveClass(/is-disabled/);
      let expectSections = ["Footer", "Cart drawer", "Popup to test"];
      let footerSections = await wbPage.getSectionsUnderFooterLayerGroup();
      expect(JSON.stringify(expectSections)).toEqual(JSON.stringify(footerSections));

      // Click Up button > kiểm tra vị trí popup A so với section B ở layers
      await wbPage.genLocFrame(wbPage.xpathWbSectionPopup).click({ position: { x: 1, y: 1 } });
      await quickBarUpButtonLoc.click();
      expectSections = ["Footer", "Popup to test", "Cart drawer"];
      footerSections = await wbPage.getSectionsUnderFooterLayerGroup();
      expect(JSON.stringify(expectSections)).toEqual(JSON.stringify(footerSections));

      // Khi popup ở vị trí trên cùng của page, verify up button disable
      await quickBarUpButtonLoc.click();
      await expect(quickBarUpButtonLoc).toHaveClass(/is-disabled/);
      expectSections = ["Popup to test", "Footer", "Cart drawer"];
      footerSections = await wbPage.getSectionsUnderFooterLayerGroup();
      expect(JSON.stringify(expectSections)).toEqual(JSON.stringify(footerSections));

      // Click Down button > kiểm tra vị trí popup
      await quickBarDownButtonLoc.click();
      expectSections = ["Footer", "Popup to test", "Cart drawer"];
      footerSections = await wbPage.getSectionsUnderFooterLayerGroup();
      expect(JSON.stringify(expectSections)).toEqual(JSON.stringify(footerSections));

      await quickBarDownButtonLoc.click();
      expectSections = ["Footer", "Cart drawer", "Popup to test"];
      footerSections = await wbPage.getSectionsUnderFooterLayerGroup();
      expect(JSON.stringify(expectSections)).toEqual(JSON.stringify(footerSections));
    });

    await test.step(`Kiểm tra ẩn/hiện popup khi click Hide button:    1. Tại màn preview, click vào popup A > Click Hide button trên quick bar > kiểm tra ẩn popup A ở màn preview     2. Mở side bar của popup A, click visible > kiểm tra hiển thị lại popup ở preview `, async () => {
      // click hide
      await quickBarHideButtonLoc.click();

      // Verify sidebar
      const outerPopupSidebarLoc = wbPage.genLoc(wbPage.xpathLayerPopupOuter);
      await expect(outerPopupSidebarLoc).toHaveClass(/w-builder__is-hidden/);
      await wbPage.clickSaveButton();

      // Verify wb
      await wbPage.clickOnSectionPopup();
      const sectionPopupLoc = wbPage.genLocFrame(wbPage.xpathWbSectionPopup);
      await expect(sectionPopupLoc).toHaveClass(/hidden/);

      // Verify preview SF
      await sfPage.openStorefront();
      await sfPage.page.waitForLoadState("networkidle");
      await sfPage.page.waitForTimeout(2 * 1000);
      await expect(sfPage.genLoc(sfPage.xpathSfSectionPopup)).toBeHidden();

      // click show
      await wbPage.clickBtnNavigationBar("layer");
      await outerPopupSidebarLoc.locator("//div[contains(@class, 'w-builder__layer-title')]").first().hover();
      await wbPage.genLoc(wbPage.xpathLayerPopupHideShowAction).click();

      // Verify sidebar
      await expect(outerPopupSidebarLoc).not.toHaveClass(/w-builder__is-hidden/);
      await wbPage.clickSaveButton();

      // Verify wb
      await wbPage.clickOnSectionPopup();
      await expect(sectionPopupLoc).not.toHaveClass(/hidden/);

      // Verify preview SF
      await sfPage.openStorefront();
      await sfPage.page.waitForLoadState("networkidle");
      await sfPage.page.waitForTimeout(2 * 1000);
      await expect(sfPage.genLoc(sfPage.xpathSfSectionPopup)).toBeVisible();
    });

    await test.step(`Kiểm tra duplicate popup khi click button duplicate:     1. Tại màn preview, click vào popup > Click duplicate button > kiểm tra hiển thị thêm 1 popup giống popup A `, async () => {
      // Click on other element, then click popup
      await wbPage.clickBtnNavigationBar("layer");
      await wbPage
        .genLoc(
          "//p[contains(@class, 'w-builder__layer-label--section') and contains(normalize-space(), 'Cart drawer')]",
        )
        .click();

      await wbPage.clickOnSectionPopup();
      await quickBarDuplicateButtonLoc.click();

      // Count section = 2
      const sidebarLayerPopupLoc = wbPage.genLoc(wbPage.xpathLayerPopup);

      const numberOfLayer = await sidebarLayerPopupLoc.count();
      expect(numberOfLayer).toEqual(2);
    });

    await test.step(`Kiểm tra lưu popup khi click Add to library button:    1. Tại màn preview, click vào popup > Click Save as template button trên quick bar     2. Nhấn cancel    3.  Click Save as template button trên quick bar > Điền các trường hợp lệ, nhấn save      4. Mở library vừa chọn > section template`, async () => {
      // TODO: fill later
    });

    await test.step(`Kiểm tra xóa popup khi click delete button:    1. Tạo thành công popup B -> click button Save >trên trình duyệt điện thoại đi đến page config popup > kiểm tra hiển thị popup  2. Quay lại web-builder page đã setting popup B, tại màn preview, click vào popup > Click delete button trên quick bar > kiểm tra hiển thị popup delete     3. Click cancel    4. Click delete button trên quick bar > Click delete > kiểm tra tồn tại popup B  5. Trên trình duyệt điện thoại, đi đến page đã setting popup B > kiểm tra hiển thị popup B`, async () => {
      // Delete button 02
      await wbPage.clickBtnNavigationBar("layer");
      const sidebarLayerPopupLoc = wbPage.genLoc(wbPage.xpathLayerPopup);
      await sidebarLayerPopupLoc.nth(1).click();
      await quickBarDeleteButtonLoc.click();

      const numberOfLayerPopUp = await sidebarLayerPopupLoc.count();
      expect(numberOfLayerPopUp).toEqual(1);
    });
  });

  test(`@SB_WEB_BUILDER_WBP_33 [Mobile] Kiểm tra vị trí hiển thị popup khi config position tương ứng`, async ({
    conf,
    snapshotFixture,
    pageMobile,
  }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP10Class;
    const steps = caseConf.steps;
    sfPage = new PopupSfPage(pageMobile, conf.suiteConf.domain);

    for (const step of steps) {
      await test.step(step.name, async () => {
        await wbPage.clickOnSectionPopup();
        const stepData = step.data;

        if (stepData.style) {
          await wbPage.setPopUpDesign(stepData.style);
          await wbPage.clickSaveButton();
        }

        // Verify position on sidebar
        await snapshotFixture.verify({
          page: wbPage.page,
          selector: wbPage.getXpathSidebarSetting("position"),
          snapshotName: stepData.screenshot_name.wb_sidebar,
        });

        // Verify push_page_down option
        if (stepData.screenshot_name.wb_sidebar_push_page_down) {
          await snapshotFixture.verify({
            page: wbPage.page,
            selector: wbPage.getXpathSidebarSetting("push_page_down"),
            snapshotName: stepData.screenshot_name.wb_sidebar_push_page_down,
          });
        }

        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);

        // if push page down option ~> position = fixed + top = 0
        if (stepData.verify_fixed_top) {
          const positionValue = await getStyle(wbPopupLoc, "position");
          expect(positionValue).toEqual("fixed");
        }

        const rawClasses = await wbPopupLoc.getAttribute("class");
        logger.info(`WB classes: ${rawClasses}`);
        expect(rawClasses).toBeTruthy();
        const classes = rawClasses.split(" ");
        expect(classes.length).toBeGreaterThan(0);

        for (const expectedClass of stepData.classes) {
          logger.info(`Expect ${expectedClass}`);
          expect(classes.includes(expectedClass)).toEqual(true);
        }

        // Check z-index wb
        const allSections = await wbPage.frameLocator.locator(wbPage.xpathWbSections).all();
        const { popupZIndex, sectionZIndexes } = await wbPage.getSectionZIndexes(allSections);
        for (const sectionZIndex of sectionZIndexes) {
          expect(popupZIndex).toBeGreaterThan(sectionZIndex);
        }

        // Verify sf
        await sfPage.openStorefront();
        // Need wait here because popup  will appear after x second
        await sfPage.page.waitForTimeout(caseConf.popup_timeout);
        await expect(sfPage.genLoc(sfPage.xpathSfSectionPopup)).toBeVisible();

        // check class sf
        const sfPopupLoc = sfPage.page.locator(sfPage.xpathSfSectionPopup);
        const rawSfClasses = await sfPopupLoc.getAttribute("class");
        logger.info(`SF classes: ${rawSfClasses}`);
        expect(rawSfClasses).toBeTruthy();
        const sfClasses = rawSfClasses.split(" ");
        expect(sfClasses.length).toBeGreaterThan(0);

        for (const expectedClass of stepData.classes) {
          logger.info(`Expect SF ${expectedClass}`);
          expect(sfClasses.includes(expectedClass)).toEqual(true);
        }

        // Check z-index sf
        const allSfSections = await sfPage.page.locator(sfPage.xpathWbSections).all();
        const { popupZIndex: sfPopupZIdx, sectionZIndexes: sfSectionZIdx } = await wbPage.getSectionZIndexes(
          allSfSections,
        );
        for (const sectionZIndex of sfSectionZIdx) {
          expect(sfPopupZIdx).toBeGreaterThan(sectionZIndex);
        }
      });
    }
  });

  test(`@SB_WEB_BUILDER_WBP_34 - [Mobile] Kiểm tra hiển thị popup và nội dung page khi config overlay`, async ({
    conf,
    pageMobile,
  }) => {
    const caseConf = conf.caseConf as SbWebBuilderWbp34;
    const steps = caseConf.steps;
    sfPage = new PopupSfPage(pageMobile, conf.suiteConf.domain);

    for (const step of steps) {
      await test.step(step.name, async () => {
        await wbPage.clickOnSectionPopup();
        const stepData = step.data;

        if (stepData.style) {
          await wbPage.setPopUpDesign(stepData.style);
          await wbPage.clickSaveButton();
        }

        await wbPage.clickSaveButton();

        // Verify wb
        const wbOverlay = wbPage.frameLocator.locator(wbPage.xpathWbOverlay);
        const opacityValue = await getStyle(wbOverlay, "opacity");
        expect(opacityValue).toEqual(stepData.opacity_value);

        // Verify sf
        await sfPage.openStorefront();
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();
        const sfOpacityValue = await getStyle(sfPage.genLoc(sfPage.xpathWbOverlay), "opacity");
        expect(sfOpacityValue).toEqual(stepData.opacity_value);
      });
    }
  });

  test(`@SB_WEB_BUILDER_WBP_35 - [Mobile] Kiểm tra width, height popup`, async ({ conf, pageMobile }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP12Class;
    sfPage = new PopupSfPage(pageMobile, conf.suiteConf.domain);

    await test.step(`1. Tại tab Design, kiểm tra hiển thị default width, height, 2. Mở tab mới ngoài storefront`, async () => {
      const step1Data = caseConf.step1_data;
      const step1DebugData = [];

      for (const stepData of step1Data) {
        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);
        const inlineStyles = await wbPopupLoc.getAttribute("style");
        expect(inlineStyles).toContain(stepData.expected_width_wb);
        expect(inlineStyles).toContain(stepData.expected_height_wb);
        step1DebugData.push({
          key: "wb_width",
          expected_value: stepData.expected_width_wb,
          actual_value: inlineStyles,
        });

        step1DebugData.push({
          key: "wb_height",
          expected_value: stepData.expected_height_wb,
          actual_value: inlineStyles,
        });

        // Verify sf
        await sfPage.openStorefront();
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();
        const sfWidthValue = await getStyle(sfPage.genLoc(sfPage.xpathSfSectionPopup), "width");
        expect(sfWidthValue).toEqual(stepData.expected_width_sf);

        step1DebugData.push({
          key: "sf_width",
          expected_value: stepData.expected_width_sf,
          actual_value: sfWidthValue,
        });

        const sfHeightValue = await getStyle(sfPage.genLoc(sfPage.xpathSfSectionPopup), "height");
        const actualSHeight = parseFloat(sfHeightValue.replace("px", ""));
        expect(actualSHeight).toBeGreaterThanOrEqual(stepData.expected_height_sf);

        step1DebugData.push({
          key: "sf_height",
          expected_value: stepData.expected_height_sf,
          actual_value: sfHeightValue,
        });

        printLog("Step 1");
        printTableLog(step1DebugData);
      }
    });

    await test.step(`1. Tại tab design, setting width theo data, click save, 2. Mở web ngoài storefront trên mobile`, async () => {
      const step2Data = caseConf.step2_data;
      const step2DebugData = [];

      for (const stepData of step2Data) {
        await wbPage.clickOnSectionPopup();
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);
        const inlineStyles = await wbPopupLoc.getAttribute("style");
        expect(inlineStyles).toContain(stepData.expected_width_wb);
        step2DebugData.push({
          key: "wb_width",
          expected_value: stepData.expected_width_wb,
          actual_value: inlineStyles,
        });

        // Verify sf
        await sfPage.openStorefront();
        await sfPage.waitForPopupDisplayed(caseConf.popup_timeout);

        const sfWidthValue = await getStyle(sfPage.genLoc(sfPage.xpathSfSectionPopup), "width");
        let expectedWidth = stepData.expected_width_sf;

        if (expectedWidth === "viewport") {
          expectedWidth = `${sfPage.getViewportWidth()}px`;
        } else if (expectedWidth === "viewport/2") {
          expectedWidth = `${sfPage.getViewportWidth() / 2}px`;
        }

        step2DebugData.push({
          key: "sf_width",
          expected_value: expectedWidth,
          actual_value: sfWidthValue,
        });

        const approximatelyExpectWidth = parseFloat(expectedWidth.replace("px", ""));
        const approximatelyActualWidth = parseFloat(sfWidthValue.replace("px", ""));
        expect(approximatelyActualWidth).toBeGreaterThanOrEqual(approximatelyExpectWidth - 1);
        expect(approximatelyActualWidth).toBeLessThanOrEqual(approximatelyExpectWidth + 1);
        step2DebugData.push({
          key: "sf_cal_value",
          expected_value: approximatelyExpectWidth,
          actual_value: approximatelyActualWidth,
        });
      }

      printLog("Step 2");
      printTableLog(step2DebugData);
    });

    await test.step(`1. Tại tab design, setting height theo data, click save, 2. Mở web ngoài storefront trên mobile`, async () => {
      const step3Data = caseConf.step3_data;
      const step3DebugData = [];

      for (const stepData of step3Data) {
        await wbPage.clickOnSectionPopup();
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);
        const inlineStyles = await wbPopupLoc.getAttribute("style");
        expect(inlineStyles).toContain(stepData.expected_height_wb);
        step3DebugData.push({
          key: "wb_height",
          expected_value: stepData.expected_height_wb,
          actual_value: inlineStyles,
        });

        // Verify sf
        await sfPage.openStorefront();
        await sfPage.waitForPopupDisplayed(caseConf.popup_timeout);

        const rawSfHeightValue = await getStyle(sfPage.genLoc(sfPage.xpathSfSectionPopup), "height");
        const sfHeightValue = sfPage.roundRawValueContainPx(rawSfHeightValue);
        let expectedHeight = stepData.expected_height_sf;
        if (expectedHeight === "viewport") {
          expectedHeight = `${sfPage.roundRawValueContainPx(`${sfPage.getViewportHeight()}`)}`;
        } else if (expectedHeight === "viewport/2") {
          expectedHeight = `${sfPage.roundRawValueContainPx(`${sfPage.getViewportHeight() / 2}`)}`;
        }
        if (stepData.style.height.value.unit === "Auto") {
          const actualSfHeight = parseFloat(sfHeightValue.replace("px", ""));
          const expectedSfHeight = parseFloat(expectedHeight.replace("px", ""));
          expect(actualSfHeight).toBeGreaterThanOrEqual(expectedSfHeight);
          step3DebugData.push({
            key: "sf_height",
            expected_value: expectedSfHeight,
            actual_value: actualSfHeight,
          });
        } else {
          step3DebugData.push({
            key: "sf_height",
            expected_value: stepData.expected_height_sf,
            actual_value: sfHeightValue,
          });
          expect(sfHeightValue).toEqual(expectedHeight);
        }
      }
      printLog("Step 3");
      printTableLog(step3DebugData);
    });
  });

  test(`@SB_WEB_BUILDER_WBP_37 - [Mobile] Kiểm tra background popup`, async ({ conf, pageMobile }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP14Class;
    const mobilePage = new PopupSfPage(pageMobile, conf.suiteConf.domain);

    await test.step(`1. Tại tab Design, kiểm tra hiển thị default background, 2. Mở tab mới ngoài storefront`, async () => {
      const step1Data = caseConf.step1_data;

      for (const stepData of step1Data) {
        await wbPage.clickOnSectionPopup();
        await wbPage.clickSaveButton();
        await wbPage.page.waitForTimeout(conf.caseConf.popup_timeout);

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          logger.info(
            `Default - trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await mobilePage.openStorefront();
        logger.info(`Step 1 SF url: ${mobilePage.page.url()}`);
        await mobilePage.waitForPopupDisplayed(conf.caseConf.popup_timeout);

        const sfLoc = mobilePage.genLoc(mobilePage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          logger.info(
            `Default - trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }
      }
    });

    await test.step(`1. Tại tab design, setting background theo data, click save, 2. Mở web ngoài storefront trên mobile`, async () => {
      const step2Data = caseConf.step2_data;

      for (const stepData of step2Data) {
        await wbPage.clickOnSectionPopup();
        await wbPage.switchToTab("Design");
        await wbPage.switchMobileBtn.click();
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          logger.info(
            `Default - trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await mobilePage.openStorefront();
        await mobilePage.waitForPopupDisplayed(conf.caseConf.popup_timeout);

        const sfLoc = mobilePage.genLoc(mobilePage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          logger.info(
            `Trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
        }

        logger.info(`=== End of loop`);
      }
    });
  });

  test(`@SB_WEB_BUILDER_WBP_38 - [Mobile] Kiểm tra border của popup`, async ({ conf, pageMobile }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP15Class;
    sfPage = new PopupSfPage(pageMobile, conf.suiteConf.domain);

    await test.step(`Preview trên màn mobile ngoài SF`, async () => {
      logger.info("Step 1");
      await wbPage.clickOnSectionPopup();
      const step1DebugData = [];

      const step1Data = caseConf.step1_data;

      for (const stepData of step1Data) {
        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          step1DebugData.push({
            key: `wb_${verifyProperty.property}`,
            expected_value: verifyProperty.value,
            actual_value: cssValue,
          });
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await sfPage.openStorefront();
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          step1DebugData.push({
            key: `sf_${verifyProperty.property}`,
            expected_value: verifyProperty.value,
            actual_value: cssValue,
          });
          expect(cssValue).toEqual(verifyProperty.value);
        }
      }

      printTableLog(step1DebugData);
    });

    await test.step(`1. Chọn border lần lượt theo list data. 2. Click vào icon Preview`, async () => {
      logger.info("Step 2");
      await wbPage.clickOnSectionPopup();
      const step2Data = caseConf.step2_data;
      const step2DebugData = [];

      for (const stepData of step2Data) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          step2DebugData.push({
            key: `wb_${verifyProperty.property}`,
            style: JSON.stringify(stepData.style),
            expected_value: verifyProperty.value,
            actual_value: cssValue,
          });
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await sfPage.openStorefront();
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          step2DebugData.push({
            key: `sf_${verifyProperty.property}`,
            expected_value: verifyProperty.value,
            actual_value: cssValue,
          });
        }

        logger.info(`=== End of loop`);
      }

      printTableLog(step2DebugData);
    });
  });

  test(`@SB_WEB_BUILDER_WBP_39 - [Mobile] Kiểm tra radius, shadow, padding, margin của popup`, async ({
    conf,
    pageMobile,
  }) => {
    const caseConf = conf.caseConf as SBWEBBUILDERWBP16Class;
    sfPage = new PopupSfPage(pageMobile, conf.suiteConf.domain);

    await test.step(`1. Setting radius, shadow, padding, margin theo danh sách data, 2. Preview ngoài SF trên mobile`, async () => {
      const step1Data = caseConf.step1_data;

      for (const stepData of step1Data) {
        await wbPage.clickOnSectionPopup();
        logger.info(`Trying to set style: ${JSON.stringify(stepData.style)}`);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await wbPage.setPopUpDesign(stepData.style);
        await wbPage.clickSaveButton();

        // Verify wb
        const wbPopupLoc = wbPage.frameLocator.locator(wbPage.xpathWbDivSectionPopup);
        const wbPopupSectionLoc = wbPage.frameLocator.locator(wbPage.xpathWbSectionPopup);
        const verifyProperties = stepData.verify_properties;
        for (const verifyProperty of verifyProperties) {
          let cssValue;
          if (verifyProperty.property.includes("margin")) {
            cssValue = await getStyle(wbPopupSectionLoc, verifyProperty.property);
          } else {
            cssValue = await getStyle(wbPopupLoc, verifyProperty.property);
          }

          logger.info(
            `Default - trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }

        // Verify sf
        await sfPage.openStorefront();
        await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();

        const sfLoc = sfPage.genLoc(sfPage.xpathSfSectionPopup);
        for (const verifyProperty of verifyProperties) {
          const cssValue = await getStyle(sfLoc, verifyProperty.property);
          logger.info(
            `Default - trying verify prop ${verifyProperty.property}, got value: ${cssValue}, expected value: ${verifyProperty.value}`,
          );
          expect(cssValue).toEqual(verifyProperty.value);
        }
      }
    });
  });

  test(`@SB_NEWECOM_NP_09 Check close popup bằng phím ESC`, async () => {
    await test.step(`Tại Web Builder, click popup, click sang vùng preview`, async () => {
      await wbPage.clickOnSectionPopup();
      await expect(wbPage.genLocFrameFirst(wbPage.xpathPopup.popup.section)).toBeVisible();
      await wbPage.page.waitForTimeout(2 * 1000); // wait for transition completed

      await wbPage.genLoc(wbPage.iframe).dblclick();
      await wbPage.page.keyboard.press("Escape");

      await expect(wbPage.genLocFrameFirst(wbPage.xpathPopup.popup.section)).toBeHidden();
    });

    await test.step(`Mở SF, đợi popup hiển thị lên và bấm phím ESC`, async () => {
      await sfPage.openStorefront();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeVisible();
      await sfPage.page.keyboard.press("Escape");

      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.textInside))).toBeHidden();
    });
  });
});

test.describe("Verify button setting của popup", () => {
  let wbPage: WbPopUp;
  let sfPage: PopupSfPage;

  test.beforeEach(async ({ dashboard, conf, context }) => {
    test.slow();
    wbPage = new WbPopUp(dashboard, conf.suiteConf.domain);
    const newTab = await context.newPage();
    sfPage = new PopupSfPage(newTab, conf.suiteConf.domain);
    await test.step(`Login vào shop, vào web builder, click vào popup`, async () => {
      await wbPage.navigateToMenu("Online Store");
      const templateId = await wbPage.getTemplateIdInListTemplate(fixedCaseConf.theme);
      logger.info(`Template id: ${templateId}`);
      if (templateId > 0) {
        await wbPage.publishTemplateById(templateId);
      }
      await wbPage.page.waitForTimeout(2 * 1000);
      await wbPage.openTemplate(fixedCaseConf.theme);

      // Delete all existing popup
      await wbPage.deleteAllExistingPopup();

      // Create popup & setting styles
      const popupSettings: PopupSettings[] = [];
      popupSettings.push({
        content: {
          name: fixedCaseConf.textInside,
          trigger: {
            type: "Delay",
            value: 0,
          },
        },
        button: {
          label: fixedCaseConf.buttonCloseLabel,
          action: "Close current popup",
        },
      });
      await wbPage.insertPopups(popupSettings);

      // Save setting
      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BB_21 Tab setting_Check setting button với action = Close current popup`, async ({
    pageMobile,
    conf,
  }) => {
    await test.step(`Setting block button 1:1. Ở màn preview, click block button 12. Chọn tab setting trên sidebar.+ Chọn Icon.+ Nhập Label button.+ Click Button Action chọn Close current popup-> kiểm tra hiển thị icon và label trên block button ở màn preview`, async () => {
      // Click popup
      await wbPage.clickOnSectionPopup();
      await wbPage.clickOnButtonOnPopup(fixedCaseConf.buttonCloseLabel);
      await wbPage.switchToTab("Content");

      // Check sidebar
      const name = await wbPage.genLoc(wbPage.xpathPopup.sidebar.button.labelInput).inputValue();
      const action = await wbPage.genLoc(wbPage.xpathPopup.sidebar.button.action).innerText();

      expect(name).toEqual(fixedCaseConf.buttonCloseLabel);
      expect(action).toEqual("Close current popup");

      // Preview visible
      await expect(
        wbPage.genLocFrame(wbPage.xpathPopup.popup.buttonOnPopup(fixedCaseConf.buttonCloseLabel)),
      ).toBeVisible();
      await expect(wbPage.genLocFrame(wbPage.xpathPopup.popup.closeButton.inline)).toBeVisible();
    });

    await test.step(`Kiểm tra chức năng button close popup ở trên SF:1. Mở SF của shop sang tab mới, đi đến trang vừa mới customize -> đợi 3s sau khi load xong page để hiện popup A2. Click button Close trong popup`, async () => {
      sfPage = new PopupSfPage(pageMobile, conf.suiteConf.domain);

      await sfPage.openStorefront();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.buttonCloseLabel))).toBeVisible();
      await sfPage.genLoc(sfPage.xpathP.popup.buttonHaveText(fixedCaseConf.buttonCloseLabel)).click();

      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.buttonCloseLabel))).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BB_19 Tab setting_Check setting button với action = Close current popup`, async ({
    context,
    page,
    conf,
  }) => {
    await test.step(`Setting block button 1:1. Ở màn preview, click block button 12. Chọn tab setting trên sidebar.+ Chọn Icon.+ Nhập Label button.+ Click Button Action chọn Close current popup-> kiểm tra hiển thị icon và label trên block button ở màn preview`, async () => {
      // Click popup
      await wbPage.clickOnSectionPopup();
      await wbPage.clickOnButtonOnPopup(fixedCaseConf.buttonCloseLabel);
      await wbPage.switchToTab("Content");

      // Check sidebar
      const name = await wbPage.genLoc(wbPage.xpathPopup.sidebar.button.labelInput).inputValue();
      const action = await wbPage.genLoc(wbPage.xpathPopup.sidebar.button.action).innerText();

      expect(name).toEqual(fixedCaseConf.buttonCloseLabel);
      expect(action).toEqual("Close current popup");

      // Preview visible
      await expect(
        wbPage.genLocFrame(wbPage.xpathPopup.popup.buttonOnPopup(fixedCaseConf.buttonCloseLabel)),
      ).toBeVisible();
      await expect(wbPage.genLocFrame(wbPage.xpathPopup.popup.closeButton.inline)).toBeVisible();
    });

    await test.step(`Kiểm tra chức năng button close popup ở trang preview on new tab:1. Click button save > click icon preview trên thanh bar -> kiểm tra hiển thị button Close trong popup.2. Click vào button Close trong popup -> kiểm tra tắt popup`, async () => {
      const [sfTab] = await Promise.all([context.waitForEvent("page"), wbPage.clickBtnNavigationBar("preview")]);

      sfPage = new PopupSfPage(sfTab, conf.suiteConf.domain);
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.buttonCloseLabel))).toBeVisible();
      await sfPage.genLoc(sfPage.xpathP.popup.buttonHaveText(fixedCaseConf.buttonCloseLabel)).click();

      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.buttonCloseLabel))).toBeHidden();
    });

    await test.step(`Kiểm tra chức năng button close popup ở trên SF:1. Mở SF của shop sang tab mới, đi đến trang vừa mới customize -> đợi 3s sau khi load xong page để hiện popup A2. Click button Close trong popup`, async () => {
      sfPage = new PopupSfPage(page, conf.suiteConf.domain);

      await sfPage.openStorefront();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.buttonCloseLabel))).toBeVisible();
      await sfPage.genLoc(sfPage.xpathP.popup.buttonHaveText(fixedCaseConf.buttonCloseLabel)).click();

      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(fixedCaseConf.buttonCloseLabel))).toBeHidden();
    });
  });
});

test.describe("Verify setting open button của popup", () => {
  let wbPage: WbPopUp;
  let sfPage: PopupSfPage;

  test.beforeEach(async ({ dashboard, conf, context }) => {
    test.slow();
    wbPage = new WbPopUp(dashboard, conf.suiteConf.domain);
    const newTab = await context.newPage();
    sfPage = new PopupSfPage(newTab, conf.suiteConf.domain);
    await test.step(`Login vào shop, vào web builder, click vào popup`, async () => {
      await wbPage.navigateToMenu("Online Store");
      const templateId = await wbPage.getTemplateIdInListTemplate("SB_WEB_BUILDER_LB_BB_18");
      logger.info(`Template id: ${templateId}`);
      if (templateId > 0) {
        await wbPage.publishTemplateById(templateId);
      }
      await wbPage.page.waitForTimeout(2 * 1000);
      await wbPage.openTemplate("SB_WEB_BUILDER_LB_BB_18");

      // Delete all existing popup
      await wbPage.deleteAllExistingPopup();
      logger.info("After delete all existing popup");

      // Delete all existing button
      await wbPage.deleteAllExistingButton(["Button A", "Button B", "Button C", "Button D", "Button F"]);
      logger.info("After delete all existing button");

      // Create 4 popup & setting styles
      const popupSettings: PopupSettings[] = [];
      popupSettings.push({
        content: {
          name: "Popup X",
          trigger: {
            type: "Mouse click",
          },
        },
        style: {
          overlay: 100,
        },
        paragraph: "This is popup X",
      });
      popupSettings.push({
        content: {
          name: "Popup Y",
          trigger: {
            type: "Mouse click",
          },
        },
        style: {
          overlay: 80,
        },
        paragraph: "This is popup Y",
      });
      popupSettings.push({
        content: {
          name: "Popup Z",
          trigger: {
            type: "Mouse click",
          },
        },
        style: {
          overlay: 0,
        },
        paragraph: "This is popup Z",
      });
      popupSettings.push({
        content: {
          name: "Popup H",
          trigger: {
            type: "Mouse click",
          },
        },
        style: {
          overlay: 0,
        },
        paragraph: "This is popup H",
      });

      await wbPage.insertPopups(popupSettings);
      logger.info("After re-insert 4 popup");

      // Add 4 button & setting triggers
      const buttonSettings: InsertButtonWithSetting[] = [];
      buttonSettings.push({
        position: {
          section: 3,
          row: 1,
          column: 1,
        },
        contentSetting: {
          label: "Button A",
          action: "Open a pop-up",
          popup: "Popup X",
        },
      });
      buttonSettings.push({
        position: {
          section: 3,
          row: 1,
          column: 2,
        },
        contentSetting: {
          label: "Button B",
          action: "Open a pop-up",
          popup: "Popup Y",
        },
      });
      buttonSettings.push({
        position: {
          section: 4,
          row: 1,
          column: 1,
        },
        contentSetting: {
          label: "Button C",
          action: "Open a pop-up",
          popup: "Popup Z",
        },
      });
      buttonSettings.push({
        position: {
          section: 4,
          row: 1,
          column: 2,
        },
        contentSetting: {
          label: "Button D",
          action: "Open a pop-up",
          popup: "Popup H",
        },
      });
      buttonSettings.push({
        position: {
          section: 5,
          column: 1,
        },
        contentSetting: {
          label: "Button F",
        },
      });

      await wbPage.insertButton(buttonSettings);
      logger.info("After re-insert 5 button");

      // Save setting
      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BB_20 Tab setting_Check setting button với action = Open a pop-up`, async () => {
    await test.step(`Kiểm tra hoạt động của các button khi preview page on new tab:1. Click vào button A (Test 1) -> click button X ở góc phải phía trên popup2. Click vào button C (Test 3) 3. Click vào button B (Test 2), 4. Click vào button D (Test 4)`, async () => {
      // Open sf
      await sfPage.openStorefront();

      const popups = [
        {
          textContent: "This is popup X",
          triggerButton: "Button A",
          overlay: 1.0,
        },
        {
          textContent: "This is popup Z",
          triggerButton: "Button C",
          overlay: 0,
        },
        {
          textContent: "This is popup Y",
          triggerButton: "Button B",
          overlay: 0.8,
        },
        {
          textContent: "This is popup H",
          triggerButton: "Button D",
          overlay: 0,
        },
      ];

      for (const popup of popups) {
        logger.info(`Processing popup: ${popup.textContent}`);
        const popupLocs = await sfPage.getPopupLocs(popup.textContent, popup.triggerButton);
        await popupLocs.triggerButton.click();

        await expect(popupLocs.popup).toBeVisible();
        const overlayAValue = await sfPage.getOverlayValue(popupLocs.overlay);
        expect(overlayAValue).toEqual(popup.overlay);

        await popupLocs.closeButton.click();
        await expect(popupLocs.popup).toBeHidden();
      }
    });

    await test.step(`Kiểm tra hoạt động của các button khi view page ở SF:1. Mở SF của shop, đi đến trang vừa mới customize -> click button D (Test 4) > click button X, 2. Click vào button A (Test 1) -> click button X ở góc phải phía trên popup.3. Click vào button C (Test 3) 4. Click vào button B (Test 2)`, async () => {
      // Open sf
      await sfPage.openStorefront();

      // click button D ~> Hiển thị popup H không có overlay.-> click btn X thì tắt popup H
      const popupH = {
        textContent: "This is popup H",
        triggerButton: "Button D",
        overlay: 0,
      };
      const popupHLocs = await sfPage.getPopupLocs(popupH.textContent, popupH.triggerButton);
      await popupHLocs.triggerButton.click();
      await expect(popupHLocs.popup).toBeVisible();
      const overlayHValue = await sfPage.getOverlayValue(popupHLocs.overlay);
      expect(overlayHValue).toEqual(popupH.overlay);
      await popupHLocs.closeButton.click();
      await expect(popupHLocs.popup).toBeHidden();

      // Click vào button A ~> Hiển thị popup X có overlay  không thể tương tác với các nội dung khác của page
      // -> click button X ở góc phải phía trên popup
      const popupX = {
        textContent: "This is popup X",
        triggerButton: "Button A",
        overlay: 1.0,
      };
      const popupXLocs = await sfPage.getPopupLocs(popupX.textContent, popupX.triggerButton);
      await popupXLocs.triggerButton.click();
      await expect(popupXLocs.popup).toBeVisible();
      const overlayXValue = await sfPage.getOverlayValue(popupXLocs.overlay);
      expect(overlayXValue).toEqual(popupX.overlay);
      // Verify khong tuong tac duoc voi noi dung page
      // ~> verify button nam duoi ko click duoc
      const buttonTriggerPopupC = sfPage
        .genLoc(`//section[@component='button' and contains(normalize-space(), 'Button B')]`)
        .first();
      const isClickError = await sfPage.isClickError(buttonTriggerPopupC);
      expect(isClickError).toEqual(true);
      // Close
      await popupXLocs.closeButton.click();
      await expect(popupXLocs.popup).toBeHidden();

      // Click vào button C (Test 3) ~> Hiển thị popup Z (không có overlay),
      // có thể tương tác với các nội dung khác trên page.
      const popupZ = {
        textContent: "This is popup Z",
        triggerButton: "Button C",
        overlay: 0,
      };
      const popupZLocs = await sfPage.getPopupLocs(popupZ.textContent, popupZ.triggerButton);
      await popupZLocs.triggerButton.click();
      await expect(popupZLocs.popup).toBeVisible();
      const overlayZValue = await sfPage.getOverlayValue(popupZLocs.overlay);
      expect(overlayZValue).toEqual(popupZ.overlay);
      // Verify có thể tương tác với các nội dung khác trên page.
      // ~> verify button nam duoi ko click duoc
      let buttonFLoc = sfPage
        .genLoc(`//section[@component='button' and contains(normalize-space(), 'Button F')]`)
        .first();
      let isClickFError = await sfPage.isClickError(buttonFLoc);
      // TODO: un-comment following line when dev fix bug popup done
      // await expect(isClickFError).toEqual(false);
      // Close
      await popupZLocs.closeButton.click();
      await expect(popupZLocs.popup).toBeHidden();

      // Click vào button B (Test 2) ~> Hiển thị popup Y có overlay và nằm phía bên trên popup Z,
      // không thể tương tác với các nội dung khác của page.
      const popupY = {
        textContent: "This is popup Y",
        triggerButton: "Button B",
        overlay: 0.8,
      };
      const popupYLocs = await sfPage.getPopupLocs(popupY.textContent, popupY.triggerButton);
      await popupYLocs.triggerButton.click();
      await expect(popupYLocs.popup).toBeVisible();
      const overlayYValue = await sfPage.getOverlayValue(popupYLocs.overlay);
      expect(overlayYValue).toEqual(popupY.overlay);
      // Verify có thể tương tác với các nội dung khác trên page.
      // ~> verify button nam duoi ko click duoc
      buttonFLoc = sfPage.genLoc(`//section[@component='button' and contains(normalize-space(), 'Button F')]`).first();
      isClickFError = await sfPage.isClickError(buttonFLoc);
      expect(isClickFError).toEqual(true);
      // Close
      await popupYLocs.closeButton.click();
      await expect(popupYLocs.popup).toBeHidden();
    });

    await test.step(`Kiểm tra hoạt động của button khi đã xóa popup:1. Tại tab web-builder đang setting block button, xóa popup Y -> click button Save 2. Click icon preview trên thanh bar -> click button B (Test 2) -> kiểm tra hiển thị popup Y3. Click vào button A (Test 1) -> click button X ở góc phải phía trên popup.`, async () => {
      // Select popup Y
      await wbPage.clickOnSectionPopupByName("Popup Y");

      // Click delete
      const quickSettingButtonLocs = await wbPage.genLocFrame("//div[@id='quick-settings']//button").all();
      const quickBarDeleteButtonLoc = quickSettingButtonLocs[5];
      await quickBarDeleteButtonLoc.click();

      // Click save
      await wbPage.clickSaveButton();

      // Open sf
      await sfPage.openStorefront();

      // Click button B
      const popupY = {
        textContent: "This is popup Y",
        triggerButton: "Button B",
        overlay: 0.8,
      };
      // popup loc
      const popupLoc = sfPage
        .genLoc(`//section[contains(@class, 'section-popup') and contains(normalize-space(), '${popupY.textContent}')]`)
        .first();
      const triggerButtonLoc = sfPage
        .genLoc(`//section[@component='button' and contains(normalize-space(), '${popupY.triggerButton}')]`)
        .first();

      // trigger button
      await triggerButtonLoc.click();

      // Verify ko có popup hien len
      await expect(popupLoc).toBeHidden();
    });

    await test.step(`Kiểm tra hoạt động của button khi đã ẩn popup:1. Tại tab web-builder đang setting block button, hide popup H -> click button Save.2. Click icon preview trên thanh bar -> click button D (Test 4) -> kiểm tra hiển thị popup H3. Mở SF của shop, đi đến trang vừa mới customize -> click button D (Test 4)4. Click vào button A (Test 1) -> click button X ở góc phải phía trên popup.`, async () => {
      // fill your code here
    });
    // Select popup Y
    await wbPage.clickOnSectionPopupByName("Popup H");

    // Click delete
    const quickSettingButtonLocs = await wbPage.genLocFrame("//div[@id='quick-settings']//button").all();
    const quickbarHideButtonLoc = quickSettingButtonLocs[3];
    await quickbarHideButtonLoc.click();

    // Click save
    await wbPage.clickSaveButton();

    // Open sf
    await sfPage.openStorefront();

    // Click button B
    const popupH = {
      textContent: "This is popup H",
      triggerButton: "Button D",
    };
    // popup loc
    const popupLoc = sfPage
      .genLoc(`//section[contains(@class, 'section-popup') and contains(normalize-space(), '${popupH.textContent}')]`)
      .first();
    const triggerButtonLoc = sfPage
      .genLoc(`//section[@component='button' and contains(normalize-space(), '${popupH.triggerButton}')]`)
      .first();

    // trigger button
    await triggerButtonLoc.click();

    // Verify ko có popup hien len
    await expect(popupLoc).toBeHidden();
  });

  test(`@SB_WEB_BUILDER_LB_BB_18 Tab setting_Check setting button với action = Open a pop-up`, async () => {
    await test.step(`Kiểm tra hoạt động của các button khi preview page on new tab:1. Click vào button A (Test 1) -> click button X ở góc phải phía trên popup2. Click vào button C (Test 3) 3. Click vào button B (Test 2)4. Click vào button D (Test 4)`, async () => {
      // Open sf
      await sfPage.openStorefront();

      const popups = [
        {
          textContent: "This is popup X",
          triggerButton: "Button A",
          overlay: 1.0,
        },
        {
          textContent: "This is popup Z",
          triggerButton: "Button C",
          overlay: 0,
        },
        {
          textContent: "This is popup Y",
          triggerButton: "Button B",
          overlay: 0.8,
        },
        {
          textContent: "This is popup H",
          triggerButton: "Button D",
          overlay: 0,
        },
      ];

      for (const popup of popups) {
        logger.info(`Processing popup: ${popup.textContent}`);
        const popupLocs = await sfPage.getPopupLocs(popup.textContent, popup.triggerButton);
        await popupLocs.triggerButton.click();

        await expect(popupLocs.popup).toBeVisible();
        const overlayAValue = await sfPage.getOverlayValue(popupLocs.overlay);
        expect(overlayAValue).toEqual(popup.overlay);

        await popupLocs.closeButton.click();
        await expect(popupLocs.popup).toBeHidden();
      }
    });

    await test.step(`Kiểm tra hoạt động của các button khi view page ở SF:1. Mở SF của shop, đi đến trang vừa mới customize -> click button D (Test 4) > click button X, 2. Click vào button A (Test 1) -> click button X ở góc phải phía trên popup.3. Click vào button C (Test 3) 4. Click vào button B (Test 2)`, async () => {
      // Open sf
      await sfPage.openStorefront();

      // click button D ~> Hiển thị popup H không có overlay.-> click btn X thì tắt popup H
      const popupH = {
        textContent: "This is popup H",
        triggerButton: "Button D",
        overlay: 0,
      };
      const popupHLocs = await sfPage.getPopupLocs(popupH.textContent, popupH.triggerButton);
      await popupHLocs.triggerButton.click();
      await expect(popupHLocs.popup).toBeVisible();
      const overlayHValue = await sfPage.getOverlayValue(popupHLocs.overlay);
      expect(overlayHValue).toEqual(popupH.overlay);
      await popupHLocs.closeButton.click();
      await expect(popupHLocs.popup).toBeHidden();

      // Click vào button A ~> Hiển thị popup X có overlay  không thể tương tác với các nội dung khác của page
      // -> click button X ở góc phải phía trên popup
      const popupX = {
        textContent: "This is popup X",
        triggerButton: "Button A",
        overlay: 1.0,
      };
      const popupXLocs = await sfPage.getPopupLocs(popupX.textContent, popupX.triggerButton);
      await popupXLocs.triggerButton.click();
      await expect(popupXLocs.popup).toBeVisible();
      const overlayXValue = await sfPage.getOverlayValue(popupXLocs.overlay);
      expect(overlayXValue).toEqual(popupX.overlay);
      // Verify khong tuong tac duoc voi noi dung page
      // ~> verify button nam duoi ko click duoc
      const buttonTriggerPopupC = sfPage
        .genLoc(`//section[@component='button' and contains(normalize-space(), 'Button B')]`)
        .first();
      const isClickError = await sfPage.isClickError(buttonTriggerPopupC);
      expect(isClickError).toEqual(true);
      // Close
      await popupXLocs.closeButton.click();
      await expect(popupXLocs.popup).toBeHidden();

      // Click vào button C (Test 3) ~> Hiển thị popup Z (không có overlay),
      // có thể tương tác với các nội dung khác trên page.
      const popupZ = {
        textContent: "This is popup Z",
        triggerButton: "Button C",
        overlay: 0,
      };
      const popupZLocs = await sfPage.getPopupLocs(popupZ.textContent, popupZ.triggerButton);
      await popupZLocs.triggerButton.click();
      await expect(popupZLocs.popup).toBeVisible();
      const overlayZValue = await sfPage.getOverlayValue(popupZLocs.overlay);
      expect(overlayZValue).toEqual(popupZ.overlay);
      // Verify có thể tương tác với các nội dung khác trên page.
      // ~> verify button nam duoi ko click duoc
      let buttonFLoc = sfPage
        .genLoc(`//section[@component='button' and contains(normalize-space(), 'Button F')]`)
        .first();
      let isClickFError = await sfPage.isClickError(buttonFLoc);
      // TODO: un-comment following line when dev fix bug popup done
      // await expect(isClickFError).toEqual(false);
      // Close
      await popupZLocs.closeButton.click();
      await expect(popupZLocs.popup).toBeHidden();

      // Click vào button B (Test 2) ~> Hiển thị popup Y có overlay và nằm phía bên trên popup Z,
      // không thể tương tác với các nội dung khác của page.
      const popupY = {
        textContent: "This is popup Y",
        triggerButton: "Button B",
        overlay: 0.8,
      };
      const popupYLocs = await sfPage.getPopupLocs(popupY.textContent, popupY.triggerButton);
      await popupYLocs.triggerButton.click();
      await expect(popupYLocs.popup).toBeVisible();
      const overlayYValue = await sfPage.getOverlayValue(popupYLocs.overlay);
      expect(overlayYValue).toEqual(popupY.overlay);
      // Verify có thể tương tác với các nội dung khác trên page.
      // ~> verify button nam duoi ko click duoc
      buttonFLoc = sfPage.genLoc(`//section[@component='button' and contains(normalize-space(), 'Button F')]`).first();
      isClickFError = await sfPage.isClickError(buttonFLoc);
      expect(isClickFError).toEqual(true);
      // Close
      await popupYLocs.closeButton.click();
      await expect(popupYLocs.popup).toBeHidden();
    });

    await test.step(`Kiểm tra hoạt động của button khi đã xóa popup:1. Tại tab web-builder đang setting block button, xóa popup Y -> click button Save 2. Click icon preview trên thanh bar -> click button B (Test 2) -> kiểm tra hiển thị popup Y3. Click vào button A (Test 1) -> click button X ở góc phải phía trên popup.`, async () => {
      // Select popup Y
      await wbPage.clickOnSectionPopupByName("Popup Y");

      // Click delete
      const quickSettingButtonLocs = await wbPage.genLocFrame("//div[@id='quick-settings']//button").all();
      const quickBarDeleteButtonLoc = quickSettingButtonLocs[5];
      await quickBarDeleteButtonLoc.click();

      // Click save
      await wbPage.clickSaveButton();

      // Open sf
      await sfPage.openStorefront();

      // Click button B
      const popupY = {
        textContent: "This is popup Y",
        triggerButton: "Button B",
        overlay: 0.8,
      };
      // popup loc
      const popupLoc = sfPage
        .genLoc(`//section[contains(@class, 'section-popup') and contains(normalize-space(), '${popupY.textContent}')]`)
        .first();
      const triggerButtonLoc = sfPage
        .genLoc(`//section[@component='button' and contains(normalize-space(), '${popupY.triggerButton}')]`)
        .first();

      // trigger button
      await triggerButtonLoc.click();

      // Verify ko có popup hien len
      await expect(popupLoc).toBeHidden();
    });

    await test.step(`Kiểm tra hoạt động của button khi đã ẩn popup:1. Tại tab web-builder đang setting block button, hide popup H -> click button Save.2. Click icon preview trên thanh bar -> click button D (Test 4) -> kiểm tra hiển thị popup H3. Mở SF của shop, đi đến trang vừa mới customize -> click button D (Test 4)4. Click vào button A (Test 1) -> click button X ở góc phải phía trên popup.`, async () => {
      // fill your code here
    });
    // Select popup Y
    await wbPage.clickOnSectionPopupByName("Popup H");

    // Click delete
    const quickSettingButtonLocs = await wbPage.genLocFrame("//div[@id='quick-settings']//button").all();
    const quickbarHideButtonLoc = quickSettingButtonLocs[3];
    await quickbarHideButtonLoc.click();

    // Click save
    await wbPage.clickSaveButton();

    // Open sf
    await sfPage.openStorefront();

    // Click button B
    const popupH = {
      textContent: "This is popup H",
      triggerButton: "Button D",
    };
    // popup loc
    const popupLoc = sfPage
      .genLoc(`//section[contains(@class, 'section-popup') and contains(normalize-space(), '${popupH.textContent}')]`)
      .first();
    const triggerButtonLoc = sfPage
      .genLoc(`//section[@component='button' and contains(normalize-space(), '${popupH.triggerButton}')]`)
      .first();

    // trigger button
    await triggerButtonLoc.click();

    // Verify ko có popup hien len
    await expect(popupLoc).toBeHidden();
  });
});

test.describe("Verify setting trigger trong web builder của popup", () => {
  let wbPage: WbPopUp;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.slow();
    wbPage = new WbPopUp(dashboard, conf.suiteConf.domain);

    await test.step(`Login vào shop, vào web builder, click vào popup`, async () => {
      await wbPage.navigateToMenu("Online Store");
      const templateId = await wbPage.getTemplateIdInListTemplate(fixedCaseConf.theme);
      logger.info(`Template id: ${templateId}`);
      if (templateId > 0) {
        await wbPage.publishTemplateById(templateId);
      }
      await wbPage.page.waitForTimeout(2 * 1000);
      await wbPage.openTemplate(fixedCaseConf.theme);

      // Delete all existing popup
      await wbPage.deleteAllExistingPopup();

      // Create popup & setting styles
      const popupSettings: PopupSettings[] = [];
      popupSettings.push({
        content: {
          name: fixedCaseConf.textInside,
          trigger: {
            type: "Delay",
          },
        },
        paragraph: fixedCaseConf.textInside,
      });
      await wbPage.insertPopups(popupSettings);

      // Save setting
      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_WBP_18 Kiểm tra setting trigger hiện popup`, async ({ conf, snapshotFixture }) => {
    const env = process.env.ENV;

    await test.step(`Ở sidebar, tại tab Content > click droplist Trigger > kiểm tra hiển thị các option trigger Check tooltip`, async () => {
      await wbPage.clickOnSectionPopup();
      await wbPage.switchToTab("Content");
      await wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.triggerTooltipIcon).hover();
      await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.triggerTooltipContent)).toBeVisible();

      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.xpathPopup.sidebar.tabContent.triggerTooltipContent,
        snapshotName: `${env}-tooltip-trigger-setting.png`,
      });

      await wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.triggerTooltipDropdown).click();
      await wbPage.isDropdownItemsVisible(conf.caseConf.step1_data.trigger_options);
      await wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.triggerTooltipDropdown).click();
    });

    await test.step(`Chọn Delay > kiểm tra hiển thị setting delay time`, async () => {
      const step2Data = conf.caseConf.step2_data;
      await wbPage.setPopupContentSetting(step2Data.content_setting);
      await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.delay)).toBeVisible();
      for (const attribute of step2Data.attributes) {
        await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.delay)).toHaveAttribute(
          attribute.name,
          attribute.value,
        );
      }
    });

    await test.step(`Kéo chuột trên progress bar custom delay time > click button Save > kiểm tra hiển thị message save thành công `, async () => {
      const step3Data = conf.caseConf.step3_data;
      await wbPage.setPopupContentSetting(step3Data.content_setting);
      await wbPage.clickSaveButton();
      await expect(
        wbPage.genLoc(`${wbPage.xpathPopup.sidebar.tabContent.delay}//input[contains(@class,'inner')]`),
      ).toHaveValue(step3Data.content_setting.trigger.value.toString());
    });

    await test.step(`Tại tab Content, click droplist Trigger > chọn option Page scroll > kiểm tra hiển thị custom % scroll page `, async () => {
      const step4Data = conf.caseConf.step4_data;
      await wbPage.setPopupContentSetting(step4Data.content_setting);
      await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.pagescroll)).toBeVisible();
      for (const attribute of step4Data.attributes) {
        await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.pagescroll)).toHaveAttribute(
          attribute.name,
          attribute.value,
        );
      }
    });

    await test.step(`Custom % page scroll > click button Save > kiểm tra hiển thị message save thành công `, async () => {
      const step5Data = conf.caseConf.step5_data;
      await wbPage.setPopupContentSetting(step5Data.content_setting);
      await wbPage.clickSaveButton();
      await expect(
        wbPage.genLoc(`${wbPage.xpathPopup.sidebar.tabContent.pagescroll}//input[contains(@class,'inner')]`),
      ).toHaveValue(step5Data.content_setting.trigger.value.toString());
    });

    await test.step(`Click droplist Trigger > chọn option Exit intent > click button Save `, async () => {
      // verify trong case SB_WEB_BUILDER_WBP_30
    });

    await test.step(`Click droplist Trigger > chọn option Mouse Click > click button Save`, async () => {
      // verify trong case SB_WEB_BUILDER_WBP_30
    });

    await test.step(`Check preview trong web builder không ảnh hưởng trigger, popup luôn hiện khi đang mở setting popup`, async () => {
      // verify trong case SB_WEB_BUILDER_WBP_30
    });

    await test.step(`Option exit content check với desktop, mobile`, async () => {
      // verify trong case SB_WEB_BUILDER_WBP_30
    });

    await test.step(`Case Mouse click:1. Add thêm popup 2. Popup nằm ở footer, button nằm ở page bất kì 3. Popup nằm ở page A(khác footer), button nằm ở page B4. Popup nằm ở page A(khác footer), button nằm page A `, async () => {
      // verify trong case SB_WEB_BUILDER_WBP_30
    });
  });

  test(`@SB_WEB_BUILDER_WBP_19 Kiểm tra setting Customer trigger popup`, async ({ conf, snapshotFixture }) => {
    const env = process.env.ENV;

    await test.step(`Ở sidebar, click tab Content > click droplist Customer Trigger > Kiểm tra hiển thị các option Check tooltip`, async () => {
      await wbPage.clickOnSectionPopup();
      await wbPage.switchToTab("Content");
      await wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.customerTriggerTooltipIcon).hover();
      await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.customerTriggerTooltipContent)).toBeVisible();

      await snapshotFixture.verifyWithAutoRetry({
        page: wbPage.page,
        selector: wbPage.xpathPopup.sidebar.tabContent.customerTriggerTooltipContent,
        snapshotName: `${env}-tooltip-customer-trigger-setting.png`,
      });

      await wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.customerTriggerTooltipDropdown).click();
      await wbPage.isDropdownItemsVisible(conf.caseConf.step1_data.trigger_options);
      await wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.customerTriggerTooltipDropdown).click();
    });

    await test.step(`1. Chọn All customer > click button Save 2. Thao tác ngoài SF: tất cả người dùng đều nhìn thấy popup khi thực hiện trigger`, async () => {
      // verify trong case SB_WEB_BUILDER_WBP_30
    });

    await test.step(`Ở sidebar, click tab Content > click droplist Customer Trigger > chọn New visitors > click button Save 2. Thao tác ngoài SF: chỉ người dùng vào lần đầu nhìn thấy popup khi thực hiện trigger; người dùng đã từng vào website không thấy popup`, async () => {
      // verify trong case SB_WEB_BUILDER_WBP_30
    });

    await test.step(`1. Ở sidebar, click tab Content > click droplist Customer Trigger > chọn Returning visitors   2. Click lựa chọn Custom ở mục After leave > kiểm tra hiển thị giá trị custom.  3. Click droplist After leave > chọn 1 trong 3 option: Immediate, 1 day, 1 week > click button Save.    4. Click lại vào droplist After leave > click Custom > kéo chuột trên progress bar để chọn ngày > click btn Save 5. Thao tác ngoài SF: người dùng đã từng vào website cách đây số time = After leave nhìn thấy popup khi thực hiện trigger`, async () => {
      // verify sf trong case SB_WEB_BUILDER_WBP_30
      const step4Data = conf.caseConf.step4_data;

      await wbPage.setPopupContentSetting(step4Data.content_setting);
      await wbPage.clickSaveButton();
      await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.afterLeave)).toBeVisible();
      await wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.afterLeaveDropdown).click();
      await wbPage.isDropdownItemsVisible(step4Data.after_leave_options);
      await wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.afterLeaveDropdown).click();

      await wbPage.setPopupContentSetting(step4Data.content_setting2);
      await wbPage.clickSaveButton();
      await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.returningTime)).toBeVisible();
      for (const attribute of step4Data.attributes) {
        await expect(wbPage.genLoc(wbPage.xpathPopup.sidebar.tabContent.returningTime)).toHaveAttribute(
          attribute.name,
          attribute.value,
        );
      }

      await wbPage.setPopupContentSetting(step4Data.content_setting3);
      await wbPage.clickSaveButton();
      await expect(
        wbPage.genLoc(`${wbPage.xpathPopup.sidebar.tabContent.returningTime}//input[contains(@class,'inner')]`),
      ).toHaveValue(step4Data.content_setting3.customer_trigger.returning_time.toString());
    });
  });
});

test.describe("Verify ưu tiên hiển thị của popup ngoài SF", () => {
  let wbPage: WbPopUp;
  let sfPage: PopupSfPage;
  let popupId: string[];
  const popupSettings: PopupSettings[] = [];

  test.beforeEach(async ({ dashboard, conf, context }) => {
    test.slow();
    wbPage = new WbPopUp(dashboard, conf.suiteConf.domain);
    const newTab = await context.newPage();
    sfPage = new PopupSfPage(newTab, conf.suiteConf.domain);

    await test.step(`Login vào shop, vào web builder, click vào popup`, async () => {
      await wbPage.navigateToMenu("Online Store");
      const templateId = await wbPage.getTemplateIdInListTemplate("SB_WEB_BUILDER_WBP_31");
      logger.info(`Template id: ${templateId}`);

      if (templateId > 0) {
        await wbPage.publishTemplateById(templateId);
      }
      await wbPage.page.waitForTimeout(2 * 1000);
      await wbPage.openTemplate("SB_WEB_BUILDER_WBP_31");

      // Delete all existing popup
      await wbPage.deleteAllExistingPopup();
      logger.info("After delete all existing popup");

      // Delete all existing button
      await wbPage.deleteAllExistingButton(["Open popup"]);
      logger.info("After delete all existing button");

      // Create 4 popup & setting styles
      popupSettings.push({
        content: {
          name: "Popup click, o=24",
          trigger: {
            type: "Mouse click",
          },
        },
        style: {
          overlay: 24,
        },
        paragraph: "This is Popup click, o=24",
      });
      popupSettings.push({
        content: {
          name: "Popup scroll 10%, o=10",
          trigger: {
            type: "Page scroll",
            value: 10,
          },
        },
        style: {
          overlay: 10,
        },
        paragraph: "This is Popup scroll 10%, o=10",
      });
      popupSettings.push({
        content: {
          name: "Popup delay=30, o=10",
          trigger: {
            type: "Delay",
            value: 30,
          },
        },
        style: {
          overlay: 10,
        },
        paragraph: "This is Popup delay=30, o=10",
      });
      popupSettings.push({
        content: {
          name: "Popup delay=20, o=20",
          trigger: {
            type: "Delay",
            value: 20,
          },
        },
        style: {
          overlay: 20,
        },
        paragraph: "This is Popup delay=20, o=20",
      });

      popupId = await wbPage.insertPopups(popupSettings);
      logger.info("After re-insert 4 popup");

      // Add 1 button & setting triggers
      const buttonSettings: InsertButtonWithSetting[] = [];
      buttonSettings.push({
        position: {
          section: 3,
          row: 1,
          column: 1,
        },
        contentSetting: {
          label: "Open popup",
          action: "Open a pop-up",
          popup: "Popup click, o=24",
        },
      });

      await wbPage.insertButton(buttonSettings);
      logger.info("After re-insert 1 button");

      // Save setting
      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_WBP_31 Kiểm tra thứ tự ưu tiên hiển thị popup trên page ở SF khi page có nhiều popup`, async ({}) => {
    await test.step(`Mở SF home, scroll xuống 10% page`, async () => {
      await sfPage.openStorefront();
      await sfPage.genLoc(sfPage.xpathP.button.scrollpoint).scrollIntoViewIfNeeded();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[1].paragraph))).toBeVisible();
      const sfOpacityPopupScroll = await getStyle(
        sfPage.genLoc(sfPage.xpathP.popup.overlayPopupHaveId(popupId[1])),
        "opacity",
      );
      expect(sfOpacityPopupScroll).toEqual("0.1");
    });

    await test.step(`Click close popup`, async () => {
      await sfPage.genLoc(sfPage.xpathP.popup.closePopupHaveText(popupSettings[1].paragraph)).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[1].paragraph))).toBeHidden();
    });

    await test.step(`Di chuột lên phía trên thanh URL để trigger even exit intent`, async () => {
      // Chưa có solution test auto case exit intent
    });

    await test.step(`Thực hiện close popup`, async () => {
      // Chưa có solution test auto case exit intent
    });

    await test.step(`Click button "Open popup"`, async () => {
      await sfPage.genLoc(sfPage.xpathP.button.buttonHaveText(`Open popup`)).scrollIntoViewIfNeeded();
      await sfPage.genLoc(sfPage.xpathP.button.buttonHaveText(`Open popup`)).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[0].paragraph))).toBeVisible();
      const sfOpacityPopupClick = await getStyle(
        sfPage.genLoc(sfPage.xpathP.popup.overlayPopupHaveId(popupId[0])),
        "opacity",
      );
      expect(sfOpacityPopupClick).toEqual("0.24");
    });

    await test.step(`Chờ 40s để tất cả các popup được load lên`, async () => {
      await sfPage.waitForPopupDisplayed(30 * 1000);
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[0].paragraph))).toBeVisible();
    });

    await test.step(`Thực hiện close popup`, async () => {
      await sfPage.genLoc(sfPage.xpathP.popup.closePopupHaveText(popupSettings[0].paragraph)).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[0].paragraph))).toBeHidden();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[2].paragraph))).toBeVisible();
      const sfOpacityPopupDelay30 = await getStyle(
        sfPage.genLoc(sfPage.xpathP.popup.overlayPopupHaveId(popupId[2])),
        "opacity",
      );
      expect(sfOpacityPopupDelay30).toEqual("0.1");
    });

    await test.step(`Thực hiện close popup`, async () => {
      await sfPage.genLoc(sfPage.xpathP.popup.closePopupHaveText(popupSettings[2].paragraph)).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[2].paragraph))).toBeHidden();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[3].paragraph))).toBeVisible();
      const sfOpacityPopupDelay20 = await getStyle(
        sfPage.genLoc(sfPage.xpathP.popup.overlayPopupHaveId(popupId[3])),
        "opacity",
      );
      expect(sfOpacityPopupDelay20).toEqual("0.2");
    });

    await test.step(`Thực hiện close popup`, async () => {
      await sfPage.genLoc(sfPage.xpathP.popup.closePopupHaveText(popupSettings[3].paragraph)).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(popupSettings[3].paragraph))).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_WBP_51 [Mobile] Kiểm tra thứ tự ưu tiên hiển thị popup trên page ở SF khi page có nhiều popup`, async ({
    conf,
    pageMobile,
  }) => {
    test.slow();

    await test.step(`Mở SF home, scroll xuống 10% page`, async () => {
      sfPage = new PopupSfPage(pageMobile, conf.suiteConf.domain);
      await sfPage.openStorefront();
      await sfPage.genLoc(sfPage.xpathP.button.scrollpoint).scrollIntoViewIfNeeded();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[1]))).toBeVisible();
      const sfOpacityPopupScroll = await getStyle(
        sfPage.genLoc(sfPage.xpathP.popup.overlayPopupHaveId(popupId[1])),
        "opacity",
      );
      expect(sfOpacityPopupScroll).toEqual("0.1");
    });

    await test.step(`Click close popup`, async () => {
      await sfPage.genLoc(sfPage.xpathP.popup.closePopupById(popupId[1])).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[1]))).toBeHidden();
    });

    await test.step(`Di chuột lên phía trên thanh URL để trigger even exit intent`, async () => {
      // Chưa có solution test auto case exit intent
    });

    await test.step(`Thực hiện close popup`, async () => {
      // Chưa có solution test auto case exit intent
    });

    await test.step(`Click button "Open popup"`, async () => {
      await sfPage.genLoc(sfPage.xpathP.button.buttonHaveText(`Open popup`)).scrollIntoViewIfNeeded();
      await sfPage.genLoc(sfPage.xpathP.button.buttonHaveText(`Open popup`)).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[0]))).toBeVisible();
      const sfOpacityPopupClick = await getStyle(
        sfPage.genLoc(sfPage.xpathP.popup.overlayPopupHaveId(popupId[0])),
        "opacity",
      );
      expect(sfOpacityPopupClick).toEqual("0.24");
    });

    await test.step(`Chờ 30s để tất cả các popup được load lên`, async () => {
      await sfPage.waitForPopupDisplayed(30 * 1000);
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[0]))).toBeVisible();
    });

    await test.step(`Thực hiện close popup`, async () => {
      await sfPage.genLoc(sfPage.xpathP.popup.closePopupById(popupId[0])).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[0]))).toBeHidden();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[2]))).toBeVisible();
      const sfOpacityPopupDelay30 = await getStyle(
        sfPage.genLoc(sfPage.xpathP.popup.overlayPopupHaveId(popupId[2])),
        "opacity",
      );
      expect(sfOpacityPopupDelay30).toEqual("0.1");
    });

    await test.step(`Thực hiện close popup`, async () => {
      await sfPage.genLoc(sfPage.xpathP.popup.closePopupById(popupId[2])).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[2]))).toBeHidden();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[3]))).toBeVisible();
      const sfOpacityPopupDelay20 = await getStyle(
        sfPage.genLoc(sfPage.xpathP.popup.overlayPopupHaveId(popupId[3])),
        "opacity",
      );
      expect(sfOpacityPopupDelay20).toEqual("0.2");
    });

    await test.step(`Thực hiện close popup`, async () => {
      await sfPage.genLoc(sfPage.xpathP.popup.closePopupById(popupId[3])).click();
      await expect(sfPage.genLoc(sfPage.xpathP.popup.popupById(popupId[3]))).toBeHidden();
    });
  });
});

test.describe("Verify setting trigger của popup ngoài SF", () => {
  let wbPage: WbPopUp;
  let sfPage: PopupSfPage;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.slow();
    wbPage = new WbPopUp(dashboard, conf.suiteConf.domain);

    await test.step(`Login vào shop, vào web builder, click vào popup`, async () => {
      await wbPage.navigateToMenu("Online Store");
      const templateId = await wbPage.getTemplateIdInListTemplate("SB_WEB_BUILDER_WBP_30");
      logger.info(`Template id: ${templateId}`);
      if (templateId > 0) {
        await wbPage.publishTemplateById(templateId);
      }
      await wbPage.page.waitForTimeout(2 * 1000);
      await wbPage.openTemplate("SB_WEB_BUILDER_WBP_30");

      // Delete all existing popup
      await wbPage.deleteAllExistingPopup();

      // Save setting
      await wbPage.clickSaveButton();
    });
  });

  test(`@SB_WEB_BUILDER_WBP_30 Kiểm tra hiển thị popup ở SF theo điều kiện trigger đã setting`, async ({
    conf,
    browser,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`Mở SF của shop > đi đến page đã config popup > kiểm tra hiển thị popup`, async () => {
      // verify trigger Delay + Customer trigger
      const settingDelay = caseConf.delay;

      for (const setting of settingDelay) {
        // Delete all existing popup
        await wbPage.deleteAllExistingPopup();

        //Tạo popup theo trigger
        const popupSettings: PopupSettings[] = [];
        popupSettings.push(setting);
        await wbPage.insertPopups(popupSettings);
        await wbPage.clickSaveButton();

        //view SF
        const newPage = await browser.newPage();
        sfPage = new PopupSfPage(newPage, conf.suiteConf.domain);
        await sfPage.openStorefront();
        const trigger = setting.content.trigger;
        const customerTrigger = setting.content.customer_trigger;

        if (customerTrigger.type !== "Returning visitors") {
          await sfPage.waitForPopupDisplayed(trigger.value);
          await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(setting.paragraph))).toBeVisible();
          logger.info(`Popup ${setting.paragraph} is visible`);
        } else {
          await sfPage.page.waitForTimeout(caseConf.popup_timeout_max);
          await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(setting.paragraph))).toBeHidden();
          logger.info(`Popup ${setting.paragraph} is hidden`);
        }
        //set exit page time
        await sfPage.page.evaluate(() => localStorage.setItem("exit_page_time", "1681146000000"));

        //Load lại page và kiểm tra hiển thị các popup
        await sfPage.reload();

        if (customerTrigger.type === "New Visitors") {
          await sfPage.page.waitForTimeout(caseConf.popup_timeout_max);
          await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(setting.paragraph))).toBeHidden();
          logger.info(`After set exit page time, popup ${setting.paragraph} is hidden`);
        } else {
          await sfPage.waitForPopupDisplayed(trigger.value);
          await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(setting.paragraph))).toBeVisible();
          logger.info(`After set exit page time, popup ${setting.paragraph} is visible`);
        }
        await sfPage.page.close();
      }

      // verify trigger page scroll + customer trigger
      const pageScrollData = caseConf.page_scroll;
      for (const scrollSetting of pageScrollData) {
        for (const setting of scrollSetting.trigger_setting) {
          // Delete all existing popup
          await wbPage.deleteAllExistingPopup();

          //Tạo popup theo trigger
          const popupSettings: PopupSettings[] = [];
          popupSettings.push(setting);
          await wbPage.insertPopups(popupSettings);
          await wbPage.clickSaveButton();

          //view SF
          const newPage = await browser.newPage();
          sfPage = new PopupSfPage(newPage, conf.suiteConf.domain);
          await sfPage.openStorefront();
          const customerTrigger = setting.content.customer_trigger;

          if (customerTrigger.type !== "Returning visitors") {
            await sfPage
              .genLoc(sfPage.xpathP.button.buttonHaveText(scrollSetting.scroll_point))
              .scrollIntoViewIfNeeded();
            await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(setting.paragraph))).toBeVisible();
            logger.info(`Popup ${setting.paragraph} is visible`);
          } else {
            await sfPage
              .genLoc(sfPage.xpathP.button.buttonHaveText(scrollSetting.scroll_point))
              .scrollIntoViewIfNeeded();
            await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(setting.paragraph))).toBeHidden();
            logger.info(`Popup ${setting.paragraph} is hidden`);
          }
          //set exit page time
          await sfPage.page.evaluate(() => localStorage.setItem("exit_page_time", "1681146000000"));

          //Load lại page và kiểm tra hiển thị các popup
          await sfPage.reload();
          await sfPage.page.waitForTimeout(2 * 1000);

          if (customerTrigger.type === "New Visitors") {
            await sfPage
              .genLoc(sfPage.xpathP.button.buttonHaveText(scrollSetting.scroll_point))
              .scrollIntoViewIfNeeded();
            await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(setting.paragraph))).toBeHidden();
            logger.info(`After set exit page time, popup ${setting.paragraph} is hidden`);
          } else {
            await sfPage
              .genLoc(sfPage.xpathP.button.buttonHaveText(scrollSetting.scroll_point))
              .scrollIntoViewIfNeeded();
            await expect(sfPage.genLoc(sfPage.xpathP.popup.containText(setting.paragraph))).toBeVisible();
            logger.info(`After set exit page time, popup ${setting.paragraph} is visible`);
          }
          await sfPage.page.close();
        }
      }
    });
  });
});
