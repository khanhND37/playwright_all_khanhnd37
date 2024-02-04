import { expect, test } from "@core/fixtures";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { loadData } from "@core/conf/conf";

test.describe("Verify Abandoned checkouts", () => {
  let orderPage: OrderPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ dashboard, conf }) => {
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    await dashboardPage.navigateToMenu("Orders");
    await dashboardPage.navigateToMenu("Abandoned checkouts");
  });

  const confMail = loadData(__dirname, "FILTER_EMAIL_STATUS");
  test(`${confMail.caseConf.data.description} @${confMail.caseConf.data.case_code}`, async () => {
    const checkoutData = confMail.caseConf.data.filter_data;
    for (const caseData of checkoutData) {
      await test.step(`${caseData.step}`, async () => {
        await orderPage.filterByStatus(confMail.caseConf.data.filter, caseData.value);

        const actNumberAbandonedCheckout = await orderPage.getNumberAbandonedCheckout(caseData.value);
        expect(actNumberAbandonedCheckout).toEqual(caseData.number);
        await orderPage.removeFilterByStatus(confMail.caseConf.data.filter, caseData.value);
      });
    }
  });

  test(`[Filter] Verify filter theo "Recovery Status" @SB_SC_SCO_34`, async ({ conf }) => {
    await test.step(`Filter theo trường "Recovery Status" = "Recovered" > Click "Done"`, async () => {
      const checkout = conf.caseConf.filter_email_recovery;
      await orderPage.filterByStatus(checkout.filter, checkout.value);

      const actNumberAbandonedCheckout = await orderPage.getNumberAbandonedCheckout(checkout.value);
      expect(actNumberAbandonedCheckout).toEqual(checkout.number);
      await orderPage.removeFilterByStatus(checkout.filter, checkout.value);
    });
    await test.step(`Filter theo trường "Recovery Status" =  "Not recovered" > Click "Done"`, async () => {
      const checkout = conf.caseConf.filter_email_status_not_recovery;
      await orderPage.filterByStatus(checkout.filter, checkout.value);

      const actNumberAbandonedCheckout = await orderPage.getNumberAbandonedCheckout(checkout.value);
      expect(actNumberAbandonedCheckout).toEqual(checkout.number);
      await orderPage.removeFilterByStatus(checkout.filter, checkout.value);
    });
  });

  const confDate = loadData(__dirname, "FILTER_CHECKOUT_DATE");
  test(`${confDate.caseConf.data.description} @${confDate.caseConf.data.case_code}`, async () => {
    test.slow();
    const checkoutData = confDate.caseConf.data.filter_data;
    for (const caseData of checkoutData) {
      await test.step(`${caseData.step}`, async () => {
        await orderPage.filterByDate(caseData.value, caseData.input_date);

        const actNumberAbandonedCheckout = await orderPage.getNumberAbandonedCheckout();
        expect(actNumberAbandonedCheckout).toEqual(caseData.number);
      });
    }
  });
});
