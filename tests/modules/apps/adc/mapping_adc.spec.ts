import { expect, test } from "@core/fixtures";
import { ADCPage } from "@pages/dashboard/apps/ali_dropship_connector";
import { ProductPage } from "@pages/dashboard/products";
import { SFCheckout } from "@pages/storefront/checkout";
import { ShippingAddress } from "@types";
import { OrdersPage } from "@pages/dashboard/orders";
import { AdcAPI } from "@pages/api/apps/adc/ali_dropship_connector";

test.describe("Mapping product import from Ali", async () => {
  let productPage: ProductPage;
  let checkout: SFCheckout;
  let shopDomain: string;
  let linkAli: Array<string>;
  let shippingAddress: ShippingAddress;
  let orderName: string;
  let ordersPage: OrdersPage;
  let adcAPI: AdcAPI;

  test.beforeEach(async ({ conf, dashboard, page, request, multipleStore }) => {
    shopDomain = conf.suiteConf.domain;
    checkout = new SFCheckout(page, shopDomain, null, request);
    productPage = new ProductPage(page, shopDomain);
    shippingAddress = conf.suiteConf.shipping_address;
    productPage = new ProductPage(dashboard, shopDomain);
    linkAli = conf.caseConf.link_ali;
    ordersPage = new OrdersPage(dashboard, shopDomain);

    await test.step(`Import product + checkout`, async () => {
      const adcPage = new ADCPage(dashboard, shopDomain);
      // Delete all product
      await productPage.goToProductList();
      await productPage.deleteProduct(conf.suiteConf.password);

      await adcPage.goToImportList();
      await adcPage.addLinkToImport(linkAli);
      await adcPage.importToStore();
      expect(await adcPage.isTextVisible("has been imported to ShopBase Store.")).toBeTruthy();

      //Checkout order
      const infoOrder = await checkout.createStripeOrder(
        conf.caseConf.title_product,
        conf.suiteConf.quantity,
        shippingAddress,
        null,
      );
      orderName = infoOrder.orderName;
      // wait order capture = paid
      await ordersPage.gotoOrderPage();
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForPaymentStatusIsPaid();
    });

    const authRequest = await multipleStore.getAuthRequest(
      conf.suiteConf.username,
      conf.suiteConf.password,
      shopDomain,
      conf.suiteConf.shop_id,
      conf.suiteConf.shop_id,
    );
    adcAPI = new AdcAPI(shopDomain, conf.suiteConf.shop_id, authRequest);
  });

  test(`@SB_ADC_MP_7 Kiểm tra chức năng tự động mapping khi product trong order là product đuơc crawl trực tiếp từ Ali`, async ({
    dashboard,
  }) => {
    const adcPage = new ADCPage(dashboard, shopDomain);
    await test.step(`Crawl trực tiếp product A từ Ali => Kiểm tra chức năng tự động mapping`, async () => {
      await adcPage.goToManageOrder();
      const orderInfor = await adcAPI.getDataOrder();
      expect(orderInfor[0].name).toEqual(orderName);
      expect(orderInfor[0].line_items[0].is_mapped_option).toEqual(true);
    });
  });
});

test.describe("Mapping product ADC", async () => {
  let productPage: ProductPage;
  let checkout: SFCheckout;
  let shopDomain: string;
  let shippingAddress: ShippingAddress;
  let orderName: string;
  let snapshotOptions;
  let ordersPage: OrdersPage;
  let adcAPI: AdcAPI;

  test.beforeEach(async ({ conf, dashboard, page, request, multipleStore }) => {
    shopDomain = conf.suiteConf.domain;
    checkout = new SFCheckout(page, shopDomain, null, request);
    productPage = new ProductPage(page, shopDomain);
    shippingAddress = conf.suiteConf.shipping_address;
    productPage = new ProductPage(dashboard, shopDomain);
    snapshotOptions = conf.suiteConf.snapshot_options;
    ordersPage = new OrdersPage(dashboard, shopDomain);

    await test.step(`Add product + Checkout`, async () => {
      await productPage.goToProductList();
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.goToProductList();
      await productPage.addNewProductWithData(conf.suiteConf.product_all_info);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      await productPage.addVariants(conf.suiteConf.product_variant);
    });
    //Checkout order
    const infoOrder = await checkout.createStripeOrder(
      conf.suiteConf.product_all_info.title,
      conf.suiteConf.quantity,
      shippingAddress,
      null,
    );
    orderName = infoOrder.orderName;
    // wait order capture = paid
    await ordersPage.gotoOrderPage();
    await ordersPage.goToOrderDetailSBase(orderName);
    await ordersPage.waitForPaymentStatusIsPaid();

    const authRequest = await multipleStore.getAuthRequest(
      conf.suiteConf.username,
      conf.suiteConf.password,
      shopDomain,
      conf.suiteConf.shop_id,
      conf.suiteConf.shop_id,
    );
    adcAPI = new AdcAPI(shopDomain, conf.suiteConf.shop_id, authRequest);
  });

  test(`@SB_ADC_MP_4 Kiểm tra mapping product thất bại do số lượng option của product từ Ali < số option của private product`, async ({
    conf,
    dashboard,
  }) => {
    await test.step(`Trong SB setup thêm variant cho product => Thực hiện mapping`, async () => {
      const domain = conf.suiteConf.domain;
      const adcPage = new ADCPage(dashboard, domain);
      await adcPage.goToManageOrder();
      const orderInfor = await adcAPI.getDataOrder();
      expect(orderInfor[0].name).toEqual(orderName);
      await adcPage.mapProduct(conf.caseConf.link_ali);
      expect(await adcPage.isTextVisible(conf.caseConf.error_message)).toBeTruthy();
    });
  });

  test(`@SB_ADC_MP_6 Kiểm tra chức năng tự detect và map những option value có cùng tên`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Trong SB setup thêm variant cho product => Thực hiện mapping`, async () => {
      const domain = conf.suiteConf.domain;
      const adcPage = new ADCPage(dashboard, domain);
      await adcPage.goToManageOrder();
      const orderInfor = await adcAPI.getDataOrder();
      expect(orderInfor[0].name).toEqual(orderName);
      await adcPage.mapProduct(conf.caseConf.link_ali);
      await snapshotFixture.verify({
        page: dashboard,
        selector: adcPage.xpathTableMapping,
        snapshotName: `${conf.caseConf.picture}`,
        snapshotOptions,
      });
    });
  });

  test(`@SB_ADC_MP_3 Kiểm tra mapping thất bại do chọn option để mapping không hợp lệ`, async ({ dashboard, conf }) => {
    await test.step(`Vào Dashboard -> Apps->Ali Dropship Connector->Manager Order->Chọn order cần mapping->Chọn option mapping không hợp lệ`, async () => {
      const domain = conf.suiteConf.domain;
      const adcPage = new ADCPage(dashboard, domain);
      await adcPage.goToManageOrder();
      const orderInfor = await adcAPI.getDataOrder();
      expect(orderInfor[0].name).toEqual(orderName);
      await adcPage.mapProduct(conf.caseConf.link_ali);
      await adcPage.selectOptionMap(conf.caseConf.data);
      await adcPage.clickElementWithLabel("span", "Save changes");
      expect(await adcPage.isTextVisible("Duplicate option")).toBeTruthy();
    });
  });

  test(`@SB_ADC_MP_1 Kiểm tra mapping thành công`, async ({ dashboard, conf }) => {
    await test.step(`Vào ADC > Manage orders > Chọn order shopbase =>thực hiện mapping product`, async () => {
      const domain = conf.suiteConf.domain;
      const adcPage = new ADCPage(dashboard, domain);
      const dataMap = conf.caseConf.data;
      await adcPage.goToManageOrder();
      const orderInfor = await adcAPI.getDataOrder();
      expect(orderInfor[0].name).toEqual(orderName);
      await adcPage.mapProduct(conf.caseConf.link_ali);
      await adcPage.clickCheckboxImage(1);
      await adcPage.clickCheckboxImage(5);
      for (let i = 0; i < dataMap.length; i++) {
        await adcPage.selectOptionMap(dataMap[i]);
      }
      await adcPage.clickElementWithLabel("span", "Save changes");
      await expect(async () => {
        expect(await adcPage.isTextVisible("Product options mapped successfully")).toBeTruthy();
        const orderInfor = await adcAPI.getDataOrder();
        expect(orderInfor[0].line_items[0].is_mapped_option).toEqual(true);
      }).toPass();
    });
  });
});
