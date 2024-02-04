import { expect, test } from "@core/fixtures";
import { HiveContest } from "@pages/hive/hive_contest";
import { loadData } from "@core/conf/conf";

test.describe("Verify enable contest @TC_SB_HP_CT_CTHive", async () => {
  let hiveContest: HiveContest;
  test.beforeEach(async ({ hiveSBase, conf }) => {
    await test.step("Pre-condition: Disable all Contest", async () => {
      hiveContest = new HiveContest(hiveSBase, conf.suiteConf.hive_domain);
      await hiveContest.goto(`https://${conf.suiteConf.hive_domain}/admin/contest/list`);
      await hiveContest.disableAllContest();
    });
  });

  test(`Verify enable contest không cùng shop type và region @SB_HP_CT_CTHive_45`, async ({}) => {
    const caseName = "SB_HP_CT_CTHive_45";
    const data = loadData(__dirname, caseName);

    for (const contest of data.caseConf.contests) {
      const step = contest.step,
        contestName = contest.contest_name,
        isEnable = contest.is_enable;
      await test.step(step, async () => {
        await hiveContest.searchAndEnableContest(contestName, isEnable);
        await hiveContest.clickOnBtnWithLabel("Update and close");

        await expect(hiveContest.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
          "has been successfully updated.",
        );
      });
    }
  });

  test(`Verify enable contest cùng region, cùng shop type @SB_HP_CT_CTHive_46`, async ({}) => {
    const caseName = "SB_HP_CT_CTHive_46";
    const data = loadData(__dirname, caseName);

    for (const contest of data.caseConf.contests) {
      const step = contest.step,
        contestName = contest.contest_name,
        isEnable = contest.is_enable,
        isSuccess = contest.is_success;

      await test.step(step, async () => {
        await hiveContest.searchAndEnableContest(contestName, isEnable);
        await hiveContest.clickOnBtnWithLabel("Update and close");
        if (isSuccess) {
          await expect(hiveContest.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
            "has been successfully updated.",
          );
        } else {
          await expect(hiveContest.genLoc("//div[@class='alert alert-danger alert-dismissable']")).toContainText(
            "Another contest in same region still running, please wait for this contest finish",
          );
          await hiveContest.genLoc("//a[normalize-space()='Contest List']").click();
        }
      });
    }
  });
});
