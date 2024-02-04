import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol, removeExtraSpace } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { HivePBase } from "@pages/hive/hivePBase";
import { SFCheckout } from "@pages/storefront/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { OrderAfterCheckoutInfo, OrderSummary, Product, ShippingAddress, ShippingAddressApi } from "@types";
import { PbCheckoutScheduleData } from "../pb-checkout";
import { SFHome } from "@pages/storefront/homepage";

let homePage: SFHome;
let checkoutPage: SFCheckout;
let checkoutAPI: CheckoutAPI;
let orderPage: OrdersPage;
let mailBox: MailBox;
let hivePbase: HivePBase;
let domain: string, hivePbDomain: string, hiveUsername: string, hivePasswd: string;
let shippingAddress: ShippingAddress;
let productCheckout: Array<Product>;
let orderSummaryInfo: OrderAfterCheckoutInfo;
let scheduleData: PbCheckoutScheduleData;

test.describe("SB_CHE_CHEPB_5 Checkout Pbase with UI", () => {
  test(`@SB_CHE_CHEPB_5 Check checkout via Printbase Stripe successfully without setting PPC`, async ({
    conf,
    page,
    dashboard,
    scheduler,
  }) => {
    domain = conf.suiteConf.domain;
    hivePbDomain = conf.suiteConf.hive_info.domain;
    hiveUsername = conf.suiteConf.hive_info.username;
    hivePasswd = conf.suiteConf.hive_info.password;

    homePage = new SFHome(page, domain);
    checkoutPage = new SFCheckout(page, domain);
    orderPage = new OrdersPage(dashboard, domain);
    hivePbase = new HivePBase(page, hivePbDomain);

    productCheckout = conf.caseConf.products_checkout;
    shippingAddress = conf.suiteConf.shipping_address;

    const expShippingAddress = removeExtraSpace(
      shippingAddress.first_name +
        " " +
        shippingAddress.last_name +
        " " +
        shippingAddress.address +
        " " +
        shippingAddress.city +
        " " +
        shippingAddress.zipcode +
        " " +
        shippingAddress.state +
        " " +
        shippingAddress.country +
        " " +
        shippingAddress.phone_number.replaceAll("\\s", ""),
    );

    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as PbCheckoutScheduleData;
    } else {
      scheduleData = {
        orderAfterCheckoutInfo: null,
        isInSchedule: false,
      };
    }

    await test.step(`Select currency`, async () => {
      await homePage.gotoHomePage();
      await homePage.selectStorefrontCurrencyV2("United States");
    });

    await test.step(`Tại SF, buyer add products checkout vào cart > đi đến trang checkout`, async () => {
      if (scheduleData.isInSchedule) {
        return;
      }
      await checkoutPage.addToCartThenNavigateToCheckout(productCheckout);
      // Expected: Show trang checkout với các sản phẩm đã chọn
      const isProductsOnOrderSummary = await checkoutPage.isProductsOnOrderSummary(productCheckout);
      expect(isProductsOnOrderSummary).toBeTruthy();
    });

    await test.step(`Nhập shipping address`, async () => {
      if (scheduleData.isInSchedule) {
        return;
      }
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      await checkoutPage.enterShippingAddress(shippingAddress);
      // update thông tin Shipping, Tax
      const taxFee = await checkoutPage.getTaxOnOrderSummary();
      const shippingFee = await checkoutPage.getShippingFeeOnOrderSummary();
      expect(taxFee).not.toBe("0");
      expect(shippingFee).not.toBe("-");
    });

    await test.step(`Chọn Shipping method > Nhập Payment method loại "Card" > Nhập thông tin cart > Click 'Place your order'`, async () => {
      if (scheduleData.isInSchedule) {
        return;
      }
      const orderSummaryBeforeCompleteOrder: OrderSummary = await checkoutPage.getOrderSummaryInfo();
      await checkoutPage.completeOrderWithMethod();
      expect(await checkoutPage.isThankyouPage()).toBeTruthy();
      // verify shipping address
      const actShippingAddress = await checkoutPage.getShippingAddressOnThkPage();
      expect(actShippingAddress).toBe(expShippingAddress);
      // verify order amount
      orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
      expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrder.subTotal);
      expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrder.totalPrice);
    });

    await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
      if (scheduleData.isInSchedule) {
        return;
      }
      mailBox = await checkoutPage.openMailBox(shippingAddress.email);
      await mailBox.openOrderConfirmationNotification(orderSummaryInfo.orderName);
      // verify total order
      const actualTotalOrder = await mailBox.getTotalOrder();
      expect(removeCurrencySymbol(actualTotalOrder)).toBe(orderSummaryInfo.totalSF.toFixed(2));
      // verify shipping address
      const xpathTextOnShippingAdrSection = await mailBox.genXpathSectionOfCustomerInfo("Shipping address");
      for (const key in shippingAddress) {
        if (key == "email" || key == "phone_number") {
          continue;
        }
        await expect(mailBox.page.locator(xpathTextOnShippingAdrSection)).toContainText(shippingAddress[key]);
      }
    });

    await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
      // use schedule in case order profit not response in 5'th time loaded
      if (scheduleData.isInSchedule) {
        orderSummaryInfo = scheduleData.orderAfterCheckoutInfo;
      }
      await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId, "pbase");
      // verify shipping address
      const actShippingAddress = await orderPage.getShippingAddressInOrder();
      expect(actShippingAddress.replace(/\s+/g, "")).toBe(expShippingAddress.replace(/\s+/g, ""));
      // verify order amount
      const actSubtotalOrder = await orderPage.getSubtotalOrder();
      const actTotalOrder = await orderPage.getTotalOrder();
      expect(removeCurrencySymbol(actSubtotalOrder)).toBe(orderSummaryInfo.subTotal.toFixed(2));
      expect(removeCurrencySymbol(actTotalOrder)).toBe(orderSummaryInfo.totalSF.toFixed(2));
      // verify profit - use schedule in case order profit not response in 5'th time loaded
      const actProfit = await orderPage.getOrderProfit();
      if (actProfit === 0 && scheduleData.isInSchedule != true) {
        scheduleData.isInSchedule = true;
        scheduleData.orderAfterCheckoutInfo = orderSummaryInfo;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 5 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();
      const expOrderFeesAndProfit = await orderPage.calculateProfitAndFeesOrderPbase();
      expect(actProfit).toBe(Number(expOrderFeesAndProfit.profit.toFixed(2)));
    });

    await test.step(`- Admin approved order trên hive: Tại link admin, thực hiện approved order thành công.- Merchant kiểm tra order details trong dashboard.`, async () => {
      if (scheduleData.isInSchedule) {
        return;
      }
      await hivePbase.loginToHivePrintBase(hiveUsername, hivePasswd);
      await hivePbase.goToOrderDetail(orderSummaryInfo.orderId);
      await hivePbase.approveOrder();
      // verify order on dashboard
      await orderPage.page.reload();
      const paidByCustomer = await orderPage.getPaidByCustomer();
      const orderStatus = await orderPage.getOrderStatus();

      expect(orderStatus).toEqual("Paid");
      expect(removeCurrencySymbol(paidByCustomer)).toBe(orderSummaryInfo.totalSF.toFixed(2));
    });
  });
});

test.describe("SB_CHE_CHEPB_1,3,4,6,7 Checkout Pbase with API", () => {
  const casesID = "GOTO_CO_W_API";
  const conf = loadData(__dirname, casesID);

  // for each data, will do tests
  conf.caseConf.forEach(
    ({ case_id: caseID, case_name: caseName, products_checkout: productCheckout, product_ppc: productPpc }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest, page, dashboard, scheduler }) => {
        domain = conf.suiteConf.domain;
        hivePbDomain = conf.suiteConf.hive_info.domain;
        hiveUsername = conf.suiteConf.hive_info.username;
        hivePasswd = conf.suiteConf.hive_info.password;

        homePage = new SFHome(page, domain);
        checkoutPage = new SFCheckout(page, domain);
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        orderPage = new OrdersPage(dashboard, domain);
        hivePbase = new HivePBase(page, hivePbDomain);

        let customerInfo: {
          emailBuyer: string;
          shippingAddress: ShippingAddressApi;
        };
        let orderSummaryBeforeCompleteOrd: OrderSummary;

        const rawDataJson = await scheduler.getData();
        if (rawDataJson) {
          scheduleData = rawDataJson as PbCheckoutScheduleData;
        } else {
          scheduleData = {
            orderAfterCheckoutInfo: null,
            isInSchedule: false,
          };
        }
        await test.step(`Select currency`, async () => {
          await homePage.gotoHomePage();
          await homePage.selectStorefrontCurrencyV2("United States");
        });

        await test.step(`Tại SF, buyer thực hiện add cart và Place order thành công với Products checkout.`, async () => {
          if (scheduleData.isInSchedule) {
            return;
          }
          customerInfo = await checkoutAPI.addProductThenSelectShippingMethod(productCheckout);
          checkoutPage = await checkoutAPI.openCheckoutPageByToken();
          await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          await checkoutPage.completeOrderWithMethod();
          // verrify show ppc
          const isShowPPC = await checkoutPage.isPostPurchaseDisplayed();
          if (caseID == "SB_CHE_CHEPB_1") {
            expect(isShowPPC).toBeFalsy();
            orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
            expect(orderSummaryInfo.subTotal).toBe(orderSummaryBeforeCompleteOrd.subTotal);
            expect(orderSummaryInfo.totalSF).toBe(orderSummaryBeforeCompleteOrd.totalPrice);
          } else {
            expect(isShowPPC).toBeTruthy();
          }
        });

        if (productPpc) {
          await test.step(`Add Product PPC`, async () => {
            if (scheduleData.isInSchedule) {
              return;
            }
            let ppcValue = await checkoutPage.addProductPostPurchase(productPpc.name);
            if (!ppcValue) {
              ppcValue = "0";
            } else {
              productCheckout.push(productPpc);
            }
            expect(await checkoutPage.isThankyouPage()).toBeTruthy();
            // verify order list
            const isProductsOnOrderSummary = await checkoutPage.isProductsOnOrderSummary(productCheckout);
            expect(isProductsOnOrderSummary).toBeTruthy();
            // verify order amount
            orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
            expect(orderSummaryInfo.subTotal.toFixed(2)).toBe(
              (orderSummaryBeforeCompleteOrd.subTotal + parseFloat(ppcValue)).toFixed(2),
            );
          });
        }

        await test.step(`Kiểm tra buyer nhận được email confirm`, async () => {
          if (scheduleData.isInSchedule) {
            return;
          }
          mailBox = await checkoutPage.openMailBox(customerInfo.emailBuyer);
          await mailBox.openOrderConfirmationNotification(orderSummaryInfo.orderName);
          // verify total order
          const actualTotalOrder = await mailBox.getTotalOrder();
          expect(removeCurrencySymbol(actualTotalOrder)).toBe(orderSummaryInfo.totalSF.toFixed(2));
        });

        await test.step(`Merchant kiểm tra order details trong dashboard`, async () => {
          // use schedule in case order profit not response in 5'th time loaded
          if (scheduleData.isInSchedule) {
            orderSummaryInfo = scheduleData.orderAfterCheckoutInfo;
          }
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId, "pbase");
          // verify order amount
          const actTotalOrder = await orderPage.getTotalOrder();
          expect(removeCurrencySymbol(actTotalOrder)).toBe(orderSummaryInfo.totalSF.toFixed(2));
          // verify profit - use schedule in case order profit not response in 5'th time loaded
          const actProfit = await orderPage.getOrderProfit();
          if (actProfit === 0 && scheduleData.isInSchedule != true) {
            scheduleData.isInSchedule = true;
            scheduleData.orderAfterCheckoutInfo = orderSummaryInfo;
            await scheduler.setData(scheduleData);
            await scheduler.schedule({ mode: "later", minutes: 5 });
            // eslint-disable-next-line playwright/no-skipped-test
            test.skip();
            return;
          }
          await scheduler.clear();
          const expOrderFeesAndProfit = await orderPage.calculateProfitAndFeesOrderPbase();
          expect(actProfit).toBe(Number(expOrderFeesAndProfit.profit.toFixed(2)));
        });

        await test.step(`- Admin approved order trên hive: Tại link admin, thực hiện approved order thành công.- Merchant kiểm tra order details trong dashboard.`, async () => {
          if (scheduleData.isInSchedule) {
            return;
          }
          await hivePbase.loginToHivePrintBase(hiveUsername, hivePasswd);
          await hivePbase.goToOrderDetail(orderSummaryInfo.orderId);
          await hivePbase.approveOrder();
          // verify order on dashboard
          await orderPage.page.reload();
          const paidByCustomer = await orderPage.getPaidByCustomer();
          const orderStatus = await orderPage.getOrderStatus();

          expect(orderStatus).toEqual("Paid");
          expect(removeCurrencySymbol(paidByCustomer)).toEqual(orderSummaryInfo.totalSF.toFixed(2));
        });
      });
    },
  );
});
