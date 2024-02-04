import { test } from "@fixtures/theme";
import { SFHome } from "@pages/storefront/homepage";
import { expect } from "@core/fixtures";
import type { ShopTheme } from "@types";

/* Set data:
    - Default collection template of publish theme: FAQs section has heading = "default template"
*/
let shopTheme: ShopTheme;
let collectionID = 0;
let collectionHandle = "";

const gotoCollection = async (page, conf) => {
  const sfHome = new SFHome(page, conf.suiteConf.domain);
  await sfHome.gotoCollection(collectionHandle);
};

test.describe("Check collection page on SF", async () => {
  test.beforeEach(async ({ conf, authRequest, theme }) => {
    await test.step("Create collection by API", async () => {
      const endpoint = `https://${conf.suiteConf.domain}/admin/collections/custom.json`;
      const rawThemeResponse = await authRequest.post(endpoint, {
        data: conf.suiteConf.collection_data,
      });
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response = await rawThemeResponse.json();
      collectionID = await response.custom_collection.id;
      collectionHandle = await response.custom_collection.handle;
    });

    await test.step("Create template by API", async () => {
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      const data = conf.suiteConf.init_data;
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

      data.another_collection_id = await conf.suiteConf.another_collection_id;
      data.template_data.shop_id = await conf.suiteConf.shop_id;
      await theme.createTemplate({
        templateData: data.template_data,
        shopThemeID: shopTheme.id,
      });
    });
  });

  test.afterEach(async ({ conf, authRequest }) => {
    await test.step("Delete collection", async () => {
      const endpoint = `https://${conf.suiteConf.domain}/admin/collections/custom/${collectionID}.json`;
      const responseDelete = await authRequest.delete(endpoint);
      expect(responseDelete.ok()).toBeTruthy();
    });
  });

  test("Check collection on SF when apply template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_4", async ({
    authRequest,
    conf,
    page,
  }) => {
    const data = conf.caseConf.data;

    await test.step("Assign template for collection 1 by API", async () => {
      //Get collection's current template
      const endpointGet = `https://${conf.suiteConf.domain}/admin/collections/${collectionID}.json`;
      const rawThemeResponse = await authRequest.get(endpointGet);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response1 = await rawThemeResponse.json();
      //Update Template for collection
      response1.template = data.template_handle;
      const updateTemplate = {
        custom_collection: response1,
        is_create_redirect: false,
      };
      const endpointPut = `https://${conf.suiteConf.domain}/admin/collections/custom/${collectionID}.json`;
      const updateCollection = await authRequest.put(endpointPut, {
        data: updateTemplate,
      });
      expect(updateCollection.ok()).toBeTruthy();
    });

    await test.step("Check collection on SF", async () => {
      await gotoCollection(page, conf);
      //Verify FAQs section
      await expect(await page.locator('[type="heovzs"]')).toBeVisible();
      await expect(await page.locator('[type="heovzs"] .lp-mb16')).toHaveText(`${data.template_name}`);
      //Verify collection list section
      await expect(await page.locator('[data-id="collection_page"]')).toBeVisible();
      //Verify Button section
      await expect(await page.locator('[type="xnaguv"]')).toBeVisible();
      //Verify Contact form section
      await expect(await page.locator('[type="hqwfku"]')).toBeVisible();
    });

    await test.step("Check another collection still apply defautl template", async () => {
      //Verify another collection on SF
      const sfHome = new SFHome(page, conf.suiteConf.domain);
      await sfHome.gotoCollection(data.another_collection_handle);
      //Verify FAQs section
      await expect(await page.locator('[type="heovzs"]')).toBeVisible();
      await expect(await page.locator('[type="heovzs"] .lp-mb16')).toHaveText("default template");
      //Verify collection list section
      await expect(await page.locator('[data-id="collection_page"]')).toBeVisible();
    });
  });

  test("Check collection on SF when edit template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_5", async ({
    authRequest,
    conf,
    page,
    theme,
  }) => {
    const data = conf.caseConf.data;

    await test.step("Pre-condition: Assign template for collection 1 by API", async () => {
      //Get collection's current template
      const endpointGet = `https://${conf.suiteConf.domain}/admin/collections/${collectionID}.json`;
      const rawThemeResponse = await authRequest.get(endpointGet);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response1 = await rawThemeResponse.json();
      //Update Template for collection
      response1.template = data.template_handle;
      const updateTemplate = {
        custom_collection: response1,
        is_create_redirect: false,
      };
      const endpointPut = `https://${conf.suiteConf.domain}/admin/collections/custom/${collectionID}.json`;
      const updateCollection = await authRequest.put(endpointPut, {
        data: updateTemplate,
      });
      expect(updateCollection.ok()).toBeTruthy();
    });

    await test.step("Edit template data by API", async () => {
      const templateId = await theme.getFirstIdOfTemplates();
      await theme.updateTemplate({
        templateId: templateId,
        templateName: data.template_name_edit,
        addData: data.add_data,
      });
    });

    await test.step("Verify collection still apply edited template", async () => {
      // Get collection's current template
      const endpointGet = `https://${conf.suiteConf.domain}/admin/collections/${collectionID}.json`;
      const rawThemeResponse = await authRequest.get(endpointGet);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response1 = await rawThemeResponse.json();
      expect(response1.tempalte === data.template_handle);
      await gotoCollection(page, conf);
      //Verify FAQs section
      await expect(await page.locator('[type="heovzs"]')).toBeVisible();
      //Verify collection list section
      await expect(await page.locator('[data-id="collection_page"]')).toBeVisible();
      //Verify Button section
      await expect(await page.locator('[type="xnaguv"]')).toBeVisible();
      //Verify Contact form section
      await expect(await page.locator('[type="hqwfku"]')).toBeVisible();
      //Verify Hero section
      await expect(await page.locator('[type="owgmle"]')).toBeVisible();
    });
  });

  test("Check displaying collection on SF when delete template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_6", async ({
    conf,
    page,
    theme,
  }) => {
    await test.step("Delete template by API", async () => {
      const templateId = await theme.getFirstIdOfTemplates();
      await theme.deleteTemplate({
        templateId: templateId,
        shopThemeId: shopTheme.id,
      });
    });

    await test.step("Verify collection was applying default template", async () => {
      await gotoCollection(page, conf);
      //Verify FAQs section
      await expect(await page.locator('[type="heovzs"]')).toBeVisible();
      await expect(await page.locator('[type="heovzs"] .lp-mb16')).toHaveText("default template");
      //Verify collection list section
      await expect(await page.locator('[data-id="collection_page"]')).toBeVisible();
    });
  });
});
