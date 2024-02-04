import { test, expect } from "@fixtures/website_builder";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DomainCredentials } from "@core/utils/token";
import { PageResponse } from "@types";

let shopTemplateCredentials: DomainCredentials;

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

// Không cho run trên production do update page trên shop template sẽ ảnh hưởng đến shop khách

test.describe("Add static page on shop template printbase", () => {
  let otherPage: OtherPage;
  let templatePage: OtherPage;
  let createdPage: PageResponse;

  test.beforeAll(async ({ conf, browser }) => {
    const shopMerchantConf = Object.assign({ api: conf.suiteConf.api }, conf.suiteConf);
    const shopTemplateConf = Object.assign({ api: conf.suiteConf.api }, conf.suiteConf.pb_template);

    const [{ page: mcPage, token: mcToken }, { page: tmplPage, token: tmpltoken }] = await Promise.all([
      loginWithCredentials({ conf: shopMerchantConf, browser }),
      loginWithCredentials({ conf: shopTemplateConf, browser }),
    ]);

    otherPage = new OtherPage(mcPage.page, conf.suiteConf.domain);
    otherPage.setAccessToken(mcToken);

    templatePage = new OtherPage(tmplPage.page, conf.suiteConf.pb_template.domain);
    templatePage.setAccessToken(tmpltoken);

    shopTemplateCredentials = {
      domain: shopTemplateConf.domain,
      username: shopTemplateConf.username,
      userId: shopTemplateConf.user_id,
      password: shopTemplateConf.password,
    };
  });

  test("@SB_NEWECOM_SP_34 - Verify add page trong shop template", async ({ conf, builder }) => {
    const caseConf = conf.caseConf;

    await test.step("Vào shop template PLB > Click Online store > Pages > Add new page", async () => {
      const payload = caseConf.create_template_page.payload;
      const templateId = conf.suiteConf.template_id;

      // create page + assign template
      createdPage = await templatePage.createPage(payload);
      await builder.applyTemplate(
        {
          productId: createdPage.id,
          templateId: templateId,
          type: "page",
        },
        shopTemplateCredentials,
      );

      await templatePage.goToUrlPath();

      const newPage = await templatePage.isPageExistedInOldList(createdPage.title);
      expect(newPage).toBeTruthy();
    });

    await test.step("Vào store MC > Click Online store > Pages", async () => {
      await otherPage.goToUrlPath();
      const newPage = await otherPage.getPageDisplayedInList(createdPage.handle);

      expect(newPage).toBeTruthy();
    });

    await test.step("Vào shop template PLB > Click Online store > Pages > Delete page", async () => {
      await templatePage.deletePage(createdPage.id);

      await templatePage.goToUrlPath();
      const exist = await templatePage.isPageExistedInOldList(createdPage.title);
      expect(exist).toBeFalsy();
    });

    await test.step("Vào store MC > Click Online store > Pages", async () => {
      await otherPage.goToUrlPath();
      const pages = await otherPage.getAllPagesDisplayed();
      expect(
        pages.find(page => page.handle === `/pages/${createdPage.handle}` && page.title === createdPage.title),
      ).toBeFalsy();
    });
  });
});
