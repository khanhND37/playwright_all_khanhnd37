import { Local, SbRlsOdMfsb40, SbRlsOdMfsb41 } from "./filter_order.d";
import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { OrderAPI } from "@pages/api/order";
import { loadData } from "@core/conf/conf";
import { CustomerAPI } from "@pages/api/dashboard/customer";

test.describe("Verify filter order", () => {
  let domain: string;
  let orderPage: OrdersPage;

  test.beforeEach(async ({ conf, dashboard }) => {
    const suiteConf = conf.suiteConf as Local;
    domain = suiteConf.domain;
    orderPage = new OrdersPage(dashboard, domain);
  });

  test(`@SB_RLS_OD_MFSB_7 Verify khi user filter order có tracking number và nhập tracking number vào ô input, tracking number có tồn tại và thuộc order của store`, async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    const checkoutAPI = new CheckoutAPI(domain, authRequest);
    const productsCheckout = conf.caseConf.products_checkout;
    const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: productsCheckout,
    });
    const trackingNumber = Date.now().toString();

    const orderApi = new OrderAPI(domain, authRequest);

    // eslint-disable-next-line camelcase
    const tracking_company = conf.caseConf.fulfillment.tracking_company;
    const quatity = conf.caseConf.fulfillment.line_items[0].quantity;
    const orderId = checkoutInfo.order.id;
    const lineItemsId = await orderApi.getLineItemID(orderId);
    const service = conf.caseConf.fulfillment.service;

    await test.step(`- Truy cập vào Order List của SB- Click "More filters" button`, async () => {
      await orderApi.fulfillOrder({
        fulfillment: {
          tracking_number: trackingNumber,
          tracking_company: tracking_company,
          line_items: [{ id: lineItemsId, quantity: quatity }],
          notify_customer: true,
          order_id: orderId,
          service: service,
        },
      });
      await dashboard.goto(`https://${domain}/admin/orders`);
      await orderPage.clickButtonMoreFilters();
      expect(await orderPage.page.locator(orderPage.xpathLabelOnFilter("Tracking number")).isVisible());
    });

    await test.step(`Click "Tracking number" label`, async () => {
      await orderPage.clickOnFieldWithLabelOnFilter("Tracking number");
      expect(await orderPage.isTextBoxExist("Search by tracking number")).toBeTruthy();
    });

    await test.step(`Input tracking number exist and Click "Apply" button`, async () => {
      await orderPage.inputSearchTermToFilterOption("Search by tracking number", trackingNumber);
      expect(await orderPage.isTextVisible(`Tracking number: ${trackingNumber}`, 2)).toBeTruthy();
      expect(await orderPage.isTextVisible(checkoutInfo.order.name.toString(), 1)).toBeTruthy();
    });
  });

  test(`@SB_RLS_OD_MFSB_40 Verify khi Merchant  filer order theo Fulfillment status chọn Processing,Fulfilled và Partially Fulfilled`, async ({
    dashboard,
    conf,
  }) => {
    const caseConf = conf.caseConf as SbRlsOdMfsb40;
    await dashboard.goto(`https://${domain}/admin/orders`);

    await test.step(`Truy cập vào Order List của SBClick "More filters" button`, async () => {
      await orderPage.clickButtonMoreFilters();
      expect(await orderPage.page.locator(orderPage.xpathLabelOnFilter("Fulfillment status")).isVisible());
    });

    await test.step(`Click "Fulfillment status " label`, async () => {
      await orderPage.clickOnFieldWithLabelOnFilter("Fulfillment status");
      expect(await orderPage.checkBoxOnFilterExisted("Unfulfilled", 3)).toBeTruthy();
      expect(await orderPage.checkBoxOnFilterExisted("Partially Fulfilled", 3)).toBeTruthy();
      expect(await orderPage.checkBoxOnFilterExisted("Fulfilled", 3)).toBeTruthy();
      expect(await orderPage.checkBoxOnFilterExisted("Processing", 3)).toBeTruthy();
      expect(await orderPage.checkBoxOnFilterExisted("Partially Processing", 3)).toBeTruthy();
      expect(await orderPage.checkBoxOnFilterExisted("Awaiting Stock", 3)).toBeTruthy();
    });

    await test.step(`Chọn Processing,Fulfilled và Partially Fulfilled then click "Apply" button`, async () => {
      await orderPage.selectOptionOnFilter("Fulfilled", 3);
      await orderPage.selectOptionOnFilter("Processing", 3);
      await orderPage.selectOptionOnFilter("Partially Fulfilled", 3);
      await orderPage.clickButtonApplyOnFilter();
      expect(await orderPage.verifyStatusOrderOnList(caseConf.order_A, "Processing")).toBeTruthy();
      expect(await orderPage.verifyStatusOrderOnList(caseConf.order_B, "Fulfilled")).toBeTruthy();
      expect(await orderPage.verifyStatusOrderOnList(caseConf.order_C, "Partially Fulfilled")).toBeTruthy();
    });
  });

  test(`@SB_RLS_OD_MFSB_41 Verify khi Merchant  filer order theo Order date chọn from - to có tồn tại order trong current store`, async ({
    dashboard,
    conf,
  }) => {
    const caseConf = conf.caseConf as SbRlsOdMfsb41;
    await dashboard.goto(`https://${domain}/admin/orders`);

    await test.step(`Truy cập vào Order List của SBClick "More filters" button`, async () => {
      await orderPage.clickButtonMoreFilters();
      expect(await orderPage.page.locator(orderPage.xpathLabelOnFilter("Order date")).isVisible());
    });

    await test.step(`Click "Order date " label`, async () => {
      await orderPage.clickOnFieldWithLabelOnFilter("Order date");
      expect(await orderPage.page.locator(orderPage.xpathDateTimePickerOnFilter("Order date", 4)).isVisible());
    });

    await test.step(`Select time from and to then click "Apply" button`, async () => {
      await orderPage.filterDateFromToOnDTPOnFilter("Order date", caseConf.date_From, caseConf.date_To);
      expect(
        await orderPage.isTextVisible(` Order date: ${caseConf.date_From} - ${caseConf.date_To} `, 2),
      ).toBeTruthy();
      const numberOrders = await orderPage.getQuantityOfOrders();
      expect(numberOrders).toEqual(caseConf.quantity_orders);
    });
  });
});

test.describe("Verify filter order theo customner", () => {
  const casName = "DD_25_27";
  const conf = loadData(__dirname, casName);
  let expQuantity: number;

  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({ case_id: caseID, case_name: caseName, info_customer: info, quantity_orders: quantityOrders }) => {
      test(`@${caseID} ${caseName}`, async ({ dashboard, authRequest, conf }) => {
        const domain = conf.suiteConf.domain;

        if (caseID == "SB_RLS_OD_MFSB_25") {
          const customerPage = new CustomerAPI(domain, authRequest);
          expQuantity = (await customerPage.getCustomerInfoByEmail(info.email)).orders_count;
        } else {
          expQuantity = quantityOrders;
        }

        const orderPage = new OrdersPage(dashboard, domain);
        await dashboard.goto(`https://${domain}/admin/orders`);

        await test.step(`Click "More filters" button`, async () => {
          await orderPage.clickButtonMoreFilters();
          expect(await orderPage.page.locator(orderPage.xpathLabelOnFilter("Customer")).isVisible());
        });

        await test.step(`Click "Customer" label`, async () => {
          await orderPage.clickOnFieldWithLabelOnFilter("Customer");
          expect(await orderPage.isTextBoxExist("Customer")).toBeTruthy();
        });

        await test.step(`Input Customer not exist then click "Apply" button`, async () => {
          await orderPage.inputSearchTermToFilterOption("Customer", info.email);
          expect(await orderPage.isTextVisible(`Customer: ${info.email}`, 2)).toBeTruthy();
          const actQuantity = await orderPage.getQuantityOfOrders();
          expect(actQuantity).toEqual(expQuantity);

          if (caseID == "SB_RLS_OD_MFSB_27") {
            expect(await orderPage.isTextVisible("You have no orders yet")).toBeTruthy();
            expect(
              await orderPage.isTextVisible(
                "Your orders will be listed here when your customers submit orders on your store",
              ),
            ).toBeTruthy();
          }
        });
      });
    },
  );
});
