import { test, expect } from "@core/fixtures";
import { ProductAPI } from "@pages/api/product";
import { GoogleTag } from "@pages/thirdparty/googletag";
import { loadData } from "@core/conf/conf";
import { SFHome } from "@sf_pages/homepage";
import { SFProduct } from "@sf_pages/product";
import { SFCheckout } from "@sf_pages/checkout";
import { ThemeDashboard } from "@pages/dashboard/theme";

test.describe("Tracking event to Data Layer", async () => {
  let googleTag: GoogleTag;
  let domain: string;
  let themePage: ThemeDashboard;
  let storeFontHome: SFHome;
  let productSFPage: SFProduct;
  let checkoutPage: SFCheckout;

  test.beforeEach(async ({ conf, authRequest }, testInfo) => {
    testInfo.setTimeout(conf.suiteConf.timeout);
    domain = conf.suiteConf.domain;
    await test.step("Create product", async () => {
      const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
      await productAPI.createNewProduct(conf.suiteConf.product);
    });
  });

  const conf = loadData(__dirname, "DATA_LAYER");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, ggPage }) => {
      const homepageSF = new SFHome(dashboard, domain);

      await test.step(
        `Setting Setting checkout = ${caseData.number_page} pages` +
          "Đăng nhập thành công vào dashboard->Online Store->Design->Customize trong Current template" +
          "Click vào button Product trên đầu page->Chọn Checkout" +
          `Click Layout & User ->Select Select ${caseData.checkout_layout}->Click Save`,
        async () => {
          themePage = new ThemeDashboard(dashboard, domain);
          await themePage.goToCustomizeTheme();
          await themePage.settingCheckOutPage(caseData.checkout_layout);
          await themePage.clickOnBtnWithLabel("Close");
          if (await themePage.checkButtonVisible("Confirm")) {
            await themePage.clickOnBtnWithLabel("Confirm");
          }
          expect(await themePage.isDBPageDisplay("Design")).toBeTruthy();
          await themePage.page.close();
        },
      );

      await test.step(
        "Add script của Google Tag vào website:" +
          "Đăng nhập vào Google Tag Manager, create account với domain của store," +
          "copy script bằng cách click vào ID của tag (acc: gmcocg1@gmail.com / Dalab@25 )" +
          "Đăng nhập vào Dashboard->Online Store->Preferences" +
          "Paste script của GTM vào Additional scripts --> Save",
        async () => {
          googleTag = new GoogleTag(ggPage, "");
          await googleTag.goToGoogleTag();
          await googleTag.clickOnBtnWithLabel("Add domain");
          await googleTag.page.waitForSelector(googleTag.xpathPopupConnect);
          await googleTag.page.locator(googleTag.inputFillUrl).fill("https://" + domain);
          const [SFPage] = await Promise.all([
            googleTag.page.waitForEvent("popup"),
            googleTag.page.locator(googleTag.xpathBtnConnect).click(),
          ]);
          await SFPage.waitForLoadState("networkidle");
          storeFontHome = new SFHome(SFPage, domain);
          productSFPage = new SFProduct(SFPage, domain);
          checkoutPage = new SFCheckout(SFPage, domain);
          expect(await googleTag.page.locator(googleTag.xpathBtnContinue)).toBeTruthy();
        },
      );

      await test.step(
        "Ở SF, Search product" +
          "Click product name (go to product page)" +
          "Ở Tag Assistant, check thông tin data layer",
        async () => {
          await googleTag.page.locator(googleTag.xpathBtnContinue).click();
          if (await googleTag.checkButtonVisible('Debug "Live" version')) {
            await googleTag.clickOnBtnWithLabel('Debug "Live" version');
            await googleTag.waitForElementVisibleThenInvisible(googleTag.xpathBtnDebug);
          }
          await storeFontHome.searchProduct(conf.suiteConf.product.title);
          await storeFontHome.viewProduct(conf.suiteConf.product.title);
          await storeFontHome.page.waitForSelector(homepageSF.xpathProductDetail);
          await googleTag.clickEventByName("view_item");
          const viewItems = await googleTag.getInfoEvent(caseData.view_item);
          expect(viewItems).toMatchObject(caseData.view_item);
        },
      );

      await test.step('Click "Add to cart"\n' + "Ở Tag Assistant, check thông tin data layer", async () => {
        await productSFPage.selectValueProduct(caseData.Variant_product);
        await productSFPage.addProductToCart();
        await googleTag.clickEventByName("add_to_cart");
        const addToCart = await googleTag.getInfoEvent(caseData.add_to_cart);
        expect(addToCart).toMatchObject(caseData.add_to_cart);
      });

      await test.step("Click Btn checkout Ở Tag Assistant, check thông tin data layer", async () => {
        await productSFPage.page.frameLocator("iframe").locator(googleTag.xpathClosePopupGoogleTag).click();
        //page2.frameLocator('iframe').getByText('collapse_all').click(
        await productSFPage.clickOnBtnWithLabel("Checkout");
        await productSFPage.page.waitForSelector(checkoutPage.xpathCheckOutContent);
        await googleTag.clickEventByName("begin_checkout");
        const infoEventBeginCheckout = await googleTag.getInfoEvent(caseData.begin_checkout);
        expect(infoEventBeginCheckout).toMatchObject(caseData.begin_checkout);
      });

      await test.step("Nhập payment information và click Place order Ở Tag Assistant, check thông tin data layer", async () => {
        if (caseData.checkout_layout === "One page checkout") {
          await checkoutPage.enterShippingAddress(conf.suiteConf.checkout_info);
          await checkoutPage.continueToPaymentMethod();
          await checkoutPage.completeOrderWithCardInfo(conf.suiteConf.card);
        } else {
          await checkoutPage.enterShippingAddress(conf.suiteConf.checkout_info);
          await checkoutPage.selectShippingMethodWithNo("1");
          await checkoutPage.page.click(checkoutPage.xpathBtnContinueToPaymentMethod);
          await checkoutPage.completeOrderWithCardInfo(conf.suiteConf.card);
        }
        await googleTag.clickEventByName("purchase");
        const infoEventPurchase = await googleTag.getInfoEvent(caseData.purchase);
        expect(infoEventPurchase).toMatchObject(caseData.purchase);
      });
    });
  }
});
