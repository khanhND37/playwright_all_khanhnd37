/* eslint-disable prefer-const */
import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DiscountPage } from "@pages/dashboard/discounts";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import type { OrderInfo, Card, ShippingAddressApi, Product, Discount, OrderAfterCheckoutInfo } from "@types";
import { removeCurrencySymbol } from "../../../../src/core/utils/string";

test.describe("Login dashboard and setup discount", () => {
  let dashboardPage: DashboardPage;
  let discountSetting: DiscountPage;
  let discount: Array<Discount>;
  let checkoutAPI: CheckoutAPI;
  let product: Array<Product>;
  let product1: Array<Product>;
  let email: string;
  let shipAdd: ShippingAddressApi;
  let checkoutPage: SFCheckout;
  let cardInfo: Card;
  let checkoutInfo: OrderAfterCheckoutInfo;
  let orderPage: OrdersPage;
  let orderSetInfo: OrderInfo;

  test.beforeEach(async ({ dashboard, conf, page, request }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    discountSetting = new DiscountPage(dashboard, conf.suiteConf.domain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, request, page);
    checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    email = conf.suiteConf.customer_info.email;
    cardInfo = conf.suiteConf.car_info;
    product = conf.suiteConf.product;
    shipAdd = conf.caseConf.shipping_address;
    discount = conf.caseConf.discount;
    product1 = conf.suiteConf.product1;

    await dashboardPage.goto("admin/discounts");
    //Delete all discount for this shop
    await discountSetting.delAllDiscount();
    await dashboardPage.navigateToSubMenu("Discounts", "Automatic");
    await discountSetting.delAllDiscount();

    //Add discount
    await discountSetting.addDiscountcode(discount);

    //Checkout with customer information and shipping address and get all info
    await checkoutAPI.addProductToCartThenCheckout(product);
    await checkoutAPI.updateCustomerInformation(email, shipAdd);
    await checkoutAPI.selectDefaultShippingMethod(shipAdd.country_code);
    await checkoutAPI.openCheckoutPageByToken();
    checkoutInfo = {
      shippingSF: await checkoutPage.getShippingFeeOnOrderSummary(),
      discountName: await checkoutPage.getDiscountCodeOnOrderSummary(),
      discountValue: await checkoutPage.getDiscountValOnOrderSummary(),
    };
  });

  test(`Check apply automatic discount free shipping với 3 page checkout (chỉ có automatic discount free shipping) @SB_DC_4`, async () => {
    await test.step(`Ngoài SF, add product to cart >Checkout => Điền thông tin checkout form=>Chọn shipping method`, async () => {
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });

    await test.step(`Click Continue to payment method->Nhập payment method > Complete order`, async () => {
      await checkoutPage.completeOrderWithCardInfo(cardInfo);
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });

    await test.step(`Vào dashboard > Check Order detail vừa tạo`, async () => {
      await orderPage.goToOrderByOrderId(checkoutInfo.orderId);
      //Verify Order detail page is displayed
      await expect(orderPage.page.locator(orderPage.orderStatus)).toBeVisible();
      orderSetInfo = await orderPage.getOrderInfoInOrderPage();

      //Verify discount information in order detail page
      expect(orderSetInfo.discountName).toEqual(discount[0].name);
      if (orderSetInfo.discountValue === "Free shipping") {
        expect(orderSetInfo.discountValue).toEqual(checkoutInfo.discountValue);
      } else {
        const numDsc = Math.abs(Number(orderSetInfo.discountValue));
        expect(numDsc).toEqual(discount[0].value);
      }
    });
  });

  test(`Check apply automatic discount free shipping với Specific countries @SB_DC_5`, async () => {
    await test.step(`Trên sf, thực hiện add product to cart => Checkout => Điền thông tin ship tại Vietnam`, async () => {
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });

    await test.step(`Chọn lại country = Canada`, async () => {
      await checkoutPage.clickChangeShipAdd();
      await checkoutPage.selectCountry("Canada");
      await checkoutPage.selectStateOrProvince("Quebec");
      await checkoutPage.clickBtnContinueToShippingMethod();
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });

    await test.step(`Chọn lại country = US`, async () => {
      await checkoutPage.clickChangeShipAdd();
      await checkoutPage.selectCountry("United States");
      await checkoutPage.selectStateOrProvince("California");
      await checkoutPage.inputZipcode("90001");
      await checkoutPage.clickBtnContinueToShippingMethod();
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });

    await test.step(`Điền thông tin vào checkout form=> Complete order`, async () => {
      await checkoutPage.clickOnBtnWithLabel("Continue to payment method");
      await checkoutPage.completeOrderWithCardInfo(cardInfo);
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });
  });

  test(`Check apply automatic discount free shipping với minimim purchase amount @SB_DC_6`, async () => {
    await test.step(`Trên sf, thực hiện add product to cart => Checkout`, async () => {
      expect(await checkoutPage.isDiscApplied()).toBeFalsy();
    });

    await test.step(`Trên sf, thực hiện add product to cart => Checkout`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(product1);
      await checkoutAPI.updateCustomerInformation(email, shipAdd);
      await checkoutAPI.selectDefaultShippingMethod(shipAdd.country_code);
      await checkoutAPI.openCheckoutPageByToken();
      expect(await checkoutPage.isDiscApplied()).toBeTruthy();
      checkoutInfo = {
        shippingSF: await checkoutPage.getShippingFeeOnOrderSummary(),
        discountName: await checkoutPage.getDiscountCodeOnOrderSummary(),
        discountValue: await checkoutPage.getDiscountValOnOrderSummary(),
      };
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });
  });

  test(`Check apply discount khi đã apply automatic discount free shipping nhập cả discount code @SB_DC_7`, async () => {
    await test.step(`Trên sf, thực hiện add product to cart => Checkout`, async () => {
      expect(checkoutInfo.discountName).toEqual("au-freeshipping");
    });

    await test.step(`Trong phần nhập discount, nhập Manual discount 1 => Click "Apply"`, async () => {
      await checkoutPage.applyDiscountCode("fix-amount-discount1");
      expect(
        await checkoutPage.isWaringMessDiscountDisplayed(
          "Only one discount can be applied for your order. We have chosen the most valuable one for you.",
        ),
      ).toBeTruthy();
      expect(checkoutInfo.discountName).toEqual("au-freeshipping");
    });

    await test.step(`Trong phần nhập discount, nhập Manual discount 3 => Click "Apply"`, async () => {
      await checkoutPage.applyDiscountCode("manual-freeshipping");
      checkoutInfo = {
        discountName: await checkoutPage.getDiscountCodeOnOrderSummary(),
      };
      expect(checkoutInfo.discountName).toEqual("manual-freeshipping");
    });

    await test.step(`Trong phần nhập discount, nhập Manual discount 2 => Click "Apply"`, async () => {
      await checkoutPage.page.click(checkoutPage.xpathDeleteDiscount);
      await checkoutPage.applyDiscountCode("fix-amount-discount2");
      checkoutInfo = {
        discountName: await checkoutPage.getDiscountCodeOnOrderSummary(),
      };
      expect(checkoutInfo.discountName).toEqual("fix-amount-discount2");
    });

    await test.step(`Điền thông tin vào checkout form=> Complete order`, async () => {
      await checkoutPage.completeOrderWithCardInfo(cardInfo);
      checkoutInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(checkoutInfo.discountName).toEqual("fix-amount-discount2");
      const numShipping = parseFloat(removeCurrencySymbol(checkoutInfo.shippingSF.toString()));
      const numDscValue = Math.abs(parseFloat(removeCurrencySymbol(checkoutInfo.discountValue.toString())));
      expect(checkoutInfo.totalSF).toEqual(checkoutInfo.subTotal + numShipping - numDscValue);
    });
  });

  test(`@SB_DC_13 Checkout with discount với type = Percentage`, async ({ conf }) => {
    await test.step(`Trên sf, thực hiện add product to cart => Checkout`, async () => {
      checkoutInfo.productPrice = await checkoutPage.getOriginalItemPrice(conf.caseConf.product2[0].name);
      expect(await checkoutPage.isDiscApplied()).toBeTruthy();
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });

    await test.step(`Add thêm sản phẩm vào cart`, async () => {
      await checkoutAPI.addProductToCartThenCheckout(conf.caseConf.product2);
      await checkoutAPI.openCheckoutPageByToken();
      checkoutInfo.productPrice = await checkoutPage.getOriginalItemPrice(conf.caseConf.product2[0].name);
      expect(await checkoutPage.isDiscApplied()).toBeTruthy();
      // Verify Discount chỉ áp dụng cho sản phẩm đầu tiên, với sản phẩm thứ 2 không được áp dụng
      await expect(checkoutPage.getXpathOriginPrice(conf.caseConf.product2[0].name)).toBeVisible();
      await expect(checkoutPage.getXpathOriginPrice(conf.caseConf.product2[1].name)).not.toBeVisible();
      verifyDiscValApplied(checkoutInfo, discount[0]);
    });
  });
});

//Verify discount name and discount value on checkout page
const verifyDiscValApplied = (checkoutInfo: OrderAfterCheckoutInfo, discount: Discount) => {
  expect(checkoutInfo.discountName).toEqual(discount.name);
  let numDscVal = 0;
  if (discount.type == "fixed_amount") {
    const strDscVal = removeCurrencySymbol(checkoutInfo.discountValue.toString());
    numDscVal = Math.abs(parseFloat(strDscVal));
    expect(numDscVal).toEqual(discount.value);
  } else if (discount.type == "percentage") {
    const strDscVal = removeCurrencySymbol(checkoutInfo.discountValue.toString());
    numDscVal = Math.abs(parseFloat(strDscVal));
    expect(numDscVal).toEqual((checkoutInfo.productPrice * discount.value) / 100);
  } else if (discount.type == "Free shipping") {
    expect(checkoutInfo.discountValue).toEqual(discount.value);
  }
};
