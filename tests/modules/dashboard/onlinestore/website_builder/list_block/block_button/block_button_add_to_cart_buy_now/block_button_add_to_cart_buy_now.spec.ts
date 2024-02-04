import { test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { expect } from "@core/fixtures";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { loadData } from "@core/conf/conf";
import { SbWebBuilderPrd } from "./block_button_add_to_cart_buy_now";
import { HomePage } from "@pages/dashboard/home_page";
import { WebsiteSetting } from "@pages/dashboard/website_setting";
import { SFHome } from "@pages/storefront/homepage";
import { SFCheckout } from "@pages/storefront/checkout";
import { WbBtnPaypal } from "@pages/dashboard/wb_btn_dynamic_checkout";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrderAPI } from "@pages/api/order";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { waitTimeout } from "@core/utils/api";
import { ShopTheme } from "@types";
import { FrameLocator } from "@playwright/test";
import { SFCartv3 } from "@pages/storefront/cart";
import { SFProduct } from "@pages/storefront/product";

test.describe("Verify button add to cart buy now shop creator SB_WEB_BUILDER_PRD_ 6  11 ", () => {
  let webBuilder: WebBuilder, xpathBlock: Blocks, frameLocator, blockSelector, section, column, block;

  test.beforeEach(async ({ conf, page, token }) => {
    const domain = confCaseVerifyButtons.caseConf.shop_data.domain;
    const shopName = confCaseVerifyButtons.caseConf.shop_data.shop_name;
    webBuilder = new WebBuilder(page, domain);
    xpathBlock = new Blocks(page, domain);
    frameLocator = xpathBlock.frameLocator;
    section = column = block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });
    const addSection = conf.suiteConf.dnd_blank_section;

    await test.step("Pre-condition: Open web builder & Add blank section ", async () => {
      // login to shop
      const homePage = new HomePage(page, domain);
      const accessToken = (
        await token.getWithCredentials({
          domain: shopName,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;
      await homePage.loginWithToken(accessToken);
      await webBuilder.openCustomizeTheme(page, domain);
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.loadingScreen.waitFor({ state: "hidden" });
      await webBuilder.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });

      // Add blank section
      await webBuilder.dragAndDropInWebBuilder(addSection);
      await webBuilder.backBtn.click();
    });
  });

  const caseVerifyButtonsCreatorName = "VERIFY_BUTTONS_CREATOR";
  const confCaseVerifyButtons = loadData(__dirname, caseVerifyButtonsCreatorName);
  confCaseVerifyButtons.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_description: caseDescription,
      dnd_block: dndBlock,
      button_name: buttonName,
      tooltip_text: tooltipText,
    }) => {
      test(`@${caseID} - ${caseDescription}`, async ({}) => {
        await test.step(`Tại Action bar, click Insert Panel , Click add block Button `, async () => {
          await webBuilder.dragAndDropInWebBuilder(dndBlock);
          await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
        });

        await test.step(`Chọn option Add to cart. Check UI `, async () => {
          await webBuilder.switchToTab("Content");
          await webBuilder.clickOnBtnLinkWithLabel("Open a link");
          const buttonActionOption = webBuilder.getXpathActionBlockButton(buttonName);
          await expect(webBuilder.genLoc(buttonActionOption)).toHaveCSS("cursor", "not-allowed");

          const xpathAction = webBuilder.getXpathActionBlockButton(buttonName) + "/span";
          await webBuilder.genLoc(xpathAction).hover();
          const tooltipButton = webBuilder.genLoc(webBuilder.xpathVisibleTooltip);
          await expect(tooltipButton).toHaveText(tooltipText);
        });
      });
    },
  );
});

test.describe("Verify button add to cart, buy now, dynamic trong WB shopbase ", () => {
  test.slow();
  let webBuilder: WebBuilder,
    xpathBlock: Blocks,
    frameLocator: FrameLocator,
    duplicatedTheme: ShopTheme,
    webSetting: WebsiteSetting,
    cart: SFCartv3,
    producPage: SFProduct,
    blockSelector,
    themeId,
    section,
    column,
    block;

  const xpathbtnBuyWithPaypal = `[class$=paypal-product__button]`;
  const xpathbtnBuyWithPaypalDisable = `//div[contains(@class,'paypal-product__custom-button--disabled')]`;

  test.beforeEach(async ({ dashboard, conf, theme }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;
    section = 2;
    column = block = 1;
    blockSelector = webBuilder.getSelectorByIndex({ section, column, block });

    await test.step("Duplicate and publish theme", async () => {
      duplicatedTheme = await theme.duplicate(conf.suiteConf.theme_id);
      themeId = duplicatedTheme.id;
      await theme.publish(themeId);
    });

    await test.step("Pre-condition: Open WB", async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "product" });
      await webBuilder.loadingScreen.waitFor({ state: "hidden" });
      await webBuilder.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
    });
  });

  test.afterEach(async ({ theme, conf }) => {
    await test.step("Restore data theme", async () => {
      const listTemplate = [];
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
      const listTheme = await theme.list();
      listTheme.forEach(template => {
        if (!template.active) {
          listTemplate.push(template.id);
        }
      });
      if (listTemplate.length > 0) {
        for (const template of listTemplate) {
          if (template !== conf.suiteConf.theme_id) {
            await theme.delete(template);
          }
        }
      }
    });
  });

  test(`@SB_WEB_BUILDER_PRD_04 block_add_to_cart_ Verify hiển thị UI default khi add block add to cart tại section/container chứa block có data source là 1 product shop bán physical product`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const caseConf = conf.caseConf as SbWebBuilderPrd;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    await test.step(`Chọn option Add to cart >  Check UI default sidebar tại tab content`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await dashboard.waitForLoadState("load");
      await webBuilder.clickSaveButton();
      await expect(xpathBlock.dataSource).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: xpathBlock.xpathSidebar,
        snapshotName: caseConf.expected.snapshot_sidebar_content,
      });
    });

    await test.step(`Click "cart setting"`, async () => {
      await webBuilder.clickOnTextLinkWithLabel(caseConf.hyperlink);
      await expect(webBuilder.genLoc(webBuilder.getXpathWithLabel("Product card"))).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_10 block_buy_now_ Verify hiển thị UI default khi add block buy now tại section/container chứa block có data source là 1 product shop bán physical product`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const caseConf = conf.caseConf as SbWebBuilderPrd;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    await test.step(`Chọn btn Buy now. Check UI default sidebar tại tab content`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await dashboard.waitForLoadState("load");
      await webBuilder.clickSaveButton();
      await expect(xpathBlock.dataSource).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: xpathBlock.xpathSidebar,
        snapshotName: caseConf.expected.snapshot_sidebar_content,
      });
    });
  });

  const caseVerifyChangeDataSource = "VERIFY_CHANGE_DATA_SOURCE";
  const confCaseVerifyChangeDataSource = loadData(__dirname, caseVerifyChangeDataSource);
  confCaseVerifyChangeDataSource.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_description: caseDescription,
      button_name: buttonName,
      dnd_block: dndBlock,
      label: btnLabel,
      missing_data_source: missingDataSouceText,
    }) => {
      test(`@${caseID} - ${caseDescription}`, async ({ dashboard, context, conf }) => {
        await test.step("Pre-condition: đổi data source Section  ", async () => {
          await webBuilder.setVariableForSection({
            sectionName: conf.suiteConf.add_section.template,
            sourceType: "Blog",
            sourceData: "News",
            sectionIndex: 1,
          });
          await webBuilder.backBtn.click();
        });

        await test.step(`Tại Action bar, click Insert Panel > Click add block Button `, async () => {
          await webBuilder.dragAndDropInWebBuilder(dndBlock);
          await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
        });

        const newBlockId = await xpathBlock.getAttrsDataId();
        await test.step(`Chọn option Add to cart > Click save > Verify 1. WB - preview`, async () => {
          await webBuilder.switchToTab("Content");
          await webBuilder.inputTextBox("title", btnLabel);
          await webBuilder.selectDropDown("link", buttonName);
          await webBuilder.clickSaveButton();
          const button = webBuilder.frameLocator.locator(
            `[block-id='${newBlockId}'] .wb-button--add-cart__primary div`,
          );

          // Data source của btn chuyển thành "No product yet"
          await xpathBlock.dataSource.waitFor({ state: "visible" });
          await expect(xpathBlock.dataSource).toHaveText("No product yet");

          const cursorAtc = await button.evaluate(el => {
            return window.getComputedStyle(el).getPropertyValue("cursor");
          });
          expect(cursorAtc).toEqual("not-allowed");
          // msg mising data
          await expect(webBuilder.frameLocator.locator(xpathBlock.missingSourceMessage)).toBeVisible();
          await webBuilder.frameLocator.locator(xpathBlock.missingSourceMessage).hover();
          await expect(webBuilder.frameLocator.getByText(missingDataSouceText)).toBeVisible();
        });

        await test.step(`1. Verify trên Preview on newtab  2. SF: check product detail`, async () => {
          // Verify trên Preview on newtab
          const sfPreviewPage = await verifyRedirectUrl({
            page: dashboard,
            selector: xpathBlock.xpathButtonPreview,
            redirectUrl: "?theme_preview_id",
            context,
          });
          await sfPreviewPage.waitForLoadState("networkidle", { timeout: 15000 });
          const SFUrl = sfPreviewPage.url().split("?")[0];
          const buttonPre = sfPreviewPage.locator(`[block-id='${newBlockId}'] .wb-button--add-cart__primary div`);
          const cursorAtc = await buttonPre.evaluate(el => {
            return window.getComputedStyle(el).getPropertyValue("cursor");
          });
          expect(cursorAtc).toEqual("not-allowed");
          await sfPreviewPage.close();

          //  Verify trên SF
          const storefrontPage = await context.newPage();
          await storefrontPage.goto(SFUrl);
          await storefrontPage.waitForLoadState("networkidle", { timeout: 15000 });
          const buttonSF = storefrontPage.locator(`[block-id='${newBlockId}'] .wb-button--add-cart__primary div`);

          const cursor = await buttonSF.evaluate(el => {
            return window.getComputedStyle(el).getPropertyValue("cursor");
          });
          expect(cursor).toEqual("not-allowed");
          await storefrontPage.close();
        });
      });
    },
  );

  test(`@SB_WEB_BUILDER_PRD_08 block_add_to_cart_ Verify chỉnh sửa setting button Add to cart`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 2 });
    const caseConf = conf.caseConf as SbWebBuilderPrd;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    await test.step(`Click edit label Add to cart > Click save `, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(webBuilder.getXpathByText(caseConf.label));
      await expect(xpathBtn).toBeVisible();

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });

      await expect(storefrontPage.locator(webBuilder.getXpathByText(caseConf.label, "//div"))).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Click edit label Add to cart thành label trống > Edit Icon position > Click save`, async () => {
      await webBuilder.inputTextBox("title", "");
      await webBuilder.selectButtonIcon("Left");
      await webBuilder.selectIcon("icon", "Home");
      await webBuilder.switchToTab("Content");
      await webBuilder.clickSaveButton();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `case-08-step-2-setting-btn.png`,
      });

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontPage,
        selector: sectionSelector,
        snapshotName: `case-08-step-2-setting-btn-sf.png`,
      });
      await storefrontPage.close();
    });

    await test.step(`Edit label Add to cart thành text chứa kí tự đặc biệt > Edit Icon position > Edit thay đổi icon button > Click save`, async () => {
      await webBuilder.inputTextBox("title", "!@#$%^");
      await webBuilder.selectButtonIcon("Right");
      await webBuilder.clickSaveButton();

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `case-08-step-3-setting-btn.png`,
      });

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontPage,
        selector: sectionSelector,
        snapshotName: `case-08-step-3-setting-btn-sf.png`,
      });
      await storefrontPage.close();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_13 block_buy_now_Verify chỉnh sửa setting button Buy now`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 2 });
    const caseConf = conf.caseConf as SbWebBuilderPrd;

    await test.step(` Tại Action bar, click Insert Panel > Click add block Button `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    await test.step(`Click edit label btn > Click save`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(webBuilder.getXpathByText(caseConf.label));
      await expect(xpathBtn).toBeVisible();

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });

      await expect(storefrontPage.locator(webBuilder.getXpathByText(caseConf.label, "//div"))).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Click edit label Add to cart thành label trống > Edit Icon position > Click Save`, async () => {
      await webBuilder.inputTextBox("title", "");
      await webBuilder.selectButtonIcon("Left");
      await webBuilder.selectIcon("icon", "Home");
      await webBuilder.switchToTab("Content");
      await webBuilder.clickSaveButton();

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `case-13-step-2-setting-btn.png`,
      });

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontPage,
        selector: sectionSelector,
        snapshotName: `case-13-step-2-setting-btn-sf.png`,
      });
      await storefrontPage.close();
    });

    await test.step(`Edit label Add to cart thành text chứa kí tự đặc biệt > Edit Icon position > Edit thay đổi icon button > click save`, async () => {
      await webBuilder.inputTextBox("title", "#$%^&*");
      await webBuilder.selectButtonIcon("Right");
      await webBuilder.clickSaveButton();

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `case-13-step-3-setting-btn.png`,
      });

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontPage,
        selector: sectionSelector,
        snapshotName: `case-13-step-3-setting-btn-sf.png`,
      });
      await storefrontPage.close();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_31 block_add_to_cart_Verify chỉnh sửa tab Design button Add to cart `, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 2 });
    const caseConf = conf.caseConf;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    await test.step(`Chọn btn Add to cart . Check UI default sidebar tab Design`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();
      await webBuilder.switchToTab("Design");

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: xpathBlock.xpathSidebar,
        snapshotName: `case-1-default-block-btn-atc-sidebar-design.png`,
      });
    });

    let index = 3;
    for (const styles of caseConf.setting_block) {
      await test.step(`Edit các common setting của block -step ${index}`, async () => {
        await frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Design");
        await webBuilder.changeDesign(styles);
        await webBuilder.clickSaveButton();
        await webBuilder.backBtn.click();
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: `case-31-step-${index}-design-btn.png`,
        });

        // Verify trên SF
        const storefrontPage = await verifyRedirectUrl({
          page: dashboard,
          selector: xpathBlock.xpathButtonPreview,
          redirectUrl: "theme_preview_id",
          context,
        });

        await snapshotFixture.verifyWithAutoRetry({
          page: storefrontPage,
          selector: sectionSelector,
          snapshotName: `case-31-step-${index}-design-btn-sf.png`,
        });
        await storefrontPage.close();
      });
      index++;
    }
  });

  test(`@SB_WEB_BUILDER_PRD_41 block_buy_now_ Verify chỉnh sửa tab Design button Buy now `, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 2 });
    const caseConf = conf.caseConf;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    await test.step(`Chọn btn Buy now. Check UI default sidebar tab Design`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();
      await webBuilder.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: xpathBlock.xpathSidebar,
        snapshotName: `case-41-default-block-btn-buynow-sidebar-design.png`,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.quickBarSetting,
        iframe: webBuilder.iframe,
        snapshotName: `case-41-verify-quickbar-setting.png`,
      });
    });

    let index = 3;
    for (const styles of caseConf.setting_block) {
      await test.step(`Edit các common setting của block -step ${index}`, async () => {
        await frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Design");
        await webBuilder.changeDesign(styles);
        await webBuilder.clickSaveButton();
        await webBuilder.backBtn.click();
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: `case-41-step-${index}-design-btn.png`,
        });

        // Verify trên SF
        const storefrontPage = await verifyRedirectUrl({
          page: dashboard,
          selector: xpathBlock.xpathButtonPreview,
          redirectUrl: "theme_preview_id",
          context,
        });

        await snapshotFixture.verifyWithAutoRetry({
          page: storefrontPage,
          selector: sectionSelector,
          snapshotName: `case-41-step-${index}-design-btn-sf.png`,
        });
        await storefrontPage.close();
      });
      index++;
    }
  });

  test(`@SB_WEB_BUILDER_PRD_77 dynamic_checkoutVerify behavior trên webfront`, async ({ dashboard, conf, context }) => {
    const addBlock = conf.caseConf.dnd_block;
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbWebBuilderPrd;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button > Chọn btn Buy now >  Bật toggle switch Enable dynamic checkout button  `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.clickSaveButton();
      await webBuilder.switchToggle("link", true);
      await webBuilder.switchToTab("Design");
      await webBuilder.clickSaveButton();

      // Wait for button Buy with paypal enabled
      await webBuilder.page.waitForSelector(xpathbtnBuyWithPaypalDisable, { state: "hidden" });
      await waitTimeout(2000);
      await expect(frameLocator.locator(xpathbtnBuyWithPaypal)).toBeVisible();
    });

    await test.step(`Chọn product có variant unavailable  > chọn variant unavailable  1. Verify WB - preview  2. SF - product detail`, async () => {
      const step2 = conf.caseConf.step_2;
      await webSetting.changeProductEntity(step2.product_title);
      for (const variant of step2.variants) {
        await webSetting.frameLocator.locator(webSetting.getXpathVariantItem(variant)).click();
      }
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await storefrontPage.waitForLoadState("networkidle");

      for (const variant of step2.variants) {
        await storefrontPage.locator(webSetting.getXpathVariantItem(variant)).click();
      }

      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Chọn product product sold out   1. Verify WB - preview  2. SF - product detail`, async () => {
      const step3 = conf.caseConf.step_3;
      await webSetting.changeProductEntity(step3.product_title);
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await storefrontPage.waitForLoadState("networkidle", { timeout: 15000 });

      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Chọn product có variant sold out > chọn variant sold out  1. Verify WB - preview  2. SF - product detail`, async () => {
      const step4 = conf.caseConf.step_4;
      await webSetting.changeProductEntity(step4.product_title);
      await webSetting.frameLocator.locator(webSetting.getXpathVariantItem(step4.variant)).click();
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await storefrontPage.waitForLoadState("networkidle", { timeout: 15000 });

      await storefrontPage.locator(webSetting.getXpathVariantItem(step4.variant)).click();

      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_92 dynamic_checkout Verify add block dynamic checkout tại section/container có data source khác product , shop bán physical product`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const caseConf = conf.caseConf as SbWebBuilderPrd;

    await test.step(` Tại Action bar, click Insert Panel >Bật toggle switch Enable dynamic checkout button  `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.clickSaveButton();
      await webBuilder.switchToggle("link", true);
      await webBuilder.clickSaveButton();

      // Wait for button Buy with paypal enabled
      await webBuilder.page.waitForSelector("//div[contains(@class,'paypal-product__custom-button--disabled')]", {
        state: "hidden",
      });
      await expect(frameLocator.locator(xpathbtnBuyWithPaypal)).toBeVisible();
    });

    await test.step(`Đổi Section/container có data source khác product > Click save > Verify btn trên WB - preview `, async () => {
      // đổi data source Section
      await webBuilder.clickBtnNavigationBar("layer");
      await webBuilder.setVariableForSection({
        sectionName: conf.suiteConf.add_section.template,
        sourceType: "Blog",
        sourceData: "News",
        sectionIndex: 1,
      });
      await webBuilder.backBtn.click();
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(xpathbtnBuyWithPaypalDisable);
      await expect(xpathBtn).toBeVisible();
    });

    await test.step(`Verify btn trên 1.  Click vào icon Preview on SF 2. SF: check product detail`, async () => {
      // Verify trên Preview on newtab
      const sfPreviewPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });
      await sfPreviewPage.waitForLoadState("networkidle");
      const SFUrl = sfPreviewPage.url().split("?")[0];
      await expect(sfPreviewPage.locator(xpathbtnBuyWithPaypalDisable)).toBeVisible();
      await sfPreviewPage.close();

      //  Verify trên SF
      const storefrontPage = await context.newPage();
      await storefrontPage.goto(SFUrl);
      await storefrontPage.waitForLoadState("networkidle");
      await expect(storefrontPage.locator(xpathbtnBuyWithPaypalDisable)).toBeVisible();
      await storefrontPage.close();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_76 dynamic_checkout Verify chỉnh sửa setting tab Content button`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const caseConf = conf.caseConf as SbWebBuilderPrd;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button > > Bật toggle switch Enable dynamic checkout button  `, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.clickSaveButton();
      await webBuilder.switchToggle("link", true);
      await webBuilder.clickSaveButton();

      // Wait for button Buy with paypal enabled
      await frameLocator.locator(xpathbtnBuyWithPaypalDisable).waitFor({ state: "hidden" });
      await expect(frameLocator.locator(xpathbtnBuyWithPaypal)).toBeVisible();
    });

    await test.step(`Check edit Content btn Buy now   1.Verify Preview   2 .Verify SF `, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.selectButtonIcon("Left");
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();

      await expect(frameLocator.locator(xpathbtnBuyWithPaypal)).toBeVisible();

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await storefrontPage.goto(storefrontPage.url());
      await storefrontPage.waitForLoadState("networkidle");

      await storefrontPage.waitForSelector(xpathbtnBuyWithPaypalDisable, { state: "hidden" });

      const btnBuyWithPaypalSF = storefrontPage.locator("[class$=paypal-product__button]");
      await expect(btnBuyWithPaypalSF).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_78 dynamic_checkout Verify chỉnh sửa Design button`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 2 });
    const caseConf = conf.caseConf;

    await test.step(`Click add block trong blank section`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
    });

    await test.step(`Chọn button buynow > Bật toggle switch Enable dynamic checkout button   > Check UI default sidebar tab Design `, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.clickSaveButton();
      await webBuilder.switchToggle("link", true);
      await webBuilder.switchToTab("Design");
      await webBuilder.clickSaveButton();

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: xpathBlock.xpathSidebar,
        snapshotName: `default-block-btn-dynamic-checkout-sidebar-design.png`,
      });
    });

    let index = 3;
    for (const styles of caseConf.setting_block) {
      await test.step(`Edit các common setting của block -step ${index}`, async () => {
        await frameLocator.locator(blockSelector).click();
        await webBuilder.switchToTab("Design");
        await webBuilder.changeDesign(styles);
        await webBuilder.clickSaveButton();
        await webBuilder.backBtn.click();
        await frameLocator.locator(xpathbtnBuyWithPaypalDisable).waitFor({ state: "hidden" });

        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: `case-78-step-${index}-design-btn.png`,
        });

        // Verify trên SF
        const storefrontPage = await verifyRedirectUrl({
          page: dashboard,
          selector: xpathBlock.xpathButtonPreview,
          redirectUrl: "theme_preview_id",
          context,
        });
        await storefrontPage.goto(storefrontPage.url());
        await storefrontPage.waitForLoadState("networkidle");
        await storefrontPage.waitForSelector(xpathbtnBuyWithPaypalDisable, { state: "hidden" });
        // Wait for paypal button render
        await storefrontPage.waitForTimeout(5000);

        await snapshotFixture.verifyWithAutoRetry({
          page: storefrontPage,
          selector: sectionSelector,
          snapshotName: `case-78-step-${index}-design-btn-sf.png`,
        });
        await storefrontPage.close();
      });
      index++;
    }
  });

  test(`@SB_WEB_BUILDER_PRD_14 block_buy_now_Verify behavior trên webfront`, async ({ dashboard, conf, context }) => {
    const addBlock = conf.caseConf.dnd_block;
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button > Chọn btn Buy now`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(webBuilder.getXpathByText(caseConf.label));
      await expect(xpathBtn).toBeVisible();
    });

    await test.step(`Chọn product có variant unavailable  > chọn variant unavailable 1. Verify WB - preview2. SF - product detail`, async () => {
      const step2 = conf.caseConf.step_2;
      await webSetting.changeProductEntity(step2.product_title);
      await webSetting.selectVariantByTitle(step2.variants);

      await webBuilder.clickSaveButton();
      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên Preview on newtab
      const sfPreviewPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await sfPreviewPage.waitForLoadState("networkidle");
      const SFUrl = sfPreviewPage.url().split("?")[0];
      // Click list option value of 1 variant
      for (const value of step2.variants) {
        await sfPreviewPage.locator(webSetting.getXpathVariantItem(value)).click();
      }
      await expect(
        sfPreviewPage.locator(webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await sfPreviewPage.close();

      // Verify trên SF
      const storefrontPage = await context.newPage();
      await storefrontPage.goto(SFUrl);
      await storefrontPage.waitForLoadState("networkidle");
      // Click list option value of 1 variant
      for (const value of step2.variants) {
        await storefrontPage.locator(webSetting.getXpathVariantItem(value)).click();
      }
      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Chọn product product sold out 1. Verify WB - preview2. SF - product detail`, async () => {
      const step3 = conf.caseConf.step_3;
      await webSetting.changeProductEntity(step3.product_title);
      await webBuilder.clickSaveButton();
      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên Preview on newtab
      const sfPreviewPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await sfPreviewPage.waitForLoadState("networkidle");
      const SFUrl = sfPreviewPage.url().split("?")[0];
      await expect(
        sfPreviewPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await sfPreviewPage.close();

      // Verify trên SF
      const storefrontPage = await context.newPage();
      await storefrontPage.goto(SFUrl);
      await storefrontPage.waitForLoadState("networkidle");
      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Chọn product có variant sold out > chọn variant sold out1. Verify WB - preview2. SF - product detail`, async () => {
      const step4 = conf.caseConf.step_4;
      await webSetting.changeProductEntity(step4.product_title);
      await webSetting.frameLocator.locator(webSetting.getXpathVariantItem(step4.variant)).click();
      await webBuilder.clickSaveButton();
      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên Preview on newtab
      const sfPreviewPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await sfPreviewPage.waitForLoadState("networkidle");
      const SFUrl = sfPreviewPage.url().split("?")[0];
      await sfPreviewPage.locator(webSetting.getXpathVariantItem(step4.variant)).click();
      await expect(
        sfPreviewPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await sfPreviewPage.close();

      // Verify trên SF
      const storefrontPage = await context.newPage();
      await storefrontPage.goto(SFUrl);
      await storefrontPage.waitForLoadState("networkidle");
      await storefrontPage.locator(webSetting.getXpathVariantItem(step4.variant)).click();
      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Chọn product không sold out > SF - product detail : Click btn buynow`, async () => {
      const step5 = conf.caseConf.step_5;
      await webSetting.changeProductEntity(step5.product_title);
      await webBuilder.clickSaveButton();

      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await storefrontPage.waitForLoadState("networkidle");
      const SFUrl = storefrontPage.url().split("?")[0];
      await storefrontPage.goto(SFUrl);
      await storefrontPage.reload({ waitUntil: "networkidle" });

      await storefrontPage.locator(webBuilder.getXpathByText(caseConf.label, "//div")).click();
      await storefrontPage.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefrontPage.waitForLoadState("networkidle");

      await expect(storefrontPage.locator(webBuilder.getXpathByText("Order Summary: "))).toBeVisible();
      await expect(
        storefrontPage.locator(
          webBuilder.getXpathByText(step5.product_title, "//div[contains(@class,'product-cart__details')]"),
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_09 block_add_to_cart_Verify behavior trên webfront`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step("Pre-condition: setting Open cart drawer", async () => {
      // setting Open cart drawer
      await dashboard.locator("//button[@name='Website Settings']").click();
      await webSetting.clickSettingCategory("Product");
      await dashboard
        .locator("//div[@data-widget-id='click_add_cart']//span[contains(@class, 'button--label')]")
        .click();
      await dashboard.locator(`//*[@data-select-label='Open cart drawer']`).click();
      await webSetting.clickBtnSave();
    });

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button > Chọn btn Buy now`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(webBuilder.getXpathByText(caseConf.label));
      await expect(xpathBtn).toBeVisible();
    });

    await test.step(`Chọn product có variant unavailable  > chọn variant unavailable 1. Verify WB - preview2. SF - product detail`, async () => {
      const step2 = conf.caseConf.step_2;
      await webSetting.changeProductEntity(step2.product_title);
      await webSetting.selectVariantByTitle(step2.variants);
      await webBuilder.clickSaveButton();
      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên Preview on newtab
      const sfPreviewPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await sfPreviewPage.waitForLoadState("networkidle");
      const SFUrl = sfPreviewPage.url().split("?")[0];
      // Click list option value of 1 variant
      for (const value of step2.variants) {
        await sfPreviewPage.locator(webSetting.getXpathVariantItem(value)).click();
      }
      await expect(
        sfPreviewPage.locator(webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await sfPreviewPage.close();

      // Verify trên SF
      const storefrontPage = await context.newPage();
      await storefrontPage.goto(SFUrl);
      await storefrontPage.waitForLoadState("networkidle");
      // Click list option value of 1 variant
      for (const value of step2.variants) {
        await storefrontPage.locator(webSetting.getXpathVariantItem(value)).click();
      }
      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Chọn product product sold out 1. Verify WB - preview2. SF - product detail`, async () => {
      const step3 = conf.caseConf.step_3;
      await webSetting.changeProductEntity(step3.product_title);
      await webBuilder.clickSaveButton();
      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên Preview on newtab
      const sfPreviewPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await sfPreviewPage.waitForLoadState("networkidle");
      const SFUrl = sfPreviewPage.url().split("?")[0];
      await expect(
        sfPreviewPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await sfPreviewPage.close();

      // Verify trên SF
      const storefrontPage = await context.newPage();
      await storefrontPage.goto(SFUrl);
      await storefrontPage.waitForLoadState("networkidle");
      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`Chọn product có variant sold out > chọn variant sold out1. Verify WB - preview2. SF - product detail`, async () => {
      const step4 = conf.caseConf.step_4;
      await webSetting.changeProductEntity(step4.product_title);
      await webSetting.frameLocator.locator(webSetting.getXpathVariantItem(step4.variant)).click();
      await webBuilder.clickSaveButton();
      const xpathBtn = frameLocator.locator(
        webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]"),
      );
      await expect(xpathBtn).toBeVisible();

      // Verify trên Preview on newtab
      const sfPreviewPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await sfPreviewPage.waitForLoadState("networkidle");
      const SFUrl = sfPreviewPage.url().split("?")[0];
      await sfPreviewPage.locator(webSetting.getXpathVariantItem(step4.variant)).click();
      await expect(
        sfPreviewPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await sfPreviewPage.close();

      // Verify trên SF
      const storefrontPage = await context.newPage();
      await storefrontPage.goto(SFUrl);
      await storefrontPage.waitForLoadState("networkidle");
      await storefrontPage.locator(webSetting.getXpathVariantItem(step4.variant)).click();
      await expect(
        storefrontPage.locator(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(`setting khi chọn vào add to cart sẽ mở cart drawer > save SF - product detail : Click product variant chưa sold out > click btn ATC`, async () => {
      const step5 = conf.caseConf.step_5;
      await webSetting.changeProductEntity(step5.product_title);

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await storefrontPage.waitForLoadState("networkidle");
      const SFUrl = storefrontPage.url().split("?")[0];
      await storefrontPage.goto(SFUrl);
      await storefrontPage.reload({ waitUntil: "networkidle" });

      await storefrontPage.locator(webBuilder.getXpathByText(caseConf.label, "//div")).click();
      await storefrontPage.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefrontPage.waitForLoadState("networkidle");

      await expect(storefrontPage.locator("//span[normalize-space()='GO TO CART']")).toBeVisible();
      await expect(
        storefrontPage.locator(
          webBuilder.getXpathByText(step5.product_title, "//div[contains(@class,'product-cart__details')]"),
        ),
      ).toBeVisible();
      await storefrontPage.close();
    });

    await test.step(` setting khi chọn vào add to cart sẽ hiển thị mở cart page  > save SF - product detail : Click product variant chưa sold out > click btn ATC`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await webSetting.clickSettingCategory("Product");
      await dashboard
        .locator("//div[@data-widget-id='click_add_cart']//span[contains(@class, 'button--label')]")
        .click();
      await dashboard.locator(`//*[@data-select-label='Go to cart page']`).click();
      await webSetting.clickBtnSave();
      const step6 = conf.caseConf.step_6;
      await webSetting.changeProductEntity(step6.product_title);

      // Verify trên SF
      const storefrontPage = await verifyRedirectUrl({
        page: dashboard,
        selector: xpathBlock.xpathButtonPreview,
        redirectUrl: "theme_preview_id",
        context,
      });
      await storefrontPage.waitForLoadState("networkidle");
      const SFUrl = storefrontPage.url().split("?")[0];
      await storefrontPage.goto(SFUrl);
      await storefrontPage.reload({ waitUntil: "networkidle" });

      await storefrontPage.locator(webBuilder.getXpathByText(caseConf.label, "//div")).click();
      await storefrontPage.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefrontPage.waitForLoadState("networkidle");

      await expect(
        storefrontPage.locator("//span[normalize-space()='YOUR CART'] | //span[normalize-space()='Your cart'] "),
      ).toBeVisible();
      await expect(
        storefrontPage.locator(
          `//div[contains(@class,'product-cart__details-medium')]//a[normalize-space()='${step6.product_title}'] `,
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_79 dynamic_checkoutVerify behavior trên webfront trên mobile`, async ({
    dashboard,
    conf,
    pageMobile,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    const storefrontPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button > Chọn btn Buy now > Bật toggle switchEnable dynamic checkout button`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.clickSaveButton();
      await webBuilder.switchToggle("link", true);
      await webBuilder.clickSaveButton();

      // Wait for button Buy with paypal enabled
      await webBuilder.page.waitForSelector(xpathbtnBuyWithPaypalDisable, { state: "hidden" });
      await expect(frameLocator.locator(xpathbtnBuyWithPaypal)).toBeVisible();
    });

    await test.step(`Chọn product có variant unavailable  > chọn variant unavailable     SF - product detail`, async () => {
      const step2 = conf.caseConf.step_2;
      await storefrontPage.gotoProduct(step2.product_handle);
      await storefrontPage.selectVariantOptions(step2.variants);
      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });

    await test.step(`Chọn product product sold out      SF - product detail`, async () => {
      const step3 = conf.caseConf.step_3;
      await storefrontPage.gotoProduct(step3.product_handle);
      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });

    await test.step(`Chọn product có variant sold out > chọn variant sold out     SF - product detail`, async () => {
      const step4 = conf.caseConf.step_4;
      await storefrontPage.gotoProduct(step4.product_handle);
      await storefrontPage.genLoc(webSetting.getXpathVariantItem(step4.variant)).click();

      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_74 block_buy_now_Verify behavior trên webfront  trên mobile`, async ({
    dashboard,
    conf,
    pageMobile,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    const storefrontPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button > Chọn btn Buy now`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(webBuilder.getXpathByText(caseConf.label));
      await expect(xpathBtn).toBeVisible();
    });

    await test.step(`Chọn product có variant unavailable  > chọn variant unavailable  1. Verify WB - preview  2. SF - product detail`, async () => {
      const step2 = conf.caseConf.step_2;
      await storefrontPage.gotoProduct(step2.product_handle);
      await storefrontPage.selectVariantOptions(step2.variants);
      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });

    await test.step(`Chọn product product sold out   1. Verify WB - preview  2. SF - product detail`, async () => {
      const step3 = conf.caseConf.step_3;
      await storefrontPage.gotoProduct(step3.product_handle);
      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });

    await test.step(`Chọn product có variant sold out > chọn variant sold out  1. Verify WB - preview  2. SF - product detail`, async () => {
      const step4 = conf.caseConf.step_4;
      await storefrontPage.gotoProduct(step4.product_handle);
      await storefrontPage.genLoc(webSetting.getXpathVariantItem(step4.variant)).click();

      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });

    await test.step(`SF - product detail : Click product variant chưa sold out`, async () => {
      const step5 = conf.caseConf.step_5;
      await storefrontPage.gotoProduct(step5.product_handle);
      await storefrontPage.page.reload({ waitUntil: "networkidle" });

      await storefrontPage.genLoc(webBuilder.getXpathByText(caseConf.label, "//div")).click();
      await storefrontPage.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefrontPage.page.waitForLoadState("networkidle");

      await expect(storefrontPage.genLoc(webBuilder.getXpathByText("Order Summary: "))).toBeVisible();
      await expect(
        storefrontPage.genLoc(
          webBuilder.getXpathByText(step5.product_title, "//div[contains(@class,'product-cart__details')]"),
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_75 block_add_to_cart_Verify behavior trên mobile`, async ({
    dashboard,
    conf,
    pageMobile,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    const storefrontPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step("Pre-condition: setting Open cart drawer", async () => {
      // setting Open cart drawer
      await dashboard.locator("//button[@name='Website Settings']").click();
      await webSetting.clickSettingCategory("Product");
      await dashboard
        .locator("//div[@data-widget-id='click_add_cart']//span[contains(@class, 'button--label')]")
        .click();
      await dashboard.locator(`//*[@data-select-label='Open cart drawer']`).click();
      await webSetting.clickBtnSave();
    });

    await test.step(`Tại Action bar, click Insert Panel > Click add block Button > Chọn btn ATC`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(webBuilder.getXpathByText(caseConf.label));
      await expect(xpathBtn).toBeVisible();
    });

    await test.step(`Chọn product có variant unavailable  > chọn variant unavailable  1. Verify WB - preview  2. SF - product detail`, async () => {
      const step2 = conf.caseConf.step_2;
      await storefrontPage.gotoProduct(step2.product_handle);
      await storefrontPage.selectVariantOptions(step2.variants);
      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Unavailable", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });

    await test.step(`Chọn product product sold out   1. Verify WB - preview  2. SF - product detail`, async () => {
      const step3 = conf.caseConf.step_3;
      await storefrontPage.gotoProduct(step3.product_handle);
      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });

    await test.step(`Chọn product có variant sold out > chọn variant sold out  1. Verify WB - preview  2. SF - product detail`, async () => {
      const step4 = conf.caseConf.step_4;
      await storefrontPage.gotoProduct(step4.product_handle);
      await storefrontPage.genLoc(webSetting.getXpathVariantItem(step4.variant)).click();

      await expect(
        storefrontPage.genLoc(webBuilder.getXpathByText("Sold Out", "//div[contains(@class, 'is-disabled')]")),
      ).toBeVisible();
    });

    await test.step(`setting khi chọn vào add to cart sẽ mở cart drawer > save SF - product detail : Click product variant chưa sold out > click btn ATC`, async () => {
      const step5 = conf.caseConf.step_5;
      await storefrontPage.gotoProduct(step5.product_handle);
      await storefrontPage.page.reload({ waitUntil: "networkidle" });

      await storefrontPage.genLoc(webBuilder.getXpathByText(caseConf.label, "//div")).click();
      await storefrontPage.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefrontPage.page.waitForLoadState("networkidle");

      await expect(storefrontPage.genLoc("//span[normalize-space()='GO TO CART']")).toBeVisible();
      await expect(
        storefrontPage.genLoc(
          webBuilder.getXpathByText(step5.product_title, "//div[contains(@class,'product-cart__details')]"),
        ),
      ).toBeVisible();
    });

    await test.step(` setting khi chọn vào add to cart sẽ hiển thị mở cart page  > save SF - product detail : Click product variant chưa sold out > click btn ATC`, async () => {
      // setting hiển thị mở cart page
      await dashboard.locator("//button[@name='Website Settings']").click();
      await webSetting.clickSettingCategory("Product");
      await dashboard
        .locator("//div[@data-widget-id='click_add_cart']//span[contains(@class, 'button--label')]")
        .click();
      await dashboard.locator(`//*[@data-select-label='Go to cart page']`).click();
      await webSetting.clickBtnSave();

      const step6 = conf.caseConf.step_6;
      await storefrontPage.gotoProduct(step6.product_handle);
      await storefrontPage.page.reload({ waitUntil: "networkidle" });

      await storefrontPage.genLoc(webBuilder.getXpathByText(caseConf.label, "//div")).click();
      await storefrontPage.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefrontPage.page.waitForLoadState("networkidle");

      await expect(
        storefrontPage.genLoc("//span[normalize-space()='YOUR CART'] | //span[normalize-space()='Your cart'] "),
      ).toBeVisible();
      await expect(
        storefrontPage.genLoc(
          `(//div[contains(@class,'product-cart__details')]//a[normalize-space()='${step6.product_title}'])[1] `,
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BB_26 block_add_to_cart_  Verify add to cart với product có custom option`, async ({
    dashboard,
    conf,
    pageMobile,
  }) => {
    const addBlock = conf.caseConf.dnd_block;
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    const storefrontPage = new SFHome(pageMobile, conf.suiteConf.domain);
    cart = new SFCartv3(pageMobile, conf.suiteConf.domain);
    producPage = new SFProduct(pageMobile, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step("Pre-condition: setting Open cart drawer & add btn ATC vào theme", async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await webBuilder.switchToTab("Content");
      await webBuilder.selectDropDown("link", caseConf.button_name);
      await webBuilder.inputTextBox("title", caseConf.label);
      await webBuilder.clickSaveButton();

      const xpathBtn = frameLocator.locator(webBuilder.getXpathByText(caseConf.label));
      await expect(xpathBtn).toBeVisible();
    });

    await test.step(`- Setting trong WB khi chọn vào add to cart sẽ mở cart drawer > save   - Vào Product detail của product  - Nhập custom option - Click btn ATC`, async () => {
      // setting Open cart drawer
      await webSetting.changeSettingclickAddtocart("Open cart drawer");
      await storefrontPage.gotoProduct(caseConf.product_handle);
      await storefrontPage.page.reload({ waitUntil: "networkidle" });

      await producPage.inputCustomOptionSF(caseConf.custom_option);
      await producPage.genLoc(webBuilder.getXpathByText(caseConf.label, "//div")).click();
      await producPage.page.locator("#v-progressbar").waitFor({ state: "detached" });

      await expect(producPage.genLoc(webSetting.xpathGoToCart)).toBeVisible();
      await expect(cart.productsInCartv3()).toContainText(caseConf.product_title);
      await expect(cart.productsInCartv3()).toContainText(caseConf.custom_option.value);
    });

    await test.step(`- Setting trong WB khi chọn vào add to cart sẽ mở cart page > save   - Vào Product detail của product  - Nhập custom option - Click btn ATC`, async () => {
      // setting Go to cart page
      await webSetting.changeSettingclickAddtocart("Go to cart page");

      await storefrontPage.gotoProduct(caseConf.product_handle);
      await storefrontPage.page.reload({ waitUntil: "networkidle" });

      await producPage.inputCustomOptionSF(caseConf.custom_option);
      await producPage.genLoc(webBuilder.getXpathByText(caseConf.label, "//div")).click();
      await producPage.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await producPage.page.waitForLoadState("networkidle");

      await expect(producPage.genLoc(webSetting.xpathYourCart)).toBeVisible();
      await expect(cart.productsInCartv3()).toContainText(caseConf.product_title);
      await expect(cart.productsInCartv3()).toContainText(caseConf.custom_option.value);
    });
  });
});

test.describe("Verify checkout button Dynamic checkout sbase SB_WEB_BUILDER_PRD_ 81 82 83 91 87 88 89 90 ", () => {
  let dashboardPage: DashboardPage,
    storefrontPage: SFHome,
    themePage: ThemeEcom,
    checkout: SFCheckout,
    btnPaypal: WbBtnPaypal,
    orderApi: OrderAPI,
    orderPage: OrdersPage,
    orderId: number,
    totalOrderSF: string,
    itemPostPurchaseValue,
    themeId;

  test.beforeEach(async ({ dashboard, conf }) => {
    await test.step("Pre-condition: setting Theme Layout ", async () => {
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.navigateToMenu("Online Store");
      themePage = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themePage.publishTheme(conf.caseConf.template_name);
    });
  });

  test.afterEach(async ({ conf }) => {
    themeId = conf.suiteConf.theme_id;
    await test.step("After-condition: publish theme auto ", async () => {
      await themePage.publishTheme("auto btn ATC Buynow", themeId);
    });
  });

  test(`@SB_WEB_BUILDER_PRD_91 dynamic_checkout  Checkout thành công với button Buy with Paypal trên Mobile, order không add product PPC, setting one pages checkout`, async ({
    dashboard,
    pageMobile,
    conf,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    // Init page
    storefrontPage = new SFHome(pageMobile, domain);
    checkout = new SFCheckout(pageMobile, domain);
    btnPaypal = new WbBtnPaypal(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`- Click button Buy with paypal  - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard`, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await checkout.inputPhoneNumber(customerInfo.phone_number);

      await checkout.page.locator(checkout.xpathBtnPlaceYourOrder).scrollIntoViewIfNeeded();
      await checkout.page.waitForSelector(checkout.xpathPaymentLabel);
      await checkout.page.waitForSelector(checkout.xpathShippingMethodName);
      await expect(checkout.paypalBlockLoc).toBeVisible();
    });

    await test.step(`- Click Place your order`, async () => {
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();
    });

    await test.step(`- Tại popup PPC  - Click No, thanks`, async () => {
      await checkout.genLoc(btnPaypal.xpathBtnNoThanksPPC).click();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_81 dynamic_checkout  Checkout thành công với button Buy with Paypal trên Mobile, order có add product PPC, setting one pages checkout`, async ({
    dashboard,
    pageMobile,
    conf,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    // Init page
    storefrontPage = new SFHome(pageMobile, domain);
    checkout = new SFCheckout(pageMobile, domain);
    btnPaypal = new WbBtnPaypal(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`- Tại Storefront của store:  - Vào Product detail của product  - Click button Buy with paypal  - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard`, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await checkout.inputPhoneNumber(customerInfo.phone_number);

      await checkout.page.locator(checkout.xpathBtnPlaceYourOrder).scrollIntoViewIfNeeded();
      await checkout.page.waitForSelector(checkout.xpathPaymentLabel);
      await checkout.page.waitForSelector(checkout.xpathShippingMethodName);
      await expect(checkout.paypalBlockLoc).toBeVisible();
    });

    await test.step(`- Click Place your order`, async () => {
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();
    });

    await test.step(`- Tại popup PPC  - Add product PPC vào cart`, async () => {
      await checkout.genLoc(btnPaypal.xpathBtnAddPPC).click();
      await expect(checkout.submitPaypalBtnLoc).toBeVisible();
    });
    await test.step(`- Tại paypal dashboard > Click Pay now`, async () => {
      await checkout.completePaymentForPostPurchaseItem("PayPal");
      await expect(checkout.thankyouPageLoc).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_82 dynamic_checkout  Checkout thành công với button Buy with Paypal trên Mobile, order không add product PPC, setting 3 pages checkout`, async ({
    dashboard,
    pageMobile,
    conf,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    // Init page
    storefrontPage = new SFHome(pageMobile, domain);
    checkout = new SFCheckout(pageMobile, domain);
    btnPaypal = new WbBtnPaypal(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Click button Buy with paypal  - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard`, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await expect(checkout.genLoc(checkout.xpathCheckOutContent)).toBeVisible();
    });

    await test.step(`- Click Continue to shipping method  - Chọn Shipping method   - Click Continue to payment method`, async () => {
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await checkout.clickBtnContinueToShippingMethod();
      await checkout.continueToPaymentMethod();
      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
      await expect(checkout.paypalBlockLoc).toBeVisible();
    });

    await test.step(`- Click Complete order`, async () => {
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();
    });

    await test.step(`- Tại popup PPC  - Click No, thanks`, async () => {
      await checkout.genLoc(btnPaypal.xpathBtnNoThanksPPC).click();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_83 dynamic_checkout  Checkout thành công với button Buy with Paypal trên Mobile, order có add product PPC, setting 3 pages checkout`, async ({
    dashboard,
    pageMobile,
    conf,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    // Init page
    storefrontPage = new SFHome(pageMobile, domain);
    checkout = new SFCheckout(pageMobile, domain);
    btnPaypal = new WbBtnPaypal(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Click button Buy with paypal  - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard`, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await expect(checkout.genLoc(checkout.xpathCheckOutContent)).toBeVisible();
    });

    await test.step(`- Click Continue to shipping method  - Chọn Shipping method   - Click Continue to payment method`, async () => {
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await checkout.clickBtnContinueToShippingMethod();
      await checkout.continueToPaymentMethod();
      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
      await expect(checkout.paypalBlockLoc).toBeVisible();
    });

    await test.step(`- Click Complete order`, async () => {
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();
    });

    await test.step(`- Tại popup PPC  - Add product PPC vào cart`, async () => {
      await checkout.genLoc(btnPaypal.xpathBtnAddPPC).click();
      await expect(checkout.submitPaypalBtnLoc).toBeVisible();
    });

    await test.step(`- Tại paypal dashboard > Click Pay now`, async () => {
      await checkout.completePaymentForPostPurchaseItem("PayPal");
      await expect(checkout.thankyouPageLoc).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_87 dynamic_checkout  Checkout thành công với button Buy with Paypal trên desktop, order không add product PPC, setting one pages checkout`, async ({
    dashboard,
    page,
    conf,
    token,
    request,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const paymentMethod = conf.suiteConf.payment_method;
    const reloadTime = conf.suiteConf.reload_time;
    const paypalAccount = conf.suiteConf.paypal_account;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;

    storefrontPage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    btnPaypal = new WbBtnPaypal(dashboard, domain);
    orderApi = new OrderAPI(domain, request);
    orderPage = new OrdersPage(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Click button Buy with paypal - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard `, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await scrollUntilElementIsVisible({
        page: checkout.page,
        scrollEle: checkout.page.locator(checkout.xpathDMCAButton),
        viewEle: checkout.page.locator(checkout.xpathPaymentLabel),
      });

      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
    });

    await test.step(`- Click Place your order`, async () => {
      await checkout.page.locator(checkout.xpathPaymentLabel).scrollIntoViewIfNeeded();
      await checkout.page.waitForSelector(checkout.xpathShippingMethodName);

      await expect(checkout.paypalBlockLoc).toBeVisible();
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();

      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`- Tại popup PPC  - Click No, thanks`, async () => {
      await checkout.genLoc(btnPaypal.xpathBtnNoThanksPPC).click();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeHidden();
    });

    await test.step(`- Login vào Dashboard  - Vào Order detail của order vừa tạo  - Kiẻm tra order status  - Kiểm tra total order  - Kiểm tra order timeline`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      let orderStatus = await orderPage.getOrderStatus();
      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
      expect(orderStatus).toEqual("Paid");
      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF);

      // need to check again when dev env is stable

      const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
        total_amount: totalOrderSF,
        payment_gateway: paymentMethod,
      });

      const orderTimelineList = [orderTimeline.timelineTransId, orderTimeline.timelinePaymentProcessed];
      for (const timeLine of orderTimelineList) {
        // Expect order timeline is visible
        await expect(await orderPage.orderTimeLines(timeLine)).toBeVisible();
      }
    });

    await test.step(`- Tại order timeline: lấy ra transaction id  - Lên Paypal sanbox dashboard của MC  - Search transactions theo các transaction_ids`, async () => {
      const transID = await orderApi.getTransactionId(orderId, accessToken);
      const orderAmt = Number(
        (
          await orderApi.getOrdInfoInPaypal({
            id: paypalAccount.id,
            secretKey: paypalAccount.secret_key,
            transactionId: transID,
          })
        ).total_amount,
      );
      expect(orderAmt.toFixed(2)).toEqual(removeCurrencySymbol(totalOrderSF));
    });
  });

  test(`@SB_WEB_BUILDER_PRD_88 dynamic_checkout  Checkout thành công với button Buy with Paypal trên desktop, order có add product PPC, setting 1 pages checkout`, async ({
    dashboard,
    page,
    conf,
    token,
    request,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const paymentMethod = conf.suiteConf.payment_method;
    const reloadTime = conf.suiteConf.reload_time;
    const paypalAccount = conf.suiteConf.paypal_account;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;

    storefrontPage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    btnPaypal = new WbBtnPaypal(dashboard, domain);
    orderApi = new OrderAPI(domain, request);
    orderPage = new OrdersPage(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Click button Buy with paypal - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard `, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await scrollUntilElementIsVisible({
        page: checkout.page,
        scrollEle: checkout.page.locator(checkout.xpathDMCAButton),
        viewEle: checkout.page.locator(checkout.xpathPaymentLabel),
      });

      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
    });

    await test.step(`- Click Place your order`, async () => {
      await checkout.page.locator(checkout.xpathPaymentLabel).scrollIntoViewIfNeeded();
      await checkout.page.waitForSelector(checkout.xpathShippingMethodName);
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();

      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();
    });

    await test.step(`- Tại popup PPC  - Add product PPC vào cart`, async () => {
      itemPostPurchaseValue = await checkout.addProductPostPurchase(caseConf.product_ppc_name);
      await expect(checkout.submitPaypalBtnLoc).toBeVisible();
    });

    await test.step(`- Tại paypal dashboard > Click Pay now`, async () => {
      await checkout.completePaymentForPostPurchaseItem("PayPal");
      await expect(checkout.thankyouPageLoc).toBeVisible();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`- Login vào Dashboard  - Vào Order detail của order vừa tạo  - Kiẻm tra order status  - Kiểm tra total order  - Kiểm tra order timeline`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      let orderStatus = await orderPage.getOrderStatus();
      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
      expect(orderStatus).toEqual("Paid");
      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF);

      // need to check again when dev env is stable

      const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
        total_amount: totalOrderSF,
        payment_gateway: paymentMethod,
        item_post_purchase_value: itemPostPurchaseValue,
      });

      const orderTimelineList = [
        orderTimeline.timelineTransId,
        orderTimeline.timelinePaymentProcessed,
        orderTimeline.timelinePaymentProcessedPPC,
      ];
      for (const orderTimeline of orderTimelineList) {
        // Expect order timeline is visible
        await expect(await orderPage.orderTimeLines(orderTimeline)).toBeVisible();
      }
      // With order have PPC item and check out paypal, the order timeline will have 2 transaction id
      const isPostPurchase = true;
      await expect(await orderPage.orderTimeLines(orderTimelineList[0], isPostPurchase, paymentMethod)).toBeVisible();
    });

    await test.step(`- Tại order timeline: lấy ra transaction id  - Lên Paypal sanbox dashboard của MC  - Search transactions theo các transaction_ids`, async () => {
      let orderAmt = 0;
      const transIDs = await orderApi.getListTransactionId(orderId, accessToken);
      for (const transID of transIDs) {
        const totalAmt = Number(
          (
            await orderApi.getOrdInfoInPaypal({
              id: paypalAccount.id,
              secretKey: paypalAccount.secret_key,
              transactionId: transID,
            })
          ).total_amount,
        );
        orderAmt += totalAmt;
      }
      expect(orderAmt.toFixed(2)).toEqual(removeCurrencySymbol(totalOrderSF));
    });
  });

  test(`@SB_WEB_BUILDER_PRD_89 dynamic_checkout  Checkout thành công với button Buy with Paypal trên desktop, order không add product PPC, setting 3 pages checkout`, async ({
    dashboard,
    page,
    conf,
    token,
    request,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const paymentMethod = conf.suiteConf.payment_method;
    const reloadTime = conf.suiteConf.reload_time;
    const paypalAccount = conf.suiteConf.paypal_account;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;

    storefrontPage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    btnPaypal = new WbBtnPaypal(dashboard, domain);
    orderApi = new OrderAPI(domain, request);
    orderPage = new OrdersPage(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Click button Buy with paypal - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard `, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await expect(checkout.genLoc(checkout.xpathCheckOutContent)).toBeVisible();
    });

    await test.step(`- Click Continue to shipping method  - Chọn Shipping method   - Click Continue to payment method`, async () => {
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await checkout.clickBtnContinueToShippingMethod();
      await checkout.continueToPaymentMethod();
      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
      await expect(checkout.paypalBlockLoc).toBeVisible();
    });

    await test.step(`- Click Complete order`, async () => {
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();

      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`- Tại popup PPC  - Click No, thanks`, async () => {
      await checkout.genLoc(btnPaypal.xpathBtnNoThanksPPC).click();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeHidden();
    });

    await test.step(`- Login vào Dashboard  - Vào Order detail của order vừa tạo  - Kiẻm tra order status  - Kiểm tra total order  - Kiểm tra order timeline`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      let orderStatus = await orderPage.getOrderStatus();
      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
      expect(orderStatus).toEqual("Paid");
      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF);

      // need to check again when dev env is stable

      const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
        total_amount: totalOrderSF,
        payment_gateway: paymentMethod,
      });

      const orderTimelineList = [orderTimeline.timelineTransId, orderTimeline.timelinePaymentProcessed];
      for (const timeLine of orderTimelineList) {
        // Expect order timeline is visible
        await expect(await orderPage.orderTimeLines(timeLine)).toBeVisible();
      }
    });

    await test.step(`- Tại order timeline: lấy ra transaction id  - Lên Paypal sanbox dashboard của MC  - Search transactions theo các transaction_ids`, async () => {
      const transID = await orderApi.getTransactionId(orderId, accessToken);
      const orderAmt = Number(
        (
          await orderApi.getOrdInfoInPaypal({
            id: paypalAccount.id,
            secretKey: paypalAccount.secret_key,
            transactionId: transID,
          })
        ).total_amount,
      );
      expect(orderAmt.toFixed(2)).toEqual(removeCurrencySymbol(totalOrderSF));
    });
  });

  test(`@SB_WEB_BUILDER_PRD_90 dynamic_checkout  Checkout thành công với button Buy with Paypal trên desktop, order có add product PPC, setting 3 pages checkout`, async ({
    dashboard,
    page,
    conf,
    token,
    request,
  }) => {
    const domain = conf.suiteConf.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const paymentMethod = conf.suiteConf.payment_method;
    const reloadTime = conf.suiteConf.reload_time;
    const paypalAccount = conf.suiteConf.paypal_account;
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;

    storefrontPage = new SFHome(page, domain);
    checkout = new SFCheckout(page, domain);
    btnPaypal = new WbBtnPaypal(dashboard, domain);
    orderApi = new OrderAPI(domain, request);
    orderPage = new OrdersPage(page, domain);
    const caseConf = conf.caseConf;

    await test.step(`- Vào Product detail của product  - Click button Buy with paypal - Login vào Paypal dashboard  - Click Paynow tại paypal dashboard `, async () => {
      await storefrontPage.gotoProduct(caseConf.product_handle);
      // Click button buy with paypal
      await checkout.submitItemWhenClickBuyWithPaypal();
      await expect(checkout.genLoc(checkout.xpathCheckOutContent)).toBeVisible();
    });

    await test.step(`- Click Continue to shipping method  - Chọn Shipping method   - Click Continue to payment method`, async () => {
      await checkout.inputPhoneNumber(customerInfo.phone_number);
      await checkout.clickBtnContinueToShippingMethod();
      await checkout.continueToPaymentMethod();
      await expect(checkout.page.locator(checkout.xpathPaymentLabel)).toBeVisible();
      await expect(checkout.paypalBlockLoc).toBeVisible();
    });

    await test.step(`- Click Complete order`, async () => {
      await checkout.clickAgreedTermsOfServices();
      await checkout.clickCompleteOrder();
      await expect(checkout.thankyouPageLoc).toBeVisible();
      await expect(checkout.genLoc(btnPaypal.btnClosePPCPopup)).toBeVisible();
    });

    await test.step(`- Tại popup PPC  - Add product PPC vào cart`, async () => {
      itemPostPurchaseValue = await checkout.addProductPostPurchase(caseConf.product_ppc_name);
      await expect(checkout.submitPaypalBtnLoc).toBeVisible();
    });

    await test.step(`- Tại paypal dashboard > Click Pay now`, async () => {
      await checkout.completePaymentForPostPurchaseItem("PayPal");
      await expect(checkout.thankyouPageLoc).toBeVisible();
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`- Login vào Dashboard  - Vào Order detail của order vừa tạo  - Kiẻm tra order status  - Kiểm tra total order  - Kiểm tra order timeline`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      let orderStatus = await orderPage.getOrderStatus();
      //cause sometimes order captures slower than usual
      orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus, reloadTime);
      expect(orderStatus).toEqual("Paid");
      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF);

      // need to check again when dev env is stable

      const orderTimeline = orderPage.generateOrdTimeline(customerInfo, {
        total_amount: totalOrderSF,
        payment_gateway: paymentMethod,
        item_post_purchase_value: itemPostPurchaseValue,
      });

      const orderTimelineList = [
        orderTimeline.timelineTransId,
        orderTimeline.timelinePaymentProcessed,
        orderTimeline.timelinePaymentProcessedPPC,
      ];
      for (const orderTimeline of orderTimelineList) {
        // Expect order timeline is visible
        await expect(await orderPage.orderTimeLines(orderTimeline)).toBeVisible();
      }
      // With order have PPC item and check out paypal, the order timeline will have 2 transaction id
      const isPostPurchase = true;
      await expect(await orderPage.orderTimeLines(orderTimelineList[0], isPostPurchase, paymentMethod)).toBeVisible();
    });

    await test.step(`- Tại order timeline: lấy ra transaction id  - Lên Paypal sanbox dashboard của MC  - Search transactions theo các transaction_ids`, async () => {
      let orderAmt = 0;
      const transIDs = await orderApi.getListTransactionId(orderId, accessToken);
      for (const transID of transIDs) {
        const totalAmt = Number(
          (
            await orderApi.getOrdInfoInPaypal({
              id: paypalAccount.id,
              secretKey: paypalAccount.secret_key,
              transactionId: transID,
            })
          ).total_amount,
        );
        orderAmt += totalAmt;
      }
      expect(orderAmt.toFixed(2)).toEqual(removeCurrencySymbol(totalOrderSF));
    });
  });
});
