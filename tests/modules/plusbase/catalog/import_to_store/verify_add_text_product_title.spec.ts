import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";

test.describe.configure({ mode: "parallel" });
test.describe("Kiểm tra lưu thêm text trên product's title", async () => {
  const caseName = "TC_SB_PLB_RGS_1x";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ testcase_id: id, page_title: pageTitle, content: content, option: option }) => {
    test(`Kiểm tra lưu thành công text theo option [${option}] @${id}`, async ({ dashboard }) => {
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
        await expect(dashboard.locator(`(//*[contains(text(),'${pageTitle}')])[1]`)).toBeEnabled();
      });
      await test.step(`Chọn button Add text to product title`, async () => {
        dashboard.locator(`(//*[contains(text(),'${pageTitle}')])[1]`).click();
      });
      await test.step(`Nhập nội dung cho text area`, async () => {
        const xpathTextArea = `(//textarea[@placeholder='Enter your text'])[1]`;
        await dashboard.locator(xpathTextArea).fill("");
        await dashboard.locator(xpathTextArea).fill(content);
      });
      await test.step(`Chọn option "Show this text ${option} of all selected product's title"`, async () => {
        await dashboard.locator('button:has-text("at the beginning")').click();
        if (option == "at the beginning") {
          await dashboard.locator(`(//button[normalize-space()='${option}'])[1]`).click();
        } else await dashboard.locator(`(//*[normalize-space()='${option}'])[1]`).click();
      });
      await test.step(`Bấm nút Save`, async () => {
        await dashboard.locator("//button[normalize-space()='Save']").click();
        expect(await dashboard.locator("(//input[@class='sb-input__input'])[1]").getAttribute("placeholder")).toContain(
          content,
        );
      });
    });
  });
});
