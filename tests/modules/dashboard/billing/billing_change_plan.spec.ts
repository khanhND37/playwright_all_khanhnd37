import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { addDays, formatDate } from "@core/utils/datetime";
import { Tools } from "@helper/tools";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { BillingPage } from "@pages/dashboard/billing";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import type { DataInvoiceDetail, PlanInfo, StorePlanInfo } from "@types";

let confirmPlanPage: ConfirmPlanPage;
let accountSettingPage: AccountSetting;
let billingPage: BillingPage;
let invoicePage: InvoicePage;
let invoiceDetailPage: InvoiceDetailPage;
let tools: Tools;
let storePlanInfo: StorePlanInfo;
let invoiceData: DataInvoiceDetail;
let planName, currentPlan: string;
let endSubDate;
let infoCurrentInvoiceBilling;
let invoiceId, startCycle, endCycle;
let priceToPaid, priceApplyCoupon, priceCharge;
let invoiceInfo;

//calculate cycle sub display on screen
// start cycle = today
// end cycle = start cycle + 30 days
const cycleDisplay = async (inputFormatDate: string): Promise<string> => {
  startCycle = formatDate(new Date(), inputFormatDate);
  endCycle = formatDate(addDays(30, new Date()), inputFormatDate);
  return startCycle + " - " + endCycle;
};

test.describe("Verify change plan of shop", () => {
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

  test.beforeEach(async ({ dashboard, conf }) => {
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    accountSettingPage = new AccountSetting(dashboard, conf.suiteConf.domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
  });

  test.afterEach(async () => {
    await accountSettingPage.goToAccountSetting();
    const plan = (await accountSettingPage.genLoc(accountSettingPage.xpathCurrentPlan).textContent()).trim().split("/");
    if (plan[0].trim() != "Basic Base") {
      await confirmPlanPage.gotoPickAPlan();
      await confirmPlanPage.choosePlan("Basic Base");
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

  const conf = loadData(__dirname, "BILL");
  for (const caseData of conf.caseConf.data) {
    test(`@${caseData.case_id} ${caseData.description}`, async ({ conf, authRequest }) => {
      await test.step(`On Dashboard, navigate to Account, click Compare plan`, async () => {
        currentPlanInfo = await getPlanInfo({ conf, authRequest }, currentPlanInfo);
        await confirmPlanPage.gotoPickAPlan();
        await expect(confirmPlanPage.genLoc('//div[@class="pricing-page"]')).toBeVisible();
      });

      await test.step(`Upgrade plan: choose plan, input coupon (optional) then click "Confirm changes"`, async () => {
        planName = (await confirmPlanPage.genLoc(`(${confirmPlanPage.xpathHigherPlan})[1]`).textContent()).trim();
        if (caseData.discount) {
          await confirmPlanPage.choosePlan(planName, caseData.discount.code);
        } else {
          await confirmPlanPage.choosePlan(planName);
        }
        await accountSettingPage.page.waitForSelector(accountSettingPage.xpathCurrentPlan, { timeout: 9000 });
        await expect(accountSettingPage.genLoc(accountSettingPage.xpathCurrentPlan)).toContainText(planName);
      });

      await test.step(`Verify billing and invoices with filters by "Subscription fee collecting" (value = subscription_first)`, async () => {
        newPlanInfo = await getPlanInfo({ conf, authRequest }, newPlanInfo);
        await billingPage.page.click(billingPage.xpathToBillingList);
        await billingPage.page.waitForSelector(billingPage.xpathAllBillsLabel);
        expectData = await calculateBill();
        await expect(billingPage.genLoc(billingPage.xpathAmountInFirstBill)).toContainText(expectData.amount);
        expect(await convertDate()).toBe(expectData.end_subscription);
        await invoicePage.goToSubscriptionInvoices(conf.suiteConf.shop_id);
        await expect(invoicePage.genLoc(invoicePage.xpathLastestInvoiceAmount)).toContainText(expectData.amount);
      });

      await test.step(`Go to Compare plan`, async () => {
        currentPlanInfo = await getPlanInfo({ conf, authRequest }, currentPlanInfo);
        await confirmPlanPage.gotoPickAPlan();
        await expect(confirmPlanPage.genLoc('//div[@class="pricing-page"]')).toBeVisible();
      });

      await test.step(`Downgrade plan: choose plan, input coupon (optional) then click "Confirm changes"`, async () => {
        await confirmPlanPage.page.waitForSelector('//button[normalize-space()="Current plan"]');
        planName = (await confirmPlanPage.genLoc(`(${confirmPlanPage.xpathLowerPlan})[1]`).textContent()).trim();
        if (caseData.discount) {
          await confirmPlanPage.choosePlan(planName, caseData.discount.code);
        } else {
          await confirmPlanPage.choosePlan(planName);
        }
        await accountSettingPage.page.waitForSelector(accountSettingPage.xpathCurrentPlan, { timeout: 9000 });
        await expect(accountSettingPage.genLoc(accountSettingPage.xpathCurrentPlan)).toContainText(planName);
      });

      await test.step(`Verify billing and invoices with filters by "Subscription fee collecting" (value = subscription_first)`, async () => {
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
  }
});

test.describe("Apply coupon later", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    accountSettingPage = new AccountSetting(dashboard, conf.suiteConf.domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    tools = new Tools();
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);
  });

  test("@SB_BAL_BILL_BFL_491 Apply coupon percentage later cho new subscription thành công", async ({
    conf,
    authRequest,
    dashboard,
  }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    await test.step("Pre-condition: Shop shopbase đang apply package: Basic Base - Monthly", async () => {
      await confirmPlanPage.gotoPickAPlan();
      priceToPaid = parseFloat(
        await confirmPlanPage.getPricePackageChoosen(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly),
      );
      currentPlan = await confirmPlanPage.getCurrentPlanWithTimePlan();
      if (currentPlan !== conf.suiteConf.basic_plan + " / " + conf.suiteConf.time_plan_monthly) {
        //choose Basic base - Monthly plan
        await confirmPlanPage.gotoPickAPlan();
        await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly);
        await confirmPlanPage.clickConfirmPlan();
        await expect(confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess)).toBeVisible();
      } else {
        return;
      }
    });

    await test.step(
      "Tại Account page -> tại 'Save your coupon for the next charge', input coupon vào text filed 'Coupon Code'" +
        "-> click Apply",
      async () => {
        await accountSettingPage.applyCouponForNextCharge(conf.caseConf.coupon);
        expect(
          (await accountSettingPage.genLoc(accountSettingPage.xpathInfoDiscount).textContent()) ===
            conf.caseConf.info_discount,
        ).toBe(true);
      },
    );

    await test.step(
      "- Sử dụng qc-tool để update billling pending" +
        "- Đi đến trang Billing (url: {{domain}}/admin/settings/billing) > Kiểm tra billing được tạo",
      async () => {
        endSubDate = new Date().getTime();
        priceApplyCoupon = (priceToPaid * (100 - conf.caseConf.discount_value)) / 100;
        //apply tool for charge
        storePlanInfo = {
          id: conf.suiteConf.shop_id,
          subscription_expired_at: endSubDate,
          charge_sub: "true",
        };
        await tools.updateStorePlan(conf.suiteConf.api, authRequest, storePlanInfo);
        await dashboard.reload();
        //get data invoice 0
        infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
          authRequest,
          conf.suiteConf.api,
          conf.suiteConf.shop_id,
          0,
        );
        priceCharge = (await infoCurrentInvoiceBilling.amount).toFixed(2);
        expect((await infoCurrentInvoiceBilling.invoice_name) === (await cycleDisplay("MMM DD, YYYY"))).toBe(true);
        expect(priceApplyCoupon.toFixed(2) === priceCharge).toBe(true);
      },
    );

    await test.step("Go to invoice detail page (url link: https://${this.domain}/admin/balance/invoice/${invoiceId})", async () => {
      invoiceInfo = conf.caseConf.invoice_info;
      await dashboard.reload();
      await billingPage.goToBilling(conf.suiteConf.domain);
      await billingPage.genLoc(billingPage.xpathAllBillsLabel).isVisible();
      invoiceId = await infoCurrentInvoiceBilling.id;
      await invoiceDetailPage.goToInvoiceDetailWithId(invoiceId);
      //verify Invoice detail
      invoiceData = {
        shop_name: conf.suiteConf.shop_name,
        content: invoiceInfo.content,
        amount_display: "-" + priceCharge,
        type: invoiceInfo.type,
        detail: invoiceInfo.detail,
        transactions_type: invoiceInfo.transactions_type,
        transactions_content: invoiceInfo.transactions_content,
        transactions_status: invoiceInfo.transactions_status,
      };
      expect(
        await invoiceDetailPage.verifyInvoiceDetailWithText(
          invoiceData,
          await cycleDisplay("MMM D, YYYY"),
          await cycleDisplay("MMM D, YYYY"),
        ),
      ).toBeTruthy();
    });

    await test.step("Quay lại Account page -> tại 'Save your coupon for the next charge' -> Check hiển thị", async () => {
      await dashboard.reload();
      await accountSettingPage.goToAccountSetting();
      expect(await accountSettingPage.genLoc(accountSettingPage.xpathInfoDiscount).isHidden()).toBe(true);
    });
  });
});
