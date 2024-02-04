import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { deleteFile, readFileCSV, getDataColumnFileCsv } from "@helper/file";
import { StorefrontInfo } from "./filter_order_pb_multiple_storefronts";

test.describe("Verify filter order with multiple storefront", () => {
  let domain, domain1, domain2: string;
  let storefront1Info, storefront2Info: StorefrontInfo;
  let ordersPage: OrdersPage;
  let orderName1, orderName2: string;
  let email, cardInfo, shippingAddress, productInfo;
  let filePath: string;

  test.beforeEach(async ({ conf, dashboard }) => {
    domain = conf.suiteConf.domain;
    domain1 = conf.suiteConf.storefront1_info.domain;
    domain2 = conf.suiteConf.storefront2_info.domain;
    storefront1Info = conf.suiteConf.storefront1_info;
    storefront2Info = conf.suiteConf.storefront2_info;
    productInfo = conf.caseConf.product;
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    cardInfo = conf.suiteConf.card_info;

    ordersPage = new OrdersPage(dashboard, domain);
  });

  test("@SB_ORD_MSF_09 Checkout 2 SF và check filter tại trang list all order và thông tin order detail khi store config multiple SF", async ({
    request,
    page,
  }) => {
    // checkout main SF
    await test.step(`Checkout with main storefront`, async () => {
      const checkoutAPI1 = new CheckoutAPI(domain1, request, page);
      const checkoutInfo1 = await checkoutAPI1.createAnOrderWithCreditCard({
        productsCheckout: productInfo,
        customerInfo: { emailBuyer: email, shippingAddress: shippingAddress },
        cardInfo: cardInfo,
      });
      orderName1 = checkoutInfo1.order.name;
    });

    // checkout secondary SF
    await test.step(`Checkout with secondary storefront`, async () => {
      const checkoutAPI2 = new CheckoutAPI(domain2, request, page);
      const checkoutInfo2 = await checkoutAPI2.createAnOrderWithCreditCard({
        productsCheckout: productInfo,
        customerInfo: { emailBuyer: email.buyer2, shippingAddress: shippingAddress },
        cardInfo: cardInfo,
      });
      orderName2 = checkoutInfo2.order.name;
    });

    // Filter storefront cha
    await test.step(`Tại Dashboard > Order: Filter order theo storefront domain 1`, async () => {
      await ordersPage.goto(`https://${domain1}/admin/pod/orders`);
      await ordersPage.clickButtonMoreFilters("PrintBase");
      const filterLabel = ordersPage.page.locator(ordersPage.xpathLabelOnFilter("Storefront domain"));
      await expect(filterLabel).toBeVisible();
      await ordersPage.fillDomainStorefrontToSearch(domain1, false);
    });

    await test.step(`Vào Order detail của order vừa tạo ở SF1 để kiểm tra storefront domain của order trong order detail`, async () => {
      await ordersPage.page.locator(ordersPage.xpathOrderNameOnList(orderName1)).click();
      await ordersPage.waitToLoadedOrderDetail(orderName1);
      expect(await ordersPage.isDisplayStorefrontDomain(storefront1Info)).toBe(true);
    });

    // Filter storefront con
    await test.step(`Tại Dashboard > Order: Filter order theo storefront domain 2`, async () => {
      await ordersPage.goto(`https://${domain1}/admin/pod/orders`);
      await ordersPage.clickButtonMoreFilters("PrintBase");
      const filterLabel = ordersPage.page.locator(ordersPage.xpathLabelOnFilter("Storefront domain"));
      await expect(filterLabel).toBeVisible();
      await ordersPage.fillDomainStorefrontToSearch(domain2, false);
    });

    await test.step(`Vào Order detail của order vừa tạo ở SF2 để kiểm tra storefront domain của order trong order detail`, async () => {
      await ordersPage.page.locator(ordersPage.xpathOrderNameOnList(orderName2)).click();
      await ordersPage.waitToLoadedOrderDetail(orderName2);
      expect(await ordersPage.isDisplayStorefrontDomain(storefront2Info)).toBe(true);
    });
  });

  test(`@SB_ORD_MSF_18 Check export file sau khi filter theo SF domain tại trang list all order`, async ({ conf }) => {
    await test.step(`Tại Dashboard > Order, filter order theo storefront domain 1`, async () => {
      await ordersPage.goto(`https://${domain1}/admin/pod/orders`);
      await ordersPage.clickButtonMoreFilters("PrintBase");
      expect(await ordersPage.page.locator(ordersPage.xpathLabelOnFilter("Storefront domain")).isVisible());
      await ordersPage.fillDomainStorefrontToSearch(domain1, false);
    });

    await test.step(`Tại màn list order, select order > Click "Export order". Select export order theo Selected number orders
      > Click "Export to file"> Kiểm tra file export`, async () => {
      await ordersPage.selectOrders(conf.caseConf.number_order_export, false);
      await ordersPage.genLoc(ordersPage.xpathBtnExportOnPBPLB).click();
      await ordersPage.genLoc(ordersPage.xpathSelectOptionSelectedNumberOrderToExportOnPBPLB).click();
      filePath = await ordersPage.downloadFileExportOrder("printbase");
      const fileData = await readFileCSV(filePath);
      const storefrontDomainInFileCSV = await getDataColumnFileCsv(fileData, 77);
      for (const domain of storefrontDomainInFileCSV) {
        expect(domain).toEqual(domain1);
      }
    });
    await test.step("Xóa file CSV đã lưu", async () => {
      await deleteFile(filePath);
    });
  });
});
