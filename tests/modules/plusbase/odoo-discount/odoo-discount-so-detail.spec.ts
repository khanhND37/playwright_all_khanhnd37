import { expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { float } from "aws-sdk/clients/lightsail";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { RequestProductData, SOInfo, SaleOrder } from "@types";
import { formatDate } from "@core/utils/datetime";
import { CatalogAPI } from "@pages/api/dashboard/catalog";

let dashboardPage: DashboardPage;
let shopDomain: string;
let odooService: OdooServiceInterface;
let soDetail, soOrigin: SOInfo;
let catalogPage: DropshipCatalogPage;
let productTempID: number;
let map: Map<number, string>;
let processingRate: number;
let sellingPriceExpect: string;
let sellingPriceActual: string;
let totalCostExpect: string;
let totalCostActual: string;
let profitMarginActual: float;
let profitMarginExpect: string;
let quotationId: number;
let catalogAPI: CatalogAPI;

test.describe("SO detail khi SO được apply discount", async () => {
  test.beforeEach(async ({ conf, odoo, dashboard, authRequest }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    productTempID = conf.caseConf.product_template_id;
    odooService = OdooService(odoo);
    processingRate = conf.suiteConf.processing_rate;
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    catalogPage = new DropshipCatalogPage(dashboardPage.page, shopDomain);
    catalogAPI = new CatalogAPI(shopDomain, authRequest);
  });

  test(`@SB_PLB_DQ_20 Verify SO detail trường hợp SO được apply discount và các variant có discount khác nhau`, async ({
    conf,
  }) => {
    let productCostBeforeDiscount, productCostAfterDiscount: float;
    let startDate, startTime: string;
    let endDate, endTime: string;

    await test.step(`Vào dashboard store > Vào SO detail`, async () => {
      //update discount
      const dataQuotation: Array<SaleOrder> = await odooService.getQuotationByProductId(
        productTempID,
        null,
        conf.suiteConf.odoo_partner_id,
      );
      quotationId = dataQuotation[0].id;
      const setStartDate: Date = new Date();
      setStartDate.setHours(new Date().getUTCHours());
      setStartDate.setDate(new Date().getUTCDate());
      setStartDate.setMonth(new Date().getUTCMonth());
      const setEndDate: Date = new Date();
      setEndDate.setHours(new Date().getUTCHours() + 1);
      setEndDate.setDate(new Date().getUTCDate());
      setEndDate.setMonth(new Date().getUTCMonth());

      await odooService.updateQuotation(quotationId, {
        x_discount_time_from: formatDate(setStartDate, "YYYY-MM-DD HH:mm:ss"),
        x_discount_time_to: formatDate(setEndDate, "YYYY-MM-DD HH:mm:ss"),
      });

      //Get SO infor trên odoo
      soDetail = await odooService.getSOInfo(productTempID, conf.suiteConf.odoo_partner_id);

      // verify hiển thị thời gian discount
      await catalogPage.goToProductRequestDetail(productTempID);
      const discountFrom = new Date(soDetail.from_time);
      discountFrom.setHours(discountFrom.getHours() + 7);
      startDate = formatDate(discountFrom.toLocaleString("en-US"), "MMM DD, YYYY");
      startTime = formatDate(discountFrom, "HH:mm A");
      const discountTo = new Date(soDetail.to_time);
      discountTo.setHours(discountTo.getHours() + 7);
      endDate = formatDate(discountTo.toLocaleString("en-US"), "MMM DD, YYYY");
      endTime = formatDate(discountTo, "HH:mm A");
      map = await catalogAPI.getVariantInfoByID(productTempID);

      let minPrice = Number((soDetail.variants[0].unit_price - soDetail.variants[0].discount_amount).toFixed(2));
      for (let i = 1; i < soDetail.variants.length; i++) {
        if (Number((soDetail.variants[i].unit_price - soDetail.variants[i].discount_amount).toFixed(2)) < minPrice) {
          minPrice = Number((soDetail.variants[i].unit_price - soDetail.variants[i].discount_amount).toFixed(2));
        }
      }

      const dataShipping = await odooService.getShippingDatas(productTempID, "US");
      const shippingFee = dataShipping.get("Standard Shipping").first_item_fee;
      for (const variant of soDetail.variants) {
        const variantNames = map.get(variant.id).split("/");
        for (let i = 0; i < variantNames.length; i++) {
          await catalogPage.clickOnBtnWithLabel(variantNames[i].trim());
        }
        //product cost + percent discount
        productCostBeforeDiscount = await catalogPage.getProductCost();
        expect(productCostBeforeDiscount).toEqual(variant.unit_price);
        if (variant.discount_amount > 0) {
          productCostAfterDiscount = await catalogPage.getProductCost(2);
          expect(productCostAfterDiscount).toEqual(Number((variant.unit_price - variant.discount_amount).toFixed(2)));
          const percentDiscount = (variant.discount_amount / productCostBeforeDiscount) * 100;
          expect(await catalogPage.isTextVisible(`${percentDiscount.toFixed(2)}% OFF`)).toBe(true);
          expect(
            await catalogPage.isTextVisible(
              `Enjoy PlusBase exclusive discount, applicable from ${startDate}, ${startTime} to ${endDate}, ${endTime}`,
            ),
          ).toBe(true);
        } else productCostAfterDiscount = productCostBeforeDiscount;

        //selling price / total cost
        sellingPriceActual = await catalogPage.getSellingPrice();
        totalCostActual = await catalogPage.getTotalCost();
        sellingPriceExpect = await catalogPage.calculatorSellingPrice(productCostAfterDiscount);
        expect(sellingPriceActual).toEqual(sellingPriceExpect);
        totalCostExpect = await catalogPage.calculatorTotalCost(shippingFee, minPrice);
        expect(totalCostActual).toEqual(totalCostExpect);

        //Profit margin
        profitMarginActual = await catalogPage.getProfitMargin();
        profitMarginExpect = await catalogPage.calculatorProfitMargin(
          shippingFee,
          processingRate,
          productCostAfterDiscount,
          0.03,
          Number(sellingPriceActual),
        );
        expect(profitMarginActual).toEqual(Number(profitMarginExpect));
      }
    });

    await test.step(`Verify timeline SO`, async () => {
      expect(
        await catalogPage.isTextVisible(
          `Product has been discounted from ${startDate}, ${startTime} to ${endDate}, ${endTime}`,
        ),
      ).toBe(true);
    });
  });

  test(`@SB_PLB_DQ_08 Verify SO detail ngoài thời gian discount ( discount time trong quá khứ)`, async ({ conf }) => {
    let productCost: float;
    let startDate, startTime: string;
    let endDate, endTime: string;
    await test.step(`Vào dashboard view SO detail >Verify selling price, base cost, total cost của từng variant`, async () => {
      //update discount time
      const dataQuotation: Array<SaleOrder> = await odooService.getQuotationByProductId(
        productTempID,
        null,
        conf.suiteConf.odoo_partner_id,
      );
      quotationId = dataQuotation[0].id;
      const setStartDate: Date = new Date();
      setStartDate.setHours(new Date().getUTCHours() - 2);
      setStartDate.setDate(new Date().getUTCDate());
      setStartDate.setMonth(new Date().getUTCMonth());
      const setEndDate: Date = new Date();
      setEndDate.setHours(new Date().getUTCHours() - 1);
      setEndDate.setDate(new Date().getUTCDate());
      setEndDate.setMonth(new Date().getUTCMonth());

      await odooService.updateQuotation(quotationId, {
        x_discount_time_from: formatDate(setStartDate, "YYYY-MM-DD HH:mm:ss"),
        x_discount_time_to: formatDate(setEndDate, "YYYY-MM-DD HH:mm:ss"),
      });

      //Get SO infor trên odoo
      soDetail = await odooService.getSOInfo(productTempID, conf.suiteConf.odoo_partner_id);
      await catalogPage.goToProductRequestDetail(productTempID);
      map = await catalogAPI.getVariantInfoByID(productTempID);
      const discountFrom = new Date(soDetail.from_time);
      discountFrom.setHours(discountFrom.getHours() + 7);
      startDate = formatDate(discountFrom.toLocaleString("en-US"), "MMM DD, YYYY");
      startTime = formatDate(discountFrom, "HH:mm A");
      const discountTo = new Date(soDetail.to_time);
      discountTo.setHours(discountTo.getHours() + 7);
      endDate = formatDate(discountTo.toLocaleString("en-US"), "MMM DD, YYYY");
      endTime = formatDate(discountTo, "HH:mm A");

      let minPrice = Number(soDetail.variants[0].unit_price.toFixed(2));
      for (let i = 1; i < soDetail.variants.length; i++) {
        if (Number(soDetail.variants[i].unit_price.toFixed(2)) < minPrice) {
          minPrice = Number(soDetail.variants[i].unit_price.toFixed(2));
        }
      }

      const dataShipping = await odooService.getShippingDatas(productTempID, "US");
      const shippingFee = dataShipping.get("Standard Shipping").first_item_fee;
      for (const variant of soDetail.variants) {
        const variantNames = map.get(variant.id).split("/");
        for (let i = 0; i < variantNames.length; i++) {
          await catalogPage.clickOnBtnWithLabel(variantNames[i].trim());
        }
        //product cost + percent discount
        productCost = await catalogPage.getProductCost();
        expect(productCost).toEqual(variant.unit_price);
        const percentDiscount = (variant.discount_amount / productCost) * 100;
        expect(await catalogPage.isTextVisible(`${percentDiscount.toFixed(2)}% OFF`)).toBe(false);
        expect(
          await catalogPage.isTextVisible(
            `Enjoy PlusBase exclusive discount, applicable from ${startDate}, ${startTime} to ${endDate}, ${endTime}`,
          ),
        ).toBe(false);

        //selling price / total cost
        sellingPriceActual = await catalogPage.getSellingPrice();
        totalCostActual = await catalogPage.getTotalCost();
        sellingPriceExpect = await catalogPage.calculatorSellingPrice(productCost);
        expect(sellingPriceActual).toEqual(sellingPriceExpect);
        totalCostExpect = await catalogPage.calculatorTotalCost(shippingFee, minPrice);
        expect(totalCostActual).toEqual(totalCostExpect);

        //Profit margin
        profitMarginActual = await catalogPage.getProfitMargin();
        profitMarginExpect = await catalogPage.calculatorProfitMargin(
          shippingFee,
          processingRate,
          productCost,
          0.03,
          Number(sellingPriceActual),
        );
        expect(profitMarginActual).toEqual(Number(profitMarginExpect));
      }
    });

    await test.step(`Verify timeline SO`, async () => {
      expect(
        await catalogPage.isTextVisible(
          `Product has been discounted from ${startDate}, ${startTime} to ${endDate}, ${endTime}`,
        ),
      ).toBe(true);
    });
  });

  test(`@SB_PLB_DQ_21 Verify SO detail ngoài thời gian discount (  discount time là thời gian trong tương lai)`, async ({
    conf,
  }) => {
    let productCost: float;
    let startDate, startTime: string;
    let endDate, endTime: string;

    await test.step(`Update discount time là thời gian trong tương lai > Vào dashboard view SO detail > Verify selling price, base cost, total cost của từng variant`, async () => {
      //update discount time
      const dataQuotation: Array<SaleOrder> = await odooService.getQuotationByProductId(
        productTempID,
        null,
        conf.suiteConf.odoo_partner_id,
      );
      quotationId = dataQuotation[0].id;
      const setStartDate: Date = new Date();
      const setDiscountFrom = new Date(setStartDate.getTime() + 1000 * 60 * 60 * 72);
      const setEndDate: Date = new Date();
      const setDiscountTo = new Date(setEndDate.getTime() + 1000 * 60 * 60 * 96);
      await odooService.updateQuotation(quotationId, {
        x_discount_time_from: formatDate(setDiscountFrom, "YYYY-MM-DD HH:mm:ss"),
        x_discount_time_to: formatDate(setDiscountTo, "YYYY-MM-DD HH:mm:ss"),
      });

      //Get SO infor trên odoo
      soDetail = await odooService.getSOInfo(productTempID, conf.suiteConf.odoo_partner_id);
      await catalogPage.goToProductRequestDetail(productTempID);
      map = await catalogAPI.getVariantInfoByID(productTempID);
      const discountFrom = new Date(soDetail.from_time);
      discountFrom.setHours(discountFrom.getHours() + 7);
      startDate = formatDate(discountFrom.toLocaleString("en-US"), "MMM DD, YYYY");
      startTime = formatDate(discountFrom, "HH:mm A");
      const discountTo = new Date(soDetail.to_time);
      discountTo.setHours(discountTo.getHours() + 7);
      endDate = formatDate(discountTo.toLocaleString("en-US"), "MMM DD, YYYY");
      endTime = formatDate(discountTo, "HH:mm A");

      let minPrice = Number(soDetail.variants[0].unit_price.toFixed(2));
      for (let i = 1; i < soDetail.variants.length; i++) {
        if (Number(soDetail.variants[i].unit_price.toFixed(2)) < minPrice) {
          minPrice = Number(soDetail.variants[i].unit_price.toFixed(2));
        }
      }

      const dataShipping = await odooService.getShippingDatas(productTempID, "US");
      const shippingFee = dataShipping.get("Standard Shipping").first_item_fee;
      for (const variant of soDetail.variants) {
        const variantNames = map.get(variant.id).split("/");
        for (let i = 0; i < variantNames.length; i++) {
          await catalogPage.clickOnBtnWithLabel(variantNames[i].trim());
        }
        //product cost + percent discount
        productCost = await catalogPage.getProductCost();
        expect(productCost).toEqual(variant.unit_price);
        const percentDiscount = (variant.discount_amount / productCost) * 100;
        expect(await catalogPage.isTextVisible(`${percentDiscount.toFixed(2)}% OFF`)).toBe(false);
        expect(
          await catalogPage.isTextVisible(
            `Enjoy PlusBase exclusive discount, applicable from ${startDate}, ${startTime} to ${endDate}, ${endTime}`,
          ),
        ).toBe(false);

        //selling price / total cost
        sellingPriceActual = await catalogPage.getSellingPrice();
        totalCostActual = await catalogPage.getTotalCost();
        sellingPriceExpect = await catalogPage.calculatorSellingPrice(productCost);
        expect(sellingPriceActual).toEqual(sellingPriceExpect);
        totalCostExpect = await catalogPage.calculatorTotalCost(shippingFee, minPrice);
        expect(totalCostActual).toEqual(totalCostExpect);

        //Profit margin
        profitMarginActual = await catalogPage.getProfitMargin();
        profitMarginExpect = await catalogPage.calculatorProfitMargin(
          shippingFee,
          processingRate,
          productCost,
          0.03,
          Number(sellingPriceActual),
        );
        expect(profitMarginActual).toEqual(Number(profitMarginExpect));
      }
    });

    await test.step(`Verify timeline SO`, async () => {
      expect(
        await catalogPage.isTextVisible(
          `Product has been discounted from ${startDate}, ${startTime} to ${endDate}, ${endTime}`,
        ),
      ).toBe(true);
    });
  });

  test(`@SB_PLB_DQ_05 Verify SO mới không duplicate từ SO cũ trường hợp field Not duplicate price của SO cũ được check.`, async ({
    conf,
    odoo,
    multipleStore,
  }) => {
    const aliUrlRes = conf.caseConf.urls_request[0].ali_url;
    const state = conf.caseConf.urls_request[0].state;
    const domainStoreDup = conf.suiteConf.store_dup["domain"];
    let storeDupDashboardPage: DashboardPage;
    let catalogPageStoreDup: DropshipCatalogPage;
    let plusbaseProductAPIStoreDup: PlusbaseProductAPI;
    let plusbaseProductAPIStoreOrigin: PlusbaseProductAPI;
    let productCost: float;
    let catalogAPIStoreDup: CatalogAPI;
    let productTemplateId: number;
    let productTemplateIdDup: number;
    let durationDiscount;
    await test.step(`Vào dashboard store A > Request product ali > Sent quotation > notify to merchant`, async () => {
      const storeOriginAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shopDomain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );

      catalogAPI = new CatalogAPI(shopDomain, storeOriginAuth);
      plusbaseProductAPIStoreOrigin = new PlusbaseProductAPI(shopDomain, storeOriginAuth);

      // Delete product before request
      await catalogPage.cleanProductAfterRequest(
        odoo,
        plusbaseProductAPIStoreOrigin,
        {
          url: aliUrlRes,
          odoo_partner_id: conf.suiteConf.odoo_partner_id,
          cancel_reason_id: conf.suiteConf.cancel_reason_id,
          skip_if_not_found: true,
        },
        true,
        true,
      );

      //Request ali product
      const aliProduct: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: aliUrlRes, note: "" }],
        is_plus_base: true,
      };
      await catalogPage.goToProductRequest();
      await plusbaseProductAPIStoreOrigin.requestProductByAPI(aliProduct);
      await catalogPage.searchAndClickViewRequestDetail(aliUrlRes);
      await catalogPage.waitForCrawlSuccess(state);

      //Get product id
      productTemplateId = await plusbaseProductAPIStoreOrigin.getProductTmplIDByUrl(
        plusbaseProductAPIStoreOrigin,
        aliUrlRes,
        20,
      );
      expect(productTemplateId > 0).toEqual(true);

      // Sent quotation
      const confSaleOrder = {
        validity_date: conf.caseConf.expiration,
        x_minimum_order_quantity: conf.caseConf.minimun_order_quantity,
        x_minimum_order_value: conf.caseConf.minimun_order_value,
        x_estimated_delivery: conf.caseConf.estimated_delivery,
        x_quote_based_on: conf.caseConf.is_base_on_for_all_variants,
      };

      //Set discount time
      const setStartDate: Date = new Date();
      setStartDate.setHours(new Date().getUTCHours());
      setStartDate.setDate(new Date().getUTCDate());
      setStartDate.setMonth(new Date().getUTCMonth());
      const setEndDate: Date = new Date();
      setEndDate.setHours(new Date().getUTCHours() + 2);
      setEndDate.setDate(new Date().getUTCDate());
      setEndDate.setMonth(new Date().getUTCMonth());

      //Update product level
      await odooService.updateProductTemplate([productTemplateId], {
        x_product_level_list: false,
        x_use_aliexpress_rating: false,
      });

      //update product template và sent quotation
      await odooService.updateProductAndSentQuotationWithOptions(
        productTemplateId,
        {
          x_warehouse_id: conf.caseConf.stock_warehouse_id,
          x_delivery_carrier_type_ids: [[6, false, conf.caseConf.shipping_method_ids]],
          x_weight: conf.caseConf.weight,
        },
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: 1,
          x_discount_time_from: formatDate(setStartDate, "YYYY-MM-DD HH:mm:ss"),
          x_discount_time_to: formatDate(setEndDate, "YYYY-MM-DD HH:mm:ss"),
          x_not_duplicate_price: true,
        },
        { price_unit: conf.caseConf.unit_price, x_discount_amount: conf.caseConf.discount_amount },
        true,
        true,
        true,
        true,
      );

      const quotation: Array<SaleOrder> = await odooService.getQuotationByProductId(productTemplateId, ["id", "state"]);
      expect(quotation[0]["state"]).toEqual("sent");

      //Verify hiển thị thời gian discount trong SO detail
      await catalogPage.page.reload();
      await catalogPage.waitForQuotationDetailLoaded();
      soOrigin = await odooService.getSOInfo(productTemplateId, conf.suiteConf.odoo_partner_id);
      durationDiscount = await catalogPage.getDiscountTimeSO(soOrigin);

      expect(
        await catalogPage.isTextVisible(`Enjoy PlusBase exclusive discount, applicable from ${durationDiscount}`),
      ).toBe(true);
    });

    await test.step(`Vào dashboard store B > Request product cùng link với store A > Vào SO detail`, async () => {
      const storeDupPage = await multipleStore.getDashboardPage(
        conf.suiteConf.store_dup["username"],
        conf.suiteConf.store_dup["password"],
        domainStoreDup,
        conf.suiteConf.store_dup["shop_id"],
        conf.suiteConf.store_dup["user_id"],
      );

      storeDupDashboardPage = new DashboardPage(storeDupPage, domainStoreDup);
      const storeDupAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.store_dup["username"],
        conf.suiteConf.store_dup["password"],
        domainStoreDup,
        conf.suiteConf.store_dup["shop_id"],
        conf.suiteConf.store_dup["user_id"],
      );

      catalogPageStoreDup = new DropshipCatalogPage(storeDupDashboardPage.page, domainStoreDup);
      plusbaseProductAPIStoreDup = new PlusbaseProductAPI(domainStoreDup, storeDupAuth);
      catalogAPIStoreDup = new CatalogAPI(domainStoreDup, storeDupAuth);

      const aliProduct: RequestProductData = {
        user_id: parseInt(conf.suiteConf.store_dup["user_id"]),
        products: [{ url: aliUrlRes, note: "" }],
        is_plus_base: true,
      };
      await catalogPageStoreDup.goToProductRequest();
      await plusbaseProductAPIStoreDup.requestProductByAPI(aliProduct);
      await catalogPageStoreDup.searchAndClickViewRequestDetail(aliUrlRes);
      await catalogPageStoreDup.waitForCrawlSuccess(state);
      await catalogPageStoreDup.page.reload();
      await catalogPageStoreDup.waitForQuotationDetailLoaded();

      //Get product id
      productTemplateIdDup = await plusbaseProductAPIStoreOrigin.getProductTmplIDByUrl(
        plusbaseProductAPIStoreOrigin,
        aliUrlRes,
        20,
      );
      expect(productTemplateIdDup).toEqual(productTemplateId);
      await expect(async () => {
        const quotation: Array<SaleOrder> = await odooService.getQuotationByProductId(
          productTemplateId,
          null,
          conf.suiteConf.store_dup["odoo_partner_id"],
        );

        expect(quotation[0].state).toEqual("sent");
      }).toPass();
    });

    await test.step(`Verify profit margin của từng variant`, async () => {
      map = await catalogAPIStoreDup.getVariantInfoByID(productTemplateId);
      await catalogPageStoreDup.page.reload();
      await catalogPageStoreDup.waitForQuotationDetailLoaded();

      //Verify SO detail
      expect(
        await catalogPageStoreDup.isTextVisible(
          `Enjoy PlusBase exclusive discount, applicable from ${durationDiscount}`,
        ),
      ).toBe(false);

      let minPrice = Number(soOrigin.variants[0].unit_price.toFixed(2));
      for (let i = 1; i < soOrigin.variants.length; i++) {
        if (Number(soOrigin.variants[i].unit_price.toFixed(2)) < minPrice) {
          minPrice = Number(soOrigin.variants[i].unit_price.toFixed(2));
        }
      }

      const dataShipping = await odooService.getShippingDatas(productTemplateId, "US");
      const shippingFee = dataShipping.get("Standard Shipping").first_item_fee;
      const variants = [];
      map.forEach((value, key) => {
        const variantNames = map.get(key);
        variants.push(variantNames);
      });
      for (const name of variants) {
        const variantNames = name.split("/");
        for (let i = 0; i < variantNames.length; i++) {
          await catalogPageStoreDup.clickOnBtnWithLabel(variantNames[i].trim());
        }
        //product cost + percent discount
        productCost = await catalogPageStoreDup.getProductCost();
        expect(productCost).toEqual(soOrigin.variants[0].unit_price);
        const percentDiscount = (soOrigin.variants[0].discount_amount / productCost) * 100;
        expect(await catalogPageStoreDup.isTextVisible(`${percentDiscount.toFixed(2)}% OFF`)).toBe(false);

        //selling price / total cost
        sellingPriceActual = await catalogPageStoreDup.getSellingPrice();
        totalCostActual = await catalogPageStoreDup.getTotalCost();
        sellingPriceExpect = await catalogPageStoreDup.calculatorSellingPrice(productCost);
        expect(sellingPriceActual).toEqual(sellingPriceExpect);
        totalCostExpect = await catalogPageStoreDup.calculatorTotalCost(shippingFee, minPrice);
        expect(totalCostActual).toEqual(totalCostExpect);

        //Profit margin
        profitMarginActual = await catalogPageStoreDup.getProfitMargin();
        profitMarginExpect = await catalogPageStoreDup.calculatorProfitMargin(
          shippingFee,
          processingRate,
          productCost,
          0.03,
          Number(sellingPriceActual),
        );
        expect(profitMarginActual.toString()).toEqual(profitMarginExpect);
      }
    });
  });

  test(`@SB_PLB_DQ_06 Verify SO mới được duplicate từ SO cũ trường hợp field Not duplicate của SO cũ không được check`, async ({
    conf,
    multipleStore,
    odoo,
  }) => {
    const aliUrlRes = conf.caseConf.urls_request[0].ali_url;
    const state = conf.caseConf.urls_request[0].state;
    const domainStoreDup = conf.suiteConf.store_dup["domain"];
    let storeDupDashboardPage: DashboardPage;
    let catalogPageStoreDup: DropshipCatalogPage;
    let plusbaseProductAPIStoreDup: PlusbaseProductAPI;
    let productCostBeforeDiscount, productCostAfterDiscount: float;
    let catalogAPIStoreDup: CatalogAPI;
    let productTemplateId: number;
    let productTemplateIdDup: number;
    let plusbaseProductAPIStoreOrigin: PlusbaseProductAPI;
    let durationDiscount;
    await test.step(`Vào dashboard store A > Request product ali > Sent quotation > notify to merchant`, async () => {
      const storeOriginAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shopDomain,
        conf.suiteConf.shop_id,
        conf.suiteConf.user_id,
      );

      catalogAPI = new CatalogAPI(shopDomain, storeOriginAuth);
      plusbaseProductAPIStoreOrigin = new PlusbaseProductAPI(shopDomain, storeOriginAuth);

      // Delete product before request
      await catalogPage.cleanProductAfterRequest(
        odoo,
        plusbaseProductAPIStoreOrigin,
        {
          url: aliUrlRes,
          odoo_partner_id: conf.suiteConf.odoo_partner_id,
          cancel_reason_id: conf.suiteConf.cancel_reason_id,
          skip_if_not_found: true,
        },
        true,
        true,
      );

      //Request ali product
      const aliProduct: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: aliUrlRes, note: "" }],
        is_plus_base: true,
      };
      await catalogPage.goToProductRequest();
      await plusbaseProductAPIStoreOrigin.requestProductByAPI(aliProduct);
      await catalogPage.searchAndClickViewRequestDetail(aliUrlRes);
      await catalogPage.waitForCrawlSuccess(state);
      //Get product id
      productTemplateId = await plusbaseProductAPIStoreOrigin.getProductTmplIDByUrl(
        plusbaseProductAPIStoreOrigin,
        aliUrlRes,
        20,
      );
      expect(productTemplateId > 0).toEqual(true);

      // Sent quotation
      const confSaleOrder = {
        validity_date: conf.caseConf.expiration,
        x_minimum_order_quantity: conf.caseConf.minimun_order_quantity,
        x_minimum_order_value: conf.caseConf.minimun_order_value,
        x_estimated_delivery: conf.caseConf.estimated_delivery,
        x_quote_based_on: conf.caseConf.is_base_on_for_all_variants,
      };
      //Set time discount
      const setStartDate: Date = new Date();
      setStartDate.setHours(new Date().getUTCHours());
      setStartDate.setDate(new Date().getUTCDate());
      setStartDate.setMonth(new Date().getUTCMonth());
      const setEndDate: Date = new Date();
      setEndDate.setHours(new Date().getUTCHours() + 2);
      setEndDate.setDate(new Date().getUTCDate());
      setEndDate.setMonth(new Date().getUTCMonth());

      //Update product level
      await odooService.updateProductTemplate([productTemplateId], {
        x_product_level_list: false,
        x_use_aliexpress_rating: false,
      });

      //Update product template và sent quotation
      await odooService.updateProductAndSentQuotationWithOptions(
        productTemplateId,
        {
          x_warehouse_id: conf.caseConf.stock_warehouse_id,
          x_delivery_carrier_type_ids: [[6, false, conf.caseConf.shipping_method_ids]],
          x_weight: conf.caseConf.weight,
        },
        {
          validity_date: confSaleOrder.validity_date,
          x_minimum_order_quantity: confSaleOrder.x_minimum_order_quantity,
          x_minimum_order_value: confSaleOrder.x_minimum_order_value,
          x_estimated_delivery: confSaleOrder.x_estimated_delivery,
          x_quote_based_on: confSaleOrder.x_quote_based_on,
          payment_term_id: 1,
          x_discount_time_from: formatDate(setStartDate, "YYYY-MM-DD HH:mm:ss"),
          x_discount_time_to: formatDate(setEndDate, "YYYY-MM-DD HH:mm:ss"),
          x_not_duplicate_price: false,
        },
        { price_unit: conf.caseConf.unit_price, x_discount_amount: conf.caseConf.discount_amount },
        true,
        true,
        true,
        true,
      );

      const quotation: Array<SaleOrder> = await odooService.getQuotationByProductId(productTemplateId, ["id", "state"]);
      expect(quotation[0]["state"]).toEqual("sent");

      //Verify discount time trong SO detail
      await catalogPage.page.reload();
      await catalogPage.waitForQuotationDetailLoaded();
      soOrigin = await odooService.getSOInfo(productTemplateId, conf.suiteConf.odoo_partner_id);
      durationDiscount = await catalogPage.getDiscountTimeSO(soOrigin);
      expect(
        await catalogPage.isTextVisible(`Enjoy PlusBase exclusive discount, applicable from ${durationDiscount}`),
      ).toBe(true);
    });

    await test.step(`Vào dashboard store B > Request product cùng link với store A > Vào odoo > Sale > Search SO name > Vào SO detail > Verify data SO`, async () => {
      const storeDupPage = await multipleStore.getDashboardPage(
        conf.suiteConf.store_dup["username"],
        conf.suiteConf.store_dup["password"],
        domainStoreDup,
        conf.suiteConf.store_dup["shop_id"],
        conf.suiteConf.store_dup["user_id"],
      );

      storeDupDashboardPage = new DashboardPage(storeDupPage, domainStoreDup);
      const storeDupAuth = await multipleStore.getAuthRequest(
        conf.suiteConf.store_dup["username"],
        conf.suiteConf.store_dup["password"],
        domainStoreDup,
        conf.suiteConf.store_dup["shop_id"],
        conf.suiteConf.store_dup["user_id"],
      );

      catalogPageStoreDup = new DropshipCatalogPage(storeDupDashboardPage.page, domainStoreDup);
      plusbaseProductAPIStoreDup = new PlusbaseProductAPI(domainStoreDup, storeDupAuth);
      catalogAPIStoreDup = new CatalogAPI(domainStoreDup, storeDupAuth);

      //Request product ali
      const aliProduct: RequestProductData = {
        user_id: parseInt(conf.suiteConf.store_dup["user_id"]),
        products: [{ url: aliUrlRes, note: "" }],
        is_plus_base: true,
      };
      await catalogPageStoreDup.goToProductRequest();
      await plusbaseProductAPIStoreDup.requestProductByAPI(aliProduct);
      await catalogPageStoreDup.searchAndClickViewRequestDetail(aliUrlRes);
      await catalogPageStoreDup.waitForCrawlSuccess(state);
      await catalogPageStoreDup.page.reload();
      await catalogPageStoreDup.waitForQuotationDetailLoaded();

      //Get product id
      productTemplateIdDup = await plusbaseProductAPIStoreOrigin.getProductTmplIDByUrl(
        plusbaseProductAPIStoreOrigin,
        aliUrlRes,
        20,
      );
      expect(productTemplateIdDup).toEqual(productTemplateId);
      await expect(async () => {
        const quotation: Array<SaleOrder> = await odooService.getQuotationByProductId(
          productTemplateId,
          null,
          conf.suiteConf.store_dup["odoo_partner_id"],
        );

        expect(quotation[0].state).toEqual("sent");
      }).toPass();
    });

    await test.step(`Trong thời gian SO được apply discount > Vào dashboard store > View SO detail`, async () => {
      await catalogPageStoreDup.page.reload();
      await catalogPageStoreDup.waitForQuotationDetailLoaded();
      map = await catalogAPIStoreDup.getVariantInfoByID(productTemplateId);
      expect(
        await catalogPageStoreDup.isTextVisible(
          `Enjoy PlusBase exclusive discount, applicable from ${durationDiscount}`,
        ),
      ).toBe(true);
      let minPrice = Number((soOrigin.variants[0].unit_price - soOrigin.variants[0].discount_amount).toFixed(2));
      for (let i = 1; i < soOrigin.variants.length; i++) {
        if (Number((soOrigin.variants[i].unit_price - soOrigin.variants[i].discount_amount).toFixed(2)) < minPrice) {
          minPrice = Number((soOrigin.variants[i].unit_price - soOrigin.variants[i].discount_amount).toFixed(2));
        }
      }

      const dataShipping = await odooService.getShippingDatas(productTemplateId, "US");
      const shippingFee = dataShipping.get("Standard Shipping").first_item_fee;
      const variants = [];
      map.forEach((value, key) => {
        const variantNames = map.get(key);
        variants.push(variantNames);
      });
      for (const name of variants) {
        const variantNames = name.split("/");
        for (let i = 0; i < variantNames.length; i++) {
          await catalogPageStoreDup.clickOnBtnWithLabel(variantNames[i].trim());
        }

        //product cost + percent discount
        productCostBeforeDiscount = await catalogPageStoreDup.getProductCost();
        expect(productCostBeforeDiscount).toEqual(soOrigin.variants[0].unit_price);
        productCostAfterDiscount = await catalogPageStoreDup.getProductCost(2);
        expect(productCostAfterDiscount).toEqual(
          Number((soOrigin.variants[0].unit_price - soOrigin.variants[0].discount_amount).toFixed(2)),
        );
        const percentDiscount = (soOrigin.variants[0].discount_amount / productCostBeforeDiscount) * 100;
        expect(await catalogPageStoreDup.isTextVisible(`${percentDiscount.toFixed(2)}% OFF`)).toBe(true);

        //selling price / total cost
        sellingPriceActual = await catalogPageStoreDup.getSellingPrice();
        totalCostActual = await catalogPageStoreDup.getTotalCost();
        sellingPriceExpect = await catalogPageStoreDup.calculatorSellingPrice(productCostAfterDiscount);
        expect(sellingPriceActual).toEqual(sellingPriceExpect);
        totalCostExpect = await catalogPageStoreDup.calculatorTotalCost(shippingFee, minPrice);
        expect(totalCostActual).toEqual(totalCostExpect);

        //Profit margin
        profitMarginActual = await catalogPageStoreDup.getProfitMargin();
        profitMarginExpect = await catalogPageStoreDup.calculatorProfitMargin(
          shippingFee,
          processingRate,
          productCostAfterDiscount,
          0.03,
          Number(sellingPriceActual),
        );
        expect(profitMarginActual.toString()).toEqual(profitMarginExpect);
      }
    });

    await test.step(`Verify timeline SO`, async () => {
      expect(await catalogPage.isTextVisible(`Product has been discounted from ${durationDiscount}`)).toBe(true);
    });
  });
});
