import { expect, test } from "@core/fixtures";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import type { Product, ShippingAddress } from "@types";
import { AllProductStorefront } from "@pages/shopbase_creator/storefront/all_product";
import { OrdersPage } from "@pages/dashboard/orders";
import { PaymentMethod } from "@pages/storefront/checkout";

test.describe(`Checkout Shopbase Creator`, () => {
  let domain: string;
  let totalOrderSF: string;
  let actualTaxAmt: string;
  let productInfo: Array<Product>;
  let customerInfo: ShippingAddress;

  let orderPage: OrdersPage;
  let checkoutPage: CheckoutForm;
  let productPage: AllProductStorefront;

  test.beforeEach(async ({ conf, page, dashboard }) => {
    domain = conf.suiteConf.domain;
    customerInfo = conf.suiteConf.customer_info;

    productInfo = conf.caseConf.product_info;

    orderPage = new OrdersPage(dashboard, domain);
    checkoutPage = new CheckoutForm(page, domain);
    productPage = new AllProductStorefront(page, domain);
  });

  test(`@SB_CHE_OPAY_SMOKE_11 [Creator] Kiểm tra order detail khi checkout thành công với cổng Stripe`, async () => {
    await test.step(`
      - Mở trang search ngoài storefront của shop
      - Nhập vào tên sản phẩm cần tìm kiếm
      - Click vào sản phẩm
      - Điền email customer
      - Chọn payment method là Credit card
      - Click "Pay now"`, async () => {
      await productPage.gotoHomePage();
      await productPage.selectCreatorProduct(productInfo[0].name);
      await checkoutPage.enterEmail(customerInfo.email);
      await checkoutPage.completeOrderWithCardInfo();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      totalOrderSF = await checkoutPage.getTotalOnOrderSummary();
    });

    await test.step(`Copy order id, đăng nhập vào admin, tìm kiếm order với id vừa copy`, async () => {
      const orderId = await checkoutPage.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture();

      actualTaxAmt = await orderPage.getTotalOrder();
      expect(actualTaxAmt).toEqual(totalOrderSF);
    });
  });

  test(`@SB_CHE_OPAY_SMOKE_12 [Creator] Kiểm tra order detail khi checkout thành công với cổng Stripe, order có add PPC`, async () => {
    await test.step(`
      - Mở trang search ngoài storefront của shop
      - Nhập vào tên sản phẩm cần tìm kiếm
      - Click vào sản phẩm
      - Điền email customer
      - Chọn payment method là Credit card
      - Click "Pay now"`, async () => {
      await productPage.gotoHomePage();
      await productPage.selectCreatorProduct(productInfo[0].name);
      await checkoutPage.enterEmail(customerInfo.email);
      await checkoutPage.completeOrderWithCardInfo();
    });

    await test.step(`- Tại popup PPC: add product PPC`, async () => {
      await checkoutPage.addProductUpsellToOrder();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      totalOrderSF = await checkoutPage.getTotalOnOrderSummary();
    });

    await test.step(`Copy order id, đăng nhập vào admin, tìm kiếm order với id vừa copy`, async () => {
      const orderId = await checkoutPage.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture();

      actualTaxAmt = await orderPage.getTotalOrder();
      expect(actualTaxAmt).toEqual(totalOrderSF);
    });
  });

  test(`@SB_CHE_OPAY_SMOKE_13 [Creator] Kiểm tra order detail khi checkout thành công với cổng Paypal`, async () => {
    await test.step(`
      - Mở trang search ngoài storefront của shop
      - Nhập vào tên sản phẩm cần tìm kiếm
      - Click vào sản phẩm
      - Điền email customer
      - Chọn payment method là Paypal
      - Click "Pay now"`, async () => {
      await productPage.gotoHomePage();
      await productPage.selectCreatorProduct(productInfo[0].name);
      await checkoutPage.enterEmail(customerInfo.email);
      await checkoutPage.selectPaymentMethod(PaymentMethod.PAYPALCREATOR);
      await checkoutPage.clickBtnCompleteOrder();
      await checkoutPage.logInPayPalThenClickPayNow();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      totalOrderSF = await checkoutPage.getTotalOnOrderSummary();
    });

    await test.step(`Copy order id, đăng nhập vào admin, tìm kiếm order với id vừa copy`, async () => {
      const orderId = await checkoutPage.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture();

      actualTaxAmt = await orderPage.getTotalOrder();
      expect(actualTaxAmt).toEqual(totalOrderSF);
    });
  });
});
