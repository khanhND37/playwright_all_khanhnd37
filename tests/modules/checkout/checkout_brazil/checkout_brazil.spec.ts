import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { SFCheckout } from "@pages/storefront/checkout";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { CustomersPage } from "@pages/dashboard/customers";
import { readFileCSV } from "@helper/file";
import { OrdersPage } from "@pages/dashboard/orders";
import type { ShippingAddress } from "@types";
import { CustomerAPI } from "@pages/api/dashboard/customer";

test.describe("Checkout flow with Brazil", () => {
  let checkout: SFCheckout;
  let customerAPI: CustomerAPI;
  let themeSetting: SettingThemeAPI;
  let dashboardPage: DashboardPage;
  let customersPage: CustomersPage;
  let orderPage: OrdersPage;
  let productPage: SFProduct;
  let homePage: SFHome;
  let tokenShop: string;
  let shippingInfo: ShippingAddress;

  test.beforeEach(async ({ conf, theme, authRequest, page, token }) => {
    checkout = new SFCheckout(page, conf.suiteConf.domain);
    customerAPI = new CustomerAPI(conf.suiteConf.domain, authRequest);
    themeSetting = new SettingThemeAPI(theme);
    dashboardPage = new DashboardPage(page, conf.suiteConf.domain);
    customersPage = new CustomersPage(page, conf.suiteConf.domain);
    orderPage = new OrdersPage(page, conf.suiteConf.domain);
    productPage = new SFProduct(page, conf.suiteConf.shop_domain);
    homePage = new SFHome(page, conf.suiteConf.domain);
    await themeSetting.editCheckoutLayout("one-page");
    shippingInfo = conf.caseConf.shipping_address;
    tokenShop = (
      await token.getWithCredentials({
        domain: conf.suiteConf.shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      })
    ).access_token;
  });

  test(`Kiểm tra các giá trị không hợp lệ nhập vào trường CPF/ CNPJ number @SB_CHE_CB_3`, async ({ conf }) => {
    await homePage.gotoHomePage();
    await homePage.searchThenViewProduct(conf.caseConf.products_checkout.productName);
    await productPage.addToCart();
    await productPage.navigateToCheckoutPage();
    await checkout.enterShippingAddress(shippingInfo);
    for (const data of conf.caseConf.list_data) {
      await test.step(`${conf.caseConf.description}`, async () => {
        await checkout.enterShippingAddress(data.shipping_cpf_cnpj_number);
        await checkout.clickCompleteOrder();
        expect(await checkout.isErrorMsgVisible(data.message)).toBe(true);
      });
    }
  });

  test(`Buyer checkout địa chỉ Brazil với CPF/ CNPJ number thành công @SB_CHE_CB_6`, async ({ conf }) => {
    await test.step(`Setting themes "One page". Vào màn checkout product "T-shirt".
     Nhập thông tin checkout và hoàn thành các step checkout.`, async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(conf.caseConf.products_checkout.product_name);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(shippingInfo);
      await checkout.completeOrderWithMethod();
      expect(await checkout.isThankyouPage()).toBe(true);
    });

    await test.step(`Setting themes "multi-step". Vào màn checkout product "T-shirt".
     Nhập thông tin checkout và hoàn thành các step checkout.`, async () => {
      await themeSetting.editCheckoutLayout("multi-step");
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(conf.caseConf.products_checkout.product_name);
      await productPage.addToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(shippingInfo);
      await checkout.page.waitForLoadState("networkidle");
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithMethod();
      expect(await checkout.isThankyouPage()).toBe(true);
    });

    await test.step(`Vào dashboard màn hình Orders, click vào orders vừa checkout.
    Verify block Shipping address kiểm tra xem có trường CPF/ CNPJ number`, async () => {
      const orderId = await checkout.getOrderIdBySDK();
      await dashboardPage.loginWithToken(tokenShop);
      await dashboardPage.goto(`/admin/orders/${orderId}`);
      const shippingAddressInfo = await orderPage.getCpfOrCnpjNumberOnOrderDetail();
      expect(shippingAddressInfo.includes(shippingInfo.cpf_cnpj_number));
    });

    // Step edit CPF/CNPJ Number trong order detail
    for (const numberInvalid of conf.caseConf.cpf_cnpj_number_invalid) {
      await test.step(`${conf.caseConf.description}`, async () => {
        await orderPage.editShippingAddress(conf.caseConf.label, numberInvalid.cpf_cnpj_number);
        if (numberInvalid.message === "") {
          const shippingInfor = await orderPage.getCpfOrCnpjNumberOnOrderDetail();
          expect(shippingInfor.includes(numberInvalid.cpf_cnpj_number));
        } else {
          const msgError = await orderPage.getMsgErrorEditShipping("CPF/CNPJ Number");
          await orderPage.clickButtonOnPopUpWithLabel("Cancel");
          expect(msgError).toEqual(numberInvalid.message);
        }
      });
    }
  });

  test(`Kiểm tra template export customer có chứa trường CPF/ CNPJ number @SB_CHE_CB_12`, async ({ conf }) => {
    await test.step(`Tại dashboard shopbase: Vào mục Customer. Select Customer Brazil.
     Click Export download file csv`, async () => {
      await dashboardPage.loginWithToken(tokenShop);
      await dashboardPage.navigateToMenu("Customers");
      await customersPage.searchCustomers(conf.caseConf.customers_name);
      await customersPage.selectCustomers(1);
      await customersPage.selectOptionExportCustomer(conf.caseConf.options_export);
      const file = await customersPage.downloadFileExportCustomer();
      const readFeedFile = await readFileCSV(file, "\t");
      for (let i = 0; i < readFeedFile.length; i++) {
        const colums = readFeedFile[i][0].split(",");
        expect(
          colums[readFeedFile.length - 1] ===
            (await customerAPI.getCustomerInfoByEmail(conf.caseConf.email)).default_address.cpf_or_cnpj_number,
        );
      }
    });
  });
});
