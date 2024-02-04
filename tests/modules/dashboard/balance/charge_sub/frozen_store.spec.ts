import { expect, test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { HiveBalance } from "@pages/hive/hive_balance";
import { Tools } from "@helper/tools";
import { BillingPage } from "@pages/dashboard/billing";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import type { Card } from "@types";

let balancePage: BalancePage;
let hiveBalance: HiveBalance;
let balancePageNew: BalancePage;
let tools: Tools;
let billingPage: BillingPage;
let billingPageNew: BillingPage;
let dashboardPage: DashboardPage;
let invoicePage: InvoicePage;
let invoiceDetailPage: InvoiceDetailPage;
let subscriptionExpiredAt;
let infoChargeBilling;
let cardInfo: Card;
let invoiceInfo;
let filterTag;
let dateVerifyCurrentPlan;

test.describe("Check frozen store", async () => {
  test.afterAll(async ({ conf, hiveSBase, authRequest }) => {
    hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    tools = new Tools();
    subscriptionExpiredAt = await billingPage.remove18DaysAndConvertUnixTime();
    infoChargeBilling = {
      id: conf.suiteConf.info_charge_billing.id,
      subscription_expired_at: subscriptionExpiredAt,
      charge_sub: conf.suiteConf.info_charge_billing.charge_sub,
    };

    await test.step("Charge Current available balance to Zero and update card declined", async () => {
      //charge Current available balance to Zero
      await hiveBalance.chargeAvailableBalanceToZero(
        conf.suiteConf.hive_domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.info_charge_hive,
      );

      //update card declined
      await balancePage.updateToCardDeclinedOrAvailableByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.user_id,
        conf.suiteConf.shop_id,
        conf.suiteConf.profile_info_card_declined,
        conf.suiteConf.username,
      );
    });

    await test.step("Charge subcription with tool", async () => {
      await tools.updateStorePlan(conf.suiteConf.api, authRequest, infoChargeBilling);
    });
  });

  test("@SB_BAL_UCB_26 frozen store and reopen this store", async ({ dashboard, conf, authRequest, context }) => {
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    cardInfo = conf.caseConf.card_info;
    filterTag = conf.caseConf.filter_tag;
    invoiceInfo = conf.caseConf.invoice_info;

    await test.step("Update card available, clear cache and login again", async () => {
      //update card available
      await balancePage.updateToCardDeclinedOrAvailableByAPI(
        authRequest,
        conf.suiteConf.api,
        conf.suiteConf.user_id,
        conf.suiteConf.shop_id,
        conf.suiteConf.profile_info_card_available,
        conf.suiteConf.username,
      );

      await balancePage.clearCachePage();
    });

    await test.step("Verify shop frozen", async () => {
      balancePageNew = new BalancePage(dashboard, conf.suiteConf.domain_update_tool);
      billingPageNew = new BillingPage(dashboard, conf.suiteConf.domain_update_tool);
      invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain_update_tool);
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain_update_tool);
      await dashboardPage.login({ email: conf.suiteConf.username, password: conf.suiteConf.password });
      await dashboard.waitForLoadState("networkidle");
      await expect(await dashboardPage.isDBPageDisplay("Store frozen")).toBe(true);
      await expect(billingPageNew.genLoc(billingPageNew.xpathAlertFrozenPage)).toContainText(
        conf.caseConf.text_frozen_store,
      );
      await expect(await dashboardPage.isDBPageDisplay("Billing information")).toBe(true);
      await expect(dashboard.locator(billingPageNew.xpathBillingFrozenInputCard)).toBeVisible();
      await expect(dashboard.locator(billingPageNew.xpathBillingFrozenAddress)).toBeVisible();
    });

    await test.step("Reopen the frozen store", async () => {
      await billingPageNew.reopenStoreFrozen(cardInfo, conf.suiteConf.info_charge_billing.id);
      expect(await dashboardPage.genLoc(billingPageNew.xpathAlertTitle).isVisible());
    });

    await test.step("Go to Billing page and get date of the current plan", async () => {
      await billingPageNew.goToBilling(conf.suiteConf.domain_update_tool);
      dateVerifyCurrentPlan = await billingPageNew.formatDateForVerifyBanlance();
    });

    await test.step("At Invoice page, verify Invoice for Charge subcription", async () => {
      await balancePageNew.goToBalance();
      await balancePageNew.clickButtonViewInvoice();
      await invoicePage.selectFilterInvoiceContentByValueAndDomain(
        conf.caseConf.filter_invoice,
        conf.suiteConf.domain_update_tool,
      );
      await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
      expect(await invoicePage.verifyInvoice(invoiceInfo)).toBe(true);
    });

    await test.step("Click newest invoice charge subcription fee", async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), await invoicePage.clickNewestInvoice()]);
      invoiceDetailPage = new InvoiceDetailPage(newPage, "");
      await invoiceDetailPage.isDBPageDisplay("Invoice detail");
      await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
    });

    await test.step("Verify invoice charge subcription at Invoice detail page", async () => {
      expect(
        await invoiceDetailPage.verifyInvoiceDetailWithText(invoiceInfo, dateVerifyCurrentPlan, dateVerifyCurrentPlan),
      ).toBe(true);
    });
  });
});
