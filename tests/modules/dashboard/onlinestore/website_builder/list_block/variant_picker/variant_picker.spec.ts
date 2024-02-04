/* eslint-disable max-len */
import { expect, test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { WebBuilderVariantPicker } from "@/pages/dashboard/wb_variant_picker";
import { XpathNavigationButtons } from "@constants/web_builder";
import { getStyle } from "@utils/css";
import { SfnVariantPickerMobilePage } from "@pages/dashboard/sfn_variant_picker_mobile";
import { PageSettingsData } from "@types";
import { waitTimeout } from "@core/utils/api";

let webBuilder: WebBuilderVariantPicker, blockId: string, sectionId: string;
let settingsData: PageSettingsData;
let settingsDataPublish: PageSettingsData;

test.describe("Check function block variant picker v2", async () => {
  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_data);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilderVariantPicker(dashboard, conf.suiteConf.domain);

    await test.step("Update theme", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.page_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      //get publish theme data
      const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.page_id);
      settingsDataPublish = responsePublish.settings_data as PageSettingsData;

      //Update collection page data for publish theme
      settingsDataPublish.pages["product"].default.elements = settingsData.pages["product"].default.elements;
      await builder.updateSiteBuilder(conf.suiteConf.page_id, settingsDataPublish);
    });

    await test.step(`Precond - vào page product detail trong wb`, async () => {
      await webBuilder.page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.page_id}?page=product`,
      );
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.spinner);
    });

    await test.step("Add new variant picker block", async () => {
      await webBuilder.page.locator(`//p[contains(text(),'${conf.suiteConf.section_name.content}')]`).click();
      sectionId = await webBuilder.getAttrsDataId();

      //Insert block variant picker
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_template);
      blockId = await webBuilder.getAttrsDataId();
      await webBuilder.clickBtnSaveIfEnable();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_01 Insert panel_ Verify hiển thị UI default khi add block variant`, async ({
    dashboard,
    conf,
    context,
    pageMobile,
    snapshotFixture,
  }) => {
    test.slow();

    await test.step(`Add block variant picker -> Hiển thị tại ví trí add block`, async () => {
      await webBuilder.changeProductSource(conf.caseConf.product_multi_variant);
      await webBuilder.clickBtnSaveIfEnable();
      await expect(webBuilder.frameLocator.locator(webBuilder.wbVariantPicker)).toBeVisible();

      //sfn
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await expect(storefront.locator(webBuilder.sfVariantBlock)).toBeVisible();
      await storefront.close();
    });

    await test.step(`Click add block Variant trong blank section -> verify default style`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.wbSideBar,
        snapshotName: `${conf.caseConf.case_id}-block-variant-picker-default-style-sidebar.png`,
        combineOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });

      // verify image tại block variant picker
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.wbVariantPicker,
        snapshotName: `${conf.caseConf.case_id}-block-variant-picker-default-style.png`,
        iframe: webBuilder.iframe,
        combineOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });

      const btnLayout = `(${webBuilder.wbVariantPicker}//div[contains(@class, 'button-layout')])[1]`;
      await webBuilder.page.locator(webBuilder.wbVpLayoutButton).click();
      await webBuilder.frameLocator.locator(btnLayout).waitFor({ state: "visible" });
      // color preview button
      await webBuilder.page.locator(webBuilder.wbVpColorPreview).click();
      await expect(webBuilder.page.locator(webBuilder.wbVpColorPreviewNone)).toBeVisible();
      await expect(webBuilder.page.locator(webBuilder.wbVpColorPreviewColorOnly)).toBeVisible();
      await expect(webBuilder.page.locator(webBuilder.wbVpColorPreviewColorAndText)).toBeVisible();
      await webBuilder.page.locator(webBuilder.wbVpColorPreview).click();
      // image preview button
      await webBuilder.page.locator(webBuilder.wbVpImagePreview).click();
      await expect(webBuilder.page.locator(webBuilder.wbVpImagePreviewNone)).toBeVisible();
      await expect(webBuilder.page.locator(webBuilder.wbVpImagePreviewImageOnly)).toBeVisible();
      await expect(webBuilder.page.locator(webBuilder.wbVpImagePreviewImageAndText)).toBeVisible();
      await webBuilder.page.locator(webBuilder.wbVpImagePreview).click();

      // Chuyển sang layout dạng dropdown verify các option của image preview và color preview
      await webBuilder.page.locator(webBuilder.wbVpLayoutDropdown).click();
      await webBuilder.frameLocator.locator(btnLayout).waitFor({ state: "hidden" });
      // color preview button
      await webBuilder.page.locator(webBuilder.wbVpColorPreview).click();
      await expect(webBuilder.page.locator(webBuilder.wbVpColorPreviewNone)).toBeVisible();
      await expect(webBuilder.page.locator(webBuilder.wbVpColorPreviewColorOnly)).toBeHidden();
      await expect(webBuilder.page.locator(webBuilder.wbVpColorPreviewColorAndText)).toBeVisible();
      await webBuilder.page.locator(webBuilder.wbVpColorPreview).click();
      // imgae preview button

      await webBuilder.page.locator(webBuilder.wbVpImagePreview).click();
      await expect(webBuilder.page.locator(webBuilder.wbVpImagePreviewNone)).toBeVisible();
      await expect(webBuilder.page.locator(webBuilder.wbVpImagePreviewImageOnly)).toBeHidden();
      await expect(webBuilder.page.locator(webBuilder.wbVpImagePreviewImageAndText)).toBeVisible();
      await webBuilder.page.locator(webBuilder.wbVpImagePreview).click();

      //back to button layout
      await webBuilder.page.locator(webBuilder.wbVpLayoutButton).click();
      await webBuilder.frameLocator.locator(btnLayout).waitFor({ state: "visible" });
    });

    await test.step(`Tại sidebar, click tab Content`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.switchToTab("Content");
      const dataSource = `//div[contains(@class, 'w-builder__sidebar-content')]//div[contains(@class, 'popover__reference__title') and normalize-space()='${conf.caseConf.product_multi_variant}']`;
      const tooltip = `//div[contains(@class, 'sb-tooltip__content sb-text-caption')]/div[normalize-space()='${conf.caseConf.product_multi_variant}']`;

      await expect(webBuilder.page.locator(dataSource)).toBeVisible();
      await webBuilder.page.locator(dataSource).hover();
      await expect(webBuilder.page.locator(tooltip)).toBeVisible();
    });

    await test.step(`Check wdith trên mobile`, async () => {
      await webBuilder.switchMobileBtn.click();
      await webBuilder.page.waitForSelector(webBuilder.wbMobileMain);
      await webBuilder.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.wbSideBar,
        snapshotName: `${conf.caseConf.case_id}-block-variant-picker-default-style-sidebar-mobile.png`,
        combineOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.wbVariantPicker,
        snapshotName: `${conf.caseConf.case_id}-block-variant-picker-default-style-mobile.png`,
        iframe: webBuilder.iframe,
        combineOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });

      const sfnMobilePage = new SfnVariantPickerMobilePage(pageMobile, conf.suiteConf.domain);
      await sfnMobilePage.gotoProduct(conf.caseConf.product_multi_variant_seo);
      await sfnMobilePage.page.waitForLoadState("networkidle", { timeout: 15000 });

      await sfnMobilePage.page.mouse.wheel(0, 400);

      await snapshotFixture.verifyWithAutoRetry({
        page: sfnMobilePage.page,
        selector: webBuilder.sfVariantBlock,
        snapshotName: `${conf.caseConf.case_id}-sfn-block-variant-picker-default-style-mobile.png`,
        combineOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_11 Verify UI selected variant style button`, async ({
    dashboard,
    conf,
    pageMobile,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const settings = conf.caseConf.setting_check_UI_selected_variant;
    await test.step(`Pre-condition`, async () => {
      await webBuilder.page.locator(XpathNavigationButtons["website"]).click();
      await webBuilder.clickSettingCategory("Product");
      await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
      await webBuilder.page.waitForTimeout(2000); //wait để setting được active
      await webBuilder.clickBtnSaveIfEnable();
      await webBuilder.openWebBuilder({ type: "site", id: conf.suiteConf.page_id, page: "product" });
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.spinner);
      await webBuilder.changeProductSource(conf.caseConf.product_test_selected_variant);
      await webBuilder.page.waitForLoadState("networkidle", { timeout: 15000 });
    });

    await test.step("Check variant color ở trạng thái default", async () => {
      //active variant
      await expect(webBuilder.frameLocator.locator(webBuilder.wbVpStyleActive)).toHaveCSS(
        "background-color",
        conf.caseConf.style_color.color_4,
      );
      await expect(webBuilder.frameLocator.locator(webBuilder.wbVpStyleActive)).toHaveCSS(
        "color",
        conf.caseConf.style_color.color_1,
      );

      //inactive variant
      await expect(webBuilder.frameLocator.locator(webBuilder.wbVpStyleInactive)).toHaveCSS(
        "background-color",
        conf.caseConf.style_color.background_color,
      );
      await expect(webBuilder.frameLocator.locator(webBuilder.wbVpStyleInactive)).toHaveCSS(
        "color",
        conf.caseConf.style_color.color_5,
      );
      await expect(webBuilder.frameLocator.locator(webBuilder.wbVpStyleInactive)).toHaveCSS(
        "border",
        conf.caseConf.style_color.border_default_style,
      );
    });

    await test.step("Hover vào 1 variant", async () => {
      await webBuilder.frameLocator.locator(webBuilder.wbVpStyleInactive).hover();

      await expect(webBuilder.frameLocator.locator(webBuilder.wbVpStyleInactive)).toHaveCSS(
        "border",
        conf.caseConf.style_color.border_hover,
      );
    });

    for (const setting of settings) {
      await test.step(`Click add block Variant trong blank section`, async () => {
        //change color_preview
        await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
        await webBuilder.switchToTab("Design");
        const colorPreviewOption = await webBuilder.getVpColorPreviewItem(setting.color_preview);
        await webBuilder.page.locator(webBuilder.wbVpColorPreview).click();
        await webBuilder.page.locator(colorPreviewOption).click();
        //change image_preview
        await webBuilder.page.locator(webBuilder.wbVpImagePreview).click();
        const imagePreviewOption = webBuilder.getVpImagePreviewItem(setting.image_preview);
        await webBuilder.page.locator(imagePreviewOption).click();

        await expect(webBuilder.frameLocator.locator(webBuilder.wbVpStyleActive)).toHaveCSS(
          "border",
          conf.caseConf.style_color.border_selected,
        );

        await webBuilder.clickBtnSaveIfEnable();
        const storefont = await webBuilder.clickPreview({ context, dashboard });
        await storefont.waitForLoadState("networkidle", { timeout: 15000 });

        await snapshotFixture.verifyWithAutoRetry({
          page: storefont,
          selector: webBuilder.sfVariantBlock,
          snapshotName: `${conf.caseConf.case_id}-sfn-selected-variant-${setting.snapshot_name}.png`,
          combineOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
        await storefont.close();
      });

      await test.step(`Check trên mobile`, async () => {
        await webBuilder.switchMobileBtn.click();
        await webBuilder.page.waitForSelector(webBuilder.wbMobileMain);

        await expect(webBuilder.frameLocator.locator(webBuilder.wbVpStyleActive)).toHaveCSS(
          "border",
          conf.caseConf.style_color.border_selected,
        );

        const sfnMobilePage = new SfnVariantPickerMobilePage(pageMobile, conf.suiteConf.domain);
        await sfnMobilePage.gotoProduct(conf.caseConf.product_test_selected_variant_seo);
        await sfnMobilePage.page.waitForLoadState("networkidle", { timeout: 15000 });

        await expect(sfnMobilePage.page.locator(webBuilder.wbVpStyleActive)).toHaveCSS(
          "border",
          conf.caseConf.style_color.border_selected,
        );

        await snapshotFixture.verify({
          page: sfnMobilePage.page,
          selector: webBuilder.sfVariantBlock,
          snapshotName: `${conf.caseConf.case_id}-sfn-selected-variant-${setting.snapshot_name}-mobile.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
      await webBuilder.switchDesktopBtn.click();
    }
    //Back to default settting
    await webBuilder.page.locator(XpathNavigationButtons["website"]).click();
    await webBuilder.clickSettingCategory("Product");
    await webBuilder.selectDropDown("default_variant", "Do not select any variant");
    await webBuilder.page.waitForTimeout(2000); //wait để setting được active
    await webBuilder.clickBtnSaveIfEnable();
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_07 Verify chỉnh sửa Quick bar của block`, async ({ conf, context, dashboard }) => {
    test.slow();
    await webBuilder.changeProductSource(conf.caseConf.product_multi_variant);

    await test.step(`Click vào block, click Hide`, async () => {
      await webBuilder.backBtn.click();
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.frameLocator.getByRole("button").filter({ hasText: "Hide" }).click();
      await expect(webBuilder.frameLocator.locator(webBuilder.wbVariantPicker)).toBeHidden();
      //sfn
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await expect(storefront.locator(webBuilder.sfVariantBlock)).toBeHidden();
      await storefront.close();
    });

    await test.step(`Action Bar -> Layer -> Section chứa block -> Click hiển thị lại block`, async () => {
      // Hiển thị lại block

      await webBuilder.page.locator(webBuilder.wbHeaderLayerBtn).click();
      await dashboard.locator(`//div[@data-id='${blockId}']`).hover();
      await dashboard.locator(`//div[@data-id='${blockId}']//button[contains(@data-block-action, "visible")]`).click();
      await expect(webBuilder.frameLocator.locator(webBuilder.wbVariantPicker)).toBeVisible();
      //sfn
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await expect(storefront.locator(webBuilder.sfVariantBlock)).toBeVisible();
      await storefront.close();
    });

    await test.step(`Click vào block, click duplicate (hoặc Ctrl+D)`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.backBtn.click();
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.page.frameLocator("#preview").getByRole("button").filter({ hasText: "Duplicate" }).click();

      const numberOfBlockVpWB = await webBuilder.frameLocator
        .locator(`//section[@id='${sectionId}']//section[@component='variants']`)
        .count();
      expect(numberOfBlockVpWB).toEqual(2);

      // sfn
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      const numberOfBlockVpSF = await storefront
        .locator(`//section[@id='${sectionId}']//section[@component='variants']`)
        .count();
      expect(numberOfBlockVpSF).toEqual(2);
      await storefront.close();
    });

    await test.step(`Click vào block, Delete`, async () => {
      const xpathFirstVp = `//section[@block-id='${blockId}']`;
      await webBuilder.backBtn.click();
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.frameLocator.locator(xpathFirstVp).click();
      await webBuilder.frameLocator.getByRole("button").filter({ hasText: "Delete" }).click();
      await expect(webBuilder.frameLocator.locator(xpathFirstVp)).toBeHidden();

      // sfn
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await expect(webBuilder.frameLocator.locator(xpathFirstVp)).toBeHidden();
      await storefront.close();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_03 Verify chỉnh sửa setting của block tại tab Content`, async ({
    dashboard,
    conf,
    context,
  }) => {
    test.slow();

    await test.step("Pre-condition: add block button and set action = Add to cart", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_cart);
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_button_template);
      await webBuilder.page.locator("//label[contains(text(), 'Action')]/ancestor::div[2]//button").click();
      await webBuilder.page.locator('.widget-select__list [value="add_to_cart"]').click();

      await expect(webBuilder.frameLocator.locator('[component="button"] .wb-button--add-cart__primary')).toBeVisible();
    });

    await test.step(`Check gắn các biến cho variant của product -> Chỉ nhận biến product`, async () => {
      // click variant picker
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.switchToTab("Content");
      await webBuilder.page.locator(webBuilder.wbNavbarDataSourceBtn).click({ timeout: 5000 });
      await webBuilder.page.waitForSelector(webBuilder.wbModalDataSource);
      await webBuilder.page.locator(webBuilder.wbSelectSourceBtnInModal).click({ timeout: 5000 });
      await webBuilder.page.waitForSelector(webBuilder.wbListSourceInModal);

      await expect(webBuilder.page.locator(webBuilder.itemCurrentPageProduct)).toBeVisible();
      await expect(webBuilder.page.locator(webBuilder.itemProduct)).toBeVisible();

      await webBuilder.page.locator(webBuilder.wbModalIconClose).click();
    });

    // //check data table
    await test.step(`Check gắn các biến cho variant của product theo data table`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.page.locator(webBuilder.wbVpLayoutButton).click();
      const listSetting = conf.caseConf.expect.setting;
      for (const setting of listSetting) {
        const isHideSelect = setting.hide_select_if_one;
        const isOnlyShow = setting.only_show;
        // Click to websetting
        await webBuilder.page.locator(XpathNavigationButtons["website"]).click();
        // Click cate product
        if (webBuilder.page.locator(webBuilder.wbProductCateogryInWebSetting).isVisible()) {
          await webBuilder.clickSettingCategory("Product");
        }
        // toggle option and save
        await webBuilder.toggleByLabel("Hide selector when option has one value", `${isHideSelect}`);
        await webBuilder.toggleByLabel("Only show available variant combination", `${isOnlyShow}`);
        // click btn save
        await webBuilder.clickBtnSaveIfEnable();

        webBuilder = new WebBuilderVariantPicker(dashboard, conf.suiteConf.domain);
        await webBuilder.openWebBuilder({ type: "site", id: conf.suiteConf.page_id, page: "product" });
        await webBuilder.waitForElementVisibleThenInvisible(webBuilder.spinner);
        await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
        await webBuilder.switchToTab("Design");
        await webBuilder.page.locator(webBuilder.wbVpLayoutButton).click();

        const listProduct = setting.products;
        for (const product of listProduct) {
          await webBuilder.changeProductSource(product.name);
          await webBuilder.page.waitForTimeout(1000);
          // Show 4 ô vuông gạch chéo trên wb
          if (product.show_slash_square) {
            const xpathSquare = webBuilder.wbNoVariant.replace("blockId", blockId);
            await webBuilder.frameLocator.locator(xpathSquare).first().waitFor();
            const countSquare = await webBuilder.frameLocator.locator(xpathSquare).count();
            expect(countSquare === 4).toBeTruthy();
          }

          // show vp trên wb
          if (product.show_vp_on_wb) {
            await expect(webBuilder.frameLocator.locator(webBuilder.wbVariantPicker)).toBeVisible();
          } else {
            await expect(webBuilder.frameLocator.locator(webBuilder.wbVariantPickerLabel)).toBeHidden();
          }

          // show vp trên sfn
          await webBuilder.clickBtnSaveIfEnable();

          const storefront = await webBuilder.clickPreview({ context, dashboard });
          if (product.show_vp_on_sfn) {
            await expect(storefront.locator(webBuilder.sfVariantBlock)).toBeVisible();
          } else {
            await expect(storefront.locator(webBuilder.sfVariantPickerLabel)).toBeHidden();
          }
          // show btn sold out trên wb and sfn
          if (product.show_btn_atc_sold_out) {
            await expect(storefront.locator(webBuilder.sfnBtnSoldOut)).toBeVisible();
          }
          // sold out size cụ thể  -> hien thi btn sold out
          if (product.size_sold_out) {
            // wb
            const xpathSize = webBuilder.getSizeXpathByText(product.size_sold_out, blockId);
            await webBuilder.frameLocator.locator(xpathSize).click();
            await expect(webBuilder.frameLocator.locator(webBuilder.wbBtnSoldOut)).toBeVisible();

            //sfn
            const sfnXpathSize = `${webBuilder.sfVariantBlock}/descendant::div[contains(@class, 'variants-selector')]/descendant::div[/descendant::p[contains(text(), 'Size')]]/descendant::span[text()='${product.size_sold_out}']`;
            await storefront.locator(sfnXpathSize).click();
            await expect(storefront.locator(webBuilder.sfnBtnSoldOut)).toBeVisible();
          }

          // not sold out size cụ thể  -> hien thi btn sold out
          if (product.size_not_sold_out) {
            // wb
            const xpathSize = webBuilder.getSizeXpathByText(product.size_not_sold_out, blockId);
            await webBuilder.frameLocator.locator(xpathSize).click();
            await expect(webBuilder.frameLocator.locator(webBuilder.wbDefaultATCButton)).toBeVisible();

            //sfn
            const sfnXpathSize = `${webBuilder.sfVariantBlock}/descendant::div[contains(@class, 'variants-selector')]/descendant::div[/descendant::p[contains(text(), 'Size')]]/descendant::span[text()='${product.size_not_sold_out}']`;
            await storefront.waitForSelector(sfnXpathSize);
            await storefront.locator(sfnXpathSize).click();
            await expect(storefront.locator(webBuilder.sfnBtnAddToCart)).toBeVisible();
          }

          // Check size in wb + sfn
          if (product.sizes && product.sizes.length > 0) {
            for (const size of product.sizes) {
              // wb
              const xpathSize = webBuilder.getSizeXpathByText(size, blockId);
              await webBuilder.frameLocator.locator(`${xpathSize}`).waitFor();
              await expect(webBuilder.frameLocator.locator(`${xpathSize}`)).toBeVisible();
            }

            for (const size of product.sizes) {
              //sfn
              const sfnXpathSize = `${webBuilder.sfVariantBlock}/descendant::div[contains(@class, 'variants-selector')]/descendant::div[/descendant::p[contains(text(), 'Size')]]/descendant::span[text()='${size}']`;
              await expect(storefront.locator(sfnXpathSize)).toBeVisible();
            }
          }
          // Check color in wb + sfn
          if (product.colors && product.colors.length > 0) {
            for (const color of product.colors) {
              //wb
              const xpathColor = webBuilder.getColorXpathByText(color, blockId);
              await expect(webBuilder.frameLocator.locator(xpathColor)).toBeVisible();
            }

            for (const color of product.colors) {
              //sfn
              const sfnXpathColor = `${webBuilder.sfVariantBlock}/descendant::div[contains(@class, 'variants-selector')]/descendant::div[/descendant::p[contains(text(), 'Color')]]/descendant::span[text()='${color}']`;
              await expect(storefront.locator(sfnXpathColor)).toBeVisible();
            }
          }
          await storefront.close();
        }
      }
    });

    // check thứ tự hiển thị variant
    await test.step(`Check thứ tự hiển thị các option hiển thị trên variant picker`, async () => {
      // change layout
      await webBuilder.changeProductSource(conf.caseConf.expect.sort.product_name);
      await webBuilder.page.waitForTimeout(1000);
      // Check wb
      const sort = conf.caseConf.expect.sort;
      // check size
      for (let index = 1; index <= sort.size.length; index++) {
        const size = sort.size[index - 1];
        const sizeXpath = `(${webBuilder.wbVariantPicker}//div[contains(@class, 'option-item-wrap')])[1]/div[${index}]//span[text()='${size}']`;

        await expect(webBuilder.frameLocator.locator(sizeXpath)).toBeVisible();
      }
      // check color
      for (let index = 1; index <= sort.color.length; index++) {
        const color = sort.color[index - 1];
        const colorXpath = `(${webBuilder.wbVariantPicker}//div[contains(@class, 'option-item-wrap')])[2]/div[${index}]//span[text()='${color}']`;
        await expect(webBuilder.frameLocator.locator(colorXpath)).toBeVisible();
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_04 Verify resize width của block`, async ({ context, conf, dashboard }) => {
    await test.step(`Resize tăng width của block`, async () => {
      // change layout
      await webBuilder.changeProductSource(conf.caseConf.product_multi_vp_no_side_chart);
      await webBuilder.page.waitForTimeout(1000);
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.changeDesign(conf.caseConf.style_default);

      const widthVp = await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).boundingBox();
      expect(widthVp.width).toEqual(conf.caseConf.style_default.width.value.value);
    });

    await test.step(`Thay đổi style của variant -> check trên webfront`, async () => {
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      const listStyle = conf.caseConf.expect.styles;
      for (const style of listStyle) {
        // update design trên wb
        await webBuilder.changeDesign(style);
        await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).first().waitFor();
        const widthVp = await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).boundingBox();
        expect(widthVp.width).toEqual(style.width.value.value);
        // save wb
        await webBuilder.clickBtnSaveIfEnable();
        // check trên sfn
        const storefront = await webBuilder.clickPreview({ context, dashboard });

        await storefront.locator(webBuilder.sfVariantBlock).first().waitFor();
        const widthVpSf = await storefront.locator(webBuilder.sfVariantBlock).boundingBox();
        expect(widthVpSf.width).toEqual(style.width.value.value);
        await storefront.close();
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_08 Verify varriant được connect đúng với data source`, async ({
    conf,
    dashboard,
    context,
  }) => {
    test.slow();

    await test.step("Pre-condition: add block button and set action = Add to cart", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_cart);
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_button_template);
      await webBuilder.page.locator("//label[contains(text(), 'Action')]/ancestor::div[2]//button").click();
      await webBuilder.page.locator('.widget-select__list [value="add_to_cart"]').click();

      await expect(webBuilder.frameLocator.locator('[component="button"] .wb-button--add-cart__primary')).toBeVisible();
    });

    await test.step(`Thay đổi data source của section chứa block variant picker = none`, async () => {
      await webBuilder.page.waitForLoadState("networkidle", { timeout: 15000 });
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.changeProductSource(conf.caseConf.product_multi_variant);
      await webBuilder.page.waitForTimeout(1000);
      // click section product detail
      const blockNeedToClick = webBuilder.getSelectorByIndex({
        section: 1,
      });
      await webBuilder.clickOnElement(blockNeedToClick, webBuilder.iframe);

      // search data source
      await webBuilder.page.locator("#search-data-source").click();
      await webBuilder.page.waitForSelector(webBuilder.wbDataSourceNone);
      await webBuilder.page.locator(webBuilder.wbDataSourceNone).click();
      // expect in case missing data
      const labelVariantMissData = `${webBuilder.wbVariantPicker}//p[normalize-space()='Variant:']`;
      await expect(webBuilder.frameLocator.locator(labelVariantMissData)).toBeVisible();

      const iconMissingDataSource = `${webBuilder.wbVariantPicker}//div[contains(@class, 'flex option-item-wrap flex-wrap')]//*[local-name()='svg'][4]`;

      await expect(webBuilder.frameLocator.locator(iconMissingDataSource)).toBeVisible();
    });

    await test.step(`Thay đổi data source của section chứa block variant picker cả  product theo data  `, async () => {
      await webBuilder.page.locator("#search-data-source").click();
      await webBuilder.page.waitForSelector(webBuilder.wbDataSourceProduct);
      await webBuilder.page.locator(webBuilder.wbDataSourceProduct).click();
      const labelVariantMissData = `${webBuilder.wbVariantPicker}//p[normalize-space()='Variant:']`;
      await webBuilder.frameLocator.locator(labelVariantMissData).first().waitFor();

      const productMultiVariantName = conf.caseConf.product_multi_variant;
      const inputSearchInDataSource = `//input[@placeholder="Search product"]`;
      await webBuilder.page.locator(inputSearchInDataSource).fill(productMultiVariantName);

      await webBuilder.page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
      const productMultiVariant = `//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item') and descendant::span[contains(text(), '${productMultiVariantName}')]]`;
      await webBuilder.page.waitForSelector(productMultiVariant);
      await webBuilder.page.locator(productMultiVariant).click();
      await webBuilder.page.waitForSelector(
        `//span[contains(@class, 'data-source-title connected') and contains(text(), '${productMultiVariantName}')]`,
      );
      await webBuilder.page.waitForTimeout(1000);
      // Check size in wb
      for (const size of conf.caseConf.expect.product_multi_variant.sizes) {
        const xpathSize = webBuilder.getSizeXpathByText(size, blockId);
        await expect(webBuilder.frameLocator.locator(xpathSize)).toBeVisible();
      }
      for (const color of conf.caseConf.expect.product_multi_variant.colors) {
        const xpathColor = webBuilder.getColorXpathByText(color, blockId);
        await expect(webBuilder.frameLocator.locator(xpathColor)).toBeVisible();
      }
    });

    await test.step(`Thay đổi data source của section chứa block variant picker = 1 collection theo data`, async () => {
      const listDataSource = [
        webBuilder.wbDataSourceCollection,
        webBuilder.wbDataSourceBlog,
        webBuilder.wbDataSourceBlogPost,
      ];
      for (const dataSource of listDataSource) {
        await webBuilder.page.locator("#search-data-source").click();
        const isVisibleBtnBack = await webBuilder.page.locator(webBuilder.wbBtnBackDataSource).isVisible();
        if (isVisibleBtnBack) {
          await webBuilder.page.locator(webBuilder.wbBtnBackDataSource).click();
        }
        await webBuilder.page.locator(dataSource).click({ timeout: 5000 });

        await webBuilder.page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
        const firstCollection = `//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item')][1]`;
        await webBuilder.page.locator(firstCollection).click({ timeout: 5000 });
        await webBuilder.page.waitForTimeout(1000);
        await webBuilder.page.waitForLoadState("networkidle", { timeout: 15000 });
        // expect in case missing data
        const labelVariantMissData = `${webBuilder.wbVariantPicker}//p[normalize-space()='Variant:']`;
        await expect(webBuilder.frameLocator.locator(labelVariantMissData)).toBeVisible();
        const iconMissingDataSource = `${webBuilder.wbVariantPicker}//div[contains(@class, 'flex option-item-wrap flex-wrap')]//*[local-name()='svg']`;
        const countResult = await webBuilder.frameLocator.locator(iconMissingDataSource).count();
        expect(countResult).toEqual(4);
      }
    });

    await test.step(`Thay đổi data source của section chứa block variant picker về current product page`, async () => {
      await webBuilder.page.locator("#search-data-source").click();
      const isVisibleBtnBack = await webBuilder.page.locator(webBuilder.wbBtnBackDataSource).isVisible();
      if (isVisibleBtnBack) {
        await webBuilder.page.locator(webBuilder.wbBtnBackDataSource).click();
      }
      await webBuilder.page.locator(webBuilder.wbDataSourceCurrentProduct).click({ timeout: 5000 });
      // Check size in wb + sfn
      for (const size of conf.caseConf.expect.product_multi_variant.sizes) {
        const xpathSize = webBuilder.getSizeXpathByText(size, blockId);
        await expect(webBuilder.frameLocator.locator(xpathSize)).toBeVisible();
      }
      for (const color of conf.caseConf.expect.product_multi_variant.colors) {
        const xpathColor = webBuilder.getColorXpathByText(color, blockId);
        await expect(webBuilder.frameLocator.locator(xpathColor)).toBeVisible();
      }
    });

    await test.step(`Chưa chọn variant -> Click add to cart`, async () => {
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await storefront.waitForLoadState("networkidle", { timeout: 15000 });

      await storefront.locator(webBuilder.sfnBtnAddToCart).click({ timeout: 5000 });

      const alertMessage = `//div[contains(@class, 'custom-options-warning')]`;
      await storefront.waitForSelector(`${alertMessage}[1]`);

      const countResult = await storefront.locator(alertMessage).count();
      expect(countResult).toEqual(2);
      await storefront.close();
    });

    await test.step(`Chọn đầy đủ variant -> Click Add to cart`, async () => {
      // Check size in wb
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await storefront.waitForLoadState("networkidle", { timeout: 15000 });

      const sfnXpathSize = `${webBuilder.sfVariantBlock}/descendant::div[contains(@class, 'variants-selector')]/descendant::div[/descendant::p[contains(text(), 'Size')]]/descendant::span[text()='S']`;
      await storefront.locator(sfnXpathSize).click();
      // Check color in wb
      const sfnXpathColor = `${webBuilder.sfVariantBlock}/descendant::div[contains(@class, 'variants-selector')]/descendant::div[/descendant::p[contains(text(), 'Color')]]/descendant::span[text()='White']`;
      await storefront.locator(sfnXpathColor).click();
      await storefront.locator(webBuilder.sfnBtnAddToCart).click();

      //Remove items in cart
      await storefront.locator(`(${webBuilder.xpathRemoveItem})`).click();
      await storefront.locator('[data-section-id="default_cart_drawer"] .close-popup-button').click();

      // click btn ATC
      await storefront.waitForSelector(webBuilder.sfnBtnAddToCart);
      await storefront.locator(webBuilder.sfnBtnAddToCart).click();
      await storefront.waitForLoadState("networkidle", { timeout: 15000 });

      await expect(storefront.locator(`//a[normalize-space()='${conf.caseConf.product_multi_variant}']`)).toBeVisible();
      await storefront.locator(webBuilder.xpathCloseBtnCartDrawer).click();
      const numberOfItems = Number(
        (await storefront.locator(`//div[contains(@class, 'block-cart__badge')]//span`).textContent()).trim(),
      );
      expect(numberOfItems).toEqual(1);
      await storefront.close();
    });
  });
});

test.describe("Check variant picker on creator shop", async () => {
  test(`@SB_WEB_BUILDER_LB_BL_VR_09 Verify block Price không có ở shop creator`, async ({ page, conf, token }) => {
    await test.step(`Click "Add block" trong blank section`, async () => {
      // dashboardPage = new DashboardPage(page, `au-creator-variant-picker-prod.onshopbase.com`);
      const accessToken = (
        await token.getWithCredentials({
          domain: conf.suiteConf.creator_shop_name,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;

      webBuilder = new WebBuilderVariantPicker(page, conf.suiteConf.domain);
      await webBuilder.loginWithToken(accessToken, conf.suiteConf.creator_domain);
      await webBuilder.page.goto(
        `https://${conf.suiteConf.creator_domain}/admin/builder/site/${conf.suiteConf.creator_page_id}?page=product`,
      );
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.spinner);
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_blank_section);

      const parentSelector = webBuilder.getSelectorByIndex({
        section: 1,
        column: 1,
      });

      const parentBox = await webBuilder.frameLocator.locator(parentSelector).boundingBox();
      await webBuilder.page.mouse.move(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2);
      await webBuilder.frameLocator.locator(webBuilder.autoPoint).hover();
      await webBuilder.frameLocator.locator(webBuilder.autoPoint).click();
      await expect(webBuilder.page.locator(webBuilder.listItemAddBlock)).toBeVisible();
    });

    await test.step(`Search "Variant picker" trên drawer Insert block`, async () => {
      await webBuilder.searchbarTemplate.fill(conf.caseConf.text_fill);
      await expect(
        webBuilder.page.locator(`//div[contains(@class, 'w-builder__insert-previews--search-empty-content')]`),
      ).toBeVisible();
    });
  });
});

test.describe("Verify varriant picker product on Shopbase", async () => {
  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_data);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilderVariantPicker(dashboard, conf.suiteConf.domain);

    await test.step("Update theme", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.page_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      //get publish theme data
      const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.page_id);
      settingsDataPublish = responsePublish.settings_data as PageSettingsData;

      //Update collection page data for publish theme
      settingsDataPublish.pages["product"].default.elements = settingsData.pages["product"].default.elements;
      await builder.updateSiteBuilder(conf.suiteConf.page_id, settingsDataPublish);
    });

    await test.step(`Precond - vào page product detail trong wb`, async () => {
      await webBuilder.page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.page_id}?page=product`,
      );
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.spinner);
    });

    await test.step("Add new variant picker block", async () => {
      await webBuilder.page.locator(`//p[contains(text(),'${conf.suiteConf.section_name.content}')]`).click();
      sectionId = await webBuilder.getAttrsDataId();

      //Insert block variant picker
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_template);
      blockId = await webBuilder.getAttrsDataId();
      await webBuilder.clickBtnSaveIfEnable();
    });

    await test.step("Pre-condition: add block button and set action = Add to cart", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_cart);
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.block_button_template);
      await webBuilder.page.locator("//label[contains(text(), 'Action')]/ancestor::div[2]//button").click();
      await webBuilder.page.locator('.widget-select__list [value="add_to_cart"]').click();

      await expect(webBuilder.frameLocator.locator('[component="button"] .wb-button--add-cart__primary')).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_06 Verify varriant picker product custom options`, async ({
    context,
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    await test.step(`Insert block Variant picker trong blank section`, async () => {
      //Pre-condition:
      await dashboard.locator(XpathNavigationButtons["website"]).click();
      await webBuilder.clickSettingCategory("Product");
      await webBuilder.selectDropDown("default_variant", "Do not select any variant");
      await webBuilder.page.waitForTimeout(2000); //wait để setting được active
      await webBuilder.clickSaveButton();
      await webBuilder.openWebBuilder({ type: "site", id: conf.suiteConf.page_id, page: "product" });
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.spinner);

      // change layout
      await webBuilder.changeProductSource(conf.caseConf.product_name);
      await webBuilder.frameLocator.locator(webBuilder.wbBtnPreviewYourDesign).first().waitFor({ state: "visible" });
      await waitTimeout(3 * 1000); //wait for image load success

      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: webBuilder.wbVariantPicker,
        snapshotName: `${conf.caseConf.case_id}-wb-check-default-style-${process.env.ENV}.png`,
      });

      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await storefront.locator(webBuilder.wbBtnPreviewYourDesign).first().waitFor({ state: "visible" });
      await waitTimeout(3 * 1000); //wait for image load success

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: webBuilder.sfVariantBlock,
        snapshotName: `${conf.caseConf.case_id}-sfn-check-default-style-${process.env.ENV}.png`,
      });
      await storefront.close();
    });

    await test.step(`chưa nhập custom option > click button [Preview Your Design] `, async () => {
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });

      await storefront.locator(webBuilder.wbBtnPreviewYourDesign).click();
      await storefront.locator(webBuilder.wbOutsideModalImage).first().waitFor({ state: "visible" });

      await expect(storefront.locator('.product-image-preview [alt="Preview image"]')).toBeVisible();
      await storefront.close();
    });

    await test.step(`nhập custom options > click button [Preview Your Design]`, async () => {
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      // fill option
      await storefront.locator(webBuilder.inputText).fill(conf.caseConf.expect.text_fill);
      // click preview
      await storefront.locator(webBuilder.wbBtnPreviewYourDesign).click();
      await storefront.locator(webBuilder.wbOutsideModalImage).first().waitFor({ state: "visible" });
      await waitTimeout(5000); //wait for image upload

      await snapshotFixture.verify({
        page: storefront,
        selector: ".modal-pod-preview-product .popover-bottom__content .outside-modal__body__content",
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-sfn-preview-custom-option.png`,
        snapshotOptions: {
          maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
          threshold: conf.suiteConf.param_threshold,
          maxDiffPixels: conf.suiteConf.max_diff_pixels,
        },
      });
      await storefront.close();
    });

    await test.step(`click upload image -> select ảnh từ device`, async () => {
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await storefront.setInputFiles(`${webBuilder.sfVariantBlock}//input[@type='file']`, conf.caseConf.expect.img);
      await expect(storefront.locator(webBuilder.cropper)).toBeVisible();
      await waitTimeout(2000); //wait for image upload
      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: webBuilder.cropper,
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-sfn-cropper.png`,
      });
      await storefront.close();
    });

    await test.step(`Chưa chọn đủ variant, custom option required -> click Add to cart`, async () => {
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await storefront.waitForSelector(webBuilder.wbBtnPreviewYourDesign);
      await storefront.click(webBuilder.sfnBtnAddToCart);
      for (const text of conf.caseConf.expect.atc_invalid_variant) {
        const xpathWarning = `//section[@component='variants']/descendant::div[text()='${text}']`;
        await expect(storefront.locator(xpathWarning)).toBeVisible();
      }
      await storefront.close();
    });

    await test.step(`Chọn đủ variant, custom option required -> click Add to cart`, async () => {
      await webBuilder.clickSaveButton();
      // open sf
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      await storefront.waitForSelector(webBuilder.wbBtnPreviewYourDesign);

      // click chọn variant
      const size = webBuilder.getVariantByText(conf.caseConf.expect.variant_s, "sfn");
      await storefront.locator(size).click();
      await storefront.locator(webBuilder.inputText).fill(conf.caseConf.expect.text_fill);
      // upload file
      await storefront.setInputFiles(`${webBuilder.sfVariantBlock}//input[@type='file']`, conf.caseConf.expect.img);
      await expect(storefront.locator(webBuilder.cropper)).toBeVisible();
      //crop image
      await storefront.locator(webBuilder.btnCrop).click();
      await storefront.locator(webBuilder.wbOutsideModal).first().waitFor({ state: "hidden" });
      await waitTimeout(3000); //wait image load success
      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: ".upload-box-wrapper",
        snapshotName: `${conf.caseConf.case_id}-${process.env.ENV}-sfn-upload-image-success.png`,
      });
      await storefront.waitForLoadState("networkidle", { timeout: 15000 });
      // click btn atc
      await storefront.locator(webBuilder.sfnBtnAddToCart).click({ timeout: 5000 });
      await storefront.waitForLoadState("networkidle", { timeout: 15000 });

      await expect(storefront.locator(`//a[normalize-space()='${conf.caseConf.product_name}']`)).toBeVisible();
      await storefront.locator(webBuilder.xpathCloseBtnCartDrawer).click();
      const numberOfItems = Number(
        (await storefront.locator(`//div[contains(@class, 'block-cart__badge')]//span`).textContent()).trim(),
      );
      expect(numberOfItems).toEqual(1);
      await storefront.close();
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_02 Verify chỉnh sửa style của block tại tab Design`, async ({
    context,
    dashboard,
    conf,
  }) => {
    test.slow();
    await test.step(`Đổi label color sang màu khác`, async () => {
      // Pre-condition:
      await dashboard.locator(XpathNavigationButtons["website"]).click();
      await webBuilder.clickSettingCategory("Product");
      await webBuilder.selectDropDown("default_variant", "Do not select any variant");
      await webBuilder.clickBtnSaveIfEnable();
      //wb
      await webBuilder.changeProductSource(conf.caseConf.product_test_case_02);
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.page.locator(webBuilder.wbVpColor).click();
      await webBuilder.page.locator(webBuilder.wbVpColorWillSelect).click();
      // wait css apply to html
      await webBuilder.page.waitForTimeout(1000);
      const textChange = `${webBuilder.wbVariantPicker}/descendant::p[contains(@class, 'variants-selector__label')]`;
      const color = await getStyle(webBuilder.frameLocator.locator(`${textChange}[1]`), "color");
      expect(color).toEqual(conf.caseConf.expect.step1.color);

      //sfn
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      const sfnTextChange = `${webBuilder.sfVariantBlock}/descendant::p[contains(@class, 'variants-selector__label')]`;
      const colorSfn = await getStyle(storefront.locator(`${sfnTextChange}[1]`), "color");
      expect(colorSfn).toEqual(conf.caseConf.expect.step1.color);
      await storefront.close();
    });

    await test.step(`Chọn Layout dạng dropdown`, async () => {
      //wb
      await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
      await webBuilder.page.locator(webBuilder.wbVpLayoutDropdown).click();
      const itemSelect = `${webBuilder.wbVariantPicker}/descendant::div[contains(@class, 'variants-selector')]/div/div[1]/descendant::div[contains(@class, 'items')]`;
      await webBuilder.frameLocator.locator(itemSelect).first().waitFor({ state: "attached" });
      await expect(webBuilder.frameLocator.locator(itemSelect).first()).toBeAttached();
      //sfn
      await waitTimeout(2 * 1000);
      await webBuilder.clickBtnSaveIfEnable();
      const storefront = await webBuilder.clickPreview({ context, dashboard });
      const sfnTextSelect = `${webBuilder.sfVariantBlock}/descendant::div[contains(@class, 'variants-selector')]/div/div[1]/descendant::div[contains(@class, 'items')]`;
      await webBuilder.frameLocator.locator(itemSelect).first().waitFor({ state: "attached" });
      await expect(storefront.locator(sfnTextSelect)).toBeAttached();
      await storefront.close();
    });

    await test.step(`Ở Dashboard, add thêm varriant cho product để product có >5 varriant option`, async () => {
      await webBuilder.page.locator(webBuilder.wbVpLayoutDropdown).click();
      const itemSelect = `${webBuilder.wbVariantPicker}/descendant::div[contains(@class, 'variants-selector')]/div/div[1]/descendant::div[contains(@class, 'items')]/div[6]`;
      await webBuilder.frameLocator.locator(itemSelect).first().waitFor({ state: "attached" });
      await expect(webBuilder.frameLocator.locator(itemSelect)).toBeAttached();
    });

    await test.step(`Edit 1 option item cho product với value dài hơn input field`, async () => {
      await webBuilder.page.locator(webBuilder.wbVpLayoutDropdown).click();
      const itemSelect = `${webBuilder.wbVariantPicker}/descendant::div[contains(@class, 'variants-selector')]/div/div[1]/descendant::div[contains(@class, 'items')]`;
      await webBuilder.frameLocator.locator(itemSelect).first().waitFor({ state: "attached" });
      await expect(webBuilder.frameLocator.locator(itemSelect)).toBeAttached();
    });

    await test.step(`Edit các setting Color preview, image preview, shape`, async () => {
      //Choose setting button
      const buttonSettings = conf.caseConf.expect.variant_picker_style.button;
      for (const setting of buttonSettings) {
        await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
        await webBuilder.switchToTab("Design");
        // change layout
        const layout = webBuilder.getVpLayoutByText(setting.layout);
        await webBuilder.page.locator(layout).click();
        // change shape
        await webBuilder.page.locator(webBuilder.wbVpShape).click();
        const shape = webBuilder.getVpShapeItem(setting.shape);
        await webBuilder.page.locator(shape).click();
        //change color_preview
        await dashboard.waitForLoadState("networkidle", { timeout: 15000 });
        const colorPreviewOption = await webBuilder.getVpColorPreviewItem(setting.color_preview);
        await webBuilder.page.locator(webBuilder.wbVpColorPreview).click();
        await webBuilder.page.locator(colorPreviewOption).click();
        //change image_preview
        await webBuilder.page.locator(webBuilder.wbVpImagePreview).click();
        const imagePreviewOption = webBuilder.getVpImagePreviewItem(setting.image_preview);
        await webBuilder.page.locator(imagePreviewOption).click();
        // check layout button
        const btnDropdownActive = `//div[@data-widget-id="layout"]/div[@value='button']`;
        const isDropdownActive = await webBuilder.page.locator(btnDropdownActive).isVisible();
        if (!isDropdownActive) {
          await webBuilder.page.locator(webBuilder.wbVpLayoutDropdown).click();
          await webBuilder.page.waitForLoadState("networkidle", { timeout: 15000 });
        }
        const listVariantButton = `${webBuilder.wbVariantPicker}/descendant::div[contains(@class, 'option-item-wrap')]`;
        await webBuilder.frameLocator.locator(listVariantButton).first().waitFor({ state: "visible" });
        const countResult = await webBuilder.frameLocator.locator(listVariantButton).count();
        expect(countResult === 2).toBeTruthy();

        // check shape
        const shapeItem = webBuilder.getVpShapeItemInPreview(setting.shape);
        await expect(webBuilder.frameLocator.locator(`${shapeItem}[1]`)).toBeVisible();
        // check color_preview
        const vp = webBuilder.getVpColorPreviewInPreview(setting.color_preview);
        await expect(webBuilder.frameLocator.locator(`${vp}[1]`)).toBeVisible();
        // Check image preview
        const image = webBuilder.getVpImagePreviewInPreview(setting.image_preview);
        if (setting.image_preview === "none") {
          await expect(webBuilder.frameLocator.locator(`${image}[1]`)).toBeHidden();
        } else {
          await expect(webBuilder.frameLocator.locator(`${image}[1]`)).toBeVisible();
        }
        //check sfn
        await webBuilder.clickBtnSaveIfEnable();
        const storefront = await webBuilder.clickPreview({ context, dashboard });
        // check shape
        const shapeItemSfn = webBuilder.getVpShapeItemInPreview(setting.shape, conf.suiteConf.page.sfn);
        await expect(storefront.locator(`${shapeItemSfn}[1]`)).toBeVisible();
        // check color_preview
        const vpSfn = webBuilder.getVpColorPreviewInPreview(
          setting.color_preview,
          conf.caseConf.expect.variant_black,
          conf.suiteConf.page.sfn,
        );
        await expect(storefront.locator(`${vpSfn}[1]`)).toBeVisible();
        // Check image preview
        const imageSfn = webBuilder.getVpImagePreviewInPreview(setting.image_preview, conf.suiteConf.page.sfn);
        if (setting.image_preview === "none") {
          await expect(storefront.locator(`${imageSfn}[1]`)).toBeHidden();
        } else {
          await expect(storefront.locator(`${imageSfn}[1]`)).toBeVisible();
        }
        await storefront.close();
      }

      //Choose setting dropdown
      const dropdownSettings = conf.caseConf.expect.variant_picker_style.dropdown;
      for (const setting of dropdownSettings) {
        await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
        await webBuilder.switchToTab("Design");
        // change layout
        const layout = webBuilder.getVpLayoutByText(setting.layout);
        await webBuilder.page.locator(layout).click();
        // change shape
        await webBuilder.page.locator(webBuilder.wbVpShape).click();
        const shape = webBuilder.getVpShapeItem(setting.shape);
        await webBuilder.page.locator(shape).click();
        //change color_preview
        await dashboard.waitForLoadState("networkidle", { timeout: 15000 });
        const colorPreviewOption = await webBuilder.getVpColorPreviewItem(setting.color_preview);
        await webBuilder.page.locator(webBuilder.wbVpColorPreview).click();
        await webBuilder.page.locator(colorPreviewOption).click();
        //change image_preview
        await webBuilder.page.locator(webBuilder.wbVpImagePreview).click();
        const imagePreviewOption = webBuilder.getVpImagePreviewItem(setting.image_preview);
        await webBuilder.page.locator(imagePreviewOption).click();
        // check wb
        const btnDropdownActive = `//div[@data-widget-id="layout"]/div[@value='dropdown']`;
        const isDropdownActive = await webBuilder.page.locator(btnDropdownActive).isVisible();
        if (!isDropdownActive) {
          await webBuilder.page.locator(webBuilder.wbVpLayoutDropdown).click();
          await webBuilder.page.waitForLoadState("networkidle", { timeout: 15000 });
        }
        const textSelect = `${webBuilder.wbVariantPicker}/descendant::span[normalize-space()='Please select the option']`;
        await webBuilder.frameLocator.locator(textSelect).first().waitFor({ state: "visible" });
        const countResult = await webBuilder.frameLocator.locator(textSelect).count();
        expect(countResult > 0).toBeTruthy();
        // check shape
        const shapeItem = webBuilder.getVpShapeItemInPreview(setting.shape);
        await expect(webBuilder.frameLocator.locator(`${shapeItem}[1]`)).toBeVisible();
        // check color_preview
        const vp = webBuilder.getVpColorPreviewInPreview(setting.color_preview);
        await expect(webBuilder.frameLocator.locator(`${vp}[1]`)).toBeAttached();
        // Check image preview
        const image = webBuilder.getVpImagePreviewInPreview(setting.image_preview);
        await expect(webBuilder.frameLocator.locator(`${image}[1]`)).toBeAttached();

        //check sfn
        await webBuilder.clickBtnSaveIfEnable();
        const storefront = await webBuilder.clickPreview({ context, dashboard });
        // check shape
        const shapeItemSfn = webBuilder.getVpShapeItemInPreview(setting.shape, conf.suiteConf.page.sfn);
        await expect(storefront.locator(`${shapeItemSfn}[1]`)).toBeVisible();
        // check color_preview
        const vpSfn = webBuilder.getVpColorPreviewInPreview(
          setting.color_preview,
          conf.caseConf.expect.variant_black,
          conf.suiteConf.page.sfn,
        );
        await expect(storefront.locator(`${vpSfn}[1]`)).toBeAttached();
        // Check image preview
        const imageSfn = webBuilder.getVpImagePreviewInPreview(setting.image_preview, conf.suiteConf.page.sfn);
        if (setting.image_preview === "none") {
          await expect(storefront.locator(`${imageSfn}[1]`)).toBeHidden();
        } else {
          await expect(storefront.locator(`${imageSfn}[1]`)).toBeAttached();
        }
        await storefront.close();
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_BL_VR_10 Verify chỉnh sửa setting common của block tại tab Design`, async ({
    conf,
    context,
    dashboard,
  }) => {
    test.slow();
    await test.step(`Edit các thuộc tính common của 1 block  `, async () => {
      await webBuilder.changeProductSource(conf.caseConf.product_multi_variant);
      await webBuilder.page.waitForTimeout(1000);
      const settings = conf.caseConf.expect.styles;
      for (const index in settings) {
        const setting = settings[index];
        await webBuilder.frameLocator.locator(webBuilder.wbVariantPicker).click();
        await webBuilder.switchToTab("Design");
        await webBuilder.changeDesign(setting);
        await webBuilder.clickBtnSaveIfEnable();
        let actually = await webBuilder.getStyleVariantPickerObject(webBuilder.frameLocator);
        let expectStyle = conf.caseConf.expect.expect_styles[index];
        expect(JSON.stringify(actually)).toEqual(JSON.stringify(expectStyle));
        //sfn

        const storefront = await webBuilder.clickPreview({ context, dashboard });
        actually = await webBuilder.getStyleVariantPickerObject(storefront, conf.suiteConf.page.sfn);
        expectStyle = conf.caseConf.expect.expect_styles_2[index];
        expect(JSON.stringify(actually)).toEqual(JSON.stringify(expectStyle));
        await storefront.close();
      }
    });
  });
});
