import { test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { loadData } from "@core/conf/conf";
import { FrameLocator, Page } from "@playwright/test";
import { clickPreviewButton } from "../../variable/variable-util";
import { PageSettingsData } from "@types";
import { waitTimeout } from "@core/utils/api";

let webBuilder: WebBuilder, sectionSelector: string, pageBlock: Blocks, domain;
let settingsData: PageSettingsData;
let settingsDataPublish: PageSettingsData;
let frameLocator: FrameLocator;

test.describe("Verify block Product Search", () => {
  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.page_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    domain = conf.suiteConf.domain;

    webBuilder = new WebBuilder(dashboard, domain);
    pageBlock = new Blocks(dashboard, domain);
    const addSection = conf.suiteConf.data.dnd_section;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    frameLocator = pageBlock.frameLocator;

    await test.step("Update theme", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.page_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      //get publish theme data
      const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.shop_theme_id);
      settingsDataPublish = responsePublish.settings_data as PageSettingsData;

      //Update collection page data for publish theme
      settingsDataPublish.pages["home"].default.elements = settingsData.pages["home"].default.elements;
      await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);
    });

    await test.step(`Precond - Open web builder`, async () => {
      const id = conf.suiteConf.shop_theme_id;
      await webBuilder.openWebBuilder({ type: "site", id });
      await dashboard.locator(pageBlock.overlay).waitFor({ state: "hidden" });
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step("Add new section and product search block", async () => {
      await webBuilder.dragAndDropInWebBuilder(addSection);
      sectionSelector = `//section[@component="search"]/ancestor::section`;

      //Insert block product search
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.data.dnd_block);
      await webBuilder.clickSaveButton();
    });
  });

  test("@SB_NEWECOM_PS_01 - [Style] Verify các giá trị default của tab Style Product search", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let sfPage: Page;
    await test.step("Verify data default in sidebar", async () => {
      //Content tab
      await snapshotFixture.verify({
        page: dashboard,
        selector: pageBlock.xpathStyleSettingbar,
        snapshotName: `${process.env.ENV}-${conf.caseConf.expect.snapshot_content_bar}`,
      });

      //Design tab
      await webBuilder.switchToTab("Design");
      await snapshotFixture.verify({
        page: dashboard,
        selector: pageBlock.xpathStyleSettingbar,
        snapshotName: `${process.env.ENV}-${conf.caseConf.expect.snapshot_design_bar}`,
      });
    });

    await test.step("Mở SF > Verify hiển thị Product Seacrh block ngoài SF", async () => {
      await webBuilder.clickSaveButton();
      sfPage = await clickPreviewButton({ context, dashboard });
      await waitTimeout(2000);
      await snapshotFixture.verify({
        page: sfPage,
        selector: sectionSelector,
        snapshotName: `${process.env.ENV}-${conf.caseConf.expect.snapshot_storefront}`,
      });
      await sfPage.close();
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data_test.length; i++) {
    const caseData = conf.caseConf.data_test[i];
    test(`@${caseData.case_id} ${caseData.description}`, async ({ context, dashboard, snapshotFixture }) => {
      let sfPage;
      const data = caseData.data;
      for (let j = 0; j < data.length; j++) {
        switch (caseData.case_id) {
          case "SB_NEWECOM_PS_02":
            await webBuilder.switchToTab("Design");
            break;
          case "SB_NEWECOM_PS_03":
            await webBuilder.switchToTab("Design");
            await webBuilder.selectAlign("align_self", data[j].align);
            break;
          case "SB_NEWECOM_PS_04":
            await webBuilder.switchToTab("Design");
            await webBuilder.settingWidthHeight("width", data[j].width);
            break;
          case "SB_NEWECOM_PS_05":
            await webBuilder.switchToTab("Design");
            await webBuilder.setMarginPadding("padding", caseData.padding);
            await webBuilder.setBackground("background", data[j].background);
            break;
          case "SB_NEWECOM_PS_06":
            await webBuilder.switchToTab("Design");
            await webBuilder.setBorder("border", data[j].border);
            break;
          case "SB_NEWECOM_PS_07":
            await webBuilder.switchToTab("Design");
            await webBuilder.setShadow("box_shadow", data[j].shadow);
            break;
          case "SB_NEWECOM_PS_08":
            await webBuilder.switchToTab("Design");
            await webBuilder.editSliderBar("opacity", data[j].opacity);
            break;
          case "SB_NEWECOM_PS_09":
            await webBuilder.switchToTab("Design");
            await webBuilder.setBackground("background", caseData.background);
            await webBuilder.setMarginPadding("padding", caseData.padding);
            await webBuilder.editSliderBar("border_radius", data[j].radius);
            break;
          case "SB_NEWECOM_PS_10":
            await webBuilder.switchToTab("Design");
            await webBuilder.setMarginPadding("padding", data[j].padding);
            await webBuilder.setMarginPadding("margin", data[j].margin);
            break;
          case "SB_NEWECOM_PS_11":
            await webBuilder.switchToTab("Content");
            await snapshotFixture.verify({
              page: dashboard,
              selector: pageBlock.xpathStyleSettingbar,
              snapshotName: `${process.env.ENV}-${data[j].snapshot_setting}`,
            });
            break;
          default:
            break;
        }
        await test.step("Preview > Verify hiển thị Product Seacrh block ngoài SF", async () => {
          await dashboard.locator(pageBlock.headingTitleTab).click();
          await webBuilder.clickSaveButton();
          sfPage = await clickPreviewButton({ context, dashboard });
          await sfPage.waitForLoadState("networkidle");
          await snapshotFixture.verify({
            page: sfPage,
            selector: sectionSelector,
            snapshotName: `${process.env.ENV}-${data[j].snapshot_storefront}`,
          });
          await sfPage.close();
        });
      }
    });
  }

  test(`@SB_NEWECOM_PS_12 [Settings] Verify trường Type và size của Product search`, async ({
    snapshotFixture,
    conf,
    dashboard,
    context,
  }) => {
    test.slow();
    let sfPage: Page;
    for (const data of conf.caseConf.data) {
      await test.step(`${data.description}`, async () => {
        await webBuilder.switchToTab("Design");
        await webBuilder.settingProductSearch(data.setting);
        await webBuilder.clickSaveButton();
        sfPage = await clickPreviewButton({ context, dashboard });
        await sfPage.waitForLoadState("networkidle");
        await sfPage.goto(`https://${conf.suiteConf.domain}/`);
        await sfPage.waitForLoadState("networkidle");
        await snapshotFixture.verify({
          page: sfPage,
          selector: sectionSelector,
          snapshotName: `${process.env.ENV}-${data.snapshot_storefront}`,
        });
        await sfPage.close();
      });
    }
  });

  test(`@SB_NEWECOM_PS_13 [Settings] Verify trường Type của Product search`, async ({
    snapshotFixture,
    conf,
    dashboard,
    context,
  }) => {
    let sfPage;
    for (const data of conf.caseConf.data) {
      await test.step(`${data.description}`, async () => {
        await webBuilder.switchToTab("Design");
        await webBuilder.settingProductSearch(data.setting);
        await webBuilder.clickSaveButton();
        sfPage = await clickPreviewButton({ context, dashboard });
        await sfPage.waitForLoadState("networkidle");
        await snapshotFixture.verify({
          page: sfPage,
          selector: sectionSelector,
          snapshotName: `${process.env.ENV}-${data.snapshot_storefront}`,
        });
        await sfPage.close();
      });
    }
  });

  const confData = loadData(__dirname, "DATA_SETTING");
  for (let i = 0; i < confData.caseConf.data_test.length; i++) {
    const caseData = confData.caseConf.data_test[i];
    test(`@${caseData.case_id} ${caseData.description}`, async ({ context, dashboard, snapshotFixture }) => {
      let sfPage;
      const data = caseData.data;
      for (let j = 0; j < data.length; j++) {
        await webBuilder.switchToTab("Content");
        await webBuilder.settingProductSearch(data[j].setting);
        await test.step("Mở SF > Verify hiển thị Product Seacrh block ngoài SF", async () => {
          await webBuilder.clickSaveButton();
          sfPage = await clickPreviewButton({ context, dashboard });
          await sfPage.waitForLoadState("networkidle");
          await snapshotFixture.verify({
            page: sfPage,
            selector: sectionSelector,
            snapshotName: `${process.env.ENV}-${data[j].snapshot_storefront}`,
          });
          await sfPage.close();
        });
      }
    });
  }

  test("@SB_NEWECOM_PS_16 - Verify remove product search block", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let sfPage;

    await test.step("Click btn Remove block > Đi đến SF, verify hiển thị Product search block", async () => {
      await webBuilder.clickOnBtnWithLabel("Delete block");
      await webBuilder.clickSaveButton();
      sfPage = await clickPreviewButton({ context, dashboard });
      await sfPage.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: sfPage,
        selector: sectionSelector,
        snapshotName: `${process.env.ENV}-${conf.caseConf.snapshot_storefront}`,
      });
    });
  });
});
