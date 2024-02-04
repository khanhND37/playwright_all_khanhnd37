import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";
import { CreatorPage } from "@pages/dashboard/creator";
import { SettingPage } from "@pages/shopbase_creator/dashboard/settings/settings";
import { HiveStorefrontTool } from "@pages/hive/hive_storefront_tool";
import { snapshotDir } from "@core/utils/theme";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";

test.describe(`Choose package for shop Creator`, async () => {
  let settingPage: SettingPage;
  let productAPI: ProductAPI;
  let productPage: ProductPage;
  test.beforeEach(async ({ conf, dashboard, authRequest }, testInfo) => {
    settingPage = new SettingPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    // create product
    const productListData = conf.suiteConf.product_list;
    for (let i = 0; i < productListData.length; i++) {
      await productAPI.createProduct(productListData[i]);
    }
  });

  test.afterEach(async ({ conf }) => {
    //Get product id
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    // Delete product
    await productAPI.deleteProduct(IdsArray);

    //select premium package
    await productPage.page.goto(`https://${conf.suiteConf.domain}/admin/pricing`);
    await settingPage.getLocatorPackagePlan(conf.suiteConf.package_premium).click();
    await settingPage.genLoc(settingPage.xpathBtnConfirmChanges).click();
    await expect(settingPage.genLoc(settingPage.xpathToastMsg)).toHaveText("Confirm plan successfully");
  });

  test(`@SB_CR_PK_FRMU_04 Verify tổng product được phép publish với gói Freemium.`, async ({ conf }) => {
    await test.step(`Thực hiện Published 2 product (Tổng product published của shop là 2)`, async () => {
      await productPage.navigateToMenu("Products");
      for (const product of conf.caseConf.product_publish) {
        await productPage.moreAction(product, conf.caseConf.action);
      }
      await expect(productPage.genLoc(productPage.xpathWarning)).toBeHidden();
    });

    await test.step(`1. Publish 1 product tại màn product list- verify thôn tin hiển thị
    2. Click vào btn "View available pricing plans"`, async () => {
      await productPage.moreAction(conf.caseConf.product_name, conf.caseConf.action);
      await expect(productPage.genLoc(productPage.xpathWarning)).toBeVisible();
      await expect(productPage.genLoc(productPage.xpathAlertTitle)).toHaveText(conf.caseConf.alert_title);
      await productPage.genLoc(productPage.xpathBtnViewPlan).click();
      await expect(settingPage.genLoc(settingPage.xpathTitlePricingPage)).toBeVisible();
      expect(settingPage.page.url()).toEqual(`https://${conf.suiteConf.domain}/admin/pricing`);
    });

    await test.step(`1. Tại màn All product: Thực hiện unpublish 1 product đang publish tại màn product list`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.moreAction(conf.caseConf.product_name, conf.caseConf.action_unpublish);
      await expect(productPage.genLoc(productPage.xpathWarning)).toBeHidden();
    });

    await test.step(`1. Đi vào màn product detail của một product => Publish 
    2. Click vào btn "View available pricing plans"`, async () => {
      await productPage.clickTitleProduct(conf.caseConf.product_name);
      await productPage.page.waitForLoadState("networkidle");
      await productPage.getXpathBtnPublishOrUnpublish(conf.caseConf.action).click();
      await productPage.page.reload();
      await expect(productPage.genLoc(productPage.xpathAlertTitle)).toHaveText(conf.caseConf.alert_title);
      await productPage.genLoc(productPage.xpathBtnViewPlan).click();
      await expect(settingPage.genLoc(settingPage.xpathTitlePricingPage)).toBeVisible();
    });

    await test.step(`Thực hiện upgrade lên gói Basic -> Tại màn All product: verify message`, async () => {
      await settingPage.getLocatorPackagePlan(conf.suiteConf.package).click();
      await settingPage.genLoc(settingPage.xpathBtnConfirmChanges).click();
      await expect(settingPage.genLoc(settingPage.xpathToastMsg)).toHaveText("Confirm plan successfully");
      await productPage.navigateToMenu("Products");
      await expect(productPage.genLoc(productPage.xpathWarning)).toBeHidden();
    });
  });
});

test(`Verify mặc định gán gói freemium sau khi tạo store @SB_CR_PK_FRMU_02 `, async ({
  conf,
  snapshotFixture,
  hiveSBase,
  account,
}) => {
  const accountPage = new AccountPage(account, conf.suiteConf.domain);
  const creatorPage = new CreatorPage(account, conf.suiteConf.domain);
  const hiveSFTool = new HiveStorefrontTool(hiveSBase, conf.suiteConf.hive_domain);
  const settingPage = new SettingPage(account, conf.suiteConf.domain);

  // thực hiện clear shop
  await hiveSFTool.clearShopDataInHive(conf.suiteConf.shop_id);
  await accountPage.page.waitForTimeout(conf.suiteConf.time_out);

  //Hoàn thành survey tạo shop
  await accountPage.selectShopByName(conf.suiteConf.shop_name);
  await accountPage.addYourContact(
    conf.caseConf.onboarding_data.store_coutry,
    conf.caseConf.onboarding_data.per_location,
    conf.caseConf.onboarding_data.phone_number,
  );
  await creatorPage.createCreatorStore(account, conf.caseConf.onboarding_data);
  await accountPage.page.waitForSelector(".icon-in-app-notification");
  const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
  expect(shopDomain).toContain(conf.suiteConf.shop_name);

  await test.step(`Verify Text "You are 14 days left in your trial" ở footer`, async () => {
    await expect(settingPage.genLoc("//p[normalize-space()='You have 14 days left in your trial']")).toBeHidden();
  });

  await test.step(`Chọn menu setting trên thanh menu -> Đi đến setting accounts`, async () => {
    await settingPage.navigateToMenu("Settings");
    await settingPage.openSectionSetting("Account");
    await expect(settingPage.genLoc(settingPage.xpathMemberSince)).toHaveText(conf.caseConf.member_since);
    await expect(settingPage.genLoc(settingPage.xpathCurrentPlan)).toHaveText(conf.suiteConf.current_plan);
    await expect(settingPage.genLoc(settingPage.xpathPackageDescription)).toHaveText(conf.suiteConf.package_premium);
  });

  await test.step(`Click button Upgrade plan`, async () => {
    await settingPage.genLoc(settingPage.xpathBtnUpgradePlan).click();
    await snapshotFixture.verify({
      page: account,
      selector: settingPage.getLocatorPackage(conf.suiteConf.package_premium),
      snapshotName: conf.suiteConf.image,
      snapshotOptions: {
        maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
        threshold: conf.suiteConf.param_threshold,
        maxDiffPixels: conf.suiteConf.max_diff_pixels,
      },
    });
  });
});
