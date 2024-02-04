import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { AbandonCheckoutScheduleData } from "./abandoned_checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import { OrdersPage } from "@pages/dashboard/orders";

test.describe("Create abandoned Checkout", () => {
  let checkout: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let failReason: string;
  let mailBox: MailBox;
  let domain: string;
  let orderPage: OrdersPage;

  test("Check failed reason cổng Stripe với Processing Error for case @SB_ORD_ABC_17", async ({
    conf,
    authRequest,
    page,
  }) => {
    failReason = conf.caseConf.fail_reason;
    domain = conf.suiteConf.storefront1_info.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkout = new SFCheckout(page, domain);

    await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.storefront1_info.product);
    await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
    await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
    await checkoutAPI.openCheckoutPageByToken();
    await checkout.selectPaymentMethod("Stripe");
    await checkout.completeOrderWithCardInfo(conf.caseConf.card_info, undefined, failReason);
  });

  test("Check failed reason cổng CardPay khi verify 3ds failed for case @SB_ORD_ABC_30", async ({
    conf,
    authRequest,
    page,
  }) => {
    failReason = conf.caseConf.fail_reason;
    domain = conf.suiteConf.storefront2_info.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkout = new SFCheckout(page, domain);

    await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.storefront2_info.product);
    await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
    await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
    await checkoutAPI.openCheckoutPageByToken();
    await checkout.selectPaymentMethod("Unlimint");
    await checkout.completeOrderUnlimint(conf.caseConf.card_info, failReason);
  });

  test("Create abandoned checkout for case @SB_ORD_ABC_3", async ({
    conf,
    scheduler,
    dashboard,
    authRequest,
    page,
  }) => {
    domain = conf.suiteConf.storefront3_info.domain;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkout = new SFCheckout(page, domain);

    await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.storefront3_info.product);
    await checkoutAPI.updateCustomerInformation(conf.suiteConf.mailAC, conf.suiteConf.shipping_address);
    await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
    await checkoutAPI.openCheckoutPageByToken();
    // Use schedule for case order timeline not response in first time loaded
    let scheduleData: AbandonCheckoutScheduleData;
    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as AbandonCheckoutScheduleData;
    } else {
      scheduleData = {
        checkoutToken: null,
      };
    }

    await test.step("Tạo abandoned checkout với card lỗi", async () => {
      failReason = conf.caseConf.fail_reason;
      await checkout.selectPaymentMethod("Stripe");
      await checkout.completeOrderWithCardInfo(conf.caseConf.card_info_error, undefined, failReason);
    });

    const checkoutTokenOfOrder = checkout.getCheckoutToken();
    if (!scheduleData.checkoutToken) {
      scheduleData.checkoutToken = checkoutTokenOfOrder;

      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: 30 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    }
    await scheduler.clear();

    mailBox = new MailBox(page, domain);

    await test.step("Tại mailbox buyer: Kiểm tra email abandoned checkout gửi cho buyer", async () => {
      //Kiểm tra email abandoned checkout gửi cho buyer
      await mailBox.openMailAbandonedCheckout("Abandoned checkout email 1", conf.suiteConf.mailAC);
    });

    await test.step("Checkout với recovery link từ email abandoned checkout", async () => {
      checkout = await mailBox.openRecoveryLink();
      await checkout.selectPaymentMethod("Stripe");
      await checkout.completeOrderWithCardInfo(conf.caseConf.card_info);
    });

    await test.step("Seller check trạng thái Recovered của order tại list abandoned checkout", async () => {
      orderPage = new OrdersPage(dashboard, domain);
      await orderPage.goToAbandonedCheckoutPage();
      await orderPage.searchAbandonedCheckout(scheduleData.checkoutToken);
      expect(await orderPage.getRecoveryStatusOfAbandonedCO()).toEqual(`Recovered`);
    });
  });
});
