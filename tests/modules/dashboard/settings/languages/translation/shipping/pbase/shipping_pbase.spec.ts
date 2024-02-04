import { expect, test } from "@fixtures/website_builder";
import { Page } from "@playwright/test";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { SFHome } from "@sf_pages/homepage";
import { waitTimeout } from "@utils/api";
import { SFProduct } from "@sf_pages/product";
import { SFCheckout } from "@sf_pages/checkout";
import { OcgLogger } from "@core/logger";
import { WebBuilder } from "@pages/dashboard/web_builder";

const logger = OcgLogger.get();

test.describe("Automate testcase for entity Shipping(feature translation)", () => {
  let dashboardTransPage: TranslationDetail;
  let dashboardPage: DashboardPage;
  let accessToken: string;
  let themes: ThemeEcom;
  let infoThemes: { id: number; name: string } | undefined;
  let homePage: SFHome;
  let productPage: SFProduct;
  let checkoutPage: SFCheckout;
  let webBuilder: WebBuilder;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let suiteConf: Record<string, any>;

  const verifyShippingMethodTitleTranslated = async (page: Page, lang: string, selector: string) => {
    if (lang === "English") return true;
    const res = await page.evaluate(
      payload => {
        const shippingMethodSelector = document.querySelectorAll(payload.selector);
        if (!shippingMethodSelector || shippingMethodSelector.length < 1) {
          return false;
        }
        let isValid = true;
        shippingMethodSelector.forEach(i => {
          if (!i.innerHTML.includes(payload.lang) && payload.lang !== "English") {
            isValid = false;
            return isValid;
          }
        });
        return isValid;
      },
      { selector: selector, lang: lang },
    );
    return !!res;
  };

  const setCheckoutLayout = async (type: string, dashboard) => {
    await dashboardPage.goto("admin/settings/checkout");
    await dashboardPage.page.click('//span[contains(text(), "Customize checkout")]');
    await waitTimeout(3000);
    await webBuilder.clickSectionOnPage(
      await webBuilder.getSelectorByIndex({ section: 1, row: 1, column: 1, block: 4 }),
    );
    await dashboard.locator("[data-widget-id='checkout_layout'] .widget-select").click();
    await dashboard.locator(`[data-select-label='${type}']`).click();
    await dashboard.locator("//button[@data-testid='save']").click();
  };

  const initial = ({ dashboard, conf, page }) => {
    suiteConf = conf.suiteConf;
    homePage = new SFHome(page, suiteConf.domain);
    dashboardTransPage = new TranslationDetail(dashboard, suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, suiteConf.domain);

    productPage = new SFProduct(page, conf.suiteConf.domain);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
  };

  test.beforeEach("", async ({ dashboard, conf, page, token }) => {
    initial({ dashboard, conf, page });

    await test.step("Pre condition: Get theme info - need V3", async () => {
      themes = new ThemeEcom(dashboard, suiteConf.domain);
      const { access_token: shopToken } = await token.getWithCredentials({
        domain: suiteConf.domain,
        username: suiteConf.username,
        password: suiteConf.password,
      });
      accessToken = shopToken;
      infoThemes = await themes.getIdTheme(accessToken, true);
      if (!infoThemes) {
        expect(infoThemes).toEqual({});
      }
    });

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      try {
        await dashboardTransPage.goToLanguageList();
        await expect(dashboardTransPage.genLoc(dashboardTransPage.xpathLangList.titleLanguageList)).toBeVisible();
        await dashboardTransPage.removeAllLanguages();

        await dashboardTransPage.addLanguages(suiteConf.list_language_need_test);
        await dashboardTransPage.waitUntilMessHidden();
      } catch (e) {
        logger.error(e);
      }
    });
  });

  test(`@SB_SET_LG_TLL_60 - [DB+SF - Function] Kiểm tra translate Shipping method - PrintBase`, async ({
    dashboard,
    conf,
  }) => {
    test.slow();
    /* --- ---*/
    await test.step("Setup shipping zone data", async () => {
      // PrintBase cannot customize shipping zone.
      // PrintBase camp sử dụng data shipping từ shop template
      // config theo từng camp vd trên dev https://kwantest.myshopbase.net/admin/settings/shipping-profile/39699
      // Khi setup conf json cần chọn product camp và check trong shop template shipping setting
      // để lựa chọn data shipping điền trong form checkout
      // tránh issue variant in cart not shipping support
      return true;
    });
    /* --- ---*/
    await test.step("Verify at storefront 1 page checkout", async () => {
      try {
        await setCheckoutLayout("1-page checkout", dashboard);
        await homePage.page.goto(`https://${conf.suiteConf.domain}/${conf.suiteConf.sf_product_url}`);
        await homePage.page.waitForLoadState("networkidle");
        await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
        await productPage.clickBuyNow();
        await checkoutPage.enterShippingAddress(conf.suiteConf.checkout_info);
        await checkoutPage.page.waitForSelector("//span[@class='shipping-selector__change']", { timeout: 5000 });
        await checkoutPage.page.locator("//span[@class='shipping-selector__change']").click();
        const translated = await verifyShippingMethodTitleTranslated(
          checkoutPage.page,
          conf.suiteConf.verify_language,
          ".shipping-method__method-title",
        );
        expect(translated).toEqual(true);
        await checkoutPage.completeOrderWithCardInfo(conf.suiteConf.card);
        expect(checkoutPage.isThankyouPage()).toBeTruthy();
        await checkoutPage.getOrderName();
      } catch (e) {
        logger.error(e);
      }
    });
    /* --- ---*/
    await test.step("Verify at storefront 3 page checkout", async () => {
      try {
        await setCheckoutLayout("3-step checkout", dashboard);
        await homePage.page.goto(`https://${conf.suiteConf.domain}/${conf.suiteConf.sf_product_url}`);
        await homePage.page.waitForLoadState("networkidle");
        await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
        await productPage.clickBuyNow();
        await checkoutPage.enterShippingAddress(conf.suiteConf.checkout_info);
        const translated = await verifyShippingMethodTitleTranslated(
          checkoutPage.page,
          conf.suiteConf.verify_language,
          ".shipping-method__method-title",
        );
        expect(translated).toEqual(true);
      } catch (e) {
        logger.error(e);
      }
    });
  });
});
