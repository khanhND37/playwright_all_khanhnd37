import { expect, test } from "@core/fixtures";
import { PaymentProviderPage } from "@pages/dashboard/digital_payment";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderAPI } from "@pages/api/dpro/payment_provider";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { OrderAPI } from "@pages/shopbase_creator/dashboard/order_api";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { DefaultGetProductAPIParam } from "@constants/shopbase_creator/product/param";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import type { PaymentInfo } from "@types";

test.describe("Checkout creator shop with Test mode @SB_DP_DPSF_CDP_", () => {
  let paymentProviderPage: PaymentProviderPage;
  let checkoutPage: CheckoutForm;
  let orderPage: OrderPage;
  let orderPageAPI: OrderAPI;
  let dashboardPage: DashboardPage;
  let productAPI: ProductAPI;
  let productPage: ProductPage;
  let numberOfOrderBefore: number;
  let stripeKey: PaymentInfo;

  test.beforeEach(async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    stripeKey = conf.caseConf.payment;
  });

  test.afterEach(async () => {
    await paymentProviderPage.goto("admin/creator/settings/payments");
    await paymentProviderPage.page.waitForSelector(paymentProviderPage.xpathToggleTestMode);
    //remove acc payment provider on shop
    if (stripeKey) {
      await paymentProviderPage.expandGatewayEditingForm(stripeKey.title);
      await paymentProviderPage.removeProvider();
      await expect(paymentProviderPage.genLoc(paymentProviderPage.getXpathWithLabel(stripeKey.title))).toBeHidden();
    }

    //turn on toggle Test mode
    const statusTestmode = await paymentProviderPage.genLoc(paymentProviderPage.xpathToggleTestModeOn).isVisible();
    if (!statusTestmode) {
      await paymentProviderPage.changeStatusTestMode();
      await expect(paymentProviderPage.genLoc(paymentProviderPage.xpathToggleTestModeOn)).toBeVisible();
    }

    //delete all products
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  test(`Verify checkout với các trường hợp Test mode với shop đã select plan @SB_SC_SCSF_SCSFC_19`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.second_domain);
    paymentProviderPage = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new CheckoutForm(dashboard, conf.suiteConf.domain);
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    orderPageAPI = new OrderAPI(conf.suiteConf.domain, authRequest);
    numberOfOrderBefore = await orderPageAPI.getNumberOfOrder();
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const productRequest = conf.suiteConf.product_request;
    await productAPI.createProduct(productRequest);
    await productPage.navigateToMenu("Products");
    await productPage.clickTitleProduct(productRequest.product.title);
    await productPage.switchTab("Pricing");
    await productPage.selectPaymentType("One-time payment");
    await productPage.inputPrice(10);
    await productPage.clickSaveBar();

    await test.step(`Kiểm tra trạng thái default của Test mode trong màn Payment Provider`, async () => {
      await paymentProviderPage.navigateToMenu("Settings");
      await paymentProviderPage.goto("admin/creator/settings/payments");
      await expect(paymentProviderPage.genLoc(paymentProviderPage.xpathToggleTestModeOn)).toBeVisible();
    });

    await test.step(`View sale page của product "Checkout test mode" và thực hiện checkout`, async () => {
      await paymentProviderPage.goto(`products/${conf.caseConf.product_handle}`);
      await expect(checkoutPage.genLoc(checkoutPage.xpathAlertTestMode)).toBeVisible();
      await expect(checkoutPage.genLoc(`${checkoutPage.xpathLearnMore} and ${checkoutPage.xpathLink}`)).toBeVisible();
    });

    await test.step(`Thực hiện checkout với product "Checkout test mode" với card test`, async () => {
      await checkoutPage.enterEmail(conf.caseConf.email);
      await checkoutPage.completeOrderWithMethod("Stripe");
      await expect(checkoutPage.genLoc(checkoutPage.getXpathWithLabel("Thank you!"))).toBeVisible();
    });

    await test.step(`Chuyển sang tab Order > Xác nhận order mới nhất trong list`, async () => {
      await orderPage.goto("admin/creator/orders");
      const expectNumberOfOrder = 1 + numberOfOrderBefore;
      expect(await orderPageAPI.getNumberOfOrder()).toEqual(expectNumberOfOrder);
    });

    await test.step(`Mở order detail của order test`, async () => {
      await orderPage.openNewestOrder();
      await expect(orderPage.genLoc(orderPage.xpathTestOrder)).toBeVisible();
    });

    await test.step(`Chuyển sang tab Analystic`, async () => {
      await dashboardPage.navigateToMenu("Analytics");
      await expect(orderPage.genLoc(orderPage.xpathTotalSalesNull)).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathTotalOrderNull)).toBeVisible();
    });

    await test.step(`Chuyển sang tab Member`, async () => {
      await orderPage.goto("admin/members");
      await expect(orderPage.genLoc(orderPage.getXpathWithLabel("You have no members yet"))).toBeVisible();
    });
  });

  test(`Verify checkout với các trường hợp Test mode cho shop Free Trial @SB_SC_SCSF_SCSFC_18`, async ({
    conf,
    token,
    dashboard,
    authRequest,
  }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.second_domain);
    orderPageAPI = new OrderAPI(conf.suiteConf.second_domain, authRequest);
    paymentProviderPage = new PaymentProviderPage(dashboard, conf.suiteConf.second_domain);
    checkoutPage = new CheckoutForm(dashboard, conf.suiteConf.second_domain);
    orderPage = new OrderPage(dashboard, conf.suiteConf.second_domain);
    orderPageAPI = new OrderAPI(conf.suiteConf.second_domain, authRequest);
    const paymentProviderAPI = new PaymentProviderAPI(conf.suiteConf.second_domain, authRequest);
    const accessToken = (
      await token.getWithCredentials({
        domain: conf.suiteConf.second_shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      })
    ).access_token;
    await dashboardPage.loginWithToken(accessToken);
    productPage = new ProductPage(dashboard, conf.suiteConf.second_domain);
    const productRequest = conf.suiteConf.product_request;
    await productPage.navigateToMenu("Products");
    await productPage.openAddProductScreen();
    await productPage.addNewProduct(productRequest.product.title, productRequest.product.product_type);
    await productPage.switchTab("Pricing");
    await productPage.selectPaymentType("One-time payment");
    await productPage.inputPrice(10);
    await productPage.clickSaveBar();
    await productPage.clickOnBtnWithLabel("Publish");
    numberOfOrderBefore = await orderPageAPI.getNumberOfOrder(accessToken);

    await test.step(`Kiểm tra trạng thái default của Test mode trong màn Payment Provider`, async () => {
      await paymentProviderPage.goto("admin/creator/settings/payments");
      await expect(paymentProviderPage.genLoc(paymentProviderPage.xpathToggleTestModeOn)).toBeVisible();
    });

    await test.step(`Thực hiện connect payment cho shop`, async () => {
      expect(await paymentProviderAPI.connectPaymentProvider(stripeKey, accessToken)).toEqual(stripeKey);
      await paymentProviderPage.goto("admin/creator/settings/payments");
      await expect(paymentProviderPage.genLoc(paymentProviderPage.xpathAlertProvider)).toBeVisible();

      await expect(paymentProviderPage.genLoc(paymentProviderPage.xpathButtonSelectPlan)).toBeVisible();
    });

    await test.step(`Click button "Select a plan"`, async () => {
      await paymentProviderPage.clickSelectPlanTestMode();
      expect(dashboard.url()).toEqual(`https://${conf.suiteConf.second_domain}/admin/pricing`);
    });

    await test.step(`View sale page của product "Test checkout free trial"`, async () => {
      await paymentProviderPage.goto(`products/${conf.caseConf.product_handle}`);
      await expect(checkoutPage.genLoc(checkoutPage.xpathAlertTestMode)).toBeVisible();
      await expect(checkoutPage.genLoc(`${checkoutPage.xpathLearnMore} and ${checkoutPage.xpathLink}`)).toBeVisible();
    });

    await test.step(`Thực hiện checkout với product "Test checkout free trial""`, async () => {
      await checkoutPage.enterEmail(conf.caseConf.email);
      await checkoutPage.completeOrderWithMethod("Stripe");
      await expect(checkoutPage.genLoc(checkoutPage.getXpathWithLabel("Thank you!"))).toBeVisible();
      await expect(checkoutPage.genLoc(checkoutPage.xpathCreateAccount)).toBeDisabled();
    });

    await test.step(`Chuyển sang tab Order > Xác nhận order mới nhất trong list`, async () => {
      await dashboardPage.goto("admin/creator/orders");
      const numberOfOrderAfterCompleteCheckout = await orderPageAPI.getNumberOfOrder(accessToken);
      expect(numberOfOrderAfterCompleteCheckout).toEqual(numberOfOrderBefore + 1);
    });

    await test.step(`Mở order detail của order test`, async () => {
      await orderPage.openNewestOrder();
      await expect(orderPage.genLoc(orderPage.xpathTestOrder)).toBeVisible();
    });

    await test.step(`Chuyển sang tab Analystic`, async () => {
      await dashboardPage.navigateToMenu("Analytics");
      await expect(orderPage.genLoc(orderPage.xpathTotalSalesNull)).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathTotalOrderNull)).toBeVisible();
    });

    await test.step(`Chuyển sang tab Member`, async () => {
      await dashboardPage.navigateToMenu("Members");
      await expect(orderPage.genLoc(orderPage.getXpathWithLabel("You have no members yet"))).toBeVisible();
    });

    await test.step(`Tắt toggle Test mode trong màn hình payment provider`, async () => {
      await paymentProviderPage.goto("admin/creator/settings/payments");
      await paymentProviderPage.changeStatusTestMode();
      await expect(paymentProviderPage.genLoc(paymentProviderPage.xpathToggleTestModeOff)).toBeVisible();
    });

    await test.step(`Xác nhận hiển thị của Payment state trong form checkout`, async () => {
      await paymentProviderPage.goto(`products/${conf.caseConf.product_handle}`);

      await expect(checkoutPage.genLoc(checkoutPage.xpathLearnMoreLinkText)).toBeVisible();
    });
  });

  test(`Validate Stripe card khi bật Test mode checkout @SB_SC_SCSF_SCSFC_24`, async ({
    authRequest,
    dashboard,
    conf,
  }) => {
    paymentProviderPage = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new CheckoutForm(dashboard, conf.suiteConf.domain);
    const productRequest = conf.suiteConf.product_request;
    const pricing = conf.caseConf.pricing;
    await productAPI.createProduct(productRequest);
    await productPage.navigateToMenu("Products");
    await productPage.clickTitleProduct(productRequest.product.title);
    await productPage.switchTab("Pricing");
    await expect(productPage.genLoc(productPage.xpathPricingType)).toBeVisible();
    await productPage.settingPricingTab(pricing.type, pricing.title, pricing.amount);

    await test.step(`Trong màn payment provider> Turn on toggle Test mode`, async () => {
      await paymentProviderPage.goto("admin/creator/settings/payments");
      await expect(paymentProviderPage.genLoc(paymentProviderPage.xpathToggleTestModeOn)).toBeVisible();
    });

    await test.step(`Thực hiện checkout với product "Checkout test mode" với card live > Click "Pay now"`, async () => {
      const card = conf.caseConf.card_live;
      await checkoutPage.goto(`products/${conf.caseConf.product_handle}`);
      const waitAlert = await checkoutPage.genLoc(checkoutPage.xpathAlertTestMode).isVisible();
      if (!waitAlert) {
        await checkoutPage.goto(`products/${conf.caseConf.product_handle}`);
      }
      await checkoutPage.enterEmail(conf.caseConf.email);
      await checkoutPage.completeInputCardInfo(card);
      await checkoutPage.clickBtnCompleteOrder();
      await expect(checkoutPage.genLoc(checkoutPage.xpathAlertNonTestCard)).toBeVisible();
    });
  });
});
