import { expect, test } from "@core/fixtures";
import { ContactFormPage } from "@pages/storefront/contact_form";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { CustomersPage } from "@pages/dashboard/customers";
import { CheckoutAPI } from "@pages/api/checkout";
import { CustomerAPI } from "@pages/api/dashboard/customer";
import type { Product } from "@types";

let contactFormPage: ContactFormPage;
let dashboardPage: DashboardPage;
let customerPage: CustomersPage;
let customerApi: CustomerAPI;
let domain: string;
let pageName: string;
let inputs: Array<string>;
let inputForm: { [key: string]: string };
let inputLocator: { [key: string]: string };
let inputFormLocator: { [key: string]: string };
let inputFormOverride: { [key: string]: string };
let tokenShop: string;
let checkoutApi: CheckoutAPI;
let productCheckout: Product;
const checkoutOrder = async () => {
  await checkoutApi.createAnOrderWithCreditCard({
    productsCheckout: [productCheckout],
    customerInfo: {
      ...checkoutApi.defaultCustomerInfo,
      emailBuyer: inputForm.email,
      shippingAddress: {
        ...checkoutApi.defaultCustomerInfo.shippingAddress,
        first_name: inputForm.first_name,
        last_name: inputForm.last_name,
      },
    },
    paymentType: "stripe",
  });

  const orderId = (await checkoutApi.getOrderInfo(checkoutApi.request)).id;
  expect(orderId).not.toBeNull();
};

test.beforeAll(async ({ conf, browser, token, authRequest }) => {
  domain = conf.suiteConf.domain;
  pageName = conf.suiteConf.page_name;
  inputs = conf.suiteConf.inputs;
  inputLocator = conf.suiteConf.input_locator;
  inputFormLocator = conf.suiteConf.input_form_locator;
  productCheckout = conf.suiteConf.product_checkout;

  const sfPage = await browser.newPage();
  contactFormPage = new ContactFormPage(sfPage, domain);
  dashboardPage = new DashboardPage(sfPage, domain);
  customerPage = new CustomersPage(sfPage, domain);
  checkoutApi = new CheckoutAPI(domain, authRequest);
  customerApi = new CustomerAPI(domain, authRequest);

  tokenShop = (
    await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    })
  ).access_token;
  await dashboardPage.loginWithToken(tokenShop);
});

test.beforeEach(async ({ conf }) => {
  inputForm = conf.suiteConf.input_form;
  inputForm.email = `test${Date.now()}@maildrop.cc`;
  inputFormOverride = {
    ...inputForm,
    ...conf.suiteConf.input_form_override,
  };
});

test.describe("Check contact form SF", async () => {
  test("Verify tạo Customer đã là Subscriber @SB_NEWECOM_CTD_3", async () => {
    await test.step("Mở form trên storefront > nhập thông tin > submit", async () => {
      await contactFormPage.submitForm(inputs, inputLocator, inputForm, { pageName });
    });
    await test.step("Vào dashboard shop merchant > Contacts > search contacts theo email vừa checkout", async () => {
      await customerPage.gotoCustomerList();
      await customerPage.searchContacts(inputForm.email);
      expect(await customerPage.isCustomerExist(inputForm.email)).toBeTruthy();
      await customerPage.switchToTab("Subscribers");
      expect(await customerPage.isCustomerExist(inputForm.email)).toBeTruthy();
    });
    await test.step("Ở block contact > click Edit > verify data trong form edit Subscriber", async () => {
      await customerPage.clickCustomerbyEmail(inputForm.email);
      await customerPage.clickEditContact();
      for await (const input of inputs) {
        await expect(async () => {
          const value = await customerPage.getValueContent(inputFormLocator[input]);
          expect(value).toEqual(inputForm[input]);
        }).toPass();
      }
    });
    await test.step("Mở storefront > thực hiện checkout ", async () => {
      await checkoutOrder();
      const orderId = (await checkoutApi.getOrderInfo(checkoutApi.request)).id;
      expect(orderId).not.toBeNull();
    });
    await test.step("Vào dashboard shop merchant > Contacts > search contacts theo email vừa checkout", async () => {
      await customerPage.gotoCustomerList();
      await customerPage.searchContacts(inputForm.email);
      expect(await customerPage.isCustomerExist(inputForm.email)).toBeTruthy();
      await customerPage.switchToTab("Customers");
      expect(await customerPage.isCustomerExist(inputForm.email)).toBeTruthy();
    });
    await test.step("Ở block contact > click Edit > verify data trong form edit customer", async () => {
      await customerPage.clickCustomerbyEmail(inputForm.email);
      await customerPage.clickEditContact();
      for await (const input of inputs) {
        await expect(async () => {
          const value = await customerPage.getValueContent(inputFormLocator[input]);
          expect(value).toEqual(inputForm[input]);
        }).toPass();
      }
    });
  });
  test("Verify thông tin contacts khi Filter by form @SB_NEWECOM_CTD_8", async ({ conf }) => {
    const formName = conf.suiteConf.form_name;
    await test.step(`Vào dashboard shop merchant > Contacts > All contacts > click button "Filter by form" chọn form`, async () => {
      await customerPage.gotoCustomerList();
      await customerPage.clickFilterByForm();
      expect(await customerPage.isFilterFormExist(formName)).toBeTruthy();
    });

    const forms = await customerApi.getCustomerForms();
    const form = forms.find(form => form.title === formName);
    expect(form).not.toBeUndefined();
    const countCustomer = await customerApi.countCustomers({ form_ids: String(form.id) });
    await contactFormPage.submitForm(inputs, inputLocator, inputForm, { pageName });
    const countCustomerAfter = await customerApi.countCustomers({ form_ids: String(form.id) });
    expect(countCustomerAfter).toEqual(countCustomer + 1);

    await test.step("Mở contact detail email vừa submit > verify data", async () => {
      await customerPage.gotoCustomerDetailByEmail(inputForm.email);
      await customerPage.clickEditContact();

      for await (const input of inputs) {
        await expect(async () => {
          const value = await customerPage.getValueContent(inputFormLocator[input]);
          expect(value).toEqual(inputForm[input]);
        }).toPass();
      }
    });
  });

  test("Verify hiển thị tổng số orders đã được thực hiện từ contact email @SB_NEWECOM_CTD_9", async () => {
    await test.step("Mở form trên storefront > nhập thông tin > submit", async () => {
      await contactFormPage.submitForm(inputs, inputLocator, inputForm, { pageName });
    });

    await test.step("Vào dashboard shop merchant > Contacts > vào contact detail > verify tổng số orders đã được thực hiện từ contact email này", async () => {
      await customerPage.gotoCustomerDetailByEmail(inputForm.email);
      const ordersCount = await customerPage.getOrdersCount();
      expect(ordersCount).toEqual(0);
    });
    await test.step("Mở storefront > thực hiện checkout ", async () => {
      await checkoutOrder();

      await expect(async () => {
        await customerPage.gotoCustomerDetailByEmail(inputForm.email);
        const ordersCount = await customerPage.getOrdersCount();
        expect(ordersCount).toEqual(1);
      }).toPass();
    });
  });

  test("Verify hiển thị list form submissions @SB_NEWECOM_CTD_11", async () => {
    await test.step("Mở form trên storefront > nhập thông tin > submit", async () => {
      await contactFormPage.submitForm(inputs, inputLocator, inputForm, { pageName });
    });

    await test.step(`Vào dashboard shop merchant > Contacts > vào contact detail > verify block "Lastest submissions`, async () => {
      await customerPage.gotoCustomerDetailByEmail(inputForm.email);
      const url = new URL(customerPage.page.url());
      const path = url.pathname.split("/");
      const id = path[path.length - 1];
      expect(Number(id)).toBeGreaterThan(0);
      const submissions = await customerApi.getFormSubmissions(Number(id));
      for await (const sub of submissions) {
        expect(sub.title).not.toBeNull();
        expect(sub.form_url).not.toBeNull();
      }
    });
  });

  test("@SB_NEWECOM_CTD_13 Verify override data customer theo form được submitted mới nhất", async () => {
    await test.step("Mở form trên storefront > nhập thông tin > submit", async () => {
      await contactFormPage.submitForm(inputs, inputLocator, inputForm, { pageName });
    });

    await test.step(`Vào dashboard shop merchant > Contacts > vào contact detail > ở block "Contact" > click Edit`, async () => {
      await customerPage.gotoCustomerDetailByEmail(inputForm.email);
      await customerPage.clickEditContact();
      for await (const input of inputs) {
        await expect(async () => {
          const value = await customerPage.getValueContent(inputFormLocator[input]);
          expect(value).toEqual(inputForm[input]);
        }).toPass();
      }
    });

    await test.step("Mở form trên storefront > nhập thông tin > submit", async () => {
      await contactFormPage.submitForm(inputs, inputLocator, inputFormOverride, { pageName });
    });

    await test.step(`Vào dashboard shop merchant > Contacts > vào contact detail > ở block "Contact" > click Edit`, async () => {
      await customerPage.gotoCustomerDetailByEmail(inputForm.email);
      await customerPage.clickEditContact();
      for await (const input of inputs) {
        await expect(async () => {
          const value = await customerPage.getValueContent(inputFormLocator[input]);
          expect(value).toEqual(inputFormOverride[input]);
        }).toPass();
      }
    });
  });
});
