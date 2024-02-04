import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { ProducDetailV3 } from "@pages/new_ecom/storefront/product_page";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Translation entity size guide Plusbase", () => {
  test(`@SB_SET_LG_TLL_87 [Function] Kiểm tra auto translate size chart plusbase và show bản dịch trên storefront`, async ({
    page,
    conf,
    snapshotFixture,
  }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    const productMapSC = conf.suiteConf.product_map_sc;
    const productMapSCShoeSize = conf.suiteConf.product_map_sc_shoe_size;
    const language = conf.caseConf.choose_language_sf;
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const productPage = new ProducDetailV3(page, conf.suiteConf.domain);

    await test.step(`Open storefront shop plb, click block global switcher > chọn language bất kì`, async () => {
      await homePage.goto(`https://${conf.suiteConf.domain}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(language[0]);
    });

    await test.step(`- Đi đến trang product detail có size chart không phải Shoe size 
    - Click text Size guide ở variant Size`, async () => {
      await homePage.goto(`https://${conf.suiteConf.domain}/products/${productMapSC.handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.page.waitForSelector(productPage.xpathBlockRating);

      await homePage.genLoc(productPage.btnSizeChart).click();
      await homePage.waitAbit(2000); //đợi hiện popup size chart ổn định để chụp ảnh

      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-size-chart-${language[0].language}.png`,
      });

      await homePage.genLoc(productPage.iconClosePopupSC).click();
      await homePage.waitUntilElementInvisible(homePage.xpathOverlay);
    });

    await test.step(`- Click block global switcher > chọn language khác
    - Click text Size guide ở variant Size`, async () => {
      await homePage.chooseCountryAndLanguageOnSF(language[1]);
      await expect(homePage.page.locator(homePage.xpathBlockGlobalSwitcher)).toContainText(language[1].language);
      await homePage.page.waitForLoadState("networkidle");

      await homePage.genLoc(productPage.btnSizeChart).click();
      await homePage.waitAbit(2000); //đợi hiện popup size chart ổn định để chụp ảnh

      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-size-chart-${language[1].language}.png`,
      });
      await homePage.genLoc(productPage.iconClosePopupSC).click();
      await homePage.waitUntilElementInvisible(homePage.xpathOverlay);
    });

    await test.step(`- Đi đến trang product detail có size chart là Shoe size
    - Click text Size guide ở variant Size`, async () => {
      await homePage.goto(`https://${conf.suiteConf.domain}/products/${productMapSCShoeSize.handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.page.waitForSelector(productPage.xpathBlockRating);

      await homePage.genLoc(productPage.btnSizeChart).click();
      await homePage.waitAbit(2000); //đợi hiện popup size chart ổn định để chụp ảnh

      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-sc-shoe-size-${language[1].language}.png`,
      });

      await homePage.genLoc(productPage.iconClosePopupSC).click();
      await homePage.waitUntilElementInvisible(homePage.xpathOverlay);
    });

    await test.step(`- Click block global switcher > chọn language khác 
    - Click text Size guide ở variant Size`, async () => {
      await homePage.chooseCountryAndLanguageOnSF(language[0]);
      await expect(homePage.page.locator(homePage.xpathBlockGlobalSwitcher)).toContainText(language[0].language);
      await homePage.waitAbit(5000); //sau khi thay đổi language thì page bị reload
      await homePage.page.waitForSelector(productPage.xpathBlockRating);

      await homePage.genLoc(productPage.btnSizeChart).click();
      await homePage.waitAbit(2000); //đợi hiện popup size chart ổn định để chụp ảnh

      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-sc-shoe-size-${language[0].language}.png`,
      });
    });
  });
});
