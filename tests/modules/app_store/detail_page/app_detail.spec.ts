import { AppstoreHomePage } from "@pages/app_store/homepage";
import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

const xpathAppTitle = `//h1[@class='detail-app__info__title']`;
const xpathLoginRequired = `//*[text()[normalize-space()='Login Required']]`;
const linkSelector = `(//button[normalize-space()="Visit ShopBase App Store"])[1]`;

test.describe("Kiểm tra hiển thị trên App detail page", async () => {
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

  test(`Kiểm tra thông tin app @SB_APPS_APPD_62`, async ({ page, conf, context }) => {
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const key = conf.caseConf.data[i];
      await homePage.goToAppDetail(key.app_name);
      const result = await homePage.getAppInfByApi(conf.suiteConf.api, key.handle);
      const appInf = await homePage.getAppInfDetailPage();

      await test.step(`Kiểm tra đường dẫn của app`, async () => {
        const name = await page.innerText("//span[@class='el-breadcrumb__inner']");
        const title = await page.innerText("//span[@class='el-breadcrumb__inner is-link']");
        expect(`${title} > ${name}`).toEqual(`App Store > ${key.app_name}`);
      });

      await test.step(`Kiểm tra các thông tin: App Name, Short Description, App logo`, async () => {
        expect(appInf).toEqual(
          expect.objectContaining({
            appName: result.appName,
            shortDescription: result.shortDescription,
            logo: result.logo,
          }),
        );
      });

      // Check thông tin hiển thị giá của app/feature
      await test.step(`Kiểm tra thông tin price của app/feature `, async () => {
        const pricingType = result.pricingType;
        const priceValue = result.pricingValue;
        if (priceValue == 0) {
          switch (pricingType) {
            case "free":
              expect(appInf.price).toEqual("Free");
              break;
            case "free_plan_available":
              expect(appInf.price).toEqual("Free plan available");
              break;
            case "free_install":
              expect(appInf.price).toEqual("Free to install");
          }
        } else if (priceValue > 0 && pricingType == "free_day_trial") {
          expect(appInf.price).toEqual(`${priceValue} days free trial`);
        } else if (priceValue > 0 && pricingType == "fee_per_month") {
          expect(appInf.price).toEqual(`${priceValue}/per month`);
        }
      });

      await test.step(`Kiểm tra hiển thị thông tin owner của app:  `, async () => {
        expect(appInf).toEqual(
          expect.objectContaining({
            websiteUrl: result.websiteUrl,
            supportPageUrl: result.supportPageUrl,
          }),
        );
        // check mở đúng link khi click vào textlink visit oursite
        const [website] = await Promise.all([
          context.waitForEvent("page"),
          page.locator("//a[@class='app-info__detail__cta__visit']").click(),
        ]);
        expect(website.url()).toContain(result.websiteUrl);
        await website.close();
        // check mỏ đúng link khi click vào textlink get support
        const [supportPage] = await Promise.all([
          context.waitForEvent("page"),
          page.locator("//a[@class='app-info__detail__cta__contact']").click(),
        ]);
        expect(supportPage.url()).toContain(result.supportPageUrl);
        await supportPage.close();
      });
    }
  });

  test(`Kiểm tra hiển thị Screenshot của app @SB_APPS_APPD_64`, async ({ page, conf }) => {
    await test.step(`Đi đến trang detail app/feature có nhiều ảnh -> kiểm tra hiển thị Screenshot app`, async () => {
      for (let i = 0; i < conf.caseConf.data_imgs.length; i++) {
        const key = conf.caseConf.data_imgs[i];
        await homePage.goToAppDetail(key.app_name);
        const appInf = await homePage.getAppInfDetailPage();
        await expect(page.locator("button:has-text('arrowRight')")).toBeVisible();
        await page.locator("button:has-text('arrowRight')").click();
        await expect(page.locator("button:has-text('arrowLeft')")).toBeVisible();
        for (let j = 0; j < conf.caseConf.data_imgs[i].screen_shorts.length; j++) {
          expect(appInf.screenShort[j]).toEqual(conf.caseConf.data_imgs[i].screen_shorts[j].screen_short);
        }
      }
    });

    await test.step(`Đi đến trang detail chỉ có <= 2 ảnh -> kiểm tra hiển thị Screenshort`, async () => {
      for (let i = 0; i < conf.caseConf.data_img.length; i++) {
        const key = conf.caseConf.data_img[i];
        await homePage.goToAppDetail(key.app_name);
        const appInf = await homePage.getAppInfDetailPage();
        for (let j = 0; j < conf.caseConf.data_img[i].screen_shorts.length; j++) {
          expect(appInf.screenShort[j]).toEqual(conf.caseConf.data_img[i].screen_shorts[j].screen_short);
        }
      }
    });

    await test.step(`Đi đến trang detail của app/feature không có screenshort nào`, async () => {
      for (let i = 0; i < conf.caseConf.no_img.length; i++) {
        const key = conf.caseConf.no_img[i];
        await homePage.goToAppDetail(key.app_name);
        await expect(page.locator("//img[@class='screenshot-img']")).toBeHidden();
      }
    });
  });

  test(`Kiểm tra review app khi seller chưa cài app @SB_APPS_APPD_69`, async ({ page, conf }) => {
    await test.step(`Cick button "Write a review" -> nhập đầy đủ dữ liệu hợp lệ vào tất cả các trường`, async () => {
      await homePage.signInAndChooseShop(conf.caseConf.username, conf.caseConf.password, conf.caseConf.shop_name);
      await page.waitForURL(`https://${conf.suiteConf.domain}`);
      await homePage.goToAppDetail(conf.caseConf.app_name);
      // Check nhập đúng thông tin vào form review -> enable button submit
      await homePage.writeReview(
        conf.caseConf.title,
        conf.caseConf.description,
        conf.caseConf.star,
        conf.caseConf.is_check,
      );
      await expect(page.locator("//span[text()='Submit']")).toBeEnabled();
    });

    await test.step(`Click button Submit -> verify message`, async () => {
      await page.locator("//span[text()='Submit']").click();
      expect(await page.innerText("//p[@class='modal-alert-message-txt']")).toEqual(conf.caseConf.message);
    });
  });

  test(`Verify các trường thông tin popup review app, feature @SB_APPS_APPD_70`, async ({ page, conf }) => {
    await homePage.signInAndChooseShop(conf.caseConf.username, conf.caseConf.password, conf.caseConf.shop_name);
    await page.waitForURL(`https://${conf.suiteConf.domain}`);
    await homePage.reOpenAppstore(conf.suiteConf.collection_name);
    await test.step(`Tại màn hình detail app, click button "Write a review" -> verify các trường`, async () => {
      for (let i = 0; i < conf.caseConf.data.app.length; i++) {
        await homePage.goToAppDetail(conf.caseConf.data.app[i].app_name);
        for (let j = 0; j < conf.caseConf.data.key.length; j++) {
          const key = conf.caseConf.data.key[j];
          // Check nhập thông tin không hợp lệ vào form review -> button Submit vẫn disable -> đóng form
          await homePage.writeReview(key.title, key.description, key.star, key.is_check);
          await expect(page.locator("//span[normalize-space()='Submit']")).toBeDisabled();
          await page.locator("(//span[normalize-space()='Cancel'])[2]").click();
        }
      }
    });
  });

  test(`Kiểm tra viết review khi seller đã từng review app, feature trước đó @SB_APPS_APPD_71`, async ({
    page,
    conf,
  }) => {
    await homePage.signInAndChooseShop(conf.caseConf.username, conf.caseConf.password, conf.caseConf.shop_name);
    await page.waitForURL(`https://${conf.suiteConf.domain}`);
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const key = conf.caseConf.data[i];

      await test.step(`Tại màn hình detail app/feature, click button "Write a review"
    -> nhập đầy đủ dữ liệu hợp lệ vào tất cả các trường`, async () => {
        await homePage.goToAppDetail(key.app_name);
        // Check nhập đúng thông tin vào form -> click submit -> verify message
        await homePage.writeReview(key.title, key.description, key.star, key.is_check);
        await expect(page.locator("//span[text()='Submit']")).toBeEnabled();
      });

      await test.step(`Click button Submit`, async () => {
        await page.locator("//span[normalize-space()='Submit']").click();
        expect(await page.innerText("//p[@class='modal-alert-message-txt']")).toEqual(key.message);
        await page.locator("(//span[normalize-space()='Cancel'])[2]").click();
        expect(await page.getAttribute("(//div[@class='el-overlay'])[3]", "style")).toContain("none");
      });
    }
  });

  test(`Kiểm tra cài đặt Third App thành công @SB_APPS_APPD_65`, async ({ page, conf, context, snapshotFixture }) => {
    await test.step(`Click button "Install this app" -> Verify hiển thị Pop up báo phải login để install app
    -> Click button Cancel để close popup Install App`, async () => {
      await page.waitForURL(`https://${conf.suiteConf.domain}`);
      await homePage.clickBtnInstallApp(page, conf.caseConf.third_app);
      await expect(page.locator(xpathLoginRequired)).toBeVisible();
      await homePage.closePopupInstallApp();
    });

    await test.step(`Click button "Install this app" -> Choose Login tại popup báo Login Required
    -> Verify Navigate đến trang sign in account shopbase`, async () => {
      await page.locator(`//p[normalize-space()="Install this app"]`).click();
      await page.locator(`//span[normalize-space()="Login"]`).click();
      const currentUrl = await page.url().toString();
      await expect(currentUrl).toEqual(conf.caseConf.url_login);
    });

    await test.step(`Thực hiện đăng nhập account shopbase -> Click button "Install this app" sau khi đã login account
    -> Verify đi đến màn màn xin quyền của Third App`, async () => {
      await homePage.login(conf.caseConf.username, conf.caseConf.password, conf.caseConf.shop_name);
      await page.waitForURL(`${conf.caseConf.url_homepage}/${conf.caseConf.app}`);
      await page.locator(`//p[normalize-space()="Install this app"]`).click();
      await page.waitForSelector(".icon-in-app-notification");
      await snapshotFixture.verify({
        page: page,
        selector: `//div[@class="authorize-third-party-app-page row"]`,
        snapshotName: conf.caseConf.grant_screen_screenshot,
      });
    });

    await test.step(`Tại màn xin quyền của Third App, chọn Cancel tại màn xin quyền của Third App
    -> Verify đi đến màn list app đã được cài của shop đó`, async () => {
      await page.locator(`//button[normalize-space()="Cancel"]`).click();
      const urlListApp = await page.url().toString();
      await expect(urlListApp).toEqual(conf.caseConf.url_apps);
    });

    await test.step(`Mở lại trang detail của Third App -> click button "Install this app"
    -> tại màn xin quyền của Third App -> Chọn button "Install app"`, async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), await page.click(linkSelector)]);
      await newPage.waitForLoadState("networkidle");
      await homePage.clickBtnInstallApp(newPage, conf.caseConf.third_app);
      await page.waitForSelector(".icon-in-app-notification");
      await newPage.locator(`//button[normalize-space()="Install app"]`).click();
      await expect(
        newPage.locator(`//a[normalize-space()="Please login to connect to your existing Eber Account"]`),
      ).toBeVisible();
      await newPage.close();
    });

    await test.step(`Mở lại trang Apps ở SB Dashboard -> Verify hiển thị app vừa cài đặt`, async () => {
      await page.goto(conf.caseConf.url_apps);
      await expect(page.locator(`//p[normalize-space()="${conf.caseConf.third_app}"]`)).toBeVisible();
    });

    await test.step(`Uninstall Third App -> Verify xóa thành công app vừa cài đặt`, async () => {
      await homePage.uninstallThirdApp(conf.caseConf.third_app);
      await expect(page.locator(`//p[normalize-space()="${conf.caseConf.third_app}"]`)).not.toBeVisible();
    });
  });

  test(`Kiểm tra hiển thị UI trang app detail và feature detail trên web @SB_APPS_APPD_61`, async ({
    page,
    conf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const key = conf.caseConf.data[i];
      await test.step(`Kiểm tra hiển thị UI trang app detail`, async () => {
        await homePage.goToAppDetail(key.app_name);
        await homePage.page.waitForTimeout(5 * 1000);
        await page.waitForSelector(xpathAppTitle);
        await snapshotFixture.verify({
          page: page,
          selector: `//div[@id='sidebar']`,
          snapshotName: key.screenshot_sidebar,
        });
        await snapshotFixture.verify({
          page: page,
          selector: `//div[@class='el-row detail-app']`,
          snapshotName: key.screenshot_app_info,
        });
      });

      await test.step(`Kiểm tra URL trang app/feature detail`, async () => {
        expect(page.url()).toContain(key.url);
      });

      await test.step(`Copy URL app/feature mở sang tab mới`, async () => {
        const url = page.url();
        const newPage = await context.newPage();
        await newPage.goto(url);
        await newPage.waitForLoadState("load");
        await newPage.waitForTimeout(5 * 1000);
        expect(await newPage.innerText(xpathAppTitle)).toEqual(key.app_name);
        await newPage.close();
      });
    }
  });
});

test(`Kiểm tra hiển thị dữ liệu trường Content của app/feature @SB_APPS_APPD_63`, async ({
  page,
  conf,
  snapshotFixture,
}) => {
  test.slow();
  const homePage = new AppstoreHomePage(page, conf.suiteConf.domain);
  for (let i = 0; i < conf.caseConf.data_long_content.length; i++) {
    const key = conf.caseConf.data_long_content[i];
    await test.step(`Kiểm tra hiển thị dữ liệu trường Content một app
    hoặc feature có nội dung content > 255 kí tự`, async () => {
      await page.goto(key.url_app);
      await homePage.page.waitForTimeout(5 * 1000);
      const btnShowFullDescription = `//p[@class='app-info__content__txt__show-des']`;
      await page.waitForSelector(xpathAppTitle);
      await page.locator(btnShowFullDescription).click();
      await snapshotFixture.verify({
        page: page,
        selector: `//div[@class='app-info__content__txt']/div`,
        snapshotName: key.screenshot_content,
      });
    });
  }

  for (let i = 0; i < conf.caseConf.data_short_content.length; i++) {
    const key = conf.caseConf.data_short_content[i];
    await test.step(`Kiểm tra hiển thị dữ liệu trường Content một app có nội dung content <= 255 kí tự`, async () => {
      await page.goto(key.url_app);
      await homePage.page.waitForTimeout(5 * 1000);
      await page.waitForSelector(xpathAppTitle);
      await snapshotFixture.verify({
        page: page,
        selector: `//div[@class='app-info__content__txt']/div`,
        snapshotName: key.screenshot_content,
      });
    });
  }
});

test(`Kiểm tra mở feature trong dashboard khi chưa đăng nhập tài khoản shopbase @SB_APPS_APPD_87`, async ({
  page,
  conf,
  context,
  snapshotFixture,
}) => {
  const homePage = new AppstoreHomePage(page, conf.suiteConf.domain);
  await page.goto(conf.caseConf.url_feature);
  await page.waitForSelector(xpathAppTitle);

  await test.step(`Click button "Try it on your store" -> Verify Popup Login Required
  -> Click button Cancel để close popup`, async () => {
    await page.locator("//p[text()='Try it on your store']").click();
    await expect(page.locator(xpathLoginRequired)).toBeVisible();
    await homePage.closePopupInstallApp();
  });

  await test.step(`Thực hiện đăng nhập account shopbase`, async () => {
    await homePage.loginInDetailPage(
      conf.caseConf.username,
      conf.caseConf.password,
      conf.caseConf.shop_name,
      conf.caseConf.url_feature,
    );
    await page.waitForSelector(".icon-in-app-notification");
    await snapshotFixture.verify({
      page: page,
      selector: `//div[@class="authorize-third-party-app-page row"]`,
      snapshotName: conf.caseConf.grant_screen_screenshot,
    });
  });

  await test.step(`Tại màn xin quyền của feature, chọn Cancel tại màn xin quyền của feature`, async () => {
    await page.locator(`//button[normalize-space()="Cancel"]`).click();
    expect(page.url()).toEqual(conf.caseConf.url_apps_screen);
  });

  await test.step(`Mở lại trang detail feature "Post-purchase Upsell" ->
   click button "Try it on your store" -> tại màn xin quyền của feature -> Chọn "Go to this feature"`, async () => {
    const [newPage] = await Promise.all([context.waitForEvent("page"), await page.click(linkSelector)]);
    await newPage.goto(conf.caseConf.url_feature);
    await newPage.waitForSelector(xpathAppTitle);
    await newPage.locator(`//p[text()='Try it on your store']`).click();
    await page.waitForSelector(".icon-in-app-notification");
    await newPage.locator(`//button[normalize-space()="Go to this feature"]`).click();
    expect(newPage.url()).toContain(conf.caseConf.cta_link);
  });
});
