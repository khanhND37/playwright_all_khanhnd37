import { expect, test } from "@fixtures/website_builder";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import {
  Dev,
  SbWebBuilderLBQT01,
  SbWebBuilderLBQT03,
  SbWebBuilderLBQT07,
  SbWebBuilderLBQT08,
  SbWebBuilderLBQT09,
  SbWebBuilderLBQT10,
} from "./block_quantity";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";
import { XpathNavigationButtons } from "@constants/web_builder";
import { HomePage } from "@pages/dashboard/home_page";
import { WebsiteSetting } from "@pages/dashboard/website_setting";

test.describe("Check function block Quantity", async () => {
  test.slow();
  let suiteConf: Dev;
  let webBuilder: WebBuilder;
  let blockQuantity: Blocks;
  let themeId: number;
  let section;
  let xpathBlock: Blocks;
  let webSetting: WebsiteSetting;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    suiteConf = conf.suiteConf as Dev;
    const addSection = suiteConf.dnd_blank_section;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    blockQuantity = new Blocks(dashboard, suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    themeId = suiteConf.theme_id;
    section = new Sections(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    if (conf.caseName === "SB_WEB_BUILDER_LB_BL_QT_10") {
      return;
    } else {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "product" });
    }
    await webBuilder.page.waitForLoadState("networkidle");
    //issue duplicate reload
    await dashboard.waitForTimeout(4000);
    await webBuilder.dragAndDropInWebBuilder(addSection);
    await webBuilder.switchToTab("Content");
    await webBuilder.changeContent(suiteConf.section_name);
    await webBuilder.backBtn.click();
  });

  test.afterEach(async ({ conf, dashboard }) => {
    if (conf.caseName === "SB_WEB_BUILDER_LB_BL_QT_10") {
      return;
    }
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
    await webSetting.clickBtnSave();
  });

  test("@SB_WEB_BUILDER_LB_BL_QT_01 Insert panel_ Verify hiển thị UI default khi add block quantity", async ({
    cConf,
    dashboard,
    snapshotFixture,
  }) => {
    const caseConf = cConf as SbWebBuilderLBQT01;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;

    await test.step('Click "Add block" trong blank section', async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
    });

    await test.step(`Click add block Quantity trong blank section`, async () => {
      await webBuilder.switchToTab("Design");
      await dashboard.locator(blockQuantity.xpathSidebar).waitFor({ state: "visible" });
      await snapshotFixture.verify({
        page: dashboard,
        selector: blockQuantity.xpathSidebar,
        snapshotName: expected.snapshot_sidebar,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_QT_03 Verify chỉnh sửa tab design của block Quantity`, async ({
    dashboard,
    conf,
    cConf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = cConf as SbWebBuilderLBQT03;
    const addBlock = caseConf.add_block;

    await test.step("Add block Quantity trong blank section", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
    });

    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });

    await test.step(`Chỉnh sửa setting text color và size `, async () => {
      await webBuilder.switchToTab("Design");
      const styles = conf.caseConf.input.setting_block.style;
      await webBuilder.color(styles.color, "color");
      await webSetting.clickBtnSave();
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      await expect(storefront.locator("div.button-quantity-container").first()).toBeVisible();
      await snapshotFixture.verify({
        page: storefront,
        selector: storefront.locator("div.button-quantity-container").first(),
        snapshotName: `${conf.caseConf.expect.snapshot_preview}-color.png`,
      });
      for (const size of conf.caseConf.expect.sizes) {
        await webBuilder.size("size", size);
        await webSetting.clickBtnSave();
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });

        await expect(storefront.locator("div.button-quantity-container").first()).toBeVisible();
        await snapshotFixture.verify({
          page: storefront,
          selector: storefront.locator("div.button-quantity-container").first(),
          snapshotName: `${conf.caseConf.expect.snapshot_preview}-${size}.png`,
        });
        await storefront.close();
      }
    });

    await test.step(`Edit các common setting của 1 block theo input data`, async () => {
      let index = 1;
      for (const style of conf.caseConf.expect.styles) {
        await webBuilder.changeDesign(style);
        await webSetting.clickBtnSave();
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });

        await expect(storefront.locator("div.button-quantity-container").first()).toBeVisible();
        await snapshotFixture.verify({
          page: storefront,
          selector: sectionSelector,
          snapshotName: `${conf.caseConf.expect.snapshot_preview}-design-${index}.png`,
        });
        index++;
        await storefront.close();
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_QT_07 Verify chỉnh sửa setting quick bar của block`, async ({
    dashboard,
    cConf,
    conf,
    snapshotFixture,
  }) => {
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 1 });
    const caseConf = cConf as SbWebBuilderLBQT07;
    const addBlock = caseConf.add_block;
    const expected = caseConf.expected;
    let blockId: string;
    await test.step('Click "Add block" trong blank section', async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBlock.parent_position,
        template: addBlock.template,
      });
      blockId = await blockQuantity.getAttrsDataId();
      await expect(webBuilder.frameLocator.locator(section.quickBarSelector)).toBeVisible();
    });

    await test.step(`Click vào block, click duplicate (hoặc Ctrl+D)`, async () => {
      await blockQuantity.clickBackLayer();
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockQuantity.clickQuickSettingByButtonPosition(3, "button");
      await blockQuantity.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.snapshot_duplicate,
      });
    });

    await test.step(`Click vào block, click Hide`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockQuantity.clickQuickSettingByButtonPosition(4, "button");
      await blockQuantity.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.snapshot_hide,
      });
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

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_sidebar_show,
        snapshotOptions: {
          threshold: 0.1,
          maxDiffPixelRatio: 0.05,
          maxDiffPixels: 2000,
        },
      });
    });

    await test.step(`Click vào block, Delete`, async () => {
      await webBuilder.clickElementById(blockId, ClickType.BLOCK);
      await blockQuantity.clickQuickSettingByButtonPosition(6, "button");
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: expected.snapshot_delete,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_QT_08 Verify resize width của block quantity`, async ({
    dashboard,
    cConf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = cConf as SbWebBuilderLBQT08;
    const addBlock = caseConf.add_block;
    await webBuilder.insertSectionBlock({
      parentPosition: addBlock.parent_position,
      template: addBlock.template,
    });

    await test.step(`Resize giảm width của block`, async () => {
      await webBuilder.switchToTab("Design");
      //khi resize nhỏ hơn 112px thì clip content.
      await webBuilder.settingWidthHeight("width", { unit: "Px", value: 75 }, true);
      await webSetting.clickBtnSave();
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      await expect(storefront.locator("div.button-quantity-container").first()).toBeVisible();
      await snapshotFixture.verify({
        page: storefront,
        selector: storefront.locator("div.button-quantity-container").first(),
        snapshotName: caseConf.expected.snapshot_clip_content,
      });
    });

    await test.step(`Resize tăng width của block`, async () => {
      await webBuilder.settingWidthHeight("width", { unit: "Px", value: 200 }, true);
      await webSetting.clickBtnSave();
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      await expect(storefront.locator("div.button-quantity-container").first()).toBeVisible();
      await snapshotFixture.verify({
        page: storefront,
        selector: storefront.locator("div.button-quantity-container").first(),
        snapshotName: caseConf.expected.snapshot_w200,
      });

      await webBuilder.settingWidthHeight("width", { unit: "Px", value: 400 }, true);
      await webSetting.clickBtnSave();
      const storefront2 = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      await expect(storefront2.locator("div.button-quantity-container").first()).toBeVisible();
      await snapshotFixture.verify({
        page: storefront2,
        selector: storefront2.locator("div.button-quantity-container").first(),
        snapshotName: caseConf.expected.snapshot_w400,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_QT_09 Verify chỉnh sửa giá trị quantity và thực hiện Add to cart`, async ({
    dashboard,
    cConf,
    context,
    conf,
  }) => {
    const caseConf = cConf as SbWebBuilderLBQT09;
    const expected = caseConf.expected;
    const xpathSectionButton = "(//*[@component='button'])";
    const xpathBtnAtc =
      "//div[contains(@class, 'wb-button--add-cart__container')]//span[normalize-space()= 'ADD TO CART']";
    const xpathLoading = `${xpathSectionButton}//div[contains(@class, 'wb-button--add-cart__container') and descendant::div[contains(@class,'loading-spinner')]]`;

    await test.step(`1.Click btn - 2. Click btn Add to cart`, async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await storefront.click("div.button-quantity__layout-vertical__decrease");
      await storefront.locator(`${xpathSectionButton}${xpathBtnAtc}`).click();
      await expect(storefront.locator(xpathLoading)).toBeVisible();
      //xoá item trong cart
      await storefront.evaluate(() => {
        window.localStorage.removeItem("cartToken");
        window.localStorage.removeItem("cartCheckoutToken");
      });
      await storefront.close();
    });

    await test.step(`1.Click btn + 2. Click btn Add to cart`, async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await storefront.click("div.button-quantity__layout-vertical__increase");
      await storefront.locator(`${xpathSectionButton}${xpathBtnAtc}`).click();
      await expect(storefront.locator(xpathLoading)).toBeVisible();
      //xoá item trong cart
      await storefront.evaluate(() => {
        window.localStorage.removeItem("cartToken");
        window.localStorage.removeItem("cartCheckoutToken");
      });
      await storefront.close();
    });

    await test.step(`1. Input giá trị vào block quantity 2. Click btn ATC`, async () => {
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.goto(`https://${conf.suiteConf.domain}/products/${conf.suiteConf.product_handle}`);
      await storefront.waitForLoadState("networkidle", { timeout: 100 * 1000 });

      //input quantity and add to cart
      for (const val of expected.custom_value_quantity) {
        await storefront.waitForTimeout(2 * 1000);
        await storefront.locator("(//*[@component='quantity_selector'])//input").fill(val);
        await storefront.locator(`${xpathSectionButton}${xpathBtnAtc}`).click();
        await expect(storefront.locator(xpathLoading)).toBeVisible();

        //verify quantity đưọc add đúng số lượng
        await expect(storefront.locator("#default_cart_drawer")).toBeVisible();
        const qttValue = await storefront.inputValue("#default_cart_drawer input");
        expect(qttValue).toEqual(val);

        //verify quantity cart icon
        const quantityCartIcon = await storefront.innerText(".block-cart span");
        let expectVal = val;
        const parsedVal = parseInt(val);
        if (parsedVal >= 100) {
          expectVal = "99+";
        }
        expect(quantityCartIcon).toEqual(expectVal);

        //xoá item trong cart
        await storefront.evaluate(() => {
          window.localStorage.removeItem("cartToken");
          window.localStorage.removeItem("cartCheckoutToken");
        });
        await storefront.reload();
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_QT_10 Verify block quantity không có ở shop creator`, async ({
    cConf,
    conf,
    token,
    page,
  }) => {
    const caseConf = cConf as SbWebBuilderLBQT10;
    const addBlock = caseConf.add_block;
    let wb: WebBuilder;
    for (const shopData of conf.caseConf.shop_data) {
      await test.step(`Pre condition`, async () => {
        const homePage = new HomePage(page, shopData.domain);
        const accessToken = (
          await token.getWithCredentials({
            domain: shopData.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        await homePage.loginWithToken(accessToken);
        wb = new WebBuilder(homePage.page, shopData.domain);
        await wb.openWebBuilder({ type: "site", id: shopData.theme_id });
      });

      await test.step(`Click "Add block" trong blank section`, async () => {
        await wb.page.waitForSelector(XpathNavigationButtons["insert"]);
        await wb.page.locator(XpathNavigationButtons["insert"]).click();
        await expect(wb.insertPreview).toBeVisible();
      });
      await test.step(`Search "quantity" trên drawer Insert block`, async () => {
        await wb.searchbarTemplate.fill(addBlock.template);
        await expect(wb.searchEmpty).toBeVisible();
      });
    }
  });
});
