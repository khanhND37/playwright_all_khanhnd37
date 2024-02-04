import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { getProxyPageByCountry } from "@core/utils/proxy_page";
import { removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { OrderAPI } from "@pages/api/order";
import { BalancePage } from "@pages/dashboard/balance";
import { InvoicePage } from "@pages/dashboard/invoice";
import { OrdersPage } from "@pages/dashboard/orders";
import { GlobalMarketAddPage } from "@pages/dashboard/settings/global-market/global-market-add";
import { dataCurrencyOfCountry } from "@pages/dashboard/settings/global-market/global-market-list";
import { TransactionPage } from "@pages/dashboard/transaction";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { MailBox } from "@pages/thirdparty/mailbox";
import { OrderAfterCheckoutInfo, OrderSummary, TransactionInfoInRazorpay } from "@types";

test.describe(`Verify checkout one page with razorpay`, () => {
  let productPage: SFProduct,
    orderSummaryInfo: OrderAfterCheckoutInfo,
    orderSummaryBeforeCompleteOrd: OrderSummary,
    dashboardAPI: DashboardAPI,
    invoicePage: InvoicePage,
    mailBox: MailBox,
    orderName: string,
    customerEmail: string,
    transactionPage: TransactionPage,
    totalOrderSF: string,
    checkoutToken: string,
    checkoutAPI: CheckoutAPI,
    itemPostPurchaseValue: string,
    dataCountry: dataCurrencyOfCountry,
    expectedPriceWithLocalCurrency: number,
    totalPriceWithLocalCurrency: number,
    expectedAmountProductPPC: number,
    orderInfo: TransactionInfoInRazorpay,
    orderPPCInfo: TransactionInfoInRazorpay,
    actTotalOrder: string,
    totalOrderAmountOnPopup: string,
    totalSalesBefore,
    totalSalesAfter;

  // on the transaction table at the first line
  // verify data at column: shop domain, invoice, status, amount
  const verifyTransactionData = async (
    inputDomain: string,
    inputContentInvoice: string,
    inputTransactionStatus: string,
    rowIndex,
  ) => {
    expect(await invoicePage.verifyDataWithColumnName("Shop Domain", inputDomain, rowIndex)).toBe(true);
    expect(await invoicePage.verifyDataWithColumnName("Invoice", inputContentInvoice, rowIndex)).toBe(true);
    expect(await invoicePage.verifyDataWithColumnName("Status", inputTransactionStatus, rowIndex)).toBe(true);
  };

  test(`@SB_CHE_CORP_02 Kiểm tra checkout order không có discount, upsell qua cổng Razorpay`, async ({
    conf,
    multipleStore,
    context,
    page,
  }) => {
    test.setTimeout(1000 * 1000);
    for (const shop of conf.suiteConf.shops) {
      const homePage = new SFHome(page, shop.domain);
      const checkoutPage = new SFCheckout(page, shop.domain);
      const authRequest = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shop.domain,
        shop.shop_id,
        conf.suiteConf.user_id,
      );
      dashboardAPI = new DashboardAPI(shop.domain, authRequest);
      const orderAPI = new OrderAPI(shop.domain, authRequest);

      // get total sale ở analytic trước khi checkout order
      totalSalesBefore = await dashboardAPI.getTotalSalesByShopId(shop.shop_id);
      const dashboardPage = await multipleStore.getDashboardPage(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shop.domain,
        shop.shop_id,
        conf.suiteConf.user_id,
      );

      const orderPage = new OrdersPage(dashboardPage, shop.domain);
      const balancePage = new BalancePage(dashboardPage, shop.domain);
      transactionPage = new TransactionPage(dashboardPage, shop.domain);
      invoicePage = new InvoicePage(dashboardPage, shop.domain);

      await test.step(`Tại Store-front:
        + Buyer add product (có hỗ trợ PPC) và product có custom option to cart và đi đến trang checkout
        + Buyer nhập thông tin shipping, chọn shipping method
        + Tại block Payment: chọn Razorpay
        + Click button "Place your order"`, async () => {
        // Checkout sản phẩm
        await homePage.gotoHomePage();
        for (const product of conf.caseConf.products) {
          productPage = await homePage.searchThenViewProduct(product.name);
          if (product.custom_option) {
            await productPage.inputCustomOptionSF(product.custom_option);
          }
          await productPage.genLoc(productPage.xpathBtnAddToCart).first().click({ timeout: 5000 });
          await checkoutPage.page.waitForResponse(res => res.url().includes("cart.json") && res.status() === 200);
          await checkoutPage.genLoc("#v-progressbar").waitFor({ state: "detached" });
          await checkoutPage.isDBPageDisplay("YOUR SHOPPING CART");
        }
        await productPage.navigateToCheckoutPage();
        await checkoutPage.page.waitForSelector(checkoutPage.xpathDroplistCountry);
        await checkoutPage.enterShippingAddress(conf.suiteConf.customer_info);
        await checkoutPage.footerLoc.scrollIntoViewIfNeeded();

        const urlParts = checkoutPage.page.url().split("/");
        checkoutToken = urlParts[urlParts.length - 1];

        await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
        // Get summary then click complete order
        orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
        await checkoutPage.clickBtnCompleteOrder();

        await checkoutPage.loginRazorpayByBuyer(conf.suiteConf.buyer_info);
        const totalOrderAmountOnPopup = await checkoutPage.getTotalAmountOnRazorpayPopup();
        expect(totalOrderAmountOnPopup).toEqual(
          `${conf.caseConf.currency_symbol} ${orderSummaryBeforeCompleteOrd.totalPrice.toFixed(2)}`,
        );
      });

      await test.step(`Chọn phương thức thanh toán trên cổng và complete order`, async () => {
        await checkoutPage.completeOrderViaRazorpay(conf.suiteConf.card_info);
        await expect(checkoutPage.genLoc(`${checkoutPage.xpathPPCV2}, ${checkoutPage.xpathPPCBLock}`)).toBeVisible();
        await checkoutPage.page.waitForSelector(`${checkoutPage.xpathPPCV2}, ${checkoutPage.xpathPPCBLock}`);
      });

      await test.step(`Tắt pop-up Post-purchase`, async () => {
        await checkoutPage.genLoc(checkoutPage.xpathClosePPCPopUp).click();
        await expect(checkoutPage.genLoc(checkoutPage.xpathThankYou)).toBeVisible();
        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
        customerEmail = await checkoutPage.getCustomerEmail();
        orderName = await checkoutPage.getOrderName();
        totalOrderSF = await checkoutPage.getTotalOnOrderSummary();
        expect(isEqual(orderSummaryInfo.totalSF, orderSummaryBeforeCompleteOrd.totalPrice, 0.01)).toBe(true);
        expect(await checkoutPage.genLoc(checkoutPage.xpathPaymentMethodThankyouPage).innerText()).toEqual("Razorpay");
      });

      await test.step(`- Login dashboard Razorpay của seller đã connect với shop
      - Chọn module Transaction`, async () => {
        const receipt = `sbo_${checkoutToken}`;

        // get thông tin transaction tại tab Order ở razorpay dashboard khi checkout với product gốc
        orderInfo = await orderAPI.getOrdInfoInRazorpay(
          {
            keyID: conf.suiteConf.account_connect_db_shopbase.key_id,
            keySecret: conf.suiteConf.account_connect_db_shopbase.key_secret,
          },
          receipt,
        );
        // verify amount của order
        expect(orderInfo.total_amount / 100).toEqual(orderSummaryInfo.totalSF);
        expect(orderInfo.currency).toEqual(conf.caseConf.currency);
      });

      await test.step(`Tại dashboard > Order > Kiểm tra order list > Click vào xem detail order vừa tạo`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        const orderStatus = await orderPage.reloadUntilOrdCapture(null, 20);
        expect(orderStatus).toEqual("Paid");
        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);

        const paidByCustomer = parseFloat(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
        expect(isEqual(paidByCustomer, orderSummaryInfo.totalSF, 0.01)).toBe(true);

        const orderTimeline = orderPage.generateOrdTimeline(conf.suiteConf.customer_info, {
          total_amount: orderSummaryInfo.totalSF.toString(),
          payment_gateway: "Razorpay",
          item_post_purchase_value: "0",
          account_name: conf.suiteConf.account_connect_db_shopbase.account_name,
        });

        const orderTimelineSendingEmail = orderTimeline.timelineSendEmail;
        const orderTimelineCustomerPlaceOrder = orderTimeline.timelinePlaceOrd;
        const orderTimelinePaymentProcessed = orderTimeline.timelinePaymentProcessed;

        await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
        await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
        await expect(await orderPage.orderTimeLines(orderTimelinePaymentProcessed)).toBeVisible();
        await expect(await orderPage.orderTimeLines(orderInfo.id)).toBeVisible();
      });

      await test.step(`Tại Balance, kiểm tra transaction`, async () => {
        const invoiceAmount = (shop.transaction_fee * orderSummaryInfo.totalSF).toFixed(2);
        const amountDisplay = (-invoiceAmount).toString();
        await balancePage.goToBalance();
        await balancePage.clickBtnViewTransactions();
        await balancePage.page.waitForSelector(invoicePage.xpathLastestInvoiceAmount);
        // Filter invoice and verify top-up at Invoice list
        await balancePage.filterWithConditionDashboard("More filters", shop.filter_condition);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(conf.suiteConf.filter_tag);

        //verify Transaction
        await verifyTransactionData(
          shop.domain,
          conf.suiteConf.invoice_info.content,
          conf.suiteConf.invoice_info.status,
          1,
        );
        expect(await transactionPage.verifyAmountTransaction(amountDisplay)).toBe(true);

        await transactionPage.clickNewestTransaction();
        expect(
          await transactionPage.verifyContentCollapsed(
            "Invoice",
            `${conf.suiteConf.invoice_info.invoice_collapsed} ${orderName}`,
            invoicePage,
          ),
        ).toBe(true);

        expect(
          await transactionPage.verifyContentCollapsed(
            "Available date",
            conf.suiteConf.invoice_info.source_collapsed,
            invoicePage,
          ),
        ).toBe(true);
      });

      await test.step(`Kiểm tra email gửi cho buyer`, async () => {
        const newPage = await context.newPage();
        mailBox = new MailBox(newPage, shop.domain);
        const emailTitle = mailBox.emailSubject(orderName).orderConfirm;
        await mailBox.openMailDetailWithAPI(customerEmail, emailTitle);
        const actualTotalOrder = await mailBox.getTotalOrder();
        expect(actualTotalOrder).toEqual(totalOrderSF);

        const xpathTextOnPaymentMethodSection = await mailBox.genXpathSectionOfCustomerInfo("Payment method");
        await expect(mailBox.genLoc(xpathTextOnPaymentMethodSection)).toContainText("razorpay");
        await newPage.close();
      });

      await test.step(`Tại dashboard > Analytics: Kiểm tra total sale`, async () => {
        const expectTotalSalesAfter = (totalSalesBefore + orderSummaryInfo.totalSF).toFixed(2);

        for (let i = 0; i < 40; i++) {
          totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shop.shop_id);
          if (totalSalesAfter !== totalSalesBefore) {
            break;
          }
          await orderPage.page.waitForTimeout(5000);
        }
        try {
          expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 0.01)).toEqual(true);
        } catch {
          throw new Error(`Analytics get more than 200s to update`);
        }
      });
    }
  });

  test(`@SB_CHE_CORP_03 Kiểm tra checkout order có discount, có post purchase upsell qua cổng Razorpay`, async ({
    conf,
    multipleStore,
    context,
    page,
  }) => {
    test.setTimeout(1000 * 1000);
    for (const shop of conf.suiteConf.shops) {
      const checkoutPage = new SFCheckout(page, shop.domain);
      const authRequest = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shop.domain,
        shop.shop_id,
        conf.suiteConf.user_id,
      );
      dashboardAPI = new DashboardAPI(shop.domain, authRequest);
      checkoutAPI = new CheckoutAPI(shop.domain, authRequest, page);
      const orderAPI = new OrderAPI(shop.domain, authRequest);

      // get total sale ở analytic trước khi checkout order
      totalSalesBefore = await dashboardAPI.getTotalSalesByShopId(shop.shop_id);
      const dashboardPage = await multipleStore.getDashboardPage(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shop.domain,
        shop.shop_id,
        conf.suiteConf.user_id,
      );

      const orderPage = new OrdersPage(dashboardPage, shop.domain);
      const balancePage = new BalancePage(dashboardPage, shop.domain);
      transactionPage = new TransactionPage(dashboardPage, shop.domain);
      invoicePage = new InvoicePage(dashboardPage, shop.domain);
      const ppc = conf.caseConf.product_ppc;

      await test.step(`Tại Store-front:  
    + Buyer add product (có hỗ trợ PPC) to cart và đi đến trang checkout  
    + Buyer nhập thông tin shipping, chọn shipping method. 
    + Apply discount code: "auto discount 10".  
    + Tại block Payment: chọn Razorpay  
    + Click button "Place your order"`, async () => {
        await checkoutAPI.addProductThenSelectShippingMethodWithNE(shop.products_checkout);
        await checkoutAPI.openCheckoutPageByToken();
        await checkoutPage.waitForElementVisibleThenInvisible(checkoutPage.xpathSkeletonSummaryBlock);
        await checkoutPage.inputDiscountBox.scrollIntoViewIfNeeded();
        await checkoutPage.applyDiscountCode(conf.suiteConf.discount.discount_code);
        await checkoutPage.footerLoc.scrollIntoViewIfNeeded();

        const urlParts = checkoutPage.page.url().split("/");
        checkoutToken = urlParts[urlParts.length - 1];

        await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
        // Get summary then click complete order
        orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
        await checkoutPage.clickBtnCompleteOrder();

        await checkoutPage.loginRazorpayByBuyer(conf.suiteConf.buyer_info);
        const totalOrderAmountOnPopup = await checkoutPage.getTotalAmountOnRazorpayPopup();
        expect(totalOrderAmountOnPopup).toEqual(
          `${conf.caseConf.currency_symbol} ${orderSummaryBeforeCompleteOrd.totalPrice.toFixed(2)}`,
        );
      });

      await test.step(`Chọn phương thức thanh toán trên cổng và complete order`, async () => {
        await checkoutPage.completeOrderViaRazorpay(conf.suiteConf.card_info);
        await expect(checkoutPage.genLoc(`${checkoutPage.xpathPPCV2}, ${checkoutPage.xpathPPCBLock}`)).toBeVisible();
        await checkoutPage.page.waitForSelector(`${checkoutPage.xpathPPCV2}, ${checkoutPage.xpathPPCBLock}`);
      });

      await test.step(`Thêm product PPC`, async () => {
        itemPostPurchaseValue = await checkoutPage.addProductPostPurchase(ppc.product_ppc_name);
        const totalOrderAmountOnPopup = await checkoutPage.getTotalAmountOnRazorpayPopup();
        expect(totalOrderAmountOnPopup).toEqual(
          `${conf.caseConf.currency_symbol} ${ppc.expected_amount_product_ppc.toFixed(2)}`,
        );
      });

      await test.step(`Chọn phương thức thanh toán trên cổng và complete order`, async () => {
        await checkoutPage.completeOrderViaRazorpay(conf.suiteConf.card_info);
        await checkoutPage
          .genLoc(checkoutPage.getProductSelectorInOrder(ppc.product_ppc_name, shop.version))
          .waitFor({ state: "visible", timeout: 120 * 1000 });

        orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
        customerEmail = await checkoutPage.getCustomerEmail();
        orderName = await checkoutPage.getOrderName();
        totalOrderSF = await checkoutPage.getTotalOnOrderSummary();
        expect(
          isEqual(
            orderSummaryInfo.totalSF,
            orderSummaryBeforeCompleteOrd.totalPrice + ppc.expected_amount_product_ppc,
            0.01,
          ),
        ).toBe(true);

        expect(await checkoutPage.genLoc(checkoutPage.xpathPaymentMethodThankyouPage).innerText()).toEqual("Razorpay");
      });

      await test.step(`- Login dashboard Razorpay của seller đã connect với shop
      - Chọn module Transaction`, async () => {
        const receipt = `sbo_${checkoutToken}`;
        const receiptPPC = `sbo_${checkoutToken}_pp`;

        // get thông tin transaction tại tab Order ở razorpay dashboard khi checkout với product gốc
        orderInfo = await orderAPI.getOrdInfoInRazorpay(
          {
            keyID: conf.suiteConf.account_connect_db_shopbase.key_id,
            keySecret: conf.suiteConf.account_connect_db_shopbase.key_secret,
          },
          receipt,
        );
        // verify amount của order tạo đầu tiên, khi chưa add product post purchase
        expect(orderInfo.total_amount / 100).toEqual(orderSummaryBeforeCompleteOrd.totalPrice);
        expect(orderInfo.currency).toEqual(conf.caseConf.currency);

        // get thông tin transaction tại tab Order ở razorpay dashboard khi checkout với product post purchase
        orderPPCInfo = await orderAPI.getOrdInfoInRazorpay(
          {
            keyID: conf.suiteConf.account_connect_db_shopbase.key_id,
            keySecret: conf.suiteConf.account_connect_db_shopbase.key_secret,
          },
          receiptPPC,
        );
        // verify amount của order tạo sau khi add product post purchase
        expect(orderPPCInfo.total_amount / 100).toEqual(ppc.expected_amount_product_ppc);
        expect(orderPPCInfo.currency).toEqual(conf.caseConf.currency);
      });

      await test.step(`Tại dashboard > Order> Kiểm tra order list > Click vào xem detail order vừa tạo`, async () => {
        await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
        const orderStatus = await orderPage.reloadUntilOrdCapture(null, 20);
        expect(orderStatus).toEqual("Paid");
        // verify order amount
        const actTotalOrder = parseFloat(removeCurrencySymbol(await orderPage.getTotalOrder()));
        expect(isEqual(actTotalOrder, orderSummaryInfo.totalSF, 0.01)).toBe(true);

        const paidByCustomer = parseFloat(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
        expect(isEqual(paidByCustomer, orderSummaryInfo.totalSF, 0.01)).toBe(true);

        const orderTimeline = orderPage.generateOrdTimeline(conf.suiteConf.customer_info, {
          total_amount: orderSummaryInfo.totalSF.toString(),
          payment_gateway: "Razorpay",
          item_post_purchase_value: itemPostPurchaseValue,
          account_name: conf.suiteConf.account_connect_db_shopbase.account_name,
        });

        const orderTimelineSendingEmail = orderTimeline.timelineSendEmail;
        await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
        await expect(await orderPage.orderTimeLines(orderInfo.id)).toBeVisible();
        await expect(await orderPage.orderTimeLines(orderPPCInfo.id)).toBeVisible();
      });

      await test.step(`Tại Balance, kiểm tra transaction`, async () => {
        // invoice amount của order khi chỉ có product gốc, chưa có ppc
        const invoiceAmount = (shop.transaction_fee * orderSummaryBeforeCompleteOrd.totalPrice).toFixed(2);
        const amountDisplay = (-invoiceAmount).toString();

        const invoiceAmountPPC = (shop.transaction_fee * ppc.expected_amount_product_ppc).toFixed(2);
        const amountDisplayPPC = (-invoiceAmountPPC).toString();

        await balancePage.goToBalance();
        await balancePage.clickBtnViewTransactions();
        await balancePage.page.waitForSelector(invoicePage.xpathLastestInvoiceAmount);
        // Filter invoice and verify top-up at Invoice list
        await balancePage.filterWithConditionDashboard("More filters", shop.filter_condition);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(conf.suiteConf.filter_tag);

        //verify Transaction dòng 1. Do checkout ppc thì tạo ra 2 transaction có content giống nhau,
        // thứ tự hiện 2 transaction này không cố định nên verify cả 2 transaction
        await verifyTransactionData(
          shop.domain,
          conf.suiteConf.invoice_info.content,
          conf.suiteConf.invoice_info.status,
          1,
        );
        expect(
          (await transactionPage.verifyAmountTransaction(amountDisplay, 1)) ||
            (await transactionPage.verifyAmountTransaction(amountDisplay, 2)),
        ).toBe(true);

        //verify Transaction dòng 2
        await verifyTransactionData(
          shop.domain,
          conf.suiteConf.invoice_info.content,
          conf.suiteConf.invoice_info.status,
          2,
        );
        expect(
          (await transactionPage.verifyAmountTransaction(amountDisplayPPC, 1)) ||
            (await transactionPage.verifyAmountTransaction(amountDisplayPPC, 2)),
        ).toBe(true);

        await transactionPage.clickNewestTransaction();
        expect(
          await transactionPage.verifyContentCollapsed(
            "Invoice",
            `${conf.suiteConf.invoice_info.invoice_collapsed} ${orderName}`,
            invoicePage,
          ),
        ).toBe(true);

        expect(
          await transactionPage.verifyContentCollapsed(
            "Available date",
            conf.suiteConf.invoice_info.source_collapsed,
            invoicePage,
          ),
        ).toBe(true);
      });

      await test.step(`Kiểm tra email gửi cho buyer`, async () => {
        const newPage = await context.newPage();
        mailBox = new MailBox(newPage, shop.domain);
        const emailTitle = mailBox.emailSubject(orderName).orderConfirm;
        await mailBox.openMailDetailWithAPI(customerEmail, emailTitle);
        const actualTotalOrder = await mailBox.getTotalOrder();
        expect(actualTotalOrder).toEqual(totalOrderSF);

        const xpathTextOnPaymentMethodSection = await mailBox.genXpathSectionOfCustomerInfo("Payment method");
        await expect(mailBox.genLoc(xpathTextOnPaymentMethodSection)).toContainText("razorpay");
        await newPage.close();
      });

      await test.step(`Tại dashboard > Analytics: Kiểm tra total sale`, async () => {
        const expectTotalSalesAfter = (totalSalesBefore + orderSummaryInfo.totalSF).toFixed(2);

        for (let i = 0; i < 40; i++) {
          totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shop.shop_id);
          if (totalSalesAfter !== totalSalesBefore) {
            break;
          }
          await orderPage.page.waitForTimeout(5000);
        }
        try {
          expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 0.01)).toEqual(true);
        } catch {
          throw new Error(`Analytics get more than 200s to update`);
        }
      });
    }
  });

  const casesID = "DATA_CHECKOUT";
  const conf = loadData(__dirname, casesID);
  // for each data, will do tests
  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_description: caseDescription,
      theme_version: themeVersion,
      country: country,
      product_ppc: ppc,
      shipping_fee: shippingFee,
      tax_rate: taxRate,
      tip_rate: tipRate,
    }) => {
      test(`@${caseId} - ${caseDescription}`, async ({ context, conf, multipleStore }) => {
        test.slow();
        const shops = conf.suiteConf.shops;
        const shopInfo = await shops.find(shop => shop.theme_version === themeVersion);
        const authRequest = await multipleStore.getAuthRequest(
          conf.suiteConf.username,
          conf.suiteConf.password,
          shopInfo.domain,
          shopInfo.shop_id,
          conf.suiteConf.user_id,
        );
        const dashboardPage = await multipleStore.getDashboardPage(
          conf.suiteConf.username,
          conf.suiteConf.password,
          shopInfo.domain,
          shopInfo.shop_id,
          conf.suiteConf.user_id,
        );
        dashboardAPI = new DashboardAPI(shopInfo.domain, authRequest);
        const orderAPI = new OrderAPI(shopInfo.domain, authRequest);
        const orderPage = new OrdersPage(dashboardPage, shopInfo.domain);
        const balancePage = new BalancePage(dashboardPage, shopInfo.domain);
        transactionPage = new TransactionPage(dashboardPage, shopInfo.domain);
        invoicePage = new InvoicePage(dashboardPage, shopInfo.domain);
        const marketPage = new GlobalMarketAddPage(dashboardPage, shopInfo.domain, authRequest);
        // get total sale ở analytic trước khi checkout order
        totalSalesBefore = await dashboardAPI.getTotalSalesByShopId(shopInfo.shop_id);

        await test.step(`Pre-condition: get auto rate`, async () => {
          dataCountry = await marketPage.getDataCountry(country.country_name);
          expectedPriceWithLocalCurrency = Math.round(
            await marketPage.convertPriceToMarket(country.country_name, shopInfo.products_checkout[0].price),
          );
          const discountWithLocalCurrency = Math.round(
            conf.suiteConf.discount.discount_value * expectedPriceWithLocalCurrency,
          );
          const shippingWithLocalCurrency = Math.round(shippingFee * dataCountry.exchangeRateAuto);
          const taxWithLocalCurrency = Math.round(
            taxRate * (expectedPriceWithLocalCurrency - discountWithLocalCurrency),
          );
          const tipWithLocalCurrencyR = Math.round(
            tipRate * (expectedPriceWithLocalCurrency - discountWithLocalCurrency),
          );

          totalPriceWithLocalCurrency =
            expectedPriceWithLocalCurrency +
            shippingWithLocalCurrency +
            taxWithLocalCurrency +
            tipWithLocalCurrencyR -
            discountWithLocalCurrency;
        });
        // dùng proxy để chuyển IP sang country cần thiết
        const proxyPage = await getProxyPageByCountry(country.country_code);
        await proxyPage.goto(`https://${shopInfo.domain}`);
        await proxyPage.waitForLoadState("networkidle");
        const homePage = new SFHome(proxyPage, shopInfo.domain);
        const checkoutPage = new SFCheckout(proxyPage, shopInfo.domain);
        checkoutAPI = new CheckoutAPI(shopInfo.domain, authRequest, proxyPage);
        if (caseId === "SB_CHE_CORP_04") {
          await homePage.genLoc(homePage.xpathSwitchCurrencyLanguageV2).scrollIntoViewIfNeeded();
          await expect(homePage.genLoc(homePage.xpathSwitchCurrencyLanguageV2)).toContainText(
            country.show_country_currency,
          );
        } else {
          await homePage.genLoc(homePage.xpathBlockGlobalSwitcher).click();
          await homePage.page.waitForSelector(homePage.xpathGlobalSwitcher.xpathPopupGlobalSwitcher);

          await expect(homePage.genLoc(homePage.xpathGlobalSwitcher.xpathCountrySelected)).toContainText(
            country.country_name,
          );
          await expect(homePage.genLoc(homePage.xpathGlobalSwitcher.xpathLanguageOrCurrencySelected(2))).toContainText(
            country.currency_format,
          );
          await homePage.genLoc(homePage.xpathBtnWithLabel("Save")).click();
        }

        await test.step(`Tại Store-front:          
        + Buyer add product (có hỗ trợ PPC) có giá $10 to cart và đi đến trang checkout  
        + Buyer nhập thông tin shipping đến India, chọn shipping method.  
        + Apply discount code: "auto discount 10".  
        + Tại block Payment: chọn Razorpay  
        + Click button "Place your order"`, async () => {
          await checkoutAPI.addProductThenSelectShippingMethodWithNE(
            shopInfo.products_checkout,
            conf.suiteConf.email_buyer,
            conf.suiteConf.shipping_address_to_India,
          );
          await checkoutAPI.openCheckoutPageByToken();
          await checkoutPage.waitForElementVisibleThenInvisible(checkoutPage.xpathSkeletonSummaryBlock);
          await checkoutPage.inputDiscountBox.scrollIntoViewIfNeeded();
          await checkoutPage.applyDiscountCode(conf.suiteConf.discount.discount_code);
          await checkoutPage.footerLoc.scrollIntoViewIfNeeded();

          const urlParts = checkoutPage.page.url().split("/");
          checkoutToken = urlParts[urlParts.length - 1];

          await checkoutPage.selectPaymentMethod(conf.suiteConf.payment_method);
          // Get summary order, compare total order, currency > sau đó click btn complete
          orderSummaryBeforeCompleteOrd = await checkoutPage.getOrderSummaryInfo();
          const totalOrder = await checkoutPage.getTotalOnOrderSummary();
          // totalOrder đang hiện theo INR, trước khi verify cần xóa currency symbol và dấu phẩy
          expect(
            isEqual(
              parseFloat(totalOrder.replace(/[^0-9.-]/g, "")),
              totalPriceWithLocalCurrency,
              0.05 * dataCountry.exchangeRateAuto,
            ),
          ).toBe(true);
          expect(totalOrder).toContain(`${country.currency_symbol}`);

          await checkoutPage.clickBtnCompleteOrder();
          await checkoutPage.loginRazorpayByBuyer(conf.suiteConf.buyer_info);
          const totalOrderAmountOnPopup = await checkoutPage.getTotalAmountOnRazorpayPopup();
          expect(totalOrderAmountOnPopup).toEqual(`${totalOrder}`);
        });

        await test.step(`Chọn phương thức thanh toán trên cổng và complete order`, async () => {
          await checkoutPage.completeOrderViaRazorpay(conf.suiteConf.card_info);
          await expect(checkoutPage.genLoc(`${checkoutPage.xpathPPCV2}, ${checkoutPage.xpathPPCBLock}`)).toBeVisible();
          await checkoutPage.page.waitForSelector(`${checkoutPage.xpathPPCV2}, ${checkoutPage.xpathPPCBLock}`);
        });

        await test.step(`Thêm product PPC`, async () => {
          itemPostPurchaseValue = await checkoutPage.addProductPostPurchase(ppc.product_ppc_name);
          totalOrderAmountOnPopup = await checkoutPage.getTotalAmountOnRazorpayPopup();
          const expectedPricePPC = Math.round(await marketPage.convertPriceToMarket(country.country_name, ppc.price));
          const expectedTaxPPC = Math.round(taxRate * expectedPricePPC);
          expectedAmountProductPPC = expectedPricePPC + expectedTaxPPC;
          expect(
            isEqual(
              parseFloat(totalOrderAmountOnPopup.replace(/[^0-9.-]/g, "")),
              expectedAmountProductPPC,
              0.05 * dataCountry.exchangeRateAuto,
            ),
          );

          expect(totalOrderAmountOnPopup).toContain(`${country.currency_symbol}`);
        });

        await test.step(`Chọn phương thức thanh toán trên cổng và complete order`, async () => {
          await checkoutPage.completeOrderViaRazorpay(conf.suiteConf.card_info);
          await checkoutPage
            .genLoc(checkoutPage.getProductSelectorInOrder(ppc.product_ppc_name, shopInfo.version))
            .waitFor({ state: "visible", timeout: 120 * 1000 });

          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          customerEmail = await checkoutPage.getCustomerEmail();
          orderName = await checkoutPage.getOrderName();
          totalOrderSF = await checkoutPage.getTotalOnOrderSummary();
          expect(
            isEqual(
              parseFloat(orderSummaryInfo.totalSF.toString().replace(/\./g, "")),
              parseFloat(orderSummaryBeforeCompleteOrd.totalPrice.toString().replace(/\./g, "")) +
                expectedAmountProductPPC,
              0.05 * dataCountry.exchangeRateAuto,
            ),
          ).toBe(true);

          expect(await checkoutPage.genLoc(checkoutPage.xpathPaymentMethodThankyouPage).innerText()).toEqual(
            "Razorpay",
          );
        });

        await test.step(`- Login dashboard Razorpay của seller đã connect với shop
        - Chọn module Transaction`, async () => {
          const receipt = `sbo_${checkoutToken}`;
          const receiptPPC = `sbo_${checkoutToken}_pp`;

          // get thông tin transaction tại tab Order ở razorpay dashboard khi checkout với product gốc
          orderInfo = await orderAPI.getOrdInfoInRazorpay(
            {
              keyID: conf.suiteConf.account_connect_db_shopbase.key_id,
              keySecret: conf.suiteConf.account_connect_db_shopbase.key_secret,
            },
            receipt,
          );
          // verify amount của order tạo đầu tiên, khi chưa add product post purchase
          expect(orderInfo.total_amount / 100).toEqual(
            parseFloat(orderSummaryBeforeCompleteOrd.totalPrice.toString().replace(".", "")),
          );
          expect(orderInfo.currency).toEqual(country.currency);

          // get thông tin transaction tại tab Order ở razorpay dashboard khi checkout với product post purchase
          orderPPCInfo = await orderAPI.getOrdInfoInRazorpay(
            {
              keyID: conf.suiteConf.account_connect_db_shopbase.key_id,
              keySecret: conf.suiteConf.account_connect_db_shopbase.key_secret,
            },
            receiptPPC,
          );
          // verify amount của order tạo sau khi add product post purchase
          expect(orderPPCInfo.total_amount / 100).toEqual(parseFloat(totalOrderAmountOnPopup.replace(/[^0-9.-]/g, "")));
          expect(orderPPCInfo.currency).toEqual(country.currency);
        });

        await test.step(`Tại dashboard > Order> Kiểm tra order list > Click vào xem detail order vừa tạo`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          const orderStatus = await orderPage.reloadUntilOrdCapture(null, 20);
          expect(orderStatus).toEqual("Paid");

          // verify order amount
          actTotalOrder = await orderPage.getTotalOrder();
          const expTotalOrderConverShopCurrency =
            parseFloat(orderSummaryInfo.totalSF.toString().replace(/\./g, "")) / dataCountry.exchangeRateAuto;
          expect(isEqual(parseFloat(removeCurrencySymbol(actTotalOrder)), expTotalOrderConverShopCurrency, 0.05)).toBe(
            true,
          );

          const paidByCustomer = await orderPage.getPaidByCustomer();
          expect(isEqual(parseFloat(removeCurrencySymbol(paidByCustomer)), expTotalOrderConverShopCurrency, 0.05)).toBe(
            true,
          );

          const orderTimeline = orderPage.generateOrdTimeline(conf.suiteConf.shipping_address_to_India, {
            total_amount: orderSummaryInfo.totalSF.toString(),
            payment_gateway: "Razorpay",
            item_post_purchase_value: itemPostPurchaseValue,
            account_name: conf.suiteConf.account_connect_db_shopbase.account_name,
          });
          const orderTimelineSendingEmail = orderTimeline.timelineSendEmail;
          const orderTimelineCustomerPlaceOrder = orderTimeline.timelinePlaceOrd;

          await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
          await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
          await expect(await orderPage.orderTimeLines(orderInfo.id)).toBeVisible();
          await expect(await orderPage.orderTimeLines(orderPPCInfo.id)).toBeVisible();
        });

        await test.step(`click btn Switch currency`, async () => {
          await orderPage.switchCurrency();

          // verify order amount with currency checkout (INR)
          const actTotalOrder = await orderPage.getTotalOrder();
          expect(
            isEqual(
              parseFloat(actTotalOrder.replace(/[^0-9.-]/g, "")),
              parseFloat(orderSummaryInfo.totalSF.toString().replace(/\./g, "")),
              0.05 * dataCountry.exchangeRateAuto,
            ),
          );

          const paidByCustomer = await orderPage.getPaidByCustomer();
          expect(paidByCustomer).toEqual(totalOrderSF);

          const settingPrice = await orderPage.getInfoSwitchCurrency();
          const expectedExchangeRate = dataCountry.exchangeRateAuto.toFixed(4);
          expect(settingPrice.exchangeRate).toEqual(expectedExchangeRate);

          expect(settingPrice.priceAdjustment).toEqual(`${dataCountry.priceAddjustment}%`);
          if (dataCountry.isRouding) {
            expect(settingPrice.rounding).toEqual(dataCountry.rounding.toFixed(2));
          } else {
            expect(settingPrice.rounding).toEqual("-");
          }
        });

        await test.step(`Tại Balance, kiểm tra transaction`, async () => {
          // invoice amount tính theo USD, USD cũng là store currency nên cần đổi total order ở SF từ INR sang USD trước
          const invoiceAmount = (
            (shopInfo.transaction_fee *
              parseFloat(orderSummaryBeforeCompleteOrd.totalPrice.toString().replace(/\./g, ""))) /
            dataCountry.exchangeRateAuto
          ).toFixed(2);
          const amountDisplay = (-invoiceAmount).toString();

          const invoiceAmountPPC = (
            (shopInfo.transaction_fee * expectedAmountProductPPC) /
            dataCountry.exchangeRateAuto
          ).toFixed(2);
          const amountDisplayPPC = (-invoiceAmountPPC).toString();

          await balancePage.goToBalance();
          await balancePage.clickBtnViewTransactions();
          await balancePage.page.waitForSelector(invoicePage.xpathLastestInvoiceAmount);

          // Filter invoice and verify top-up at Invoice list
          await balancePage.filterWithConditionDashboard("More filters", shopInfo.filter_condition);
          await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(conf.suiteConf.filter_tag);

          //verify Transaction dòng 1. Do checkout ppc thì tạo ra 2 transaction có content giống nhau,
          // thứ tự hiện 2 transaction này không cố định nên verify cả 2 transaction
          await verifyTransactionData(
            shopInfo.domain,
            conf.suiteConf.invoice_info.content,
            conf.suiteConf.invoice_info.status,
            1,
          );
          expect(
            (await transactionPage.verifyAmountTransaction(amountDisplay, 1)) ||
              (await transactionPage.verifyAmountTransaction(amountDisplay, 2)),
          ).toBe(true);

          //verify Transaction dòng 2
          await verifyTransactionData(
            shopInfo.domain,
            conf.suiteConf.invoice_info.content,
            conf.suiteConf.invoice_info.status,
            2,
          );
          expect(
            (await transactionPage.verifyAmountTransaction(amountDisplayPPC, 1)) ||
              (await transactionPage.verifyAmountTransaction(amountDisplayPPC, 2)),
          ).toBe(true);

          await transactionPage.clickNewestTransaction();
          expect(
            await transactionPage.verifyContentCollapsed(
              "Invoice",
              `${conf.suiteConf.invoice_info.invoice_collapsed} ${orderName}`,
              invoicePage,
            ),
          ).toBe(true);

          expect(
            await transactionPage.verifyContentCollapsed(
              "Available date",
              conf.suiteConf.invoice_info.source_collapsed,
              invoicePage,
            ),
          ).toBe(true);
        });

        await test.step(`Kiểm tra email gửi cho buyer`, async () => {
          const newPage = await context.newPage();
          mailBox = new MailBox(newPage, shopInfo.domain);
          const emailTitle = mailBox.emailSubject(orderName).orderConfirm;
          await mailBox.openMailDetailWithAPI(customerEmail, emailTitle);
          const actualTotalOrder = await mailBox.getTotalOrder();
          expect(actualTotalOrder).toEqual(totalOrderSF);

          const xpathTextOnPaymentMethodSection = await mailBox.genXpathSectionOfCustomerInfo("Payment method");
          await expect(mailBox.genLoc(xpathTextOnPaymentMethodSection)).toContainText("razorpay");
          await newPage.close();
        });

        await test.step(`Tại dashboard > Analytics: Kiểm tra total sale`, async () => {
          const expectTotalSalesAfter = (totalSalesBefore + parseFloat(removeCurrencySymbol(actTotalOrder))).toFixed(2);

          for (let i = 0; i < 40; i++) {
            totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopInfo.shop_id);
            if (totalSalesAfter !== totalSalesBefore) {
              break;
            }
            await orderPage.page.waitForTimeout(5000);
          }
          try {
            expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 0.05)).toEqual(true);
          } catch {
            throw new Error(`Analytics get more than 200s to update`);
          }
        });
      });
    },
  );
});
