import { expect, test } from "@core/fixtures";
import { addDays, formatDate } from "@core/utils/datetime";
import { BalancePage } from "@pages/dashboard/balance";
import { BillingPage } from "@pages/dashboard/billing";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import { DataInvoiceDetail } from "@types";

let confirmPlanPage: ConfirmPlanPage;
let billingPage: BillingPage;
let invoiceDetailPage: InvoiceDetailPage;
let dataInvoiceDetail: DataInvoiceDetail;
let balancePage: BalancePage;
let invoicePage: InvoicePage;
let infoCurrentInvoiceBilling;
let startDate, endDate;
let remainingDay, remainingMoney;
let currentPricePlan;
let startCycle, endNewCycle, cycle: string;
let invoiceId, textCompare;
let invoiceInfoPayback, invoiceDetailInfoPayback;

//calculate cycle sub display at Invoice detail page
//start cycle = today
const cycleDisplayInvoiceDetail = async (inputEndCycle: string): Promise<string> => {
  startCycle = formatDate(new Date(), "MMM D, YYYY");
  return startCycle + "-" + inputEndCycle;
};

test.describe("Kiểm tra khi đổi sang Fulffillment plan", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    test.setTimeout(conf.suiteConf.time_out);

    //choose Fulfillment plan
    await confirmPlanPage.choosePlanShopBaseFulfillment();
  });

  test("@SB_BAL_BILL_BFL_506", async ({ conf, authRequest, context }) => {
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
      "Tại 'Pick a plan for your store' page (url go to: {{shop_domain}}/admin/pricing ) " +
        "-> Click button 'Yes, I want this option' -> Click btn 'Confirm new plan' tại popup 'Only use ShopBase Fulfillment Service'",
      async () => {
        //Choose plan: Fulfillment plan - Monthly
        await confirmPlanPage.gotoPickAPlan();
        await confirmPlanPage.clickOnBtnWithLabel("Yes, I want this option");
        await confirmPlanPage.clickOnBtnWithLabel("Confirm new plan");
        expect("0.00" === (await confirmPlanPage.getPriceDisplayToPaid())).toBe(true);
        endNewCycle = formatDate(addDays(30, new Date()), "MMM D, YYYY");
        textCompare = `You won't be charged for your new subscription (from Today to ${endNewCycle}) as a result of this charge. The next bill will be issued after that time.`;
        expect(textCompare === (await confirmPlanPage.getTextReviewSub())).toBe(true);
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
        content: conf.suiteConf.invoice_sub_detail.content,
        amount_display: "0.00",
        type: conf.suiteConf.invoice_sub_detail.type,
        detail: conf.suiteConf.invoice_sub_detail.detail,
        transactions_type: conf.suiteConf.invoice_sub_detail.transactions_type,
        transactions_content: conf.suiteConf.invoice_sub_detail.transactions_content,
        transactions_status: conf.suiteConf.invoice_sub_detail.transactions_status,
      };
      expect(
        await invoiceDetailPage.verifyInvoiceDetailWithText(
          dataInvoiceDetail,
          await cycleDisplayInvoiceDetail(endNewCycle),
          await cycleDisplayInvoiceDetail(endNewCycle),
        ),
      ).toBe(true);
    });

    await test.step("Navigate đến trang Balance => click 'View invoices'-> kiểm tra invoice được tạo", async () => {
      invoiceInfoPayback = {
        domain: conf.suiteConf.domain,
        content: conf.caseConf.invoice_info_payback.content,
        amount_display: remainingMoney,
        status: conf.caseConf.invoice_info_payback.status,
      };
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await balancePage.filterWithConditionDashboard("More filters", conf.caseConf.invoice_conditions);
      await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(conf.caseConf.filter_tag_invoice);
      expect(await invoicePage.verifyInvoice(invoiceInfoPayback)).toBe(true);
    });

    await test.step(
      "Kiểm tra Invoice detail bằng cách click text link 'Pay back from changing plan' tại Balance invoice page" +
        " hoặc Source tại Balance transactions page -> kiểm tra Invoice detail",
      async () => {
        invoiceDetailInfoPayback = {
          shop_name: conf.suiteConf.shop_name,
          content: conf.caseConf.invoice_info_payback.content,
          detail: conf.caseConf.invoice_info_payback.detail,
          type: conf.caseConf.invoice_info_payback.type,
          amount_display: remainingMoney,
          transactions_type: conf.caseConf.invoice_info_payback.transactions_type,
          transactions_content: conf.caseConf.invoice_info_payback.transactions_content,
          transactions_status: conf.caseConf.invoice_info_payback.transactions_status,
        };
        const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
        invoiceDetailPage = new InvoiceDetailPage(newPage, "");
        await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
        expect(await invoiceDetailPage.verifyInvoiceDetail(invoiceDetailInfoPayback)).toBe(true);
      },
    );
  });
});
