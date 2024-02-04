import { test, expect } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { ProductPage } from "@pages/dashboard/products";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { Action, OrdersPage } from "@pages/dashboard/orders";
import type { CheckoutInfo, Product } from "@types";
import { SFHome } from "@pages/storefront/homepage";
import { DashboardAPI } from "@pages/api/dashboard";
import { ProductAPI } from "@pages/api/product";
import { SettingShippingAPI } from "@pages/api/setting_shipping_api";
import { isEqual } from "@core/utils/checkout";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";

let productPage: ProductPage;
let productName: string;
let checkoutAPI: CheckoutAPI;
let emailBuyer: string;
let shippingAddress;
let sfCheckoutPage: SFCheckout;
let shippingFeeCombo: number;
let orderID: number;
let expShippingFee: string;
let orders: OrdersPage;
let shippingCostCombo;
let paymentFeeRate: number;
let processingFeeRate: number;
let sellingPrice: string;
let homepage: SFHome;
let dashboardAPI: DashboardAPI;
let shopDomain: string;
let shopSecondDomain: string;
let productAPI: ProductAPI;
let settingShippingAPI: SettingShippingAPI;
let comboIds: number[];
let productId: number;
let dropshipCatalogPage: DropshipCatalogPage;
let shippingSettingApi: SettingShippingAPI;
let plusbaseOrderAPI: PlusbaseOrderAPI;
let enableComboName: string;
let fulfillOrdersPage: FulfillmentPage;
let shopTemplateDomain: string;
let plbTemplateDashboardPage: DashboardPage;

test.describe("Create combo in product PlusBase", async () => {
  test.beforeEach(async ({ conf, dashboard, authRequest, page }) => {
    shopDomain = conf.suiteConf.domain;
    shopSecondDomain = conf.suiteConf.info_shop_second.domain;
    productName = conf.caseConf.product_name;
    emailBuyer = conf.suiteConf.email_buyer;
    shippingAddress = conf.suiteConf.shipping_address;
    paymentFeeRate = conf.suiteConf.payment_fee_rate;
    processingFeeRate = conf.suiteConf.processing_fee_rate;
    sellingPrice = conf.caseConf.selling_price;
    enableComboName = conf.caseConf.combo_enable;
    productPage = new ProductPage(dashboard, shopDomain);
    checkoutAPI = new CheckoutAPI(shopDomain, authRequest, page);
    sfCheckoutPage = new SFCheckout(page, shopDomain);
    orders = new OrdersPage(dashboard, shopDomain);
    homepage = new SFHome(page, shopDomain);
    dashboardAPI = new DashboardAPI(shopDomain, authRequest, page);
    productAPI = new ProductAPI(shopDomain, authRequest);
    settingShippingAPI = new SettingShippingAPI(shopDomain, authRequest);
    plusbaseOrderAPI = new PlusbaseOrderAPI(shopDomain, authRequest);

    test.setTimeout(conf.suiteConf.time_out);
  });

  test(`@SB_PLB_CCIP_5 Verify data trong popup create combo`, async ({ conf, dashboard }) => {
    await test.step(`Vào màn product detail > Click Btn Create combo > 
    Click placeholder của Group by > Chọn option "Size" > Click Option to create combo > 
    Chọn variant ở trường Option to create combo > 
    Set số lượng quantity của variant trong combo được tạo ra`, async () => {
      const variant = conf.caseConf.variant;
      const quantityCombo = conf.caseConf.quantity_combo;
      const productID = conf.caseConf.product_id;

      await productPage.goToEditProductPage(Number(productID));
      // Xóa shipping zone
      await settingShippingAPI.deleteAllShippingZone();

      // Xoá variant combo
      await productAPI.deleteAllVariantCombos(productID);

      await productPage.page.reload();
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      // Get shipping fee product
      expShippingFee = await productPage.calculateShippingFeeCombo(quantityCombo, "Standard Shipping");
      // Tạo combo mới
      await productPage.createCombo(variant, quantityCombo, sellingPrice);
    });

    await test.step(`Check các combo đc auto generate trong popup create combo`, async () => {
      const comboName = conf.caseConf.combo.name;
      const combo = conf.caseConf.combo;
      let actComboName: string;

      await expect(dashboard.locator("(//td[@class='combo__checkbox-select']//span)[1]")).toBeChecked();

      for (let i = 1; i < combo.length; i++) {
        actComboName = await dashboard
          .locator(`((//td[@class='combo__checkbox-select'])[${i}]/following::input)[1]`)
          .inputValue();
        expect(actComboName).toEqual(comboName);
      }
    });

    await test.step(`Check product cost của combo trong popup create combo`, async () => {
      const variantCombo = conf.caseConf.variant_combo;
      const expBaseCostCombo = await productPage.calculateBaseCostCombo(variantCombo);
      await dashboard.waitForSelector("//div[@class='combo__cost']");

      const actbaseCostCombo = removeCurrencySymbol(await productPage.getTextContent("//div[@class='combo__cost']"));
      expect(actbaseCostCombo).toEqual(expBaseCostCombo);
    });

    await test.step(`Check Shipping fee trong popup create combo`, async () => {
      const actShippingFeeCombo = await productPage.getDataTable(4, 1, 6);
      expect(actShippingFeeCombo).toEqual(`From $${expShippingFee}`);
    });

    await test.step(`Check set up selling price của combo của từng combo`, async () => {
      const sellingPrice = conf.caseConf.selling_price;

      await dashboard.locator("(//input[@class='s-input__inner combo__expand-prefix'])[1]").fill(sellingPrice);
      await productPage.clickOnBtnWithLabel("Save", 1);
      await productPage.clickOnBtnWithLabel("Finish", 1);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      const actSellingPrice = await productPage.getDataTable(2, 6, 5);
      expect(actSellingPrice).toEqual(sellingPrice);
    });
  });

  test(`@SB_PLB_CCIP_20 Verify không cho phép sửa tên option với những variant combo được tạo`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Đi đến product detail > Click button Create combo > Tạo combo product`, async () => {
      const variant = conf.caseConf.variant;
      const productID = conf.suiteConf.product_id1;
      const quantityCombo = conf.caseConf.quantity_combo;

      // Xoá variant combo
      const res = await productAPI.countComboInProduct(productID);
      const comboIds = res.combo_variant_ids;

      for (let i = 0; i < comboIds.length; i++) {
        await productAPI.deleteVariantById(productID, comboIds[i]);
      }

      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      // Create combo mới
      await productPage.createCombo(variant, quantityCombo, sellingPrice);
      await productPage.clickOnBtnWithLabel("Save", 1);
      await productPage.clickOnBtnWithLabel("Finish", 1);
    });

    await test.step(`Verify action edit variant combo`, async () => {
      const variantCombo = conf.caseConf.variant_combo;

      await dashboard.locator(`(//td[normalize-space()='${variantCombo}']/following::i)[1]`).click();
      await dashboard.waitForSelector(`//p[normalize-space()='${productName}']`);

      //Verify field các Option: Color, Size disable, không cho phép edit
      const attributeValueColor = await productPage.getAttributeValueOptionVariant("Color", "disabled");
      expect(attributeValueColor).toEqual("disabled");

      const attributeValueSize = await productPage.getAttributeValueOptionVariant("Size", "disabled");
      expect(attributeValueSize).toEqual("disabled");

      // Verify tooltip khi hover option name
      await expect(
        dashboard.locator(
          `//span[@data-label="You can edit the option name in the 'Variant Options' section of the product details"]`,
        ),
      ).toHaveCount(1);

      // Verify action fill price of combo
      await dashboard.locator("//input[@id='price']").fill(conf.caseConf.combo[0].price);
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(dashboard.locator(`//*[contains(text(),'Variant has been updated successfully!')]`)).toBeVisible();
    });
  });

  test(`@SB_PLB_CCIP_15 Verify tạo combo và checkout với product đã được markup shipping`, async ({ conf }) => {
    await test.step(`Vào màn product detail > Click Btn Create combo`, async () => {
      const combo = conf.caseConf.combo[0].name;
      const variant = conf.caseConf.variant;
      const productID = conf.suiteConf.product_id2;
      const quantityCombo = conf.caseConf.quantity_combo;
      const dataZone = conf.caseConf.shipping_zones;

      // Xóa shipping zone
      await settingShippingAPI.deleteAllShippingZone();

      // Set markup shipping
      await settingShippingAPI.createShippingZone(dataZone);

      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);

      // Xoá variant combo
      let res = await productAPI.countComboInProduct(productID);
      comboIds = res.combo_variant_ids;

      for (let i = 0; i < comboIds.length; i++) {
        await productAPI.deleteVariantById(productID, comboIds[i]);
      }

      // Create combo mới
      await productPage.createCombo(variant, quantityCombo, sellingPrice);
      shippingCostCombo = Number(removeCurrencySymbol(await productPage.getDataTable(4, 1, 6)));
      await productPage.clickOnBtnWithLabel("Save", 1);
      await productPage.clickOnBtnWithLabel("Finish", 1);
      await productPage.page.waitForSelector(`//td[normalize-space()='${combo}']`);
      res = await productAPI.countComboInProduct(productID);
      comboIds = res.combo_variant_ids;
    });

    await test.step(`Đi đến SF > check out với variant combo vừa tạo`, async () => {
      const isDiscount = conf.caseConf.is_discount;
      const isTip = conf.caseConf.is_tip;
      const isPostPurchase = conf.caseConf.is_post_purchase;

      const productCheckout: Product = {
        variant_id: comboIds[comboIds.length - 1],
        quantity: 1,
      };
      await checkoutAPI.addProductToCartThenCheckout([productCheckout]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await sfCheckoutPage.page.locator(sfCheckoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      if (await sfCheckoutPage.isTextVisible(`Standard Shipping`)) {
        await sfCheckoutPage.clickRadioButtonWithLabel("Standard Shipping");
      }

      await expect(async () => {
        shippingFeeCombo = Number(await sfCheckoutPage.getShippingFeeOnOrderSummary());
        expect(shippingFeeCombo).toBeGreaterThan(0);
      }).toPass();

      await sfCheckoutPage.completeOrderWithMethod("Stripe");
      await expect(async () => {
        orderID = await sfCheckoutPage.getOrderIdBySDK();
        expect(orderID).toBeGreaterThan(0);
      }).toPass();
      await sfCheckoutPage.getOrderSummary(isTip, isDiscount, isPostPurchase);
    });

    await test.step(`Đi đến order detail < verify shipping fee, shipping cost của variant combo, profit của order`, async () => {
      await orders.goToOrderByOrderId(orderID);
      await orders.waitForProfitCalculated();
      await orders.clickShowCalculation();

      const baseCost = Number(removeCurrencySymbol(await orders.getBaseCost(plusbaseOrderAPI)));
      const shippingFeeInOrderDetail = Number(removeCurrencySymbol(await orders.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orders.getSubtotalOrder()));
      expect(subtotal).toEqual(sfCheckoutPage.subtotal);
      expect(shippingFeeInOrderDetail).toEqual(shippingFeeCombo);

      const shippingCostInOrderDetail = Number(removeCurrencySymbol(await orders.getShippingCost()));
      expect(shippingCostInOrderDetail).toEqual(shippingCostCombo);
      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await orders.getTax()));
      const taxDesciption = await orders.getTaxDesciption();
      if (taxDesciption.includes("include")) {
        taxInclude = tax;
      }
      orders.calculateProfitPlusbase(
        sfCheckoutPage.total,
        sfCheckoutPage.subtotal,
        sfCheckoutPage.discount,
        baseCost,
        shippingCostInOrderDetail,
        shippingFeeInOrderDetail,
        taxInclude,
        sfCheckoutPage.tip,
        paymentFeeRate,
        processingFeeRate,
      );
      const actProfit = Number(removeCurrencySymbol(await orders.getProfit()));
      expect(isEqual(actProfit, Number(orders.profit.toFixed(2)), 0.01)).toBe(true);
    });
  });

  test(`@SB_PLB_CCIP_28 Verify profit của order check out với variant combo + variant thường có tax exclude`, async ({
    conf,
  }) => {
    await test.step(`Đi đến SF > check out với variant combo + 1 variant thường`, async () => {
      const productCheckout = conf.suiteConf.product_checkout1;
      const productHandle = conf.caseConf.product_product_handle;
      const isDiscount = conf.caseConf.is_discount;
      const isTip = conf.caseConf.is_tip;
      const isPostPurchase = conf.caseConf.is_post_purchase;

      // On tax exclude
      await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });

      await homepage.gotoProductDetailByHandle(productHandle, productName);
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await sfCheckoutPage.page.locator(sfCheckoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      if (await sfCheckoutPage.isTextVisible(`Standard Shipping`)) {
        await sfCheckoutPage.clickRadioButtonWithLabel("Standard Shipping");
      }

      await sfCheckoutPage.completeOrderWithMethod("Stripe");
      await expect(async () => {
        orderID = await sfCheckoutPage.getOrderIdBySDK();
        expect(orderID).toBeGreaterThan(0);
      }).toPass();
      await sfCheckoutPage.getOrderSummary(isTip, isDiscount, isPostPurchase);
    });

    await test.step(`Đi đến order detail > verify profit của order`, async () => {
      await orders.goToOrderByOrderId(orderID);
      await orders.waitForProfitCalculated();
      await orders.clickShowCalculation();

      const baseCost = Number(removeCurrencySymbol(await orders.getBaseCost(plusbaseOrderAPI)));
      const shippingFee = Number(removeCurrencySymbol(await orders.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orders.getSubtotalOrder()));
      expect(subtotal).toEqual(sfCheckoutPage.subtotal);
      const shippingCost = Number(removeCurrencySymbol(await orders.getShippingCost()));
      const taxInclude = 0;
      orders.calculateProfitPlusbase(
        sfCheckoutPage.total,
        sfCheckoutPage.subtotal,
        sfCheckoutPage.discount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        sfCheckoutPage.tip,
        paymentFeeRate,
        processingFeeRate,
      );
      const actProfit = Number(removeCurrencySymbol(await orders.getProfit()));
      expect(Number(orders.profit.toFixed(2))).toEqual(actProfit);
    });
  });

  test(`@SB_PLB_CCIP_29 Verify profit của order check out với variant combo + variant thường có tax included`, async ({
    conf,
  }) => {
    await test.step(`Setting tax của shop thành Tax Inculde > Check out với variant combo + 1 variant thường 
    > Verify tax fee tại trang check out`, async () => {
      const productCheckout = conf.suiteConf.product_checkout1;
      const productHandle = conf.caseConf.product_product_handle;
      const isDiscount = conf.caseConf.is_discount;
      const isTip = conf.caseConf.is_tip;
      const isPostPurchase = conf.caseConf.is_post_purchase;

      // On tax include
      await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: true });

      await homepage.gotoProductDetailByHandle(productHandle, productName);
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();

      await sfCheckoutPage.page.locator(sfCheckoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      if (await sfCheckoutPage.isTextVisible(`Standard Shipping`)) {
        await sfCheckoutPage.clickRadioButtonWithLabel("Standard Shipping");
      }

      await sfCheckoutPage.completeOrderWithMethod("Stripe");
      await expect(async () => {
        orderID = await sfCheckoutPage.getOrderIdBySDK();
        expect(orderID).toBeGreaterThan(0);
      }).toPass();
      await sfCheckoutPage.getOrderSummary(isTip, isDiscount, isPostPurchase);
    });

    await test.step(`Đi đến order detail > verify profit của order`, async () => {
      await orders.goToOrderByOrderId(orderID);
      await orders.waitForProfitCalculated();
      await orders.clickShowCalculation();

      const baseCost = Number(removeCurrencySymbol(await orders.getBaseCost(plusbaseOrderAPI)));
      const shippingFee = Number(removeCurrencySymbol(await orders.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orders.getSubtotalOrder()));
      expect(subtotal).toEqual(sfCheckoutPage.subtotal);
      const shippingCost = Number(removeCurrencySymbol(await orders.getShippingCost()));
      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await orders.getTax()));
      const taxDesciption = await orders.getTaxDesciption();
      if (taxDesciption.includes("include")) {
        taxInclude = tax;
      }
      orders.calculateProfitPlusbase(
        sfCheckoutPage.total,
        sfCheckoutPage.subtotal,
        sfCheckoutPage.discount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        sfCheckoutPage.tip,
        paymentFeeRate,
        processingFeeRate,
      );
      const actualProfit = Number(removeCurrencySymbol(await orders.getProfit()));
      expect(actualProfit - orders.profit >= -0.01 && actualProfit - orders.profit <= 0.01).toEqual(true);
    });
  });

  test(`@SB_PLB_CCIP_32 Verify profit với order checkout variant combo có bao gồm tax exclude, tip, discount`, async ({
    conf,
  }) => {
    const tippingInfo = conf.caseConf.tipping_info;
    const productCheckout = conf.suiteConf.product_checkout2;
    const productHandle = conf.caseConf.product_product_handle;
    const isDiscount = conf.caseConf.is_discount;
    const isTip = conf.caseConf.is_tip;
    const isPostPurchase = conf.caseConf.is_post_purchase;
    const discountCode = conf.caseConf.discount_code;

    await test.step(`Setting tip cho store > Đi đến SF > check out với variant combo > add tip > apply discount`, async () => {
      // On tip
      await dashboardAPI.setupTipping(tippingInfo);
      // Off tax include, on tax exclude
      await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: false });

      await homepage.gotoProductDetailByHandle(productHandle, productName);
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await sfCheckoutPage.applyDiscountCode(discountCode);

      await sfCheckoutPage.page.locator(sfCheckoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
      if (await sfCheckoutPage.isTextVisible(`Standard Shipping`)) {
        await sfCheckoutPage.clickRadioButtonWithLabel("Standard Shipping");
      }
      await sfCheckoutPage.continueToPaymentMethod();
      await sfCheckoutPage.addTip(tippingInfo);
      await sfCheckoutPage.completeOrderWithMethod("Stripe");
      await expect(async () => {
        orderID = await sfCheckoutPage.getOrderIdBySDK();
        expect(orderID).toBeGreaterThan(0);
      }).toPass();
      await sfCheckoutPage.getOrderSummary(isTip, isDiscount, isPostPurchase);
    });

    await test.step(`Đi đến order detail > verify profit của order`, async () => {
      const settingOffTipping = conf.caseConf.setting_off_tipping;

      await orders.goToOrderByOrderId(orderID);
      await orders.waitForProfitCalculated();
      await orders.clickShowCalculation();

      const baseCost = Number(removeCurrencySymbol(await orders.getBaseCost(plusbaseOrderAPI)));
      const shippingFee = Number(removeCurrencySymbol(await orders.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orders.getSubtotalOrder()));
      expect(subtotal).toEqual(sfCheckoutPage.subtotal);
      const shippingCost = Number(removeCurrencySymbol(await orders.getShippingCost()));
      const taxInclude = 0;
      let totalDiscount = 0;
      if (isDiscount) {
        totalDiscount = Number(removeCurrencySymbol((await orders.getDiscountVal()).replace("-", "")));
      }

      orders.calculateProfitPlusbase(
        sfCheckoutPage.total,
        sfCheckoutPage.subtotal,
        totalDiscount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        sfCheckoutPage.tip,
        paymentFeeRate,
        processingFeeRate,
      );

      const actProfit = Number(removeCurrencySymbol(await orders.getProfit()));
      expect(Number(orders.profit.toFixed(2))).toEqual(actProfit);

      // Off tipping
      await dashboardAPI.setupTipping(settingOffTipping);
    });
  });

  test(`@SB_PLB_IC_12 kiểm tra clone product combo`, async ({ conf, multipleStore }) => {
    const authRequestSecondSt = await multipleStore.getAuthRequest(
      conf.suiteConf.username,
      conf.suiteConf.password,
      conf.suiteConf.info_shop_second.domain,
      conf.suiteConf.info_shop_second.shop_id,
      conf.suiteConf.info_shop_second.user_id,
    );

    const dashboardSecondSt = await multipleStore.getDashboardPage(
      conf.suiteConf.username,
      conf.suiteConf.password,
      conf.suiteConf.info_shop_second.domain,
      conf.suiteConf.info_shop_second.shop_id,
      conf.suiteConf.info_shop_second.user_id,
    );

    const productApiSecondSt = new ProductAPI(conf.suiteConf.info_shop_second.domain, authRequestSecondSt);
    const productPageSecond = new ProductPage(dashboardSecondSt, conf.suiteConf.info_shop_second.domain);
    // Delete all product before check clone
    await productApiSecondSt.deleteAllProduct(shopSecondDomain);
    const dataVariantToFulfill = new Map<string, string>();

    await test.step(`Login first shop > Dropship products > All products > Slelect product > Select action Import product to another store > Tại popup import product > Select data để clone product > Click Import`, async () => {
      const productValidate = conf.caseConf.product_validate_detail;

      // Get data variant to fulfill của product gốc
      await productPage.gotoProductDetailPlb(productValidate.product_name);

      for (let i = 1; i < productValidate.size.length; i++) {
        dataVariantToFulfill.set(
          await productPage.getDataProductVariant(i, 2, 3),
          await productPage.getDataProductVariant(i, 2, 6),
        );
      }
      const dataClone = conf.caseConf.data_clone;
      await productAPI.cloneProduct(dataClone);
    });

    await test.step(`Login shop đích > Dropship product > All products > Click icon PlusBase > Verify progress clone product`, async () => {
      await productPageSecond.goto(`/admin/products`);

      await expect(async () => {
        await productPageSecond.clickProgressBar();
        expect(await productPageSecond.getStatus()).toEqual(conf.caseConf.status);
        expect(await productPageSecond.getProcess()).toEqual(conf.caseConf.process);
      }).toPass();
    });

    await test.step(`Click product detail > Verify data product tại shop đích sau khi được clone thành công`, async () => {
      const productValidate = conf.caseConf.product_validate_detail;

      await expect(async () => {
        await productPageSecond.page.reload();
        await productPageSecond.page.waitForTimeout(3000);
        const countProduct = await productPageSecond.countProductOnProductList();
        expect(countProduct).toEqual(conf.caseConf.number_product);
      }).toPass();

      const dataProduct = await productApiSecondSt.getAllProduct(shopSecondDomain);
      productId = dataProduct[0].id;
      expect(
        await productPage.getProductInfoDashboardByApi(
          authRequestSecondSt,
          shopSecondDomain,
          productId,
          productValidate,
        ),
      ).toEqual(productValidate);

      await productPageSecond.gotoProductDetailPlb(productValidate.product_name);

      // Get data variant to fulfill with của product clone
      const dataVariantToFulfillProdClone = new Map<string, string>();
      for (let i = 1; i < productValidate.size.length; i++) {
        dataVariantToFulfillProdClone.set(
          await productPageSecond.getDataProductVariant(i, 2, 3),
          await productPageSecond.getDataProductVariant(i, 2, 6),
        );
      }
      expect(dataVariantToFulfillProdClone).toEqual(dataVariantToFulfill);
    });
  });

  test(`@SB_PLB_IC_11 kiểm tra duplicate product combo`, async ({ conf, authRequest }) => {
    const dataVariantToFulfill = new Map<string, string>();
    await test.step(`Vào Dropship product > All products > Click product name đi đến product detail > click button Dulicate `, async () => {
      const productValidate = conf.caseConf.product_validate_detail;
      await productPage.goToEditProductPage(conf.caseConf.product_id);

      // Get data variant to fulfill with của product gốc
      for (let i = 1; i < productValidate.size.length; i++) {
        dataVariantToFulfill.set(
          await productPage.getDataProductVariant(i, 2, 3),
          await productPage.getDataProductVariant(i, 2, 6),
        );
      }
      await productPage.clickOnBtnWithLabel("Duplicate");
      await productPage.duplicateProduct(true);
    });

    await test.step(`Tick chọn check box Duplicate product media > Click button Duplicate > Verify product được duplicate`, async () => {
      const productValidate = conf.caseConf.product_validate_detail;

      productId = await productAPI.getProductIdByHandle(conf.caseConf.product_handle);
      const dataProduct = await productPage.getProductInfoDashboardByApi(
        authRequest,
        shopDomain,
        productId,
        productValidate,
      );

      // Get data of product duplicate and verify with product original
      const productIdOfProductDup = Number(await productPage.getProductIDByURL());
      const dataProductDup = await productPage.getProductInfoDashboardByApi(
        authRequest,
        shopDomain,
        productIdOfProductDup,
        conf.caseConf.product_duplicate_validate,
      );
      expect(dataProduct).toEqual(dataProductDup);

      // Get data variant to fulfill của product duplicate
      const dataVariantToFulfillProdDuplicate = new Map<string, string>();
      for (let i = 1; i < productValidate.size.length; i++) {
        dataVariantToFulfillProdDuplicate.set(
          await productPage.getDataProductVariant(i, 2, 3),
          await productPage.getDataProductVariant(i, 2, 6),
        );
      }
      expect(dataVariantToFulfillProdDuplicate).toEqual(dataVariantToFulfill);

      // Delete product after duplicate
      const productIdNew = Number(await productPage.getProductIDByURL());
      await productAPI.deleteProductById(shopDomain, productIdNew);
    });
  });

  test(`@SB_PLB_CCIP_30 Verify profit của order check out với combo có tax included`, async ({ conf }) => {
    await test.step(`Check out đến country California với variant combo > Verify tax fee tại trang check out`, async () => {
      //const productCheckout = conf.suiteConf.product_checkout3;
      const productCheckout = conf.caseConf.product_checkout;
      const productHandle = conf.caseConf.product_product_handle;
      const isDiscount = conf.caseConf.is_discount;
      const isTip = conf.caseConf.is_tip;
      const isPostPurchase = conf.caseConf.is_post_purchase;
      const dataZone = conf.caseConf.shipping_zones;
      const settingOffTipping = conf.caseConf.setting_off_tipping;

      // Off tipping
      await dashboardAPI.setupTipping(settingOffTipping);

      // Xóa shipping zone
      await settingShippingAPI.deleteAllShippingZone();

      // Set markup shipping
      await settingShippingAPI.createShippingZone(dataZone);

      //  on tax exclude
      await dashboardAPI.updateTaxSettingPbPlb({ isTaxInclude: true });

      await homepage.gotoProductDetailByHandle(productHandle, productName);
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      if (await sfCheckoutPage.isTextVisible("Standard Shipping", 2)) {
        await sfCheckoutPage.clickRadioButtonWithLabel("Standard Shipping");
      }
      await sfCheckoutPage.continueToPaymentMethod();
      await sfCheckoutPage.completeOrderWithMethod("Stripe");
      await expect(async () => {
        orderID = await sfCheckoutPage.getOrderIdBySDK();
        expect(orderID).toBeGreaterThan(0);
      }).toPass();
      await sfCheckoutPage.getOrderSummary(isTip, isDiscount, isPostPurchase);
    });
    await test.step(`Đi đến order detail > verify profit của order`, async () => {
      await orders.goToOrderByOrderId(orderID);
      await orders.waitForProfitCalculated();
      await orders.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orders.getBaseCost(plusbaseOrderAPI)));
      const shippingFee = Number(removeCurrencySymbol(await orders.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orders.getSubtotalOrder()));
      expect(subtotal).toEqual(sfCheckoutPage.subtotal);
      const shippingCost = Number(removeCurrencySymbol(await orders.getShippingCost()));
      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await orders.getTax()));
      const taxDesciption = await orders.getTaxDesciption();
      expect(taxDesciption).toContain("include");
      taxInclude = tax;
      orders.calculateProfitPlusbase(
        sfCheckoutPage.total,
        sfCheckoutPage.subtotal,
        sfCheckoutPage.discount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        sfCheckoutPage.tip,
        paymentFeeRate,
        processingFeeRate,
      );
      expect(isEqual(Number(removeCurrencySymbol(await orders.getProfit())), orders.profit, 0.01)).toEqual(true);
    });
  });

  test(`@SB_PLB_CCIP_25 Kiểm tra Est. profit của combo trong product detail khi product bị xóa 1 vài option`, async ({
    dashboard,
    conf,
    authRequest,
  }) => {
    let firstItemMarkup: number;
    let estProfitDisplay: number;
    let estProfit: number;
    let baseCost: number;
    let sellingPrice: number;
    let shippingCost: number;
    await test.step(`Vào dashboard > Product detail > Click button View shipping fee > Verify profit của combo bị xóa 1 vài option `, async () => {
      const dataZone = conf.caseConf.shipping_zones;
      const disabledComboName = conf.caseConf.combo_disable;

      // Xóa shipping zone
      await settingShippingAPI.deleteAllShippingZone();

      // Set markup shipping
      await settingShippingAPI.createShippingZone(dataZone);

      dropshipCatalogPage = new DropshipCatalogPage(dashboard, shopDomain);
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.searchAndClickViewRequestDetail(productName);
      await dropshipCatalogPage.clickSeeDetail();
      expect(await dropshipCatalogPage.isPopUpDisplayed("Total cost")).toBe(true);
      const firstItemSO = Number(removeCurrencySymbol(await dropshipCatalogPage.getShippingCostInPopUp(2, 1)));
      const additionalItemSO = Number(removeCurrencySymbol(await dropshipCatalogPage.getShippingCostInPopUp(2, 2)));
      await dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathCloseTotalCostPopup).click();
      await productPage.goToEditProductPage(conf.caseConf.product_id);
      baseCost = Number(removeCurrencySymbol(await productPage.getDataTable(6, 2, 5)));
      sellingPrice = Number(removeCurrencySymbol(await productPage.getDataTable(6, 2, 4)));

      //click button View
      await productPage.clickViewShipping();
      expect(await productPage.isPopUpDisplayed("Shipping fee")).toBe(true);

      //verify profit combo có option bị xóa sẽ bị disable
      await expect(await productPage.genLoc(productPage.xpathProductInShippingFee(disabledComboName))).toHaveAttribute(
        "class",
        "line-disable",
      );

      const indexOfDisabledCombo = await productPage.getIndexOfRow(2, disabledComboName);

      expect(await productPage.getDataTable(2, indexOfDisabledCombo, 2)).toEqual("$0");
      expect(await productPage.getDataTable(2, indexOfDisabledCombo, 3)).toEqual("$0");
      expect(await productPage.getDataTable(2, indexOfDisabledCombo, 4)).toEqual("$0");
      expect(await productPage.getDataTable(2, indexOfDisabledCombo, 7)).toEqual("N/A");

      //verify profit cua 1 combo không có option bị xóa
      const indexOfEnableCombo = await productPage.getIndexOfRow(2, enableComboName);
      firstItemMarkup = Number(removeCurrencySymbol(await productPage.getDataTable(2, indexOfEnableCombo, 4)));
      estProfitDisplay = Number(removeCurrencySymbol(await productPage.getDataTable(2, indexOfEnableCombo, 7)));
      shippingCost = firstItemSO + additionalItemSO;
      estProfit = await productPage.calculateEstProfit(
        paymentFeeRate,
        firstItemMarkup,
        processingFeeRate,
        sellingPrice,
        baseCost,
        shippingCost,
      );
      expect(estProfitDisplay).toEqual(estProfit);
      await productPage.clickOnBtnWithLabel("Close");
    });

    await test.step(`Click Update shipping fee > Update shipping zone> Click button "View" shipping fee > Verify profit của combo sau khi update shipping zone`, async () => {
      const updatedShippingInfo = conf.caseConf.shipping_zones_update;
      shippingSettingApi = new SettingShippingAPI(shopDomain, authRequest);
      const listShippingZones = await shippingSettingApi.getListShippingZone();
      const usSettingZone = listShippingZones.find(sz => {
        return sz.countries.some(c => (c.code = "US"));
      });
      expect(usSettingZone).not.toBeUndefined();
      usSettingZone.meta_data.disabled_group_codes = [];
      usSettingZone.item_based_shipping_rate[0].first_item_price = updatedShippingInfo.first_item_price;
      usSettingZone.item_based_shipping_rate[0].additional_item_price = updatedShippingInfo.additional_item_price;

      await shippingSettingApi.updateShippingZone(usSettingZone);
      await productPage.page.reload();
      await productPage.clickViewShipping();
      expect(await productPage.isPopUpDisplayed("Shipping fee")).toBe(true);

      //verify profit combo sau khi update shipping fee
      const indexOfEnableCombo = await productPage.getIndexOfRow(2, enableComboName);
      firstItemMarkup = Number(removeCurrencySymbol(await productPage.getDataTable(2, indexOfEnableCombo, 4)));
      const estProfitDisplay = Number(removeCurrencySymbol(await productPage.getDataTable(2, indexOfEnableCombo, 7)));
      const estProfit = await productPage.calculateEstProfit(
        paymentFeeRate,
        firstItemMarkup,
        processingFeeRate,
        sellingPrice,
        baseCost,
        shippingCost,
      );
      expect(estProfitDisplay).toEqual(estProfit);
    });
  });

  test(`@SB_PLB_CCIP_26 Verify xóa variant khi variant nằm trong combo`, async ({ dashboard, conf, context }) => {
    const variant = conf.caseConf.combo.variant;
    const quantityCombo = conf.caseConf.combo.quantity_combo;
    const sellingPrice = conf.caseConf.combo.selling_price;
    const aliUrlRes = conf.caseConf.ali_url;
    const variantIncludeCombo = conf.caseConf.variant_include_combo;
    await test.step(`Vào product detail > Xóa variant trong combo`, async () => {
      //Pre condition: import product -> tạo combo
      //Import product
      dropshipCatalogPage = new DropshipCatalogPage(dashboard, shopDomain);
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.searchWithKeyword(aliUrlRes);
      await dropshipCatalogPage.waitTabItemLoaded();
      expect(await dropshipCatalogPage.countSearchResult()).toEqual(1);
      await dropshipCatalogPage.clickProductItemBaseOnUrl(aliUrlRes);
      expect(await dropshipCatalogPage.isTextVisible(conf.caseConf.full_product_name, 1)).toBe(true);
      await dropshipCatalogPage.clickBtnImportToStore();
      await dropshipCatalogPage.importFirstProductToStore();
      expect(await dropshipCatalogPage.isVisibleProductImportSuccess(conf.caseConf.product_name)).toBe(true);

      //Create combo
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        (await dropshipCatalogPage.editProductLocator()).click(), // Opens a new tab
      ]);
      productPage = new ProductPage(newPage, shopDomain);
      await productPage.page.waitForSelector(productPage.xpathProductVariantDetail);
      await productPage.createCombo(variant, quantityCombo, sellingPrice);
      await productPage.clickOnBtnWithLabel("Save", 1);
      await productPage.clickOnBtnWithLabel("Finish", 1);
      await productPage.page.waitForSelector(productPage.xpathProductVariantDetail);

      //Xóa variant trong combo
      for (const variant of variantIncludeCombo) {
        await productPage.deleteVariant(variant);
        await expect(productPage.isToastMsgVisible("Deleted variant")).toBeTruthy();
        await productPage.waitForToastMessageHide("Deleted variant");
      }
    });

    await test.step(`Xóa variant không thuộc combo`, async () => {
      await productPage.deleteVariant(conf.caseConf.variant_exclude_combo);
      await expect(productPage.isToastMsgVisible("Deleted variant")).toBeTruthy();
      //Xóa product
      await productPage.deleteProductInProductDetail();
    });
  });
});

test.describe("Mapping variant in combo in product PlusBase", async () => {
  test.beforeEach(async ({ conf, authRequest, page, multipleStore }) => {
    shopDomain = conf.suiteConf.domain;
    productName = conf.caseConf.product_name;
    emailBuyer = conf.suiteConf.email_buyer;
    shippingAddress = conf.suiteConf.shipping_address;
    shopTemplateDomain = conf.suiteConf["plb_template"]["domain"];

    //Remove map product
    const templatePage = await multipleStore.getDashboardPage(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      shopTemplateDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );

    plbTemplateDashboardPage = new DashboardPage(templatePage, shopTemplateDomain);
    const authRequestTemplate = await multipleStore.getAuthRequest(
      conf.suiteConf.plb_template["username"],
      conf.suiteConf.plb_template["password"],
      shopTemplateDomain,
      conf.suiteConf.plb_template["shop_id"],
      conf.suiteConf.plb_template["user_id"],
    );
    const plusbaseProductAPI = new PlusbaseProductAPI(shopTemplateDomain, authRequestTemplate);
    await plusbaseProductAPI.mappingProduct(
      conf.caseConf.data_unmap_product.mapped_options,
      conf.caseConf.data_unmap_product.target_shop_id,
      conf.caseConf.data_unmap_product.user_id,
      conf.caseConf.data_unmap_product.sbcn_product_id,
      conf.caseConf.data_unmap_product.platform_product_id,
    );
    checkoutAPI = new CheckoutAPI(shopDomain, authRequest, page);
    sfCheckoutPage = new SFCheckout(page, shopDomain);
    homepage = new SFHome(page, shopDomain);
    test.setTimeout(conf.suiteConf.time_out);
  });

  test(`@SB_PLB_CCIP_34 Verify mapping và fulfill order với variant combo, variant nằm trong combo đã bị delete`, async ({
    conf,
    multipleStore,
  }) => {
    let checkoutInfo: CheckoutInfo;

    await test.step(`Checkout order với variant combo`, async () => {
      const productCheckout = conf.caseConf.product_checkout;
      const productHandle = conf.caseConf.product_product_handle;
      await homepage.gotoProductDetailByHandle(productHandle, productName);
      await checkoutAPI.addProductToCartThenCheckout(productCheckout);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await sfCheckoutPage.footerLoc.scrollIntoViewIfNeeded();
      await sfCheckoutPage.completeOrderWithMethod("Stripe");
      await sfCheckoutPage.page.waitForSelector(sfCheckoutPage.xpathThankYou);
      orderID = await sfCheckoutPage.getOrderIdBySDK();
      checkoutInfo = await checkoutAPI.getCheckoutInfo();
    });

    await test.step(`Login shop template > Orders > Search order vừa checkout > Approve order > Đi đến màn fulfillment page > Click Change mapping > Thực hiện mapping lại product checkout với product khác > Verify order sau khi được change mapping`, async () => {
      const templatePage = await multipleStore.getDashboardPage(
        conf.suiteConf.plb_template["username"],
        conf.suiteConf.plb_template["password"],
        shopTemplateDomain,
        conf.suiteConf.plb_template["shop_id"],
        conf.suiteConf.plb_template["user_id"],
      );

      plbTemplateDashboardPage = new DashboardPage(templatePage, shopTemplateDomain);
      const ordersPage = new OrdersPage(plbTemplateDashboardPage.page, shopTemplateDomain);
      await ordersPage.goToOrderStoreTemplateByOrderId(orderID);
      await ordersPage.waitForProfitCalculated();
      await ordersPage.moreActionsOrder(Action.ACTION_APPROVE_ORDER);
      expect(await ordersPage.getApproveStatus()).toEqual("Approved");
      expect(await ordersPage.getPaymentStatus()).toEqual("Paid");
      expect(await ordersPage.getFulfillmentStatusOrder()).toEqual("Unfulfilled");

      fulfillOrdersPage = new FulfillmentPage(plbTemplateDashboardPage.page, shopTemplateDomain);
      await fulfillOrdersPage.page.waitForLoadState("networkidle");

      await expect(async () => {
        await plbTemplateDashboardPage.goToPlusHubFulfillment({ dirrect: true });
        await fulfillOrdersPage.searchOrderInFulfillOrder(checkoutInfo.order.name);
        if (await fulfillOrdersPage.isTextVisible(`Time since created (hours) between: 6 to 4320`)) {
          await fulfillOrdersPage.removeFilterOrderPlusBase();
        }
        await fulfillOrdersPage.page.waitForTimeout(5000);
        const countLine = await fulfillOrdersPage.page.locator(`//td[@class='line-image']`).count();
        expect(countLine).toBeGreaterThan(0);
      }).toPass();

      //Map product
      await fulfillOrdersPage.mappingProduct(
        conf.caseConf.data_map_product.product_map,
        conf.caseConf.data_map_product.mapped_options,
      );

      //Verify order sau khi map product
      await fulfillOrdersPage.waitUntilElementVisible(fulfillOrdersPage.xpathToFulfillTab);
      await fulfillOrdersPage.removeFilterOrderPlusBase();
      await expect(async () => {
        expect(
          await fulfillOrdersPage.getLocatorItem(conf.caseConf.data_map_product.product_warehouse).count(),
        ).toEqual(2);
      }).toPass();

      for (const variant of conf.caseConf.data_map_product.variants) {
        expect(await fulfillOrdersPage.isTextVisible(variant, 2)).toBe(true);
      }
    });
  });
});
