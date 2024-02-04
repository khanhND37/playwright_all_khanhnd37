import { expect, test } from "@core/fixtures";
import { addDays, formatDate } from "@core/utils/datetime";
import { CheckoutAPI } from "@pages/api/checkout";
import { PreferencesAPI } from "@pages/api/online_store/Preferences/preferences";
import { BalancePage } from "@pages/dashboard/balance";
import { BillingPage } from "@pages/dashboard/billing";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { OrdersPage } from "@pages/dashboard/orders";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import { HiveBilling } from "@pages/hive/hive_billing";

let confirmPlanPage: ConfirmPlanPage;
let billingPage: BillingPage;
let invoiceDetailPage: InvoiceDetailPage;
let checkoutAPI: CheckoutAPI;
let balancePage: BalancePage;
let invoicePage: InvoicePage;
let ordersPage: OrdersPage;
let preferencesAPI: PreferencesAPI;
let hiveBilling: HiveBilling;
let infoPreviousInvoiceBilling, infoCurrentInvoiceBilling;
let startDate, endDate, endDatePreviousPlan;
let remainingDay, remainingMoney, daysConvert;
let currentPricePlan, comboPricePlan, priceToPaid, priceCompare;
let startCycle, endNewCycle, cycle: string;
let invoiceId, invoiceData, textCompare;
let checkoutInfo, productsCheckout, orderName, totalPriceOrder, transactionFeePercentage, transactionFee;
let invoiceConditions, filterTagInvoice;
let newPage, invoiceInfoTransFee;

//choose plan for store, then go to hive and apply combo for this store
const choosePlanAndApplyCombo = async (inputPlan: string, timePlan: string, shopId: number, infoCombo) => {
  //choose standard plan
  await confirmPlanPage.chooseTimePlanPackage(inputPlan, timePlan);
  await confirmPlanPage.clickConfirmPlan();
  //apply combo for store
  await hiveBilling.applyCombo(shopId, infoCombo);
};

//calculate cycle sub display at Invoice detail page
//start cycle = today
const cycleDisplayInvoiceDetail = async (inputEndCycle: string): Promise<string> => {
  startCycle = formatDate(new Date(), "MMM D, YYYY");
  return startCycle + "-" + inputEndCycle;
};

//calculate cycle sub display on screen
const cycleDisplayInvoiceDetailWithCombo = async (
  inputEndPreviousCycle: string,
  inputComboValue: string,
  inputFormatDate: string,
): Promise<string> => {
  endDatePreviousPlan = formatDate(inputEndPreviousCycle, inputFormatDate);
  endNewCycle = formatDate(addDays(30 * parseFloat(inputComboValue), new Date(endDatePreviousPlan)), inputFormatDate);
  return endDatePreviousPlan + " - " + endNewCycle;
};

test.describe("Apply combo for store", async () => {
  test.beforeEach(async ({ dashboard, hiveSBase, conf }) => {
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    hiveBilling = new HiveBilling(hiveSBase, conf.suiteConf.hive_domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);

    //choose Fulfillment plan
    await confirmPlanPage.choosePlanShopBaseFulfillment();
  });

  test("@SB_BAL_BILL_BFL_521 Upgrand/Downgrand plan khi shop đang apply combo Free Trial", async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.time_out);
    await test.step("Pre-condition: Choose Basic Base plan and apply combo Free-trial for store", async () => {
      await choosePlanAndApplyCombo(
        conf.suiteConf.basic_plan,
        conf.suiteConf.time_plan_monthly,
        conf.suiteConf.shop_id,
        conf.caseConf.info_combo_apply,
      );

      //get info previous invoice billing
      infoPreviousInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        1,
      );
      startDate = new Date().getTime();
      endDate = new Date(infoPreviousInvoiceBilling.billing_period_end).getTime();
      remainingDay = await billingPage.calDate(startDate, endDate);

      //get info current invoice billing
      infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        0,
      );

      //calculate remaning money
      currentPricePlan = infoPreviousInvoiceBilling.amount;
      comboPricePlan = infoCurrentInvoiceBilling.amount;
      remainingMoney = (remainingDay * (currentPricePlan / 30) + comboPricePlan).toFixed(2);
    });

    await test.step(
      "Tại 'Pick a plan for your store' page -> Click button Choose this plan" +
        "-> choose plan khác cho store (upgrand)",
      async () => {
        //choose plan Standard Base
        await confirmPlanPage.gotoPickAPlan();
        priceToPaid = parseFloat(await confirmPlanPage.getPricePackageChoosen(conf.suiteConf.standard_plan));
        await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.standard_plan, conf.suiteConf.time_plan_monthly);
        priceCompare = (priceToPaid - remainingMoney).toFixed(2);
        expect(priceCompare === parseFloat(await confirmPlanPage.getPriceDisplayToPaid()).toFixed(2)).toBeTruthy();

        endNewCycle = formatDate(addDays(30, new Date()), "MMM D, YYYY");
        textCompare = `You will pay $${priceCompare} now for your new subscription (from Today to ${endNewCycle}) as a result of this change.`;
        expect(textCompare === (await confirmPlanPage.getTextReviewSub())).toBeTruthy();
      },
    );

    await test.step("Click Confirm changes", async () => {
      await confirmPlanPage.clickConfirmPlan();
      await expect(confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess)).toBeVisible();
      cycle = (
        await billingPage.getInvoiceBillingWithIndexByAPI(authRequest, conf.suiteConf.api, conf.suiteConf.shop_id, 0)
      ).invoice_name;
      await billingPage.goToBilling(conf.suiteConf.domain);
      expect(cycle === (await billingPage.getCurrentDatePlan())).toBeTruthy();
    });

    await test.step("Go to invoice detail page (url link: https://${this.domain}/admin/balance/invoice/${invoiceId})", async () => {
      invoiceId = (
        await billingPage.getInvoiceBillingWithIndexByAPI(authRequest, conf.suiteConf.api, conf.suiteConf.shop_id, 0)
      ).id;
      await invoiceDetailPage.goToInvoiceDetailWithId(invoiceId);
      //verify Invoice detail
      invoiceData = {
        shop_name: conf.suiteConf.shop_name,
        content: conf.suiteConf.invoice_detail.content,
        amount_display: "-" + priceCompare,
        type: conf.suiteConf.invoice_detail.type,
        detail: conf.suiteConf.invoice_detail.detail,
        transactions_type: conf.suiteConf.invoice_detail.transactions_type,
        transactions_content: conf.suiteConf.invoice_detail.transactions_content,
        transactions_status: conf.suiteConf.invoice_detail.transactions_status,
      };
      expect(
        await invoiceDetailPage.verifyInvoiceDetailWithText(
          invoiceData,
          await cycleDisplayInvoiceDetail(endNewCycle),
          await cycleDisplayInvoiceDetail(endNewCycle),
        ),
      ).toBeTruthy();
    });

    await test.step("Pre-condition: go to hive, apply combo cho store", async () => {
      //apply combo for store
      await hiveBilling.applyCombo(conf.suiteConf.shop_id, conf.caseConf.info_combo_apply);

      //get info previous invoice billing
      infoPreviousInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        1,
      );
      startDate = new Date().getTime();
      endDate = new Date(infoPreviousInvoiceBilling.billing_period_end).getTime();
      remainingDay = await billingPage.calDate(startDate, endDate);

      //get info current invoice billing
      infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        0,
      );

      //calculate remaning money
      comboPricePlan = infoCurrentInvoiceBilling.amount;
      currentPricePlan = comboPricePlan / conf.caseConf.info_combo_apply.combo_value;
      remainingMoney = (remainingDay * (currentPricePlan / 30) + comboPricePlan).toFixed(2);
    });

    await test.step(
      "Tại dashboard > 'Pick a plan for your store' page -> Click button Choose this plan" +
        "-> choose plan khác cho store (downgrand)",
      async () => {
        //choose plan Standard Base
        await confirmPlanPage.gotoPickAPlan();
        priceToPaid = parseFloat(await confirmPlanPage.getPricePackageChoosen(conf.suiteConf.basic_plan));
        await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly);
        expect("0.00" === (await confirmPlanPage.getPriceDisplayToPaid())).toBeTruthy();
        //convert remainingMoney to days
        daysConvert = Math.floor(remainingMoney / (priceToPaid / 30));
        endNewCycle = formatDate(addDays(daysConvert, new Date()), "MMM D, YYYY");
        textCompare = `You won't be charged for your new subscription (from Today to ${endNewCycle}) as a result of this charge. The next bill will be issued after that time.`;
        expect(textCompare === (await confirmPlanPage.getTextReviewSub())).toBeTruthy();
      },
    );

    await test.step("Click Confirm changes", async () => {
      await confirmPlanPage.clickConfirmPlan();
      await expect(confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess)).toBeVisible();

      cycle = (
        await billingPage.getInvoiceBillingWithIndexByAPI(authRequest, conf.suiteConf.api, conf.suiteConf.shop_id, 0)
      ).invoice_name;
      await billingPage.goToBilling(conf.suiteConf.domain);
      expect(cycle === (await billingPage.getCurrentDatePlan())).toBeTruthy();
    });

    await test.step("Go to invoice detail page (url link: https://${this.domain}/admin/balance/invoice/${invoiceId})", async () => {
      invoiceId = (
        await billingPage.getInvoiceBillingWithIndexByAPI(authRequest, conf.suiteConf.api, conf.suiteConf.shop_id, 0)
      ).id;
      await invoiceDetailPage.goToInvoiceDetailWithId(invoiceId);
      //verify Invoice detail
      invoiceData = {
        shop_name: conf.suiteConf.shop_name,
        content: conf.suiteConf.invoice_detail.content,
        amount_display: "0.00",
        type: conf.suiteConf.invoice_detail.type,
        detail: conf.suiteConf.invoice_detail.detail,
        transactions_type: conf.suiteConf.invoice_detail.transactions_type,
        transactions_content: conf.suiteConf.invoice_detail.transactions_content,
        transactions_status: conf.suiteConf.invoice_detail.transactions_status,
      };
      expect(
        await invoiceDetailPage.verifyInvoiceDetailWithText(
          invoiceData,
          await cycleDisplayInvoiceDetail(endNewCycle),
          await cycleDisplayInvoiceDetail(endNewCycle),
        ),
      ).toBeTruthy();
    });
  });

  test("@SB_BAL_BILL_BFL_513 Kiểm tra Apply combo cho shop đang có subscription đang được apply coupon", async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(conf.suiteConf.time_out);
    await test.step("Pre-condition: Choose Basic Base - Monthly, apply coupon 'datatest10'", async () => {
      await confirmPlanPage.chooseTimePlanPackage(
        conf.suiteConf.basic_plan,
        conf.suiteConf.time_plan_monthly,
        conf.caseConf.coupon,
      );
      await confirmPlanPage.clickConfirmPlan();
    });

    await test.step("Login vào Hive với acc beeketing -> go to Apply combo page -> input data -> Click button Charge immidiately", async () => {
      //apply combo for store
      await hiveBilling.applyCombo(conf.suiteConf.shop_id, conf.caseConf.info_combo_apply);

      //get info previous invoice billing
      infoPreviousInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        1,
      );
      cycle = await cycleDisplayInvoiceDetailWithCombo(
        infoPreviousInvoiceBilling.billing_period_end,
        conf.caseConf.info_combo_apply.combo_value,
        "MMM DD, YYYY",
      );
      //get info current invoice billing
      infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        0,
      );
      expect(infoCurrentInvoiceBilling.invoice_name).toEqual(cycle);
    });

    await test.step("Go to invoice detail page (url link: https://${this.domain}/admin/balance/invoice/${invoiceId})", async () => {
      cycle = await cycleDisplayInvoiceDetailWithCombo(
        infoPreviousInvoiceBilling.billing_period_end,
        conf.caseConf.info_combo_apply.combo_value,
        "MMM D, YYYY",
      );
      invoiceId = (
        await billingPage.getInvoiceBillingWithIndexByAPI(authRequest, conf.suiteConf.api, conf.suiteConf.shop_id, 0)
      ).id;
      await invoiceDetailPage.goToInvoiceDetailWithId(invoiceId);
      //verify Invoice detail
      invoiceData = {
        shop_name: conf.suiteConf.shop_name,
        content: conf.suiteConf.invoice_detail.content,
        amount_display: "-" + conf.caseConf.info_combo_apply.coupon_value.toFixed(2),
        type: conf.suiteConf.invoice_detail.type,
        detail: conf.suiteConf.invoice_detail.detail,
        transactions_type: conf.suiteConf.invoice_detail.transactions_type,
        transactions_content: conf.suiteConf.invoice_detail.transactions_content,
        transactions_status: conf.suiteConf.invoice_detail.transactions_status,
      };
      expect(await invoiceDetailPage.verifyInvoiceDetailWithText(invoiceData, cycle, cycle)).toBeTruthy();
    });
  });

  test("@SB_BAL_BILL_BFL_511 Kiểm tra shop khi Apply combo Custom package và tính transaction fee for order", async ({
    dashboard,
    conf,
    authRequest,
    context,
  }) => {
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    preferencesAPI = new PreferencesAPI(conf.suiteConf.domain, authRequest, dashboard);
    test.setTimeout(conf.suiteConf.time_out);
    await test.step("Pre-condition: Choose Standard Base - Monthly", async () => {
      await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly);
      await confirmPlanPage.clickConfirmPlan();
    });

    await test.step("Login vào Hive với acc beeketing -> go to Apply combo page -> input data -> Click button Charge immidiately", async () => {
      //apply combo for store
      await hiveBilling.applyCombo(conf.suiteConf.shop_id, conf.caseConf.info_combo_apply);

      //get info previous invoice billing
      infoPreviousInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        1,
      );
      cycle = await cycleDisplayInvoiceDetailWithCombo(
        infoPreviousInvoiceBilling.billing_period_end,
        conf.caseConf.info_combo_apply.combo_value,
        "MMM DD, YYYY",
      );
      //get info current invoice billing
      infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        0,
      );
      expect(infoCurrentInvoiceBilling.invoice_name).toEqual(cycle);
      expect(infoCurrentInvoiceBilling.amount).toEqual(
        Math.round(conf.caseConf.info_combo_apply.coupon_value * 100) / 100,
      );
    });

    await test.step("Đi đến Storefont của shop -> Checkout thành công với 1 sản phẩm của shop", async () => {
      await preferencesAPI.updatePasswordSF();
      productsCheckout = conf.caseConf.products_checkout;
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout });
      // get infos for current order
      orderName = checkoutInfo.order.name;
      totalPriceOrder = checkoutInfo.totals.total_price.toFixed(2);
      expect(checkoutInfo.order.financial_status).toEqual("authorized");
      //capture manual order
      await ordersPage.gotoOrderPage();
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.captureOrder(totalPriceOrder.toString());
      transactionFeePercentage = conf.caseConf.info_combo_apply.transaction_fee;
      transactionFee = ((transactionFeePercentage / 100) * totalPriceOrder).toFixed(2);
    });

    await test.step("Navigate đến trang Balance => click 'View invoices' > click btn 'More filters', filter theo 'Transation fee collecting'", async () => {
      invoiceConditions = conf.caseConf.invoice_conditions;
      filterTagInvoice = conf.caseConf.filter_tag_invoice;
      invoiceInfoTransFee = {
        shop_name: conf.suiteConf.shop_name,
        domain: conf.suiteConf.domain,
        content: conf.caseConf.invoice_info.content,
        status: conf.caseConf.invoice_info.status,
        type: conf.caseConf.invoice_info.type,
        detail: conf.caseConf.invoice_info.detail,
        transactions_type: conf.caseConf.invoice_info.transactions_type,
        transactions_content: conf.caseConf.invoice_info.transactions_content,
        transactions_status: conf.caseConf.invoice_info.transactions_status,
      };
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await invoicePage.filterWithConditionDashboard("More filters", invoiceConditions);
      await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagInvoice);
      //click the newest invoice to get value total transaction fee
      [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
      invoiceDetailPage = new InvoiceDetailPage(newPage, "");
      await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
      const amountDisplay = await invoiceDetailPage.getTransactionFee();
      // verify Invoice at Invoice page
      expect(await invoicePage.verifyInvoiceTransactionFee(invoiceInfoTransFee, amountDisplay)).toBe(true);
    });

    await test.step(
      "Kiểm tra Invoice detail bằng cách click text link 'Transaction fee collecting'" +
        " tại Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail",
      async () => {
        expect(
          await invoiceDetailPage.verifyInvoiceDetailTransactionFee(invoiceInfoTransFee, orderName, transactionFee),
        ).toBe(true);
      },
    );
  });
});
