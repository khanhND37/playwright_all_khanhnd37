import { test } from "@fixtures/odoo";
import { ProductAPI } from "@pages/api/product";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { expect } from "@playwright/test";
test.describe("Size chart product", async () => {
  let dropshipCatalogPage: DropshipCatalogPage;
  let productName: string;
  let domain: string;
  let productHandle: string;
  let textLink: string;
  let dataSizeGuide: string;
  let productPage: ProductPage;
  let productPageSf: SFProduct;
  let totalVariant: number;
  let productAPI: ProductAPI;

  test.beforeEach(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    productName = conf.caseConf.product_name;
    productHandle = conf.caseConf.product_handle;
    totalVariant = conf.caseConf.total_variant;
    dataSizeGuide = conf.caseConf.data_size_guide;
  });

  test("Verify Size guide của product được hiển thị trên Store front @SB_PLB_OTMSC_63 ", async ({ dashboard }) => {
    await test.step(`Go to product store front của shop merchant`, async () => {
      dropshipCatalogPage = new DropshipCatalogPage(dashboard, domain);
      const homePage = new SFHome(dashboard, domain);
      productPageSf = await homePage.gotoProductDetailByHandle(productHandle, productName);
      expect(await productPageSf.isTextVisible(productName, 4)).toEqual(true);
    });
    await test.step(`Click button Size Guide`, async () => {
      await productPageSf.clickElementWithLabel("label", "Size Guide");
      await productPageSf.page.waitForSelector(productPageSf.xpathBtnInSizeGuidePopup);
      const rowSizeGuide = await productPageSf.countLineSizeChart("row");
      const columnSizeGuide = await productPageSf.countLineSizeChart("column");
      const listSize: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSize.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      listSize.forEach(element => {
        expect(dataSizeGuide[0].includes(element)).toBe(true);
      });
    });
  });

  test(`Verify Size guide Product trên Store front khi không import variant của product từ màn import list @SB_PLB_OTMSC_69`, async ({
    dashboard,
    context,
  }) => {
    await test.step(`Dropship  products  >  AliExpress  products  >  Search  product  >  Click  chọn  product  >  Click  Import  to  your  store > Select  1  vài  variant  >  Click  Add  to  store`, async () => {
      dropshipCatalogPage = new DropshipCatalogPage(dashboard, domain);
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.searchWithKeyword(productName);
      await dropshipCatalogPage.searchAndClickViewRequestDetail(productName);
      await dropshipCatalogPage.clickBtnImportToStore();
      for (let i = 1; i <= totalVariant; i++) {
        await dropshipCatalogPage.selectVariantToImport(i);
      }
      await dropshipCatalogPage.importFirstProductToStore();
    });
    await test.step(`Click button Edit product`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        dropshipCatalogPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForSelector(productPage.xpathMedia);
      expect(await productPage.countVariantProduct()).toEqual(totalVariant);
    });
    await test.step(`Click  button  View  on  store  >>  Click  Size  Guide`, async () => {
      const [sfPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View"),
      ]);
      productPageSf = new SFProduct(sfPage, domain);
      await productPageSf.clickElementWithLabel("label", "Size Guide");
      await productPageSf.page.waitForLoadState("networkidle");
      const rowSizeGuide = await productPageSf.countLineSizeChart("row");
      const columnSizeGuide = await productPageSf.countLineSizeChart("column");
      const listSize: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSize.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      listSize.forEach(element => {
        expect(dataSizeGuide[0].includes(element)).toBe(true);
      });
    });

    // Delete product
    await productPage.deleteProductInProductDetail();
  });

  test(`Verify không hiển thị Size guide khi product chưa được map size chart hoặc map với size chart bị disable @SB_PLB_OTMSC_71`, async ({
    page,
    conf,
  }) => {
    await test.step(`Mở storefront > Vào product detail`, async () => {
      const homePage = new SFHome(page, domain);
      const products = conf.caseConf.products;
      for (let i = 0; i < products.length; i++) {
        productPageSf = await homePage.gotoProductDetailByHandle(products[i].product_handle, products[i].product_name);
        expect(await productPageSf.isTextVisible(textLink, 4)).toEqual(false);
      }
    });
  });
  test(`Verify size guide của product có 1 variant trên store front @SB_PLB_OTMSC_73`, async ({
    authRequest,
    context,
    dashboard,
  }) => {
    await test.step(`Vào Dropship  products  >  AliExpress  products  >  Search  product  >  Click  chọn  product  >  Click  Import  to  your  store`, async () => {
      dropshipCatalogPage = new DropshipCatalogPage(dashboard, domain);
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.searchWithKeyword(productName);
      await dropshipCatalogPage.searchAndClickViewRequestDetail(productName);
      await dropshipCatalogPage.clickBtnImportToStore();
    });
    await test.step(`Select  tất  cả  variant  >  Click  Add  to  store`, async () => {
      for (let i = 1; i <= totalVariant; i++) {
        await dropshipCatalogPage.selectVariantToImport(i);
      }
      await dropshipCatalogPage.importFirstProductToStore();
    });
    await test.step(`Click  Edit  product  >  Remove  hết  variant  product,  chỉ  để  lại  1  variant`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        dropshipCatalogPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productAPI = new ProductAPI(domain, authRequest);
      productPage = new ProductPage(newPage, domain);
      const productId = Number(await productPage.getProductIDByURL());
      const variantsId = await productAPI.getDataProductById(productId);
      await productPage.page.waitForLoadState("networkidle");
      const variant = variantsId.product.reference_keys;
      for (let i = 0; i < variant.length - 1; i++) {
        await productAPI.deleteVariantById(productId, variant[i]);
      }
    });
    await test.step(`Click  view  on  store`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View", 1),
      ]);
      productPageSf = new SFProduct(newPage, domain);
      await expect(productPageSf.page.locator(productPageSf.xpathSizeGuideHyperlink)).toHaveCount(1);
    });
    // Delete product
    await productPage.deleteProductInProductDetail();
  });

  test(`Verify data variant name của product catalog / private detail được
   thay thế bởi size chart name @SB_PLB_OTMSC_74`, async ({ dashboard, conf, context }) => {
    const variants = conf.caseConf.variants_so;
    await test.step(`Vào Dropship product > AliExpress products > Mở product private detail`, async () => {
      dropshipCatalogPage = new DropshipCatalogPage(dashboard, domain);
      await dropshipCatalogPage.goToProductRequest();
      await dropshipCatalogPage.page.waitForLoadState("networkidle");
      await dropshipCatalogPage.searchWithKeyword(productName);
      await dropshipCatalogPage.searchAndClickViewRequestDetail(productName);
      for (let i = 0; i < variants.length; i++) {
        expect(await dropshipCatalogPage.getVariantsSODetail(i + 1)).toEqual(variants[i].shoseSize);
      }
    });
    await test.step(`Click Import to store > Add product to store`, async () => {
      await dropshipCatalogPage.clickBtnImportToStore();
      for (let i = 1; i <= totalVariant; i++) {
        await dropshipCatalogPage.selectVariantToImport(i);
      }
      await dropshipCatalogPage.importFirstProductToStore();
    });
    await test.step(`Click Edit product`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        dropshipCatalogPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForSelector(productPage.xpathVariantOnProductDetail);
      expect(await productPage.countVariantProduct()).toEqual(totalVariant);
    });
    await test.step(`Click view on store > Click Size guide`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View", 1),
      ]);
      productPageSf = new SFProduct(newPage, domain);
      await productPageSf.clickElementWithLabel("label", "Size Guide");
      await productPageSf.page.waitForLoadState("networkidle");
      const rowSizeGuide = await productPageSf.countLineSizeChart("row");
      const columnSizeGuide = await productPageSf.countLineSizeChart("column");
      const listSize: Array<string> = [];
      for (let i = 2; i <= rowSizeGuide; i++) {
        for (let j = 1; j <= columnSizeGuide; j++) {
          listSize.push(await productPageSf.getDataTable(1, i, j));
        }
      }
      listSize.forEach(element => {
        expect(listSize.length).toEqual(dataSizeGuide[0].length);
        expect(dataSizeGuide[0].includes(element)).toBe(true);
      });
    });
    // Delete product
    await productPage.deleteProductInProductDetail();
  });
});
