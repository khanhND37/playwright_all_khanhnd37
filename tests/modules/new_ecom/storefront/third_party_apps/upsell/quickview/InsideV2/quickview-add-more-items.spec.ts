import { test, expect } from "@fixtures/theme";
import { SFUpSellAPI } from "@pages/new_ecom/storefront/apps/upsell/cross-sell";
import { CrossSellAPI } from "@pages/api/apps/upsell/cross-sell";
import { AppsAPI } from "@pages/api/apps";
import { Products, ThemeSettingsData } from "@types";
import { ProductAPI } from "@pages/api/product";
import { SFProduct } from "@pages/storefront/product";
import { waitForImageLoaded } from "@core/utils/theme";
import { SFCart } from "@pages/storefront/cart";

test.describe("@SB_INS_QVA Quickview & Add more items Inside v2", () => {
  let upsellSF: SFUpSellAPI;
  let app: CrossSellAPI;
  let appsAPI: AppsAPI;
  let productAPI: ProductAPI;
  let themeSettingsData: ThemeSettingsData;
  const deleteProdIds = [];
  const softExpect = expect.configure({ soft: true });

  test.beforeAll(async ({ theme, conf }) => {
    await test.step("Check test theme is published or not", async () => {
      const publishedTheme = await theme.getPublishedTheme();
      if (publishedTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
    });
  });

  test.beforeEach(async ({ conf, api, authRequest, cConf, theme }) => {
    upsellSF = new SFUpSellAPI(conf.suiteConf.domain, api);
    app = new CrossSellAPI(conf.suiteConf.domain, conf.suiteConf.shop_id, authRequest);
    appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);

    await test.step("Update settings data theme to initial state", async () => {
      const themeList = await theme.list();
      const backup = themeList.find(theme => theme.name === "Theme default backup");
      const themeBackup = await theme.single(backup.id);
      themeSettingsData = themeBackup.settings_data;
      await theme.update(conf.suiteConf.theme_id, themeSettingsData);
    });

    await test.step("Check turn on Boost Upsell and off smart offer", async () => {
      await app.setBoostUpsell(true);
      await appsAPI.changeCTABtnSettings(conf.suiteConf.turn_off_smart_offer);
    });

    await test.step("Turn off all product widgets", async () => {
      await app.setProductWidgets("handpicked-product", false);
      await app.setProductWidgets("best-seller", false);
      await app.setProductWidgets("recent-view", false);
      await app.setProductWidgets("also-bought", false);
      await app.setProductWidgets("cart-recommend", false);
      await app.setProductWidgets("more-collection", false);
    });

    await test.step("Active offer if required", async () => {
      if (cConf.offer_ids) {
        await app.requestOnOffOffer({
          api: authRequest,
          domain: conf.suiteConf.domain,
          shop_id: conf.suiteConf.shop_id,
          offer_ids: cConf.offer_ids,
          status: true,
        });
        await upsellSF.waitOfferUpdated(cConf.offer_ids);
      }
    });

    await test.step("Make products unavailable", async () => {
      const listProd = await productAPI.getAllProduct(conf.suiteConf.domain);
      const prodIds = listProd.map(prod => prod.id);
      await productAPI.changeProductsStatus(prodIds, { published: false });
    });

    await test.step("Publish products test", async () => {
      const listProd = await productAPI.getAllProduct(conf.suiteConf.domain);
      const prodIds = listProd.map(prod => {
        for (const product of cConf.products) {
          if (prod.title === product) {
            return prod.id;
          }
        }
      });
      await productAPI.changeProductsStatus(prodIds, { published: true });
    });
  });

  test.afterEach(async ({ authRequest, conf }) => {
    await test.step("Deactivate all offers", async () => {
      const listOffer = await app.getListUpsellOffers();
      const offerIds = [];
      listOffer.forEach(offer => {
        offerIds.push(offer.id);
      });
      if (offerIds.length > 0) {
        app.requestOnOffOffer({
          api: authRequest,
          domain: conf.suiteConf.domain,
          offer_ids: offerIds,
          status: false,
        });
      }
    });

    await test.step("Make products unavailable", async () => {
      const listProd = await productAPI.getAllProduct(conf.suiteConf.domain);
      const prodIds = listProd.map(prod => prod.id);
      await productAPI.changeProductsStatus(prodIds, { published: false });
    });

    await test.step("Delete products after test", async () => {
      if (deleteProdIds.length > 0) {
        await productAPI.deleteProducts(deleteProdIds, conf.suiteConf.password);
      }
    });
  });

  test(`@SB_SF_BUSF_QVA_18 Quickview_Check hiển thị CTA button khi product có variant sold out`, async ({
    page,
    cConf,
    conf,
    theme,
    authRequest,
    snapshotFixture,
  }) => {
    const productDetailSF = new SFProduct(page, conf.suiteConf.domain);
    let targetProd: Products;

    await test.step("Pre-condition: Uncheck Link product options in Theme editor & active offer", async () => {
      const uncheckLinkProdOpt = JSON.parse(JSON.stringify(themeSettingsData));
      const linkProdOptions = uncheckLinkProdOpt.settings.product_grid.link_product_options;
      if (linkProdOptions) {
        uncheckLinkProdOpt.settings.product_grid.link_product_options = false;
        await theme.update(conf.suiteConf.theme_id, uncheckLinkProdOpt);
      }
      const listOffer = await app.getListUpsellOffers();
      const offer = listOffer.find(offer => offer.offer_name === cConf.offer_name);
      await app.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        offer_ids: [offer.id],
        status: true,
      });
      await upsellSF.waitOfferUpdated([offer.id]);
    });

    await test.step("Pre-condition: Get info product test", async () => {
      const prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
      const listProd = await prodAPI.getAllProduct(conf.suiteConf.domain);
      targetProd = listProd.find(prod => prod.title === cConf.product_title.target);
    });

    await test.step(`Ngoài SF, truy cập product C (target product)`, async () => {
      await productDetailSF.goto(`products/${targetProd.handle}`);
      await productDetailSF.page.waitForResponse(/theme.css/);
    });

    await test.step("Verify accessories offer hiển thị", async () => {
      await expect(productDetailSF.suggestedAccessories).toBeVisible();
      await softExpect(
        productDetailSF.singleAccessory.filter({ hasText: cConf.product_title.recommend }),
      ).toBeVisible();
    });

    await test.step(`Click vào button add product D (recommend product)`, async () => {
      await productDetailSF.addAccessory(cConf.product_title.recommend);
    });

    await test.step("Verify quickview popup hiển thị product recommend", async () => {
      await productDetailSF.page.waitForResponse(/widget.json/);
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productDetailSF.quickviewUpsell,
        snapshotName: cConf.expected.quickview_snapshot,
      });
    });

    await test.step(`Chọn variant size M, color Red`, async () => {
      await productDetailSF.variantOptions.filter({ hasText: "M" }).click();
      await productDetailSF.selectColorSwatches(cConf.color_swatches.red);
    });

    await test.step("Verify product với variants đã chọn hiển thị Unavailable", async () => {
      await softExpect(productDetailSF.quickviewAddToCartBtn).toBeDisabled();
      await softExpect(productDetailSF.quickviewAddToCartBtn).toHaveText(cConf.expected.unavailable);
    });
  });

  test(`@SB_SF_BUSF_QVA_19 Quickview_Check hiển thị size chart trên Quickview`, async ({
    page,
    conf,
    cConf,
    snapshotFixture,
    authRequest,
  }) => {
    let prodA: Products;
    const productDetailSF = new SFProduct(page, conf.suiteConf.domain);
    const sizechart = cConf.size_chart;

    await test.step("Pre-condition: Enable widget size chart & best seller widget", async () => {
      await productAPI.setSizeChart(true);
      await app.setProductWidgets("best-seller", true);
    });

    await test.step("Pre-condition: Get info product test", async () => {
      const prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
      const listProd = await prodAPI.getAllProduct(conf.suiteConf.domain);
      prodA = listProd.find(prod => prod.title === cConf.product_title.product_a);
    });

    await test.step(`Add to cart A trên widget`, async () => {
      await productDetailSF.goto(`products/${prodA.handle}`);
      await productDetailSF.page.waitForResponse(/theme.css/);
      await productDetailSF.footerSectionV2.evaluate(ele =>
        ele.scrollIntoView({ behavior: "instant", block: "center" }),
      );
      await expect(productDetailSF.widgetBestSeller).toBeVisible();
      await productDetailSF.widgetBestSeller.evaluate(ele =>
        ele.scrollIntoView({ behavior: "instant", block: "center" }),
      );
      await productDetailSF.addToCartProductInWidget("Best seller", cConf.product_title.product_a);
    });

    await test.step("Verify button view size guide under add to cart", async () => {
      await productDetailSF.quickviewRecommended.waitFor();
      await waitForImageLoaded(page, productDetailSF.productCarouselQuickview);
      await productDetailSF.productSizeGuide.filter({ hasText: "View Size Guide" }).waitFor();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productDetailSF.quickviewProductInfo,
        snapshotName: cConf.button_view_size_chart_snapshot,
      });
    });

    await test.step(`Click View Size Guide ở quick view`, async () => {
      await productDetailSF.productSizeGuide.filter({ hasText: "View Size Guide" }).click();
    });

    await test.step("Verify size chart of product A", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeVisible();
      await waitForImageLoaded(page, productDetailSF.quickviewSizeChartImg);
      await expect(productDetailSF.genLoc(productDetailSF.quickviewSizeChartImg)).toBeVisible();
      await expect(productDetailSF.imageSizeChartByName(sizechart)).toBeVisible();
      await expect(productDetailSF.productSizeGuide.filter({ hasText: "View Size Guide" })).toBeHidden();
      await expect(productDetailSF.productSizeGuide.filter({ hasText: "Hide Size Guide" })).toBeVisible();
    });

    await test.step(`Add to cart B trên widget`, async () => {
      await productDetailSF.closeQuickviewBtn.click();
      await productDetailSF.addToCartProductInWidget("Best seller", cConf.product_title.product_b);
    });

    await test.step(`Click View Size guide`, async () => {
      await productDetailSF.productSizeGuide.filter({ hasText: "View Size Guide" }).click();
    });

    await test.step("Verify size chart of product B", async () => {
      await waitForImageLoaded(page, productDetailSF.quickviewSizeChartImg);
      await expect(productDetailSF.genLoc(productDetailSF.quickviewSizeChartImg)).toBeVisible();
      await expect(productDetailSF.tableSizeChart).toBeVisible();
      await expect(productDetailSF.tabSizeChart).toBeVisible();
    });

    await test.step(`Chọn base 2`, async () => {
      await productDetailSF.quickviewSelectBase.selectOption({ label: cConf.base_product_2 });
    });

    await test.step("Verify size chart of product B", async () => {
      await productDetailSF.quickviewRecommended.waitFor();
      await expect(productDetailSF.genLoc(productDetailSF.quickviewSizeChartImg)).toBeVisible();
      await expect(productDetailSF.tableSizeChart).toBeVisible();
      await expect(productDetailSF.tabSizeChart).toBeVisible();
    });
  });

  test(`@SB_SF_BUSF_QVA_20 Quickview_Check hiển thị image của quickview`, async ({
    page,
    conf,
    cConf,
    authRequest,
  }) => {
    let prodA: Products;
    let thumbnailImgNames: string[];
    const productDetailSF = new SFProduct(page, conf.suiteConf.domain);

    await test.step("Pre-condition: Enable widget best seller", async () => {
      await app.setProductWidgets("best-seller", true);
    });

    await test.step("Pre-condition: Get info product test", async () => {
      const prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
      const listProd = await prodAPI.getAllProduct(conf.suiteConf.domain);
      prodA = listProd.find(prod => prod.title === cConf.product_a);
    });

    await test.step(`Add to cart Product A trên widget best seller`, async () => {
      await productDetailSF.goto(`products/${prodA.handle}`);
      await productDetailSF.page.waitForResponse(/theme.css/);
      await productDetailSF.footerSectionV2.evaluate(ele =>
        ele.scrollIntoView({ behavior: "instant", block: "center" }),
      );
      await expect(productDetailSF.widgetBestSeller).toBeVisible();
      await productDetailSF.widgetBestSeller.evaluate(ele =>
        ele.scrollIntoView({ behavior: "instant", block: "center" }),
      );
      await productDetailSF.addToCartProductInWidget("Best seller", cConf.product_a);
    });

    await test.step("Verify quickview", async () => {
      await page.waitForResponse(/co-bought.json/);
      await expect(productDetailSF.quickviewRecommended).toBeVisible();
      thumbnailImgNames = await productDetailSF.getThumbnailImgNames();
      await softExpect(productDetailSF.quickviewRecommendedProducts).toHaveCount(
        cConf.expected.max_recommended_products,
      );
      await expect(productDetailSF.productImgCarouselQuickview.getByLabel("Next page")).toBeVisible();
      await expect(productDetailSF.productImgCarouselQuickview.getByLabel("Previous page")).toBeVisible();
      await expect(productDetailSF.quickviewPreviewImg).toHaveAttribute("src", new RegExp(thumbnailImgNames[0]));
    });

    await test.step(`Click variant 2`, async () => {
      await productDetailSF.variantOptions.filter({ hasText: "2" }).click();
    });

    await test.step("Verify preview image changed to variant 2 image", async () => {
      await softExpect(productDetailSF.quickviewPreviewImg).toHaveAttribute("src", new RegExp(thumbnailImgNames[1]));
    });

    await test.step(`Click next trái ở thumnail`, async () => {
      await productDetailSF.productImgCarouselQuickview.getByLabel("Next page").click();
    });

    await test.step("Verify thumbnail images", async () => {
      await softExpect(productDetailSF.quickviewPreviewImg).toHaveAttribute("src", new RegExp(thumbnailImgNames[1]));
      for (const variant of cConf.next_page_variants) {
        await softExpect(productDetailSF.thumbnailImg.nth(variant)).toBeInViewport();
      }
    });

    await test.step(`Click chọn ảnh  của varaint 4`, async () => {
      await productDetailSF.productImgCarouselQuickview.getByLabel("Previous page").click();
      await productDetailSF.thumbnailImg.nth(3).click();
    });

    await test.step("Verify thay đổi product preview image", async () => {
      await softExpect(productDetailSF.quickviewPreviewImg).toHaveAttribute("src", new RegExp(thumbnailImgNames[3]));
    });

    for (const variant of cConf.variants_index) {
      await test.step(`Select lần lượt các image ở thumbnail `, async () => {
        await productDetailSF.thumbnailImg.nth(variant).click();
      });

      await test.step("Verify preview image thay đổi", async () => {
        await softExpect(productDetailSF.quickviewPreviewImg).toHaveAttribute(
          "src",
          new RegExp(thumbnailImgNames[variant]),
        );
      });
    }
  });

  test(`@SB_SF_BUSF_QVA_21 Quickview_Check add product có custom option vào cart khi mở quick view từ bundle`, async ({
    page,
    conf,
    authRequest,
    cConf,
  }) => {
    const productDetailSF = new SFProduct(page, conf.suiteConf.domain);

    await test.step("Pre-condition: Active bundle offer", async () => {
      const listOffers = await app.getListUpsellOffers({ offer_types: "bundle" });
      const testBundle = listOffers.find(offer => offer.offer_name === cConf.bundle_name);
      if (!testBundle.activated) {
        await app.requestOnOffOffer({
          api: authRequest,
          domain: conf.suiteConf.domain,
          offer_ids: [testBundle.id],
          status: true,
        });
        await upsellSF.waitOfferUpdated([testBundle.id]);
        if (process.env.CI_ENV === "dev" || process.env.ENV === "local") {
          await page.waitForTimeout(5000); //Trên dev bị cache lâu ko còn gì để wait
        }
      }
    });

    await test.step("Pre-condition: Go to product B SF", async () => {
      await productDetailSF.goto(`${cConf.product_b_handle}`);
      await page.waitForResponse(/theme.css/);
      await expect(productDetailSF.bundleOffer).toBeVisible();
    });

    await test.step(`Click ảnh  của product A trên bundle`, async () => {
      await productDetailSF.clickImgOfProductInBundle(cConf.product_a);
    });

    await test.step("Verify show quickview", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeVisible();
      await expect(productDetailSF.quickviewCustomOptions).toBeVisible();
      await expect(productDetailSF.customOptionTextarea).toBeVisible();
      await expect(productDetailSF.customOptionName).toHaveText(cConf.expected.custom_option_name);
    });

    await test.step(`Không nhập custom option  và click Add to cart`, async () => {
      await productDetailSF.quickviewProductInfo.getByRole("button", { name: "Add to cart" }).click();
    });

    await test.step("Verify validate message appear", async () => {
      await softExpect(productDetailSF.customOptionTextarea.locator(productDetailSF.validateMsg)).toHaveText(
        cConf.expected.validate_message,
      );
    });

    await test.step(`Nhập custom option của Name và Textarea sau đó add to cart`, async () => {
      await productDetailSF.quickviewUpsell.getByRole("textbox").fill(cConf.valid_name);
      await productDetailSF.quickviewProductInfo.getByRole("button", { name: "Add to cart" }).click();
    });

    await test.step("Verify add thành công", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeHidden();
      await expect(productDetailSF.cartDrawer).toBeVisible();
      await expect(productDetailSF.productsCart.filter({ hasText: cConf.product_a })).toBeVisible();
      await expect(productDetailSF.productsCart.filter({ hasText: cConf.expected.custom_option })).toBeVisible();
    });
  });

  test(`@SB_SF_BUSF_QVA_22 Add more item - Check add product ở Add more item`, async ({
    page,
    conf,
    cConf,
    snapshotFixture,
  }) => {
    const productDetailSF = new SFProduct(page, conf.suiteConf.domain);
    const cartSF = new SFCart(page, conf.suiteConf.domain);
    let prodAInitialQty: number;

    await test.step(`- Add product A vào cart  - Mở Cart page`, async () => {
      await productDetailSF.goto(`${cConf.product_a.handle}`);
      await page.waitForResponse(/theme.css/);
      await productDetailSF.productInfo.getByRole("button", { name: "Add to cart" }).click();
      await expect(productDetailSF.cartDrawer).toBeVisible();
      await expect(productDetailSF.productsCart.filter({ hasText: cConf.product_a.name })).toBeVisible();
      await productDetailSF.goto("cart");
      await page.waitForResponse(/theme.css/);
      prodAInitialQty = await cartSF.getProductInCartQuantity(cConf.product_a.name);
    });

    await test.step(`Click Add more item`, async () => {
      await cartSF.addMoreItemsProduct(cConf.product_a.name);
    });

    await test.step("Verify quickview popup display", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeVisible();
      await waitForImageLoaded(page, ".preview-image img");
      await expect(productDetailSF.quickviewPreviewImg).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productDetailSF.quickviewUpsell,
        snapshotName: cConf.expected.quickview_product_a_snapshot,
      });
    });

    await test.step(`Click Add to cart button`, async () => {
      await productDetailSF.quickviewUpsell.getByRole("button", { name: "Add to cart" }).click();
    });

    await test.step("Verify product added to cart successfully", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeHidden();
      await expect(productDetailSF.cartDrawer).toBeVisible();
      await expect(productDetailSF.productsCart.filter({ hasText: cConf.product_a.name })).toBeVisible();
      await softExpect(
        productDetailSF.productsCart.filter({ hasText: cConf.product_a.name }).getByRole("spinbutton"),
      ).toHaveValue(`${prodAInitialQty + 1}`);
    });

    await test.step(`- Add product B vào cart  - Mở Cart page`, async () => {
      await productDetailSF.goto(`${cConf.product_b.handle}`);
      await page.waitForResponse(/theme.css/);
      await productDetailSF.productInfo.getByRole("button", { name: "Add to cart" }).click();
      await expect(productDetailSF.cartDrawer).toBeVisible();
      await expect(productDetailSF.productsCart.filter({ hasText: cConf.product_b.name })).toBeVisible();
      await productDetailSF.goto("cart");
      await page.waitForResponse(/cart.json/);
    });

    await test.step(`Click text link Add more item`, async () => {
      await cartSF.addMoreItemsProduct(cConf.product_b.name);
    });

    await test.step("Verify popup quickview display", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeVisible();
      await waitForImageLoaded(page, ".preview-image img");
      await expect(productDetailSF.quickviewPreviewImg).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productDetailSF.quickviewUpsell,
        snapshotName: cConf.expected.quickview_product_b_snapshot,
      });
    });

    await test.step(`Select variant và click Add to cart button trên quick view`, async () => {
      await productDetailSF.selectColorSwatches(cConf.black);
      await productDetailSF.quickviewUpsell.getByRole("button", { name: "Add to cart" }).click();
    });

    await test.step("Verify product added to cart successfully", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeHidden();
      await expect(productDetailSF.cartDrawer).toBeVisible();
      await expect(
        productDetailSF.productsCart
          .filter({ hasText: cConf.product_b.name })
          .filter({ hasText: cConf.expected.variant_black }),
      ).toBeVisible();
    });

    await test.step(`- Add product C vào cart  - Mở Cart page`, async () => {
      await productDetailSF.goto(`${cConf.product_c.handle}`);
      await page.waitForResponse(/theme.css/);
      await productDetailSF.productInfo.getByRole("textbox").fill(cConf.custom_option);
      await productDetailSF.productInfo.getByRole("button", { name: "Add to cart" }).click();
      await expect(productDetailSF.cartDrawer).toBeVisible();
      await expect(productDetailSF.productsCart.filter({ hasText: cConf.product_c.name })).toBeVisible();
      await productDetailSF.goto("cart");
      await page.waitForResponse(/cart.json/);
    });

    await test.step(`Click Add more item text link`, async () => {
      await cartSF.addMoreItemsProduct(cConf.product_c.name);
    });

    await test.step("Verify popup quickview display", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeVisible();
      await waitForImageLoaded(page, ".preview-image img");
      await expect(productDetailSF.quickviewPreviewImg).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productDetailSF.quickviewUpsell,
        snapshotName: cConf.expected.quickview_product_c_snapshot,
      });
    });

    await test.step(`Điền custom option cho product và add to cart`, async () => {
      await productDetailSF.customOptionTextarea.getByRole("textbox").fill(cConf.new_custom_option);
      await productDetailSF.quickviewProductInfo.getByRole("button", { name: "Add to cart" }).click();
    });

    await test.step("Verify product added to cart successfully", async () => {
      await expect(productDetailSF.quickviewUpsell).toBeHidden();
      await expect(productDetailSF.cartDrawer).toBeVisible();
      await expect(
        productDetailSF.productsCart
          .filter({ hasText: cConf.product_c.name })
          .filter({ hasText: cConf.expected.new_custom_option }),
      ).toBeVisible();
    });
  });

  test(`@SB_SF_BUSF_QVA_23 Quick view - Check hiển thị bundle trên quick view`, async ({
    page,
    conf,
    cConf,
    authRequest,
  }) => {
    const productDetailSF = new SFProduct(page, conf.suiteConf.domain);
    const isQuickview = true;

    await test.step("Pre-condition: Active test bundles", async () => {
      const listOffers = await app.getListUpsellOffers({ offer_types: "bundle" });
      const testBundle01 = listOffers.find(offer => offer.offer_name === cConf.bundle_01);
      const testBundle02 = listOffers.find(offer => offer.offer_name === cConf.bundle_02);
      if (!testBundle01.activated || !testBundle02.activated) {
        await app.requestOnOffOffer({
          api: authRequest,
          domain: conf.suiteConf.domain,
          offer_ids: [testBundle01.id, testBundle02.id],
          status: true,
        });
        await upsellSF.waitOfferUpdated([testBundle01.id, testBundle02.id]);
        if (process.env.CI_ENV === "dev" || process.env.ENV === "local") {
          await page.waitForTimeout(5000); //Trên dev bị cache lâu ko còn gì để wait
        }
      }
    });

    await test.step(`Ngoài sf, mở product B`, async () => {
      await productDetailSF.goto(`${cConf.product_b.handle}`);
      await page.waitForResponse(/theme.css/);
    });

    await test.step("Verify bundle in product detail", async () => {
      await softExpect(productDetailSF.bundleOffer.filter(cConf.expected.bundle_01_title)).toBeVisible();
    });

    await test.step(`Click vào img của product C ở bundle`, async () => {
      await productDetailSF.clickImgOfProductInBundle(cConf.product_c.name);
    });

    await test.step("Verify bundle 01 in quickview", async () => {
      await softExpect(productDetailSF.quickviewBundles).toHaveCount(1);
      await softExpect(productDetailSF.quickviewBundles.first().locator(productDetailSF.bundleHeading)).toHaveText(
        cConf.expected.bundle_01_title,
      );
    });

    await test.step(`Click mở Quick view từ product A ở bundle trên Quick view hiện tại`, async () => {
      await productDetailSF.clickImgOfProductInBundle(cConf.product_a.name, isQuickview);
    });

    await test.step("Verify quickview show 2 bundles", async () => {
      await softExpect(productDetailSF.quickviewBundles).toHaveCount(2);
      await softExpect(
        productDetailSF.quickviewBundles
          .locator(productDetailSF.bundleHeading)
          .filter({ hasText: cConf.expected.bundle_01_title }),
      ).toBeVisible();
      await softExpect(
        productDetailSF.quickviewBundles
          .locator(productDetailSF.bundleHeading)
          .filter({ hasText: cConf.expected.bundle_02_title }),
      ).toBeVisible();
    });

    await test.step(`Click vào img của product E`, async () => {
      await productDetailSF.clickImgOfProductInBundle(cConf.product_e.name, isQuickview);
    });

    await test.step("Verify show bundle 02 in quickview", async () => {
      await softExpect(productDetailSF.quickviewBundles).toHaveCount(1);
      await softExpect(productDetailSF.quickviewBundles.last().locator(productDetailSF.bundleHeading)).toHaveText(
        cConf.expected.bundle_02_title,
      );
    });
  });
});
