import { expect, test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir } from "@utils/theme";
import { ProductAPI } from "@pages/api/product";
import { WebsiteSetting } from "@pages/dashboard/website_setting";
import { PreselectVariant } from "@pages/dashboard/preselect-variant";
import { ShopTheme } from "@types";

test.describe("Verify preselect variant", async () => {
  test.slow();
  let webBuilder: WebBuilder,
    webSetting: WebsiteSetting,
    blocks: Blocks,
    productAPI: ProductAPI,
    preSelectVariant: PreselectVariant,
    duplicatedTheme: ShopTheme,
    themeId: number,
    product;
  const listVariantId = [];

  test.beforeEach(async ({ conf, dashboard, theme }, testInfo) => {
    const suiteConf = conf.suiteConf;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    preSelectVariant = new PreselectVariant(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    await test.step("Duplicate and publish theme", async () => {
      duplicatedTheme = await theme.duplicate(conf.suiteConf.theme_id);
      themeId = duplicatedTheme.id;
      await theme.publish(themeId);
    });

    await test.step("Pre-condition: Open WB", async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "product" });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.loadingScreen.waitFor({ state: "hidden" });
      await webBuilder.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.openLayerSettings({ sectionName: conf.suiteConf.section_name, sectionIndex: 1 });
    });
  });

  test.afterEach(async ({ conf, theme }) => {
    await test.step(`Delete variant`, async () => {
      if (conf.caseName === "SB_NEWECOM_NEP_86") {
        await productAPI.deleteVariantById(product.id, listVariantId.join(","));
      }
    });

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

  test(`@SB_NEWECOM_NEP_85 Verify UI/UX của trường Default variant`, async ({ dashboard, conf }) => {
    await test.step(`Tại side bar chọn option data source theo data `, async () => {
      await preSelectVariant.chooseDataSourceProduct(conf.suiteConf.product_name);
      await expect(
        dashboard.locator(
          `${preSelectVariant.xpathButtonSelectDefaultVariant}//span[normalize-space(text()) = 'None']`,
        ),
      ).toBeVisible();
    });

    await test.step(`Hover vào icon i `, async () => {
      await dashboard.locator(preSelectVariant.xpathTooltip).hover();
      const tooltipId = await dashboard.locator(preSelectVariant.xpathTooltip).getAttribute("aria-describedby");
      const actualTooltip = await dashboard.innerText(`//*[@id='${tooltipId}']//label`);
      expect(actualTooltip).toEqual(conf.caseConf.expect_tooltip);
    });

    await test.step(`Click vào icon dropdown `, async () => {
      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click();
      await expect(dashboard.locator(preSelectVariant.xpathPopupSearchSource)).toBeVisible();
      await expect(dashboard.locator(preSelectVariant.xpathInputSearchVariant)).toBeVisible();
      await expect(
        dashboard.locator("//input[@placeholder='Search variant']//ancestor::div[@class = 'search-source']"),
      ).toBeVisible();
    });

    await test.step(`Chọn variant theo data `, async () => {
      const optionSelect = `(${preSelectVariant.xpathPopupSearchSource}//div[contains(@class, 'w-builder__search-data-source-result') and not(contains(@class, 'variant-selected'))])[2]`;
      const textOption = await dashboard.innerText(`${optionSelect}//div[contains(@class, 'sb-text-caption')]`);
      await dashboard.locator(optionSelect).click();
      await expect(
        dashboard.locator(
          `${preSelectVariant.xpathButtonSelectDefaultVariant}//span[contains(@class, 'variant-select-title')]`,
        ),
      ).toHaveText(textOption);
    });

    await test.step(`Thay đổi data source theo data `, async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          column: 1,
        },
        template: "Product price",
      });
      await blocks.clickBackLayer();
      await blocks.clickSectionInSidebar("header", 0);
      const listLabel = ["Collection", "Blog", "Blog post"];
      for (const label of listLabel) {
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await dashboard.waitForTimeout(500); //đợi sau mỗi lần thay đổi data source
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
        await expect(
          webBuilder.frameLocator.locator(
            `//div[contains(@data-block-component, 'price')]//div[@class='pointer-events-none layer-selector is-invalid']`,
          ),
        ).toBeVisible();

        await expect(webBuilder.frameLocator.locator(preSelectVariant.xpathButtonSelectDefaultVariant)).toBeHidden();
      }
    });
  });

  test(`@SB_NEWECOM_NEP_86 Verify list variant hiển thị tại droplist`, async ({ dashboard, conf, authRequest }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const productsData = await productAPI.getProducts({
      limit: 1,
      handle: conf.caseConf.handle_product,
      published_status: "published",
    });
    product = productsData && productsData.length ? productsData[0] : null;
    const countProductVariant = product ? product.variants.length : 0;

    await test.step(`Click vào Droplist của trường default variant `, async () => {
      await preSelectVariant.chooseDataSourceProduct(conf.suiteConf.product_name);
      await expect(
        dashboard.locator(
          `${preSelectVariant.xpathButtonSelectDefaultVariant}//span[normalize-space(text()) = 'None']`,
        ),
      ).toBeVisible();
    });

    await test.step(`Chọn data source theo data -> Click vào Droplist của trường default variant `, async () => {
      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click();
      await dashboard.waitForSelector(preSelectVariant.xpathPopupSearchSource);
      expect(await dashboard.locator(preSelectVariant.xpathItemVariant).count()).toEqual(countProductVariant);
    });

    await test.step(`Edit variant tại dashboard theo data`, async () => {
      const payloads = conf.caseConf.payload;
      for (const payload of payloads) {
        //add variants
        const res = await productAPI.addProductVariant(product.id, payload);
        listVariantId.push(res.id);
      }
      await webSetting.clickBtnSave();
      await dashboard.reload();
      await dashboard.waitForLoadState("networkidle");

      //select variable
      await blocks.clickSectionInSidebar("header", 0);
      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click();
      await dashboard.waitForSelector(
        `${preSelectVariant.xpathPopupSearchSource}//div[contains(@class, 'variant-selected')]`,
      );
      const optionCount = await dashboard.locator(preSelectVariant.xpathItemVariant).count();
      expect(optionCount).toEqual(countProductVariant + payloads.length);
    });
  });

  test(`@SB_NEWECOM_NEP_87 Verify Search variant`, async ({ dashboard, conf }) => {
    await preSelectVariant.chooseDataSourceProduct(conf.suiteConf.product_name);
    await test.step(`Nhập thông tin search variant theo data `, async () => {
      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click();
      const inputData = conf.caseConf.input_data;
      for (const input of inputData) {
        await dashboard.locator(`${preSelectVariant.xpathPopupSearchSource}//input`).fill(input);
        const optionCount = await dashboard
          .locator(
            `${preSelectVariant.xpathPopupSearchSource}//div[contains(@class, 'w-builder__search-data-source-result') and not(contains(@style, 'display: none;'))]`,
          )
          .count();
        const optionExpectCount = await dashboard
          .locator(
            `(${preSelectVariant.xpathPopupSearchSource}//div[contains(@class, 'w-builder__search-data-source-result') and descendant::div[contains(text(), '${input}')]])`,
          )
          .count();
        expect(optionCount).toEqual(optionExpectCount);
      }
    });

    await test.step(`Xóa thông tin search variant tại text box search`, async () => {
      const delData = conf.caseConf.delete_input;
      await dashboard.locator(`${preSelectVariant.xpathPopupSearchSource}//input`).fill("");
      for (const data of delData) {
        await expect(dashboard.locator(preSelectVariant.getXpathOptionVariant(data))).toBeVisible();
      }
    });

    await test.step(`Nhập thông tin search varriant -> đóng popup -> Mở lại popup `, async () => {
      await dashboard.locator(`${preSelectVariant.xpathPopupSearchSource}//input`).fill(conf.caseConf.fill_input);
      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click(); //click to hide popup
      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click(); //click to show popup
      await expect(dashboard.locator(preSelectVariant.xpathInputSearchVariant)).toHaveText("");
    });
  });

  test(`@SB_NEWECOM_NEP_88 Verify select variant của block variant picker`, async ({ dashboard, conf }) => {
    await dashboard.locator(blocks.xpathButtonLayer).click();
    await blocks.clickSectionInSidebar("body", 0);
    const currentOption = await dashboard.locator(preSelectVariant.xpathCurrenOption).textContent();

    //check nếu section chưa được chọn data source product thì chọn
    if (currentOption.trim() !== conf.suiteConf.product_name) {
      await preSelectVariant.chooseDataSourceProduct(conf.suiteConf.product_name);
    }

    await test.step(`1. Tại side bar: trường Default variant  theo data 2. Preview page Product detail 3. Open SF  Product detail  page`, async () => {
      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click();
      //verify khi chọn option = None
      await preSelectVariant.chooseVariantDefault("None");
      await dashboard.waitForTimeout(3000); //chờ bên webfront update
      await expect(await webBuilder.frameLocator.locator(preSelectVariant.xPathActiveOption).count()).toEqual(
        conf.caseConf.expected.option_none,
      );

      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click();
      await preSelectVariant.chooseVariantDefault(conf.caseConf.option_expect);
      await dashboard.waitForTimeout(3000); //chờ bên webfront update
      expect(await webBuilder.frameLocator.locator(preSelectVariant.xPathActiveOption).count()).toEqual(
        conf.caseConf.expected.option_value,
      );
    });
  });

  test(`@SB_NEWECOM_NEP_89 Verify UI/UX của popup select variant`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    await test.step(`Precondition: Add block add to cart, datasoure = product, default variant =None `, async () => {
      // kéo block button
      await webBuilder.insertSectionBlock({
        parentPosition: conf.caseConf.add_block.parent_position,
        template: conf.caseConf.add_block.template,
      });
      await blocks.switchToTab("Content");
      await webBuilder.selectDropDown("link", "Add to cart");
      await webBuilder.inputTextBox("title", "Add to cart");
      await blocks.clickBackLayer();
      await blocks.clickSectionInSidebar("header", 0);
      await preSelectVariant.chooseDataSourceProduct(conf.suiteConf.product_name);
      await expect(dashboard.getByRole("button", { name: conf.suiteConf.product_name })).toBeVisible();
      await webSetting.clickBtnSave();
    });

    await test.step(`Preview page -> click vào button Add to cart `, async () => {
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(blocks.xpathButtonPreview),
      ]);
      await previewTab.waitForLoadState("load");
      await previewTab.waitForSelector(preSelectVariant.xpath.buttons.addToCart(1));
      await previewTab.waitForTimeout(5 * 1000);
      await previewTab.locator(preSelectVariant.xpath.buttons.addToCart(1)).click();
      await previewTab.locator(`//div[@id='variant-selector-popup']`).waitFor({ state: "visible" });
      await previewTab
        .locator(`//div[@id='variant-selector-popup']//div[contains(@class, 'variants-selector')]`)
        .waitFor({ state: "visible" });
      await previewTab.waitForTimeout(5 * 1000); // chờ load hết data trong popup
      await snapshotFixture.verifyWithAutoRetry({
        page: previewTab,
        selector:
          "//div[@id='variant-selector-popup']//div[@class='outside-modal__body popover-bottom__content relative']",
        snapshotName: `${process.env.ENV}-${conf.caseName}-show-popup-add-to-card.png`,
      });
      await previewTab.close();
    });

    await test.step(`Open SF -> click vào button Add to cart `, async () => {
      const url = new URL(`https://${conf.suiteConf.domain}/products/livingston-demilune-console-umber`);
      const params = new URLSearchParams(url.search);
      params.delete("preview");
      const storefront = await context.newPage();
      await storefront.goto(`${url.origin}${url.pathname}?${params.toString()}`);
      await storefront.waitForLoadState("load");
      await storefront.waitForSelector(preSelectVariant.xpath.buttons.addToCart(1));
      await storefront.waitForTimeout(5 * 1000);
      await storefront.locator(preSelectVariant.xpath.buttons.addToCart(1)).click();
      await storefront.locator(`//div[@id='variant-selector-popup']`).waitFor({ state: "visible" });
      await storefront
        .locator(`//div[@id='variant-selector-popup']//div[contains(@class, 'variants-selector')]`)
        .waitFor({ state: "visible" });
      await storefront.waitForTimeout(5 * 1000); // chờ load hết data trong popup
      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector:
          "//div[@id='variant-selector-popup']//div[@class='outside-modal__body popover-bottom__content relative']",
        snapshotName: `${process.env.ENV}-${conf.caseName}-show-popup-add-to-card.png`,
      });
      await storefront.close();
    });

    await test.step(`Click btn add to cart tại popup`, async () => {
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(blocks.xpathButtonPreview),
      ]);

      await previewTab.waitForSelector(preSelectVariant.xpath.buttons.addToCart(1));
      await previewTab.waitForTimeout(5 * 1000);
      await previewTab.locator(preSelectVariant.xpath.buttons.addToCart(1)).click();
      await previewTab.waitForTimeout(2 * 1000); // chờ thời gian để  variant option hiển thị
      await previewTab.locator(`//button[@id='variant-selector-popup-atc']`).click();
      await previewTab.locator(`(//div[contains(@class, 'custom-options-warning')])[1]`).waitFor({ state: "visible" });
      await previewTab.waitForTimeout(5 * 1000); // chờ load hết data trong popup
      await snapshotFixture.verifyWithAutoRetry({
        page: previewTab,
        selector:
          "//div[@id='variant-selector-popup']//div[@class='outside-modal__body popover-bottom__content relative']",
        snapshotName: `${process.env.ENV}-${conf.caseName}-popup-add-to-card-with-alert.png`,
      });
      await previewTab.close();
    });

    await test.step(`Select variant theo data`, async () => {
      await dashboard.locator(preSelectVariant.xpathButtonSelectDefaultVariant).click();
      await dashboard.locator(preSelectVariant.getXpathOptionVariant(conf.caseConf.input_option)).click();
      await expect(dashboard.getByRole("button", { name: conf.caseConf.input_option })).toBeVisible();
      await webSetting.clickBtnSave();
    });

    await test.step(`Click button add to cart`, async () => {
      const url = `https://${conf.suiteConf.domain}/products/livingston-demilune-console-umber`;
      const storefront = await context.newPage();
      await storefront.goto(url);
      await storefront.evaluate(() => {
        window.localStorage.removeItem("cartToken");
        window.localStorage.removeItem("cartCheckoutToken");
      }); // xoá tất cả item trong card
      await storefront.waitForLoadState("networkidle");
      await storefront.locator(preSelectVariant.xpath.buttons.addToCart(1)).click();

      await storefront.waitForResponse(res => res.url().includes("cart.json") && res.status() === 200);
      await expect(storefront.locator(`//div[@id='variant-selector-popup']`)).toBeHidden();
      await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefront.waitForLoadState("networkidle");
      await storefront.waitForURL(`https://${conf.suiteConf.domain}/cart`);
      try {
        await storefront.waitForSelector("//*[text()='Your cart']");
      } catch (error) {
        await storefront.reload();
        await storefront.waitForLoadState("networkidle");
        await storefront.waitForSelector("//*[text()='Your cart']");
      }
      await expect(
        storefront.locator(
          `(//div[contains(@class, 'block-cart-items')]//a[normalize-space()='${conf.suiteConf.product_name}'])[1]`,
        ),
      ).toBeVisible(); //check hiển thi product title trong card
      expect(
        await storefront.innerText(
          `//div[contains(@class, 'block-cart')]//div[contains(@class, 'block-cart__badge')]//span`,
        ),
      ).toEqual("1"); // check số item trong card tăng lên 1
      await storefront.close();
    });
  });
});
