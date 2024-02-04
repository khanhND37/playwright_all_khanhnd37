import { expect, test } from "@core/fixtures";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { loadData } from "@core/conf/conf";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

test.describe("Verify order detail", () => {
  let orderPage: OrderPage;
  let orderName: string;
  test.beforeEach(async ({ dashboard, conf, page, authRequest }) => {
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    const checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);
    const productDetailAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const products = conf.caseConf.products;
    // create new product
    for (let i = 0; i < products.length; i++) {
      await productDetailAPI.createProduct(products[i]);
    }
    // update product
    await productPage.page.waitForTimeout(3 * 1000);
    for (let i = 0; i < conf.caseConf.update_products.length; i++) {
      const updateProduct = conf.caseConf.update_products[i];
      await productPage.navigateToMenu("Products");
      await productPage.searchProduct(updateProduct.title);
      await productPage.clickTitleProduct(updateProduct.title);
      await productPage.updateProductDigital(updateProduct);
    }
    //checkout product
    await checkoutPage.checkoutProductHaveUpsell(
      conf.caseConf.handle,
      conf.suiteConf.email,
      conf.suiteConf.card,
      conf.caseConf.accept_product_upsell,
    );
    await expect(checkoutPage.genLoc(checkoutPage.xpathThankYouPageHeader)).toBeVisible();
    orderName = await checkoutPage.getOrderName();
    await orderPage.navigateToMenu("Orders");
    await orderPage.waitUtilSkeletonDisappear();
    await orderPage.openNewestOrder();
    await orderPage.waitForPaymentStatusIsPaid();
    await orderPage.waitUtilSkeletonDisappear();
  });

  //delete product
  test.afterEach(async ({ conf, authRequest }) => {
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    //Get product id
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    // Delete product
    await productAPI.deleteProduct(IdsArray);
  });

  test(`[Order detail] Verify UI hiển thị thông tin @SB_SC_SCO_16`, async ({}) => {
    await test.step(`check out product -> order page -> Click vào order vào màn order detail. Check thông tin order`, async () => {
      await expect(orderPage.genLoc(orderPage.xpathOrderName)).toHaveText(" Order " + orderName);
      await expect(orderPage.genLoc(orderPage.xpathProduct)).toHaveText("Products in this order");
      await expect(orderPage.genLoc(orderPage.xpathTimeline)).toHaveText("Timeline");
      await expect(orderPage.genLoc(orderPage.xpathNotes)).toHaveText("Notes");
      await expect(orderPage.genLoc(orderPage.xpathMember)).toHaveText("Member");
      await expect(orderPage.genLoc(orderPage.xpathSummary)).toHaveText("Summary");
      await expect(orderPage.genLoc(orderPage.xpathBtnCancel)).toBeVisible();
      await expect(orderPage.genLoc(orderPage.xpathBtnRefund)).toBeVisible();
    });
  });

  test(`[Order detail] [Order detail] Verify block "Products in this order @SB_SC_SCO_17`, async ({ conf }) => {
    await test.step(`Check thông tin block Products in this order`, async () => {
      const orderProducts = await orderPage.getProductsOnOrderDetail();
      const productOrder = conf.caseConf.products_order;
      for (let i = 0; i < productOrder.length; i++) {
        expect(orderProducts[i]).toEqual(
          expect.objectContaining({
            items: productOrder[i].items,
            productName: productOrder[i].product_name,
            subtotal: productOrder[i].subtotal,
            image: productOrder[i].image,
          }),
        );
      }
    });
  });

  test(`[Order detail] Verify block Summary gồm subtotal & discount, số item @SB_SC_SCO_18`, async ({ conf }) => {
    const summary = conf.caseConf.summary;
    await test.step(`Click vào order vào màn order detail.
      Check thông tin block Summary gồm subtotal & discount, số item, Paid by customer`, async () => {
      expect(await orderPage.getSummaryOrder()).toEqual(summary);
    });
  });

  test(`[Order detail] Verify block Timeline @SB_SC_SCO_19`, async ({ conf }) => {
    const status = await orderPage.getStatusOrder();
    if (status === "paid") {
      for (let i = 0; i < conf.caseConf.list_data_timeline_order.length; i++) {
        const dataTimeLine = conf.caseConf.list_data_timeline_order[i];
        await test.step(`${dataTimeLine.step_description}`, async () => {
          const timelineOrder = orderPage.getLocatorTimelineItem(dataTimeLine.timeline);
          await expect(timelineOrder).toBeVisible();
        });
      }
    } else {
      await test.step(`"Check thông tin block Timeline với action Checkout`, async () => {
        const timelineOrder = orderPage.getLocatorTimelineItem(conf.caseConf.timeline);
        await expect(timelineOrder).toBeVisible();
      });
    }
  });

  test(`[Order detail] Verify block Notes @SB_SC_SCO_20`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.list_data_note_order.length; i++) {
      const dataNoteOrder = conf.caseConf.list_data_note_order[i];
      await test.step(`${dataNoteOrder.step_description}`, async () => {
        await orderPage.editOrderNote(dataNoteOrder.order_note);
        expect(await orderPage.getOrderNote()).toEqual(dataNoteOrder.order_note);
      });
    }
  });

  test(`[Order detail]Verify block "Customer" @SB_SC_SCO_21`, async ({ conf }) => {
    await test.step(`Click vào order detail, check block "Customer"`, async () => {
      const memberEmail = orderPage.getLocatorEmail(conf.caseConf.member_email);
      await expect(memberEmail).toBeVisible();
    });
  });

  test(`[Order detail] Verify chức năng Cancel order @SB_SC_SCO_22`, async ({ conf, page }) => {
    const myProductPage = new MyProductPage(page, conf.suiteConf.domain);

    await test.step(`Click vào button Cancel -> Verify thông tin hiển thị `, async () => {
      await orderPage.clickOnButon("Cancel order");
      await expect(orderPage.genLoc(orderPage.xpathPopupCancelOrder)).toBeVisible();
      const products = await orderPage.getProductInCancelPopup();
      const cancelProduct = conf.caseConf.products_cancel;
      for (let i = 0; i < cancelProduct.length; i++) {
        expect(products[i]).toEqual(
          expect.objectContaining({
            productName: cancelProduct[i].product_name,
            subtotalItem: cancelProduct[i].subtotal,
            image: cancelProduct[i].image,
          }),
        );
      }
      expect(await orderPage.getSubtotalInCancelOrderPopup()).toEqual(conf.caseConf.subtotal_cancel);
    });

    await test.step(`Thực hiện các action để cancel order -> Verify thông tin order sau khi cancel`, async () => {
      await orderPage.cancelOrder(conf.caseConf.button_name, conf.caseConf.refund);
      for (let i = 0; i < conf.caseConf.status.length; i++) {
        const status = orderPage.getLocatorStatus(conf.caseConf.status[i]);
        await expect(status).toBeVisible();
      }
      await orderPage.navigateToMenu("Orders");
      await orderPage.waitUtilSkeletonDisappear();
      await expect(orderPage.getLocatorStatus("refunded")).toBeVisible();
    });

    await test.step(`Verify email gửi cho buyer khi thực hiện cancel order`, async () => {
      const mailinator = await getMailinatorInstanceWithProxy(page);
      await mailinator.accessMail(conf.caseConf.access_email);
      const subjectMailCanceled = await mailinator.page.locator(`(${mailinator.mailsPath}[3])[1]`).innerText();
      expect(subjectMailCanceled).toEqual("Order has been canceled");
    });

    await test.step(`Mở trang My product của buyer -> Verify product sau khi refund`, async () => {
      await myProductPage.login(conf.suiteConf.username, conf.suiteConf.password);
      const product = orderPage.getLocatorProductName(conf.caseConf.products_name);
      await expect(product).toBeHidden();
    });
  });
});

const conf = loadData(__dirname, "LIST_DATA_REFUND_ORDER");
for (let i = 0; i < conf.caseConf.data.length; i++) {
  const caseData = conf.caseConf.data[i];
  test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, page, authRequest }) => {
    const orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    const myProductPage = new MyProductPage(page, conf.suiteConf.domain);
    const checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);
    const productDetailAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const products = caseData.products;

    // create new product
    for (let i = 0; i < products.length; i++) {
      await productDetailAPI.createProduct(products[i]);
    }
    // update product
    await productPage.page.waitForTimeout(3 * 1000);
    for (let i = 0; i < caseData.update_products.length; i++) {
      const updateProduct = caseData.update_products[i];
      await productPage.navigateToMenu("Products");
      await productPage.searchProduct(updateProduct.title);
      await productPage.clickTitleProduct(updateProduct.title);
      await productPage.updateProductDigital(updateProduct);
    }
    //checkout product
    await checkoutPage.checkoutProductHaveUpsell(
      caseData.handle,
      conf.suiteConf.email,
      conf.suiteConf.card,
      caseData.accept_product_upsell,
    );
    await expect(checkoutPage.genLoc(checkoutPage.xpathThankYouPageHeader)).toBeVisible();
    await orderPage.navigateToMenu("Orders");
    await orderPage.waitUtilSkeletonDisappear();
    await orderPage.openNewestOrder();
    await orderPage.waitForPaymentStatusIsPaid();
    await orderPage.waitUtilSkeletonDisappear();

    await test.step(`Click vào button Refund -> Verify thông tin hiển thị `, async () => {
      await orderPage.clickOnButon("Refund");
      await expect(orderPage.genLoc(orderPage.xpathRefundPage)).toBeVisible();
      const products = await orderPage.getProductInRefundPage();
      const refundProduct = caseData.products_refund;
      for (let i = 0; i < refundProduct.length; i++) {
        expect(products[i]).toEqual(
          expect.objectContaining({
            productName: refundProduct[i].product_name,
            subtotalItem: refundProduct[i].subtotal,
            image: refundProduct[i].image,
          }),
        );
      }
    });

    await test.step(`Thực hiện các action để refund order -> Verify thông tin order sau khi refund`, async () => {
      await orderPage.productNumberRefund(caseData.products_name, caseData.number);
      expect(await orderPage.getSubtotalInRefundOrderPage()).toEqual(caseData.subtotal_refund);
      await orderPage.refundItemsOrder(caseData.reason, caseData.refund);
      const status = orderPage.getLocatorStatus(caseData.status);
      await expect(status).toBeVisible();
      await orderPage.navigateToMenu("Orders");
      await orderPage.waitUtilSkeletonDisappear();
      await expect(orderPage.getLocatorStatus(caseData.status)).toBeVisible();
    });

    await test.step(`Verify email gửi cho buyer khi thực hiện refund order`, async () => {
      const mailinator = await getMailinatorInstanceWithProxy(page);
      await mailinator.accessMail(caseData.access_email);
      const subjectMailCanceled = await mailinator.page.locator(`(${mailinator.mailsPath}[3])[1]`).innerText();
      expect(subjectMailCanceled).toEqual("Refund notification");
    });

    await test.step(`Mở trang My product của buyer -> Verify product sau khi refund`, async () => {
      await myProductPage.login(conf.suiteConf.username, conf.suiteConf.password);
      const product = orderPage.getLocatorProductName(caseData.products_name);
      await expect(product).toBeHidden();
    });

    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    //Get product id
    const getProducts = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = getProducts?.data?.map(item => item.id);
    // Delete product
    await productAPI.deleteProduct(IdsArray);
  });
}
