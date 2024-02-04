import { expect, test } from "@core/fixtures";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { EventCIO } from "@pages/customer_io/tracking_event_cio";
import { CreatorPage } from "@pages/dashboard/creator";
import { AccountPage } from "@pages/dashboard/accounts";
import { ForceShareTheme } from "@pages/dashboard/force_copy_theme";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe("Verify event trên customer io", async () => {
  let dproductPage: DigitalProductPage;
  let productId;
  let customerIOPage: EventCIO;
  let accountPage: AccountPage;
  let creatorPage: CreatorPage;
  let forceShareThemePage: ForceShareTheme;
  let attributeEventCIO;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ account, conf, page }) => {
    customerIOPage = new EventCIO(page, conf.suiteConf.domain);
    dproductPage = new DigitalProductPage(account, conf.suiteConf.domain);
    accountPage = new AccountPage(account, conf.suiteConf.domain);
    creatorPage = new CreatorPage(account, conf.suiteConf.domain);
    forceShareThemePage = new ForceShareTheme(account, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(account, conf.suiteConf.domain);
    await customerIOPage.loginCustomerIo(conf.suiteConf.email_customer, conf.suiteConf.pwd);
    await customerIOPage.selectWorkspaces(conf.suiteConf.cio_workspaces);
    await page.waitForSelector("//h1[normalize-space()='Dashboard']");
    await customerIOPage.selectModule(conf.suiteConf.module);
  });

  test(`Kiểm tra bắn event và nội dung event "create_first_upsell"
  khi merchant tạo upsell lần đầu tiên cho product @SB_CTE_SCE_5`, async ({ account, conf, hiveSBase }) => {
    test.slow();
    for (let i = 0; i < conf.caseConf.products.length; i++) {
      const dataItem = conf.caseConf.products[i];

      await test.step(`Tạo thành công shop creator -> chọn module "Products" -> tạo các product`, async () => {
        //Dùng tool clear data để tạo mới shop
        const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
        await hiveSB.clearShopDataInHive(conf.suiteConf.shop_id);
        expect(await hiveSBase.innerText("//div[@class='alert alert-dismissible alert-success']")).toContain(
          "Publish message success",
        );
        await accountPage.page.waitForTimeout(conf.suiteConf.time_out);
        //Hoàn thành servey tạo shop
        await accountPage.selectShopByName(conf.suiteConf.shop_name);
        await creatorPage.createCreatorStore(account, conf.caseConf.onboarding_data);
        await dashboardPage.waitUtilNotificationIconAppear();
        const shopDomain = await account.innerText(`(//p[@class='text-truncate font-12'])[1]`);
        expect(shopDomain).toContain(conf.suiteConf.shop_name);
        //Đi đến trang Product -> tạo product
        for (let j = 0; j < conf.caseConf.products.length; j++) {
          const item = conf.caseConf.products[j];
          await account.goto(`https://${shopDomain}/admin/creator/products?page=1`);
          await dproductPage.openAddProductScreen();
          await dproductPage.addNewProduct(item.title, item.handle, item.type);
          await dproductPage.waitUntilElementInvisible("//div[contains(@class,'sb-toast__message')]");

          if (item.pricing.type === "One-time payment") {
            await dproductPage.switchTab("Pricing");
            await account.waitForSelector("(//button[contains(@class,'sb-button--select')])[1]");
            await dproductPage.settingPricingTab(item.pricing.type, item.pricing.title, item.pricing.amount);
            await dproductPage.waitUntilElementVisible("//div[contains(@class,'sb-toast__message')]");
          }
        }
      });

      await test.step(`Thực hiện tạo upsell đầu tiên cho một product ở shop creator`, async () => {
        await dproductPage.clickBackScreen();
        await account.locator(`//p[normalize-space()='${dataItem.title}']`).click();
        productId = await dproductPage.getDigitalProductID();
        await dproductPage.clickTabCheckout();
        await dproductPage.clickBtnAddUpsell(conf.caseConf.label.button_upsell_first_time);
        await dproductPage.searchAndSelectProductUpsell(dataItem.product_upsell_1);
        await dproductPage.clickBtnOnPopup("Save");
        const xpathProductUpsell =
          `(//p[text()='Upsell offer']//ancestor::div[contains(@class,'sb-p-medium offer')]` +
          `//p[normalize-space()='${dataItem.product_upsell_1}'])[1]`;
        await expect(account.locator(xpathProductUpsell)).toBeVisible();
        await dproductPage.clickSaveGeneral();
        await dproductPage.waitUntilElementInvisible("//p[normalize-space()='Save product to customize offer page']");
      });

      await test.step(`Kiểm tra attribute event "create_first_upsell" bắn lên cio, module Activity Logs`, async () => {
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, conf.caseConf.event_name);
        await customerIOPage.page.waitForTimeout(conf.suiteConf.wait_load);
        attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO).toEqual(
          expect.objectContaining({
            productId: productId,
            productType: dataItem.type,
            productName: dataItem.title,
            productPricingType: dataItem.pricing.type,
          }),
        );
      });

      await test.step(`Kiểm tra không bắn event khi tạo thêm upsell thứ 2 ở shop creator trên`, async () => {
        await dproductPage.clickBtnAddUpsell(conf.caseConf.label.button_upsell_not_first_time);
        await dproductPage.searchAndSelectProductUpsell(dataItem.product_upsell_2);
        await dproductPage.clickBtnOnPopup("Save");
        const xpathProductUpsell =
          `(//p[text()='Upsell offer']//ancestor::div[contains(@class,'sb-p-medium offer')]` +
          `//p[normalize-space()='${dataItem.product_upsell_2}'])[1]`;
        await expect(account.locator(xpathProductUpsell)).toBeVisible();
        await dproductPage.clickSaveGeneral();
        await dproductPage.waitUntilElementInvisible("//p[normalize-space()='Save product to customize offer page']");
        await customerIOPage.clearFilter();
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, conf.caseConf.event_name);
        await customerIOPage.page.waitForTimeout(conf.suiteConf.wait_load);
        const attributeEventCIOAfter = await customerIOPage.getAttributeEvent(
          conf.suiteConf.name,
          conf.suiteConf.email,
        );
        expect(attributeEventCIOAfter.createdAt).toEqual(attributeEventCIO.createdAt);
      });

      await test.step(`Tạo upsell cho product khác
       -> kiểm tra không bắn event "create_first_upsell" lên cio`, async () => {
        await dproductPage.clickBackScreen();
        await account.waitForSelector(`//p[normalize-space()='${dataItem.product_upsell_2}']`);
        await account.locator(`//p[normalize-space()='${dataItem.product_upsell_2}']`).click();
        productId = await dproductPage.getDigitalProductID();
        await account.waitForLoadState("load");
        await dproductPage.clickTabCheckout();
        await dproductPage.clickBtnAddUpsell(conf.caseConf.label.button_upsell_first_time);
        await dproductPage.searchAndSelectProductUpsell(dataItem.product_upsell_1);
        await dproductPage.clickBtnOnPopup("Save");
        const xpathProductUpsell =
          `(//p[text()='Upsell offer']//ancestor::div[contains(@class,'sb-p-medium offer')]` +
          `//p[normalize-space()='${dataItem.product_upsell_1}'])[1]`;
        await expect(account.locator(xpathProductUpsell)).toBeVisible();
        await dproductPage.clickSaveGeneral();
        await dproductPage.waitUntilElementInvisible("//p[normalize-space()='Save product to customize offer page']");
        await customerIOPage.clearFilter();
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, conf.caseConf.event_name);
        await customerIOPage.page.waitForTimeout(conf.suiteConf.wait_load);
        const attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO.productId).not.toEqual(productId);
        await customerIOPage.clearFilter();
        await forceShareThemePage.gotoSelectShop();
      });
    }
  });
});
