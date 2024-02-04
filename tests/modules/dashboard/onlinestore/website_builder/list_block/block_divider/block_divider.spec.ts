import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyCountSelector, verifyRedirectUrl, waitSelector } from "@utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { FrameLocator } from "@playwright/test";
import { loadData } from "@core/conf/conf";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";

let productId: number,
  frameLocator: FrameLocator,
  block: number,
  webBuilder: WebBuilder,
  section,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sectionSetting: Record<string, any>,
  sectionSelector: string,
  blockSelector: string,
  xpathBlock: Blocks,
  productAPI: ProductAPI,
  webPageStyle: WebPageStyle;

test.describe("Verify block divider", () => {
  test.beforeEach(async ({ dashboard, conf, builder, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    webPageStyle = new WebPageStyle(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition", async () => {
      const preCondition = conf.suiteConf.pre_condition;

      // Create product
      const productInfo = await productAPI.createProduct(preCondition);
      productId = productInfo.data.product.id;

      //Apply blank template
      await builder.applyTemplate({
        templateId: preCondition.apply_template.template_id,
        productId: productId,
        type: preCondition.apply_template.type,
      });

      // Open web builder
      await webPageStyle.openWebBuilder({ type: "sale page", id: productId });
      await frameLocator.locator(xpathBlock.overlay).waitFor({ state: "hidden" });
    });
  });

  test.afterEach(async () => {
    await test.step("After-condition: delete product", async () => {
      const products = [productId];
      await productAPI.deleteProduct(products);
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const divider = conf.caseConf.data[i];

    test(`${divider.description} @${divider.case_id}`, async ({ dashboard, conf, context, snapshotFixture }) => {
      webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
      section = block = 1;
      sectionSetting = divider.input;
      sectionSelector = webBuilder.getSelectorByIndex({ section });
      blockSelector = webBuilder.getSelectorByIndex({ section, block });

      await test.step("Add section and add block divider", async () => {
        await webBuilder.dragAndDropInWebBuilder(sectionSetting.dnd_section);
        await webBuilder.dragAndDropInWebBuilder(sectionSetting.dnd_block);
        await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      });

      if (divider.input.setting_block) {
        await test.step("Setting data for block divider", async () => {
          const settingBlock = sectionSetting.setting_block;
          await webBuilder.selectAlign("align_self", settingBlock.align);
          await webBuilder.settingWidthHeight("width", settingBlock.width);

          await webBuilder.settingWidthHeight("height", settingBlock.height);
          await webBuilder.setBackground("background", settingBlock.background);
          await webBuilder.setBorder("border", settingBlock.border);
          await webBuilder.editSliderBar("opacity", settingBlock.opacity);

          await webBuilder.editSliderBar("border_radius", settingBlock.radius);
          await webBuilder.editSliderBar("box_shadow", settingBlock.shadow);
          await webBuilder.setMarginPadding("padding", settingBlock.padding);
          await webBuilder.setMarginPadding("margin", settingBlock.margin);
        });
      }

      await test.step("Verify data of block divider", async () => {
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlock.xpathSidebar,
          snapshotName: divider.expect.snapshot_sidebar,
        });
      });

      await dashboard.locator(xpathBlock.xpathSidebar).click();
      await test.step("Verify block divider in preview", async () => {
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: divider.expect.snapshot_preview,
        });
      });

      await test.step("Save template", async () => {
        await dashboard.locator(xpathBlock.xpathButtonSave).click();
        await dashboard.waitForSelector("text='All changes are saved'");
      });

      await test.step("Verify block divider in SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: xpathBlock.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        await waitSelector(storefront, sectionSelector);
        await snapshotFixture.verify({
          page: storefront,
          selector: sectionSelector,
          snapshotName: divider.expect.snapshot_storefront,
        });
      });
    });
  }

  test("Check remove block divider on quickbar @SB_WEB_BUILDER_BD_3", async ({ dashboard, conf, context }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    section = block = 1;
    sectionSelector = webBuilder.getSelectorByIndex({ section });
    blockSelector = webBuilder.getSelectorByIndex({ section, block });

    await test.step("Add section and add block divider", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_section);
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });
    await dashboard.locator(xpathBlock.xpathButtonSave).click();

    const numOfBlock = await frameLocator.locator(xpathBlock.xpathAttrsDataBlock).count();
    await test.step("Remove block divider", async () => {
      await xpathBlock.clickOnElementInIframe(frameLocator, blockSelector);
      await webBuilder.selectOptionOnQuickBar("Delete");
    });

    await test.step("Save template", async () => {
      await dashboard.locator(xpathBlock.xpathButtonSave).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Verify block divider in SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await verifyCountSelector(storefront, xpathBlock.xpathAttrsDataBlock, numOfBlock - 1);
    });
  });
});
