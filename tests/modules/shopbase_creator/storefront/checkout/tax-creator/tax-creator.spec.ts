/* eslint-disable @typescript-eslint/no-unused-vars */
import { loadData } from "@core/conf/conf";
import { OrderAPI } from "@pages/api/order";
import { expect, test } from "@core/fixtures";
import { isEqual } from "@core/utils/checkout";
import { DashboardAPI } from "@pages/api/dashboard";
import { HiveSpay } from "@pages/hive/shopbase/hive_spay";
import { removeCurrencySymbol } from "@core/utils/string";
import { PaymentMethod } from "@pages/storefront/checkout";
import { CheckoutCreatorAPI } from "@pages/api/dpro/checkout";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { AnalyticsAPI } from "@pages/shopbase_creator/api/analytics";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import type { Product, ShippingAddress, ShopInfos, TaxInfor } from "@types";
import { PaymentProviderAPI } from "@pages/shopbase_creator/api/payment_providers";
import { AllProductStorefront } from "@pages/shopbase_creator/storefront/all_product";

const verifyTaxOnOrderSummary = (expectTaxAmt: number, actualTaxAmt: string, isTaxInclude?: boolean) => {
  if (isTaxInclude) {
    expect(actualTaxAmt).toEqual("Tax included");
    return;
  }
  expect(Number(actualTaxAmt).toFixed(2)).toEqual(expectTaxAmt.toFixed(2));
};

test.describe(`Tax creator`, () => {
  let domain: string;
  let countryCode: string;
  let expectTaxAmt: number;
  let actualTaxAmt: string;
  let accessToken: string;
  let isTaxInclude: boolean;
  let shopTemplate: ShopInfos;
  let productInfo: Array<Product>;
  let customerInfo: ShippingAddress;
  let productInfoNO2: Array<Product>;

  let orderPage: OrderPage;
  let taxRates: Array<TaxInfor>;
  let checkoutPage: CheckoutForm;
  let dashboardAPI: DashboardAPI;
  let dashboardTempAPI: DashboardAPI;
  let checkoutAPI: CheckoutCreatorAPI;
  let productPage: AllProductStorefront;

  test.beforeAll(async ({ conf, token, request }) => {
    domain = conf.suiteConf.domain;
    taxRates = conf.suiteConf.tax_rates;
    shopTemplate = conf.suiteConf.shop_template;
    customerInfo = conf.suiteConf.customer_info;

    dashboardTempAPI = new DashboardAPI(shopTemplate.domain, request);

    const shopToken = await token.getWithCredentials({
      domain: shopTemplate.domain,
      username: shopTemplate.username,
      password: shopTemplate.password,
    });
    accessToken = shopToken.access_token;

    await dashboardTempAPI.deleteAllTaxRate(accessToken);
    for (const taxRate of taxRates) {
      await dashboardTempAPI.addNewTaxRate(taxRate, accessToken);
    }
  });

  test.beforeEach(async ({ conf, dashboard, page, authRequest }) => {
    productInfo = conf.caseConf.product_info;
    countryCode = conf.caseConf.country_code;
    isTaxInclude = conf.caseConf.is_tax_include;
    productInfoNO2 = conf.caseConf.product_info_with_tax;

    orderPage = new OrderPage(dashboard, domain);
    checkoutPage = new CheckoutForm(page, domain);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    productPage = new AllProductStorefront(page, domain);
    checkoutAPI = new CheckoutCreatorAPI(domain, authRequest, page);

    await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude });
  });

  test(`@SB_TM_SC_TAX_50 [Creator] Kiểm tra UI checkout form tại sales page có thêm 2 field Name + Country, hiển thị line tax tại order summary trong checkout form, thank you page và order details`, async () => {
    await test.step(`
      - Tại SF:
        + Mở trang Sales page product Album
        + Nhập country tới Vietnam
        + Completed order, lưu lại order name`, async () => {
      await productPage.gotoHomePage();
      await productPage.selectCreatorProduct(productInfo[0].name);
      await checkoutPage.enterEmail(customerInfo.email);
      await checkoutPage.inputFirstName(customerInfo.first_name);
      await checkoutPage.inputLastName(customerInfo.last_name);
      await checkoutPage.selectCountry(countryCode[0]);

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
      actualTaxAmt = await checkoutPage.getTaxCreator();
      expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
      // await expect(checkoutPage.taxLineLoc).toBeHidden();

      await checkoutPage.completeOrderWithCardInfo();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
      verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt);
    });

    await test.step(`- Tại DB: Truy cập order details của order vừa tạo bằng order name`, async () => {
      const orderId = await checkoutPage.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture();

      actualTaxAmt = await orderPage.getTaxValue();
      verifyTaxOnOrderSummary(expectTaxAmt, removeCurrencySymbol(actualTaxAmt));
    });

    await test.step(`
      - Tại SF:
        + Mở trang Sales page product Album
        + Nhập country tới United States
        + Completed order, lưu lại order name`, async () => {
      await productPage.gotoHomePage();
      await productPage.selectCreatorProduct(productInfoNO2[0].name);
      await checkoutPage.enterEmail(customerInfo.email);
      await checkoutPage.inputFirstName(customerInfo.first_name);
      await checkoutPage.inputLastName(customerInfo.last_name);
      await checkoutPage.selectCountry(countryCode[1]);

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfoNO2);
      // Bug feature khiến line tax luôn hiển thị 0.00, wait để update tax , sẽ bỏ cmt khi bug đã fix
      await checkoutPage.page.waitForTimeout(2000);
      actualTaxAmt = await checkoutPage.getTaxCreator();
      expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
      await expect(checkoutPage.page.locator(checkoutPage.xpathTaxLine)).toBeVisible();

      await checkoutPage.completeOrderWithCardInfo();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

      actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
      if (actualTaxAmt !== "Tax included") {
        actualTaxAmt = removeCurrencySymbol(actualTaxAmt);
      }
      verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt, isTaxInclude);
    });

    await test.step(`- Tại DB: Truy cập order details của order vừa tạo bằng order name`, async () => {
      const orderId = await checkoutPage.getOrderIdBySDK();
      await orderPage.goToOrderByOrderId(orderId);

      //cause sometimes order captures slower than usual
      await orderPage.reloadUntilOrdCapture();

      actualTaxAmt = await orderPage.getTaxValue();
      verifyTaxOnOrderSummary(expectTaxAmt, removeCurrencySymbol(actualTaxAmt));
    });
  });

  test(`@SB_TM_SC_TAX_51 [Creator] Kiểm tra tax hiển thị tại checkout form, thank you page và order details khi set threshold của tax rate có min amount và max amount`, async () => {
    await test.step(`
      - Tại SF: 
        + Bật dev tools
        + Mở trang sales page của product Album1 và nhập country = Vietnam
        + Mở trang sales page của product Album2 và nhập country = Vietnam
        + Mở trang sales page của product Album3 và nhập country = Vietnam
        + Completed order với product Album2`, async () => {
      for (const product of productInfo) {
        await productPage.gotoHomePage();
        await productPage.selectCreatorProduct(product.name);
        await checkoutPage.enterEmail(customerInfo.email);
        await checkoutPage.inputFirstName(customerInfo.first_name);
        await checkoutPage.inputLastName(customerInfo.last_name);
        await checkoutPage.selectCountry(countryCode[0]);

        expectTaxAmt = await checkoutAPI.calculateTaxByLineItem([product]);
        actualTaxAmt = await checkoutPage.getTaxCreator();
        expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
        // await expect(checkoutPage.taxLineLoc).toBeHidden();

        if (productInfo[productInfo.length - 1]) {
          await checkoutPage.completeOrderWithCardInfo();
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
        }
      }
    });

    await test.step(`- Kiểm tra API info.json() sau khi checkout thành công`, async () => {
      actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
      verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt);
    });

    await test.step(`
      - Tại SF: 
        + Mở trang sales page của product Album1 và nhập country = United States
        + Mở trang sales page của product Album3 và nhập country = United States
        + Completed order với product Album3`, async () => {
      for (const product of productInfoNO2) {
        await productPage.gotoHomePage();
        await productPage.selectCreatorProduct(product.name);
        await checkoutPage.enterEmail(customerInfo.email);
        await checkoutPage.inputFirstName(customerInfo.first_name);
        await checkoutPage.inputLastName(customerInfo.last_name);
        await checkoutPage.selectCountry(countryCode[1]);

        expectTaxAmt = await checkoutAPI.calculateTaxByLineItem([product]);
        actualTaxAmt = await checkoutPage.getTaxCreator();
        expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
        // await expect(checkoutPage.taxLineLoc).toBeHidden();

        if (productInfo[1]) {
          await checkoutPage.completeOrderWithCardInfo();
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
          break;
        }
      }
    });

    await test.step(`- Kiểm tra API info.json() sau khi checkout thành công`, async () => {
      actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
      verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt);
    });

    await test.step(`
      - Tại SF: 
        + Mở trang sales page của product Album2 và nhập country = United States
        + Completed order với product Album2`, async () => {
      await productPage.gotoHomePage();
      await productPage.selectCreatorProduct(productInfoNO2[2].name);
      await checkoutPage.enterEmail(customerInfo.email);
      await checkoutPage.inputFirstName(customerInfo.first_name);
      await checkoutPage.inputLastName(customerInfo.last_name);
      await checkoutPage.selectCountry(countryCode[1]);

      expectTaxAmt = await checkoutAPI.calculateTaxByLineItem([productInfoNO2[2]]);
      // Bug feature khiến line tax luôn hiển thị 0.00, wait để update tax , sẽ bỏ cmt khi bug đã fix
      await checkoutPage.page.waitForTimeout(2000);
      actualTaxAmt = await checkoutPage.getTaxCreator();
      expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
      await expect(checkoutPage.page.locator(checkoutPage.xpathTaxLine)).toBeVisible();

      await checkoutPage.completeOrderWithCardInfo();
      await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
    });

    await test.step(`- Kiểm tra API info.json() sau khi checkout thành công`, async () => {
      actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
      if (actualTaxAmt !== "Tax included") {
        actualTaxAmt = removeCurrencySymbol(actualTaxAmt);
      }
      verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt, isTaxInclude);
    });
  });
});

test.describe(`Tax checkout: Data driven`, () => {
  let domain: string;
  let accessToken: string;
  let expectTaxAmt: number;
  let actualTaxAmt: string;
  let shopTemplate: ShopInfos;
  let customerInfo: ShippingAddress;

  let checkoutPage: CheckoutForm;
  let dashboardAPI: DashboardAPI;
  let dashboardTempAPI: DashboardAPI;
  let checkoutAPI: CheckoutCreatorAPI;
  let productPage: AllProductStorefront;

  test.beforeAll(async ({ conf, token, request }) => {
    domain = conf.suiteConf.domain;
    shopTemplate = conf.suiteConf.shop_template;
    customerInfo = conf.suiteConf.customer_info;

    dashboardTempAPI = new DashboardAPI(shopTemplate.domain, request);

    const shopToken = await token.getWithCredentials({
      domain: shopTemplate.domain,
      username: shopTemplate.username,
      password: shopTemplate.password,
    });
    accessToken = shopToken.access_token;
  });

  let caseName = "CASE_GROUP_1";
  let conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      tax_rates: taxRates,
      product_info: productInfo,
      country_code: countryCode,
      is_tax_include: isTaxInclude,
      product_info_with_tax: productInfoNO2,
    }) => {
      test(`@${caseID} - ${caseName}`, async ({ page, authRequest }) => {
        checkoutPage = new CheckoutForm(page, domain);
        dashboardAPI = new DashboardAPI(domain, authRequest);
        productPage = new AllProductStorefront(page, domain);
        checkoutAPI = new CheckoutCreatorAPI(domain, authRequest, page);

        await test.step(`Pre-condition`, async () => {
          await dashboardTempAPI.deleteAllTaxRate(accessToken);
          for (const taxRate of taxRates) {
            await dashboardTempAPI.addNewTaxRate(taxRate, accessToken);
          }
          await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude });
        });

        await test.step(`
        - Tại SF: 
          + Mở trang sales page của product Album1 và nhập country = Vietnam
          + Mở trang sales page của product Album2 và nhập country = Vietnam
          + Completed order với product Album2`, async () => {
          for (const product of productInfo) {
            await productPage.gotoHomePage();
            await productPage.selectCreatorProduct(product.name);
            await checkoutPage.enterEmail(customerInfo.email);
            await checkoutPage.inputFirstName(customerInfo.first_name);
            await checkoutPage.inputLastName(customerInfo.last_name);
            await checkoutPage.selectCountry(countryCode[0]);

            expectTaxAmt = await checkoutAPI.calculateTaxByLineItem([product]);
            actualTaxAmt = await checkoutPage.getTaxCreator();
            expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
            // await expect(checkoutPage.taxLineLoc).toBeHidden();

            if (productInfo[productInfo.length - 1]) {
              await checkoutPage.completeOrderWithCardInfo();
              await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
            }
          }
        });

        await test.step(`- Kiểm tra API info.json() sau khi checkout thành công`, async () => {
          actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
          if (actualTaxAmt !== "Tax included") {
            actualTaxAmt = removeCurrencySymbol(actualTaxAmt);
          }
          verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt, isTaxInclude);
        });

        await test.step(`
        - Tại SF: 
          + Mở trang sales page của product Album1 và nhập country = United States
          + Completed order với product Album1`, async () => {
          await productPage.gotoHomePage();
          await productPage.selectCreatorProduct(productInfo[0].name);
          await checkoutPage.enterEmail(customerInfo.email);
          await checkoutPage.inputFirstName(customerInfo.first_name);
          await checkoutPage.inputLastName(customerInfo.last_name);
          await checkoutPage.selectCountry(countryCode[1]);

          expectTaxAmt = await checkoutAPI.calculateTaxByLineItem([productInfo[0]]);
          actualTaxAmt = await checkoutPage.getTaxCreator();
          expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
          // await expect(checkoutPage.taxLineLoc).toBeHidden();

          await checkoutPage.completeOrderWithCardInfo();
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
        });

        await test.step(`- Kiểm tra API info.json() sau khi checkout thành công`, async () => {
          actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
          if (actualTaxAmt !== "Tax included") {
            actualTaxAmt = removeCurrencySymbol(actualTaxAmt);
          }
          verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt, isTaxInclude);
        });

        await test.step(`
        - Tại SF: 
          + Mở trang sales page của product Album2 và nhập country = United States
          + Completed order với product Album2`, async () => {
          await productPage.gotoHomePage();
          await productPage.selectCreatorProduct(productInfoNO2.name);
          await checkoutPage.enterEmail(customerInfo.email);
          await checkoutPage.inputFirstName(customerInfo.first_name);
          await checkoutPage.inputLastName(customerInfo.last_name);
          await checkoutPage.selectCountry(countryCode[1]);

          expectTaxAmt = await checkoutAPI.calculateTaxByLineItem([productInfoNO2]);
          // Bug feature khiến line tax luôn hiển thị 0.00, wait để update tax , sẽ bỏ cmt khi bug đã fix
          await checkoutPage.page.waitForTimeout(2000);
          actualTaxAmt = await checkoutPage.getTaxCreator();
          expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
          // await expect(checkoutPage.taxLineLoc).toBeHidden();

          await checkoutPage.completeOrderWithCardInfo();
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });
        });

        await test.step(`- Kiểm tra API info.json() sau khi checkout thành công`, async () => {
          actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
          if (actualTaxAmt !== "Tax included") {
            actualTaxAmt = removeCurrencySymbol(actualTaxAmt);
          }
          verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt, isTaxInclude);
        });
      });
    },
  );

  caseName = "CASE_GROUP_2";
  conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      tax_rates: taxRates,
      product_info: productInfo,
      country_code: countryCode,
      is_tax_include: isTaxInclude,
    }) => {
      let actualTaxAmt: number;
      test(`@${caseID} - ${caseName}`, async ({ page, authRequest }) => {
        checkoutPage = new CheckoutForm(page, domain);
        dashboardAPI = new DashboardAPI(domain, authRequest);
        productPage = new AllProductStorefront(page, domain);
        checkoutAPI = new CheckoutCreatorAPI(domain, authRequest, page);

        await test.step(`Pre-condition`, async () => {
          await dashboardTempAPI.deleteAllTaxRate(accessToken);
          for (const taxRate of taxRates) {
            await dashboardTempAPI.addNewTaxRate(taxRate, accessToken);
          }
          await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude });
        });

        await test.step(`
          - Tạo order bằng API với các thông tin: 
            + Product: Album+ Country: US
            + Region: California
          - Note: Có thể tạo order bằng API với các tool Postman, Jmeter, Playwright`, async () => {
          await productPage.gotoHomePage();
          await productPage.selectCreatorProduct(productInfo.name);
          await checkoutPage.enterEmail(customerInfo.email);
          await checkoutPage.inputFirstName(customerInfo.first_name);
          await checkoutPage.inputLastName(customerInfo.last_name);
          await checkoutPage.selectCountry(countryCode);
          await checkoutPage.completeOrderWithCardInfo();
          await expect(checkoutPage.thankyouPageLoc).toBeVisible({ timeout: 10000 });

          const checkoutToken = checkoutPage.getCheckoutToken();
          checkoutAPI = new CheckoutCreatorAPI(domain, authRequest, page, checkoutToken);

          expectTaxAmt = await checkoutAPI.calculateTaxByLineItem([productInfo]);
          actualTaxAmt = await checkoutAPI.getTotalTax();
          expect(actualTaxAmt.toFixed(2)).toEqual(expectTaxAmt.toFixed(2));
        });

        await test.step(`Kiểm tra API {orderId.json}`, async () => {
          const orderId = await checkoutPage.getOrderIdBySDK();
          actualTaxAmt = await dashboardAPI.getTotalTaxInOrderDetail(orderId.toString());

          expect(actualTaxAmt.toFixed(2)).toEqual(expectTaxAmt.toFixed(2));
        });
      });
    },
  );
});

test.describe(`Tax checkout: Data driven`, () => {
  let domain: string;
  let countryCode: string;
  let expectTaxAmt: number;
  let actualTaxAmt: string;
  let accessToken: string;
  let isTaxInclude: boolean;
  let transactionFee: number;
  let shopTemplate: ShopInfos;
  let balanceAmtBefore: number;
  let productInfo: Array<Product>;
  let customerInfo: ShippingAddress;
  let productInfoNO2: Array<Product>;

  let orderPage: OrderPage;
  let taxRates: Array<TaxInfor>;
  let checkoutPage: CheckoutForm;
  let dashboardAPI: DashboardAPI;
  let dashboardTempAPI: DashboardAPI;
  let paymentPage: PaymentProviderAPI;
  let checkoutAPI: CheckoutCreatorAPI;
  let productPage: AllProductStorefront;

  test.beforeAll(async ({ conf, token, request }) => {
    domain = conf.suiteConf.domain;
    taxRates = conf.suiteConf.tax_rates;
    shopTemplate = conf.suiteConf.shop_template;
    customerInfo = conf.suiteConf.customer_info;
    transactionFee = conf.suiteConf.transaction_fee;

    dashboardTempAPI = new DashboardAPI(shopTemplate.domain, request);

    const shopToken = await token.getWithCredentials({
      domain: shopTemplate.domain,
      username: shopTemplate.username,
      password: shopTemplate.password,
    });
    accessToken = shopToken.access_token;

    await dashboardTempAPI.deleteAllTaxRate(accessToken);
    for (const taxRate of taxRates) {
      await dashboardTempAPI.addNewTaxRate(taxRate, accessToken);
    }
  });

  let caseName = "CASE_GROUP_3";
  let conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      product_info: productInfo,
      country_code: countryCode,
      is_tax_include: isTaxInclude,
    }) => {
      test(`@${caseID} - ${caseName}`, async ({ page, authRequest, dashboard }) => {
        orderPage = new OrderPage(dashboard, domain);
        checkoutPage = new CheckoutForm(page, domain);
        dashboardAPI = new DashboardAPI(domain, authRequest);
        productPage = new AllProductStorefront(page, domain);
        checkoutAPI = new CheckoutCreatorAPI(domain, authRequest, page);

        await test.step(`Pre-condition`, async () => {
          await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude });
          balanceAmtBefore = await dashboardAPI.getTotalBalance();
        });

        await test.step(`
          - Tại SF: 
            + Mở trang sales page product Album1
            + Nhập country = US
            + Nhập cuppon fix_amount
            + Completed order qua cổng SMP
            + Tắt popup PPC
            + Lưu lại order name 
            + email buyer`, async () => {
          await productPage.gotoHomePage();
          await productPage.selectCreatorProduct(productInfo[0].name);
          await checkoutPage.enterEmail(customerInfo.email);
          await checkoutPage.inputFirstName(customerInfo.first_name);
          await checkoutPage.inputLastName(customerInfo.last_name);
          await checkoutPage.selectCountry(countryCode);

          expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
          await checkoutPage.page.waitForTimeout(2000);
          actualTaxAmt = await checkoutPage.getTaxCreator();
          expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
          // await expect(checkoutPage.taxLineLoc).toBeHidden();

          await checkoutPage.completeOrderWithCardInfo();
          await expect(checkoutPage.thankyouPageLoc).toBeVisible();

          actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
          if (actualTaxAmt !== "Tax included") {
            actualTaxAmt = removeCurrencySymbol(actualTaxAmt);
          }
          verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt, isTaxInclude);
        });

        await test.step(`- Tai DB: Truy cập order details của order vừa tạo bằng order name`, async () => {
          const orderId = await checkoutPage.getOrderIdBySDK();
          await orderPage.goToOrderByOrderId(orderId);

          //cause sometimes order captures slower than usual
          await orderPage.reloadUntilOrdCapture();

          actualTaxAmt = await orderPage.getTaxValue();
          verifyTaxOnOrderSummary(expectTaxAmt, removeCurrencySymbol(actualTaxAmt));
        });

        await test.step(`- Tại Balance: Kiểm tra balance`, async () => {
          let totalOrderAmt = await orderPage.getPaidByCustomer();
          totalOrderAmt = removeCurrencySymbol(totalOrderAmt);

          const actualBalanceAmt = await dashboardAPI.getTotalBalance();
          expect(
            isEqual(
              actualBalanceAmt,
              balanceAmtBefore,
              Number(totalOrderAmt) -
                Number(removeCurrencySymbol(actualTaxAmt)) -
                Number(totalOrderAmt) * transactionFee,
            ),
          ).toBeTruthy();
        });
      });
    },
  );

  caseName = "CASE_GROUP_4";
  conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      product_info: productInfo,
      country_code: countryCode,
      is_tax_include: isTaxInclude,
    }) => {
      test(`@${caseID} - ${caseName}`, async ({ page, authRequest, dashboard }) => {
        orderPage = new OrderPage(dashboard, domain);
        checkoutPage = new CheckoutForm(page, domain);
        dashboardAPI = new DashboardAPI(domain, authRequest);
        productPage = new AllProductStorefront(page, domain);
        checkoutAPI = new CheckoutCreatorAPI(domain, authRequest, page);
        paymentPage = new PaymentProviderAPI(domain, authRequest);

        await test.step(`Pre-condition`, async () => {
          await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude });
          await paymentPage.enableTestmode();
        });

        await test.step(`
          - Tại SF: 
            + Mở trang sales page product Album1
            + Nhập country = US
            + Nhập cuppon fix_amount
            + Completed order qua cổng SMP
            + Tắt popup PPC
            + Lưu lại order name 
            + email buyer`, async () => {
          await productPage.gotoHomePage();
          await productPage.selectCreatorProduct(productInfo[0].name);
          await checkoutPage.enterEmail(customerInfo.email);
          await checkoutPage.inputFirstName(customerInfo.first_name);
          await checkoutPage.inputLastName(customerInfo.last_name);
          await checkoutPage.selectCountry(countryCode);

          expectTaxAmt = await checkoutAPI.calculateTaxByLineItem(productInfo);
          await checkoutPage.page.waitForTimeout(2000);
          actualTaxAmt = await checkoutPage.getTaxCreator();
          expect(actualTaxAmt).toEqual(expectTaxAmt.toFixed(2));
          // await expect(checkoutPage.taxLineLoc).toBeHidden();

          await checkoutPage.selectPaymentMethod(PaymentMethod.PAYPALCREATOR);
          await checkoutPage.clickPayNowBtnOnPayPal();
          await checkoutPage.signInAndSubmitPurchasePP();
          await expect(checkoutPage.thankyouPageLoc).toBeVisible();

          actualTaxAmt = await checkoutPage.getTaxOnOrderSummary();
          if (actualTaxAmt !== "Tax included") {
            actualTaxAmt = removeCurrencySymbol(actualTaxAmt);
          }
          verifyTaxOnOrderSummary(expectTaxAmt, actualTaxAmt, isTaxInclude);
        });

        await test.step(`- Tai DB: Truy cập order details của order vừa tạo bằng order name`, async () => {
          const orderId = await checkoutPage.getOrderIdBySDK();
          await orderPage.goToOrderByOrderId(orderId);

          //cause sometimes order captures slower than usual
          await orderPage.reloadUntilOrdCapture();

          actualTaxAmt = await orderPage.getTaxValue();
          verifyTaxOnOrderSummary(expectTaxAmt, removeCurrencySymbol(actualTaxAmt));
        });

        await test.step(`After each: Switch off test mode`, async () => {
          await paymentPage.enableTestmode(false);
        });
      });
    },
  );
});
