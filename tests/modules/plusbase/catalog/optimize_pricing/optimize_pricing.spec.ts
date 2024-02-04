import { expect } from "@core/fixtures";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";
import { SBPage } from "@pages/page";
import { float } from "aws-sdk/clients/lightsail";
import { Page } from "@playwright/test";
import { OdooService } from "@services/odoo";
import type { ShippingData } from "@types";
import { test } from "@fixtures/odoo";

test.describe("Show được giá tối ưu cho merchant", async () => {
  let catalogPage: DropshipCatalogPage;
  let SODetailPage: Page;
  let productName: string;
  let domain: string;
  let sbPage: SBPage;
  let productTemplateId: number;
  let dataShipping: Map<string, ShippingData>;
  let odooService;
  let shippingCheckout: string;
  let countryCode: string;
  let shippingTypes: Array<string>;
  let countries: Array<string>;
  test.beforeEach(async ({ conf, dashboard, context, odoo }) => {
    odooService = OdooService(odoo);
    shippingCheckout = conf.caseConf.shipping_checkout;
    shippingTypes = conf.suiteConf.shipping_types;
    countryCode = conf.caseConf.country_code;
    productTemplateId = conf.suiteConf.product_template_id;
    countries = conf.caseConf.ship_to_country;
    dataShipping = await odooService.updateThenGetShippingDatas(productTemplateId, shippingTypes, countryCode[0]);
    domain = conf.suiteConf.domain;
    catalogPage = new DropshipCatalogPage(dashboard, domain);
    sbPage = new SBPage(dashboard, domain);
    productName = conf.caseConf.productName;
    catalogPage.goToCatalogPage(domain);
    await catalogPage.searchProductcatalog(productName);
    SODetailPage = await sbPage.clickElementAndNavigateNewTab(
      context,
      await catalogPage.productSearchResult(productName),
    );
    await SODetailPage.waitForSelector("//div[contains(@class,'sb-title-ellipsis')]");

    catalogPage = new DropshipCatalogPage(SODetailPage, domain);
  });

  test("Verify selling price và profit margin của product catalog @SB_PLB_OPR_2", async ({ conf, context }) => {
    let profitMarginActual: float;
    let productCost: float;
    let sellingPriceExpect, sellingPriceActual;
    let totalCostExpect, totalCostActual, compareAtPriceExpect;
    let profitMarginExpect, shippingMethodExpect;

    const shippingFee = dataShipping.get(shippingCheckout).first_item_fee;
    const processingRate = conf.caseConf.processing_rate;

    await test.step("Vào product detail của catalog và verify selling price của product", async () => {
      await catalogPage.chooseShipToCountry(countries[0]);
      productCost = await catalogPage.getProductCost();
      sellingPriceActual = await catalogPage.getSellingPrice();
      totalCostActual = await catalogPage.getTotalCost();

      // calculate selling price, compare at price, total cost
      sellingPriceExpect = await catalogPage.calculatorSellingPrice(productCost);
      compareAtPriceExpect = await catalogPage.calculatorCompareAtPrice(sellingPriceExpect);
      totalCostExpect = await catalogPage.calculatorTotalCost(shippingFee, productCost);

      expect(totalCostActual).toEqual(totalCostExpect);
      expect(sellingPriceActual).toEqual(sellingPriceExpect);

      profitMarginActual = await catalogPage.getProfitMargin();
      shippingMethodExpect = await catalogPage.getShipping(1);
    });

    await test.step("Verify profit margin của product", async () => {
      profitMarginExpect = await catalogPage.calculatorProfitMargin(shippingFee, processingRate, productCost);
      expect(profitMarginActual.toString()).toEqual(profitMarginExpect);
    });

    await test.step("Import product to store và verify màn import", async () => {
      await catalogPage.clickBtnImportToStore();
      await catalogPage.chooseShipToCountry(countries[0]);

      const totalVariants = await catalogPage.countVariants(productName);
      for (let i = 1; i <= totalVariants; i++) {
        const productCostActual = await catalogPage.getDataInTabPricing(productName, i, 4, "span");
        const sellingPriceActual = await catalogPage.getDataInTabPricing(productName, i, 5, "input");
        const comparePriceActual = await catalogPage.getDataInTabPricing(productName, i, 6, "input");
        const profitMarginActual = await catalogPage.getDataInTabPricing(productName, i, 7, "span");

        // verify product cost, selling price, compare at price, profit margin
        expect(productCostActual).toEqual(productCost.toString());
        expect(sellingPriceActual).toEqual(sellingPriceExpect);
        expect(comparePriceActual).toEqual(compareAtPriceExpect.toString());
        expect(profitMarginActual).toEqual(profitMarginExpect.toString());
      }
    });

    await test.step("Vào product admin detail verify data", async () => {
      const additionalItemExpect = dataShipping.get(shippingCheckout).additional_item_fee;

      await catalogPage.clickBtnEditProduct(productName);
      const productDetail = await sbPage.clickElementAndNavigateNewTab(context, await catalogPage.editProductLocator());
      const productpage = new ProductPage(productDetail, domain);

      await productpage.selectCountryToView(countries[0]);

      const shippingMethodAct = await productpage.getDataShiping(1, 1);
      const firstItemAct = await productpage.getDataShiping(1, 2);
      const additionalItemAct = await productpage.getDataShiping(1, 3);
      const estProfitAct = await productpage.getDataShiping(1, 4);

      expect(shippingMethodAct).toEqual(shippingMethodExpect);
      expect(firstItemAct).toEqual(shippingFee.toString());
      expect(additionalItemAct).toEqual(additionalItemExpect.toString());
      expect(estProfitAct).toEqual(profitMarginExpect);

      await productpage.deleteProductInProductDetail();
    });
  });

  test("Verify total cost của product catalog khi product có 1 line ship @SB_PLB_OPR_3", async ({ conf }) => {
    let shippingMethodExpect;
    let totalCostExpect;
    let productCost;
    await test.step("Vào product detail của catalog và verify total cost của product", async () => {
      const shippingFee = dataShipping.get(shippingCheckout).first_item_fee;

      await catalogPage.chooseShipToCountry(countries[0]);
      const totalCostActual = await catalogPage.getTotalCost();
      productCost = await catalogPage.getProductCost();
      totalCostExpect = await catalogPage.calculatorTotalCost(shippingFee, productCost);

      expect(totalCostActual).toEqual(totalCostExpect);

      shippingMethodExpect = await catalogPage.getShipping(1);
    });

    await test.step("Verify UI popup show detail total cost", async () => {
      await catalogPage.clickSeeDetail();
      const totalCostDetail = conf.caseConf.total_cost_detail;
      const note = conf.caseConf.note;
      for (let i = 1; i <= totalCostDetail.length; i++) {
        const columnName = await catalogPage.getTextColumnName(i);

        expect(columnName).toEqual(totalCostDetail[i - 1].column_name);
      }

      for (let i = 0; i < note.length; i++) {
        const noteText: string = note[i].note_text;
        const textNoteActual = await catalogPage.getTextNote(i + 1);
        expect(textNoteActual).toEqual(noteText);
      }
    });

    await test.step("Verify data trong popup show detail total cost", async () => {
      const shippingMethod = await catalogPage.getShipingInPopup(1, 1);
      const productCostAct = await catalogPage.getDataPopup(3);
      const totalCost = await catalogPage.getDataPopup(4);
      const firstItem = await catalogPage.getShippingCostInPopUp(2, 1);
      const additionalItem = await catalogPage.getShippingCostInPopUp(2, 2);

      const firstItemExpect = dataShipping.get(shippingCheckout).first_item_fee;
      const additionalItemExpect = dataShipping.get(shippingCheckout).additional_item_fee;

      expect(shippingMethod).toEqual(shippingMethodExpect);
      expect(productCostAct).toEqual("From $" + productCost);
      expect(totalCost).toEqual("From $" + totalCostExpect);
      expect(firstItem).toEqual("$" + firstItemExpect);
      expect(additionalItem).toEqual("$" + additionalItemExpect);
    });
  });

  test("Verify total cost của product catalog khi product có nhiều line ship @SB_PLB_OPR_4", async ({}) => {
    let shippingMethodExpect1, shippingMethodExpect2;
    let totalCostLineShip1Expect, totalCostLineShip2Expect;
    let productCost;
    const shippingFeeLineShip1 = dataShipping.get(shippingCheckout[0]).first_item_fee;
    const shippingFeeLineShip2 = dataShipping.get(shippingCheckout[1]).first_item_fee;
    await test.step("Vào product detail của catalog và verify total cost của product", async () => {
      await catalogPage.chooseShipToCountry(countries[0]);
      const totalCostActual = await catalogPage.getTotalCost();
      productCost = await catalogPage.getProductCost();
      totalCostLineShip1Expect = await catalogPage.calculatorTotalCost(shippingFeeLineShip1, productCost);
      totalCostLineShip2Expect = await catalogPage.calculatorTotalCost(shippingFeeLineShip2, productCost);

      expect(totalCostActual).toEqual(totalCostLineShip1Expect);

      shippingMethodExpect1 = await catalogPage.getShipping(1);
      shippingMethodExpect2 = await catalogPage.getShipping(3);
    });

    await test.step("Verify data trong popup show detail total cost", async () => {
      await catalogPage.clickSeeDetail();
      const shippingMethod1 = await catalogPage.getShipingInPopup(1, 1);
      const productCostAct = await catalogPage.getDataPopup(3);
      const totalCost1 = await catalogPage.getDataPopup(4);
      const firstItemLineShip1 = await catalogPage.getShippingCostInPopUp(2, 1);
      const additionalItemLineShip1 = await catalogPage.getShippingCostInPopUp(2, 2);

      const shippingMethod2 = await catalogPage.getShipingInPopup(2, 1);
      const totalCost2 = await catalogPage.getDataPopup(8);
      const firstItemLineShip2 = await catalogPage.getShippingCostInPopUp(6, 1);
      const additionalItemLineShip2 = await catalogPage.getShippingCostInPopUp(6, 2);

      const additionalItemLineShip1Expect = dataShipping.get(shippingCheckout[0]).additional_item_fee;
      const additionalItemLineShip2Expect = dataShipping.get(shippingCheckout[1]).additional_item_fee;

      // Verify shipping method, shipping cost, product cost, total cost
      expect(shippingMethod1).toEqual(shippingMethodExpect1);
      expect(productCostAct).toEqual("From $" + productCost);
      expect(totalCost1).toEqual("From $" + totalCostLineShip1Expect);
      expect(firstItemLineShip1).toEqual("$" + shippingFeeLineShip1);
      expect(additionalItemLineShip1).toEqual("$" + additionalItemLineShip1Expect);

      expect(shippingMethod2).toEqual(shippingMethodExpect2);
      expect(totalCost2).toEqual("From $" + totalCostLineShip2Expect);
      expect(firstItemLineShip2).toEqual("$" + shippingFeeLineShip2);
      expect(additionalItemLineShip2).toEqual("$" + additionalItemLineShip2Expect);
    });
  });

  test("Verify total cost của product catalog khi product có nhiều line ship @SB_PLB_OPR_5", async ({ conf }) => {
    let shippingMethodExpect: string, additionalItemExpect: number, shippingFee: number;
    let profitMarginExpect: string, totalCostExpect: string;
    let productCost: number;
    let profitMarginActual: number, totalCostActual: string;

    const processingRate = conf.caseConf.processing_rate;

    await test.step("Verify total cost, profit margin của product khi chọn country 1", async () => {
      shippingFee = dataShipping.get(shippingCheckout).first_item_fee;

      await catalogPage.chooseShipToCountry(countries[0]);

      // get total cost, product cost
      totalCostActual = await catalogPage.getTotalCost();
      productCost = await catalogPage.getProductCost();
      profitMarginActual = await catalogPage.getProfitMargin();

      // calculator total cost, profit margin
      totalCostExpect = await catalogPage.calculatorTotalCost(shippingFee, productCost);
      profitMarginExpect = await catalogPage.calculatorProfitMargin(shippingFee, processingRate, productCost);

      // Verify total cost, profit margin
      expect(totalCostActual).toEqual(totalCostExpect);
      expect(profitMarginActual.toString()).toEqual(profitMarginExpect);

      shippingMethodExpect = await catalogPage.getShipping(1);
    });
    await test.step("Click link text 'See detail' và verify data trong popup với country 1", async () => {
      await catalogPage.clickSeeDetail();
      additionalItemExpect = dataShipping.get(shippingCheckout).additional_item_fee;

      // get shipping method, shipping cost, total cost in popup
      const shippingMethod = await catalogPage.getShipingInPopup(1, 1);
      const productCostAct = await catalogPage.getDataPopup(3);
      const totalCost = await catalogPage.getDataPopup(4);
      const firstItem = await catalogPage.getShippingCostInPopUp(2, 1);
      const additionalItem = await catalogPage.getShippingCostInPopUp(2, 2);

      // verify shipping method, shipping cost, total cost in popup
      expect(shippingMethod).toEqual(shippingMethodExpect);
      expect(productCostAct).toEqual("From $" + productCost);
      expect(totalCost).toEqual("From $" + totalCostExpect);
      expect(firstItem).toEqual("$" + shippingFee);
      expect(additionalItem).toEqual("$" + additionalItemExpect);
    });
    await test.step("Verify total cost, profit margin của product khi chọn country 2", async () => {
      dataShipping = await odooService.updateThenGetShippingDatas(productTemplateId, shippingTypes, countryCode[1]);
      shippingFee = dataShipping.get(shippingCheckout).first_item_fee;
      await catalogPage.clickClosePopup();
      await catalogPage.chooseShipToCountry(countries[1]);

      // get total cost, product cost
      totalCostActual = await catalogPage.getTotalCost();
      productCost = await catalogPage.getProductCost();
      profitMarginActual = await catalogPage.getProfitMargin();

      // calculator total cost, profit margin
      totalCostExpect = await catalogPage.calculatorTotalCost(shippingFee, productCost);
      profitMarginExpect = await catalogPage.calculatorProfitMargin(shippingFee, processingRate, productCost);

      // Verify total cost, profit margin
      expect(totalCostActual).toEqual(totalCostExpect);
      expect(profitMarginActual.toString()).toEqual(profitMarginExpect);

      shippingMethodExpect = await catalogPage.getShipping(1);
    });
    await test.step("Click link text 'See detail' và verify data trong popup với country 2", async () => {
      await catalogPage.clickSeeDetail();
      additionalItemExpect = dataShipping.get(shippingCheckout).additional_item_fee;

      // get shipping method, shipping cost, total cost in popup
      const shippingMethod = await catalogPage.getShipingInPopup(1, 1);
      const productCostAct = await catalogPage.getDataPopup(3);
      const totalCost = await catalogPage.getDataPopup(4);
      const firstItem = await catalogPage.getShippingCostInPopUp(2, 1);
      const additionalItem = await catalogPage.getShippingCostInPopUp(2, 2);

      // verify shipping method, shipping cost, total cost in popup
      expect(shippingMethod).toEqual(shippingMethodExpect);
      expect(productCostAct).toEqual("From $" + productCost);
      expect(totalCost).toEqual("From $" + totalCostExpect);
      expect(firstItem).toEqual("$" + shippingFee);
      expect(additionalItem).toEqual("$" + additionalItemExpect);
    });
  });

  test("Verify shipping time trong block shipping information của product catalog @SB_PLB_OPR_6", async ({ conf }) => {
    let shippingMethodActual1: string,
      shippingMethodActual2: string,
      shippingTime1: string,
      shippingTime2: string,
      country: string;

    const shippingMethodExpect1 = conf.caseConf.shipping_method[0];
    const shippingMethodExpect2 = conf.caseConf.shipping_method[1];
    const shippingTimeExpect1 = dataShipping.get(shippingMethodExpect1).eta_delivery_time;
    const shippingTimeExpect2 = dataShipping.get(shippingMethodExpect2).eta_delivery_time;
    await test.step("Vào product detail của catalog và verify shipping time", async () => {
      shippingMethodActual1 = await catalogPage.getShipping(1);
      shippingTime1 = await catalogPage.getShipping(2);
      shippingMethodActual2 = await catalogPage.getShipping(3);
      shippingTime2 = await catalogPage.getShipping(4);

      expect(shippingMethodActual1).toEqual(shippingMethodExpect1);
      expect(shippingTime1).toEqual(shippingTimeExpect1.replaceAll(/  +/g, " "));
      expect(shippingMethodActual2).toEqual(shippingMethodExpect2);
      expect(shippingTime2).toEqual(shippingTimeExpect2.replaceAll(/  +/g, " "));
    });

    await test.step("Chọn Ship to Japan > Verify shipping time", async () => {
      country = conf.caseConf.ship_to_country[1];
      await catalogPage.chooseShipToCountry(country);
      dataShipping = await odooService.updateThenGetShippingDatas(productTemplateId, shippingTypes, countryCode[1]);
      shippingMethodActual1 = await catalogPage.getShipping(1);
      shippingTime1 = await catalogPage.getShipping(2);

      expect(shippingMethodActual1).toEqual(shippingMethodExpect1);
      expect(shippingTime1).toEqual(dataShipping.get(shippingMethodExpect1).eta_delivery_time.replaceAll(/  +/g, " "));
    });

    await test.step("Chọn Ship to US > Verify shipping time", async () => {
      country = conf.caseConf.ship_to_country[0];
      await catalogPage.chooseShipToCountry(country);

      shippingMethodActual1 = await catalogPage.getShipping(1);
      shippingTime1 = await catalogPage.getShipping(2);
      shippingMethodActual2 = await catalogPage.getShipping(3);
      shippingTime2 = await catalogPage.getShipping(4);

      expect(shippingMethodActual1).toEqual(shippingMethodExpect1);
      expect(shippingTime1).toEqual(shippingTimeExpect1.replaceAll(/  +/g, " "));
      expect(shippingMethodActual2).toEqual(shippingMethodExpect2);
      expect(shippingTime2).toEqual(shippingTimeExpect2.replaceAll(/  +/g, " "));
    });
  });
});
