import { expect, test } from "@core/fixtures";
import { CheckoutForm } from "@pages/digital_product/storefront/creator_checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/digital_payment";

test.describe("Kiểm tra giao diện form checkout @TS_DP_CO", () => {
  let checkoutPage: CheckoutForm;
  let dashboardPage: DashboardPage;
  let paymentProviderPage: PaymentProviderPage;

  test(`Kiểm tra giao diện form checkout với shop chưa connect cổng thanh toán @SB_DP_DPSF_CDP_1`, async ({
    page,
    dashboard,
    conf,
  }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);

    await dashboardPage.navigateToMenu("Settings");
    await dashboardPage.goto("admin/settings/general");
    const customerEmail = await dashboardPage.getValueContent(
      `(//div[child::label[contains(text(),'Customer Email')]]//following::input)[1]`,
    );

    await test.step(`Kiểm tra màn checkout với shop chưa connect cổng thanh toán với trường hợp product mất phí `, async () => {
      await checkoutPage.goto(`/${conf.caseConf.product_url}`);
      await expect(checkoutPage.genLoc("//p[normalize-space()='Payment Methods are not available']")).toBeVisible();
      const msgNoAvailable = `${conf.caseConf.msg_no_payment} ${customerEmail}`;
      expect(await checkoutPage.genLoc(`//p[@class="p2 text-align-center"]`).innerText()).toEqual(msgNoAvailable);
    });

    await test.step(`Kiểm tra màn checkout với shop chưa connect cổng thanh toán với product free`, async () => {
      await checkoutPage.goto(`/${conf.caseConf.product_free_url}`);
      await expect(checkoutPage.genLoc("//p[normalize-space()='Payment Methods are not available']")).not.toBeVisible();
      await expect(checkoutPage.genLoc(`//p[normalize-space()="Payment"]`)).not.toBeVisible();
      await expect(checkoutPage.genLoc(`//button[contains(@class, 'paynow btn-primary')]`)).toBeEnabled();
    });
  });

  test(`Kiểm tra giao diện form checkout với shop đã connect cổng thanh toán @SB_DP_DPSF_CDP_52`, async ({
    page,
    dashboard,
    conf,
  }) => {
    paymentProviderPage = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);
    await paymentProviderPage.navigateToMenu("Settings");
    await paymentProviderPage.goto("admin/creator/settings/payments");

    // Connect stripe card payment
    await paymentProviderPage.openAddNewPayment("Stripe");
    await paymentProviderPage.selectAPIKeyOption();
    await paymentProviderPage.inputPaymentKey(
      conf.caseConf.public_key,
      conf.caseConf.secret_key,
      conf.caseConf.account_name,
    );
    await paymentProviderPage.clickAddAccount();
    await expect(
      paymentProviderPage.genLoc(
        `//span[normalize-space() = '${conf.caseConf.account_name}']
            /parent::div//div[contains(@class, 'circle-green')]`,
      ),
    ).toBeVisible();

    await test.step(`Kiểm tra màn checkout với shop đã connect cổng thanh toán với product free`, async () => {
      await checkoutPage.goto(`/${conf.caseConf.product_free_url}`);
      await expect(checkoutPage.genLoc("//p[normalize-space()='Payment Methods are not available']")).not.toBeVisible();
      await expect(checkoutPage.genLoc(`//p[normalize-space()="Payment"]`)).not.toBeVisible();
      await expect(checkoutPage.genLoc(`//button[contains(@class, 'paynow btn-primary')]`)).toBeEnabled();
    });

    await test.step(`Kiểm tra màn checkout với shop đã connect cổng thanh toán với product mất phí`, async () => {
      await checkoutPage.goto(`/${conf.caseConf.product_url}`);
      await expect(checkoutPage.genLoc("//p[normalize-space()='Payment Methods are not available']")).not.toBeVisible();
      await expect(checkoutPage.genLoc(`//p[normalize-space()="Payment"]`)).toBeVisible();
      await expect(checkoutPage.genLoc(`//button[contains(@class, 'paynow btn-primary')]`)).toBeEnabled();
    });

    await test.step(`Tại block Stripe, Click button Remove account`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(conf.caseConf.account_name);
      await paymentProviderPage.removeProvider();
      await expect(
        paymentProviderPage.genLoc(`//div[normalize-space() = '${conf.caseConf.account_name}']`),
      ).toBeHidden();
    });
  });
});
