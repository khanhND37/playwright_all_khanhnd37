import { expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import { Settings } from "@pages/dashboard/settings";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { removeCurrencySymbol } from "@core/utils/string";
import { SettingShippingAPI } from "@pages/api/setting_shipping_api";
import { ProductAPI } from "@pages/api/product";
import type { Combo, ShippingMethod } from "@types";
import { test } from "@fixtures/odoo";
import { SettingShipping } from "@pages/dashboard/setting_shipping";
import { SFHome } from "@pages/storefront/homepage";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { isEqual, calculatorProcessingPlb, calculatorEtaPlb } from "@core/utils/checkout";
import { formatDateEta } from "@core/utils/datetime";

let domain: string;
let paymentFeeRate: number;
let processingFeeRate: number;
let emailBuyer;
let shippingAddress;
let countryCode;
let productId;
let standardShipping: string;
let premiumShipping: string;
let ecoShipping: string;
let countLineShipOnProdDetail = 0;
let dashboardPage: DashboardPage;
let productPage: ProductPage;
let settingShippingAPI: SettingShippingAPI;
let productName: string;
let checkoutAPI: CheckoutAPI;
let productCheckout;
let shippingCost = 0;
let settingShipping: SettingShipping;
let orderId: number;
const combo: Combo = {
  option_set_id: 0,
  option: [],
  combo_rules: [],
  variant_combo_request: [],
};

test.describe("Setting shipping for PlusBase", async () => {
  test.beforeEach(async ({ conf, dashboard, authRequest, page }) => {
    test.setTimeout(conf.suiteConf.timeout);
    domain = conf.suiteConf.domain;
    paymentFeeRate = conf.suiteConf.payment_fee_rate;
    processingFeeRate = conf.suiteConf.processing_fee_rate;
    emailBuyer = conf.suiteConf.email_buyer;
    shippingAddress = conf.suiteConf.shipping_address;
    countryCode = conf.suiteConf.country_code;
    productId = conf.suiteConf.product_id;
    dashboardPage = new DashboardPage(dashboard, domain);
    productPage = new ProductPage(dashboard, domain);
    settingShippingAPI = new SettingShippingAPI(domain, authRequest);
    productName = conf.caseConf.data.productName;
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    standardShipping = conf.suiteConf.shipping_groups.standard_shipping;
    premiumShipping = conf.suiteConf.shipping_groups.premium_shipping;
    ecoShipping = conf.suiteConf.shipping_groups.eco_shipping;
    productCheckout = conf.suiteConf.product;
    await settingShippingAPI.deleteAllShippingZone();
  });

  test("@SB_PLB_MSV_12 Verify Est.profit trong product detail và khi thực hiện view shipping", async ({ conf }) => {
    const dataShipping = new Map<string, string>();
    let baseCost: number;

    await test.step("Products > Search product > Vào product detail > Verify Est.profit", async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      const sellingPrice = Number(removeCurrencySymbol(await productPage.getDataTable(2, 2, 5)));
      baseCost = Number(removeCurrencySymbol(await productPage.getDataTable(2, 2, 6)));
      const totalLineShip = await productPage.countLineShip();

      //verify Est.profit hiển thị trong product detail theo shipping group
      for (let i = 1; i < totalLineShip + 1; i++) {
        dataShipping.set(await productPage.getDataTable(1, i, 1), await productPage.getDataTable(1, i, 4));
        const shippingMethod = await productPage.getDataTable(1, i, 1);
        const shippingFeeFirstItem = Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2)));
        shippingCost = shippingFeeFirstItem;
        const estProfit = await productPage.calculateEstProfit(
          paymentFeeRate,
          shippingFeeFirstItem,
          processingFeeRate,
          sellingPrice,
          baseCost,
          shippingCost,
        );
        expect(dataShipping.get(shippingMethod)).toEqual("$" + estProfit);
      }
    });

    await test.step("View shipping > Chọn shipping trong drop list shipping method > Verify est.profit", async () => {
      const shippingMethod = conf.caseConf.data.view_shipping.shipping_method;
      await productPage.clickViewShipping();
      await productPage.selectDataViewShipping(shippingMethod, 2);
      const sellingPrice = Number(removeCurrencySymbol(await productPage.getDataTable(2, 1, 6)));
      const firstItem = Number(removeCurrencySymbol(await productPage.getDataTable(2, 1, 4)));
      shippingCost = firstItem;
      const estProfitDisplay = Number(removeCurrencySymbol(await productPage.getDataTable(2, 1, 7)));
      const estProfit = await productPage.calculateEstProfit(
        paymentFeeRate,
        firstItem,
        processingFeeRate,
        sellingPrice,
        baseCost,
        shippingCost,
      );
      expect(estProfitDisplay).toEqual(estProfit);
    });
  });

  test("@SB_PLB_MSV_15 Verify shipping màn product detail, checkout khi thực hiện update shipping fee", async ({
    conf,
    dashboard,
  }) => {
    const dataShippingZone = new Map<string, number[]>();
    const dataShippingOnProdDetail = new Map<string, number[]>();
    const dataSetShippingZone = new Map<string, number[]>();
    const settingPage = new Settings(dashboard, domain);
    const numberItemBaseRate = conf.caseConf.data.number_item_base_rate;

    // eslint-disable-next-line max-len
    await test.step("Products > Search product > Vào product detail > update shipping fee > Config shipping zone > Verify shipping product detail", async () => {
      // create shipping zone
      const dataZone = conf.caseConf.data.shipping_zones;
      const res = await settingShippingAPI.createShippingZone(dataZone);

      await dashboardPage.navigateToMenu("Settings");
      await settingPage.clickMenu("Shipping");
      await settingPage.clickMenu("Edit");
      await productPage.checkMsgAfterCreated({ message: "Item based rates" });

      const countItemBaseRates = await productPage.countLineShip();
      expect(countItemBaseRates).toEqual(numberItemBaseRate);

      // get data shipping zone từ UI verify với data tạo shipping zone
      for (let i = 1; i < countItemBaseRates + 1; i++) {
        dataShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 4))),
        ]);

        dataSetShippingZone.set(res[i - 1].name, [res[i - 1].first_item_price, res[i - 1].additional_item_price]);
      }
      expect(dataShippingZone).toEqual(dataSetShippingZone);
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      await productPage.selectDataViewShipping("United States", 1);

      // đếm line ship trong product detail, verify shipping fee của line ship nếu ăn shipping zone
      countLineShipOnProdDetail = await productPage.countLineShip();
      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        dataShippingOnProdDetail.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);

        expect(dataShippingOnProdDetail.get(await productPage.getDataTable(1, i, 1))).toEqual(
          dataShippingZone.get(await productPage.getDataTable(1, i, 1)),
        );
      }
    });

    await test.step("Go to storefront > add to cart > checkout > verify shipping", async () => {
      await checkoutAPI.addProductToCartThenCheckout([productCheckout[0]]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      const res = await checkoutAPI.getShippingMethodInfo(countryCode);
      expect(countLineShipOnProdDetail).toEqual(res.length);
      for (let i = 0; i < res.length; i++) {
        const shippingGroupName = res[i].method_title.toString();
        const shippingFee = res[i].amount;

        expect(shippingFee).toEqual(Number(dataShippingOnProdDetail.get(shippingGroupName)[0]));
      }
    });
  });
  test("@SB_PLB_MSV_16 Verify shipping, order khi checkout có discount code free ship với premium shipping", async ({
    conf,
    page,
    dashboard,
  }) => {
    const checkout = new SFCheckout(page, domain);
    let shippingFee = 0;
    const dataShipBeforeConfigShippingZone = new Map<string, number[]>();

    await test.step("Products > Search product > Vào product detail > Get shipping fee ", async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });

      countLineShipOnProdDetail = await productPage.countLineShip();

      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        dataShipBeforeConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);
      }

      shippingFee = dataShipBeforeConfigShippingZone.get(premiumShipping)[0];
    });

    await test.step("Add to cart > checkout > apply discount > verify shipping", async () => {
      const homepage = new SFHome(checkoutAPI.page, domain);
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2("United States", "inside");
      await checkoutAPI.addProductToCartThenCheckout([productCheckout[1]]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await checkout.page.locator(checkout.xpathFooterSF).scrollIntoViewIfNeeded();
      await expect(async () => {
        const isCheck = await checkout.isTextVisible(ecoShipping);
        expect(isCheck).toBeTruthy();
      }).toPass();
      await checkout.clickRadioButtonWithLabel(ecoShipping);
      await checkout.applyDiscountCode("Free Shipping");
      await expect(async () => {
        const response = await checkout.getShippingFeeOnOrderSummary();
        expect(response).toEqual("Free");
      }).toPass();
      await checkout.clickRadioButtonWithLabel(standardShipping);
      await expect(async () => {
        const response = await checkout.getShippingFeeOnOrderSummary();
        expect(response).toEqual("Free");
      }).toPass();
      await checkout.clickRadioButtonWithLabel(premiumShipping);
      await expect(async () => {
        const response = await checkout.getShippingFeeOnOrderSummary();
        expect(Number(response)).toEqual(shippingFee);
      }).toPass();
    });

    await test.step("Complete order > verify order detail", async () => {
      const isTip = conf.caseConf.data.isTip;
      const isDiscount = conf.caseConf.data.isDiscount;
      const isPostPurchase = conf.caseConf.data.isPostPurchase;
      await checkout.completeOrderWithMethod("Shopbase payment");
      await expect(async () => {
        orderId = await checkout.getOrderIdBySDK();
        expect(orderId).toBeGreaterThan(0);
      }).toPass();

      await checkout.getOrderSummary(isTip, isDiscount, isPostPurchase);

      const orders = new OrdersPage(dashboard, domain);
      await orders.goToOrderByOrderId(orderId);
      await orders.waitForProfitCalculated();
      await orders.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orders.getBaseCost()));
      const shippingFee = Number(removeCurrencySymbol(await orders.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orders.getSubtotalOrder()));
      let totalDiscount = 0;
      if (isDiscount) {
        totalDiscount = Number(removeCurrencySymbol((await orders.getDiscountVal()).replace("-", "")));
      }
      const shippingCost = Number(removeCurrencySymbol(await orders.getShippingCost()));
      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await orders.getTax()));
      if (tax > 0) {
        const taxDesciption = await orders.getTaxDesciption();
        if (taxDesciption.includes("include")) {
          taxInclude = tax;
        }
      }
      orders.calculateProfitPlusbase(
        checkout.total,
        subtotal,
        totalDiscount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        checkout.tip,
        paymentFeeRate,
        processingFeeRate,
      );

      const profitActual = Number(removeCurrencySymbol(await orders.getProfit()));
      expect(profitActual).toEqual(Number(orders.profit.toFixed(2)));
    });
  });

  test("@SB_PLB_MSV_17 Verify shipping, order khi checkout có auto discount free ship với premium shipping", async ({
    conf,
    page,
    dashboard,
  }) => {
    const checkout = new SFCheckout(page, domain);
    const isTip = conf.caseConf.data.isTip;
    const isDiscount = conf.caseConf.data.isDiscount;
    const isPostPurchase = conf.caseConf.data.isPostPurchase;
    let shippingFee = 0;
    const dataShipBeforeConfigShippingZone = new Map<string, number[]>();

    await test.step("Products > Search product > Vào product detail > Get shipping fee ", async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });

      countLineShipOnProdDetail = await productPage.countLineShip();

      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        dataShipBeforeConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);
      }

      shippingFee =
        dataShipBeforeConfigShippingZone.get(premiumShipping)[0] +
        dataShipBeforeConfigShippingZone.get(premiumShipping)[1];
    });

    await test.step("Add to cart > checkout > apply discount > verify shipping", async () => {
      const homepage = new SFHome(checkoutAPI.page, domain);
      await homepage.gotoHomePage();
      await homepage.selectStorefrontCurrencyV2("United States", "inside");
      await checkoutAPI.addProductToCartThenCheckout([productCheckout[2]]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await checkout.page.locator(checkout.xpathFooterSF).scrollIntoViewIfNeeded();
      await expect(async () => {
        const isCheck = await checkout.isTextVisible(ecoShipping);
        expect(isCheck).toBeTruthy();
      }).toPass();
      await checkout.clickRadioButtonWithLabel(ecoShipping);
      await checkout.getShippingFeeOnOrderSummary();
      await expect(async () => {
        const response = await checkout.getShippingFeeOnOrderSummary();
        expect(response).toEqual("Free");
      }).toPass();
      await checkout.clickRadioButtonWithLabel(standardShipping);
      await expect(async () => {
        const response = await checkout.getShippingFeeOnOrderSummary();
        expect(response).toEqual("Free");
      }).toPass();
      await checkout.clickRadioButtonWithLabel(premiumShipping);
      await expect(async () => {
        const response = await checkout.getShippingFeeOnOrderSummary();
        expect(isEqual(Number(response), shippingFee, 0.1)).toBeTruthy();
      }).toPass();
    });

    await test.step("Complete order > verify order detail", async () => {
      await checkout.completeOrderWithMethod("Shopbase payment");
      await checkout.getOrderSummary(isTip, isDiscount, isPostPurchase);
      const orderId = await checkout.getOrderIdBySDK();
      const orders = new OrdersPage(dashboard, domain);
      await orders.goToOrderByOrderId(orderId);
      await orders.waitForProfitCalculated();
      await orders.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orders.getBaseCost()));
      const shippingFee = Number(removeCurrencySymbol(await orders.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orders.getSubtotalOrder()));
      let totalDiscount = 0;
      if (isDiscount) {
        totalDiscount = Number(removeCurrencySymbol((await orders.getDiscountVal()).replace("-", "")));
      }
      const shippingCost = Number(removeCurrencySymbol(await orders.getShippingCost()));
      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await orders.getTax()));
      if (tax > 0) {
        const taxDesciption = await orders.getTaxDesciption();
        if (taxDesciption.includes("include")) {
          taxInclude = tax;
        }
      }
      orders.calculateProfitPlusbase(
        checkout.total,
        subtotal,
        totalDiscount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        checkout.tip,
        paymentFeeRate,
        processingFeeRate,
      );

      const profitActual = Number(removeCurrencySymbol(await orders.getProfit()));
      expect(profitActual).toEqual(Number(orders.profit.toFixed(2)));
    });
  });

  test("@SB_PLB_MSV_18 Verify shipping đối với product AliExpress chưa được trả báo giá", async ({
    conf,
    page,
    dashboard,
  }) => {
    const checkout = new SFCheckout(page, domain);
    const shippingData = conf.caseConf.data.data_shipping;
    const isTip = conf.caseConf.data.isTip;
    const isDiscount = conf.caseConf.data.isDiscount;
    const isPostPurchase = conf.caseConf.data.isPostPurchase;
    const numberLineShip = conf.caseConf.data.number_line_ship;

    await test.step("Products > Vào product detail > Verify shipping", async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      expect(await productPage.countLineShip()).toEqual(numberLineShip);
      const shippingMethod = await productPage.getDataTable(1, 1, 1);
      expect(shippingMethod).toEqual(shippingData.shipping_method);
    });

    await test.step("Go to storefront > Add to cart > checkout > apply discount > verify shipping", async () => {
      const shippingFee = await productPage.getDataTable(1, 1, 2);
      const homepage = new SFHome(checkoutAPI.page, domain);
      await homepage.gotoHomePage();
      await checkoutAPI.addProductToCartThenCheckout([productCheckout[3]]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();
      await checkout.page.locator(checkout.xpathFooterSF).scrollIntoViewIfNeeded();
      const isCheck = await checkout.isTextVisible("Calculated based on your address.");
      if (isCheck) {
        await checkout.clickRadioButtonWithLabel(standardShipping);
      }

      await expect(async () => {
        expect("$" + (await checkout.getShippingFeeOnOrderSummary())).toEqual(shippingFee);
      }).toPass();
    });

    await test.step("Complete order > verify order detail", async () => {
      await checkout.completeOrderWithMethod("Shopbase payment");
      await checkout.getOrderSummary(isTip, isDiscount, isPostPurchase);
      const orderId = await checkout.getOrderIdBySDK();
      const orders = new OrdersPage(dashboard, domain);
      await orders.goToOrderByOrderId(orderId);
      await orders.waitForProfitCalculated();
      await orders.clickShowCalculation();
      const baseCost = Number(removeCurrencySymbol(await orders.getBaseCost()));
      const shippingFee = Number(removeCurrencySymbol(await orders.getShippingFee()));
      const subtotal = Number(removeCurrencySymbol(await orders.getSubtotalOrder()));
      let totalDiscount = 0;
      if (isDiscount) {
        totalDiscount = Number(removeCurrencySymbol((await orders.getDiscountVal()).replace("-", "")));
      }
      const shippingCost = Number(removeCurrencySymbol(await orders.getShippingCost()));
      let taxInclude = 0;
      const tax = Number(removeCurrencySymbol(await orders.getTax()));
      if (tax > 0) {
        const taxDesciption = await orders.getTaxDesciption();
        if (taxDesciption.includes("include")) {
          taxInclude = tax;
        }
      }
      orders.calculateProfitPlusbase(
        checkout.total,
        subtotal,
        totalDiscount,
        baseCost,
        shippingCost,
        shippingFee,
        taxInclude,
        checkout.tip,
        paymentFeeRate,
        processingFeeRate,
      );

      const profitActual = Number(removeCurrencySymbol(await orders.getProfit()));
      expect(profitActual).toEqual(Number(orders.profit.toFixed(2)));
    });
  });

  test("@SB_PLB_MSV_13 Verify est.profit và shipping fee của variant combo", async ({ conf, authRequest }) => {
    const dataShipping = new Map<string, string>();
    let baseCost: number;
    const productAPI = new ProductAPI(domain, authRequest);

    combo.option_set_id = conf.suiteConf.option_set_id;
    combo.option = conf.caseConf.data.option;
    combo.combo_rules = conf.caseConf.data.combo_rules;
    combo.variant_combo_request = conf.suiteConf.variant_combo_request;
    let shippingCostCombo: number;
    let sellingPrice: number;

    await test.step(`Đi đến product detail > Click button Create combo > Tạo combo product`, async () => {
      // delete all shipping zone

      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      await scrollUntilElementIsVisible({
        page: productPage.page,
        scrollEle: productPage.page.locator(productPage.xpathVariantOnProductDetail),
        viewEle: productPage.page.locator(productPage.xpathVariantOnProductDetail),
      });

      // delete variant combo
      const res = await productAPI.countComboInProduct(productId[0]);

      const comboIds = res.combo_variant_ids;
      for (let i = 0; i < comboIds.length; i++) {
        await productAPI.deleteVariantById(Number(productId[0]), comboIds[i]);
      }

      // Create combo mới
      await productAPI.createCombo(productId[0], combo);
    });

    await test.step("Products > Search product > Vào product detail > Verify Est.profit", async () => {
      sellingPrice = Number(removeCurrencySymbol(await productPage.getDataTable(2, 8, 5)));
      baseCost = Number(removeCurrencySymbol(await productPage.getDataTable(2, 8, 6)));
      const countLineShip = await productPage.countLineShip();

      //verify Est.profit hiển thị trong product detail theo shipping group
      for (let i = 1; i < countLineShip + 1; i++) {
        const estProfitt = await productPage.getDataTable(1, i, 4);
        const estProfitCombo = estProfitt.split("-")[1].trim();
        dataShipping.set(await productPage.getDataTable(1, i, 1), estProfitCombo);
        const shippingMethod = await productPage.getDataTable(1, i, 1);
        const shippingCost = await productPage.getDataTable(1, i, 2);
        shippingCostCombo = Number(removeCurrencySymbol(shippingCost.split("-")[1]));
        const estProfit = await productPage.calculateEstProfit(
          paymentFeeRate,
          shippingCostCombo,
          processingFeeRate,
          sellingPrice,
          baseCost,
          shippingCostCombo,
        );
        expect(dataShipping.get(shippingMethod)).toEqual("$" + estProfit);
      }
    });

    await test.step("Update shipping > Verify shipping variant combo > Verify est.profit variant combo", async () => {
      const dataZone = conf.caseConf.data.shipping_zones;
      await settingShippingAPI.createShippingZone(dataZone);
      await productPage.page.reload();
      await scrollUntilElementIsVisible({
        page: productPage.page,
        scrollEle: productPage.page.locator(productPage.xpathVariantOnProductDetail),
        viewEle: productPage.page.locator(productPage.xpathVariantOnProductDetail),
      });
      let firstItem: number;
      await expect(async () => {
        firstItem = Number(removeCurrencySymbol(await productPage.getDataTable(1, 1, 2)));
        expect(firstItem).toEqual(dataZone.item_based_shipping_rate[0].first_item_price);
      }).toPass();

      const estProfitDisplay = await productPage.getDataTable(1, 1, 4);
      const estProfitCombo = estProfitDisplay.split("-")[1].trim();
      const estProfit = await productPage.calculateEstProfit(
        paymentFeeRate,
        firstItem,
        processingFeeRate,
        sellingPrice,
        baseCost,
        shippingCostCombo,
      );
      expect(estProfitCombo).toEqual("$" + estProfit);
    });
  });

  test("@SB_PLB_MSV_14 Verify shipping của product thỏa mãn điều kiện shipping zone với item base rate là free shipping", async ({
    conf,
  }) => {
    const shippingGroupName = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].name;
    const shippingFeeFirstItem = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].first_item_price;
    const shippingFeeAddItem = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].additional_item_price;
    const dataShipBeforeConfigShippingZone = new Map<string, number[]>();
    const dataShipAfterConfigShippingZone = new Map<string, number[]>();

    await test.step(`Chọn "Setting" > Chọn "Shipping" > Create shipping zone > Vào product detail > Verify shipping fee và est profit của variant `, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });

      // get shipping data before setting shipping zone
      countLineShipOnProdDetail = await productPage.countLineShip();
      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        dataShipBeforeConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);
      }

      // create shipping zone
      await settingShippingAPI.createShippingZone(conf.caseConf.data.shipping_zones);
      await productPage.page.reload();
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });

      // get shipping data after setting shipping zone and verify data shipping
      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        dataShipAfterConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);
        if ((await productPage.getDataTable(1, i, 1)) === shippingGroupName) {
          expect(dataShipAfterConfigShippingZone.get(await productPage.getDataTable(1, i, 1))).toEqual([
            shippingFeeFirstItem,
            shippingFeeAddItem,
          ]);
        } else {
          expect(dataShipAfterConfigShippingZone.get(await productPage.getDataTable(1, i, 1))).toEqual(
            dataShipBeforeConfigShippingZone.get(await productPage.getDataTable(1, i, 1)),
          );
        }
      }
    });

    await test.step("Go to storefront > add to cart > checkout > verify shipping", async () => {
      await checkoutAPI.addProductToCartThenCheckout([productCheckout[4]]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      const res = await checkoutAPI.getShippingMethodInfo(countryCode);
      expect(countLineShipOnProdDetail).toEqual(res.length);
      for (let i = 0; i < res.length; i++) {
        const shippingGroupName = res[i].method_title.toString();
        const shippingFee = res[i].amount;
        expect(shippingFee).toEqual(dataShipAfterConfigShippingZone.get(shippingGroupName)[0]);
      }
    });
  });

  test("@SB_PLB_MSV_21 Verify shipping fee của product khi shipping zone có điều kiện filter", async ({
    conf,
    authRequest,
  }) => {
    const shippingGroupName = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].name;
    const shippingFeeFirstItem = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].first_item_price;
    const shippingFeeAddItem = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].additional_item_price;
    const dataShipBeforeConfigShippingZone = new Map<string, number[]>();
    const dataShipAfterConfigShippingZone = new Map<string, number[]>();
    const tagName = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].rules[0].condition;

    await test.step(`Chọn "Setting" > Chọn "Shipping" > Create shipping zone > Vào product detail > Verify shipping fee `, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      await productPage.searchProduct(productName);
      await productPage.chooseProduct(productName);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      // get shipping data before setting shipping zone
      countLineShipOnProdDetail = await productPage.countLineShip();

      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        dataShipBeforeConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);
      }

      // remove tag on product detail page
      const productAPI = new ProductAPI(domain, authRequest);
      const res = await productAPI.getDataProductById(productId[1]);
      if (res.product.tags.includes(tagName)) {
        await productPage.deleteTagOnProductDetailPage(tagName);
        await productPage.clickOnBtnWithLabel("Save changes");
        await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      }

      // create shipping zone with condition filter product tag
      await settingShippingAPI.createShippingZone(conf.caseConf.data.shipping_zones);
      await productPage.page.reload();
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });

      // get shipping data after setting shipping zone and verify data shipping
      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        //get data shipping data after setting shipping zone (product don't have tag)
        dataShipAfterConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);

        // verify data shipping data after setting shipping zone (product don't have tag)
        expect(dataShipAfterConfigShippingZone.get(await productPage.getDataTable(1, i, 1))).toEqual(
          dataShipBeforeConfigShippingZone.get(await productPage.getDataTable(1, i, 1)),
        );
      }

      // add tag to product
      await productPage.setProductTags(tagName);
      await productPage.clickOnBtnWithLabel("Save changes");
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      await productPage.page.reload();
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });

      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        //get data shipping data after setting shipping zone (product have tag)
        dataShipAfterConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);

        // verify data shipping data after setting shipping zone (product have tag)
        if ((await productPage.getDataTable(1, i, 1)) === shippingGroupName) {
          expect(dataShipAfterConfigShippingZone.get(await productPage.getDataTable(1, i, 1))).toEqual([
            shippingFeeFirstItem,
            shippingFeeAddItem,
          ]);
        } else {
          expect(dataShipAfterConfigShippingZone.get(await productPage.getDataTable(1, i, 1))).toEqual(
            dataShipBeforeConfigShippingZone.get(await productPage.getDataTable(1, i, 1)),
          );
        }
      }
    });

    await test.step("Go to storefront > add to cart > checkout > verify shipping", async () => {
      await checkoutAPI.addProductToCartThenCheckout([productCheckout[4]]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      let res: Array<ShippingMethod>;
      await expect(async () => {
        res = await checkoutAPI.getShippingMethodInfo(countryCode);
        expect(countLineShipOnProdDetail).toEqual(res.length);
      }).toPass();

      for (let i = 0; i < res.length; i++) {
        const shippingGroupName = res[i].method_title.toString();
        const shippingFee = res[i].amount;
        expect(shippingFee).toEqual(dataShipAfterConfigShippingZone.get(shippingGroupName)[0]);
      }

      // clean data after run test case
      await productPage.deleteTagOnProductDetailPage(tagName);
      await productPage.clickOnBtnWithLabel("Save changes");
    });
  });

  test(`@SB_PLB_MSV_40 Verify chặn call api tạo markup shipping theo luồng markup shipping plb cũ`, async ({
    conf,
    api,
  }) => {
    await test.step(`Method: PUT URL: https://{domain}/admin/plusbase-sourcing/markup-shipping.json?sb_product_id={sbase_product_Id}`, async () => {
      const data = conf.caseConf.data;
      const domain = conf.suiteConf.domain;
      data.url = `https://${domain}/admin/plusbase-sourcing/markup-shipping.json`;
      data.request.data.sb_product_id = conf.suiteConf.sb_product_id;
      const response = await api.request(data, { autoAuth: true });
      expect(response.status).toEqual(400);
    });
  });

  test(`@SB_PLB_MSV_6 Verify tạo shipping zone mới đối với country đã được add vào shipping zone khác`, async ({
    conf,
  }) => {
    // create shipping zone of us
    settingShipping = new SettingShipping(dashboardPage.page, domain);
    await settingShippingAPI.createShippingZone(conf.caseConf.data.shipping_zones);
    const countryName = conf.caseConf.data.shipping_zones.name;

    await test.step(`Vào catalog > Import List > Shipping setting`, async () => {
      await settingShipping.goToSettingShippingZone();
      expect(await settingShipping.isTextVisible("United States")).toEqual(true);
    });

    await test.step(`Add shipping zone > Nhập zone name, Add countries > `, async () => {
      await settingShipping.clickAddShippingZone();
      await settingShipping.fillShippingZoneName(countryName);
      await settingShipping.clickElementWithLabel("span", "Add countries");
      await settingShipping.page.click(settingShipping.xpathSearchCountry);
      await settingShipping.page.locator(settingShipping.xpathSearchCountry).type(countryName);
      await settingShipping.page.locator(settingShipping.xpathSearchCountry).evaluate(e => e.blur());
      expect(
        await settingShipping.page.getAttribute(
          await settingShipping.getXpathSelectCountryWithLabel(countryName),
          "class",
        ),
      ).toContain("disabled");
    });
  });

  test("@SB_PLB_MSV_43 Verify shipping fee của product khi shipping zone có điều kiện filter exclusion", async ({
    conf,
    authRequest,
  }) => {
    const productAPI = new ProductAPI(domain, authRequest);
    const shippingGroupName = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].name;
    const shippingFeeFirstItem = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].first_item_price;
    const shippingFeeAddItem = conf.caseConf.data.shipping_zones.item_based_shipping_rate[0].additional_item_price;
    const dataShipBeforeConfigShippingZone = new Map<string, number[]>();
    const dataShipAfterConfigShippingZone = new Map<string, number[]>();
    const collection = conf.caseConf.collect;

    await test.step(`Pre-condition remove add collection to product`, async () => {
      // Get collection id
      const collections = await productAPI.getCollectionId(collection.product_id);

      // Remove all collection
      if (collection && collections.length > 0) {
        for (const collection of collections) {
          await productAPI.removeCollectionToProd(collection.id);
        }
      }
    });

    await test.step(`Chọn "Setting" > Chọn "Shipping" > Create shipping zone > Vào product detail> Product thỏa mãn điều kiện filter > Verify shipping fee `, async () => {
      await productPage.goToProdDetailByID(domain, collection.product_id);
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });
      // get shipping data before setting shipping zone
      countLineShipOnProdDetail = await productPage.countLineShip();

      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        dataShipBeforeConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);
      }

      // create shipping zone with condition exclusion
      await settingShippingAPI.createShippingZone(conf.caseConf.data.shipping_zones);
      await productPage.page.reload();
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });

      // get shipping data after setting shipping zone and verify data shipping
      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        //get data shipping data after setting shipping zone (product don't have exclusion condition collection)
        dataShipAfterConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);

        // verify data shipping data after setting shipping zone (product don't have exclusion condition collection)
        if ((await productPage.getDataTable(1, i, 1)) === shippingGroupName) {
          expect(dataShipAfterConfigShippingZone.get(await productPage.getDataTable(1, i, 1))).toEqual([
            shippingFeeFirstItem,
            shippingFeeAddItem,
          ]);
        } else {
          expect(dataShipAfterConfigShippingZone.get(await productPage.getDataTable(1, i, 1))).toEqual(
            dataShipBeforeConfigShippingZone.get(await productPage.getDataTable(1, i, 1)),
          );
        }
      }
    });

    await test.step(`Add collection to product > Verify shipping fee cuả product khi product thỏa mãn điều kiện exclusion`, async () => {
      //Add collection to product
      await productAPI.addCollectionToProd(conf.caseConf.collect);
      await productPage.page.reload();
      await productPage.checkMsgAfterCreated({ message: "Shipping method" });

      for (let i = 1; i < countLineShipOnProdDetail + 1; i++) {
        //get data shipping data after setting shipping zone (product have collection)
        dataShipAfterConfigShippingZone.set(await productPage.getDataTable(1, i, 1), [
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 2))),
          Number(removeCurrencySymbol(await productPage.getDataTable(1, i, 3))),
        ]);

        // verify data shipping data after setting shipping zone (product have collection)
        expect(dataShipAfterConfigShippingZone.get(await productPage.getDataTable(1, i, 1))).toEqual(
          dataShipBeforeConfigShippingZone.get(await productPage.getDataTable(1, i, 1)),
        );
      }
    });

    await test.step("Go to storefront > add to cart > checkout > verify shipping", async () => {
      await checkoutAPI.addProductToCartThenCheckout([conf.caseConf.product_checkout]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      const res = await checkoutAPI.getShippingMethodInfo(countryCode);
      expect(countLineShipOnProdDetail).toEqual(res.length);
      for (let i = 0; i < res.length; i++) {
        const shippingGroupName = res[i].method_title.toString();
        const shippingFee = res[i].amount;
        expect(shippingFee).toEqual(dataShipBeforeConfigShippingZone.get(shippingGroupName)[0]);
      }
    });
  });

  test(`@SB_PLB_MSV_5 Verify edit shipping zone`, async ({ conf }) => {
    const countryName = conf.caseConf.data.shipping_zones.name;
    let shippingZoneId: number;

    await test.step(`Vào shop PLB > Setting > Shipping >Create shipping zone mới > Click Save changes`, async () => {
      // create shipping zone of WW
      settingShipping = new SettingShipping(dashboardPage.page, domain);
      await settingShippingAPI.createShippingZone(conf.caseConf.data.shipping_zones);
      await expect(async () => {
        const shippingZoneData = await settingShippingAPI.getListShippingZone();
        shippingZoneId = shippingZoneData[0].id;
        expect(shippingZoneId).toBeGreaterThan(0);
      }).toPass();

      await settingShipping.goToSettingShippingZone();
      expect(await settingShipping.isTextVisible(countryName)).toEqual(true);
    });

    await test.step(`Thực hiện edit shipping zone, add thêm country > Save changes > Verify list country hiển thị sau khi edit shipping zone`, async () => {
      await settingShipping.goto(`/admin/settings/shipping/${shippingZoneId}`);
      await settingShipping.clickOnBtnLinkWithLabel("Add countries");
      await settingShipping.xpathCountryName("Singapore").click();
      await settingShipping.clickOnBtnLinkWithLabel("Add");
      await settingShipping.clickOnBtnLinkWithLabel("Save changes");
      const dataShippingAfter = await settingShippingAPI.getShippingZoneInfo(countryName);
      const listCountries = [];
      for (const country of dataShippingAfter.countries) {
        listCountries.push(country.name);
      }
      expect(listCountries).toEqual(conf.caseConf.list_country_afer_add);
    });

    await test.step(`Thực hiện xóa country khỏi shipping zone > Verify list countries hiển thị sau khi xóa country `, async () => {
      await settingShipping.xpathRemoveCountry("Singapore").click();
      await settingShipping.clickOnBtnWithLabel("Save changes");
      const dataShippingAfterDelete = await settingShippingAPI.getShippingZoneInfo(countryName);
      const listCountries = [];
      for (const country of dataShippingAfterDelete.countries) {
        listCountries.push(country.name);
      }
      expect(listCountries).toEqual(conf.caseConf.list_country_afer_delete);
    });
  });

  test(`@SB_PLB_MSV_44 Verify processing time và estimated delivery time  khi checkout`, async ({ conf }) => {
    const checkout = new SFCheckout(checkoutAPI.page, domain);

    await test.step(`Search product > Add to cart > Nhập data customer > Verify processing time`, async () => {
      await checkoutAPI.addProductToCartThenCheckout([productCheckout[3]]);
      await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
      await checkoutAPI.openCheckoutPageByToken();

      const processingTimeActual = await checkout.getDataProcessingTime();
      const dataProcessing = calculatorProcessingPlb(conf.caseConf.processing_time);
      const processingTimeExpect = `${formatDateEta(dataProcessing)}, ${dataProcessing.getFullYear()}`;

      expect(processingTimeActual).toEqual(processingTimeExpect);
    });

    await test.step(`Complete order > Verify estimated delivery time`, async () => {
      await checkout.completeOrderWithMethod();
      const actualETA = await checkout.getEstimatedDeliveryTime();
      const minETA = calculatorEtaPlb(conf.caseConf.processing_time, conf.caseConf.min_shipping_time);
      const maxETA = calculatorEtaPlb(conf.caseConf.processing_time, conf.caseConf.max_shipping_time);
      const expectETA = `${formatDateEta(minETA)} - ${formatDateEta(maxETA)}, ${maxETA.getFullYear()}`;
      expect(actualETA).toEqual(expectETA);
    });
  });
});
