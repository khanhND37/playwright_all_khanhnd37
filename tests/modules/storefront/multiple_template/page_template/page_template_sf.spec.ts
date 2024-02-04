import { test } from "@fixtures/theme";
import { SFHome } from "@pages/storefront/homepage";
import { expect } from "@core/fixtures";
import type { ShopTheme } from "@types";

let shopTheme: ShopTheme;
let pageID = 0;
let pageHandle = "";

const gotoPage = async (page, conf) => {
  const sfHome = new SFHome(page, conf.suiteConf.domain);
  await sfHome.gotoPage(pageHandle);
};

test.describe("Check page on SF", async () => {
  test.beforeEach(async ({ conf, theme, authRequest }) => {
    await test.step("Create page by API", async () => {
      const endpoint = `https://${conf.suiteConf.domain}/admin/pages.json`;
      const rawThemeResponse = await authRequest.post(endpoint, {
        data: conf.suiteConf.page_data,
      });
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response = await rawThemeResponse.json();
      pageID = await response.page.id;
      pageHandle = await response.page.handle;
    });

    const data = conf.suiteConf.page_template_init;
    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }
    await test.step("Create template by API", async () => {
      await test.step("Delete all template", async () => {
        const endpoint = `https://${conf.suiteConf.domain}/admin/themes/templates.json`;
        const rawThemeResponse = await authRequest.get(endpoint);
        expect(rawThemeResponse.ok()).toBeTruthy();
        const response = await rawThemeResponse.json();

        for (let i = 0; i < response.result.templates.length; i++) {
          const templateID = response.result.templates[i].id;
          const endpointDelete = `https://${conf.suiteConf.domain}/admin/themes/template/${templateID}.json?shop_theme_id=${shopTheme.id}`;
          const rawThemeResponse = await authRequest.delete(endpointDelete);
          expect(rawThemeResponse.ok()).toBeTruthy();
        }
      });

      data.another_page_id = await conf.suiteConf.another_page_id;
      data.template_data.shop_id = await conf.suiteConf.shop_id;
      await theme.createTemplate({
        templateData: data.template_data,
        shopThemeID: shopTheme.id,
      });
    });
  });

  test.afterEach(async ({ conf, authRequest }) => {
    await test.step("Delete page by API", async () => {
      const endpoint = `https://${conf.suiteConf.domain}/admin/pages/${pageID}.json`;
      const responseDelete = await authRequest.delete(endpoint);
      expect(responseDelete.ok()).toBeTruthy();
    });
  });

  test("Check page on SF when apply template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_7", async ({
    authRequest,
    conf,
    page,
  }) => {
    const data = conf.caseConf.data;

    await test.step("Assign template for page 1 by API", async () => {
      //Get page's current template
      const endpointGet = `https://${conf.suiteConf.domain}/admin/pages/${pageID}.json`;
      const rawThemeResponse = await authRequest.get(endpointGet);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response1 = await rawThemeResponse.json();
      //Update Template for page
      response1.page.template = data.template_handle;
      const updateTemplateBody = {
        page: { ...response1.page, publish: true, is_create_redirect: false },
        is_create_redirect: false,
      };
      const endpointPut = `https://${conf.suiteConf.domain}/admin/pages/${pageID}.json`;
      const updatePage = await authRequest.put(endpointPut, {
        data: updateTemplateBody,
      });
      expect(updatePage.ok()).toBeTruthy();
    });

    await test.step("Check page on SF", async () => {
      await gotoPage(page, conf);
      //Verify FAQs section
      await expect(await page.locator('[type="heovzs"]')).toBeVisible();
      await expect(await page.locator('[type="heovzs"] .lp-mb16')).toHaveText(`${data.template_name}`);
      //Verify page section
      await expect(await page.locator(".other-page")).toBeVisible();
      //Verify Trust Indicators section
      await expect(await page.locator('[type="jtdvxc"]')).toBeVisible();
      //Verify Image Grid section
      await expect(await page.locator('[type="pbzsbf"]')).toBeVisible();
    });

    await test.step("Check another page still apply defautl template", async () => {
      //Verify another page on SF
      const sfHome = new SFHome(page, conf.suiteConf.domain);
      await sfHome.gotoPage(data.another_page_handle);
      //Verify FAQs section
      await expect(await page.locator('[type="heovzs"]')).toBeVisible();
      await expect(await page.locator('[type="heovzs"] .lp-mb16')).toHaveText("default template");
      //Verify page section
      await expect(await page.locator(".other-page")).toBeVisible();
    });
  });

  test("Check page on SF when edit template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_8", async ({
    authRequest,
    conf,
    page,
    theme,
  }) => {
    const data = conf.caseConf.data;
    await test.step("Pre-condition: assign template for page 1 by API", async () => {
      //Get page's current template
      const endpointGet = `https://${conf.suiteConf.domain}/admin/pages/${pageID}.json`;
      const rawThemeResponse = await authRequest.get(endpointGet);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response1 = await rawThemeResponse.json();
      //Update Template for page
      response1.page.template = data.template_handle;
      const updateTemplateBody = {
        page: { ...response1.page, publish: true, is_create_redirect: false },
        is_create_redirect: false,
      };
      const endpointPut = `https://${conf.suiteConf.domain}/admin/pages/${pageID}.json`;
      const updatePage = await authRequest.put(endpointPut, {
        data: updateTemplateBody,
      });
      expect(updatePage.ok()).toBeTruthy();
    });

    await test.step("Edit template data by API", async () => {
      const templateId = await theme.getFirstIdOfTemplates();
      await theme.updateTemplate({
        templateId: templateId,
        templateName: data.template_name_edit,
        addData: data.add_data,
      });
    });

    await test.step("Verify page still apply edited template", async () => {
      // Get page's current template
      const endpointGet = `https://${conf.suiteConf.domain}/admin/pages/${pageID}.json`;
      const rawThemeResponse = await authRequest.get(endpointGet);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response1 = await rawThemeResponse.json();
      expect(response1.tempalte === data.template_handle);
      await gotoPage(page, conf);
      //Verify FAQs section
      await expect(await page.locator('[type="heovzs"]')).toBeVisible();
      await expect(await page.locator('[type="heovzs"] .lp-mb16')).toHaveText(`${data.template_name}`);
      //Verify page section
      await expect(await page.locator(".other-page")).toBeVisible();
      //Verify Contact Us section
      await expect(await page.locator('[type="contact-us"]')).toBeVisible();
      //Verify Trust Indicators section
      await expect(await page.locator('[type="jtdvxc"]')).toBeVisible();
      //Verify Image Grid section
      await expect(await page.locator('[type="pbzsbf"]')).toBeVisible();
      //Verify Hero section
      await expect(await page.locator('[type="owgmle"]')).toBeVisible();
    });
  });

  test("Check displaying page when delete template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_9", async ({
    conf,
    page,
    theme,
  }) => {
    await test.step("Delete template by API", async () => {
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      const templateId = await theme.getFirstIdOfTemplates();
      await theme.deleteTemplate({
        templateId: templateId,
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify page was applying default template", async () => {
      await gotoPage(page, conf);
      //Verify FAQs section
      await expect(await page.locator('[type="heovzs"]')).toBeVisible();
      await expect(await page.locator('[type="heovzs"] .lp-mb16')).toHaveText("default template");
      //Verify page section
      await expect(await page.locator(".other-page")).toBeVisible();
    });
  });
});
