import { test, expect } from "@fixtures/website_builder";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { BrowserContext } from "@playwright/test";
import { SFHome } from "@pages/storefront/homepage";

let context: BrowserContext;
let homePage: SFHome;
let shopDomain;

const loginWithCredentials = async ({ conf, browser }) => {
  const ctx = await browser.newContext();
  const newPage = await ctx.newPage();
  const page = new DashboardPage(newPage, conf.domain);
  await page.page.bringToFront();
  const token = await page.getAccessToken({
    shopId: conf.shop_id,
    userId: conf.user_id,
    baseURL: conf.api,
    username: conf.username,
    password: conf.password,
  });
  await page.loginWithToken(token);
  return {
    page,
    token,
    ctx,
  };
};

test.describe("Customize static page plb", () => {
  let otherPage: OtherPage;
  test.beforeAll(async ({ conf, browser }) => {
    shopDomain = conf.suiteConf.domain;
    test.setTimeout(conf.suiteConf.time_out);
    const shopMerchantConf = Object.assign({ api: conf.suiteConf.api }, conf.suiteConf);

    const [{ page: mcPage, token: mcToken, ctx }] = await Promise.all([
      loginWithCredentials({ conf: shopMerchantConf, browser }),
    ]);
    context = ctx;

    otherPage = new OtherPage(mcPage.page, conf.suiteConf.domain);
    otherPage.setAccessToken(mcToken);
  });

  test("@SB_NEWECOM_SP_29 - [PLB] Verify các action trong list page của shop PLB được pull từ shop template", async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;
    const webPages = caseConf.web_pages;
    const templatePolicyPages = caseConf.template_policy_pages;

    await test.step("Vào dashboard shop PLB > Online Store > Pages", async () => {
      //Verify web pages
      await otherPage.goToUrlPath();
      const pages = await otherPage.getAllPagesDisplayed();

      let markValid = {};
      const validPages = pages.filter(page => {
        const webPage = webPages.find(webPage => webPage.title.toLowerCase() === page.title.toLowerCase());
        if (webPage && `/pages/${webPage.handle}` === page.handle && !markValid[webPage.handle]) {
          markValid[page.handle] = true;
          return true;
        } else {
          markValid[page.handle] = false;
        }
        return false;
      });

      expect(validPages.length).toBe(webPages.length);
      expect(pages.find(page => page.title === "DMCA")).toBeUndefined();
      expect(pages.find(page => page.title === "Intellectual Property Violation")).toBeUndefined();

      //verify policy pages on SF
      await otherPage.clickElementWithLabel("div", "Policy Pages");
      const policyPages = await otherPage.getAllPolicyPages();
      markValid = {};
      const validPolicyPages = policyPages.filter(page => {
        const templatePolicyPage = templatePolicyPages.find(
          templatePolicyPage => templatePolicyPage.title === page.title,
        );
        if (
          templatePolicyPage &&
          `/policies/${templatePolicyPage.handle}` === page.handle &&
          !markValid[templatePolicyPage.handle]
        ) {
          markValid[page.handle] = true;
          return true;
        } else {
          markValid[page.handle] = false;
        }
        return false;
      });
      expect(validPolicyPages.length).toBe(templatePolicyPages.length);
    });

    await test.step("Verify các page ngoài SF", async () => {
      //View web pages
      await otherPage.clickElementWithLabel("div", "Web Pages");
      for (const webPage of webPages) {
        await otherPage.genLoc(otherPage.getCustomizeButtonOfPage(webPage.title)).first().hover();
        const [previewPage] = await Promise.all([
          context.waitForEvent("page"),
          await otherPage.genLoc(otherPage.getPreviewButtonOfPage(webPage.title)).first().click(),
        ]);
        homePage = new SFHome(previewPage, shopDomain);
        await homePage.page.waitForLoadState();
        await homePage.page.bringToFront();
        await homePage.page.waitForURL(new RegExp(".*/pages/.*"));
        const pageUrl = homePage.page.url();
        const url = new URL(pageUrl);
        expect(url.pathname === `/pages/${webPage.handle}`).toBe(true);
        await expect(async () => {
          expect(await homePage.isTextVisible(webPage.display_text, webPage.index)).toBe(true);
        }).toPass();
        previewPage.close();
      }

      //View policy pages on SF
      await otherPage.clickElementWithLabel("div", "Policy Pages");
      for (const policyPage of templatePolicyPages) {
        await otherPage.genLoc(otherPage.getCustomizeButtonOfPage(policyPage.title)).first().hover();
        const [previewPage] = await Promise.all([
          context.waitForEvent("page"),
          await otherPage.genLoc(otherPage.getPreviewButtonOfPage(policyPage.title)).first().click(),
        ]);
        homePage = new SFHome(previewPage, shopDomain);
        await homePage.page.waitForLoadState("load");
        await homePage.page.bringToFront();
        await homePage.page.waitForURL(new RegExp(".*/policies/.*"));
        const pageUrl = homePage.page.url();
        const url = new URL(pageUrl);
        expect(url.pathname === `/policies/${policyPage.handle}`).toBe(true);
        await expect(async () => {
          expect(await homePage.isTextVisible(policyPage.display_text, 2)).toBe(true);
        }).toPass();
        previewPage.close();
      }
    });
  });
});
