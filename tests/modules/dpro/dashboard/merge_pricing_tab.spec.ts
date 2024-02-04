import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { Chapter, Pricing } from "@types";

test.describe("Merge Pricing tab @SB_SC_SCP", () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;

  test.beforeEach(async ({ conf, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
  });

  test.beforeAll(async ({ conf, authRequest }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    //Get product id
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    // Delete product
    await productAPI.deleteProduct(IdsArray);
  });

  test(`@SB_SC_SCP_411 Verify edit block Search engine listing preview ở General tab`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.products.length; i++) {
      const productInfo = conf.caseConf.products[i];

      await test.step(`Pre-condition: Create Product ${productInfo.product_type}`, async () => {
        await productPage.goto(`/admin/creator/products`);
        await productPage.openAddProductScreen();
        await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
        await productPage.inputProductDescription(productInfo.description);
        await productPage.clickSaveBar();
        await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
        await productPage.genLoc(".sb-toast__message").waitFor({ state: "hidden" });
      });

      await test.step(`Xác nhận trạng thái default của trường Page title`, async () => {
        await expect(await productPage.genLoc(productPage.xpathProductTitle).inputValue()).toEqual(productInfo.title);
        await expect(await productPage.genLoc(productPage.xpathPageTitle).inputValue()).toEqual(productInfo.title);
      });

      await test.step(`Edit Page title > save`, async () => {
        await productPage.inputPageTitle(productInfo.page_title);
        await productPage.clickSaveBar();

        await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
        await productPage.genLoc(".sb-toast__message").waitFor({ state: "hidden" });

        await expect(await productPage.genLoc(productPage.xpathProductTitle).inputValue()).toEqual(productInfo.title);
        await expect(await productPage.genLoc(productPage.xpathPageTitle).inputValue()).toEqual(productInfo.page_title);
      });

      await test.step(`Edit Title > save`, async () => {
        await productPage.inputProductTitle(productInfo.title_edit);
        await productPage.clickSaveBar();
        await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
        await productPage.genLoc(".sb-toast__message").waitFor({ state: "hidden" });
        await expect(await productPage.genLoc(productPage.xpathPageTitle).inputValue()).toEqual(productInfo.title_edit);
      });
      await test.step(`Xác nhận trạng thái default của trường Meta description`, async () => {
        await expect(await productPage.genLoc(productPage.xpathMetaDescription).inputValue()).toEqual(
          productInfo.description,
        );
      });
      await test.step(`Edit Meta description > save`, async () => {
        await productPage.inputMetaDescription(productInfo.meta_description);
        await productPage.page.waitForTimeout(500);
        await productPage.clickSaveBar();
        await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
        await productPage.genLoc(".sb-toast__message").waitFor({ state: "hidden" });
        await expect(await productPage.getProductDescription()).toEqual(productInfo.description);
      });

      await test.step(`Edit Description > save`, async () => {
        await productPage.inputProductDescription(productInfo.description_edit);
        await productPage.clickSaveBar();
        await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
        await productPage.genLoc(".sb-toast__message").waitFor({ state: "hidden" });

        await expect(await productPage.genLoc(productPage.xpathMetaDescription).inputValue()).toEqual(
          productInfo.description_edit,
        );
      });
    }
  });

  test(`@SB_SC_SCP_412 Verify add pricing option với product online course chưa có content`, async ({ conf }) => {
    await test.step(`Pre-condition: Create Product`, async () => {
      await productPage.goto(`/admin/creator/products`);
      await productPage.openAddProductScreen();
      await productPage.addNewProduct(
        conf.caseConf.product.title,
        conf.caseConf.product.product_type,
        conf.caseConf.product.handle,
      );
    });

    await test.step(`Thực hiện add 2 pricing option cho product `, async () => {
      for (const pricing of conf.caseConf.pricing_list) {
        if (pricing.add_new) {
          await productPage.clickBtnAddPricingOption();
        }
        await productPage.addPricingOption(pricing);
      }
      await productPage.clickSaveBar();
      await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
      await productPage.genLoc(".sb-toast__message").waitFor({ state: "hidden" });
    });

    await test.step(`Tab content > add Chapter > add Lesson`, async () => {
      await productPage.switchTab("Content");
      for (const chapter of conf.caseConf.chapters) {
        await productPage.clickBtnAddChapter();
        await productPage.addChapter(chapter);
      }
    });

    await test.step(`Tab Access > Verify access content của các pricing options`, async () => {
      await productPage.switchTab("Access");
      let chapter: Chapter;
      let pricing: Pricing;

      for (pricing of conf.caseConf.pricing_list) {
        for (chapter of conf.caseConf.chapters) {
          for (const lesson of chapter.lessons) {
            const statusAccess = await productPage.getStatusAccess(pricing.name, lesson.title);
            await expect(statusAccess).toEqual(false);
          }
        }
      }
    });
    await test.step(`Thực hiện add thêm 1 pricing option cho product `, async () => {
      await productPage.switchTab("General");
      for (const pricing of conf.caseConf.pricing_list_update) {
        if (pricing.add_new) {
          await productPage.clickBtnAddPricingOption();
        }
        await productPage.addPricingOption(pricing);
      }

      await productPage.clickSaveBar();
      await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
    });

    await test.step(`Tab Access > Verify access content của các pricing options`, async () => {
      await productPage.switchTab("Access");
      let chapter: Chapter;
      let pricing: Pricing;

      for (pricing of conf.caseConf.pricing_list_update) {
        for (chapter of conf.caseConf.chapters) {
          for (const lesson of chapter.lessons) {
            expect(await productPage.getStatusAccess(pricing.name, lesson.title)).toEqual(true);
          }
        }
      }
    });
  });

  test(`@SB_SC_SCP_413 Verify add pricing option với product online course có content`, async ({ conf }) => {
    await test.step(`Pre-condition: Create Product`, async () => {
      await productPage.goto(`/admin/creator/products`);
      await productPage.openAddProductScreen();
      await productPage.addNewProduct(
        conf.caseConf.product.title,
        conf.caseConf.product.product_type,
        conf.caseConf.product.handle,
      );
      await productPage.switchTab("Content");
      for (const chapter of conf.caseConf.chapters) {
        await productPage.clickBtnAddChapter();
        await productPage.addChapter(chapter);
      }
    });

    await test.step(`Thực hiện add 2 pricing option cho product`, async () => {
      await productPage.switchTab("General");
      for (const pricing of conf.caseConf.pricing_list) {
        if (pricing.add_new) {
          await productPage.clickBtnAddPricingOption();
        }
        await productPage.addPricingOption(pricing);
      }
      await productPage.clickSaveBar();
      await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
    });
    await test.step(`Tab Access `, async () => {
      await productPage.switchTab("Access");
      let chapter: Chapter;
      let pricing: Pricing;

      for (pricing of conf.caseConf.pricing_list) {
        for (chapter of conf.caseConf.chapters) {
          for (const lesson of chapter.lessons) {
            await expect(await productPage.getStatusAccess(pricing.name, lesson.title)).toEqual(true);
          }
        }
      }
    });
    await test.step(`Edit access content của các pricing options > save`, async () => {
      await productPage.switchTab("Access");
      for (const access of conf.caseConf.access) {
        await productPage.editAccess(access.package, access.lesson_access);
      }
      await productPage.genLoc("//div[contains(@class,'access')]//button[child::*[normalize-space()='Save']]").click();
      await expect(productPage.genLoc(".sb-toast__message")).toHaveText("Updated access successfully!");
    });
    await test.step(`Delete 1 pricing options > add thêm 1 pricing option > save`, async () => {
      await productPage.switchTab("General");
      for (const pricing of conf.caseConf.pricing_list_update) {
        if (pricing.delete) {
          await productPage.deletePricing(pricing.name);
        } else {
          if (pricing.add_new) {
            await productPage.clickBtnAddPricingOption();
          }
          await productPage.addPricingOption(pricing);
        }
      }
      await productPage.clickSaveBar();
      await expect(await productPage.genLoc(".sb-toast__message")).toHaveText("Update product successfully");
    });
    await test.step(`Tab Access > Verify access content của các pricing options`, async () => {
      await productPage.switchTab("Access");
      let chapter: Chapter;
      let pricing: Pricing;

      for (pricing of conf.caseConf.pricing_list_update) {
        if (pricing.delete) {
          const listPricing = productPage.genLoc(productPage.xpathListPricing).allTextContents();
          await expect(listPricing).not.toContain(pricing.name);
          break;
        }
        for (chapter of conf.caseConf.chapters) {
          for (const lesson of chapter.lessons) {
            await expect(await productPage.getStatusAccess(pricing.name, lesson.title)).toEqual(true);
          }
        }
      }
    });
  });
});
