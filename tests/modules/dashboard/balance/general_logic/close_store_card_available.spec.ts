import { expect, test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { InvoicePage } from "@pages/dashboard/invoice";
import type { FilterCondition } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { CheckoutAPI } from "@pages/api/checkout";

let balancePage: BalancePage;
let invoicePage: InvoicePage;
let ordersPage: OrdersPage;
let accountSetting: AccountSetting;
let invoiceFilter: FilterCondition[];
let checkoutAPI: CheckoutAPI;
let newPage;
let orderName;
let statusPending;
let statusPaid;
let filterTag;
let checkoutInfo, productsCheckout, totalPriceOrder;

test.describe("Check close store", async () => {
  test("@SB_BAL_UCB_44", async ({ authRequest, dashboard, conf, browser }) => {
    test.setTimeout(conf.suiteConf.time_out);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    accountSetting = new AccountSetting(dashboard, conf.suiteConf.domain);
    invoiceFilter = conf.caseConf.invoice_filter;
    filterTag = conf.caseConf.filter_tag;
    statusPending = conf.caseConf.status_pending;
    statusPaid = conf.caseConf.status_paid;
    productsCheckout = conf.caseConf.products_checkout;

    await test.step("store đang có invoice open có số lần faild charge <5, tiến hành charge các invoice open", async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout });
      // get infos for current order
      orderName = checkoutInfo.order.name;
      totalPriceOrder = checkoutInfo.totals.total_price.toFixed(2);
      expect(checkoutInfo.order.financial_status).toEqual("authorized");
      //capture manual order
      await ordersPage.gotoOrderPage();
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.captureOrder(totalPriceOrder.toString());
    });

    await test.step("Go to balance page -> kiểm tra status invoice transaction fee", async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await invoicePage.filterWithConditionDashboard("More filters", invoiceFilter);
      await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
      expect(await invoicePage.verifyDataWithColumnName("Status", statusPending)).toBe(true);
    });

    await test.step("close store sau đó reopen store", async () => {
      //close store
      await accountSetting.goToAccountSetting();
      await accountSetting.closeStore(conf.suiteConf.password);
      //reopen store
      await accountSetting.page.close();
      const context = await browser.newContext();
      newPage = await context.newPage();
      const newAccountSetting = new AccountSetting(newPage, conf.suiteConf.domain);
      await newAccountSetting.goto(`/admin`);
      await newAccountSetting.page.waitForLoadState("networkidle");
      await newAccountSetting.reopenStore(conf.suiteConf.username, conf.suiteConf.password, "sign-in");
    });

    await test.step("Verify invoice open tại Invoice page", async () => {
      const newBalancePage = new BalancePage(newPage, conf.suiteConf.domain);
      const newInvoicePage = new InvoicePage(newPage, conf.suiteConf.domain);
      await await newBalancePage.goToBalance();
      await newBalancePage.clickButtonViewInvoice();

      await newInvoicePage.filterWithConditionDashboard("More filters", invoiceFilter);
      await expect(newInvoicePage.genLoc(newInvoicePage.xpathFilterTag)).toContainText(filterTag);
      expect(await newInvoicePage.verifyDataWithColumnName("Status", statusPaid)).toBe(true);
      expect(await newInvoicePage.verifyDate("Created date")).toBe(true);
      expect(await newInvoicePage.verifyDate("Latest transaction date")).toBe(true);
    });
  });
});
