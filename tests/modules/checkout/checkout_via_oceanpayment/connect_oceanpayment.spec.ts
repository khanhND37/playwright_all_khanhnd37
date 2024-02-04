import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { OceanPaymentPage } from "@pages/dashboard/ocean_payment";
import { OrdersPage } from "@pages/dashboard/orders";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import type { OceanpaymentAccount, OrderAfterCheckoutInfo } from "@types";

let accountConnect: OceanpaymentAccount;
let product: Array<{ name: string; quantity: number }>;
let cardInfor: object;
let customerInfo: object;
let orderInfo: OrderAfterCheckoutInfo;
let oceanPaymentPage: OceanPaymentPage;
test.describe("Connect oceanpayment method thành công và checkout thành công", async () => {
  let checkout: SFCheckout;
  let paymentProviderPage: PaymentProviderPage;

  test.beforeEach(async ({ dashboard, conf, page }) => {
    oceanPaymentPage = new OceanPaymentPage(dashboard, conf.caseConf.domain);
    checkout = new SFCheckout(page, conf.caseConf.domain);
    paymentProviderPage = new PaymentProviderPage(dashboard, conf.caseConf.domain);
    accountConnect = conf.suiteConf.account_connect;
    product = conf.suiteConf.product;
    cardInfor = conf.suiteConf.oceanpayment_card_info;
    customerInfo = conf.suiteConf.customer_info;

    //Đi đến trang Payment provider
    await test.step("Đi đến trang payment providers", async () => {
      await oceanPaymentPage.navigateToMenu(`${conf.suiteConf.menu}`);
      await oceanPaymentPage.navigateToSectionInSettingPage(`${conf.suiteConf.session}`);
      await oceanPaymentPage.page.locator(oceanPaymentPage.xpathBlockAlternativeMethods).scrollIntoViewIfNeeded();
    });
  });

  test(`Connect Oceanpayment method thành công @SB_CHE_OCP_10`, async ({ conf }) => {
    const isBtnAddNewAccount = await oceanPaymentPage.page
      .locator(oceanPaymentPage.xpathBtnAddNewAccountOceanpayment)
      .isVisible();
    if (isBtnAddNewAccount) {
      await oceanPaymentPage.removeListAccountConnect();
    }
    await test.step(`Tại mục Alternative providers, click button Choose alternative provider`, async () => {
      await oceanPaymentPage.page.click(oceanPaymentPage.xpathBtnChooseAlternativeProvider);
      expect(oceanPaymentPage.page.url()).toContain("admin/settings/payments/alternative-providers");
    });

    await test.step(`Click chọn OceanPayment > kiểm tra mở trang nhập thông tin account`, async () => {
      await oceanPaymentPage.page.click(oceanPaymentPage.xpathProviderOceanpayment);
      await oceanPaymentPage.waitUtilSkeletonDisappear();
      expect(await oceanPaymentPage.verifyInfoConnectAccountPage()).toBe(true);
    });

    await test.step(`Nhập giá trị vào các trường > click button Add account`, async () => {
      await oceanPaymentPage.fillInforAccOceanPayment(accountConnect);
      await oceanPaymentPage.waitUntilElementVisible(oceanPaymentPage.xpathToastMessage);
      await expect(
        oceanPaymentPage.page.locator(oceanPaymentPage.getLocatorAccountName(accountConnect.account_name)),
      ).toBeVisible();
    });

    await test.step(`Mở store front và thực hiện checkout product`, async () => {
      await checkout.addProductToCartThenInputShippingAddress(product, customerInfo);
    });

    //Hoàn thành quá trình checkout
    await test.step(`Click button Complete order và thực hiện thanh toán
    - Nhập thông tin thẻ vào các trường
    - click button Payment`, async () => {
      await checkout.completeOrderWithMethod(conf.suiteConf.payment_method, cardInfor);
    });
  });

  test(`Verify action active / deactive / remove account Ocean payment @SB_CHE_OCP_12`, async ({ conf }) => {
    const isBtnAddNewAccount = await oceanPaymentPage.page
      .locator(oceanPaymentPage.xpathBtnAddNewAccountOceanpayment)
      .isVisible();
    if (isBtnAddNewAccount) {
      await oceanPaymentPage.removeListAccountConnect();
    }
    await oceanPaymentPage.connectAccountOceanpayment(accountConnect);

    await test.step(`Tại mục Alternative providers, click vùng Ocean Payment > Click button Deactivate > kiểm tra hiển thị message`, async () => {
      await oceanPaymentPage.page.click(oceanPaymentPage.xpathAccountConnect);
      await paymentProviderPage.clickOnDeactivateByAccount(accountConnect.account_name);
      expect(await oceanPaymentPage.page.innerText(oceanPaymentPage.xpathToastMessage)).toEqual(
        "Deactivated successfully",
      );
    });

    await test.step(`Mở store front, thêm product vào giỏ hàng >> đi đến trang checkout >> kiểm tra thông tin công thanh toán oceanpayment`, async () => {
      await checkout.addProductToCartThenInputShippingAddress(product, customerInfo);
      expect(await checkout.getMessageWhenActivateOrDeactivateOceanpaymentProvider()).toEqual(
        "There was a problem with our payments. Contact us to complete your order",
      );
    });

    await test.step(`Quay lại dashboard, mục Alternative providers, click button Activate`, async () => {
      await paymentProviderPage.clickOnReactivateByAccount(accountConnect.account_name);
      expect(await oceanPaymentPage.page.innerText(oceanPaymentPage.xpathToastMessage)).toEqual(
        "Activated successfully",
      );
    });

    //Thực hiện checkout sau khi activate thành công. Expect là hiển thị payment method là Oceanpayment
    await test.step(`Mở store front, thêm product vào giỏ hàng >> đi đến trang checkout >> kiểm tra thông tin công thanh toán oceanpayment`, async () => {
      await checkout.addToCartThenNavigateToCheckout(product);
      expect(await checkout.getMessageWhenActivateOrDeactivateOceanpaymentProvider()).toEqual(
        conf.caseConf.message_in_checkout_page,
      );
    });

    //Thực hiện remove account oceanpayment method
    await test.step(`Quay lại dashboard, mục Alternative providers, click button Remove`, async () => {
      await paymentProviderPage.clickOnRemoveAccount(accountConnect.account_name);
      expect(await oceanPaymentPage.page.innerText(oceanPaymentPage.xpathToastMessage)).toEqual("Delete successfully");
    });

    await test.step(`Mở store front, thêm product vào giỏ hàng >> đi đến trang checkout >> kiểm tra thông tin công thanh toán oceanpayment`, async () => {
      await checkout.addToCartThenNavigateToCheckout(product);
      await checkout.page.waitForTimeout(conf.caseConf.timeout);
      if (await checkout.page.locator(checkout.xpathBtnContinueToPaymentMethod).isVisible()) {
        await checkout.continueToPaymentMethod();
      }
      await checkout.page.reload();
      expect(await checkout.getMessageWhenActivateOrDeactivateOceanpaymentProvider()).toEqual(
        "There was a problem with our payments. Contact us to complete your order",
      );
    });
  });
});

test.describe("Checkout order one page/3 step checkout with post purchase", async () => {
  const data = loadData(__dirname, "DATA_DRIVEN_CHECKOUT_POST_PURCHASE");
  for (let i = 0; i < data.caseConf.data.length; i++) {
    const caseData = data.caseConf.data[i];
    test(`${caseData.desciption} - @${caseData.case_id}`, async ({ dashboard, conf, page }) => {
      let itemPostPurchaseValue = "0";
      accountConnect = conf.suiteConf.account_connect;
      product = conf.suiteConf.product;
      cardInfor = conf.suiteConf.oceanpayment_card_info;
      customerInfo = conf.suiteConf.customer_info;
      const productPostPurchase = conf.suiteConf.product_ppc_name;
      oceanPaymentPage = new OceanPaymentPage(dashboard, caseData.domain);
      const homepage = new SFHome(page, caseData.domain);
      const productPage = new SFProduct(page, caseData.domain);
      const orderPage = new OrdersPage(dashboard, caseData.domain);
      const checkout = new SFCheckout(page, caseData.domain);

      //Đi đến store front và thực hiện checkout
      await test.step(`Thực hiện checkout product:
      - Tại store front shop
      - nhập tên product vào mục Search
      - click vào product sau khi search ra kết quả
      - click button Add to cart
      - click button Checkout`, async () => {
        if (caseData.layout === "one page") {
          await homepage.searchThenViewProduct(product[0].name);
          await productPage.addProductToCart();
          await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(conf.suiteConf.customer_info);
        } else {
          await checkout.addProductToCartThenInputShippingAddress(product, customerInfo);
        }
      });

      await test.step(`Click button Place Your Order và thực hiện thanh toán
      - Nhập thông tin thẻ vào các trường
      - click button Payment Now`, async () => {
        await checkout.completeOrderWithMethod(conf.suiteConf.payment_method, cardInfor);
      });

      await test.step(`Click button Add product trên post purchase,
      nhập thẻ để hoàn thành quá trình checkout`, async () => {
        itemPostPurchaseValue = await checkout.addProductPostPurchase(productPostPurchase);
        if (itemPostPurchaseValue != null) {
          await checkout.completePaymentForPostPurchaseItem(conf.suiteConf.payment_method, cardInfor);
        }
        orderInfo = await checkout.getOrderInfoAfterCheckout();
      });

      await test.step(`Đăng nhập dashboard shop > đi đến màn order detail > kiểm tra hiển thị thông tin order mới checkout`, async () => {
        await oceanPaymentPage.navigateToMenu("Orders");
        await orderPage.goToOrderDetailSBase(orderInfo.orderName);
        await oceanPaymentPage.waitUntilElementInvisible(orderPage.xpathDetailLoading);
        const actualTotalOrder = Number((await orderPage.getTotalOrder()).replace("$", ""));
        expect(actualTotalOrder).toEqual(orderInfo.totalSF);
      });
    });
  }
});
