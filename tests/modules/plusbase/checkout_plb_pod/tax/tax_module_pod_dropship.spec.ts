import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { DashboardAPI } from "@pages/api/dashboard";
import { CheckoutAPI } from "@pages/api/checkout";
import type { OrderSummary } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";
import { AppsAPI } from "@pages/api/apps";

/** PLUSBASE
 * Zone: United State: Auto_US tax
 * -- Tax country: 0$ - 25$ > 8%
 * -- Tax region:
 * ---- California: 50$ - 100$ > 15%
 * -- Tax override:
 * ---- Auto_OverCa: California: 90$ - 119$ > 30%
 * ---- Auto_OverTexas: Texas: 18$ - 200$ > 25%
 * ---- Auto_override_colorado: Colorado: 5$ - 100$ > 0%
 */
/** PRINTBASE
 * Zone: United State: Auto_US tax
 * -- Tax country: 0$ - 25$ > 5%
 * -- Tax region:
 * ---- California: 50$ - 100$ > 10%
 * -- Tax override:
 * ---- AOP-KidSweatshirt-Alloverprint-S: California: 90$ - 119$ > 20%
 */

const verifyTaxOnOrderSummary = (isTaxInclude: boolean, expTaxAmount: number, actTaxAmount: number | string) => {
  if (expTaxAmount === 0) {
    expect(actTaxAmount).toBe(expTaxAmount);
    return;
  }
  if (isTaxInclude) {
    expect(actTaxAmount).toEqual("Tax included");
  } else {
    expect(actTaxAmount).toBe(Number(expTaxAmount.toFixed(2)));
  }
};
test.describe("Tax POD + Dropship", () => {
  const testSuite = "TAX_POD_DROPSHIP";
  const conf = loadData(__dirname, testSuite);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      product_info: productInfo,
      case_id: caseID,
      case_name: caseName,
      is_tax_include: isTaxInclude,
      shipping_address: shippingAddress,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ page, authRequest, conf, request, dashboard }) => {
        test.setTimeout(conf.suiteConf.timeout);
        const domain = conf.suiteConf.domain;
        const checkout = new SFCheckout(page, domain);
        const orderPage = new OrdersPage(dashboard, domain);
        const dashboardAPI = new DashboardAPI(domain, authRequest);

        let orderSummaryInfo: OrderSummary;
        let expTaxAmount: number;
        let orderId: number;

        //update tax setting (include or exclude)
        await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: isTaxInclude });

        const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);
        await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, conf.suiteConf.is_add_ppc);

        await test.step(`Mở storefront > Add product vào cart > Thực hiện checkout `, async () => {
          await checkout.addProductToCartThenInputShippingAddress(productInfo, shippingAddress);
          const checkoutToken = checkout.getCheckoutToken();
          await checkout.completeOrderWithMethod();
          await expect(async () => {
            orderId = await checkout.getOrderIdBySDK();
            expect(orderId).toBeGreaterThan(0);
          }).toPass();

          //get order summary info
          const checkoutApi = new CheckoutAPI(domain, request, page, checkoutToken);
          orderSummaryInfo = await checkout.getOrderSummaryInfo();
          expTaxAmount = await checkoutApi.calculateTaxByLineItem(productInfo);
          verifyTaxOnOrderSummary(isTaxInclude, expTaxAmount, orderSummaryInfo.taxes);
        });

        await test.step(`Vào dashboard > Order detail > Kiểm tra taxes in order summary`, async () => {
          //open order detail
          await orderPage.goToOrderByOrderId(orderId);

          //get order detail info
          const actTaxAmount = await orderPage.getTax();
          const actSubtotal = await orderPage.getSubtotalOrder();
          const actTotal = await orderPage.getTotalOrder();

          //expect order info
          expect(expTaxAmount).toEqual(Number(removeCurrencySymbol(actTaxAmount)));
          expect(orderSummaryInfo.subTotal).toEqual(Number(removeCurrencySymbol(actSubtotal)));
          expect(orderSummaryInfo.totalPrice).toEqual(Number(removeCurrencySymbol(actTotal)));
        });
      });
    },
  );
});
