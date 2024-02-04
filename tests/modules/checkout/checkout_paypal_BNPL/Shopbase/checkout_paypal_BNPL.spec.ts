import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import { getProxyPage } from "@core/utils/proxy_page";

test.describe("Checkout qua Paypal buy now pay later Shopbase", async () => {
  let checkout: SFCheckout, orderPage: OrdersPage, mailBox: MailBox;
  let dashboardAPI: DashboardAPI, checkoutAPI: CheckoutAPI;
  let orderId: number, orderName: string, totalOrderSF: string, tipAtSF: string, taxAtSF: string;
  let shippingFee: string, customerEmail: string;
  let domain, ppcItem, productInfo, email, tippingInfo, shopId;
  let shippingAddress, totalSalesBefore, totalSalesAfter;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    shopId = conf.suiteConf.shop_id;
  });

  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    dashboardAPI = new DashboardAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    totalSalesBefore = await dashboardAPI.getTotalSalesByShopId(shopId);
    productInfo = conf.caseConf.product;
    ppcItem = conf.caseConf.product_ppc_name;
    tippingInfo = conf.caseConf.tipping_info;
    const countryCode = shippingAddress.country_code;

    const proxyPage = await getProxyPage();
    checkoutAPI = new CheckoutAPI(domain, authRequest, proxyPage);
    await checkoutAPI.addProductToCartThenCheckout(productInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    checkout = await checkoutAPI.openCheckoutPageByToken();

    if (tippingInfo) {
      await checkout.addTip(tippingInfo);
    }
    await checkout.completeOrderWithMethod("PaypalBNPL");
    if (ppcItem) {
      // For cases have PPC
      await checkout.addProductPostPurchase(ppcItem);
      await checkout.completePaymentForPPCItemViaPayPalBNPL();
    }

    // Get order infos after completed order successfully
    [orderId, orderName, customerEmail, totalOrderSF, taxAtSF, shippingFee, tipAtSF] = await Promise.all([
      checkout.getOrderIdBySDK(),
      checkout.getOrderName(),
      checkout.getCustomerEmail(),
      checkout.getTotalOnOrderSummary(),
      checkout.getTaxOnOrderSummary(),
      checkout.getShippingFeeOnOrderSummary(),
      checkout.getTipOnOrderSummary(),
    ]);
  });

  test(`Kiểm tra checkout 1 orderqua paypal khi chọn Pay later không có PPC thành công @SB_TC_PP_BNPL_4`, async () => {
    await test.step(`Truy cập order details của order vừa tạo bằng API`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const [paidByCustomer, tipAtDB, taxAtDB, shippingFeeDB, orderStatus, totalOrderDB] = await Promise.all([
        orderPage.getPaidByCustomer(),
        orderPage.getTip(),
        orderPage.getTax(),
        orderPage.getShippingFee(),
        orderPage.getOrderStatus(),
        orderPage.getTotalOrder(),
      ]);

      expect(orderStatus).toEqual("Paid");
      expect(paidByCustomer).toEqual(totalOrderSF);
      expect(tipAtDB).toEqual(tipAtSF);
      expect(taxAtDB).toEqual(taxAtSF);
      expect(shippingFeeDB).toEqual(shippingFee);
      expect(totalOrderDB).toEqual(totalOrderSF);
    });

    await test.step("Tại mailbox buyer: Kiểm tra email confirmation gửi cho buyer", async () => {
      mailBox = await checkout.openMailBox(customerEmail);
      await mailBox.openOrderConfirmationNotification(orderName);
      const actualTotalOrder = await mailBox.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF);
    });
  });

  test(`Kiểm tra checkout 1 orderqua paypal khi chọn Pay later có PPC thành công @SB_TC_PP_BNPL_5`, async () => {
    await test.step(`Truy cập order details của order vừa tạo bằng API`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const orderStatus = await orderPage.reloadUntilOrdCapture();
      const paidByCustomer = await orderPage.getPaidByCustomer();

      expect(orderStatus).toEqual("Paid");
      expect(paidByCustomer).toEqual(totalOrderSF);
    });

    await test.step("Tại mailbox buyer: Kiểm tra email confirmation gửi cho buyer", async () => {
      mailBox = await checkout.openMailBox(customerEmail);
      await mailBox.openOrderConfirmationNotification(orderName);
      const actualTotalOrder = await mailBox.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF);
    });
  });

  test("Kiểm tra analytic khi checkout 1 order qua paypal khi chọn Pay later @SB_TC_PP_BNPL_12", async () => {
    await test.step(`Truy cập order details của order vừa tạo bằng API`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture();
      const totalOrderDB = await orderPage.getTotalOrder();
      expect(totalOrderDB).toEqual(totalOrderSF);
    });

    await test.step("Tại Dashboard > Analytics > Sales report: Kiểm tra sự thay đổi analytics", async () => {
      const expectTotalSalesAfter = Number((totalSalesBefore + Number(removeCurrencySymbol(totalOrderSF))).toFixed(2));
      for (let i = 0; i < 60; i++) {
        totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopId);
        if (totalSalesAfter !== totalSalesBefore) {
          break;
        }
        await orderPage.page.waitForTimeout(1000);
      }
      try {
        expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 0.01)).toEqual(true);
      } catch {
        throw new Error(`Analytics get more than 40s to update`);
      }
    });
  });

  test("Kiểm tra cancel 1 order checkout qua Paypal khi chọn Pay later @SB_TC_PP_BNPL_8", async () => {
    test.setTimeout(300000);
    await test.step("Tại Dashboard > Analytics > Sales report: Kiểm tra sự thay đổi analytics", async () => {
      const expectTotalSalesAfter = Number((totalSalesBefore + Number(removeCurrencySymbol(totalOrderSF))).toFixed(2));
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture();
      for (let i = 0; i < 60; i++) {
        totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopId);
        if (totalSalesAfter !== totalSalesBefore) {
          break;
        }
        await orderPage.page.waitForTimeout(1000);
      }
      expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 0.01)).toEqual(true);
      totalSalesBefore = totalSalesAfter;
    });

    await test.step(`Truy cập order details của order vừa tạo bằng API > cancel order`, async () => {
      const totalOrderDB = await orderPage.getTotalOrder();
      expect(totalOrderDB).toEqual(totalOrderSF);
      await orderPage.cancelOrderInOrderDetails();
      const netPayment = await orderPage.getNetPayment();
      expect(netPayment).toEqual("$0.00");
    });

    await test.step("Tại mailbox buyer: Kiểm tra email cancel gửi cho buyer", async () => {
      mailBox = await checkout.openMailBox(customerEmail);
      await mailBox.openOrderCanceledNotification(orderName);
      const refundAmount = await mailBox.getRefundAmount();
      expect(refundAmount).toEqual(`- ` + totalOrderSF);
    });

    // Analytics update chậm
    // await test.step("Tại Dashboard > Analytics > Sales report: Kiểm tra sự thay đổi analytics", async () => {
    //   const expectTotalSalesAfter =
    //      Number((totalSalesBefore - Number(removeCurrencySymbol(totalOrderSF))).toFixed(2));
    //   for (let i = 0; i < 40; i++) {
    //     totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopId);
    //     if (totalSalesAfter !== totalSalesBefore) {
    //       break;
    //     }
    //   }
    //   expect(isEqual(totalSalesAfter, expectTotalSalesAfter, 0.01)).toEqual(true);
    // });
  });
});
