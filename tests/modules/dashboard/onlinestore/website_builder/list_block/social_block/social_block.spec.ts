import { verifyRedirectUrl } from "@core/utils/theme";
import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";
import { SFWebBuilder } from "@pages/storefront/web_builder";

const setDataForPage = async (builder, conf, themeData) => {
  const page = await builder.pageBuilder(conf.suiteConf.page_id);
  page.settings_data.pages.product[conf.suiteConf.variant].elements = themeData.elements;
  await builder.updatePageBuilder(conf.suiteConf.page_id, page.settings_data);
};

const gotoWebFront = async (dashboard, domain, pageId) => {
  await dashboard.goto(`https://${domain}/admin/builder/page/${pageId}`);
  await dashboard.waitForSelector(".sb-spinner--medium");
  await dashboard.waitForSelector(".sb-spinner--medium", { state: "hidden" });
};

test.describe("Social block feature @SB_WEB_BUILDER_SOCIAL_BLOCK", async () => {
  let webBuilder: WebBuilder;
  let blocks: Blocks;
  const verifyBlockOnPreview = async (dashboard, snapshotName, snapshotFixture: SnapshotFixture) => {
    await dashboard.click(webBuilder.xpathButtonSave, { delay: 500 });
    await expect(dashboard.locator(webBuilder.headerMsg)).toContainText("All changes are saved");
    await webBuilder.backBtn.click();
    await snapshotFixture.verifyWithAutoRetry({
      page: dashboard,
      selector: webBuilder.getSelectorByIndex({ section: 1 }),
      iframe: webBuilder.iframe,
      sizeCheck: true,
      snapshotName: `${process.env.ENV} ${snapshotName}`,
    });
  };

  const verifyBlockOnSF = async (dashboard, context, conf, snapshotName, snapshotFixture: SnapshotFixture) => {
    const onlineStorePage = new OnlineStorePage(dashboard, conf.suiteConf.domain);
    const shopUserName = onlineStorePage.getShopName(conf.suiteConf.domain);
    const storefront = await verifyRedirectUrl({
      page: dashboard,
      selector: webBuilder.iconPreview,
      redirectUrl: `${conf.suiteConf.creator_url}/${shopUserName}/products/preview?theme_preview_id`,
      waitForElement: webBuilder.sectionSocial,
      context,
    });
    const webBuilderSF = new SFWebBuilder(storefront, conf.suiteConf.domain);
    await snapshotFixture.verifyWithAutoRetry({
      page: storefront,
      selector: webBuilderSF.sections.first(),
      snapshotName: `${process.env.ENV} ${snapshotName}`,
    });
    await storefront.close();
  };

  test.beforeEach(async ({ dashboard, builder, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    await test.step("Set data for page", async () => {
      const blankElements = { elements: [] };
      await setDataForPage(builder, conf, blankElements);
    });
    await gotoWebFront(dashboard, conf.suiteConf.domain, conf.suiteConf.page_id);
    await webBuilder.page.getByRole("button", { name: "Add Section" }).click();
    await webBuilder.getTemplatePreviewByName("Single column").click();
  });

  test("Check default setting when add new block @SB_WEB_BUILDER_SOCIAL_BLOCK_1", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step("Check add social block from insert panel by auto click", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Social bar",
      });
      await verifyBlockOnPreview(dashboard, conf.caseConf.expect.snapshot_preview_auto, snapshotFixture);
      await verifyBlockOnSF(dashboard, context, conf, conf.caseConf.expect.snapshot_storefront_auto, snapshotFixture);
    });

    await test.step("Check add social block by DnD from insert panel", async () => {
      const dndManual = Object.assign({}, conf.caseConf.dnd_blocks, {
        async callBack({ page, x, y }) {
          await page.mouse.move(x, y + y / 2);
        },
      });
      const manualId = await webBuilder.dragAndDropInWebBuilder(dndManual);
      await webBuilder.backBtn.click();
      await webBuilder.clickElementById(manualId, ClickType.BLOCK);
      await verifyBlockOnPreview(dashboard, conf.caseConf.expect.snapshot_preview_manual, snapshotFixture);
      await verifyBlockOnSF(dashboard, context, conf, conf.caseConf.expect.snapshot_storefront_manual, snapshotFixture);
    });
  });

  test("Check display social block when change data @SB_WEB_BUILDER_SOCIAL_BLOCK_2", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const frameLocator = dashboard.frameLocator("#preview");
    await test.step("Set social block data - check preview & storefront", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        category: conf.caseConf.category,
        template: conf.caseConf.block_edited,
      });
      await frameLocator.locator(webBuilder.sectionSocial).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.selectAlign("align_self", "Left");
      await verifyBlockOnPreview(dashboard, conf.caseConf.expect.snapshot_preview_change_data, snapshotFixture);
      await verifyBlockOnSF(
        dashboard,
        context,
        conf,
        conf.caseConf.expect.snapshot_storefront_change_data,
        snapshotFixture,
      );
    });
  });

  test("Check hiển thị Social block khi Brand color = ON/OFF và setting Shape @SB_WEB_BUILDER_SOCIAL_BLOCK_3", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    await webBuilder.insertSectionBlock({
      parentPosition: { section: 1, column: 1 },
      template: "Social bar",
    });
    for (const settingdata of conf.caseConf.data) {
      await webBuilder.frameLocator.locator(webBuilder.sectionSocial).click();
      await webBuilder.switchToTab("Design");
      await blocks.setColorAndShape(settingdata);
      await verifyBlockOnPreview(dashboard, settingdata.snapshot_preview, snapshotFixture);
      await verifyBlockOnSF(dashboard, context, conf, settingdata.snapshot_storefront, snapshotFixture);
    }
  });

  test("Check hiển thị social block khi setting Icon align @SB_WEB_BUILDER_SOCIAL_BLOCK_5", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await webBuilder.insertSectionBlock({
      parentPosition: { section: 1, column: 1 },
      category: conf.caseConf.category,
      template: conf.caseConf.block_test,
    });
    for (const settingdata of conf.caseConf.data) {
      await webBuilder.frameLocator.locator(webBuilder.sectionSocial).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.selectIconAlign(settingdata.icon_align);
      await verifyBlockOnPreview(dashboard, settingdata.snapshot_preview, snapshotFixture);
      await verifyBlockOnSF(dashboard, context, conf, settingdata.snapshot_storefront, snapshotFixture);
    }
  });

  test("Check Add Social Link @SB_WEB_BUILDER_SOCIAL_BLOCK_6", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step("Check add social link and verify color of each social", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Social bar",
      });
      await webBuilder.switchToTab("Content");
      for (const socials of conf.caseConf.socials) {
        await webBuilder.genLoc(webBuilder.addSocialBtn).click();
        await webBuilder.addSocialLink(socials.label, socials.link);
      }
      await verifyBlockOnPreview(dashboard, conf.caseConf.expect.snapshot_preview, snapshotFixture);
      await verifyBlockOnSF(dashboard, context, conf, conf.caseConf.expect.snapshot_storefront, snapshotFixture);
    });

    await test.step("Check màu icon khi brand color = On/OFF & shape = Round", async () => {
      for (const settingShape of conf.caseConf.settingShape) {
        await webBuilder.frameLocator.locator(webBuilder.sectionSocial).click();
        await webBuilder.switchToTab("Design");
        await blocks.setColorAndShape(settingShape);
        await verifyBlockOnPreview(dashboard, settingShape.snapshot_preview, snapshotFixture);
        await verifyBlockOnSF(dashboard, context, conf, settingShape.snapshot_storefront, snapshotFixture);
      }
    });
  });

  test("Check sửa, xóa, drag/drop icon @SB_WEB_BUILDER_SOCIAL_BLOCK_7", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const frameLocator = webBuilder.page.frameLocator("#preview");
    const socials = conf.caseConf.socials;
    await test.step("Edit social", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        template: "Social bar",
      });
      await webBuilder.switchToTab("Content");

      await webBuilder.genLoc(webBuilder.xpathEditFirstSocial).click();
      await webBuilder.editSocialLink(socials.label, socials.link);
      await verifyBlockOnPreview(dashboard, conf.caseConf.expect.snapshot_preview_edit, snapshotFixture);
      await verifyBlockOnSF(dashboard, context, conf, conf.caseConf.expect.snapshot_storefront_edit, snapshotFixture);
    });

    await test.step("Delete social", async () => {
      await frameLocator.locator(webBuilder.sectionSocial).click();
      await webBuilder.switchToTab("Content");
      await webBuilder.genLoc(webBuilder.getXpathDeleteSocial(1)).click();
      await verifyBlockOnPreview(dashboard, conf.caseConf.expect.snapshot_preview_delete, snapshotFixture);
      await verifyBlockOnSF(dashboard, context, conf, conf.caseConf.expect.snapshot_storefront_delete, snapshotFixture);
    });
  });
});
