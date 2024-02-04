import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import type { Product } from "@types";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFHome } from "@pages/storefront/homepage";
import { SettingShipping } from "@pages/dashboard/setting_shipping";

//Calculate shipping amount after apply free shipping cap value
const calShippingAmt = (
  shippingAmt: number,
  maxCapValue: number,
  shippingAmtPPC?: number,
): { originShipFee: number; newShippingValue: string } => {
  let newShippingValue;
  if (!shippingAmtPPC) {
    shippingAmtPPC = 0;
  }
  const originShipFee = shippingAmt + shippingAmtPPC;
  const discountShipValue = shippingAmt + shippingAmtPPC - maxCapValue;
  if (discountShipValue <= 0) {
    newShippingValue = "Free";
  } else {
    newShippingValue = discountShipValue.toFixed(2);
  }
  const expectShippingFee = {
    originShipFee: originShipFee,
    newShippingValue: newShippingValue,
  };
  return expectShippingFee;
};

// Verify shipping fee when apply free shipping cap value in checkout page and order detail
const verifyShippingFee = (actualShippingFee, expectShippingFee) => {
  expect(actualShippingFee.originShipFee).toEqual(expectShippingFee.originShipFee);
  expect(actualShippingFee.newShippingValue).toEqual(expectShippingFee.newShippingValue);
  if (actualShippingFee.shippingValInOrdSummary) {
    expect(actualShippingFee.shippingValInOrdSummary).toEqual(expectShippingFee.newShippingValue);
  }
};

const verifyShippingValue = (actualShippingFee, expectShippingFee) => {
  expect(actualShippingFee.newShippingValue).toEqual(expectShippingFee.finalShippingValue);
  expect(actualShippingFee.shippingValInOrdSummary).toEqual(expectShippingFee.finalShippingValue);
  if (expectShippingFee.originShipFee) {
    expect(actualShippingFee.originShipFee).toEqual(expectShippingFee.originShipFee);
  }
};

test.describe("Checkout success when apply free shipping maximum value", () => {
  let expectShippingFee, expShippingMethods, shippingZone, shippingZoneDefault, shippingMethod;
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let productCheckout: Array<Product>;
  let orderPage: OrdersPage;
  let homepage: SFHome;
  let shippingSetting: SettingShipping;

  test(`Kiểm tra discount shipping value khi shipping amount nhỏ hơn hoặc bằng maximum discount value @SB_PLB_SP_SPP_FS_20`, async ({
    dashboard,
    conf,
    request,
    page,
  }) => {
    const domain = conf.suiteConf.domain;
    checkoutAPI = new CheckoutAPI(domain, request, page);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    productCheckout = conf.caseConf.products_checkout;
    homepage = new SFHome(page, domain);
    shippingSetting = new SettingShipping(dashboard, domain);
    shippingZone = conf.suiteConf.shipping_zone;
    shippingZoneDefault = conf.suiteConf.shipping_zone_default;
    shippingMethod = conf.caseConf.shipping_method;

    await test.step(`
    - Setting free shipping in dashboard`, async () => {
      await shippingSetting.goto("/admin/settings/shipping");
      await shippingSetting.settingFreeshipRatePbase(shippingZone);
      await shippingSetting.goto("/admin/settings/shipping");
      await shippingSetting.settingFreeshipRatePbase(shippingZoneDefault);
    });

    await test.step(`
      - Tren SF checkout voi 1 product
      - Verify discount shipping value`, async () => {
      const { email, shipping_address_api } = conf.suiteConf as never;
      await homepage.gotoHomePage();
      await checkoutAPI.addProductThenSelectShippingMethod(productCheckout, email, shipping_address_api);
      await checkoutAPI.openCheckoutPageByToken();
      await checkoutPage.waitForCheckoutPageCompleteRender();
      await checkoutPage.page.waitForSelector("//div[contains(@class,'section--shipping-method')]");
      const shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(shippingMethod[0].method_name);
      expectShippingFee = calShippingAmt(shippingMethod[0].shipping_fee, shippingZone.max_discount_amt);
      verifyShippingFee(shippingValInfo, expectShippingFee);
    });

    await test.step(`
        - Chọn shipping method còn lại
        - Verify discount shipping value`, async () => {
      const shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(shippingMethod[1].method_name);

      expectShippingFee = calShippingAmt(shippingMethod[1].shipping_fee, shippingZone.max_discount_amt);
      verifyShippingFee(shippingValInfo, expectShippingFee);
    });

    await test.step(`
      - Nhập payment method > Click Place your order`, async () => {
      await checkoutPage.selectPaymentMethod();
      await checkoutPage.completeOrderWithMethod();
      expect(await checkoutPage.isThankyouPage()).toBe(true);
    });

    await test.step(`
        - Tại thankyou page > Lấy ra order name
        - Login vào dashboard 
        - Vào order detail
        - Verify shipping line`, async () => {
      const orderId = await checkoutPage.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const shipInfoInOrdDetail = await orderPage.getShippingValuesInOrdDetail(shippingMethod[1].method_name);
      verifyShippingFee(shipInfoInOrdDetail, expectShippingFee);
    });
  });
  test(`Sau khi apply manual discount thì order vẫn thoả mãn điều kiện đã setting @SB_PLB_SP_SPP_FS_19`, async ({
    conf,
    authRequest,
    page,
  }) => {
    const { domain, email, shipping_address_api } = conf.suiteConf as never;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    checkoutPage = new SFCheckout(page, domain);
    productCheckout = conf.caseConf.products_checkout;
    expShippingMethods = conf.caseConf.expected_shipping_methods;

    await test.step(`
      - Trên SF, mua 5 sản phẩm Products checkout`, async () => {
      await checkoutAPI.addProductThenSelectShippingMethod(productCheckout, email, shipping_address_api);
      await checkoutAPI.openCheckoutPageByToken();
    });

    await test.step(`
      - Nhập shipping address đến US (lúc này order được free shipping)
      - Nhập discount (Total after applying discount = 84.95$)- Kiểm tra shipping fee`, async () => {
      await checkoutPage.waitForCheckoutPageCompleteRender();
      await checkoutPage.applyDiscountCode(conf.caseConf.discount_code);
      await checkoutPage.page.waitForSelector("//div[contains(@class,'section--shipping-method')]");
      const shippingValInfo = await checkoutPage.selectAndGetShippingInfoWithMethod(expShippingMethods[0].method_title);

      verifyShippingValue(shippingValInfo, expShippingMethods[0]);
    });
  });
});
