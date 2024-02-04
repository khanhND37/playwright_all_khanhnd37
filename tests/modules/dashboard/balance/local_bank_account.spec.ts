import { expect, test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe.serial("Verify payment method Local bank account", () => {
  let balancePage;
  let dashboardPage;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    await dashboardPage.openBalancePage();
  });

  test(`Verify request payout không thành công khi chưa add thông tin account của Local bank
  @TC_SB_BAL_LBA_10`, async ({ conf, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);

    await test.step(`Click button [Request payout] > Verify thông tin on popup`, async () => {
      await balancePage.clickButtonRequestPayout();
      await expect(dashboard.locator(`//h4[normalize-space()='Request payout']`)).toBeVisible();
      await expect(dashboard.locator("//span[normalize-space()='Local bank account']")).toBeDisabled();
      await expect(dashboard.locator("//button[normalize-space()='Send request']")).toBeDisabled();
    });

    await test.step(`Input [Requested amount] > Verify button [Sent request]`, async () => {
      await balancePage.inputAmount(conf.caseConf.request_amount);
      await expect(
        dashboard.locator("//div[contains(@class,'animation-content')]//button[normalize-space()='Cancel']"),
      ).toBeEnabled();
      await expect(dashboard.locator("//button[normalize-space()='Send request']")).toBeDisabled();
    });

    await test.step(`Click button [Cancel] on popup`, async () => {
      await balancePage.clickCancelOnPopup();
      await expect(dashboard.locator(`//h4[normalize-space()='Request payout']`)).toBeHidden();
    });
  });

  test(`Verify add account detail không thành công khi Cancel sau khi đã input đủ thông tin
  các field @TC_SB_BAL_LBA_4`, async ({ conf, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const accountInfo = conf.caseConf.account_info;

    await test.step(`Click button [Add account details] > Input data valid cho all field >
    Tick on checkbox [I confirm..]`, async () => {
      await balancePage.clickButtonAddAccountDetail();
      await balancePage.inputAccountDetailWithData(accountInfo);
      await balancePage.clickCheckboxConfirm();
      await expect(
        dashboard.locator("//div[contains(@class,'animation-content')]//button[normalize-space()='Cancel']"),
      ).toBeEnabled();
    });

    await test.step(`Click button [Cancel]`, async () => {
      await balancePage.clickCancelOnPopup();
      await expect(dashboard.locator("//span[normalize-space()='Add account details']")).toBeEnabled();
    });
  });

  test(`Verify Add account detail thành công @TC_SB_BAL_LBA_5`, async ({ conf, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const accountInfo = conf.caseConf.account_info;

    await test.step(`Click button [Add account details] > Input data valid cho all field >
    Tick on checkbox [I confirm..]`, async () => {
      await balancePage.clickButtonAddAccountDetail();
      await balancePage.inputAccountDetailWithData(accountInfo);
      await balancePage.clickCheckboxConfirm();
      await expect(dashboard.locator("//span[normalize-space()='Confirm']")).toBeEnabled();
      await balancePage.checkMsgAfterCreated({
        message: conf.caseConf.message,
      });
      await expect(dashboard.locator("//span[normalize-space()='View account details']")).toBeEnabled();
    });
  });

  test(`Verify request payout Local bank không thành công khi request amount không hợp lệ
  @TC_SB_BAL_LBA_11`, async ({ conf, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const requestInfo = conf.caseConf.request_info;
    await test.step(`Click button [Request payout] > Select radio [General] >
    Select radio [Local bank account] > Input [Requested amount] < 50$`, async () => {
      await balancePage.clickButtonRequestPayout();
      await balancePage.requestPayout(requestInfo.source_name, requestInfo.payment_name, requestInfo.request_amount1);
      await expect(dashboard.locator(`//p[normalize-space()='${requestInfo.message1}']`)).toBeVisible();
      await expect(dashboard.locator("//button[normalize-space()='Send request']")).toBeDisabled();
    });

    await test.step(`Input [Requested amount] > amount của [Available to payout]`, async () => {
      await balancePage.inputAmount(requestInfo.request_amount2);
      await expect(dashboard.locator(`//p[normalize-space()='${requestInfo.message2}']`)).toBeVisible();
      await expect(dashboard.locator("//button[normalize-space()='Send request']")).toBeDisabled();
    });
  });

  test(`Verify request payout Local bank thành công @TC_SB_BAL_LBA_12`, async ({ conf, authRequest, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const requestInfo = conf.caseConf.request_info;

    await test.step(`Click button [Request payout] > Select radio [General] > Select radio [Local bank account]
    > Input [Requested amount] > Click button [Send request]`, async () => {
      await balancePage.clickButtonRequestPayout();
      await balancePage.requestPayout(requestInfo.source_name, requestInfo.payment_name, requestInfo.request_amount);
      await balancePage.checkMsgAfterCreated({
        message: conf.caseConf.message,
      });
      await expect(dashboard.locator(`//h4[normalize-space()='Request payout']`)).toBeHidden();
    });

    await test.step(`Click button [View request] > verify thông tin của log request`, async () => {
      const payoutReviewInfo = conf.caseConf.payout_review_info;
      await balancePage.clickButtonViewRequest();
      expect(
        await balancePage.getPayoutInfoDashboardByApi(authRequest, conf.suiteConf.domain, payoutReviewInfo),
      ).toEqual(payoutReviewInfo);
    });

    await test.step(`Back lại trang Balance > Click button [View Invoice]> Verify log invoice`, async () => {
      const invoiceInfo = conf.caseConf.invoice_info;
      await balancePage.clickButtonBack();
      await balancePage.clickButtonViewInvoice();
      expect(await balancePage.getInvoiceInfoDashboardByApi(authRequest, conf.suiteConf.domain, invoiceInfo)).toEqual(
        invoiceInfo,
      );
    });
  });

  test(`Verify delete account detail thành công @TC_SB_BAL_LBA_8`, async ({ conf, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);

    await test.step(`Click icon Xóa bên cạnh button [View account details] >Clickbutton[Save]`, async () => {
      await balancePage.deleteAccount();
      await balancePage.checkMsgAfterCreated({
        message: conf.caseConf.message,
      });
      await expect(dashboard.locator("//span[normalize-space()='Add account details']")).toBeEnabled();
    });
  });
});
