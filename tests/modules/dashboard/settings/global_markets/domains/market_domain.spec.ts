import { Page } from "@playwright/test";
import { expect, test } from "@fixtures/website_builder";
import { WbGlobalMarket } from "@pages/dashboard/global_markets";
import { SFHome } from "@pages/storefront/homepage";
import { verifyRedirectUrl, waitSelector } from "@core/utils/theme";
import { waitTimeout } from "@core/utils/api";
import { getProxyPageByCountry } from "@core/utils/proxy_page";

test.describe("Automate test case for module global_markets domain", () => {
  let wbPage: WbGlobalMarket;
  let homePage: SFHome;

  const get4LastCharacterOfUrl = async (page: Page) => {
    await page.waitForLoadState("networkidle");
    return page.url().slice(-4);
  };

  const chooseCountryAndLanguageOnProxyPage = async (
    option: {
      country?: string;
      language?: string;
      currency?: string;
    },
    page,
    domain,
  ) => {
    homePage = new SFHome(page, domain);
    const preXpathOptionOnDropdown = "//div[contains(@class, 'items')]";
    await page.locator(homePage.xpathBlockGlobalSwitcher).click({ delay: 1000 });
    await waitSelector(page, homePage.selectorTitlePopupChooseLangugeCurrency);

    if (option.language) {
      await page.locator(`${homePage.xpathDropdownOnGlobalSwitcher} >> nth = 1`).click();
      await page.locator(`${preXpathOptionOnDropdown}//div[contains(text(), '${option.language}')]`).last().click();
      await waitSelector(page, await homePage.xpathOptionIsChoosed(option.language));
    }
    if (option.country) {
      await page.locator(homePage.xpathDropdownOnGlobalSwitcher).first().click();
      await page.locator(`${preXpathOptionOnDropdown}//div[contains(text(), '${option.country}')]`).last().click();
    }
    if (option.currency) {
      await page.locator(homePage.xpathBlockGlobalSwitcher).last().click();
      await page.locator(`${preXpathOptionOnDropdown}//div[contains(text(), '${option.currency}')]`).last().click();
    }
    await page.locator(homePage.xpathGlobalSwitcher.xpathSaveButton).last().click({ delay: 1000 });
    await page.waitForSelector(homePage.selectorTitlePopupChooseLangugeCurrency, { state: "hidden" });
    await page.waitForLoadState("networkidle");
    if (option.currency) {
      await expect(page.locator(homePage.xpathBlockGlobalSwitcher)).toContainText(option.currency);
    }
    if (option.language) {
      await expect(page.locator(homePage.xpathBlockGlobalSwitcher)).toContainText(option.language);
    }
  };

  test.beforeEach("Go to global market, open domain", async ({ dashboard, conf, page }) => {
    wbPage = new WbGlobalMarket(dashboard, conf.suiteConf.domain);
    homePage = new SFHome(page, conf.suiteConf.domain);

    await test.step("Pre-condition: disable redirection domain", async () => {
      await wbPage.setStatusRedirectionDomain("Disable");
    });

    await test.step("Open submenu global marrket and choose domain option", async () => {
      await wbPage.navigateToMenu("Settings", 1);
      await wbPage.page.locator(wbPage.getXpathMenuByName("Global Markets")).click();
      await wbPage.page.locator(wbPage.xpath.domainButton).click();
      await expect(wbPage.page.locator(wbPage.xpath.domainBlock)).toBeVisible();

      await wbPage.chooseDomainOnGlobalMarket(conf.caseConf.domain_option);
    });
  });

  test(`@SB_SET_GM_DGM_02 [SF - Function - InFsw] Kiểm tra hiển thị domain khi seller setting choose Primary domain only và buyer truy cập primary domain`, async ({
    conf,
    page,
    context,
  }) => {
    const domain = conf.suiteConf.domain;
    const connectDomain = conf.suiteConf.connect_domain;
    const proxyPage = await getProxyPageByCountry(conf.suiteConf.country_proxy);

    await test.step("1. open connect domain của shop", async () => {
      //Open connect domain
      await proxyPage.goto(`https://${connectDomain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(connectDomain.slice(-4));
    });

    await test.step("2. open primary domain của shop", async () => {
      await proxyPage.goto(`https://${domain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(domain.slice(-4));
    });

    await test.step("3. Chọn country French và language Spanish", async () => {
      await chooseCountryAndLanguageOnProxyPage(conf.caseConf.data_step3, proxyPage, domain);
      await expect(proxyPage.locator(homePage.xpathBlockGlobalSwitcher)).toContainText(
        conf.caseConf.data_step3.language,
      );
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(domain.slice(-4));
    });

    await test.step("4. Chọn country Germany và language German", async () => {
      await chooseCountryAndLanguageOnProxyPage(conf.caseConf.data_step4, proxyPage, domain);
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(domain.slice(-4));
    });

    await test.step("5. Open các page của shop", async () => {
      //1. Product page
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();

      await proxyPage.goto(`https://${domain}products/${conf.caseConf.product_handle}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(conf.caseConf.product_handle.slice(-4));

      //2. Collection detail
      await proxyPage.goto(`https://${domain}collections/${conf.caseConf.collection_handle}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(conf.caseConf.collection_handle.slice(-4));

      // 3. Pages policy
      await proxyPage.goto(`https://${domain}pages/${conf.caseConf.page_policy_handle}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(conf.caseConf.page_policy_handle.slice(-4));

      // 4. Collection list
      await proxyPage.goto(`https://${domain}pages/${conf.caseConf.page_policy_handle}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(conf.caseConf.page_policy_handle.slice(-4));

      // 5. Cart
      await proxyPage.goto(`https://${domain}${conf.caseConf.cart_handle}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(conf.caseConf.cart_handle.slice(-4));

      // 6. Checkout
      await proxyPage.goto(`https://${domain}${conf.caseConf.checkout_handle}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(await get4LastCharacterOfUrl(proxyPage)).toEqual(conf.caseConf.checkout_handle.slice(-4));
    });
  });

  test(`@SB_SET_GM_DGM_03 [SF  - Function - InFsw] Kiểm tra hiển thị buyer truy cập domain khi enable  subfolder, switch sang ngôn ngữ khác`, async ({
    conf,
    context,
  }) => {
    let currentPage;
    const domain = conf.suiteConf.domain;
    const connectDomain = conf.suiteConf.connect_domain;
    const proxyPage = await getProxyPageByCountry("vn");

    await test.step("Pre-condition: choose primary Language for shop", async () => {
      await wbPage.setLanguageStatus(conf.caseConf.pre_condition.language, "Publish");
      await wbPage.chooseLanguageDefault(conf.caseConf.pre_condition.language);
    });

    await test.step("Pre-conditon: choose primary country for shop", async () => {
      await wbPage.addPublishMarket(conf.caseConf.pre_condition.country);
      await wbPage.choosePrimaryMarket(conf.caseConf.pre_condition.country);
    });

    await test.step("1. Open connect domains", async () => {
      await proxyPage.goto(`https://${connectDomain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.default_url);
    });

    await test.step("2. open primary domain của shop", async () => {
      await proxyPage.goto(`https://${domain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.default_url);
    });

    await test.step("3. chọn sang country Gemany và language German", async () => {
      await chooseCountryAndLanguageOnProxyPage(conf.caseConf.data_step2, proxyPage, domain);
      await proxyPage.waitForLoadState("networkidle");
      await expect(proxyPage.locator(homePage.xpathBlockGlobalSwitcher)).toContainText(
        conf.caseConf.data_step2.language,
      );

      expect(proxyPage.url()).toContain(conf.caseConf.data_step2.url);
      expect(proxyPage.url()).toContain(conf.caseConf.data_step2.url);
    });

    await test.step(`4. Search 1 product`, async () => {
      await proxyPage.goto(`https://${domain}search`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step2.url);
      await waitSelector(homePage.page, homePage.xpathSearchBar);
      await proxyPage.locator(homePage.xpathSearchBar).click({ delay: 1000 });
      await proxyPage.locator(homePage.xpathSearchBar).fill(conf.caseConf.product_name);
      await proxyPage.locator(homePage.xpathSearchBlockIcon).click();

      await expect(proxyPage.locator(homePage.xpathProductCard).first()).toContainText(conf.caseConf.product_name);
    });

    await test.step(`5. Chọn vào product Test tại page search`, async () => {
      await verifyRedirectUrl({
        page: proxyPage,
        selector: `${homePage.xpathProductCard} >> nth = 0`,
        redirectUrl: "/products",
        waitForElement: homePage.xpathGalleryBlock,
      });
      expect(proxyPage.url()).toContain(conf.caseConf.data_step2.url);
    });

    await test.step(`6. Open collection deatail từ admin`, async () => {
      await proxyPage.goto(`https://${domain}collections/${conf.caseConf.collection_handle}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step2.url);
    });

    await test.step(`7. Chọn 1 product trong collections Jeans and add to cart product và go To cart`, async () => {
      await proxyPage.locator(`${wbPage.getXpathProductItem(conf.caseConf.product_name)}//img`).hover();
      await proxyPage
        .locator(`${wbPage.getXpathProductItem(conf.caseConf.product_name)}${wbPage.xpath.buttonATC}`)
        .click();
      await waitSelector(proxyPage, homePage.xpathPopupPreSelectVariant);
      await waitTimeout(1000); //wait popup loading full element
      await proxyPage.locator(homePage.buttonATCOnVariantPopup).click();
      await proxyPage.waitForLoadState("networkidle");
      await waitSelector(proxyPage, wbPage.xpath.buttonCheckOutDELanguage(conf.suiteConf.key_checkout_button));

      expect(proxyPage.url()).toContain(conf.caseConf.data_step2.url);
    });

    await test.step(`8. Click Checkout`, async () => {
      currentPage = await verifyRedirectUrl({
        page: proxyPage,
        selector: wbPage.xpath.buttonCheckOutDELanguage(conf.suiteConf.key_checkout_button),
        redirectUrl: "/checkouts",
        waitForElement: homePage.orderItemOnCheckOutPage,
      });

      expect(currentPage.url()).toContain(conf.caseConf.data_step2.url);
    });

    await test.step(`10. Open link connect domain + /vi-vn`, async () => {
      await proxyPage.goto(`https://${connectDomain}${conf.caseConf.default_url}`);
      await proxyPage.waitForLoadState("networkidle");

      await expect(proxyPage.locator(homePage.imgCountryOfGlobalSwitcher)).toHaveAttribute(
        "src",
        new RegExp(conf.caseConf.flag),
      );
      await expect(proxyPage.locator(homePage.xpathBlockGlobalSwitcher)).toContainText(
        conf.caseConf.language_on_global_switcher,
      );
    });

    await test.step(`11. Go to dashboard -> Settings > Global Market -> Domains Chọn lại là Primary domain and Save`, async () => {
      await wbPage.navigateToMenu("Settings", 1);
      await wbPage.page.locator(wbPage.getXpathMenuByName("Global Markets")).click();
      await wbPage.page.locator(wbPage.xpath.domainButton).click();
      await wbPage.page.locator(wbPage.getXpathRatioOnDomainBlock("Primary domain")).click();
      await wbPage.page.locator(wbPage.xpath.saveButton).click();
      await expect(wbPage.page.locator(wbPage.xpath.domainInfoHeading)).toContainText("Primary domain");
      await wbPage.page.waitForSelector(wbPage.xpath.xpathToastSuccessBio, { state: "hidden" });

      currentPage = await verifyRedirectUrl({
        page: wbPage.page,
        selector: wbPage.xpath.xpathRedirectURL,
        redirectUrl: `${domain}`,
        context,
      });
      let retry = 0;
      while (retry++ < 5) {
        await currentPage.goto(`https://${domain}`);
        await currentPage.reload({ waitUntil: "load" });
        await currentPage.waitForTimeout(5000);
        await currentPage.waitForLoadState("networkidle");
        if ((await get4LastCharacterOfUrl(currentPage)) === domain.slice(-4)) {
          return;
        }
      }
      expect(await get4LastCharacterOfUrl(currentPage)).toEqual(domain.slice(-4));
    });

    await test.step("12. Open link ${domain}/de-de", async () => {
      await currentPage.goto(`https://${domain}${conf.caseConf.data_step2.url}`);
      await currentPage.waitForLoadState("networkidle");
      let retry = 0;
      while (retry++ < 5) {
        await currentPage.reload({ waitUntil: "load" });
        await currentPage.waitForTimeout(2000);
        await currentPage.waitForLoadState("networkidle");
        if ((await get4LastCharacterOfUrl(currentPage)) === domain.slice(-4)) {
          return;
        }
      }
      expect(await get4LastCharacterOfUrl(currentPage)).toEqual(domain.slice(-4));
    });
  });

  test(`@SB_SET_GM_DGM_04 - [SF - Function - InFsw] Kiểm tra hiển thị buyer truy cập domain khi enable subfolder với user không thuộc market nào`, async ({
    conf,
  }) => {
    const domain = conf.suiteConf.domain;
    const proxyPage = await getProxyPageByCountry(conf.suiteConf.country_proxy);

    await test.step("Pre-condition: unpublish Vietnamese language choose primary Language for shop", async () => {
      await wbPage.setLanguageStatus(conf.caseConf.pre_condition.language, "Publish");
      await wbPage.chooseLanguageDefault(conf.caseConf.pre_condition.language);
      await wbPage.setLanguageStatus(conf.caseConf.pre_condition.unpublish_language, "Unpublish");
    });

    await test.step("Pre-conditon: delete Viet Nam market and choose primary country for shop", async () => {
      await wbPage.addPublishMarket(conf.caseConf.pre_condition.country);
      await wbPage.choosePrimaryMarket(conf.caseConf.pre_condition.country);
      await wbPage.deleteMarket(conf.caseConf.pre_condition.delete_country);
    });

    await test.step(`1. open primary domain của shop`, async () => {
      await proxyPage.goto(`https://${domain}`);
      await proxyPage.waitForLoadState("networkidle");
      await chooseCountryAndLanguageOnProxyPage(conf.caseConf.data_step1, proxyPage, domain);
      expect(proxyPage.url()).toContain(conf.caseConf.subfolder_url);
    });

    await test.step(`2. Open product page`, async () => {
      await proxyPage.goto(`https://${domain}products/${conf.caseConf.product_handle}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.subfolder_url);
    });

    await test.step(`3. Add to cart and go to cart`, async () => {
      await verifyRedirectUrl({
        page: homePage.page,
        selector: `//div[contains(@class, 'wb-button--add-cart__primary')] >> nth=0`,
        redirectUrl: "/cart",
        waitForElement: wbPage.xpath.buttonCheckOutDELanguage(conf.suiteConf.key_checkout_button),
      });
      expect(proxyPage.url()).toContain(conf.caseConf.subfolder_url);
    });

    await test.step(`4. Go to checkout với product vừa được add`, async () => {
      await verifyRedirectUrl({
        page: homePage.page,
        selector: wbPage.xpath.buttonCheckOutDELanguage(conf.suiteConf.key_checkout_button),
        redirectUrl: "/checkouts",
        waitForElement: homePage.orderItemOnCheckOutPage,
      });
      expect(proxyPage.url()).toContain(conf.caseConf.subfolder_url);
    });
  });

  test(`@SB_SET_GM_DGM_05 - Check domain subfolder trường hợp enable redirection`, async ({ conf }) => {
    const domain = conf.suiteConf.domain;
    const connectDomain = conf.suiteConf.connect_domain;
    const proxyPage = await getProxyPageByCountry(conf.suiteConf.country_proxy);

    await test.step("Pre-condition: choose primary Language for shop", async () => {
      await wbPage.setLanguageStatus(conf.caseConf.pre_condition.language, "Publish");
      await wbPage.chooseLanguageDefault(conf.caseConf.pre_condition.language);
    });

    await test.step("Pre-conditon: choose primary country for shop", async () => {
      await wbPage.addPublishMarket(conf.caseConf.pre_condition.country);
      await wbPage.choosePrimaryMarket(conf.caseConf.pre_condition.country);
    });

    await test.step(`1. Vào dashboard > Domain: set enable redirection`, async () => {
      await wbPage.setStatusRedirectionDomain("Enable");
      await wbPage.page.waitForSelector(wbPage.getXpathTrafficStatus("Enable"), { state: "hidden" });
    });

    await test.step(`2. Mở link primary domain`, async () => {
      await proxyPage.goto(`https://${domain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.default_url);
    });

    await test.step(`3. Tại link primary domain: chọn sang country Gemany và language German`, async () => {
      await chooseCountryAndLanguageOnProxyPage(conf.caseConf.data_step3, proxyPage, domain);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step3.url);
    });

    await test.step(`4. Mở link connect domain`, async () => {
      await proxyPage.goto(`https://${connectDomain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step3.url);
    });

    await test.step(`5. Tại link connect domain: Chọn country Canada và language English`, async () => {
      await chooseCountryAndLanguageOnProxyPage(conf.caseConf.data_step5, proxyPage, domain);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step5.url);
    });

    await test.step(`6. Mở link primary domain`, async () => {
      await proxyPage.goto(`https://${domain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step5.url);
    });
  });

  test(`@SB_SET_GM_DGM_06 -  Check domain subfolder trường hợp disable redirection`, async ({ conf }) => {
    const domain = conf.suiteConf.domain;
    const connectDomain = conf.suiteConf.connect_domain;
    const proxyPage = await getProxyPageByCountry(conf.suiteConf.country_proxy);

    await test.step("Pre-condition: choose primary Language for shop", async () => {
      await wbPage.setLanguageStatus(conf.caseConf.pre_condition.language, "Publish");
      await wbPage.chooseLanguageDefault(conf.caseConf.pre_condition.language);
    });

    await test.step("Pre-conditon: choose primary country for shop", async () => {
      await wbPage.addPublishMarket(conf.caseConf.pre_condition.country);
      await wbPage.choosePrimaryMarket(conf.caseConf.pre_condition.country);
    });
    await test.step(`1. Vào dashboard > Domain: set Disable redirection`, async () => {
      //checked on pre-condition
    });

    await test.step(`2. Mở link primary domain`, async () => {
      await proxyPage.goto(`https://${domain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.default_url);
    });

    await test.step(`3. Tại link primary domain: chọn sang country Gemany và language German`, async () => {
      await chooseCountryAndLanguageOnProxyPage(conf.caseConf.data_step3, proxyPage, domain);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step3.url);
    });

    await test.step(`4. Mở link connect domain`, async () => {
      await proxyPage.goto(`https://${connectDomain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.default_url);
    });

    await test.step(`5. Tại link connect domain: Chọn country Canada và language English`, async () => {
      await chooseCountryAndLanguageOnProxyPage(conf.caseConf.data_step5, proxyPage, domain);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step5.url);
    });

    await test.step(`6. Mở link primary domain`, async () => {
      await proxyPage.goto(`https://${domain}`);
      await proxyPage.waitForLoadState("networkidle");
      expect(proxyPage.url()).toContain(conf.caseConf.data_step3.url);
    });
  });
});
