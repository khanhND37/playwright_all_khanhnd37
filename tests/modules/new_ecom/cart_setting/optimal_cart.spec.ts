import { test } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import { expect } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
test.describe("Tối ưu diện tích hiển thị main content trong cart drawer trên mobile", async () => {
  let themeSetting: number;
  let webBuilder: WebBuilder;
  let productATC, expectSnapshot;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    themeSetting = conf.suiteConf.themes_setting;
    productATC = conf.caseConf.product_atc;
    expectSnapshot = conf.caseConf.expect_snapshot;

    await test.step("Open web builder to settup action and setting when buyer click add to cart ", async () => {
      await webBuilder.openWebBuilder({
        type: "site",
        id: themeSetting,
        page: "home",
      });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step("settup action cart ", async () => {
      await webBuilder.expandCollapseLayer(conf.suiteConf.collapse_layer);
      await webBuilder.openLayerSettings(conf.suiteConf.open_layer);
      await webBuilder.switchToTab("Content");
      await webBuilder.settingDesignAndContentWithSDK({
        action: conf.caseConf.action,
      });
    });

    await test.step("setting when buyer click add to cart ", async () => {
      await webBuilder.clickIconWebsiteSetting();
      await webBuilder.clickCategorySetting("Product");
      await webBuilder.selectOptionWhenBuyerClickBtnATC("Show notification");
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });
  });

  test(`@SB_SF_CART_07 [Mini Cart] verify hiển thị message khi setting when buyer click= show notification`, async ({
    page,
    pageMobile,
    conf,
  }) => {
    const sfHome = new SFHome(page, conf.suiteConf.domain);
    const homePageMobile = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step("Desktop: 1. Go to sf product detail ", async () => {
      await sfHome.gotoProductDetail(conf.caseConf.handle);
    });

    await test.step("2. scroll qua button add to cart để hiển thị sticky atc > click vào button atc ở sticky atc  ", async () => {
      await scrollUntilElementIsVisible({
        page: sfHome.page,
        scrollEle: sfHome.page.locator(sfHome.imgCountryOfGlobalSwitcher),
        viewEle: sfHome.page.locator(sfHome.imgCountryOfGlobalSwitcher),
      });
      await expect(sfHome.genLoc(sfHome.xpathStickyBtnCart)).toBeVisible();
      await sfHome.genLoc(sfHome.xpathStickyBtnCart).click();
      const mess = await sfHome.genLoc(sfHome.notiMessATCSucces).textContent();
      expect(mess).toEqual(conf.caseConf.expect_mess);
    });

    await test.step("3. Scroll lên để hủy trạng thái sticky button ADD TO CART > Click button ADD TO CART ", async () => {
      // Scroll lên đến vị trí của sản phẩm cuối cùng trong giỏ hàng
      await scrollUntilElementIsVisible({
        page: page,
        scrollEle: sfHome.page.locator(sfHome.xpathCartIcon),
        viewEle: sfHome.page.locator(sfHome.xpathCartIcon),
      });
      await expect(sfHome.genLoc(sfHome.xpathStickyBtnCart)).toBeHidden();
      await sfHome.clickOnBtnWithLabel("Add to cart");
      const mess = await sfHome.genLoc(sfHome.notiMessATCSucces).textContent();
      expect(mess).toEqual(conf.caseConf.expect_mess);
    });

    await test.step("mobile: 4. Go to sf product detail ", async () => {
      await homePageMobile.gotoProductDetail(conf.caseConf.handle);
    });

    await test.step("5. scroll qua button add to cart để hiển thị sticky atc > click vào button atc ở sticky atc ", async () => {
      await scrollUntilElementIsVisible({
        page: homePageMobile.page,
        scrollEle: homePageMobile.page.locator(sfHome.imgCountryOfGlobalSwitcher),
        viewEle: homePageMobile.page.locator(sfHome.imgCountryOfGlobalSwitcher),
      });
      await expect(homePageMobile.genLoc(homePageMobile.xpathStickyBtnCart)).toBeVisible();
      await homePageMobile.genLoc(homePageMobile.xpathStickyBtnCart).click();
      const mess = await homePageMobile.genLoc(homePageMobile.notiMessATCSucces).textContent();
      expect(mess).toEqual(conf.caseConf.expect_mess);
    });

    await test.step("6. Scroll lên để hủy trạng thái sticky button ADD TO CART  > Click button ADD TO CART ", async () => {
      // Scroll lên đến vị trí của sản phẩm cuối cùng trong giỏ hàng
      await scrollUntilElementIsVisible({
        page: page,
        scrollEle: homePageMobile.page.locator(homePageMobile.xpathCartIcon),
        viewEle: homePageMobile.page.locator(homePageMobile.xpathCartIcon),
      });
      await homePageMobile.clickOnBtnWithLabel("Add to cart");
      const mess = await homePageMobile.genLoc(homePageMobile.notiMessATCSucces).textContent();
      expect(mess).toEqual(conf.caseConf.expect_mess);
    });
  });

  test(`@SB_SF_CART_06 [mobile] [Mini Cart] Check hiển thị setting block Cart = open mini cart và setting when buyer click= Show notification`, async ({
    pageMobile,
    conf,
    snapshotFixture,
  }) => {
    const homePageMobile = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step("Moblie: 1. Go to sf collection all  > add to cart products ", async () => {
      await homePageMobile.gotoAllCollection();
      for (let i = 0; i < productATC.length; i++) {
        await homePageMobile.aTCProductInCollection(productATC[i]);
      }
    });

    await test.step("2. Click on block cart  ", async () => {
      await homePageMobile.clickOnCartIconOnHeader();
      await snapshotFixture.verifyWithAutoRetry({
        page: homePageMobile.page,
        selector: homePageMobile.genLoc(homePageMobile.xpathMiniCart),
        snapshotName: expectSnapshot.mini_cart_default,
      });
    });

    await test.step("3. Scroll mini cart lên đến item product cuối cùng ", async () => {
      // Scroll lên đến vị trí của sản phẩm cuối cùng trong giỏ hàng
      await homePageMobile
        .genLoc(homePageMobile.xpathItemProductInMiniCart(productATC[productATC.length - 1]))
        .scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: homePageMobile.page,
        selector: homePageMobile.genLoc(homePageMobile.xpathMiniCart),
        snapshotName: expectSnapshot.mini_cart_last_item,
      });
    });
  });

  test(`@SB_SF_CART_05 [Desktop] [Mini Cart] Check hiển thị setting block Cart = open mini cart và setting when buyer click= Show notification `, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    const sfHome = new SFHome(page, conf.suiteConf.domain);

    await test.step("Moblie: 1. Go to sf collection all  > add to cart products ", async () => {
      await sfHome.gotoAllCollection();
      for (let i = 0; i < productATC.length; i++) {
        await sfHome.aTCProductInCollection(productATC[i]);
      }
    });

    await test.step("2. Click on block cart  ", async () => {
      await sfHome.clickOnCartIconOnHeader();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfHome.page,
        selector: sfHome.genLoc(sfHome.xpathMiniCart),
        snapshotName: expectSnapshot.mini_cart_default,
      });
    });

    await test.step("3. Scroll mini cart lên đến item product cuối cùng ", async () => {
      // Scroll lên đến vị trí của sản phẩm cuối cùng trong giỏ hàng
      await sfHome
        .genLoc(sfHome.xpathItemProductInMiniCart(productATC[productATC.length - 1]))
        .scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfHome.page,
        selector: sfHome.genLoc(sfHome.xpathMiniCart),
        snapshotName: expectSnapshot.mini_cart_last_item,
      });
    });
  });

  test(`@SB_SF_CART_01 [Desktop] [Cart drawer] Check hiển thị setting block Cart = open mini cart và setting when buyer click= Show notification `, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    const sfHome = new SFHome(page, conf.suiteConf.domain);

    await test.step("1. Go to sf collection all  > add to cart products ", async () => {
      await sfHome.gotoAllCollection();
      for (let i = 0; i < productATC.length; i++) {
        await sfHome.aTCProductInCollection(productATC[i]);
      }
    });

    await test.step("2. Click on block cart  ", async () => {
      await sfHome.clickOnCartIconOnHeader();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfHome.page,
        selector: sfHome.genLoc(sfHome.cartDrawer),
        snapshotName: expectSnapshot.cart_drawer_default,
      });
    });

    await test.step("3. Scroll mini cart lên đến item product cuối cùng ", async () => {
      // Scroll lên đến vị trí của sản phẩm cuối cùng trong giỏ hàng
      await sfHome
        .genLoc(sfHome.xpathItemProductInCartDrawer(productATC[productATC.length - 1]))
        .scrollIntoViewIfNeeded();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfHome.page,
        selector: sfHome.genLoc(sfHome.cartDrawer),
        snapshotName: expectSnapshot.mini_drawer_last_item,
      });
    });
  });
});
