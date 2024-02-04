import { expect, test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import { BillingPage } from "@pages/dashboard/billing";
import type { DataInvoiceDetail, PlanInfo, StorePlanInfo } from "@types";
import { InvoicePage } from "@pages/dashboard/invoice";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { Tools } from "@helper/tools";
import { HiveBalance } from "@pages/hive/hive_balance";

let confirmPlanPage: ConfirmPlanPage;
let billingPage: BillingPage;
let invoiceDetailPage: InvoiceDetailPage;
let tools: Tools;
let dashboardNew: DashboardPage;
let hiveBalance: HiveBalance;
let balancePage: BalancePage;
let invoicePage: InvoicePage;
let storePlanInfo: StorePlanInfo;
let dataInvoiceDetail: DataInvoiceDetail;
let currentDatePlan, dateVerifyCurrentPlan, priceCharge;
let infoCurrentInvoiceBilling, invoiceId;
let endSubDate;
let invoiceFail, invoicePaid;

test.describe("Verify change plan when could not charge", () => {
  let accountSettingPage: AccountSetting;
  let currentPlanInfo = {
    amount: 0,
    start_date: "today",
    end_date: "today",
    days_quantity: 0,
    discount: false,
    amount_origin: 0,
    discount_type: "null",
    discount_value: 0,
    duration_in_months: 0,
  };
  let currentPlanAmount: string;
  let remainDay: number;
  let remainMoney: number;
  let newPlanInfo = {
    amount: 0,
    start_date: "today",
    end_date: "today",
    days_quantity: 0,
    discount: false,
    amount_origin: 0,
    discount_type: "null",
    discount_value: 0,
    duration_in_months: 0,
  };
  let expectData = {
    amount: "0",
    end_subscription: "today",
  };
  let packageOriginalDays: number;
  let remainDiscountDays: number;
  let remainOriginDays: number;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    accountSettingPage = new AccountSetting(dashboard, conf.suiteConf.domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    await test.step("Update to card declined", async () => {
      await balancePage.updateToCardDeclinedOrAvailableByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.user_id,
        conf.suiteConf.shop_id,
        conf.suiteConf.profile_info_declined,
        conf.suiteConf.username,
      );
      await balancePage.clearCachePage();
      const dashboardNew = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardNew.login({ email: conf.suiteConf.username, password: conf.suiteConf.password });
    });
  });

  test.afterEach(async ({ authRequest, conf }) => {
    await balancePage.updateToCardDeclinedOrAvailableByAPI(
      authRequest,
      conf.suiteConf.api,
      conf.suiteConf.user_id,
      conf.suiteConf.shop_id,
      conf.suiteConf.profile_info_enable,
      conf.suiteConf.username,
    );
    await accountSettingPage.goToAccountSetting();
    const plan = (await accountSettingPage.genLoc(accountSettingPage.xpathCurrentPlan).textContent()).trim().split("/");
    if (plan[0].trim() != "Basic Base") {
      await confirmPlanPage.gotoPickAPlan();
      await confirmPlanPage.choosePlan("Basic Base");
      await accountSettingPage.page.waitForSelector(accountSettingPage.xpathCurrentPlan, { timeout: 90000 });
    }
  });

  const getPlanInfo = async ({ conf, authRequest }, planInfo: PlanInfo) => {
    await billingPage.goToBilling(conf.suiteConf.domain);
    await billingPage.page.waitForSelector(billingPage.xpathAllBillsLabel);
    await billingPage.page.click("//tbody/tr[1]/td[2]/a");
    const billId = (await billingPage.genLoc('//h4[text()="Bill number"]/following-sibling::p').textContent()).trim();
    currentPlanAmount = await billingPage.genLoc('//td[text()="Total"]/following-sibling::td').textContent();
    planInfo.amount = parseFloat(currentPlanAmount.substring(1));
    await billingPage.page.click('//td/span[contains(@class,"s-icon")]');
    const planTime = (await billingPage.genLoc('//tr[@class="sub-table"]//p[last()]').textContent()).trim();
    planInfo.days_quantity = parseInt(planTime.slice(planTime.indexOf(" "), planTime.lastIndexOf(" ")));
    const planAmount = (await billingPage.genLoc('//tr[@class="sub-table"]/td[last()]').textContent()).trim();
    planInfo.amount_origin = parseFloat(planAmount.substring(1));
    const rawResponse = await authRequest.get(
      `${conf.suiteConf.api}/v1/payment/invoice?shop_id=${conf.suiteConf.shop_id}&invoice_id=${parseInt(
        billId,
      )}&limit=1&not_cache=true`,
    );
    const res = await rawResponse.json();
    planInfo.end_date = res.invoices[0].billing_period_end;
    planInfo.start_date = res.invoices[0].billing_period_start;
    if (res.invoices[0].coupon) {
      planInfo.discount = true;
      planInfo.discount_type = res.invoices[0].coupon["discount_type"];
      planInfo.discount_value = res.invoices[0].coupon["discount_value"];
      planInfo.duration_in_months = res.invoices[0].coupon["duration_in_months"];
    }
    return planInfo;
  };

  const calculateBill = async () => {
    // check today in or out discount time
    if (currentPlanInfo.discount == true && currentPlanInfo.discount_type == "percentage") {
      packageOriginalDays =
        new Date(currentPlanInfo.end_date).getTime() -
        currentPlanInfo.days_quantity * currentPlanInfo.duration_in_months * (24 * 3600 * 1000) -
        new Date().getTime();
    }
    // tinh remain day va remain money cua package khong co discount hoac co discount percentage
    if (currentPlanInfo.discount == false || packageOriginalDays <= 0) {
      remainDay = Math.floor(
        (new Date(currentPlanInfo.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24),
      );
      remainMoney = Math.round((remainDay / currentPlanInfo.days_quantity) * currentPlanInfo.amount * 100) / 100;
    } else {
      remainDay = Math.floor(
        (new Date(currentPlanInfo.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24),
      );
      remainDiscountDays = currentPlanInfo.days_quantity * currentPlanInfo.duration_in_months;
      remainOriginDays =
        Math.floor((new Date(currentPlanInfo.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) -
        remainDiscountDays;
      remainMoney =
        Math.round(
          ((remainDiscountDays * currentPlanInfo.amount) / currentPlanInfo.days_quantity +
            (remainOriginDays * currentPlanInfo.amount_origin) / currentPlanInfo.days_quantity) *
            100,
        ) / 100;
    }
    // tinh so tien can tra them va ngay end_subs
    if (remainMoney - newPlanInfo.amount * newPlanInfo.duration_in_months >= 0) {
      expectData.amount = "0.00";
      const additionalDay = Math.floor(
        newPlanInfo.days_quantity * newPlanInfo.duration_in_months +
          ((remainMoney - newPlanInfo.amount * newPlanInfo.duration_in_months) / newPlanInfo.amount_origin) *
            newPlanInfo.days_quantity,
      );
      const expectEndSub = new Date(
        new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000 + additionalDay * (24 * 3600 * 1000),
      ).toLocaleDateString("en-us", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      expectData.end_subscription = expectEndSub;
    } else {
      expectData.amount = (
        Math.round((newPlanInfo.amount * newPlanInfo.duration_in_months - remainMoney) * 100) / 100
      ).toFixed(2);
      const expectEndSub = new Date(
        new Date().getTime() -
          new Date().getTimezoneOffset() * 60 * 1000 +
          newPlanInfo.days_quantity * newPlanInfo.duration_in_months * (24 * 3600 * 1000),
      ).toLocaleDateString("en-us", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      expectData.end_subscription = expectEndSub;
    }
    return expectData;
  };

  const convertDate = async () => {
    return new Date(newPlanInfo.end_date).toLocaleDateString("en-us", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  test(`@SB_BAL_BILL_BFL_504 Kiểm tra Upgrade/Downgrade plan với apply coupon Shopbase khi có invoice charge subscription đang charge fail`, async ({
    authRequest,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);

    await test.step(`Navigate đến page: Account > Compare plan`, async () => {
      currentPlanInfo = await getPlanInfo({ conf, authRequest }, currentPlanInfo);
      await confirmPlanPage.gotoPickAPlan();
      await expect(confirmPlanPage.genLoc('//div[@class="pricing-page"]')).toBeVisible();
    });

    await test.step(`Change plan: click Choose this plan, apply coupon, click Confirm changes`, async () => {
      await confirmPlanPage.choosePlan(conf.caseConf.plan, conf.caseConf.discount.code);
      await confirmPlanPage.page.waitForSelector('//div[@class="s-alert-content-wrap"]');
      expect((await confirmPlanPage.genLoc('//div[@class="s-alert__description"]').textContent()).trim()).toEqual(
        "Processor Declined",
      );
    });

    await test.step(`Bỏ setting acc ở chế độ card_declined`, async () => {
      await balancePage.updateToCardDeclinedOrAvailableByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.user_id,
        conf.suiteConf.shop_id,
        conf.suiteConf.profile_info_enable,
        conf.suiteConf.username,
      );
    });

    await test.step(`Change plan: click Choose this plan, apply coupon, click Confirm changes`, async () => {
      currentPlanInfo = await getPlanInfo({ conf, authRequest }, currentPlanInfo);
      await confirmPlanPage.gotoPickAPlan();
      await confirmPlanPage.choosePlan(conf.caseConf.plan, conf.caseConf.discount.code);
      await accountSettingPage.page.waitForSelector(accountSettingPage.xpathCurrentPlan, { timeout: 90000 });
      await accountSettingPage.page.reload();
      await accountSettingPage.page.waitForSelector(accountSettingPage.xpathCurrentPlan, { timeout: 90000 });
      await expect(accountSettingPage.genLoc(accountSettingPage.xpathCurrentPlan)).toContainText(conf.caseConf.plan);
    });

    await test.step(`Kiểm tra billing và invoice được tạo`, async () => {
      newPlanInfo = await getPlanInfo({ conf, authRequest }, newPlanInfo);
      await billingPage.page.click(billingPage.xpathToBillingList);
      await billingPage.page.waitForSelector(billingPage.xpathAllBillsLabel);
      expectData = await calculateBill();
      await expect(billingPage.genLoc(billingPage.xpathAmountInFirstBill)).toContainText(expectData.amount);
      expect(await convertDate()).toBe(expectData.end_subscription);
      await invoicePage.goToSubscriptionInvoices(conf.suiteConf.shop_id);
      await expect(invoicePage.genLoc(invoicePage.xpathLastestInvoiceAmount)).toContainText(expectData.amount);
    });
  });
});

test.describe("Billing fail", () => {
  test.beforeEach(async ({ dashboard, conf, authRequest, hiveSBase }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    test.setTimeout(conf.suiteConf.timeout);
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    tools = new Tools();
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);
    endSubDate = new Date().getTime();

    await test.step("Update to card declined and balance = 0", async () => {
      //update card declined
      await balancePage.updateToCardDeclinedOrAvailableByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.user_id,
        conf.suiteConf.shop_id,
        conf.suiteConf.profile_info_declined,
        conf.suiteConf.username,
      );
      await balancePage.clearCachePage();
      dashboardNew = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardNew.login({ email: conf.suiteConf.username, password: conf.suiteConf.password });
      //update balance = 0
      await hiveBalance.chargeAvailableBalanceToZero(
        conf.suiteConf.hive_domain,
        conf.suiteConf.shop_id,
        conf.caseConf.info_charge,
      );
    });
  });
  test("@SB_BAL_BILL_BFL_481 Kiểm tra Manually retry khi subscription invoice đang pending", async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    storePlanInfo = {
      id: conf.suiteConf.shop_id,
      subscription_expired_at: endSubDate,
      charge_sub: conf.caseConf.charge_sub_status,
    };
    invoiceFail = conf.caseConf.invoice_fail;
    invoicePaid = conf.caseConf.invoice_paid;
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    await test.step("- Sử dụng qc-tool để update billling pending -> Tại dashboard, kiểm tra hiển thị ở Billing page", async () => {
      //update billing pending
      await tools.updateStorePlan(conf.suiteConf.api, authRequest, storePlanInfo);
      await dashboard.reload();
      //verify bill at Billing page
      await billingPage.goToBilling(conf.suiteConf.domain);
      do {
        await dashboard.reload();
      } while ((await billingPage.getStatusInvoiceBilling()) !== conf.caseConf.billing_status);
      currentDatePlan = await billingPage.getCurrentDatePlan(); //get info current invoice billing
      infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        0,
      );
      priceCharge = infoCurrentInvoiceBilling.amount;
      invoiceId = infoCurrentInvoiceBilling.id;
      await expect(billingPage.genLoc(billingPage.xpathAlertContent)).toContainText(
        conf.caseConf.alert_1 + currentDatePlan + conf.caseConf.alert_2,
      );
    });

    await test.step("-> click button 'Retry the failed bill(s)", async () => {
      await dashboardNew.clickOnBtnWithLabel("Retry the failed bill(s)");
      await expect(billingPage.genLoc(billingPage.xpathToastMessage)).toContainText(conf.caseConf.toast_danger);
      dateVerifyCurrentPlan = await billingPage.formatDateForVerifyBanlance();
    });

    await test.step("Go to invoice detail page (url link: https://${this.domain}/admin/balance/invoice/${invoiceId})", async () => {
      await invoiceDetailPage.goToInvoiceDetailWithId(invoiceId);
      dataInvoiceDetail = {
        shop_name: conf.suiteConf.shop_name,
        content: invoiceFail.content,
        amount_display: "-" + priceCharge.toFixed(2),
        type: invoiceFail.type,
        detail: invoiceFail.detail,
        transactions_type: invoiceFail.transactions_type,
        transactions_content: invoiceFail.transactions_content,
        transactions_status: invoiceFail.transactions_status,
      };
      expect(
        await invoiceDetailPage.verifyInvoiceDetailWithText(
          dataInvoiceDetail,
          dateVerifyCurrentPlan,
          dateVerifyCurrentPlan,
        ),
      ).toBeTruthy();
    });

    await test.step(
      "-> tại dashboard, put api để update card available" +
        "- Go to Billing page, click button 'Retry the failed bill(s)",
      async () => {
        //update card available
        await balancePage.updateToCardDeclinedOrAvailableByAPI(
          authRequest,
          conf.suiteConf.api,
          conf.suiteConf.user_id,
          conf.suiteConf.shop_id,
          conf.suiteConf.profile_info_enable,
          conf.suiteConf.username,
        );
        await balancePage.clearCachePage();
        //retry the failed bill
        await billingPage.goToBilling(conf.suiteConf.domain);
        await dashboardNew.clickOnBtnWithLabel("Retry the failed bill(s)");
        await expect(billingPage.genLoc(billingPage.xpathPopUpRetryProcess)).toContainText(
          conf.caseConf.text_popup_retry,
        );
        const linkUrl = `https://${conf.suiteConf.domain}/admin/v1/payment/retry-billing-pending-invoices.json?shop_id=${conf.suiteConf.shop_id}`;
        expect((await authRequest.post(linkUrl)).status()).toEqual(200);
        await dashboard.reload();
        await expect(billingPage.genLoc(billingPage.xpathStatusFirstLine)).toContainText(
          invoicePaid.transactions_status,
        );
      },
    );

    await test.step("Go to invoice detail page (url link: https://${this.domain}/admin/balance/invoice/${invoiceId})", async () => {
      await invoiceDetailPage.goToInvoiceDetailWithId(invoiceId);
      //verify Invoice detail
      dataInvoiceDetail = {
        shop_name: conf.suiteConf.shop_name,
        content: invoicePaid.content,
        amount_display: "-" + priceCharge.toFixed(2),
        type: invoicePaid.type,
        detail: invoicePaid.detail,
        transactions_type: invoicePaid.transactions_type,
        transactions_content: invoicePaid.transactions_content,
        transactions_status: invoicePaid.transactions_status,
      };
      expect(
        await invoiceDetailPage.verifyInvoiceDetailWithText(
          dataInvoiceDetail,
          dateVerifyCurrentPlan,
          dateVerifyCurrentPlan,
        ),
      ).toBeTruthy();
    });
  });
});
