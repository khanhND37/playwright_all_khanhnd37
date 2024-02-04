import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { HivePBase } from "@pages/hive/hivePBase";
import { OrdersPage } from "@pages/dashboard/orders";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import type { CheckoutInfo } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardAPI } from "@pages/api/dashboard";
import { MailBox } from "@pages/thirdparty/mailbox";
import { SFCheckout } from "@pages/storefront/checkout";

let hivePBasePage: HivePBase;
let hivePbDomain: string;
let checkoutAPI: CheckoutAPI;
let checkoutInfo: CheckoutInfo;
let domainOption: string;
let orderNameOption: string;
let dashboardAPI: DashboardAPI;
let mailBox: MailBox;
let checkoutPage: SFCheckout;

test.describe("Order Printbase", () => {
  test.beforeEach(async ({ conf, hivePBase, authRequest, page }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
    hivePbDomain = conf.suiteConf.hive_pb_domain;
    hivePBasePage = new HivePBase(hivePBase, hivePbDomain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
    const productsCheckout = conf.caseConf.products_checkout;
    checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout });
    domainOption = conf.suiteConf.option_filter.domain;
    orderNameOption = conf.suiteConf.option_filter.order_name;
  });

  test("Verify order thuộc PBase sẽ sync lên Hive_pBase - @SB_OPB_1", async ({}) => {
    await test.step("Truy cập vào printBase Order trên Hive_Pbase", async () => {
      await hivePBasePage.goToOrderDetail(checkoutInfo.order.id, "pbase-order");
      await expect(await hivePBasePage.checkButtonVisible("Calculate")).toBeTruthy();
    });
  });

  test("Verify info order tại màn hình Manage Order list - @SB_OPB_2", async ({ conf }) => {
    await test.step("Tạo order trên Store PBase" + "Truy cập vào printBase Order trên Hive_Pbase", async () => {
      await hivePBasePage.goto("/admin/pbase-order/list");
      await hivePBasePage.filterDataByName([
        {
          value: `${checkoutInfo.order.name}`,
          name: orderNameOption,
        },
        {
          name: domainOption,
          value: `${conf.suiteConf.domain}`,
        },
      ]);
      const infoOrder = await hivePBasePage.getInfoProductInOrderList();
      expect(Number(infoOrder.orderValue).toFixed(3)).toEqual(checkoutInfo.totals.total_price.toFixed(3));
    });
  });

  test("Verify khi chọn Approve cho order- @SB_OPB_11", async ({ conf, dashboard }) => {
    await test.step("Truy cập vào printBase Order trên Hive_Pbase" + "Click order name", async () => {
      await hivePBasePage.goToOrderDetail(checkoutInfo.order.id, "pbase-order");
      await hivePBasePage.clickCalculateInOrder();
      await hivePBasePage.clickOnBtnWithLabel("Approve");
      const infoOrdersDetail = await hivePBasePage.getInfoProductInOrderDetail(conf.caseConf.order_detail);
      expect(infoOrdersDetail).toEqual(conf.caseConf.order_detail);

      await hivePBasePage.goto("/admin/pbase-order/list");
      await hivePBasePage.filterDataByName([
        {
          value: `${checkoutInfo.order.name}`,
          name: orderNameOption,
        },
        {
          name: domainOption,
          value: `${conf.suiteConf.domain}`,
        },
      ]);
      await hivePBasePage.page.waitForLoadState("networkidle");
      //check payment status manager order
      const infoOrder = await hivePBasePage.getInfoProductInOrderList();
      expect(infoOrder.paymentStatus).toEqual("paid");
      //check purchase status manager order
      expect(infoOrder.fulfillmentStatus).toEqual("processing");

      const orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      await orderPage.goToOrderByOrderId(checkoutInfo.order.id, "pbase");
      //check payment status in dashboard
      expect(await orderPage.getPaymentStatus()).toEqual("Paid");
      //check FULFILLMENT STATUS in dashboard
      expect(await orderPage.getFulfillmentStatusOrder()).toEqual("Processing");
    });
  });

  test("Verify button Hold trong order detail sau khi nhấn Approve Order- @SB_OPB_12", async ({}) => {
    await test.step(
      "Tạo order trên Store PBase" +
        "Truy cập vào printBase Order trên Hive_Pbase" +
        "Click order name" +
        "Click chọn Approved",
      async () => {
        await hivePBasePage.goToOrderDetail(checkoutInfo.order.id, "pbase-order");
        await hivePBasePage.clickCalculateInOrder();
        await hivePBasePage.clickOnBtnWithLabel("Approve");
        await hivePBasePage.page.waitForLoadState("networkidle");
        expect(await hivePBasePage.checkButtonVisible("Hold")).not.toBeTruthy();
      },
    );
  });

  test("Verify khi click vào button manual fulfill- @SB_OPB_15", async ({ conf }) => {
    await test.step(
      "Tạo order trên Store PBase" +
        "Truy cập vào printBase Order trên Hive_Pbase" +
        "Click order name" +
        "Click chọn Approved" +
        "Click BT manual fulfill",
      async () => {
        await hivePBasePage.goToOrderDetail(checkoutInfo.order.id, "pbase-order");
        await hivePBasePage.clickCalculateInOrder();
        await hivePBasePage.clickOnBtnWithLabel("Approve");
        const infoProductOrder = await hivePBasePage.getInfoProductInOrderDetail(conf.caseConf.order_detail);
        await hivePBasePage.clickOnTextLinkWithLabel("Manual fulfill");
        await hivePBasePage.page.waitForLoadState("networkidle");
        const infoProductOrderFulfill = await hivePBasePage.getInfoProductInManualFulfill(conf.caseConf.order_detail);
        expect(infoProductOrder).toEqual(infoProductOrderFulfill);
      },
    );
  });

  test("Verify send mail cho buyer khi click chọn checkbox Send notification- @SB_OPB_18", async ({ conf, page }) => {
    await test.step(
      "Tạo order trên Store PBase" +
        "Truy cập vào printBase Order trên Hive_Pbase" +
        "Click order name" +
        "Chọn checkbox send by email",
      async () => {
        checkoutPage = new SFCheckout(page, conf.suiteConf.domain);
        await hivePBasePage.goToOrderDetail(checkoutInfo.order.id, "pbase-order");
        await hivePBasePage.clickCalculateInOrder();
        await hivePBasePage.clickOnBtnWithLabel("Approve");
        await hivePBasePage.clickOnTextLinkWithLabel("Manual fulfill");
        await hivePBasePage.page.waitForLoadState("networkidle");
        await hivePBasePage.inputInformationOfOrderFulfill(conf.caseConf.order_fulfill);
        await hivePBasePage.clickOnBtnWithLabel("Mark as fulfilled");
        await hivePBasePage.page.waitForLoadState("networkidle");
        mailBox = await checkoutPage.openMailBox(checkoutInfo.info.email);
        const emailTitle = conf.suiteConf.text_order.replace("#pb_order", checkoutInfo.order.name);
        const emailID = await mailBox.getEmailIDBySubject(checkoutInfo.info.email, emailTitle);
        await expect(await mailBox.getHTMLByEmailID(checkoutInfo.info.email, emailID)).not.toBeUndefined();
      },
    );
  });
});

const caseName = "CHECKOUT_PRODUCT_IS_POST_PURCHASE";
const conf = loadData(__dirname, caseName);
test.describe("Verify Order Detail", () => {
  test.beforeEach(async ({ conf, hivePBase, authRequest, page }, testInfo) => {
    testInfo.snapshotSuffix = "";
    test.setTimeout(conf.suiteConf.timeout);
    hivePbDomain = conf.suiteConf.hive_pb_domain;
    hivePBasePage = new HivePBase(hivePBase, hivePbDomain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
  });

  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const testCase = conf.caseConf.data[i];
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, snapshotFixture }) => {
      const envRun = process.env.ENV;
      await test.step(
        "Tạo order trên Store PBase" + "Truy cập vào printBase Order trên Hive_Pbase" + "Click order name",
        async () => {
          const products = testCase.products_checkout;
          const orderDetail = testCase.order_detail;
          checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard(products);
          await hivePBasePage.goToOrderDetail(checkoutInfo.order.id, "pbase-order");
          await hivePBasePage.clickCalculateInOrder();
          //store info
          expect(await hivePBasePage.getInfoStore()).toEqual(conf.suiteConf.domain);
          const orderName = (await hivePBasePage.getOrderName()).split("|");
          expect(orderName[0].trim()).toEqual(checkoutInfo.order.name);
          //check shipping address
          await snapshotFixture.verify({
            page: hivePBasePage.page,
            selector: hivePBasePage.xpathInfoShipping,
            snapshotName: `${testCase.picture.name_info_shipping}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
          });
          const infoOrderDetail = await hivePBasePage.getInfoProductInOrderDetail(orderDetail);
          expect(infoOrderDetail).toEqual(orderDetail);
        },
      );
    });
  }
});

const caseNameOrderFulfill = "ORDER_FULFILL";
const confOrderFulfil = loadData(__dirname, caseNameOrderFulfill);
test.describe("Verify Fulfill orders", () => {
  test.beforeEach(async ({ conf, hivePBase, authRequest, page }, testInfo) => {
    testInfo.snapshotSuffix = "";
    test.setTimeout(conf.suiteConf.timeout);
    hivePbDomain = conf.suiteConf.hive_pb_domain;
    hivePBasePage = new HivePBase(hivePBase, hivePbDomain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
    domainOption = conf.suiteConf.option_filter.domain;
    orderNameOption = conf.suiteConf.option_filter.order_name;
  });

  confOrderFulfil.caseConf.data.forEach(testCase => {
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, dashboard }) => {
      await test.step(
        "Tạo order trên Store PBase" +
          "Truy cập vào printBase Order trên Hive_Pbase" +
          "Click order name" +
          "Click chọn Approved" +
          "Click BT manual fulfill",
        async () => {
          const productsCheckout = testCase.products_checkout;
          checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout });
          await hivePBasePage.goToOrderDetail(checkoutInfo.order.id, "pbase-order");
          await hivePBasePage.clickCalculateInOrder();
          await hivePBasePage.clickOnBtnWithLabel("Approve");
          await hivePBasePage.clickOnTextLinkWithLabel("Manual fulfill");
          await hivePBasePage.page.waitForLoadState("networkidle");
          await hivePBasePage.inputInformationOfOrderFulfill(testCase.order_fulfill);
          await hivePBasePage.clickOnBtnWithLabel("Mark as fulfilled");
          await hivePBasePage.page.waitForLoadState("networkidle");
          expect(await hivePBasePage.getTextContent(hivePBasePage.xpathTrackingNumber)).toEqual(
            `${testCase.order_fulfill.tracking_number}`,
          );
          expect(await hivePBasePage.getAttributeLink("href", hivePBasePage.xpathTrackingUrl)).toEqual(
            testCase.order_fulfill.tracking_url,
          );

          //check fulfillment status in hive admin
          await hivePBasePage.goto("/admin/pbase-order/list");
          await hivePBasePage.filterDataByName([
            {
              value: `${checkoutInfo.order.name}`,
              name: orderNameOption,
            },
            {
              name: domainOption,
              value: `${conf.suiteConf.domain}`,
            },
          ]);
          await hivePBasePage.page.waitForLoadState("networkidle");
          const fulfillmentStatus = await hivePBasePage.getInfoProductInOrderList();
          expect(fulfillmentStatus.fulfillmentStatus).toEqual(testCase.fulfillment_status_hive);

          //check fulfillment status in dashboard
          const orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
          await orderPage.goToOrderByOrderId(checkoutInfo.order.id, "pbase");
          expect(await orderPage.getFulfillmentStatusOrder()).toEqual(testCase.status_fulfill_dashboard);
        },
      );
    });
  });
});

const caseNameOrderDiscount = "CHECKOUT_PRODUCT_IS_DISCOUNT";
const confOrderDiscount = loadData(__dirname, caseNameOrderDiscount);
let orderId: number;

test.describe("Verify display available orders", () => {
  test.beforeEach(async ({ conf, authRequest, hivePBase, page }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
    hivePbDomain = conf.suiteConf.hive_pb_domain;
    hivePBasePage = new HivePBase(hivePBase, hivePbDomain);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
  });

  confOrderDiscount.caseConf.data.forEach(testCase => {
    const productCheckoutInfo = testCase.products_checkout;
    test(`${testCase.title} @${testCase.case_id}`, async ({ dashboard, authRequest, snapshotFixture }) => {
      const envRun = process.env.ENV;
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard(productCheckoutInfo);
      orderId = checkoutInfo.order.id;
      await hivePBasePage.goToOrderDetail(orderId, "pbase-order");
      await hivePBasePage.clickCalculateInOrder();
      const orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      await orderPage.goToOrderByOrderId(orderId, "pbase");

      await test.step("Tạo order trên Store PBase" + "Click vào order vừa tạo", async () => {
        expect(await orderPage.getFulfillmentStatusOrder()).toEqual("Unfulfilled");
        await orderPage.page.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: orderPage.page,
          selector: orderPage.xpathOrderSummary,
          snapshotName: `${testCase.picture.image_order_summary}_${envRun}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
        await orderPage.waitForProfitCalculated();
        await orderPage.clickShowCalculation();
        dashboardAPI = new DashboardAPI(conf.suiteConf.domain, authRequest);
        const caculateProfitInfos = await dashboardAPI.getInfoCalculateProfitByAPI(orderId);
        const calculateProfit = await dashboardAPI.calculateProfitPrintbase(caculateProfitInfos);
        const revenue = Number(removeCurrencySymbol(await orderPage.getRevenue())).toFixed(2);
        expect(revenue).toEqual(Number(await orderPage.calculateRevenuePbase()).toFixed(2));

        const paymentFee = Number(calculateProfit.payment_fee.toFixed(2));
        const processingFee = Number(calculateProfit.processing_fee.toFixed(2));
        const handlingFee = Number(processingFee + paymentFee).toFixed(2);
        expect(Number(removeCurrencySymbol(await orderPage.getHandlingFee()))).toEqual(Number(handlingFee));

        const profit = Number(calculateProfit.profit.toFixed(2));
        expect(Number(removeCurrencySymbol(await orderPage.getProfit()))).toEqual(profit);
      });
    });
  });
});
