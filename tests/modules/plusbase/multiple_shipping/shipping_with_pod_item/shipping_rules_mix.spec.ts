import { expect } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import type { Product, ShippingAddressApi, ShippingData, ShippingMethod } from "@types";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { SFCheckout } from "@pages/storefront/checkout";
import { AppsAPI } from "@pages/api/apps";
import { OrdersPage } from "@pages/dashboard/orders";

let emailBuyer: string;
let domain: string;
let shippingAddress: ShippingAddressApi;
let expectedShippingMethod: Array<ShippingMethod>;
let actFinalShippingInfo = {
  amount: "",
  method_title: "",
};
let checkoutAPI: CheckoutAPI;
let checkout: SFCheckout;
let odooService; // OdooService is a function -> dont have type
let isAddPPC: boolean;
let productCheckout: Array<Product>;
let productDSTemplateId: number;
let shippingDSInfo: Map<string, ShippingData>;
let orderPage: OrdersPage;

test.describe("Setting shipping for PlusBase", async () => {
  test.beforeEach(async ({ conf, authRequest, odoo, page, dashboard }) => {
    test.setTimeout(conf.suiteConf.timeout);
    domain = conf.suiteConf.domain;
    isAddPPC = conf.caseConf.is_add_ppc;
    odooService = OdooService(odoo);
    productCheckout = conf.caseConf.products_checkout;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);

    emailBuyer = conf.suiteConf.email_buyer;
    shippingAddress = conf.suiteConf.shipping_address;
    productDSTemplateId = conf.suiteConf.product_ds_template_id;
    orderPage = new OrdersPage(dashboard, domain);
    const appsAPI = new AppsAPI(conf.suiteConf.domain, authRequest);

    //enable/disable app
    if (isAddPPC) {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, true);
    } else {
      await appsAPI.actionEnableDisableApp(conf.suiteConf.app_name, false);
    }
  });

  test("@SB_PLB_PODPL_POPLS_2 Kiểm tra shipping info khi checkout product POD và Dropship apply discount code free ship cho lineship Standard và Eco", async ({
    conf,
  }) => {
    const shippingRateForPODItem = conf.caseConf.shipping_rate_for_pod;
    const shippingMethodOnCheckout = conf.caseConf.shipping_method_checkout;
    const shippingLineForDSItem = conf.caseConf.shipping_line_for_ds;

    await test.step(`Pre-condition`, async () => {
      // Update then get shipping data of DropShip item
      shippingDSInfo = await odooService.updateThenGetShippingDatas(
        productDSTemplateId,
        conf.caseConf.set_shipping_types,
        shippingAddress.country_code,
      );
    });

    await test.step(`Search product > Add to cart > Check out > Nhập thông tin customer > Kiểm tra info shipping `, async () => {
      // Search product > Add to cart > Check out > Nhập thông tin customer
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      // calculate expected shipping
      expectedShippingMethod = [
        {
          amount: shippingRateForPODItem[0].amount + shippingDSInfo.get(shippingLineForDSItem).first_item_fee,
          method_title: shippingMethodOnCheckout,
        },
      ];

      // Verify shipping info on checkout page
      expect(await checkout.verifyShippingMethodOnPage(expectedShippingMethod)).toBeTruthy();
    });

    await test.step(`Chọn line ship > Nhập discount > Kiểm tra info shipping`, async () => {
      // Chọn line ship > Nhập discount
      await checkout.selectShippingMethod(expectedShippingMethod[0].method_title);
      await checkout.applyDiscountCode(conf.caseConf.discount_code, false);

      // If line ship == "Fast Shipping" -> cannot apply shipping method

      actFinalShippingInfo.amount = await checkout.getShippingFeeOnOrderSummary();
      expect(actFinalShippingInfo.amount).toBe("Free");

      // Complete order then Verify shipping on thankyou page
      await checkout.completeOrderWithMethod();
      actFinalShippingInfo = await checkout.getShippingInfoOnThankyouPage();
      expect(actFinalShippingInfo.amount).toBe("Free");
      expect(actFinalShippingInfo.method_title).toBe(expectedShippingMethod[0].method_title);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra shipping fee`, async () => {
      const orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);
      const shippingFee = await orderPage.getShippingFee();
      const shippingRateName = await orderPage.getShippingRateName();
      expect(shippingFee).toBe(expectedShippingMethod[0].amount.toFixed(2));
      const discountValue = await orderPage.getDiscountVal();
      expect(discountValue).toBe("-$" + shippingFee);

      expect(shippingRateName).toBe(actFinalShippingInfo.method_title);
    });
  });

  test("@SB_PLB_PODPL_POPLS_3 Kiểm tra shipping info khi checkout product POD và Dropship không apply discount auto free ship cho lineship Fast", async ({
    conf,
  }) => {
    const shippingRateForPODItem = conf.caseConf.shipping_rate_for_pod;
    const shippingMethodOnCheckout = conf.caseConf.shipping_method_checkout;
    const shippingLineForDSItem = conf.caseConf.shipping_line_for_ds;

    await test.step(`Pre-condition`, async () => {
      // Update then get shipping data of DropShip item
      shippingDSInfo = await odooService.updateThenGetShippingDatas(
        productDSTemplateId,
        conf.caseConf.set_shipping_types,
        shippingAddress.country_code,
      );
    });

    await test.step(`Search product > Add to cart > Check out > Nhập thông tin customer > Kiểm tra info shipping `, async () => {
      // Search product > Add to cart > Check out > Nhập thông tin customer
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      // calculate expected shipping
      expectedShippingMethod = [
        {
          amount: shippingRateForPODItem[0].amount + shippingDSInfo.get(shippingLineForDSItem).first_item_fee,
          method_title: shippingMethodOnCheckout,
        },
      ];

      // Verify shipping info on checkout page
      expect(await checkout.verifyShippingMethodOnPage(expectedShippingMethod)).toBeTruthy();
    });

    await test.step(`Chọn line ship > Nhập discount > Kiểm tra info shipping`, async () => {
      // Chọn line ship > Nhập discount
      await checkout.selectShippingMethod(expectedShippingMethod[0].method_title);
      await checkout.applyDiscountCode(conf.caseConf.discount_code, false);

      // If line ship == "Fast Shipping" -> cannot apply shipping method

      actFinalShippingInfo.amount = await checkout.getShippingFeeOnOrderSummary();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));

      // Complete order then Verify shipping on thankyou page
      await checkout.completeOrderWithMethod();
      actFinalShippingInfo = await checkout.getShippingInfoOnThankyouPage();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));
      expect(actFinalShippingInfo.method_title).toBe(expectedShippingMethod[0].method_title);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra shipping fee`, async () => {
      const orderId = await checkout.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);
      const shippingFee = await orderPage.getShippingFee();
      const shippingRateName = await orderPage.getShippingRateName();
      expect(shippingFee).toBe(actFinalShippingInfo.amount);

      expect(shippingRateName).toBe(actFinalShippingInfo.method_title);
    });
  });

  test("@SB_PLB_PODPL_POPLS_10 Kiểm tra shipping info khi checkout product POD và Dropship cùng lineship", async ({
    conf,
  }) => {
    const shippingRateForPODItem = conf.caseConf.shipping_rate_for_pod;
    const shippingMethodOnCheckout = conf.caseConf.shipping_method_checkout;
    const shippingLinesForDSItem = conf.caseConf.shipping_line_for_ds;
    const dataSettingDSShipping = conf.caseConf.set_shipping_types;
    const shippingDSInfo = new Map<number, Map<string, ShippingData>>();

    await test.step(`Pre-condition`, async () => {
      // Update then get shipping data of DropShip item
      shippingDSInfo.set(
        dataSettingDSShipping.product_ds_template_id,
        await odooService.updateThenGetShippingDatas(
          dataSettingDSShipping.product_ds_template_id,
          dataSettingDSShipping.shipping_types,
          shippingAddress.country_code,
        ),
      );
    });

    await test.step(`Search product > Add to cart > Check out > Nhập thông tin customer > Kiểm tra info shipping `, async () => {
      // Search product > Add to cart > Check out > Nhập thông tin customer
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      // calculate expected shipping
      expectedShippingMethod = [];
      for (let i = 0; i < shippingMethodOnCheckout.length; i++) {
        expectedShippingMethod.push({
          amount: 0,
          method_title: "",
        });
        expectedShippingMethod[i].amount = shippingRateForPODItem[i].amount;
        for (const shippingLineForDSItem of shippingLinesForDSItem) {
          expectedShippingMethod[i].amount += shippingDSInfo
            .get(shippingLineForDSItem.product_ds_template_id)
            .get(shippingLineForDSItem.shipping_lines[i]).first_item_fee;
        }
        expectedShippingMethod[i].method_title = shippingMethodOnCheckout[i];
      }

      // Verify shipping info on checkout page
      expect(await checkout.verifyShippingMethodOnPage(expectedShippingMethod)).toBeTruthy();
    });

    await test.step(`Chọn line ship > Nhập card > Complete order > Kiểm tra shipping`, async () => {
      // Chọn line ship
      await checkout.selectShippingMethod(expectedShippingMethod[0].method_title);

      // Verify shipping amount on order summary
      actFinalShippingInfo.amount = await checkout.getShippingFeeOnOrderSummary();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));

      // Complete order
      await checkout.completeOrderWithMethod();
      // Verify shipping on thankyou page
      actFinalShippingInfo = await checkout.getShippingInfoOnThankyouPage();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));
      expect(actFinalShippingInfo.method_title).toBe(expectedShippingMethod[0].method_title);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra shipping fee`, async () => {
      // Go to order

      const orderId = await checkout.getOrderIdBySDK();

      await orderPage.goToOrderByOrderId(orderId);

      // Get data then verify
      const shippingFee = await orderPage.getShippingFee();
      const shippingRateName = await orderPage.getShippingRateName();
      expect(shippingFee).toBe(actFinalShippingInfo.amount);
      expect(shippingRateName).toBe(actFinalShippingInfo.method_title);
    });
  });

  test("@SB_PLB_PODPL_POPLS_11 Kiểm tra shipping info khi checkout product POD và Dropship khác lineship", async ({
    conf,
  }) => {
    const shippingRateForPODItem = conf.caseConf.shipping_rate_for_pod;
    const shippingMethodOnCheckout = conf.caseConf.shipping_method_checkout;
    const shippingLinesForDSItem = conf.caseConf.shipping_line_for_ds;
    const dataSettingDSShipping = conf.caseConf.set_shipping_types;
    const shippingDSInfo = new Map<number, Map<string, ShippingData>>();

    await test.step(`Pre-condition`, async () => {
      // Update then get shipping data of DropShip item
      shippingDSInfo.set(
        dataSettingDSShipping.product_ds_template_id,
        await odooService.updateThenGetShippingDatas(
          dataSettingDSShipping.product_ds_template_id,
          dataSettingDSShipping.shipping_types,
          shippingAddress.country_code,
        ),
      );
    });

    await test.step(`Search product > Add to cart > Check out > Nhập thông tin customer > Kiểm tra info shipping `, async () => {
      // Search product > Add to cart > Check out > Nhập thông tin customer
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      // calculate expected shipping
      expectedShippingMethod = [];
      for (let i = 0; i < shippingMethodOnCheckout.length; i++) {
        expectedShippingMethod.push({
          amount: 0,
          method_title: "",
        });
        expectedShippingMethod[i].amount = shippingRateForPODItem[i].amount;
        for (const shippingLineForDSItem of shippingLinesForDSItem) {
          expectedShippingMethod[i].amount += shippingDSInfo
            .get(shippingLineForDSItem.product_ds_template_id)
            .get(shippingLineForDSItem.shipping_lines[i]).first_item_fee;
        }
        expectedShippingMethod[i].method_title = shippingMethodOnCheckout[i];
      }

      // Verify shipping info on checkout page
      expect(await checkout.verifyShippingMethodOnPage(expectedShippingMethod)).toBeTruthy();
    });

    await test.step(`Chọn line ship > Nhập card > Complete order > Kiểm tra shipping`, async () => {
      // Chọn line ship
      await checkout.selectShippingMethod(expectedShippingMethod[0].method_title);

      // Verify shipping amount on order summary
      actFinalShippingInfo.amount = await checkout.getShippingFeeOnOrderSummary();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));

      // Complete order
      await checkout.completeOrderWithMethod();
      // Verify shipping on thankyou page
      actFinalShippingInfo = await checkout.getShippingInfoOnThankyouPage();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));
      expect(actFinalShippingInfo.method_title).toBe(expectedShippingMethod[0].method_title);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra shipping fee`, async () => {
      // Go to order

      const orderId = await checkout.getOrderIdBySDK();

      await orderPage.goToOrderByOrderId(orderId);

      // Get data then verify
      const shippingFee = await orderPage.getShippingFee();
      const shippingRateName = await orderPage.getShippingRateName();
      expect(shippingFee).toBe(actFinalShippingInfo.amount);
      expect(shippingRateName).toBe(actFinalShippingInfo.method_title);
    });
  });

  test("@SB_PLB_PODPL_POPLS_23 Kiểm tra shipping info khi checkout product POD và Dropship khác lineship", async ({
    conf,
  }) => {
    const shippingRateForPODItem = conf.caseConf.shipping_rate_for_pod;
    const shippingMethodOnCheckout = conf.caseConf.shipping_method_checkout;
    const shippingLinesForDSItem = conf.caseConf.shipping_line_for_ds;
    const dataSettingDSShipping = conf.caseConf.set_shipping_types;
    const shippingDSInfo = new Map<number, Map<string, ShippingData>>();

    await test.step(`Pre-condition`, async () => {
      // Update then get shipping data of DropShip item

      for (const dataSetting of dataSettingDSShipping) {
        // Update then get shipping data of DropShip item
        shippingDSInfo.set(
          dataSetting.product_ds_template_id,
          await odooService.updateThenGetShippingDatas(
            dataSetting.product_ds_template_id,
            dataSetting.shipping_types,
            shippingAddress.country_code,
          ),
        );
      }
    });

    await test.step(`Search product > Add to cart > Check out > Nhập thông tin customer > Kiểm tra info shipping `, async () => {
      // Search product > Add to cart > Check out > Nhập thông tin customer
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      // calculate expected shipping
      expectedShippingMethod = [];
      for (let i = 0; i < shippingMethodOnCheckout.length; i++) {
        expectedShippingMethod.push({
          amount: 0,
          method_title: "",
        });
        expectedShippingMethod[i].amount = shippingRateForPODItem[i].amount;
        for (const shippingLineForDSItem of shippingLinesForDSItem) {
          expectedShippingMethod[i].amount += shippingDSInfo
            .get(shippingLineForDSItem.product_ds_template_id)
            .get(shippingLineForDSItem.shipping_lines[i]).first_item_fee;
        }
        expectedShippingMethod[i].method_title = shippingMethodOnCheckout[i];
      }

      // Verify shipping info on checkout page
      expect(await checkout.verifyShippingMethodOnPage(expectedShippingMethod)).toBeTruthy();
    });

    await test.step(`Chọn line ship > Nhập card > Complete order > Kiểm tra shipping`, async () => {
      // Chọn line ship
      await checkout.selectShippingMethod(expectedShippingMethod[0].method_title);

      // Verify shipping amount on order summary
      actFinalShippingInfo.amount = await checkout.getShippingFeeOnOrderSummary();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));

      // Complete order
      await checkout.completeOrderWithMethod();
      // Verify shipping on thankyou page
      actFinalShippingInfo = await checkout.getShippingInfoOnThankyouPage();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));
      expect(actFinalShippingInfo.method_title).toBe(expectedShippingMethod[0].method_title);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra shipping fee`, async () => {
      // Go to order

      const orderId = await checkout.getOrderIdBySDK();

      await orderPage.goToOrderByOrderId(orderId);

      // Get data then verify
      const shippingFee = await orderPage.getShippingFee();
      const shippingRateName = await orderPage.getShippingRateName();
      expect(shippingFee).toBe(actFinalShippingInfo.amount);
      expect(shippingRateName).toBe(actFinalShippingInfo.method_title);
    });
  });

  test("@SB_PLB_PODPL_POPLS_26 Kiểm tra shipping info khi checkout 2 product POD có 2 rate name lần lượt là Standard, Fast và 2 product Dropship có 2 lineship lần lượt là Fast và Eco", async ({
    conf,
  }) => {
    const shippingRateForPODItem = conf.caseConf.shipping_rate_for_pod;
    const shippingMethodOnCheckout = conf.caseConf.shipping_method_checkout;
    const shippingLinesForDSItem = conf.caseConf.shipping_line_for_ds;
    const dataSettingDSShipping = conf.caseConf.set_shipping_types;
    const shippingDSInfo = new Map<number, Map<string, ShippingData>>();

    await test.step(`Pre-condition`, async () => {
      // Update then get shipping data of DropShip item

      for (const dataSetting of dataSettingDSShipping) {
        // Update then get shipping data of DropShip item
        shippingDSInfo.set(
          dataSetting.product_ds_template_id,
          await odooService.updateThenGetShippingDatas(
            dataSetting.product_ds_template_id,
            dataSetting.shipping_types,
            shippingAddress.country_code,
          ),
        );
      }
    });

    await test.step(`Search product > Add to cart > Check out > Nhập thông tin customer > Kiểm tra info shipping `, async () => {
      // Search product > Add to cart > Check out > Nhập thông tin customer
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      // calculate expected shipping
      expectedShippingMethod = [];
      for (let i = 0; i < shippingMethodOnCheckout.length; i++) {
        expectedShippingMethod.push({
          amount: 0,
          method_title: "",
        });
        expectedShippingMethod[i].amount = shippingRateForPODItem[i].amount;
        for (const shippingLineForDSItem of shippingLinesForDSItem) {
          expectedShippingMethod[i].amount += shippingDSInfo
            .get(shippingLineForDSItem.product_ds_template_id)
            .get(shippingLineForDSItem.shipping_lines[i]).first_item_fee;
        }
        expectedShippingMethod[i].method_title = shippingMethodOnCheckout[i];
      }

      // Verify shipping info on checkout page
      expect(await checkout.verifyShippingMethodOnPage(expectedShippingMethod)).toBeTruthy();
    });

    await test.step(`Chọn line ship > Nhập card > Complete order > Kiểm tra shipping`, async () => {
      // Chọn line ship
      await checkout.selectShippingMethod(expectedShippingMethod[0].method_title);

      // Verify shipping amount on order summary
      actFinalShippingInfo.amount = await checkout.getShippingFeeOnOrderSummary();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));

      // Complete order
      await checkout.completeOrderWithMethod();
      // Verify shipping on thankyou page
      actFinalShippingInfo = await checkout.getShippingInfoOnThankyouPage();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));
      expect(actFinalShippingInfo.method_title).toBe(expectedShippingMethod[0].method_title);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra shipping fee`, async () => {
      // Go to order

      const orderId = await checkout.getOrderIdBySDK();

      await orderPage.goToOrderByOrderId(orderId);

      // Get data then verify
      const shippingFee = await orderPage.getShippingFee();
      const shippingRateName = await orderPage.getShippingRateName();
      expect(shippingFee).toBe(actFinalShippingInfo.amount);
      expect(shippingRateName).toBe(actFinalShippingInfo.method_title);
    });
  });

  test("@SB_PLB_PODPL_POPLS_5 Kiểm tra shipping info khi checkout variant combo product Dropship, add item post-purchase POD", async ({
    conf,
  }) => {
    const shippingMethodOnCheckout = conf.caseConf.shipping_method_checkout;
    const shippingLinesForDSItem = conf.caseConf.shipping_line_for_ds;
    const dataSettingDSShipping = conf.caseConf.set_shipping_types;
    const shippingDSInfo = new Map<number, Map<string, ShippingData>>();

    await test.step(`Pre-condition`, async () => {
      // Update then get shipping data of DropShip item

      for (const dataSetting of dataSettingDSShipping) {
        // Update then get shipping data of DropShip item
        shippingDSInfo.set(
          dataSetting.product_ds_template_id,
          await odooService.updateThenGetShippingDatas(
            dataSetting.product_ds_template_id,
            dataSetting.shipping_types,
            shippingAddress.country_code,
          ),
        );
      }
    });

    await test.step(`Search product > Add to cart > Check out > Nhập thông tin customer > Kiểm tra info shipping `, async () => {
      // Search product > Add to cart > Check out > Nhập thông tin customer
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      // calculate expected shipping
      expectedShippingMethod = [];
      for (let i = 0; i < shippingMethodOnCheckout.length; i++) {
        expectedShippingMethod.push({
          amount: 0,
          method_title: "",
        });

        for (const shippingLineForDSItem of shippingLinesForDSItem) {
          expectedShippingMethod[i].amount += shippingDSInfo
            .get(shippingLineForDSItem.product_ds_template_id)
            .get(shippingLineForDSItem.shipping_lines[i]).first_item_fee;
        }
        expectedShippingMethod[i].method_title = shippingMethodOnCheckout[i];
      }

      // Verify shipping info on checkout page
      expect(await checkout.verifyShippingMethodOnPage(expectedShippingMethod)).toBeTruthy();
    });

    await test.step(`Chọn line ship > Nhập card > Complete order > Kiểm tra shipping`, async () => {
      // Chọn line ship
      await checkout.selectShippingMethod(expectedShippingMethod[0].method_title);

      // Verify shipping amount on order summary
      actFinalShippingInfo.amount = await checkout.getShippingFeeOnOrderSummary();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));

      // Complete order
      await checkout.completeOrderWithMethod();

      await checkout.addProductPostPurchase(conf.caseConf.item_post_purchase.name);
      await checkout.isThankyouPage();
      expectedShippingMethod[0].amount += conf.caseConf.item_post_purchase.shipping_fee;
      // Verify shipping on thankyou page
      actFinalShippingInfo = await checkout.getShippingInfoOnThankyouPage();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));
      expect(actFinalShippingInfo.method_title).toBe(expectedShippingMethod[0].method_title);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra shipping fee`, async () => {
      // Go to order

      const orderId = await checkout.getOrderIdBySDK();

      await orderPage.goToOrderByOrderId(orderId);

      // Get data then verify
      const shippingFee = await orderPage.getShippingFee();
      const shippingRateName = await orderPage.getShippingRateName();
      expect(shippingFee).toBe(actFinalShippingInfo.amount);
      expect(shippingRateName).toBe(actFinalShippingInfo.method_title);
    });
  });

  test("@SB_PLB_PODPL_POPLS_13 Kiểm tra shipping info khi checkout variant combo product Dropship, add item post-purchase POD", async ({
    conf,
  }) => {
    const shippingRateForPODItem = conf.caseConf.shipping_rate_for_pod;
    const shippingMethodOnCheckout = conf.caseConf.shipping_method_checkout;
    const shippingLinesForDSItem = conf.caseConf.shipping_line_for_ds;
    const dataSettingDSShipping = conf.caseConf.set_shipping_types;
    const shippingDSInfo = new Map<number, Map<string, ShippingData>>();

    await test.step(`Pre-condition`, async () => {
      // Update then get shipping data of DropShip item

      for (const dataSetting of dataSettingDSShipping) {
        // Update then get shipping data of DropShip item
        shippingDSInfo.set(
          dataSetting.product_ds_template_id,
          await odooService.updateThenGetShippingDatas(
            dataSetting.product_ds_template_id,
            dataSetting.shipping_types,
            shippingAddress.country_code,
          ),
        );
      }
    });

    await test.step(`Search product > Add to cart > Check out > Nhập thông tin customer > Kiểm tra info shipping `, async () => {
      // Search product > Add to cart > Check out > Nhập thông tin customer
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      checkout = await checkoutAPI.openCheckoutPageByToken();

      // calculate expected shipping
      // calculate expected shipping
      expectedShippingMethod = [];
      for (let i = 0; i < shippingMethodOnCheckout.length; i++) {
        expectedShippingMethod.push({
          amount: 0,
          method_title: "",
        });
        expectedShippingMethod[i].amount = shippingRateForPODItem[i].amount;
        for (const shippingLineForDSItem of shippingLinesForDSItem) {
          expectedShippingMethod[i].amount += shippingDSInfo
            .get(shippingLineForDSItem.product_ds_template_id)
            .get(shippingLineForDSItem.shipping_lines[i]).first_item_fee;
        }
        expectedShippingMethod[i].method_title = shippingMethodOnCheckout[i];
      }

      // Verify shipping info on checkout page
      expect(await checkout.verifyShippingMethodOnPage(expectedShippingMethod)).toBeTruthy();
    });

    await test.step(`Chọn line ship > Nhập card > Complete order > Kiểm tra shipping`, async () => {
      // Chọn line ship
      await checkout.selectShippingMethod(expectedShippingMethod[0].method_title);

      // Verify shipping amount on order summary
      actFinalShippingInfo.amount = await checkout.getShippingFeeOnOrderSummary();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));

      // Complete order
      await checkout.completeOrderWithMethod();

      await checkout.addProductPostPurchase(conf.caseConf.item_post_purchase.name);
      await checkout.isThankyouPage();
      expectedShippingMethod[0].amount += conf.caseConf.item_post_purchase.shipping_fee;
      // Verify shipping on thankyou page
      actFinalShippingInfo = await checkout.getShippingInfoOnThankyouPage();
      expect(actFinalShippingInfo.amount).toBe(expectedShippingMethod[0].amount.toFixed(2));
      expect(actFinalShippingInfo.method_title).toBe(expectedShippingMethod[0].method_title);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra shipping fee`, async () => {
      // Go to order

      const orderId = await checkout.getOrderIdBySDK();

      await orderPage.goToOrderByOrderId(orderId);

      // Get data then verify
      const shippingFee = await orderPage.getShippingFee();
      const shippingRateName = await orderPage.getShippingRateName();
      expect(shippingFee).toBe(actFinalShippingInfo.amount);
      expect(shippingRateName).toBe(actFinalShippingInfo.method_title);
    });
  });
});
