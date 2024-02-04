import { test, expect } from "@fixtures/website_builder";
import { WebBuilder, ClickType } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";
import { XpathNavigationButtons } from "@constants/web_builder";
import { HomePage } from "@pages/dashboard/home_page";
import { ProductAPI } from "@pages/api/product";
import { SfTranslation } from "@pages/dashboard/sf-translation";

test.describe("Check function block product price", async () => {
  let webBuilder: WebBuilder,
    blockProductPrice: Blocks,
    themeId: number,
    section: Sections,
    productAPI: ProductAPI,
    sfPage: SfTranslation;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    const suiteConf = conf.suiteConf;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    blockProductPrice = new Blocks(dashboard, suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    themeId = suiteConf.theme_id;
    section = new Sections(dashboard, conf.suiteConf.domain);
    if (["SB_WEB_BUILDER_PRD_37", "SB_WEB_BUILDER_PRD_40"].includes(conf.caseName)) {
      return;
    }

    await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "product" });
    await webBuilder.page.locator("#v-progressbar").waitFor({ state: "detached" });
    await dashboard.waitForLoadState("networkidle");
    await dashboard.waitForTimeout(4000);
    //add section
    await webBuilder.dragAndDropInWebBuilder(suiteConf.dnd_blank_section);
    await webBuilder.changeContent(suiteConf.section_name);
    await webBuilder.backBtn.click();
    await webBuilder.page.waitForSelector(webBuilder.xpathToastAddNewSection, { state: "hidden" });
  });

  test.afterEach(async ({ conf, dashboard }) => {
    const suiteConf = conf.suiteConf;
    await dashboard.locator(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Layer']`).click();
    const sectionsCount = await dashboard
      .locator(
        `//p[contains(text(),'${suiteConf.section_name.content}')]/ancestor::div[contains(@class, 'w-builder__layer-title')]`,
      )
      .count();
    for (let i = sectionsCount; i >= 1; i--) {
      await webBuilder.clickOnElement(
        `(//p[contains(text(),'${suiteConf.section_name.content}')]/ancestor::div[contains(@class, 'w-builder__layer-title')])[${i}]`,
      );
      await dashboard.locator("button span:text-is('Delete section')").click();
    }
    await dashboard.locator(XpathNavigationButtons["save"]).waitFor({ state: "attached" });
    await dashboard.locator(XpathNavigationButtons["save"]).click();
    await dashboard.waitForSelector("text='All changes are saved'");
  });

  test(`@SB_WEB_BUILDER_PRD_15 Verify hiển thị UI default khi add block price`, async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.add_block;
    const expected = conf.caseConf.expected;

    await test.step(`Click "Add block" trong blank section`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
    });

    await test.step(`Click add block Price trong blank section`, async () => {
      await blockProductPrice.switchToTab("Design");
      await snapshotFixture.verify({
        page: dashboard,
        selector: blockProductPrice.xpathSidebar,
        snapshotName: expected.snapshot_sidebar_design,
      });
    });

    await test.step(`Tại sidebar, click tab content`, async () => {
      await blockProductPrice.switchToTab("Content");
      await snapshotFixture.verify({
        page: dashboard,
        selector: blockProductPrice.xpathSidebar,
        snapshotName: expected.snapshot_sidebar_content,
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_36 Verify chỉnh sửa setting common của block`, async ({ conf, dashboard }) => {
    const addBlock = conf.caseConf.add_block;
    await webBuilder.dragAndDropInWebBuilder(addBlock);
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });
    const blockId = await blockProductPrice.getAttrsDataId();

    await test.step(`Click vào block, click duplicate (hoặc Ctrl+D)`, async () => {
      await blockProductPrice.clickBackLayer();
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.clickQuickSettingByButtonPosition(3, "button");
      await blockProductPrice.clickBackLayer();
      for (let i = 1; i <= 2; i++) {
        await expect(
          webBuilder.frameLocator.locator(`(${sectionSelector}//div[contains(@class, 'product__price')])[${i}]`),
        ).toBeVisible();
      }
    });

    await test.step(`Click vào block, click Hide`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.clickQuickSettingByButtonPosition(4, "button");
      await blockProductPrice.clickBackLayer();
      await expect(webBuilder.frameLocator.locator(`//*[@data-block-id='${blockId}']`)).toBeHidden();
    });

    await test.step(`Action Bar -> Layer -> Section chứa block -> Click hiển thị lại block`, async () => {
      await dashboard
        .locator(
          `//p[contains(text(),'${conf.suiteConf.section_name.content}')]/ancestor::div[contains(@class, 'w-builder__layer-title')]/preceding-sibling::div//button`,
        )
        .first()
        .click();
      await dashboard.locator(`//div[@data-id='${blockId}']`).hover();
      await dashboard
        .locator(`//div[@data-id='${blockId}']//button[contains(@data-block-action, "visible")][1]`)
        .click();
      for (let i = 1; i <= 2; i++) {
        await expect(
          webBuilder.frameLocator.locator(`(${sectionSelector}//div[contains(@class, 'product__price')])[${i}]`),
        ).toBeVisible();
      }
    });

    await test.step(`Click vào block, Delete`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.clickQuickSettingByButtonPosition(6, "button");
      await expect(webBuilder.frameLocator.locator(`//*[@data-block-id='${blockId}']`)).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_17 Verify chỉnh sửa tab content của block Price`, async ({
    conf,
    dashboard,
    context,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.add_block;
    const expected = conf.caseConf.expected;
    await webBuilder.dragAndDropInWebBuilder(addBlock);
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });
    const blockId = await blockProductPrice.getAttrsDataId();

    await test.step(`Tại sidebar, click tab Content`, async () => {
      await blockProductPrice.switchToTab("Content");
      await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
    });

    await test.step(`Click vào icon eye trên option Compared price`, async () => {
      await dashboard
        .locator(
          `//div[contains(@class, 'widget-list')]//label[contains(text(), 'Compared price')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div//span[not(@id) and not(@class)]`,
        )
        .click();
      await dashboard.waitForTimeout(1000);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.hide_compare_price,
      });
    });

    await test.step(`Click vào icon eye trên option Compared price`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Content");
      await dashboard
        .locator(
          `//div[contains(@class, 'widget-list')]//label[contains(text(), 'Compared price')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div//span[not(@id) and not(@class)]`,
        )
        .click();
      await dashboard.waitForTimeout(1000);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.show_compare_price,
      });
    });

    await test.step(`Click vào icon eye trên option Saving badge`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Content");
      await dashboard
        .locator(
          `//div[contains(@class, 'widget-list')]//label[contains(text(), 'Saving badge')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div//span[not(@id) and not(@class)]`,
        )
        .click();
      await dashboard.waitForTimeout(1000);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.hide_saving_badge,
      });
    });

    await test.step(`Click vào icon eye trên option Saving badge`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Content");
      await dashboard
        .locator(
          `//div[contains(@class, 'widget-list')]//label[contains(text(), 'Saving badge')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div//span[not(@id) and not(@class)]`,
        )
        .click();
      await dashboard.waitForTimeout(1000);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.show_saving_badge,
      });
    });

    await test.step(`Tại sidebar, click tab Content. Check trang thái option Saving type`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Content");
      await dashboard.locator(`//div[contains(@data-widget-id, 'saving_format')]//button`).click();
      await snapshotFixture.verify({
        page: dashboard,
        selector: "#widget-popover",
        snapshotName: expected.show_option_saving_type,
      });
    });

    await test.step(`Chọn option Percentage -> Save`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Content");
      await dashboard.locator(`//div[contains(@data-widget-id, 'saving_format')]//button`).click();
      await dashboard.locator(`//li[contains(@value, 'percentage')]`).click();
      await dashboard.waitForTimeout(1000);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.show_percentage_preview,
      });
      await dashboard.locator(XpathNavigationButtons["save"]).waitFor({ state: "attached" });
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");

      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      await snapshotFixture.verify({
        page: storefront,
        selector: sectionSelector,
        snapshotName: expected.show_percentage_webfront,
      });
      await storefront.close();
    });

    await test.step(`Chọn option Amount -> Save`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Content");
      await dashboard.locator(`//div[contains(@data-widget-id, 'saving_format')]//button`).click();
      await dashboard.locator(`//li[contains(@value, 'amount')]`).click();
      await dashboard.waitForTimeout(500);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.show_amount_preview,
      });
      await dashboard.locator(XpathNavigationButtons["save"]).waitFor({ state: "attached" });
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");

      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      await snapshotFixture.verify({
        page: storefront,
        selector: sectionSelector,
        snapshotName: expected.show_amount_webfront,
      });
      await storefront.close();
    });

    await test.step(`Kéo thả thay đổi vị trí 3 element`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Content");
      const dragBtn = `(//span[contains(@class,'widget-list__drag')])[1]`;
      let selectorTo = `//label[contains(@class, 'w-builder__label') and normalize-space(text()) = 'Compared price']`;
      await webBuilder.dragAndDrop({ from: { selector: dragBtn }, to: { selector: selectorTo }, isHover: true });
      await dashboard.waitForTimeout(2000); //wait for block update ui
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.dnd_price_to_price_compare,
      });
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Content");
      selectorTo = `//label[contains(@class, 'w-builder__label') and normalize-space(text()) = 'Saving badge']`;
      await webBuilder.dragAndDrop({ from: { selector: dragBtn }, to: { selector: selectorTo }, isHover: true });
      await dashboard.waitForTimeout(2000); //wait for block update ui
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.dnd_price_compare_to_saving_type,
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_18 Verify customize design cho block`, async ({ conf, dashboard, snapshotFixture }) => {
    test.slow();
    const addBlock = conf.caseConf.add_block;
    const expected = conf.caseConf.expected;
    await webBuilder.dragAndDropInWebBuilder(addBlock);
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });
    const blockId = await blockProductPrice.getAttrsDataId();

    await test.step(`Tại tab design, price color click vào box chọn màu, chọn 1 màu bất kỳ`, async () => {
      await blockProductPrice.switchToTab("Design");
      const styles = conf.caseConf.input.setting_block.style;
      await webBuilder.color(styles.color, "price_color");
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.change_price_color,
      });
    });

    await test.step(`Chỉnh sửa Icon shape và size tại tab Design`, async () => {
      const styles = conf.caseConf.input.setting_block.style;
      for (const size of styles.sizes) {
        await webBuilder.clickElementById(blockId, ClickType.BLOCK);
        await blockProductPrice.switchToTab("Design");
        await webBuilder.size("price_size", size);
        for (const shape of styles.shapes) {
          await webBuilder.clickElementById(blockId, ClickType.BLOCK);
          await blockProductPrice.switchToTab("Design");
          await webBuilder.changeDesign(shape);
          await blockProductPrice.clickBackLayer();
          await snapshotFixture.verifyWithIframe({
            page: dashboard,
            selector: sectionSelector,
            iframe: webBuilder.iframe,
            snapshotName: `case-18-change-price-${shape.shape.type}-size-${size.toLowerCase()}.png`,
          });
        }
      }
    });

    await test.step(`Edit các common setting của 1 block theo input data `, async () => {
      const styles = conf.caseConf.input.setting_block.style;
      let index = 1;
      for (const style of styles.common) {
        await webBuilder.clickElementById(blockId, ClickType.BLOCK);
        await blockProductPrice.switchToTab("Design");
        await webBuilder.changeDesign(style);
        await blockProductPrice.clickBackLayer();
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: `case-18-change-common-setting-${index}.png`,
        });
        index++;
      }
    });
  });

  test(`@SB_WEB_BUILDER_PRD_38 Verify resize width block`, async ({ conf, dashboard, snapshotFixture }) => {
    const addBlock = conf.caseConf.add_block;
    await webBuilder.dragAndDropInWebBuilder(addBlock);
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });
    const blockId = await blockProductPrice.getAttrsDataId();

    await test.step(`Resize tăng width của block`, async () => {
      const widthList = conf.caseConf.input.setting_block.increase_width;
      for (const width of widthList) {
        await webBuilder.clickElementById(blockId, ClickType.BLOCK);
        await blockProductPrice.switchToTab("Design");
        await webBuilder.changeDesign(width);
        await blockProductPrice.clickBackLayer();
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: `case-38-change-width-setting-${width.width.value.value}.png`,
        });
      }
    });

    await test.step(`Kéo thả resize giảm width của block`, async () => {
      const resize = conf.caseConf.input.setting_block.resize;
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Design");
      await webBuilder.resize(resize.selector, "right", resize.outside);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `case-38-resize-width-setting-${resize.outside}.png`,
      });
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockProductPrice.switchToTab("Design");
      await webBuilder.resize(resize.selector, "right", resize.inside);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `case-38-resize-width-setting-${resize.inside}.png`,
      });
    });

    await test.step(`Chỉnh sửa width của block < min width = 80 px trên sidebar`, async () => {
      const widthList = conf.caseConf.input.setting_block.decrease_width;
      for (const width of widthList) {
        await webBuilder.clickElementById(blockId, ClickType.BLOCK);
        await blockProductPrice.switchToTab("Design");
        await webBuilder.changeDesign(width);
        await blockProductPrice.clickBackLayer();
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: `case-38-change-width-setting-${width.width.value.value}.png`,
        });
      }
    });
  });

  test(`@SB_WEB_BUILDER_PRD_39 Verify price được connect đúng với data source`, async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.add_block;
    const expected = conf.caseConf.expected;
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });
    const sidebarSelector = webBuilder.getSidebarSelectorByName({
      sectionName: conf.suiteConf.section_name.content,
      sectionIndex: 1,
    });
    await webBuilder.dragAndDropInWebBuilder(addBlock);

    await test.step(`Thay đổi data source của section chứa block quantity = none`, async () => {
      await blockProductPrice.clickBackLayer();
      await dashboard.locator(sidebarSelector).click();
      await dashboard
        .locator(
          `//label[contains(text(), 'Data source')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div`,
        )
        .click();
      await dashboard
        .locator(`//div[contains(@class, 'choose-data-source-wrapper')]//button[span[contains(text(), 'None')]]`)
        .waitFor({ state: "visible" });
      await dashboard
        .locator(`//div[contains(@class, 'choose-data-source-wrapper')]//button[span[contains(text(), 'None')]]`)
        .click();
      await dashboard.waitForTimeout(2 * 1000);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.set_none_data_source,
      });
    });

    await test.step(`Thay đổi data source của section chứa block price = product theo data  `, async () => {
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await dashboard.waitForTimeout(500); //wait for update data source
      await dashboard.locator(sidebarSelector).click();
      await dashboard
        .locator(
          `//label[contains(text(), 'Data source')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div`,
        )
        .click();
      await dashboard
        .locator(`//div[contains(@class, 'choose-data-source-wrapper')]//button[span[contains(text(), 'Product')]]`)
        .waitFor({ state: "visible" });
      await dashboard
        .locator(`//div[contains(@class, 'choose-data-source-wrapper')]//button[span[contains(text(), 'Product')]]`)
        .click();
      await dashboard
        .locator(
          `(//div[contains(@class, 'list-search-result')]//span/ancestor::div[contains(@class, 'sb-selection-item')])[1]`,
        )
        .waitFor({ state: "visible" });
      await dashboard
        .locator(
          `(//div[contains(@class, 'list-search-result')]//span/ancestor::div[contains(@class, 'sb-selection-item')])[1]`,
        )
        .click();
      await dashboard.waitForTimeout(2 * 1000);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.set_product_current_data_source,
      });
    });

    await test.step(`Thay đổi data source của section chứa block price = 1 collection theo data`, async () => {
      const listLabel = ["Collection", "Blog", "Blog post"];
      for (const label of listLabel) {
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await dashboard.waitForTimeout(500); //wait for update data source
        await dashboard.locator(sidebarSelector).click();
        await dashboard
          .locator(
            `//label[contains(text(), 'Data source')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div`,
          )
          .click();
        if (
          await dashboard.locator(`//div[contains(@class, 'sb-flex search-source__search-bar')]//button`).isVisible()
        ) {
          await dashboard.locator(`//div[contains(@class, 'sb-flex search-source__search-bar')]//button`).click();
        }
        await dashboard
          .locator(
            `//div[contains(@class, 'choose-data-source-wrapper')]//button[span[normalize-space(text())='${label}']]`,
          )
          .waitFor({ state: "visible" });
        await dashboard
          .locator(
            `//div[contains(@class, 'choose-data-source-wrapper')]//button[span[normalize-space(text())='${label}']]`,
          )
          .click();
        await dashboard
          .locator(
            `(//div[contains(@class, 'list-search-result')]//span/ancestor::div[contains(@class, 'sb-selection-item')])[1]`,
          )
          .waitFor({ state: "visible" });
        await dashboard
          .locator(
            `(//div[contains(@class, 'list-search-result')]//span/ancestor::div[contains(@class, 'sb-selection-item')])[1]`,
          )
          .click();
        await dashboard.waitForTimeout(2 * 1000);
        await blockProductPrice.clickBackLayer();
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: expected.set_none_data_source,
        });
      }
    });

    await test.step(`Thay đổi data source của section chứa block price về current product page`, async () => {
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await dashboard.waitForTimeout(500); //wait for update data source
      await dashboard.locator(sidebarSelector).click();
      await dashboard
        .locator(
          `//label[contains(text(), 'Data source')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div`,
        )
        .click();
      await dashboard.waitForSelector(`//div[contains(@class, 'sb-flex search-source__search-bar')]//button`);
      await dashboard.locator(`//div[contains(@class, 'sb-flex search-source__search-bar')]//button`).click();
      await dashboard.waitForSelector(
        `//div[contains(@class, 'choose-data-source-wrapper')]//button[span[contains(text(), 'Current page  product')]]`,
      );
      await dashboard
        .locator(
          `//div[contains(@class, 'choose-data-source-wrapper')]//button[span[contains(text(), 'Current page  product')]]`,
        )
        .click();
      await dashboard.waitForTimeout(2 * 1000);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.set_product_current_data_source,
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_40 Verify block Price không có ở shop creator`, async ({ dashboard, token, conf }) => {
    const homePage = new HomePage(dashboard, conf.caseConf.shop_creator.domain);
    const accessToken = (
      await token.getWithCredentials({
        domain: conf.caseConf.shop_creator.shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      })
    ).access_token;
    await homePage.loginWithToken(accessToken);
    webBuilder = new WebBuilder(dashboard, conf.caseConf.shop_creator.domain);
    await webBuilder.openWebBuilder({ type: "site", id: conf.caseConf.shop_creator.theme_id });
    await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
    await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_blank_section);
    await webBuilder.changeContent(conf.suiteConf.section_name);
    await webBuilder.backBtn.click();

    await test.step(`Click "Add block" trong blank section`, async () => {
      await dashboard.locator(XpathNavigationButtons["insert"]).click();
      await expect(dashboard.locator(section.insertPanelPreviewSelector)).toBeVisible();
    });

    await test.step(`Search   "Product price" trên drawer Insert block`, async () => {
      await webBuilder.searchbarTemplate.fill(conf.caseConf.add_block.from.template);
      await webBuilder.waitForSearchResult();
      await expect(
        dashboard.locator(
          `//div[contains(@class, 'w-builder__insert-previews--search-empty-content')]//p[normalize-space(text())='Could not find any results for "${conf.caseConf.add_block.from.template}"']`,
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_37 Verify chỉnh sửa giá trong Dashboard`, async ({
    dashboard,
    conf,
    authRequest,
    snapshotFixture,
  }) => {
    const domain = conf.suiteConf.domain;
    const addBlock = conf.caseConf.add_block;
    productAPI = new ProductAPI(domain, authRequest);
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });
    const productData = await productAPI.getProducts({
      limit: 1,
      published_status: "published",
      sort_field: "id",
      sort_mode: "desc",
    });

    await test.step(`Khi width đang ở default, thay đổi giá của product trong DB thành số dài hơn. Reload lại web builder setting block price`, async () => {
      if (productData.length > 0) {
        const productUpdate = Object.assign({}, productData[0]);
        productUpdate.price = conf.caseConf.input.price_1;
        await productAPI.updateProductInfo(productUpdate);
      }
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "product" });
      await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_blank_section);
      await webBuilder.changeContent(conf.suiteConf.section_name);
      await webBuilder.backBtn.click();
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await blockProductPrice.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `case-37-change-product-price-${conf.caseConf.input.price_1}.png`,
      });
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
    });

    await test.step(`Khi width đang ở default, thay đổi giá của product trong DB thành số ngắn hơn. Reload lại web builder setting block price`, async () => {
      if (productData.length > 0) {
        const productUpdate = Object.assign({}, productData[0]);
        productUpdate.price = conf.caseConf.input.price_2;
        await productAPI.updateProductInfo(productUpdate);
        await dashboard.waitForTimeout(4000); //wait api update
        await dashboard.reload();

        await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
        await webBuilder.page.waitForLoadState("networkidle");
        await webBuilder.frameLocator.locator(sectionSelector).waitFor({ state: "visible" });
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: `case-37-change-product-price-${conf.caseConf.input.price_2}.png`,
        });
        productUpdate.price = 100;
        await productAPI.updateProductInfo(productUpdate);
        await dashboard.waitForTimeout(4000); //wait api update
      }
    });
  });

  test(`@SB_WEB_BUILDER_PRD_19 Verify khi thay đổi đơn vị tiền tệ`, async ({
    conf,
    dashboard,
    snapshotFixture,
    context,
  }) => {
    const addBlockPrice = conf.caseConf.add_block_price;
    const addBlockGlobalSwitcher = conf.caseConf.add_block_global_switcher;
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });

    await test.step(`Insert block global switcher`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlockGlobalSwitcher);
      await webBuilder.backBtn.click();
      await webBuilder.page.waitForSelector(webBuilder.xpathToastAddNewBlock, { state: "hidden" });
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-case-19-add-global-switcher.png`,
      });
    });

    await test.step(`Insert block price`, async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_blank_section);
      await webBuilder.changeContent(conf.suiteConf.section_name);
      await webBuilder.backBtn.click();
      await webBuilder.page.waitForSelector(webBuilder.xpathToastAddNewSection, { state: "hidden" });
      await webBuilder.dragAndDropInWebBuilder(addBlockPrice);
      await webBuilder.backBtn.click();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-case-19-add-product-price.png`,
      });
      await webBuilder.clickSaveButton();
    });

    await test.step(`tại block global switcher chọn đơn vị tiền tệ là CNY (¥) -> Save`, async () => {
      const newTab = await context.newPage();
      sfPage = new SfTranslation(newTab, conf.suiteConf.domain);
      await sfPage.gotoProductDetail(`${conf.caseConf.product_handle}`);
      await expect(sfPage.genLoc(sfPage.xpathTranslate.globalSwitcherBlock)).toContainText(
        conf.caseConf.currency_default.value,
      );
      await sfPage.changeSettingLanguage({ currency: conf.caseConf.currency.value });
      await sfPage.page.waitForLoadState("networkidle");
      await sfPage.page.waitForSelector(sfPage.xpathTranslate.countryFlag);
      await expect(sfPage.genLoc(sfPage.xpathTranslate.globalSwitcherBlock)).toContainText(
        conf.caseConf.currency.value,
      );
      await expect(sfPage.genLoc(sfPage.xpathBlockPrice).first().locator(`//span`).first()).toContainText(
        conf.caseConf.currency.unit,
      );
    });

    await test.step(`tại block global switcher chọn lại đơn vị tiền tệ là US dollar (USD) -> Save`, async () => {
      await sfPage.changeSettingLanguage({ currency: conf.caseConf.currency_default.value });
      await sfPage.page.waitForLoadState("networkidle");
      await expect(sfPage.genLoc(sfPage.xpathTranslate.globalSwitcherBlock)).toContainText(
        conf.caseConf.currency_default.value,
      );
      await expect(sfPage.genLoc(sfPage.xpathBlockPrice).first().locator(`//span`).first()).toContainText(
        conf.caseConf.currency_default.unit,
      );
    });
  });
});
