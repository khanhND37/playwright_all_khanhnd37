import { test } from "@fixtures/theme";
import { SFHome } from "@pages/storefront/homepage";
import { expect } from "@core/fixtures";
import type { ShopTheme } from "@types";

let shopTheme: ShopTheme;
let productID = 0;
let productHandle = "";

const gotoProduct = async (page, conf) => {
  const sfHome = new SFHome(page, conf.suiteConf.domain);
  await sfHome.gotoProduct(productHandle);
};

test.describe("Check product page @TS_INS_SF_Product_Template_LIST", async () => {
  test.beforeEach(async ({ conf, authRequest, theme }) => {
    await test.step("Create product by API", async () => {
      const endpoint = `https://${conf.suiteConf.domain}/admin/products.json`;
      const rawThemeResponse = await authRequest.post(endpoint, {
        data: conf.suiteConf.product_data,
      });
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response = await rawThemeResponse.json();
      productID = await response.product.id;
      productHandle = await response.product.handle;
    });

    const data = conf.suiteConf.init_data;
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

      data.another_product_id = await conf.suiteConf.another_product_id;
      data.template_data.shop_id = await conf.suiteConf.shop_id;
      await theme.createTemplate({
        templateData: data.template_data,
        shopThemeID: shopTheme.id,
      });
    });
  });

  test.afterEach(async ({ conf, authRequest }) => {
    await test.step("Delete product", async () => {
      const endpoint = `https://${conf.suiteConf.domain}/admin/products/${productID}.json`;
      const responseDelete = await authRequest.delete(endpoint);
      expect(responseDelete.ok()).toBeTruthy();
    });
  });

  test("Check product on SF when apply template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_1", async ({
    authRequest,
    conf,
    page,
  }) => {
    const data = conf.suiteConf.init_data;

    await test.step("Assign template for product", async () => {
      //Get product's current template
      const endpoint = `https://${conf.suiteConf.domain}/admin/products/${productID}.json`;
      const rawThemeResponse = await authRequest.get(endpoint);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response = await rawThemeResponse.json();
      //Update product's Template
      response.product.template = data.template_handle;
      const updateProduct = await authRequest.put(endpoint, {
        data: response,
      });
      expect(updateProduct.ok()).toBeTruthy();
    });

    await test.step("Verify product apply template on SF", async () => {
      await gotoProduct(page, conf);
      //verify Custom HTML section on SF
      await expect(await page.locator('[type="custom-html"]')).toBeVisible();
      await expect(await page.locator('[type="custom-html"] .col-12 div')).toHaveText(`${data.template_name}`);
      //verify product section on SF
      await expect(await page.locator('[data-id="product"]')).toBeVisible();
      //verify Collection list section on SF
      await expect(await page.locator('[type="collection-list"]')).toBeVisible();
      //verify Newsletter section on SF
      await expect(await page.locator('[type="newsletter"]')).toBeVisible();
      await expect(await page.locator('[type="newsletter"] h2')).toHaveText("abc");
      await expect(await page.locator('[type="newsletter"] .container-fluid')).toBeVisible();
    });

    await test.step("Another product still apply default template", async () => {
      //Get product's current template
      const endpoint = `https://${conf.suiteConf.domain}/admin/` + `products/${data.another_product_id}.json`;
      const rawThemeResponse = await authRequest.get(endpoint);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response = await rawThemeResponse.json();
      expect(response.product.template === "");
      //Verify another product on SF
      const sfHome = new SFHome(page, conf.suiteConf.domain);
      await sfHome.gotoProduct(data.another_product_handle);
      await expect(await page.locator('[type="custom-html"]')).toBeVisible();
      await expect(await page.locator('[type="custom-html"] .col-12 div')).toHaveText("default template");
      await expect(await page.locator('[data-id="product"]')).toBeVisible();
      await expect(await page.locator('[type="collection-list"]')).toBeVisible();
    });
  });

  test("Check displaying product on SF when edit template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_2", async ({
    conf,
    page,
    authRequest,
    theme,
  }) => {
    await test.step("Pre-condition: Assign template for product", async () => {
      const data = conf.suiteConf.init_data;
      //Get product's current template
      const endpoint = `https://${conf.suiteConf.domain}/admin/products/${productID}.json`;
      const rawThemeResponse = await authRequest.get(endpoint);
      expect(rawThemeResponse.ok()).toBeTruthy();
      const response = await rawThemeResponse.json();
      //Update product's Template
      response.product.template = data.template_handle;
      const updateProduct = await authRequest.put(endpoint, {
        data: response,
      });
      expect(updateProduct.ok()).toBeTruthy();
    });

    const data = conf.caseConf.data;
    await test.step("Edit template", async () => {
      const templateId = await theme.getFirstIdOfTemplates();
      await theme.updateTemplate({
        templateId: templateId,
        templateName: data.template_name_edit,
        addData: data.add_data,
      });
    });
    await test.step("Verify product still apply edited template", async () => {
      //Get current product's template
      const endpoint1 = `https://${conf.suiteConf.domain}/admin/products/${productID}.json`;
      const rawThemeResponse1 = await authRequest.get(endpoint1);
      expect(rawThemeResponse1.ok()).toBeTruthy();
      const response1 = await rawThemeResponse1.json();
      expect(response1.product.template === data.template_handle);
      //Verify display product on SF
      await gotoProduct(page, conf);
      await page.reload();
      //verify custom HTML section
      await expect(await page.locator('[type="custom-html"]')).toBeVisible();
      await expect(await page.locator('[type="custom-html"] .col-12 div')).toHaveText(`${data.template_name}`);
      //verify product section
      await expect(await page.locator('[data-id="product"]')).toBeVisible();
      //verify collection list section
      await expect(await page.locator('[type="collection-list"]')).toBeVisible();
      //verify newsletter section
      await expect(await page.locator('[type="newsletter"]')).toBeVisible();
      await expect(await page.locator('[type="newsletter"] h2')).toHaveText("abc");
      await expect(await page.locator('[type="newsletter"] .container-fluid')).toBeVisible();
      //verify video slider section
      await expect(await page.locator('[type="video-slider"]')).toBeVisible();
    });
  });

  test("Check displaying product on SF when delete template @SB_OLS_THE_INS_SF_MULTIPLE_TEMPLATE_3", async ({
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

    await test.step("Verify product was applying default template", async () => {
      await gotoProduct(page, conf);
      await page.reload();
      await expect(await page.locator('[type="custom-html"]')).toBeVisible();
      await expect(await page.locator('[type="custom-html"] .col-12 div')).toHaveText("default template");
      await expect(await page.locator('[data-id="product"]')).toBeVisible();
      await expect(await page.locator('[type="collection-list"]')).toBeVisible();
    });
  });
});
