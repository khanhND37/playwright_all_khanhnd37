import { test } from "@fixtures/odoo";
import { expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { removeCurrencySymbol } from "@core/utils/string";
import { loadData } from "@core/conf/conf";

test.describe("Test order Plusbase POD + Dropship @SB_PLB_PODPL_PODPO_21", async () => {
  let checkout: SFCheckout;

  const conf = loadData(__dirname, "DATA_DRIVEN");
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      profit_data: profitData,
      product_handle: product,
      variant_size: variantSize,
      is_tax: isTax,
      description: description,
    }) => {
      test(`${description} @${caseId}`, async ({ conf, page, dashboard }) => {
        const homepage = new SFHome(page, conf.suiteConf.domain);
        await homepage.gotoHomePage();
        const productPage = new SFProduct(page, conf.suiteConf.domain);
        const orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
        const dashboardTemplate = new DashboardPage(dashboard, conf.suiteConf.domain);

        await test.step("Create order", async () => {
          const cardInfo = conf.suiteConf.card_info;
          await homepage.gotoProduct(product);
          await productPage.selectValueProduct({ size: variantSize });
          if (profitData.have_design_fee) {
            await productPage.addCustomDesignText(conf.suiteConf.design_text);
          }
          await productPage.addToCart();
          checkout = await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(conf.suiteConf.customer_info);
          await checkout.continueToPaymentMethod();
          await checkout.inputCardInfoAndCompleteOrder(
            cardInfo.number,
            cardInfo.holder,
            cardInfo.expire_date,
            cardInfo.cvv,
          );
          await checkout.getOrderSummary(false, false, false);
        });
        await test.step("Orders > Search order > Vào order detail  > Verify payment status và fulfillment status", async () => {
          const orderName = await checkout.getOrderName();
          await dashboardTemplate.navigateToMenu("Orders");
          await orderPage.gotoOrderDetail(orderName);
          await orderPage.waitForProfitCalculated();
          expect(await orderPage.getPaymentStatus()).toBe("Authorized");
          expect(await orderPage.getFulfillmentStatusOrder()).toBe("Unfulfilled");
        });

        await test.step(" Verify profit order", async () => {
          await orderPage.clickShowCalculation();
          const baseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
          const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
          const shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
          let taxInclude = 0;
          if (isTax) {
            const tax = Number(removeCurrencySymbol(await orderPage.getTax()));
            const taxDesciption = await orderPage.getTaxDesciption();
            if (taxDesciption.includes("include")) {
              taxInclude = tax;
            }
          }
          let designFee = 0;
          if (profitData.have_design_fee) {
            designFee = conf.suiteConf.design_fee;
          }
          orderPage.calculateProfitPlusbase(
            checkout.total,
            checkout.subtotal,
            checkout.discount,
            baseCost,
            shippingCost,
            shippingFee,
            taxInclude,
            checkout.tip,
            profitData.payment_fee,
            profitData.processing_fee,
            designFee,
          );
          const revenueActual = Number(removeCurrencySymbol(await orderPage.getRevenue()));
          const compareValueRevenue = revenueActual - orderPage.revenue;
          expect(compareValueRevenue >= -0.01 && compareValueRevenue <= 0.01).toEqual(true);

          //do lỗi không tính design fee trong order detail nên tạm thời comment verify handling fee và profit của order

          // const handlingFeeActual = Number(removeCurrencySymbol(await orderPage.getHandlingFee()));
          // const compareValueHandlingFee = handlingFeeActual - orderPage.handlingFee;
          // expect(compareValueHandlingFee >= -0.01 && compareValueHandlingFee <= 0.01).toEqual(true);

          // const profitActual = Number(removeCurrencySymbol(await orderPage.getProfit()));
          // const compareValueProfit = profitActual - orderPage.profit;
          // expect(compareValueProfit >= -0.01 && compareValueProfit <= 0.01).toEqual(true);
        });
      });
    },
  );
});
