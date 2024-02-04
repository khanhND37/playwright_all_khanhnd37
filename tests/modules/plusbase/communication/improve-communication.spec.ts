import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { CheckoutAPI } from "@pages/api/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import { OrderAPI } from "@pages/api/order";
import type { CheckoutInfo, Product, ProductInfo } from "@types";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { ProductAPI } from "@pages/api/product";
import { DMCAReportAPI } from "@pages/api/online_store/dmca/dmca";
import { ImproveCommunication } from "./improve-communication";
import { OcgLogger } from "@core/logger";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { HiveNotification } from "@pages/hive/hiveNotification";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardAPI } from "@pages/api/dashboard";

let shopDomain: string;
let messageTitle: string;
let timeline: string;
let alternativeLink: string;
let timelineNotSubmitAltLink: string;
let timelineProvideAlternativeLink: string;
let orderId: number;
let indexProdCheckout: number;
let productName: string;
let productId: number;
let qtyAfter: number;
let qtyBefore: number;
let tooltipMessage: string;
let responseMessage: string;
let successMessage: string;
let aliUrl: string;
let productStoreID: number;
let cancelRefundReason: string;

let checkoutAPI: CheckoutAPI;
let dashboardAPI: DashboardAPI;
let orderPage: OrdersPage;
let dashboardPage: DashboardPage;
let orderAPI: OrderAPI;
let checkoutInfo: CheckoutInfo;
let infoProduct: Array<Product>;
let productPage: ProductPage;
let productAPI: ProductAPI;
let dmcaAPI: DMCAReportAPI;

let plusbasePage: DropshipCatalogPage;
let accessToken: string;
const logger = OcgLogger.get();
let quotationId: number;
let odooService: OdooServiceInterface;
let variantName: string;
let productsCheckout: Array<Product>;
let shopId: number;
let plbTemplateDashboardPage: DashboardPage;

test.describe("Communication for seller when product Ali update", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest, page, odoo }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    messageTitle = conf.caseConf.message_title;
    timeline = conf.caseConf.timeline;
    timelineNotSubmitAltLink = conf.caseConf.timeline_not_submit_link;
    timelineProvideAlternativeLink = conf.caseConf.timeline_submit_link;
    infoProduct = conf.suiteConf.info_product.productsCheckout;
    indexProdCheckout = conf.caseConf.index_prod_checkout;
    productName = conf.caseConf.product_name;
    productId = conf.caseConf.product_id;
    tooltipMessage = conf.caseConf.tooltip_message;
    responseMessage = conf.caseConf.response_message;
    successMessage = conf.caseConf.success_message;
    aliUrl = conf.caseConf.ali_url;
    quotationId = conf.caseConf.quotation_id;
    variantName = conf.caseConf.variant_name;
    odooService = OdooService(odoo);
    productsCheckout = conf.caseConf.products_checkout;
    shopId = conf.suiteConf.shop_id;
    alternativeLink = conf.caseConf.alternative_link;
    cancelRefundReason = conf.caseConf.cancel_refund_reason;

    checkoutAPI = new CheckoutAPI(shopDomain, authRequest, page);
    orderAPI = new OrderAPI(shopDomain, authRequest);
    orderPage = new OrdersPage(dashboard, shopDomain);
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    productPage = new ProductPage(dashboard, shopDomain);
    productAPI = new ProductAPI(shopDomain, authRequest);
    dmcaAPI = new DMCAReportAPI(shopDomain, authRequest);
    dashboardAPI = new DashboardAPI(shopDomain, authRequest);
  });

  test(`@SB_PLB_CSP_63 Verify hiển thị message  sau khi checkout order có product không tìm thấy shipping country`, async ({
    conf,
  }) => {
    await test.step(`Thực hiện checkout`, async () => {
      // Get data count qty order lỗi trước khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([conf.caseConf.product_id]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      //checkout product lần đầu thì quantity sẽ bằng 0
      if (map.size == 0) {
        qtyBefore = 0;
      } else {
        qtyBefore = map.get(`${conf.caseConf.product_id}`).count;
      }

      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        customerInfo: {
          shippingAddress: conf.suiteConf.shipping_address.shipping_address_not_support,
        },
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Click menu Order > All Order > Search order vừa mới checkout`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(timeline);
      }).toPass();
    });

    await test.step(`Login vào store merchant `, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Click Check product`, async () => {
      // Get data count qty order lỗi sau khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([productId]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      qtyAfter = map.get(`${productId}`).count;
      expect(qtyAfter).toEqual(qtyBefore + infoProduct[indexProdCheckout].quantity);
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await dashboardPage.clickElementWithLabel("span", "Check product", numberOfMessage + 1);
      expect(dashboardPage.isTextVisible(productName)).toBeTruthy();
      await expect(async () => {
        expect(
          await productPage.isTextVisible(
            `Unable to fulfill ${qtyAfter} orders because the product cannot be delivered to the buyer's address.`,
          ),
        ).toBeTruthy();
      }).toPass();
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });
  });

  test(`@SB_PLB_CSP_62 Verify hiển thị message  sau khi checkout order có  product  không tìm thấy variant`, async ({
    conf,
    token,
    context,
    authRequest,
    dashboard,
    multipleStore,
  }) => {
    const authRequestTpl = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );

    const orderTplAPI = new OrderAPI(conf.suiteConf.plb_template.domain, authRequestTpl);
    await test.step(`Thực hiện checkout`, async () => {
      let quotationInfo = await odooService.updateQuotation(quotationId, {
        x_use_partner_price: false,
      });
      expect(quotationInfo.x_use_partner_price).toEqual(false);
      plusbasePage = new DropshipCatalogPage(dashboard, shopDomain);
      await plusbasePage.searchAndImportAliExpressProduct(aliUrl);
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, shopDomain);
      await productPage.page.waitForLoadState("networkidle");
      productStoreID = Number(await productPage.getProductIDByURL());
      const shopToken = await token.getWithCredentials({
        domain: conf.suiteConf.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken.access_token;
      const productVariantId = await productPage.getVariantIdByAPI(
        authRequest,
        productStoreID,
        variantName,
        accessToken,
      );
      productsCheckout[0].variant_id = productVariantId;
      expect(productVariantId > 0).toEqual(true);

      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: productsCheckout,
        customerInfo: {
          shippingAddress: conf.suiteConf.shipping_address.shipping_address_support,
        },
      });
      orderId = checkoutInfo.order.id;
      expect(orderId > 0).toEqual(true);
      quotationInfo = await odooService.updateQuotation(quotationId, {
        x_use_partner_price: true,
      });
      expect(quotationInfo.x_use_partner_price).toEqual(true);
      orderTplAPI.ignoreValidateCustomerAddress(shopId, orderId);
    });

    await test.step(`Click menu Order > All Order > Search order vừa mới checkout`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(timeline);
      }).toPass();
    });

    await test.step(`Login vào store merchant `, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Click Check product`, async () => {
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await dashboardPage.clickElementWithLabel("span", "Check product", numberOfMessage + 1);
      expect(dashboardPage.isTextVisible(productName)).toBeTruthy();
      await productPage.page.reload();
      await expect(async () => {
        expect(
          await productPage.isTextVisible(`Unable to fulfill 1 orders due to not found AliExpress product variant`),
        ).toBeTruthy();
      }).toPass();
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });

    await test.step(`Click menu Dropship product > All Product > Search product > Submit alternative link`, async () => {
      await productPage.clickElementWithLabel("button", "Provide alternative links");
      await productPage.fillAlternativeLink(alternativeLink);
      expect(
        await productPage.isTextVisible(
          "Thank you for providing alternative links. We will check and fulfill your existing orders soon.",
        ),
      ).toEqual(true);
    });

    await test.step(`Click menu Order > All Order > Search order`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(timelineProvideAlternativeLink);
      }).toPass();
    });

    // delete product after verify
    await productAPI.deleteProductById(shopDomain, productStoreID);
  });

  test(`@SB_PLB_CSP_60 Verify hiển thị message sau khi checkout order có product link unavailable`, async ({
    conf,
    odoo,
  }) => {
    await test.step(`Thực hiện checkout`, async () => {
      // Get data count qty order lỗi trước khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([conf.caseConf.product_id]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      //checkout product lần đầu thì quantity sẽ bằng 0
      if (map.size == 0) {
        qtyBefore = 0;
      } else {
        qtyBefore = map.get(`${conf.caseConf.product_id}`).count;
      }
      //checkout product
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        customerInfo: {
          shippingAddress: conf.suiteConf.shipping_address.shipping_address_support,
        },
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Click menu Order > All Order > Search order vừa mới checkout`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(timeline);
      }).toPass();
    });

    await test.step(`Login vào store merchant `, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Click Check product`, async () => {
      // Get data count qty order lỗi sau khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([productId]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      qtyAfter = map.get(`${productId}`).count;
      expect(qtyAfter).toEqual(qtyBefore + infoProduct[indexProdCheckout].quantity);

      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await dashboardPage.clickElementWithLabel("span", "Check product", numberOfMessage + 1);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(
            `Unable to fulfill ${qtyAfter} orders due to unavailable Aliexpress product link`,
          ),
        ).toBeTruthy();
      }).toPass();
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });

    const productTempId = conf.caseConf.product_template_id;

    // Set available product
    const isUnavailable: Array<ProductInfo> = await odoo.read(
      "product.template",
      [productTempId],
      ["x_set_unavailable"],
    );
    if (isUnavailable[0].x_set_unavailable) {
      await odoo.update("product.template", productTempId, {
        x_set_unavailable: false,
        x_url: conf.caseConf.link_die,
        x_set_unavailable_at: null,
      });
    }
  });

  test(`@SB_PLB_CSP_59 Verify hiển thị message do seller bị report DMCA từ store front`, async ({ conf }) => {
    let messageResponded: number;
    await test.step(`User redirect đến link report DMCA > Fill report form > Click Send`, async () => {
      const dmcaReport = conf.caseConf.dmca_report;
      await dmcaAPI.sendDMCAReport(dmcaReport);
    });

    await test.step(`Login vào store merchant `, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle + conf.caseConf.dmca_report.email, "Responded");
      messageResponded = await dashboardAPI.countRequireActionInTab("resolved");
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Click Respond `, async () => {
      const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await dashboardPage.clickElementWithLabel("span", "Respond", numberOfMessage + 1);
      await dashboardPage.page.waitForLoadState("networkidle");
      const popupResponse = await dashboardPage.page.locator(dashboardPage.xpathPopupResponseMessage).count();
      expect(popupResponse).toEqual(1);
    });

    await test.step(`Hover vào Respond button`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTooltipResponseMessage).hover();
      expect(dashboardPage.isTextVisible(tooltipMessage)).toBeTruthy();
    });

    await test.step(`Nhập thông tin vào phần response > Click Submit`, async () => {
      await dashboardPage.clickElementWithLabel("span", "Respond");
      await dashboardPage.page.waitForLoadState("networkidle");
      await dashboardPage.page.waitForSelector(dashboardPage.xpathInputTextResponse);
      await dashboardPage.page.locator(dashboardPage.xpathInputTextResponse).fill(responseMessage);
      await dashboardPage.clickElementWithLabel("span", "Submit");
      expect(dashboardPage.isTextVisible(successMessage)).toBeTruthy();
    });

    await test.step(`Click Message icon > chọn tab Resolved`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathCloseResponsePopup).click();
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle + conf.caseConf.dmca_report.email, "Responded");
      const currentMessage = await dashboardAPI.countRequireActionInTab("resolved");
      expect(currentMessage).toEqual(messageResponded + 1);
    });
  });

  test(`@SB_PLB_CSP_68 Verify hiển thị message sau khi checkout order có combo chứa product link unavailable`, async ({
    odoo,
    conf,
  }) => {
    await test.step(`Thực hiện checkout`, async () => {
      // Get data count qty order lỗi trước khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([conf.caseConf.product_id]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      //checkout product lần đầu thì quantity sẽ bằng 0
      if (map.size == 0) {
        qtyBefore = 0;
      } else {
        qtyBefore = map.get(`${conf.caseConf.product_id}`).count;
      }
      //checkout product
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        customerInfo: {
          shippingAddress: conf.suiteConf.shipping_address.shipping_address_support,
        },
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Click menu Order > All Order > Search order vừa mới checkout`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(timeline);
      }).toPass();
    });

    await test.step(`Login vào store merchant `, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Click Check product`, async () => {
      // Get data count qty order lỗi sau khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([productId]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      qtyAfter = map.get(`${productId}`).count;
      expect(qtyAfter).toEqual(qtyBefore + infoProduct[indexProdCheckout].quantity);

      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await dashboardPage.clickElementWithLabel("span", "Check product", numberOfMessage + 1);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(
            `Unable to fulfill ${qtyAfter} orders due to unavailable Aliexpress product link`,
          ),
        ).toBeTruthy();
      }).toPass();
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });

    // Set available product
    const productTempId = conf.caseConf.product_template_id;
    const isUnavailable: Array<ProductInfo> = await odoo.read(
      "product.template",
      [productTempId],
      ["x_set_unavailable"],
    );
    if (isUnavailable[0].x_set_unavailable) {
      await odoo.update("product.template", productTempId, {
        x_set_unavailable: false,
        x_url: conf.caseConf.link_die,
        x_set_unavailable_at: null,
      });
    }
  });

  test(`@SB_PLB_CSP_74 Verify timeline của order detail khi count down end trước khi seller check issue product`, async ({
    scheduler,
    conf,
  }) => {
    let scheduleData: ImproveCommunication;

    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as ImproveCommunication;
    } else {
      logger.info("Init default object");
      scheduleData = {
        orderId: 0,
      };

      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }

    await test.step(`Thực hiện checkout`, async () => {
      // Get data count qty order lỗi trước khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([conf.caseConf.product_id]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      //checkout product lần đầu thì quantity sẽ bằng 0
      if (map.size == 0) {
        qtyBefore = 0;
      } else {
        qtyBefore = map.get(`${conf.caseConf.product_id}`).count;
      }
      // nếu chưa có order thì checkout
      if (!scheduleData.orderId) {
        checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: [infoProduct[indexProdCheckout]],
          customerInfo: {
            shippingAddress: conf.suiteConf.shipping_address.shipping_address_support,
          },
        });
        scheduleData.orderId = checkoutInfo.order.id;
      }
    });

    await test.step(`Click menu Order > All Order > Search order vừa mới checkout`, async () => {
      if (!scheduleData.orderId) {
        await orderPage.goToOrderByOrderId(scheduleData.orderId);
        await orderPage.waitForProfitCalculated();
        await expect(async () => {
          expect(await orderAPI.getTimelineList(scheduleData.orderId)).toContain(timeline);
        }).toPass();
      }
    });

    await test.step(`Click Require action > Click tab unresolve`, async () => {
      if (!scheduleData.orderId) {
        await dashboardPage.clickElementWithLabel("div", "Required actions");
        await dashboardPage.searchMessage(messageTitle, "Unresponded");
        const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
        await expect(message).toBeGreaterThanOrEqual(1);
      }
    });

    await test.step(`Click Check product`, async () => {
      if (!scheduleData.orderId) {
        // Get data count qty order lỗi sau khi checkout
        const dataBalanceIssues = await productAPI.getBalanceIssues([productId]);
        const map = new Map();
        for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
          map.set(key, value);
        }
        qtyAfter = map.get(`${productId}`).count;
        expect(qtyAfter).toEqual(qtyBefore + infoProduct[indexProdCheckout].quantity);
        await dashboardPage.searchMessage(messageTitle, "Unresponded");
        const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
        await dashboardPage.clickElementWithLabel("span", "Check product", numberOfMessage + 1);
        expect(dashboardPage.isTextVisible(productName)).toBeTruthy();
        await expect(async () => {
          expect(
            await productPage.isTextVisible(
              `Unable to fulfill ${qtyAfter} orders due to not found AliExpress product variant`,
            ),
          ).toBeTruthy();
        }).toPass();
        await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
      }
    });

    await test.step(`Sau thời gian countdown của message > Click menu Order > All Order > Search order `, async () => {
      await orderPage.goToOrderByOrderId(scheduleData.orderId);
      let timelineOrder = [];
      timelineOrder = await orderAPI.getTimelineList(scheduleData.orderId);
      if (!timelineOrder.includes(timelineNotSubmitAltLink)) {
        await scheduler.schedule({ mode: "later", minutes: 1500 });
        await scheduler.setData(scheduleData);
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      logger.info("Clear scheduling");
      await scheduler.clear();
      await expect(async () => {
        expect(await orderAPI.getTimelineList(scheduleData.orderId)).toContain(timelineNotSubmitAltLink);
      }).toPass();
    });

    await test.step(`Mở dashboard > Click Message`, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Closed");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });
  });

  test(`@SB_PLB_CSP_67 Verify hiển thị message sau khi checkout order có combo chứa product có nhiều hơn 1 issue`, async ({
    conf,
  }) => {
    await test.step(`Thực hiện checkout`, async () => {
      // Get data count qty order lỗi trước khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([conf.caseConf.product_id]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      //checkout product lần đầu thì quantity sẽ bằng 0
      if (map.size == 0) {
        qtyBefore = 0;
      } else {
        qtyBefore = map.get(`${conf.caseConf.product_id}`).count;
      }
      //checkout product
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        customerInfo: {
          shippingAddress: conf.suiteConf.shipping_address.shipping_address_not_support,
        },
      });
      orderId = checkoutInfo.order.id;
    });

    await test.step(`Click menu Order > All Order > Search order vừa mới checkout`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(timeline);
      }).toPass();
    });

    await test.step(`Login vào store merchant `, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Click Check product`, async () => {
      // Get data count qty order lỗi sau khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([productId]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      qtyAfter = map.get(`${productId}`).count;
      expect(qtyAfter).toEqual(qtyBefore + infoProduct[indexProdCheckout].quantity);

      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await dashboardPage.clickElementWithLabel("span", "Check product", numberOfMessage + 1);
      await expect(async () => {
        expect(
          await productPage.isTextVisible(
            `Unable to fulfill ${qtyAfter} orders orders due to changes in Aliexpress shipping countries and product variants`,
          ),
        ).toBeTruthy();
      }).toPass();
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });
  });

  test(`@SB_PLB_CSP_58 Verify hiển thị message do user tạo trên hive`, async ({ hiveSBase, conf }) => {
    const message = conf.caseConf.message;
    let messageId: string;
    const hiveMessage = new HiveNotification(hiveSBase, conf.suiteConf.hive_domain);
    await test.step(`Vào menu Notification > Message list > Add new  > Fill message > Click Create`, async () => {
      await hiveMessage.navigateMessageList();
      await hiveMessage.clickElementWithLabel("a", "Add new");
      await hiveMessage.createMessage(message);
      await hiveMessage.page.waitForSelector(hiveMessage.xpathSuccessAlert);
      messageId = (await hiveMessage.getMessageValue(1, 2)).trim();
      const titleMessage = await hiveMessage.getMessageValue(1, 3);
      expect(titleMessage.trim()).toEqual(conf.caseConf.message.title);
      if (titleMessage.trim() === conf.caseConf.message.title) {
        messageId = (await hiveMessage.getMessageValue(1, 2)).trim();
      }
      const shopDomain = await hiveMessage.getMessageValue(1, 4);
      expect(shopDomain.trim()).toEqual(conf.caseConf.message.domain);
    });

    await test.step(`Login vào store merchant `, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      expect(message).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Click vào Message`, async () => {
      const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await dashboardPage.clickElementWithLabel("span", "Respond", numberOfMessage + 1);
      await dashboardPage.page.waitForLoadState("networkidle");
      const popupResponse = await dashboardPage.page.locator(dashboardPage.xpathPopupResponseMessage).count();
      expect(popupResponse).toEqual(1);
      const titleMessage = await dashboardPage.page.locator(dashboardPage.xpathTitleMessage).textContent();
      const contentMessage = await dashboardPage.page.locator(dashboardPage.xpathContentMessage).textContent();
      expect(titleMessage).toEqual(conf.caseConf.message.title);
      expect(contentMessage).toContain(conf.caseConf.message.description);
    });

    await test.step(`Close popup detail message > Click close modal message`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathCloseMessageModal).click();
      const popupResponse = await dashboardPage.page.locator(dashboardPage.xpathPopupResponseMessage).count();
      expect(popupResponse).toEqual(0);
    });

    await test.step(`Click icon Message`, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Recently view");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      expect(message).toBeGreaterThanOrEqual(1);
    });

    //delete message after create
    await hiveMessage.deleteMessageById(messageId, shopDomain);
  });

  test(`@SB_PLB_CSP_51 Verify thay thế các Refund reason cũ ngoại trừ reason Other bằng các reason option được config trên hive`, async ({
    conf,
    multipleStore,
  }) => {
    checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: [infoProduct[indexProdCheckout]],
      customerInfo: {
        shippingAddress: conf.suiteConf.shipping_address.shipping_address_support,
      },
    });
    orderId = checkoutInfo.order.id;

    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );

    plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.plb_template.domain);
    orderPage = new OrdersPage(plbTemplateDashboardPage.page, conf.suiteConf.plb_template.domain);
    await test.step(`Vào dashboard shop template PlusBase > Orders > All orders > Search orders A > vào order detail > Approve order`, async () => {
      await orderPage.goToOrderStoreTemplateByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      const totalOrderActual = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));
      await orderPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await orderPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      const paidByCustomerActual = Number(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(totalOrderActual);
    });

    await test.step(`Click button Refund order > Nhập thông tin refund > click Refund`, async () => {
      await orderPage.clickOnBtnWithLabel("Refund order");
      await orderPage.page.waitForLoadState("load");
      await orderPage.page.waitForSelector(orderPage.xpathCancelRefundCard);
      await orderPage.chooseReasonCanelRefund(cancelRefundReason);
      await orderPage.inputQuantityRefund(1, conf.caseConf.quantityRefunds);
      const inputReason = await orderPage.page.locator(orderPage.xpathInputCancelRefundReason).inputValue();
      expect(inputReason.trim()).toEqual(cancelRefundReason);
      // cần đợi 1 khoảng thời gian để giá trị Refund được update đúng theo số lượng item refund và shipping fee
      await orderPage.waitAbit(5 * 1000);
      await orderPage.confirmRefund();
      await orderPage.page.waitForLoadState("load");
      const paymentStatus = await orderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(
          `PlusBase refunded this order. Reason: ` + cancelRefundReason,
        );
      }).toPass({
        intervals: [3_000],
        timeout: 30_000,
      });
    });

    await test.step(`Vào shop PlusBase > Verify order detail sau khi refund`, async () => {
      const orderPageShopPlb = new OrdersPage(dashboardPage.page, conf.suiteConf.domain);
      await orderPageShopPlb.goToOrderByOrderId(orderId);
      const paymentStatus = await orderPage.getPaymentStatus();
      expect(paymentStatus).toEqual("Partially refunded");
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(
          `PlusBase refunded this order. Reason: ` + cancelRefundReason,
        );
      }).toPass({
        intervals: [3_000],
        timeout: 30_000,
      });
    });
  });

  test(`@SB_PLB_CSP_52 Verify thay thế các Cancel reason cũ ngoại trừ reason Other bằng các reason option được config trên hive`, async ({
    conf,
    multipleStore,
  }) => {
    checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: [infoProduct[indexProdCheckout]],
      customerInfo: {
        shippingAddress: conf.suiteConf.shipping_address.shipping_address_support,
      },
    });
    orderId = checkoutInfo.order.id;
    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template.username,
      conf.suiteConf.plb_template.password,
      conf.suiteConf.plb_template.domain,
      conf.suiteConf.plb_template.shop_id,
      conf.suiteConf.plb_template.user_id,
    );
    plbTemplateDashboardPage = new DashboardPage(templatePage, conf.suiteConf.plb_template.domain);
    orderPage = new OrdersPage(plbTemplateDashboardPage.page, conf.suiteConf.plb_template.domain);

    await test.step(`Vào dashboard shop template PlusBase > Orders > All orders > Search orders A > Click more action > Click Cancel order`, async () => {
      await orderPage.goToOrderStoreTemplateByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      const totalOrderActual = Number(removeCurrencySymbol(await orderPage.getTotalOrder()));
      await orderPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      const actualResult = await orderPage.getApproveStatus();
      expect(actualResult).toEqual("Approved");
      const paidByCustomerActual = Number(removeCurrencySymbol(await orderPage.getPaidByCustomer()));
      expect(paidByCustomerActual).toEqual(totalOrderActual);
    });

    await test.step(`Nhập thông tin Cancel order > click "Cancel"`, async () => {
      await orderPage.moreActionsOrder(Action.ACTION_CANCEL_ORDER);
      await orderPage.page.waitForLoadState("load");
      await orderPage.chooseReasonCanelRefund(cancelRefundReason);
      await orderPage.clickElementWithLabel("div", "Reason for cancel");
      const inputReason = await orderPage.page.locator(orderPage.xpathInputCancelRefundReason).inputValue();
      expect(inputReason.trim()).toEqual(cancelRefundReason);
      await orderPage.clickButton("Cancel");
      await orderPage.page.waitForLoadState("networkidle");
      const cancelStatus = await orderPage.getCancelStatus();
      expect(cancelStatus).toEqual("Cancelled");
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(
          `PlusBase canceled this order. Reason: ` + cancelRefundReason,
        );
      }).toPass({
        intervals: [3_000],
        timeout: 30_000,
      });
    });

    await test.step(`Vào shop PlusBase > verify order detail sau khi cancel`, async () => {
      const orderPageShopPlb = new OrdersPage(dashboardPage.page, conf.suiteConf.domain);
      await orderPageShopPlb.goToOrderByOrderId(orderId);
      const cancelStatus = await orderPage.getCancelStatus();
      expect(cancelStatus).toEqual("Cancelled");
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(
          `PlusBase canceled this order. Reason: ` + cancelRefundReason,
        );
      }).toPass({
        intervals: [3_000],
        timeout: 30_000,
      });
    });
  });

  test(`@SB_PLB_CSP_80 Verify message chỉ bắn 1 lần 1 ngày với product có issue dù được checkout nhiều lần`, async ({
    conf,
  }) => {
    // Get data count qty order lỗi trước khi checkout
    const dataBalanceIssues = await productAPI.getBalanceIssues([conf.caseConf.product_id]);
    const map = new Map();
    for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
      map.set(key, value);
    }
    //checkout product lần đầu thì quantity sẽ bằng 0
    if (map.size == 0) {
      qtyBefore = 0;
    } else {
      qtyBefore = map.get(`${conf.caseConf.product_id}`).count;
    }

    checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
      productsCheckout: [infoProduct[indexProdCheckout]],
      customerInfo: {
        shippingAddress: conf.suiteConf.shipping_address.shipping_address_not_support,
      },
    });
    orderId = checkoutInfo.order.id;

    await test.step(`Click menu Order > All Order > Search order vừa mới checkout`, async () => {
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(timeline);
      }).toPass();
    });

    await test.step(`Login vào store merchant `, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(messageTitle, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });

    await test.step(`Click Check product`, async () => {
      // Get data count qty order lỗi sau khi checkout
      const dataBalanceIssues = await productAPI.getBalanceIssues([productId]);
      const map = new Map();
      for (const [key, value] of Object.entries(dataBalanceIssues.balance_issues)) {
        map.set(key, value);
      }
      qtyAfter = map.get(`${productId}`).count;
      expect(qtyAfter).toEqual(qtyBefore + infoProduct[indexProdCheckout].quantity);
      await dashboardPage.searchMessage(productName, "Unresponded");
      const numberOfMessage = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await dashboardPage.clickElementWithLabel("span", "Check product", numberOfMessage + 1);
      expect(dashboardPage.isTextVisible(productName)).toBeTruthy();
      await expect(async () => {
        expect(
          await productPage.isTextVisible(
            `Unable to fulfill ${qtyAfter} orders because the product cannot be delivered to the buyer's address.`,
          ),
        ).toBeTruthy();
      }).toPass();
      await expect(productPage.genLoc(productPage.xapthBtnAlternativeLinks)).toBeEnabled();
    });

    await test.step(`Thực hiện checkout lại product`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({
        productsCheckout: [infoProduct[indexProdCheckout]],
        customerInfo: {
          shippingAddress: conf.suiteConf.shipping_address.shipping_address_not_support,
        },
      });
      orderId = checkoutInfo.order.id;
      await orderPage.goToOrderByOrderId(orderId);
      await orderPage.waitForProfitCalculated();
      await expect(async () => {
        expect(await orderAPI.getTimelineList(orderId)).toContain(timeline);
      }).toPass();
    });

    await test.step(`Back lại store merchant > Click require action > Click Unrespond tab`, async () => {
      await dashboardPage.clickElementWithLabel("div", "Required actions");
      await dashboardPage.searchMessage(productName, "Unresponded");
      const message = await dashboardPage.page.locator(dashboardPage.xpathMessageRequireAction).count();
      await expect(message).toBeGreaterThanOrEqual(1);
    });
  });
});
