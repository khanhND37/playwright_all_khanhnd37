import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

test.describe(`Kiểm tra order details khi chọn setting
               Automatically capture payment for order có fraud`, () => {
  let orderId, totalOrder, customerInfo, prodName;
  let domain: string;

  let checkout: SFCheckout, orderPage: OrdersPage;
  let homepage: SFHome, productPage: SFProduct;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    customerInfo = conf.caseConf.customer_info;
    prodName = conf.suiteConf.product.name;
  });

  test.beforeEach(async ({ conf, page, dashboard }) => {
    homepage = new SFHome(page, domain);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);

    //Checkout thành công 1 order
    await homepage.gotoHomePage();
    productPage = await homepage.searchThenViewProduct(prodName);
    await productPage.addProductToCart();
    checkout = await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(customerInfo);
    await checkout.continueToPaymentMethod();
    await checkout.completeOrderWithMethod();
    orderId = await checkout.getOrderIdBySDK();
    totalOrder = await checkout.getTotalOnOrderSummary();
  });

  test("Kiểm tra order details của order có fraud @TC_SB_SET_PMS_MC_222", async () => {
    await test.step("Tại Dashboard: Kiểm tra order details order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(actualPaymentStatus).toEqual("Authorized");
      expect(removeCurrencySymbol(paidByCustomer)).toEqual("0.00");
    });

    await test.step("Capture toàn bộ order vừa tạo và kiểm tra order details", async () => {
      const captureAmount = removeCurrencySymbol(totalOrder);
      await orderPage.captureOrder(captureAmount);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(removeCurrencySymbol(paidByCustomer)).toEqual(removeCurrencySymbol(totalOrder));
      const xpathTimeline = orderPage.xpathActivityLog(+removeCurrencySymbol(paidByCustomer)).activityCapPayment;
      for (let i = 0; i <= 5; i++) {
        if (await orderPage.isElementExisted(xpathTimeline, null, 500)) {
          break;
        }
        await orderPage.page.reload();
        await orderPage.page.waitForSelector(orderPage.xpathTextOrder);
      }
    });
  });
});
