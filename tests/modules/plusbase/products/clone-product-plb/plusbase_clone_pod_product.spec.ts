import { test, expect } from "@core/fixtures";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { SFHome } from "@pages/storefront/homepage";
import { removeCurrencySymbol } from "@core/utils/string";
import { ProductAPI } from "@pages/api/product";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { OrderAPI } from "@pages/api/order";
import { Order, OrderSummary, VariantMapping } from "@types";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { isEqual } from "@core/utils/checkout";

test.describe("Clone product POD Plusbase", () => {
  let dashboardPage: DashboardPage;
  let srcPrdDashboardPage: DashboardPage;
  let destProductPage: ProductPage;
  let srcProductPage: ProductPage;
  let srcPrdDomain: string;
  let srcDestDomain: string;
  let shopPrdToken;
  let shopDestToken;
  let destShopPrdAPI, srcShopPrdApi: PlusbaseProductAPI;
  let productName: string;
  let prdApi, productAPI: ProductAPI;
  let newPage: Page;
  let ctx: BrowserContext;
  let orderId: number;
  let orderAPI: OrderAPI;
  let orderInfo: Order;
  let orderSummaryInfo: OrderSummary;
  let authRequestPrd: APIRequestContext;
  let orderPage: OrdersPage;
  let plbOrder: PlusbaseOrderAPI;
  let checkout: SFCheckout;

  test.beforeAll(async ({ conf }) => {
    srcPrdDomain = conf.suiteConf.source_product_domain;
    srcDestDomain = conf.suiteConf.domain;
  });

  test.beforeEach(async ({ dashboard, conf, token, authRequest, browser, multipleStore }) => {
    productName = conf.caseConf.product_name;
    dashboardPage = new DashboardPage(dashboard, srcDestDomain);
    ctx = await browser.newContext();
    newPage = await ctx.newPage();

    srcPrdDashboardPage = new DashboardPage(newPage, srcPrdDomain);
    authRequestPrd = await multipleStore.getAuthRequest(
      conf.suiteConf.username,
      conf.suiteConf.password,
      conf.suiteConf.source_product_domain,
      conf.suiteConf.source_product_shop_id,
      conf.suiteConf.user_id,
    );
    shopPrdToken = await token.getWithCredentials({
      domain: srcPrdDomain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    shopDestToken = await token.getWithCredentials({
      domain: srcDestDomain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    await srcPrdDashboardPage.loginWithToken(shopPrdToken.access_token);
    destProductPage = new ProductPage(dashboardPage.page, srcDestDomain);
    srcProductPage = new ProductPage(srcPrdDashboardPage.page, srcPrdDomain);
    destShopPrdAPI = new PlusbaseProductAPI(srcDestDomain, authRequest);
    prdApi = new ProductAPI(srcDestDomain, authRequest);
    productAPI = new ProductAPI(srcPrdDomain, authRequestPrd);
    srcShopPrdApi = new PlusbaseProductAPI(srcPrdDomain, authRequestPrd);
    orderAPI = new OrderAPI(srcDestDomain, authRequest);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    plbOrder = new PlusbaseOrderAPI(conf.suiteConf.domain, authRequest);

    if (conf.caseConf.product_type === "POD") {
      await destProductPage.navigateToSubMenu("POD products", "All campaigns");
      await srcProductPage.navigateToSubMenu("POD products", "All campaigns");
      const printBase = new PrintBasePage(dashboardPage.page, srcDestDomain);
      await printBase.deleteAllCampaign("", "PlusBase");
      await prdApi.setupWatermark(
        srcDestDomain,
        {
          enable: conf.caseConf.enable_watermark,
          type: "text",
          store_name: conf.suiteConf.shop_name,
          store_logo_url: conf.suiteConf.store_logo_url,
          style: "style4",
        },
        shopDestToken.access_token,
      );
    }
    if (conf.caseConf.product_type === "Dropship") {
      await prdApi.deleteAllProduct(srcDestDomain, shopDestToken.access_token);
    }
  });

  test(`@SB_PLB_PLB_CPP_3 Clone product thành công khi chọn [keep both products] với product không có watermark và shop đích không enable watermark`, async ({
    conf,
  }) => {
    let sourceProductData;

    await test.step("Tại list product chọn Product A > Import campaign to another store > Nhập setting theo input data > Click Import", async () => {
      const productId = await srcShopPrdApi.getProductIdByHandle(
        conf.caseConf.product_handle,
        shopPrdToken.access_token,
      );
      sourceProductData = await srcShopPrdApi.getProductCampaignDetailById(productId, shopPrdToken.access_token);
      await srcProductPage.cloneProductToStore(
        {
          type: "campaign",
          second_shop: srcDestDomain,
          action: "Keep both products",
          keep_id: false,
        },
        0,
        conf.caseConf.index,
        conf.caseConf.product_name,
      );
    });

    await test.step("Tại shop thứ 2 Click on icon Process - Verify thông tin hiển thị", async () => {
      await destProductPage.page.reload({ waitUntil: "networkidle" });
      await destProductPage.verifyPlbPodProductImported(srcPrdDomain, productName, "success");
    });

    await test.step("Search với title Product A -> Product detail Verify các thông tin của product được clone trên dashboard", async () => {
      const productId = await destShopPrdAPI.getProductIdByHandle(conf.caseConf.product_handle);
      const productData = await destShopPrdAPI.getProductCampaignDetailById(productId);
      const campaignData = await destShopPrdAPI.getCampaignDetailById(productData.campaign_id);
      const artworkLayers = JSON.parse(campaignData.editor_artworks[0].meta_data.layers);

      expect(artworkLayers.length === conf.caseConf.artwork_layers_amount).toBeTruthy();

      for (let i = 0; i < productData.variants.length; i++) {
        expect(
          `${productData.variants[i].option1}${productData.variants[i].option2}${productData.variants[i].option3}`,
        ).toEqual(
          `${sourceProductData.variants[i].option1}${sourceProductData.variants[i].option2}${sourceProductData.variants[i].option3}`,
        );
        expect(productData.variants[i].price).toEqual(sourceProductData.variants[i].price);
      }
    });
  });

  test(`@PLB_PLB_CPP_16 [Clone Plus_Plus] Clone product thành công khi chọn [Orverride the existing products ] với product không có watermark và shop đích enable watermark`, async ({
    conf,
    snapshotFixture,
  }) => {
    let sourceProductData;

    await test.step("Tại list product chọn Product A > Import campaign to another store > Nhập setting theo input data > Click Import", async () => {
      const productId = await srcShopPrdApi.getProductIdByHandle(
        conf.caseConf.product_handle,
        shopPrdToken.access_token,
      );
      sourceProductData = await srcShopPrdApi.getProductCampaignDetailById(productId, shopPrdToken.access_token);

      await srcProductPage.cloneProductToStore(
        {
          type: "campaign",
          second_shop: srcDestDomain,
          action: "Override the existing products",
          keep_id: false,
        },
        0,
        conf.caseConf.index,
        conf.caseConf.product_name,
      );
    });

    await test.step("Tại shop thứ 2 Click on icon Process - Verify thông tin hiển thị > Verify các thông tin của product được clone trên dashboard", async () => {
      await destProductPage.page.reload();
      await destProductPage.verifyPlbPodProductImported(srcPrdDomain, productName, "success");

      const productId = await destShopPrdAPI.getProductIdByHandle(
        conf.caseConf.product_handle,
        shopDestToken.access_token,
      );
      const productData = await destShopPrdAPI.getProductCampaignDetailById(productId);
      const campaignData = await destShopPrdAPI.getCampaignDetailById(productData.campaign_id);
      const artworkLayers = JSON.parse(campaignData.editor_artworks[0].meta_data.layers);

      expect(artworkLayers.length === conf.caseConf.artwork_layers_amount).toBeTruthy();

      for (let i = 0; i < productData.variants.length; i++) {
        expect(
          `${productData.variants[i].option1}${productData.variants[i].option2}${productData.variants[i].option3}`,
        ).toEqual(
          `${sourceProductData.variants[i].option1}${sourceProductData.variants[i].option2}${sourceProductData.variants[i].option3}`,
        );
        expect(productData.variants[i].price).toEqual(sourceProductData.variants[i].price);
      }
    });

    await test.step("Verify các thông tin của product được clone ở SF", async () => {
      await destProductPage.gotoProductDetailPlbPod(productName);
      const sfTab = await destProductPage.viewProductOnSf();
      await snapshotFixture.verifyWithAutoRetry({
        page: sfTab,
        selector: "//div[contains(@class,'VueCarousel media-gallery-carousel__slide')]",
        snapshotName: conf.caseConf.content_snapshot,
        combineOptions: { maxDiffPixelRatio: 0.01 },
      });
    });
  });

  test(`@SB_PLB_PLB_CPP_21 Clone product không thành công khi chọn [Skip the product] với product đã được clone`, async ({
    conf,
  }) => {
    await test.step("Import product to another > Select the store to import >  If the importing handle exists,process the import as follows : Skip the product > Import", async () => {
      await srcProductPage.cloneProductToStore(
        {
          type: "campaign",
          second_shop: srcDestDomain,
          action: "Skip the product",
          keep_id: false,
        },
        0,
        conf.caseConf.index,
        conf.caseConf.product_name,
      );
      await destProductPage.page.reload();
      await destProductPage.verifyPlbPodProductImported(srcPrdDomain, productName, "success");
    });

    await test.step("Thực hiện step trên import product lần 2", async () => {
      await srcProductPage.page.reload();
      await srcProductPage.cloneProductToStore(
        {
          type: "campaign",
          second_shop: srcDestDomain,
          action: "Skip the product",
          keep_id: false,
        },
        0,
        conf.caseConf.index,
        conf.caseConf.product_name,
      );
    });

    await test.step("Tại shop thứ 2 Click on icon Process - Verify thông tin hiển thị", async () => {
      await destProductPage.page.reload();
      await destProductPage.verifyPlbPodProductImported(srcPrdDomain, productName, "skipped");
    });
  });

  test(`@PLB_PLB_CPP_22 Clone product không thành công khi chọn [Orverride the existing products] với product gốc đang ở trạng thái proccesing`, async ({
    conf,
  }) => {
    await test.step("Vào first shop > POD product > All campaigns > Chọn campaign > Select Actions Import campaign to another store > Nhập thông tin import > Click Import", async () => {
      await srcProductPage.cloneProductToStore(
        {
          type: "campaign",
          second_shop: srcDestDomain,
          action: "Override the existing products",
          keep_id: false,
        },
        0,
        conf.caseConf.index,
        conf.caseConf.product_name,
      );
    });

    await test.step("Vào second shop > POD product > All campaigns > Verify clone campaign", async () => {
      await destProductPage.page.reload();
      await destProductPage.verifyPlbPodProductImported(srcPrdDomain, productName, "failed");
    });
  });

  test(`@SB_PLB_CPP_155 Verify shipping fee của product khi clone từ plusbase sang plusbase`, async ({
    conf,
    context,
  }) => {
    await srcProductPage.navigateToSubMenu("Dropship products", "All products");
    await srcProductPage.chooseProduct(productName, "plusbase");
    await srcProductPage.selectCountryToView(conf.caseConf.shipping_country);
    const srcPrdShippingData = await srcProductPage.getDataShippingV2();
    const variantBaseCost = await srcShopPrdApi.getVariantBaseCost(conf.caseConf.sb_product_id);
    const variantsMapping: Array<VariantMapping> = await productAPI.getVariantSbcnProductMapping(
      conf.caseConf.sb_product_id,
    );
    const listBaseCost: Array<string> = [];
    for (let i = 0; i < variantsMapping.length; i++) {
      listBaseCost.push(variantBaseCost.variant_base_cost[variantsMapping[i].variant_id].base_cost);
    }

    await test.step("Tại list product chọn Product A > Import product to another store > Nhập setting theo input data > Click Import", async () => {
      await srcProductPage.navigateToSubMenu("Dropship products", "All products");
      await srcProductPage.searchProduct(productName);
      await srcProductPage.selectAndCloneProduct(srcDestDomain);
      await srcProductPage.checkMsgAfterCreated({
        message: `${conf.suiteConf.message} ${[srcDestDomain]}`,
      });
    });

    await test.step("Verify shipping fee của product A trong màn product detail tại shop plusbase ", async () => {
      await destProductPage.navigateToSubMenu("Dropship products", "All products");
      await destProductPage.chooseProduct(productName, "plusbase");
      const productId = await prdApi.getProductIdByHandle(conf.caseConf.product_handle);
      await destProductPage.selectCountryToView(conf.caseConf.shipping_country);
      let destPrdShippingData;
      await expect(async () => {
        destPrdShippingData = await destProductPage.getDataShippingV2();
        expect(destPrdShippingData.shippings.length).toBeGreaterThan(0);
      }).toPass({ intervals: [2000] });
      const shipDataMap = new Map<string, unknown>();
      for (let i = 0; i < destPrdShippingData.shippings.length; i++) {
        shipDataMap.set(destPrdShippingData.shippings[i].shipping_method, destPrdShippingData.shippings[i]);
      }
      for (let i = 0; i < srcPrdShippingData.shippings.length; i++) {
        expect(JSON.stringify(srcPrdShippingData.shippings[i])).toEqual(
          JSON.stringify(shipDataMap.get(srcPrdShippingData.shippings[i].shipping_method)),
        );
      }
      const variantBaseCostDes = await destShopPrdAPI.getVariantBaseCost(productId);
      const variantsMappingDes: Array<VariantMapping> = await prdApi.getVariantSbcnProductMapping(productId);
      const listBaseCostDes: Array<string> = [];
      for (let i = 0; i < variantsMapping.length; i++) {
        listBaseCostDes.push(variantBaseCostDes.variant_base_cost[variantsMappingDes[i].variant_id].base_cost);
      }
      expect(listBaseCostDes.every(i => listBaseCost.includes(i))).toEqual(true);
    });

    await test.step("View product A ngoài SF -> add to cart product A > Verify shipping fee của product A", async () => {
      const newPage = await context.newPage();
      const homePage = new SFHome(newPage, srcDestDomain);
      await homePage.gotoHomePage();
      const productPage = await homePage.gotoProductDetailByHandle(conf.caseConf.product_handle, productName);
      await productPage.inputQuantityProduct(1);
      await productPage.addProductToCart();
      checkout = await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(conf.suiteConf.customer_info);
      for (let i = 0; i < srcPrdShippingData.shippings.length; i++) {
        const checkoutShipRate = await checkout.getShippingFeeByRateName(
          srcPrdShippingData.shippings[i].shipping_method,
        );
        expect(checkoutShipRate).toEqual(removeCurrencySymbol(srcPrdShippingData.shippings[i].shipping_fee_first_item));
      }
    });
    await test.step("Thực hiện checkout -> Vào order detail > Verify profit của order", async () => {
      await checkout.continueToPaymentMethod();
      await checkout.selectShippingMethod(conf.caseConf.shipping_method);
      await checkout.completeOrderWithMethod("Shopbase payment");
      expect(await checkout.isTextVisible("Thank you!")).toEqual(true);
      orderSummaryInfo = await checkout.getOrderSummaryInfo();
      orderId = await checkout.getOrderIdBySDK();
      await orderAPI.getOrderProfit(orderId, "plusbase", true);
      await orderPage.goToOrderByOrderId(orderId);
      orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrder);
      expect(orderInfo.shipping_cost).toEqual(
        Number(removeCurrencySymbol(srcPrdShippingData.shippings[0].shipping_fee_first_item)),
      );
      expect(orderInfo.base_cost).toEqual(Number(listBaseCost[0]));
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orderPage.calculateProfitPlusbase(
        orderSummaryInfo.totalPrice,
        orderSummaryInfo.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummaryInfo.tippingVal,
      );
      expect(isEqual(orderInfo.profit, orderPage.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_CPP_156 [Plus->Plus] Verify profit của product khi clone từ plusbase sang plusbase`, async ({
    page,
    conf,
  }) => {
    const productId = await srcShopPrdApi.getProductIdByHandle(conf.caseConf.product_handle, shopPrdToken.access_token);
    const sourceProductData = await srcShopPrdApi.getProductCampaignDetailById(productId, shopPrdToken.access_token);

    await test.step(`Tại list product chọn Product A > Import product to another store > Nhập setting theo input data > Click Import`, async () => {
      await srcProductPage.cloneProductToStore(
        {
          type: "campaign",
          second_shop: srcDestDomain,
          action: "Keep both products",
          keep_id: false,
        },
        0,
        conf.caseConf.index,
        conf.caseConf.product_name,
      );
      await srcProductPage.checkMsgAfterCreated({
        message: `${conf.suiteConf.message} ${[srcDestDomain]}`,
      });
    });

    await test.step(`Tại shop thứ 2 Click on icon Process - Verify thông tin hiển thị > Verify các thông tin của product được clone trên dashboard `, async () => {
      await destProductPage.page.reload({ waitUntil: "networkidle" });
      await destProductPage.verifyPlbPodProductImported(
        srcPrdDomain,
        conf.caseConf.products_checkout[0].name,
        "success",
      );
      const productId = await destShopPrdAPI.getProductIdByHandle(conf.caseConf.product_handle);
      const productData = await destShopPrdAPI.getProductCampaignDetailById(productId);
      const campaignData = await destShopPrdAPI.getCampaignDetailById(productData.campaign_id);
      const artworkLayers = JSON.parse(campaignData.editor_artworks[0].meta_data.layers);
      expect(artworkLayers.length === conf.caseConf.artwork_layers_amount).toBeTruthy();
      for (let i = 0; i < productData.variants.length; i++) {
        expect(
          `${productData.variants[i].option1}${productData.variants[i].option2}${productData.variants[i].option3}`,
        ).toEqual(
          `${sourceProductData.variants[i].option1}${sourceProductData.variants[i].option2}${sourceProductData.variants[i].option3}`,
        );
        expect(productData.variants[i].price).toEqual(sourceProductData.variants[i].price);
      }
    });

    await test.step(`View product A ngoài SF > Thực hiện checkout > Vào order detail > Verify profit của order`, async () => {
      const checkout = new SFCheckout(page, conf.suiteConf.domain);
      const infoOrder = await checkout.createStripeOrderMultiProduct(
        conf.suiteConf.customer_info,
        "",
        conf.caseConf.products_checkout,
        conf.suiteConf.card_info,
      );
      orderId = infoOrder.orderId;
      orderSummaryInfo = await checkout.getOrderSummaryInfo();
      await orderAPI.getOrderProfit(orderId, "plusbase");
      await orderPage.goToOrderByOrderId(orderId);
      //get order summary info
      orderInfo = await orderPage.getOrderSummaryInOrderDetail(plbOrder);
      //verify shipping cost
      expect(orderInfo.shipping_cost).toEqual(conf.caseConf.shipping_cost);
      //verify product cost
      expect(orderInfo.base_cost).toEqual(conf.caseConf.base_cost);
      let taxInclude = 0;
      if (orderInfo.is_tax_include) {
        taxInclude = orderInfo.tax_amount;
      }
      orderPage.calculateProfitPlusbase(
        orderSummaryInfo.totalPrice,
        orderSummaryInfo.subTotal,
        Math.abs(orderInfo.discount),
        orderInfo.base_cost,
        orderInfo.shipping_cost,
        orderInfo.shipping_fee,
        taxInclude,
        orderSummaryInfo.tippingVal,
      );
      expect(isEqual(orderInfo.profit, orderPage.profit, 0.01)).toEqual(true);
    });
  });
});
