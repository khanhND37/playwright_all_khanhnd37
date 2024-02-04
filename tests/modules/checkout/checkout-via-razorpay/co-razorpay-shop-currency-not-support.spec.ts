import { loadData } from "@core/conf/conf";
import { test, expect } from "@core/fixtures";
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
import { MailBox } from "@pages/thirdparty/mailbox";
import { OrderAfterCheckoutInfo, OrderSummary, TransactionInfoInRazorpay } from "@types";

test.describe(`Verify checkout one page with razorpay khi shop currency not support`, () => {
  let orderSummaryInfo: OrderAfterCheckoutInfo,
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
    dataCountry: dataCurrencyOfCountry,
    expectedPriceWithLocalCurrency: number,
    totalPriceWithLocalCurrency: number,
    orderInfo: TransactionInfoInRazorpay,
    actTotalOrder: string,
    totalSalesBefore,
    totalSalesAfter;

  const casesID = "DATA_CHECKOUT_SHOP_CURRENCY_NOT_SUPPORT";
  const conf = loadData(__dirname, casesID);
  // for each data, will do tests
  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_description: caseDescription,
      theme_version: themeVersion,
      country: country,
      shipping_fee: shippingFee,
      tax_rate: taxRate,
      tip_rate: tipRate,
    }) => {
      test(`@${caseId} - ${caseDescription}`, async ({ context, conf, multipleStore }) => {
        test.slow();
        const shops = conf.suiteConf.shop_currency_not_supported;
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
        // get total sale ở analytic trước khi checkout order
        totalSalesBefore = await dashboardAPI.getTotalSalesByShopId(shopInfo.shop_id);

        await test.step(`Pre-condition: get auto rate`, async () => {
          const marketPage = new GlobalMarketAddPage(dashboardPage, shopInfo.domain, authRequest);
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
        if (caseId === "SB_CHE_CORP_12") {
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
          + Buyer add product (có hỗ trợ PPC) to cart và đi đến trang checkout  
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
          // do totalOrder hiển thị theo INR thì chỉ có dấu phẩy ngăn cách hàng nghìn,
          // nên trước khi verify thì xóa dấu phẩy và curency symbol đi
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
          expect(totalOrderAmountOnPopup).toEqual(
            `${country.currency_symbol} ${orderSummaryBeforeCompleteOrd.totalPrice.toString().replace(".", "")}`,
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
          expect(
            isEqual(orderSummaryInfo.totalSF, orderSummaryBeforeCompleteOrd.totalPrice, 0.05 * country.rate_usd_to_inr),
          ).toBe(true);

          expect(await checkoutPage.genLoc(checkoutPage.xpathPaymentMethodThankyouPage).innerText()).toEqual(
            "Razorpay",
          );
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
          expect(orderInfo.total_amount / 100).toEqual(
            parseFloat(orderSummaryInfo.totalSF.toString().replace(".", "")),
          );
          expect(orderInfo.currency).toEqual(country.currency);
        });

        await test.step(`Tại dashboard > Order> Kiểm tra order list > Click vào xem detail order vừa tạo`, async () => {
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          const orderStatus = await orderPage.reloadUntilOrdCapture(null, 20);
          expect(orderStatus).toEqual("Paid");

          // verify order amount, lấy rate trung bình 1 usd = 24420vnđ => threshold lệch tối đa 0.05usd = 1221vnd
          actTotalOrder = await orderPage.getTotalOrder();
          const expTotalOrderConverShopCurrency =
            parseFloat(orderSummaryInfo.totalSF.toString().replace(/\./g, "")) / dataCountry.exchangeRateAuto;
          expect(
            isEqual(
              parseFloat(removeCurrencySymbol(actTotalOrder).replace(/\./g, "")),
              expTotalOrderConverShopCurrency,
              1221,
            ),
          ).toBe(true);

          const paidByCustomer = await orderPage.getPaidByCustomer();
          expect(
            isEqual(
              parseFloat(removeCurrencySymbol(paidByCustomer).replace(/\./g, "")),
              expTotalOrderConverShopCurrency,
              1221,
            ),
          ).toBe(true);

          const orderTimeline = orderPage.generateOrdTimeline(conf.suiteConf.shipping_address_to_India, {
            total_amount: orderSummaryInfo.totalSF.toString(),
            payment_gateway: "Razorpay",
            item_post_purchase_value: "0",
            account_name: conf.suiteConf.account_connect_db_shopbase.account_name,
          });
          const orderTimelineSendingEmail = orderTimeline.timelineSendEmail;
          const orderTimelineCustomerPlaceOrder = orderTimeline.timelinePlaceOrd;

          await expect(await orderPage.orderTimeLines(orderTimelineSendingEmail)).toBeVisible();
          await expect(await orderPage.orderTimeLines(orderTimelineCustomerPlaceOrder)).toBeVisible();
          await expect(await orderPage.orderTimeLines(orderInfo.id)).toBeVisible();
        });

        await test.step(`click btn Switch currency`, async () => {
          await orderPage.switchCurrency();

          // verify order amount
          const actTotalOrder = await orderPage.getTotalOrder();
          expect(actTotalOrder).toEqual(totalOrderSF);

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
          // invoice amount tính theo USD, vnd là store currency nên cần đổi total order trong sb từ VNĐ sang USD trước
          // hoặc đổi trực tiếp total order ở SF từ INR sang USD
          const invoiceAmount = (
            (shopInfo.transaction_fee *
              parseFloat(orderSummaryBeforeCompleteOrd.totalPrice.toString().replace(/\./g, ""))) /
            country.rate_usd_to_inr
          ).toFixed(2);
          const amountDisplay = (-invoiceAmount).toString();

          await balancePage.goToBalance();
          await balancePage.clickBtnViewTransactions();
          await balancePage.page.waitForSelector(invoicePage.xpathLastestInvoiceAmount);

          // Filter invoice and verify top-up at Invoice list
          await balancePage.filterWithConditionDashboard("More filters", shopInfo.filter_condition);
          await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(conf.suiteConf.filter_tag);

          expect(await invoicePage.verifyDataWithColumnName("Shop Domain", shopInfo.domain)).toBe(true);
          expect(await invoicePage.verifyDataWithColumnName("Invoice", conf.suiteConf.invoice_info.content)).toBe(true);
          expect(await invoicePage.verifyDataWithColumnName("Status", conf.suiteConf.invoice_info.status)).toBe(true);
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
          mailBox = new MailBox(newPage, shopInfo.domain);
          const emailTitle = mailBox.emailSubject(orderName).orderConfirm;
          await mailBox.openMailDetailWithAPI(customerEmail, emailTitle);
          const actualTotalOrder = await mailBox.getTotalOrder();
          expect(actualTotalOrder).toEqual(totalOrderSF);

          const xpathTextOnPaymentMethodSection = await mailBox.genXpathSectionOfCustomerInfo("Payment method");
          await expect(mailBox.genLoc(xpathTextOnPaymentMethodSection)).toContainText("razorpay");
        });

        await test.step(`Tại dashboard > Analytics: Kiểm tra total sale`, async () => {
          const expectTotalSalesAfter =
            totalSalesBefore + parseFloat(removeCurrencySymbol(actTotalOrder).replace(/\./g, ""));

          for (let i = 0; i < 40; i++) {
            totalSalesAfter = await dashboardAPI.getTotalSalesByShopId(shopInfo.shop_id);
            if (totalSalesAfter !== totalSalesBefore) {
              break;
            }
            await orderPage.page.waitForTimeout(5000);
          }
          try {
            // threshold lệch tối đa $0.05 tương đương với (0.05 * 24221.8727) theo rate: 1 USD = 24221.872706 VND
            expect(isEqual(expectTotalSalesAfter, totalSalesAfter, 1211)).toEqual(true);
          } catch {
            throw new Error(`Analytics get more than 200s to update`);
          }
        });
      });
    },
  );
});
