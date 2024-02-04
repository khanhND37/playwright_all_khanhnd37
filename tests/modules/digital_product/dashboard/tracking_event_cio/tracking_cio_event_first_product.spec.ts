import { expect, test } from "@core/fixtures";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { EventCIO } from "@pages/customer_io/tracking_event_cio";
import { CreatorPage } from "@pages/dashboard/creator";
import { AccountPage } from "@pages/dashboard/accounts";
import { ForceShareTheme } from "@pages/dashboard/force_copy_theme";
import { MarketingAndSales } from "@pages/dashboard/marketing_and_sales";
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

  test(`Kiểm tra bắn/không bắn event và nội dung event "create_first_product"
  khi merchant tạo product đầu tiên @SB_CTE_SCE_1`, async ({ account, conf, hiveSBase }) => {
    test.slow();
    const marketingAndSalesPage = new MarketingAndSales(account, conf.suiteConf.domain);
    for (let i = 0; i < conf.caseConf.products.length; i++) {
      const item = conf.caseConf.products[i];

      await test.step(`Tạo thành công shop creator -> chọn module "Products" -> tạo product đầu tiên`, async () => {
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
        await account.goto(`https://${shopDomain}/admin/creator/products?page=1`);
        await dproductPage.openAddProductScreen();
        await dproductPage.addNewProduct(item.first_product.title, item.first_product.handle, item.first_product.type);
        productId = await dproductPage.getDigitalProductID();
      });

      await test.step(`Kiểm tra hiển thị event "create_first_product" trên cio, module Activity Logs`, async () => {
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, conf.caseConf.event_name);
        await customerIOPage.page.waitForTimeout(conf.suiteConf.wait_load);
        attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO).toEqual(
          expect.objectContaining({
            productId: productId,
            productType: item.first_product.type,
            productName: item.first_product.title,
          }),
        );
      });

      await test.step(`Quay lại dashboard shop creator trên, thực hiện tạo thêm 1 product nữa ->
      kiểm tra không bắn event "create_first_product" lên cio, module Activity Logs`, async () => {
        await dproductPage.navigateToMenu("Products");
        await dproductPage.openAddProductScreen();
        await dproductPage.addNewProduct(
          item.second_product.title,
          item.first_product.handle,
          item.second_product.type,
        );
        productId = await dproductPage.getDigitalProductID();
        await customerIOPage.clearFilter();
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, conf.caseConf.event_name);
        await customerIOPage.page.waitForTimeout(conf.suiteConf.wait_load);
        const attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO.productId).not.toEqual(productId);
      });

      await test.step(`Xóa hết tất cả các product ở màn list sau đó tạo mới 1 product
    -> kiểm tra không bắn event "create_first_product"`, async () => {
        await dproductPage.navigateToMenu("Products");
        const isOnboardingPopoverVisible = await account
          .locator("//div[@class='onboarding-popup active apply-spds-layout']")
          .isVisible();
        if (isOnboardingPopoverVisible) {
          await marketingAndSalesPage.closeOnboardingPopup();
        }
        await dproductPage.moreActionMultiProducts("Delete");
        expect(
          await account.innerText("//p[@class ='sb-text-neutral-800 sb-text-bold sb-mt-large sb-mb-small']"),
        ).toEqual("You haven't created any products.");
        await dproductPage.openAddProductScreen();
        await dproductPage.addNewProduct(
          item.second_product.title,
          item.first_product.handle,
          item.second_product.type,
        );
        productId = await dproductPage.getDigitalProductID();
        await customerIOPage.clearFilter();
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, conf.caseConf.event_name);
        const attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO.productId).not.toEqual(productId);
      });
      await customerIOPage.clearFilter();
      await forceShareThemePage.gotoSelectShop();
    }
  });
});
