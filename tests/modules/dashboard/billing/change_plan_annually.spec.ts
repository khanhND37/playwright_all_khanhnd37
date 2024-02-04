import { expect, test } from "@core/fixtures";
import { addDays, formatDate } from "@core/utils/datetime";
import { BillingPage } from "@pages/dashboard/billing";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import { DataInvoiceDetail } from "@types";

let confirmPlanPage: ConfirmPlanPage;
let billingPage: BillingPage;
let invoiceDetailPage: InvoiceDetailPage;
let dataInvoiceDetail: DataInvoiceDetail;
let infoCurrentInvoiceBilling;
let startDate, endDate;
let remainingDay, remainingMoney, daysConvert;
let currentPricePlan, priceToPaid, priceCompare;
let startCycle, endNewCycle, cycle: string;
let invoiceId, textCompare;

//calculate cycle sub display at Invoice detail page
const cycleDisplayInvoiceDetail = async (inputEndCycle: string): Promise<string> => {
  startCycle = formatDate(new Date(), "MMM D, YYYY");
  return startCycle + "-" + inputEndCycle;
};

test.describe("Kiểm tra đổi plan giữa monthly và annually", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);
    test.setTimeout(conf.suiteConf.time_out);

    //choose Fulfillment plan
    await confirmPlanPage.choosePlanShopBaseFulfillment();
  });

  test("@SB_BAL_BILL_BFL_522 Kiểm tra đổi plan từ tháng lên năm", async ({ conf, authRequest }) => {
    await test.step("Pre-condition: Choose plan Basic Base plan - Monthly", async () => {
      await confirmPlanPage.gotoPickAPlan();
      await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly);
      await confirmPlanPage.clickConfirmPlan();
      await expect(confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess)).toBeVisible();

      //get info current invoice billing
      infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        0,
      );

      //calculate remaining days
      startDate = new Date().getTime();
      endDate = new Date(infoCurrentInvoiceBilling.billing_period_end).getTime();
      remainingDay = await billingPage.calDate(startDate, endDate);

      //calculate remaning money
      currentPricePlan = infoCurrentInvoiceBilling.amount;
      remainingMoney = (remainingDay * (currentPricePlan / 30)).toFixed(2);
    });

    await test.step(
      "Tại 'Pick a plan for your store' page -> Click button Choose this plan" +
        "-> choose plan khác cho store (mothly -> annually)",
      async () => {
        //choose plan Basic Base - Annually
        await confirmPlanPage.gotoPickAPlan();
        priceToPaid = parseFloat(
          await confirmPlanPage.getPricePackageChoosen(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_yearly),
        );
        await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_yearly);
        priceCompare = (priceToPaid - remainingMoney).toFixed(2);
        expect(priceCompare === parseFloat(await confirmPlanPage.getPriceDisplayToPaid()).toFixed(2)).toBeTruthy();

        endNewCycle = formatDate(addDays(365, new Date()), "MMM D, YYYY");
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
      dataInvoiceDetail = {
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
          dataInvoiceDetail,
          await cycleDisplayInvoiceDetail(endNewCycle),
          await cycleDisplayInvoiceDetail(endNewCycle),
        ),
      ).toBeTruthy();
    });
  });

  test("@SB_BAL_BILL_BFL_523 Kiểm tra đổi plan từ năm xuống tháng", async ({ conf, authRequest }) => {
    await test.step("Pre-condition: Choose plan Standard Base plan - Annually", async () => {
      await confirmPlanPage.gotoPickAPlan();
      await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.standard_plan, conf.suiteConf.time_plan_yearly);
      await confirmPlanPage.clickConfirmPlan();
      await expect(confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess)).toBeVisible();

      //get info current invoice billing
      infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.shop_id,
        0,
      );

      //calculate remaning money
      currentPricePlan = infoCurrentInvoiceBilling.amount;
      remainingMoney = (currentPricePlan - currentPricePlan / 365).toFixed(2);
    });

    await test.step(
      "Tại 'Pick a plan for your store' page -> Click button Choose this plan" +
        "-> choose plan khác cho store (annually -> monthly)",
      async () => {
        //choose plan Basic Base - Monthly
        await confirmPlanPage.gotoPickAPlan();
        priceToPaid = parseFloat(
          await confirmPlanPage.getPricePackageChoosen(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly),
        );
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
      dataInvoiceDetail = {
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
          dataInvoiceDetail,
          await cycleDisplayInvoiceDetail(endNewCycle),
          await cycleDisplayInvoiceDetail(endNewCycle),
        ),
      ).toBeTruthy();
    });
  });
});
