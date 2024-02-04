import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

test.describe(`Kiểm tra order details khi chọn setting
               Automatically capture payment for order exclude fraud`, () => {
  let orderId, totalOrder, customerInfo, prodName;
  let domain: string, retry: number;

  let checkout: SFCheckout, orderPage: OrdersPage;
  let homepage: SFHome, productPage: SFProduct;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    customerInfo = conf.caseConf.customer_info;
    prodName = conf.suiteConf.product.name;
    retry = conf.suiteConf.retry;
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

  test("Kiểm tra order details của order không có fraud @TC_SB_SET_PMS_MC_227", async () => {
    await test.step("Tại Dashboard: Kiểm tra order details của order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.reloadUntilOrdCapture("", retry);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Paid");

      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(removeCurrencySymbol(paidByCustomer)).toEqual(removeCurrencySymbol(totalOrder));

      const xpathTimeline = orderPage.xpathActivityLog(totalOrder).activityCapPayment;
      let i = 0;
      while (!(await orderPage.isElementExisted(xpathTimeline))) {
        await orderPage.page.reload({ waitUntil: "networkidle" });
        await orderPage.page.waitForSelector(orderPage.xpathTextOrder);
        i++;
        if (i === 5 || (await orderPage.isElementExisted(xpathTimeline))) {
          break;
        }
      }
    });
  });
});
