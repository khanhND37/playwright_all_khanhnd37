import { test } from "@fixtures/theme";
import type { ButtonInPopup, LanguageCurrency, ShopTheme, ThemeSettingValue } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { expect } from "@core/fixtures";
import { Page } from "@playwright/test";
import { waitSelector } from "@utils/theme";
import { loadData } from "@core/conf/conf";

let shopTheme: ShopTheme;
const btnBuyNow = ".btn-buy-now span";
const price = ".product__price";
const languageCurrencyActive = "[type='footer'] .currency-language_action";
const popupLanguageCurrency = ".modal-select-currency-language";
const selectLanguage = ".select-language";
const selectCurrency = ".select-currency";
const languageActive = `${selectLanguage} .active`;
const currencyActive = `${selectCurrency} .active`;
const nameCurrency = `${selectCurrency} .currency-dropdown__item__name`;
const nameLanguage = `${selectLanguage} .currency-dropdown__item__name`;
const btnSave = ".modal-select-currency-language_action .btn-primary";
const btnCancel = ".modal-select-currency-language_action .btn-subtle";
const iconClose = ".inside-modal__body__icon-close";

/**
 * Check if Strings ends with Number
 * @param str
 */
function endsWithNumber(str) {
  return /\d+$/.test(str);
}

/**
 * Check if string starts with number
 * @param str
 */
function startsWithNumber(str) {
  return /^\d/.test(str);
}

/**
 * Check data currency or Language in popup Language Currency
 * @param page
 * @param selector
 * @param value
 */
const verifyDataPopup = async (page: Page, selector: string, value?: string | number) => {
  if (typeof value === "string") {
    const listOption = value.split(" ");
    for (const option of listOption) {
      await expect(page.locator(`css=${selector}>>text=${option}`)).toHaveCount(1);
    }
  } else if (typeof value === "number") {
    await expect(page.locator(selector)).toHaveCount(value);
  } else {
    await expect(page.locator(selector)).toBeHidden();
  }
};

/**
 * Verify currency + language active in popup Language Currency
 * @param page
 * @param name
 * @param selector
 * @param selectorActive
 */
const verifyActiveCurrencyLanguage = async ({ page, name, selector, selectorActive }: LanguageCurrency) => {
  if (name) {
    await page.locator(`css=${selector}>>text=${name}`).click();
    await expect(await page.innerText(selectorActive)).toBe(name);
  }
};

/**
 * Verify change language on SF
 * @param page
 * @param selector
 * @param language
 */
const verifyChangeLanguage = async (page: Page, selector: string, language: string) => {
  await expect(await page.innerText(selector)).toEqual(language);
};

/**
 * Verify change currency on SF
 * @param typePage
 * @param selector
 * @param currLast
 * @param currFirst
 */
const verifyChangeCurrency = async ({ page, selector, currLast, currFirst }: LanguageCurrency) => {
  const str = await page.innerText(selector);
  if (currLast) {
    await expect(str).toContain(currLast);
  } else {
    await expect(endsWithNumber(str)).toEqual(true);
  }

  if (currFirst) {
    await expect(str).toContain(currFirst);
  } else {
    await expect(startsWithNumber(str)).toEqual(true);
  }
};

/**
 * Click on currency + language active
 * @param page
 * @param selector
 * @param active
 */
const clickPopup = async (page: Page, selector: string, active: string) => {
  await expect(await page.innerText(selector)).toBe(active);
  await page.locator(selector).click();
};

/**
 * Click button save or close or cancel in popup language currency
 * @param page
 * @param isDesktop
 * @param save
 * @param cancel
 * @param close
 */
const clickBtn = async ({ page, save, cancel, close, isDesktop = true }: ButtonInPopup) => {
  if (save) {
    await page.locator(btnSave).click();
  }
  if (cancel) {
    await page.locator(btnCancel).click();
  }
  if (close) {
    const btn = isDesktop ? iconClose : btnCancel;
    await page.locator(btn).click();
  }
};

test.describe("Verify language and currency setting @TS_SB_OLS_THE_INS_SF_LANGUAGE_CURRENCY", async () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
  });

  test.beforeAll(async ({ theme }) => {
    await test.step("Create theme by API", async () => {
      const res = await theme.create(3);
      await theme.publish(res.id);
    });

    await test.step("Remove shop theme not active", async () => {
      const res = await theme.list();
      const shopThemeId = res.find(shopTheme => shopTheme.active !== true);
      if (shopThemeId) {
        await theme.delete(shopThemeId.id);
      }
    });
  });

  const conf = loadData(__dirname, "LANGUAGE_CURRENCY");
  for (let i = 0; i < conf.caseConf.length; i++) {
    const dataSetting = conf.caseConf[i];

    test(`${dataSetting.description} @${dataSetting.id}`, async ({ page, theme, pageMobile }) => {
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      if (dataSetting.data) {
        await test.step("Setting theme editor", async () => {
          for (const setting of dataSetting.data) {
            shopTheme = await theme.updateSection({
              updateSection: setting as unknown as Record<string, Record<string, ThemeSettingValue>>,
              settingsData: shopTheme.settings_data,
              shopThemeId: shopTheme.id,
            });
          }
        });
      }

      await test.step("Verify setting language + currency on desktop", async () => {
        const navigationPage = new SFHome(page, conf.suiteConf.domain);
        await navigationPage.gotoProduct("writer-s-club-chair");
        await page.waitForLoadState("networkidle");
        await test.step("Verify setting language + currency after setting", async () => {
          await verifyChangeLanguage(page, btnBuyNow, dataSetting.output.button_buy_now);
          await verifyChangeCurrency({
            page: page,
            selector: price,
            currLast: dataSetting.output.type_price,
            currFirst: dataSetting.output.type_currency,
          });
        });

        await test.step("Verify show popup language + currency and change data", async () => {
          const inforPopup = dataSetting.output.popup_currency_language;

          //Verify popup show or hidden, verify list language, list currency in popup language currency
          if (inforPopup) {
            await clickPopup(page, languageCurrencyActive, inforPopup.global_active);
            await page.waitForSelector(popupLanguageCurrency);
            if (inforPopup.language_active) {
              await expect(await page.innerText(languageActive)).toBe(inforPopup.language_active);
            }
            if (inforPopup.currency_active) {
              await expect(await page.innerText(currencyActive)).toBe(inforPopup.currency_active);
            }
            await verifyDataPopup(page, nameCurrency, inforPopup.currency);
            await verifyDataPopup(page, nameLanguage, inforPopup.language);
          } else {
            await expect(page.locator(languageCurrencyActive)).toBeHidden();
          }

          //Change data language currency and verify language + currency update SF
          if (dataSetting.change_data) {
            for (let i = 0; i < dataSetting.change_data.length; i++) {
              const { currency, language, save, cancel, close, output } = dataSetting.change_data[i];
              if (i) {
                await page.locator(languageCurrencyActive).click();
              }
              await verifyActiveCurrencyLanguage({
                page: page,
                name: currency,
                selector: nameCurrency,
                selectorActive: currencyActive,
              });
              await verifyActiveCurrencyLanguage({
                page: page,
                name: language,
                selector: nameLanguage,
                selectorActive: languageActive,
              });
              await clickBtn({
                page: page,
                save: save,
                cancel: cancel,
                close: close,
              });
              if (save && language) {
                await page.waitForResponse(response => {
                  return response.url().includes("assets/locales") && response.status() === 200;
                });
              }

              //Verify language change + currency change on SF
              await waitSelector(page, `.btn-buy-now span>>text=${output.button_buy_now}`);
              await verifyChangeLanguage(page, btnBuyNow, output.button_buy_now);
              await waitSelector(page, `.product__price>>text=${output.type_currency}`);
              await verifyChangeCurrency({
                page: page,
                selector: price,
                currLast: output.type_price,
                currFirst: output.type_currency,
              });
              const selectModal = page.locator(".modal-select-currency-language");
              await selectModal.waitFor({
                state: "detached",
              });
              expect(await page.innerText(languageCurrencyActive)).toBe(output.global_active);
            }
          }
        });
      });

      await test.step("Verify setting language + currency on mobile", async () => {
        const navigationPage = new SFHome(pageMobile, conf.suiteConf.domain);
        await navigationPage.gotoProduct("writer-s-club-chair");
        await pageMobile.waitForLoadState("networkidle");
        await test.step("Verify setting language + currency after setting", async () => {
          await verifyChangeLanguage(pageMobile, btnBuyNow, dataSetting.output.button_buy_now);
          await verifyChangeCurrency({
            page: pageMobile,
            selector: price,
            currLast: dataSetting.output.type_price,
            currFirst: dataSetting.output.type_currency,
          });
        });

        await test.step("Verify show popup language + currency and change data", async () => {
          const inforPopup = dataSetting.output.popup_currency_language;
          //Verify popup show or hidden, verify list language, list currency in popup language currency
          if (inforPopup) {
            await clickPopup(pageMobile, languageCurrencyActive, inforPopup.global_active);
            await pageMobile.waitForSelector(popupLanguageCurrency);
            if (inforPopup.language_active) {
              await expect(await pageMobile.innerText(languageActive)).toBe(inforPopup.language_active);
            }
            if (inforPopup.currency_active) {
              await expect(await pageMobile.innerText(currencyActive)).toBe(inforPopup.currency_active);
            }
            await verifyDataPopup(pageMobile, nameCurrency, inforPopup.currency);
            await verifyDataPopup(pageMobile, nameLanguage, inforPopup.language);
          } else {
            await expect(pageMobile.locator(languageCurrencyActive)).toBeHidden();
          }

          //Change data language currency and verify language + currency update SF
          if (dataSetting.change_data) {
            for (let i = 0; i < dataSetting.change_data.length; i++) {
              const { currency, language, save, cancel, close, output } = dataSetting.change_data[i];
              if (i) {
                await pageMobile.locator(languageCurrencyActive).click();
              }
              await verifyActiveCurrencyLanguage({
                page: pageMobile,
                name: currency,
                selector: nameCurrency,
                selectorActive: currencyActive,
              });
              await verifyActiveCurrencyLanguage({
                page: pageMobile,
                name: language,
                selector: nameLanguage,
                selectorActive: languageActive,
              });
              await clickBtn({
                page: pageMobile,
                save: save,
                cancel: cancel,
                close: close,
                isDesktop: false,
              });
              if (save && language) {
                await pageMobile.waitForResponse(response => {
                  return response.url().includes("assets/locales") && response.status() === 200;
                });
              }

              //Verify language change + currency change on SF
              await waitSelector(pageMobile, `.btn-buy-now span>>text=${output.button_buy_now}`);
              await verifyChangeLanguage(pageMobile, btnBuyNow, output.button_buy_now);
              await waitSelector(pageMobile, `.product__price>>text=${output.type_currency}`);
              await verifyChangeCurrency({
                page: pageMobile,
                selector: price,
                currLast: output.type_price,
                currFirst: output.type_currency,
              });
              expect(await pageMobile.innerText(languageCurrencyActive)).toBe(output.global_active);
            }
          }
        });
      });
    });
  }
});
