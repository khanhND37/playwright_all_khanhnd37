import { expect, test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { EnvironmentInfo } from "./product_card";
import { SbNewecomWsPdc01 } from "./product_card";
import { SbNewecomWsPdc02 } from "./product_card";
import { SbNewecomWsPdc03 } from "./product_card";
import { SbNewecomWsPdc04 } from "./product_card";
import { SbNewecomWsPdc05 } from "./product_card";
import { SbNewecomWsPdc06 } from "./product_card";
import { SbNewecomWsPdc07 } from "./product_card";
import { SbNewecomWsPdc08 } from "./product_card";
import { SbNewecomWsPdc09 } from "./product_card";
import { SbNewecomWsPdc10 } from "./product_card";
import { SbNewecomWsPdc11 } from "./product_card";
import { SbNewecomWsPdc12 } from "./product_card";
import { SbNewecomWsPdc15 } from "./product_card";
import { SbNewecomWsPdc16 } from "./product_card";
import { SbNewecomWsPdc17 } from "./product_card";
import { SbNewecomWsPdc18 } from "./product_card";
import { SbNewecomWsPdc19 } from "./product_card";
import { ProductCard } from "@pages/dashboard/product_card";
import { snapshotDir } from "@utils/theme";
import { SFHome } from "@sf_pages/homepage";
import { generateRandomMailToThisEmail } from "@core/utils/mail";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { getStyle } from "@utils/css";

test.describe("Check website setting - Product card trên shop newecom", async () => {
  let suiteConf: EnvironmentInfo, webBuilder: WebBuilder, themeId: number, productCard: ProductCard;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    suiteConf = conf.suiteConf as EnvironmentInfo;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    productCard = new ProductCard(dashboard, suiteConf.domain);
    themeId = suiteConf.theme_id;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "collection" });
      await productCard.changeCollectionSource("Hats");
    });
  });

  test(`@SB_NEWECOM_WS_PDC_01 Verify hiển thị các tooltips trên shop ecom`, async ({
    dashboard,
    cConf,
    snapshotFixture,
  }) => {
    const caseConf = cConf as SbNewecomWsPdc01;
    const expected = caseConf.expected;

    await test.step(`Từ Website setting > Click "Product" trên menu`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();

      //Verify các tooltips
      await dashboard.locator(productCard.xpathProductCardTooltipIcon).click({ delay: 2000 });
      await dashboard.locator(productCard.xpathProductCardPopover).isVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: productCard.xpathProductCardPopover,
        snapshotName: `${process.env.ENV}-${expected.popover.snapshot_popover_product_card}`,
      });

      await dashboard.locator(productCard.xpathSoldoutTooltipIcon).hover();
      await expect(
        dashboard.locator(
          `//label[@class="w-builder__tooltip-label" and contains(text(),
        '${expected.tooltips.sold_out.text}')]`,
        ),
      ).toBeVisible();

      await dashboard.locator(productCard.xpathSaleTooltipIcon).hover();
      await expect(
        dashboard.locator(
          `//label[@class="w-builder__tooltip-label" and contains(text(),
        '${expected.tooltips.sale.text}')]`,
        ),
      ).toBeVisible();

      await dashboard.locator(productCard.xpathWhenClickATCLabel).hover();
      await expect(
        dashboard.locator(
          `//div[@class="sb-tooltip__content sb-text-caption" and contains(text(),
        '${expected.tooltips.when_click_atc}')]`,
        ),
      ).toBeVisible();

      await dashboard.locator(productCard.xpathShowRatingTooltipIcon).hover();
      await expect(
        dashboard.locator(
          `//label[@class="w-builder__tooltip-label" and contains(text(),
        '${expected.tooltips.rating.text}')]`,
        ),
      ).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_WS_PDC_02 Verify setting image ratio và setting image cover trên shop ecom`, async ({
    dashboard,
    cConf,
    context,
  }) => {
    const caseConf = cConf as SbNewecomWsPdc02;

    await test.step(`Click vào input area của image ratio`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();

      await dashboard.locator(productCard.xpathImgRatioProductCardBtn).click();
      expect(await webBuilder.isDropdownItemsVisible(caseConf.expected.image_ratio_dropdown)).toEqual(true);

      for (const ratio of caseConf.expected.image_ratio) {
        await dashboard.locator(`//li[@data-select-label="${ratio.value}"]//label`).hover();
        await expect(dashboard.locator(`//div[contains(text(), '${ratio.tooltip}')]`)).toBeVisible();
      }
      await dashboard.locator(productCard.xpathImgRatioProductCardBtn).click();
    });

    await test.step(`Click vào lần lượt các option của image ratio`, async () => {
      for (const ratio of caseConf.expected.image_ratio) {
        await dashboard.locator(productCard.xpathImgRatioProductCardBtn).click();
        await dashboard.locator(`//li[@data-select-label="${ratio.value}"]`).click();
        await productCard.clickSaveBtn();

        //Verify preview
        expect(
          await webBuilder.frameLocator.locator(productCard.xpathProductCardImageRatio).getAttribute("style"),
        ).toContain(ratio.padding);

        const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

        //Verify trên SF
        expect(await previewOnSF.locator(productCard.xpathProductCardImageRatio).getAttribute("style")).toContain(
          ratio.padding,
        );
        await previewOnSF.close();
      }
    });

    await test.step(`Click vào input area của image cover`, async () => {
      await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
      expect(await webBuilder.isDropdownItemsVisible(caseConf.expected.image_cover_dropdown)).toEqual(true);
      await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
    });

    await test.step(`Click vào lần lượt các option của image cover`, async () => {
      //Chọn option "Contain"
      await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="Cover"]`).click();
      await productCard.clickSaveBtn();

      //Verify preview
      expect(
        await webBuilder.frameLocator.locator(productCard.xpathProductCardImageCover).getAttribute("class"),
      ).toContain("object-cover");

      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      //Verify trên SF
      expect(await previewOnSF.locator(productCard.xpathProductCardImageCover).getAttribute("class")).toContain(
        "object-cover",
      );
      await previewOnSF.close();

      //Chọn option "Contain"
      await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="Contain"]`).click();
      await productCard.clickSaveBtn();

      //Verify preview
      expect(
        await webBuilder.frameLocator.locator(productCard.xpathProductCardImageCover).getAttribute("class"),
      ).not.toContain("object-cover");

      const previewOnSF2 = await webBuilder.clickPreview({ context, dashboard });

      //Verify trên SF
      expect(await previewOnSF2.locator(productCard.xpathProductCardImageCover).getAttribute("class")).not.toContain(
        "object-cover",
      );
    });
  });

  test(`@SB_NEWECOM_WS_PDC_03 Verify setting Hover effect trên shop ecom`, async ({ dashboard, cConf, context }) => {
    const caseConf = cConf as SbNewecomWsPdc03;

    await test.step(`Click vào input area của Hover effect`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();

      await dashboard.locator(productCard.xpathHoverEffectProductCardBtn).click();
      expect(await webBuilder.isDropdownItemsVisible(caseConf.expected.hover_effect_dropdown)).toEqual(true);
      await dashboard.locator(productCard.xpathHoverEffectProductCardBtn).click();
    });

    await test.step(`Click vào lần lượt các option của Hover effect`, async () => {
      await dashboard.locator(productCard.xpathHoverEffectProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="Zoom in"]`).click();
      await productCard.clickSaveBtn();

      //Verify preview
      expect(
        await webBuilder.frameLocator.locator(productCard.xpathProductCardHoverEffect).getAttribute("class"),
      ).toContain("zoom-in-images");

      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      //Verify trên SF
      expect(await previewOnSF.locator(productCard.xpathProductCardHoverEffect).getAttribute("class")).toContain(
        "zoom-in-images",
      );
      await previewOnSF.close();

      await dashboard.locator(productCard.xpathHoverEffectProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="Image carousel"]`).click();
      await productCard.clickSaveBtn();

      expect(
        await webBuilder.frameLocator.locator(productCard.xpathProductCardHoverEffect).getAttribute("class"),
      ).toContain("slide-images");

      const previewOnSF2 = await webBuilder.clickPreview({ context, dashboard });

      //Verify trên SF
      expect(await previewOnSF2.locator(productCard.xpathProductCardHoverEffect).getAttribute("class")).toContain(
        "slide-images",
      );
    });
  });

  test(`@SB_NEWECOM_WS_PDC_04 Verify setting Font trên shop ecom`, async ({
    dashboard,
    cConf,
    conf,
    context,
    snapshotFixture,
  }) => {
    const caseConf = cConf as SbNewecomWsPdc04;
    const preCondition = conf.caseConf.pre_condition;
    const fontDropdown = caseConf.expected.font_dropdown;
    const truncatedProductName = caseConf.truncated_product_name;

    await test.step(`Click vào input area của Font`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();
      await dashboard.locator(productCard.xpathFontProductCardBtn).click();
      expect(await webBuilder.isDropdownItemsVisible(fontDropdown)).toEqual(true);
      await dashboard.locator(productCard.xpathFontProductCardBtn).click();
    });

    await test.step(`Click vào lần lượt các option của Font`, async () => {
      //Prepare pre-condition:
      await webBuilder.selectAlign(preCondition.align.label, preCondition.align.type);
      await webBuilder.setBackground(preCondition.background.label, preCondition.background.value);
      await webBuilder.setBorder(preCondition.border.label, preCondition.border.value);
      await webBuilder.setMarginPadding(preCondition.padding.label, preCondition.padding.value);
      await webBuilder.switchToggle(
        preCondition.show_rating.label_rating,
        preCondition.show_rating.setting.turn_on.show_icon,
      );

      for (const font of caseConf.font_paragraph) {
        await dashboard.locator(productCard.xpathFontProductCardBtn).click();
        await dashboard.locator(`//li[@data-select-label="${font.paragraph}"]`).click();
        const fontNumber = font.font_number;
        await productCard.clickSaveBtn();

        // Veriry preview
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: `//a[normalize-space()='${truncatedProductName}']`,
          iframe: webBuilder.iframe,
          snapshotName: `truncated-product-name-p${fontNumber}-${process.env.ENV}-WB.png`,
        });

        const fontNameLoc = webBuilder.frameLocator.locator(productCard.xpathProductCardName);
        const fontName = await getStyle(fontNameLoc, "font-size");
        expect(fontName).toEqual(font.font_size);

        const fontPriceLoc = webBuilder.frameLocator.locator(productCard.xpathProductCardPrice);
        const fontPrice = await getStyle(fontPriceLoc, "font-size");
        expect(fontPrice).toEqual(font.font_size);

        const fontRatingLoc = webBuilder.frameLocator.locator(productCard.xpathProductCardRating);
        const fontRating = await getStyle(fontRatingLoc, "font-size");
        expect(fontRating).toEqual(font.font_size);

        // Veriry trên SF
        const previewOnSF = await webBuilder.clickPreview({ context, dashboard });
        await snapshotFixture.verifyWithAutoRetry({
          page: previewOnSF,
          selector: `//a[normalize-space()='${truncatedProductName}']`,
          snapshotName: `truncated-product-name-p${fontNumber}-${process.env.ENV}-SF.png`,
        });

        const nameSFLoc = previewOnSF.locator(productCard.xpathProductCardName);
        const fontNameSF = await getStyle(nameSFLoc, "font-size");
        expect(fontNameSF).toEqual(font.font_size);

        const priceSFLoc = previewOnSF.locator(productCard.xpathProductCardPrice);
        const fontPriceSF = await getStyle(priceSFLoc, "font-size");
        expect(fontPriceSF).toEqual(font.font_size);

        const ratingSFLoc = previewOnSF.locator(productCard.xpathProductCardRating);
        const ratingPriceSF = await getStyle(ratingSFLoc, "font-size");
        expect(ratingPriceSF).toEqual(font.font_size);

        await previewOnSF.close();
      }
    });
  });

  test(`@SB_NEWECOM_WS_PDC_05 Verify chỉnh sửa thuộc tính Border, Radius, Padding, Text Align, Background trên shop ecom`, async ({
    dashboard,
    cConf,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomWsPdc05;
    const preCondition = caseConf.pre_condition;

    await test.step(`Chọn tổ hợp các giá trị theo input data`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();

      //Prepare pre-condition:
      await dashboard.locator(productCard.xpathImgRatioProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="${preCondition.ratio}"]`).click();
      await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="${preCondition.cover}"]`).click();
      await dashboard.locator(productCard.xpathFontProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="${preCondition.font}"]`).click();
      await webBuilder.switchToggle(preCondition.compared_price.label, preCondition.compared_price.show_icon);
      await webBuilder.switchToggle(preCondition.soldout.label, preCondition.soldout.show_icon);
      await webBuilder.switchToggle(preCondition.sale.label, preCondition.sale.show_icon);
      await webBuilder.switchToggle(
        preCondition.show_rating.label_rating,
        preCondition.show_rating.setting.turn_on.show_icon,
      );
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Review rating", { exact: true }).click();
      await webBuilder.selectDropDown("icon", `${preCondition.show_rating.rating_icon}`);
      await webBuilder.color(preCondition.show_rating.rating_color, "rating_color");
      await productCard.clickSaveBtn();
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Product", { exact: true }).click();

      //Verify chỉnh sửa các setting
      let index = 1;
      for (const style of conf.caseConf.styles) {
        await webBuilder.changeDesign(style);
        await productCard.clickSaveBtn();
        await webBuilder.frameLocator.locator(productCard.xpathProductList).waitFor({ state: "visible" });

        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: productCard.xpathProductList,
          iframe: webBuilder.iframe,
          snapshotName: `${caseConf.snapshot_preview}-design-${index}-${process.env.ENV}-WB.png`,
        });

        const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

        // Veriry trên SF
        await previewOnSF.locator(productCard.xpathProductList).waitFor({ state: "visible" });
        await snapshotFixture.verifyWithAutoRetry({
          page: previewOnSF,
          selector: productCard.xpathProductList,
          snapshotName: `${caseConf.snapshot_preview}-design-${index}-${process.env.ENV}-SF.png`,
        });
        await previewOnSF.close();
        index++;
      }
    });
  });

  test(`@SB_NEWECOM_WS_PDC_06 Verify button "Sold out" badge trên shop ecom`, async ({ dashboard, cConf, context }) => {
    const caseConf = cConf as SbNewecomWsPdc06;
    const setting = caseConf.setting;
    const productName = caseConf.product_name;

    const xpathAllSoldoutProduct = productCard.soldoutBadge.replace("productname", productName.all_variant_soldout);
    const xpathNoSoldoutProduct = productCard.productBadge.replace("productname", productName.no_variant_soldout);
    const xpathOneOfSoldoutProduct = productCard.productBadge.replace(
      "productname",
      productName.one_of_variants_soldout,
    );

    await test.step(`Turn on toggle "sold out" badge`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();
      await webBuilder.switchToggle(caseConf.label_soldout, setting.turn_on.show_icon);
      await webBuilder.editSliderBar(caseConf.label_radius, setting.turn_on.radius);
      await productCard.clickSaveBtn();

      // Verify preview
      await expect(webBuilder.frameLocator.locator(xpathAllSoldoutProduct)).toContainText("Sold Out");
      await expect(webBuilder.frameLocator.locator(xpathNoSoldoutProduct)).not.toContainText("Sold Out");
      await expect(webBuilder.frameLocator.locator(xpathOneOfSoldoutProduct)).not.toContainText("Sold Out");
      expect(await webBuilder.frameLocator.locator(xpathAllSoldoutProduct).getAttribute("style")).toContain(
        setting.turn_on.radius.number.toString(),
      );

      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      // Verify trên SF
      await expect(previewOnSF.locator(xpathAllSoldoutProduct)).toContainText("Sold Out");
      await expect(previewOnSF.locator(xpathNoSoldoutProduct)).not.toContainText("Sold Out");
      await expect(previewOnSF.locator(xpathOneOfSoldoutProduct)).not.toContainText("Sold Out");
      expect(await previewOnSF.locator(xpathAllSoldoutProduct).getAttribute("style")).toContain(
        setting.turn_on.radius.number.toString(),
      );
      await previewOnSF.close();
    });

    await test.step(`Turn off toggle "sold out" badge`, async () => {
      await webBuilder.switchToggle(caseConf.label_soldout, setting.turn_off.show_icon);
      await productCard.clickSaveBtn();

      // Verify preview
      await expect(webBuilder.frameLocator.locator(xpathAllSoldoutProduct)).toBeHidden();
      await expect(webBuilder.frameLocator.locator(xpathNoSoldoutProduct)).not.toContainText("Sold Out");
      await expect(webBuilder.frameLocator.locator(xpathOneOfSoldoutProduct)).not.toContainText("Sold Out");

      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      // Verify trên SF
      await expect(previewOnSF.locator(xpathAllSoldoutProduct)).toBeHidden();
      await expect(previewOnSF.locator(xpathNoSoldoutProduct)).not.toContainText("Sold Out");
      await expect(previewOnSF.locator(xpathOneOfSoldoutProduct)).not.toContainText("Sold Out");
    });
  });

  test(`@SB_NEWECOM_WS_PDC_07 Verify button Sale badge trên shop ecom`, async ({ dashboard, cConf, context }) => {
    const caseConf = cConf as SbNewecomWsPdc07;
    const setting = caseConf.setting;
    const productName = caseConf.product_name;

    const xpathProductSale = productCard.saleBadge.replace("productname", productName.price_is_less_than_compare_price);
    const xpathProductSaleButSoldout = productCard.productBadge.replace(
      "productname",
      productName.price_is_less_than_compare_price_but_soldout,
    );
    const xpathProductNotSale = productCard.productBadge.replace(
      "productname",
      productName.price_is_equal_to_compare_price,
    );
    const xpathProductNotSale2 = productCard.productBadge.replace(
      "productname",
      productName.price_is_greater_than_compare_price,
    );

    await test.step(`Turn on toggle Sale badge`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();
      await webBuilder.switchToggle(caseConf.label_sale, setting.turn_on.show_icon);
      await webBuilder.editSliderBar(caseConf.label_radius, setting.turn_on.radius);
      await productCard.clickSaveBtn();

      // Verify preview
      await expect(webBuilder.frameLocator.locator(xpathProductSale)).toContainText("Sale");
      await expect(webBuilder.frameLocator.locator(xpathProductSaleButSoldout)).not.toContainText("Sale");
      await expect(webBuilder.frameLocator.locator(xpathProductNotSale)).not.toContainText("Sale");
      await expect(webBuilder.frameLocator.locator(xpathProductNotSale2)).not.toContainText("Sale");
      expect(await webBuilder.frameLocator.locator(xpathProductSale).getAttribute("style")).toContain(
        setting.turn_on.radius.number.toString(),
      );

      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      // Verify trên SF
      await expect(previewOnSF.locator(xpathProductSale)).toContainText("Sale");
      await expect(previewOnSF.locator(xpathProductSaleButSoldout)).not.toContainText("Sale");
      await expect(previewOnSF.locator(xpathProductNotSale)).not.toContainText("Sale");
      await expect(previewOnSF.locator(xpathProductNotSale2)).not.toContainText("Sale");
      expect(await previewOnSF.locator(xpathProductSale).getAttribute("style")).toContain(
        setting.turn_on.radius.number.toString(),
      );
      await previewOnSF.close();
    });

    await test.step(`Turn off toggle Sale badge`, async () => {
      await webBuilder.switchToggle(caseConf.label_sale, setting.turn_off.show_icon);
      await productCard.clickSaveBtn();

      // Verify preview
      await expect(webBuilder.frameLocator.locator(xpathProductSale)).toBeHidden();
      await expect(webBuilder.frameLocator.locator(xpathProductSaleButSoldout)).not.toContainText("Sale");
      await expect(webBuilder.frameLocator.locator(xpathProductNotSale)).not.toContainText("Sale");
      await expect(webBuilder.frameLocator.locator(xpathProductNotSale2)).not.toContainText("Sale");

      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      // Verify trên SF
      await expect(previewOnSF.locator(xpathProductSale)).toBeHidden();
      await expect(previewOnSF.locator(xpathProductSaleButSoldout)).not.toContainText("Sale");
      await expect(previewOnSF.locator(xpathProductNotSale)).not.toContainText("Sale");
      await expect(previewOnSF.locator(xpathProductNotSale2)).not.toContainText("Sale");
    });
  });

  test(`@SB_NEWECOM_WS_PDC_08 Verify Add to cart button trên shop ecom`, async ({ dashboard, cConf, context }) => {
    const caseConf = cConf as SbNewecomWsPdc08;
    const setting = caseConf.setting;

    const xpathAvailableProductImg = productCard.productImg.replace("productname", caseConf.available_product_name);
    const xpathAvailableProductATCBtn = productCard.addToCartBtn.replace(
      "productname",
      caseConf.available_product_name,
    );
    const xpathSoldoutProductImg = productCard.productImg.replace("productname", caseConf.soldout_product_name);
    const xpathSoldoutProductBtn = productCard.addToCartBtn.replace("productname", caseConf.soldout_product_name);

    await test.step(`Turn on Add to cart button -> Hover vào image product card`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();

      await webBuilder.switchToggle(caseConf.label, setting.turn_on.show_icon);
      await productCard.clickSaveBtn();

      await webBuilder.frameLocator.locator(xpathAvailableProductImg).hover();
      await expect(webBuilder.frameLocator.locator(xpathAvailableProductATCBtn)).toBeVisible();
      await expect(webBuilder.frameLocator.locator(xpathAvailableProductATCBtn)).toContainText("Add to cart");

      await webBuilder.frameLocator.locator(xpathSoldoutProductImg).hover();
      await expect(webBuilder.frameLocator.locator(xpathSoldoutProductBtn)).toBeVisible();
      await expect(webBuilder.frameLocator.locator(xpathSoldoutProductBtn)).toContainText("Sold Out");

      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      // Veriry trên SF
      await previewOnSF.locator(xpathAvailableProductImg).hover();
      await expect(previewOnSF.locator(xpathAvailableProductATCBtn)).toBeVisible();
      await expect(previewOnSF.locator(xpathAvailableProductATCBtn)).toBeEnabled();
      await expect(previewOnSF.locator(xpathAvailableProductATCBtn)).toContainText("Add to cart");

      await previewOnSF.locator(xpathSoldoutProductImg).hover();
      await expect(previewOnSF.locator(xpathSoldoutProductBtn)).toBeVisible();
      expect(await previewOnSF.locator(xpathSoldoutProductBtn).getAttribute("class")).toContain("disabled");
      await expect(previewOnSF.locator(xpathSoldoutProductBtn)).toContainText("Sold Out");
      await previewOnSF.close();
    });

    await test.step(`Turn off Add to cart button -> Hover vào image product card`, async () => {
      await webBuilder.switchToggle(caseConf.label, setting.turn_off.show_icon);

      // Veriry preview
      await webBuilder.frameLocator.locator(xpathAvailableProductImg).hover();
      await expect(webBuilder.frameLocator.locator(xpathAvailableProductATCBtn)).toBeHidden();

      await productCard.clickSaveBtn();
      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      // Veriry trên SF
      await previewOnSF.locator(xpathAvailableProductImg).hover();
      await expect(previewOnSF.locator(xpathAvailableProductATCBtn)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_WS_PDC_09 Verify "When buyer click Add to cart" trên shop ecom`, async ({
    dashboard,
    cConf,
    context,
    conf,
  }) => {
    const caseConf = cConf as SbNewecomWsPdc09;
    const whenClickATCDropdown = caseConf.expected.click_atc_dropdown;

    await test.step(`Click vào input area`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();

      await dashboard.locator(productCard.xpathWhenClickATC).click();
      expect(await webBuilder.isDropdownItemsVisible(whenClickATCDropdown)).toEqual(true);
      await dashboard.locator(productCard.xpathWhenClickATC).click();
    });

    await test.step(`Chọn lần lượt các option`, async () => {
      //Chọn option "Open cart drawer"
      await dashboard.locator(productCard.xpathWhenClickATC).click();
      await dashboard.locator(`//*[@data-select-label='Open cart drawer']`).click();

      await productCard.clickSaveBtn();
      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      // Veriry trên SF
      await previewOnSF.goto(`https://${conf.suiteConf.domain}/collections/hats/products/barette-hat-straw`);
      await previewOnSF.waitForTimeout(5 * 1000);
      await previewOnSF.locator(productCard.xpathQuantityBtn).waitFor({ state: "visible" });
      await previewOnSF.locator("//div[contains(@class,'button--add-cart')]").first().click();
      try {
        await expect(previewOnSF.locator("//span[contains(text(),'GO TO CART')]")).toBeVisible();
      } catch (error) {
        await previewOnSF.reload();
        await previewOnSF.waitForTimeout(5 * 1000);
        await previewOnSF.locator(productCard.xpathQuantityBtn).waitFor({ state: "visible" });
        await previewOnSF.locator("//div[contains(@class,'button--add-cart')]").first().click();
        await expect(previewOnSF.locator("//span[contains(text(),'GO TO CART')]")).toBeVisible();
      }

      await previewOnSF.close();

      //Chọn option "Go to cart page"
      await dashboard.locator(productCard.xpathWhenClickATC).click();
      await dashboard.locator(`//*[@data-select-label='Go to cart page']`).click();

      await productCard.clickSaveBtn();
      const previewOnSF2 = await webBuilder.clickPreview({ context, dashboard });

      // Veriry trên SF
      await previewOnSF2.goto(`https://${conf.suiteConf.domain}/collections/hats/products/barette-hat-straw`);
      await previewOnSF2.waitForTimeout(5 * 1000);
      await previewOnSF2.locator(productCard.xpathQuantityBtn).waitFor({ state: "visible" });
      await previewOnSF2.locator("//div[contains(@class,'button--add-cart')]").first().click();
      try {
        await expect(
          previewOnSF2.locator("//span[contains(text(),'YOUR CART')] | //span[contains(text(),'Your cart')]"),
        ).toBeVisible();
      } catch (error) {
        await previewOnSF2.reload();
        await previewOnSF2.waitForLoadState("networkidle");
        await expect(
          previewOnSF2.locator("//span[contains(text(),'YOUR CART')] | //span[contains(text(),'Your cart')]"),
        ).toBeVisible();
      }
    });
  });

  test(`@SB_NEWECOM_WS_PDC_10 Verify action khi click vào product card trên shop ecom`, async ({
    dashboard,
    cConf,
    context,
  }) => {
    const caseConf = cConf as SbNewecomWsPdc10;
    const preCondition = caseConf.pre_condition;
    const productImg = productCard.productImg.replace("productname", `${caseConf.product_name}`);
    const addToCartBtn = productCard.addToCartBtn.replace("productname", `${caseConf.product_name}`);
    const productCardName = productCard.productCardName.replace("productname", `${caseConf.product_name}`);
    const productCardPrice = productCard.productCardPrice.replace("productname", `${caseConf.product_name}`);
    const productCardRating = productCard.productCardRating.replace("productname", `${caseConf.product_name}`);

    await test.step(`Click vào button Add to cart`, async () => {
      //Prepare pre-condition:
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();
      await webBuilder.switchToggle(preCondition.add_cart_button.label, preCondition.add_cart_button.show_icon);
      await webBuilder.switchToggle(
        preCondition.show_rating.label_rating,
        preCondition.show_rating.setting.turn_on.show_icon,
      );
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Review rating", { exact: true }).click();
      await productCard.clickSaveBtn();

      //Verify click btn ATC on Product card
      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      await previewOnSF.locator(productImg).hover();
      await previewOnSF.locator(addToCartBtn).click();
      await expect(previewOnSF.locator(productCard.xpathVariantSelectorPopup)).toBeVisible();
      await previewOnSF.close();
    });

    await test.step(`Click vào các vùng khác trong Product card`, async () => {
      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });
      await previewOnSF.locator(productCardName).click();
      await expect(
        previewOnSF.locator(`//span[contains(@class,'breadcrumb') and text() = '${caseConf.product_name}']`),
      ).toBeVisible();
      await previewOnSF.goBack();
      await previewOnSF.locator(productCardPrice).click();
      await expect(
        previewOnSF.locator(`//span[contains(@class,'breadcrumb') and text() = '${caseConf.product_name}']`),
      ).toBeVisible();
      await previewOnSF.goBack();
      await previewOnSF.locator(productImg).click();
      await expect(
        previewOnSF.locator(`//span[contains(@class,'breadcrumb') and text() = '${caseConf.product_name}']`),
      ).toBeVisible();
      await previewOnSF.goBack();
      await previewOnSF.locator(productCardRating).click();
      await expect(
        previewOnSF.locator(`//span[contains(@class,'breadcrumb') and text() = '${caseConf.product_name}']`),
      ).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_WS_PDC_11 Verify các các thuộc tính style của product card hiển thị trên mobile trên shop ecom`, async ({
    dashboard,
    conf,
    cConf,
    pageMobile,
    snapshotFixture,
  }) => {
    test.slow();
    const collectionPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const caseConf = cConf as SbNewecomWsPdc11;
    const preConditionCommon = caseConf.expected.common_setting.pre_condition;
    const preConditionFont = conf.caseConf.expected.font.pre_condition;

    await test.step(`Click lần lượt các giá trị image ratio`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();

      for (const ratio of caseConf.expected.image_ratio) {
        await dashboard.locator(productCard.xpathImgRatioProductCardBtn).click();
        await dashboard.locator(`//li[@data-select-label="${ratio.value}"]`).click();
        await productCard.clickSaveBtn();
        await collectionPage.gotoCollection(caseConf.collection_handle);
        //Verify trên SF
        expect(await collectionPage.genLoc(productCard.xpathProductCardImageRatio).getAttribute("style")).toContain(
          ratio.padding,
        );
      }
    });

    await test.step(`Click lần lượt các giá trị image cover`, async () => {
      //Chọn option "Cover"
      await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="Cover"]`).click();
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);

      //Verify trên SF
      expect(await collectionPage.genLoc(productCard.xpathProductCardImageCover).getAttribute("class")).toContain(
        "object-cover",
      );

      //Chọn option "Contain"
      await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="Contain"]`).click();
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);

      //Verify trên SF
      expect(await collectionPage.genLoc(productCard.xpathProductCardImageCover).getAttribute("class")).not.toContain(
        "object-cover",
      );
    });
    await test.step(`Click vào lần lượt các option của Hover effect`, async () => {
      //Chọn option "Zoom in"
      await dashboard.locator(productCard.xpathHoverEffectProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="Zoom in"]`).click();
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);

      //Verify trên SF
      expect(await collectionPage.genLoc(productCard.xpathProductCardHoverEffect).getAttribute("class")).toContain(
        "zoom-in-images",
      );

      //Chọn option "Image carousel"
      await dashboard.locator(productCard.xpathHoverEffectProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="Image carousel"]`).click();
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);

      //Verify trên SF
      expect(await collectionPage.genLoc(productCard.xpathProductCardHoverEffect).getAttribute("class")).toContain(
        "slide-images",
      );
    });

    await test.step(`Click vào lần lượt các option của Font`, async () => {
      //Prepare pre-condition:
      await webBuilder.selectAlign(preConditionFont.align.label, preConditionFont.align.type);
      await webBuilder.setBackground(preConditionFont.background.label, preConditionFont.background.value);
      await webBuilder.setBorder(preConditionFont.border.label, preConditionFont.border.value);
      await webBuilder.setMarginPadding(preConditionFont.padding.label, preConditionFont.padding.value);
      await webBuilder.switchToggle(
        preConditionFont.show_rating.label_rating,
        preConditionFont.show_rating.setting.turn_on.show_icon,
      );
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Review rating", { exact: true }).click();
      await webBuilder.selectDropDown("icon", `${preConditionFont.show_rating.rating_icon}`);
      await webBuilder.color(preConditionFont.show_rating.rating_color, "rating_color");
      await productCard.clickSaveBtn();
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Product", { exact: true }).click();

      for (const font of caseConf.expected.font.font_paragraph) {
        await dashboard.locator(productCard.xpathFontProductCardBtn).click();
        await dashboard.locator(`//li[@data-select-label="${font.paragraph}"]`).click();
        const fontNumber = font.font_number;
        await productCard.clickSaveBtn();
        await collectionPage.gotoCollection(caseConf.collection_handle);

        // Veriry trên SF
        await snapshotFixture.verifyWithAutoRetry({
          page: collectionPage.page,
          selector: `//a[normalize-space()="${caseConf.expected.font.truncated_product_name}"]`,
          snapshotName: `truncated_product_name_p${fontNumber}_mobile-${process.env.ENV}.png`,
        });

        const nameSFLoc = collectionPage.page.locator(productCard.xpathProductCardName);
        const fontNameSF = await getStyle(nameSFLoc, "font-size");
        expect(fontNameSF).toEqual(font.font_size);

        const priceSFLoc = collectionPage.page.locator(productCard.xpathProductCardPrice);
        const fontPriceSF = await getStyle(priceSFLoc, "font-size");
        expect(fontPriceSF).toEqual(font.font_size);

        await collectionPage.page.waitForTimeout(1 * 1000);
        const ratingSFLoc = collectionPage.page.locator(productCard.xpathProductCardRating);
        const ratingPriceSF = await getStyle(ratingSFLoc, "font-size");
        expect(ratingPriceSF).toEqual(font.font_size);
      }
    });
    await test.step(`Chọn tổ hợp các thuộc tính Border, Radius, Padding, Text Align, Background theo input data`, async () => {
      //Prepare pre-condition:
      await webBuilder.switchToggle(
        preConditionCommon.compared_price.label,
        preConditionCommon.compared_price.show_icon,
      );
      await webBuilder.switchToggle(preConditionCommon.soldout.label, preConditionCommon.soldout.show_icon);
      await webBuilder.switchToggle(preConditionCommon.sale.label, preConditionCommon.sale.show_icon);
      await webBuilder.switchToggle(
        preConditionCommon.add_cart_button.label,
        preConditionCommon.add_cart_button.show_icon,
      );

      //Verify chỉnh sửa các setting
      let index = 1;
      for (const style of conf.caseConf.expected.common_setting.styles) {
        await webBuilder.changeDesign(style);
        await productCard.clickSaveBtn();
        await collectionPage.gotoCollection(caseConf.collection_handle);

        // Veriry trên SF
        await snapshotFixture.verifyWithAutoRetry({
          page: collectionPage.page,
          selector: productCard.xpathProductList,
          snapshotName: `${caseConf.expected.common_setting.snapshot_preview}-design-${index}_mobile-${process.env.ENV}.png`,
        });
        index++;
      }
    });
  });

  test(`@SB_NEWECOM_WS_PDC_12 Verify các button "Sold out" badge, Sale badge, Add to cart của product card trên mobile trên shop ecom`, async ({
    dashboard,
    conf,
    cConf,
    pageMobile,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomWsPdc12;
    const collectionPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const productName1 = caseConf.sold_out.product_name;
    const productName2 = caseConf.sale.product_name;
    const soldoutSetting = caseConf.sold_out.setting;
    const saleSetting = caseConf.sale.setting;

    const xpathAllSoldoutProduct = productCard.soldoutBadge.replace("productname", productName1.all_variant_soldout);
    const xpathNoSoldoutProduct = productCard.productBadge.replace("productname", productName1.no_variant_soldout);
    const xpathOneOfSoldoutProduct = productCard.productBadge.replace(
      "productname",
      productName1.one_of_variants_soldout,
    );

    const xpathProductSale = productCard.saleBadge.replace(
      "productname",
      productName2.price_is_less_than_compare_price,
    );
    const xpathProductNotSale = productCard.productBadge.replace(
      "productname",
      productName2.price_is_equal_to_compare_price,
    );
    const xpathProductNotSale2 = productCard.productBadge.replace(
      "productname",
      productName2.price_is_greater_than_compare_price,
    );

    const xpathAvailableProductATCBtn = productCard.addToCartBtn.replace(
      "productname",
      caseConf.add_cart_button.available_product_name,
    );
    const xpathSoldoutProductBtn = productCard.addToCartBtn.replace(
      "productname",
      caseConf.add_cart_button.soldout_product_name,
    );

    await test.step(`Turn on toggle "sold out" badge`, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();
      await webBuilder.switchToggle(caseConf.sold_out.label, soldoutSetting.turn_on.show_icon);
      await webBuilder.editSliderBar(caseConf.pre_condition.radius.label, caseConf.pre_condition.radius.config);
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);

      // Verify trên SF
      await expect(collectionPage.genLoc(xpathAllSoldoutProduct)).toContainText("Sold Out");
      await expect(collectionPage.genLoc(xpathNoSoldoutProduct)).not.toContainText("Sold Out");
      await expect(collectionPage.genLoc(xpathOneOfSoldoutProduct)).not.toContainText("Sold Out");
      expect(await collectionPage.genLoc(xpathAllSoldoutProduct).getAttribute("style")).toContain(
        caseConf.pre_condition.radius.config.number.toString(),
      );
    });

    await test.step(`Turn off toggle "sold out" badge`, async () => {
      await webBuilder.switchToggle(caseConf.sold_out.label, soldoutSetting.turn_off.show_icon);
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);

      // Verify trên SF
      await expect(collectionPage.genLoc(xpathAllSoldoutProduct)).toBeHidden();
      await expect(collectionPage.genLoc(xpathNoSoldoutProduct)).not.toContainText("Sold Out");
      await expect(collectionPage.genLoc(xpathOneOfSoldoutProduct)).not.toContainText("Sold Out");
    });

    await test.step(`Turn on toggle Sale badge`, async () => {
      await webBuilder.switchToggle(caseConf.sale.label, saleSetting.turn_on.show_icon);
      await webBuilder.editSliderBar(caseConf.pre_condition.radius.label, caseConf.pre_condition.radius.config);
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);
      // Verify trên SF
      await expect(collectionPage.genLoc(xpathProductSale)).toContainText("Sale");
      await expect(collectionPage.genLoc(xpathProductNotSale)).not.toContainText("Sale");
      await expect(collectionPage.genLoc(xpathProductNotSale2)).not.toContainText("Sale");
      expect(await collectionPage.genLoc(xpathProductSale).getAttribute("style")).toContain(
        caseConf.pre_condition.radius.config.number.toString(),
      );
    });

    await test.step(`Turn off toggle Sale badge`, async () => {
      await webBuilder.switchToggle(caseConf.sale.label, saleSetting.turn_off.show_icon);
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);

      // Verify trên SF
      await expect(collectionPage.genLoc(xpathProductSale)).toBeHidden();
      await expect(collectionPage.genLoc(xpathProductNotSale)).not.toContainText("Sale");
      await expect(collectionPage.genLoc(xpathProductNotSale2)).not.toContainText("Sale");
    });

    await test.step(`Turn on toggle Add to cart button`, async () => {
      await webBuilder.switchToggle(caseConf.add_cart_button.label, caseConf.add_cart_button.setting.turn_on.show_icon);
      await productCard.clickSaveBtn();

      await collectionPage.gotoCollection(caseConf.collection_handle);

      // Veriry trên SF
      await expect(collectionPage.genLoc(xpathAvailableProductATCBtn)).toBeVisible();
      await expect(collectionPage.genLoc(xpathAvailableProductATCBtn)).toBeEnabled();
      await expect(collectionPage.genLoc(xpathAvailableProductATCBtn)).toContainText("Add to cart");

      await expect(collectionPage.genLoc(xpathSoldoutProductBtn)).toBeVisible();
      expect(await collectionPage.genLoc(xpathSoldoutProductBtn).getAttribute("class")).toContain("disabled");
      await expect(collectionPage.genLoc(xpathSoldoutProductBtn)).toContainText("Sold Out");
    });

    await test.step(`Turn off toggle Add to cart button`, async () => {
      await webBuilder.switchToggle(
        caseConf.add_cart_button.label,
        caseConf.add_cart_button.setting.turn_off.show_icon,
      );
      await productCard.clickSaveBtn();
      await collectionPage.gotoCollection(caseConf.collection_handle);

      // Veriry trên SF
      await expect(collectionPage.genLoc(xpathAvailableProductATCBtn)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_WS_PDC_18 Verify chỉnh sửa "Show rating" trong Product card shop ecom`, async ({
    dashboard,
    cConf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomWsPdc18;
    const setting = caseConf.setting;
    const productName = caseConf.product_name;
    const preCondition = caseConf.pre_condition;

    const xpathIconProductHasReview = productCard.ratingText.replace("productname", productName.product_has_review);
    const xpathTextProductNoReview = productCard.ratingText.replace("productname", productName.product_no_review);
    const xpathTextProductHasReview = productCard.ratingText.replace("productname", productName.product_has_review);

    await test.step(`Turn on toggle "Show rating" `, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();
      await webBuilder.switchToggle(cConf.label_rating, setting.turn_on.show_icon);
      await productCard.clickSaveBtn();

      // Verify WB
      await expect(webBuilder.frameLocator.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(webBuilder.frameLocator.locator(xpathTextProductHasReview)).toBeVisible();
      expect(await webBuilder.frameLocator.locator(xpathTextProductHasReview).textContent()).toContain(
        caseConf.rating_text,
      );

      // Verify preview
      const preview = await webBuilder.clickPreview({ context, dashboard });
      await expect(preview.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(preview.locator(xpathTextProductHasReview)).toBeVisible();
      expect(await preview.locator(xpathTextProductHasReview).textContent()).toContain(caseConf.rating_text);

      // Verify SF
      const storefront = new SFHome(preview, suiteConf.domain);
      await storefront.gotoCollection(caseConf.collection_handle);
      await expect(storefront.page.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(storefront.page.locator(xpathTextProductHasReview)).toBeVisible();
      expect(await storefront.page.locator(xpathTextProductHasReview).textContent()).toContain(caseConf.rating_text);
      await storefront.page.close();
    });

    await test.step(`Hover vào rating trên product card`, async () => {
      //Verify WB
      await webBuilder.frameLocator.locator(xpathTextProductHasReview).hover();
      await expect(webBuilder.frameLocator.locator(productCard.xpathRatingReviewOverall)).toBeHidden();
      await webBuilder.frameLocator.locator(xpathIconProductHasReview).hover();
      await expect(webBuilder.frameLocator.locator(productCard.xpathRatingReviewOverall)).toBeHidden();

      // Verify preview
      const preview = await webBuilder.clickPreview({ context, dashboard });
      await preview.locator(xpathTextProductHasReview).hover();
      await expect(preview.locator(productCard.xpathRatingReviewOverall)).toBeHidden();
      await preview.locator(xpathIconProductHasReview).hover();
      await expect(preview.locator(productCard.xpathRatingReviewOverall)).toBeHidden();

      // Verify SF
      const storefront = new SFHome(preview, suiteConf.domain);
      await storefront.gotoCollection(caseConf.collection_handle);
      await storefront.page.locator(xpathTextProductHasReview).hover();
      await expect(storefront.page.locator(productCard.xpathRatingReviewOverall)).toBeHidden();
      await storefront.page.locator(xpathIconProductHasReview).hover();
      await expect(storefront.page.locator(productCard.xpathRatingReviewOverall)).toBeHidden();
      await storefront.page.close();
    });

    await test.step(`Thay đổi icon rating trong Website setting - Review rating`, async () => {
      //Prepare pre-condition:
      await dashboard.locator(productCard.xpathFontProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="${preCondition.font}"]`).click();
      await webBuilder.editSliderBar(preCondition.radius.label_radius, preCondition.radius.value);
      await webBuilder.setBackground(preCondition.background.label, preCondition.background.value);
      await webBuilder.selectAlign(preCondition.align.label, preCondition.align.type);
      await productCard.clickSaveBtn();
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Review rating", { exact: true }).click();
      await webBuilder.color(preCondition.rating_color, "rating_color");
      await productCard.clickSaveBtn();

      const ratingIcons = cConf.expected.rating_icons;
      for (const icon of ratingIcons) {
        await webBuilder.selectDropDown("icon", `${icon.text}`);
        await productCard.clickSaveBtn();
        const xpathRatingIcon = productCard.ratingIcon.replace("productname", productName.product_has_review);
        await webBuilder.frameLocator.locator(xpathRatingIcon).waitFor({ state: "visible" });
        await webBuilder.waitForResponseIfExist("/assets/theme.css", 7000);
        await webBuilder.page.waitForTimeout(5 * 1000);

        //Verify WB
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: xpathRatingIcon,
          iframe: webBuilder.iframe,
          snapshotName: `${icon.text}-Wb.png`,
        });

        //Verify SF
        const preview = await webBuilder.clickPreview({ context, dashboard });
        const storefront = new SFHome(preview, suiteConf.domain);
        await storefront.gotoCollection(caseConf.collection_handle);
        await storefront.page.locator(xpathRatingIcon).waitFor({ state: "visible" });
        await storefront.waitForResponseIfExist("/assets/theme.css", 7000);
        await webBuilder.page.waitForTimeout(5 * 1000);
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront.page,
          selector: xpathRatingIcon,
          snapshotName: `${icon.text}-SF.png`,
        });
        await storefront.page.close();
      }
    });

    await test.step(`Thay đổi rating color trong Website setting - Review rating`, async () => {
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Review rating", { exact: true }).click();

      const ratingColors = caseConf.expected.rating_colors;
      for (const ratingColor of ratingColors) {
        await webBuilder.color(ratingColor.color, "rating_color");
        await productCard.clickSaveBtn();

        //Verify WB
        const ratingIconWbLoc = webBuilder.frameLocator
          .locator(
            `//a[normalize-space()='${productName.product_has_review}']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'block-review-icon')]`,
          )
          .first();
        const colorRatingIconWb = await getStyle(ratingIconWbLoc, "color");
        expect(colorRatingIconWb).toEqual(ratingColor.value);

        //Verify preview
        const preview = await webBuilder.clickPreview({ context, dashboard });
        const ratingIconPreviewLoc = preview
          .locator(
            `//a[normalize-space()='${productName.product_has_review}']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'block-review-icon')]`,
          )
          .first();
        const colorRatingIconPreview = await getStyle(ratingIconPreviewLoc, "color");
        expect(colorRatingIconPreview).toEqual(ratingColor.value);

        //Verify SF
        const storefront = new SFHome(preview, suiteConf.domain);
        await storefront.gotoCollection(caseConf.collection_handle);

        const ratingIconSFLoc = storefront.page
          .locator(
            `//a[normalize-space()='${productName.product_has_review}']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'block-review-icon')]`,
          )
          .first();
        const colorRatingIconSF = await getStyle(ratingIconSFLoc, "color");
        expect(colorRatingIconSF).toEqual(ratingColor.value);
        await storefront.page.close();
      }
    });

    await test.step(`Turn off toggle "Show rating" `, async () => {
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Product", { exact: true }).click();
      await webBuilder.switchToggle(cConf.label_rating, setting.turn_off.show_icon);
      await productCard.clickSaveBtn();

      // Verify WB
      await expect(webBuilder.frameLocator.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(webBuilder.frameLocator.locator(xpathTextProductHasReview)).toBeHidden();

      // Verify preview
      const preview = await webBuilder.clickPreview({ context, dashboard });
      await expect(preview.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(preview.locator(xpathTextProductHasReview)).toBeHidden();

      //Verify SF
      const storefront = new SFHome(preview, suiteConf.domain);
      await storefront.gotoCollection(caseConf.collection_handle);

      await expect(storefront.page.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(storefront.page.locator(xpathTextProductHasReview)).toBeHidden();
      await storefront.page.close();
    });
  });

  test(`@SB_NEWECOM_WS_PDC_19 Verify chỉnh sửa "Show rating" trong Product card trên mobile shop ecom`, async ({
    dashboard,
    pageMobile,
    cConf,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomWsPdc19;
    const setting = caseConf.setting;
    const productName = caseConf.product_name;
    const preCondition = caseConf.pre_condition;

    const xpathIconProductHasReview = productCard.ratingText.replace("productname", productName.product_has_review);
    const xpathTextProductNoReview = productCard.ratingText.replace("productname", productName.product_no_review);
    const xpathTextProductHasReview = productCard.ratingText.replace("productname", productName.product_has_review);

    await test.step(`Turn on toggle "Show rating" `, async () => {
      await dashboard.locator("//button[@name='Website Settings']").click();
      await dashboard.getByText("Product", { exact: true }).click();
      await productCard.switchMobileBtn.click();
      await webBuilder.switchToggle(cConf.label_rating, setting.turn_on.show_icon);
      await productCard.clickSaveBtn();

      // Verify WB
      await expect(webBuilder.frameLocator.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(webBuilder.frameLocator.locator(xpathTextProductHasReview)).toBeVisible();
      expect(await webBuilder.frameLocator.locator(xpathTextProductHasReview).textContent()).toContain(
        caseConf.rating_text,
      );

      // Verify SF
      const storefront = new SFHome(pageMobile, suiteConf.domain);
      await storefront.gotoCollection(caseConf.collection_handle);
      await storefront.page.locator(xpathTextProductHasReview).scrollIntoViewIfNeeded();
      await expect(storefront.page.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(storefront.page.locator(xpathTextProductHasReview)).toBeVisible();
      const ratingText = await storefront.page.locator(xpathTextProductHasReview).textContent();
      expect(ratingText).toContain(caseConf.rating_text);
    });

    await test.step(`Hover vào rating trên product card`, async () => {
      //Verify WB
      await webBuilder.frameLocator.locator(xpathTextProductHasReview).hover();
      await expect(webBuilder.frameLocator.locator(productCard.xpathRatingReviewOverall)).toBeHidden();
      await webBuilder.frameLocator.locator(xpathIconProductHasReview).hover();
      await expect(webBuilder.frameLocator.locator(productCard.xpathRatingReviewOverall)).toBeHidden();

      // Verify SF
      const storefront = new SFHome(pageMobile, suiteConf.domain);
      await storefront.gotoCollection(caseConf.collection_handle);
      await storefront.page.locator(xpathTextProductHasReview).scrollIntoViewIfNeeded();
      await storefront.page.locator(xpathTextProductHasReview).hover();
      await expect(storefront.page.locator(productCard.xpathRatingReviewOverall)).toBeHidden();
      await storefront.page.locator(xpathIconProductHasReview).hover();
      await expect(storefront.page.locator(productCard.xpathRatingReviewOverall)).toBeHidden();
    });

    await test.step(`Thay đổi icon rating trong Website setting - Review rating`, async () => {
      //Prepare pre-condition:
      await dashboard.locator(productCard.xpathFontProductCardBtn).click();
      await dashboard.locator(`//li[@data-select-label="${preCondition.font}"]`).click();
      await webBuilder.editSliderBar(preCondition.radius.label_radius, preCondition.radius.value);
      await webBuilder.setBackground(preCondition.background.label, preCondition.background.value);
      await webBuilder.selectAlign(preCondition.align.label, preCondition.align.type);
      await productCard.clickSaveBtn();
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Review rating", { exact: true }).click();
      await webBuilder.color(preCondition.rating_color, "rating_color");
      await productCard.clickSaveBtn();

      const ratingIcons = caseConf.expected.rating_icons;
      for (const icon of ratingIcons) {
        await webBuilder.selectDropDown("icon", `${icon.text}`);
        await productCard.clickSaveBtn();
        const xpathRatingIcon = productCard.ratingIcon.replace("productname", productName.product_has_review);
        await webBuilder.frameLocator.locator(xpathTextProductHasReview).scrollIntoViewIfNeeded();
        await webBuilder.frameLocator.locator(xpathRatingIcon).waitFor({ state: "visible" });
        await webBuilder.waitForResponseIfExist("/assets/theme.css", 7000);
        await webBuilder.page.waitForTimeout(5 * 1000);

        //Verify WB
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: xpathRatingIcon,
          iframe: webBuilder.iframe,
          snapshotName: `${icon.text}-Wb-mobile.png`,
        });

        //Verify SF
        const storefront = new SFHome(pageMobile, suiteConf.domain);
        await storefront.gotoCollection(caseConf.collection_handle);
        await storefront.page.locator(xpathTextProductHasReview).scrollIntoViewIfNeeded();
        await storefront.page.locator(xpathRatingIcon).waitFor({ state: "visible" });
        await storefront.waitForResponseIfExist("/assets/theme.css", 7000);
        await storefront.page.waitForTimeout(5 * 1000);
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront.page,
          selector: xpathRatingIcon,
          snapshotName: `${icon.text}-SF-mobile.png`,
        });
      }
    });

    await test.step(`Thay đổi rating color trong Website setting - Review rating`, async () => {
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Review rating", { exact: true }).click();

      const ratingColors = caseConf.expected.rating_colors;
      for (const ratingColor of ratingColors) {
        await webBuilder.color(ratingColor.color, "rating_color");
        await productCard.clickSaveBtn();

        //Verify WB
        await webBuilder.frameLocator.locator(xpathTextProductHasReview).scrollIntoViewIfNeeded();
        const ratingIconWbLoc = webBuilder.frameLocator
          .locator(
            `//a[normalize-space()='${productName.product_has_review}']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'block-review-icon')]`,
          )
          .first();
        const colorRatingIconWb = await getStyle(ratingIconWbLoc, "color");
        expect(colorRatingIconWb).toEqual(ratingColor.value);

        //Verify SF
        const storefront = new SFHome(pageMobile, suiteConf.domain);
        await storefront.gotoCollection(caseConf.collection_handle);
        await storefront.page.locator(xpathTextProductHasReview).scrollIntoViewIfNeeded();

        const ratingIconSFLoc = storefront.page
          .locator(
            `//a[normalize-space()='${productName.product_has_review}']//ancestor::div[contains(@class,'product-item')]//div[contains(@class, 'block-review-icon')]`,
          )
          .first();
        const colorRatingIconSF = await getStyle(ratingIconSFLoc, "color");
        expect(colorRatingIconSF).toEqual(ratingColor.value);
      }
    });

    await test.step(`Turn off toggle "Show rating" `, async () => {
      await productCard.navigationBackLoc.click();
      await dashboard.getByText("Product", { exact: true }).click();
      await webBuilder.switchToggle(caseConf.label_rating, setting.turn_off.show_icon);
      await productCard.clickSaveBtn();

      // Verify WB
      await expect(webBuilder.frameLocator.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(webBuilder.frameLocator.locator(xpathTextProductHasReview)).toBeHidden();

      //Verify SF
      const storefront = new SFHome(pageMobile, suiteConf.domain);
      await storefront.gotoCollection(caseConf.collection_handle);

      await expect(storefront.page.locator(xpathTextProductNoReview)).toBeHidden();
      await expect(storefront.page.locator(xpathTextProductHasReview)).toBeHidden();
    });
  });
});

test.describe("Check website setting - Product card trên shop creator", async () => {
  let suiteConf: EnvironmentInfo, webBuilder: WebBuilder, themeId: number, productCard: ProductCard;
  let dashboardPage: DashboardPage, productPage: CheckoutForm;

  test.beforeEach(async ({ dashboard, conf, token }, testInfo) => {
    suiteConf = conf.suiteConf as EnvironmentInfo;
    webBuilder = new WebBuilder(dashboard, suiteConf.shop_creator.domain);
    productCard = new ProductCard(dashboard, suiteConf.domain);
    productPage = new CheckoutForm(dashboard, conf.suiteConf.shop_creator.domain);
    themeId = suiteConf.shop_creator.theme_id;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    dashboardPage = new DashboardPage(dashboard, suiteConf.shop_creator.domain);
    const accessToken = (
      await token.getWithCredentials({
        domain: suiteConf.shop_creator.shop_name,
        username: suiteConf.username,
        password: suiteConf.password,
      })
    ).access_token;
    await dashboardPage.loginWithToken(accessToken);
  });

  test(`@SB_NEWECOM_WS_PDC_15 Verify chỉnh sửa các thuộc tính style của product card trên shop creator`, async ({
    context,
    dashboard,
    conf,
    cConf,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomWsPdc15;

    //Verify product card tương ứng với các handle (All products và My product list)
    for (const handle of caseConf.handles) {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: `${handle}` });

      await test.step(`Website setting > Click "Product" trên menu
    -> hover vào tooltip Product card`, async () => {
        await dashboard.locator("//button[@name='Website Settings']").click();
        await dashboard.getByText("Product", { exact: true }).click();

        await dashboard.locator(productCard.xpathProductCardTooltipIcon).hover();
        await dashboard.locator(productCard.xpathProductCardPopover).isVisible();
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: productCard.xpathProductCardPopover,
          snapshotName: `${process.env.ENV}-${handle}-${caseConf.snapshot.popover_product_card}`,
        });
      });

      await test.step(`Chỉnh sửa các thuộc tính style của product card theo input data`, async () => {
        let index = 1;
        for (const style of conf.caseConf.styles) {
          await dashboard.locator(productCard.xpathImgRatioProductCardBtn).click();
          await dashboard.locator(`//li[@data-select-label="${style.image_ratio.value}"]`).click();
          await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
          await dashboard.locator(`//li[@data-select-label="${style.image_cover.value}"]`).click();
          await dashboard.locator(productCard.xpathFontProductCardBtn).click();
          await dashboard.locator(`//li[@data-select-label="${style.font.value}"]`).click();
          await webBuilder.changeDesign(style);
          await productCard.clickSaveBtn();

          if (handle == "collection") {
            //Verify trên All products
            //Verify preview
            await snapshotFixture.verifyWithAutoRetry({
              page: dashboard,
              selector: productCard.xpathProductList,
              iframe: webBuilder.iframe,
              snapshotName: `${caseConf.snapshot.common_setting}-${index}-${process.env.ENV}-WB-${handle}.png`,
            });

            const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

            // Veriry trên SF
            await snapshotFixture.verifyWithAutoRetry({
              page: previewOnSF,
              selector: productCard.xpathProductList,
              snapshotName: `${caseConf.snapshot.common_setting}-${index}-${process.env.ENV}-SF-${handle}.png`,
            });
            await previewOnSF.close();
            index++;
          } else {
            //Verify trên My product list
            //Verify preview
            await snapshotFixture.verifyWithAutoRetry({
              page: dashboard,
              selector: productCard.xpathMyProductCreator,
              iframe: webBuilder.iframe,
              snapshotName: `${caseConf.snapshot.common_setting}-${index}-${process.env.ENV}-WB-${handle}.png`,
            });

            const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

            // Veriry trên SF
            await snapshotFixture.verifyWithAutoRetry({
              page: previewOnSF,
              selector: productCard.xpathMyProductCreator,
              snapshotName: `${caseConf.snapshot.common_setting}-${index}-${process.env.ENV}-SF-${handle}.png`,
            });
            await previewOnSF.close();
            index++;
          }
        }
      });
    }
  });

  test(`@SB_NEWECOM_WS_PDC_16 Verify action khi click vào product card trên shop creator`, async ({
    dashboard,
    cConf,
    context,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomWsPdc16;

    //Xpath Product card tại trang All products
    const productImg = productCard.productImg.replace("productname", `${caseConf.product_name}`);
    const productCardName = productCard.productCardName.replace("productname", `${caseConf.product_name}`);
    const productCardPrice = productCard.productCardPrice.replace("productname", `${caseConf.product_name}`);
    const productCardTag = productCard.productCardTag.replace("productname", `${caseConf.product_name}`);

    //Xpath Product card tại trang My product list
    const productImgMPL = productCard.productImgMPL.replace("productname", `${caseConf.product_name}`);
    const productCardNameMPL = productCard.productCardNameMPL.replace("productname", `${caseConf.product_name}`);
    const productCardTagMPL = productCard.productCardTagMPL.replace("productname", `${caseConf.product_name}`);
    const productCardProgress = productCard.productCardProgress.replace("productname", `${caseConf.product_name}`);

    await test.step(`click vào các vị trí trên product card`, async () => {
      // Verify click vào các vị trí trên product card trên trang All products
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: `${caseConf.handles.all_products_page}` });
      const previewOnSF = await webBuilder.clickPreview({ context, dashboard });

      //Click product card name
      await previewOnSF.locator(productCardName).click();
      await expect(
        previewOnSF.locator(productCard.checkoutForm.replace("productname", `${caseConf.product_name}`)),
      ).toBeVisible();
      await previewOnSF.goBack();

      //Click product card price
      await previewOnSF.locator(productCardPrice).click();
      await expect(
        previewOnSF.locator(productCard.checkoutForm.replace("productname", `${caseConf.product_name}`)),
      ).toBeVisible();
      await previewOnSF.goBack();

      //Click product card image
      await previewOnSF.locator(productImg).click();
      await expect(
        previewOnSF.locator(productCard.checkoutForm.replace("productname", `${caseConf.product_name}`)),
      ).toBeVisible();
      await previewOnSF.goBack();

      //Click product card tag
      await previewOnSF.locator(productCardTag).click();
      await expect(
        previewOnSF.locator(productCard.checkoutForm.replace("productname", `${caseConf.product_name}`)),
      ).toBeVisible();
      await previewOnSF.close();

      //Check out 1 product
      await productPage.goto(`products/${caseConf.product_handle}`);
      await productPage.page.waitForSelector(productCard.xpathLoadingCheckoutForm, { state: "hidden" });
      await productPage.enterEmail(generateRandomMailToThisEmail());
      await productPage.page.getByRole("button", { name: "Pay now" }).click();
      await productPage.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await productPage.page.getByRole("button", { name: "Access to my content" }).click();
      await productPage.page.waitForLoadState("networkidle");

      //Verify click vào các vị trí trên product card trên trang My product list
      await productPage.goto(`${caseConf.handles.my_product_list}`);

      //Click product card name
      await productPage.genLoc(productCardNameMPL).click();
      await expect(productPage.genLoc(productCard.xpathBacktoMyProductsBtn)).toBeVisible();
      await productPage.page.goBack();

      //Click product card progress
      await productPage.genLoc(productCardProgress).click();
      await expect(productPage.genLoc(productCard.xpathBacktoMyProductsBtn)).toBeVisible();
      await productPage.page.goBack();

      //Click product card image
      await productPage.genLoc(productImgMPL).click();
      await expect(productPage.genLoc(productCard.xpathBacktoMyProductsBtn)).toBeVisible();
      await productPage.page.goBack();

      //Click product card tag
      await productPage.genLoc(productCardTagMPL).click();
      await expect(productPage.genLoc(productCard.xpathBacktoMyProductsBtn)).toBeVisible();
    });
  });

  test(`@SB_NEWECOM_WS_PDC_17 Verify chỉnh sửa các thuộc tính style của product card trên mobile shop creator`, async ({
    pageMobile,
    dashboard,
    cConf,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomWsPdc17;

    await webBuilder.openWebBuilder({ type: "site", id: themeId, page: `${caseConf.handles.all_products_page}` });
    await dashboard.locator("//button[@name='Website Settings']").click();
    await dashboard.getByText("Product", { exact: true }).click();
    const pageSF = new SFHome(pageMobile, suiteConf.shop_creator.domain);

    await test.step(`Chỉnh sửa các thuộc tính style của product card theo input data`, async () => {
      let index = 1;
      for (const style of conf.caseConf.styles) {
        await dashboard.locator(productCard.xpathImgRatioProductCardBtn).click();
        await dashboard.locator(`//li[@data-select-label="${style.image_ratio.value}"]`).click();
        await dashboard.locator(productCard.xpathImgCoverProductCardBtn).click();
        await dashboard.locator(`//li[@data-select-label="${style.image_cover.value}"]`).click();
        await dashboard.locator(productCard.xpathFontProductCardBtn).click();
        await dashboard.locator(`//li[@data-select-label="${style.font.value}"]`).click();
        await webBuilder.changeDesign(style);
        await productCard.clickSaveBtn();

        //Verify trên All products
        await pageSF.gotoAllCollection();
        await pageSF.page.waitForLoadState("networkidle");

        await snapshotFixture.verifyWithAutoRetry({
          page: pageSF.page,
          selector: productCard.xpathProductList,
          snapshotName: `${caseConf.snapshot.common_setting}-${index}-${process.env.ENV}-SF-mobile-All-products.png`,
        });

        //Check out 1 product 1 lần đầu tiên
        if (index == 1) {
          await pageSF.gotoProduct(caseConf.product_handle);
          await productPage.page.waitForSelector(productCard.xpathLoadingCheckoutForm, { state: "hidden" });
          await pageSF.page.getByPlaceholder("Your email address").fill(generateRandomMailToThisEmail());
          await pageSF.page.getByRole("button", { name: "Pay now" }).click();
          await pageSF.page.locator("#v-progressbar").waitFor({ state: "detached" });
          await pageSF.page.getByRole("button", { name: "Access to my content" }).click();
          await pageSF.page.waitForLoadState("networkidle");
        }

        //Verify trên My product list
        await pageSF.page.goto(`https://${suiteConf.shop_creator.domain}/${caseConf.handles.my_product_list}`);
        await pageSF.page.waitForLoadState("networkidle");

        await snapshotFixture.verifyWithAutoRetry({
          page: pageSF.page,
          selector: productCard.xpathMyProductCreator,
          snapshotName: `${caseConf.snapshot.common_setting}-${index}-${process.env.ENV}-SF-mobile-My-product-list.png`,
        });
        index++;
      }
    });
  });
});
