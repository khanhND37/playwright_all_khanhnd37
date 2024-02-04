import { test, expect } from "@fixtures/theme";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { UpSell } from "@pages/new_ecom/storefront/upsell";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { SFUpSellAPI } from "@pages/new_ecom/storefront/apps/upsell/cross-sell";
import { CrossSellAPI } from "@pages/api/apps/upsell/cross-sell";
import { HttpMethods } from "@core/services";

test.describe("Quickview @TS_SB_SF_QVA", () => {
  let upsell: UpSell;
  let upsellSF: SFUpSellAPI;
  let apps: CrossSellAPI;

  test.beforeEach(async ({ page, authRequest, api, conf, cConf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    upsell = new UpSell(page, conf.suiteConf.domain);
    upsellSF = new SFUpSellAPI(conf.suiteConf.domain, api);
    apps = new CrossSellAPI(conf.suiteConf.domain);

    if (cConf.offer_ids) {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        offer_ids: cConf.offer_ids,
        status: true,
      });
      await upsellSF.waitOfferUpdated(cConf.offer_ids);
    }

    await upsell.goto(`/products/${conf.suiteConf.product_handle}`);
    await upsell.waitResponseWithUrl("/apps/assets/locales/en.json");
  });
  test.afterEach(async ({ authRequest, theme, conf, cConf }) => {
    await test.step("After condition", async () => {
      if (cConf.offer_ids) {
        await apps.requestOnOffOffer({
          api: authRequest,
          domain: conf.suiteConf.domain,
          shop_id: conf.suiteConf.shop_id,
          offer_ids: cConf.offer_ids,
          status: false,
        });
      }

      if (cConf.is_customize_theme) {
        await theme.publish(conf.suiteConf.theme_id);
      }
    });
  });

  test(`@SB_SF_QVA_6 Quick view - Check add product không có custom option vào cart với product widget`, async ({
    cConf,
  }) => {
    let productTitle = "";
    await test.step(`Add to cart product A từ product widget`, async () => {
      await upsell.onClickAddCartFromWidget(1);
      await upsell.waitResponseShowQuickview();
      await expect(upsell.getXpathHeadingWidget(cConf.expected.heading)).toBeVisible();
      await expect(upsell.genLoc(`${upsell.quickViewDialog} ${upsell.widgetBlock} .VueCarousel-slide`)).toHaveCount(
        cConf.expected.total_recommend,
      );
    });
    await test.step(`Add to cart 1 product ở phần Recommendation for you`, async () => {
      productTitle = await upsell.getXpathProductTitleWidget(1, upsell.quickViewDialog).textContent();
      await upsell.onClickAddCartFromWidget(1, upsell.quickViewDialog);
      await upsell.waitResponseShowQuickview();
      await expect(upsell.genLoc(upsell.quickViewTitle)).toHaveText(productTitle);
    });
    await test.step(`Click ảnh thumdnail trên quickview`, async () => {
      await waitForImageLoaded(upsell.page, upsell.quickViewThumbnails);
      const productImageUrl = await upsell.getNameImageFromUrl(
        `${upsell.quickViewThumbnailActive} + .qv-product__slide-image img`,
      );
      await upsell.onClickThumnailQuickview();
      await upsell.genLoc(`${upsell.quickViewImagePrimary}[data-loaded='true']`).waitFor({ state: "visible" });
      expect(await upsell.getNameImageFromUrl(upsell.quickViewImagePrimary)).toEqual(productImageUrl);
    });
    await test.step(`Click add to cart button`, async () => {
      const request = upsell.page.waitForRequest(
        request => request.url().includes("/api/checkout/next/cart.json") && request.method() === HttpMethods.Put,
      );
      await upsell.onClickAddCartQuickview();
      const requestAPI = await request;
      const responseAPI = await (await requestAPI.response()).json();
      expect(responseAPI.result.product_title).toEqual(productTitle);
    });
  });

  test(`@SB_SF_QVA_7 Quick view - Check add product không có custom option vào cart khi mở quick view từ bundle`, async ({
    cConf,
  }) => {
    await test.step(`Open product A`, async () => {
      await expect(upsell.genLoc(upsell.bundleHeading)).toHaveText(cConf.expected.heading);
    });
    await test.step(`Click ảnh product B trên Bundle`, async () => {
      await upsell
        .genLoc(`${upsell.getSelectorImageBundle(1, 2)} img[data-loaded='true']`)
        .waitFor({ state: "visible" });
      await upsell.onClickImageBundle(1, 2);
      await upsell.waitResponseShowQuickview(true);
    });
    await test.step(`Select variant và click add to cart button`, async () => {
      for (let i = 0; i < cConf.select_variants.length; i++) {
        const variant = cConf.select_variants[i];
        await upsell.onSelectVariantBundle(1, i + 1, variant, upsell.quickViewDialog);
      }
      await upsell.onClickAddCartBundle(1, upsell.quickViewDialog);
      const response = await upsell.waitResponseWithUrl("/api/checkout/next/cart/adds.json");
      const json = await response.json();
      const expected = json.result.every(r => cConf.select_variants.includes(r.variant_title));
      expect(expected).toBeTruthy();
    });
  });

  test(`@SB_SF_QVA_8 Quick view - Check hiển thị bundle trên quick view`, async ({ cConf }) => {
    await test.step(`Ngoài sf, mở product A`, async () => {
      await expect(upsell.genLoc(upsell.bundleHeading)).toHaveText(cConf.expected.heading_1);
      await expect(upsell.genLoc(upsell.bundleNavigation)).toHaveCount(2);
    });
    await test.step(`Click mở Quick view từ product B`, async () => {
      await upsell
        .genLoc(`${upsell.getSelectorImageBundle(1, 2)} img[data-loaded='true']`)
        .waitFor({ state: "visible" });
      await upsell.onClickImageBundle(1, 2);
      await upsell.waitResponseShowQuickview(true);
    });
    await test.step(`Click mở Quick view từ product A ở bundle trên Quick view hiện tại`, async () => {
      await upsell
        .genLoc(`${upsell.getSelectorImageBundle(1, 2, upsell.quickViewDialog)} img[data-loaded='true']`)
        .waitFor({ state: "visible" });
      const productTitle = await upsell
        .genLoc(upsell.getSelectorProductTitleBundle(1, 2, upsell.quickViewDialog))
        .textContent();
      await upsell.onClickImageBundle(1, 2, upsell.quickViewDialog);
      await upsell.waitResponseShowQuickview(true);
      await expect(upsell.genLoc(upsell.quickViewTitle)).toHaveText(productTitle);
      for (let i = 0; i < 2; i++) {
        await expect(upsell.genLoc(`${upsell.quickViewDialog} ${upsell.bundleHeading}`)).toHaveText(
          cConf.expected[`heading_${i + 1}`],
        );
        for (let j = 0; j < cConf[`select_variants_${i + 1}`].length; j++) {
          const variant = cConf[`select_variants_${i + 1}`][j];
          await upsell.onSelectVariantBundle(i + 1, j + 1, variant, upsell.quickViewDialog);
        }
        if (i === 0) {
          await upsell.genLoc(`${upsell.quickViewDialog} ${upsell.bundleNavigation}:not(.is-disabled)`).click();
          // Wait for transition carousel done
          await upsell.waitAbit(500);
        }
      }
    });
    await test.step(`Add bundle to cart`, async () => {
      await upsell.onClickAddCartBundle(2, upsell.quickViewDialog);
      const response = await upsell.waitResponseWithUrl("/api/checkout/next/cart/adds.json");
      const json = await response.json();
      const expected = json.result.every(r => cConf.select_variants_2.includes(r.variant_title));
      expect(expected).toBeTruthy();
    });
  });

  test(`@SB_SF_BUSF_QVA_1 Check add product có custom option vào cart khi mở quick view từ bundle`, async ({
    cConf,
  }) => {
    await test.step(`Click ảnh  của product A trên bundle`, async () => {
      await expect(upsell.genLoc(upsell.bundleHeading)).toHaveText(cConf.expected.heading);
      await upsell
        .genLoc(`${upsell.getSelectorImageBundle(1, 2)} img[data-loaded='true']`)
        .waitFor({ state: "visible" });
      await upsell.onClickImageBundle(1, 2);
      await upsell.waitResponseShowQuickview(true);
      await expect(upsell.genLoc(upsell.quickViewTextField)).toBeVisible();
      await expect(upsell.genLoc(upsell.quickViewTextarea)).toBeVisible();
    });
    await test.step(`Không nhập custom option  và click Add to cart`, async () => {
      await upsell.onClickAddCartQuickview();
      await expect(upsell.genLoc(upsell.quickViewTextarea)).toHaveClass(/input-error/);
      await expect(upsell.genLoc(upsell.quickViewMsgCustomOption)).toHaveText(cConf.expected.msg_invalid);
    });
    await test.step(`Nhập custom option của Name và Textarea sau đó add to cart`, async () => {
      await upsell.genLoc(upsell.quickViewTextField).fill(cConf.custom_options[0]);
      await upsell.genLoc(upsell.quickViewTextarea).fill(cConf.custom_options[1]);
      const request = upsell.page.waitForRequest(
        request => request.url().includes("/api/checkout/next/cart.json") && request.method() === HttpMethods.Put,
      );

      await upsell.onClickAddCartQuickview();
      const requestAPI = await request;
      const responseAPI = await (await requestAPI.response()).json();
      for (let i = 0; i < responseAPI.result.properties.length; i++) {
        expect(responseAPI.result.properties[i].value).toEqual(cConf.custom_options[i]);
      }
    });
  });

  test(`@SB_SF_BUSF_QVA_7 Quickview_Check hiển thị CTA button khi product có variant sold out`, async ({ cConf }) => {
    await test.step(`Ngoài SF, truy cập product C`, async () => {
      // Hanlde in beforeEach
    });
    await test.step(`Click vào button add product D`, async () => {
      await upsell.genLoc(upsell.accessoryFirstItemAddCart).click();
    });
    await test.step(`Chọn variant size M, color Red`, async () => {
      await upsell.onClickVariantQuickview(2, 4);
      await expect(upsell.genLoc(`${upsell.quickViewDialog} ${upsell.quickViewAddCartBtn} button`)).toHaveClass(
        new RegExp(cConf.expected.class),
      );
      await expect(upsell.genLoc(`${upsell.quickViewDialog} ${upsell.quickViewAddCartBtn} button`)).toHaveText(
        cConf.expected.text,
      );
    });
  });

  test(`@SB_SF_BUSF_QVA_15 Quickview_Check hiển thị  image của quickview`, async ({ cConf, snapshotFixture }) => {
    await test.step(`Add to cart Product A trên widget best seller`, async () => {
      await upsell.onClickAddCartFromWidget(1);
      await upsell.waitResponseShowQuickview();
      await waitForImageLoaded(upsell.page, upsell.quickViewThumbnails);
      await snapshotFixture.verifyWithAutoRetry({
        page: upsell.page,
        selector: `${upsell.quickViewDialog} .qv-product`,
        snapshotName: cConf.expected.snapshot_a,
      });
      await expect(upsell.getXpathHeadingWidget(cConf.expected.heading)).toBeVisible();
      await expect(upsell.genLoc(`${upsell.quickViewDialog} ${upsell.widgetBlock} .VueCarousel-slide`)).toHaveCount(
        cConf.expected.total_recommend,
      );
    });
    await test.step(`Click variant 2`, async () => {
      const productImage = await upsell.getNameImageFromUrl(upsell.quickViewImagePrimary);
      await upsell.onClickVariantQuickview(2, 2);
      await expect(upsell.genLoc(upsell.quickViewImagePrimary)).toHaveAttribute("src", new RegExp(productImage));
    });
    await test.step(`Click next trái ở thumnail`, async () => {
      const productImage = await upsell.getNameImageFromUrl(upsell.quickViewImagePrimary);
      await upsell.genLoc(upsell.quickViewThumbnailCarousel).hover();
      await upsell.genLoc(upsell.quickViewThumbnailCarouselNext).click();
      await expect(upsell.genLoc(upsell.quickViewImagePrimary)).toHaveAttribute("src", new RegExp(productImage));
    });
    await test.step(`Click chọn ảnh  của varaint 4`, async () => {
      const productImage = await upsell.getNameImageFromUrl(upsell.quickViewImagePrimary);
      await upsell.onClickVariantQuickview(1, 2);
      await upsell.genLoc(`${upsell.quickViewImagePrimary}[data-loaded='true']`).waitFor({ state: "visible" });
      await waitForImageLoaded(upsell.page, upsell.quickViewImagePrimary);
      const newProductImage = await upsell.getNameImageFromUrl(upsell.quickViewImagePrimary);
      expect(productImage).not.toEqual(newProductImage);
      await expect(upsell.genLoc(`${upsell.quickViewThumbnailActive} img`)).toHaveAttribute(
        "src",
        new RegExp(newProductImage),
      );
    });
    await test.step(`Select lần lượt các image ở thumnail `, async () => {
      await upsell.onClickThumnailQuickview();
      await upsell.genLoc(`${upsell.quickViewImagePrimary}[data-loaded='true']`).waitFor({ state: "visible" });
      await waitForImageLoaded(upsell.page, upsell.quickViewImagePrimary);
      const productImage = await upsell.getNameImageFromUrl(`${upsell.quickViewThumbnailActive} img`);
      await expect(upsell.genLoc(upsell.quickViewImagePrimary)).toHaveAttribute("src", new RegExp(productImage));
    });
    await test.step(`Tắt popup quickview A, click Add to cart product B ở widget`, async () => {
      await upsell.genLoc(upsell.upsellBtnClose).click();
      await upsell.genLoc(upsell.quickViewDialog).waitFor({ state: "detached" });
      await upsell.onClickAddCartFromWidget(2);
      await upsell.waitResponseShowQuickview();
      await waitForImageLoaded(upsell.page, upsell.quickViewThumbnails);
      await snapshotFixture.verifyWithAutoRetry({
        page: upsell.page,
        selector: `${upsell.quickViewDialog} .qv-product`,
        snapshotName: cConf.expected.snapshot_b,
      });
      await expect(upsell.getXpathHeadingWidget(cConf.expected.heading)).toBeVisible();
      await expect(upsell.genLoc(`${upsell.quickViewDialog} ${upsell.widgetBlock} .VueCarousel-slide`)).toHaveCount(
        cConf.expected.total_recommend,
      );
    });
  });

  test(`@SB_SF_BUSF_QVA_16 Quickview_Check hiển thị size chart trên Quickview`, async ({ cConf }) => {
    await test.step(`Open home page của shop 1 có widget product chứa A`, async () => {
      await expect(upsell.genLoc(upsell.widgetBlock)).toBeVisible();
    });
    for (let i = 0; i < cConf.products.length; i++) {
      const product = cConf.products[i];
      await test.step(`Add to cart ${product.title} trên widget`, async () => {
        await upsell.onClickAddCartFromWidget(product.index);
        await upsell.waitResponseShowQuickview();
        await expect(upsell.genLoc(upsell.quickViewSizeGuide)).toBeVisible();
      });
      await test.step(`Click Size Guide`, async () => {
        await upsell.genLoc(upsell.quickViewSizeGuide).click();
        await waitForImageLoaded(upsell.page, `${upsell.quickViewSizeChartDesktop} img`);
        await expect(upsell.genLoc(upsell.quickViewSizeGuide)).toHaveText(product.text_hide_size_chart);
        await expect(upsell.genLoc(upsell.imgSizeChart)).toBeVisible();
        if (product.title === "A") {
          await upsell.genLoc(upsell.upsellBtnClose).click();
          await upsell.genLoc(upsell.quickViewDialog).waitFor({ state: "detached" });
        }
      });
      if (product.title === "B") {
        await test.step(`Chọn base 2`, async () => {
          await upsell.genLoc(`${upsell.quickViewSizeChartDesktop} select`).selectOption("Unisex T-shirt");
          await waitForImageLoaded(upsell.page, upsell.imgSizeChart);
          await expect(upsell.genLoc(upsell.imgSizeChart)).toBeVisible();
        });
      }
    }
  });

  test(`@SB_SF_BUSF_QVA_17 Quickview_Check hiển thị Quickview khi thay đổi style của website style`, async ({
    context,
    dashboard,
    theme,
    snapshotFixture,
    conf,
  }) => {
    let themeCloneId: number;

    await test.step(`Vào admin, customize website style theme Criadora`, async () => {
      const themeList = await theme.list();
      for (let i = 0; i < themeList.length; i++) {
        if (!themeList[i].active && themeList[i].id !== conf.suiteConf.theme_id) {
          await theme.delete(themeList[i].id);
        }
      }
      const response = await theme.duplicate(conf.suiteConf.theme_id);
      themeCloneId = response.id;
      await theme.publish(themeCloneId);

      const blocks = new Blocks(dashboard, conf.suiteConf.domain);
      const webPageStyle = new WebPageStyle(dashboard, conf.suiteConf.domain);
      await blocks.openWebBuilder({
        type: "site",
        id: themeCloneId,
      });
      blocks.page.locator(blocks.xpathPreviewLoadingScreen).waitFor({ state: "detached" });
      await blocks.switchTabWebPageStyle("Web");
      await webPageStyle.clickStylingType("Colors");
      await blocks.genLoc(await webPageStyle.getXpathColorLibraryByTitle("A Fresh Platter")).click();
      await blocks.page.waitForSelector(webPageStyle.colorToast, { state: "detached" });
      await blocks.clickBackLayer();
      await webPageStyle.clickStylingType("Fonts");
      await blocks.genLoc(webPageStyle.getXpathFontLibraryByIndex(7)).click();
      await blocks.page.waitForSelector(webPageStyle.fontToast, { state: "detached" });
      await blocks.clickBackLayer();
      await webPageStyle.clickStylingType("Buttons");
      await blocks.genLoc(webPageStyle.buttonTextColor).click();
      await blocks.genLoc(blocks.getXpathPresetColor(4)).click();
      await blocks.clickCategorySetting("Buttons");
      await blocks.genLoc(`${blocks.thumnailImageVideo}/span`).click();
      await blocks.genLoc(blocks.getXpathPresetBgColor(3)).click();
      await blocks.clickCategorySetting("Buttons");
      await blocks.genLoc(webPageStyle.buttonShape).click();
      await blocks.genLoc(blocks.popOverXPath).locator("span[class*=select__item]").nth(1).click();
      // Web builder debounce action change settings so need to wait
      await blocks.waitAbit(200);
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          onlyClickSave: true,
        },
        snapshotFixture,
      );
      // close tab web builder
      await dashboard.close();
    });
    await test.step(`Go to prduct B`, async () => {
      await upsell.page.reload();
      await upsell.waitResponseWithUrl("/apps/assets/locales/en.json");
      await upsell
        .genLoc(`${upsell.getSelectorImageBundle(1, 2)} img[data-loaded='true']`)
        .waitFor({ state: "visible" });
    });
    await test.step(`Click quickview A`, async () => {
      await upsell.onClickImageBundle(1, 2);
      await upsell.waitResponseShowQuickview(true);
      await waitForImageLoaded(upsell.page, upsell.quickViewThumbnails);
      await waitForImageLoaded(
        upsell.page,
        `${upsell.quickViewDialog} ${upsell.bundleBlock} ${upsell.bundleImages} ${upsell.bundleImage}`,
      );
      await upsell.genLoc(`${upsell.quickViewDialog} ${upsell.widgetBlock}`).evaluate(el => {
        el.style.display = "none";
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: upsell.page,
        selector: "",
        snapshotName: conf.caseConf.expected.screenshot,
      });
    });
  });

  test(`@SB_SF_QVA_4 Add more item - Check add product ở Add more item`, async ({ api, cConf, conf }) => {
    for (let i = 0; i < cConf.steps.length; i++) {
      const step = cConf.steps[i];
      const firstStep = step.title === "A";
      await test.step(`- Add product ${step.title} vào cart- Mở Cart page`, async () => {
        if (firstStep) {
          await upsell.genLoc(upsell.widgetBlock).waitFor({ state: "visible" });
        }

        const cartToken = await upsell.page.evaluate(() => window.localStorage.getItem("cartToken"));
        await api.request({
          url: `https://${conf.suiteConf.domain}/api/checkout/next/cart.json?cart_token=${cartToken}`,
          method: "PUT",
          request: {
            data: {
              cartItem: {
                variant_id: cConf[`variant_${step.cart_data.variant}`],
                qty: 1,
                properties: cConf[step.cart_data.properties] || [],
              },
              from: "add-to-cart",
            },
          },
        });
        if (step.is_reload) {
          await upsell.page.reload();
        } else {
          await upsell.goto(`/cart`);
        }

        await upsell.waitCartItemVisible();
      });

      await test.step(`Click Add more item`, async () => {
        await upsell.genLoc(upsell.getSelectorAddMoreItem(step.cart_item_index)).click();
        await expect(upsell.genLoc(upsell.quickViewDialog)).toBeVisible();
        if (step.is_verify_hide_option) {
          await expect(upsell.genLoc(upsell.quickViewVariants)).toBeHidden();
        } else {
          await expect(upsell.genLoc(upsell.getSelectorVariantQuickview(1, 1))).toHaveClass(/is-active/);
          await expect(upsell.genLoc(upsell.getSelectorVariantQuickview(2, 1))).toHaveClass(/is-active/);
        }

        if (step.is_verify_custom_option) {
          await expect(upsell.genLoc(upsell.quickViewTextField)).toHaveValue("text");
          await expect(upsell.genLoc(upsell.quickViewTextarea)).toHaveValue("textarea");
        }
      });

      await test.step(`${firstStep ? "" : "Select variant và "}click Add to cart button trên quick view`, async () => {
        if (!firstStep) {
          await upsell.onClickVariantQuickview(2, 2);
        }

        const request = upsell.page.waitForRequest(
          request => request.url().includes("/api/checkout/next/cart.json") && request.method() === HttpMethods.Put,
        );
        await upsell.onClickAddCartQuickview();
        const requestAPI = await request;
        const responseAPI = await (await requestAPI.response()).json();
        expect(responseAPI.result.variant_title).toEqual(step.expected);
      });
    }
  });
});
