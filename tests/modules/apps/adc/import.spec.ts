import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { ProductAPI } from "@pages/api/product";
import { ADCPage } from "@pages/dashboard/apps/ali_dropship_connector";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";

test.describe(" @SB_APP_ADC_IP_65 Verify import product trường hợp import không thành công + thành công", async () => {
  let productPage: ProductPage;
  let productPageSf: SFProduct;
  const caseName = "SB_APP_ADC_IP_65";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      product_links: productLinks,
      error_message: errorMessage,
      title_product: titleProduct,
      total_variant: totalVariant,
      import_status: importStatus,
    }) => {
      test(`@${caseId} ${caseDescription}`, async ({ dashboard, conf, context }) => {
        const domain = conf.suiteConf.domain;
        const adcPage = new ADCPage(dashboard, domain);
        await test.step(`Mở app ADC -> Chọn Import List -> Click Import `, async () => {
          await adcPage.goToImportList();
          await adcPage.addLinkToImport(productLinks);
          if (!importStatus) {
            expect(await adcPage.isTextVisible(errorMessage)).toBeTruthy();
          } else {
            expect(await adcPage.isTextVisible(titleProduct)).toBeTruthy();
            await adcPage.importToStore();
            expect(await adcPage.isTextVisible(titleProduct)).toBeTruthy();
            expect(await adcPage.isTextVisible("has been imported to ShopBase Store.")).toBeTruthy();

            await test.step(`Click edit product on Shopbase`, async () => {
              const [newPage] = await Promise.all([
                context.waitForEvent("page"),
                adcPage.clickOnBtnWithLabel("Edit product on ShopBase"),
              ]);
              productPage = new ProductPage(newPage, domain);
              await productPage.page.waitForLoadState("load");
              expect(await adcPage.isTextVisible(titleProduct)).toBeTruthy();
              expect(await productPage.countVariantProduct()).toEqual(totalVariant);
            });

            await test.step(`Click View icon`, async () => {
              const [newPageSf] = await Promise.all([
                context.waitForEvent("page"),
                productPage.clickElementWithLabel("span", "View"),
              ]);
              productPageSf = new SFProduct(newPageSf, domain);
              expect(await productPageSf.isTextVisible(titleProduct)).toBeTruthy();
              await productPage.deleteProductInProductDetail();
            });
          }
        });
      });
    },
  );
});

test.describe("Import product to store", async () => {
  let productLinks: Array<string>;
  let productPage: ProductPage;
  let productPageSf: SFProduct;
  let dataPrice: Array<string>;
  let productAPI: ProductAPI;
  let dataVariant: Array<string>;
  let titleClass: Array<string>;
  let newData: string;
  let totalImageAli: number;

  test.beforeEach(async ({ conf, dashboard }) => {
    productLinks = conf.caseConf.product_links;
    dataPrice = conf.caseConf.data_price;
    dataVariant = conf.caseConf.data_variant;
    titleClass = conf.caseConf.title_class;
    totalImageAli = conf.caseConf.total_image_ali;
    newData = conf.caseConf.new_data;
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    await test.step(`Remove all product from list before add link ali to import`, async () => {
      await adcPage.goToImportList();
      await adcPage.removeAllProductFromList();
    });
  });

  test(`@SB_APP_ADC_IP_69 Verify import product với link aliexpress không có variant`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const titleProduct = conf.caseConf.title_product;
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    await test.step(`Mở app ADC -> Chọn Import List -> Click Import > Nhập URL của product không có variant`, async () => {
      await adcPage.addLinkToImport(productLinks);
      await adcPage.importToStore();
      expect(await adcPage.isTextVisible("has been imported to ShopBase Store.")).toBeTruthy();
    });

    await test.step(`Click button Edit product on ShopBase > Click button Edit tại section Variant option`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        adcPage.page.click(adcPage.xpathBntEditProductByTitle(titleProduct)),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.waitUntilElementVisible(productPage.xpathProductVariantDetail);
      await productPage.clickOnBtnWithLabel("Edit");
      await expect(productPage.locatorVariantOption(conf.caseConf.attribute_name)).toBeEnabled();
      await expect(productPage.locatorVariantOption(conf.caseConf.attribute_value)).toBeEnabled();
      await productPage.deleteProductInProductDetail();
    });
  });

  test(`@SB_APP_ADC_IP_45 Verfify import multi product`, async ({ context, dashboard, conf }) => {
    const products = conf.caseConf.products;
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    await test.step(`Mở app ADC -> Chọn Import List > Click Import  > Nhập URL > Click Import > Chọn 2 product để import > Click edit product on Shopbase của từng product > Click View icon của từng product `, async () => {
      await adcPage.addLinkToImport(productLinks);
      await adcPage.importToStore();
      expect(await adcPage.isTextVisible("has been imported to ShopBase Store.")).toBeTruthy();
      for (let i = 1; i <= products.length; i++) {
        const [newPage] = await Promise.all([
          context.waitForEvent("page"),
          adcPage.page.click(adcPage.xpathBntEditProductByTitle(products[i - 1].title_product)),
        ]);
        productPage = new ProductPage(newPage, domain);
        await productPage.waitUntilElementVisible(productPage.xpathProductVariantDetail);
        expect(await productPage.countVariantProduct()).toEqual(products[i - 1].total_variant);
        const [newPageSf] = await Promise.all([
          context.waitForEvent("page"),
          productPage.clickElementWithLabel("span", "View"),
        ]);
        productPageSf = new SFProduct(newPageSf, domain);
        expect(await productPageSf.isTextVisible(products[i - 1].title_product.trim())).toBeTruthy();
        await productPage.deleteProductInProductDetail();
      }
    });
  });
  test(`@SB_APP_ADC_IP_44 Verify import product vào store sau khi change all price variant`, async ({
    dashboard,
    conf,
    context,
    authRequest,
  }) => {
    const products = conf.caseConf.products;
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    await test.step(`Mở app ADC -> Chọn Import List > Click Import  > Nhập URL > Click Import > Click tab Variants -> Click dropdown list Price -> Chọn Set new price -> Nhập Price -> Click Apply -> Click import to Store -> Edit  product on Shopbase > Click View icon `, async () => {
      await adcPage.addLinkToImport(productLinks);
      await adcPage.changeAllPriceVariant(dataPrice);
      await adcPage.page.waitForLoadState("load");
      expect(await adcPage.isTextVisible("Saved successfully")).toBeTruthy();
      await adcPage.importToStore();
      expect(await adcPage.isTextVisible("has been imported to ShopBase Store.")).toBeTruthy();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        adcPage.clickOnBtnWithLabel("Edit product on ShopBase"),
      ]);
      productAPI = new ProductAPI(domain, authRequest);
      productPage = new ProductPage(newPage, domain);
      const productId = Number(await productPage.getProductIDByURL());
      const productInfor = await productAPI.getDataProductById(productId);
      const variant = productInfor.product.variants;
      for (let i = 0; i < variant.length; i++) {
        expect(variant[i].price).toEqual(Number(dataPrice));
      }
      productPage = new ProductPage(newPage, domain);
      const [newPageSf] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View"),
      ]);
      productPageSf = new SFProduct(newPageSf, domain);
      expect(await productPageSf.isTextVisible(products[0].title_product)).toBeTruthy();
      expect(await productPageSf.getProductPrice("price")).toEqual(Number(`${dataPrice}`));
      await productPage.deleteProductInProductDetail();
    });
  });
  test(`@SB_APP_ADC_IP_43 Verify import product vào store trường hợp edit từng variant`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const products = conf.caseConf.products;
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    await test.step(`Mở app ADC -> Chọn Import List -> Click Import  -> Nhập URL -> Click Import > Click tab Variants -> Edit price của từng variant từ trên xuống dưới -> Click import to Store -> Edit  product on Shopbase  `, async () => {
      await adcPage.addLinkToImport(productLinks);
      await adcPage.clickOnTab("Variants");
      await adcPage.changePriceVariant(dataPrice);
      await adcPage.clickOnTab("Variants");
      await adcPage.importToStore();
      expect(await adcPage.isTextVisible("has been imported to ShopBase Store.")).toBeTruthy();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        adcPage.clickOnBtnWithLabel("Edit product on ShopBase"),
      ]);
      productPage = new ProductPage(newPage, domain);
      const rowVariant = await productPage.countVariantProduct();
      for (let i = 1; i <= rowVariant - 1; i++) {
        expect(await productPage.getDataTable(1, i + 1, 7)).toContain(dataPrice[i - 1]);
      }
    });
    await test.step(`Click View icon`, async () => {
      const [newPageSf] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View"),
      ]);
      productPageSf = new SFProduct(newPageSf, domain);
      expect(await productPageSf.isTextVisible(products[0].title_product)).toBeTruthy();
      expect(await productPageSf.getProductPrice("price")).toEqual(Number(`${dataPrice[0]}`));
      await productPage.deleteProductInProductDetail();
    });
  });
  test(`@SB_APP_ADC_IP_39 Verify import product vào store sau khi edit thông tin của sản phẩm`, async ({
    conf,
    context,
    dashboard,
    authRequest,
  }) => {
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    productAPI = new ProductAPI(domain, authRequest);
    await test.step(`Mở app ADC -> Chọn Import List -> Click Import -> Nhập URL -> Click Import > Click import to Store`, async () => {
      await test.step(`Update thông tin product -> Click button "Import to store"`, async () => {
        await adcPage.goToImportList();
        await adcPage.addLinkToImport(productLinks);
        await adcPage.changeProductInfor("Product", newData);
        await adcPage.changeProductInfor("Description", "", newData);
        await adcPage.changeLineVariant(dataVariant, titleClass);
        await adcPage.changeProductInfor("Images");
        await adcPage.importToStore();
        expect(await adcPage.isTextVisible("has been imported to ShopBase Store.")).toBeTruthy();
        await test.step(`Click edit product on Shopbase `, async () => {
          const [newPage] = await Promise.all([
            context.waitForEvent("page"),
            adcPage.clickOnBtnWithLabel("Edit product on ShopBase"),
          ]);
          productPage = new ProductPage(newPage, domain);
          productAPI = new ProductAPI(domain, authRequest);
          const productId = Number(await productPage.getProductIDByURL());
          const productInfor = await productAPI.getDataProductById(productId);
          expect(productInfor.product.title).toEqual(newData);
          expect(productInfor.product.body_html.includes(newData)).toBeTruthy();
          const variants = productInfor.product.variants;
          expect(variants[0].option1).toEqual(dataVariant[0]);
          expect(variants[0].price).toEqual(Number(dataVariant[1]));
          expect(variants[0].compare_at_price).toEqual(Number(dataVariant[2]));
          expect(productInfor.product.images.length).toEqual(totalImageAli - 1);
        });
        await test.step(`Click edit product on Shopbase `, async () => {
          const [newPageSf] = await Promise.all([
            context.waitForEvent("page"),
            productPage.clickElementWithLabel("span", "View"),
          ]);
          productPageSf = new SFProduct(newPageSf, domain);
          await productPageSf.page.waitForSelector(productPageSf.xpathPriceOnSF);
          expect(await productPageSf.countImageSF()).toEqual(totalImageAli - 1);
          expect(await productPageSf.isTextVisible(newData, 3)).toBeTruthy();
          expect(await productPageSf.getProductComparePrice()).toEqual(`${dataVariant[2]}`);
          expect(await productPageSf.getProductPrice("price")).toEqual(Number(`${dataVariant[1]}`));
          await productPage.deleteProductInProductDetail();
        });
      });
    });
  });
  test(`@SB_APP_ADC_IP_64 Verify chức năng remove product`, async ({ dashboard, conf }) => {
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    const products = conf.caseConf.products;
    await test.step(`Mở app ADC > Chọn Import List > Click Import > Nhập URL > Click Import > Chọn 1 product -> Click Remove from list > Click Delete`, async () => {
      await adcPage.goToImportList();
      await adcPage.addLinkToImport(productLinks);
      await adcPage.page.click(adcPage.xpathCheckBoxByTitle(products[0].title_product));
      await adcPage.clickElementWithLabel("div", "Remove from list");
      await adcPage.clickButtonOnPopUpByClass("delete");
      expect(await adcPage.isTextVisible("product deleted")).toBeTruthy();
      expect(await adcPage.isTextVisible(products[0].title_product)).toBeFalsy();
    });
    await test.step(`Chọn all product -> Click Remove from list > Click Delete`, async () => {
      await adcPage.removeAllProductFromList();
      expect(await adcPage.isTextVisible("Your import list is empty")).toBeTruthy();
    });
  });
  test(`@SB_APP_ADC_IP_63 Verify chức năng delete product`, async ({ dashboard, conf }) => {
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    const products = conf.caseConf.products;
    await test.step(`Mở app ADC -> Chọn Import List -> Click Import -> Nhập URL -> Click Import`, async () => {
      await adcPage.goToImportList();
      await adcPage.addLinkToImport(productLinks);
      expect(await adcPage.isTextVisible(products[0].title_product)).toBeTruthy();
    });
    await test.step(`Chọn 1 product -> Click Delete -> Click Delete`, async () => {
      await adcPage.clickOnBtnWithLabel("Delete", 1);
      await adcPage.clickOnBtnWithLabel("Delete", 2);
      await expect(async () => {
        expect(await adcPage.isTextVisible("Product deleted")).toBeTruthy();
        expect(await adcPage.isTextVisible("Your import list is empty")).toBeTruthy();
      }).toPass();
    });
  });
});

test.describe(" @SB_APP_ADC_IP_41 Verify import 1 product vào store nhiều lần", async () => {
  let productPage: ProductPage;
  let productLinks: Array<string>;
  let titleProduct: string;
  let productPageSf: SFProduct;
  let totalVariant: number;
  test.beforeEach(async ({ conf }) => {
    productLinks = conf.caseConf.product_links;
    titleProduct = conf.caseConf.title_product;
    totalVariant = conf.caseConf.total_variant;
  });
  test(`@SB_APP_ADC_IP_41 Verify import 1 product vào store nhiều lần`, async ({ dashboard, conf, context }) => {
    const domain = conf.suiteConf.domain;
    const adcPage = new ADCPage(dashboard, domain);
    for (let i = 0; i < conf.caseConf.number_import; i++) {
      await test.step(`Mở app ADC -> Chọn Import List -> Click Import -> Click Import to store `, async () => {
        await adcPage.goToImportList();
        await adcPage.addLinkToImport(productLinks);
        await adcPage.importToStore();
        expect(await adcPage.isTextVisible("has been imported to ShopBase Store.")).toBeTruthy();
        expect(await adcPage.isTextVisible(titleProduct)).toBeTruthy();
      });
      await test.step(`Click edit product on Shopbase`, async () => {
        const [newPage] = await Promise.all([
          context.waitForEvent("page"),
          adcPage.clickOnBtnWithLabel("Edit product on ShopBase"),
        ]);
        productPage = new ProductPage(newPage, domain);
        await productPage.page.waitForLoadState("load");
        expect(await productPage.countVariantProduct()).toEqual(totalVariant);
      });
      await test.step(`Click View icon`, async () => {
        const [newPageSf] = await Promise.all([
          context.waitForEvent("page"),
          productPage.clickElementWithLabel("span", "View"),
        ]);
        productPageSf = new SFProduct(newPageSf, domain);
        expect(await productPageSf.isTextVisible(titleProduct[0])).toBeTruthy();
        await productPage.deleteProductInProductDetail();
      });
    }
  });
});
