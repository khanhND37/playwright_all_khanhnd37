/* eslint-disable camelcase */
import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@pages/storefront/checkout";
import { StorefrontInfo } from "./filter_order_with_sf_domain";
import { deleteFile, readFileCSV, getDataColumnFileCsv } from "@helper/file";

test.describe("Verify filter order with multiple storefront", () => {
  let domain1: string;
  let domain2: string;
  let storefront2Info: StorefrontInfo;
  let ordersPage: OrdersPage;
  let orderName: string;
  let dashboardPage: DashboardPage;
  let checkout1: SFCheckout;
  let checkout2: SFCheckout;
  let email, paymentMethod, cardInfo, shippingAddress, productInfo;
  let filePath: string;

  test.beforeEach(async ({ conf, page }) => {
    const { user_id, shop_id, username, password } = conf.suiteConf as never;
    domain1 = conf.suiteConf.storefront1_info.domain;
    domain2 = conf.suiteConf.storefront2_info.domain;
    storefront2Info = conf.suiteConf.storefront2_info;
    paymentMethod = conf.suiteConf.payment_method;
    productInfo = conf.caseConf.product;
    email = conf.suiteConf.email;
    shippingAddress = conf.suiteConf.shipping_address;
    cardInfo = conf.suiteConf.card_info;

    ordersPage = new OrdersPage(page, domain1);

    await test.step("Check store have multiple SFs", async () => {
      dashboardPage = new DashboardPage(page, domain1);
      await dashboardPage.login({
        userId: user_id,
        shopId: shop_id,
        email: username,
        password: password,
      });
      await dashboardPage.goto(`https://${domain1}/admin`);
      await dashboardPage.navigateToMenu("Online Store");
      await dashboardPage.enableMultipleStorefronts();
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathStorefrontDomain(domain1));
      await dashboardPage.waitUntilElementVisible(dashboardPage.xpathStorefrontDomain(domain2));
    });
  });

  test("@SB_ORD_MSF_07 Checkout 2 SF và check filter tại trang list all order và thông tin order detail khi store config multiple SF", async ({
    request,
    page,
  }) => {
    // Checkout với SF 1
    await test.step(`Lên storefront 1 của shop để checkout sản phẩm: Shirt
      Nhập các thông tin trong trang:
      + Customer information
      + Shipping address
      + Chọn Payment method
      Nhập card checkout
      Click Place order`, async () => {
      const checkoutAPI1 = new CheckoutAPI(domain1, request, page);
      await checkoutAPI1.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
      await checkoutAPI1.openCheckoutPageByToken();

      checkout1 = new SFCheckout(page, domain1);
      await checkout1.selectPaymentMethod(paymentMethod);
      await checkout1.completeOrderWithCardInfo(cardInfo);
    });

    // Checkout với SF 2
    await test.step(`Lên storefront 2 của shop để checkout sản phẩm: Shirt
      Nhập các thông tin trong trang:
      + Customer information
      + Shipping address
      + Chọn Payment method
      Nhập card checkout
      Click Place order`, async () => {
      const checkoutAPI2 = new CheckoutAPI(domain2, request, page);
      await checkoutAPI2.addProductThenSelectShippingMethod(productInfo, email, shippingAddress);
      await checkoutAPI2.openCheckoutPageByToken();

      checkout2 = new SFCheckout(page, domain2);
      await checkout2.selectPaymentMethod(paymentMethod);
      await checkout2.completeOrderWithCardInfo(cardInfo);
      orderName = await checkout2.getOrderName();
    });
    await test.step(`Tại Dashboard > Order: Filter order theo storefront domain 2`, async () => {
      await ordersPage.goto(`https://${domain1}/admin/orders`);
      await ordersPage.clickButtonMoreFilters();
      const filterLabel = ordersPage.page.locator(ordersPage.xpathLabelOnFilter("Storefront domain"));
      await expect(filterLabel).toBeVisible();
      await ordersPage.fillDomainStorefrontToSearch(domain2);
    });

    await test.step(`Vào Order detail của order vừa tạo ở SF2 để kiểm tra storefront domain của order trong order detail`, async () => {
      await ordersPage.page.locator(ordersPage.xpathOrderNameOnList(orderName)).click();
      await ordersPage.page.waitForSelector(`text='${orderName}'`);
      expect(await ordersPage.isDisplayStorefrontDomain(storefront2Info)).toBe(true);
    });
  });

  test(`@SB_ORD_MSF_14 Check export file sau khi filter theo SF domain tại trang list all order`, async ({ conf }) => {
    await test.step(`Tại Dashboard > Order, filter order theo storefront domain 1`, async () => {
      await ordersPage.goto(`https://${domain1}/admin/orders`);
      await ordersPage.clickButtonMoreFilters();
      expect(await ordersPage.page.locator(ordersPage.xpathLabelOnFilter("Storefront domain")).isVisible());
      await ordersPage.fillDomainStorefrontToSearch(domain1);
    });

    await test.step(`Tại màn list order, select order > Click "Export order". Select export order theo Selected number orders
      > Click "Export to file"> Kiểm tra file export`, async () => {
      await ordersPage.selectOrders(conf.caseConf.number_order_export);
      await ordersPage.genLoc(ordersPage.xpathBtnWithLabel("Export order")).click();
      await ordersPage.genLoc(ordersPage.xpathSelectOptionSelectedNumberOrderToExport).click();
      filePath = await ordersPage.downloadFileExportOrder("shopbase");
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
