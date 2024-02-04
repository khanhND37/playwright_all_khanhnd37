import { test } from "@fixtures/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { expect } from "@playwright/test";
import { OdooService } from "@services/odoo";
import { SaleOrderLine } from "@services/odoo/sale_order_line";
import { PlusbasePrivateRequestPage } from "@pages/dashboard/plusbase/private_request";
import { removeCurrencySymbol, roundingTwoDecimalPlaces } from "@core/utils/string";
import { PlusbaseOrderAPI } from "@pages/api/plusbase/order";
import { ProductAPI } from "@pages/api/product";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import type { VariantMapping, CheckoutInfo, DataAnalytics } from "@types";
import { OrderAPI } from "@pages/api/order";
import { isEqual } from "@core/utils/checkout";
import { AnalyticsPage } from "@pages/dashboard/analytics";
import { BalanceUserAPI } from "@pages/api/dashboard/balance";
import { formatDate } from "@core/utils/datetime";

let dashboardPage: DashboardPage;
let domain: string;
let plusbaseProductAPI: PlusbaseProductAPI;
let productName: string;
let dataAnalyticsAfterReCalProfit: DataAnalytics;
let dataAnalyticsBefore: DataAnalytics;
let dataAnalyticsAfterCheckout: DataAnalytics;
let balanceAPI: BalanceUserAPI;
let thresHold: number;

test.describe("Daily pack quantity", async () => {
  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out);
    domain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, domain);
    plusbaseProductAPI = new PlusbaseProductAPI(conf.suiteConf.domain, authRequest);
    productName = conf.caseConf.data.product_name;
    balanceAPI = new BalanceUserAPI(conf.suiteConf.domain, authRequest);
    thresHold = conf.suiteConf.thres_hold;
  });
  test(`@SB_PLB_MOQ_01 Verify hiển thị MOQ trong màn catalog với SO config 1 MOQ`, async ({ conf, odoo }) => {
    const odooService = OdooService(odoo);
    const variantIds = await odooService.getProductVariantIdsByProductId(
      conf.suiteConf.product_id.catalog.one_moq,
      true,
    );

    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const dataProductVariant = await odooService.getVariantInforByIds(variantIds, ["x_plusbase_base_cost"]);

    await test.step(`Vào menu "Dropship Products" > Vào Catalog > Search product`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("Catalog");
      await catalogPage.searchProductcatalog(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${dataProductVariant[0].x_plusbase_base_cost}`);
    });

    await test.step(`Vào SO detail > Verify hiển thị MOQ`, async () => {
      await catalogPage.goToProductCatalogDetailById(conf.suiteConf.product_id.catalog.one_moq);
      await expect(async () => {
        const count = await catalogPage.page.locator(catalogPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(conf.suiteConf.product_id.catalog.one_moq);
      const moq = response.variants[0].moqs[0].price;
      expect(moq).toBe(dataProductVariant[0].x_plusbase_base_cost);
    });

    await test.step(`Click "Customer support" `, async () => {
      // await catalogPage.clickOnTextLinkWithLabel("Customer support");
      // chờ pm bổ sung link customer support
      // expect(catalogPage.page.url()).toContain("");
    });

    await test.step(`Back lại màn catalog detail > Click link text "Learn more"`, async () => {
      // await catalogPage.clickOnTextLinkWithLabel("Learn more");
      // chờ pm bổ sung link learn more
      // expect(catalogPage.page.url()).toContain("");
    });
  });

  test(`@SB_PLB_MOQ_02 Verify hiển thị MOQ trong màn catalog với SO config nhiều MOQ`, async ({ conf, odoo }) => {
    const odooService = OdooService(odoo);
    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const dataMoqVariants = await odooService.sortDataMoqWithKey(conf.suiteConf.product_id.catalog.more_moq);
    const variantIds = await odooService.getProductVariantIdsByProductId(
      conf.suiteConf.product_id.catalog.more_moq,
      true,
    );

    const dataProductVariant = await odooService.getVariantInforByIds(variantIds, ["x_plusbase_base_cost"]);

    await test.step(`Vào menu "Dropship Products" > Vào Catalog > Search product`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("Catalog");
      await catalogPage.searchProductcatalog(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${dataProductVariant[0].x_plusbase_base_cost}`);
    });

    await test.step(`Vào SO detail > Verify hiển thị MOQ`, async () => {
      await catalogPage.goToProductCatalogDetailById(conf.suiteConf.product_id.catalog.more_moq);
      await expect(async () => {
        const count = await catalogPage.page.locator(catalogPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(conf.suiteConf.product_id.catalog.more_moq);
      const variants = response.variants;
      const dataMoqSo = new Map<number, Array<Record<string, number>>>();
      for (const variant of variants) {
        const list = new Array<Record<string, number>>();
        for (const moq of variant.moqs) {
          list.push({ quantity: moq.quantity, price: moq.price });
        }
        list.sort((a, b) => a.quantity - b.quantity);
        dataMoqSo.set(variant.id, list);
      }

      for (const [key, value] of dataMoqSo) {
        expect(value).toEqual(dataMoqVariants.get(key));
      }

      const moqDescription = await catalogPage.getMoqDescription();
      expect(conf.caseConf.data.moq_description).toContain(moqDescription);
    });

    await test.step(`Back lại màn catalog detail > Click link text "Learn more"`, async () => {
      // await catalogPage.clickOnTextLinkWithLabel("Learn more");
      // chờ pm bổ sung link learn more
      // expect(catalogPage.page.url()).toContain("");
    });
  });

  test(`@SB_PLB_MOQ_03 Verify hiển thị MOQ trong màn private request với SO config 1 MOQ`, async ({ conf, odoo }) => {
    const odooService = OdooService(odoo);
    const saleOrderLine = new SaleOrderLine(odoo);
    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const dataQuotation = await odooService.getQuotationByProductId(conf.suiteConf.product_id.private_request.one_moq);
    const dataSaleOrderLine = await saleOrderLine.getSaleOrderLinesBySaleOrderId(dataQuotation[0].id, ["price_unit"]);

    await test.step(`Vào menu "Dropship Products" > Vào Private request > Search product`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("Private request");
      await catalogPage.searchWithKeyword(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${dataSaleOrderLine[0].price_unit}`);
    });

    await test.step(`Vào SO detail > Verify hiển thị MOQ`, async () => {
      const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(catalogPage.page, domain);
      await plusbasePrivateRequestPage.goToQuotationDetail(conf.suiteConf.product_id.private_request.one_moq);
      await expect(async () => {
        const count = await plusbasePrivateRequestPage.page.locator(plusbasePrivateRequestPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(
        conf.suiteConf.product_id.private_request.one_moq,
        { type: "private" },
      );
      const moq = response.variants[0].moqs[0].price;
      expect(moq).toBe(dataSaleOrderLine[0].price_unit);
    });
  });

  test(`@SB_PLB_MOQ_04 Verify hiển thị MOQ trong màn private request với SO config nhiều MOQ`, async ({
    conf,
    odoo,
  }) => {
    const dataMoqVariants = new Map<string, Array<Record<string, number>>>();
    const odooService = OdooService(odoo);
    const data = await odooService.getDataMoqProduct(conf.suiteConf.product_id.private_request.more_moq);
    const dataCheckMoq = new Map<string, number>();
    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const listBaseCost = new Array<number>();

    for (const item of data) {
      // check data moq theo variant name và quantity
      if (dataMoqVariants.has(item.variant_name) && item.quantity != dataCheckMoq.get(item.variant_name)) {
        const datas = dataMoqVariants.get(item.variant_name);
        const list = new Array<Record<string, number>>();

        // Thêm data moq mới theo item vào list
        list.push({ quantity: item.quantity, price: item.base_cost });
        for (const data of datas) {
          list.push(data);
        }

        // sort list theo quantity
        list.sort((a, b) => a.quantity - b.quantity);

        // set lại data moq cho variant name
        dataMoqVariants.set(item.variant_name, list);
      } else {
        // set data moq cho variant mới
        dataMoqVariants.set(item.variant_name, [{ quantity: item.quantity, price: item.base_cost }]);
        dataCheckMoq.set(item.variant_name, item.quantity);
      }

      // lấy list base cost để verify trong màn SO list
      listBaseCost.push(item.base_cost);
    }

    const minBaseCost = listBaseCost.sort((a, b) => a - b)[0];
    const maxBaseCost = listBaseCost.sort((a, b) => b - a)[0];

    await test.step(`Vào menu "Dropship Products" > Vào Private request > Search product`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("Private request");
      await catalogPage.searchWithKeyword(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${minBaseCost} - $${maxBaseCost}`);
    });

    await test.step(`Vào SO detail > Verify hiển thị MOQ`, async () => {
      const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(catalogPage.page, domain);
      await plusbasePrivateRequestPage.goToQuotationDetail(conf.suiteConf.product_id.private_request.more_moq);

      await expect(async () => {
        const count = await plusbasePrivateRequestPage.page.locator(plusbasePrivateRequestPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(
        conf.suiteConf.product_id.private_request.more_moq,
        { type: "private" },
      );
      const variants = response.variants;
      const dataMoqSo = new Map<string, Array<Record<string, number>>>();

      for (const variant of variants) {
        const list = new Array<Record<string, number>>();
        for (const moq of variant.moqs) {
          list.push({ quantity: moq.quantity, price: moq.price });
        }
        list.sort((a, b) => a.quantity - b.quantity);
        dataMoqSo.set(variant.name, list);
      }

      for (const [key, value] of dataMoqSo) {
        expect(value).toEqual(dataMoqVariants.get(key));
      }

      const moqDescription = await plusbasePrivateRequestPage.getMoqDescription();
      expect(conf.caseConf.data.moq_description).toContain(moqDescription);
    });
  });

  test(`@SB_PLB_MOQ_05 Verify hiển thị MOQ trong màn AliExpress Product với SO config 1 MOQ`, async ({
    conf,
    odoo,
  }) => {
    const odooService = OdooService(odoo);
    const saleOrderLine = new SaleOrderLine(odoo);
    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const dataQuotation = await odooService.getQuotationByProductId(
      conf.suiteConf.product_id.aliexpress_request.one_moq,
    );
    const dataSaleOrderLine = await saleOrderLine.getSaleOrderLinesBySaleOrderId(dataQuotation[0].id, ["price_unit"]);
    await test.step(`Vào menu "Dropship Products" > Vào "AliExpress Product" > Search product`, async () => {
      await catalogPage.goToProductRequest();
      await catalogPage.searchWithKeyword(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${dataSaleOrderLine[0].price_unit}`);
    });

    await test.step(`Vào SO detail`, async () => {
      const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(catalogPage.page, domain);
      await plusbasePrivateRequestPage.goToQuotationDetail(conf.suiteConf.product_id.aliexpress_request.one_moq);
      await expect(async () => {
        const count = await plusbasePrivateRequestPage.page.locator(plusbasePrivateRequestPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(
        conf.suiteConf.product_id.aliexpress_request.one_moq,
        { type: "private" },
      );
      const moq = response.variants[0].moqs[0].price;
      expect(moq).toBe(dataSaleOrderLine[0].price_unit);
    });
  });

  test(`@SB_PLB_MOQ_06 Verify hiển thị MOQ trong màn AliExpress Product config nhiều MOQ`, async ({ odoo, conf }) => {
    const dataMoqVariants = new Map<string, Array<Record<string, number>>>();
    const odooService = OdooService(odoo);
    const data = await odooService.getDataMoqProduct(conf.suiteConf.product_id.aliexpress_request.more_moq);
    const dataCheckMoq = new Map<string, number>();
    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const listBaseCost = new Array<number>();

    for (const item of data) {
      if (dataMoqVariants.has(item.variant_name) && item.quantity != dataCheckMoq.get(item.variant_name)) {
        const datas = dataMoqVariants.get(item.variant_name);
        const list = new Array<Record<string, number>>();

        list.push({ quantity: item.quantity, price: item.base_cost });
        for (const data of datas) {
          list.push(data);
        }

        list.sort((a, b) => a.quantity - b.quantity);

        dataMoqVariants.set(item.variant_name, list);
      } else {
        dataMoqVariants.set(item.variant_name, [{ quantity: item.quantity, price: item.base_cost }]);
        dataCheckMoq.set(item.variant_name, item.quantity);
      }
      listBaseCost.push(item.base_cost);
    }

    const minBaseCost = listBaseCost.sort((a, b) => a - b)[0];
    const maxBaseCost = listBaseCost.sort((a, b) => b - a)[0];

    await test.step(`Vào menu "Dropship Products" > Vào "AliExpress Product" > Search product`, async () => {
      await catalogPage.goToProductRequest();
      await catalogPage.searchWithKeyword(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${minBaseCost} - $${maxBaseCost}`);
    });

    await test.step(`Vào SO detail`, async () => {
      const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(catalogPage.page, domain);
      await plusbasePrivateRequestPage.goToQuotationDetail(conf.suiteConf.product_id.aliexpress_request.more_moq);

      await expect(async () => {
        const count = await plusbasePrivateRequestPage.page.locator(plusbasePrivateRequestPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(
        conf.suiteConf.product_id.aliexpress_request.more_moq,
        { type: "private" },
      );
      const variants = response.variants;
      const dataMoqSo = new Map<string, Array<Record<string, number>>>();

      for (const variant of variants) {
        const list = new Array<Record<string, number>>();
        for (const moq of variant.moqs) {
          list.push({ quantity: moq.quantity, price: moq.price });
        }
        list.sort((a, b) => a.quantity - b.quantity);
        dataMoqSo.set(variant.name, list);
      }

      for (const [key, value] of dataMoqSo) {
        expect(value).toEqual(dataMoqVariants.get(key));
      }

      const moqDescription = await plusbasePrivateRequestPage.getMoqDescription();
      expect(conf.caseConf.data.moq_description).toContain(moqDescription);
    });
  });

  test(`@SB_PLB_MOQ_21 Verify hiển thị MOQ default trong màn catalog với product không set MOQ`, async ({
    odoo,
    conf,
  }) => {
    const odooService = OdooService(odoo);
    const variantIds = await odooService.getProductVariantIdsByProductId(
      conf.suiteConf.product_id.catalog.no_moq,
      true,
    );

    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const dataProductVariant = await odooService.getVariantInforByIds(variantIds, ["x_plusbase_base_cost"]);

    await test.step(`Vào menu "Dropship Products" > Vào "Catalog" > Search product`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("Catalog");
      await catalogPage.searchProductcatalog(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${dataProductVariant[0].x_plusbase_base_cost}`);
    });

    await test.step(`Vào SO detail`, async () => {
      await catalogPage.goToProductCatalogDetailById(conf.suiteConf.product_id.catalog.no_moq);
      await expect(async () => {
        const count = await catalogPage.page.locator(catalogPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(conf.suiteConf.product_id.catalog.no_moq);
      const moq = response.variants[0].moqs[0].price;
      expect(moq).toBe(dataProductVariant[0].x_plusbase_base_cost);
    });
  });

  test(`@SB_PLB_MOQ_22 Verify hiển thị MOQ default trong màn private request với product không set MOQ`, async ({
    odoo,
    conf,
  }) => {
    const odooService = OdooService(odoo);
    const saleOrderLine = new SaleOrderLine(odoo);
    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const dataQuotation = await odooService.getQuotationByProductId(conf.suiteConf.product_id.private_request.no_moq);
    const dataSaleOrderLine = await saleOrderLine.getSaleOrderLinesBySaleOrderId(dataQuotation[0].id, ["price_unit"]);
    await test.step(`Vào menu "Dropship Products" > Vào "Private request" > Search product`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("Private request");
      await catalogPage.searchWithKeyword(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${dataSaleOrderLine[0].price_unit}`);
    });

    await test.step(`Vào SO detail`, async () => {
      const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(catalogPage.page, domain);
      await plusbasePrivateRequestPage.goToQuotationDetail(conf.suiteConf.product_id.private_request.no_moq);
      await expect(async () => {
        const count = await plusbasePrivateRequestPage.page.locator(plusbasePrivateRequestPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(
        conf.suiteConf.product_id.private_request.no_moq,
        { type: "private" },
      );
      const moq = response.starting_cost;
      expect(moq).toBe(dataSaleOrderLine[0].price_unit);
    });
  });

  test(`@SB_PLB_MOQ_23 Verify hiển thị MOQ default trong màn AliExpress Product với product không set MOQ`, async ({
    odoo,
    conf,
  }) => {
    const odooService = OdooService(odoo);
    const saleOrderLine = new SaleOrderLine(odoo);
    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const dataQuotation = await odooService.getQuotationByProductId(
      conf.suiteConf.product_id.aliexpress_request.no_moq,
    );
    const dataSaleOrderLine = await saleOrderLine.getSaleOrderLinesBySaleOrderId(dataQuotation[0].id, ["price_unit"]);
    await test.step(`Vào menu "Dropship Products" > Vào "AliExpress Product" > Search product`, async () => {
      await catalogPage.goToProductRequest();
      await catalogPage.searchWithKeyword(productName);
      const productCost = await catalogPage.getBaseCost(productName, 3);
      expect(productCost).toBe(`$${dataSaleOrderLine[0].price_unit}`);
    });

    await test.step(`Vào SO detail`, async () => {
      const plusbasePrivateRequestPage = new PlusbasePrivateRequestPage(catalogPage.page, domain);
      await plusbasePrivateRequestPage.goToQuotationDetail(conf.suiteConf.product_id.aliexpress_request.no_moq);
      await expect(async () => {
        const count = await plusbasePrivateRequestPage.page.locator(plusbasePrivateRequestPage.xpathMoqList).count();
        expect(count).toBe(conf.caseConf.data.count_moq);
      }).toPass();

      const response = await plusbaseProductAPI.getProductCatalogDetail(
        conf.suiteConf.product_id.aliexpress_request.no_moq,
        { type: "private" },
      );
      const moq = response.starting_cost;
      expect(moq).toBe(dataSaleOrderLine[0].price_unit);
    });
  });

  test(`@SB_PLB_MOQ_07 Verify profit margin theo MOQ trong màn SO detail`, async ({ conf, odoo }) => {
    const catalogPage = new DropshipCatalogPage(dashboardPage.page, domain);
    const odooService = OdooService(odoo);
    let productCost: number;
    let sellingPrice: number;
    let dataDailyPackQuantity: Array<Record<string, string>>;
    const dataShipping = await odooService.getShippingDatas(
      conf.suiteConf.product_id.aliexpress_request.more_moq,
      "US",
    );
    const firstItem = dataShipping.get("Standard Shipping").first_item_fee;

    await test.step(`Check MOQ default và profit margin`, async () => {
      await catalogPage.goToProductRequest();
      await catalogPage.searchAndClickViewRequestDetail(conf.caseConf.data.url);
      dataDailyPackQuantity = await catalogPage.getDataDailyPackQuantity();
      productCost = parseFloat(removeCurrencySymbol(dataDailyPackQuantity[0].price));
      sellingPrice = parseFloat(await catalogPage.calculatorSellingPrice(productCost));

      // verify UI focus daily pack quantity default
      expect(
        (await catalogPage.page.locator(`(${catalogPage.xpathMoqList})[1]`).getAttribute("class")).includes("active"),
      ).toBeTruthy();

      const processingRate = parseFloat(removeCurrencySymbol(await catalogPage.getProcessingRateSODetail()));
      const expectProfitMargin = await catalogPage.calculatorProfitMargin(
        firstItem,
        processingRate,
        productCost,
        0.03,
        sellingPrice,
      );

      await expect(async () => {
        const profitMargin = await catalogPage.getProfitMargin();
        expect(parseFloat(expectProfitMargin)).toEqual(profitMargin);
      }).toPass();
    });

    await test.step(`Click "See detail"`, async () => {
      await catalogPage.clickSeeDetail();
      const totalCost = parseFloat(removeCurrencySymbol(await catalogPage.getDataPopup(4)));
      const firstItem = parseFloat(removeCurrencySymbol(await catalogPage.getShippingCostInPopUp(2, 1)));
      expect(totalCost).toEqual(productCost + firstItem);
    });

    await test.step(`Close popup > Click chọn MOQ > check profit margin`, async () => {
      await catalogPage.clickClosePopup();
      await catalogPage.clickElementWithLabel("div", `$${dataDailyPackQuantity[1].price}`);
      productCost = parseFloat(removeCurrencySymbol(dataDailyPackQuantity[1].price));

      const processingRate = parseFloat(removeCurrencySymbol(await catalogPage.getProcessingRateSODetail()));
      const expectProfitMargin = await catalogPage.calculatorProfitMargin(
        firstItem,
        processingRate,
        productCost,
        0.03,
        sellingPrice,
      );

      await expect(async () => {
        const profitMargin = await catalogPage.getProfitMargin();
        expect(parseFloat(expectProfitMargin)).toEqual(profitMargin);
      }).toPass();
    });
  });

  test(`@SB_PLB_MOQ_08 Verify profit margin trong màn import to store và product detail với SO config nhiều MOQ`, async ({
    dashboard,
    conf,
    odoo,
  }) => {
    const plusbasePage = new DropshipCatalogPage(dashboard, domain);
    const odooService = OdooService(odoo);

    await test.step(`Click "Import to your store" > Chuyển tab "Pricing" > Nhập selling price > verify product cost, profit margin`, async () => {
      await plusbasePage.goToProductRequestDetail(conf.suiteConf.product_id.aliexpress_request.more_moq);
      await plusbasePage.clickBtnImportToStore();

      const dataShipping = await odooService.getShippingDatas(
        conf.suiteConf.product_id.aliexpress_request.more_moq,
        "US",
      );

      const productCostActual = await plusbasePage.getDataTable(1, 1, 4);

      const sellingPriceActual = await plusbasePage.calculatorSellingPrice(
        Number(removeCurrencySymbol(productCostActual)),
      );

      const profitMarginActual = Number(removeCurrencySymbol(await plusbasePage.getDataTable(1, 1, 7)));

      const profit = await plusbasePage.calculatorProfitMargin(
        dataShipping.get("Standard Shipping").first_item_fee,
        4,
        Number(removeCurrencySymbol(productCostActual)),
        0.03,
        Number(removeCurrencySymbol(sellingPriceActual)),
      );

      expect(isEqual(profitMarginActual, Number(removeCurrencySymbol(profit)), 0.1)).toBeTruthy();
    });
  });

  test(`@SB_PLB_MOQ_10 Verify order detail với order có 2 line trong đó 1 line có product cost theo MOQ`, async ({
    authRequest,
    conf,
    page,
    odoo,
    multipleStore,
  }) => {
    const ordersPage = new OrdersPage(dashboardPage.page, domain);
    const odooService = OdooService(odoo);
    const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
    const productAPI = new ProductAPI(domain, authRequest);
    let baseCostAfterCheckout: number;
    let baseCostAfterReCalculator: number;
    let profitAfterReCalProfit: number;
    let profitBeforeReCalProfit: number;
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const productCheckout = conf.caseConf.product_checkout;
    const checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productCheckout });
    expect(checkoutInfo.order.id).toBeGreaterThan(0);

    await test.step(`Vào order detail order vừa tạo > Verify product cost và profit của order`, async () => {
      await ordersPage.goToOrderByOrderId(checkoutInfo.order.id);
      await ordersPage.waitForProfitCalculated();
      const orderSummary = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const profit = ordersPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual).toEqual(Number(profit.profit.toFixed(2)));
      profitBeforeReCalProfit = profitActual;
      baseCostAfterCheckout = orderSummary.base_cost;

      // call api re-calculator profit
      const authRequest = await multipleStore.getAuthRequest(
        conf.suiteConf.shop_template.username,
        conf.suiteConf.shop_template.password,
        conf.suiteConf.shop_template.domain,
        conf.suiteConf.shop_template.shop_id,
        conf.suiteConf.shop_template.user_id,
      );
      const orderPlbApi = new PlusbaseOrderAPI(conf.suiteConf.shop_template.domain, authRequest);

      await orderPlbApi.triggerReCalculatorProfit(conf.suiteConf.shop_id, checkoutInfo.order.id);

      // wait order trigger re calculator profit
      await ordersPage.page.waitForTimeout(3000);
      await ordersPage.goToOrderByOrderId(checkoutInfo.order.id);
      await ordersPage.waitForProfitCalculated();
      const orderSummaryAffterCalProfit = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const timeZone = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
      const today = formatDate(timeZone, "YYYY-MM-DD");

      // search all orders for the day of the product
      const products = await productAPI.getSbProductIdBySbcnProductId(conf.suiteConf.sbcn_product);

      const desireDay = new Date(timeZone);
      desireDay.setDate(desireDay.getDate() - 1);
      const yesterday = formatDate(desireDay, "YYYY-MM-DD");

      const dailyPackQty = await plusbaseOrderAPI.dailyPackQty(
        products,
        thresHold,
        {
          created_at_min: today,
          created_at_max: today,
        },
        {
          created_at_min: yesterday,
          created_at_max: yesterday,
        },
      );

      // get data MOQ of variant
      const dataMoqWithProductProductId = await odooService.sortDataMoqWithKey(conf.suiteConf.sbcn_product);

      // get product product mapping with sb variant
      const variantsMapping: Array<VariantMapping> = await productAPI.getVariantSbcnProductMapping(
        conf.suiteConf.sb_product_id,
      );

      // filter sbcn variant mapping of sb variant checkout
      const sbcnVariant = variantsMapping
        .filter(variant => variant.variant_id === productCheckout[0].variant_id)
        .map(variant => variant.sourcing_variant_id);

      const dataMoqOfVariant = dataMoqWithProductProductId.get(sbcnVariant[0]);

      let baseCostPack = dataMoqOfVariant[0].price;

      // Get all price with moq
      const packQuantityDefault = dataMoqOfVariant[0].price;

      // get base cost with moq
      for (const moq of dataMoqOfVariant) {
        if (moq.quantity > dailyPackQty) {
          break;
        } else {
          baseCostPack = moq.price;
        }
      }

      baseCostAfterReCalculator = orderSummaryAffterCalProfit.base_cost;

      // Chênh lệch base cost chính bằng giá base cost giảm theo từng quantity được tính moq
      expect(
        isEqual(
          roundingTwoDecimalPlaces(baseCostAfterCheckout - baseCostAfterReCalculator),
          roundingTwoDecimalPlaces((packQuantityDefault - baseCostPack) * productCheckout[0].quantity),
          0.01,
        ),
      ).toBe(true);

      const profitAfterCalculator = ordersPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummaryAffterCalProfit.base_cost,
        orderSummaryAffterCalProfit.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );

      const profitAfterCaculatorActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(isEqual(profitAfterCaculatorActual, profitAfterCalculator.profit, 0.01)).toBe(true);
      profitAfterReCalProfit = profitAfterCaculatorActual;
    });

    await test.step(`Click "View invoice"`, async () => {
      const orderApi = new OrderAPI(conf.suiteConf.domain, authRequest);
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
      const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);

      const profitCashBack = listTransaction.find(
        transaction =>
          transaction.details === `Casback from Pack Quantity Program for the order ${checkoutInfo.order.name}`,
      );

      if (profitCashBack) {
        expect(
          isEqual(
            profitCashBack.amount_cent,
            Number((profitAfterReCalProfit - profitBeforeReCalProfit).toFixed(2)),
            0.01,
          ),
        ).toBeTruthy();
      }
    });
  });

  test(`@SB_PLB_MOQ_11 Verify order detail với order có 2 line trong đó cả 2 line có product cost theo MOQ`, async ({
    authRequest,
    conf,
    page,
    odoo,
    multipleStore,
  }) => {
    const ordersPage = new OrdersPage(dashboardPage.page, domain);
    const odooService = OdooService(odoo);
    const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
    const productAPI = new ProductAPI(domain, authRequest);
    let baseCostAfterCheckout: number;
    let baseCostAfterReCalculator: number;
    let profitAfterReCalProfit: number;
    let profitBeforeReCalProfit: number;
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const productCheckout = conf.caseConf.product_checkout;
    let checkoutInfo: CheckoutInfo;

    await test.step(`Pre-condition`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productCheckout });
      expect(checkoutInfo.order.id).toBeGreaterThan(0);
    });

    await test.step(`Vào order detail order vừa tạo > Verify product cost và profit của order`, async () => {
      await ordersPage.goToOrderByOrderId(checkoutInfo.order.id);
      await ordersPage.waitForProfitCalculated();
      const orderSummary = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const profit = ordersPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );
      const profitActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitActual).toEqual(Number(profit.profit.toFixed(2)));
      profitBeforeReCalProfit = profitActual;
      baseCostAfterCheckout = orderSummary.base_cost;

      // call api re-calculator profit
      const authRequest = await multipleStore.getAuthRequest(
        conf.suiteConf.shop_template.username,
        conf.suiteConf.shop_template.password,
        conf.suiteConf.shop_template.domain,
        conf.suiteConf.shop_template.shop_id,
        conf.suiteConf.shop_template.user_id,
      );
      const orderPlbApi = new PlusbaseOrderAPI(conf.suiteConf.shop_template.domain, authRequest);

      await orderPlbApi.triggerReCalculatorProfit(conf.suiteConf.shop_id, checkoutInfo.order.id);

      // wait order trigger re calculator profit
      await expect(async () => {
        await ordersPage.goToOrderByOrderId(checkoutInfo.order.id);
        await ordersPage.waitForProfitCalculated();
        profitAfterReCalProfit = Number(removeCurrencySymbol(await ordersPage.getProfit()));
        expect(profitAfterReCalProfit).toBeGreaterThan(profitBeforeReCalProfit);
      }).toPass();

      const orderSummaryAffterCalProfit = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const timeZone = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
      const today = formatDate(timeZone, "YYYY-MM-DD");

      // search all orders for the day of the product
      const products = await productAPI.getSbProductIdBySbcnProductId(conf.suiteConf.sbcn_product);

      const desireDay = new Date(timeZone);
      desireDay.setDate(desireDay.getDate() - 1);
      const yesterday = formatDate(desireDay, "YYYY-MM-DD");

      const dailyPackQty = await plusbaseOrderAPI.dailyPackQty(
        products,
        thresHold,
        {
          created_at_min: today,
          created_at_max: today,
        },
        {
          created_at_min: yesterday,
          created_at_max: yesterday,
        },
      );

      // get data MOQ of variant
      const dataMoqWithProductProductId = await odooService.sortDataMoqWithKey(conf.suiteConf.sbcn_product);

      // get product product mapping with sb variant
      const variantsMapping: Array<VariantMapping> = await productAPI.getVariantSbcnProductMapping(
        conf.suiteConf.sb_product_id,
      );

      // filter sbcn variant mapping of sb variant checkout
      const sbcnVariant = variantsMapping
        .filter(variant => variant.variant_id === productCheckout[0].variant_id)
        .map(variant => variant.sourcing_variant_id);

      const dataMoqOfVariant = dataMoqWithProductProductId.get(sbcnVariant[0]);

      let baseCostPack = dataMoqOfVariant[0].price;

      // Get all price with moq
      const packQuantityDefault = dataMoqOfVariant[0].price;

      // get base cost with moq
      for (const moq of dataMoqOfVariant) {
        if (moq.quantity > dailyPackQty) {
          break;
        } else {
          baseCostPack = moq.price;
        }
      }

      baseCostAfterReCalculator = orderSummaryAffterCalProfit.base_cost;

      // Chênh lệch base cost chính bằng giá base cost giảm theo từng quantity được tính moq
      expect(roundingTwoDecimalPlaces(baseCostAfterCheckout - baseCostAfterReCalculator)).toEqual(
        roundingTwoDecimalPlaces((packQuantityDefault - baseCostPack) * productCheckout[0].quantity),
      );

      const profitAfterCalculator = ordersPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummaryAffterCalProfit.base_cost,
        orderSummaryAffterCalProfit.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );

      const profitAfterCaculatorActual = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitAfterCaculatorActual).toEqual(roundingTwoDecimalPlaces(profitAfterCalculator.profit));
      profitAfterReCalProfit = profitAfterCaculatorActual;
    });

    await test.step(`Click "View invoice"`, async () => {
      const orderApi = new OrderAPI(conf.suiteConf.domain, authRequest);
      const invoiceData = await orderApi.getInvoiceByOrderId(checkoutInfo.order.id);
      const listTransaction = await balanceAPI.getDataTransaction(invoiceData.id);

      const profitCashBack = listTransaction.find(
        transaction =>
          transaction.details === `Casback from Pack Quantity Program for the order ${checkoutInfo.order.name}`,
      );
      expect(isEqual(profitCashBack.amount_cent, profitAfterReCalProfit - profitBeforeReCalProfit, 0.01)).toBe(true);
    });
  });

  test(`@SB_PLB_MOQ_17 Verify analytics của store sau khi order được tính lại profit trong trường hợp profit của order thay đổi`, async ({
    page,
    conf,
    authRequest,
    multipleStore,
  }) => {
    const ordersPage = new OrdersPage(dashboardPage.page, domain);
    const plusbaseOrderAPI = new PlusbaseOrderAPI(domain, authRequest);
    const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    const productCheckout = conf.caseConf.product_checkout;
    let checkoutInfo: CheckoutInfo;
    let profitBeforeReCalProfit: number;
    let profitAfterReCalProfit: number;

    const analyticsPage = new AnalyticsPage(page, domain, authRequest);
    const today = await analyticsPage.formatDate(await analyticsPage.getDateXDaysAgo(0));
    const initData: DataAnalytics = conf.suiteConf.data_analytics;
    dataAnalyticsBefore = await analyticsPage.getDataAnalyticsAPIDashboard(
      authRequest,
      conf.suiteConf.shop_id,
      today,
      initData,
      "total_profit",
    );

    await test.step(`Vào order detail order vừa tạo > Verify product cost và profit của order`, async () => {
      checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout: productCheckout });
      expect(checkoutInfo.order.id).toBeGreaterThan(0);
      await ordersPage.goToOrderByOrderId(checkoutInfo.order.id);
      await ordersPage.waitForProfitCalculated();
      const orderSummary = await ordersPage.getOrderSummaryInOrderDetail(plusbaseOrderAPI);

      const profit = ordersPage.calculateProfitPlusbase(
        checkoutInfo.totals.total_price,
        checkoutInfo.totals.subtotal_price,
        checkoutInfo.totals.total_discounts,
        orderSummary.base_cost,
        orderSummary.shipping_cost,
        checkoutInfo.totals.shipping_fee,
        conf.suiteConf.tax_include,
        checkoutInfo.totals.total_tipping,
        conf.suiteConf.payment_rate,
        conf.suiteConf.processing_rate,
      );
      profitBeforeReCalProfit = Number(removeCurrencySymbol(await ordersPage.getProfit()));
      expect(profitBeforeReCalProfit).toEqual(Number(profit.profit.toFixed(2)));
    });

    await test.step(`Vào "Analytics" > Filter theo store > Verify total profit`, async () => {
      await expect(async () => {
        dataAnalyticsAfterCheckout = await analyticsPage.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );

        expect(
          isEqual(
            dataAnalyticsAfterCheckout.summary.total_profit - profitBeforeReCalProfit,
            dataAnalyticsBefore.summary.total_profit,
            0.01,
          ),
        ).toBe(true);
      }).toPass();
    });

    await test.step(`Ngày hôm sau > Vào analytics check total profit > Bắn queue tính lại profit của order trong ngày > Check total profit trong analytics`, async () => {
      const authRequestTpl = await multipleStore.getAuthRequest(
        conf.suiteConf.shop_template.username,
        conf.suiteConf.shop_template.password,
        conf.suiteConf.shop_template.domain,
        conf.suiteConf.shop_template.shop_id,
        conf.suiteConf.shop_template.user_id,
      );
      const orderPlbApi = new PlusbaseOrderAPI(conf.suiteConf.shop_template.domain, authRequestTpl);
      await orderPlbApi.triggerReCalculatorProfit(conf.suiteConf.shop_id, checkoutInfo.order.id);

      await expect(async () => {
        await ordersPage.goToOrderByOrderId(checkoutInfo.order.id);
        await ordersPage.waitForProfitCalculated();
        profitAfterReCalProfit = Number(removeCurrencySymbol(await ordersPage.getProfit()));
        expect(profitAfterReCalProfit).toBeGreaterThan(profitBeforeReCalProfit);
      }).toPass();

      await expect(async () => {
        dataAnalyticsAfterReCalProfit = await analyticsPage.getDataAnalyticsAPIDashboard(
          authRequest,
          conf.suiteConf.shop_id,
          today,
          initData,
          "total_profit",
        );

        expect(
          isEqual(
            dataAnalyticsAfterReCalProfit.summary.total_profit - dataAnalyticsAfterCheckout.summary.total_profit,
            profitAfterReCalProfit - profitBeforeReCalProfit,
            0.01,
          ),
        ).toBe(true);
      }).toPass();
    });
  });
});
