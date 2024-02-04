import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { SFCheckout } from "@pages/storefront/checkout";
import type { Card, OrderAfterCheckoutInfo, OrderSummary, Product } from "@types";

const getShippingInfoByCountry = (country: string) => {
  switch (country) {
    case "US":
      return {
        emailBuyer: `tester${Math.floor(Date.now() / 1000)}@maildrop.cc`,
        shippingAddress: {
          address1: "10800 W Pico Blvd Suite 312",
          address2: "OCG",
          city: "Los Angeles",
          company: "OCG",
          country_code: "US",
          first_name: "Tester",
          last_name: Date.now().toString(),
          phone: "2064646354",
          province: "California",
          province_code: "CA",
          zip: "90401",
        },
      };
    case "DE":
      return {
        emailBuyer: `tester${Math.floor(Date.now() / 1000)}@maildrop.cc`,
        shippingAddress: {
          address1: "10800 W Pico Blvd Suite 312",
          address2: "OCG",
          city: "Los Angeles",
          company: "OCG",
          country_code: "DE",
          first_name: "Tester",
          last_name: Date.now().toString(),
          phone: "2064646354",
          zip: "90401",
        },
      };
    case "BE":
      return {
        emailBuyer: `tester${Math.floor(Date.now() / 1000)}@maildrop.cc`,
        shippingAddress: {
          address1: "10800 W Pico Blvd Suite 312",
          address2: "OCG",
          city: "Los Angeles",
          company: "OCG",
          country_code: "BE",
          first_name: "Tester",
          last_name: Date.now().toString(),
          phone: "2064646354",
          zip: "90401",
        },
      };
    case "VN":
      return {
        emailBuyer: `tester${Math.floor(Date.now() / 1000)}@maildrop.cc`,
        shippingAddress: {
          address1: "10800 W Pico Blvd Suite 312",
          address2: "OCG",
          city: "Los Angeles",
          company: "OCG",
          country_code: "VN",
          first_name: "Tester",
          last_name: Date.now().toString(),
          phone: "2064646354",
          zip: "90401",
        },
      };
  }
};
test.describe("Checkout fail Payoneer", () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let domain: string;
  let orderSummaryBeforeCompleteOrd: OrderSummary;

  const casesID = "CHECKOUT_FAIL_PAYONEER";
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      card_info: cardInfo,
      card_info_success: cardInfoSuccess,
      products_checkout: productCheckout,
      country: country,
      error_message: errorMessage,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, conf }) => {
        domain = conf.suiteConf.domain;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);

        await test.step(`
        Tại Store-front:
          + Buyer add product (có hỗ trợ PPC) to cart và đi đến trang checkout
          + Buyer nhập thông tin shipping, chọn shipping method và đi đến trang payment method
          + Tại block Payment: chọn Credit card Payoneer
          + Click "Complete order"/'Place your order'`, async () => {
          const { emailBuyer, shippingAddress } = getShippingInfoByCountry(country);

          await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, emailBuyer, shippingAddress);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();

          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();

          await checkoutPage.selectPaymentMethod("Payoneer");
          await checkoutPage.clickBtnCompleteOrder();
          const actTotalAmt = await checkoutPage.getTotalAmtOnPayWithPayoneerPage();
          expect(Number(actTotalAmt)).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
        });

        await test.step(`
        - Tại trang thanh toán của cổng Payoneer
          + Buyer nhập card checkout với thẻ 3Ds (require 3Ds)
          + Click button "Pay" và confirm 3Ds `, async () => {
          await checkoutPage.enterPayoneerCardInfo(cardInfo);

          // Expected: - Thanh toán không thành công, hiện message lỗi
          await expect(checkoutPage.getXpathErrorMessage(errorMessage)).toBeVisible();
        });

        if (caseId === "SB_CHE_POE_11" || caseId === "SB_CHE_POE_12") {
          await test.step(`Buyer nhập lại card hợp lệ`, async () => {
            await checkoutPage.enterPayoneerCardInfo(cardInfoSuccess);

            // Expected: - Thanh toán thành công, hiển thị trang thankyou
            await expect(checkoutPage.thankyouPageLoc).toBeVisible();
          });
        }
      });
    },
  );
});

test.describe("Checkout fail Payoneer with PPC", () => {
  let domain: string;
  let cardInfo: Card;
  let country: string;
  let cardInfoFail3ds: Card;
  let productCheckout: Product[];
  let productPostPurchase: string;
  let orderSummaryInfo: OrderAfterCheckoutInfo;

  let checkoutPage: SFCheckout;
  let orderPage: OrdersPage;
  test.beforeEach(async ({ page, conf, request }) => {
    domain = conf.suiteConf.domain;
    country = conf.caseConf.country;
    cardInfo = conf.caseConf.card_info;
    productCheckout = conf.caseConf.products_checkout;
    cardInfoFail3ds = conf.caseConf.card_info_fail_3ds;
    productPostPurchase = conf.caseConf.products_post_purchase;

    const checkoutAPI = new CheckoutAPI(domain, request, page);
    checkoutPage = new SFCheckout(page, domain);

    await test.step(`Pre-condition`, async () => {
      const { emailBuyer, shippingAddress } = getShippingInfoByCountry(country);

      await checkoutAPI.addProductThenSelectShippingMethodWithNE(productCheckout, emailBuyer, shippingAddress);
      checkoutPage = await checkoutAPI.openCheckoutPageByToken();

      await checkoutPage.clickBtnCompleteOrder();
      await checkoutPage.completeOrderViaPayoneer(cardInfo);

      await checkoutPage.addProductPostPurchase(productPostPurchase);
    });
  });
  test(`@SB_CHE_POE_14 [Checkout Failed] Add item Post-Purchase (PPC) không thành công khi cancel payment`, async () => {
    await test.step(`
      - Tại trang thanh toán cổng Payoneer:   
        + Buyer nhập thông tin thanh toán  
        + Click button Pay `, async () => {
      await checkoutPage.completeOrderViaPayoneer(cardInfo);

      // Expected: - Thanh toán không thành công, hiện message lỗi
      await expect(checkoutPage.getLocatorProdNameInOrderSummary(productPostPurchase)).toBeHidden();
    });
  });

  test(`@SB_CHE_POE_15 [Checkout Failed] Add item Post-Purchase (PPC) không thành công khi confirm 3Dsecure fail`, async ({
    dashboard,
  }) => {
    await test.step(`
      - Tại trang thanh toán cổng Payoneer:   
        + Buyer nhập thông tin thanh toán  
        + Click button Pay `, async () => {
      await checkoutPage.enterPayoneerCardInfo(cardInfoFail3ds);

      // Expected: - Thanh toán không thành công, hiện message lỗi
      await expect(checkoutPage.getXpathErrorMessage("Your payment failed")).toBeVisible();
    });

    await test.step(`Buyer nhập lại thông tin thanh toán hợp lệ`, async () => {
      await checkoutPage.enterPayoneerCardInfo(cardInfo);
      await checkoutPage.clickBtnOKIn3dsPayoneerPopup();

      // Expected: - Thanh toán thành công, hiển thị trang thankyou
      await expect(checkoutPage.thankyouPageLoc).toBeVisible();

      // Expected: - Thanh toán thành công, hiển thị item post-purchase tại order summary
      await expect(checkoutPage.getLocatorProdNameInOrderSummary(productPostPurchase)).toBeVisible();
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
    });

    await test.step(`
      - Tại Order details:   
        + Truy vào order details bằng order name`, async () => {
      orderPage = new OrdersPage(dashboard, domain);
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
      await orderPage.reloadUntilOrdCapture();
      const actTotalAmt = await orderPage.getPaidByCustomer();
      expect(Number(removeCurrencySymbol(actTotalAmt))).toBe(orderSummaryInfo.totalSF);
    });
  });
});
