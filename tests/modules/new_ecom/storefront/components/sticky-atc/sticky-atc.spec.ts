import { WebBuilder } from "@pages/dashboard/web_builder";
import { test, expect } from "@fixtures/website_builder";
import { XpathNavigationButtons } from "@constants/web_builder";
import { WebsiteSetting } from "@pages/dashboard/website_setting";
import { verifyRedirectUrl } from "@utils/theme";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SFHome } from "@sf_pages/homepage";
import { FrameLocator } from "@playwright/test";
import { OcgLogger } from "@core/logger";
import { Environment } from "./sticky-atc";
import { StickyAtc } from "@pages/new_ecom/storefront/components/sticky-atc";

const logger = OcgLogger.get();

test.describe("Sticky Add to cart", () => {
  test.slow();
  let suiteConf: Environment, webBuilder: WebBuilder, webSetting: WebsiteSetting;
  let xpathBlock: Blocks;
  let frameLocator: FrameLocator;
  let stickyAtc: StickyAtc;

  const changeSettingVariant = async setting => {
    if (setting?.do_not_select) {
      await webBuilder.selectDropDown("default_variant", "Do not select any variant");
    }
    if (setting?.auto_choose_variant) {
      await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
    }
    await webSetting.switchToggle("hide_has_one", setting?.hide_when_has_one_value);
    await webSetting.switchToggle("only_combination", setting?.show_combination);
  };

  test.beforeEach(async ({ dashboard, conf }) => {
    suiteConf = conf.suiteConf as Environment;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    webSetting = new WebsiteSetting(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;
    stickyAtc = new StickyAtc(dashboard, conf.suiteConf.domain);
    await webBuilder.openWebBuilder({ type: "site", id: suiteConf.theme_id, page: "product" });
  });

  test(`@SB_WEB_BUILDER_ST_ATC_01 Verify hiển thị vị trí sticky add to cart`, async ({
    dashboard,
    context,
    conf,
    cConf,
    pageMobile,
    snapshotFixture,
  }) => {
    test.slow();
    await dashboard.locator(XpathNavigationButtons["website"]).click();
    await webSetting.clickSettingCategory("Product");
    await webSetting.switchToggle("sticky_add_cart_enabled", true);
    //Update lại setting theo config
    await changeSettingVariant(cConf);

    //Ấn save
    await webSetting.clickBtnSave();

    await test.step(` Từ Online store
    -> Customize theme Criadora
    -> Chọn page Product details
    -> Chọn product "iphone 14". Bật setting Enable sticky add to cart
    -> Kiểm tra hiển thị STK ATC trên WB và SF`, async () => {
      for (const st of cConf.expected.step_1) {
        //verify in web builder
        await webSetting.changeProductEntity(st.product_title);
        await frameLocator.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
        await dashboard.locator(XpathNavigationButtons["styling"]).click();
        await dashboard.locator(XpathNavigationButtons["website"]).click();
        await webSetting.clickSettingCategory("Product");
        await expect(frameLocator.locator(stickyAtc.xpathStickyContainer)).toBeVisible();

        //verify in sfn
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });
        await storefront.waitForLoadState("networkidle", { timeout: 15000 });
        await storefront.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
        await expect(storefront.locator(stickyAtc.xpathStickyContainer)).toBeVisible();
        await storefront.waitForSelector(stickyAtc.xpathImgSticky, { state: "visible" });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: stickyAtc.xpathStickyContainer,
          snapshotName: `${process.env.ENV}-${st.snapshot}`,
        });

        await storefront.locator(stickyAtc.xpathBtnAtc2).scrollIntoViewIfNeeded();
        await expect(storefront.locator(stickyAtc.xpathStickyContainer)).toBeHidden();

        await storefront.locator(stickyAtc.xpathFeaturedCollection).scrollIntoViewIfNeeded();
        await expect(storefront.locator(stickyAtc.xpathStickyContainer)).toBeVisible();
        await storefront.close();
      }
    });

    await test.step(`Thực hiện switch thết bị sang mobile`, async () => {
      const productPage = new SFHome(pageMobile, conf.suiteConf.domain);
      for (const st of cConf.expected.step_2) {
        await productPage.gotoProduct(st.product_handle);
        await productPage.genLoc(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
        await expect(productPage.genLoc(stickyAtc.xpathStickyContainer)).toBeVisible();
        await snapshotFixture.verifyWithAutoRetry({
          page: productPage.page,
          selector: stickyAtc.xpathStickyContainer,
          snapshotName: `${process.env.ENV}-${st.snapshot}`,
        });

        await productPage.genLoc(stickyAtc.xpathBtnAtc2).scrollIntoViewIfNeeded();
        await expect(productPage.genLoc(stickyAtc.xpathStickyContainer)).toBeHidden();

        await productPage.genLoc(stickyAtc.xpathFeaturedCollection).scrollIntoViewIfNeeded();
        await expect(productPage.genLoc(stickyAtc.xpathStickyContainer)).toBeVisible();
      }
    });

    await test.step(`Thực hiện view gallery`, async () => {
      for (const st of cConf.expected.step_3) {
        await webSetting.changeProductEntity(st.product_title);
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });
        await storefront.waitForLoadState("networkidle");
        await storefront.waitForSelector(".media_gallery__container");
        await storefront.locator(stickyAtc.xpathMedia).first().click();
        await storefront.waitForSelector(stickyAtc.xpathPreviewMedia);
        await expect(storefront.locator(stickyAtc.xpathPreviewMediaStickyContainer)).toBeVisible();
        await storefront.waitForSelector(stickyAtc.xpathImgSticky, { state: "visible" });
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: stickyAtc.xpathStickyContainer,
          snapshotName: `${process.env.ENV}-${st.snapshot}`,
        });
        storefront.close();
      }
    });
  });

  test(`@SB_WEB_BUILDER_ST_ATC_02 Verify đồng bộ variant trên sticky ATC và block variant picker cùng data source`, async ({
    dashboard,
    cConf,
    context,
    conf,
    pageMobile,
    snapshotFixture,
  }) => {
    await dashboard.locator(XpathNavigationButtons["website"]).click();
    await webSetting.clickSettingCategory("Product");
    await webSetting.switchToggle("sticky_add_cart_enabled", true);

    await test.step(`Điều chỉnh setting variant trong Websetting Product`, async () => {
      for (const st of cConf.step_1) {
        logger.info(`step: ${st}`);
        await webSetting.changeProductEntity(st.product_title);

        //Update lại setting theo config
        await changeSettingVariant(st);

        //Ấn save
        await webSetting.clickBtnSave();

        //Redirect storefront
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });
        const sfUrl = storefront.url();
        const now = Date.now();
        await storefront.goto(`${sfUrl}&date=${now}`);
        await storefront.waitForLoadState("networkidle", { timeout: 15000 });
        await storefront.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
        await storefront.waitForSelector(stickyAtc.xpathStickyContainer);

        //Check default selected
        if (st?.default_selected) {
          let index = 1;
          for (const selected of st.default_selected) {
            if (selected?.value) {
              await expect(storefront.locator(stickyAtc.xpathSelectedOption(index))).toHaveText(selected.value);
            } else if (selected?.placeholder) {
              await expect(storefront.locator(stickyAtc.xpathPlaceholder(index))).toHaveText(selected.placeholder);
            }
            index++;
          }
        }

        if (st?.expected) {
          for (const exp of st.expected) {
            await storefront
              .locator(stickyAtc.xpathSelectVariantInStickyContainer())
              .selectOption({ label: exp.on_click });

            //Check ko có variant
            if (exp?.hidden_variants) {
              for (const variant of exp.hidden_variants) {
                await expect(storefront.locator(webSetting.getXpathVariantItemSelect(variant))).toHaveCount(0);
              }
            }

            //Check có variant
            if (exp?.variants) {
              for (const variant of exp.variants) {
                await expect(storefront.locator(webSetting.getXpathVariantItemSelect(variant))).toHaveCount(1);
              }
            }
          }
        }
        if (st?.expected_active_count) {
          await expect(storefront.locator(`//div[contains(@class,'sticky__product-options')] //select`)).toHaveCount(
            st.expected_active_count,
          );
        }

        await storefront.close();
      }
    });

    await test.step(`Chọn variant trên sticky ATC`, async () => {
      const st = cConf.step_2;
      await webSetting.changeProductEntity(st.product_title);
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();

      //Redirect storefront
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.waitForLoadState("networkidle", { timeout: 15000 });
      await storefront.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefront.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const click of st.sticky_on_clicks) {
        await storefront.locator(stickyAtc.xpathSelectVariantInStickyContainer(index)).selectOption({ label: click });
        index++;
      }

      await snapshotFixture.verify({
        page: storefront,
        selector: stickyAtc.xpathImageSticky,
        snapshotName: "sticky-image.png",
      });
      await storefront.locator(stickyAtc.xpathVariantSelector).scrollIntoViewIfNeeded();
      for (const variant of st.variants) {
        await expect(storefront.locator(webSetting.getXpathVariantItem(variant))).toHaveCount(1);
      }
    });

    await test.step(`Thay đổi variant trên variant picker`, async () => {
      const st = cConf.step_3;
      await webSetting.changeProductEntity(st.product_title);
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();

      //Redirect storefront
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.waitForLoadState("networkidle", { timeout: 15000 });
      for (const click of st.variant_on_clicks) {
        await storefront.locator(webSetting.getXpathVariantItem(click)).click();
      }
      await storefront.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      let index = 1;
      for (const selected of st.default_selected) {
        await expect(storefront.locator(stickyAtc.xpathSelectedOption(index))).toHaveText(selected.value);
        index++;
      }
      await snapshotFixture.verify({
        page: storefront,
        selector: stickyAtc.xpathImageSticky,
        snapshotName: "sticky-image.png",
      });
    });

    await test.step(`Thực hiện switch thết bị sang mobile -> Chọn variant trên sticky ATC`, async () => {
      const st = cConf.step_4;
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();

      const productPage = new SFHome(pageMobile, conf.suiteConf.domain);
      await productPage.gotoProduct(st.product_handle);
      await productPage.genLoc(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await productPage.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const click of st.sticky_on_clicks) {
        await productPage.genLoc(stickyAtc.xpathSelectVariantInStickyContainer(index)).selectOption({ label: click });
        index++;
      }
      await productPage.genLoc(stickyAtc.xpathVariantSelector).scrollIntoViewIfNeeded();
      for (const variant of st.variants) {
        await expect(productPage.genLoc(webSetting.getXpathVariantItem(variant))).toHaveCount(1);
      }
    });

    await test.step(`Thay đổi variant trên variant picker`, async () => {
      const st = cConf.step_5;
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();
      const productPage2 = new SFHome(pageMobile, conf.suiteConf.domain);
      await productPage2.gotoProduct(st.product_handle);
      for (const click of st.variant_on_clicks) {
        await productPage2.genLoc(webSetting.getXpathVariantItem(click)).click();
      }
      await productPage2.genLoc(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      let index = 1;
      for (const selected of st.default_selected) {
        await expect(productPage2.genLoc(stickyAtc.xpathSelectedOption(index))).toHaveText(selected.value);
        index++;
      }
    });

    await test.step(`Chọn variant sold out trên sticky ATC`, async () => {
      const st = cConf.step_6;
      await webSetting.changeProductEntity(st.product_title);
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();

      //Redirect storefront
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.waitForLoadState("networkidle", { timeout: 15000 });
      await storefront.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      let index = 1;
      for (const click of st.sticky_on_clicks) {
        await storefront.locator(stickyAtc.xpathSelectVariantInStickyContainer(index)).selectOption({ label: click });
        index++;
      }
      await expect(storefront.locator(stickyAtc.xpathBtnAtcSticky)).toBeDisabled();
    });
  });

  test(`@SB_WEB_BUILDER_ST_ATC_09 Verify product không có Custom option được add to cart bằng sticky add to cart`, async ({
    dashboard,
    page,
    cConf,
    context,
    conf,
    pageMobile,
    snapshotFixture,
  }) => {
    test.slow();
    await dashboard.locator(XpathNavigationButtons["website"]).click();
    await webSetting.clickSettingCategory("Product");
    await webSetting.switchToggle("sticky_add_cart_enabled", true);

    await test.step(`Click btn ATC trên sticky ATC khi chưa chọn variant`, async () => {
      const st = cConf.step_1;
      await webSetting.changeProductEntity(st.product_title);
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();

      //Redirect storefront
      const storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefront.waitForSelector(stickyAtc.xpathStickyContainer);
      await storefront.waitForSelector(stickyAtc.xpathImgSticky, { state: "visible" });
      await storefront.locator(stickyAtc.xpathBtnAtcSticky).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: stickyAtc.xpathStickyContainer,
        snapshotName: `${process.env.ENV}-${st.snapshot}`,
      });
      await storefront.close();
    });

    await test.step(`Chọn đủ variant trên Sticky ATC -> click btn ATC trên sticky`, async () => {
      const st = cConf.step_2;
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();

      const storefrontPage = new SFHome(page, conf.suiteConf.domain);
      await storefrontPage.gotoProduct(st.product_handle);
      await storefrontPage.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontPage.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const click of st.sticky_on_clicks) {
        await storefrontPage.page
          .locator(stickyAtc.xpathSelectVariantInStickyContainer(index))
          .selectOption({ label: click });
        index++;
      }
      await storefrontPage.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await expect(storefrontPage.page.locator(stickyAtc.xpathCartDrawer)).toBeVisible();
      await storefrontPage.page.close();
    });

    await test.step(`Thực hiện switch thết bị sang mobile -> Click btn ATC trên sticky ATC khi chưa chọn variant`, async () => {
      const st = cConf.step_3;
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();

      const storefrontMobile = new SFHome(pageMobile, conf.suiteConf.domain);
      await storefrontMobile.gotoProduct(st.product_handle);
      await storefrontMobile.genLoc(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontMobile.page.waitForSelector(stickyAtc.xpathStickyContainer);

      await storefrontMobile.page.locator(stickyAtc.xpathBtnAtcSticky).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontMobile.page,
        selector: stickyAtc.xpathStickyContainer,
        snapshotName: `${process.env.ENV}-${st.snapshot}`,
      });
    });

    await test.step(`Chọn đủ variant trên Sticky ATC -> click btn ATC trên sticky`, async () => {
      const st = cConf.step_2;
      await changeSettingVariant(st);
      await webSetting.clickBtnSave();

      const storefrontMobile = new SFHome(pageMobile, conf.suiteConf.domain);
      await storefrontMobile.gotoProduct(st.product_handle);
      await storefrontMobile.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontMobile.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const click of st.sticky_on_clicks) {
        await storefrontMobile.page
          .locator(stickyAtc.xpathSelectVariantInStickyContainer(index))
          .selectOption({ label: click });
        index++;
      }
      await storefrontMobile.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await expect(storefrontMobile.page.locator(stickyAtc.xpathCartDrawer)).toBeVisible();
      await storefrontMobile.page.close();
    });
  });

  test(`@SB_WEB_BUILDER_ST_ATC_10 Verify product có Custom option required được add to cart bằng sticky add to cart`, async ({
    page,
    pageMobile,
    conf,
    cConf,
    snapshotFixture,
  }) => {
    test.slow();
    const storefrontPage = new SFHome(page, conf.suiteConf.domain);
    const storefrontMobile = new SFHome(pageMobile, conf.suiteConf.domain);
    const productA = cConf.product_a;
    const productB = cConf.product_b;
    const productC = cConf.product_c;

    await test.step(`Đi đến SF của product A, Click btn CUSTOMIZE PRODUCT trên sticky ATC`, async () => {
      await storefrontPage.gotoProduct(productA.product_handle);
      await storefrontPage.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontPage.page.waitForSelector(stickyAtc.xpathStickyContainer);
      await storefrontPage.page.locator(stickyAtc.xpathBtnCustomize).click();
      await expect.soft(storefrontPage.page.locator(stickyAtc.xpathVariantSelector)).toBeInViewport({ ratio: 1 });
    });

    await test.step(`Điền đẩy đủ các fields CO`, async () => {
      // upload file
      await storefrontPage.page.setInputFiles(`${stickyAtc.xpathVariantBlock}//input[@type='file']`, productA.img);
      await storefrontPage.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontPage.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const selected of productA.default_selected) {
        await expect(storefrontPage.page.locator(stickyAtc.xpathPlaceholder(index))).toHaveText(selected.placeholder);
        index++;
      }
    });

    await test.step(`Click btn ATC trên sticky ATC khi chưa chọn variant`, async () => {
      await storefrontPage.page.waitForSelector(stickyAtc.xpathImgSticky, { state: "visible" });
      await storefrontPage.page.locator(stickyAtc.xpathBtnAtcSticky).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontPage.page,
        selector: stickyAtc.xpathStickyContainer,
        snapshotName: `${process.env.ENV}-${productA.snapshot}`,
      });
    });

    await test.step(`Chọn variant trong sticky add to cart -> Click btn ATC trên sticky`, async () => {
      let index = 1;
      for (const click of productA.sticky_on_clicks) {
        await storefrontPage.page
          .locator(stickyAtc.xpathSelectVariantInStickyContainer(index))
          .selectOption({ label: click });
        index++;
      }
      await storefrontPage.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await expect(storefrontPage.page.locator(stickyAtc.xpathCartDrawer)).toBeVisible();
    });

    await test.step(`Đi đến SF của product B, không điền text và không chọn variant trên sticky ATC, click btn ATC`, async () => {
      await storefrontPage.gotoProduct(productB.product_handle);
      await storefrontPage.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontPage.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const selected of productB.default_selected) {
        await expect(storefrontPage.page.locator(stickyAtc.xpathPlaceholder(index))).toHaveText(selected.placeholder);
        index++;
      }
      await storefrontPage.page.waitForSelector(stickyAtc.xpathImgSticky, { state: "visible" });
      await storefrontPage.page.locator(stickyAtc.xpathBtnAtcSticky).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontPage.page,
        selector: stickyAtc.xpathStickyContainer,
        snapshotName: `${process.env.ENV}-${productB.snapshot}`,
      });
    });

    await test.step(`Nhập đầy đủ text và chọn variant, Click btn ATC trên sticky`, async () => {
      await storefrontPage.page.locator(stickyAtc.xpathInputCustomOption).fill(productB.co_example);
      let index = 1;
      for (const click of productB.sticky_on_clicks) {
        await storefrontPage.page
          .locator(stickyAtc.xpathSelectVariantInStickyContainer(index))
          .selectOption({ label: click });
        index++;
      }
      await storefrontPage.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await expect(storefrontPage.page.locator(stickyAtc.xpathCartDrawer)).toBeVisible();
    });

    await test.step(`Đi đến SF của product C, không điền text và không chọn variant trên sticky ATC, click btn ATC`, async () => {
      await storefrontPage.gotoProduct(productC.product_handle);
      await storefrontPage.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontPage.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const selected of productC.default_selected) {
        await expect(storefrontPage.page.locator(stickyAtc.xpathPlaceholder(index))).toHaveText(selected.placeholder);
        index++;
      }
      await storefrontPage.page.waitForSelector(stickyAtc.xpathImgSticky, { state: "visible" });
      await storefrontPage.page.locator(stickyAtc.xpathBtnAtcSticky).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontPage.page,
        selector: stickyAtc.xpathStickyContainer,
        snapshotName: `${process.env.ENV}-${productC.snapshot}`,
      });
    });

    await test.step(`Chọn đủ variant, Click btn ATC trên sticky`, async () => {
      let index = 1;
      for (const click of productC.sticky_on_clicks) {
        await storefrontPage.page
          .locator(stickyAtc.xpathSelectVariantInStickyContainer(index))
          .selectOption({ label: click });
        index++;
      }
      await storefrontPage.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await expect(storefrontPage.page.locator(stickyAtc.xpathCartDrawer)).toBeVisible();
    });

    await test.step(`Thực hiện switch thết bị sang mobile -> Đi đến SF của product A, Click btn CUSTOMIZE PRODUCT`, async () => {
      await storefrontMobile.gotoProduct(productA.product_handle);
      await storefrontMobile.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontMobile.page.waitForSelector(stickyAtc.xpathStickyContainer);
      await storefrontMobile.page.locator(stickyAtc.xpathBtnCustomize).click();
      await expect.soft(storefrontMobile.page.locator(stickyAtc.xpathVariantSelector)).toBeInViewport({ ratio: 1 });
    });

    await test.step(`Điền đẩy đủ các fields CO`, async () => {
      // upload file
      await storefrontMobile.page.setInputFiles(`${stickyAtc.xpathVariantBlock}//input[@type='file']`, productA.img);
      await storefrontMobile.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontMobile.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const selected of productA.default_selected) {
        await expect(storefrontMobile.page.locator(stickyAtc.xpathPlaceholder(index))).toHaveText(selected.placeholder);
        index++;
      }
    });

    await test.step(`Click btn ATC trên sticky ATC khi chưa chọn variant`, async () => {
      await storefrontMobile.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontMobile.page,
        selector: stickyAtc.xpathStickyContainer,
        snapshotName: `${process.env.ENV}-mobile-${productA.snapshot}`,
      });
    });

    await test.step(`Chọn variant trong sticky add to cart -> Click btn ATC trên sticky`, async () => {
      let index = 1;
      for (const click of productA.sticky_on_clicks) {
        await storefrontMobile.page.locator(stickyAtc.xpathSelectVariantInStickyContainer(index)).selectOption({
          label: click,
        });
        index++;
      }
      await storefrontMobile.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await expect(storefrontMobile.page.locator(stickyAtc.xpathCartDrawer)).toBeVisible();
    });

    await test.step(`Đi đến SF của product B, không điền text và không chọn variant trên sticky ATC, click btn ATC`, async () => {
      await storefrontMobile.gotoProduct(productB.product_handle);
      await storefrontMobile.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontMobile.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const selected of productB.default_selected) {
        await expect(storefrontMobile.page.locator(stickyAtc.xpathPlaceholder(index))).toHaveText(selected.placeholder);
        index++;
      }
      await storefrontMobile.page.locator(stickyAtc.xpathBtnAtcSticky).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontMobile.page,
        selector: stickyAtc.xpathStickyContainer,
        snapshotName: `${process.env.ENV}-mobile-${productB.snapshot}`,
      });
    });

    await test.step(`Nhập đầy đủ text và chọn variant, Click btn ATC trên sticky`, async () => {
      await storefrontMobile.page.locator(stickyAtc.xpathInputCustomOption).fill(productB.co_example);
      let index = 1;
      for (const click of productB.sticky_on_clicks) {
        await storefrontMobile.page
          .locator(stickyAtc.xpathSelectVariantInStickyContainer(index))
          .selectOption({ label: click });
        index++;
      }
      await storefrontMobile.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await expect(storefrontMobile.page.locator(stickyAtc.xpathCartDrawer)).toBeVisible();
    });

    await test.step(`Đi đến SF của product C, không điền text và không chọn variant trên sticky ATC, click btn ATC`, async () => {
      await storefrontMobile.gotoProduct(productC.product_handle);
      await storefrontMobile.page.locator(stickyAtc.xpathOutViewportAtc).scrollIntoViewIfNeeded();
      await storefrontMobile.page.waitForSelector(stickyAtc.xpathStickyContainer);
      let index = 1;
      for (const selected of productC.default_selected) {
        await expect(storefrontMobile.page.locator(stickyAtc.xpathPlaceholder(index))).toHaveText(selected.placeholder);
        index++;
      }
      await storefrontMobile.page.locator(stickyAtc.xpathBtnAtcSticky).click();

      await snapshotFixture.verifyWithAutoRetry({
        page: storefrontMobile.page,
        selector: stickyAtc.xpathStickyContainer,
        snapshotName: `${process.env.ENV}-mobile-${productC.snapshot}`,
      });
    });

    await test.step(`Chọn đủ variant, Click btn ATC trên sticky`, async () => {
      let index = 1;
      for (const click of productC.sticky_on_clicks) {
        await storefrontMobile.page
          .locator(stickyAtc.xpathSelectVariantInStickyContainer(index))
          .selectOption({ label: click });
        index++;
      }
      await storefrontMobile.page.locator(stickyAtc.xpathBtnAtcSticky).click();
      await expect(storefrontMobile.page.locator(stickyAtc.xpathCartDrawer)).toBeVisible();
    });
  });
});
