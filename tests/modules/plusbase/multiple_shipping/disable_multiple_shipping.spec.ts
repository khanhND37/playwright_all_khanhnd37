import { AccessTokenHeaderName, DefaultUserAgent, UserAgentHeaderName } from "@core/constant";
import { removeCurrencySymbol } from "@core/utils/string";
import { test } from "@fixtures/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { SettingShipping } from "@pages/dashboard/setting_shipping";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { expect, APIRequestContext, request } from "@playwright/test";
import { OdooService } from "@services/odoo";
import type { Card, ShippingAddress, ShippingMethod } from "@types";
import { loadData } from "@core/conf/conf";
import { SettingShippingAPI } from "@pages/api/setting_shipping_api";
import { convertDaysToWeeks } from "@utils/checkout";

test.describe("Disable multiple shipping for PlusBase @SB_PLB_MSV", async () => {
  let shopDomain: string;
  let country: string;
  let defaultShippingMethods: Array<string>;
  let productName: string;
  let inputCustomerInfo: ShippingAddress;
  let sfShippingMethods: Array<ShippingMethod>;
  let cartInfo: Card;
  let ownerId: number;

  let dashboardTemplatePage: DashboardPage;
  let dashboardPage: DashboardPage;
  let settingShipping: SettingShipping;
  let ordersPageTemplate: OrdersPage;
  let fulfillmentPage: FulfillmentPage;
  let ordersPage: OrdersPage;
  let sfHomePage: SFHome;
  let sbcnProductId: number;
  let shippingTypes: Array<string>;
  let authRequest: APIRequestContext;
  let shippingSettingApi: SettingShippingAPI;

  test.beforeEach(async ({ conf, browser, odoo }) => {
    test.setTimeout(conf.suiteConf.timeout);
    shopDomain = conf.suiteConf.domain;
    country = conf.suiteConf.country;
    defaultShippingMethods = conf.suiteConf.default_shipping_methods;
    productName = conf.suiteConf.product_name;
    inputCustomerInfo = conf.suiteConf.customer_info;
    sfShippingMethods = conf.suiteConf.sf_shipping_methods;
    cartInfo = conf.suiteConf.card_info;
    ownerId = conf.suiteConf.owner_id;
    shippingTypes = conf.suiteConf.shipping_types;
    sbcnProductId = conf.suiteConf.sbcn_product_id;

    const context = await browser.newContext({
      userAgent: DefaultUserAgent,
    });
    const page = await context.newPage();
    const sfPage = await context.newPage();
    const dbPage = await context.newPage();
    dashboardTemplatePage = new DashboardPage(page, conf.suiteConf.plb_template.domain);
    const plbTemplateToken = await dashboardTemplatePage.getAccessToken({
      shopId: conf.suiteConf.plb_template.shop_id,
      userId: conf.suiteConf.plb_template.user_id,
      baseURL: conf.suiteConf.api,
      username: conf.suiteConf.plb_template.username,
      password: conf.suiteConf.plb_template.password,
    });
    await dashboardTemplatePage.loginWithToken(plbTemplateToken);

    dashboardPage = new DashboardPage(dbPage, shopDomain);
    const shopToken = await dashboardPage.getAccessToken({
      shopId: conf.suiteConf.shop_id,
      userId: conf.suiteConf.user_id,
      baseURL: conf.suiteConf.api,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    await dashboardPage.loginWithToken(shopToken);
    ordersPage = new OrdersPage(dashboardPage.page, shopDomain);
    settingShipping = new SettingShipping(dashboardPage.page, shopDomain);
    ordersPageTemplate = new OrdersPage(dashboardTemplatePage.page, conf.suiteConf.plb_template.domain, true);
    fulfillmentPage = new FulfillmentPage(dashboardTemplatePage.page, conf.suiteConf.plb_template.domain);
    authRequest = await request.newContext({
      extraHTTPHeaders: {
        [AccessTokenHeaderName]: shopToken,
        [UserAgentHeaderName]: DefaultUserAgent,
      },
    });
    shippingSettingApi = new SettingShippingAPI(shopDomain, authRequest);
    sfHomePage = new SFHome(sfPage, shopDomain);

    const odooService = OdooService(odoo);
    const shippingInfos = await odooService.updateThenGetShippingDatas(sbcnProductId, shippingTypes, "US");
    sfShippingMethods.map((sfShippingMethod: ShippingMethod) => {
      const shippingInfo = shippingInfos.get(sfShippingMethod.method_title);
      if (shippingInfo) {
        const extractedShipping = /(\d+) *?- *?(\d+) +business days/g.exec(shippingInfo.eta_delivery_time);
        sfShippingMethod.amount = shippingInfo.first_item_fee;
        if (extractedShipping[1] && extractedShipping[2]) {
          sfShippingMethod.min_only_shipping_time = Number(extractedShipping[1]);
          sfShippingMethod.max_only_shipping_time = Number(extractedShipping[2]);
        }
      }
      return sfShippingMethod;
    });
    await shippingSettingApi.deleteAllShippingZone();
    await shippingSettingApi.createShippingZone(conf.suiteConf.shipping_zones);
  });

  const conf = loadData(__dirname, "SB_PLB_MSV");

  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      shipping_checkout: shippingCheckout,
      desc,
      disable_shippings: disableShippings,
      carrier,
      update_shipping_types: updateShippingTypes,
      verify_tooltip: verifyTooltip,
    }) => {
      test(`@${caseId} ${desc}`, async ({ odoo }) => {
        let orderName: string;
        let orderId: number;
        let sfCheckoutPage: SFCheckout;
        let sfShippingMethod: ShippingMethod;
        const odooService = OdooService(odoo);

        await test.step("Settings > Shipping > Edit shipping zone> Verify block shipping method", async () => {
          if (updateShippingTypes) {
            await odooService.updateShippingTypeProductTemplate(sbcnProductId, updateShippingTypes);
          }
          await settingShipping.goToSettingShippingZone();
          await settingShipping.clickEditShippingZoneByCountry(country);
          for await (const shippingName of defaultShippingMethods) {
            await settingShipping.checkStatusShippingMethod(shippingName, true);
          }
          for await (const shippingName of disableShippings) {
            await settingShipping.switchStatusShippingMethod(shippingName);
          }

          if (disableShippings.length) {
            const isCheck = await settingShipping.isTextVisible("Save changes");
            if (isCheck) {
              await settingShipping.clickOnBtnWithLabel("Save changes");
            }
          }

          if (verifyTooltip) {
            await settingShipping.hoverTooltipShippingMethodShippingZone();
            expect(await settingShipping.isVisibleTooltipShippingMethodShippingZone()).toBeTruthy();
          }

          sfShippingMethod = sfShippingMethods.find(method => method.method_title === shippingCheckout);
        });

        await test.step("Mở storefront > Search product > Add to cart > checkout > Nhập infor customer > Verify line ship hiển thị", async () => {
          await sfHomePage.gotoHomePage();
          await sfHomePage.selectStorefrontCurrencyV2("United States", "inside");
          const sfProductpage = await sfHomePage.searchThenViewProduct(productName);
          await sfProductpage.addToCart();
          sfCheckoutPage = await sfProductpage.navigateToCheckoutPage();
          await sfCheckoutPage.enterShippingAddress(inputCustomerInfo);
          await sfCheckoutPage.verifyShippingMethodOnPage(
            sfShippingMethods.filter(sm => !disableShippings.includes(sm.method_title)),
            { package: "plusbase" },
          );
        });

        await test.step(`Chọn ${shippingCheckout} > Nhập thẻ thanh toán > Place Your Order >Verify màn thank you page`, async () => {
          await sfCheckoutPage.selectShippingMethod(sfShippingMethod.method_title);
          await sfCheckoutPage.completeOrderWithMethod("Stripe", cartInfo);
          const shippingMethod = await sfCheckoutPage.getShippingMethodOnThankYouPage({ etaIncluded: true });
          if (shippingMethod.includes(`business days`)) {
            expect(shippingMethod).toEqual(
              `${sfShippingMethod.method_title} (${sfShippingMethod.min_only_shipping_time} - ${sfShippingMethod.max_only_shipping_time} business days)`,
            );
          } else {
            expect(shippingMethod).toEqual(
              `${sfShippingMethod.method_title} (${convertDaysToWeeks(
                sfShippingMethod.min_only_shipping_time,
              )} - ${convertDaysToWeeks(sfShippingMethod.max_only_shipping_time)} weeks)`,
            );
          }
          const shippingFee = await sfCheckoutPage.getShippingFeeOnOrderSummary();
          expect(Number(shippingFee)).toEqual(sfShippingMethod.amount);
          orderName = await sfCheckoutPage.getOrderName();
          orderId = await sfCheckoutPage.getOrderIdBySDK();
        });

        await test.step("Vào dashboard > Search order name vừa tạo > Vào order detail > Verify shipping cost và shipping fee", async () => {
          await ordersPage.goToOrderByOrderId(orderId);
          await ordersPage.waitForProfitCalculated();
          await ordersPage.clickShowCalculation();
          const shippingCost = Number(removeCurrencySymbol(await ordersPage.getShippingCost()));
          const shippingFee = Number(removeCurrencySymbol(await ordersPage.getShippingFee()));
          expect(shippingCost).toEqual(sfShippingMethod.amount);
          expect(shippingFee).toEqual(sfShippingMethod.amount);
        });

        await test.step("Vào dashboard store template > Order > Search Order theo order name lấy được ở màn thank you page > Vào order detail", async () => {
          await ordersPageTemplate.goToOrderStoreTemplateByOrderId(orderId);
          const paymentStatus = await ordersPageTemplate.getPaymentStatus();
          expect(paymentStatus).toEqual("Authorized");
          const fulfillmentStatus = await ordersPageTemplate.getFulfillmentStatusOrder();
          expect(fulfillmentStatus).toEqual("Unfulfilled");
        });

        await test.step("Click More actions > Approve order > Confirm", async () => {
          await ordersPageTemplate.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
        });

        await test.step("Click PlusHub > click tắt filter Time since created > Veriry shipping method ở màn To fulfill", async () => {
          await dashboardTemplatePage.goToPlusHubFulfillment({ dirrect: true });
          await fulfillmentPage.searchOrderInFulfillOrder(orderName);
          const shippingMethodTitle = await fulfillmentPage.getFirstFulfillmentShippingMethod(orderName);
          expect(shippingMethodTitle).toEqual(carrier);
        });

        await test.step("Chọn order > Fulfill selected orders > Confirm", async () => {
          await fulfillmentPage.selectOrderToFulfillByOrderName(orderName);
          await fulfillmentPage.clickFulfillSelectedOrder({ onlySelected: true });
          await fulfillmentPage.clickButton("Confirm");
        });

        await test.step("Login odoo > Inventory > Receipts > Search PO theo PO name > Vào detail > Validate > Apply", async () => {
          await odooService.waitStockPickingCreated({
            productName: productName,
            orderName,
            name: "WH/OUT",
          });
          const stockPickings = await odooService.getStockPickingsByConditions({
            fields: ["name", "state"],
            productName: productName,
            ownerId: ownerId,
            limit: 1,
            name: "WH/IN",
          });
          expect(stockPickings.length).toEqual(1);

          if (stockPickings[0].state === "assigned") {
            await odooService.doneStockPicking(stockPickings[0].id);
          }
          const stockPickingsAfterDone = await odooService.getStockPickingsByConditions({
            id: stockPickings[0].id,
            fields: ["state"],
          });
          expect(stockPickingsAfterDone.length).toEqual(1);
          expect(stockPickingsAfterDone[0].state).toEqual("done");
        });

        await test.step("Inventory > Delivery Orders > Search theo order name > Vào Do-out detail > Check Availability > Verify shipping code và shipping method > Validate > Apply > Load lại trang", async () => {
          const doOuts = await odooService.getStockPickingsByConditions({
            productName: productName,
            orderName,
            limit: 1,
            fields: ["carrier_id", "x_carrier_code"],
            name: "WH/OUT",
          });

          expect(doOuts.length).toEqual(1);
          await odooService.checkAvailabilityStockPicking(doOuts[0].id);
          await odooService.updateTknForDeliveryOrder(doOuts[0].id, conf.suiteConf.tracking_number);
          await odooService.doneStockPicking(doOuts[0].id);
          expect(doOuts[0].carrier_id[1].trim()).toEqual(carrier);
        });

        await test.step("Vào store merchant > orders > search order theo name > Vào order detail > Verify order detail", async () => {
          await ordersPage.goToOrderByOrderId(orderId);
          const paymentStatus = await ordersPage.getPaymentStatus();
          expect(paymentStatus).toEqual("Paid");
          let isFulfilled = false;
          for (let i = 0; i < 5; i++) {
            const fulfillmentStatus = await ordersPage.getFulfillmentStatusOrder();
            if (fulfillmentStatus === "Fulfilled") {
              isFulfilled = true;
              break;
            }
            await ordersPage.page.reload();
          }
          expect(isFulfilled).toBeTruthy();
        });
      });
    },
  );
});
