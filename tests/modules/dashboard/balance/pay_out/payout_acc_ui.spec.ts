import { test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { defaultSnapshotOptions } from "@constants/visual_compare";

test.describe("Verify payout account UI", async () => {
  let balancePage: BalancePage;
  let envRun;
  let fieldDelete;

  test(`@SB_BAL_OLD_BL_126 - kiểm tra UI hiển thị acc Payout tại balance page`, async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    envRun = process.env.ENV;
    await test.setTimeout(conf.suiteConf.time_out);
    await test.step(`Truy cập balance page với url: {{shop_domain}}/admin/balance -> kiểm tra hiển thị acc tại Payout`, async () => {
      await balancePage.goToBalance();
      //wait for acc payoneer complete load
      await balancePage.waitUntilElementInvisible(balancePage.xpathEmailLocalBankAcc);
      await balancePage.page.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: balancePage.page,
        selector: balancePage.xpathSectionPayoutAcc,
        snapshotName: `evidences_payout_old_acc_${envRun}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Tại field Pingpong / Paypal -> click button Edit, xóa acc -> click button Save`, async () => {
      fieldDelete = conf.caseConf.payout_field_delete;
      for (const item of fieldDelete) {
        await balancePage.deleteAccount(item.field);
      }
      //wait for acc payoneer complete load
      await balancePage.waitUntilElementInvisible(balancePage.xpathEmailLocalBankAcc);

      await balancePage.page.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: balancePage.page,
        selector: balancePage.xpathSectionPayoutAcc,
        snapshotName: `evidences_payout_delete_acc_${envRun}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Tại field Pingpong / Paypal -> click button Edit, add thêm acc -> click button Save`, async () => {
      await balancePage.goToBalance();
      await balancePage.updatePayoutAccount(conf.caseConf.email);
      //wait for acc payoneer complete load
      await balancePage.waitUntilElementInvisible(balancePage.xpathEmailLocalBankAcc);
      await balancePage.page.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: balancePage.page,
        selector: balancePage.xpathSectionPayoutAcc,
        snapshotName: `evidences_payout_add_acc_${envRun}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`Reload lại trang > kiểm tra hiển thị`, async () => {
      await balancePage.page.reload();
      await balancePage.page.waitForSelector(balancePage.xpathBlockPayout);
      //wait for acc payoneer complete load
      await balancePage.waitUntilElementInvisible(balancePage.xpathEmailLocalBankAcc);
      await balancePage.page.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: balancePage.page,
        selector: balancePage.xpathSectionPayoutAcc,
        snapshotName: `evidences_payout_acc_reload_${envRun}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step(`tại Local bank acc -> Click btn View account detail > kiểm tra hiển thị`, async () => {
      await balancePage.clickOnBtnWithLabel("View account details");
      await balancePage.waitUntilElementVisible(balancePage.xpathTitlePopupLocalBankAcc);
      await snapshotFixture.verify({
        page: balancePage.page,
        selector: balancePage.xpathEmailLocalBankAcc,
        snapshotName: "evidences_local_bank_acc_detail.png",
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });
});
