import { test } from "@fixtures/odoo";
import { expect } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { OrderAPI } from "@pages/api/order";
import { removeCurrencySymbol } from "@core/utils/string";
import { loadData } from "@core/conf/conf";

test.describe("Verify auto cancel khi order profit < 0 @SB_PLB_PODPL_PODPO_33", async () => {
  const conf = loadData(__dirname, "DATA_DRIVEN");
  conf.caseConf.data.forEach(({ case_id: caseId, products: products, description: description }) => {
    test(`${description} @${caseId}`, async ({ conf, page, dashboard, multipleStore }) => {
      const orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      let orderId: number;
      await test.step("Create order", async () => {
        const checkout = new SFCheckout(page, conf.suiteConf.domain);
        const infoOrder = await checkout.createStripeOrderMultiProduct(
          conf.suiteConf.customer_info,
          "",
          products,
          conf.suiteConf.card_info,
        );
        orderId = infoOrder.orderId;
      });
      await test.step("Vào dashboard shop PlusBase > Orders > All orders > Search orders A > vào order detail > Verify thông tin order", async () => {
        await orderPage.goToOrderByOrderId(orderId);
        await orderPage.waitForAutoCancel();
        expect(await orderPage.getPaymentStatus()).toBe("Voided");
        await orderPage.clickShowCalculation();
        const baseCost = Number(removeCurrencySymbol(await orderPage.getBaseCost()));
        const shippingCost = Number(removeCurrencySymbol(await orderPage.getShippingCost()));
        const shippingFee = Number(removeCurrencySymbol(await orderPage.getShippingFee()));
        const handlingFee = Number(removeCurrencySymbol(await orderPage.getHandlingFee()));
        const profit = Number(removeCurrencySymbol(await orderPage.getProfit()));

        expect(baseCost <= 0.01 && baseCost >= -0.01).toBeTruthy();
        expect(shippingCost - shippingFee <= 0.01 && shippingCost + shippingFee >= -0.01).toBeTruthy();
        expect(handlingFee <= 0.01 && handlingFee >= -0.01).toBeTruthy();
        expect(profit <= 0.01 && profit >= -0.01).toBeTruthy();
      });

      await test.step("Verify không tạo invoice", async () => {
        const authRequest = await multipleStore.getAuthRequest(
          conf.suiteConf.username,
          conf.suiteConf.password,
          conf.suiteConf.domain,
          conf.suiteConf.shop_id,
          conf.suiteConf.user_id,
        );
        const orderApi = new OrderAPI(conf.suiteConf.domain, authRequest);
        const invoiceData = await orderApi.getInvoiceByOrderId(orderId);
        expect(invoiceData).toBeNull();
      });
    });
  });
});
