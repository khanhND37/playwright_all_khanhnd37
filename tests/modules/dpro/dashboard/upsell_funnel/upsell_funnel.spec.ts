import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

test.describe("Verify Upsell funnel dashboard", () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    //create product
    const productListData = conf.suiteConf.product_list;
    for (let i = 0; i < productListData.length; i++) {
      await productAPI.createProduct(productListData[i]);
    }

    //dùng wait timeout vì khi thực hiển mở tab memu và search product thì có thể API tạo product chưa tạo xong
    await productPage.page.waitForTimeout(3 * 1000);
    await productPage.navigateToMenu("Products");
    await productPage.searchProduct(conf.caseConf.product_name);
    await productPage.clickTitleProduct(conf.caseConf.product_name);
    await productPage.switchTab("Checkout");
    await productPage.waitUntilElementInvisible(productPage.xpathLoadingTab);
  });

  test.afterEach(async ({ conf }) => {
    //Get product id
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    // Delete product
    await productAPI.deleteProduct(IdsArray);
  });

  test(`Verify thêm mới Upsell @SB_SC_SCP_121`, async ({ conf, dashboard, snapshotFixture }) => {
    await test.step(`Click button Add you firs upsell`, async () => {
      await productPage.clickBtnAddUpsell(conf.caseConf.button_text);
      await expect(productPage.genLoc(productPage.xpathTitlePopup)).toHaveText("Select product");
    });

    await test.step(`click button Discard`, async () => {
      await productPage.clickBtnOnPopup(conf.caseConf.button_discard);
      await expect(productPage.genLoc(productPage.xpathTitlePopup)).toBeHidden();
    });

    await test.step(`select product Upsell và click button save > Verify thông tin hiển thị`, async () => {
      const productUpsell = conf.caseConf.product_upsell_name;
      await productPage.clickBtnAddUpsell(conf.caseConf.button_text);
      await productPage.searchAndSelectProductUpsell(productUpsell);
      await productPage.clickBtnOnPopup(conf.caseConf.button_save);
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathUpsell,
        snapshotName: "upsell-01.png",
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });
    });

    await test.step(`Click button Save > verify thông tin hiển thị`, async () => {
      await productPage.clickSaveGeneral();
      await productPage.waitUntilElementVisible("//span[normalize-space()='Design offer']");
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathUpsell,
        snapshotName: "upsell-02.png",
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });
    });

    await test.step(`Click button Select product > verify popup selete product`, async () => {
      await productPage.clickBtnSelectProductDownSell(conf.caseConf.product_upsell_name);
      await expect(productPage.genLoc(productPage.xpathTitlePopup)).toHaveText("Select product");
    });

    await test.step(`click button Discard > verify popup selete product`, async () => {
      await productPage.clickBtnOnPopup(conf.caseConf.button_discard);
      await expect(productPage.genLoc(productPage.xpathTitlePopup)).toBeHidden();
    });

    await test.step(`select product down sell và click button save > verify thông tin hiển thị`, async () => {
      const productDownSell = conf.caseConf.product_downsell_name;
      await productPage.clickBtnSelectProductDownSell(conf.caseConf.product_upsell_name);
      await productPage.searchAndSelectProductUpsell(productDownSell);
      await productPage.clickBtnOnPopup(conf.caseConf.button_save);
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathUpsell,
        snapshotName: "downSell-01.png",
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });
    });

    await test.step(`Click button Save > verify thông tin hiển thị`, async () => {
      await productPage.clickSaveGeneral();
      await productPage.waitUntilElementVisible(productPage.xpathDownSellStatus);
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathUpsell,
        snapshotName: "downSell-02.png",
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });
    });
  });

  test(`Verify các action của upsell, down sell @SB_SC_SCP_122`, async ({ conf }) => {
    const productUpsell = conf.caseConf.product_upsell_name;
    const productDownSell = conf.caseConf.product_downsell_name;
    await productPage.clickBtnAddUpsell(conf.caseConf.button_text);
    await productPage.searchAndSelectProductUpsell(productUpsell);
    await productPage.clickBtnOnPopup(conf.caseConf.button_save);
    await productPage.clickBtnSelectProductDownSell(productUpsell);
    await productPage.searchAndSelectProductUpsell(productDownSell);
    await productPage.clickBtnOnPopup(conf.caseConf.button_save);
    await productPage.clickSaveGeneral();

    await test.step("Click toggle active offer verify thông tin popup hiển thị", async () => {
      await productPage.clickToggleStatusUpsell(productUpsell);
      await expect(productPage.genLoc(productPage.xpathTitlePopup)).toHaveText("Activate offer");
      await expect(productPage.genLoc(productPage.xpathDescriptionPopup)).toHaveText(
        "To activate the offer, you must first design the offer page. A well-designed offer page will increase your conversion rate significantly.",
      );
    });

    await test.step("Apply Design -> Verify status của  offer", async () => {
      await productPage.applyDesignOffer(conf.caseConf.button_name, conf.caseConf.theme_name);
      expect(await productPage.getStatusOffer(productUpsell)).toEqual(conf.caseConf.status_validate);
    });

    await test.step("Click buttom Design offer > Verify hiển thị web builder", async () => {
      await productPage.clickBtnDesignOffer(productDownSell);
      await productPage.page
        .frameLocator("#preview")
        .locator("//section//div[contains(@class,'variant-form__container')]//button//span")
        .scrollIntoViewIfNeeded();
      await expect(productPage.page.frameLocator("#preview").locator(productPage.xpathBtnRejectOffer)).toHaveText(
        "No Thanks, I don't need this now",
      );
      await expect(productPage.page.frameLocator("#preview").locator(productPage.xpathBtnAcceptOffer)).toHaveText(
        "Yes! Upgrade My Order Now",
      );
    });
  });

  test(`Verify cấu hình tối đa của Upsell & downsell @SB_SC_SCP_123`, async ({ conf }) => {
    await test.step(`Create 10 offer upsell, downsell verify button [Add new product]`, async () => {
      const buttonText = conf.caseConf.buttons_text;
      const productUpsell = conf.caseConf.products_upsell_name;
      for (let i = 0; i < buttonText.length; i++) {
        await productPage.clickBtnAddUpsell(buttonText[i]);
        await productPage.searchAndSelectProductUpsell(productUpsell);
        await productPage.clickBtnOnPopup(conf.caseConf.button_save);
      }
      await expect(productPage.genLoc("(//span[normalize-space()='Add new upsell'])[1]")).toBeDisabled();
    });
  });

  test(`Verify delete upsell và downsell @SB_SC_SCP_127`, async ({ conf }) => {
    const productUpsell = conf.caseConf.product_upsell_name;
    const productDownSell = conf.caseConf.product_downsell_name;
    await productPage.clickBtnAddUpsell(conf.caseConf.button_text);
    await productPage.searchAndSelectProductUpsell(productUpsell);
    await productPage.clickBtnOnPopup(conf.caseConf.button_save);
    await productPage.clickBtnSelectProductDownSell(productUpsell);
    await productPage.searchAndSelectProductUpsell(productDownSell);
    await productPage.clickBtnOnPopup(conf.caseConf.button_save);
    await productPage.clickSaveGeneral();
    const locatorOfferDownSell = productPage.getXpathOfferUpsell(conf.caseConf.label_downsell);
    const locatorOfferUpsell = productPage.getXpathOfferUpsell(conf.caseConf.label_upsell);

    await test.step(`click icon Delete product downSell > Verify popup hiển thị > click button cancel > Verify thông tin hiển thị`, async () => {
      await productPage.OpenPopupDeleteOfferProduct(productDownSell);
      await expect(productPage.genLoc(productPage.xpathTitlePopup)).toHaveText("Delete offer");
      await expect(productPage.genLoc(productPage.xpathDescriptionPopup)).toHaveText(
        "You are deleting this offer from your product. Are you sure you want to continue?",
      );
      await productPage.clickBtnOnPopup(conf.caseConf.button_cancel);
      await productPage.waitUntilElementInvisible(productPage.xpathTitlePopup);
      await expect(locatorOfferDownSell).toBeVisible();
    });

    await test.step(`click icon Delete product upsell > Verify popup hiển thị > click button cancel > Verify thông tin hiển thị`, async () => {
      await productPage.OpenPopupDeleteOfferProduct(productUpsell);
      await expect(productPage.genLoc(productPage.xpathTitlePopup)).toHaveText("Delete offer");
      await expect(productPage.genLoc(productPage.xpathDescriptionPopup)).toHaveText(
        "You are deleting upsell offer from your product. By deleting the upsell offer, downsell offer will also be deleted. Are you sure you want to continue?",
      );
      await productPage.clickBtnOnPopup(conf.caseConf.button_cancel);
      await productPage.waitUntilElementInvisible(productPage.xpathTitlePopup);
      await expect(locatorOfferUpsell).toBeVisible();
    });

    await test.step(`Click icon delete product downsell > click button delete > Verify product hiển thị`, async () => {
      await productPage.OpenPopupDeleteOfferProduct(productDownSell);
      await productPage.clickBtnOnPopup(conf.caseConf.button_delete);
      await expect(locatorOfferDownSell).toBeHidden();
      await expect(locatorOfferUpsell).toBeVisible();
    });

    await test.step(`Click icon delete product upsell > click button delete > Verify product hiển thị`, async () => {
      await productPage.OpenPopupDeleteOfferProduct(productUpsell);
      await productPage.clickBtnOnPopup(conf.caseConf.button_delete);
      await expect(locatorOfferDownSell).toBeHidden();
      await expect(locatorOfferUpsell).toBeHidden();
    });
  });
});
