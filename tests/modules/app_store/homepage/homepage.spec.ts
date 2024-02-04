import { expect, test } from "@core/fixtures";
import { OcgLogger } from "@core/logger";
import { AppstoreHomePage } from "@pages/app_store/homepage";

const logger = OcgLogger.get();

test.describe("Kiểm tra hiển thị trên Home page", async () => {
  let homePage: AppstoreHomePage;
  test.beforeEach(async ({ page, conf }) => {
    homePage = new AppstoreHomePage(page, conf.suiteConf.domain);
    try {
      await homePage.goToAppStore(conf.suiteConf.collection_name);
    } catch (e) {
      logger.info("Error when go to app store. Retry now");
      logger.info(e);
      await homePage.goToAppStore(conf.suiteConf.collection_name);
    }
  });

  test(`Kiểm tra hoạt động button Login/Logout @SB_APPS_HP_49`, async ({ page, conf }) => {
    await test.step(`Tại trang homepage, click button Login ở header -> đăng nhập tài khoản -> chọn shop`, async () => {
      await homePage.signInAndChooseShop(conf.caseConf.username, conf.caseConf.password, conf.caseConf.shop_name);
      expect(page.url()).toContain(conf.suiteConf.domain);
      await expect(page.locator("(//a[@class='menu-item-link'])[13]")).toContainText(conf.caseConf.first_name);
    });

    await test.step(`Hover vào tên tài khoản ở Header -> click button Logout`, async () => {
      await page.locator(conf.caseConf.selector_to_hover).hover();
      await homePage.page.waitForSelector("//a[normalize-space()='Logout']//parent::li[@class='child-menu-item']", {
        timeout: 3000,
      });
      await homePage.genLoc(conf.caseConf.selector_to_click).click();
      await expect(homePage.genLoc("//a[normalize-space()='Login']")).toBeVisible({ timeout: 5000 });
    });
  });

  test(`Kiểm tra danh sách collection ở sidebar @SB_APPS_HP_51`, async ({ page, conf }) => {
    await test.step(`Kiểm tra hiển thị thông tin collection: tên collection + icon ở sidebar`, async () => {
      //get thông tin của collection từ api
      const result = await homePage.getCollectionByApi(conf.suiteConf.api);
      //get thông tin collection hiển thị ở sidebar
      const topCollections = await homePage.getCollectionSidebar();
      //so sánh thông tin collection đang hiển thị với kết quả trả về từ api
      for (let i = 0; i < topCollections.length; i++) {
        expect(topCollections[i]).toEqual(
          expect.objectContaining({
            name: result[i].name,
            imgLogo: result[i].imgLogo,
          }),
        );
      }
    });

    await test.step(`Click vào 1 collection`, async () => {
      const collectionName = await page.innerText("(//div[@class='block-title'])[1]");
      await page.locator("(//div[@class='block-title'])[1]").click();
      expect(await page.innerText("//h1[@class='collection-description']")).toEqual(collectionName);
    });
  });

  test(`Kiểm tra danh sách Category ở sidebar @SB_APPS_HP_52`, async ({ page, conf }) => {
    await test.step(`Kiểm tra hiển thị thông tin category ở sidebar: tên category + icon`, async () => {
      //get thông tin category từ api
      const result = await homePage.getListCategoryByApi(conf.suiteConf.api);
      //get thông tin category hiển thị ở sidebar
      const listCategory = await homePage.getCategorySidebar();
      //so sánh category hiển thị ở sidebar với api
      expect(listCategory.length).toEqual(result.length);
      for (let i = 0; i < listCategory.length; i++) {
        expect(listCategory[i]).toEqual(
          expect.objectContaining({
            name: result[i].name,
            imgLogo: result[i].imgLogo,
          }),
        );
      }
    });

    await test.step(`Click vào 1 category`, async () => {
      const categoryName = await page.innerText(
        "(//li[@class='el-menu-item block-menu-item'])[1]//descendant::span[2]",
      );
      await page.locator("(//li[@class='el-menu-item block-menu-item'])[1]//descendant::span[2]").click();
      expect(await page.innerText("//h1[@class='collection-description']")).toEqual(categoryName);
    });
  });

  test(`Kiểm tra hiển thị các collection ở màn hình view bên phải @SB_APPS_HP_53`, async ({ page, conf }) => {
    await test.step(`Kiểm tra thứ tự các collection`, async () => {
      const result = await homePage.getCollectionByApi(conf.suiteConf.api);
      const collection = await homePage.getCollectionViewScreen();
      //so sánh thông tin hiển thị của collection ở màn hình view nội dung với api
      expect(collection.length).toEqual(result.length);
      for (let i = 0; i < collection.length; i++) {
        expect(collection[i]).toEqual(
          expect.objectContaining({
            name: result[i].name,
            description: result[i].description,
          }),
        );
      }
    });

    await test.step(`Click vào See All ở 1 collection`, async () => {
      await page.locator(`//header[child::h4[normalize-space()='${conf.caseConf.collection_name}']]//a`).click();
      expect(await page.innerText("//h1[@class='collection-description']")).toEqual(conf.caseConf.collection_name);
    });
  });

  test(`Check các category ở màn hình view bên phải khi có > 3 category @SB_APPS_HP_56`, async ({ page, conf }) => {
    await test.step(`Check hiển thị các category`, async () => {
      const categories = await homePage.getListCategory();
      const result = await homePage.getListCategoryByApi(conf.suiteConf.api);
      await expect(page.locator("button:has-text('arrowRight')")).toBeVisible();
      //so sánh thông tin hiển thị của category ở màn hình view nội dung với api
      expect(categories.length).toEqual(result.length);
      for (let i = 0; i < categories.length; i++) {
        expect(categories[i]).toEqual(
          expect.objectContaining({
            name: result[i].name,
            description: result[i].description,
            imgBackground: result[i].imgBackground,
          }),
        );
      }
    });

    await test.step(`Click vào button View all của 1 category`, async () => {
      await page.locator(`//h5[normalize-space()='${conf.caseConf.category_name}']//parent::div//span`).click();
      await page.waitForSelector(`//p[normalize-space()= '${conf.caseConf.category_description}']`);
      expect(await page.innerText("//h1[@class='collection-description']")).toEqual(conf.caseConf.category_name);
    });
  });
});

test(`Kiểm tra chức năng search @SB_APPS_HP_50`, async ({ page, conf }) => {
  const homePage = new AppstoreHomePage(page, conf.suiteConf.domain);
  try {
    await homePage.goToAppStore(conf.suiteConf.collection_name);
  } catch (e) {
    logger.info("Error when go to app store. Retry now");
    logger.info(e);
    await homePage.goToAppStore(conf.suiteConf.collection_name);
  }
  await homePage.page.waitForLoadState("networkidle");
  await test.step(`Nhập từ khóa vào thanh search -> ấn phím Enter trên bàn phím`, async () => {
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const key = conf.caseConf.data[i];
      await homePage.searchApp(key.key_word);
      if (key.result) {
        await homePage.page.waitForSelector(`//h1[@class='search-title' and contains(text(),'${key.key_word}')]`);
      } else {
        await homePage.page.waitForSelector("//h1[@class='search-title' and contains(text(),'No result')]");
      }
      //get message trả về
      const result = await homePage.page.innerText("//h1[@class='search-title']");
      //so sánh message trả về với message trong design
      expect(result).toContain(`${key.message} "${key.key_word}"`);
    }
  });
});

test(`Check thông tin của app/feature thuộc collection ở màn hình view bên phải @SB_APPS_HP_54`, async ({
  page,
  conf,
}) => {
  const homePage = new AppstoreHomePage(page, conf.suiteConf.domain);
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const key = conf.caseConf.data[i];
    await test.step(`Check thông tin của app/feature thuộc collection display là Big image, Logo`, async () => {
      try {
        await homePage.goToAppStore(conf.suiteConf.collection_name);
      } catch (e) {
        logger.info("Error when go to app store. Retry now");
        logger.info(e);
        await homePage.goToAppStore(conf.suiteConf.collection_name);
      }
      const appInf = await homePage.getAppOfCollection(key.app_name, key.collection_name);
      //so sánh thông tin hiển thị của app, feature thuộc collection ở màn hình view với nội dung ở file config
      expect(appInf).toEqual(
        expect.objectContaining({
          name: key.app_name,
          shortDescription: key.short_description,
        }),
      );
    });

    await test.step(`Click vào bất kì vị trí nào thuộc box app/feature`, async () => {
      await page.locator(`(//h5[normalize-space()='${key.app_name}'])[1]//ancestor::a`).click();
      expect(await page.innerText("//h1[@class='detail-app__info__title']")).toEqual(key.app_name);
    });
  }
});
