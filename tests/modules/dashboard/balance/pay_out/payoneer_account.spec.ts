import { expect, test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { InvoicePage } from "@pages/dashboard/invoice";
import { Page } from "@playwright/test";
import { loadData } from "@core/conf/conf";
import { HiveBalance } from "@pages/hive/hive_balance";

test.describe("Verify connect payoneer account", async () => {
  let balancePage: BalancePage;
  let dashboardPage: DashboardPage;
  let signInPage: Page;

  test.beforeEach(async ({ dashboard, conf }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    await dashboardPage.openBalancePage();
  });

  test(`Check sign in account khi merchant chưa set account payoneer @SB_BAL_PON_40`, async ({ conf }) => {
    await balancePage.page.locator(balancePage.xpathBlockPayout).scrollIntoViewIfNeeded();
    const isBtnDeleteVisible = await balancePage.page.locator(balancePage.xpathBtnDeletePayoneerAccount).isVisible();
    if (isBtnDeleteVisible) {
      await balancePage.deleteAccountPayoneer();
      await balancePage.waitUntilElementInvisible(balancePage.xpathBtnDeletePayoneerAccount);
    }

    await test.step(`Tại trang Balance, scroll xuống phần Payout -> kiểm tra hiển thị button Connect with Payoneer`, async () => {
      await expect(balancePage.page.locator(balancePage.xpathBtnConnectWithPayoneer)).toBeVisible();
    });

    await test.step(`Click button Connect with Payoneer > Tại trang sign up account payoneer, click textlink Click Here > kiểm tra mở popup sign in`, async () => {
      const [signUpPage] = await Promise.all([
        balancePage.page.waitForEvent("popup"),
        balancePage.page.locator(balancePage.xpathBtnConnectWithPayoneer).click(),
      ]);
      const [newPage] = await Promise.all([
        signUpPage.waitForEvent("popup"),
        signUpPage.locator(balancePage.xpathClickHereInSignUpPayoneerPage).click(),
      ]);
      signInPage = newPage;
      expect(newPage.url()).toContain(conf.suiteConf.url_login);
    });

    await test.step(`Thực hiện sign in account thành công -> kiểm tra tắt popup, đóng tab sign up và update email ở trang Balance dashboard`, async () => {
      const loginPage = new BalancePage(signInPage, "");
      await loginPage.loginPayoneerAccount(
        conf.suiteConf.account_payoneer.email,
        conf.suiteConf.account_payoneer.password,
      );
      const email = await balancePage.getEmailAccountConnect();
      expect(email).toEqual(conf.suiteConf.account_payoneer.email);
      await expect(balancePage.page.locator(balancePage.xpathBtnDeletePayoneerAccount)).toBeVisible();
    });
  });

  test(`Check xóa account payoneer đã connect và connect lại @SB_BAL_PON_43`, async ({ conf }) => {
    await balancePage.page.locator(balancePage.xpathBlockPayout).scrollIntoViewIfNeeded();
    await balancePage.page.waitForSelector(balancePage.xpathIsConnectedPayoneer);
    const isBtnConnectVisible = await balancePage.page.locator(balancePage.xpathBtnConnectWithPayoneer).isVisible();
    if (isBtnConnectVisible) {
      await balancePage.connectAccountPayoneer(
        conf.suiteConf.account_payoneer.email,
        conf.suiteConf.account_payoneer.password,
      );
      const email = await balancePage.getEmailAccountConnect();
      expect(email).toEqual(conf.suiteConf.account_payoneer.email);
    }

    await test.step(`Tại trang Balance, scroll xuống phần Payout -> click icon Delete ở phần email account Payoneer`, async () => {
      await balancePage.page.click(balancePage.xpathBtnDeletePayoneerAccount);
      expect(await balancePage.page.innerText(balancePage.xpathTitlePopupDeleteAccPayoneer)).toEqual(
        conf.caseConf.confirm_text,
      );
      await expect(balancePage.page.locator(balancePage.xpathBtnCancelInPopupDelete)).toBeVisible();
      await expect(balancePage.page.locator(balancePage.xpathBtnDeletePayoneerAccount)).toBeVisible();
    });

    await test.step(`Chọn Cancel hoặc button X -> kiểm tra hiển thị email account payoneer đã connect`, async () => {
      await balancePage.page.click(balancePage.xpathBtnCancelInPopupDelete);
      await expect(balancePage.page.locator(balancePage.xpathTitlePopupDeleteAccPayoneer)).toBeHidden();
    });

    await test.step(`Click lại icon Delete ở phần email account Payoneer -> click button Confirm -> kiểm tra hiển thị email account payoneer đã connect`, async () => {
      await balancePage.deleteAccountPayoneer();
      await balancePage.waitUntilElementInvisible(balancePage.xpathEmailPayoneer);
      await expect(balancePage.page.locator(balancePage.xpathBtnConnectWithPayoneer)).toBeVisible();
    });

    if (isBtnConnectVisible) {
      await balancePage.connectAccountPayoneer(
        conf.suiteConf.account_payoneer.email,
        conf.suiteConf.account_payoneer.password,
      );
      const email = await balancePage.getEmailAccountConnect();
      expect(email).toEqual(conf.suiteConf.account_payoneer.email);
    }
  });
});

test.describe("Verify payoneer account", async () => {
  let balancePage: BalancePage;
  let dashboardPage: DashboardPage;
  let payOutId: number;

  test.beforeEach(async ({ dashboard, conf }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    await dashboardPage.openBalancePage();
  });
  const caseData = loadData(__dirname, "DATA_DRIVEN");
  for (const caseDataItem of caseData.caseConf.data) {
    const requestInfo = caseDataItem.request_info;
    const payoutReviewInfo = caseDataItem.payout_review_info;
    const invoiceReviewInfo = caseDataItem.invoice_review_info;
    const invoiceFilter = caseDataItem.invoice_filter;
    const invoiceReviewInfoAfter = caseDataItem.invoice_review_info_after;
    const payoutStatusApprove = caseDataItem.payout_status_approve;
    const payoutReviewInfoAfter = caseDataItem.payout_review_info_after;
    const infoRefund = caseDataItem.info_refund;

    test(`${caseDataItem.description} @${caseDataItem.case_name}`, async ({
      hiveSBase,
      dashboard,
      conf,
      authRequest,
    }) => {
      //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
      if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
        return;
      }
      const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
      const invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
      const requestAmount = Number(requestInfo.request_amount);
      // refund for available to payout
      await hiveBalance.executeChargeOrRefundBalance(conf.suiteConf.hive_domain, conf.suiteConf.shop_id, infoRefund);
      await dashboard.reload();
      // get balance info
      const balanceInfoBefore = await balancePage.getBalanceInfo();
      await balancePage.page.locator(balancePage.xpathBlockPayout).scrollIntoViewIfNeeded();
      await balancePage.page.waitForTimeout(3 * 1000);
      //connect with payoneer
      const isBtnConnectVisible = await balancePage.page.locator(balancePage.xpathBtnConnectWithPayoneer).isVisible();
      if (isBtnConnectVisible) {
        await balancePage.connectAccountPayoneer(
          conf.suiteConf.account_payoneer.email,
          conf.suiteConf.account_payoneer.password,
        );
        const email = await balancePage.getEmailAccountConnect();
        expect(email).toEqual(conf.suiteConf.account_payoneer.email);
      }

      await test.step(`Tại trang Balance, click button Request Payout > verify thông tin popup request`, async () => {
        await balancePage.clickButtonRequestPayout();
        await expect(balancePage.page.locator(balancePage.xpathNamePopupRequestPayout)).toBeVisible();
        await expect(balancePage.getXpathPayoutMethod("Payoneer account")).toBeVisible();
      });

      await test.step(`Thực hiện tạo request với payout method Payoneer account`, async () => {
        await balancePage.requestPayout(requestInfo.source_name, requestInfo.payment_name, requestInfo.request_amount);
        await expect(balancePage.page.locator(balancePage.xpathNamePopupRequestPayout)).toBeHidden();
      });

      await test.step(`Kiểm tra trừ tiền trong tài khoản Balance`, async () => {
        await balancePage.page.waitForSelector(balancePage.xpathMessageRequestPayoutSuccess);
        await balancePage.clickButtonViewRequest();
        expect(
          await balancePage.getPayoutInfoDashboardByApi(authRequest, conf.suiteConf.domain, payoutReviewInfo),
        ).toEqual(payoutReviewInfo);

        // kiểm tra trừ tiền balance
        await balancePage.clickButtonBack();
        const balanceInfoAfter = await balancePage.getBalanceInfo();
        expect(balanceInfoAfter).toEqual(
          expect.objectContaining({
            currentAvailableBalance: balanceInfoBefore.currentAvailableBalance - requestAmount,
            availableToPayout: balanceInfoBefore.availableToPayout - requestAmount,
            total: balanceInfoBefore.total - requestAmount,
          }),
        );

        //kiểm tra log invoices
        await balancePage.clickButtonViewInvoice();
        await invoicePage.filterInvoiceWithConditions(invoiceFilter.domain);
        await dashboard.waitForLoadState("load");
        expect(await invoicePage.verifyInvoice(invoiceReviewInfo)).toBe(true);
      });

      await test.step(`Login hive admin > màn Balance Payout Request V2 List > kiểm tra thông tin request vừa tạo`, async () => {
        const payOutInfo = await balancePage.getPayOutIdByApi(authRequest, conf.suiteConf.domain);
        payOutId = payOutInfo.id;
        await hiveBalance.goto(`admin/app/balancepayoutrequestv2/${payOutId}/show`);
        const requestInfoInHive = await hiveBalance.getInfoRequestPayoutInHive();
        expect(requestInfoInHive).toEqual(
          expect.objectContaining({
            user: conf.suiteConf.username,
            destinationEmail: conf.suiteConf.account_payoneer.email,
            destinationMethod: payoutReviewInfo.method,
            requestedAmount: requestInfo.request_amount.toString(),
            status: payoutReviewInfo.status,
          }),
        );
      });

      await test.step(`Thực hiện refuse or approve request > kiểm tra status request > Tại tab đang đăng nhập dashboard > Kiểm tra số tiền tại mục Balance > kiểm tra update status invoice`, async () => {
        if (payoutStatusApprove) {
          await hiveBalance.approvePayoutReview(conf.suiteConf.hive_domain, payOutId, payoutReviewInfo.amount);
        } else {
          await hiveBalance.refusePayoutReview(
            conf.suiteConf.hive_domain,
            payOutId,
            payoutReviewInfo.amount,
            caseDataItem.reason_refuse,
          );
        }
        // kiểm tra status của request sau khi refuse/approve
        await hiveBalance.goto(`admin/app/balancepayoutrequestv2/${payOutId}/show`);
        const requestInfoInHive = await hiveBalance.getInfoRequestPayoutInHive();
        expect(requestInfoInHive.status).toEqual(caseDataItem.request_status_after_in_hive);

        // kiểm tra log invoice sau khi refuse request/approve
        await balancePage.page.reload();
        await invoicePage.filterInvoiceWithConditions(invoiceFilter.domain);
        await dashboard.waitForLoadState("load");
        expect(await invoicePage.verifyInvoice(invoiceReviewInfoAfter)).toBe(true);

        // kiểm tra tiền trong tài khoản balance
        await balancePage.clickButtonBack();
        const balanceInfoAfterRefuse = await balancePage.getBalanceInfo();
        if (payoutStatusApprove) {
          expect(balanceInfoAfterRefuse).toEqual(
            expect.objectContaining({
              currentAvailableBalance: balanceInfoBefore.currentAvailableBalance - requestAmount,
              availableToPayout: balanceInfoBefore.availableToPayout - requestAmount,
              total: balanceInfoBefore.total - requestAmount,
            }),
          );
        } else {
          expect(balanceInfoAfterRefuse).toEqual(balanceInfoBefore);
        }

        // kiểm tra log request ở màn View request
        await balancePage.clickButtonViewRequest();
        expect(
          await balancePage.getPayoutInfoDashboardByApi(authRequest, conf.suiteConf.domain, payoutReviewInfo),
        ).toEqual(payoutReviewInfoAfter);
      });
    });
  }
});
