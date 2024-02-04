import { expect } from "@core/fixtures";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { MailBox } from "@pages/thirdparty/mailbox";
import { generateRandomMailToThisEmail } from "@core/utils/mail";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { test } from "@fixtures/website_builder";
import { Page } from "@playwright/test";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { snapshotDir } from "@core/utils/theme";
import { XpathNavigationButtons } from "@constants/web_builder";

test.describe("Checkout creator shop", () => {
  let checkoutPage: CheckoutForm, productDetailAPI: ProductAPI;
  let dashboardPage: DigitalProductPage, mailBox: MailBox;

  let orderPage: OrderPage;
  let productInfo, productHandle, productId, productFreeId, productFreeHandle;
  let email;
  let productPage: Page;
  let webBuilder: WebBuilder;
  let xpathBlock, frameLocator;
  let newTab;

  test.afterAll(async ({ conf, authRequest }) => {
    productDetailAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    await test.step("Delete products after test", async () => {
      const productIds = [productId, productFreeId];
      await productDetailAPI.deleteProduct(productIds);
    });
  });

  test.beforeEach(async ({ conf, page, dashboard, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;
    email = generateRandomMailToThisEmail();
    productInfo = conf.suiteConf.product_info.product;
    const pricingType = productInfo.product_pricing_type;
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);
    dashboardPage = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    productDetailAPI = new ProductAPI(conf.suiteConf.domain, authRequest);

    //create product paid
    const dataProduct = await productDetailAPI.createProduct(conf.suiteConf.product_info);
    productId = dataProduct.data.product.id;
    productHandle = dataProduct.data.product.handle;

    //create product free
    const productFree = await productDetailAPI.createProduct(conf.suiteConf.product_free_info);
    productFreeId = productFree.data.product.id;
    productFreeHandle = productFree.data.product.handle;

    //setting for product free
    await dashboardPage.goto(`/admin/creator/products/${productFreeId}`);
    await dashboardPage.publishedProduct();

    //setting  for product paid
    await dashboardPage.goto(`/admin/creator/products/${productId}`);
    if (pricingType === "One-time payment") {
      await dashboardPage.publishedProduct();
      await dashboardPage.settingPricingTab("Paid", productInfo.pricing_title, productInfo.amount);
    }
  });

  test(`Kiểm tra validation field Email address tại form Checkout @SB_SC_SCSF_SCSFC_01`, async ({ conf }) => {
    await test.step(`View sales page của "Product Online course Free" có giá Free > Input thông tin checkout > Click button "Pay now"`, async () => {
      await checkoutPage.goto(`products/${productFreeHandle}`);
      await checkoutPage.clickBtnCompleteOrder();
      await expect(
        checkoutPage.genLoc("//div[@msg-invalid = 'required' and normalize-space() = 'Please enter an email.']"),
      ).toBeVisible();
    });

    await test.step(`View sales page của "Product Online course" có giá > 0 > Input thông tin checkout > Click button "Pay now"`, async () => {
      await checkoutPage.goto(`products/${productHandle}`);
      await checkoutPage.clickBtnCompleteOrder();
      await expect(
        checkoutPage.genLoc("//div[@msg-invalid = 'required' and normalize-space() = 'Please enter an email.']"),
      ).toBeVisible();
    });

    await test.step(`- Nhập các thông tin trong form checkout:
    + Email address
    + Choose order option
    + Chọn Payment method
    + Nhập card checkout
    - Click "Pay now"`, async () => {
      await checkoutPage.enterEmail(conf.caseConf.email);
      await checkoutPage.clickBtnCompleteOrder();
      await expect(
        checkoutPage.genLoc("//div[@msg-invalid = 'required' and normalize-space() = 'Please enter an email.']"),
      ).toBeHidden();

      await checkoutPage.clickBtnCompleteOrder();
      await checkoutPage.enterCardNumber(conf.caseConf.card_number);
      await checkoutPage.clickBtnCompleteOrder();
      expect(await checkoutPage.getMsgFromRootXpath("card expiry")).toEqual(
        "Your card's expiration date is incomplete.",
      );
      await checkoutPage.enterExpireDate(conf.caseConf.card_expire_date);
      await checkoutPage.clickBtnCompleteOrder();
      expect(await checkoutPage.getMsgFromRootXpath("card cvc")).toEqual("Your card's security code is incomplete.");
    });
  });

  test(`Kiểm tra validation các trường Card checkout @SB_SC_SCSF_SCSFC_02`, async ({ conf }) => {
    const cardValidate = conf.caseConf.card_validate;

    await test.step(`Kiểm tra validation field Card number.
    - Nhập các thông tin trong form checkout:
    - Email: shopbase@beeketing.net
    - Payment method: "Credit card"
    - Card checkout:
     + Card number: nhập data input check validate
     + Card date: 12/34
     + Card CVV: 113
    - Click "Pay now"`, async () => {
      await checkoutPage.goto(`products/${productHandle}`);
      await checkoutPage.enterEmail(conf.caseConf.email);
      for (const cardItem of cardValidate) {
        await checkoutPage.enterCardNumber(cardItem.card_number);
        await checkoutPage.clickBtnCompleteOrder();
        await expect(checkoutPage.iframeCard.locator(`//p[normalize-space() = '${cardItem.err_msg}']`)).toBeVisible();
      }
    });

    await test.step(`Kiểm tra validation field Card date.
    - Nhập các thông tin trong form checkout:
    - Email: shopbase@beeketing.net
    - Payment method: "Creadit card"
    - Card checkout:
     + Card number: 4111 1111 1111 1111
     + Card date: nhập data input check validate
     + Card CVV: 113
    - Click "Pay now"`, async () => {
      const expireDateValidate = conf.caseConf.expire_date;
      await checkoutPage.enterCardNumber(conf.caseConf.card_number);
      for (const dateItem of expireDateValidate) {
        await checkoutPage.enterExpireDate(dateItem.date);
        await checkoutPage.clickBtnCompleteOrder();
        await expect(
          checkoutPage.iframeCard.locator(`//p[normalize-space() = "${dateItem.err_msg}"]`).first(),
        ).toBeVisible();
      }
    });

    await test.step(`Kiểm tra validation field Card CVV.
    - Nhập các thông tin trong form checkout:
    - Email: shopbase@beeketing.net
    - Payment method: "Creadit card"
    - Card checkout:
     + Card number: 4111 1111 1111 1111
     + Card date: 02/25
     + Card CVV: để trống
    - Click "Pay now"`, async () => {
      const cvvInfo = conf.caseConf.card_cvv;
      await checkoutPage.enterCardNumber(conf.caseConf.card_number);
      await checkoutPage.enterExpireDate(cvvInfo.date);
      await checkoutPage.enterCVV(cvvInfo.cvv);
      await checkoutPage.clickBtnCompleteOrder();
      await expect(
        checkoutPage.iframeCard.locator(`//p[normalize-space() = "${cvvInfo.err_msg}"]`).first(),
      ).toBeVisible();
    });
  });

  test(`Kiểm tra validation Terms & Conditions @SB_SC_SCSF_SCSFC_03`, async ({ conf }) => {
    await test.step(`Nhập các thông tin trong form checkout:
      - Email: shopbase@beeketing.net
      - Payment method: "Creadit card"
      - Card checkout:
       + Card number: 4111 1111 1111 1111
       + Card date: 02/25
       + Card CVV: 113
      - Bỏ tích "I accept the Term of Service"
      - Click "Pay now"`, async () => {
      await checkoutPage.goto(`products/${productHandle}`);
      await checkoutPage.enterEmail(conf.caseConf.email);
      await checkoutPage.enterCardNumber(conf.caseConf.card_number);
      await checkoutPage.enterExpireDate(conf.caseConf.card_expire_date);
      await checkoutPage.enterCVV(conf.caseConf.card_cvv);
      const checkboxStatus = await checkoutPage.genLoc(checkoutPage.xpathAcceptTerms).isChecked();
      if (checkboxStatus) {
        await checkoutPage.clickCheckboxAcceptTerm();
      }
      await expect(await checkoutPage.genLoc(checkoutPage.xpathBtnPayNow)).toBeDisabled();
    });

    await test.step(`Nhập các thông tin trong form checkout:
      - Email: shopbase@beeketing.net
      - Payment method: "Creadit card"
      - Card checkout:
       + Card number: 4111 1111 1111 1111
       + Card date: 02/25
       + Card CVV: 113
      - Tích "I accept the Term of Service"
      - Click "Pay now"`, async () => {
      const checkboxStatus = await checkoutPage.genLoc(checkoutPage.xpathAcceptTerms).isChecked();
      if (checkboxStatus === false) {
        await checkoutPage.clickCheckboxAcceptTerm();
      }
      await expect(await checkoutPage.genLoc(checkoutPage.xpathBtnPayNow)).toBeEnabled();
    });
  });

  test(`Kiểm tra order detail khi checkout thành công với SMP @SB_SC_SCSF_SCSFC_04`, async ({ conf }) => {
    await test.step(`Verify checkout thành công.
      - Nhập các thông tin trong form checkout:
      - Email: shopbase@beeketing.net
      - Payment method: "Creadit card"
      - Card checkout:
      + Card number: 4111 1111 1111 1111
       + Card date: 02/25
       + Card CVV:  113
       + Tích chọn "I accept the Terms of Services and Privacy Policy"
      -  Click "Pay now"`, async () => {
      await checkoutPage.goto(`products/${productHandle}`);
      await checkoutPage.enterEmail(email);
      await checkoutPage.enterCardNumber(conf.caseConf.card_number);
      await checkoutPage.enterExpireDate(conf.caseConf.card_expire_date);
      await checkoutPage.enterCVV(conf.caseConf.card_cvv);
      await checkoutPage.clickBtnCompleteOrder();
      await expect(await checkoutPage.genLoc(checkoutPage.xpathTextThankYou)).toBeVisible();
    });

    await test.step(`Tại Thankyou page
    - Lấy ra thông tin order name
    - Tại Dashboard > Order
    + Search order theo order name
    + Vào Order detail của order vừa tạo
    + Kiểm tra order order detail`, async () => {
      const orderName = await checkoutPage.genLoc(checkoutPage.xpathOrderName).textContent();
      await dashboardPage.navigateToMenu("Orders");
      await orderPage.searchOrderDashboard(orderName);
      await orderPage.openNewestOrder();
      expect(await dashboardPage.genLoc(".sb-timeline").innerText()).toContain(email);
      expect(await dashboardPage.genLoc(".sb-timeline").innerText()).toContain("The transaction ID");
      expect(await dashboardPage.genLoc(".sb-timeline").innerText()).toContain(
        `A $${productInfo.amount} USD payment was processed on the Visa ending in 1111 via ShopBase Payments`,
      );
    });

    await test.step(`Buyer kiểm tra mail, với email mua hàng chưa tồn tại trên store`, async () => {
      mailBox = await checkoutPage.openMailBox(email);
      const urlPage = await mailBox.openMailConfirmOrderCreator();
      expect(urlPage).toContain(`https://${conf.suiteConf.domain}/my-products/courses/${productId}`);
    });
  });

  test(`Checkout với paypal standard với product có price > 0 @SB_SC_SCSF_SCSFC_06`, async ({ conf }) => {
    await test.step(`- Nhập các thông tin trong form checkout:
     +  Nhập email
     +  Chọn  Payment  method
     +  Click  button  Paypal
     +  Login  Paypal  account`, async () => {
      await checkoutPage.goto(`products/${productHandle}`);
      await checkoutPage.enterEmail(email);
      await checkoutPage.completeOrderViaPayPal();
      const paymentMethod = await checkoutPage.genLoc(checkoutPage.xpathPaymentMethodCreator).innerText();
      await expect(paymentMethod).toContain("PayPal");
      await expect(await checkoutPage.genLoc(checkoutPage.xpathTextThankYou)).toBeVisible();
    });

    await test.step(`Tại Thankyou page -> Lấy ra thông tin order name
    - Tại Dashboard > Order
    ->  Search  order  theo  order  name
    ->  Vào  Order  detail  của  order  vừa  tạo
    -> Kiểm  tra  order  order  detail  `, async () => {
      const orderName = await checkoutPage.genLoc(checkoutPage.xpathOrderName).textContent();
      await dashboardPage.navigateToMenu("Orders");
      await orderPage.searchOrderDashboard(orderName);
      await orderPage.openNewestOrder();
      const statusOrder = await orderPage.genLoc(orderPage.xpathStatusOrder).innerText();
      expect(statusOrder).toEqual("Paid");
      expect(await dashboardPage.genLoc(orderPage.xpathTimelineMsgConfirm).innerText()).toContain(email);
      expect(await dashboardPage.genLoc(".sb-timeline").innerText()).toContain("The Paypal transaction ID is");
      expect(await dashboardPage.genLoc(".sb-timeline").innerText()).toContain(
        `A $${productInfo.amount} USD payment was processed via Paypal-Express`,
      );
    });

    await test.step(`Buyer kiểm tra mail, với email mua hàng chưa tồn tại trên store`, async () => {
      mailBox = await checkoutPage.openMailBox(email);
      const urlPage = await mailBox.openMailConfirmOrderCreator();
      expect(urlPage).toContain(`https://${conf.suiteConf.domain}/my-products/courses/${productId}`);
    });
  });

  test(`Checkout thành công có discount @SB_SC_SCSF_SCSFC_20`, async ({ conf }) => {
    await test.step(`Verify UI checkout form trước khi apply discount`, async () => {
      await checkoutPage.goto(`products/${productHandle}`);
      await expect(await checkoutPage.genLoc(checkoutPage.xpathApplyDiscountCode)).toBeDisabled();
    });

    await test.step(`- Nhập các thông tin trong form checkout:
      - Email: shopbase@beeketing.net
      - Payment method: "Credit card"
      - Card checkout:
      + Card number: 4111 1111 1111 1111
      + Card date: 02/25
      + Card CVV: 113
      - Nhập DISCOUNT FIX AMOUNT: -3.33$
      - Click "Pay now"`, async () => {
      await checkoutPage.enterEmail(email);
      await checkoutPage.enterCardNumber(conf.caseConf.card_number);
      await checkoutPage.enterExpireDate(conf.caseConf.card_expire_date);
      await checkoutPage.enterCVV(conf.caseConf.card_cvv);
      await checkoutPage.applyDiscountCode(conf.caseConf.discounts[0].code);

      //verify so tien giam gia tren checkout form bang voi so tien giam gia trong discount code
      await expect(await checkoutPage.genLoc(checkoutPage.xpathDiscountAmount).innerText()).toEqual(
        conf.caseConf.discounts[0].discount,
      );
      const discountAmount = conf.caseConf.discounts[0].discount.split(`$`)[1];

      //tinh tong so tien phai thanh toan, lam tron 2 chu so thap phan sau dau phay. Ex: 33.33 - 3.33 = 30.00
      const total = (Number(productInfo.amount) - Number(discountAmount)).toFixed(2);

      //verify tong so tien phai tra tren checkout form bang voi tong so tien phai tra sau khi giam gia
      await expect(await checkoutPage.genLoc(checkoutPage.xpathTotalPrice).innerText()).toEqual(`$${total}`);
    });

    await test.step(`- Nhập các thông tin trong form checkout:
       - Email: shopbase@beeketing.net
      - Payment method: "Creadit card"
      - Card checkout:
      + Card number: 4111 1111 1111 1111
      + Card date: 02/25
      + Card CVV: 113
      - Nhập DISCOUNT FIX PERCENTAGE = DISCOUNT 10%
      - Click "Pay now"`, async () => {
      await checkoutPage.goto(`products/${productHandle}`);
      await checkoutPage.enterEmail(email);
      await checkoutPage.enterCardNumber(conf.caseConf.card_number);
      await checkoutPage.enterExpireDate(conf.caseConf.card_expire_date);
      await checkoutPage.enterCVV(conf.caseConf.card_cvv);
      await checkoutPage.applyDiscountCode(conf.caseConf.discounts[1].code);

      // Tinh so tien discount theo %, kết quả làm tròn đến 2 chữ số thập phân sau dấu phẩy. Ex: 33.33 * 10% = 3.33
      const discountAmount = (
        (Number(productInfo.amount) * Number(conf.caseConf.discounts[1].discount.split(`%`)[0])) /
        100
      ).toFixed(2);

      //get discount amount on checkout form, bỏ đi $ ở đầu. Ex: 3.33 -> 3.33 and expect equal discount amount
      const discountAmountOnCheckoutForm = await checkoutPage.genLoc(checkoutPage.xpathDiscountAmount).innerText();
      await expect(discountAmountOnCheckoutForm).toEqual(`-$${discountAmount}`);

      // Tinh tong so tien sau khi discount, làm tròn đến 2 chữ số thập phân sau dấu phẩy. Ex: 33.33 - 3.33 = 30.00
      const total = (Number(productInfo.amount) - Number(discountAmount)).toFixed(2);

      const totalPriceOnCheckoutForm = await checkoutPage.genLoc(checkoutPage.xpathTotalPrice).innerText();
      await expect(totalPriceOnCheckoutForm).toEqual(`$${total}`);
      await checkoutPage.clickBtnCompleteOrder();

      //verify on thankyou page
      await expect(await checkoutPage.genLoc(checkoutPage.xpathTextThankYou)).toBeVisible();

      //get subtotal price on thank you page. Ex: $33.33 and expect equal product price
      const subtotalThankyouPage = await checkoutPage.genLoc(checkoutPage.xpathSubtotalThankYouPage).innerText();
      await expect(subtotalThankyouPage).toEqual(`$${productInfo.amount}`);

      //get discount amount on thank you page. Ex: -$3.33 and expect equal discount amount
      const discountThankyouPage = await checkoutPage.genLoc(checkoutPage.xpathDiscountThankYouPage).innerText();
      expect(discountThankyouPage).toEqual(`- $${discountAmount}`);

      //get total price on thank you page. Ex: $30.00 and expect equal total price after discount
      const totalThankyouPage = await checkoutPage.genLoc(checkoutPage.xpathTotalPriceThankYouPage).innerText();
      expect(totalThankyouPage).toEqual(`$${total}`);

      // verify in mail confirm order
      mailBox = await checkoutPage.openMailBox(email);
      await mailBox.openNewestOrderConfirmationMail();
      const subtotal = await mailBox.getAmountOnOrderConfrimationMail("Subtotal");
      expect(subtotal).toEqual(`$${productInfo.amount}`);
      const discountTitle = `Discount (${conf.caseConf.discounts[1].code})`;
      const discount = await mailBox.getAmountOnOrderConfrimationMail(discountTitle);
      expect(discount).toEqual(`$${discountAmount}`);
      const totalPrice = await mailBox.getAmountOnOrderConfrimationMail("Total");
      expect(totalPrice).toEqual(`$${total}`);
    });
  });

  test(` Checkout với Product có price = 0 khi không nhập payment method @SB_SC_SCSF_SCSFC_13`, async ({}) => {
    await test.step(`- Nhập các thông tin trong form checkout:
    - Email: shopbase@beeketing.net
    - Click "Pay now""`, async () => {
      await checkoutPage.goto(`products/${productFreeHandle}`);
      await checkoutPage.enterEmail(email);
      await checkoutPage.clickBtnCompleteOrder();
      await expect(await checkoutPage.genLoc(checkoutPage.xpathTextThankYou)).toBeVisible();
    });
    test.slow();

    await test.step(`Tại Thankyou page
    - Lấy ra thông tin order name
    - Tại Dashboard > Order
    + Search order theo order name
    + Vào Order detail của order vừa tạo
    + Kiểm tra order order detail`, async () => {
      const orderName = await checkoutPage.genLoc(checkoutPage.xpathOrderName).textContent();
      await dashboardPage.navigateToMenu("Orders");
      await orderPage.searchOrderDashboard(orderName);
      await orderPage.openNewestOrder();
      const orderStatus = await orderPage.genLoc(orderPage.xpathStatusOrder).innerText();
      expect(await dashboardPage.genLoc(".sb-timeline__wrapper").innerText()).toContain(
        `${email} placed this order on Online Store`,
      );
      expect(orderStatus).toEqual("Paid");
    });

    await test.step(`Buyer kiểm tra mail, với email mua hàng chưa tồn tại trên store`, async () => {
      mailBox = await checkoutPage.openMailBox(email);
      productPage = await mailBox.openMailConfirmOrder();
      const titlePage = await productPage.locator(checkoutPage.xpathTitle).innerText();
      expect(titlePage).toEqual("Create account");
    });
  });

  test(`[Website builder - Block - Checkout form] Verify Customize Styles layer Checkout form @SB_SC_SCSF_SCSFC_14`, async ({
    dashboard,
    conf,
    builder,
    snapshotFixture,
  }) => {
    test.slow();
    await test.step(`Precodition: Apply template cho product`, async () => {
      await builder.applyTemplate({
        templateId: productInfo.apply_template.template_id,
        productId: productId,
        type: productInfo.apply_template.type,
      });
    });

    await test.step(`1. Click setting "Layer" > Chọn setting "Checkout form"
    2. Setting Width
    3. Save
    4. Verify thay đổi tương ứng với setting tại preview tại web builder
    5. Verify thay đổi tương ứng với setting tại web front`, async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/creator/products/${productId}`);
      await dashboardPage.selectActionDPro("Design Sales Page");
      await webBuilder.page.waitForLoadState("networkidle");
      await expect(await frameLocator.locator(xpathBlock.xpathCheckoutFormBlock)).toBeVisible();
      await frameLocator.locator(xpathBlock.overlay).waitFor({ state: "hidden" });
      await frameLocator.locator(xpathBlock.xpathCheckoutFormBlock).click();

      for (const data of conf.caseConf.data) {
        await test.step(`Customize Styles layer với data: `, async () => {
          await webBuilder.settingWidthHeight("width", data.width);
          await webBuilder.setBorder("border", data.border);
          await webBuilder.setBackground("background", data.background);
          await webBuilder.setMarginPadding("margin", data.margin);
          await webBuilder.setMarginPadding("padding", data.padding);
          await webBuilder.editSliderBar("box_shadow", data.shadow);
          await snapshotFixture.verifyWithIframe({
            page: dashboard,
            selector: xpathBlock.xpathCheckoutFormBlock,
            iframe: webBuilder.iframe,
            snapshotName: `preview-${data.snapshot_name}`,
          });
          await dashboard.locator(XpathNavigationButtons["save"]).click();
          await dashboard.waitForSelector("text='All changes are saved'");
        });

        await test.step(`Vào màn sale page của product `, async () => {
          await checkoutPage.goto(`products/${productHandle}`);
          await checkoutPage.page.waitForLoadState("networkidle");
          await checkoutPage.page.locator("//div[@class='skeleton__container']").waitFor({ state: "detached" });
          await checkoutPage.genLoc(checkoutPage.xpathBtnPayNow).isVisible();
          await snapshotFixture.verify({
            page: checkoutPage.page,
            selector: checkoutPage.xpathCheckoutForm,
            snapshotName: `sf-${data.snapshot_name}`,
          });
        });
      }
    });
  });

  test(`[Website builder - Block - Checkout form] Verify Content Settings layer Checkout form @SB_SC_SCSF_SCSFC_15`, async ({
    dashboard,
    conf,
    context,
  }) => {
    let checkboxStatus: boolean;
    let labelBtnPayWebfront: string;

    await test.step(`1. Click setting "Layer" > Chọn setting "Checkout form"
     2. Setting "Paynow label"
     3. Save
     4. Check hiển thị label btn pay now preview tại web builder`, async () => {
      await dashboardPage.selectActionDPro("Design Sales Page");
      await webBuilder.page.waitForLoadState("networkidle");
      await expect(await frameLocator.locator(xpathBlock.xpathCheckoutFormBlock)).toBeVisible();
      await frameLocator.locator(xpathBlock.overlay).waitFor({ state: "hidden" });
      await frameLocator.locator(xpathBlock.xpathCheckoutFormBlock).click();
      await webBuilder.switchToTab("Content");

      //verify label button Pay now preview in Web builder and web front
      for (const data of conf.caseConf.paynow_label) {
        await webBuilder.inputFieldInSidebarWithLabel("Paynow label", data);
        await webBuilder.page.waitForTimeout(1000); // đợi data thay đổi
        const labelBtnPayPreview = await frameLocator.locator(xpathBlock.xpathPaynowLabelPreview).innerText();
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");
        await checkoutPage.goto(`products/${productHandle}`);
        labelBtnPayWebfront = await checkoutPage.genLoc(checkoutPage.xpathPaynowLabelWebfront).innerText();

        if (data === "") {
          expect(labelBtnPayPreview).toEqual("Pay Now");
          expect(labelBtnPayWebfront).toEqual("Pay Now");
        } else {
          expect(labelBtnPayPreview).toEqual(data);
          expect(labelBtnPayWebfront).toEqual(data);
        }
      }
    });
    await test.step(`Check hyper link mặc định của Term of service và Priacy Policy`, async () => {
      const linkToTermOfServices = await webBuilder.getValueFieldInSidebarWithLabel("Link to Term of Services");
      expect(linkToTermOfServices).toEqual(conf.caseConf.link_to_terms_of_services);
      const linkToPrivacyPolicy = await webBuilder.getValueFieldInSidebarWithLabel("Link to Privacy Policy");
      expect(linkToPrivacyPolicy).toEqual(conf.caseConf.link_to_privacy_policy);
    });

    await test.step(`Setting tích chọn "Customers must agree to Term of Services" > Input "Link to Term of Services"`, async () => {
      checkboxStatus = await dashboard.locator(xpathBlock.xpathCheckboxTermsofServices).isChecked();
      if (checkboxStatus != true) {
        await dashboard.locator(xpathBlock.xpathCheckboxTermsofServices).click();
      }
      for (const linkToTermOfServices of conf.caseConf.new_link_to_term_of_services) {
        await webBuilder.inputFieldInSidebarWithLabel("Link to Term of Services", linkToTermOfServices.link);
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");

        //verify link to term of services in Web front
        await checkoutPage.goto(`products/${productHandle}`);

        if (linkToTermOfServices.case === "blank") {
          await expect(checkoutPage.genLoc(checkoutPage.xpathLinkToTermsofServices)).not.toBeVisible();
        } else {
          [newTab] = await Promise.all([
            context.waitForEvent("page"),
            checkoutPage.genLoc(checkoutPage.xpathLinkToTermsofServices).click(),
          ]);

          switch (linkToTermOfServices.case) {
            case "link":
              expect(await newTab.url()).toEqual(linkToTermOfServices.link);
              await newTab.close();
              break;
            case "param_page":
              expect(await newTab.url()).toEqual(`https://${conf.suiteConf.domain}${linkToTermOfServices.link}`);
              await newTab.close();
              break;
            case "param_product":
              expect(await newTab.url()).toEqual(
                `https://${conf.suiteConf.domain}/products/${linkToTermOfServices.link}`,
              );
              await newTab.close();
              break;
          }
        }
      }
    });

    await test.step(`Setting tích chọn "Customers must agree to Term of Services" > Input "Link to Privacy Policy"`, async () => {
      checkboxStatus = await dashboard.locator(xpathBlock.xpathCheckboxTermsofServices).isChecked();
      if (checkboxStatus != true) {
        await dashboard.locator(xpathBlock.xpathCheckboxTermsofServices).click();
      }
      for (const linkToPrivacyPolicy of conf.caseConf.new_link_to_term_of_services) {
        await webBuilder.inputFieldInSidebarWithLabel("Link to Privacy Policy", linkToPrivacyPolicy.link);
        await dashboard.locator(XpathNavigationButtons["save"]).click();
        await dashboard.waitForSelector("text='All changes are saved'");

        await checkoutPage.goto(`products/${productHandle}`);

        if (linkToPrivacyPolicy.case === "blank") {
          await expect(checkoutPage.genLoc(checkoutPage.xpathLinkToPrivacyPolicy)).not.toBeVisible();
        } else {
          [newTab] = await Promise.all([
            context.waitForEvent("page"),
            checkoutPage.genLoc(checkoutPage.xpathLinkToPrivacyPolicy).click(),
          ]);

          switch (linkToPrivacyPolicy.case) {
            case "link":
              expect(await newTab.url()).toEqual(linkToPrivacyPolicy.link);
              await newTab.close();
              break;
            case "param_page":
              expect(await newTab.url()).toEqual(`https://${conf.suiteConf.domain}${linkToPrivacyPolicy.link}`);
              await newTab.close();
              break;
            case "param_product":
              expect(await newTab.url()).toEqual(
                `https://${conf.suiteConf.domain}/products/${linkToPrivacyPolicy.link}`,
              );
              await newTab.close();
              break;
          }
        }
      }
    });

    await test.step(`Setting bỏ tích chọn "Customers must agree to Term of Services"`, async () => {
      checkboxStatus = await dashboard.locator(xpathBlock.xpathCheckboxTermsofServices).isChecked();
      if (checkboxStatus) {
        await dashboard.locator(xpathBlock.xpathCheckboxTermsofServices).click();
      }
      await dashboard.locator(XpathNavigationButtons["save"]).click();
      await dashboard.waitForSelector("text='All changes are saved'");
      if (checkboxStatus) {
        await checkoutPage.clickCheckboxAcceptTerm();
      }
      await checkoutPage.goto(`products/${productHandle}`);
      await expect(checkoutPage.genLoc(checkoutPage.xpathAcceptTerms)).not.toBeVisible();
    });
  });
});
