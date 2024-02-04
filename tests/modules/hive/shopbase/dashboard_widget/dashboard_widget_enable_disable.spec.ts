import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";

test.describe("Verrify việc enable / disable một widget", async () => {
  test(`Verrify việc enable / disable một widget @SB_HM_WG_5`, async ({ hiveSBase, account, conf }) => {
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const dataItem = conf.caseConf.data[i];

      await test.step(`Thực hiện thay đổi trạng thái widget`, async () => {
        await hiveSBase.goto(`${conf.caseConf.widget_url}`);
        await hiveSBase.locator(`//span[normalize-space()='Enable']//preceding-sibling::div`).click();
        await hiveSBase.locator(`//button[normalize-space()='Update']`).click();
      });

      await test.step(`Login store`, async () => {
        const accountPage = new AccountPage(account, conf.caseConf.domain);
        //Dùng tool clear data để tạo mới shop
        await accountPage.clearShopData(conf.suiteConf.link_hive, conf.suiteConf.shop_id);
        await account.goto(
          `https://${conf.suiteConf.accounts_domain}/shop/add/survey?shop_id=${conf.suiteConf.shop_id}`,
        );

        //Hoàn thành servey tạo shop
        await accountPage.addYourContact(
          conf.suiteConf.store_country,
          conf.suiteConf.per_location,
          conf.suiteConf.phone_number,
        );
        await accountPage.chooseBusinessModel(
          conf.suiteConf.business_model,
          conf.suiteConf.industry,
          conf.suiteConf.platform,
        );
        await account.locator(`//span[contains(text(),'No thanks')]`).click();
        await account.locator(`//span[normalize-space()='Take me to my store']`).click();

        await account.waitForTimeout(30000);
        //Hiển thị đúng widget tương ứng theo business type
        await expect(account.locator(`//p[@class='user-email text-truncate']`)).toBeVisible();
        await account.reload({ waitUntil: "networkidle" });
        const xpathWidget = `//h5[normalize-space()='${conf.caseConf.widget}']`;
        if (dataItem.status == "enable") {
          await expect(account.locator(xpathWidget)).toBeVisible();
        } else await expect(account.locator(xpathWidget)).toBeHidden();
      });
    }
  });
});
