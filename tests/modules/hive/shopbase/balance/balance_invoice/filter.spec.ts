import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";

test.describe.parallel(`Test feature Reduce task support related to Balance & Billing (Dashboard)`, async () => {
  const caseName = "filter_balance_invoice_list";
  const conf = loadData(__filename, caseName);
  conf.caseConf.data.forEach(({ test_case_id: id, type: type, description: description, tag_name: tagName }) => {
    test(`[Hive] Kiểm tra support search trong balance invoice list @TC_${id}`, async ({ page, conf }) => {
      const hiveSbase = new HiveSBaseOld(page, conf.suiteConf.domain);
      const account = conf.suiteConf.username;
      const password = conf.suiteConf.password;

      const date = new Date();
      const today = [date.getDate(), date.getMonth(), date.getFullYear()];

      await test.step(`Bấm Filter`, async () => {
        await hiveSbase.loginToHiveShopBase({ account, password });
        await hiveSbase.goToBalanceInvoiceList();
        await expect(page).toHaveURL("https://" + conf.suiteConf.domain + "/admin/app/balanceinvoice/list");
        await page.locator(`//a[@class='dropdown-toggle sonata-ba-action']//i[@class='fa fa-filter']`).click();
      });

      await test.step(`Chọn Content và UserId`, async () => {
        await page.locator(`//descendant::a[normalize-space()='User Id']`).click();
        await page.locator(`//descendant::a[normalize-space()='${type}']`).click();
      });

      await test.step(`Filter theo Content`, async () => {
        await page.locator(`input[name="filter[user__id][value]"]`).click();
        await page.locator(`input[name="filter[user__id][value]"]`).fill(conf.suiteConf.user_id);
        // await page.locator(`input[name="${tagName}"]`).click();
        if (type.includes(`Date`)) {
          const month = `(//div[@class='select2-result-label'])[${today[1] + 1}]`;
          const day = `(//div[@class='select2-result-label'])[${today[0]}]`;
          const year = `//div[@class='select2-result-label' and normalize-space()='${today[2]}']`;
          const monthSelector = "(//div[@id='filter_createdAt_value']//span[@class='select2-chosen'])[1]";
          const daySelector = "(//div[@id='filter_createdAt_value']//span[@class='select2-chosen'])[2]";
          const yearSelector = "(//div[@id='filter_createdAt_value']//span[@class='select2-chosen'])[3]";
          await page.locator(monthSelector).click();
          await page.locator(month).click();
          await page.locator(daySelector).click();
          await page.locator(day).click();
          await page.locator(yearSelector).click();
          await page.locator(year).click();
        } else {
          await page.locator(`input[name="${tagName}"]`).fill(description);
        }
        await page.locator(`(//button[@placeholder='Filter' or normalize-space()='Filter'])[1]`).click();
      });

      await test.step(`Verify hiển thị kết quả filter theo content`, async () => {
        await expect(page.locator(`//table/tbody//tr[1]//td[3]`)).toContainText(conf.suiteConf.username);
        if (type.includes(`Shop domain`)) {
          await expect(page.locator(`//table/tbody//tr[1]//td[2]`)).toContainText(description);
        } else if (type.includes(`Date`)) {
          await expect(page.locator(`//table/tbody//tr[1]//td[7]`)).toContainText(today[0] + ", " + today[2]);
        } else if (type.includes(`Content`)) {
          await expect(page.locator(`//table/tbody//tr[1]//td[6]`)).toContainText(description);
        }
      });
    });
  });
});
