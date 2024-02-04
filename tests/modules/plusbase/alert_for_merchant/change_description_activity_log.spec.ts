import { expect, test } from "@core/fixtures";

test.describe("Activity log", async () => {
  let domain;
  let productID;
  const productDescriptionUpdate = "product" + Math.floor(Date.now() / 1000);

  test(`Kiểm tra lưu log sau khi merchant tự update description product @SB_PLB_CAS_9`, async ({ dashboard, conf }) => {
    domain = conf.suiteConf.domain;
    productID = conf.suiteConf.product_id;

    await test.step(`Mở trang product detail
    -> thực hiện thay đổi product description
    -> click button Save`, async () => {
      await dashboard.getByRole("link", { name: "Dropship products" }).click();
      await dashboard.getByRole("link", { name: "All products" }).click();
      await dashboard.goto(`https://${domain}/admin/products/${productID}`);
      await dashboard
        .frameLocator(`[title='Rich Text Area']`)
        .locator(`//body[@id='tinymce']`)
        .fill(productDescriptionUpdate);
      await dashboard.locator(`//button[normalize-space()='Save changes']`).click();
      await expect(
        dashboard.locator(`//div[contains(@class, 's-toast') and normalize-space()='Product was successfully saved!']`),
      ).toBeVisible();
    });

    await test.step(`- Mở trang Acitvity log
    - Click vào activity log đầu tiên`, async () => {
      await dashboard.goto(`https://${domain}/admin/settings/account/activities`);
      await dashboard.waitForSelector(`//table[@class='s-table s-paragraph table-hover activity-table']`);
      const userName = await dashboard.innerText(`(//tbody//tr/td)[1]`);
      expect(userName).toEqual(conf.suiteConf.username);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(`(//tbody//tr/td)[1]`).click();
      const codeString = await dashboard.innerText(`//tr[@class='activity-detail is-expanding']//code`);
      const codeJson = JSON.parse(codeString);
      // Verify productName = Product title
      const productNameActivityLog = codeJson.product_title;
      expect(productNameActivityLog).toEqual(conf.suiteConf.product_title);
    });

    await test.step(`- Click text link See detail
    - Click icon X`, async () => {
      await dashboard.locator(`(//a[normalize-space()='See details.'])[1]`).click();
      await expect(dashboard.locator(`//h4[normalize-space()='Preview description changes']`)).toBeVisible();
      // Verify product description trong activity log = product description update
      const descriptionActivityLog = await dashboard.innerText(`(//div[@class='s-modal-body']//div)[2]`);
      expect(descriptionActivityLog).toEqual(productDescriptionUpdate);
      // Verify click vào icon X thì tắt popup
      await dashboard.locator(`//button[@class='s-modal-close is-large']`).click();
      await expect(dashboard.locator(`//h4[normalize-space()='Preview description changes']`)).toBeHidden();
    });
  });
});
