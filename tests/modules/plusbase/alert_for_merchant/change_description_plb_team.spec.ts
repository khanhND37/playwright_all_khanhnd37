import { expect, test } from "@core/fixtures";
import { HiveStorefrontTool } from "@pages/hive/hive_storefront_tool";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";

test.describe("Change description by Plusbase team", async () => {
  const productDescriptionUpdate = "qa test update description" + Math.floor(Date.now() / 1000);

  test(`@SB_PLB_CAS_7 Kiểm tra hiển thị log sau khi shopbase staff login và thay đổi thành công description của product trong store merchant`, async ({
    conf,
    hiveSBase,
    context,
    dashboard,
  }) => {
    const domain = conf.suiteConf.domain;
    const productName = conf.suiteConf.product_title;
    const hiveSFTool = new HiveStorefrontTool(hiveSBase, conf.suiteConf.hive_domain);
    const emailMerchant = conf.suiteConf.acc_seller.username;
    const shopName = conf.suiteConf.acc_seller.shop_name;
    const reason = conf.caseConf.reason;
    const dashBoardPage = new DashboardPage(dashboard, domain);

    await test.step(`Đăng nhập hive shopbase -> thực hiện login as vào account của merchant -> mở dashboard shop plusbase -> chọn module Product -> thực hiện thay đổi description của product bất kì`, async () => {
      //login to hive shopbase
      await hiveSFTool.navigateToSubMenu("Shop", "Users");
      //Filter user email of merchant
      await hiveSFTool.filterMerchantByEmail(emailMerchant);
      const [newTab] = await Promise.all([context.waitForEvent("page"), await hiveSFTool.loginToMerchantShop()]);
      await newTab.locator(`//input[@name='reason']`).click();
      await newTab.locator(`//input[@name='reason']`).fill(reason);
      await newTab.locator(`//button[normalize-space()='Login']`).click();
      await newTab.locator(`(//span[normalize-space()="${shopName}"])[1]`).click();
      await newTab.waitForLoadState("networkidle");

      const productPage = new ProductPage(newTab, domain);
      //mở detail product, change des
      await productPage.navigateToSubMenu("Dropship products", "All products");
      await productPage.searchProdByName(productName);
      await productPage.chooseProduct(productName);
      await newTab
        .frameLocator(`[title='Rich Text Area']`)
        .locator(`//body[@id='tinymce']`)
        .fill(productDescriptionUpdate);
      await newTab.locator(`//button[normalize-space()='Save changes']`).click();
    });

    await test.step(`Chọn module "Settings >> Account" - > click button View all tại phần "Activity history" -> filter theo input data-> kiểm tra hiển thị thêm log mới`, async () => {
      await dashBoardPage.goto(`/admin/settings/account/activities`);
      await dashBoardPage.page.waitForSelector(`//table[@class='s-table s-paragraph table-hover activity-table']`);
      //verify user name
      const userName = await dashBoardPage.page.innerText(`(//tbody//tr/td)[1]`);
      expect(userName).toEqual(conf.caseConf.user_name);
      await dashBoardPage.page.waitForLoadState("networkidle");
      await dashBoardPage.page.locator(`(//tbody//tr/td)[1]`).click();
      const codeString = await dashBoardPage.page.innerText(`//tr[@class='activity-detail is-expanding']//code`);
      const codeJson = JSON.parse(codeString);
      // Verify productName = Product title
      const productNameActivityLog = codeJson.product_title;
      expect(productNameActivityLog).toEqual(conf.suiteConf.product_title);
    });

    await test.step(`1. Click text link See detail ở cột Details của log đó -> kiểm tra popup Preview changes.  2. Click icon X`, async () => {
      await dashBoardPage.page.locator(`(//a[normalize-space()='See details.'])[1]`).click();
      await expect(dashBoardPage.page.locator(`//h4[normalize-space()='Preview description changes']`)).toBeVisible();
      // Verify product description trong activity log = product description update
      const descriptionActivityLog = await dashBoardPage.page.innerText(`(//div[@class='s-modal-body']//div)[2]`);
      expect(descriptionActivityLog).toEqual(productDescriptionUpdate);
      // Verify click vào icon X thì tắt popup
      await dashBoardPage.page.locator(`//button[@class='s-modal-close is-large']`).click();
      await expect(dashBoardPage.page.locator(`//h4[normalize-space()='Preview description changes']`)).toBeHidden();
    });
  });
});
