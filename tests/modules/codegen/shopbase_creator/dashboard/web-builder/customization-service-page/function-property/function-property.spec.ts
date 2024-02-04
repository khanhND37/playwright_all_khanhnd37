import { expect, test } from "@core/fixtures";
import { WbPageCustomizationService } from "@pages/dashboard/wb_page_customization_service";
import { Page } from "@playwright/test";
import { Dev, SbWebBuilderLpCSP06, SectionID } from "./function-property";
import { MyCustomizationServicePage } from "@pages/shopbase_creator/storefront/my_customization_service";
import { pressControl } from "@utils/keyboard";

test.describe("Verify tính chất của customization service page", () => {
  let dashboard: Page;
  let wbCsPage: WbPageCustomizationService;
  let defaultSectionMap: SectionID;

  test.beforeEach(async ({ dashboard: db, conf }) => {
    const suiteConf = conf.suiteConf as Dev;
    defaultSectionMap = suiteConf.section_id;

    dashboard = db;
    wbCsPage = new WbPageCustomizationService(dashboard, suiteConf.domain);
    await test.step(`Login vào shop creator, vào web builder, click vào page selector, chọn page "Customization service" trên page selector`, async () => {
      await wbCsPage.openCustomizationServicePage();

      const keepSectionIds = [
        defaultSectionMap.header,
        defaultSectionMap.customization_service,
        defaultSectionMap.footer,
      ];

      await wbCsPage.removeAllSection(keepSectionIds);
      const currentNumOfSection = await wbCsPage.getAllSections();
      expect(currentNumOfSection.length).toEqual(3); // header + customization + footer
    });
  });

  test(`@SB_WEB_BUILDER_LP_CSP_06 Verify add các block khác vào customization service page`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    await wbCsPage.page.waitForTimeout(10 * 1000);
    const caseConf = conf.caseConf as SbWebBuilderLpCSP06;
    await test.step(`Add thêm section phía trên block "Customization service", thêm vào block heading`, async () => {
      await wbCsPage.insertSectionBlock({
        parentPosition: {
          section: 2,
        },
        position: "Top",
        category: "Basics",
        template: "Section",
      });

      await wbCsPage.insertSectionBlock({
        parentPosition: {
          section: 2,
          column: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Heading",
      });

      const blockHeading = wbCsPage.getSelectorByIndex({
        section: 2,
        block: 1,
      });

      await wbCsPage.clickOnElement(blockHeading, wbCsPage.iframe);
      await wbCsPage.selectOptionOnQuickBar("Edit text");
      await pressControl(wbCsPage.page, "A");
      await wbCsPage.frameLocator.locator(blockHeading).type(caseConf.heading_text);
      await wbCsPage.backBtn.click();

      // Verify có tổng cộng 4 block: header, new block, customization, footer
      const sections = await wbCsPage.getAllSections();
      expect(sections.length).toEqual(4);

      const sectionIds = [];
      for (const section of sections) {
        const sectionId = await section.getAttribute("id");
        sectionIds.push(sectionId);
      }

      expect(sectionIds[0]).toEqual(defaultSectionMap.header);
      expect(sectionIds[2]).toEqual(defaultSectionMap.customization_service);
      expect(sectionIds[3]).toEqual(defaultSectionMap.footer);
    });

    await test.step(`Add thêm section phía dưới block Customization service, thêm vào block paragraph`, async () => {
      await wbCsPage.insertSectionBlock({
        parentPosition: {
          section: 3,
        },
        position: "Bottom",
        category: "Basics",
        template: "Section",
      });

      await wbCsPage.insertSectionBlock({
        parentPosition: {
          section: 4,
          column: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Paragraph",
      });

      const paragraphBlock = wbCsPage.getSelectorByIndex({
        section: 4,
        block: 1,
      });

      await wbCsPage.clickOnElement(paragraphBlock, wbCsPage.iframe);
      await wbCsPage.selectOptionOnQuickBar("Edit text");
      await pressControl(wbCsPage.page, "A");
      await wbCsPage.frameLocator.locator(paragraphBlock).type(caseConf.paragraph_text);
      await wbCsPage.backBtn.click();

      // Verify có tổng cộng 5 block: header, new block, customization, new block, footer
      const sections = await wbCsPage.getAllSections();
      expect(sections.length).toEqual(5);

      const sectionIds = [];
      for (const section of sections) {
        const sectionId = await section.getAttribute("id");
        sectionIds.push(sectionId);
      }

      expect(sectionIds[0]).toEqual(defaultSectionMap.header);
      expect(sectionIds[2]).toEqual(defaultSectionMap.customization_service);
      expect(sectionIds[4]).toEqual(defaultSectionMap.footer);
    });

    await test.step(`Click icon mobile preview https://prnt.sc/6p3j661aPy-1 `, async () => {
      // fill your code here
      await wbCsPage.switchMobileBtn.click();
      await wbCsPage.waitForToastMessageSwitchDeviceDisappear();

      // Verify có tổng cộng 5 block: header, new block, customization, new block, footer
      const sections = await wbCsPage.getAllSections();
      expect(sections.length).toEqual(5);

      const sectionIds = [];
      for (const section of sections) {
        const sectionId = await section.getAttribute("id");
        sectionIds.push(sectionId);
      }

      expect(sectionIds[0]).toEqual(defaultSectionMap.header);
      expect(sectionIds[2]).toEqual(defaultSectionMap.customization_service);
      expect(sectionIds[4]).toEqual(defaultSectionMap.footer);
    });

    await test.step(`Click button save, preview sản phẩm "Build wordpress website design and website development" ngoài storefront`, async () => {
      const newTab = await wbCsPage.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: "All changes are saved",
          snapshotName: "",
          isNextStep: true,
        },
        snapshotFixture,
      );

      const sfUrl = newTab.url();
      const myCsPage = new MyCustomizationServicePage(newTab, conf.suiteConf.domain);
      await newTab.goto(sfUrl);

      await expect(myCsPage.page.locator(myCsPage.xpathButtonSubmitQuestion)).toHaveCSS(
        myCsPage.defaultCssButtonSubmitQuestion.name,
        myCsPage.defaultCssButtonSubmitQuestion.value,
      );

      // Verify có tổng cộng 5 block: header, new block, customization, new block, footer
      const sections = await myCsPage.getAllSections();
      expect(sections.length).toEqual(5);

      const sectionIds = [];
      for (const section of sections) {
        const sectionId = await section.getAttribute("id");
        sectionIds.push(sectionId);
      }

      expect(sectionIds[0]).toEqual(defaultSectionMap.header);
      expect(sectionIds[2]).toEqual(defaultSectionMap.customization_service);
      expect(sectionIds[4]).toEqual(defaultSectionMap.footer);
    });

    await test.step(`Clear 2 section mới thêm vào customization service page`, async () => {
      const sectionHeading = wbCsPage.getSelectorByIndex({
        section: 2,
      });
      await wbCsPage.clickOnElement(sectionHeading, wbCsPage.iframe);
      await wbCsPage.selectOptionOnQuickBar("Delete");

      await wbCsPage.backBtn.click();
      const sectionParagraph = wbCsPage.getSelectorByIndex({
        section: 3,
      });
      await wbCsPage.clickOnElement(sectionParagraph, wbCsPage.iframe);
      await wbCsPage.selectOptionOnQuickBar("Delete");

      await wbCsPage.clickBtnNavigationBar("save");
      await expect(dashboard.locator("text=i All changes are saved >> div")).toBeVisible();
      await dashboard.waitForSelector("text=i All changes are saved >> div", { state: "hidden" });
    });
  });
});
