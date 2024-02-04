import { test } from "@fixtures/website_builder";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { expect } from "@playwright/test";
import { currentDateFormat } from "@utils/datetime";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProducDetailV3 } from "@pages/new_ecom/storefront/product_page";
import { SFHome } from "@pages/storefront/homepage";
import { ShopTheme } from "@types";

let themes: ThemeEcom, xpath: Blocks, dashboardPage: DashboardPage;
let expected, nameTheme, expectLink, data;
let themeTest: ShopTheme;

test.describe("Verify language editor", () => {
  test.beforeEach(async ({ dashboard, conf, cConf, theme }) => {
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    xpath = new Blocks(dashboard, conf.suiteConf.domain);

    data = conf.caseConf.data;
    expected = conf.caseConf.expect;
    expectLink = conf.suiteConf.link;
    nameTheme = conf.suiteConf.name_theme;

    await test.step(`Setting theme test`, async () => {
      const themeList = await theme.list();
      themeTest = themeList.find(theme => theme.name === cConf.theme_test);
      if (!themeTest.active) {
        await theme.publish(themeTest.id);
      }
    });
  });

  test("Check data default của màn language editor @SB_OLS_THE_LE_39", async ({}) => {
    await test.step("Vào DB > Online store > Design > Actions ở theme bất kỳ > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", nameTheme, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
      await themes.resetLanguageToDefault();
      const currentUrl = themes.page.url();
      expect(currentUrl).toContain(expectLink);
      await expect(themes.genLoc(themes.btnResetToDefault)).toHaveAttribute("disabled", "disabled");

      // verify default data search trống
      const contentSearchDefault = await themes.genLoc(themes.searchText).inputValue();
      expect(contentSearchDefault).toEqual("");

      // verify Droplist lọc theo page: default là All Pages
      const listItemDropdownPage = await themes.getAllItemOffDropdown(themes.xpathItemDropdownSearch(1));
      expect(listItemDropdownPage[0]).toEqual("All pages");

      // eslint-disable-next-line max-len
      // verify hiển thị List data với 4 cột và có phân trang khi lớn 10 key/ 1 trang: Key, English Phrase A-Z, Phrase A-z, Last Edit
      for (const dropdown of expected.list_dropdown_sort) {
        const listItemDropdownSort = await themes.getAllItemOffDropdown(themes.xpathItemDropdownSort(dropdown));
        expect(listItemDropdownSort[0]).toEqual("A-Z");
      }
      await expect(themes.genLoc(themes.xpathFieldLastEdit)).toBeVisible();

      const listItemDropdownRowPerPage = await themes.getAllItemOffDropdown(themes.xpathRowPerPage());
      await expect(listItemDropdownRowPerPage[0]).toEqual("10");

      // verify hiển thị Download + Upload file language editor
      await expect(themes.genLoc(themes.btnDownloadFileLanguage)).toBeVisible();
      await expect(themes.genLoc(themes.btnUploadFileLanguage)).toBeVisible();
    });

    for (const change of expected.change_type) {
      await test.step(`Change type = ${change.type}`, async () => {
        await themes.selectDropdownInLanguageEditor(change.index_dropdown, change.type);
        if (change.show_droplist_page) {
          await expect(themes.genLoc(themes.labelDropdown).first()).not.toHaveAttribute("style", "display: none;");
        } else {
          await expect(themes.genLoc(themes.labelDropdown).first()).toHaveAttribute("style", "display: none;");
        }
      });
    }
  });

  test("Check change ngôn ngữ thành công với Page = Products + theme Ciadora + language = English @SB_OLS_THE_LE_40", async ({
    conf,
    page,
  }) => {
    const productPage = new ProducDetailV3(page, conf.suiteConf.domain);
    const homePage = new SFHome(page, conf.suiteConf.domain);

    await test.step("Vào DB > Online store > Design > Actions ở theme bất kỳ > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", nameTheme, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
      await themes.resetLanguageToDefault();
    });

    await test.step(`Chọn Page = ${data.search_filter.select_page} > Search = ${data.search_filter.key_search} > Edit phrase của = ${data.edit_phrase} > Save > Verify ngoài SF`, async () => {
      for (const lang of data.edit_phrase) {
        await themes.searchFilter(data.search_filter);
        await themes.editPhraseLanguagePack(data.title, lang);

        await test.step("Open SF > Verify language editor", async () => {
          await page.goto(`https://${conf.suiteConf.domain}/${data.sf.link}`);
          await page.reload();
          await page.waitForLoadState("networkidle");
          await page.locator(xpath.tabHeading).scrollIntoViewIfNeeded();
          await expect(page.locator(productPage.xpathBtnInProductPage(lang))).toBeVisible();
        });
      }
    });

    await test.step("Change ngôn ngữ khác english", async () => {
      await homePage.selectStorefrontLanguage(data.sf.change_lang, "new-ecom");
      await expect(page.locator(productPage.xpathBtnInProductPage(data.sf.locale_key_search))).toBeVisible();
    });

    await test.step("Vào lại language editor trong DB > Click button Reset to default", async () => {
      await themes.resetLanguageToDefault();
    });
  });

  test("Check change ngôn ngữ thành công với Page = Cart + theme Roller + language = French @SB_OLS_THE_LE_41", async ({
    conf,
    cConf,
    dashboard,
    page,
  }) => {
    await test.step("Vào DB > Online store > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", cConf.theme_test, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
    });

    await test.step(`Chọn Page = ${data.search_filter.select_page} > Search = ${data.search_filter.key_search} > Edit phrase của = ${data.edit_phrase} > Save > Verify ngoài SF`, async () => {
      await themes.searchFilter(data.search_filter);
      await themes.resetLanguageToDefault();
      await themes.searchFilter(data.search_filter);
      await themes.editPhraseLanguagePack(data.title, data.edit_phrase);

      await test.step("Open SF > Verify language editor", async () => {
        await page.goto(`https://${conf.suiteConf.domain}/${data.sf.link}`);
        themes = new ThemeEcom(page, conf.suiteConf.domain);
        await page.waitForLoadState("networkidle");
        await page.waitForSelector(xpath.cartEmpty);
        await expect(page.locator(xpath.cartEmpty)).toHaveText(data.title);
      });
    });

    await test.step("Change ngôn ngữ", async () => {
      await page.locator(xpath.btnLocaleRoller).scrollIntoViewIfNeeded();
      await page.locator(xpath.btnLocaleRoller).click();
      await page.locator(xpath.getXpathLocaleRoller(data.sf.change_lang)).click();
      await themes.clickBtnByName("Done");
      await themes.waitResponseWithUrl("/apps/assets/locales/fr.json");
      await expect(page.locator(xpath.cartEmpty)).toHaveText(data.edit_phrase);
    });

    await test.step("Vào lại language editor trong DB > Click button Reset to default", async () => {
      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themes.resetLanguageToDefault();
    });
  });

  test("Check change ngôn ngữ thành công với Page = All page + theme Inside + language = English @SB_OLS_THE_LE_42", async ({
    conf,
    cConf,
    page,
  }) => {
    await test.step("Vào DB > Online store > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", cConf.theme_test, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
    });

    await test.step(`Chọn Page = ${data.search_filter.select_type} > Search = ${data.search_filter.key_search} > Edit phrase của = ${data.edit_phrase} > Save > Verify ngoài SF`, async () => {
      await themes.searchFilter(data.search_filter);
      await themes.resetLanguageToDefault();
      await themes.searchFilter(data.search_filter);
      await themes.editPhraseLanguagePack(data.title, data.edit_phrase);

      await test.step("Open SF > Verify language editor", async () => {
        await page.goto(`https://${conf.suiteConf.domain}/${data.sf.link}`);
        await page.waitForLoadState("networkidle");
        await expect(page.locator(xpath.optionManual)).toHaveText(data.edit_phrase);
      });
    });

    await test.step("Vào lại language editor trong DB > Click button Reset to default", async () => {
      await themes.resetLanguageToDefault();
    });
  });

  test("Check change ngôn ngữ thành công với Boost Upsell App + language = English @SB_OLS_THE_LE_43", async ({
    conf,
    cConf,
    dashboard,
    page,
  }) => {
    await test.step("Vào DB > Online store > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", cConf.theme_test, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
    });

    await test.step(`Chọn type = ${data.search_filter.select_type} > Search = ${data.search_filter.key_search} > Edit phrase của = ${data.edit_phrase} > Save > Verify ngoài SF`, async () => {
      await themes.searchFilter(data.search_filter);
      await themes.resetLanguageToDefault();
      await themes.searchFilter(data.search_filter);
      await themes.editPhraseLanguagePack(data.title, data.edit_phrase);

      await test.step("Open SF > Verify language editor", async () => {
        await page.goto(`https://${conf.suiteConf.domain}/${data.sf.link}`);
        themes = new ThemeEcom(page, conf.suiteConf.domain);
        await page.waitForLoadState("networkidle");
        await themes.page
          .getByRole("button", { name: "Add to cart" })
          .or(themes.blockBtn.filter({ hasText: "Add to cart" }))
          .click();
        await themes.waitResponseWithUrl("api/offers/cart-recommend.json");

        await page.goto(`https://${conf.suiteConf.domain}/cart`);
        await page.waitForLoadState("networkidle");
        await page.waitForSelector(xpath.addMoreItem);
        await expect(page.locator(xpath.addMoreItem)).toHaveText(` + ${data.edit_phrase}`);
      });
    });

    await test.step("Vào lại language editor trong DB > Click button Reset to default", async () => {
      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themes.resetLanguageToDefault();
    });
  });

  test("Check change ngôn ngữ thành công với Product Review App + language = Vietnamese @SB_OLS_THE_LE_44", async ({
    conf,
    cConf,
    dashboard,
    page,
  }) => {
    await test.step("Vào DB > Online store > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", cConf.theme_test, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
    });

    await test.step(`Chọn Page = ${data.search_filter.select_type} > Search = ${data.search_filter.key_search} > Edit phrase của = ${data.edit_phrase} > Save > Verify ngoài SF`, async () => {
      await themes.searchFilter(data.search_filter);
      await themes.resetLanguageToDefault();
      await themes.searchFilter(data.search_filter);
      await themes.editPhraseLanguagePack(data.title, data.edit_phrase);

      await test.step("Open SF > Verify language editor", async () => {
        await page.goto(`https://${conf.suiteConf.domain}/${data.sf.link}`);
        themes = new ThemeEcom(page, conf.suiteConf.domain);
        await page.waitForLoadState("networkidle");
        await page.locator(xpath.footerMenu).scrollIntoViewIfNeeded();
        await page.waitForSelector(xpath.textReview);
        await expect(page.locator(xpath.textReview)).toHaveText(data.title);
      });
    });

    await test.step("Change ngôn ngữ", async () => {
      await page.locator(xpath.currencyLanguageInside).scrollIntoViewIfNeeded();
      await page.locator(xpath.currencyLanguageInside).click();
      await page.locator(xpath.getXpathLocaleInside(data.sf.change_lang)).click();
      await themes.genLoc(themes.btnSelectChangeLangSF).click();
      await themes.waitResponseWithUrl("locales/app/es.json?");
      await expect(page.locator(xpath.textReview)).toHaveText(data.edit_phrase);
    });

    await test.step("Vào lại language editor trong DB > Click button Reset to default", async () => {
      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themes.resetLanguageToDefault();
    });
  });

  test("Check change ngôn ngữ thành công với Checkout + language = English @SB_OLS_THE_LE_45", async ({
    conf,
    dashboard,
    page,
  }) => {
    await test.step("Vào DB > Online store > Design > Actions ở theme bất kỳ > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", nameTheme, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
    });

    await test.step(`Chọn Page = ${data.search_filter.select_type} > Search = ${data.search_filter.key_search} > Edit phrase của = ${data.edit_phrase} > Save > Verify ngoài SF`, async () => {
      await themes.searchFilter(data.search_filter);
      await themes.resetLanguageToDefault();
      await themes.searchFilter(data.search_filter);
      await themes.editPhraseLanguagePack(data.title, data.edit_phrase);
    });

    await test.step("Open SF > Verify language editor", async () => {
      await page.goto(`https://${conf.suiteConf.domain}/${data.sf.link}`);
      themes = new ThemeEcom(page, conf.suiteConf.domain);
      await page.waitForLoadState("networkidle");
      await page.locator(themes.getXpathByName("Buy now")).click();
      await page.waitForLoadState("networkidle");
      await expect(page.locator(themes.getXpathByName(data.edit_phrase + ":"))).toBeVisible();
    });

    await test.step("Vào lại language editor trong DB > Click button Reset to default", async () => {
      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themes.resetLanguageToDefault();
    });
  });

  test("Check change ngôn ngữ không thành công @SB_OLS_THE_LE_46", async ({ conf, dashboard }) => {
    await test.step("Vào DB > Online store > Design > Actions ở theme bất kỳ > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", nameTheme, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
    });

    await test.step(`Chọn Page = ${data.search_filter.select_type} > Edit phrase của = ${data.edit_phrase} > Save > Verify ngoài SF`, async () => {
      await themes.searchFilter(data.search_filter);
      await dashboard.locator(themes.getXpathPhrase(data.title)).clear();
      await dashboard.locator(themes.getXpathPhrase(data.title)).type(data.edit_phrase);
      await dashboard.locator(themes.getXpathLastEdit(data.title)).click();
      await expect(dashboard.locator(themes.getXpathLastEdit(data.title))).toContainText(currentDateFormat);

      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await expect(dashboard.locator(xpath.alertError)).toHaveText(expected.alert_content);
    });

    await test.step(`Click vào link filter this page`, async () => {
      await dashboard.locator(themes.getXpathByName("filter this page")).click();
      await themes.waitForXpathState(xpath.linkFilterLanguage, "stable");
      await expect(dashboard.locator(xpath.recordKeyPhrase)).toHaveCount(1);
    });

    await test.step(`Click vào link un-filter`, async () => {
      await dashboard.locator(themes.getXpathByName("un-filter")).click();
      await themes.waitForXpathState(xpath.linkFilterLanguage, "stable");
      await expect(dashboard.locator(xpath.recordKeyPhrase)).toHaveCount(10);
    });

    await test.step(`Click vào button Discard`, async () => {
      await themes.clickBtnByName("Discard");
      await dashboard.waitForSelector(xpath.keyFraseFirst);
      await themes.waitForXpathState(xpath.tableKeyValue, "stable");

      await expect(dashboard.locator(xpath.alertError)).toBeHidden();
    });
  });

  test("Check change ngôn ngữ thành data trống @SB_OLS_THE_LE_47", async ({ conf, dashboard, page }) => {
    await test.step("Vào DB > Online store > Design > Actions ở theme bất kỳ > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", nameTheme, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
    });

    await test.step(`Chọn Page = ${data.search_filter.select_type} > Edit phrase của = ${data.edit_phrase} > Save > Verify ngoài SF`, async () => {
      await themes.searchFilter(data.search_filter);
      await themes.resetLanguageToDefault();
      await themes.searchFilter(data.search_filter);
      await themes.editPhraseLanguagePack(data.title, data.edit_phrase);
    });

    await test.step("Open SF > Verify language editor", async () => {
      await page.goto(`https://${conf.suiteConf.domain}/${data.sf.link}`);
      themes = new ThemeEcom(page, conf.suiteConf.domain);
      await page.waitForLoadState("networkidle");
      await page.locator(xpath.tabHeading).scrollIntoViewIfNeeded();
      await expect(page.locator(themes.getXpathByName(data.title))).toBeVisible();
    });

    await test.step("Vào lại language editor trong DB > Click button Reset to default", async () => {
      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themes.resetLanguageToDefault();
    });
  });

  test("Check download và upload file @SB_OLS_THE_LE_48", async ({ dashboard }) => {
    await test.step("Vào DB > Online store > Design > Actions ở theme bất kỳ > Edit language", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await themes.selectActionTheme("Edit language", nameTheme, 1, true);
      await themes.waitForElementVisibleThenInvisible(themes.loadingtable);
      await themes.resetLanguageToDefault();
    });

    await test.step(`Chọn Page = ${data.search_filter.select_type} > Click button Download Roller - English`, async () => {
      await themes.searchFilter(data.search_filter);
      const file = await xpath.downloadFile(themes.getXpathBtnByName("Download roller - English"));
      expect(file).toEqual(expected.download);
    });

    await test.step(`Edit data trong file > Upload file vừa edit > Save`, async () => {
      await dashboard.setInputFiles(xpath.uploadFile, "data/shopbase/front/locale_roller.json");
      await themes.clickBtnByName("Save");
      await dashboard.waitForSelector(xpath.keyFraseFirst);
      await themes.waitForXpathState(xpath.tableKeyValue, "stable");
      await dashboard.waitForSelector(themes.getXpathByName("Saved successfully"), { state: "visible" });

      await dashboard.locator(xpath.txtSearchKey).clear();
      await dashboard.locator(xpath.txtSearchKey).type(expected.title);
      await expect(dashboard.locator(themes.getXpathPhrase(expected.title))).toHaveAttribute(
        "title",
        expected.edit_phrase,
      );
    });

    await test.step(`Click button Reset to default`, async () => {
      await themes.waitForXpathState(themes.getXpathBtnByName("Reset to default"), "stable");
      await themes.clickBtnByName("Reset to default");
      await themes.clickBtnByName("Continue");
      await dashboard.waitForSelector(themes.getXpathBtnByName("Cancel"), { state: "hidden" });
      await dashboard.waitForSelector(xpath.keyFraseFirst);
      await themes.waitForXpathState(xpath.tableKeyValue, "stable");
      await dashboard.waitForSelector(themes.getXpathByName("Saved successfully"), { state: "hidden" });
      await dashboard.locator(xpath.txtSearchKey).clear();
      await dashboard.locator(xpath.txtSearchKey).type(expected.title);
      await expect(dashboard.locator(themes.getXpathPhrase(expected.title))).toHaveAttribute("title", expected.title);
      await expect(dashboard.locator(themes.getXpathLastEdit(expected.title))).toHaveText("");
    });
  });
});
