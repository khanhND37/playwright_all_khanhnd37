import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { SFHome } from "@sf_pages/homepage";
import { PolicyPage } from "@pages/storefront/policy_page";

let shopDomain: string;
let numberOfPolicies: number;
let homePage: SFHome;
let policyPage: PolicyPage;

test.describe("Policy translate SB theme v2", () => {
  test.beforeEach(async ({ page, conf }) => {
    shopDomain = conf.suiteConf.domain;
    numberOfPolicies = conf.suiteConf.number_of_policies;
    homePage = new SFHome(page, shopDomain);
    await homePage.gotoHomePage();
  });

  test(`@SB_NEWECOM_SP_43 [SB] Verify policy được lấy từ legal page theme v2`, async ({ conf }) => {
    await test.step(`Open SF > Click policy links ở footer`, async () => {
      policyPage = new PolicyPage(homePage.page, shopDomain);
      let i = 0;
      do {
        await policyPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].page);
        await policyPage.page.waitForLoadState("networkidle");
        await expect(async () => {
          expect(await policyPage.isTextVisible(conf.caseConf.data[i].title_default_lang, 2)).toBe(true);
        }).toPass();
        await expect(async () => {
          expect(await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.data[i].custom_text))).toBe(
            true,
          );
        }).toPass();

        i++;
      } while (i < numberOfPolicies);
    });

    await test.step(`Change language > Click policy link ở footer`, async () => {
      //Change language on SF
      await homePage.selectStorefrontLanguage(
        conf.caseConf.language,
        conf.caseConf.theme,
        conf.caseConf.language_symbol,
      );
      await policyPage.page.evaluate(() => {
        window.scrollBy(0, document.body.scrollHeight);
      });

      //Click policy link sau khi change language
      let i = 0;
      do {
        await policyPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].page);
        await policyPage.page.waitForLoadState("networkidle");
        await expect(async () => {
          expect(
            await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.data[i].custom_text_translate)),
          ).toBe(true);
        }).toPass();
        i++;
      } while (i < numberOfPolicies);
    });
  });
});
