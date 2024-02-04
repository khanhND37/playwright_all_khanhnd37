import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import type { OrderAfterCheckoutInfo } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { loadData } from "@core/conf/conf";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { deleteFile, readFileCSV } from "@helper/file";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { CustomersPage } from "@pages/dashboard/customers";
import { CustomerAPI } from "@pages/api/dashboard/customer";

test.describe(`[Social ID_SB]Kiểm tra info address khi checkout với countries bằng cổng Paypal và edit social ID trong order detail`, () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let themeSetting: SettingThemeAPI;
  let domain: string;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let shippingAddress;
  let paypalAccount;

  const casesID = "CHECKOUT_SOCIAL_ID_WITH_PAYPAL";
  const conf = loadData(__dirname, casesID);
  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      checkout_label: checkoutLabel,
      payment_method: paymentMethod,
      list_data: listData,
      products_checkout: productsCheckout,
      email: email,
      social_id: socialId,
      data_social_id: dataSocialId,
      edit_social_id: editSocialId,
      billing_address: billingAddress,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, theme, dashboard }) => {
        domain = conf.suiteConf.domain;
        shippingAddress = conf.suiteConf.shipping_address;
        paypalAccount = conf.suiteConf.paypal_account;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);
        themeSetting = new SettingThemeAPI(theme);
        test.setTimeout(conf.suiteConf.time_out);

        await test.step(`Precondition`, async () => {
          await themeSetting.editCheckoutLayout(checkoutLabel);
          await checkoutAPI.addProductThenSelectShippingMethod(productsCheckout, email, shippingAddress);
          await checkoutAPI.openCheckoutPageByToken();
        });

        await test.step(`Tại SF
        - Nhập country - Không nhập CPF/CNPJ
        - Nhập cart 
        - Click Complete order.`, async () => {
          await checkoutPage.page.click(checkoutPage.xpathStepInformation);
          await checkoutPage.enterShippingAddress(listData.blank_social_id_shipping_3_steps.shipping_info);
          await checkoutPage.clickBtnContinueToShippingMethod();
          expect(await checkoutPage.isErrorMsgVisible(listData.blank_social_id_shipping_3_steps.message)).toBe(true);
        });

        await test.step(`Tại checkout:
        - Nhập thông tin shipping + Nhập country+ nhập CPF/CNPJ
        - Click "Billing address" và không nhập CPF/CNPJ billing mà click Complete order `, async () => {
          await checkoutPage.enterShippingAddress(listData.Fill_social_id_shipping_3_steps.shipping_info);
          await checkoutPage.continueToPaymentMethod();
          await checkoutPage.clickRadioButtonWithLabel("Use a different billing address");
          await checkoutPage.enterBillingAddress(billingAddress);
          await checkoutPage.selectPaymentMethod(paymentMethod);
          await checkoutPage.clickBtnCompleteOrder();
          expect(await checkoutPage.isErrorMsgVisible(listData.blank_social_id_billing_3_steps.message)).toBe(true);
        });

        await test.step(`- Nhập thông tin shipping
        -Thanh toán order qua gateway bằng PayPal Smart Button
        - Click "Billing address" nhập đẩy đủ thông tiin Billing address( gồm CPF/CNPJ) 
        - Click Complete order `, async () => {
          await checkoutPage.enterBillingAddress(listData.Fill_social_id_billing_3_steps.billing_info);
          await checkoutPage.completeOrderViaPayPal(paypalAccount);
        });

        await test.step(`Mở dev tool > Check API {{checkout_token}}/next.json`, async () => {
          const infoCheckout = await checkoutAPI.getCheckoutInfoNewEcom();
          const socialIdInCheckoutPage = infoCheckout.info.shipping_address[`${socialId}`];
          expect(socialIdInCheckoutPage).toEqual(dataSocialId);
        });

        await test.step(`vào order detail check shipping address và billing address  `, async () => {
          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          const socialIdInOrderDetail = await orderPage.getCpfOrCnpjNumberOnOrderDetail();
          expect(socialIdInOrderDetail).toContain(dataSocialId);
        });

        await test.step(` Edit field social ID trong order:
        - vào customer detail -> click "change" default address ->  Delete và Save`, async () => {
          await orderPage.editShippingAddress(
            editSocialId.delete_social_id.socialID,
            editSocialId.delete_social_id.data,
          );
          expect(await orderPage.isErrorMsgVisible(editSocialId.delete_social_id.message)).toBe(true);
          await orderPage.clickOnBtnWithLabel("Cancel");
          const socialIdAfterDelete = await orderPage.getCpfOrCnpjNumberOnOrderDetail();
          expect(socialIdAfterDelete).toContain(dataSocialId);
        });

        await test.step(`- Tại customer detail-> click "change" default address -> Nhập giá trị và Save`, async () => {
          await orderPage.editShippingAddress(editSocialId.fill_social_id.socialID, editSocialId.fill_social_id.data);
          await expect(orderPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
          await orderPage.page.waitForLoadState("networkidle");
          const socialIdAfterEdit = await orderPage.getCpfOrCnpjNumberOnOrderDetail();
          expect(socialIdAfterEdit).toContain(editSocialId.fill_social_id.data);
        });
      });
    },
  );
});

test.describe(`[Social ID_SB]Kiểm tra info address khi checkout với countries bằng cổng Stripe và edit social ID trong order detail`, () => {
  let checkoutPage: SFCheckout;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let themeSetting: SettingThemeAPI;
  let domain: string;
  let orderSummaryInfo: OrderAfterCheckoutInfo;
  let shippingAddress;

  const casesID = "CHECKOUT_SOCIAL_ID_WITH_STRIPE";
  const conf = loadData(__dirname, casesID);
  conf.caseConf.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      checkout_label: checkoutLabel,
      list_data: listData,
      products_checkout: productsCheckout,
      email: email,
      social_id: socialId,
      data_social_id: dataSocialId,
      edit_social_id: editSocialId,
      billing_address: billingAddress,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ page, authRequest, theme, dashboard }) => {
        domain = conf.suiteConf.domain;
        shippingAddress = conf.suiteConf.shipping_address;
        checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        checkoutPage = new SFCheckout(page, domain);
        orderPage = new OrdersPage(dashboard, domain);
        themeSetting = new SettingThemeAPI(theme);
        test.setTimeout(conf.suiteConf.time_out);

        await test.step(`Precondition`, async () => {
          await themeSetting.editCheckoutLayout(checkoutLabel);
          await checkoutAPI.addProductThenSelectShippingMethod(productsCheckout, email, shippingAddress);
          await checkoutAPI.openCheckoutPageByToken();
        });

        await test.step(`Tại dashboard: 
        - Vào theme > customize theme đang dùng > setting checkout page
        - Chọn "One page" > Save Tại checkout: 
        - Reload lại link checkout 
        - Nhập country- Không nhập CPF/CNPJ
        - Nhập cart 
        - Click Complete order`, async () => {
          await checkoutPage.enterShippingAddress(listData.blank_social_id_shipping_one_page.shipping_info);
          await checkoutPage.clickBtnCompleteOrder();
          expect(await checkoutPage.isErrorMsgVisible(listData.blank_social_id_shipping_one_page.message)).toBe(true);
        });

        await test.step(`Tại checkout:
        - Nhập thông tin shipping + Nhập country+ nhập CPF/CNPJ
        - Click "Billing address" và không nhập CPF/CNPJ billing mà click Complete order `, async () => {
          await checkoutPage.enterShippingAddress(listData.Fill_social_id_shipping_one_page.shipping_info);
          await checkoutPage.continueToPaymentMethod();
          await checkoutPage.clickRadioButtonWithLabel("Use a different billing address");
          await checkoutPage.enterBillingAddress(billingAddress);
          await checkoutPage.clickBtnCompleteOrder();
          expect(await checkoutPage.isErrorMsgVisible(listData.blank_social_id_billing_one_page.message)).toBe(true);
        });

        await test.step(`- Nhập thông tin shipping
        -Thanh toán order qua gateway bằng PayPal Smart Button
        - Click "Billing address" nhập đẩy đủ thông tiin Billing address( gồm CPF/CNPJ) 
        - Click Complete order `, async () => {
          await checkoutPage.enterBillingAddress(listData.Fill_social_id_billing_one_page.billing_info);
          await checkoutPage.completeOrderWithMethod();
        });

        await test.step(`Mở dev tool > Check API {{checkout_token}}/next.json`, async () => {
          const infoCheckout = await checkoutAPI.getCheckoutInfoNewEcom();
          const socialIdInCheckoutPage = infoCheckout.info.shipping_address[`${socialId}`];
          expect(socialIdInCheckoutPage).toEqual(dataSocialId);
        });

        await test.step(`vào order detail check shipping address và billing address  `, async () => {
          orderSummaryInfo = await checkoutPage.getOrderInfoAfterCheckout();
          await orderPage.goToOrderByOrderId(orderSummaryInfo.orderId);
          const socialIdInOrderDetail = await orderPage.getCpfOrCnpjNumberOnOrderDetail();
          expect(socialIdInOrderDetail).toContain(dataSocialId);
        });

        await test.step(` Edit field social ID trong order:- vào customer detail -> click "change" default address ->  Delete và Save`, async () => {
          await orderPage.editShippingAddress(
            editSocialId.delete_social_id.socialID,
            editSocialId.delete_social_id.data,
          );
          expect(await orderPage.isErrorMsgVisible(editSocialId.delete_social_id.message)).toBe(true);
          await orderPage.clickOnBtnWithLabel("Cancel");
          const socialIdAfterDelete = await orderPage.getCpfOrCnpjNumberOnOrderDetail();
          expect(socialIdAfterDelete).toContain(dataSocialId);
        });

        await test.step(`- Tại customer detail-> click "change" default address -> Nhập giá trị và Save`, async () => {
          await orderPage.editShippingAddress(editSocialId.fill_social_id.socialID, editSocialId.fill_social_id.data);
          await expect(orderPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
          await orderPage.page.waitForLoadState("networkidle");
          const socialIdAfterEdit = await orderPage.getCpfOrCnpjNumberOnOrderDetail();
          expect(socialIdAfterEdit).toContain(editSocialId.fill_social_id.data);
        });
      });
    },
  );
});

test.describe(`[Social ID_SB]Kiểm tra Edit field social ID customer trong contact customer`, () => {
  let dashboardPage: DashboardPage;
  let customerPage: CustomersPage;
  let customerAPI: CustomerAPI;

  test(`@SB_CHE_CB_Jul23_09 [Social ID_SB] Kiểm tra Edit field social ID customer trong contact customer`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    customerPage = new CustomersPage(dashboard, conf.suiteConf.domain);
    customerAPI = new CustomerAPI(conf.suiteConf.domain, authRequest);
    const customer = conf.caseConf.customers;

    for (let i = 0; i < customer.length; i++) {
      await test.step(`- Vào mục contact - Vào customer detail của customer - Delete field Social ID và Save`, async () => {
        await dashboardPage.navigateToMenu("Contacts");
        await customerPage.searchContacts(customer[i].name);
        await customerPage.clickCustomerbyEmail(customer[i].email);
        const socialIdBeforeEdit = await customerAPI.getCustomerInfoByEmail(customer[i].email);
        await customerPage.editShippingDefaultCustomer(
          customer[i].edit_social_id.delete_social_id.field_name,
          customer[i].edit_social_id.delete_social_id.data,
        );
        expect(await customerPage.isErrorMsgVisible(customer[i].edit_social_id.delete_social_id.message)).toBe(true);
        await customerPage.clickOnBtnWithLabel("Cancel");
        await customerPage.page.waitForLoadState("networkidle");
        const socialIdAfterDelete = await customerAPI.getCustomerInfoByEmail(customer[i].email);
        expect(socialIdAfterDelete.addresses[0].cpf_or_cnpj_number).toEqual(
          socialIdBeforeEdit.addresses[0].cpf_or_cnpj_number,
        );
      });

      await test.step(`- Tại customer detail của customer - Edit social ID mới file Social ID và save.`, async () => {
        await customerPage.editShippingDefaultCustomer(
          customer[i].edit_social_id.change_social_id.field_name,
          customer[i].edit_social_id.change_social_id.data,
        );
        await customerPage.page.waitForLoadState("networkidle");
        const socialIdAfterEdit = await await customerAPI.getCustomerInfoByEmail(customer[i].email);
        expect(socialIdAfterEdit.addresses[0].cpf_or_cnpj_number).toEqual(
          customer[i].edit_social_id.change_social_id.data,
        );
      });
    }
  });
});

test.describe(`[Social ID_SB]Kiểm tra file export`, () => {
  let customerAPI: CustomerAPI;
  let customerPage: CustomersPage;
  let orderPage: OrdersPage;
  let dashboardPage: DashboardPage;
  let filePath;

  test.afterEach(async ({}) => {
    await deleteFile(filePath);
  });

  const getDataColumnFileCsv = async (csvFile: Array<Array<string>>, column: number): Promise<Array<string>> => {
    const dataColumn = csvFile
      .filter(data => data[column] !== "")
      .map(data => data[column].split(","))
      .flat();
    return dataColumn;
  };
  test(`@SB_CHE_CB_Jul23_10 [Social ID_SB]Kiểm tra file export customer`, async ({ dashboard, conf, authRequest }) => {
    customerPage = new CustomersPage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    customerAPI = new CustomerAPI(conf.suiteConf.domain, authRequest);
    const customer = conf.caseConf.name;
    const email = conf.caseConf.email;

    await test.step(`Tại dashboard shopbase: 
    - Vào mục Contact. 
    - Select Customer:  Brazil, South korea, Italy, China. 
    -Click Export download file csv`, async () => {
      const socialId = await customerAPI.getCustomerInfoByEmail(email);
      await dashboardPage.navigateToMenu("Contacts");
      await customerPage.searchContacts(customer);
      await customerPage.selectCustomers(1);
      await customerPage.clickOnBtnWithLabel("Export");
      filePath = await customerPage.downloadFileExportCustomer();
      const fileData = await readFileCSV(filePath);
      const socialIdInFileCSV = await getDataColumnFileCsv(fileData, 4);
      for (const sociaIdCsv of socialIdInFileCSV) {
        expect(sociaIdCsv).toEqual(socialId.addresses[0].cpf_or_cnpj_number);
      }
    });
  });
  test(`@SB_CHE_CB_Jul23_11 [Social ID_SB]Kiểm tra file export order`, async ({ dashboard, conf }) => {
    const domain = conf.suiteConf.domain;
    const searchOrder = conf.caseConf.search_order;
    dashboardPage = new DashboardPage(dashboard, domain);
    orderPage = new OrdersPage(dashboard, domain);

    await test.step(`Tại dashboard shopbase: Vào mục orders. 
    Select Orders theo countries Brazil, South korea, Italy, China. 
    Click Export download file csv`, async () => {
      await dashboardPage.navigateToMenu("Orders");
      for (let i = 0; i < searchOrder.length; i++) {
        await orderPage.clickButtonMoreFilters();
        await orderPage.clickToShowFieldFilterMore("Customer");
        await orderPage.inputSearchTermToFilterOption("Customer", searchOrder[i].customer_name, false);
        await orderPage.filterOrderWithDropDownOption("Order country", searchOrder[i].order_country);
        await orderPage.clickOnBtnWithLabel("Apply");
        await orderPage.page.click(orderPage.xpathSelectOrder());
      }
      await orderPage.clickOnBtnWithLabel("Export order");
      await orderPage.selectFieldsToExportOrder(conf.caseConf.fields_social_id);
      filePath = await orderPage.downloadFileExportOrder(conf.caseConf.forder_name);
      const fileData = await readFileCSV(filePath);
      const socialIdInFileCSV = await getDataColumnFileCsv(fileData, 0);
      for (const sociaIdCsv of socialIdInFileCSV) {
        expect(sociaIdCsv).toEqual(conf.caseConf.social_id);
      }
    });
  });
});
