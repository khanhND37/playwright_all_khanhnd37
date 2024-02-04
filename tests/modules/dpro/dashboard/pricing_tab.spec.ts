import { expect, test } from "@core/fixtures";
import { convertToTimeStamp } from "@core/utils/datetime";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { DefaultGetProductAPIParam } from "@constants/shopbase_creator/product/param";
import { PaymentProviderAPI } from "@pages/api/dpro/payment_provider";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import type { PaymentInfo, ProductDetail } from "@types";

test.describe("Verify set up pricing on product detail", () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let checkoutPage: CheckoutForm;
  let paymentProviderAPI: PaymentProviderAPI;
  let productInfo: ProductDetail;
  let providerInfo: PaymentInfo;
  let providerId: string;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    productInfo = conf.suiteConf.product;
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    paymentProviderAPI = new PaymentProviderAPI(conf.suiteConf.domain, authRequest);
    providerInfo = conf.caseConf.payment;
    await productPage.goto(`/admin/creator/products`);
    await productPage.openAddProductScreen();
    await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
    await productPage.switchTab("Pricing");
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
    await paymentProviderAPI.deleteProvider(providerId);
  });

  test(`[Verify UI] Verify hiển thị các Block của Pricing tab @SB_SC_SCP_114`, async () => {
    await test.step(`Trên trang product list > Click product để view product detail >
     Mở tab "Pricing"`, async () => {
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Pricing type"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Quantity limit"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Access limit"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Time limit"))).toBeVisible();
    });
  });

  test(`[Pricing type] Verify block Pricing type trong Pricing tab @SB_SC_SCP_116`, async ({ conf, context }) => {
    await test.step(`Xác nhận trạng thái default của Pricing type`, async () => {
      await expect(productPage.getXpathBtnWithLabel("Free")).toBeVisible();
    });

    await test.step(`View product "Test Pricing Tab" ngoài StoreFront`, async () => {
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewFromDetail("Preview sales page"),
      ]);
      checkoutPage = new CheckoutForm(sfTab, conf.suiteConf.domain);
      expect(await checkoutPage.getTextContent(checkoutPage.xpathTotalPrice)).toEqual("$0.00");
    });

    await test.step(`Select option "One-time payment" với shop chưa connect payment`, async () => {
      await productPage.goto(`/admin/creator/products`);
      await productPage.clickTitleProduct(productInfo.title);
      await productPage.switchTab("Pricing");
      await productPage.selectPaymentType("One-time payment");
      await productPage.clickSaveBar();
      await expect(
        productPage.genLoc(productPage.getXpathWithLabel("Connect to PayPal or Stripe to start accepting payments")),
      ).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Connect payment providers"))).toBeVisible();
    });

    await test.step(`Click button "Connect payment providers"`, async () => {
      await productPage.clickConnectPayment();
      expect(await productPage.getCurrentUrl()).toEqual(
        `https://${conf.suiteConf.domain}/admin/creator/settings/payments`,
      );
    });

    await test.step(`Select option One-time payment với shop đã connect payment`, async () => {
      providerId = await paymentProviderAPI.getProviderID(providerInfo);
      await productPage.goto(`/admin/creator/products`);
      await productPage.clickTitleProduct(productInfo.title);
      await productPage.switchTab("Pricing");
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Amount"))).toBeVisible();
      await expect(productPage.genLoc(productPage.xpathCurrency)).toBeVisible();
    });

    await test.step(`Input value vào trường Amount > Click button "Save"`, async () => {
      const pricingInfo = conf.caseConf.pricing;
      for (let i = 0; i < pricingInfo.length; i++) {
        await productPage.inputPrice(pricingInfo[i].amount);
        await productPage.clickSaveBar();
        await productPage.waitResponseWithUrl("admin/digital-products/product");
      }
    });

    await test.step(`View product "Test Pricing Tab" ngoài StoreFront`, async () => {
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewFromDetail("Preview sales page"),
      ]);
      checkoutPage = new CheckoutForm(sfTab, conf.suiteConf.domain);
      expect(await checkoutPage.getTextContent(checkoutPage.xpathTotalPrice)).toEqual("$20.00");
    });
  });

  test(`[Quantity limit] Verify block Quantity limit trong Pricing tab @SB_SC_SCP_117`, async ({ conf }) => {
    const pricing = conf.caseConf.pricing;
    await test.step(`Xác nhận trạng thái default Quantity Limit`, async () => {
      await expect(productPage.getXpathConditionalWithLabel("Quantity limit")).toBeVisible();
    });

    await test.step(`Turn on Toggle > Nhập số lượng limit member > Click button "Save"`, async () => {
      await productPage.clickTogglePricing("Quantity limit");
      for (let i = 0; i < pricing.length; i++) {
        try {
          await productPage.inputMaxMember(pricing[i].input_member);
          await productPage.clickSaveBar();
          expect(await productPage.genLoc(productPage.xpathInputMaximumMember).inputValue()).toEqual(
            pricing[i].expect_member,
          );
        } catch (e) {
          expect(await productPage.genLoc(productPage.xpathInputMaximumMember).inputValue()).toEqual(
            pricing[i].expect_member,
          );
        }
      }
    });

    await test.step(`View product "Test pricing tab" ngoài StoreFront > Thực hiện purchase 4 lần`, async () => {
      //update later after cover this case
    });
  });

  test(`[Access limit] Verify block Access limit trong Pricing tab @SB_SC_SCP_118`, async ({ conf }) => {
    await test.step(`Xác nhận trạng thái default Access Limit`, async () => {
      await expect(productPage.getXpathConditionalWithLabel("Access limit")).toBeVisible();
    });

    await test.step(`Turn on Toggle > Xác nhận trạng thái default của datepicker`, async () => {
      const accessLimit = conf.caseConf.access_limit;
      await productPage.switchTab("Pricing");
      await productPage.clickTogglePricing("Access limit");
      await productPage.clickSaveBar();
      const productId = parseInt(await productPage.getDigitalProductID());
      const timeLimit = convertToTimeStamp();
      const productRes = await productAPI.getProduct(productId);
      const statusAccess = productRes.data.products[0].product.variant_offers[0].access_limit.enabled;
      const timeStamp = productRes.data.products[0].product.variant_offers[0].access_limit.limit;
      expect({ statusAccess, timeStamp }).toEqual(
        expect.objectContaining({
          statusAccess: accessLimit,
          timeStamp: timeLimit,
        }),
      );
    });

    await test.step(`Choose Datepicker cho Access Limit
      > View content đã purchase của product "Test pricing tab"`, async () => {
      //update after have multi pricing feature
    });
  });
});
