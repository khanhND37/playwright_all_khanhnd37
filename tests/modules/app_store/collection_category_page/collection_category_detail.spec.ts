import { AppstoreHomePage } from "@pages/app_store/homepage";
import { expect, test } from "@core/fixtures";

test.describe("Kiểm tra hiển thị trên Collection detail page", async () => {
  let homePage: AppstoreHomePage;

  test.beforeEach(async ({ page, conf }) => {
    homePage = new AppstoreHomePage(page, conf.suiteConf.domain);
  });

  test(`Kiểm tra thông tin hiển thị collection @SB_APPS_CP_18`, async ({ page, conf }) => {
    test.slow();
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const key = conf.caseConf.data[i];
      await homePage.goToCollectionOrCategoryDetail(key.type, key.handle);
      await homePage.page.waitForTimeout(5 * 1000);
      await page.waitForSelector(`//h1[normalize-space()='${key.collection_name}']`);
      await test.step(`Kiểm tra thông tin của collection: Tên collection, Mô tả collection,
      Số lượng app/feature đang Publish thuộc collection đó`, async () => {
        const collectionInf = await homePage.getCollectionOrCategoryInfDetailPage();
        expect(collectionInf).toEqual(
          expect.objectContaining({
            name: key.collection_name,
            description: key.description,
            handle: key.handle,
            totalApp: key.total_app,
          }),
        );
      });
    }
  });

  test(`Kiểm tra thông tin hiển thị của 1 app/feature @SB_APPS_CP_19`, async ({ page, conf }) => {
    await test.step(`Kiểm tra hiển thị logo một app/feature`, async () => {
      await homePage.goToCollectionOrCategoryDetail(conf.caseConf.type, conf.caseConf.collection_handle);
      await homePage.page.waitForTimeout(5 * 1000);
      await page.waitForSelector(`//h1[normalize-space()='${conf.caseConf.collection_name}']`);
      const appInfOfCollectionPage = await homePage.getAppInfOfCollectionOrCategoryDetailPage(conf.caseConf.app_name);
      expect(appInfOfCollectionPage).toEqual(
        expect.objectContaining({
          appName: conf.caseConf.app_name,
          shortDescription: conf.caseConf.short_description,
          logo: conf.caseConf.logo,
          price: conf.caseConf.price,
        }),
      );
    });

    await test.step(`Click vào bất kì vị trí nào thuộc box app/feature`, async () => {
      await page.locator(`//h5[normalize-space()='${conf.caseConf.app_name}']//ancestor::a`).click();
      await homePage.page.waitForTimeout(5 * 1000);
      await page.waitForSelector(`//h1[normalize-space()='${conf.caseConf.app_name}']`);
      expect(page.url()).toContain(conf.caseConf.handle);
    });
  });
});

test.describe("Kiểm tra hiển thị trên Category detail page", async () => {
  let homePage: AppstoreHomePage;

  test.beforeEach(async ({ page, conf }) => {
    homePage = new AppstoreHomePage(page, conf.suiteConf.domain);
  });
  test(`Kiểm tra thông tin hiển thị category @SB_APPS_CaP_19`, async ({ page, conf }) => {
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const key = conf.caseConf.data[i];
      await homePage.goToCollectionOrCategoryDetail(key.type, key.handle);
      await homePage.page.waitForTimeout(5 * 1000);
      await page.waitForSelector(`//h1[normalize-space()='${key.category_name}']`);
      await test.step(`Kiểm tra thông tin của category: Tên category; Mô tả category, Handle category;
    Số lượng app/feature đang Publish thuộc category đó`, async () => {
        const categoryInf = await homePage.getCollectionOrCategoryInfDetailPage();
        expect(categoryInf).toEqual(
          expect.objectContaining({
            name: key.category_name,
            description: key.description,
            handle: key.handle,
            totalApp: key.total_app,
          }),
        );
      });
    }
  });

  test(`Kiểm tra thông tin hiển thị của 1 app/feature @SB_APPS_CaP_20`, async ({ page, conf }) => {
    await test.step(`Kiểm tra hiển thị logo một app/feature`, async () => {
      await homePage.goToCollectionOrCategoryDetail(conf.caseConf.type, conf.caseConf.category_handle);
      await homePage.page.waitForTimeout(5 * 1000);
      await page.waitForSelector(`//h1[normalize-space()='${conf.caseConf.category_name}']`);
      const appInfOfCollectionPage = await homePage.getAppInfOfCollectionOrCategoryDetailPage(conf.caseConf.app_name);
      expect(appInfOfCollectionPage).toEqual(
        expect.objectContaining({
          appName: conf.caseConf.app_name,
          shortDescription: conf.caseConf.short_description,
          logo: conf.caseConf.logo,
          price: conf.caseConf.price,
        }),
      );
    });

    await test.step(`Click vào bất kì vị trí nào thuộc box app/feature`, async () => {
      await page.locator(`//h5[normalize-space()='${conf.caseConf.app_name}']//ancestor::a`).click();
      await homePage.page.waitForTimeout(5 * 1000);
      await page.waitForSelector(`//h1[normalize-space()='${conf.caseConf.app_name}']`);
      expect(page.url()).toContain(conf.caseConf.handle);
    });
  });
});
