import { expect, test } from "@core/fixtures";
import { formatDate } from "@core/utils/datetime";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";

test.describe("Verify Purchase history", async () => {
  let productAPI: ProductAPI;
  let checkoutPage: CheckoutForm;
  let orderID: string;
  test.beforeEach(async ({ page, conf, authRequest, dashboard }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);
    // create product
    const productListData = conf.caseConf.products;
    for (let i = 0; i < productListData.length; i++) {
      await productAPI.createProduct(productListData[i]);
    }
    // Update product
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    await productPage.page.waitForTimeout(3 * 1000);
    for (let i = 0; i < conf.caseConf.update_products.length; i++) {
      const updateProduct = conf.caseConf.update_products[i];
      await productPage.navigateToMenu("Products");
      await productPage.searchProduct(updateProduct.title);
      await productPage.clickTitleProduct(updateProduct.title);
      await productPage.updateProductDigital(updateProduct);
    }
    //checkout product
    await checkoutPage.goto(`products/${productListData[0].product.handle}`);
    await checkoutPage.enterEmail(conf.suiteConf.email);
    await checkoutPage.completeOrderWithMethod("Stripe");
    await expect(checkoutPage.genLoc(checkoutPage.xpathThankYouPageHeader)).toBeVisible();
    orderID = await checkoutPage.getOrderName();

    // login my account
    const myProductPage = new MyProductPage(page, conf.suiteConf.domain);
    await myProductPage.login(conf.suiteConf.username, conf.suiteConf.password);
  });

  test.afterEach(async ({ conf }) => {
    //Get product id
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    // Delete product
    await productAPI.deleteProduct(IdsArray);
  });

  test("Verify data trong màn Purchase history , Purchase history detail và Invoice detail @SB_DP_SF_SP_8", async ({
    page,
    conf,
    context,
  }) => {
    const myAccount = new MyAccountPage(page, conf.suiteConf.domain);
    const timeCheckout = formatDate(new Date(), "MMM DD, YYYY");
    const total = "$" + conf.caseConf.update_products[0].pricing_amount + ".00";
    await test.step("Click avatar > chọn Purchase history -> Verify thông tin của order list", async () => {
      await myAccount.genLoc(myAccount.xpathAvatar).click();
      await myAccount.openMenuItemPage(conf.caseConf.menu_item);
      const getOrderOnPurchaseHistory = await myAccount.getOrderOnPurchaseHistory();
      expect(getOrderOnPurchaseHistory).toEqual(
        expect.objectContaining({
          orderID: orderID,
          productName: conf.caseConf.products[0].product.title,
          orderDate: timeCheckout,
          paymentStatus: "paid",
          total: total,
        }),
      );
    });

    await test.step("click vào orderid -> verify thông tin hiển thị", async () => {
      await myAccount.genLoc(myAccount.xpathFirstOrderID).click();
      const orderDetail = await myAccount.getOrderDetailOnPurchaseHistory();
      expect(orderDetail).toEqual(
        expect.objectContaining({
          orderID: "Order " + orderID,
          productName: conf.caseConf.products[0].product.title,
          orderDate: timeCheckout,
          total: total,
        }),
      );
      await myAccount.genLoc(myAccount.xpathBtnBack).click();
    });

    await test.step("Click button Invoice -> Verify thông tin hiển thị của order", async () => {
      await myAccount.clickOnBtnWithLabel("Invoice");
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        await myAccount.clickOnBtnWithLabel("Invoice"),
      ]);
      const newMyAccount = new MyAccountPage(newTab, conf.suiteConf.domain);
      const invoice = await newMyAccount.getInvoiceOrder();
      expect(invoice).toEqual(
        expect.objectContaining({
          email: conf.suiteConf.email,
          product: conf.caseConf.products[0].product.title,
          total: total,
        }),
      );
    });
  });
});
