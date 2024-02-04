import { expect, request } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { test } from "@fixtures/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { OrderAPI } from "@pages/api/order";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import type { Product } from "@types";
import { CheckoutInfo } from "@types";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { HiveBalance } from "@pages/hive/hive_balance";

let domain: string;
let checkoutAPI: CheckoutAPI;
let ordersPage: OrdersPage;
let infoProduct: Product;

test.describe("Balance flow", async () => {
  let tplShopDomain: string;
  let plbToken: string;
  let hiveSbase: HiveSBaseOld;
  let hiveBalance: HiveBalance;

  test.beforeAll(async ({ conf, browser, hiveSBase }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    tplShopDomain = conf.suiteConf.plb_template.domain;
    const tplDashboardPage = new DashboardPage(page, tplShopDomain);
    hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    infoProduct = conf.suiteConf.info_product;

    plbToken = await tplDashboardPage.getAccessToken({
      shopId: conf.suiteConf.plb_template["shop_id"],
      userId: conf.suiteConf.plb_template["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf.plb_template["username"],
      password: conf.suiteConf.plb_template["password"],
    });
  });

  test.beforeEach(async ({ conf, browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    hiveSbase = new HiveSBaseOld(page, conf.suiteConf.hive_domain);

    await hiveSbase.loginToHiveShopBase({
      account: conf.suiteConf.hive_username,
      password: conf.suiteConf.hive_password,
    });

    await hiveBalance.goToBalanceByUserId(conf.suiteConf.user_id, conf.suiteConf.email, "convert-holding");

    // check user info to make sure the conversion keeps the correct user check
    expect(await hiveBalance.getInforConvertHolding(`ID`)).toEqual(`ID: #${conf.suiteConf.user_id}`);
    expect(await hiveBalance.getInforConvertHolding(`User`)).toEqual(`User: ${conf.suiteConf.username}`);

    await hiveBalance.convertHoldingAmount("plusbase", conf.suiteConf.user_id, conf.suiteConf.username);
  });
  test(`@SB_ORD_RP_20 Verify luồng tiền trong balance từ khi có order đến khi order capture thành công`, async ({
    conf,
    scheduler,
    authRequest,
  }) => {
    let checkoutInfo: CheckoutInfo;
    const balanceAPI = new BalanceUserAPI(domain, authRequest);

    await test.step(`Search product > Add to cart > Checkout`, async () => {
      // get data balance before create order
      // const balanceData = await balanceAPI.getDataBalance();
      await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: [infoProduct] });
      checkoutInfo = await checkoutAPI.getCheckoutInfo();

      expect(checkoutInfo.order.id).toBeGreaterThan(0);
    });

    await test.step(`Vào dashboard > vào order detail order vừa tạo > Verify profit order`, async () => {
      await ordersPage.goToOrderByOrderId(checkoutInfo.order.id);

      // set orderId to 0 to create new order if this test case is re-run

      await scheduler.clear();
      await ordersPage.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await ordersPage.getBaseCost()));
      const shippingFee = Number(removeCurrencySymbol(await ordersPage.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await ordersPage.getSubtotalOrder()));
      const total = Number(removeCurrencySymbol(await ordersPage.getTotalOrder()));
      const tip = Number(removeCurrencySymbol(await ordersPage.getTip()));
      let totalDiscount = 0;
      if (conf.caseConf.is_discount) {
        totalDiscount = Number(removeCurrencySymbol((await ordersPage.getDiscountVal()).replace("-", "")));
      }
      const shippingCost = Number(removeCurrencySymbol(await ordersPage.getShippingCost()));
      const tax = Number(removeCurrencySymbol(await ordersPage.getTax()));

      ordersPage.calculateProfitPlusbase(
        total,
        subtotal,
        totalDiscount,
        baseCost,
        shippingCost,
        shippingFee,
        tax,
        tip,
        conf.suiteConf.payment_fee_rate,
        conf.suiteConf.processing_fee_rate,
      );

      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual).toEqual(Number(ordersPage.profit.toFixed(2)));
      const balanceData = await balanceAPI.getDataBalance();
      expect(balanceData.available_soon).toEqual(balanceData.available_soon + profitActual);
    });

    await test.step(`Vào balance > Check invoice `, async () => {
      // fill your code here
      const orderApi = new OrderAPI(conf.suiteConf.domain, authRequest);
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
      expect(invoiceData.amount_cent).toEqual(Number(ordersPage.profit.toFixed(2)) * 100);
    });

    await test.step(`Thực hiện capture order > Check balance`, async () => {
      const context = await request.newContext();
      const tplOrderAPI = new PlusbaseOrderAPI(tplShopDomain, context);
      // approve order ~> capture order
      await tplOrderAPI.approveOrderByApi(checkoutInfo.order.id, plbToken);
      await ordersPage.page.reload();
      expect(await ordersPage.getPaymentStatus()).toEqual("Paid");
      await hiveBalance.convertHoldingAmount("plusbase", conf.suiteConf.user_id, conf.suiteConf.username);
      const balanceData = await balanceAPI.getDataBalance();

      // verify balance after capture
      expect(balanceData.available_soon).toEqual(balanceData.available_soon);
      expect(balanceData.available_payout).toEqual(balanceData.available_payout + Number(ordersPage.profit.toFixed(2)));
      expect(balanceData.available_amount).toEqual(balanceData.available_amount + Number(ordersPage.profit.toFixed(2)));
    });
  });
});
