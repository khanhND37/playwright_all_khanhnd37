import { test } from "@fixtures/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { SFProduct } from "@pages/storefront/product";
import { expect } from "@playwright/test";
import { OdooService } from "@services/odoo";
import type { OrderCapProduct } from "@types";
import { SFHome } from "@pages/storefront/homepage";
import { OcgLogger } from "@core/logger";
import { formatDate } from "@utils/datetime";
import { OutOfStock } from "./set_out_of_stock";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Set product plusbase to unavailable", async () => {
  let domain: string;
  let dropshipCatalogPage: DropshipCatalogPage;
  let dashboardPage: DashboardPage;
  let productPageSf: SFProduct;
  let productName: string;
  let variant: string;
  let productStatus: string;
  let productHandle: string;
  let productIdOdoo: number;
  let variantIdOdoo: number;
  let availableVariant: string;
  let checkout: SFCheckout;

  const logger = OcgLogger.get();

  test.beforeEach(async ({ dashboard, conf }) => {
    domain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    dropshipCatalogPage = new DropshipCatalogPage(dashboard, domain);
    productName = conf.caseConf.product_name;
    productStatus = conf.caseConf.product_status;
    productHandle = conf.caseConf.product_handle;
    variant = conf.caseConf.variant;
    productIdOdoo = conf.caseConf.product_id_odoo;
    variantIdOdoo = conf.caseConf.variant_id_odoo;
    availableVariant = conf.caseConf.available_variant;
  });

  test(`@TC_ORC-SU-13 Verify hiển thị product khi user bỏ set unavailable cho product`, async ({ dashboard, odoo }) => {
    const productOdoo = OdooService(odoo);
    await test.step(`Vào odoo > Bỏ chọn Set unavailable > Save > Vào dashboard > Dropship products > AliExpress products > Mở product detail`, async () => {
      const dataReadcap = {
        x_set_unavailable: false,
      };
      await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.searchAndClickViewRequestDetail(productName);
      const importButton = await dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathBtnImportToYourStore);
      await expect(importButton).toBeEnabled();
    });
    await test.step(`Mở storefront > All product page > Search product > Click mở product detail`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      const btnAddToCart = await productPageSf.page.locator(productPageSf.xpathBtnAddToCart);
      await expect(btnAddToCart).toBeEnabled();
    });
    //set unavaivalble for product
    const dataReadcap = {
      x_set_unavailable: true,
    };
    await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
  });

  test(`@SB_PLB_OC-SU_38 Verify button Import to your store trong catalog product detail với product set unavailable`, async ({
    odoo,
  }) => {
    const productOdoo = OdooService(odoo);
    await test.step(`Lên odoo  Set unavailable với product name = unavailable -> Vào store dashboard> menu AliExpress products > Search product > Verify button Import to your store`, async () => {
      const dataReadcap = {
        x_set_unavailable: true,
      };
      await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.searchAndClickViewRequestDetail(productName);
      const importButton = await dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathBtnImportToYourStore);
      await expect(importButton).toBeDisabled();
    });
    await test.step(`Lên odoo bỏ tick Set unavailable với product name = unavailable -> Vào store dashboard. menu AliExpress products > Search product > Verify button Import to your store`, async () => {
      const dataReadcap = {
        x_set_unavailable: false,
      };
      await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.searchAndClickViewRequestDetail(productName);
      const importButton = await dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathBtnImportToYourStore);
      await expect(importButton).toBeEnabled();
    });
  });

  test(`@TC_ORC-SU-12 Verify data product khi set unavaiable ngoài Catalog list`, async ({ context, odoo }) => {
    const productOdoo = OdooService(odoo);
    await test.step(`Vào odoo product detail check Set unavailable > Vào store dashboard, click Dropship products, chọn Catalog > Search product > Click Product`, async () => {
      const dataReadcap = {
        x_set_unavailable: true,
      };
      await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
      await dashboardPage.navigateToSubMenu("Dropship products", "Catalog");
      await dropshipCatalogPage.searchProductcatalog(productName);
      await dropshipCatalogPage.page.waitForLoadState("networkidle");
      const oosMessage = await dropshipCatalogPage.page
        .locator(dropshipCatalogPage.xpathWarningTextOnCatalog)
        .textContent();
      expect(oosMessage.trim()).toEqual(productStatus);
      const [catalogPage] = await Promise.all([
        context.waitForEvent("page"),
        await dropshipCatalogPage.clickElementWithLabel("div", productName),
      ]);
      const catalogPageDetail = new DropshipCatalogPage(catalogPage, domain);
      await catalogPageDetail.page.waitForLoadState("networkidle");
      const importButton = await catalogPageDetail.page.locator(dropshipCatalogPage.xpathBtnImportToYourStore);
      await expect(importButton).toBeDisabled();
    });
    await test.step(`Vào odoo product detail check Set unavailable > Vào store dashboard, click Dropship products, chọn Catalog > Search product > Click product`, async () => {
      const dataReadcap = {
        x_set_unavailable: false,
      };
      await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
      await dashboardPage.navigateToSubMenu("Dropship products", "Catalog");
      await dropshipCatalogPage.searchProductcatalog(productName);
      await dropshipCatalogPage.page.waitForLoadState("networkidle");
      const [catalogPage] = await Promise.all([
        context.waitForEvent("page"),
        await dropshipCatalogPage.clickElementWithLabel("div", productName),
      ]);
      const catalogPageDetail = new DropshipCatalogPage(catalogPage, domain);
      await catalogPageDetail.page.waitForLoadState("networkidle");
      const importButton = await catalogPageDetail.page.locator(dropshipCatalogPage.xpathBtnImportToYourStore);
      await expect(importButton).toBeEnabled();
    });
  });

  test(`@SB_PLB_OC-SU_40 Verify hiển thị product ngoài SF khi product có variant được set OOS trên odoo sau đó archive`, async ({
    odoo,
    dashboard,
    scheduler,
  }) => {
    const productOdoo = OdooService(odoo);
    await test.step(`Vào odoo > Products > Mở product detail > Chọn tab Variants > Mở 1 variant detail > Set unavailable cho variant > Click button "Action" > Chọn Archive variant`, async () => {
      const variantStatus = (await productOdoo.getVariantInforById(variantIdOdoo)).active;
      const dataReadcap = {
        x_set_unavailable: true,
        active: false,
      };
      if (variantStatus) {
        await productOdoo.setUnavailableVariant(variantIdOdoo, <OrderCapProduct>dataReadcap);
      }
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.searchAndClickViewRequestDetail(productName);
      await expect(dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathVariant(variant))).toHaveCount(0);
    });

    await test.step(`Mở storefront > Vào product detail`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      let count = await productPageSf.countImageVariant();
      do {
        await productPageSf.chooseVariantByClickImage(count);
        const labelVariant = await productPageSf.page.locator(productPageSf.xpathLabelvariant).innerText();
        if (labelVariant == variant) {
          break;
        } else count--;
      } while (count >= 1);
      const btnAddToCart = await productPageSf.page.locator(productPageSf.xpathBtnAddToCart).count();
      if (btnAddToCart == 1) {
        await scheduler.schedule({ mode: "later", minutes: 35 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      logger.info("Clear scheduling");
      await scheduler.clear();
      const soldOutButton = await productPageSf.page.locator(productPageSf.xpathBtnSoldOut(productName));
      await expect(soldOutButton).toBeDisabled();
    });
    //unarchive variant
    const currentVariantStatus = (await productOdoo.getVariantInforById(variantIdOdoo)).active;
    if (!currentVariantStatus) {
      await productOdoo.setUnarchivedVariant(variantIdOdoo);
    }
  });

  test(`@SB_PLB_OC-SU_31 - Check thời điểm variant bị sold out ngoài storefront khi product không set Mark product as sold out on online store at trong Odoo`, async ({
    odoo,
    dashboard,
    scheduler,
  }) => {
    const productOdoo = OdooService(odoo);
    let scheduleData: OutOfStock;

    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as OutOfStock;
    } else {
      logger.info("Init default object");
      scheduleData = {
        isSkippSF: false,
      };

      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }
    await test.step(`Vào odoo > Products > Mở product detail > Chọn tab Variants > Mở 1 variant detail > Set unavailable, set archive cho variant > Save`, async () => {
      if (scheduleData.isSkippSF) return;
      const variantStatus = (await productOdoo.getVariantInforById(variantIdOdoo)).active;
      const dataReadcap = {
        active: false,
        x_set_unavailable: true,
      };
      if (variantStatus) {
        await productOdoo.setUnavailableVariant(variantIdOdoo, <OrderCapProduct>dataReadcap);
      }

      await dropshipCatalogPage.goToProductCatalogDetailById(productIdOdoo);
      await expect(dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathVariant(variant))).toHaveCount(0);
    });

    await test.step(`Tại màn catalog, open product detail > Check variant không bị set unavailable`, async () => {
      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
      if (scheduleData.isSkippSF) return;
      await expect(dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathVariant(availableVariant))).toHaveCount(1);
    });

    await test.step(`Sau 1h, tại màn product detail ngoài SF >Chọn variant`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      await productPageSf.selectVariant(variant);
      const btnAddToCart = await productPageSf.page.locator(productPageSf.xpathBtnAddToCart).count();
      scheduleData.isSkippSF = true;
      if (btnAddToCart == 1) {
        await scheduler.schedule({ mode: "later", minutes: 35 });
        await scheduler.setData(scheduleData);
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      logger.info("Clear scheduling");
      await scheduler.clear();
      const soldOutButton = await productPageSf.page.locator(productPageSf.xpathBtnSoldOut(productName)).count();
      expect(soldOutButton).toEqual(1);
    });

    await test.step(`Tại màn product detail ngoài SF > Chọn variant khác của product`, async () => {
      await productPageSf.selectVariant(availableVariant);
      await expect(productPageSf.page.locator(productPageSf.xpathBtnAddToCart)).toHaveCount(1);
    });

    //unarchive variant
    const currentVariantStatus = (await productOdoo.getVariantInforById(variantIdOdoo)).active;
    const dataUpdateVariant = {
      x_set_unavailable: false,
      active: true,
      x_set_unavailable_at: null,
    };
    if (!currentVariantStatus) {
      await productOdoo.setUnavailableVariant(variantIdOdoo, <OrderCapProduct>dataUpdateVariant);
    }
    //clear sold out date of product template
    const dataUpdateProductTemplate = {
      x_set_unavailable: false,
      x_set_unavailable_at: null,
    };
    await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataUpdateProductTemplate);
  });

  test(`@SB_PLB_OC-SU_36 - Check product bị sold out ngoài storefront khi ops set up oos theo user email với trường hợp product set Mark product as sold out on online store at trong Odoo`, async ({
    odoo,
    dashboard,
    scheduler,
    conf,
  }) => {
    const customerInfo = conf.suiteConf.customer_info;
    const cardInfor = conf.suiteConf.card_infor;
    const productOdoo = OdooService(odoo);
    let scheduleData: OutOfStock;

    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as OutOfStock;
    } else {
      logger.info("Init default object");
      scheduleData = {
        isSkippSF: false,
        isSkippSF2nd: false,
      };

      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }

    await test.step(`Vào odoo > Products > Mở product detail > Set unavailable cho product > Save >Open product catalog detail`, async () => {
      if (scheduleData.isSkippSF) return;
      //do giờ set vào db là giờ UTC +0
      const fixedDate: Date = new Date();
      fixedDate.setHours(new Date().getUTCHours() + 1);
      fixedDate.setDate(new Date().getUTCDate());
      fixedDate.setMonth(new Date().getUTCMonth());
      const soldOutdate = formatDate(fixedDate, "YYYY-MM-DD HH:mm:ss");
      const dataReadcap = {
        x_set_unavailable: true,
        x_set_unavailable_at: soldOutdate,
      };
      await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
      await dropshipCatalogPage.goToProductCatalogDetailById(productIdOdoo);
      await expect(dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathBtnImportToYourStore)).toBeDisabled();
    });

    await test.step(`Đi đến màn sf của product`, async () => {
      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
      if (scheduleData.isSkippSF) return;
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      await productPageSf.selectVariant(variant);
      await expect(productPageSf.page.locator(productPageSf.xpathBtnAddToCart)).toHaveCount(1);
    });

    await test.step(`Sau 2h, tại màn product detail ngoài SF > Verify product không thể checkout`, async () => {
      if (scheduleData.isSkippSF2nd) return;
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      await productPageSf.selectVariant(variant);
      const btnAddToCart = await productPageSf.page.locator(productPageSf.xpathBtnAddToCart).count();
      scheduleData.isSkippSF = true;
      if (btnAddToCart == 1) {
        await scheduler.schedule({ mode: "later", minutes: 70 });
        await scheduler.setData(scheduleData);
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      const soldOutButton = await productPageSf.page.locator(productPageSf.xpathBtnSoldOut(productName)).count();
      await expect(soldOutButton).toEqual(1);
    });

    await test.step(`Vào odoo > Products > Mở product detail > uncheck Set unavailable cho product > Save >Open product detail`, async () => {
      if (scheduleData.isSkippSF2nd) return;
      const dataReadcap = {
        x_set_unavailable: false,
        x_set_unavailable_at: null,
      };
      await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
      await dropshipCatalogPage.goToProductCatalogDetailById(productIdOdoo);
      await expect(dropshipCatalogPage.page.locator(dropshipCatalogPage.xpathBtnImportToYourStore)).toBeEnabled();
    });

    await test.step(`Đi đến màn sf của product > Verify product có thể checkout bình thường`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      await productPageSf.selectVariant(variant);
      const btnAddToCart = await productPageSf.page.locator(productPageSf.xpathBtnAddToCart).count();
      scheduleData.isSkippSF2nd = true;
      if (btnAddToCart == 0) {
        await scheduler.schedule({ mode: "later", minutes: 70 });
        await scheduler.setData(scheduleData);
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      logger.info("Clear scheduling");
      await scheduler.clear();
      await productPageSf.addProductToCart();
      checkout = await productPageSf.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithCardInfo(cardInfor);
      await expect(checkout.page.locator(checkout.xpathThankYou)).toHaveCount(1);
    });
  });

  test(`@SB_PLB_OC-SU_32 - Check thời điểm variant bị sold out ngoài storefront lấy theo thời điểm product đã set Mark product as sold out on online store at trong Odoo`, async ({
    odoo,
    dashboard,
    scheduler,
  }) => {
    const productOdoo = OdooService(odoo);
    let scheduleData: OutOfStock;

    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as OutOfStock;
    } else {
      logger.info("Init default object");
      scheduleData = {
        isSkippSF: false,
      };
      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }

    await test.step(`Vào odoo > Products > Mở product detail > Chọn tab Variants > Mở 1 variant detail > Set unavailable cho variant, archive variant > Save > Vào catalog > Tại màn catalog, open product detail > Check variant`, async () => {
      if (scheduleData.isSkippSF) return;
      const variantStatus = (await productOdoo.getVariantInforById(variantIdOdoo)).active;
      //do giờ lưu vào db là giờ UTC +0
      const fixedDate: Date = new Date();
      fixedDate.setHours(new Date().getUTCHours() + 1);
      fixedDate.setDate(new Date().getUTCDate());
      fixedDate.setMonth(new Date().getUTCMonth());
      const soldOutdate = formatDate(fixedDate, "YYYY-MM-DD HH:mm:ss");
      const updateDataVariant = {
        x_set_unavailable: true,
      };
      if (variantStatus) {
        await productOdoo.setUnavailableVariant(variantIdOdoo, <OrderCapProduct>updateDataVariant);
      }
      const dataReadcap = {
        x_set_unavailable: true,
        x_set_unavailable_at: soldOutdate,
      };
      await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
    });

    await test.step(`Đi đến màn sf của product > Chọn variant`, async () => {
      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
      if (scheduleData.isSkippSF) return;
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      await productPageSf.selectVariant(variant);
      await expect(productPageSf.page.locator(productPageSf.xpathBtnAddToCart)).toHaveCount(1);
    });

    await test.step(`Sau 2h, tại màn product detail ngoài SF > Verify product không thể checkout`, async () => {
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      await productPageSf.selectVariant(variant);
      const btnAddToCart = await productPageSf.page.locator(productPageSf.xpathBtnAddToCart).count();
      scheduleData.isSkippSF = true;
      if (btnAddToCart == 1) {
        await scheduler.schedule({ mode: "later", minutes: 70 });
        await scheduler.setData(scheduleData);
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      logger.info("Clear scheduling");
      await scheduler.clear();
      const soldOutButton = await productPageSf.page.locator(productPageSf.xpathBtnSoldOut(productName));
      await expect(soldOutButton).toBeDisabled();
    });

    //set available for variant
    const updateDataVariant = {
      x_set_unavailable: false,
      x_set_unavailable_at: null,
    };
    await productOdoo.setUnavailableVariant(variantIdOdoo, <OrderCapProduct>updateDataVariant);
    //set available for product
    const dataReadcap = {
      x_set_unavailable_at: null,
    };
    await productOdoo.setUnavailableProduct(productIdOdoo, <OrderCapProduct>dataReadcap);
  });
});
