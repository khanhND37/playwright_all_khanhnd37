import { expect, test } from "@core/fixtures";
import { OrderPage } from "@pages/digital_product/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { loadData } from "@core/conf/conf";

test.describe("Verify Abandoned Checkout detail", () => {
  let orderPage;
  let dashboardPage;
  let checkout;

  test.beforeEach(async ({ dashboard, conf }) => {
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    checkout = conf.caseConf.checkout_info;
    await dashboardPage.navigateToMenu("Orders");
    await dashboardPage.navigateToMenu("Abandoned checkouts");
    await orderPage.filterByDate(dashboard, conf.suiteConf.value);
    await orderPage.clickOrderName(dashboard, conf.suiteConf.checkout_code);
  });

  test(`[Abandoned checkout detail] Verify UI hiển thị thông tin @TC_SB_DP_DB_DP_ACC_9`, async () => {
    await test.step(`Click vào checkout bất kỳ vào màn Abandoned checkout detail.`, async () => {
      await expect(orderPage.genLoc(`//div[contains(text(),'${checkout.checkout_code}')]`)).toBeVisible();
      await expect(orderPage.genLoc(`//div[@class='sb-more-content']`)).toBeVisible();
    });
  });

  test(`[Abandoned checkout detail] Verify block "Checkout details" @TC_SB_DP_DB_DP_ACC_10`, async () => {
    await test.step(`Click vào Abandoned checkout không có discount vào màn Abandoned checkout detail.
    Check thông tin block "Checkout details" gồm subtotal &  số item`, async () => {
      await expect(orderPage.genLoc(`(//div[@role='tablist'])[2]`)).toBeVisible();
      await expect(orderPage.genLoc(`//div[contains(text(),'${checkout.line_item}')]`)).toBeVisible();
      await expect(orderPage.genLoc(`//span[contains(text(),'${checkout.total}')]`)).toBeVisible();
    });
  });

  test(`[Abandoned checkout detail] Verify block "Timeline " @TC_SB_DP_DB_DP_ACC_11`, async () => {
    await test.step(`Check thông tin block "Timeline" với action checkout`, async () => {
      await expect(await orderPage.genLoc(`//div[contains(text(),'${checkout.timeline}')])[last()]`)).toBeVisible();
      await expect(
        await orderPage.genLoc(`//div[contains(text(),'${checkout.timeline_send_mail}')])[last()]`),
      ).toBeVisible();
    });
  });

  const conf = loadData(__dirname, "VERIFY_ADDITIONAL_DETAILS");
  test(`${conf.caseConf.data.description} @${conf.caseConf.data.case_code}`, async () => {
    for (let i = 0; i < conf.caseConf.data.checkout_data.length; i++) {
      const caseData = conf.caseConf.data.checkout_data[i];
      await test.step(`${caseData.step}`, async () => {
        expect(await orderPage.editNoteAbandonedCheckout(caseData.checkout_note)).toEqual(caseData.checkout_note);
      });
    }
  });

  test(`[Abandoned checkout detail]Verify block "Customer" @TC_SB_DP_DB_DP_ACC_13`, async () => {
    await test.step(`Click vào Abandoned checkout detail, check block Customer`, async () => {
      await expect(orderPage.genLoc(`(//div[@role='tablist'])[4]`)).toBeVisible();
      await expect(await orderPage.genLoc(`//div[normalize-space()='${checkout.name_customer}']`)).toBeVisible();
      await expect(await orderPage.genLoc(`//p[normalize-space()='${checkout.order_customer}']`)).toBeVisible();
    });
  });
});
