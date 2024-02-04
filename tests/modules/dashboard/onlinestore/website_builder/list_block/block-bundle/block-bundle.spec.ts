import { verifyWidthHeightCSSInRange } from "@core/utils/css";
import { waitForImageLoaded } from "@core/utils/theme";
import { test, expect } from "@fixtures/website_builder";
import { AppsAPI } from "@pages/api/apps";
import { CrossSellAPI } from "@pages/api/apps/upsell/cross-sell";
import { ProductAPI } from "@pages/api/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { SFUpSellAPI } from "@pages/new_ecom/storefront/apps/upsell/cross-sell";
import { UpSell } from "@pages/new_ecom/storefront/upsell";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SFCart } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { Locator, Page } from "@playwright/test";
import { ShopTheme, ElementPosition, Products, UpsellOffer } from "@types";

let webBuilder: WebBuilder,
  block: Blocks,
  app: AppsAPI,
  productSF: UpSell,
  upsell: SFUpSellAPI,
  apps: CrossSellAPI,
  prodAPI: ProductAPI,
  duplicatedTheme: ShopTheme,
  listBundles: UpsellOffer[],
  listQty: UpsellOffer[],
  listProduct: Products[],
  prodA: Products,
  prodB: Products,
  offer: UpsellOffer,
  contentAlignLeft: Locator,
  shapeValue: Locator,
  alignCenter: Locator,
  widthValue: Locator,
  widthUnit: Locator,
  background: Locator,
  borderColor: Locator,
  borderValue: Locator,
  opacity: Locator,
  radius: Locator,
  shadow: Locator,
  padding: Locator,
  margin: Locator,
  dataSource: Locator,
  headingToggleBtn: Locator,
  buttonAction: Locator,
  addBundle: { parent_position: ElementPosition; basics_cate: string; template: string },
  productsTitle: string[];
const softAssertion = expect.configure({ soft: true, timeout: 15000 });

test.describe("@SB_BUNDLES Check block bundles", () => {
  test.beforeEach(async ({ dashboard, conf, cConf, theme, api, authRequest, builder, context }, testInfo) => {
    test.setTimeout(testInfo.timeout + 60_000);
    prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    app = new AppsAPI(conf.suiteConf.domain, authRequest);
    productsTitle = conf.suiteConf.products_title;
    addBundle = conf.suiteConf.add_bundle;
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain, context);
    block = new Blocks(dashboard, conf.suiteConf.domain);
    productSF = new UpSell(dashboard, conf.suiteConf.domain, api);
    upsell = new SFUpSellAPI(conf.suiteConf.domain, api);
    apps = new CrossSellAPI(conf.suiteConf.domain);
    listBundles = await app.getListUpsellOffers({ offer_types: "bundle", limit: 500, only_active: false });
    listQty = await app.getListUpsellOffers({ offer_types: "quantity", limit: 500, only_active: false });
    listProduct = await prodAPI.getAllProduct(conf.suiteConf.domain);
    offer = listBundles.find(o => o.offer_name === "Test Bundle offer");
    prodA = listProduct.find(prod => prod.title === "Product A");
    prodB = listProduct.find(prod => prod.title === "Product B");
    contentAlignLeft = webBuilder.genLoc(block.getSelectorByLabel("content_align")).locator(block.alignOptions).first();
    shapeValue = webBuilder.genLoc(block.getSelectorByLabel("shape")).getByRole("button");
    alignCenter = webBuilder.genLoc(block.getSelectorByLabel("align_self")).locator(block.alignOptions).nth(1);
    widthValue = webBuilder.genLoc(block.getSelectorByLabel("width")).getByRole("spinbutton");
    widthUnit = webBuilder.genLoc(block.getSelectorByLabel("width")).getByRole("button");
    background = webBuilder.genLoc(block.getSelectorByLabel("background")).locator(block.colorSidebar);
    borderColor = webBuilder.genLoc(block.getSelectorByLabel("border")).locator(block.colorSidebar);
    borderValue = webBuilder.genLoc(block.getSelectorByLabel("border")).getByRole("button");
    opacity = webBuilder.genLoc(block.getSelectorByLabel("opacity")).getByRole("spinbutton");
    radius = webBuilder.genLoc(block.getSelectorByLabel("border_radius")).getByRole("spinbutton");
    shadow = webBuilder.genLoc(block.getSelectorByLabel("box_shadow")).getByRole("button");
    padding = webBuilder.genLoc(block.getSelectorByLabel("padding")).getByRole("textbox");
    margin = webBuilder.genLoc(block.getSelectorByLabel("margin")).getByRole("textbox");
    dataSource = block.dataSource;
    headingToggleBtn = webBuilder.genLoc(block.getSelectorByLabel("show_heading")).getByRole("checkbox");
    buttonAction = webBuilder.genLoc(block.getSelectorByLabel("button_action")).getByRole("button");

    await test.step("Restore offer default state", async () => {
      const allOfferIds = [];
      const offerOnIds = [];
      const listOffers: UpsellOffer[] = [];
      listOffers.push(...listBundles, ...listQty);
      const bundles = listBundles.map(o => o.id);
      const qty = listQty.map(o => o.id);
      allOfferIds.push(...bundles, ...qty);
      cConf.active_offers.forEach(title => {
        const activeOffer = listOffers.find(o => o.offer_name === title);
        offerOnIds.push(activeOffer.id);
      });
      const offerOffIds: number[] = allOfferIds.filter(element => !offerOnIds.includes(element));
      await app.updateOffer(offer.id, {
        ...offer,
        target_type: "all",
        offer_message: "Frequently bought together",
        discount_data: '{"percentage_discount":10}',
      });
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        offer_ids: offerOnIds,
        status: true,
      });
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        offer_ids: offerOffIds,
        status: false,
      });
      const libraries = await builder.listLibrary({ action: "all" });
      const listLibrary = [];
      libraries.forEach(lib => {
        if (lib.id !== 1) {
          listLibrary.push(lib.id);
        }
      });
      if (listLibrary.length > 0) {
        for (const library of listLibrary) {
          await builder.deleteLibrary(library);
        }
      }
    });

    await test.step("Pre-condition: Turn off smart bundles if it is on", async () => {
      const response = await app.getCTABtnSettings();
      const smartBundleStatus = response.smart_cross_sell.enable;
      if (smartBundleStatus) {
        await app.changeCTABtnSettings(conf.suiteConf.smart_bundles_off);
      }
    });

    await test.step("Duplicate test theme", async () => {
      duplicatedTheme = await theme.duplicate(conf.suiteConf.theme_test);
    });

    await test.step("Open web builder page product", async () => {
      await Promise.all([
        webBuilder.openWebBuilder({
          type: "ecom product custom",
          id: duplicatedTheme.id,
          productId: prodA.id,
          layout: "default",
        }),
        webBuilder.loadingScreen.waitFor(),
      ]);
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.reloadIfNotShow(conf.suiteConf.page_type);
    });

    await test.step(`Add block Bundle`, async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
    });
  });

  test.afterEach(async ({ theme, conf }) => {
    await test.step("Restore data", async () => {
      const listTemplate = [];
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_test) {
        await theme.publish(conf.suiteConf.theme_test);
      }
      const listTheme = await theme.list();
      listTheme.forEach(template => {
        if (!template.active) {
          listTemplate.push(template.id);
        }
      });
      if (listTemplate.length > 0) {
        for (const template of listTemplate) {
          if (template !== conf.suiteConf.theme_test) {
            await theme.delete(template);
          }
        }
      }
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_01 Check default data khi add Bundle block`, async ({
    context,
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const expected = conf.caseConf.expected;
    const blockInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    const addAllBtnPreview = blockInPreview.getByRole("button", { name: "Add all to cart" });
    const totalPricePreview = blockInPreview.locator(block.bundleTotalPrice);
    const totalPriceLabelPreview = blockInPreview.locator(block.bundleTotalPriceLabel);
    const pricePreview = blockInPreview.locator(block.bundlePrice).first();
    const labelPreview = blockInPreview.locator(block.bundleLabel).first();
    const subTextPreview = blockInPreview.locator(block.bundleSubText);
    const headingPreview = blockInPreview.locator(block.bundleHeading);
    const dividerPreview = blockInPreview.locator(block.bundleDivider);

    await test.step(`Verify settings default của block Bundle`, async () => {
      await block.switchToTab("Design");
      await softAssertion(contentAlignLeft).toHaveClass(new RegExp(expected.active));
      await softAssertion(shapeValue).toHaveText(expected.shape_default);
      await softAssertion(alignCenter).toHaveClass(new RegExp(expected.active));
      await softAssertion(widthValue).toHaveValue(expected.width_value_default);
      await softAssertion(widthUnit).toHaveText(expected.width_unit_default);
      await softAssertion(background).not.toHaveAttribute("style", expected.background_default);
      await softAssertion(borderColor).not.toHaveAttribute("style", expected.border_color_default);
      await softAssertion(borderValue).toHaveText(expected.border_value_default);
      await softAssertion(opacity).toHaveValue(expected.opacity_default);
      await softAssertion(radius).toHaveValue(expected.radius_default);
      await softAssertion(shadow).toHaveText(expected.shadow_default);
      await softAssertion(padding).toHaveValue(expected.padding_default);
      await softAssertion(margin).toHaveValue(expected.margin_default);
      await block.switchToTab("Content");
      await softAssertion(dataSource).toHaveText(productsTitle[0]);
      await softAssertion(headingToggleBtn).toHaveAttribute("value", expected.toggle_on);
      await softAssertion(buttonAction).toHaveText(expected.button_action_default);
      await softAssertion(headingPreview).toHaveCSS("font-size", expected.h4_font_size);
      await softAssertion(headingPreview).toHaveCSS("color", expected.color_5);
      await softAssertion(totalPriceLabelPreview).toHaveCSS("font-size", expected.p3_font_size);
      await softAssertion(totalPriceLabelPreview).toHaveCSS("color", expected.sub_text_color);
      await softAssertion(totalPricePreview).toHaveCSS("font-size", expected.p2_font_size);
      await softAssertion(totalPricePreview).toHaveCSS("color", expected.color_4);
      await softAssertion(pricePreview).toHaveCSS("font-size", expected.p3_font_size);
      await softAssertion(pricePreview).toHaveCSS("color", expected.color_4);
      await softAssertion(labelPreview).toHaveCSS("font-size", expected.p3_font_size);
      await softAssertion(labelPreview).toHaveCSS("color", expected.color_5);
      await softAssertion(subTextPreview).toHaveCSS("font-size", expected.sub_text_font_size);
      await softAssertion(subTextPreview).toHaveCSS("color", expected.sub_text_color);
      await softAssertion(dividerPreview).toHaveCSS("background-color", expected.divider);
      await softAssertion(addAllBtnPreview).toHaveClass(new RegExp(expected.primary_btn));
      await waitForImageLoaded(dashboard, block.bundleImages, block.iframe);
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: blockInPreview,
        combineOptions: {
          mask: [blockInPreview.locator(block.bundleImages)],
          animations: "disabled",
        },
        snapshotName: expected.bundle_offer_default,
      });
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.toastMessage.waitFor();
      await webBuilder.toastMessage.waitFor({ state: "hidden" });
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    await test.step("Verify block Bundle vừa add hiển thị ở preview", async () => {
      await expect(blockBundles).toBeVisible();
    });

    await test.step(`Click add all to cart`, async () => {
      const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
      await addAllBtn.click();
    });

    await test.step("Verify page redirect to checkout page", async () => {
      await expect(productSF.page).toHaveURL(new RegExp(expected.checkout_url));
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_02 Check bundle khi set 1 bộ data`, async ({ context, conf }) => {
    const dataDesign = conf.caseConf.data_design;
    const expected = conf.caseConf.expected;
    const blockInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step(`Đổi setting của Block bundle tab Design`, async () => {
      await block.switchToTab("Design");
      await block.settingDesignAndContentWithSDK(dataDesign);
    });

    await test.step("Verify block ở webfront", async () => {
      const imageShape = blockInPreview.locator(block.bundleImages).locator(block.imageShape);
      const imageShapeCount = await imageShape.count();
      await softAssertion(blockInPreview.locator(block.bundleContentAlign)).toHaveClass(
        new RegExp(expected.preview_content_align),
      );
      for (let i = 0; i < imageShapeCount; i++) {
        await softAssertion(imageShape.nth(i)).toHaveClass(new RegExp(expected.preview_shape));
      }
      await softAssertion(blockInPreview).toHaveCSS("width", expected.preview_width);
      await softAssertion(blockInPreview).toHaveCSS("position", expected.preview_position);
      await softAssertion(blockInPreview).toHaveCSS("align-self", expected.preview_align);
      await softAssertion(blockInPreview.locator(block.blockBundle)).toHaveCSS(
        "background-color",
        expected.preview_background,
      );
      await softAssertion(blockInPreview).toHaveCSS("border", expected.preview_border);
      await softAssertion(blockInPreview.locator(block.blockBundle)).toHaveCSS("opacity", expected.preview_opacity);
      await softAssertion(blockInPreview.locator(block.blockBundle)).toHaveCSS(
        "border-radius",
        expected.preview_radius,
      );
      await softAssertion(blockInPreview.locator(block.blockBundle)).toHaveCSS("box-shadow", expected.preview_shadow);
      await softAssertion(blockInPreview).toHaveCSS("margin", expected.preview_margin);
      await softAssertion(blockInPreview.locator(block.blockBundle)).toHaveCSS("padding", expected.preview_padding);
    });

    await test.step(`Đổi setting của Block bundle tab Content`, async () => {
      const dataContent = conf.caseConf.data_content;
      await block.switchToTab("Content");
      await block.changeContent(dataContent);
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    await test.step("Verify block Bundle vừa add hiển thị ở preview", async () => {
      await expect(blockBundles).toBeVisible();
    });

    await test.step(`Click add all to cart`, async () => {
      const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
      await addAllBtn.click();
      await productSF.page.waitForLoadState("networkidle");
    });

    await test.step("Verify stay in the same page", async () => {
      await expect(productSF.page).not.toHaveURL(new RegExp(expected.checkout_or_cart));
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_03 Check trường Content align`, async ({ context, conf }) => {
    const dataDriven = conf.caseConf.data_driven;
    for (const option of dataDriven) {
      await test.step(`Chọn content align = ${option.content_align}`, async () => {
        await block.switchToTab("Design");
        await block.selectAlign("content_align", option.content_align);
      });

      await test.step(`Nhấn save > click preview button`, async () => {
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.toastMessage.waitFor();
        await webBuilder.toastMessage.waitFor({ state: "hidden" });
        const [previewPage] = await Promise.all([
          context.waitForEvent("page"),
          webBuilder.clickBtnNavigationBar("preview"),
        ]);
        await previewPage.waitForLoadState("networkidle");
        productSF = new UpSell(previewPage, conf.suiteConf.domain);
      });

      const blockBundles = productSF.sectionsInSF
        .first()
        .locator(productSF.columnsInSF)
        .locator(productSF.blocksInSF)
        .and(productSF.genLoc(productSF.bundleBlock));
      await test.step("Verify block Bundle vừa add hiển thị ở preview có align đúng như đã edit", async () => {
        await expect(blockBundles).toBeVisible();
        await expect(blockBundles.locator(productSF.bundleContentAlign)).toHaveClass(
          new RegExp(option.expected_content_align),
        );
        await productSF.page.close();
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_04 Check trường Shape`, async ({ context, conf }) => {
    const dataDriven = conf.caseConf.data_driven;
    for (const option of dataDriven) {
      await test.step(`Chọn shape = ${option.shape}`, async () => {
        await block.switchToTab("Design");
        await block.selectDropDown("shape", option.shape);
      });

      await test.step(`Nhấn save > click preview button`, async () => {
        await block.clickSave();
        const [previewPage] = await Promise.all([
          context.waitForEvent("page"),
          webBuilder.clickBtnNavigationBar("preview"),
        ]);
        await previewPage.waitForLoadState("networkidle");
        productSF = new UpSell(previewPage, conf.suiteConf.domain);
      });

      const blockBundles = productSF.sectionsInSF
        .first()
        .locator(productSF.columnsInSF)
        .locator(productSF.blocksInSF)
        .and(productSF.genLoc(productSF.bundleBlock));
      await test.step("Verify block Bundle vừa add hiển thị ở preview có align đúng như đã edit", async () => {
        const imageShape = blockBundles.locator(productSF.bundleImages).locator(productSF.imageShape);
        await expect(blockBundles).toBeVisible();
        const imageShapeCount = await imageShape.count();
        for (let i = 0; i < imageShapeCount; i++) {
          await softAssertion(imageShape.nth(i)).toHaveClass(new RegExp(option.expected_shape));
        }
        await productSF.page.close();
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_05 Check bundle block apply data source/page data`, async ({ context, conf }) => {
    const expected = conf.caseConf.expected;
    const dataSource = conf.caseConf.data_source;
    const blockInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));

    await test.step(`Add blank section, không assign data source cho section`, async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.add_blank_section);
      await webBuilder.selectDropDownDataSource("variable", { category: "None" });
    });

    await test.step(`Add block bundle vào section`, async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_block);
      await blockInPreview.waitFor();
      await block.backBtn.click();
      await blockInPreview.click();
    });

    await test.step("Verify hiển thị placeholder của block bundle", async () => {
      await softAssertion(webBuilder.frameLocator.locator(block.quickSettingsBlock)).toBeVisible();
      await softAssertion(block.breadCrumb.getByRole("paragraph")).toHaveText(expected.missing_data_source);
      await block.breadCrumb.getByRole("paragraph").hover();
      await softAssertion(
        blockInPreview.locator(block.bundleImages).locator(block.bundleImagePlaceholder).first(),
      ).toBeVisible();
      await softAssertion(blockInPreview.locator(block.bundleProductName).first()).toContainText(
        expected.placeholder_product,
      );
    });

    await test.step(`Chọn section data source = Product test offer (product này không có bundle)`, async () => {
      await webBuilder.clickOnElement(webBuilder.getSelectorByIndex({ section: 1 }), webBuilder.iframe);
      await block.selectDropDownDataSource("variable", dataSource.no_offer, true);
    });

    await test.step("Verify vẫn hiển thị placeholder vì product không có bundle offer", async () => {
      await blockInPreview.click();
      await softAssertion(block.breadCrumb).not.toHaveText(expected.missing_data_source);
      await softAssertion(
        blockInPreview.locator(block.bundleImages).locator(block.bundleImagePlaceholder).first(),
      ).toBeVisible();
      await softAssertion(blockInPreview.locator(block.bundleLabel).first()).toContainText(
        expected.placeholder_product,
      );
    });

    await test.step(`Chọn section data source = Product A (product này đã có bundle)`, async () => {
      await webBuilder.clickOnElement(webBuilder.getSelectorByIndex({ section: 1 }), webBuilder.iframe);
      await block.selectDropDownDataSource("variable", dataSource.product_a);
    });

    await test.step("Verify hiển thị bundle của Product A", async () => {
      const productsInBundle = blockInPreview.locator(block.bundleProductName);
      const prodPriceInBundle = blockInPreview.locator(block.bundlePrice);
      const totalPrice = blockInPreview.locator(block.bundleTotalPrice);
      const discount = blockInPreview.locator(block.bundleSubText);
      for (let i = 0; i < (await productsInBundle.count()); i++) {
        await softAssertion(productsInBundle.nth(i)).toHaveText(expected.bundle_a.products[i]);
        await softAssertion(prodPriceInBundle.nth(i)).toHaveText(expected.bundle_a.products_price[i]);
      }
      await softAssertion(totalPrice).toHaveText(expected.bundle_a.total_price);
      await softAssertion(discount).toHaveText(expected.bundle_a.discount);
    });

    await test.step(`Chọn data source = Product C (product có bundle)`, async () => {
      await blockInPreview.click();
      await block.switchToTab("Content");
      await block.setBlockDataSource(dataSource.product_c);
    });

    await test.step("Verify hiển thị bundle của Product C", async () => {
      const productsInBundle = blockInPreview.locator(block.bundleProductName);
      const prodPriceInBundle = blockInPreview.locator(block.bundlePrice);
      const totalPrice = blockInPreview.locator(block.bundleTotalPrice);
      const discount = blockInPreview.locator(block.bundleSubText);
      for (let i = 0; i < (await productsInBundle.count()); i++) {
        await softAssertion(productsInBundle.nth(i)).toHaveText(expected.bundle_c.products[i]);
        await softAssertion(prodPriceInBundle.nth(i)).toHaveText(expected.bundle_c.products_price[i]);
      }
      await softAssertion(totalPrice).toHaveText(expected.bundle_c.total_price);
      await softAssertion(discount).toHaveText(expected.bundle_c.discount);
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    await test.step("Verify block Bundle hiển thị ở preview hiển thị giống ", async () => {
      const productsInBundle = blockBundles.locator(productSF.bundleProduct);
      const prodPriceInBundle = blockBundles.locator(productSF.bundlePrice);
      const totalPrice = blockBundles.locator(productSF.bundleTotalPrice);
      const discount = blockBundles.locator(productSF.bundleDiscount);
      await expect(blockBundles).toBeVisible();
      for (let i = 0; i < (await productsInBundle.count()); i++) {
        await softAssertion(productsInBundle.nth(i)).toHaveText(expected.bundle_c.products[i]);
        await softAssertion(prodPriceInBundle.nth(i)).toHaveText(expected.bundle_c.products_price[i]);
      }
      await softAssertion(totalPrice).toHaveText(expected.bundle_c.total_price);
      await softAssertion(discount).toHaveText(expected.bundle_c.discount);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_06 Check trường Heading tab setting`, async ({ context, conf }) => {
    const dataHeadingOff = conf.caseConf.switch_off;
    const dataHeadingOn = conf.caseConf.switch_on;
    const blockInPreview = block.frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step(`Click off heading toggle`, async () => {
      await block.switchToTab("Content");
      await block.changeContent(dataHeadingOff);
    });

    await test.step("Verify heading bundle bị ẩn khỏi webfront preview", async () => {
      await expect(blockInPreview.locator(block.bundleHeading)).toBeHidden();
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    let blockInSF = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    await test.step("Verify heading bundle bị ẩn khỏi preview", async () => {
      await expect(blockInSF.locator(productSF.bundleOfferHeading)).toBeHidden();
      await productSF.page.close();
    });

    await test.step(`Click on heading toggle`, async () => {
      await block.changeContent(dataHeadingOn);
    });

    await test.step("Verify heading bundle hiển thị lại ở webfront preview", async () => {
      await expect(blockInPreview.locator(block.bundleHeading)).toBeVisible();
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    blockInSF = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    await test.step("Verify heading bundle hiển thị ở preview", async () => {
      await expect(blockInSF.locator(productSF.bundleOfferHeading)).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_07 Check trường Button action`, async ({ context, conf }) => {
    for (const editAction of conf.caseConf.edit_action) {
      await test.step(`Dashboard > Set button action = ${editAction.button_action} Nhấn save > click preview button`, async () => {
        await block.changeContent(editAction);
        await webBuilder.clickSave();
        const [previewPage] = await Promise.all([
          context.waitForEvent("page"),
          webBuilder.clickBtnNavigationBar("preview"),
        ]);
        await previewPage.waitForLoadState("networkidle");
        productSF = new UpSell(previewPage, conf.suiteConf.domain);
      });

      const blockBundles = productSF.sectionsInSF
        .first()
        .locator(productSF.columnsInSF)
        .locator(productSF.blocksInSF)
        .first();
      await test.step(`Click Add all to cart button`, async () => {
        const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
        await addAllBtn.click();
        await addAllBtn.waitFor({ state: "hidden" });
      });

      await test.step(`Verify không hiện customize popup và ${editAction.button_action}`, async () => {
        await expect(productSF.customizeProductPopup).toBeHidden();
        await expect(productSF.page).toHaveURL(new RegExp(editAction.expected_url));
        await productSF.page.close();
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_08 Check resize Bundle block bằng thao tác trên web front`, async ({
    dashboard,
    snapshotFixture,
    context,
    conf,
  }) => {
    test.slow(); // Test chạy lâu cần thêm timeout
    const caseConf = conf.caseConf;
    const expected = caseConf.expected;
    const editWidth = caseConf.edit_width;
    const sectionPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1 }));
    const columnPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, column: 1 }));
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));

    await test.step("Pre-condition: Active offer và mở Web builder", async () => {
      const testProd = listProduct.find(
        prod => prod.title === "[BBO_08] Addition product with long long long long name #0",
      );
      await webBuilder.clickSave();
      await Promise.all([
        webBuilder.openWebBuilder({
          type: "ecom product custom",
          id: duplicatedTheme.id,
          productId: testProd.id,
          layout: "default",
        }),
        webBuilder.loadingScreen.waitFor(),
      ]);
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.reloadIfNotShow(conf.suiteConf.page_type);
      await waitForImageLoaded(dashboard, block.bundleImages, webBuilder.iframe);
    });

    await test.step(`Dashboard > Click vào bundle block`, async () => {
      await bundleInPreview.click();
    });

    await test.step("Chỉ hiển thị resize left right", async () => {
      await softAssertion(block.getResizerInLivePreview("left")).toBeVisible();
      await softAssertion(block.getResizerInLivePreview("right")).toBeVisible();
      await softAssertion(block.getResizerInLivePreview("bottom")).not.toBeAttached();
      await softAssertion(block.getResizerInLivePreview("top")).not.toBeAttached();
      await softAssertion(block.getResizerInLivePreview("bottom-left")).not.toBeAttached();
      await softAssertion(block.getResizerInLivePreview("bottom-right")).not.toBeAttached();
      await softAssertion(block.getResizerInLivePreview("top-right")).not.toBeAttached();
      await softAssertion(block.getResizerInLivePreview("top-left")).not.toBeAttached();
    });

    const sectionBox = await sectionPreview.boundingBox();
    const columnBox = await columnPreview.boundingBox();
    await test.step(`trên web front, Kéo dài size chiều ngang của Bundle block đến cạnh của side bar`, async () => {
      await block.resizeBlock(bundleInPreview, {
        at_position: "right",
        to_specific_point: {
          x: sectionBox.width,
        },
      });
    });

    await test.step("Verify kéo max width = width column", async () => {
      await softAssertion(bundleInPreview).toHaveCSS("width", `${Math.round(columnBox.width)}px`);
    });

    await test.step(`Check hiển thị image`, async () => {
      await block.backBtn.click();
      await softAssertion(bundleInPreview).not.toHaveClass(new RegExp(conf.caseConf.selected));
      const imageBundle = bundleInPreview.locator(block.bundleImages).getByRole("img");
      await softAssertion(bundleInPreview.locator(block.bundleImages)).toHaveCSS("gap", expected.padding_image);
      await softAssertion(bundleInPreview.locator(block.bundleImages)).toHaveCSS(
        "margin-left",
        expected.images_margin.left,
      );
      await softAssertion(bundleInPreview.locator(block.bundleImages)).toHaveCSS(
        "margin-right",
        expected.images_margin.right,
      );
      for (const image of await imageBundle.all()) {
        await verifyWidthHeightCSSInRange(image, "width", {
          min: expected.image_width_min,
          max: expected.image_width_max,
        });
      }
    });

    await test.step(`Trên web front, thu hẹp size chiều ngang của Bundle block < 240Px `, async () => {
      await bundleInPreview.click();
      await block.changeDesign({ width: { label: "width", value: { unit: "Px" } } });
      await block.resizeBlock(bundleInPreview, {
        at_position: "left",
        to_specific_point: {
          x: caseConf.decrease_width,
        },
      });
    });

    await test.step("Verify clip content", async () => {
      await softAssertion(widthValue).toHaveValue(expected.sidebar_width_value);
      await softAssertion(widthUnit).toHaveText(expected.sidebar_width_unit);
      await softAssertion(bundleInPreview).toHaveCSS("width", expected.width_after_decrease);
      await block.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: bundleInPreview,
        combineOptions: {
          mask: [bundleInPreview.locator(block.bundleImages)],
          animations: "disabled",
        },
        snapshotName: expected.clip_content_snapshot,
      });
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    let blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    await test.step("Verify bundle hiển thị đúng ở preview", async () => {
      const imageBundle = blockBundles.locator(productSF.bundleImages).getByRole("img");
      await expect(blockBundles).toBeVisible();
      await waitForImageLoaded(productSF.page, productSF.bundleImages);
      await softAssertion(blockBundles).toHaveCSS("width", expected.width_after_decrease);
      for (const image of await imageBundle.all()) {
        await verifyWidthHeightCSSInRange(image, "width", {
          min: expected.image_min_width - 1,
          max: expected.image_min_width + 1,
        });
      }
      await productSF.page.close();
    });

    await test.step(`tại side bar, thay đổi giá trị của width`, async () => {
      await bundleInPreview.click();
      await block.changeDesign(editWidth);
    });

    await test.step("Verify width ở preview hiển thị đúng", async () => {
      await softAssertion(bundleInPreview).toHaveCSS("width", `${editWidth.width.value.value}px`);
    });

    await test.step(`Check hiển thị image`, async () => {
      const imageBundle = bundleInPreview.locator(block.bundleImages).getByRole("img");
      for (const image of await imageBundle.all()) {
        await verifyWidthHeightCSSInRange(image, "width", {
          min: expected.image_width_after_edit - 1,
          max: expected.image_width_after_edit + 1,
        });
      }
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    await test.step("Verify bundle hiển thị đúng ở preview", async () => {
      const imageBundle = blockBundles.locator(productSF.bundleImages).getByRole("img");
      await expect(blockBundles).toBeVisible();
      await softAssertion(blockBundles).toHaveCSS("width", `${editWidth.width.value.value}px`);
      for (const image of await imageBundle.all()) {
        await verifyWidthHeightCSSInRange(image, "width", {
          min: expected.image_width_after_edit - 1,
          max: expected.image_width_after_edit + 1,
        });
      }
      await productSF.page.close();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_09 Check remove Bundle block trên Quick bar setting`, async ({ context, conf }) => {
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Trên web front click vào Bundle block", async () => {
      await block.backBtn.click();
      await bundleInPreview.click();
    });

    await test.step("Verify quickbar setting and sidebar default in Design tab", async () => {
      await expect(webBuilder.frameLocator.locator(block.quickSettingsBlock)).toBeVisible();
      await expect(block.activeTab).toHaveText(expected.active_tab_default);
      await webBuilder.switchToTab("Design");
    });

    await test.step(`Click remove block`, async () => {
      await block.selectOptionOnQuickBar("Delete");
    });

    await test.step("Verify block không hiển thị ở preview", async () => {
      await expect(bundleInPreview).toBeHidden();
      await expect(bundleInPreview).not.toBeAttached();
    });

    await test.step(`Save và check hiển thị ngoài SF`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.toastMessage.waitFor();
      await webBuilder.toastMessage.waitFor({ state: "hidden" });
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
      const blockBundles = productSF.sectionsInSF
        .first()
        .locator(productSF.columnsInSF)
        .locator(productSF.blocksInSF)
        .first();
      await expect(blockBundles).toBeHidden();
      await expect(blockBundles).not.toBeAttached();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_10 Check duplicate Bundle block`, async ({
    dashboard,
    snapshotFixture,
    context,
    conf,
  }) => {
    test.slow(); // tăng timeout cho stable
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    const duplicatedBundle = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 2 }));
    await test.step("Trên web front click vào Bundle block", async () => {
      await block.backBtn.click();
      await bundleInPreview.click();
    });

    await test.step("Verify quickbar setting", async () => {
      await expect(webBuilder.frameLocator.locator(block.quickSettingsBlock)).toBeVisible();
    });

    await test.step(`Click duplicate block`, async () => {
      await block.selectOptionOnQuickBar("Duplicate");
    });

    await test.step("Verify block duplicate có settings giống và ở trạng thái selected", async () => {
      await expect(duplicatedBundle).toHaveClass(new RegExp(expected.selected));
      const imageShape = duplicatedBundle.locator(block.bundleImages).locator(block.imageShape);
      await softAssertion(duplicatedBundle.locator(block.bundleContentAlign)).toHaveClass(
        new RegExp(expected.preview_content_align),
      );
      for (let i = 0; i < (await imageShape.count()); i++) {
        await softAssertion(imageShape.nth(i)).toHaveClass(new RegExp(expected.preview_shape));
      }
      await softAssertion(duplicatedBundle).toHaveCSS("width", expected.preview_width);
      await softAssertion(duplicatedBundle).toHaveCSS("position", expected.preview_position);
      await softAssertion(duplicatedBundle).toHaveCSS("align-self", expected.preview_align);
      await softAssertion(duplicatedBundle.locator(block.blockBundle)).toHaveCSS(
        "background-color",
        expected.preview_background,
      );
      await softAssertion(duplicatedBundle).toHaveCSS("border", expected.preview_border);
      await softAssertion(duplicatedBundle.locator(block.blockBundle)).toHaveCSS("opacity", expected.preview_opacity);
      await softAssertion(duplicatedBundle.locator(block.blockBundle)).toHaveCSS(
        "border-radius",
        expected.preview_radius,
      );
      await softAssertion(duplicatedBundle.locator(block.blockBundle)).toHaveCSS("box-shadow", expected.preview_shadow);
      await softAssertion(duplicatedBundle).toHaveCSS("margin", expected.preview_margin);
      await softAssertion(duplicatedBundle.locator(block.blockBundle)).toHaveCSS("padding", expected.preview_padding);
    });

    await test.step(`Save và check hiển thị ngoài SF`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
      const blockBundles = productSF.sectionsInSF
        .first()
        .locator(productSF.columnsInSF)
        .locator(productSF.blocksInSF)
        .and(productSF.genLoc(productSF.bundleBlock));
      //Reload nếu bị trắng màn hình
      try {
        await dashboard.waitForResponse("app.json", { timeout: 30000 });
      } catch (error) {
        await dashboard.reload({ waitUntil: "domcontentloaded" });
      }
      await waitForImageLoaded(previewPage, productSF.bundleImages);
      await expect(blockBundles.nth(1)).toBeVisible();
      await expect(blockBundles).toHaveCount(expected.bundles_count);
      await expect(blockBundles.getByRole("button", { name: "Add all to cart" }).last()).toHaveCSS(
        "background-color",
        expected.bundle_loaded,
      );
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: blockBundles.nth(1),
        snapshotName: expected.block_bundle_snapshot,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_12 Check hide/show bundle block`, async ({ context, conf }) => {
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Trên web front click vào Bundle block", async () => {
      await block.backBtn.click();
      await bundleInPreview.click();
    });

    await test.step(`Click hide block`, async () => {
      await block.quickBarButton("Hide").click();
    });

    await test.step("Verify block is hidden in web front preview", async () => {
      await expect(bundleInPreview).toBeHidden();
    });

    await test.step(`Save và check hiển thị ngoài SF`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
      const blockBundle = productSF.sectionsInSF
        .nth(0)
        .locator(productSF.columnsInSF)
        .locator(productSF.blocksInSF)
        .and(productSF.genLoc(productSF.bundleBlock));
      await expect(blockBundle).toBeHidden();
      await previewPage.close();
    });

    await test.step(`Trong web front, click show block`, async () => {
      await block.backBtn.click();
      await block.expandCollapseLayer({ sectionName: conf.caseConf.expand_section, isExpand: true });
      await block.hideOrShowLayerInSidebar({
        sectionName: conf.caseConf.expand_section,
        subLayerName: conf.caseConf.show_block,
        isHide: false,
      });
    });

    await test.step("Verify block is hidden in web front preview", async () => {
      await expect(bundleInPreview).toBeVisible();
    });

    await test.step(`Save và check hiển thị ngoài SF`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
      const blockBundle = productSF.sectionsInSF
        .nth(0)
        .locator(productSF.columnsInSF)
        .locator(productSF.blocksInSF)
        .and(productSF.genLoc(productSF.bundleBlock));
      await waitForImageLoaded(previewPage, productSF.bundleImages);
      await expect(blockBundle).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_13 Check add to library bundle block`, async ({ conf }) => {
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Trên web front click vào Bundle block", async () => {
      await block.backBtn.click();
      await bundleInPreview.click();
    });

    await test.step(`Click Save as template button`, async () => {
      await block.quickBarButton("Save as template").click();
    });

    await test.step("Verify popup save as template appear", async () => {
      await expect(webBuilder.saveTemplatePopup).toBeVisible();
    });

    await test.step(`Điền đầy đủ thông tin cho template, nhấn Save`, async () => {
      await block.saveAsTemplate(conf.caseConf.save_data);
    });

    await test.step("Verify save successfully message", async () => {
      await expect(block.toastMessage).toHaveText(expected.success_message);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_14 Check remove Bundle block trên side bar`, async ({ context, conf }) => {
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Trên web front click vào Bundle block", async () => {
      await block.backBtn.click();
      await bundleInPreview.click();
    });

    await test.step(`Click remove block`, async () => {
      await block.removeLayer({ sectionName: conf.caseConf.section_name, subLayerName: conf.caseConf.block });
    });

    await test.step("Verify block is deleted in webfront preview", async () => {
      await expect(bundleInPreview).toBeHidden();
      await expect(bundleInPreview).not.toBeAttached();
    });

    await test.step(`Save và check hiển thị ngoài SF`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
      const blockBundles = productSF.sectionsInSF
        .first()
        .locator(productSF.columnsInSF)
        .locator(productSF.blocksInSF)
        .first();
      await expect(blockBundles).toBeHidden();
      await expect(blockBundles).not.toBeAttached();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_15 Check hiển thị product có 1 bundle duy nhất`, async ({
    dashboard,
    context,
    conf,
    cConf,
  }) => {
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Pre-condition: turn on offer test and open web builder", async () => {
      const prodWithImg = listProduct.find(prod => prod.title === cConf.product_img);
      await Promise.all([
        block.openWebBuilder({
          type: "ecom product custom",
          id: duplicatedTheme.id,
          productId: prodWithImg.id,
          layout: "default",
        }),
        block.loadingScreen.waitFor(),
      ]);
      await block.reloadIfNotShow("web builder");
    });

    await test.step(`Add bundle block vào section 1`, async () => {
      await block.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
    });

    await test.step("Verify webfront preview", async () => {
      const productWithImage = bundleInPreview
        .locator(block.bundleImage)
        .first()
        .filter({ has: dashboard.getByRole("img") });
      const productWithNoImage = bundleInPreview
        .locator(block.bundleImage)
        .nth(1)
        .filter({ has: dashboard.locator(block.bundleImagePlaceholder) });
      await expect(productWithImage).toBeVisible();
      await expect(productWithNoImage).toBeVisible();
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.toastMessage.waitFor();
      await webBuilder.toastMessage.waitFor({ state: "hidden" });
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    const blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    await test.step(`Check hiển thị product không có ảnh`, async () => {
      const productWithImage = blockBundles
        .locator(productSF.bundleImage)
        .first()
        .filter({ has: productSF.page.getByRole("img") });
      const productWithNoImage = blockBundles
        .locator(productSF.bundleImage)
        .nth(1)
        .filter({ has: productSF.genLoc(productSF.bundleImagePlaceholder) });
      await expect(productWithImage).toBeVisible();
      await expect(productWithNoImage).toBeVisible();
      await expect(blockBundles.locator(productSF.bundleNavigationBtn)).toBeHidden();
    });

    await test.step(`Click Add all to cart`, async () => {
      const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
      await addAllBtn.click();
    });

    await test.step("Verify redirect to checkout page", async () => {
      await expect(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      await expect(productSF.productCartDetail.first()).toContainText(expected.product_img_title);
      await expect(productSF.productCartDetail.last()).toContainText(expected.product_no_img_title);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_16 Check hiển thị product có nhiều Bundle`, async ({ context, conf, api }) => {
    const offerMsg = conf.caseConf.offer_message;
    const expected = conf.caseConf.expected;

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain, api);
      await productSF.page.goto(productSF.page.url(), { waitUntil: "networkidle" });
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .first();
    await test.step(`Check message của bundle 3`, async () => {
      await expect(blockBundles).toBeVisible();
      await expect(blockBundles.locator(productSF.bundleOfferHeading)).toHaveText(offerMsg.offer_3);
    });

    const nextBtn = blockBundles.locator(productSF.bundleNavigationBtn).filter({ hasText: "right" });
    const previousBtn = blockBundles.locator(productSF.bundleNavigationBtn).filter({ hasText: "left" });
    await test.step(`Click Next button`, async () => {
      await nextBtn.click();
    });

    await test.step(`Check message của bundle 2`, async () => {
      await expect(previousBtn).not.toHaveClass(new RegExp(expected.disabled));
      await expect(blockBundles.locator(productSF.bundleOfferHeading)).toHaveText(offerMsg.offer_2);
    });

    await test.step(`Click Next button`, async () => {
      await nextBtn.click();
    });

    await test.step(`Check message của bundle 1`, async () => {
      await expect(previousBtn).not.toHaveClass(new RegExp(expected.disabled));
      await expect(nextBtn).toHaveClass(new RegExp(expected.disabled));
      await expect(blockBundles.locator(productSF.bundleOfferHeading)).toHaveText(offerMsg.offer_1);
    });

    await test.step(`Click back button`, async () => {
      await previousBtn.click();
    });

    await test.step("Verify button enable", async () => {
      await expect(previousBtn).not.toHaveClass(new RegExp(expected.disabled));
      await expect(nextBtn).not.toHaveClass(new RegExp(expected.disabled));
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_17 Check add bundle vào cart`, async ({ context, conf, cConf, api }) => {
    test.slow(); //Tăng timeout cho stable
    const expected = conf.caseConf.expected;
    const untick = false;
    const tick = true;
    const prodNew = listProduct.find(prod => prod.title === cConf.product_new);
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    const nextBtn = bundleInPreview.locator(block.bundleNavigation).filter({ hasText: "right" });
    const previousBtn = bundleInPreview.locator(block.bundleNavigation).filter({ hasText: "left" });

    await test.step("Pre-condition: Settings block bundle", async () => {
      await bundleInPreview.click();
      await block.switchToTab("Content");
      await block.changeContent(conf.caseConf.edit_content);
    });

    await test.step(`Check hiển thị bundle block trên web front`, async () => {
      await expect(bundleInPreview).toBeVisible();
      await expect(nextBtn).toBeHidden();
      await expect(previousBtn).toBeHidden();
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain, api);
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .first();
    const cart = new SFCart(productSF.page, conf.suiteConf.domain);
    const checkout = new SFCheckout(productSF.page, conf.suiteConf.domain);
    const nextBtnPreview = blockBundles.locator(productSF.bundleNavigationBtn).filter({ hasText: "right" });
    const previousBtnPreview = blockBundles.locator(productSF.bundleNavigationBtn).filter({ hasText: "left" });
    const totalPricePreview = blockBundles.locator(productSF.bundleTotalPrice);
    const discountPricePreview = blockBundles.locator(productSF.bundleDiscount);
    const listProducts = blockBundles.locator(productSF.bundleListProduct);
    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
    const cartItem = productSF.genLoc(productSF.cartItemsBlock).locator(productSF.cartItem);
    const prodAQuantity = cartItem.filter({ hasText: prodA.title }).locator(productSF.cartBadge);
    const prodNewQuantity = cartItem.filter({ hasText: prodNew.title }).locator(productSF.cartBadge);
    const prodACheckbox = listProducts.filter({ hasText: prodA.title }).locator(productSF.bundleCheckbox);
    const prodNewCheckbox = listProducts.filter({ hasText: prodNew.title }).locator(productSF.bundleCheckbox);

    await test.step("Verify hiển thị ở Preview", async () => {
      await expect(blockBundles).toBeVisible();
      await expect(nextBtnPreview).toBeHidden();
      await expect(previousBtnPreview).toBeHidden();
      await expect(totalPricePreview).toHaveText(expected.bundles_total_price);
      await expect(discountPricePreview).toHaveText(expected.bundles_discount_price);
    });

    await test.step(`Untick sản phẩm A trong bundle 1`, async () => {
      await prodACheckbox.setChecked(untick);
    });

    await test.step("Verify changes of bundles", async () => {
      await expect(totalPricePreview).toHaveText(expected.total_price_untick_prod_a);
      await expect(discountPricePreview).toBeHidden();
      await expect(addAllBtn).toBeEnabled();
    });

    await test.step(`Untick sản phẩm B trong bundle 1`, async () => {
      await prodNewCheckbox.setChecked(untick);
    });

    await test.step("Verify changes of bundles", async () => {
      await expect(totalPricePreview).toHaveText(expected.total_price_untick_all);
      await expect(discountPricePreview).toBeHidden();
      await expect(addAllBtn).toBeHidden();
    });

    await test.step(`Tick product A`, async () => {
      await prodACheckbox.setChecked(tick);
    });

    await test.step("Verify changes of bundles", async () => {
      await expect(totalPricePreview).toHaveText(expected.total_price_tick_prod_a);
      await expect(discountPricePreview).toBeHidden();
      await expect(addAllBtn).toBeEnabled();
      await softAssertion(addAllBtn.first()).toHaveCSS("background-color", expected.bundle_loaded);
    });

    await test.step(`Click Add all to cart`, async () => {
      await Promise.all([addAllBtn.click(), addAllBtn.waitFor({ state: "hidden" })]);
      await addAllBtn.waitFor();
    });

    await test.step("Verify products in cart", async () => {
      await productSF.goto(expected.cart_page);
      await productSF.page.waitForURL(new RegExp(expected.cart_page));
      await softAssertion(cartItem.filter({ hasText: prodA.title })).toBeVisible();
      await softAssertion(prodAQuantity).toHaveText(expected.prod_a_quantity_first_add);
    });

    await test.step(`Tick product B`, async () => {
      await productSF.page.goBack({ waitUntil: "networkidle" });
      await prodNewCheckbox.setChecked(tick);
    });

    await test.step("Verify changes of bundles", async () => {
      await softAssertion(totalPricePreview).toHaveText(expected.bundles_total_price);
      await softAssertion(discountPricePreview).toHaveText(expected.bundles_discount_price);
      await softAssertion(addAllBtn).toBeEnabled();
      await softAssertion(addAllBtn.first()).toHaveCSS("background-color", expected.bundle_loaded);
    });

    await test.step(`Click Add all to cart`, async () => {
      await Promise.all([addAllBtn.click(), addAllBtn.waitFor({ state: "hidden" })]);
      await addAllBtn.waitFor();
    });

    await test.step("Verify products in cart", async () => {
      await productSF.goto(expected.cart_page);
      await productSF.page.waitForURL(new RegExp(expected.cart_page));
      await softAssertion(cartItem.filter({ hasText: prodA.title })).toBeVisible();
      await softAssertion(cartItem.filter({ hasText: prodNew.title })).toBeVisible();
      await softAssertion(prodAQuantity).toHaveText(expected.prod_a_quantity_second_add);
      await softAssertion(prodNewQuantity).toHaveText(expected.prod_new_quantity);
      await softAssertion(cart.getPriceInCart("Offer discount")).toBeVisible();
      await softAssertion(cart.getPriceInCart("Offer discount")).toContainText(expected.offer_discount);
    });

    await test.step(`Redirect sang checkout page`, async () => {
      await cart.checkoutBtn.click();
      await productSF.page.waitForURL(new RegExp(expected.checkout_page));
      // Lỗi api discount offer thì sẽ retry
      try {
        await checkout.discountTag.waitFor({ timeout: 10000 });
      } catch (error) {
        await checkout.errorAlert.getByRole("link").click();
        await checkout.page.waitForLoadState("networkidle");
      }
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.genLoc(checkout.xpathOrderSummarySection).scrollIntoViewIfNeeded();
      await checkout.selectCountry("Vietnam");
      await expect(checkout.getSummaryOrder("Discount")).toContainText(expected.offer_discount);
      await expect(checkout.getSummaryOrder("Total")).toHaveText(expected.total);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_19 Check show bundle với product nhiều variant`, async ({ context, conf }) => {
    let prod1Variant: Products, prod2Variants: Products, sRedVariantId: number, sBlackVariantId: number;
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Pre-condition: Tạo product và offer ", async () => {
      prod1Variant = listProduct.find(prod => prod.title === "[BBO_19] Product 1 variant");
      prod2Variants = listProduct.find(prod => prod.title === "[BBO_19] Product 2 variants");
      sBlackVariantId = prod2Variants.variants[0].id;
      sRedVariantId = prod2Variants.variants[1].id;
      await Promise.all([
        webBuilder.openWebBuilder({
          type: "ecom product custom",
          id: duplicatedTheme.id,
          productId: prod1Variant.id,
          layout: "default",
        }),
        webBuilder.loadingScreen.waitFor(),
      ]);
      await webBuilder.reloadIfNotShow("web builder");
      await block.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
    });

    const prod1DropdownPreview = bundleInPreview
      .locator(block.bundleProductName)
      .filter({ hasText: prod1Variant.title })
      .getByRole("combobox");
    const prod2DropdownPreview = bundleInPreview
      .locator(block.bundleProductName)
      .filter({ hasText: prod2Variants.title })
      .getByRole("combobox");
    await test.step(`Check hiển thị bundle block trên web front`, async () => {
      await softAssertion(prod1DropdownPreview).not.toBeAttached();
      await softAssertion(prod2DropdownPreview).toBeVisible();
      await softAssertion(prod2DropdownPreview).toHaveValue(sBlackVariantId.toString());
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    const blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    const prod1Dropdown = blockBundles
      .locator(productSF.bundleProduct)
      .filter({ hasText: prod1Variant.title })
      .getByRole("combobox");
    const prod2Dropdown = blockBundles
      .locator(productSF.bundleProduct)
      .filter({ hasText: prod2Variants.title })
      .getByRole("combobox");
    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });

    await test.step("Verify bundles in preview", async () => {
      await expect(blockBundles).toBeVisible();
      await expect(prod1Dropdown).not.toBeAttached();
      await expect(prod2Dropdown).toBeVisible();
      await softAssertion(prod2Dropdown).toHaveValue(sBlackVariantId.toString());
    });

    await test.step(`Chọn variant cho product B = S/Red`, async () => {
      await prod2Dropdown.selectOption(conf.caseConf.select_variant);
    });

    await test.step("Verify update the variant just selected", async () => {
      await expect(prod2Dropdown).toHaveValue(sRedVariantId.toString());
    });

    await test.step(`Click Add all to cart button`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
    });

    await test.step("Verify redirect to checkout", async () => {
      await expect(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      await expect(productSF.productCart.filter({ hasText: prod1Variant.title })).toBeVisible();
      await expect(productSF.productCart.filter({ hasText: prod1Variant.title })).toContainText(
        expected.variant_checkout_prod_1,
      );
      await expect(productSF.productCart.filter({ hasText: prod2Variants.title })).toBeVisible();
      await expect(productSF.productCart.filter({ hasText: prod2Variants.title })).toContainText(
        expected.variant_checkout_prod_2,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_22 Check apply discount khi bundle có quantity discount`, async ({
    context,
    conf,
    cConf,
    api,
    theme,
  }) => {
    let offer1: UpsellOffer, offer2: UpsellOffer, prod1: Products, prod2: Products;
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Pre-condition: Publish theme & restore", async () => {
      await theme.publish(duplicatedTheme.id);
      offer1 = listBundles.find(o => o.offer_name === cConf.offer_1_name);
      offer2 = listBundles.find(o => o.offer_name === cConf.offer_2_name);
      prod1 = listProduct.find(prod => prod.title === cConf.product_1);
      prod2 = listProduct.find(prod => prod.title === cConf.product_2);
      await app.updateOffer(offer2.id, { ...offer2, activated: true, enable_discount: false });
      await app.updateOffer(offer1.id, { ...offer1, activated: true, enable_discount: false });
    });

    await test.step("Pre-condition: Open web builder and add bundles", async () => {
      await Promise.all([
        webBuilder.openWebBuilder({
          type: "ecom product custom",
          id: duplicatedTheme.id,
          productId: prod1.id,
          layout: "default",
        }),
        webBuilder.loadingScreen.waitFor(),
      ]);
      await webBuilder.reloadIfNotShow("web builder");
      await block.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
      await block.switchToTab("Content");
      await block.changeContent(conf.caseConf.edit_action);
    });

    await test.step(`Check hiển thị bundle 1 block trên web front`, async () => {
      await expect(bundleInPreview).toBeVisible();
      await expect(bundleInPreview.locator(block.bundleTotalPrice).first()).toHaveText(expected.total_price_offer1_off);
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain, api);
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    const addAllBtn = blockBundles.locator(productSF.currentBundles).getByRole("button", { name: "Add all to cart" });
    const nextBundleBtn = blockBundles.locator(productSF.bundleNavigationBtn).filter({ hasText: "right" });
    const checkout = new SFCheckout(productSF.page, conf.suiteConf.domain);
    const cart = new SFCart(productSF.page, conf.suiteConf.domain);
    const currentBundlesTotalPrice = blockBundles.locator(productSF.currentBundles).locator(productSF.bundleTotalPrice);
    const currentBundlesDiscount = blockBundles.locator(productSF.currentBundles).locator(productSF.bundleDiscount);

    await test.step(`Update bằng API cho offer discount = on = 10%
  Reload lại SF`, async () => {
      const updateOffer2Data = Object.assign({}, offer2, { activated: true, enable_discount: true });
      await app.updateOffer(offer2.id, updateOffer2Data);
      const updateOffer1Data = Object.assign({}, offer1, { activated: true, enable_discount: true });
      await app.updateOffer(offer1.id, updateOffer1Data);
      await upsell.waitOfferUpdated([offer2.id], { discount_data: { percentage_discount: 5 } });
      await upsell.waitOfferUpdated([offer1.id], { discount_data: { percentage_discount: 10 } });
      await productSF.page.reload({ waitUntil: "networkidle" });
    });

    await test.step("Verify total price changed after turn on discount bundle offer", async () => {
      await softAssertion(currentBundlesTotalPrice).toHaveText(expected.total_price_offer1_on);
      await softAssertion(currentBundlesDiscount).toHaveText(expected.original_price_1);
    });

    await test.step(`Click add all to cart`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
    });

    await test.step(`Click next sang bundle 2`, async () => {
      await productSF.page.reload({ waitUntil: "networkidle" });
      await nextBundleBtn.click();
      await addAllBtn.waitFor();
    });

    await test.step("Verify discount bundle offer 2", async () => {
      await softAssertion(currentBundlesTotalPrice).toHaveText(expected.total_price_offer2_on);
      await softAssertion(currentBundlesDiscount).toHaveText(expected.original_price_2);
    });

    await test.step(`Click add all to cart, đi đến trang checkout`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
      await addAllBtn.waitFor();
      await productSF.goto(conf.caseConf.cart_page);
      await productSF.page.waitForLoadState("networkidle");
      await cart.checkoutBtn.click();
    });

    await test.step(`Verify checkout total`, async () => {
      await softAssertion(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.genLoc(checkout.xpathOrderSummarySection).scrollIntoViewIfNeeded();
      await checkout.selectCountry("Vietnam");
      await softAssertion(checkout.getSummaryOrder("Total")).toHaveText(expected.checkout_total_discount_10);
    });

    await test.step(`Xóa bớt product B`, async () => {
      await productSF.goto(conf.caseConf.cart_page);
      await cart.removeInCartItem(prod2.title);
      await cart.checkoutBtn.click();
    });

    await test.step("Verify total price", async () => {
      await expect(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      // Lỗi api discount offer thì sẽ retry
      try {
        await checkout.discountTag.waitFor({ timeout: 10000 });
      } catch (error) {
        await checkout.errorAlert.getByRole("link").click();
        await checkout.page.waitForLoadState("networkidle");
      }
      await checkout.selectCountry("Vietnam");
      await checkout.getSummaryOrder("Total").waitFor();
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.genLoc(checkout.xpathOrderSummarySection).scrollIntoViewIfNeeded();
      await softAssertion(checkout.getSummaryOrder("Total")).toHaveText(expected.checkout_total_discount_5);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_23 Check apply discount khi có nhiều loại offer trong cart`, async ({
    context,
    conf,
    cConf,
    api,
  }) => {
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Pre-condition: Update offer", async () => {
      const testOffer = listBundles.find(o => o.offer_name === "[BBO_23 & SM_01] Test offer");
      await app.updateOffer(testOffer.id, { ...testOffer, activated: true, discount_data: cConf.discount_data });
      await upsell.waitOfferUpdated([testOffer.id], { discount_data: { percentage_discount: 10 } });
    });

    await test.step("Pre-condition: Open web builder and add bundles", async () => {
      await Promise.all([webBuilder.page.reload(), webBuilder.loadingScreen.waitFor()]);
      await webBuilder.reloadIfNotShow("web builder");
      await block.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
    });

    await test.step(`Check hiển thị bundle 1 block trên web front`, async () => {
      await expect(bundleInPreview).toBeVisible();
      await expect(bundleInPreview.locator(block.bundleTotalPrice)).toHaveText(expected.total_price_offer);
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain, api);
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
    const checkout = new SFCheckout(productSF.page, conf.suiteConf.domain);

    await test.step("Verify bundle ở preview", async () => {
      await expect(blockBundles).toBeVisible();
      await expect(blockBundles.locator(productSF.bundleTotalPrice)).toHaveText(expected.total_price_offer);
    });

    await test.step(`Click add all to cart`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
    });

    await test.step("Verify in checkout page", async () => {
      await expect(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      // Lỗi api discount offer thì sẽ retry
      try {
        await checkout.discountTag.waitFor({ timeout: 10000 });
      } catch (error) {
        await checkout.errorAlert.getByRole("link").click();
        await checkout.page.waitForLoadState("networkidle");
      }
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.genLoc(checkout.xpathOrderSummarySection).scrollIntoViewIfNeeded();
      await checkout.selectCountry("Vietnam");
      await checkout.getSummaryOrder("Total").waitFor();
      await softAssertion(checkout.getSummaryOrder("Total")).toHaveText(expected.total_in_checkout);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_25 Check UI variant popup trường hợp sản phẩm có custom option`, async ({
    context,
    api,
    conf,
  }) => {
    let prodReqCustomOpt: Products, prodDetailPage: Page;
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step("Pre-condition: Tạo product và offer", async () => {
      prodReqCustomOpt = listProduct.find(prod => prod.title === "[BBO_25-31] Required custom option");
      const testOffer = listBundles.find(o => o.offer_name === "[BBO_25-31] Test offer");
      await upsell.waitOfferUpdated([testOffer.id]);
    });

    await test.step("Pre-condition: Open web builder và add bundles", async () => {
      await Promise.all([webBuilder.page.reload(), webBuilder.loadingScreen.waitFor()]);
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
    });

    await test.step(`Check hiển thị bundle block trên web front`, async () => {
      await expect(bundleInPreview).toBeVisible();
      for (const [i, productName] of expected.product_names.entries()) {
        await softAssertion(bundleInPreview.locator(block.bundleProductName).nth(i)).toContainText(productName);
      }
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain, api);
      await productSF.page.goto(productSF.page.url(), { waitUntil: "networkidle" });
    });

    const blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
    await test.step("Verify block bundles is visible", async () => {
      await expect(blockBundles).toBeVisible();
      await softAssertion(addAllBtn.first()).toHaveCSS("background-color", expected.bundle_loaded);
    });

    await test.step(`Click Add all to cart`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
    });

    await test.step(`Check content của bundle popup`, async () => {
      await softAssertion(productSF.customizeProductPopup).toBeVisible();
      await softAssertion(productSF.customizeProductPopup).toHaveCSS("width", expected.custom_popup_width);
      await softAssertion(productSF.customizePopupTitle).toHaveText(expected.popup_title);
      await softAssertion(productSF.customizePopupAlert).toHaveText(expected.popup_alert);
      await softAssertion(productSF.customizePopupSlideImg).toHaveCount(expected.img_count);
      await softAssertion(productSF.customizePopupBundleTotalPrice).toHaveText(expected.bundle_total_price);
      await softAssertion(productSF.customizePopupBundleOriginalPrice).toHaveText(expected.bundle_original_price);
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[0]);
      await softAssertion(productSF.prodTitleInPopup).toHaveCSS("color", expected.color_5);
      await softAssertion(productSF.prodTitleInPopup).toHaveCSS("font-size", expected.h4_font_size);
      await softAssertion(productSF.ratingStar.first()).toHaveCSS("color", expected.color_5);
      await softAssertion(productSF.ratingText).toHaveCSS("color", expected.color_5);
      await softAssertion(productSF.prodPriceInPopup).toHaveText(expected.target_prod_price);
      await softAssertion(productSF.prodPriceInPopup).toHaveCSS("font-size", expected.p1_font_size);
      await softAssertion(productSF.prodPriceInPopup).toHaveCSS("color", expected.color_4);
      await softAssertion(productSF.prodPriceInPopup).toHaveClass(new RegExp(expected.bold_style));
      await softAssertion(productSF.nextProductBtn).toHaveClass(new RegExp(expected.primary_btn));
    });

    await test.step(`Click View product detail`, async () => {
      [prodDetailPage] = await Promise.all([context.waitForEvent("page"), productSF.seeItemDetails.click()]);
    });

    await test.step("Verify redirect to product detail", async () => {
      await softAssertion(prodDetailPage).toHaveURL(new RegExp(expected.product_detail_page));
      await prodDetailPage.close();
    });

    await test.step(`Click next product`, async () => {
      await productSF.nextProductBtn.click();
    });

    await test.step("Verify first product image in slide is ticked", async () => {
      await softAssertion(productSF.customizePopupSlideImg.first().locator(productSF.checkCircle)).toBeVisible();
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[1]);
    });

    await test.step(`Click Next product button`, async () => {
      await productSF.nextProductBtn.click();
    });

    await test.step("Verify second product image in slide is ticked", async () => {
      await softAssertion(productSF.customizePopupSlideImg.nth(1).locator(productSF.checkCircle)).toBeVisible();
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[2]);
      await softAssertion(productSF.customizeProductPopup.getByRole("textbox")).toBeVisible();
    });

    await test.step(`Click Next product button`, async () => {
      await productSF.nextProductBtn.click();
    });

    await test.step("Verify third product image in slide is unticked", async () => {
      await softAssertion(productSF.customizePopupSlideImg.nth(2).locator(productSF.checkCircle)).toBeHidden();
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[3]);
      await softAssertion(productSF.customizeProductPopup.getByRole("textbox")).toBeVisible();
    });

    await test.step(`Click Next product button`, async () => {
      await productSF.nextProductBtn.click();
    });

    await test.step("Verify last product image in slide is ticked", async () => {
      await softAssertion(productSF.customizePopupSlideImg.nth(3).locator(productSF.checkCircle)).toBeVisible();
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[2]);
      await softAssertion(productSF.customizeProductPopup.getByRole("textbox")).toBeVisible();
    });

    await test.step(`Click Add all to cart`, async () => {
      await productSF.quickViewAddAllBtn.click();
    });

    await test.step("Verify warning message appear", async () => {
      await softAssertion(productSF.bundleWarningMsgCustomOption).toBeVisible();
      await softAssertion(productSF.bundleWarningMsgCustomOption).toHaveText(expected.warning_custom_option);
    });

    await test.step(`Chọn custom option cho product C, click Add all to cart`, async () => {
      await productSF.customizeProductPopup.getByRole("textbox").fill(conf.caseConf.custom_option_required);
      await productSF.quickViewAddAllBtn.click();
    });

    await test.step("Verify product in checkout page", async () => {
      const productsInCheckout = productSF.genLoc(productSF.cartDetail).getByRole("link");
      await softAssertion(productSF.customizeProductPopup).toBeHidden();
      await softAssertion(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      for (const [i, productName] of expected.product_names.entries()) {
        await softAssertion(productsInCheckout.nth(i)).toHaveText(productName);
      }
      await softAssertion(productSF.productCart.filter({ hasText: prodReqCustomOpt.title })).toContainText(
        expected.custom_option_checkout,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_27 Check bundle hiển khi thị với target product`, async ({ conf }) => {
    let prodAUrl: string;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    const expected = conf.caseConf.expected;
    await test.step(`Update bằng API cho Only show this bundle when customers visit target product = OFF
    Check hiển thị bundle block trên web front`, async () => {
      await app.updateOffer(offer.id, {
        ...offer,
        activated: true,
        target_type: "all",
        discount_data: '{"percentage_discount":10}',
      });
      await expect(bundleInPreview).toBeVisible();
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      const previewPage = await webBuilder.clickSaveAndGoTo("Preview");
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));

    await test.step("Verify block bundles visible", async () => {
      await expect(blockBundles).toBeVisible();
      await softAssertion(async () => {
        for (const [i, productName] of expected.product_names.entries()) {
          await softAssertion(bundleInPreview.locator(block.bundleProductName).nth(i)).toContainText(productName);
        }
      }).toPass({ timeout: 60_000 });
      await softAssertion(bundleInPreview.locator(block.bundleTotalPrice)).toHaveText(expected.total_price_offer);
      prodAUrl = productSF.page.url();
    });

    await test.step(`SF: Đi đến trang product B`, async () => {
      const prodBUrl = prodAUrl.replace(prodA.handle, prodB.handle);
      await productSF.page.goto(prodBUrl);
      await productSF.page.waitForLoadState("networkidle");
    });

    await test.step("Verify bundle visible", async () => {
      await expect(blockBundles).toBeVisible();
    });

    await test.step(`Update bằng API cho Only show this bundle when customers visit target product = ON
    Reload lại page product B`, async () => {
      await app.updateOffer(offer.id, { ...offer, activated: true, target_type: "product" });
      await productSF.page.reload({ waitUntil: "networkidle" });
    });

    await test.step("Verify bundles ko hiển thị", async () => {
      await expect(blockBundles).toBeHidden();
      await expect(blockBundles).toBeAttached();
    });

    await test.step(`SF: Đi đến trang product A`, async () => {
      await productSF.page.goto(prodAUrl, { waitUntil: "networkidle" });
    });

    await test.step("Verify bundle chỉ hiển thị ở product A", async () => {
      await expect(blockBundles).toBeVisible();
      for (let i = 0; i < (await blockBundles.locator(block.bundleProductName).count()); i++) {
        await softAssertion(blockBundles.locator(block.bundleProductName).nth(i)).toHaveText(expected.product_names[i]);
      }
      await softAssertion(blockBundles.locator(block.bundleTotalPrice)).toHaveText(expected.total_price_offer);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_28 Check performance trong dashboard apply thay đổi ngoài SF`, async ({
    context,
    conf,
    cConf,
    theme,
  }) => {
    test.setTimeout(cConf.timeout * 10); // Update analytics có thể rất lâu
    let newPage: Page, offerDetail: UpSell;
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    newPage = await context.newPage();
    offerDetail = new UpSell(newPage, conf.suiteConf.domain);
    const dataDefault = {
      sales: 0,
      views: 0,
      add_to_cart: 0,
      checkout_success: 0,
    };
    const convertPerformanceToNumber = (perf: string): number | null => {
      const match = perf.match(/[-+]?\d*\.\d+|\d+/g);
      return match ? (match.includes(".") ? parseFloat(match.toString()) : parseInt(match.toString(), 10)) : null;
    };

    await test.step("Pre-condition: Get default performance", async () => {
      await offerDetail.goto("admin");
      await offerDetail.openCrossSellOffer("Bundles", offer.id);
      await offerDetail.page.waitForResponse(/analytics.json/);
      await softAssertion(offerDetail.bundlesAnalytics).toBeVisible();
      const sales = await offerDetail.bundlesAnalytics.getByRole("listitem").filter({ hasText: "Sales" }).innerText();
      const views = await offerDetail.bundlesAnalytics
        .getByRole("listitem")
        .filter({ hasText: /Views|View/ })
        .innerText();
      const addToCart = await offerDetail.bundlesAnalytics
        .getByRole("listitem")
        .filter({ hasText: "Add to cart" })
        .innerText();
      const coSuccess = await offerDetail.bundlesAnalytics
        .getByRole("listitem")
        .filter({ hasText: "Checkout success" })
        .innerText();
      dataDefault.sales = convertPerformanceToNumber(sales);
      dataDefault.views = convertPerformanceToNumber(views);
      dataDefault.add_to_cart = convertPerformanceToNumber(addToCart);
      dataDefault.checkout_success = convertPerformanceToNumber(coSuccess);
    });

    await test.step("Publish test theme", async () => {
      await theme.publish(duplicatedTheme.id);
    });

    await test.step(`Check hiển thị bundle block trên web front`, async () => {
      await expect(bundleInPreview).toBeVisible();
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const sfPage = await context.newPage();
      productSF = new UpSell(sfPage, conf.suiteConf.domain);
      await productSF.goto(`products/${prodA.handle}`);
    });

    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
    const checkout = new SFCheckout(productSF.page, conf.suiteConf.domain);

    await test.step(`Check số view trong performance của bundle 1`, async () => {
      const expectedViews = dataDefault.views + expected.first_view;
      await productSF.waitForTrackingViewOfferBundle();
      await offerDetail.page.reload({ waitUntil: "networkidle" });
      await softAssertion(offerDetail.bundlesAnalytics).toBeVisible();
      await softAssertion(addAllBtn).toHaveCSS("background-color", expected.bundle_loaded);
      await offerDetail.verifyBundlesPerformance("View", expectedViews, conf.caseConf.timeout);
      await newPage.close();
    });

    await test.step(`Click Add all to cart button`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
    });

    await test.step(`API get số Add to cart trong performance của bundle 1`, async () => {
      const expectedAddToCart = dataDefault.add_to_cart + expected.first_add_to_cart;
      await softAssertion(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      newPage = await context.newPage();
      offerDetail = new UpSell(newPage, conf.suiteConf.domain);
      await offerDetail.goto("admin");
      await offerDetail.openCrossSellOffer("Bundles", offer.id);
      await offerDetail.page.waitForResponse(/analytics.json/);
      await softAssertion(offerDetail.bundlesAnalytics).toBeVisible();
      await offerDetail.verifyBundlesPerformance("Add to cart", expectedAddToCart, conf.caseConf.timeout);
      await newPage.close();
    });

    await test.step(`Tại trang checkout, checkout success bundle 1
API get số Checkout success trong performance của bundle 1`, async () => {
      try {
        await checkout.discountTag.waitFor({ timeout: 10000 });
      } catch (error) {
        await checkout.errorAlert.getByRole("link").click();
        await checkout.page.waitForLoadState("networkidle");
      }
      await checkout.fillCheckoutInfo(
        conf.caseConf.email,
        conf.caseConf.first_name,
        conf.caseConf.last_name,
        conf.caseConf.address,
        conf.caseConf.city,
        conf.caseConf.state,
        conf.caseConf.zip,
        conf.caseConf.country,
        conf.caseConf.phone,
        false,
      );
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.selectCountry("Vietnam");
      await checkout.inputCardInfoAndCompleteOrder(
        conf.caseConf.test_card,
        conf.caseConf.card_holder,
        conf.caseConf.expired_date,
        conf.caseConf.cvv,
      );
      newPage = await context.newPage();
      offerDetail = new UpSell(newPage, conf.suiteConf.domain);
      const expectedSales = dataDefault.sales + expected.sales;
      const expectedCOSuccess = dataDefault.checkout_success + expected.first_checkout;
      await offerDetail.goto("admin");
      await offerDetail.openCrossSellOffer("Bundles", offer.id);
      await softAssertion(offerDetail.bundlesAnalytics).toBeVisible();
      await offerDetail.verifyBundlesPerformance("Checkout success", expectedCOSuccess, conf.caseConf.timeout);
      await offerDetail.verifyBundlesPerformance("Sales", expectedSales);
      const views = await offerDetail.bundlesAnalytics
        .getByRole("listitem")
        .filter({ hasText: /Views|View/ })
        .innerText();
      const bundleViews = convertPerformanceToNumber(views);
      const expectedConversionRate = parseFloat(((expectedCOSuccess * 100) / bundleViews).toFixed(2));
      await offerDetail.verifyBundlesPerformance("Conversion rate", expectedConversionRate);
      await newPage.close();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_30 Check hiển thị bundle ngoài SF khi update/inactive bundle trong dashboard`, async ({
    context,
    conf,
    api,
    authRequest,
  }) => {
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    await test.step(`Check hiển thị bundle block trên web front`, async () => {
      await expect(bundleInPreview).toBeVisible();
      for (const [i, product] of (await bundleInPreview.locator(block.bundleProductName).all()).entries()) {
        await expect(product).toHaveText(expected.product_names[i]);
      }
    });

    await test.step(`Nhấn save > click preview button`, async () => {
      await webBuilder.clickSave();
      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState("networkidle");
      productSF = new UpSell(previewPage, conf.suiteConf.domain, api);
    });

    const previewUrl = productSF.page.url();
    const blockBundles = productSF.sectionsInSF
      .first()
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));

    await test.step("Verify default bundle", async () => {
      await expect(blockBundles).toBeVisible();
      await expect(blockBundles.locator(productSF.bundleOfferHeading)).toHaveText(conf.caseConf.default_heading);
      for (const [i, product] of (await blockBundles.locator(productSF.bundleProduct).all()).entries()) {
        await expect(product).toHaveText(expected.product_names[i]);
      }
      await expect(blockBundles.locator(productSF.bundleTotalPrice)).toHaveText(expected.price_discount_default);
    });

    await test.step(`Dùng api Update bundle:
    - mess: Special deal of the day
    - Discount: 20%
    Reload lại sf`, async () => {
      const updateData = Object.assign({}, offer, conf.caseConf.update_offer);
      await app.updateOffer(offer.id, updateData);
      await upsell.waitOfferUpdated([offer.id], { offer_message: expected.heading_update });
      await productSF.page.reload({ waitUntil: "networkidle" });
      await productSF.page.goto(previewUrl, { waitUntil: "networkidle" });
      await softAssertion(blockBundles.locator(productSF.bundleOfferHeading)).toHaveText(expected.heading_update);
      await softAssertion(blockBundles.locator(productSF.bundleTotalPrice)).toHaveText(expected.price_discount_update);
    });

    await test.step(`Dùng api inactive bundle
    Reload lại sf`, async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        offer_ids: [offer.id],
        status: false,
      });
      await productSF.page.goto(previewUrl, { waitUntil: "networkidle" });
    });

    await test.step("Verify bundle placeholder visible", async () => {
      await expect(blockBundles).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BBO_31 Check hiển thị bundle trên mobile`, async ({ api, conf, pageMobile }) => {
    const expected = conf.caseConf.expected;
    const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
    const prodReqCustomOpt = listProduct.find(prod => prod.title === "[BBO_25-31] Required custom option");

    await test.step(`Check hiển thị bundle block trên web front -> click Save`, async () => {
      await expect(bundleInPreview).toBeVisible();
      for (const [i, productName] of expected.product_names.entries()) {
        await softAssertion(bundleInPreview.locator(block.bundleProductName).nth(i)).toContainText(productName);
      }
      await webBuilder.clickSave();
    });

    productSF = new UpSell(pageMobile, conf.suiteConf.domain, api);
    await productSF.goto(`/products/${conf.caseConf.product_handle}?theme_preview_id=${duplicatedTheme.id}`);
    const blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));

    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
    await test.step("Verify block bundles is visible", async () => {
      await expect(blockBundles).toBeVisible();
      await expect(addAllBtn.first()).toHaveCSS("background-color", expected.bundle_loaded);
    });

    await test.step(`Click Add all to cart`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
    });

    await test.step(`Check content của bundle popup`, async () => {
      await softAssertion(productSF.customizeProductPopup).toBeVisible();
      await softAssertion(productSF.customizeProductPopup).toHaveCSS("width", expected.custom_popup_width);
      await softAssertion(productSF.customizePopupTitle).toHaveText(expected.popup_title);
      await softAssertion(productSF.customizePopupAlert).toHaveText(expected.popup_alert);

      await softAssertion(productSF.customizePopupSlideImg).toHaveCount(expected.img_count);
      await softAssertion(productSF.customizePopupBundleTotalPrice).toHaveText(expected.bundle_total_price);
      await softAssertion(productSF.customizePopupBundleOriginalPrice).toHaveText(expected.bundle_original_price);
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[0]);

      await softAssertion(productSF.prodTitleInPopup).toHaveCSS("color", expected.color_5);
      await softAssertion(productSF.prodTitleInPopup).toHaveCSS("font-size", expected.h4_font_size);
      await softAssertion(productSF.ratingStar.first()).toHaveCSS("color", expected.color_5);
      await softAssertion(productSF.ratingText).toHaveCSS("color", expected.color_5);

      await softAssertion(productSF.prodPriceInPopup).toHaveText(expected.target_prod_price);
      await softAssertion(productSF.prodPriceInPopup).toHaveCSS("font-size", expected.p1_font_size);
      await softAssertion(productSF.prodPriceInPopup).toHaveCSS("color", expected.color_4);
      await softAssertion(productSF.prodPriceInPopup).toHaveClass(new RegExp(expected.bold_style));
      await softAssertion(productSF.nextProductBtnMobile).toHaveClass(new RegExp(expected.primary_btn));
    });

    await test.step(`Click next product -> Verify first product image in slide is ticked`, async () => {
      await productSF.nextProductBtnMobile.click();
      await softAssertion(productSF.customizePopupSlideImg.first().locator(productSF.checkCircle)).toBeVisible();
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[1]);
    });

    await test.step(`Click Next product button -> Verify second product image in slide is ticked`, async () => {
      await productSF.nextProductBtnMobile.click();
      await softAssertion(productSF.customizePopupSlideImg.nth(1).locator(productSF.checkCircle)).toBeVisible();
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[2]);
      await softAssertion(productSF.customizeProductPopup.getByRole("textbox")).toBeVisible();
    });

    await test.step(`Click Next product button -> Verify third product image in slide is unticked`, async () => {
      await productSF.nextProductBtnMobile.click();
      await softAssertion(productSF.customizePopupSlideImg.nth(2).locator(productSF.checkCircle)).toBeHidden();
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[3]);
      await softAssertion(productSF.customizeProductPopup.getByRole("textbox")).toBeVisible();
    });

    await test.step(`Click Next product button -> Verify last product image in slide is ticked`, async () => {
      await productSF.nextProductBtnMobile.click();
      await softAssertion(productSF.customizePopupSlideImg.nth(3).locator(productSF.checkCircle)).toBeVisible();
      await softAssertion(productSF.prodTitleInPopup).toHaveText(expected.product_names[2]);
      await softAssertion(productSF.customizeProductPopup.getByRole("textbox")).toBeVisible();
    });

    await test.step(`Click Add all to cart -> Verify warning message appear`, async () => {
      await productSF.quickViewAddAllBtnMobile.click();
      await softAssertion(productSF.bundleWarningMsgCustomOption).toBeVisible();
      await softAssertion(productSF.bundleWarningMsgCustomOption).toHaveText(expected.warning_custom_option);
    });

    await test.step(`Chọn custom option cho product C, click Add all to cart -> Verify product in checkout page`, async () => {
      await productSF.customizeProductPopup.getByRole("textbox").fill(conf.caseConf.custom_option_required);
      await productSF.quickViewAddAllBtnMobile.click();

      const productsInCheckout = productSF.genLoc(productSF.cartDetail).getByRole("link");
      await softAssertion(productSF.customizeProductPopup).toBeHidden();
      await softAssertion(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      await productSF.page.waitForLoadState("networkidle");

      for (const [i, productName] of expected.product_names.entries()) {
        await softAssertion(productsInCheckout.nth(i)).toHaveText(productName);
      }
      await softAssertion(productSF.productCart.filter({ hasText: prodReqCustomOpt.title })).toContainText(
        expected.custom_option_checkout,
      );
    });
  });
});

test.describe("@SB_SMART_BUNDLES Check smart bundle", () => {
  test.beforeEach(async ({ dashboard, api, theme, conf, authRequest }) => {
    prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    app = new AppsAPI(conf.suiteConf.domain, authRequest);
    apps = new CrossSellAPI(conf.suiteConf.domain);
    productsTitle = conf.suiteConf.products_title;
    addBundle = conf.suiteConf.add_bundle;
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    block = new Blocks(dashboard, conf.suiteConf.domain);
    productSF = new UpSell(dashboard, conf.suiteConf.domain, api);
    upsell = new SFUpSellAPI(conf.suiteConf.domain, api);
    listBundles = await app.getListUpsellOffers({ offer_types: "bundle", limit: 500, only_active: false });
    listQty = await app.getListUpsellOffers({ offer_types: "quantity", limit: 500, only_active: false });
    listProduct = await prodAPI.getAllProduct(conf.suiteConf.domain);
    prodA = listProduct.find(prod => prod.title === "Product A");
    prodB = listProduct.find(prod => prod.title === "Product B");

    await test.step("Restore offer default state", async () => {
      const offerOffIds = [];
      const bundles = listBundles.map(o => o.id);
      const qty = listQty.map(o => o.id);
      offerOffIds.push(...bundles, ...qty);
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        offer_ids: offerOffIds,
        status: false,
      });
    });

    await test.step("Publish duplicated theme & bật smart bundle", async () => {
      duplicatedTheme = await theme.duplicate(conf.suiteConf.theme_test);
      await theme.publish(duplicatedTheme.id);
      const response = await app.getCTABtnSettings();
      const smartBundleStatus = response.smart_cross_sell.enable;
      if (!smartBundleStatus) {
        await app.changeCTABtnSettings(conf.suiteConf.smart_bundles_on);
      }
    });
  });

  test.afterEach(async ({ theme, conf }) => {
    await test.step("Restore data", async () => {
      const listTemplate = [];
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_test) {
        await theme.publish(conf.suiteConf.theme_test);
      }
      const listTheme = await theme.list();
      listTheme.forEach(template => {
        if (!template.active) {
          listTemplate.push(template.id);
        }
      });
      if (listTemplate.length > 0) {
        for (const template of listTemplate) {
          if (template !== conf.suiteConf.theme_test) {
            await theme.delete(template);
          }
        }
      }
      await prodAPI.changeProductsStatus(
        listProduct.map(prod => prod.id),
        { published: true },
      );
    });
  });

  test(`@SB_WEB_BUILDER_SM_01 Check smart bundle khi hiển thị với target product case product có cả manual bundle và smart bundle`, async ({
    context,
    theme,
    conf,
    cConf,
    authRequest,
  }) => {
    let manualOffer: UpsellOffer, totalPriceSmartOffer: number;
    const expected = conf.caseConf.expected;
    await test.step("Pre-condition: Tạo offer & smart bundles", async () => {
      manualOffer = listBundles.find(o => o.offer_name === "[BBO_23 & SM_01] Test offer");
      const discountData = Object.assign({}, manualOffer, cConf.manual_offer);
      await app.updateOffer(manualOffer.id, discountData);
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        offer_ids: [manualOffer.id],
        status: true,
      });
      await app.changeCTABtnSettings(conf.caseConf.enable_smart_bundle);
      await theme.publish(duplicatedTheme.id);
    });

    await test.step("Pre-condition: Open webbuilder", async () => {
      await Promise.all([
        webBuilder.openWebBuilder({
          type: "ecom product custom",
          id: duplicatedTheme.id,
          productId: prodA.id,
          layout: "default",
        }),
        webBuilder.loadingScreen.waitFor(),
      ]);
      await webBuilder.reloadIfNotShow("web builder");
    });

    await test.step(`Add block bundle -> Save tới màn SF`, async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
      await webBuilder.clickSave();
      const previewPage = await context.newPage();
      productSF = new UpSell(previewPage, conf.suiteConf.domain);
      await productSF.goto(`products/${prodA.handle}`);
    });

    const prodAUrl = productSF.page.url();
    const blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
    const checkout = new SFCheckout(productSF.page, conf.suiteConf.domain);
    const cart = new SFCart(productSF.page, conf.suiteConf.domain);

    await test.step("Verify bundles có total price đúng với discount", async () => {
      await blockBundles.locator(productSF.bundleTotalPrice).waitFor({ state: "visible" });
      await softAssertion(blockBundles.locator(productSF.bundleTotalPrice)).toHaveText(expected.total_price_manual);
      await productSF.page.waitForResponse(/theme.css/);
      await softAssertion(addAllBtn.first()).toHaveCSS("background-color", expected.bundle_loaded);
    });

    await test.step(`Add target product vào cart -> Add recommend product`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
    });

    await test.step("Verify total price ở checkout", async () => {
      await softAssertion(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      try {
        await checkout.discountTag.waitFor({ timeout: 20000 });
      } catch (error) {
        await checkout.errorAlert.getByRole("link").click();
        await checkout.page.waitForLoadState("networkidle");
      }
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.genLoc(checkout.xpathOrderSummarySection).scrollIntoViewIfNeeded();
      await checkout.selectCountry("Vietnam");
      await softAssertion(checkout.getSummaryOrder("Total")).toHaveText(expected.total_price_manual);
    });

    await test.step(`Inactive bundles đã add và trở lại SF product A`, async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        offer_ids: [manualOffer.id],
        status: false,
      });
      await productSF.goto(conf.caseConf.cart_page);
      await cart.removeInCartItem(prodA.title);
      await cart.removeInCartItem(prodB.title);
      await Promise.all([
        productSF.page.goto(prodAUrl, { waitUntil: "networkidle" }),
        productSF.page.waitForResponse(/theme.css/),
      ]);
    });

    await test.step(`Verify thay đổi `, async () => {
      const firstProdPrice = parseFloat(
        (await productSF.genLoc(productSF.bundlePrice).first().innerText()).replace("$", ""),
      );
      const secondProdPrice = parseFloat(
        (await productSF.genLoc(productSF.bundlePrice).nth(1).innerText()).replace("$", ""),
      );
      const thirdProdPrice = parseFloat(
        (await productSF.genLoc(productSF.bundlePrice).last().innerText()).replace("$", ""),
      );
      totalPriceSmartOffer = (firstProdPrice + secondProdPrice + thirdProdPrice) * expected.discount_percent;
      await softAssertion(addAllBtn.first()).toHaveCSS("background-color", expected.bundle_loaded);
      await softAssertion(blockBundles.locator(productSF.bundleTotalPrice)).toHaveText(
        `$${totalPriceSmartOffer.toFixed(2)}`,
      );
    });

    await test.step(`Add target product vào cart -> Add recommend product`, async () => {
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
    });

    await test.step("Verify smart bundle apply đúng ở checkout", async () => {
      await softAssertion(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      try {
        await checkout.discountTag.waitFor({ timeout: 20000 });
      } catch (error) {
        await checkout.errorAlert.getByRole("link").click();
        await checkout.page.waitForLoadState("networkidle");
      }
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.genLoc(checkout.xpathOrderSummarySection).scrollIntoViewIfNeeded();
      await checkout.selectCountry("Vietnam");
      await expect(checkout.getSummaryOrder("Total")).toHaveText(`$${totalPriceSmartOffer.toFixed(2)}`);
    });

    await test.step(`Settings -> Off toggle switch Smart Bundle -> Save`, async () => {
      await app.changeCTABtnSettings(conf.caseConf.disable_smart_bundle);
    });

    await test.step(`Đến product detail của product A và verify thay đổi `, async () => {
      await productSF.page.goto(prodAUrl, { waitUntil: "networkidle" });
      await expect(blockBundles).toBeHidden();
    });

    await test.step("Restore data after test", async () => {
      await app.updateOffer(manualOffer.id, manualOffer);
    });
  });

  test(`@SB_WEB_BUILDER_SM_09 Check tăng analytics với order smart bundle`, async ({
    dashboard,
    context,
    conf,
    cConf,
  }) => {
    test.slow(); //Analytics có thể update lâu
    let defaultTotalSales: number, defaultTotalOrders: number, totalPriceSmartOffer: number;
    const expected = conf.caseConf.expected;
    const ana = new UpSell(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition: Open web builder và get default analytics", async () => {
      await Promise.all([ana.goto("admin/analytics"), ana.page.waitForResponse(/analytics.json/)]);
      defaultTotalSales = await ana.getAnalytics("Total sales");
      defaultTotalOrders = await ana.getAnalytics("Total orders");
      await Promise.all([
        webBuilder.openWebBuilder({
          type: "ecom product custom",
          id: duplicatedTheme.id,
          productId: prodA.id,
          layout: "default",
        }),
        webBuilder.loadingScreen.waitFor(),
      ]);
      await webBuilder.reloadIfNotShow("web builder");
    });

    await test.step(`Add smart bundle`, async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
      await webBuilder.clickSave();
      const newPage = await context.newPage();
      productSF = new UpSell(newPage, conf.suiteConf.domain);
    });

    const blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });
    const checkout = new SFCheckout(productSF.page, conf.suiteConf.domain);

    await test.step(`SF: Đi đến trang product A -> Check out product với smart bundle`, async () => {
      await productSF.goto(`products/${prodA.handle}`);
      await productSF.page.waitForResponse(/theme.css/);
      await softAssertion(addAllBtn.first()).toHaveCSS("background-color", expected.bundle_loaded);
      const firstProdPrice = parseFloat(
        (await productSF.genLoc(productSF.bundlePrice).first().innerText()).replace("$", ""),
      );
      const secondProdPrice = parseFloat(
        (await productSF.genLoc(productSF.bundlePrice).nth(1).innerText()).replace("$", ""),
      );
      const thirdProdPrice = parseFloat(
        (await productSF.genLoc(productSF.bundlePrice).last().innerText()).replace("$", ""),
      );
      totalPriceSmartOffer = (firstProdPrice + secondProdPrice + thirdProdPrice) * expected.discount_percent;
      await addAllBtn.click();
      await addAllBtn.waitFor({ state: "hidden" });
      await expect(productSF.page).toHaveURL(new RegExp(expected.checkout_page));
      try {
        await checkout.discountTag.waitFor({ timeout: 20000 });
      } catch (error) {
        await checkout.errorAlert.getByRole("link").click();
        await checkout.page.waitForLoadState("networkidle");
      }
      await checkout.fillCheckoutInfo(
        conf.caseConf.email,
        conf.caseConf.first_name,
        conf.caseConf.last_name,
        conf.caseConf.address,
        conf.caseConf.city,
        conf.caseConf.state,
        conf.caseConf.zip,
        conf.caseConf.country,
        conf.caseConf.phone,
        false,
      );
      await checkout.footerLoc.scrollIntoViewIfNeeded();
      await checkout.addTip({ option: "No tip" });
      await checkout.inputCardInfoAndCompleteOrder(
        conf.caseConf.test_card,
        conf.caseConf.card_holder,
        conf.caseConf.expired_date,
        conf.caseConf.cvv,
      );
    });

    await test.step(`Check analytics`, async () => {
      const expectedTotalSales: number = defaultTotalSales + totalPriceSmartOffer;
      const expectedTotalOrders: number = defaultTotalOrders + expected.order;
      const dashboard = new DashboardPage(webBuilder.page, conf.suiteConf.domain);
      const analytics = new UpSell(webBuilder.page, conf.suiteConf.domain);
      await dashboard.goto("admin");
      await dashboard.navigateToMenu("Analytics");
      await analytics.verifyAnalyticsOfBoostUpsell(
        "Total sales",
        `$${expectedTotalSales.toFixed(2)}`,
        cConf.verify_timeout,
      );
      await analytics.verifyAnalyticsOfBoostUpsell(
        "Total orders",
        expectedTotalOrders.toString(),
        cConf.verify_timeout,
      );
    });
  });

  test(`@SB_WEB_BUILDER_SM_10 Check smart bundle với product có custom option`, async ({ context, conf }) => {
    let prodTest: Products;
    const expected = conf.caseConf.expected;
    await test.step("Pre-condition: Tạo product có custom options", async () => {
      prodTest = listProduct.find(prod => prod.title === "[SM_10] Prod with custom option");
    });

    await test.step(`Open product B detail`, async () => {
      await Promise.all([
        webBuilder.openWebBuilder({
          type: "ecom product custom",
          id: duplicatedTheme.id,
          productId: prodTest.id,
          layout: "default",
        }),
        webBuilder.loadingScreen.waitFor(),
      ]);
      await webBuilder.reloadIfNotShow("web builder");
      await webBuilder.insertSectionBlock({
        parentPosition: addBundle.parent_position,
        category: addBundle.basics_cate,
        template: addBundle.template,
      });
      await webBuilder.clickSave();
      const newPage = await context.newPage();
      productSF = new UpSell(newPage, conf.suiteConf.domain);
      await productSF.goto(`products/${prodTest.handle}`);
      await productSF.page.waitForResponse(/theme.css/);
    });

    const blockBundles = productSF.sectionsInSF
      .nth(0)
      .locator(productSF.columnsInSF)
      .locator(productSF.blocksInSF)
      .and(productSF.genLoc(productSF.bundleBlock));
    const addAllBtn = blockBundles.getByRole("button", { name: "Add all to cart" });

    await test.step(`Click Add all to cart`, async () => {
      await softAssertion(addAllBtn.first()).toHaveCSS("background-color", expected.bundle_loaded);
      await Promise.all([addAllBtn.click(), addAllBtn.waitFor({ state: "hidden" })]);
    });

    await test.step(`Check content của bundle popup`, async () => {
      await expect(productSF.customizeProductPopup).toBeVisible();
    });
  });
});

/**
 * Case bị bỏ khỏi RC vì update mới ko còn feature position manual nữa
 */
// test(`@SB_WEB_BUILDER_LBA_BBO_11 Check move forward/backward bundle block`, async ({ context, conf }) => {
//   const expected = conf.caseConf.expected;
//   const bundleInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 2 }));
//   const buttonInPreview = webBuilder.frameLocator.locator(block.getSelectorByIndex({ section: 1, block: 1 }));
//   await test.step("Pre-condition: Add block button", async () => {
//     await block.dragAndDropInWebBuilder(conf.caseConf.dnd_button);
//   });

//   await test.step("Click block bundle", async () => {
//     await block.backBtn.click();
//     await bundleInPreview.click();
//   });

//   await test.step(`Verify Move forward/backward buttons disabled`, async () => {
//     const moveUpButton = block.quickBarButton("Move up");
//     if (moveUpButton !== null) {
//       await expect(block.quickBarButton("Move up")).not.toHaveClass(new RegExp(expected.disabled));
//       await expect(block.quickBarButton("Move down")).toHaveClass(new RegExp(expected.disabled));
//     } else {
//       await expect(block.quickBarButton("Bring forward")).toHaveClass(new RegExp(expected.disabled));
//       await expect(block.quickBarButton("Bring backward")).toHaveClass(new RegExp(expected.disabled));
//     }
//   });

//  await test.step(`Trong web front, đổi position của button = manual, bundle = manual theo đúng thứ tự`, async () => {
//     await block.changeDesign(conf.caseConf.position_manual);
//     await buttonInPreview.click();
//     await block.changeDesign(conf.caseConf.position_manual);
//     await bundleInPreview.click();
//   });

//   await test.step("Verify forward/backward buttons enabled", async () => {
//     await expect(block.quickBarButton("Bring forward")).not.toHaveClass(new RegExp(expected.disabled));
//   });

//   await test.step(`Click forward bundle`, async () => {
//     await block.quickBarButton("Bring forward").click();
//     await block.backBtn.click();
//   });

//   await test.step("Verify z-index của block manual sau khi move forward", async () => {
//     await expect(bundleInPreview).toHaveCSS("z-index", expected.forward.bundle_z_index);
//     await expect(buttonInPreview).toHaveCSS("z-index", expected.forward.button_z_index);
//   });

//   await test.step(`Click backward bundle`, async () => {
//     await bundleInPreview.click();
//     await block.quickBarButton("Bring backward").click();
//     await block.backBtn.click();
//   });

//   await test.step("Verify z-index của block manual sau khi move backward", async () => {
//     await softAssertion(bundleInPreview).toHaveCSS("z-index", expected.backward.bundle_z_index);
//     await softAssertion(buttonInPreview).toHaveCSS("z-index", expected.backward.button_z_index);
//   });

//   await test.step(`Save và check hiển thị ngoài SF`, async () => {
//     await webBuilder.clickBtnNavigationBar("save");
//     await webBuilder.toastMessage.waitFor();
//     await webBuilder.toastMessage.waitFor({ state: "hidden" });
//     const [previewPage] = await Promise.all([
//       context.waitForEvent("page"),
//       webBuilder.clickBtnNavigationBar("preview"),
//     ]);
//     await previewPage.waitForLoadState("networkidle");
//     productSF = new UpSell(previewPage, conf.suiteConf.domain);
//     const blockBundles = productSF.sectionsInSF
//       .first()
//       .locator(productSF.columnsInSF)
//       .locator(productSF.blocksInSF)
//       .and(productSF.genLoc(productSF.bundleBlock));
//     await expect(blockBundles).toHaveCSS("z-index", expected.backward.bundle_z_index);
//     await previewPage.close();
//   });

//   await test.step(`Chuyển block bundle position = auto`, async () => {
//     await bundleInPreview.click();
//     await block.changeDesign(conf.caseConf.position_auto);
//   });

//   await test.step("Verify bring forward/backward button disabled", async () => {
//     const moveUpButton = block.quickBarButton("Move up");
//     if (moveUpButton !== null) {
//       await expect(block.quickBarButton("Move up")).toHaveClass(new RegExp(expected.disabled));
//       await expect(block.quickBarButton("Move down")).toHaveClass(new RegExp(expected.disabled));
//     } else {
//       await expect(block.quickBarButton("Bring forward")).toHaveClass(new RegExp(expected.disabled));
//       await expect(block.quickBarButton("Bring backward")).toHaveClass(new RegExp(expected.disabled));
//     }
//   });
// });
