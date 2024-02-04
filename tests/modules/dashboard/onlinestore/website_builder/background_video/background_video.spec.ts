import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { expect } from "@core/fixtures";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { XpathNavigationButtons } from "@constants/web_builder";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

let productId,
  webBuilder: WebBuilder,
  section,
  column,
  block,
  sectionSetting,
  sectionSelector: string,
  blockSelector,
  pageBlock: Blocks,
  webPageStyle: WebPageStyle,
  productAPI: ProductAPI;

test.describe("Verify background video", () => {
  test.beforeEach(async ({ dashboard, conf, builder, authRequest }, testInfo) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    const frameLocator = pageBlock.frameLocator;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webPageStyle = new WebPageStyle(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);

    await test.step("Pre-condition: create product, apply blank template and open web builder", async () => {
      const preCondition = conf.suiteConf.pre_condition;
      const productInfo = await productAPI.createProduct(preCondition);
      productId = productInfo.data.product.id;
      await builder.applyTemplate({
        templateId: preCondition.apply_template.template_id,
        productId: productId,
        type: preCondition.apply_template.type,
      });
      await webPageStyle.openWebBuilder({ type: "sale page", id: productId });
      await frameLocator.locator(pageBlock.overlay).waitFor({ state: "hidden" });
    });
  });

  test.afterEach(async () => {
    await test.step("After-condition: delete product", async () => {
      const products = [productId];
      await productAPI.deleteProduct(products);
    });
  });

  test("Check setting background video of section @SB_WEB_BUILDER_SECTION_SETTING_01", async ({
    dashboard,
    conf,
    context,
  }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    section = 1;
    sectionSetting = conf.caseConf.data.section;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add blank section", async () => {
      await webBuilder.dragAndDropInWebBuilder(sectionSetting.dnd_section);
    });
    await test.step("Set background video and verify in preview", async () => {
      const backgroundSetting = conf.caseConf.data.backgroundSetting;
      const expected = conf.caseConf.expected;
      await webBuilder.switchToTab("Design");
      await webBuilder.setBackground("background", backgroundSetting.background);
      await expect(pageBlock.slideshowVideoIframe).toHaveAttribute(
        expected.video_attribute,
        new RegExp(expected.video_url),
      );
    });

    await test.step("Save template", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify background section on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        const expected = conf.caseConf.expected;
        const SFUrl = storefront.url();
        await storefront.goto(SFUrl);
        await storefront.waitForLoadState("networkidle");
        await expect(pageBlock.slideshowVideoIframe).toHaveAttribute(
          expected.video_attribute,
          new RegExp(expected.video_url),
        );
      });
    });
  });

  test("Check setting background block color and image @SB_WEB_BUILDER_SECTION_SETTING_02", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    pageBlock = new Blocks(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    section = 1;
    sectionSetting = conf.caseConf.data.section;
    sectionSelector = webBuilder.getSelectorByIndex({ section });

    await test.step("Add section and edit layout", async () => {
      await webBuilder.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await dashboard.locator(pageBlock.xpathButtonLayer).click();

      await webBuilder.expandCollapseLayer({
        sectionName: sectionSetting.expand_section.name,
        sectionIndex: sectionSetting.expand_section.index,
        isExpand: true,
      });

      await webBuilder.openLayerSettings({
        sectionName: sectionSetting.open_setting_row.section_name,
        sectionIndex: sectionSetting.open_setting_row.section_index,
        subLayerName: sectionSetting.open_setting_row.row_name,
      });

      await webBuilder.editLayoutRow({
        column: sectionSetting.set_layout.column,
        spacing: sectionSetting.set_layout.spacing,
      });
    });

    await test.step("Add blocks for section 1", async () => {
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.insertSectionBlock({
          parentPosition: template.parent_position,
          category: template.category,
          template: template.template,
        });
      }
    });

    column = 3;
    block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block background image", async () => {
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.setBackground("background", {
        image: {
          url: conf.caseConf.backgroundImage.image.url,
        },
      });
    });

    column = 2;
    block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Setting block background color", async () => {
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.setBackground("background", {
        color: conf.caseConf.backgroundColor.background.color,
      });
    });

    await test.step("Verify setting background in preview", async () => {
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: conf.caseConf.expect.preview_background_block,
      });
    });

    await test.step("Save template", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify background block on SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "theme_preview_id",
          context,
        });
        const SFUrl = storefront.url();
        await storefront.goto(SFUrl);
        await storefront.waitForLoadState("networkidle");
        await snapshotFixture.verify({
          page: storefront,
          selector: sectionSelector,
          snapshotName: conf.caseConf.expect.sf_background_block,
        });
      });
    });
  });
});
