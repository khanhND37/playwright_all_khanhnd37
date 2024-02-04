import { test } from "@fixtures/odoo";
import { expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DashboardAPI } from "@pages/api/dashboard";
import { currencyToNumber, removeCurrencySymbol } from "@core/utils/string";
import { loadData } from "@core/conf/conf";
import type { RefundOrderInput } from "@types";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { isEqual } from "@core/utils/checkout";

test.describe("Verify refund/ cancel order @SB_PLB_PODPL_PODPO_37", async () => {
  const conf = loadData(__dirname, "DATA_DRIVEN");
  let plbTemplateDashboardPage: DashboardPage;
  let shopDomain: string, shopTmplDomain: string;
  let plbOrder: PlusbaseOrderAPI;

  test.beforeAll(async ({ conf, browser, authRequest }) => {
    const ctx = await browser.newContext();
    const tmplPage = await ctx.newPage();
    shopDomain = conf.suiteConf.domain;
    shopTmplDomain = conf.suiteConf.plb_template.domain;
    plbTemplateDashboardPage = new DashboardPage(tmplPage, shopTmplDomain);
    plbOrder = new PlusbaseOrderAPI(shopDomain, authRequest);
    test.setTimeout(conf.suiteConf.time_out);
  });
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      products: products,
      description: description,
      refund_buyer: refundBuyer,
      discount_code: discountCode,
      action_type: actionType,
      tax_include: isTaxInclude,
    }) => {
      test(`@${caseId} ${description}`, async ({ conf, page, dashboard, authRequest, multipleStore }) => {
        const dashboardApi = new DashboardAPI(shopDomain, authRequest);
        await dashboardApi.updateTaxSettingPbPlb({ isTaxInclude: isTaxInclude });
        let tmplOrderPage: OrdersPage;
        let orderId: number;
        let compareProfitAfterRefund: number;

        await test.step("Create order", async () => {
          const checkout = new SFCheckout(page, conf.suiteConf.domain);
          const infoOrder = await checkout.createStripeOrderMultiProduct(
            conf.suiteConf.customer_info,
            discountCode,
            products,
            conf.suiteConf.card_info,
          );
          orderId = infoOrder.orderId;
          const templatePage = await multipleStore.getDashboardPage(
            conf.suiteConf.plb_template.username,
            conf.suiteConf.plb_template.password,
            conf.suiteConf.plb_template.domain,
            conf.suiteConf.plb_template.shop_id,
            conf.suiteConf.plb_template.user_id,
          );
          plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.plb_template.domain);
          tmplOrderPage = new OrdersPage(plbTemplateDashboardPage.page, conf.suiteConf.plb_template.domain);
        });
        await test.step("Vào dashboard shop template PlusBase > vào order detail > Approve order > Verify thông tin order", async () => {
          await tmplOrderPage.goToOrderStoreTemplateByOrderId(orderId);
          await tmplOrderPage.waitForProfitCalculated();
          await tmplOrderPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
          expect(await tmplOrderPage.getApproveStatus()).toEqual("Approved");
          await tmplOrderPage.clickShowCalculation();
          await tmplOrderPage.clickToShowHandlingFee();
          const subtotal = Number(removeCurrencySymbol(await tmplOrderPage.getSubtotalOrder()));
          const shippingFee = Number(removeCurrencySymbol(await tmplOrderPage.getShippingFee()));
          const discount = Number(removeCurrencySymbol(await tmplOrderPage.getDiscountVal()).replace("-", ""));
          let shippingCost = Number(removeCurrencySymbol(await tmplOrderPage.getShippingCost()));
          if (discountCode === "MIENPHISHIP") {
            shippingCost = 0;
          }
          compareProfitAfterRefund = subtotal - discount + shippingFee - shippingCost;
        });
        await test.step("More actions > Cancel order > Cancel/Refund cho seller: nhập value các field bằng {amount} available > Cancel/Refund > Verify profit order", async () => {
          const refundShippingFee = Number(removeCurrencySymbol(await tmplOrderPage.getShippingFee()));
          const recoverPaymentFee = Number(removeCurrencySymbol(await tmplOrderPage.getPaymentFee()));
          const names: string[] = [];
          let request: RefundOrderInput;
          switch (actionType) {
            case "cancel":
              await tmplOrderPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
              await tmplOrderPage.page.waitForSelector(tmplOrderPage.xpathCancelRefundCard);
              if (!refundBuyer) {
                await tmplOrderPage.clickRequestToCancelForBuyer();
              }
              //Cần wait trên dev/prodtest do auto fill data chậm, trên prodtest thi thoảng sẽ bị
              //nếu click Cancel luôn thì sẽ không đúng với data input vào
              if (process.env.ENV == "dev" || process.env.ENV == "prodtest") {
                await tmplOrderPage.page.waitForTimeout(5 * 1000);
              }
              await tmplOrderPage.clickElementWithLabel("span", "Cancel");
              expect(await tmplOrderPage.getCancelStatus()).toEqual("Cancelled");
              break;
            case "refund":
              products.forEach(product => {
                names.push(product.name);
              });

              request = {
                product_name: names,
                qty: +products[0].quantity,
                refund_buyer: {
                  enable: refundBuyer,
                  refund_shipping_fee: refundShippingFee,
                  recover_payment_fee: recoverPaymentFee,
                },
                refund_seller: {
                  enable: true,
                  recover_payment_fee: recoverPaymentFee,
                },
              };
              await tmplOrderPage.refundPlbOrderInOrderDetails(request);
              if (refundBuyer) {
                const paymentStatus = await tmplOrderPage.getPaymentStatus();
                expect(paymentStatus === "Refunded" || paymentStatus === "Partially refunded").toBeTruthy();
              }
              break;
          }

          await expect(async () => {
            await tmplOrderPage.page.reload({ waitUntil: "networkidle" });
            await tmplOrderPage.clickShowCalculation();
            expect(isEqual(currencyToNumber(await tmplOrderPage.getBaseCost(plbOrder)), 0, 0.01)).toEqual(true);
            expect(isEqual(currencyToNumber(await tmplOrderPage.getHandlingFee()), 0, 0.01)).toEqual(true);
          }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 60_000 });

          const profitActual = currencyToNumber(await tmplOrderPage.getProfit());
          if (!refundBuyer) {
            const compare = +(profitActual - compareProfitAfterRefund).toFixed(2);
            expect(compare >= -0.01 && compare <= 0.01).toEqual(true);
          } else {
            expect(isEqual(profitActual, 0, 0.01)).toEqual(true);
          }

          const reasonActual = await tmplOrderPage.getReason();
          if (actionType == "cancel") {
            expect(reasonActual).toContain("PlusBase canceled this order. Reason: Other");
          } else expect(reasonActual).toContain("PlusBase refunded this order. Reason: Other");
        });

        await test.step(`Click "View invoice" > verify tạo invoice refund vào balance`, async () => {
          const orderPage = new OrdersPage(dashboard, shopDomain);
          await orderPage.goToOrderByOrderId(orderId);
          await orderPage.clickButton("View invoice");
          const refundSellerActual = Number(
            removeCurrencySymbol(await orderPage.getAmountInvoiceDetail("Refund for seller")),
          );
          let refundBuyerActual = 0;
          if (refundBuyer) {
            refundBuyerActual = Number(
              removeCurrencySymbol(await orderPage.getAmountInvoiceDetail("refund for buyer")).replace("-", ""),
            );
          }
          const chargeOrderActual = Number(
            removeCurrencySymbol(await orderPage.getAmountInvoiceDetail("Charged from the order")),
          );
          let profitOrder = chargeOrderActual + refundSellerActual - refundBuyerActual;
          if (refundBuyer) {
            profitOrder = chargeOrderActual + refundSellerActual;
          }
          const compare = +(profitOrder - compareProfitAfterRefund).toFixed(2);
          expect(compare >= -0.01 && compare <= 0.01).toEqual(true);
        });
      });
    },
  );
});
