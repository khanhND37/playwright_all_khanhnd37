import { expect, test } from "@core/fixtures";
import { getCurrencySymbolBasedOnCurrencyName, removeCurrencySymbol } from "@core/utils/string";
import { CheckoutAPI } from "@pages/api/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { EditOrderPage } from "@pages/dashboard/edit_order";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFProduct } from "@pages/storefront/product";
import { MailBox } from "@pages/thirdparty/mailbox";
import type { Card, Order, ShippingAddressApi } from "@types";

test.describe("edit sbase order", () => {
  let editOrderPage: EditOrderPage;
  let checkoutAPI: CheckoutAPI;
  let orderPage: OrdersPage;
  let dashboardPage: DashboardPage;
  let checkoutPage;
  let mailbox: MailBox;
  let productPage: SFProduct;

  let domain: string;
  let countryCode: string;
  let shippingAddress: ShippingAddressApi;
  let email: string;
  let card: Card;

  let currencySymbol: string;
  let productPrice: number;
  let editedProductName: string;
  let editedProductQty: number;
  let originProductInfo;
  let originProductQty: number;
  let orderInfo: Order;
  let paymentStatus: string;
  let changesAmount: number;
  let amountToCollect: number;
  let staffName: string;

  // origin order info
  let subtotal: number;
  let total: number;
  let shipping: number;
  let discount: number;

  // after edit order
  let afterEditOrder;

  function getTimeStamp() {
    return new Date().getTime();
  }

  test.beforeAll(async ({ conf, request }) => {
    domain = conf.suiteConf.domain;
    // tạo unique email
    email = "tester" + getTimeStamp() + "@maildrop.cc";
    countryCode = conf.suiteConf.shipping_address.country_code;
    shippingAddress = conf.suiteConf.shipping_address;
    card = conf.suiteConf.card_info;
    currencySymbol = getCurrencySymbolBasedOnCurrencyName(conf.suiteConf.store_currency);
    checkoutAPI = new CheckoutAPI(domain, request);
  });

  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    const beforeEditOrder = conf.caseConf.before_edit;
    paymentStatus = beforeEditOrder.payment_status;
    originProductInfo = beforeEditOrder.origin_product;
    const discountCode = conf.caseConf.discount.code;

    afterEditOrder = conf.caseConf.after_edit;
    editedProductName = afterEditOrder.product.name;
    editedProductQty = afterEditOrder.product.quantity;
    originProductQty = beforeEditOrder.origin_product[0].quantity; // luôn edit product đầu tiên

    productPage = new SFProduct(dashboard, domain, "", 0, 0, conf.suiteConf.product_id);
    dashboardPage = new DashboardPage(dashboard, domain);
    editOrderPage = new EditOrderPage(dashboard, domain);
    orderPage = new OrdersPage(dashboard, domain);
    mailbox = new MailBox(dashboard, domain);

    // get product price của product bị edit
    productPrice = await productPage.loadProductInfoFromDashboard(authRequest);

    await checkoutAPI.addProductToCartThenCheckout(originProductInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(countryCode);
    await checkoutAPI.applyDiscount(discountCode);
    await checkoutAPI.authorizedThenCreateStripeOrder(card);
    orderInfo = await checkoutAPI.getOrderInfo(authRequest);

    subtotal = orderInfo.subtotal;
    total = orderInfo.total;
    shipping = orderInfo.shipping_fee;
    discount = orderInfo.discount;

    await editOrderPage.navigateToOrderPageByAPI(orderInfo.id);
    staffName = await dashboardPage.getStaffName();
  });
  test(
    `Verify tính toán lại order total khi edit order bằng cách` +
      `adjust quantity ( order total tăng), apply discount product @TC_SB_ORD_EO_91`,
    async ({ conf, authRequest }) => {
      test.setTimeout(120000);
      await test.step(
        "Vào trang edit order > Click Btn Adjust quantity của" +
          "product = Yonex, tăng quantity của product > Click Btn Confirm",
        async () => {
          await editOrderPage.editOrderByAdjustingQty(editedProductName, editedProductQty);

          const actProductPriceAndQty = await editOrderPage.getProductPriceAndQty(editedProductName);
          const actOriginQty = await editOrderPage.getOriginalProductQuantity(editedProductName);
          const expProductPriceAndQty = currencySymbol + productPrice.toFixed(2) + " × " + editedProductQty;
          const expOriginQty = `Origin quantity: ${originProductQty}`;

          expect(actOriginQty).toEqual(expOriginQty);
          expect(actProductPriceAndQty).toEqual(expProductPriceAndQty);
        },
      );

      await test.step("Check order total và Check amount to collect cần thu thêm của merchant", async () => {
        // kiểm tra thông tin ở block payment
        amountToCollect = editOrderPage.calculateAmountToCollect(originProductQty, editedProductQty, productPrice);
        changesAmount = editOrderPage.calculateChangesAmount(originProductQty, editedProductQty, productPrice);

        const actSubtotal = await editOrderPage.getOrderInfoInPaymentBlock("Subtotal");
        const actualTotal = await editOrderPage.getOrderInfoInPaymentBlock("Total");
        const actualShipping = await editOrderPage.getOrderInfoInPaymentBlock("Shipping");
        const actualPaidByCustomer1 = await editOrderPage.getOrderInfoInPaymentBlock("Paid by customer");

        const expSubtotal = subtotal + changesAmount;
        const expTotal = total + changesAmount;

        expect(actSubtotal).toEqual(expSubtotal.toFixed(2));
        expect(actualTotal).toEqual(expTotal.toFixed(2));
        expect(actualShipping).toEqual(shipping.toFixed(2));
        expect(actualPaidByCustomer1).toEqual(total.toFixed(2));

        // kiểm tra thông tin ở block summary
        const actUpdatedTotal = await editOrderPage.getChangesAmountInSummaryBlock("Updated total");
        const actPaidByCustomer2 = await editOrderPage.getChangesAmountInSummaryBlock("Paid by customer");
        const actAmountToCollect = await editOrderPage.getChangesAmountInSummaryBlock("Amount to collect");

        expect(actUpdatedTotal).toEqual(expTotal.toFixed(2));
        expect(actPaidByCustomer2).toEqual(total.toFixed(2));
        expect(actAmountToCollect).toEqual(amountToCollect.toFixed(2));
      });

      await test.step("Check Send invoice to customer", async () => {
        await editOrderPage.sendInvoice();
      });

      await test.step("Check payment status của order khi edit order thành công", async () => {
        const actPaymentStatus = await orderPage.getPaymentStatus();
        expect(actPaymentStatus).toEqual(paymentStatus);
      });

      await test.step("Check data order trong order detail", async () => {
        const actualPaidByCustomer = removeCurrencySymbol(await orderPage.getPaidByCustomer());
        const actualAmountToCollect = await orderPage.getAmountToCollect();
        const isSendInvoiceVisible = await orderPage.isBtnVisible("Send invoice");
        const isShareLinkVisible = await orderPage.isBtnVisible("Share checkout link");

        expect(actualPaidByCustomer).toEqual(total.toFixed(2));
        expect(actualAmountToCollect).toEqual(amountToCollect.toFixed(2));
        expect(isSendInvoiceVisible).toBeTruthy();
        expect(isShareLinkVisible).toBeTruthy();
      });

      await test.step("Check timeline của order detail", async () => {
        await orderPage.expandTimeline();
        const timelineList = await orderPage.getOrderTimelineList();
        expect(timelineList).toContain(afterEditOrder.timeline.staff_name_edit.replace("{staff_name}", staffName));
        expect(timelineList).toContain(afterEditOrder.timeline.product_added);
      });

      await test.step("Vào link checkout >> Charge đủ amount to pay còn thiếu", async () => {
        await mailbox.openMailUpdatePayment(email);
        checkoutPage = await mailbox.clickBtnPayNow();
        await checkoutPage.inputCardInfoAndPlaceOrder(card);

        const orderInfo = await checkoutAPI.getOrderInfo(authRequest);
        expect(orderInfo.financial_status).toEqual(conf.caseConf.after_edit.payment_status);
      });
    },
  );

  test(
    `Verify tính toán lại order total khi edit order bằng cách` +
      `adjust quantity ( order total giảm), apply discount product @TC_SB_ORD_EO_93`,
    async () => {
      await test.step(
        "Vào trang edit order > Click Btn Adjust quantity" +
          "của product = Yonex, giảm quantity của product > Click Btn Confirm",
        async () => {
          await editOrderPage.editOrderByAdjustingQty(editedProductName, editedProductQty);

          const actProductPriceAndQty = await editOrderPage.getProductPriceAndQty(editedProductName);
          const actOriginQty = await editOrderPage.getOriginalProductQuantity(editedProductName);
          const expProductPriceAndQty = currencySymbol + productPrice.toFixed(2) + " × " + editedProductQty;
          const expOriginQty = `Origin quantity: ${originProductQty}`;

          expect(actOriginQty).toEqual(expOriginQty);
          expect(actProductPriceAndQty).toEqual(expProductPriceAndQty);
        },
      );

      await test.step("Check order total mới và amount to collect cần thu thêm của merchant", async () => {
        // kiểm tra thông tin ở block payment
        amountToCollect = editOrderPage.calculateAmountToCollect(originProductQty, editedProductQty, productPrice);
        changesAmount = editOrderPage.calculateChangesAmount(originProductQty, editedProductQty, productPrice);

        const actSubtotal = await editOrderPage.getOrderInfoInPaymentBlock("Subtotal");
        const actualTotal = await editOrderPage.getOrderInfoInPaymentBlock("Total");
        const actualShipping = await editOrderPage.getOrderInfoInPaymentBlock("Shipping");
        const actualPaidByCustomer1 = await editOrderPage.getOrderInfoInPaymentBlock("Paid by customer");

        const expSubtotal = subtotal + changesAmount + discount;
        // sau khi giảm quanity, order không thoả mãn điều kiện discount -> order không được discount
        const expTotal = total + changesAmount + discount;

        expect(actSubtotal).toEqual(expSubtotal.toFixed(2));
        expect(actualTotal).toEqual(expTotal.toFixed(2));
        expect(actualShipping).toEqual(shipping.toFixed(2));
        expect(actualPaidByCustomer1).toEqual(total.toFixed(2));

        // kiểm tra thông tin ở block summary
        const actUpdatedTotal = await editOrderPage.getChangesAmountInSummaryBlock("Updated total");
        const actPaidByCustomer2 = await editOrderPage.getChangesAmountInSummaryBlock("Paid by customer");
        const actAmountToCollect = await editOrderPage.getChangesAmountInSummaryBlock("Amount to collect");

        expect(actUpdatedTotal).toEqual(expTotal.toFixed(2));
        expect(actPaidByCustomer2).toEqual(total.toFixed(2));
        expect(actAmountToCollect).toEqual(amountToCollect.toFixed(2));
      });

      await test.step("Save edit order > Check payment status của order khi edit order thành công", async () => {
        await editOrderPage.clickOnBtnWithLabel("Update order");
      });

      await test.step("Check data order trong order detail", async () => {
        const actualPaidByCustomer = removeCurrencySymbol(await orderPage.getPaidByCustomer());
        const actPaymentStatus = await orderPage.getPaymentStatus();

        expect(actPaymentStatus).toEqual(paymentStatus);
        expect(actualPaidByCustomer).toEqual(total.toFixed(2));
      });

      await test.step("Check timeline của order detail", async () => {
        await orderPage.expandTimeline();
        const timelineList = await orderPage.getOrderTimelineList();
        expect(timelineList).toContain(afterEditOrder.timeline.staff_name_edit.replace("{staff_name}", staffName));
        expect(timelineList).toContain(afterEditOrder.timeline.product_added);
      });
    },
  );
  test(
    "Verify tạo một 1 link checkout sau khi edit order thành công với order total tăng lên " + "@TC_SB_ORD_EO_94",
    async ({ authRequest, page }) => {
      let checkoutLink: string;

      await test.step(
        "Vào trang edit order > Click Btn Adjust quantity" +
          "của product = Yonex, tăng quantity của product > Click Btn Confirm > Click btn Send invoice",
        async () => {
          await editOrderPage.editOrderByAdjustingQty(editedProductName, editedProductQty);
          await editOrderPage.sendInvoice();
          await expect(await orderPage.orderTitleHeaderLocator()).toBeVisible();
        },
      );

      await test.step("Check `checkout link for payment collection` trong  order timeline", async () => {
        await orderPage.expandTimeline();
        checkoutLink = await orderPage.getCheckoutLinkForPaymentCollection();
        expect(checkoutLink).toContain(`https://${domain}/checkouts/`);
      });

      await test.step("Check order detail khi edit order thành công", async () => {
        const isSendInvoiceVisible = await orderPage.isBtnVisible("Send invoice");
        const isShareLinkVisible = await orderPage.isBtnVisible("Share checkout link");

        expect(isSendInvoiceVisible).toBeTruthy();
        expect(isShareLinkVisible).toBeTruthy();
      });

      await test.step("Mở link checkout trên 1 tab mới", async () => {
        checkoutPage = await orderPage.goToCheckoutPageFromOrder(checkoutLink.split(`${domain}`)[1]);
        await checkoutPage.completeOrderWithCardInfo(card);
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await page.waitForTimeout(5000);

        const paymentStatus = (await checkoutAPI.getOrderInfo(authRequest)).financial_status;
        expect(paymentStatus).toEqual(afterEditOrder.payment_status);
      });
    },
  );

  test("Verify không remove đc khi order có 1 line item @TC_SB_ORD_EO_95", async () => {
    await test.step("Vào trang edit order, kiểm tra button Remove item", async () => {
      const isRemoveVisible = await orderPage.isBtnVisible("Remove item");
      expect(isRemoveVisible).toBeFalsy();
    });
  });

  test(
    "Verify tính toán lại order total khi edit order bằng cách" + "remove item ( order total giảm) @TC_SB_ORD_EO_96",
    async ({ conf, page }) => {
      let expTotal: number;
      const discountValue = conf.caseConf.discount.value;

      await test.step("Vào trang edit order > Click button Remove item của Yonex > Chọn button Confirmx", async () => {
        await editOrderPage.clickRemoveItemFromOrder(editedProductName);
        // await editOrderPage.waitUntilElementVisible(
        //   "(//div[normalize-space()='Are you sure to remove this items'])[2]");
        await editOrderPage.clickOnBtnWithLabel("Confirm");
        await expect(page.locator(`//div[normalize-space()='${editedProductName}']`)).toBeHidden();
      });

      await test.step("Check order total và Check amount to collect cần thu thêm của merchant", async () => {
        amountToCollect = editOrderPage.calculateAmountToCollect(originProductQty, editedProductQty, productPrice);
        changesAmount = editOrderPage.calculateChangesAmount(originProductQty, editedProductQty, productPrice);

        const actSubtotal = await editOrderPage.getOrderInfoInPaymentBlock("Subtotal");
        const actualTotal = await editOrderPage.getOrderInfoInPaymentBlock("Total");
        const actualShipping = await editOrderPage.getOrderInfoInPaymentBlock("Shipping");
        const actualPaidByCustomer = await editOrderPage.getOrderInfoInPaymentBlock("Paid by customer");
        // Do item bị remove nên discount thay đổi -> cần tính toán lại discount theo subtotal mới
        const newSubtotal = subtotal + discount - (originProductQty - editedProductQty) * productPrice;
        const newDiscountValue = (newSubtotal * discountValue) / 100;
        const actualAmountToCollect = await editOrderPage.getChangesAmountInSummaryBlock("Amount to collect");

        // Do subtotal, total là các field bị ảnh hưởng nên sẽ tính toán lại 2 field này
        const expSubtotal = subtotal + changesAmount + newDiscountValue;
        expTotal = total + changesAmount + newDiscountValue;

        expect(actSubtotal).toEqual(expSubtotal.toFixed(2));
        expect(actualTotal).toEqual(expTotal.toFixed(2));
        expect(actualShipping).toEqual(shipping.toFixed(2));
        expect(actualPaidByCustomer).toEqual(total.toFixed(2));
        expect(actualAmountToCollect).toEqual(amountToCollect.toFixed(2));
        await editOrderPage.updateOrder();
      });

      await test.step("Check thông tin order trong order detail ", async () => {
        //1. Không hiển thị item đã bị remove
        await expect(page.locator(`//div[normalize-space()='${editedProductName}']`)).toBeHidden();
        //2. Paid by customer = total order ban đầu
        const actualPaidByCustomer = removeCurrencySymbol(await orderPage.getPaidByCustomer());
        expect(actualPaidByCustomer).toEqual(total.toFixed(2));
        //3. Total order mới
        const actTotal = await orderPage.getTotalOrder();
        expect(removeCurrencySymbol(actTotal)).toEqual(expTotal.toFixed(2));
      });

      await test.step("Check timeline order", async () => {
        await orderPage.expandTimeline();
        await orderPage.waitUntilElementVisible("//div[@class='content']//div[normalize-space()='Removed']");
        const timelineList = await orderPage.getOrderTimelineList();
        expect(timelineList).toContain(afterEditOrder.timeline.staff_name_edit.replace("{staff_name}", staffName));
        expect(timelineList).toContain(afterEditOrder.timeline.product_change);
      });
    },
  );

  test("Verify change product ( order total tăng), apply discount product @TC_SB_ORD_EO_101", async ({
    conf,
    authRequest,
  }) => {
    test.setTimeout(140000);
    const variantTitle = conf.caseConf.after_edit.product.variant_title;
    const originProductName = originProductInfo[0].name;

    await test.step(
      `- Verify change product ( order total tăng), apply discount product` +
        `Search và select product Shirt để change thay cho product Yonex > Chọn btn Confirm`,
      async () => {
        await editOrderPage.editOrderByChangeVariant(originProductName, editedProductName, variantTitle);
      },
    );

    await test.step("Check order total và Check amount to collect cần thu thêm của merchant", async () => {
      // Do product Yonex bị thay thế -> Shirt cần tính toán lại amount to collect và changes amount
      // Do bị thay thế thành item khác không đủ điều kiện discount -> collect thêm cả discount
      const editedProductPrice = await productPage.loadProductInfoFromDashboard(authRequest, afterEditOrder.product.id);
      amountToCollect = editedProductQty * editedProductPrice - originProductQty * productPrice + discount;
      if (amountToCollect < 0) {
        amountToCollect = 0;
      }
      changesAmount = editedProductQty * editedProductPrice - originProductQty * productPrice;

      const actSubtotal = await editOrderPage.getOrderInfoInPaymentBlock("Subtotal");
      const actualTotal = await editOrderPage.getOrderInfoInPaymentBlock("Total");
      const actualPaidByCustomer = await editOrderPage.getOrderInfoInPaymentBlock("Paid by customer");
      const actualAmountToCollect = await editOrderPage.getChangesAmountInSummaryBlock("Amount to collect");

      // Do bị thay thế thành item khác không đủ điều kiện discount -> order không được apply discount buy x get y
      // Do subtotal, total là các field bị ảnh hưởng nên sẽ tính toán lại 2 field này
      const expSubtotal = subtotal + changesAmount + discount;
      const expTotal = total + changesAmount + discount;

      expect(actSubtotal).toEqual(expSubtotal.toFixed(2));
      expect(actualTotal).toEqual(expTotal.toFixed(2));
      expect(actualPaidByCustomer).toEqual(total.toFixed(2));
      expect(actualAmountToCollect).toEqual(amountToCollect.toFixed(2));
    });

    await test.step("Check Send invoice to customer", async () => {
      await editOrderPage.sendInvoice();
      const actPaymentStatus = await orderPage.getPaymentStatus();
      expect(actPaymentStatus).toEqual(paymentStatus);
    });

    await test.step("Check data trong order detail", async () => {
      const actualPaidByCustomer = removeCurrencySymbol(await orderPage.getPaidByCustomer());
      const isSendInvoiceVisible = await orderPage.isBtnVisible("Send invoice");
      const isShareLinkVisible = await orderPage.isBtnVisible("Share checkout link");

      expect(actualPaidByCustomer).toEqual(total.toFixed(2));
      expect(isSendInvoiceVisible).toBeTruthy();
      expect(isShareLinkVisible).toBeTruthy();
    });

    await test.step("Check timeline của order detail", async () => {
      await orderPage.expandTimeline();
      const timelineList = await orderPage.getOrderTimelineList();
      expect(timelineList).toContain(afterEditOrder.timeline.staff_name_edit.replace("{staff_name}", staffName));
      expect(timelineList).toContain(afterEditOrder.timeline.product_added);
    });

    await test.step("Vào link checkout >> Charge đủ amount to pay còn thiếu", async () => {
      const expPaymentStatus = conf.caseConf.after_edit.payment_status;
      await mailbox.openMailUpdatePayment(email);
      checkoutPage = await mailbox.clickBtnPayNow();
      await checkoutPage.inputCardInfoAndPlaceOrder(card);

      await checkoutPage.waitAbit(5000); // order không capure ngay nên cần wait
      const orderInfo = await checkoutAPI.getOrderInfo(authRequest);
      expect(orderInfo.financial_status).toEqual(expPaymentStatus);
    });
  });
});
