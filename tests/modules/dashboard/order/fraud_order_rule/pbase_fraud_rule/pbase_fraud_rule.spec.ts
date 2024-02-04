import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { removeCurrencySymbol } from "@core/utils/string";
import { isEqual } from "@core/utils/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { OrderAPI } from "@pages/api/order";
import { buildOrderTimelineMsg } from "@utils/checkout";
import { HivePBase } from "@pages/hive/hivePBase";
import type { FraudInfo } from "@types";
import { loadData } from "@core/conf/conf";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";

test.describe(`[Pbase] Kiểm tra luồng cancel order do fraud rule`, () => {
  let domain, email, productInfo, discountCode, tippingInfo, firstName, orderName, hiveInfo;
  let lastName, shopId, gatewayCode, accessTokenShopTemp, shopTempInfo, customerInfo, orderAffectBefore;
  let orderId: number;
  let dashboardAPI: DashboardAPI;
  let hiveSbase: HiveSBaseOld;
  let orderTempAPI: OrderAPI;
  let orderPage: OrdersPage;
  let fraudRule: FraudInfo;
  let checkout: SFCheckout;

  const caseName = "FRAUD_RULE_CASE_CANCEL";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      fraud_info: fraudInfo,
      is_tax_include: isTaxInclude,
      payment_method: paymentMethod,
      case_description: caseDescription,
    }) => {
      test(`@${caseID} - ${caseDescription}`, async ({ page, conf, request, token, authRequest, dashboard }) => {
        await test.step(`Pre-condition`, async () => {
          // Get data from config
          shopTempInfo = conf.suiteConf.shop_template_info;
          customerInfo = conf.suiteConf.customer_info;
          discountCode = conf.suiteConf.discount_code;
          tippingInfo = conf.suiteConf.tipping_info;
          productInfo = conf.suiteConf.product_info;
          firstName = customerInfo.first_name;
          hiveInfo = conf.suiteConf.hive_info;
          lastName = customerInfo.last_name;
          shopId = conf.suiteConf.shop_id;
          domain = conf.suiteConf.domain;
          email = customerInfo.email;

          //Set time out
          test.setTimeout(200 * 1000);

          //Declare page
          dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest, dashboard);
          orderTempAPI = new OrderAPI(shopTempInfo.domain, request);
          orderPage = new OrdersPage(dashboard, domain);
          checkout = new SFCheckout(page, domain, "", request);

          const shopTemplateToken = await token.getWithCredentials({
            domain: shopTempInfo.shop_name,
            username: shopTempInfo.username,
            password: shopTempInfo.password,
          });
          accessTokenShopTemp = shopTemplateToken.access_token;

          //Update tax setting: include or exclude tax
          dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: isTaxInclude });

          /* Disable cause of this step use for commented step below
          //Get total profit and total order before checkout
          const analyticsInfo = await dashboardAPI.getTotalProfitsByShopId(shopId);
          totalProfitBefore = await analyticsInfo.total_profit;
          totalOrderBefore = await analyticsInfo.total_order;
          */

          //Get order affect value of matched fraud rule before checkout
          fraudRule = await orderTempAPI.getFraudOrderRuleInfo(fraudInfo.name, accessTokenShopTemp);
          orderAffectBefore = fraudRule.orders_affected;
        });

        await test.step(`
          - Tại Storefront > Add product vào cart và navigate tới checkout page
          - Apply Tipping, Discount vào order
          - Checkout order với cổng Stripe`, async () => {
          //Add product to cart and navigate to checkout page
          await checkout.addToCartThenGoToShippingMethodPage(productInfo, customerInfo);
          //Apply discount, Add tip then complete order
          await checkout.applyDiscountCode(discountCode);
          await checkout.addTip(tippingInfo);
          //Get gateway code
          gatewayCode = await checkout.getTypeOfStripeCreditCardMethod();
          await checkout.completeOrderWithMethod(paymentMethod);

          const isThankyouPage = await checkout.isThankyouPage();

          //Expect checkout success
          expect(isThankyouPage).toBe(true);
          orderName = await checkout.getOrderName();
          orderId = await checkout.getOrderIdBySDK();
        });

        await test.step(`
          - Tại Dashboard
          - Vào order detail của order vừa tạo
          - Kiểm tra Order status
          - Kiểm tra profit
          - Kiểm tra order timeline`, async () => {
          await orderPage.goToOrderByOrderId(orderId, "pbase");

          let orderStatus = await orderPage.getOrderStatus();
          //Cause sometimes order profit get slower than usual
          orderStatus = await orderPage.reloadUntilOrdCapture(orderStatus);
          expect(orderStatus).toEqual("Voided");

          //verify profit
          let actProfit = await orderPage.getProfit();
          actProfit = removeCurrencySymbol(actProfit);
          expect(isEqual(parseFloat(actProfit), 0, 0.01)).toEqual(true);

          //verify timeline
          const ordTimeline = buildOrderTimelineMsg(firstName, lastName, email);
          const ordTimelineSentMailCancel = ordTimeline.timelineSentCancelMailPbase;
          const ordTimelineFraudRuleCancelOrd = ordTimeline.timelineFraudRuleCancelOrder;
          await expect(await orderPage.orderTimeLines(ordTimelineSentMailCancel)).toBeVisible();
          await expect(await orderPage.orderTimeLines(ordTimelineFraudRuleCancelOrd)).toBeVisible();
        });

        await test.step(`
          - Tại Action dropdown
          - Click View invoice
          - Kiểm tra các invoice của order`, async () => {
          // verify invoice transaction
          await orderPage.viewInvoice();
          const listTransAmt = await dashboardAPI.getOrderTransAmt();
          let totalTransAmt = 0;
          for (let i = 0; i < listTransAmt.length; i++) {
            totalTransAmt += listTransAmt[i];
          }
          expect(isEqual(totalTransAmt, 0, 0.01)).toEqual(true);
        });

        await test.step(`
          - Tại Dashboard của shop fraud template
          - Vào Order page
          - Vào Fraud filter
          - Kiểm tra giá trị order affected của Rule mà order thỏa mãn`, async () => {
          //Get order affect value of matched fraud rule after checkout
          fraudRule = await orderTempAPI.getFraudOrderRuleInfo(fraudInfo.name, accessTokenShopTemp);
          const orderAffectAfter = fraudRule.orders_affected;
          //Verify order affected after checkout is increased 1 unit
          expect(orderAffectAfter).toEqual(orderAffectBefore + 1);
        });

        /* API analytics need a few minute to return correct data. But recently it's not stable
        I mean adding hard step wait timeout is not stable and lengthen test case.
        Then disable this step for suitable solution
        await test.step(`
          - Vào Analytics Page
          - Kiểm tra giá trị Total profit`, async () => {
          // verify total profit and total order after cancel order
          // api analytics need a few minute to return correct data. in case will wait 1 minute
          // eslint-disable-next-line playwright/no-wait-for-timeout
          await page.waitForTimeout(60000);
          const analyticsInfo = await dashboardAPI.getTotalProfitsByShopId(shopId);
          const totalProfitAfter = await analyticsInfo.total_profit;
          const totalOrderAfter = await analyticsInfo.total_order;
          expect(totalOrderAfter).toEqual(totalOrderBefore + 1);
          expect(isEqual(totalProfitAfter, totalProfitBefore, 0.01)).toEqual(true);
        });
        */

        //In case of order checkout via Shopbase payment gateway, we need to verify order fraud infomation on Hive
        if (gatewayCode === "platform" && paymentMethod !== "Paypal") {
          await test.step(`
            - Vào Hive shopbase
            - Tại mục Spay 
            - Click vào Review Order
            - Filter theo shopid
            - Tại line order vừa tạo 
            - Kiểm tra giá trị hiển thị tại cột Fraud Analysis`, async () => {
            hiveSbase = new HiveSBaseOld(page, hiveInfo.domain);
            await hiveSbase.loginToHiveShopBase({ account: hiveInfo.username, password: hiveInfo.password });
            await hiveSbase.goToReviewOrder();
            await hiveSbase.filterSpayOrder(shopId, orderName);
            const expFraudStt = await hiveSbase.getFraudStatus(orderName);
            expect(expFraudStt).toEqual("true");
          });

          await test.step(`
            - Click vào block: True 
            - Chọn section: Fraud filter
            - Kiểm tra hiển thị Fraud rule`, async () => {
            await hiveSbase.openFraudFilterPopupOfOrder(orderName);
            const actFraudRuleMatched = await hiveSbase.getFraudRuleMatched(orderId);
            const expFraudRuleMatched = `- ` + fraudInfo.type + ` : ` + fraudInfo.name;
            expect(actFraudRuleMatched).toContain(expFraudRuleMatched);
          });
        }
      });
    },
  );
});

test.describe(`[Pbase] Kiểm tra luồng approve order do fraud rule`, () => {
  let domain, productInfo, discountCode, tippingInfo;
  let hivePbaseInfo, accessTokenShopTemp, shopTempInfo, customerInfo, orderAffectBefore, fraudInfo;
  let orderId: number;
  let dashboardAPI: DashboardAPI;
  let orderTempAPI: OrderAPI;
  let orderPage: OrdersPage;
  let fraudRule: FraudInfo;
  let checkout: SFCheckout;
  let hivePbase: HivePBase;
  let orderApi: OrderAPI;

  test.beforeEach(async ({ page, conf, request, token, authRequest, dashboard }) => {
    // Get data from config
    domain = conf.suiteConf.domain;
    tippingInfo = conf.suiteConf.tipping_info;
    productInfo = conf.suiteConf.product_info;
    discountCode = conf.suiteConf.discount_code;
    hivePbaseInfo = conf.suiteConf.hive_pbase_info;
    shopTempInfo = conf.suiteConf.shop_template_info;

    fraudInfo = conf.caseConf.fraud_info;
    customerInfo = conf.caseConf.customer_info;
    const isTaxInclude = conf.caseConf.is_tax_include;

    // Set time out
    test.setTimeout(200 * 1000);

    //Declare page
    dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest, page);
    orderTempAPI = new OrderAPI(shopTempInfo.domain, request);
    checkout = new SFCheckout(page, domain, "", request);
    hivePbase = new HivePBase(page, hivePbaseInfo.domain);
    orderApi = new OrderAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);

    const shopTemplateToken = await token.getWithCredentials({
      domain: shopTempInfo.shop_name,
      username: shopTempInfo.username,
      password: shopTempInfo.password,
    });
    accessTokenShopTemp = shopTemplateToken.access_token;

    //Update tax setting: include or exclude tax
    dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: isTaxInclude });

    //Get order affect value of matched fraud rule before checkout
    fraudRule = await orderTempAPI.getFraudOrderRuleInfo(fraudInfo.name, accessTokenShopTemp);
    orderAffectBefore = fraudRule.orders_affected;
  });

  test(`@SB_ORD_FRA_FIL_ORD_RULE_22 - [Pbase] Kiểm tra approve order thỏa mãn fraud rules allow`, async () => {
    await test.step(`
      - Tại Storefront > Add product vào cart và navigate tới checkout page
      - Apply Tipping, Discount vào order
      - Checkout order với cổng Stripe`, async () => {
      //Add product to cart and navigate to checkout page
      await checkout.addToCartThenGoToShippingMethodPage(productInfo, customerInfo);
      //Apply discount, Add tip then complete order
      await checkout.applyDiscountCode(discountCode);
      await checkout.addTip(tippingInfo);
      await checkout.completeOrderWithMethod();

      orderId = await checkout.getOrderIdBySDK();
      const isThankyouPage = await checkout.isThankyouPage();

      //Expect checkout success
      expect(isThankyouPage).toBe(true);
    });

    await test.step(`
      - Tại Dashboard
      - Vào order detail của order vừa tạo
      - Kiểm tra Order status
      - Kiểm tra profit`, async () => {
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const orderStatus = await orderPage.getOrderStatus();

      //cause sometimes order profit get slower than usual
      expect(orderStatus).toEqual("Authorized");

      //verify profit
      const profit = await orderApi.getOrderProfit(orderId, "printbase");
      // const profit = await orderPage.getProfit();
      expect(profit).toBeGreaterThan(0.01);
    });

    await test.step(`
      - Vào Hive-pbase
      - Chọn Customer support
      - Chọn Pbase order
      - Chọn Order pbase vừa checkout (Có thể mở 1 order bất kỳ rồi thay order id của order vừa checkout vào Link Url)
      - Click Approve order
      - Quay lại order detail trên dashboard của order vừa approve
      - Kiểm tra Order Status`, async () => {
      await hivePbase.loginToHivePrintBase(hivePbaseInfo.username, hivePbaseInfo.password);
      await hivePbase.goToOrderDetail(orderId, "pbase-order");
      await hivePbase.approveOrder();

      //Open order detail page then verify order status is Paid
      await orderPage.goToOrderByOrderId(orderId, "pbase");
      const orderStatus = await orderPage.getOrderStatus();
      expect(orderStatus).toEqual("Paid");
    });

    await test.step(`
    - Tại Dashboard của shop fraud template
    - Vào Order page
    - Vào Fraud filter
    - Kiểm tra giá trị order affected của Rule mà order thỏa mãn`, async () => {
      //Get order affect value of matched fraud rule after checkout
      fraudRule = await orderTempAPI.getFraudOrderRuleInfo(fraudInfo.name, accessTokenShopTemp);
      const orderAffectAfter = fraudRule.orders_affected;
      //Verify order affected after checkout is increased 1 unit
      expect(orderAffectAfter).toEqual(orderAffectBefore + 1);
    });
  });
});
