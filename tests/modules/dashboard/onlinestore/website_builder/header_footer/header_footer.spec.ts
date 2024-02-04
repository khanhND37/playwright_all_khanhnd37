import { expect, test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl, waitSelector } from "@utils/theme";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import type { ShopTheme } from "@types";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { XpathBlock } from "@constants/web_builder";
import { Locator } from "@playwright/test";
import { SFWebBuilder } from "@pages/storefront/web_builder";

let shopTheme: ShopTheme;
let blocks: Blocks;
let webBuilder: WebBuilder;

test.describe("Verify Header/Footer area @SB_NEWECOM_HF", () => {
  test.beforeEach(async ({ theme, dashboard, conf, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    const shopDomain = conf.suiteConf.domain;
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    const preCondition = conf.suiteConf.pre_condition;

    await test.step("Apply template by API", async () => {
      const listTheme = await builder.getShopLibThemeInfoInPopup(conf.suiteConf.domain, "ecommerce");
      const testTheme = listTheme.templates.find(template => template.title === preCondition.template);
      const res = await theme.applyTemplate(testTheme.id);
      shopTheme = await theme.publish(res.id);
    });

    await test.step("Remove shop theme not active", async () => {
      const res = await theme.list();
      const shopThemeId = res.find(shopTheme => shopTheme.active !== true);
      if (shopThemeId) {
        await theme.delete(shopThemeId.id);
      }
    });

    await test.step("Customize theme", async () => {
      await dashboard.goto(`https://${shopDomain}/admin/builder/site/${shopTheme.id}`);
      await dashboard.waitForSelector(blocks.xpathPreviewLoadingScreen);
      await dashboard.waitForSelector(blocks.xpathPreviewLoadingScreen, { state: "hidden" });
    });

    await test.step("Go to page", async () => {
      await dashboard.locator(blocks.xpathButtonPages).click();
      await blocks.getXpathPageSelector(preCondition.page_title).click();
      await webBuilder.frameLocator.locator(XpathBlock.progressBar).waitFor();
      await webBuilder.frameLocator.locator(XpathBlock.progressBar).waitFor({ state: "hidden" });
      await webBuilder.reloadIfNotShow("/pages/page-test");
      await dashboard.locator(blocks.xpathButtonLayer).click();
    });
  });

  test("@SB_NEWECOM_HF_1 - Check UI sidebar của section nằm ở Header/Footer", async ({
    conf,
    dashboard,
    context,
    snapshotFixture,
  }) => {
    await test.step("Verify UI sidebar của Header/Footer", async () => {
      await dashboard.locator(blocks.xpathNavigation).hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: blocks.sidebar,
        snapshotName: conf.caseConf.snapshot_wf,
      });
    });
    await test.step("Hide section Popup", async () => {
      await webBuilder.hideOrShowLayerInSidebar({
        sectionName: conf.caseConf.hide_section.section_name,
      });
    });

    await dashboard.locator(blocks.xpathButtonSave).click();
    await test.step("Verify Header/Footer on storefront", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: blocks.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        combineOptions: { fullPage: true },
        snapshotName: conf.caseConf.snapshot_sf,
      });
    });
  });

  test("@SB_NEWECOM_HF_3 - Check add section ở Header/Footer khi drag section từ Insert panel vào webfront", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await test.step("Drag and drop section vào khu vực Header/Footer", async () => {
      for (const addSection of conf.caseConf.data) {
        await webBuilder.dragAndDropInWebBuilder(addSection.position_section);
      }
      await webBuilder.backBtn.click();
      await dashboard.locator(blocks.xpathNavigation).hover();
      await webBuilder.titleBar.click();
    });

    await test.step("Verify position of section after add section on webfront", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: blocks.sidebar,
        snapshotName: conf.caseConf.snapshot_sidebar,
      });

      await waitSelector(dashboard, "html");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(webBuilder.wbFullHeight),
        snapshotName: conf.caseConf.snapshot_webfront,
        sizeCheck: true,
      });
    });
  });

  test("@SB_NEWECOM_HF_7 - Check add section ở Header/Footer khi add section ở màn webfront", async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    await test.step("Add section vào khu vực Header/Footer", async () => {
      for (const insertSection of conf.caseConf.data) {
        await blocks.clickSectionInSidebar(insertSection.sidebar.area, insertSection.sidebar.section_index);
        await webBuilder.insertSectionBlock({
          parentPosition: insertSection.webfront.parent_position,
          position: insertSection.webfront.position,
          category: insertSection.webfront.category,
          template: insertSection.webfront.template,
        });
        await webBuilder.backBtn.click();
        await webBuilder.expandCollapseLayer({ sectionName: insertSection.collapse_section, isHide: true });
      }
      await webBuilder.titleBar.click();
    });

    await test.step("Verify position of section after add section on webfront", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: blocks.sidebar,
        snapshotName: conf.caseConf.snapshot_sidebar,
      });

      await waitSelector(dashboard, "html");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.frameLocator.locator(webBuilder.wbFullHeight),
        snapshotName: conf.caseConf.snapshot_webfront,
        sizeCheck: true,
      });
    });
  });

  test("@SB_NEWECOM_HF_9 - Drag and drop section", async ({ conf, dashboard }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    for (const dndSection of conf.caseConf.data) {
      await test.step("Drag n drop section", async () => {
        await webBuilder.dndLayerInSidebar({
          from: { sectionName: dndSection.dnd_section.position_1 },
          to: { sectionName: dndSection.dnd_section.position_2 },
        });
        await dashboard.waitForLoadState("load");
      });

      const sectionsAfterDrag = [];
      const sectionCount = await webBuilder.genLoc(blocks.getSectionInArea(dndSection.area)).count();
      await test.step("Get sections name in sidebar", async () => {
        for (let i = 1; i <= sectionCount; i++) {
          const sectionName = await webBuilder.genLoc(blocks.getSectionInArea(dndSection.area, i)).innerText();
          sectionsAfterDrag.push(sectionName);
          expect(sectionsAfterDrag).toContain(dndSection.dnd_section.position_1);
        }
      });
    }
  });

  test("@SB_NEWECOM_HF_10 - Check sync data when having changes at Header/Footer area", async ({
    conf,
    dashboard,
    context,
  }) => {
    let headerSections: { id: string; index: number }[];
    let footerSections: { id: string; index: number }[];
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    const getSectionIds = async (
      area: "body" | "footer" | "header" | "sales page",
      excludeHidden = true,
    ): Promise<{ id: string; index: number }[]> => {
      const sectionsInfo = [];
      const sections = webBuilder.getSidebarArea(area).locator(webBuilder.sectionsInSidebar);
      for (const section of await sections.all()) {
        const id = await section.getAttribute("data-id");
        const index = await section.getAttribute("section-index");
        if (excludeHidden) {
          const sectionStatus = await section.getAttribute("class");
          if (!id.includes("cart_drawer") && !sectionStatus.includes("hidden")) {
            sectionsInfo.push({ id: id, index: parseInt(index) });
          }
        } else {
          sectionsInfo.push({ id: id, index: parseInt(index) });
        }
      }
      return sectionsInfo;
    };
    const getSectionInSidebarById = (area: "body" | "footer" | "header" | "sales page", id: string): Locator => {
      return webBuilder.getSidebarArea(area).locator(`[data-id='${id}']`);
    };

    await test.step("Pre-condition: Get header, footer section id", async () => {
      await webBuilder.hideOrShowLayerInSidebar({ sectionName: "Popup", isHide: true });
      headerSections = await getSectionIds("header");
      footerSections = await getSectionIds("footer");
    });

    await test.step("Change data of section at Header/Footer area", async () => {
      for (const data of conf.caseConf.edit_section) {
        await blocks.clickSectionInSidebar(data.area, data.section_index);
        await blocks.switchToTab("Design");

        const sectionSetting = data.setting;
        const stylesSection = sectionSetting.settings_section.styles;
        await webBuilder.setBackground("background", stylesSection.background);
        await webBuilder.setMarginPadding("padding", stylesSection.padding);
        await dashboard.locator(blocks.xpathButtonLayer).click();
      }
    });

    await test.step("Verify Header/Footer area on all pages", async () => {
      for (const page of conf.caseConf.page) {
        await dashboard.locator(blocks.xpathButtonPages).click();
        await blocks.getXpathPageSelector(page.page_title).click();
        if (conf.suiteConf.domain.includes("myshopbase")) {
          await webBuilder.frameLocator.locator(XpathBlock.progressBar).waitFor();
        }
        await webBuilder.frameLocator.locator(XpathBlock.progressBar).waitFor({ state: "hidden" });
        await webBuilder.reloadIfNotShow(page.type);
        await dashboard.locator(blocks.xpathButtonLayer).click();
        if (page.has_header_footer) {
          for (const section of headerSections) {
            await expect(getSectionInSidebarById("header", section.id)).toBeVisible();
            await expect(webBuilder.getElementById(section.id, ClickType.SECTION)).toBeVisible();
          }
          for (const section of footerSections) {
            await expect(getSectionInSidebarById("footer", section.id)).toBeVisible();
            await expect(webBuilder.getElementById(section.id, ClickType.SECTION)).toBeVisible();
          }
        } else {
          for (const section of headerSections) {
            await expect(getSectionInSidebarById("header", section.id)).toBeHidden();
            await expect(webBuilder.getElementById(section.id, ClickType.SECTION)).toBeHidden();
          }
          for (const section of footerSections) {
            await expect(getSectionInSidebarById("footer", section.id)).toBeHidden();
            await expect(webBuilder.getElementById(section.id, ClickType.SECTION)).toBeHidden();
          }
        }
      }
    });

    await test.step("Verify Header/Footer on storefront", async () => {
      const previewPage = await webBuilder.clickPreview({ context, dashboard });
      let webBuilderSF = new SFWebBuilder(previewPage, conf.suiteConf.domain);
      for (const section of headerSections) {
        await expect(webBuilderSF.sections.and(previewPage.locator(`[id='${section.id}']`))).toBeVisible();
      }
      for (const section of footerSections) {
        await expect(webBuilderSF.sections.and(previewPage.locator(`[id='${section.id}']`))).toBeVisible();
      }
      const sfPage = await context.newPage();
      webBuilderSF = new SFWebBuilder(sfPage, conf.suiteConf.domain);
      await webBuilderSF.goto("");
      for (const section of headerSections) {
        await expect(webBuilderSF.sections.and(sfPage.locator(`[id='${section.id}']`))).toBeVisible();
      }
      for (const section of footerSections) {
        await expect(webBuilderSF.sections.and(sfPage.locator(`[id='${section.id}']`))).toBeVisible();
      }
    });
  });
});
