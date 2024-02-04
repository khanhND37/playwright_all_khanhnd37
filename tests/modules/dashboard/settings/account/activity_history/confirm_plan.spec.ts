import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import config from "./config.json";

test.describe.serial(`Test feature Reduce task support related to Balance & Billing (Dashboard)`, async () => {
  const caseName = "confirm_plan";
  const conf = loadData(__filename, caseName);
  conf.caseConf.data.forEach(({ test_case_id: id, title: title }) => {
    test(`[Dashboard] Kiểm tra thêm event log liên quan đến action ${title}
  trong Activity history @TC_${id}`, async ({ dashboard }) => {
      let confirmPlan: ConfirmPlanPage;
      let currentPlan: string;
      let nextPlan: string;

      await test.step(`Chọn Upgrade plan (Activate My Plan)`, async () => {
        confirmPlan = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
        expect(dashboard.locator("//span[normalize-space()='Settings']")).toBeDefined();
        currentPlan = await confirmPlan.getCurrentPlan();
        confirmPlan.gotoPickAPlan();
      });

      await test.step(`Chọn plan`, async () => {
        for (let i = 0; i < config.plan.length; i++) {
          if (currentPlan == conf.suiteConf.plan[i].name) {
            switch (i + 1) {
              case 1:
                nextPlan = conf.suiteConf.plan[1].name;
                break;
              case 2:
                nextPlan = conf.suiteConf.plan[2].name;
                break;
              case 3:
                nextPlan = conf.suiteConf.plan[0].name;
                break;
            }
          }
        }
        const xpathBtn = `//div[@class='pricing' and descendant::div[normalize-space()='${nextPlan}']]//button`;
        expect(dashboard.locator(xpathBtn)).toBeDefined();
        await dashboard.locator(xpathBtn).click();
        await dashboard.waitForSelector("button:has-text('Confirm changes')");
        await dashboard.locator("button:has-text('Confirm changes')").click();
        const xpathConfirmSuccess = "(//div[normalize-space()='Confirm plan successfully'])[1]";
        expect(dashboard.locator(xpathConfirmSuccess)).toBeDefined();
      });

      await test.step(`Truy cập menu Settings > Account`, async () => {
        await dashboard.locator("(//span[normalize-space()='Settings'])[1]").click();
        await dashboard.locator("(//p[normalize-space()='Account'])[1]").click();
      });

      await test.step(`Chọn button View all từ block Activity history`, async () => {
        const xpathBtn = "(//button[descendant::span[normalize-space()='View all']])[1]";
        expect(dashboard.locator(xpathBtn)).toBeDefined();
        await dashboard.locator(xpathBtn).click();
      });

      await test.step(`Chọn filter theo Category là Account`, async () => {
        const xpathBtnCategory = "//button[normalize-space()='Category']";
        const xpathCategory = "(//*[contains(@class, 'shop-list')]//label[@title='Account'])[1]";
        expect(dashboard.locator(xpathBtnCategory)).toBeDefined();
        await dashboard.locator(xpathBtnCategory).click();
        expect(dashboard.locator(xpathCategory)).toBeDefined();
        await dashboard.locator(xpathCategory).click();
      });

      await test.step(`Chọn filter theo Activity là ${conf.caseConf.title}`, async () => {
        const xpathBtnActivity = "(//button[normalize-space()='Activity'])[1]";
        const xpathActivity = `(//*[contains(@class, 'shop-list')]//label[@title='${conf.caseConf.title}'])[1]`;
        expect(dashboard.locator(xpathBtnActivity)).toBeDefined();
        await dashboard.locator(xpathBtnActivity).click();
        expect(dashboard.locator(xpathActivity)).toBeDefined();
        await dashboard.locator(xpathActivity).click();
      });

      await test.step(`Kiểm tra kết quả filter`, async () => {
        await expect(dashboard.locator("//table/tbody//tr[1]//td[1]")).toContainText(conf.suiteConf.username);
        await expect(dashboard.locator("//table/tbody//tr[1]//td[2]")).toContainText(`Account`);
        await expect(dashboard.locator("//table/tbody//tr[1]//td[3]")).toContainText(conf.caseConf.title);
        await expect(dashboard.locator("//table/tbody//tr[1]//td[4]")).toContainText(conf.caseConf.title);
        await dashboard.locator("//table/tbody//tr[1]//td[1]").click();
        await expect(dashboard.locator("//table/tbody//tr[2]//td[1]//pre")).toContainText(nextPlan);
      });
    });
  });
});
