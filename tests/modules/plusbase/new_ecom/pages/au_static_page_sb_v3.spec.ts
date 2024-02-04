import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { SFHome } from "@sf_pages/homepage";
import { PolicyPage } from "@pages/storefront/policy_page";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";

let shopDomain: string;
let homePage: SFHome;
let numberOfPolicies: number;
let policyPage: PolicyPage;

test.describe("Policy translate SB theme v3", () => {
  test.beforeEach(async ({ page, conf }) => {
    shopDomain = conf.suiteConf.domain;
    numberOfPolicies = conf.suiteConf.number_of_policies;
    homePage = new SFHome(page, shopDomain);
    await homePage.gotoHomePage();
  });

  test(`@SB_NEWECOM_SP_44 [SB] Verify policy page hiển thị đúng theo ngôn ngữ đã chọn ở storefront (theme v3)`, async ({
    conf,
  }) => {
    await test.step(`Mở storefront > Click policy link ở footer`, async () => {
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

    await test.step(`Click Global switcher ở footer> Change language: choose German > click Done> Click policy link ở footer`, async () => {
      //Change language on SF
      await homePage.selectStorefrontLanguage(conf.caseConf.language, conf.caseConf.theme);
      await homePage.page.waitForLoadState("load");
      await scrollUntilElementIsVisible({
        page: homePage.page,
        scrollEle: homePage.page.locator(homePage.xpathBlockGlobalSwitcher).last(),
        viewEle: homePage.page.locator(homePage.xpathBlockGlobalSwitcher).last(),
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
