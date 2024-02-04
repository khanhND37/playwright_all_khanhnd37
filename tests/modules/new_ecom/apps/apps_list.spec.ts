import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@utils/theme";
import { AppPage } from "@pages/new_ecom/dashboard/appPage";

test.describe("Verify editor printbase", () => {
  let appPage: AppPage;
  let maxDiffPixelRatio;
  let threshold;
  let maxDiffPixels;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    appPage = new AppPage(dashboard, conf.suiteConf.domain);
    await appPage.navigateToMenu("Apps");
  });

  test("Verify search App tại Apps page @SB_NEWECOM_OMA_15", async ({ conf, dashboard, snapshotFixture }) => {
    const configDataOrderExist = conf.caseConf.DATA_DRIVEN_SEARCH_APP.data;
    for (let i = 0; i < configDataOrderExist.length; i++) {
      const caseData = configDataOrderExist[i];
      await test.step(`${caseData.step}`, async () => {
        const keyword = caseData.keyword;
        await appPage.searchApp(keyword);
        await snapshotFixture.verify({
          page: dashboard,
          selector: appPage.xpathResultSearch,
          snapshotName: `${caseData.picture}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    }
  });

  test("Verify On/Of with Full App @SB_NEWECOM_OMA_16", async ({ conf, dashboard, snapshotFixture }) => {
    await test.step("Tại dashboard, Menu sidebar > chọn Apps > click Apps > click tên app > kiểm tra hiển thị", async () => {
      const configDataOrderExist = conf.caseConf.DATA_DRIVEN_FULL_APP.data;
      for (let i = 0; i < configDataOrderExist.length; i++) {
        const caseData = configDataOrderExist[i];
        const apName = caseData.app_name;
        await appPage.navigateToMenu("Apps");
        await dashboard.click(appPage.xpathAppName(apName));
        await dashboard.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      }
    });

    await test.step("Tại list app, setting toggle = OFF > Click name app> Verify open app", async () => {
      const configDataOrderExist = conf.caseConf.DATA_DRIVEN_FULL_APP.data;
      for (let i = 0; i < configDataOrderExist.length; i++) {
        const caseData = configDataOrderExist[i];
        const apName = caseData.app_name;
        await appPage.navigateToMenu("Apps");
        await dashboard.click(appPage.xpathToggleOnOffAppName(apName));
        await expect(dashboard.locator(appPage.xpathToastMessageApp(apName, caseData.status_off))).toBeVisible();
        await dashboard.click(appPage.xpathAppName(apName));
        await dashboard.waitForTimeout(4000);
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: `${caseData.picture}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      }
    });

    await test.step("Tại list app, setting toggle = ON ", async () => {
      const configDataOrderExist = conf.caseConf.DATA_DRIVEN_FULL_APP.data;
      for (let i = 0; i < configDataOrderExist.length; i++) {
        const caseData = configDataOrderExist[i];
        const apName = caseData.app_name;
        await appPage.navigateToMenu("Apps");
        await dashboard.click(appPage.xpathToggleOnOffAppName(apName));
        await expect(dashboard.locator(appPage.xpathToastMessageApp(apName, caseData.status_on))).toBeVisible();
      }
    });
  });
});
