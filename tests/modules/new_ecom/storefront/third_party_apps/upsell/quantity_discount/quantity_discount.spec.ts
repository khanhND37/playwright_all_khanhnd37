import { expect, test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import type { ShopTheme } from "@types";
import { QuantityDiscountHelper } from "./helper";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { SFCheckout } from "@pages/storefront/checkout";
import { AppsAPI } from "@pages/api/apps";
import { ProductAPI } from "@pages/api/product";
import { CollectionAPI } from "@pages/api/dashboard/collection";

test.describe("@SB_WEB_BUILDER_LBA_BQD Verify block Quantity discount", () => {
  let helper: QuantityDiscountHelper;
  let collectionAPI: CollectionAPI;
  let productAPI: ProductAPI;
  let appsAPI: AppsAPI;
  let shopTheme: ShopTheme;

  let appUpsell;
  let storeData;

  let products = [];

  test.beforeAll(async ({ conf, authRequest }) => {
    const domain = conf.suiteConf.domain;
    const preData = conf.suiteConf.pre_data;

    collectionAPI = new CollectionAPI(domain, authRequest);
    productAPI = new ProductAPI(domain, authRequest);
    appsAPI = new AppsAPI(domain, authRequest);

    appUpsell = preData.app_upsell;
    storeData = preData.store;

    let collection = null;

    await test.step("Create products", async () => {
      // if products are existed then skip creating
      const listProducts = await productAPI.getProducts({
        title: storeData.product.title,
        title_mode: "contains",
      });
      if (listProducts.length >= storeData.products.length) {
        products = listProducts;
        return;
      }

      // create products if it's not exited
      for (let i = 0; i < storeData.products.length; i++) {
        const product = storeData.products[i];
        const productRequest = Object.assign({}, storeData.product, product);
        const productResponse = await productAPI.createNewProduct(productRequest);
        products.push(productResponse);
      }
    });

    await test.step("Create collections", async () => {
      // if collection is existed then skip creating
      const collectionName = storeData.collection.custom_collection.title;
      const collections = await collectionAPI.searchCollections({ title: collectionName });
      if (collections.length > 0) {
        collection = collections[0];
        return;
      }

      // create collection if it's not exited
      const { custom_collection: customCollection } = await collectionAPI.create(storeData.collection);
      collection = customCollection;

      const product = products.find(product => product.title === "Product C");
      await collectionAPI.update(collection.id, {
        custom_collection: {
          id: collection.id,
          collects: [
            {
              product_id: product.id,
            },
          ],
        },
        is_create_redirect: false,
      });
    });

    await test.step("Turn on app Upsell", async () => {
      await appsAPI.actionEnableDisableApp(appUpsell.name, appUpsell.status);
    });

    await test.step("Create offers", async () => {
      for (let i = 0; i < appUpsell.offers.length; i++) {
        const offer = appUpsell.offers[i];
        const targetIds = [];
        switch (offer.target_type) {
          case "collection":
            targetIds.push(collection.id);
            break;
          case "product":
            targetIds.push(products.find(product => product.title === offer.target_ids[0]).id);
            break;
        }

        const offerRequest = Object.assign(
          {},
          {
            ...appUpsell.offer,
            offer_name: `${appUpsell.offer.offer_name} ${i}`,
          },
          offer,
          { target_ids: targetIds },
        );

        await appsAPI.createNewUpsellOffer(offerRequest);
      }
    });
  });

  test.afterAll(async ({ conf, theme }) => {
    await test.step("Delete all offers", async () => {
      const appUpsell = conf.suiteConf.pre_data.app_upsell;
      const offers = await appsAPI.getListUpsellOffers({ offer_types: appUpsell.offer.offer_type });
      const offerIds = offers.map(offer => offer.id);
      if (offerIds.length > 0) {
        await appsAPI.deleteAllUpsellOffers(offerIds);
      }
    });

    await test.step("Remove all unuse template", async () => {
      const templates = await theme.list();
      for (const template of templates) {
        if (!template.active) {
          await theme.delete(template.id);
        }
      }
    });
  });

  test.beforeEach(async ({ conf, context, theme, builder, dashboard, snapshotFixture }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    helper = new QuantityDiscountHelper(conf, context, dashboard, snapshotFixture);
    await test.step("Apply template", async () => {
      const listTemplate = await builder.getThemeTemplateInPopup(conf.suiteConf.domain, "ecommerce");
      const packwise = listTemplate.filter(template => template.title === "Packwise");
      const res = await theme.applyTemplate(packwise[0].id);
      shopTheme = await theme.publish(res.id);
    });

    await test.step(`Go to page ${helper.caseData.startup_page} page`, async () => {
      const section = helper.preData.sections[0];
      const product = products.find(p => p.title === section.variable.source);
      await helper.setupStartupPage({
        themeId: shopTheme.id,
        productId: product.id,
        page: helper.caseData.startup_page,
        hideLayers: helper.preCondition.hide_layers,
      });
    });
  });

  test("@SB_WEB_BUILDER_LBA_BQD_01 Verify default data of block Quantity discount when drag and insert on section", async () => {
    const section1 = helper.preData.sections[0]; // source Product A
    const section2 = helper.caseData.sections[0]; // source Product B

    await test.step(`Drag block Quantiy discount on section (data source: ${section1.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section1);
      await helper.savePage();
      await helper.verifySidebar({ tabs: ["Design", "Content"] });
      await helper.webBuilder.backBtn.click();
      await helper.verifyWebfront({ section: section1, snapshotIndex: 0 });
    });

    await test.step("Open home page on Storefront and verify", async () =>
      helper.verifyStorefront({ section: section1 }));

    await test.step(`Click Add Block on section and insert block Quantiy discount on it (data source: ${section2.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section2);
      await helper.savePage();
      await helper.webBuilder.backBtn.click();
      await helper.verifyWebfront({ section: section2, snapshotIndex: 1 });
      // click on section to avoid quickbar not showing on block when drag/insert into section
      await helper.clickOnLayer(section2.position_section.to.position.section);
    });

    await test.step("Click button Add on block Quantity discount", async () => {
      const sectionIndex = section2.position_section.to.position.section;
      const blockSelector = helper.webBuilder.getSelectorByIndex({ section: sectionIndex });
      const frame = helper.dashboard.frameLocator(helper.webBuilder.iframe);
      // click on block to show quickbar setting
      await helper.clickOnLayer(section2.position_section.to.position.section, 1);
      await frame.locator(`${blockSelector}${helper.blocks.xPathSfnQuantityDiscountAddButton}`).last().click();
      await helper.webBuilder.quickBarButton("Save as template").waitFor({ state: "visible" });
    });
  });

  test("@SB_WEB_BUILDER_LBA_BQD_02 Verify block Quantity discount with different product pages and offers", async () => {
    const data = helper.caseData;
    const section = helper.caseData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
      await helper.savePage();
      await helper.verifySidebar({ tabs: ["Design"] });
      await helper.webBuilder.backBtn.click();
      await helper.verifyWebfront({ section });
    });

    for (let i = 0; i < data.verify.pages.length; i++) {
      const page = data.verify.pages[i];
      await test.step(`[${i}] Open page ${page} on storefront and verify`, async () => {
        await helper.verifyStorefront({ section, snapshotIndex: i, route: data.verify.pages[i] });
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_BQD_05 Verify block Quantity Discount when change heading style (content align)", async () => {
    test.slow();
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
    });

    for (let i = 0; i < data.verify.content_aligns.length; i++) {
      const contentAlign = data.verify.content_aligns[i];
      await test.step(`[${i}] Select content align ${contentAlign} then open page ${data.verify.page} and verify`, async () => {
        await helper.clickOnLayer(section.position_section.to.position.section, 1);
        await helper.webBuilder.switchToTab("Design");
        await helper.webBuilder.selectAlignSelf("content_align", contentAlign);
        await helper.savePage();
        await helper.webBuilder.backBtn.click();
        await helper.verifyWebfront({ section, snapshotIndex: i });
        await helper.verifyStorefront({ section, snapshotIndex: i, route: data.verify.page });
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_BQD_06 Verify block Quantity Discount when change shape style", async () => {
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
    });

    for (let i = 0; i < data.verify.shapes.length; i++) {
      const shape = data.verify.shapes[i];
      await test.step(`[${i}] Select shape ${shape} then open page ${data.verify.page} and verify`, async () => {
        await helper.clickOnLayer(section.position_section.to.position.section, 1);
        await helper.webBuilder.switchToTab("Design");
        await helper.webBuilder.selectDropDown("shape", shape);
        await helper.savePage();
        await helper.webBuilder.backBtn.click();
        await helper.verifyWebfront({ section, snapshotIndex: i });
        await helper.verifyStorefront({ section, snapshotIndex: i, route: data.verify.page });
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_BQD_07 Verify when change setting of block Quantity discount", async () => {
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
    });

    for (let i = 0; i < data.verify.tab_contents.length; i++) {
      const tabContent = data.verify.tab_contents[i];
      await test.step(`[${i}] Change setting of block Quantity discount: heading, total price, add button, button action`, async () => {
        await helper.clickOnLayer(section.position_section.to.position.section, 1);
        await helper.webBuilder.switchToTab("Content");
        await helper.webBuilder.switchToggle("show_heading", tabContent.show_heading);
        await helper.webBuilder.switchToggle("show_total_price", tabContent.show_total_price);
        await helper.webBuilder.switchToggle("show_add_cart_button", tabContent.show_add_cart_button);
        if (typeof tabContent.button_action !== "undefined") {
          await helper.webBuilder.selectDropDown("button_action", tabContent.button_action);
        }

        await helper.savePage();
        await helper.webBuilder.backBtn.click();
        await helper.verifyWebfront({ section, snapshotIndex: i });
        await helper.verifyStorefront({ section, snapshotIndex: i, route: data.verify.page, closeAfterDone: false });
      });

      // if user change button_action, we need to verify it
      if (typeof tabContent.button_action !== "undefined") {
        await test.step("Click Add button on block Quantity discount", async () => {
          const blocks = await helper.getAllBLocksVisible(section);
          await blocks[0].getByRole("button", { disabled: false }).first().click();
          if (tabContent.redirect) {
            await expect(helper.storefront).toHaveURL(/\/cart/);
            // clear products in cart
            await helper.storefront.locator(helper.blocks.xPathSfnRemoveItemInCart).first().click();
          }
        });
      }

      if (!helper.storefront.isClosed()) {
        await helper.storefront.close();
      }
    }
  });

  test("@SB_WEB_BUILDER_LBA_BQD_08 Verify style of block Quantity discount when change color and font on website style", async () => {
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
      await helper.webBuilder.backBtn.click();
    });

    await test.step("Change font and color on website style", async () => {
      const webPageStyle = new WebPageStyle(helper.dashboard, helper.shopDomain);
      // click style setting icon
      await webPageStyle.clickIconStylingSetting();
      await expect(helper.dashboard.locator(webPageStyle.xpathSettingStylingSidebar)).toBeVisible();

      // change color style
      await webPageStyle.clickStylingType("Colors");
      await helper.dashboard.locator(webPageStyle.getXpathColorLibraryByIndex(data.verify.color_library)).click();
      await helper.dashboard.locator(webPageStyle.xPathBackButton).click();
      await expect(helper.dashboard.locator(webPageStyle.xpathSettingStylingSidebar)).toBeVisible();

      // change font style
      await webPageStyle.clickStylingType("Fonts");
      await helper.webBuilder.genLoc(helper.webBuilder.xPathSkeletonFontGroup).last().waitFor({ state: "hidden" });
      await helper.dashboard.locator(webPageStyle.getXpathFontLibraryByIndex(data.verify.font_library)).click();
    });

    await test.step(`Verify setting change on webfront and storefront`, async () => {
      await helper.savePage();
      await helper.verifyWebfront({ section });
      await helper.verifyStorefront({ section, route: data.verify.page });
    });
  });

  test("@SB_WEB_BUILDER_LBA_BQD_09 Verify block Quantity discount when resize", async () => {
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
      await helper.webBuilder.switchToTab("Design");
      // set block Quantity with unit of width is pixel
      await helper.webBuilder.settingWidthHeight("width", { unit: "Px" });
    });

    const blockPosition = section.blocks[0].position_section.to.position;
    const blockSelector = helper.webBuilder.getSelectorByIndex(blockPosition);
    // default width of block on pixel
    const sidebarBox = await helper.webBuilder.sidebarLoc.boundingBox();
    const iframeBox = await helper.webBuilder.genLoc(helper.webBuilder.iframe).boundingBox();
    const blockBox = await helper.webBuilder.frameLocator.locator(blockSelector).boundingBox();
    let blockWidth = blockBox.width;
    // side bar + section left padding on pixel
    const extraSpace = sidebarBox.width + (iframeBox.width - blockWidth) / 2;
    let resizePointerPosition = blockWidth + extraSpace - 4; // 4px buffer

    for (let i = 0; i < data.verify.resizes.length; i++) {
      const resize = data.verify.resizes[i];

      await test.step(`[${i}] Resize block to ${resize.block_width}px`, async () => {
        await helper.clickOnLayer(section.position_section.to.position.section, 1);
        const resizer = helper.webBuilder.frameLocator.locator(
          `${blockSelector}//div[@data-resize='${resize.position}']`,
        );

        if (resize.allow) {
          await expect(resizer).toBeVisible();
          // calculate pointer's x-coordinate to resize
          resizePointerPosition -= (blockWidth - resize.block_width) / 2;
          blockWidth = resize.block_width;

          await helper.webBuilder.resize(blockPosition, resize.position, resizePointerPosition);

          await helper.webBuilder.backBtn.click();
          await helper.savePage();
          await helper.verifyWebfront({
            section,
            snapshotIndex: i,
            snapshotName: `${resize.block_width}`,
            layer: "section",
          });
        } else {
          await expect(resizer).toBeHidden();
        }
      });
    }
  });

  test("@SB_WEB_BUILDER_LBA_BQD_10 Verify block Quantity discount when duplicate on quick bar", async () => {
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
      // click on section to avoid quickbar not showing on block when drag/insert into section
      await helper.clickOnLayer(section.position_section.to.position.section);
    });

    await test.step("Click duplicate on quick bar", async () => {
      // click on block to show quickbar setting
      await helper.clickOnLayer(section.position_section.to.position.section, 1);
      await helper.webBuilder.selectOptionOnQuickBar("Duplicate");
    });

    await test.step(`Verify duplicated block on storefront`, async () => {
      await helper.savePage();
      await helper.webBuilder.backBtn.click();
      await helper.verifyWebfront({ section, layer: "section" });
      await helper.verifyStorefront({ section, route: data.verify.page, layer: "section" });
    });
  });

  test("@SB_WEB_BUILDER_LBA_BQD_11 Verify block Quantity discount when delete on quick bar", async () => {
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag and drop section (data source: ${section.variable.source}) into webfront`, async () => {
      await helper.createSection(section);
    });

    const block = section.blocks[0];
    for (let i = 0; i < 2; i++) {
      await test.step(`[${i}] Drag and drop block Quantity discount on created section`, async () => {
        await helper.createBlock(block);
        block.removed = false;
        // click on section to avoid quickbar not showing on block when drag/insert into section
        await helper.clickOnLayer(section.position_section.to.position.section);
      });

      await test.step(`Click Delete on quick bar`, async () => {
        // click on block to show quickbar setting
        await helper.clickOnLayer(section.position_section.to.position.section, 1);
        await helper.webBuilder.selectOptionOnQuickBar("Delete");
        // set state of block is removed
        block.removed = true;
      });
    }

    await test.step(`Verify deleted block on webfront and storefront`, async () => {
      await helper.savePage();
      await helper.verifyWebfront({ section, layer: "section" });
      await helper.verifyStorefront({ section, route: data.verify.page, layer: "section" });
      // reset state of block to initial
      block.removed = false;
    });
  });

  test("@SB_WEB_BUILDER_LBA_BQD_12 Verify offer display on each product page", async () => {
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
    });

    await test.step("Open page on storefront and verify", async () => {
      await helper.savePage();
      for (let i = 0; i < data.verify.pages.length; i++) {
        await helper.verifyStorefront({ section, snapshotIndex: i, route: data.verify.pages[i] });
      }
    });
  });

  test("@SB_WEB_BUILDER_LBA_BQD_13 Verify apply discount from offer of block Quantity discount", async () => {
    test.slow();
    const data = helper.caseData;
    const section = helper.preData.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
    });

    let blocks = [];
    await test.step("Open page on storefront and verify", async () => {
      await helper.savePage();
      await helper.setupVerifyPage(data.verify.page);
      blocks = await helper.getAllBLocksVisible(section);
    });

    await test.step("Click Add button on block Quantity discount to add 2 product on cart", async () => {
      await blocks[0].getByRole("button").first().click();
      await helper.storefront.goto(`https://${helper.shopDomain}/cart`);
      await expect(helper.storefront).toHaveURL(/\/cart/);
    });

    const xPathCartQuantity = helper.blocks.xPathCartQuantity;
    const xPathDiscount = helper.blocks.xPathCartDiscount;
    for (let i = 0; i < data.verify.discounts.length; i++) {
      const { discount, quantity } = data.verify.discounts[i];
      await test.step(`Increase product in cart to ${quantity} items`, async () => {
        await helper.storefront
          .locator(`${xPathCartQuantity}//input[@type='number']`)
          .first()
          .fill(quantity.toString());
        await expect(
          helper.storefront.locator(xPathDiscount).getByText(`-$${discount}.00`, { exact: true }).first(),
        ).toBeVisible();
      });
    }

    const checkoutPage = new SFCheckout(helper.storefront, helper.shopDomain);
    await test.step(`Go to checkout page and checkout cart`, async () => {
      await checkoutPage.checkoutButton.click();
      await expect(helper.storefront).toHaveURL(/\/checkouts/);
      await checkoutPage.discountTag.waitFor();

      const checkoutInfo = data.verify.checkout_info;
      await checkoutPage.fillCheckoutInfo(
        checkoutInfo.email,
        checkoutInfo.fName,
        checkoutInfo.lName,
        checkoutInfo.add,
        checkoutInfo.city,
        checkoutInfo.state,
        checkoutInfo.zip,
        checkoutInfo.country,
        checkoutInfo.phone,
        false,
      );
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      await checkoutPage.completeOrderWithMethod(data.verify.payment_method);
      expect(await checkoutPage.isThankyouPage()).toBe(true);
    });

    await test.step(`Verify order have offer discount as expected`, async () => {
      const orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      const lastDiscount = data.verify.discounts[3];
      const discountInOrder = Math.abs(parseFloat(orderSummaryInfo.discountValue.toString()));
      const shippingFee =
        orderSummaryInfo.shippingSF === "Free" ? 0 : parseFloat(orderSummaryInfo.shippingSF.toString());
      const totalSF = orderSummaryInfo.subTotal + shippingFee + orderSummaryInfo.tippingValue - discountInOrder;
      const productPrice = storeData.product.variantDefault.price;
      expect(discountInOrder).toBe(lastDiscount.discount);
      expect(orderSummaryInfo.subTotal).toBe(lastDiscount.quantity * productPrice);
      expect(orderSummaryInfo.totalSF).toBe(totalSF);
    });

    if (!helper.storefront.isClosed()) {
      await helper.storefront.close();
    }
  });

  test("@SB_WEB_BUILDER_LBA_BQD_14 Verify add offer on block Quantity discount when product has custom options", async () => {
    const data = helper.caseData;
    const section = data.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
    });

    let blocks = [];
    await test.step("Open page on storefront and verify", async () => {
      await helper.savePage();
      await helper.setupVerifyPage(data.verify.page);
      blocks = await helper.getAllBLocksVisible(section);
    });

    const variantLocator = helper.storefront.locator("//section[@component='variants']").first();
    const xPathCustomOptionError = helper.blocks.xPathCustomOptionError;
    for (let i = 0; i < data.verify.variant_pickers.length; i++) {
      const { size, option_text: optionText, expect_added: expectAdded } = data.verify.variant_pickers[i];
      const targetAddButton = blocks[0].getByRole("button");
      await helper.clearCartItems();
      await test.step("Input custom options and variants", async () => {
        if (size) {
          await variantLocator
            .locator(`//div[contains(@class, 'button-layout') and normalize-space()='${size}']`)
            .click();
        }

        if (optionText) {
          await variantLocator.locator("//input[@placeholder='Please fill out this field']").fill(optionText);
        }
      });

      await test.step("Click Add button on block Quantity discount", async () => {
        await targetAddButton.nth(i).click(); // click Add on block Quantity Discount
        const errorCount = await helper.storefront.locator(xPathCustomOptionError).count();
        expect(expectAdded).toBe(errorCount === 0);
        if (errorCount === 0) {
          await targetAddButton.nth(i).locator("//span[@class='loading-spinner']").waitFor({ state: "detached" });
          await targetAddButton.locator("//span[normalize-space()='Added']").waitFor({ state: "visible" });
          await helper.verifyStorefront({
            section,
            snapshotIndex: i,
            route: data.verify.page,
            layer: "section",
            closeAfterDone: false,
          });
        }
      });
    }

    if (!helper.storefront.isClosed()) {
      await helper.storefront.close();
    }
  });

  test("@SB_WEB_BUILDER_LBA_BQD_15 Verify offer discount on block Quantity discount is synchronous when add products from button", async () => {
    test.slow();
    const data = helper.caseData;
    const section = data.sections[0];

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
      // change button action is Add to cart
      const lastBlock = section.blocks[section.blocks.length - 1];
      await helper.webBuilder.switchToTab("Content");
      await helper.webBuilder.inputTextBox("title", lastBlock.content.title);
      await helper.webBuilder.selectDropDown("link", lastBlock.content.action);
      // wait for data processing cause there's no API or State to check
      await helper.webBuilder.waitAbit(500);

      // hide section Product info to avoid conflict
      await helper.webBuilder.backBtn.click();
      await helper.webBuilder.hideOrShowLayerInSidebar({
        sectionName: "Product info",
        isHide: true,
      });

      await helper.webBuilder.clickIconWebsiteSetting();
      await helper.webBuilder.clickCategorySetting("Product");
      await helper.webBuilder.selectDropDown("click_add_cart", "Open cart drawer");
      // wait for data processing cause there's no API or State to check
      await helper.webBuilder.waitAbit(500);
    });

    let verifyPage = data.verify.page;
    await test.step("Open page on storefront and verify", async () => {
      await helper.savePage();
      await helper.setupVerifyPage(verifyPage);
    });

    const xPathCartDrawer = helper.blocks.xPathCartDrawer;
    const xPathCustomOptionError = helper.blocks.xPathCustomOptionError;
    let quantityInCart = 0;
    for (let i = 0; i < data.verify.variant_pickers.length; i++) {
      const variant = data.verify.variant_pickers[i];
      await test.step("Add product to cart with size", async () => {
        if (verifyPage !== variant.page) {
          verifyPage = variant.page;
          await helper.storefront.close();
          await helper.setupVerifyPage(verifyPage);
        }

        const cartDrawer = helper.storefront.locator(xPathCartDrawer);
        const blocks = await helper.getAllBLocksVisible(section);
        const quantityInputBlock = blocks[0];
        const variantPickerBlock = blocks[1];
        const addToCartButtonBlock = blocks[2];

        if (variant.clear_cart) {
          await helper.clearCartItems();
          quantityInCart = 0;
        }

        if (variant.size) {
          await variantPickerBlock
            .locator(`//div[contains(@class, 'button-layout') and normalize-space()='${variant.size}']`)
            .click();
        }

        if (variant.option_text) {
          await variantPickerBlock
            .locator("//input[@placeholder='Please fill out this field']")
            .fill(variant.option_text);
        }

        await quantityInputBlock.locator("//input[@type='number']").fill(variant.quantity.toString());
        await addToCartButtonBlock.click();

        const errorCount = await helper.storefront.locator(xPathCustomOptionError).count();
        expect(variant.expect_added).toBe(errorCount === 0);
        if (errorCount === 0) {
          quantityInCart += variant.quantity;
          await cartDrawer.waitFor({ state: "visible" });
          await cartDrawer.locator(helper.blocks.xPathIconCloseCartDrawer).click();
          await cartDrawer.waitFor({ state: "hidden" });

          // offer is actived when cart contain 2, 3 or 5 products
          if ([2, 3, 5].includes(quantityInCart)) {
            await helper.verifyStorefront({
              section,
              snapshotIndex: i,
              route: data.verify.page,
              blockIndexs: [3],
              closeAfterDone: false,
            });
          }
        }
      });
    }

    if (!helper.storefront.isClosed()) {
      await helper.storefront.close();
    }

    await helper.setupVerifyPage("cart");
    // cart info also have position = 3
    await helper.verifyStorefront({
      section,
      route: data.verify.page,
      layer: "section",
    });

    await helper.clickOnLayer(section.position_section.to.position.section);
    await helper.webBuilder.backToLayerBtn.click();
    await helper.webBuilder.hideOrShowLayerInSidebar({
      sectionName: "Product info",
      isHide: false,
    });
  });

  test("@SB_WEB_BUILDER_LBA_BQD_16 Verify show placeholder of block Quantity discount", async () => {
    test.slow();
    const data = helper.caseData;
    const section = data.sections[0];
    const block = section.blocks[0];
    let webfrontSnapshotCount = 0;
    let storefrontSnapshotCount = 0;

    await test.step(`Drag block Quantiy discount on section (data source: ${section.variable.source})`, async () => {
      await helper.setupSectionAndBlocks(section);
      await helper.webBuilder.selectProductPreviewByName(helper.verify.products[0]);
      await helper.savePage();
    });

    await test.step("Turn off app Upsell", async () => {
      await appsAPI.actionEnableDisableApp(appUpsell.name, false);
      // because upsell app is disable so block Quantity discount will be hidden
      block.removed = true;
    });

    await test.step("Verify block Quantity discount is disappear", async () => {
      await helper.webBuilder.reload();
      await helper.webBuilder.selectProductPreviewByName(helper.verify.products[0]);
      await helper.webBuilder.expandCollapseLayer({
        sectionName: "Single column",
        isExpand: true,
      });

      const quantityDiscountSelector = helper.webBuilder.getSidebarSelectorByName({
        sectionName: "Single column",
        subLayerName: "Quantity discount",
      });
      const xPathHiddenLayerIcon = helper.webBuilder.xPathHiddenLayerIcon;
      const hiddenIcon = helper.dashboard.locator(`${quantityDiscountSelector}${xPathHiddenLayerIcon}`);
      await expect(hiddenIcon).toBeVisible();
      await helper.verifyWebfront({ section: section, snapshotIndex: webfrontSnapshotCount++, layer: "section" });
      await helper.verifyStorefront({
        section,
        snapshotIndex: storefrontSnapshotCount++,
        route: helper.verify.pages[0],
        layer: "section",
      });
    });

    await test.step("Turn on app Upsell and delete all offers", async () => {
      await appsAPI.actionEnableDisableApp(appUpsell.name, true);

      const offers = await appsAPI.getListUpsellOffers({ offer_types: appUpsell.offer.offer_type });
      const offerIds = offers.map(offer => offer.id);
      await appsAPI.deleteAllUpsellOffers(offerIds);
      // because upsell app is enable so block Quantity discount will be visible
      block.removed = false;
    });

    const offer = helper.caseData.verify.offer;
    const productName = offer.target_ids[0];
    await test.step(`Create an offer for ${productName}`, async () => {
      const targetIds = [];
      targetIds.push(products.find(product => product.title === productName).id);
      const offerRequest = Object.assign({}, appUpsell.offer, offer, { target_ids: targetIds });
      await appsAPI.createNewUpsellOffer(offerRequest);
    });

    await test.step("Verify block Quantity discount is appear and disappear", async () => {
      await helper.webBuilder.reload();
      await helper.webBuilder.selectProductPreviewByName(helper.verify.products[0]);
      for (let i = 0; i < helper.verify.products.length; i++) {
        const productName = helper.verify.products[i];
        await helper.webBuilder.selectProductPreviewByName(productName);
        await helper.verifyWebfront({ section: section, snapshotIndex: webfrontSnapshotCount++ });
      }
    });

    await test.step("Open page on storefront and verify", async () => {
      for (let i = 0; i < data.verify.pages.length; i++) {
        const page = data.verify.pages[i];
        if (page === "products/product-b") {
          // block is removed because it's not included in Offer
          block.removed = true;
        }

        await helper.verifyStorefront({
          section,
          snapshotIndex: storefrontSnapshotCount++,
          route: data.verify.pages[i],
        });
      }
    });
  });
});
