import { expect, test } from "@fixtures/website_builder";
import { SFHome } from "@pages/storefront/homepage";
import { Order, OrderAfterCheckoutInfo, OrderSummary, Product, ShippingAddress } from "@types";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { OrderAPI } from "@pages/api/order";
import { MailBox } from "@pages/thirdparty/mailbox";

let domain: string;
let productCheckout: Product[];
let homePage: SFHome;
let checkoutPage: SFCheckout;
let orderPage: OrdersPage;
let orderAPI: OrderAPI;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let orderSummaryBeforeCompleteOrd: OrderSummary;
let orderInfoInOrderPage: Order;
let mailBox: MailBox;
let shippingAddress: ShippingAddress,
  discountCode: string,
  total: number,
  retry: number,
  paymentIntendID: string,
  secretKey: string,
  gatewayCode: string,
  i: number;

// verify data Order summary in order detail
const verifyInfoInOrderPage = (actOrderInfo: Order, orderInfoInThankyouPage: OrderAfterCheckoutInfo) => {
  expect(actOrderInfo.discount).toEqual(orderInfoInThankyouPage.discountValue);
  expect(actOrderInfo.tax_amount).toEqual(orderInfoInThankyouPage.taxValue);
  expect(actOrderInfo.shipping_fee).toEqual(orderInfoInThankyouPage.shippingSF);
  expect(actOrderInfo.tip).toEqual(orderInfoInThankyouPage.tippingValue);
  expect(actOrderInfo.subtotal).toEqual(orderInfoInThankyouPage.subTotal);
  expect(actOrderInfo.total).toEqual(orderInfoInThankyouPage.totalSF);
};

// verify data Order summary in Checkout page
const verifyInfoInCOPage = (actOrderInfo: OrderSummary, expectOrder) => {
  expect(actOrderInfo.discountValue).toEqual(expectOrder.discount_value);
  expect(actOrderInfo.taxes).toEqual(expectOrder.tax);
  expect(actOrderInfo.shippingValue).toEqual(expectOrder.shipping);
  expect(actOrderInfo.tippingVal).toEqual(expectOrder.tip);
  expect(actOrderInfo.subTotal).toEqual(expectOrder.subTotal);
  expect(actOrderInfo.totalPrice).toEqual(expectOrder.total);
};

// verify data Order summary in Thankyou page
const verifyInfoInThankyouPage = (actOrderInfo: OrderAfterCheckoutInfo, expectOrder) => {
  expect(actOrderInfo.discountValue).toEqual(expectOrder.discount_value);
  expect(actOrderInfo.taxValue).toEqual(expectOrder.tax);
  expect(actOrderInfo.shippingSF).toEqual(expectOrder.shipping);
  expect(actOrderInfo.tippingValue).toEqual(expectOrder.tip);
  expect(actOrderInfo.subTotal).toEqual(expectOrder.subTotal);
  expect(actOrderInfo.totalSF).toEqual(expectOrder.total);
};

test.describe("Verify SF checkout with multiple discount", async () => {
  test.beforeEach(async ({ conf, authRequest, page, dashboard }) => {
    domain = conf.suiteConf.domain;
    productCheckout = conf.suiteConf.products_checkout;
    shippingAddress = conf.suiteConf.shipping_address;
    retry = conf.suiteConf.retry;
    homePage = new SFHome(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    checkoutPage = new SFCheckout(page, domain);
    orderAPI = new OrderAPI(domain, authRequest);
    secretKey = conf.suiteConf.secret_key;
    gatewayCode = conf.suiteConf.gateway_code;
    discountCode = conf.caseConf.discount_code;
  });

  const casesID = "SB_COPAGE_APLLY_DISCOUNT";
  const conf = loadData(__filename, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      products_checkout: productCheckout,
      discount_code: discountCodes,
      // expectOrder: expect_order
    }) => {
      test(`@${caseID} ${caseName}`, async ({}) => {
        await test.step(`Pre conditions`, async () => {
          //
        });

        await test.step(`Lên storefront của shop
        - Add product vào cart
        - Đi đến checkout page
        - Checkout đến United states
        - Nhập đủ discount code`, async () => {
          await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
          await checkoutPage.applyDiscountCode(discountCodes[0]);
          // verify discount code
        });

        await test.step(`-Lần lượt apply các discount `, async () => {
          for (i = 1; i < discountCodes.length; i++) {
            await checkoutPage.applyDiscountCode(discountCodes[i]);

            // verify message invalid
          }
        });
      });
    },
  );

  test(`@SB_DC_MD_SB_40 Apply các discount Buy x get y không thỏa mãn vào order`, async ({}) => {
    await test.step(`Lên storefront của shop
    - Add product vào cart
    - Đi đến checkout page
    - Nhập email: minhthai@mailtothis.com
    - Nhập đủ discount code`, async () => {
      await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
      await checkoutPage.applyDiscountCode(discountCode[0]);
      // verify discount code
    });

    await test.step(`Lần lượt apply các discount `, async () => {
      await checkoutPage.applyDiscountCode(discountCode[1]);
      // verify message
    });

    await test.step(`Thực hiện complete checkout sau đó tạo lại checkout mới
    - Tại link checkout mới nhập discount`, async () => {
      await checkoutPage.completeOrderWithMethod();
      await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
      await checkoutPage.applyDiscountCode(discountCode[0]);
      // verify discount code
    });

    await test.step(`Lần lượt apply các discount `, async () => {
      await checkoutPage.applyDiscountCode(discountCode[2]);
      // verify message
    });
  });

  test(`@SB_DC_MD_SB_44 Checkout multiple discount với global market`, async ({}) => {
    const expectOrder = conf.caseConf.expect_order;
    await test.step(`Pre conditions`, async () => {
      //setting global market EU
      await homePage.gotoHomePage();
      const country = conf.caseConf.country;
      await homePage.selectStorefrontCurrencyNE(country.currency, country.country_name);
    });

    await test.step(`Lên storefront của shop
    - Add product vào cart
    - Đi đến checkout page
    - Tại Bock discount > Nhập discount code
    - Tại order summary: Kiểm tra data`, async () => {
      await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
      for (i = 0; i < discountCode.length; i++) {
        await checkoutPage.applyDiscountCode(discountCode[i]);
      }

      // get data Order summary in checkout page
      orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();

      // verify order in checkout page
      verifyInfoInCOPage(orderSummaryBeforeCompleteOrd, expectOrder);
    });

    await test.step(`Complete order với Payment method`, async () => {
      await checkoutPage.completeOrderWithMethod();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible();
    });

    await test.step(`Kiểm tra order summary`, async () => {
      // get data Order summary in thankyou page
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

      // verify data Order summary in thankyou page
      verifyInfoInThankyouPage(orderSummaryInfo, expectOrder);
    });

    await test.step(`Tại Dashboard
    - Vào Order detail của order đã tạo
    - Kiểm tra order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture("", retry);

      // verify order status
      const orderStatus = orderPage.getOrderStatus();
      expect(orderStatus).toEqual("Paid");

      // get data in order detail
      orderInfoInOrderPage = await orderPage.getOrderSummaryShopBaseInOrderDetail();

      //verify info in order page
      verifyInfoInOrderPage(orderInfoInOrderPage, orderSummaryInfo);
    });

    await test.step(`Tại order detail của order > Lấy ra transaction ID
    - Mở F12 > Network
    - Search API: transaction.json > vào phần payload của API > Tìm đến mục Authorization : Lấy ra Transaction ID
    Lên Stripe sanbox dashboard của MC
    - Search transactions theo các transaction_ids và verify`, async () => {
      await orderAPI.getTransactionId(orderSummaryInfo.orderId);
      paymentIntendID = orderAPI.paymentIntendId;
      const connectedAcc = await orderAPI.getConnectedAccInOrder(orderSummaryInfo.orderId);
      const orderInfo = await orderAPI.getOrdInfoInStripe({
        key: secretKey,
        gatewayCode: gatewayCode,
        connectedAcc: connectedAcc,
        paymentIntendId: paymentIntendID,
        isDisputed: true,
      });

      // verify status order in dashboard Stripe
      const statusOrder = orderInfo.orderStatus;
      expect(statusOrder).toEqual("success");

      //verify amount order in dashboard Stripe
      const amountOrder = orderInfo.ordAmount;
      expect(amountOrder).toEqual(total);
    });
  });

  test(`@SB_DC_MD_SB_30 Apply multi discount qua luồng shareable link`, async ({}) => {
    const expectOrder = conf.caseConf.expect_order;

    await test.step(`Lên storefront của shop bằng link shareable
    - Add product vào cart
    - Đi đến checkout page
    - Nhập đủ discount code`, async () => {
      await homePage.page.goto(conf.caseConf.shareable_link);
      await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
      for (i = 0; i < discountCode.length; i++) {
        await checkoutPage.applyDiscountCode(discountCode[i]);
      }

      // get data Order summary in checkout page
      orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();

      // verify order in checkout page
      verifyInfoInCOPage(orderSummaryBeforeCompleteOrd, expectOrder);
    });

    await test.step(`Tại Block discount
    - Nhập discount`, async () => {
      await checkoutPage.applyDiscountCode(discountCode[1]);
      // verify error message
    });

    await test.step(`Complete order với Payment method`, async () => {
      await checkoutPage.completeOrderWithMethod();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible();

      // get data Order summary in thankyou page
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

      // verify data Order summary in thankyou page
      verifyInfoInThankyouPage(orderSummaryInfo, expectOrder);
    });
  });

  test(`@SB_DC_MD_SB_29 Kiểm tra apply discount làm total order về 0`, async ({}) => {
    const expectOrder = conf.caseConf.expect_order;
    await test.step(`
    Lên storefront của shop
    - Add product vào cart
    - Đi đến checkout page
    - Tại Bock discount > Nhập discount code
    - Tại order summary: Kiểm tra data
  `, async () => {
      await homePage.gotoHomePage();
      await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
      for (i = 0; i < discountCode.length; i++) {
        await checkoutPage.applyDiscountCode(discountCode[i]);
      }
      // get data Order summary in checkout page
      orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();

      // verify order in checkout page
      verifyInfoInCOPage(orderSummaryBeforeCompleteOrd, expectOrder);
    });

    await test.step(`
    Complete order với Payment method
    `, async () => {
      await checkoutPage.completeOrderWithMethod();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible();

      // get data Order summary in thankyou page
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();

      // verify data Order summary in thankyou page
      verifyInfoInThankyouPage(orderSummaryInfo, expectOrder);
    });

    await test.step(`Tại Dashboard- Vào Order detail của order đã tạo- Kiểm tra order detail`, async () => {
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture("", retry);

      // verify order status
      const orderStatus = orderPage.getOrderStatus();
      expect(orderStatus).toEqual("Paid");

      // get data in order detail
      orderInfoInOrderPage = await orderPage.getOrderSummaryShopBaseInOrderDetail();

      //verify info in order page
      verifyInfoInOrderPage(orderInfoInOrderPage, orderSummaryInfo);
    });

    await test.step(`Vào hộp thư của emall acc buyer- KIểm tra gửi email order confirmation `, async () => {
      const emailTitle = mailBox.emailSubject(orderSummaryInfo.orderName).orderConfirm;
      await mailBox.openMailDetailWithAPI("tester0CG@maildrop.cc", emailTitle);

      // verify total order
      // const actualTotalOrder = parseFloat(removeCurrencySymbol(await mailBox.getTotalOrder()));
    });
  });

  test(`@SB_DC_MD_SB_28 Kiểm tra apply các discount A , C, và D trong đó discount A, C và D đều cùng combine đến discount B nhưng discount A, C và D không combine với nhau`, async ({}) => {
    await test.step(`Lên storefront của shop
    - Add product vào cart
    - Đi đến checkout page
    - Nhập đủ discount code`, async () => {
      await homePage.gotoHomePage();
      await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
      await checkoutPage.applyDiscountCode(discountCode[0]);
      await checkoutPage.applyDiscountCode(discountCode[3]);
      // verify discount code apply successful
    });

    await test.step(`- Tại Block discount > Nhập discount mới`, async () => {
      await checkoutPage.applyDiscountCode(discountCode[1]);
      // verify error message
    });

    await test.step(`- Remove discount cũ
    - Tại Block discount > Nhập discount mới`, async () => {
      checkoutPage.getRemoveDiscountIcon(discountCode[0]);
      await checkoutPage.applyDiscountCode(discountCode[1]);
      // verify discount code apply successful
    });

    await test.step(`- Tại Block discount > Nhập discount mới`, async () => {
      await checkoutPage.applyDiscountCode(discountCode[2]);
      // verify error message
    });

    await test.step(`- Remove discount cũ
    - Tại Block discount > Nhập discount mới`, async () => {
      checkoutPage.getRemoveDiscountIcon(discountCode[1]);
      await checkoutPage.applyDiscountCode(discountCode[2]);
      // verify discount code apply successful
    });
  });

  test(`@SB_DC_MD_SB_27 Kiểm tra apply các discount A , C, và D trong đó discount A, C và D đều cùng combine đến discount B nhưng discount A, C và D không combine với nhau (Discount A là discount automatic) ( Need PM confirm )`, async ({}) => {
    await test.step(`Lên storefront của shop
    - Add product vào cart
    - Đi đến checkout page
    - Nhập đủ discount code`, async () => {
      await homePage.gotoHomePage();
      await checkoutPage.addProductToCartThenInputShippingAddress(productCheckout, shippingAddress);
      await checkoutPage.applyDiscountCode(discountCode[2]);
      // verify discount code apply successful
    });

    await test.step(`- Tại Block discount > Nhập discount mới`, async () => {
      await checkoutPage.applyDiscountCode(discountCode[0]);
      // verify error message
    });

    await test.step(`- Tại Block discount > Nhập discount mới`, async () => {
      await checkoutPage.applyDiscountCode(discountCode[1]);
      // verify error message
    });
  });
});
