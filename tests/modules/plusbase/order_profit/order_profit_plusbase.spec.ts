import { expect, test } from "@core/fixtures";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { loadData } from "@core/conf/conf";
import { DashboardAPI } from "@pages/api/dashboard";
import { isEqual } from "@core/utils/checkout";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";

test.describe("Calculate order profit Plusbase @SB_PLB_PRO", async () => {
  const caseName = "SB_PLB_PRO";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      product: product,
      quantity: quantity,
      isDiscount: isDiscount,
      isTax: isTax,
      tax_include: taxInclude,
      isTip: isTip,
      discount_code: code,
      isPostPurchase: isPostPurchase,
      postPurchaseItem: postPurchaseItem,
      isDiscountPPC: isDiscountPPC,
    }) => {
      test(`@${caseId} ${caseDescription}`, async ({ conf, dashboard, authRequest, multipleStore }) => {
        test.setTimeout(conf.suiteConf.timeout);

        let productPage: SFProduct;
        let checkout: SFCheckout;
        let orderId: number;

        const domain = conf.suiteConf.domain;
        const paymentFeePercent = conf.suiteConf.paymentFeePercent;
        const processingFeePercent = conf.suiteConf.processingFeePercent;
        const customerInfo = conf.suiteConf.customer_info;
        const cardInfor = conf.suiteConf.card_infor;
        const dashboardAPI = new DashboardAPI(domain, authRequest);
        const ordersPage = new OrdersPage(dashboard, domain);

        // Setting tax calculation
        await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: taxInclude });

        await test.step("buyer add product to cart then go to checkout page", async () => {
          const homepage = new SFHome(dashboard, domain);
          await homepage.gotoHomePage();
          await homepage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
          productPage = await homepage.searchThenViewProduct(product);
          await productPage.inputQuantityProduct(quantity);
          await productPage.addProductToCart();
          checkout = await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(customerInfo);
        });

        await test.step("complete order then get order summary", async () => {
          await checkout.continueToPaymentMethod();
          await checkout.setShippingFee();
          if (isDiscount) {
            await checkout.applyDiscountCode(code);
          }
          await checkout.completeOrderWithCardInfo(cardInfor);
          if (isPostPurchase) {
            await checkout.addProductPostPurchase(postPurchaseItem);
            await checkout.completePaymentForPostPurchaseItem("Stripe");
          } else {
            await checkout.addProductPostPurchase(null);
          }
          await checkout.getOrderSummary(isTip, isDiscount, isPostPurchase);
          orderId = await checkout.getOrderIdBySDK();
        });

        await test.step("Vào shop plusbase > orders > verify profit of order", async () => {
          await ordersPage.goToOrderByOrderId(orderId);
          await ordersPage.waitForProfitCalculated();
          await ordersPage.clickShowCalculation();

          const newAuthRequest = await multipleStore.getAuthRequest(
            conf.suiteConf.username,
            conf.suiteConf.password,
            domain,
            conf.suiteConf.shop_id,
            conf.suiteConf.user_id,
          );
          const plbOrder = new PlusbaseOrderAPI(domain, newAuthRequest);

          const baseCost = Number(removeCurrencySymbol(await ordersPage.getBaseCost(plbOrder)));
          const shippingFee = Number(removeCurrencySymbol(await ordersPage.getShippingFee()));
          const subtotal = Number(removeCurrencySymbol(await ordersPage.getSubtotalOrder()));
          let totalDiscount;
          if (isDiscount) {
            totalDiscount = Number(removeCurrencySymbol((await ordersPage.getDiscountVal()).replace("-", "")));
          }
          const shippingCost = Number(removeCurrencySymbol(await ordersPage.getShippingCost()));
          let taxInclude = 0;
          if (isTax) {
            const tax = Number(removeCurrencySymbol(await ordersPage.getTax()));
            const taxDesciption = await ordersPage.getTaxDesciption();
            if (taxDesciption.includes("include")) {
              taxInclude = tax;
            }
          }
          if (isDiscountPPC) {
            ordersPage.calculateProfitPlusbase(
              checkout.total,
              subtotal,
              totalDiscount,
              baseCost,
              shippingCost,
              shippingFee,
              taxInclude,
              checkout.tip,
              paymentFeePercent,
              processingFeePercent,
            );
          } else {
            ordersPage.calculateProfitPlusbase(
              checkout.total,
              checkout.subtotal,
              checkout.discount,
              baseCost,
              shippingCost,
              checkout.shipping,
              taxInclude,
              checkout.tip,
              paymentFeePercent,
              processingFeePercent,
            );
          }

          expect(
            isEqual(Number(removeCurrencySymbol(await ordersPage.getRevenue())), ordersPage.revenue, 0.01),
          ).toEqual(true);

          expect(
            isEqual(Number(removeCurrencySymbol(await ordersPage.getHandlingFee())), ordersPage.handlingFee, 0.01),
          ).toEqual(true);

          expect(isEqual(Number(removeCurrencySymbol(await ordersPage.getProfit())), ordersPage.profit, 0.01)).toEqual(
            true,
          );
        });

        await test.step("Vào shop template order plusbase approve order > Verify profit, paid buy customer trong shop plusbase", async () => {
          const authRequestTpl = await multipleStore.getAuthRequest(
            conf.suiteConf.plb_template.username,
            conf.suiteConf.plb_template.password,
            conf.suiteConf.plb_template.domain,
            conf.suiteConf.plb_template.shop_id,
            conf.suiteConf.plb_template.user_id,
          );

          const tplOrderAPI = new PlusbaseOrderAPI(conf.suiteConf.plb_template.domain, authRequestTpl);
          await tplOrderAPI.approveOrderByApi(orderId);

          // Verify status, profit, paid buy customer of order
          await ordersPage.page.reload();
          await ordersPage.clickShowCalculation();
          expect(await ordersPage.getOrderStatus()).toEqual("Paid");
          expect(
            isEqual(Number(removeCurrencySymbol(await ordersPage.getRevenue())), ordersPage.revenue, 0.01),
          ).toEqual(true);

          expect(
            isEqual(Number(removeCurrencySymbol(await ordersPage.getHandlingFee())), ordersPage.handlingFee, 0.01),
          ).toEqual(true);

          expect(isEqual(Number(removeCurrencySymbol(await ordersPage.getProfit())), ordersPage.profit, 0.01)).toEqual(
            true,
          );
          expect(
            isEqual(Number(removeCurrencySymbol(await ordersPage.getPaidByCustomer())), checkout.total, 0.01),
          ).toEqual(true);
        });
      });
    },
  );
});
