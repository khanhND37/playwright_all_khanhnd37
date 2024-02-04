import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { AccountPage } from "@pages/dashboard/accounts";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { SettingGeneralPage } from "@pages/dashboard/settings/setting_general";
import { HiveStorefrontTool } from "@pages/hive/hive_storefront_tool";

test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

test.describe("Alert merchant", async () => {
  let accountPage: AccountPage;
  let plusBasePage: DropshipCatalogPage;
  let settingGeneralPage: SettingGeneralPage;

  test.beforeEach(async ({ account, conf, hiveSBase }) => {
    await test.step("Pre-condition: create shop and import aliexpress product", async () => {
      test.slow();
      // Clear shop data
      const hiveSFTool = new HiveStorefrontTool(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSFTool.clearShopDataInHive(conf.suiteConf.shop_id);
      // Wait for consumer clear shop data run done
      await hiveSFTool.page.waitForTimeout(60 * 1000);

      accountPage = new AccountPage(account, conf.suiteConf.domain);
      plusBasePage = new DropshipCatalogPage(account, conf.suiteConf.domain);
      settingGeneralPage = new SettingGeneralPage(account, conf.suiteConf.domain);
      await account.waitForSelector(`//span[normalize-space()='Add a new shop']`);
      await accountPage.selectShopByName(conf.suiteConf.shop_name);
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.addYourContact(
        conf.suiteConf.data.store_country,
        conf.suiteConf.data.per_location,
        conf.suiteConf.data.phone_number,
      );
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.chooseBusinessModel(
        conf.suiteConf.data.business_model,
        conf.suiteConf.data.industry,
        conf.suiteConf.data.platform,
      );
      try {
        await accountPage.waitResponseWithUrl("/complete-survey", 5000);
      } catch {
        await accountPage.genLoc("//button[normalize-space()='Take me to my store']").click();
      }

      await expect(accountPage.genLoc(accountPage.xpathCreateStoreSuccess)).toBeVisible();
      await expect(accountPage.genLoc(accountPage.xpathNotify)).toBeVisible();

      //add aliExpress product
      await plusBasePage.goto(`/admin/plusbase/aliexpress-products`);
      await plusBasePage.page.waitForLoadState("networkidle");
      // Click skip if exist
      await plusBasePage.page.waitForTimeout(2 * 1000);
      const skipStepLoc = plusBasePage.genLoc(plusBasePage.xpathOnboarding.onboardingPopup.skipStep).first();
      let isPopupVisible = await skipStepLoc.isVisible();

      while (isPopupVisible) {
        await skipStepLoc.click();
        await accountPage.waitResponseWithUrl("onboardingorders.json", 5000);
        isPopupVisible = await skipStepLoc.isVisible();
      }
      await plusBasePage.clickOnBtnWithLabel("Add AliExpress product");
      await plusBasePage.fillUrlToRequestProductTextArea(conf.suiteConf.ali_product_url);
      await plusBasePage.clickImportAliexpressLink();
    });
  });

  test(`Hiển thị popup khi merchant import product vào store @SB_PLB_CAS_2`, async ({ conf }) => {
    await test.step(`
    - Thực hiện import to store
    - Thực hiện add product
    -> Click chọn product
    -> Click button Sellect All
    -> Click button Actions
    -> Click option Import selected`, async () => {
      await plusBasePage.goto(`/admin/plusbase/aliexpress-products`);
      await plusBasePage.importProductToStore();
      await plusBasePage.clickOnBtnImportList("Add to store");
      await expect(plusBasePage.genLoc(plusBasePage.xpathTitlePopupImport)).toHaveText(conf.caseConf.title_popup);
      await expect(plusBasePage.genLoc(plusBasePage.xpathDesPopupImport)).toHaveText(conf.caseConf.content_popup);
      await expect(plusBasePage.genLoc(plusBasePage.xpathOptionAllowPopupImport)).toHaveText(conf.caseConf.option_1);
      await expect(plusBasePage.genLoc(plusBasePage.xpathOptionNotAllowPopupImport)).toHaveText(conf.caseConf.option_2);
    });

    await test.step(`Click link text General settings`, async () => {
      await plusBasePage.genLoc(plusBasePage.xpathGeneralSettings).click();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathProductPreferences)).toBeVisible();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathInputValueProductPreferences)).toBeVisible();
    });

    await test.step(`
    - Thực hiện import to store
    - Thực hiện add product
    -> chọn products
    -> click button Actions
    -> click Import selected`, async () => {
      await plusBasePage.goto(`/admin/plusbase/aliexpress-products`);
      await plusBasePage.importProductToStore();
      await plusBasePage.genLoc(plusBasePage.xpathCheckboxSelectAll).click();
      await plusBasePage.selectActionImportProduct("Import selected");
      await expect(plusBasePage.genLoc(plusBasePage.xpathTitlePopupImport)).toBeVisible();
    });

    await test.step(`
    - Thực hiện import to store
    - Thực hiện add product
    -> Click chọn product
    -> Click button Sellect All
    -> click button Add {x} selected products to store`, async () => {
      await plusBasePage.goto(`/admin/plusbase/aliexpress-products`);
      await plusBasePage.importProductToStore();
      await plusBasePage.genLoc(plusBasePage.xpathCheckboxSelectAll).click();
      await plusBasePage.clickOnBtnImportList("selected products to store");
      await expect(plusBasePage.genLoc(plusBasePage.xpathTitlePopupImport)).toBeVisible();
    });
  });

  test(`Đóng popup khi lựa chọn 1 trong 2 option ở màn Import product @SB_PLB_CAS_3`, async ({}) => {
    await test.step(`
    1. Chọn 1 hoặc nhiều products
    -> click button "Add to store".
    2. Click button Save ở popup.
    3. Tiếp tục import product`, async () => {
      await plusBasePage.goto(`/admin/plusbase/aliexpress-products`);
      await plusBasePage.importProductToStore();
      await plusBasePage.clickOnBtnImportList("Add to store");
      await plusBasePage.selectOptionImportProduct("allow");
      await plusBasePage.clickOnBtnImportList("Save");
      await expect(plusBasePage.genLoc(plusBasePage.xpathTitlePopupImport)).toBeHidden();
    });

    await test.step(`Chọn module Settings >> General
    >> scroll xuống cuối trang`, async () => {
      await plusBasePage.goto(`/admin/settings/general`);
      await settingGeneralPage.genLoc(settingGeneralPage.xpathProductPreferences).scrollIntoViewIfNeeded();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathProductPreferences)).toBeVisible();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathProductPreferencesDes)).toBeVisible();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathProductPreferencesLink)).toBeVisible();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathAllowCheckBox)).toBeChecked();
    });

    await test.step(`
    Chọn 1 hoặc nhiều products
 -> click button "Add to store".`, async () => {
      await plusBasePage.goto(`/admin/plusbase/aliexpress-products`);
      await plusBasePage.importProductToStore();
      await plusBasePage.clickOnBtnImportList("Add to store");
      await expect(plusBasePage.genLoc(plusBasePage.xpathTitlePopupImport)).toBeHidden();
    });
  });

  test(`Không hiển thị lại popup khi đã chọn option tại màn Product preferences @SB_PLB_CAS_4`, async ({ conf }) => {
    await test.step(`Navigate đến màn hình General Settings, phần Product preferences
    -> Tích chọn "Allow PlusBase to change your product descriptions if needed."
    -> click button Save`, async () => {
      await settingGeneralPage.goto(`/admin/settings/general`);
      await settingGeneralPage.fillRequiredInfo(
        conf.suiteConf.data.address,
        conf.suiteConf.data.city,
        conf.suiteConf.data.zip_code,
      );
      await settingGeneralPage.genLoc(settingGeneralPage.xpathProductPreferences).scrollIntoViewIfNeeded();
      await settingGeneralPage.selectOptionProductPreferences(
        "Allow PlusBase to change product information if needed.",
      );
      await settingGeneralPage.genLoc(settingGeneralPage.xpathSaveChangedBtn).click();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathMessageSaveChange)).toHaveText(
        conf.caseConf.save_successfully,
      );
    });

    await test.step(`Chọn module Catalog >> Import List
    -> thực hiện add product to store`, async () => {
      await plusBasePage.goto(`/admin/plusbase/aliexpress-products`);
      await plusBasePage.importProductToStore();
      await plusBasePage.clickOnBtnImportList("Add to store");
      await expect(plusBasePage.genLoc(plusBasePage.xpathTitlePopupImport)).toBeHidden();
    });
  });

  test(`Thay đổi lựa chọn của merchant tại phần Product preferences màn General Settings @SB_PLB_CAS_5`, async ({
    conf,
    token,
  }) => {
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;

    await test.step(`
    Thực hiện import to store:
    - Mở trang Aliexpress-products
    - Click chọn 1 product
    - Click button Import to store
    Thực hiện Add product:
    - Click button "Add to store"
   -> Tại popup Before importing, click chọn option "Allow ..." -> click Save button`, async () => {
      await plusBasePage.goto(`/admin/plusbase/aliexpress-products`);
      await plusBasePage.importProductToStore();
      await plusBasePage.clickOnBtnImportList("Add to store");
      await plusBasePage.selectOptionImportProduct("allow");
      await plusBasePage.clickOnBtnImportList("Save");
    });

    await test.step(`Đi đến trang General settings, mục Product Preferences:
    -> Lựa chọn lại option "Change..."
    -> Click button Save`, async () => {
      await settingGeneralPage.goto(`/admin/settings/general`);
      await settingGeneralPage.fillRequiredInfo(
        conf.suiteConf.data.address,
        conf.suiteConf.data.city,
        conf.suiteConf.data.zip_code,
      );
      await settingGeneralPage.genLoc(settingGeneralPage.xpathProductPreferences).scrollIntoViewIfNeeded();
      await settingGeneralPage.selectOptionProductPreferences(
        "Change your own product descriptions when PlusBase send notification.",
      );
      await settingGeneralPage.genLoc(settingGeneralPage.xpathSaveChangedBtn).click();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathMessageSaveChange)).toHaveText(
        conf.caseConf.toast_alert,
      );
    });

    await test.step(`-> Lựa chọn lại option
    -> click button Save ở thời điểm cách lần thay đổi gần nhất > 24 tiếng`, async () => {
      await plusBasePage.updateSettingProductPreferences(conf.suiteConf.domain, accessToken);
      await settingGeneralPage.page.reload({ waitUntil: "networkidle" });
      await settingGeneralPage.fillRequiredInfo(
        conf.suiteConf.data.address,
        conf.suiteConf.data.city,
        conf.suiteConf.data.zip_code,
      );
      await settingGeneralPage.selectOptionProductPreferences(
        "Allow PlusBase to change product information if needed.",
      );
      await settingGeneralPage.genLoc(settingGeneralPage.xpathSaveChangedBtn).click();
      await expect(settingGeneralPage.genLoc(settingGeneralPage.xpathMessageSaveChange)).toHaveText(
        conf.caseConf.save_successfully,
      );
    });
  });
});
