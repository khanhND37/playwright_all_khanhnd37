import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardAPI } from "@pages/api/dashboard";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { MailBox } from "@pages/thirdparty/mailbox";

test.describe("Manual capture", () => {
  let orderId, totalOrder, customerInfo, prodName;
  let domain: string, shopId, paymentId, email;

  let checkout: SFCheckout, orderPage: OrdersPage, dashboardAPI: DashboardAPI;
  let homepage: SFHome, productPage: SFProduct, dashboardPage: DashboardPage, mailbox: MailBox;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    customerInfo = conf.suiteConf.customer_info;
    shopId = conf.suiteConf.shop_id;
    paymentId = conf.suiteConf.payment_method_id;
    email = conf.suiteConf.username;
  });

  test.beforeEach(async ({ conf, page, authRequest, dashboard }) => {
    homepage = new SFHome(page, domain);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    dashboardPage = new DashboardPage(dashboard, domain);
    orderPage = new OrdersPage(dashboard, domain);
    prodName = conf.caseConf.product.name;

    await homepage.gotoHomePage();
    productPage = await homepage.searchThenViewProduct(prodName);
    await productPage.addProductToCart();
    checkout = await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(customerInfo);
    await checkout.continueToPaymentMethod();
  });

  test("Capture toàn bộ order thành công @TC_SB_SET_PMS_MC_197", async ({ page }) => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe", async () => {
      await checkout.completeOrderWithMethod();
      totalOrder = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Tại Dashboard: Kiểm tra order details và capture order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      const captureAmount = removeCurrencySymbol(totalOrder);
      await orderPage.captureOrder(captureAmount);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(removeCurrencySymbol(paidByCustomer)).toEqual(removeCurrencySymbol(totalOrder));
      const btnCapture = page.locator("//button[child::span[text()[normalize-space()='Capture payment']]]");
      await expect(btnCapture).toBeHidden();
    });
  });

  test("Capture 1 phần order thành công @TC_SB_SET_PMS_MC_198", async ({ conf, page }) => {
    const captureAmount = conf.caseConf.capture_amount;

    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe", async () => {
      await checkout.completeOrderWithMethod();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Tại Dashboard: Kiểm tra order details và capture 1 phần order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      await orderPage.captureOrder(captureAmount);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(removeCurrencySymbol(paidByCustomer)).toEqual(captureAmount);
      const btnCapture = page.locator("//button[child::span[text()[normalize-space()='Capture payment']]]");
      await expect(btnCapture).toBeHidden();
    });
  });

  test("Kiểm tra order checkout qua Stripe EU không bị ảnh hưởng bởi manual capture @TC_SB_SET_PMS_MC_201", async ({
    conf,
    page,
  }) => {
    const paymentGateway = conf.caseConf.payment_gateway;

    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe EU", async () => {
      await checkout.completeOrderWithMethod(paymentGateway);
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Kiểm tra order details của order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      await orderPage.reloadUntilOrdCapture(actualPaymentStatus, 5);
      expect(actualPaymentStatus).toEqual("Paid");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual(totalOrder);
      const btnCapture = page.locator("//button[child::span[text()[normalize-space()='Capture payment']]]");
      await expect(btnCapture).toBeHidden();
    });
  });

  test("Order checkout qua manual method không bị ảnh hưởng bởi manual capture @TC_SB_SET_PMS_MC_202", async ({
    page,
  }) => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua COD", async () => {
      await checkout.completeOrderWithMethod("cod");
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Tại Dashboard: Kiểm tra payment status order vừa tạo", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      await orderPage.reloadUntilOrdCapture(actualPaymentStatus, 5);
      expect(actualPaymentStatus).toEqual("Pending");
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(paidByCustomer).toEqual("$0.00");
      const btnCapture = page.locator("//button[child::span[text()[normalize-space()='Capture payment']]]");
      await expect(btnCapture).toBeHidden();
    });
  });

  test("Không thể refund order, có thể cancel order khi order chưa được capture @TC_SB_SET_PMS_MC_203", async ({
    page,
  }) => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe", async () => {
      await checkout.completeOrderWithMethod();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Tại Dashboard: Kiểm tra order details của order vừa tạo và thực hiện cancel order", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      const btnRefund = page.locator("//span[normalize-space()='Refund item']");
      await expect(btnRefund).toBeHidden();
      await orderPage.cancelOrderInOrderDetails();
    });
  });

  test("Kiểm tra không cho phép capture order khi order đang chờ PPC @TC_SB_SET_PMS_MC_204", async ({ page }) => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe", async () => {
      await checkout.completeOrderWithMethod();
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step("Tại Dashboard: Kiểm tra order details của order vừa tạo và thực hiện cancel order", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      const btnCapture = page.locator("//button[child::span[text()[normalize-space()='Capture payment']]]");
      await expect(btnCapture).toBeHidden();
    });
  });

  test("Kiểm tra capture nhiều order tại order list @TC_SB_SET_PMS_MC_205", async () => {
    const listOrderName: Array<string> = [];
    const listOrderId: Array<number> = [];
    let orderId: number, orderName: string;

    await test.step("Tại Storefront: Tạo 2 order", async () => {
      await test.step("Tạo order thứ nhất qua Stripe", async () => {
        await checkout.completeOrderWithMethod();
        orderId = await checkout.getOrderIdBySDK();
        orderName = await checkout.getOrderName();
        listOrderName.push(orderName);
        listOrderId.push(orderId);
      });

      await test.step("Tạo order thứ hai qua Stripe", async () => {
        await homepage.gotoHomePage();
        productPage = await homepage.searchThenViewProduct(prodName);
        await productPage.addProductToCart();
        checkout = await productPage.navigateToCheckoutPage();
        await checkout.enterShippingAddress(customerInfo);
        await checkout.continueToPaymentMethod();
        await checkout.completeOrderWithMethod();
        orderId = await checkout.getOrderIdBySDK();
        orderName = await checkout.getOrderName();
        listOrderName.push(orderName);
        listOrderId.push(orderId);
      });
    });

    await test.step("Tại Order list: Capture 2 order vừa tạo", async () => {
      await dashboardPage.navigateToMenu("Orders");
      for (let i = 0; i < listOrderName.length; i++) {
        await orderPage.chooseOrderAtOrderList(listOrderName[i]);
      }
      await orderPage.captureOrderAtOrderList();
    });

    await test.step("Kiểm tra order details của 2 order vừa tạo", async () => {
      for (const id of listOrderId) {
        await orderPage.goToOrderByOrderId(id);
        await orderPage.reloadUntilOrdCapture("", 5);
        const actualPaymentStatus = await orderPage.getOrderStatus();
        expect(actualPaymentStatus).toEqual("Paid");
        const paidByCustomer = await orderPage.getPaidByCustomer();
        await expect(
          orderPage.page.locator(`//div[contains(text(), 'A ${paidByCustomer} USD payment was processed')]`),
        ).toBeVisible();
      }
    });
  });

  test("Kiểm tra mailbox merchant khi capture nhiều order @SB_SET_PMS_MC_225", async ({ page }) => {
    const listOrderName: Array<string> = [];
    const listOrderId: Array<number> = [];
    let orderId: number, orderName: string;

    await test.step("Tại Storefront: Tạo 2 order", async () => {
      await test.step("Tạo order thứ nhất qua Stripe", async () => {
        await checkout.completeOrderWithMethod();
        orderId = await checkout.getOrderIdBySDK();
        orderName = await checkout.getOrderName();
        listOrderName.push(orderName);
        listOrderId.push(orderId);
      });

      await test.step("Tạo order thứ hai qua Stripe", async () => {
        await homepage.gotoHomePage();
        productPage = await homepage.searchThenViewProduct(prodName);
        await productPage.addProductToCart();
        checkout = await productPage.navigateToCheckoutPage();
        await checkout.enterShippingAddress(customerInfo);
        await checkout.continueToPaymentMethod();
        await checkout.completeOrderWithMethod();
        orderId = await checkout.getOrderIdBySDK();
        orderName = await checkout.getOrderName();
        listOrderName.push(orderName);
        listOrderId.push(orderId);
      });
    });

    await test.step("Tại Order list: Capture 2 order vừa tạo", async () => {
      await dashboardPage.navigateToMenu("Orders");
      for (let i = 0; i < listOrderName.length; i++) {
        await orderPage.chooseOrderAtOrderList(listOrderName[i]);
      }
      await orderPage.captureOrderAtOrderList();
    });

    await test.step("Kiểm tra email gửi về mail của merchant khi capture nhiều order", async () => {
      mailbox = await checkout.openMailBox(email);
      mailbox.openCaptureOrderEmail();
      const numberOrderCaptured = page.locator("//p[contains(., 'successfully')]//b").textContent();
      expect(Number(numberOrderCaptured)).toEqual(listOrderName.length);
    });
  });

  test("Kiểm tra capture order thanh toán qua cổng đã bị deactive thành công @TC_SB_SET_PMS_MC_199", async ({}) => {
    await test.step("Tại Storefront: Thực hiện checkout 1 order qua Stripe", async () => {
      await checkout.completeOrderWithMethod();
      orderId = await checkout.getOrderIdBySDK();
      totalOrder = await checkout.getTotalOnOrderSummary();
    });

    await test.step("Tại Dashboard: Deactive cổng Stripe", async () => {
      await dashboardAPI.activePaymentMethod(shopId, paymentId, false);
    });

    await test.step("Tại Order details: Capture order vừa tạo sau khi deactive cổng Stripe", async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const actualPaymentStatus = await orderPage.getOrderStatus();
      expect(actualPaymentStatus).toEqual("Authorized");
      const captureAmount = removeCurrencySymbol(totalOrder);
      await orderPage.captureOrder(captureAmount);
      const paidByCustomer = await orderPage.getPaidByCustomer();
      expect(removeCurrencySymbol(paidByCustomer)).toEqual(removeCurrencySymbol(totalOrder));
    });
  });
});
