import { expect, test } from "@core/fixtures";

test.describe.parallel(`Test feature Revise Google Shopping on PB/PLB (Dashboard)`, async () => {
  test("Kiểm tra UI 'Add text to product title' @TC_SB_PLB_RGS_8", async ({ dashboard, conf }) => {
    await test.step(`Chọn Catalog trên menu dashboard`, async () => {
      await dashboard
        .locator("(//*[contains(@href, '/admin/plusbase/catalog') or normalize-space()='Settings'])[1]")
        .click();
    });
    await test.step(`Add to list một product`, async () => {
      await dashboard.hover(
        `(//div[contains(@class, 'sb-flex text-decoration-none sb-flex-direction-column product')])[1]`,
      );
      await dashboard.locator(`(//*[contains(text(),'Add to list')])[1]`).click();
    });
    await test.step(`Chọn button Import 1 selected products to store`, async () => {
      await dashboard.locator("(//button//*[contains(text(), 'Import 1 selected products to store')])[1]").click();
    });
    await test.step(`Chọn Select all products`, async () => {
      await dashboard.locator(".sb-check").first().click();
    });
    await test.step(`Chọn Action và kiểm tra có button Add text to product title`, async () => {
      await dashboard.locator("(//button//*[contains(text(),'Actions')])[1]").click();
      await expect(dashboard.locator(`(//*[contains(text(),'${conf.caseConf.title}')])[1]`)).toBeEnabled();
    });
    await test.step(`Chọn button Add text to product title`, async () => {
      dashboard.locator(`(//*[contains(text(),'${conf.caseConf.title}')])[1]`).click();
    });
    await test.step(`Nhập nội dung cho text area`, async () => {
      await expect(
        dashboard.locator(
          `(//textarea[@placeholder='${conf.caseConf.textarea}'` + `and @maxlength=${conf.caseConf.maxlength}])[1]`,
        ),
      ).toBeEnabled();
      // Verify hien thi Estimated characters
      await expect(dashboard.locator(`(//small[contains(text(),'${conf.caseConf.limit_text}')])[1]`)).toBeVisible();
      // Verify hien thi select option show text on legal page
      let k = 0;
      do {
        await expect(
          dashboard.locator(`(//*[normalize-space()='${conf.caseConf.select[k].option}'])[1]`),
        ).toBeEnabled();
        k++;
      } while (k < 2);
    });
    await test.step(`Bấm nút Cancel`, async () => {
      await dashboard.locator("//button[normalize-space()='Cancel']").click();
    });
  });
});
