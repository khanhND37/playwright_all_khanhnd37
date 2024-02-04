import { expect, test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { HiveBalance } from "@pages/hive/hive_balance";
import { Tools } from "@helper/tools";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { TransactionPage } from "@pages/dashboard/transaction";

let invoicePage: InvoicePage;
let invoiceDetailPage: InvoiceDetailPage;
let balancePage: BalancePage;
let hiveBalance: HiveBalance;
let transactionPage: TransactionPage;
let invoiceInfo;
let tools: Tools;
let invoiceConditions;
let filterTagInvoice;

test.describe("Auto top-up with Credit card = Declined", async () => {
  //not run at prodtest + prod because cann't go to hive and cann't be to use tool
  test.beforeEach(async ({ dashboard, conf, hiveSBase, authRequest }) => {
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return true;
    }
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
    tools = new Tools();
    invoiceInfo = conf.caseConf.invoice_info;
    invoiceConditions = conf.caseConf.invoice_conditions;
    filterTagInvoice = conf.caseConf.filter_tag_invoice;

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
    await hiveBalance.chargeAvailableBalanceToZero(
      conf.suiteConf.hive_domain,
      conf.suiteConf.shop_id,
      conf.caseConf.info_charge,
    );
    await balancePage.autoTopUpByApi(authRequest, conf.suiteConf.domain);
  });

  test.afterEach(async ({ authRequest, conf }) => {
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return true;
    }
    await balancePage.updateToCardDeclinedOrAvailableByAPI(
      authRequest,
      conf.suiteConf.api,
      conf.suiteConf.user_id,
      conf.suiteConf.shop_id,
      conf.suiteConf.profile_info_enable,
      conf.suiteConf.username,
    );
  });

  test("@SB_BAL_OLD_BL_3", async ({ dashboard, conf, context, authRequest }) => {
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return;
    }
    test.setTimeout(conf.suiteConf.time_out);
    await test.step(
      "Truy cập link : {{shop_domain}}/admin/balance" +
        "click checkbox Enable auto recharge = checked > input value cho auto topup" +
        "-> Click Save changes",
      async () => {
        await balancePage.goToBalance();
        await balancePage.enableAutoTopUp(conf.caseConf.amount_input, conf.caseConf.value_balance_below);
        await expect(await dashboard.locator(balancePage.xpathToastSuccess)).toBeVisible();
        await tools.updateTopUpPending(conf.suiteConf.domain_update_tool, conf.suiteConf.user_id, authRequest);
      },
    );

    await test.step(
      "Kiểm tra hiển thị Auto topup tại Transaction:" +
        "- Truy cập link {{shop_domain}}/admin/balance -> CLick button View transactions",
      async () => {
        await balancePage.goToBalance();
        await balancePage.clickBtnViewTransactions();
        // Filter invoice and verify top-up at Invoice list
        await balancePage.filterWithConditionDashboard("More filters", invoiceConditions);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagInvoice);
        await transactionPage.clickNewestTransaction();
        //verify Transaction
        await expect(await invoicePage.verifyDataWithColumnName("Shop Domain", conf.suiteConf.domain)).toBe(true);
        await expect(await invoicePage.verifyDataWithColumnName("Invoice", invoiceInfo.content)).toBe(true);
        await expect(await transactionPage.verifyAmountTransaction(invoiceInfo.amount_display)).toBe(true);
        await expect(await invoicePage.verifyDataWithColumnName("Status", invoiceInfo.transactions_status)).toBe(true);
        await expect(await invoicePage.verifyDate("Created date")).toBe(true);
        await expect(
          await transactionPage.verifyContentCollapsed("Invoice", invoiceInfo.transactions_content, invoicePage),
        ).toBe(true);
        await expect(
          await transactionPage.verifyContentCollapsed("Available date", conf.caseConf.source, invoicePage),
        ).toBe(true);
        await balancePage.clearAllFilterDashboard("More filters");
        expect(
          await transactionPage.verifyBalanceTransaction(conf.caseConf.amount_charge, invoiceInfo.transactions_status),
        ).toBe(true);
      },
    );

    await test.step("Truy cập lại link : {{shop_domain}}/admin/balance -> kiểm tra hiển thị Auto topup tại Invoice: CLick button View Invoice", async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      // Filter invoice and verify top-up at Invoice list
      await balancePage.filterWithConditionDashboard("More filters", invoiceConditions);
      await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagInvoice);
      await invoicePage.reloadForStatusUpdate(conf.caseConf.card_status);
      expect(await invoicePage.verifyInvoice(invoiceInfo)).toBe(true);
    });

    await test.step(
      "Kiểm tra Invoice detail bằng cách click text link 'Manual top-up via wire transfer'" +
        " tại Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail",
      async () => {
        const [newPage] = await Promise.all([context.waitForEvent("page"), await invoicePage.clickNewestInvoice()]);
        invoiceDetailPage = new InvoiceDetailPage(newPage, "");
        await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
        expect(await invoiceDetailPage.verifyInvoiceDetail(invoiceInfo)).toBe(true);
      },
    );
  });
});
