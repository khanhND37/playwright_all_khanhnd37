import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { SFHome } from "@sf_pages/homepage";
import { PolicyPage } from "@pages/storefront/policy_page";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { Footer } from "@pages/storefront/footer";

let shopDomain: string;
let homePage: SFHome;
let numberOfPolicies: number;
let policyPage: PolicyPage;

test.describe("Policy translate PB/PLB", () => {
  test.beforeEach(async ({ page, conf }) => {
    shopDomain = conf.suiteConf.domain;
    numberOfPolicies = conf.suiteConf.number_of_policies;
    homePage = new SFHome(page, shopDomain);
    await homePage.gotoHomePage();
  });

  test(`@SB_NEWECOM_SP_40 Verify policy được lấy từ legal page ( trên cả v2 và v3)`, async ({ conf }) => {
    await test.step(`Open SF >  Click policy links ở footer`, async () => {
      policyPage = new PolicyPage(homePage.page, shopDomain);
      let i = 0;
      do {
        await policyPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].page);
        await policyPage.page.waitForLoadState("networkidle");

        expect(await policyPage.isTextVisible(conf.caseConf.data[i].title, 2)).toBe(true);
        expect(policyPage.page.url()).toContain(`https://${conf.suiteConf.domain}${conf.caseConf.data[i].path}`);
        await expect(async () => {
          expect(await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.data[i].custom_text))).toBe(
            true,
          );
        }).toPass();
        i++;
      } while (i < numberOfPolicies);
    });
  });

  test(`@SB_NEWECOM_SP_41 [PB/PLB/SB] Verify policy page hiển thị đúng theo ngôn ngữ đã chọn ở storefront`, async ({
    conf,
  }) => {
    await test.step(`Mở storefront > Click policy link ở footer `, async () => {
      expect(await homePage.isTextVisible(conf.suiteConf.default_global_switcher)).toBe(true);
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

    await test.step(`Click Global switcher ở footer > Change language: choose German > click Done`, async () => {
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.selected_language);
      await homePage.page.waitForLoadState("load");
      await scrollUntilElementIsVisible({
        page: homePage.page,
        scrollEle: homePage.page.locator(Footer.selectorFooter),
        viewEle: homePage.page.locator(Footer.selectorFooter),
      });

      await expect(async () => {
        expect(await policyPage.isTextVisible("| Deutsch (DE) | USD")).toBe(true);
      }).toPass();
      let i = 0;
      do {
        await policyPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].page_change_language);
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
