import { test } from "@fixtures/odoo";
import { ProductAPI } from "@pages/api/product";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";
import { expect } from "@playwright/test";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";

test.describe("Variant non image", async () => {
  let dropshipCatalogPage: DropshipCatalogPage;
  let productName: string;
  let domain: string;
  let productPage: ProductPage;
  let errorMessage: string;
  let errorMessageHeadPage: string;
  let productAPI: ProductAPI;
  let productPageSf: SFProduct;
  let variantName: Array<string>;
  let errorMessageVariantList: string;
  let plusbaseProductAPI: PlusbaseProductAPI;
  let caseId: string;
  let productId: number;

  test.beforeEach(async ({ conf, page, dashboard, authRequest }) => {
    domain = conf.suiteConf.domain;
    productName = conf.caseConf.product_name;
    productPageSf = new SFProduct(page, domain);
    errorMessage = conf.caseConf.error_message;
    errorMessageHeadPage = conf.suiteConf.error_message_head_page;
    variantName = conf.caseConf.variant_name;
    errorMessageVariantList = conf.caseConf.error_message_variant_list;
    (caseId = conf.caseConf.case_id), (productId = conf.caseConf.product_id);
    plusbaseProductAPI = new PlusbaseProductAPI(domain, authRequest);
    productPage = new ProductPage(page, domain);

    await test.step(`Import product to store `, async () => {
      dropshipCatalogPage = new DropshipCatalogPage(dashboard, domain);
      if (caseId == "SB_PLB_VNI_41") {
        await dropshipCatalogPage.goToProductRequestDetail(productId);
        await dropshipCatalogPage.clickBtnImportToStore();
        await dropshipCatalogPage.importFirstProductToStore();
        //  Verify alert màn import list
        expect(await dropshipCatalogPage.isTextVisible(errorMessage)).toBeTruthy();
      } else {
        const sbProductId = await plusbaseProductAPI.importProductToStoreByAPI(productId);
        await productPage.goToProdDetailByID(domain, sbProductId);
      }
    });
  });

  test.afterEach(async ({}) => {
    await productPage.deleteProductInProductDetail();
  });

  test(`@SB_PLB_VNI_39 Verify alert khi xóa ảnh trong tab Media là ảnh của variant trong màn product detail`, async ({
    context,
    authRequest,
    conf,
  }) => {
    let nameVariant: string;
    await test.step(`Vào product detail > Tab Media > Click xóa 1 ảnh là ảnh của variant > Verify hiển thị popup confirm xóa`, async () => {
      await productPage.deleteImageProduct(false);
      expect(await productPage.isTextVisible(conf.caseConf.content_popup)).toBeTruthy();
      expect(await productPage.isTextVisible(errorMessage)).toBeTruthy();
      //Click Discard
      await productPage.clickOnBtnWithLabel("Discard", 2);
      expect(await productPage.isTextVisible(conf.suiteConf.content_popup)).toBeFalsy();
    });

    await test.step(`Click Delete > Verify hiển thị alert ở head page và tab variant`, async () => {
      await productPage.deleteImageProduct(false);
      await productPage.clickOnBtnWithLabel("Delete");
      expect(await productPage.isTextVisible(errorMessageHeadPage)).toBeTruthy();
      expect(await productPage.isTextVisible(errorMessageVariantList)).toBeTruthy();
    });

    await test.step(`Click texlink "Click to filter" và "Click unfilter" > Verify list variant hiển thị `, async () => {
      // Click to filter
      await productPage.clickElementWithLabel("a", "Click to filter");
      expect(await productPage.countVariantProduct()).toEqual(1);
      nameVariant = await productPage.getTextGroupVariant();
      // Click to unfilter
      await productPage.clickElementWithLabel("a", "Click to unfilter");
      productAPI = new ProductAPI(domain, authRequest);
      const productId = Number(await productPage.getProductIDByURL());
      const productInfor = await productAPI.getDataProductById(productId);
      expect(await productPage.countVariantProduct()).toEqual(productInfor.product.variants.length);
    });

    await test.step(`Click Save changes> Click View > Verify variant hiển thị ngoài SF `, async () => {
      await productPage.clickElementWithLabel("button", "Save changes");
      expect(await productPage.isTextVisible("Product was successfully saved!")).toBeTruthy();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View", 1),
      ]);
      productPageSf = new SFProduct(newPage, domain);
      await expect(productPageSf.page.locator(productPageSf.xpathBtnWithLabel(nameVariant))).toBeHidden();
    });
  });

  test(`@SB_PLB_VNI_42 Verify alert khi xóa ảnh trong tab Variants trong màn product detail`, async ({
    conf,
    context,
  }) => {
    await test.step(`Vào product detail > Tab Variant > Click vào ảnh variant đầu tiên > Click bỏ chọn ảnh variants  > Verify alert hiển thị `, async () => {
      await productPage.page.click(productPage.xpathImageVariant(variantName[0]));
      expect(await productPage.isTextVisible(conf.caseConf.content_popup)).toBeTruthy();
      // CLick button Cancel > Đóng popup
      await productPage.clickOnBtnWithLabel("Cancel");
      expect(await productPage.isTextVisible(conf.suiteConf.content_popup)).toBeFalsy();
      //Click vào ảnh variant đầu tiên > Click bỏ chọn ảnh variants
      await productPage.page.click(productPage.xpathImageVariant(variantName[0]));
      await productPage.page.click(productPage.xpathImageInPopup);
      expect(await productPage.isTextVisible(errorMessage)).toBeTruthy();
    });

    await test.step(`Click Save > Verify hiển thị alert ở head page`, async () => {
      await productPage.clickOnBtnWithLabel("Save");
      expect(await productPage.isTextVisible(errorMessageHeadPage)).toBeTruthy();
    });

    await test.step(` Click Save changes > Click View > Verify variant hiển thị ngoài SF`, async () => {
      await productPage.clickElementWithLabel("button", "Save changes");
      expect(await productPage.isTextVisible("Product was successfully saved!")).toBeTruthy();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View", 1),
      ]);
      productPageSf = new SFProduct(newPage, domain);
      await expect(productPageSf.page.locator(productPageSf.xpathBtnWithLabel(variantName[0]))).toBeHidden();
    });
  });

  test(`@SB_PLB_VNI_43 Verify alert khi xóa ảnh trong edit variants trong TH variant có 1 ảnh`, async ({ context }) => {
    await test.step(`Vào product detail > Click icon Edit đầu tiên trong tab Variant > Vào box media > Xóa ảnh variant > Verify alert hiển thị`, async () => {
      await productPage.page.click(productPage.xpathIconEditVariant(variantName[0]));
      await productPage.deleteImageProduct(false);
      expect(await productPage.isTextVisible(errorMessage)).toBeTruthy();
    });

    await test.step(`Click Save changes > Back lại màn product detail > Verify hiển thị alert ở head page màn product detail`, async () => {
      await productPage.clickElementWithLabel("button", "Save changes");
      expect(await productPage.isTextVisible("Variant has been updated successfully!")).toBeTruthy();
      await productPage.page.click(productPage.xpathLinkActive);
      expect(await productPage.isTextVisible(errorMessageHeadPage)).toBeTruthy();
    });

    await test.step(`Click View > Verify variant hiển thị ngoài SF`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View", 1),
      ]);
      productPageSf = new SFProduct(newPage, domain);
      await expect(productPageSf.page.locator(productPageSf.xpathBtnWithLabel(variantName[0]))).toBeHidden();
    });
  });

  test(`@SB_PLB_VNI_41 Verify alert khi import link Ali bị thiếu ảnh trong màn import list và product detail`, async ({
    context,
  }) => {
    await test.step(`Vào màn import list > Verify alert màn import list `, async () => {
      expect(await dropshipCatalogPage.isTextVisible(errorMessage)).toBeTruthy();
    });

    await test.step(` Click Edit product > Verify hiển thị alert thiếu ảnh ở head page trong màn product detail`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        dropshipCatalogPage.clickOnBtnWithLabel("Edit product"),
      ]);
      productPage = new ProductPage(newPage, domain);
      await productPage.page.waitForSelector(productPage.xpathListMedia);
      expect(await productPage.isTextVisible(errorMessageHeadPage)).toBeTruthy();
    });

    await test.step(`Click View > Verify variant hiển thị ngoài SF`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.clickElementWithLabel("span", "View", 1),
      ]);
      productPageSf = new SFProduct(newPage, domain);
      for (let i = 0; i < variantName.length; i++) {
        await productPageSf.selectVariant(variantName[i]);
        await productPageSf.page.waitForLoadState("load");
        expect(await productPageSf.isTextVisible("Sold out")).toBeTruthy();
        await expect(productPageSf.page.locator(productPageSf.xpathBtnSoldOut(productName))).toBeDisabled();
      }
    });
  });
});
