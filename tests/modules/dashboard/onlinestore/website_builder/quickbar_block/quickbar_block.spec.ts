import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { expect } from "@core/fixtures";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { XpathNavigationButtons } from "@constants/web_builder";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

let productId, pageBlock: Blocks, webPageStyle: WebPageStyle, productAPI: ProductAPI;

test.describe("Check quickbar block", () => {
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

  test("Check duplicate, hide and delete block @SB_WEB_BUILDER_BB_53", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let column, block, blockSelector;
    const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    const pageBlock = new Blocks(dashboard, conf.suiteConf.domain);

    const section = 1;
    const sectionSetting = conf.caseConf.data.section_1;
    const sectionSelector = webBuilder.getSelectorByIndex({ section });
    await test.step("Add section and add block for section", async () => {
      await webBuilder.dragAndDropInWebBuilder(sectionSetting.dnd_section);
      await pageBlock.clickBackLayer();
      await webBuilder.hideOrShowLayerInSidebar({
        sectionName: "Section",
        sectionIndex: 2,
        isHide: true,
      });
      for (const template of sectionSetting.dnd_blocks) {
        await webBuilder.dragAndDropInWebBuilder(template);
      }
    });

    column = 1;
    block = 1;
    const columnSelector = webBuilder.getSelectorByIndex({ section, column });
    const blockInColumn = `(${columnSelector}//div[contains(@class,'wb-dnd-draggable-wrapper')])`;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    const count = await webBuilder.frameLocator.locator(blockInColumn).count();
    await test.step("Duplicate block Heading", async () => {
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.selectOptionOnQuickBar("Duplicate");
      const countAfter = await webBuilder.frameLocator.locator(blockInColumn).count();
      expect(countAfter).toEqual(count + 1);
    });

    column = 1;
    block = 3;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Hide block Bullet", async () => {
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.selectOptionOnQuickBar("Hide");
      await expect(webBuilder.frameLocator.locator(blockSelector)).toBeHidden();
      await pageBlock.clickBackLayer();
      await webBuilder.expandCollapseLayer({ sectionName: "Section", sectionIndex: 1, isExpand: true });
      await snapshotFixture.verify({
        page: dashboard,
        selector: pageBlock.xpathLayerContent,
        snapshotName: conf.caseConf.snapshots.layer_hide,
      });
    });

    column = 1;
    block = 4;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    await test.step("Delete block Paragraph", async () => {
      await webBuilder.frameLocator.locator(blockSelector).click();
      await webBuilder.selectOptionOnQuickBar("Delete");
      await expect(webBuilder.frameLocator.locator(blockSelector)).toBeHidden();
      await snapshotFixture.verify({
        page: dashboard,
        selector: pageBlock.xpathLayerContent,
        snapshotName: conf.caseConf.snapshots.layer_remove,
      });
    });

    await test.step("Save template", async () => {
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step("Preview on SF", async () => {
      await test.step("Verify template in SF", async () => {
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
          snapshotName: conf.caseConf.snapshots.storefront,
        });
      });
    });
  });
});
