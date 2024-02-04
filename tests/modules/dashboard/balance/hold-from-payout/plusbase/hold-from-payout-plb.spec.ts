import { expect, test } from "@core/fixtures";
import { formatDate } from "@core/utils/datetime";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { TransactionPage } from "@pages/dashboard/transaction";
import { APIRequestContext } from "@playwright/test";
import { CheckoutInfo, DataHoldFromPayout, Product } from "@types";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { isEqual } from "@core/utils/checkout";

let plbToken: string;
let plbTemplateDashboardPage: DashboardPage;
let plbTemplateShopDomain: string;
let orderAPI: OrderAPI;
let numberOrder: number;
let orderPage, orderTemplatePage: OrdersPage;
let domain: string;
let checkoutInfo: CheckoutInfo;
let orderId: number;
let orderName: string;
let holdFromPayout: DataHoldFromPayout;
let listHoldAmount: Array<number> = [];
let transactionPage: TransactionPage;
let plusbaseOrderAPI: PlusbaseOrderAPI;
let authRequestTpl: APIRequestContext;
let profit: number;
let holdAmount: string;
let checkoutAPI: CheckoutAPI;
let productsCheckout: Array<Product>;
let balanceAPI: BalanceUserAPI;

test.describe("UI hold balance plusbase", async () => {
  test.beforeEach(async ({ conf, page, authRequest }) => {
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    plbTemplateDashboardPage = new DashboardPage(page, plbTemplateShopDomain);
    orderTemplatePage = new OrdersPage(page, plbTemplateShopDomain);
    numberOrder = conf.suiteConf.number_order;
    balanceAPI = new BalanceUserAPI(conf.suiteConf.domain, authRequest);
    plbToken = await plbTemplateDashboardPage.getAccessToken({
      shopId: conf.suiteConf.plb_template["shop_id"],
      userId: conf.suiteConf.plb_template["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf.plb_template["username"],
      password: conf.suiteConf.plb_template["password"],
    });
  });

  test(`@SB_BAL_HPP_281 [PLB] Verify UI Orders page/Order detail shop template`, async ({ conf }) => {
    await test.step(`Vào Orders > Tại tab All > Verify UI Orders page trong shop template  `, async () => {
      await plbTemplateDashboardPage.loginWithToken(plbToken);
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      await orderTemplatePage.waitUntilElementVisible(orderTemplatePage.xpathOrderList);
      expect(await orderTemplatePage.isTextVisible("HOLD AMOUNT")).toBeTruthy();
    });

    await test.step(`Click More filters > Chọn điều kiện filter Hold Payout Status `, async () => {
      await orderTemplatePage.filterWithConditionDashboard("More filters", conf.caseConf.filter_hold_payout_yes, 2);
      listHoldAmount = await orderTemplatePage.getListHoldAmount();
      for (let i = 0; i < listHoldAmount.length; i++) {
        expect(listHoldAmount[i]).toBeGreaterThan(0);
      }
      await orderTemplatePage.page.reload();
      await orderTemplatePage.filterWithConditionDashboard("More filters", conf.caseConf.filter_hold_payout_no, 2);
      listHoldAmount = await orderTemplatePage.getListHoldAmount();
      for (let i = 0; i < listHoldAmount.length; i++) {
        expect(listHoldAmount[i]).toEqual(0);
      }
    });

    await test.step(`Select random 3 orders lại order list > Click Hold Payout`, async () => {
      for (let i = 1; i <= numberOrder; i++) {
        await orderTemplatePage.page.click(orderTemplatePage.xpathSelectOrder(i));
      }
      await orderTemplatePage.clickElementWithLabel("span", "Hold payout");
      expect(await orderTemplatePage.isTextVisible("Hold from payout")).toBeTruthy();
      expect(await orderTemplatePage.isTextVisible("Release all")).toBeTruthy();
    });

    await test.step(`Select action Hold from payout > Verify popup Hold from payout`, async () => {
      await orderTemplatePage.clickElementWithLabel("span", "Hold from payout");
      expect(
        Number((await orderTemplatePage.getTextContent(orderTemplatePage.xpathSubTitlePopUpHoldPayout)).split("")[0]),
      ).toEqual(numberOrder);
      for (const optionHoldPayout of conf.caseConf.options_hold_payout) {
        expect(await orderTemplatePage.isTextVisible(`${optionHoldPayout}`)).toBeTruthy();
      }
      await expect(orderTemplatePage.page.getByPlaceholder("Enter reason")).toBeVisible();
      expect(Number(await orderTemplatePage.page.getByPlaceholder("Enter reason").getAttribute("maxlength"))).toEqual(
        conf.caseConf.max_lenght,
      );
      await orderTemplatePage.clickElementWithLabel("span", "Cancel");
    });

    await test.step(`Tại màn order list > Search order > Đi đến màn order detail > Click More actions > Select action Hold from payout`, async () => {
      const orderName = await orderTemplatePage.getTextContent(orderTemplatePage.xpathFirstOrderNameInOrderList);
      await orderTemplatePage.clickOnTextLinkWithLabel(orderName);
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      await orderTemplatePage.clickElementWithLabel("span", "Hold from payout");
      expect(await orderTemplatePage.isTextVisible("Hold from payout")).toBeTruthy();
      expect(await orderTemplatePage.getTextContent(orderTemplatePage.xpathSubTitlePopUpHoldPayout)).toEqual(orderName);
    });
  });
});

test.describe("Hold balance plusbase", async () => {
  test.beforeEach(async ({ conf, page, authRequest, dashboard, multipleStore }) => {
    test.setTimeout(conf.suiteConf.timeout);

    authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );
    domain = conf.suiteConf.domain;
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
    holdFromPayout = conf.caseConf.hold_from_payout;
    productsCheckout = conf.caseConf.products_checkout;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      plbTemplateShopDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );

    orderAPI = new OrderAPI(domain, authRequest);
    orderPage = new OrdersPage(dashboard, domain);
    plbTemplateDashboardPage = new DashboardPage(templatePage, plbTemplateShopDomain);
    orderTemplatePage = new OrdersPage(plbTemplateDashboardPage.page, plbTemplateShopDomain);
    transactionPage = new TransactionPage(dashboard, domain);
    plusbaseOrderAPI = new PlusbaseOrderAPI(plbTemplateShopDomain, authRequestTpl);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    balanceAPI = new BalanceUserAPI(conf.suiteConf.domain, authRequest);
  });

  test(`@SB_BAL_HPP_283 [PLB - 1 order] Verify order balance khi user hold/release amount 1 order theo Absolute amount và Available date = None, trường hợp hold amount = order profit`, async ({
    multipleStore,
    conf,
  }) => {
    await test.step(`Vào shop PLB > Checkout order`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productsCheckout });
      orderId = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;

      // Wait order calculate profit and button View invoice enable
      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await expect(async () => {
        await orderPage.page.reload();
        expect(await orderPage.isTextVisible("View invoice")).toBeTruthy();
      }).toPass();
    });

    await test.step(`Vào Orders > Tại tab All > Search order vừa checkout > Đi đến order detail > Click More actions > Click Hold from payout`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      await orderTemplatePage.clickElementWithLabel("span", "Hold from payout");
      expect(await orderTemplatePage.isTextVisible("Hold from payout")).toBeTruthy();
      expect(await orderTemplatePage.getTextContent(orderTemplatePage.xpathSubTitlePopUpHoldPayout)).toEqual(orderName);
    });

    await test.step(`Input hold amount > Input Reason > Select Available date > Click confirm > Verify order detail sau khi action hold amount`, async () => {
      holdFromPayout.order_ids[0] = orderId;
      holdFromPayout.hold_amount.value = await orderTemplatePage.getOrderProfit();
      const fixedDate: Date = new Date();
      holdFromPayout.release_setting.abs_time = formatDate(fixedDate, "YYYY-MM-DD");
      authRequestTpl = await multipleStore.getAuthRequest(
        conf.suiteConf.plb_template.username,
        conf.suiteConf.plb_template.password,
        conf.suiteConf.plb_template.domain,
        conf.suiteConf.plb_template.shop_id,
        conf.suiteConf.plb_template.user_id,
      );
      plusbaseOrderAPI = new PlusbaseOrderAPI(plbTemplateShopDomain, authRequestTpl);
      await plusbaseOrderAPI.holdFromPayoutPlb(holdFromPayout);
      await orderTemplatePage.page.reload();
      await expect(async () => {
        expect(await orderTemplatePage.isTextVisible("Order Balance in Hold")).toBeTruthy();
      }).toPass();
      expect(await orderTemplatePage.isTextVisible("View transaction")).toBeFalsy();
      expect(Number(removeCurrencySymbol(await orderTemplatePage.getDataBoxHoldPayout("Hold amount")))).toEqual(
        holdFromPayout.hold_amount.value,
      );
      expect(await orderTemplatePage.getDataBoxHoldPayout("Reason")).toEqual(holdFromPayout.reason);
      expect(await orderTemplatePage.getDataBoxHoldPayout("Start date")).toEqual(formatDate(fixedDate, "DD/MM/YYYY"));
      expect(await orderTemplatePage.getDataBoxHoldPayout("Available date")).toEqual("N/A");
    });

    await test.step(`Tại màn Order list > Search order > Verify data order tại cột Hold amount`, async () => {
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      const actHoldAmount = await orderTemplatePage.getTextContent(
        orderTemplatePage.xpathHoldAmountInOrderList(orderName),
      );
      expect(isEqual(Number(removeCurrencySymbol(actHoldAmount)), Number(holdAmount), 0.1)).toBeTruthy();
    });

    await test.step(`Login shop PLB > Orders > Search order, đi đến order detail > Verify order detail shop PLB khi bị hold`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      const fixedDate: Date = new Date();
      expect(await orderPage.isTextVisible("Order Balance in Hold")).toBeTruthy();
      expect(Number(removeCurrencySymbol(await orderPage.getDataBoxHoldPayout("Hold amount")))).toEqual(
        holdFromPayout.hold_amount.value,
      );
      expect(await orderPage.getDataBoxHoldPayout("Reason")).toEqual(holdFromPayout.reason);
      expect(await orderPage.getDataBoxHoldPayout("Start date")).toEqual(formatDate(fixedDate, "DD/MM/YYYY"));
      expect(await orderPage.getDataBoxHoldPayout("Available date")).toEqual("N/A");
    });

    await test.step(`Tại order detail > Click View invoice > Verify invoice của order`, async () => {
      const invoiceData = await orderAPI.getInvoiceByOrderId(checkoutInfo.order.id);
      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        holdFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, holdFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      if (holdFromPayout.release_setting.release_type === `none`) {
        expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
      } else {
        expect(holdFromPayout.release_setting.abs_time).toEqual(
          formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
        );
      }
    });

    await test.step(`Vào order > Tại tab All > Search order > Đi đến order detail > More actions > Release hold amount`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderAPI.releaseAvailableToPayoutProfit(orderId);
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      await orderTemplatePage.clickElementWithLabel("span", "Release hold amount");
      await expect(async () => {
        const invoiceData = await orderAPI.getInvoiceByOrderId(orderId);
        const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);
        for (const transaction of listTransaction) {
          expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(
            holdFromPayout.release_setting.abs_time,
          );
        }
      }).toPass();
    });
  });

  test(`@SB_BAL_HPP_289 [PLB - 1 order] Verify order, balance khi user hold/release amount 1 order theo A percentage of order's profit và Available date = Auto release on this date, trường hợp hold amount < order's profit`, async ({}) => {
    const fixedDate: Date = new Date();
    await test.step(`Vào shop PLB > Checkout order`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productsCheckout });
      orderId = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;

      // Wait order calculate profit and button View invoice enable
      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await expect(async () => {
        await orderPage.page.reload();
        expect(await orderPage.isTextVisible("View invoice")).toBeTruthy();
      }).toPass();
    });

    await test.step(`Vào Orders > Tại tab All > Search order vừa checkout > Đi đến order detail > Click More actions > Click Hold from payout`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      await orderTemplatePage.clickElementWithLabel("span", "Hold from payout");
      expect(await orderTemplatePage.isTextVisible("Hold from payout")).toBeTruthy();
      expect(await orderTemplatePage.getTextContent(orderTemplatePage.xpathSubTitlePopUpHoldPayout)).toEqual(orderName);
    });

    await test.step(`Input hold amount > Input Reason > Select Available date > Click confirm > Verify order detail sau khi action hold amount`, async () => {
      profit = await orderTemplatePage.getOrderProfit();
      holdAmount = (profit * (holdFromPayout.hold_amount.value / 100)).toFixed(2);
      holdFromPayout.order_ids[0] = orderId;
      await plusbaseOrderAPI.holdFromPayoutPlb(holdFromPayout);
      await orderTemplatePage.page.reload();
      await expect(async () => {
        expect(await orderTemplatePage.isTextVisible("Order Balance in Hold")).toBeTruthy();
      }).toPass();
      expect(await orderTemplatePage.isTextVisible("View transaction")).toBeFalsy();
      expect(removeCurrencySymbol(await orderTemplatePage.getDataBoxHoldPayout("Hold amount"))).toEqual(holdAmount);
      expect(await orderTemplatePage.getDataBoxHoldPayout("Reason")).toEqual(holdFromPayout.reason);
      expect(await orderTemplatePage.getDataBoxHoldPayout("Start date")).toEqual(formatDate(fixedDate, "DD/MM/YYYY"));
      expect(await orderTemplatePage.getDataBoxHoldPayout("Available date")).toEqual(
        formatDate(holdFromPayout.release_setting.abs_time, "DD/MM/YYYY"),
      );
    });

    await test.step(`Tại màn Order list > Search order > Verify data order tại cột Hold amount`, async () => {
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      const actHoldAmount = await orderTemplatePage.getTextContent(
        orderTemplatePage.xpathHoldAmountInOrderList(orderName),
      );
      expect(isEqual(Number(removeCurrencySymbol(actHoldAmount)), Number(holdAmount), 0.1)).toBeTruthy();
    });

    await test.step(`Login shop PLB > Orders > Search order, đi đến order detail > Verify order detail shop PLB khi bị hold`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      expect(await orderPage.isTextVisible("Order Balance in Hold")).toBeTruthy();
      expect(removeCurrencySymbol(await orderPage.getDataBoxHoldPayout("Hold amount"))).toEqual(holdAmount);
      expect(await orderPage.getDataBoxHoldPayout("Reason")).toEqual(holdFromPayout.reason);
      expect(await orderPage.getDataBoxHoldPayout("Start date")).toEqual(formatDate(fixedDate, "DD/MM/YYYY"));
      expect(await orderPage.getDataBoxHoldPayout("Available date")).toEqual(
        formatDate(holdFromPayout.release_setting.abs_time, "DD/MM/YYYY"),
      );
    });

    await test.step(`Click View transaction`, async () => {
      const today = formatDate(fixedDate, "YYYY-MM-DD");
      await orderPage.clickOnTextLinkWithLabel("View transactions");
      const url = await orderPage.page.url();
      await orderPage.goto(`${url}&created_at_min=${today}&created_at_max=${today}`);

      await transactionPage.clickNewestTransaction();
      const [actTransAmount, actTransStatus, actTransContent] = await Promise.all([
        transactionPage.getDataByColumnLabel("Amount"),
        transactionPage.getDataByColumnLabel("Status"),
        transactionPage.getDataByColumnLabel("Invoice", 2),
      ]);
      expect(removeCurrencySymbol(actTransAmount)).toBe(holdAmount);
      expect(actTransStatus).toBe("Paid");
      expect(actTransContent).toBe(`Order ${orderName} is on hold due to: ${holdFromPayout.reason}`);
    });

    await test.step(`Tại order detail > Click View invoice > Verify invoice của order `, async () => {
      const invoiceData = await orderAPI.getInvoiceByOrderId(checkoutInfo.order.id);
      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        holdFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, holdFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      if (holdFromPayout.release_setting.release_type === `None`) {
        expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
      } else {
        expect(holdFromPayout.release_setting.abs_time).toEqual(
          formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
        );
      }
    });

    await test.step(`Verify release hold amount của order`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderAPI.releaseAvailableToPayoutProfit(orderId);
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      await orderTemplatePage.clickElementWithLabel("span", "Release hold amount");
      await expect(async () => {
        const invoiceData = await orderAPI.getInvoiceByOrderId(orderId);
        const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);
        for (const transaction of listTransaction) {
          expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(
            formatDate(fixedDate, "YYYY-MM-DD"),
          );
        }
      }).toPass();
    });
  });

  test(`@SB_BAL_HPP_327 [PLB - 1 order] Verify order, balance khi user hold/release amount 1 order theo A percentage of order's GMV và Available date = Auto release on this date, trường hợp hold amount < order's GMV, profit vẫn đang ở Available soon`, async ({}) => {
    const fixedDate: Date = new Date();
    await test.step(`Vào shop PLB > Checkout order`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productsCheckout });
      orderId = checkoutInfo.order.id;
      orderName = checkoutInfo.order.name;

      // Wait order calculate profit and button View invoice enable
      await orderPage.goToOrderByOrderId(orderId);
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await expect(async () => {
        await orderPage.page.reload();
        expect(await orderPage.isTextVisible("View invoice")).toBeTruthy();
      }).toPass();
    });

    await test.step(`Vào Orders > Tại tab All > Search order vừa checkout > Đi đến order detail > Click More actions > Click Hold from payout`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      await orderTemplatePage.clickElementWithLabel("span", "Hold from payout");
      expect(await orderTemplatePage.isTextVisible("Hold from payout")).toBeTruthy();
      expect(await orderTemplatePage.getTextContent(orderTemplatePage.xpathSubTitlePopUpHoldPayout)).toEqual(orderName);
    });

    await test.step(`Input hold amount > Input Reason > Select Available date > Click confirm > Verify order detail sau khi action hold amount`, async () => {
      profit = await orderTemplatePage.getOrderProfit();
      holdAmount = (checkoutInfo.totals.total_price * (holdFromPayout.hold_amount.value / 100)).toFixed(2);
      holdFromPayout.order_ids[0] = orderId;
      await plusbaseOrderAPI.holdFromPayoutPlb(holdFromPayout);
      await orderTemplatePage.page.reload();
      await expect(async () => {
        expect(await orderTemplatePage.isTextVisible("Order Balance in Hold")).toBeTruthy();
      }).toPass();
      expect(await orderTemplatePage.isTextVisible("View transaction")).toBeFalsy();
      expect(removeCurrencySymbol(await orderTemplatePage.getDataBoxHoldPayout("Hold amount"))).toEqual(holdAmount);
      expect(await orderTemplatePage.getDataBoxHoldPayout("Reason")).toEqual(holdFromPayout.reason);
      expect(await orderTemplatePage.getDataBoxHoldPayout("Start date")).toEqual(formatDate(fixedDate, "DD/MM/YYYY"));
      expect(await orderTemplatePage.getDataBoxHoldPayout("Available date")).toEqual(
        formatDate(holdFromPayout.release_setting.abs_time, "DD/MM/YYYY"),
      );
    });

    await test.step(`Tại màn Order list > Search order > Verify data order tại cột Hold amount`, async () => {
      await plbTemplateDashboardPage.navigateToMenu("Orders");
      const actHoldAmount = await orderTemplatePage.getTextContent(
        orderTemplatePage.xpathHoldAmountInOrderList(orderName),
      );
      expect(isEqual(Number(removeCurrencySymbol(actHoldAmount)), Number(holdAmount), 0.1)).toBeTruthy();
    });

    await test.step(`Login shop PLB > Orders > Search order, đi đến order detail > Verify order detail shop PLB khi bị hold`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      expect(await orderPage.isTextVisible("Order Balance in Hold")).toBeTruthy();
      expect(removeCurrencySymbol(await orderPage.getDataBoxHoldPayout("Hold amount"))).toEqual(holdAmount);
      expect(await orderPage.getDataBoxHoldPayout("Reason")).toEqual(holdFromPayout.reason);
      expect(await orderPage.getDataBoxHoldPayout("Start date")).toEqual(formatDate(fixedDate, "DD/MM/YYYY"));
      expect(await orderPage.getDataBoxHoldPayout("Available date")).toEqual(
        formatDate(holdFromPayout.release_setting.abs_time, "DD/MM/YYYY"),
      );
    });

    await test.step(`Click View transaction`, async () => {
      await orderPage.clickOnTextLinkWithLabel("View transactions");
      await transactionPage.clickNewestTransaction();
      const [actTransAmount, actTransStatus, actTransContent] = await Promise.all([
        transactionPage.getDataByColumnLabel("Amount"),
        transactionPage.getDataByColumnLabel("Status"),
        transactionPage.getDataByColumnLabel("Invoice", 2),
      ]);
      expect(removeCurrencySymbol(actTransAmount)).toBe(holdAmount);
      expect(actTransStatus).toBe("Paid");
      expect(actTransContent).toBe(`Order ${orderName} is on hold due to: ${holdFromPayout.reason}`);
    });

    await test.step(`Tại order detail > Click View invoice > Verify invoice của order`, async () => {
      const invoiceData = await orderAPI.getInvoiceByOrderId(checkoutInfo.order.id);
      const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
        invoiceData.id,
        checkoutInfo.order.name,
        holdFromPayout.reason,
      );

      expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, holdFromPayout.hold_amount.value, 0.1)).toBeTruthy();
      expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
      if (holdFromPayout.release_setting.release_type === `None`) {
        expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
      } else {
        expect(holdFromPayout.release_setting.abs_time).toEqual(
          formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
        );
      }
    });

    await test.step(`Verify release hold amount của order`, async () => {
      await orderTemplatePage.goToOrderStoreTemplateByOrderId(orderId);
      await orderAPI.releaseAvailableToPayoutProfit(orderId);
      await orderTemplatePage.clickOnBtnWithLabel("More actions");
      await orderTemplatePage.clickElementWithLabel("span", "Release hold amount");
      await expect(async () => {
        const invoiceData = await orderAPI.getInvoiceByOrderId(orderId);
        const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);
        for (const transaction of listTransaction) {
          expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(
            formatDate(fixedDate, "YYYY-MM-DD"),
          );
        }
      }).toPass();
    });
  });

  test(`@SB_BAL_HPP_291 [PLB - nhiều order] Verify order, balance khi user hold/release hold amount nhiều order, trường hợp hold theo A percentage of order's GMV`, async ({
    conf,
  }) => {
    const fixedDate: Date = new Date();
    const orderList = [];
    const orderIds = [];
    const ordernames = [];
    const orders = new Map<number, string>();

    await test.step(`Vào shop PLB > Checkout order`, async () => {
      for (let i = 0; i < conf.caseConf.number_order; i++) {
        checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productsCheckout });
        orderList.push(checkoutInfo);

        orderIds.push(checkoutInfo.order.id);
        ordernames.push(checkoutInfo.order.name);
        expect(checkoutInfo.order.id).toBeGreaterThan(0);
        orders.set(checkoutInfo.order.id, checkoutInfo.order.name);
      }
      holdFromPayout.order_ids = orderIds;

      for (const order of orderList) {
        // Wait order calculate profit and button View invoice enable
        await orderPage.goToOrderByOrderId(order.order.id);
        await orderAPI.getOrderProfit(Number(order.order.id), "plusbase", true);
        await expect(async () => {
          await orderPage.page.reload();
          expect(await orderPage.isTextVisible("View invoice")).toBeTruthy();
        }).toPass();
      }
      profit = await orderPage.getOrderProfit();
      holdAmount = (checkoutInfo.totals.total_price * (holdFromPayout.hold_amount.value / 100)).toFixed(2);
    });

    await test.step(`Vào Orders > Tại tab All > Select nhiều order > Click Hold payout > Thực hiện Hold > Tại màn Order list > Search các order đã action hold > Verify data order tại cột Hold amount`, async () => {
      await expect(async () => {
        const res = await plusbaseOrderAPI.holdFromPayoutPlb(holdFromPayout);
        expect(res.complete_order_ids).toEqual(holdFromPayout.order_ids);
      }).toPass();

      await plbTemplateDashboardPage.navigateToMenu("Orders");

      for (const orderName of ordernames) {
        const actHoldAmount = await orderTemplatePage.getTextContent(
          orderTemplatePage.xpathHoldAmountInOrderList(orderName),
        );
        expect(isEqual(Number(removeCurrencySymbol(actHoldAmount)), Number(holdAmount), 0.1)).toBeTruthy();
      }
    });

    await test.step(`Login shop PLB > Orders > Search lần lượt các order đã action hold amount > Verify order detail của các order > Click View transaction > Verify transaction của các order đã hold balance`, async () => {
      for (const ordeId of orderIds) {
        const invoiceData = await orderAPI.getInvoiceByOrderId(ordeId);
        const dataHoldAmountAndDateOfTran = await balanceAPI.getHoldAmountAndDateOfTran(
          invoiceData.id,
          orders.get(ordeId),
          holdFromPayout.reason,
        );

        expect(isEqual(dataHoldAmountAndDateOfTran.holdAmount, holdFromPayout.hold_amount.value, 0.1)).toBeTruthy();
        expect(dataHoldAmountAndDateOfTran.payoutDateProfit).toEqual(dataHoldAmountAndDateOfTran.payoutDateTypeOut);
        if (holdFromPayout.release_setting.release_type === `none`) {
          expect(dataHoldAmountAndDateOfTran.isInfinity).toBeTruthy();
        } else {
          expect(holdFromPayout.release_setting.abs_time).toEqual(
            formatDate(Number(dataHoldAmountAndDateOfTran.payoutDateTypeIn), "YYYY-MM-DD"),
          );
        }
      }
    });

    await test.step(`Verify release hold amount của order`, async () => {
      for (const order of orderList) {
        await orderTemplatePage.goToOrderStoreTemplateByOrderId(order.order.id);
        await orderAPI.releaseAvailableToPayoutProfit(order.order.id);
        await orderTemplatePage.clickOnBtnWithLabel("More actions");
        await orderTemplatePage.clickElementWithLabel("span", "Release hold amount");
        await expect(async () => {
          const invoiceData = await orderAPI.getInvoiceByOrderId(order.order.id);
          const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);
          for (const transaction of listTransaction) {
            expect(formatDate(Number(transaction.available_at), "YYYY-MM-DD")).toEqual(
              formatDate(fixedDate, "YYYY-MM-DD"),
            );
          }
        }).toPass();
      }
    });
  });
});
