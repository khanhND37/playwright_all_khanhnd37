import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { OdooService } from "@services/odoo";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { removeCurrencySymbol, roundingDecimal } from "@core/utils/string";
import moment from "moment";
import type { ProductTemplate, RequestProductData, ShippingFee } from "@types";
import { removeExtraSpace, updateShippingFee } from "@core/utils/string";
import { SFProduct } from "@pages/storefront/product";
import { ProductAPI } from "@pages/api/product";
import { SFCheckout } from "@pages/storefront/checkout";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { ProductPage } from "@pages/dashboard/products";

test.describe("Shipping type for PlusBase", async () => {
  let domain: string;
  let country: string;
  let countryCode: string;
  let productId: number;
  let linkAli: string;
  let checkoutPage: SFCheckout;
  let plusbaseProductAPI: PlusbaseProductAPI;
  let plusbasePage: DropshipCatalogPage;
  let productIdNotify: number;

  test.beforeAll(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    country = conf.suiteConf.country;
    productId = conf.suiteConf.product_id;
    productIdNotify = conf.suiteConf.product_id_notify;
    countryCode = conf.suiteConf.country_code;
    linkAli = conf.caseConf.link_ali;
  });

  test.afterEach(async ({ authRequest }) => {
    // get sb product
    const productAPI = new ProductAPI(domain, authRequest);
    const products = await productAPI.getSbProductIdBySbcnProductId(productId);
    // delete product
    for (const product of products) {
      await productAPI.deleteProductById(domain, product);
    }
  });

  test("@SB_SBFF_ST_29 Verify logic hiển thị shipping method trên quotation khi product mới crawl về và chưa gán shipping type", async ({
    odoo,
    dashboard,
    conf,
    authRequest,
  }) => {
    const odooService = OdooService(odoo);
    const plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    // Reset product template to resync shipping
    await odooService.resetProductTemplateToResyncShipping(conf.suiteConf.product_id_not_send);
    // Request ali url
    plusbasePage = new DropshipCatalogPage(dashboard, domain);
    const aliProduct: RequestProductData = {
      user_id: parseInt(conf.suiteConf.user_id),
      products: [{ url: linkAli, note: "" }],
      is_plus_base: true,
    };
    await plusbasePage.goToProductRequest();
    await plusbaseProductAPI.requestProductByAPI(aliProduct);

    // Tính shipping fee markup từ giá ship bên aliexpress
    const shippingFeeExp: ShippingFee = plusbasePage.markupShippingAliCj(conf.caseConf.shipping_fee_ali);

    await test.step("Catalog > AliExpress products > Vào SO detail > Check shipping method", async () => {
      // Mở product vừa request
      await plusbasePage.searchAndClickViewRequestDetail(linkAli);
      await plusbasePage.waitForCrawlSuccess(conf.suiteConf.status, { checkShipping: true });

      // Kiểm tra shipping fee
      await plusbasePage.chooseShipToCountry(country);
      // Verify shipping fee of first item
      const shippingFeeFirstItem = removeCurrencySymbol(await plusbasePage.getShipping(2));
      expect(shippingFeeFirstItem).toEqual(shippingFeeExp.first_item.toString());

      // Verify shipping fee of additional item
      const shippingFeeAddItem = removeCurrencySymbol(await plusbasePage.getShipping(3));
      expect(shippingFeeAddItem).toEqual(shippingFeeExp.additional_item.toString());
    });
  });

  test("@SB_SBFF_ST_28 Verify logic hiển thị shipping method theo shipping type trên quotation", async ({
    odoo,
    conf,
    dashboard,
  }) => {
    const shippingTypes: Array<string> = conf.suiteConf.shipping_types;
    const odooService = OdooService(odoo);
    let shippingTypeIds = [];
    await test.step(`Vào odoo > Update shipping type cho product`, async () => {
      shippingTypeIds = await odooService.updateShippingTypeProductTemplate(productIdNotify, shippingTypes);

      // Verify log update
      const mailMessages = await odooService.getMailMessagebyText(
        "product.template",
        productIdNotify,
        `updated delivery carrier type`,
        {
          date: moment.utc().add(-10, "seconds").format("YYYY-MM-DD HH:mm:ss"),
        },
      );
      expect(mailMessages.length).toEqual(1);
    });

    plusbasePage = new DropshipCatalogPage(dashboard, domain);

    await test.step(`Vào dashboard > Catalog > Vào quotation detail > Verify shipping method trên quotation`, async () => {
      await plusbasePage.goToProductRequestDetail(productIdNotify);
      await plusbasePage.chooseShipToCountry(country);
      expect(await plusbasePage.page.locator(".shipping-rate-box__content").count()).toEqual(shippingTypes.length);

      const productTemplate: ProductTemplate = await odooService.getProductTemplatesById(productIdNotify);

      // get shipping group code by shipping type
      const shippingGroupIds = [];
      const deliveryCarriers = await odooService.getDeliveryCarriersByConditions({
        shippingTypeIds: shippingTypeIds,
      });
      for (const deliveryCarrier of deliveryCarriers) {
        const groupId = deliveryCarrier.x_delivery_carrier_group[0];
        if (shippingGroupIds.includes(groupId)) {
          continue;
        }
        shippingGroupIds.push(groupId);
      }

      const shippingGroups = await odooService.getDeliveryCarrierGroupsByConditions({
        ids: shippingGroupIds,
      });

      // Click "See details" > Verify shipping fee
      await plusbasePage.clickSeeDetail();
      for await (const shippingGroup of shippingGroups) {
        await expect(
          plusbasePage.page.locator(
            `//div[contains(@class, 'shipping-rate-box__content')]//div[contains(text(), '${shippingGroup.name}')]`,
          ),
        ).toBeVisible();
        const { deliveryCarrier: smlDeliveryCarrier, shipping: smlShippings } =
          await odooService.getSmallestDeliveryCarriersByConditions({
            countryCode: countryCode,
            shippingGroupName: shippingGroup.name,
            weight: productTemplate.x_weight,
            shippingTypes: shippingTypes,
          });
        const est = smlDeliveryCarrier.x_estimated_delivery.replace("-", " - ").replaceAll(/  +/g, " ");
        await expect(
          plusbasePage.page.locator(
            `//div[contains(@class, 'shipping-rate-box__content')]//div[contains(text(), '${est}')]`,
          ),
        ).toBeVisible();

        for await (const [index, shippingCost] of smlShippings.entries()) {
          expect(
            removeCurrencySymbol(
              removeExtraSpace(
                await dashboard
                  .locator(
                    `//tr[.//div[contains(text(), '${shippingGroup.name}')]]//div[contains(@class, 'basis')][${
                      index + 1
                    }]`,
                  )
                  .textContent(),
              ),
            ),
          ).toEqual(roundingDecimal(updateShippingFee(shippingCost), 2));
        }
      }
    });
  });

  test("@SB_SBFF_ST_27 Verify shipping method của quotation khi config shipping type cho product là AliExpress", async ({
    odoo,
    conf,
    dashboard,
    context,
  }) => {
    const customerInfo = conf.suiteConf.customer_info;
    const shippingTypes: Array<string> = conf.suiteConf.ali_shipping_types;
    const odooService = OdooService(odoo);

    // Update shipping type
    const shippingTypeIds = await odooService.updateShippingTypeProductTemplate(productId, shippingTypes);
    plusbasePage = new DropshipCatalogPage(dashboard, domain);

    // Tính shipping fee markup từ giá ship bên aliexpress
    const shippingFeeExp: ShippingFee = plusbasePage.markupShippingAliCj(conf.caseConf.shipping_fee_ali);

    await test.step(`Vào Catalog > AliExpress products > Vào SO detail > Check shipping method`, async () => {
      await plusbasePage.goToProductRequestDetail(productId);
      await plusbasePage.chooseShipToCountry(country);
      await plusbasePage.clickSeeDetail();

      const shippingGroupIds = [];
      const deliveryCarriers = await odooService.getDeliveryCarriersByConditions({
        shippingTypeIds: shippingTypeIds,
      });
      for (const deliveryCarrier of deliveryCarriers) {
        const groupId = deliveryCarrier.x_delivery_carrier_group[0];
        if (shippingGroupIds.includes(groupId)) {
          continue;
        }
        shippingGroupIds.push(groupId);
      }

      const shippingGroups = await odooService.getDeliveryCarrierGroupsByConditions({
        ids: shippingGroupIds,
      });
      expect(shippingGroups.length).toBeGreaterThan(0);

      const shippingGroup = shippingGroups[0];
      for await (const [index, shippingPrice] of [
        shippingFeeExp.first_item,
        shippingFeeExp.additional_item,
      ].entries()) {
        expect(
          removeCurrencySymbol(
            removeExtraSpace(
              await dashboard
                .locator(
                  `//tr[.//div[contains(text(), '${shippingGroup.name}')]]//div[contains(@class, 'basis')][${
                    index + 1
                  }]`,
                )
                .textContent(),
            ),
          ),
        ).toEqual(shippingPrice.toString());
      }

      await plusbasePage.page.locator(".sb-popup__header-close").click();
    });

    await test.step(`Chọn "Import to your store" > Click "Add to store" > Checkout product vừa add to store > Verify shipping method hiển thị ngoài màn checkout`, async () => {
      await plusbasePage.clickBtnImportToStore();
      await plusbasePage.importFirstProductToStore();
      const [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        await plusbasePage.page.locator("//button[.//span[contains(text(), 'View on store')]][1]").click(),
      ]);
      const productSFPage = new SFProduct(SFPage, domain);
      await productSFPage.waitForElementVisibleThenInvisible(productSFPage.xpathIconLoadImage);
      const cartSFPage = await productSFPage.addProductToCart();
      await productSFPage.page.waitForSelector(".cart-icon");
      checkoutPage = await cartSFPage.checkout();
      await checkoutPage.enterShippingAddress(customerInfo);
      await expect(async () => {
        expect(
          removeCurrencySymbol(
            removeExtraSpace(
              await SFPage.locator(
                `//tr[contains(@class, 'total-line') and .//td[contains(text(), 'Shipping')]]/td[2]`,
              ).textContent(),
            ),
          ),
        ).toEqual(shippingFeeExp.first_item.toString());
      }).toPass();
    });
  });

  test("@SB_SBFF_ST_25 Verify shipping method của quotation khi thay đổi shipping type của product và shipping type đó không được config cho shipping method nào", async ({
    odoo,
    conf,
    dashboard,
    context,
    authRequest,
  }) => {
    const customerInfo = conf.suiteConf.customer_info;
    const shippingTypes: Array<string> = conf.suiteConf.noship_shipping_types;
    const odooService = OdooService(odoo);
    // Vào odoo > Thay đổi config shipping type của product
    await odooService.updateShippingTypeProductTemplate(productId, shippingTypes);

    plusbasePage = new DropshipCatalogPage(dashboard, domain);
    // Go to catalog detail
    await plusbasePage.goToProductRequestDetail(productId);

    await test.step(`Catalog > AliExpress products > Vào SO detail > Import product to store > Verify shipping method ngoài màn checkout`, async () => {
      plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
      const productSbId = await plusbaseProductAPI.importProductToStoreByAPI(productId);
      const productPage = new ProductPage(dashboard, domain);
      await productPage.goToProdDetailByID(domain, productSbId);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductOnSF()]);

      const productSFPage = new SFProduct(SFPage, domain);
      await productSFPage.waitForElementVisibleThenInvisible(productSFPage.xpathIconLoadImage);
      const cartSFPage = await productSFPage.addProductToCart();
      await cartSFPage.clickOnBtnWithLabel("Checkout");
      checkoutPage = new SFCheckout(SFPage, domain);
      await checkoutPage.enterShippingAddress(customerInfo);
      await checkoutPage.footerLoc.scrollIntoViewIfNeeded();
      await checkoutPage.page.waitForSelector(".section--shipping-method .section__content");
      await expect(
        SFPage.locator(`//div[contains(@class, 'section--shipping-method')]//div[@class='blank-slate'][1]`),
      ).toBeVisible();
    });
  });
});
