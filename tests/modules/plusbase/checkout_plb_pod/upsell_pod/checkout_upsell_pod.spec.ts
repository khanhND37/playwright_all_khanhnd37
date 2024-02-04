import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { SFApps } from "@pages/storefront/apps";
import { SFCart } from "@pages/storefront/cart";
import { OrderAPI } from "@pages/api/order";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { isEqual } from "@core/utils/checkout";
import { SFProduct } from "@pages/storefront/product";

test.describe("Shipping profile cho item POD trong store PlusBase - full flow with UI", () => {
  test(`@SB_PLB_PODPL_PODPU_1 Kiểm tra checkout product POD và Dropship từ offer Pre-purchase có Target product POD , Recommended product Dropship`, async ({
    page,
    conf,
    dashboard,
    authRequest,
    multipleStore,
  }) => {
    //Pre-purchase
    test.setTimeout(conf.suiteConf.timeout);
    const upsellInfo = conf.caseConf.upsell_info;

    let orderId: number, totalOrderSF: number, paymentStatus: string, gatewayCode: string, connectedAccount: string;
    let shippingFeeSF: number, shippingFeeDB: number, totalOrderDB: number, paidByCustomer: number;
    let taxAmountSF: number, taxAmountDB: number, expectedDiscountVal: number, discountAmountDB: number;
    let subtotalSF: number, discountAmountSF: number, subTotalDB: number, secretKey: string, checkoutToken: string;
    let recommendProdPrice = 0,
      targetProductPrice2 = 0;

    const domain = conf.suiteConf.domain;
    const domainTemplate = conf.suiteConf.shop_template.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const targetProduct = upsellInfo.target_product;
    const recommendProduct = upsellInfo.recommend_product;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plbTemplateDashboardPage = new DashboardPage(templatePage, domainTemplate);
    const dashboardMerchant = new DashboardPage(dashboard, domain);
    const orderPageSeller = new OrdersPage(dashboardMerchant.page, domain);

    const homepage = new SFHome(page, domain);
    const checkout = new SFCheckout(homepage.page, domain);
    const checkoutAPI = new CheckoutAPI(domain, authRequest);
    const orderPageTpl = new OrdersPage(plbTemplateDashboardPage.page, domainTemplate);
    const appPage = new SFApps(page, domain);
    const cartPage = new SFCart(page, domain);

    await homepage.gotoHomePage();
    await homepage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
    const productPage = await homepage.searchThenViewProduct(targetProduct[0].name);
    const targetProductPrice = await productPage.getProductPrice("price");
    await productPage.addToCart();

    await test.step(`Mở storefront > Add product POD vào cart `, async () => {
      switch (upsellInfo.type) {
        case "pre-purchase":
          await expect(appPage.prePurchaseRecommendedProduct(recommendProduct[0].name)).toBeVisible();
          break;
        case "in-cart offer":
          await productPage.gotoCart();
          await expect(cartPage.inCartOfferRecommendedProduct(recommendProduct[0].name)).toBeVisible();
          break;
      }
    });

    await test.step(`Add product Dropship vào cart > Thực hiện checkout `, async () => {
      switch (upsellInfo.type) {
        case "pre-purchase":
          recommendProdPrice = Number(
            removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
          );
          checkout.productUpsellPrice = recommendProdPrice;

          await appPage.addPrePurchaseProductToCart([recommendProduct[0].name]);
          await productPage.gotoCart();
          await productPage.navigateToCheckoutPage();
          break;
        case "in-cart offer":
          await cartPage.addInCartOfferProductToCart();
          recommendProdPrice = Number(
            removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
          );
          await cartPage.checkout();
          break;
        case "quantity discount": {
          await homepage.searchThenViewProduct(targetProduct[1].name);
          targetProductPrice2 = await productPage.getProductPrice("price");
          await productPage.addToCart();
          await cartPage.checkout();
          await checkout.getQuantityOfOrder();
          break;
        }
      }
      await checkout.page.waitForTimeout(3000);
      await checkout.enterShippingAddress(customerInfo);
      await checkout.page.waitForTimeout(3000);
      await checkout.page.reload();
      await checkout.continueToPaymentMethod();

      //get gateway code + connnected account + secret key to verify order details on Stripe dashboard
      checkoutToken = checkout.getCheckoutToken();
      const paymentMethodList = await checkoutAPI.getPaymentMethodInfo(undefined, checkoutToken);
      gatewayCode = paymentMethodList.result.find(method => method.title === "Credit Card").code;
      if (gatewayCode === "platform") {
        connectedAccount = checkoutAPI.connectedAccount;
        secretKey = conf.suiteConf.platform_secret_key;
      } else {
        secretKey = conf.suiteConf.stripe_secret_key;
      }

      await checkout.completeOrderWithMethod();
      await checkout.addProductPostPurchase(null);
      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
      subtotalSF = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
      taxAmountSF = Number(removeCurrencySymbol(await checkout.getTaxOnOrderSummary()));
      shippingFeeSF = Number(await checkout.getShippingFeeOnOrderSummary());
      discountAmountSF = Number(removeCurrencySymbol(await checkout.getDiscountValOnOrderSummary()));
      expectedDiscountVal = await checkout.calculateDiscountByType(upsellInfo.discount, recommendProdPrice);
      const tippingAmountSF = Number(removeCurrencySymbol(await checkout.getTipOnOrderSummary()));
      expect(subtotalSF).toEqual(targetProductPrice + recommendProdPrice + targetProductPrice2);
      expect(isEqual(discountAmountSF, -expectedDiscountVal, 0.01)).toEqual(true);
      expect(
        isEqual(totalOrderSF, subtotalSF + taxAmountSF + shippingFeeSF + discountAmountSF + tippingAmountSF, 0.01),
      ).toEqual(true);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      await orderPageSeller.goToOrderByOrderId(orderId);
      totalOrderDB = Number(removeCurrencySymbol(await orderPageSeller.getTotalOrder()));
      subTotalDB = Number(removeCurrencySymbol(await orderPageSeller.getSubtotalOrder()));
      shippingFeeDB = Number(await orderPageSeller.getShippingFee());
      taxAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getTax()));
      discountAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getDiscountVal()));
      expect(subTotalDB).toEqual(subtotalSF);
      expect(shippingFeeDB).toEqual(shippingFeeSF);
      expect(taxAmountDB).toEqual(taxAmountSF);
      expect(isEqual(paidByCustomer, totalOrderDB, 0.1)).toBeTruthy();
      expect(discountAmountDB).toEqual(discountAmountSF);
    });

    await test.step("Approve order tại shop template", async () => {
      await orderPageTpl.goToOrderStoreTemplateByOrderId(orderId);
      await orderPageTpl.waitForProfitCalculated();
      await orderPageTpl.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      paidByCustomer = Number(removeCurrencySymbol(await orderPageTpl.getPaidByCustomer()));
      paymentStatus = await orderPageTpl.getPaymentStatus();
      expect(isEqual(paidByCustomer, totalOrderDB, 0.1)).toBeTruthy();
      expect(paymentStatus).toEqual("Paid");
    });

    await test.step("Kiểm tra order details trên Dashboard Stripe", async () => {
      const authRequestSeller = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      const orderApi = new OrderAPI(domain, authRequestSeller);
      await orderApi.getTransactionId(orderId);
      let orderAmt = (
        await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAccount,
        })
      ).ordAmount;
      orderAmt = Number((orderAmt / 100).toFixed(2));
      expect(orderAmt).toEqual(totalOrderSF);
    });
  });

  test(`@SB_PLB_PODPL_PODPU_2 Kiểm tra checkout khi add product từ offer In-cart có Target product, Recommended product POD và Dropship`, async ({
    page,
    conf,
    dashboard,
    authRequest,
    multipleStore,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const upsellInfo = conf.caseConf.upsell_info;

    let orderId: number, totalOrderSF: number, paymentStatus: string, gatewayCode: string, connectedAccount: string;
    let shippingFeeSF: number, shippingFeeDB: number, totalOrderDB: number, paidByCustomer: number;
    let taxAmountSF: number, taxAmountDB: number, expectedDiscountVal: number, discountAmountDB: number;
    let subtotalSF: number, discountAmountSF: number, subTotalDB: number, secretKey: string, checkoutToken: string;
    let recommendProdPrice = 0,
      targetProductPrice2 = 0;

    const domain = conf.suiteConf.domain;
    const domainTemplate = conf.suiteConf.shop_template.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const targetProduct = upsellInfo.target_product;
    const recommendProduct = upsellInfo.recommend_product;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plbTemplateDashboardPage = new DashboardPage(templatePage, domainTemplate);
    const dashboardMerchant = new DashboardPage(dashboard, domain);
    const orderPageSeller = new OrdersPage(dashboardMerchant.page, domain);

    const homepage = new SFHome(page, domain);
    const checkout = new SFCheckout(homepage.page, domain);
    const checkoutAPI = new CheckoutAPI(domain, authRequest);
    const orderPageTpl = new OrdersPage(plbTemplateDashboardPage.page, domainTemplate);
    const appPage = new SFApps(page, domain);
    const cartPage = new SFCart(page, domain);

    await homepage.gotoHomePage();
    await homepage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
    const productPage = await homepage.searchThenViewProduct(targetProduct[0].name);
    const targetProductPrice = await productPage.getProductPrice("price");
    await productPage.addToCart();

    await test.step(`Mở storefront > Add product POD vào cart `, async () => {
      switch (upsellInfo.type) {
        case "pre-purchase":
          await expect(appPage.prePurchaseRecommendedProduct(recommendProduct[0].name)).toBeVisible();
          break;
        case "in-cart offer":
          await productPage.gotoCart();
          await expect(cartPage.inCartOfferRecommendedProduct(recommendProduct[0].name)).toBeVisible();
          break;
      }
    });

    await test.step(`Add product Dropship vào cart > Thực hiện checkout `, async () => {
      switch (upsellInfo.type) {
        case "pre-purchase":
          recommendProdPrice = Number(
            removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
          );
          checkout.productUpsellPrice = recommendProdPrice;

          await appPage.addPrePurchaseProductToCart([recommendProduct[0].name]);
          await productPage.gotoCart();
          await productPage.navigateToCheckoutPage();
          break;
        case "in-cart offer":
          recommendProdPrice = Number(
            removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
          );
          await cartPage.addInCartOfferProductToCart();
          await cartPage.checkout();
          break;
        case "quantity discount": {
          await homepage.searchThenViewProduct(targetProduct[1].name);
          targetProductPrice2 = await productPage.getProductPrice("price");
          await productPage.addToCart();
          await cartPage.checkout();
          await checkout.getQuantityOfOrder();
          break;
        }
      }
      await checkout.page.waitForTimeout(3000);
      await checkout.enterShippingAddress(customerInfo);
      await checkout.page.waitForTimeout(3000);
      await checkout.page.reload();
      await checkout.continueToPaymentMethod();

      //get gateway code + connnected account + secret key to verify order details on Stripe dashboard
      checkoutToken = checkout.getCheckoutToken();
      const paymentMethodList = await checkoutAPI.getPaymentMethodInfo(undefined, checkoutToken);
      gatewayCode = paymentMethodList.result.find(method => method.title === "Credit Card").code;
      if (gatewayCode === "platform") {
        connectedAccount = checkoutAPI.connectedAccount;
        secretKey = conf.suiteConf.platform_secret_key;
      } else {
        secretKey = conf.suiteConf.stripe_secret_key;
      }

      await checkout.completeOrderWithMethod();
      await checkout.addProductPostPurchase(null);
      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
      subtotalSF = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
      taxAmountSF = Number(removeCurrencySymbol(await checkout.getTaxOnOrderSummary()));
      shippingFeeSF = Number(await checkout.getShippingFeeOnOrderSummary());
      discountAmountSF = Number(removeCurrencySymbol(await checkout.getDiscountValOnOrderSummary()));
      expectedDiscountVal = await checkout.calculateDiscountByType(upsellInfo.discount, recommendProdPrice);
      const tippingAmountSF = Number(removeCurrencySymbol(await checkout.getTipOnOrderSummary()));
      expect(subtotalSF).toEqual(targetProductPrice + recommendProdPrice + targetProductPrice2);
      expect(isEqual(discountAmountSF, -expectedDiscountVal, 0.01)).toEqual(true);
      expect(
        isEqual(totalOrderSF, subtotalSF + taxAmountSF + shippingFeeSF + discountAmountSF + tippingAmountSF, 0.01),
      ).toEqual(true);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      await orderPageSeller.goToOrderByOrderId(orderId);
      totalOrderDB = Number(removeCurrencySymbol(await orderPageSeller.getTotalOrder()));
      subTotalDB = Number(removeCurrencySymbol(await orderPageSeller.getSubtotalOrder()));
      shippingFeeDB = Number(await orderPageSeller.getShippingFee());
      taxAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getTax()));
      discountAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getDiscountVal()));
      expect(subTotalDB).toEqual(subtotalSF);
      expect(shippingFeeDB).toEqual(shippingFeeSF);
      expect(taxAmountDB).toEqual(taxAmountSF);
      expect(isEqual(paidByCustomer, totalOrderDB, 0.1)).toBeTruthy();
      expect(discountAmountDB).toEqual(discountAmountSF);
    });

    await test.step("Approve order tại shop template", async () => {
      await orderPageTpl.goToOrderStoreTemplateByOrderId(orderId);
      await orderPageTpl.waitForProfitCalculated();
      await orderPageTpl.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      paidByCustomer = Number(removeCurrencySymbol(await orderPageTpl.getPaidByCustomer()));
      paymentStatus = await orderPageTpl.getPaymentStatus();
      expect(isEqual(paidByCustomer, totalOrderDB, 0.1)).toBeTruthy();
      expect(paymentStatus).toEqual("Paid");
    });

    await test.step("Kiểm tra order details trên Dashboard Stripe", async () => {
      const authRequestSeller = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      const orderApi = new OrderAPI(domain, authRequestSeller);
      await orderApi.getTransactionId(orderId);
      let orderAmt = (
        await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAccount,
        })
      ).ordAmount;
      orderAmt = Number((orderAmt / 100).toFixed(2));
      expect(orderAmt).toEqual(totalOrderSF);
    });
  });

  test(`@SB_PLB_PODPL_PODPU_4 Kiểm tra checkout khi add product từ offer Quantity discounts có Target products POD và Dropship, Offer's discount amount sale off each product`, async ({
    page,
    conf,
    dashboard,
    authRequest,
    multipleStore,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const upsellInfo = conf.caseConf.upsell_info;

    let orderId: number, totalOrderSF: number, paymentStatus: string, gatewayCode: string, connectedAccount: string;
    let shippingFeeSF: number, shippingFeeDB: number, totalOrderDB: number, paidByCustomer: number;
    let taxAmountSF: number, taxAmountDB: number, expectedDiscountVal: number, discountAmountDB: number;
    let subtotalSF: number, discountAmountSF: number, subTotalDB: number, secretKey: string, checkoutToken: string;
    let recommendProdPrice = 0,
      targetProductPrice2 = 0;

    const domain = conf.suiteConf.domain;
    const domainTemplate = conf.suiteConf.shop_template.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const targetProduct = upsellInfo.target_product;
    const recommendProduct = upsellInfo.recommend_product;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plbTemplateDashboardPage = new DashboardPage(templatePage, domainTemplate);
    const dashboardMerchant = new DashboardPage(dashboard, domain);
    const orderPageSeller = new OrdersPage(dashboardMerchant.page, domain);

    const homepage = new SFHome(page, domain);
    const checkout = new SFCheckout(homepage.page, domain);
    const checkoutAPI = new CheckoutAPI(domain, authRequest);
    const orderPageTpl = new OrdersPage(plbTemplateDashboardPage.page, domainTemplate);
    const appPage = new SFApps(page, domain);
    const cartPage = new SFCart(page, domain);

    await homepage.gotoHomePage();
    await homepage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
    const productPage = await homepage.searchThenViewProduct(targetProduct[0].name);
    const targetProductPrice = await productPage.getProductPrice("price");
    await productPage.addToCart();

    await test.step(`Mở storefront > Add product POD vào cart `, async () => {
      switch (upsellInfo.type) {
        case "pre-purchase":
          await expect(appPage.prePurchaseRecommendedProduct(recommendProduct[0].name)).toBeVisible();
          break;
        case "in-cart offer":
          await productPage.gotoCart();
          await expect(cartPage.inCartOfferRecommendedProduct(recommendProduct[0].name)).toBeVisible();
          break;
      }
    });

    await test.step(`Add product Dropship vào cart > Thực hiện checkout `, async () => {
      switch (upsellInfo.type) {
        case "pre-purchase":
          recommendProdPrice = Number(
            removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
          );
          checkout.productUpsellPrice = recommendProdPrice;

          await appPage.addPrePurchaseProductToCart([recommendProduct[0].name]);
          await productPage.gotoCart();
          await productPage.navigateToCheckoutPage();
          break;
        case "in-cart offer":
          await cartPage.addInCartOfferProductToCart();
          recommendProdPrice = Number(
            removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
          );
          await cartPage.checkout();
          break;
        case "quantity discount": {
          await homepage.searchThenViewProduct(targetProduct[1].name);
          targetProductPrice2 = await productPage.getProductPrice("price");
          await productPage.addToCart();
          await cartPage.checkout();
          await checkout.getQuantityOfOrder();
          break;
        }
      }
      await checkout.page.waitForTimeout(3000);
      await checkout.enterShippingAddress(customerInfo);
      await checkout.page.waitForTimeout(3000);
      await checkout.page.reload();
      await checkout.continueToPaymentMethod();

      //get gateway code + connnected account + secret key to verify order details on Stripe dashboard
      checkoutToken = checkout.getCheckoutToken();
      const paymentMethodList = await checkoutAPI.getPaymentMethodInfo(undefined, checkoutToken);
      gatewayCode = paymentMethodList.result.find(method => method.title === "Credit Card").code;
      if (gatewayCode === "platform") {
        connectedAccount = checkoutAPI.connectedAccount;
        secretKey = conf.suiteConf.platform_secret_key;
      } else {
        secretKey = conf.suiteConf.stripe_secret_key;
      }

      await checkout.completeOrderWithMethod();
      await checkout.addProductPostPurchase(null);
      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
      subtotalSF = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
      taxAmountSF = Number(removeCurrencySymbol(await checkout.getTaxOnOrderSummary()));
      shippingFeeSF = Number(await checkout.getShippingFeeOnOrderSummary());
      discountAmountSF = Number(removeCurrencySymbol(await checkout.getDiscountValOnOrderSummary()));
      expectedDiscountVal = await checkout.calculateDiscountByType(upsellInfo.discount, recommendProdPrice);
      const tippingAmountSF = Number(removeCurrencySymbol(await checkout.getTipOnOrderSummary()));
      expect(subtotalSF).toEqual(targetProductPrice + recommendProdPrice + targetProductPrice2);
      expect(isEqual(discountAmountSF, -expectedDiscountVal, 0.01)).toEqual(true);
      expect(
        isEqual(totalOrderSF, subtotalSF + taxAmountSF + shippingFeeSF + discountAmountSF + tippingAmountSF, 0.01),
      ).toEqual(true);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      await orderPageSeller.goToOrderByOrderId(orderId);
      totalOrderDB = Number(removeCurrencySymbol(await orderPageSeller.getTotalOrder()));
      subTotalDB = Number(removeCurrencySymbol(await orderPageSeller.getSubtotalOrder()));
      shippingFeeDB = Number(await orderPageSeller.getShippingFee());
      taxAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getTax()));
      discountAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getDiscountVal()));
      expect(subTotalDB).toEqual(subtotalSF);
      expect(shippingFeeDB).toEqual(shippingFeeSF);
      expect(taxAmountDB).toEqual(taxAmountSF);
      expect(isEqual(paidByCustomer, totalOrderDB, 0.1)).toBeTruthy();
      expect(discountAmountDB).toEqual(discountAmountSF);
    });

    await test.step("Approve order tại shop template", async () => {
      await orderPageTpl.goToOrderStoreTemplateByOrderId(orderId);
      await orderPageTpl.waitForProfitCalculated();
      await orderPageTpl.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      paidByCustomer = Number(removeCurrencySymbol(await orderPageTpl.getPaidByCustomer()));
      paymentStatus = await orderPageTpl.getPaymentStatus();
      expect(isEqual(paidByCustomer, totalOrderDB, 0.1)).toBeTruthy();
      expect(paymentStatus).toEqual("Paid");
    });

    await test.step("Kiểm tra order details trên Dashboard Stripe", async () => {
      const authRequestSeller = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );
      const orderApi = new OrderAPI(domain, authRequestSeller);
      await orderApi.getTransactionId(orderId);
      let orderAmt = (
        await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAccount,
        })
      ).ordAmount;
      orderAmt = Number((orderAmt / 100).toFixed(2));
      expect(orderAmt).toEqual(totalOrderSF);
    });
  });

  test(`@SB_PLB_PODPL_PODPU_8 Kiểm tra checkout product POD và Dropship, cùng lineship, có tax included, tip, discount percentage, add item post-purchase POD`, async ({
    page,
    conf,
    dashboard,
    authRequest,
    multipleStore,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const upsellInfo = conf.caseConf.upsell_info;

    let orderId: number, totalOrderSF: number, paymentStatus: string, gatewayCode: string, connectedAccount: string;
    let shippingFeeSF: number, shippingFeeDB: number, totalOrderDB: number, paidByCustomer: number;
    let tippingAmountDB: number, expectedDiscountVal: number, discountAmountDB: number, taxAmountSF: number;
    let subtotalSF: number, subTotalDB: number, tippingAmountSF: number, secretKey: string, checkoutToken: string;
    let recommendProdPrice = 0,
      targetProductPrice = 0,
      totalTargetProductPrice = 0;

    const domain = conf.suiteConf.domain;
    const domainTemplate = conf.suiteConf.shop_template.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const tippingInfo = conf.suiteConf.tipping_info;
    const targetProduct = upsellInfo.target_product;
    const recommendProduct = upsellInfo.recommend_product;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.shop_template.shop_name);
    const dashboardMerchant = new DashboardPage(dashboard, domain);

    const homepage = new SFHome(page, domain);
    const checkout = new SFCheckout(homepage.page, domain);
    const orderPageTpl = new OrdersPage(plbTemplateDashboardPage.page, domainTemplate);
    const orderPageSeller = new OrdersPage(dashboardMerchant.page, domain);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, homepage.page);
    const productPage = new SFProduct(page, domain);
    const appPage = new SFApps(page, domain);
    const cartPage = new SFCart(page, domain);

    await test.step(`Add target product vào cart > Thực hiện checkout `, async () => {
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
      for (let i = 0; i < targetProduct.length; i++) {
        await homepage.searchThenViewProduct(targetProduct[i].name);
        targetProductPrice = await productPage.getProductPrice("price");
        totalTargetProductPrice += targetProductPrice;
        await productPage.addToCart();
        //wait for search box to be visible
        await page.waitForTimeout(1000);
      }
      await cartPage.checkout();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.page.locator(checkout.xpathFooterSF).scrollIntoViewIfNeeded();
      if (conf.suiteConf.layout) {
        await checkout.page.locator(checkout.xpathShowTip).check();
      }
      await checkout.page.waitForTimeout(2000);
      await checkout.addTip(tippingInfo);
      await checkout.continueToPaymentMethod();

      //get gateway code + connnected account + secret key to verify order details on Stripe dashboard
      checkoutToken = checkout.getCheckoutToken();
      const paymentMethodList = await checkoutAPI.getPaymentMethodInfo(undefined, checkoutToken);
      gatewayCode = paymentMethodList.result.find(method => method.title === "Credit Card").code;
      if (gatewayCode === "platform") {
        connectedAccount = checkoutAPI.connectedAccount;
        secretKey = conf.suiteConf.platform_secret_key;
      } else {
        secretKey = conf.suiteConf.stripe_secret_key;
      }

      await checkout.completeOrderWithMethod();
      recommendProdPrice = Number(
        removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
      );
      await checkout.addProductPostPurchase(recommendProduct[0].name);
      const recommendProdNameLoc = checkout.getLocatorProdNameInOrderSummary(recommendProduct[0].name);
      await expect(recommendProdNameLoc).toBeVisible();

      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
      subtotalSF = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
      tippingAmountSF = Number(removeCurrencySymbol(await checkout.getTipOnOrderSummary()));
      taxAmountSF = Number(removeCurrencySymbol(await checkout.getTaxOnOrderSummary()));
      shippingFeeSF = Number(await checkout.getShippingFeeOnOrderSummary());
      expectedDiscountVal = await checkout.calculateDiscountByType(upsellInfo.discount, recommendProdPrice);
      expect(subtotalSF).toEqual(totalTargetProductPrice + recommendProdPrice - expectedDiscountVal);
      expect(isEqual(totalOrderSF, subtotalSF + shippingFeeSF + tippingAmountSF + taxAmountSF, 0.01)).toBe(true);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      await orderPageSeller.goToOrderByOrderId(orderId);
      totalOrderDB = Number(removeCurrencySymbol(await orderPageSeller.getTotalOrder()));
      subTotalDB = Number(removeCurrencySymbol(await orderPageSeller.getSubtotalOrder()));
      discountAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getDiscountVal()));
      shippingFeeDB = Number(await orderPageSeller.getShippingFee());
      tippingAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getTip()));
      expect(subTotalDB).toEqual(subtotalSF + expectedDiscountVal);
      expect(discountAmountDB).toEqual(-expectedDiscountVal);
      expect(shippingFeeDB).toEqual(shippingFeeSF);
      expect(totalOrderDB).toEqual(totalOrderSF);
      expect(tippingAmountDB).toEqual(tippingAmountSF);
    });

    await test.step("Approve order tại shop template", async () => {
      await orderPageTpl.goToOrderStoreTemplateByOrderId(orderId);
      await orderPageTpl.waitForProfitCalculated();
      await orderPageTpl.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      paidByCustomer = Number(removeCurrencySymbol(await orderPageTpl.getPaidByCustomer()));
      paymentStatus = await orderPageTpl.getPaymentStatus();
      expect(paidByCustomer).toEqual(totalOrderDB);
      expect(paymentStatus).toEqual("Paid");
    });

    await test.step("Kiểm tra order details trên Dashboard Stripe", async () => {
      const authRequestSeller = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );

      const orderApi = new OrderAPI(domain, authRequestSeller);
      await orderApi.getTransactionId(orderId);
      let orderAmt = (
        await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAccount,
        })
      ).ordAmount;
      orderAmt = Number((orderAmt / 100).toFixed(2));
      expect(orderAmt).toEqual(totalOrderSF);
    });
  });

  test(`@SB_PLB_PODPL_PODPU_11 Kiểm tra checkout product POD và Dropship, khác lineship, có tax included, tip, discount fixed amount, add item post-purchase Dropship`, async ({
    page,
    conf,
    dashboard,
    authRequest,
    multipleStore,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const upsellInfo = conf.caseConf.upsell_info;

    let orderId: number, totalOrderSF: number, paymentStatus: string, gatewayCode: string, connectedAccount: string;
    let shippingFeeSF: number, shippingFeeDB: number, totalOrderDB: number, paidByCustomer: number;
    let tippingAmountDB: number, expectedDiscountVal: number, discountAmountDB: number, taxAmountSF: number;
    let subtotalSF: number, subTotalDB: number, tippingAmountSF: number, secretKey: string, checkoutToken: string;
    let recommendProdPrice = 0,
      targetProductPrice = 0,
      totalTargetProductPrice = 0;

    const domain = conf.suiteConf.domain;
    const domainTemplate = conf.suiteConf.shop_template.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const tippingInfo = conf.suiteConf.tipping_info;
    const targetProduct = upsellInfo.target_product;
    const recommendProduct = upsellInfo.recommend_product;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.shop_template.shop_name);
    const dashboardMerchant = new DashboardPage(dashboard, domain);

    const homepage = new SFHome(page, domain);
    const checkout = new SFCheckout(homepage.page, domain);
    const orderPageTpl = new OrdersPage(plbTemplateDashboardPage.page, domainTemplate);
    const orderPageSeller = new OrdersPage(dashboardMerchant.page, domain);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, homepage.page);
    const productPage = new SFProduct(page, domain);
    const appPage = new SFApps(page, domain);
    const cartPage = new SFCart(page, domain);

    await test.step(`Add target product vào cart > Thực hiện checkout `, async () => {
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
      for (let i = 0; i < targetProduct.length; i++) {
        await homepage.searchThenViewProduct(targetProduct[i].name);
        targetProductPrice = await productPage.getProductPrice("price");
        totalTargetProductPrice += targetProductPrice;
        await productPage.addToCart();
        //wait for search box to be visible
        await page.waitForTimeout(1000);
      }
      await cartPage.checkout();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.page.locator(checkout.xpathFooterSF).scrollIntoViewIfNeeded();
      if (conf.suiteConf.layout) {
        await checkout.page.locator(checkout.xpathShowTip).check();
      }
      await checkout.page.waitForTimeout(2000);
      await checkout.addTip(tippingInfo);
      await checkout.continueToPaymentMethod();

      //get gateway code + connnected account + secret key to verify order details on Stripe dashboard
      checkoutToken = checkout.getCheckoutToken();
      const paymentMethodList = await checkoutAPI.getPaymentMethodInfo(undefined, checkoutToken);
      gatewayCode = paymentMethodList.result.find(method => method.title === "Credit Card").code;
      if (gatewayCode === "platform") {
        connectedAccount = checkoutAPI.connectedAccount;
        secretKey = conf.suiteConf.platform_secret_key;
      } else {
        secretKey = conf.suiteConf.stripe_secret_key;
      }

      await checkout.completeOrderWithMethod();
      recommendProdPrice = Number(
        removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
      );
      await checkout.addProductPostPurchase(recommendProduct[0].name);
      const recommendProdNameLoc = checkout.getLocatorProdNameInOrderSummary(recommendProduct[0].name);
      await expect(recommendProdNameLoc).toBeVisible();

      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
      subtotalSF = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
      tippingAmountSF = Number(removeCurrencySymbol(await checkout.getTipOnOrderSummary()));
      taxAmountSF = Number(removeCurrencySymbol(await checkout.getTaxOnOrderSummary()));
      shippingFeeSF = Number(await checkout.getShippingFeeOnOrderSummary());
      expectedDiscountVal = await checkout.calculateDiscountByType(upsellInfo.discount, recommendProdPrice);
      expect(subtotalSF).toEqual(totalTargetProductPrice + recommendProdPrice - expectedDiscountVal);
      expect(isEqual(totalOrderSF, subtotalSF + shippingFeeSF + tippingAmountSF + taxAmountSF, 0.01)).toBe(true);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      await orderPageSeller.goToOrderByOrderId(orderId);
      totalOrderDB = Number(removeCurrencySymbol(await orderPageSeller.getTotalOrder()));
      subTotalDB = Number(removeCurrencySymbol(await orderPageSeller.getSubtotalOrder()));
      discountAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getDiscountVal()));
      shippingFeeDB = Number(await orderPageSeller.getShippingFee());
      tippingAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getTip()));
      expect(subTotalDB).toEqual(subtotalSF + expectedDiscountVal);
      expect(discountAmountDB).toEqual(-expectedDiscountVal);
      expect(shippingFeeDB).toEqual(shippingFeeSF);
      expect(totalOrderDB).toEqual(totalOrderSF);
      expect(tippingAmountDB).toEqual(tippingAmountSF);
    });

    await test.step("Approve order tại shop template", async () => {
      await orderPageTpl.goToOrderStoreTemplateByOrderId(orderId);
      await orderPageTpl.waitForProfitCalculated();
      await orderPageTpl.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      paidByCustomer = Number(removeCurrencySymbol(await orderPageTpl.getPaidByCustomer()));
      paymentStatus = await orderPageTpl.getPaymentStatus();
      expect(paidByCustomer).toEqual(totalOrderDB);
      expect(paymentStatus).toEqual("Paid");
    });

    await test.step("Kiểm tra order details trên Dashboard Stripe", async () => {
      const authRequestSeller = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );

      const orderApi = new OrderAPI(domain, authRequestSeller);
      await orderApi.getTransactionId(orderId);
      let orderAmt = (
        await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAccount,
        })
      ).ordAmount;
      orderAmt = Number((orderAmt / 100).toFixed(2));
      expect(orderAmt).toEqual(totalOrderSF);
    });
  });

  test(`@SB_PLB_PODPL_PODPU_13 Kiểm tra checkout 2 product POD cùng lineship, có tax included, tip, discount Fixed amount, add item post-purchase Dropship`, async ({
    page,
    conf,
    dashboard,
    authRequest,
    multipleStore,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const upsellInfo = conf.caseConf.upsell_info;

    let orderId: number, totalOrderSF: number, paymentStatus: string, gatewayCode: string, connectedAccount: string;
    let shippingFeeSF: number, shippingFeeDB: number, totalOrderDB: number, paidByCustomer: number;
    let tippingAmountDB: number, expectedDiscountVal: number, discountAmountDB: number, taxAmountSF: number;
    let subtotalSF: number, subTotalDB: number, tippingAmountSF: number, secretKey: string, checkoutToken: string;
    let recommendProdPrice = 0,
      targetProductPrice = 0,
      totalTargetProductPrice = 0;

    const domain = conf.suiteConf.domain;
    const domainTemplate = conf.suiteConf.shop_template.domain;
    const customerInfo = conf.suiteConf.customer_info;
    const tippingInfo = conf.suiteConf.tipping_info;
    const targetProduct = upsellInfo.target_product;
    const recommendProduct = upsellInfo.recommend_product;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.shop_template.username,
      conf.suiteConf.shop_template.password,
      conf.suiteConf.shop_template.domain,
      conf.suiteConf.shop_template.shop_id,
      conf.suiteConf.shop_template.user_id,
    );

    const plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.shop_template.shop_name);
    const dashboardMerchant = new DashboardPage(dashboard, domain);

    const homepage = new SFHome(page, domain);
    const checkout = new SFCheckout(homepage.page, domain);
    const orderPageTpl = new OrdersPage(plbTemplateDashboardPage.page, domainTemplate);
    const orderPageSeller = new OrdersPage(dashboardMerchant.page, domain);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, homepage.page);
    const productPage = new SFProduct(page, domain);
    const appPage = new SFApps(page, domain);
    const cartPage = new SFCart(page, domain);

    await test.step(`Add target product vào cart > Thực hiện checkout `, async () => {
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2(conf.suiteConf.country_currency, conf.suiteConf.theme);
      for (let i = 0; i < targetProduct.length; i++) {
        await homepage.searchThenViewProduct(targetProduct[i].name);
        targetProductPrice = await productPage.getProductPrice("price");
        totalTargetProductPrice += targetProductPrice;
        await productPage.addToCart();
        //wait for search box to be visible
        await page.waitForTimeout(1000);
      }
      await cartPage.checkout();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.page.locator(checkout.xpathFooterSF).scrollIntoViewIfNeeded();
      if (conf.suiteConf.layout) {
        await checkout.page.locator(checkout.xpathShowTip).check();
      }
      await checkout.page.waitForTimeout(2000);
      await checkout.addTip(tippingInfo);
      await checkout.continueToPaymentMethod();

      //get gateway code + connnected account + secret key to verify order details on Stripe dashboard
      checkoutToken = checkout.getCheckoutToken();
      const paymentMethodList = await checkoutAPI.getPaymentMethodInfo(undefined, checkoutToken);
      gatewayCode = paymentMethodList.result.find(method => method.title === "Credit Card").code;
      if (gatewayCode === "platform") {
        connectedAccount = checkoutAPI.connectedAccount;
        secretKey = conf.suiteConf.platform_secret_key;
      } else {
        secretKey = conf.suiteConf.stripe_secret_key;
      }

      expect(secretKey).toEqual(secretKey);
      expect(connectedAccount).toEqual(connectedAccount);

      await checkout.completeOrderWithMethod();
      recommendProdPrice = Number(
        removeCurrencySymbol(await appPage.getPriceProductUpsell(recommendProduct[0].name, "compare at price")),
      );
      await checkout.addProductPostPurchase(recommendProduct[0].name);
      const recommendProdNameLoc = checkout.getLocatorProdNameInOrderSummary(recommendProduct[0].name);
      await expect(recommendProdNameLoc).toBeVisible();

      orderId = await checkout.getOrderIdBySDK();
      totalOrderSF = Number(removeCurrencySymbol(await checkout.getTotalOnOrderSummary()));
      subtotalSF = Number(removeCurrencySymbol(await checkout.getSubtotalOnOrderSummary()));
      tippingAmountSF = Number(removeCurrencySymbol(await checkout.getTipOnOrderSummary()));
      taxAmountSF = Number(removeCurrencySymbol(await checkout.getTaxOnOrderSummary()));
      shippingFeeSF = Number(await checkout.getShippingFeeOnOrderSummary());
      expectedDiscountVal = await checkout.calculateDiscountByType(upsellInfo.discount, recommendProdPrice);
      expect(subtotalSF).toEqual(totalTargetProductPrice + recommendProdPrice - expectedDiscountVal);
      expect(isEqual(totalOrderSF, subtotalSF + shippingFeeSF + tippingAmountSF + taxAmountSF, 0.01)).toBe(true);
    });

    await test.step(`Vào dashboard > Order detail > Kiểm tra order summary`, async () => {
      await orderPageSeller.goToOrderByOrderId(orderId);
      totalOrderDB = Number(removeCurrencySymbol(await orderPageSeller.getTotalOrder()));
      subTotalDB = Number(removeCurrencySymbol(await orderPageSeller.getSubtotalOrder()));
      discountAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getDiscountVal()));
      shippingFeeDB = Number(await orderPageSeller.getShippingFee());
      tippingAmountDB = Number(removeCurrencySymbol(await orderPageSeller.getTip()));
      expect(subTotalDB).toEqual(subtotalSF + expectedDiscountVal);
      expect(discountAmountDB).toEqual(-expectedDiscountVal);
      expect(shippingFeeDB).toEqual(shippingFeeSF);
      expect(totalOrderDB).toEqual(totalOrderSF);
      expect(tippingAmountDB).toEqual(tippingAmountSF);
    });

    await test.step("Approve order tại shop template", async () => {
      await orderPageTpl.goToOrderStoreTemplateByOrderId(orderId);
      await orderPageTpl.waitForProfitCalculated();
      await orderPageTpl.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      paidByCustomer = Number(removeCurrencySymbol(await orderPageTpl.getPaidByCustomer()));
      paymentStatus = await orderPageTpl.getPaymentStatus();
      expect(paidByCustomer).toEqual(totalOrderDB);
      expect(paymentStatus).toEqual("Paid");
    });

    await test.step("Kiểm tra order details trên Dashboard Stripe", async () => {
      const authRequestSeller = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        conf.suiteConf.domain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );

      const orderApi = new OrderAPI(domain, authRequestSeller);
      await orderApi.getTransactionId(orderId);
      let orderAmt = (
        await orderApi.getOrdInfoInStripe({
          key: secretKey,
          gatewayCode: gatewayCode,
          connectedAcc: connectedAccount,
        })
      ).ordAmount;
      orderAmt = Number((orderAmt / 100).toFixed(2));
      expect(orderAmt).toEqual(totalOrderSF);
    });
  });
});
