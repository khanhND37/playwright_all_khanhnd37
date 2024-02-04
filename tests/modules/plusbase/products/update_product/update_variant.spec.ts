import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { ProductPage } from "@pages/dashboard/products";
import { SFHome } from "@pages/storefront/homepage";
import { ProductAPI } from "@pages/api/product";
import { DropshipCatalogPage } from "@pages/dashboard/dropship_catalog";
import { PlusbaseProductAPI } from "@pages/api/plusbase/product";
import { OdooService } from "@services/odoo";
import { Page } from "@playwright/test";
import { CheckoutAPI } from "@pages/api/checkout";
import { CheckoutInfo, RequestProductData } from "@types";

test.describe("Product catalog plusbase", async () => {
  let shopDomain: string;
  let productPage: ProductPage;
  let homePage: SFHome;
  let firstVariant: string;
  let secondVariant: string;
  let oldColor: string;
  let newColor: string;
  let oldComboName: string;
  let newComboName: string;
  let oldSize: string;
  let newSize: string;
  let productId: number;
  let listVariant: string[];
  let listColor: string[];
  let listSize: string[];
  let productAPI: ProductAPI;
  let plusbasePage: DropshipCatalogPage;
  let checkoutApi: CheckoutAPI;
  let checkoutInfo: CheckoutInfo;
  let duration: number;

  test.beforeEach(async ({ dashboard, conf, authRequest, page }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    productPage = new ProductPage(dashboard, shopDomain);
    firstVariant = conf.caseConf.first_variant;
    secondVariant = conf.caseConf.second_variant;
    oldColor = conf.caseConf.old_color;
    newColor = conf.caseConf.new_color;
    oldComboName = conf.caseConf.old_combo_name;
    newComboName = conf.caseConf.new_combo_name;
    oldSize = conf.caseConf.old_size;
    newSize = conf.caseConf.new_size;
    productId = conf.caseConf.product_id;
    listVariant = conf.caseConf.list_variant;
    listColor = conf.caseConf.list_color;
    listSize = conf.caseConf.list_size;
    duration = conf.suiteConf.duration;
    productAPI = new ProductAPI(shopDomain, authRequest);
    plusbasePage = new DropshipCatalogPage(dashboard, shopDomain);
    checkoutApi = new CheckoutAPI(shopDomain, authRequest, page);
  });

  test(`@SB_PLB_CTL_PC_05 Verify variant  được update khi edit variant tại  section variant options`, async ({
    context,
    conf,
  }) => {
    await test.step(`Vào Products > All products > Click on any product > Click icon at section Variant options`, async () => {
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productId);
      expect(
        await productPage.isTextVisible(
          "Please name the variant options correctly according to the fulfilled values to avoid order cancellations caused by incorrect mapping!",
        ),
      ).toBe(true);
      await productPage.clickOnBtnWithLabel("Edit");

      //Verify hiển thị cột To be fulfilled with với variant Color
      await expect(productPage.locatorVariantOption(firstVariant)).toBeEnabled();
      await productPage.isTextVisible("To be fulfilled with");
      for (const color of listColor) {
        await expect(productPage.locatorVariantOption(color)).toBeEnabled();
        await expect(productPage.locatorVariantOption(color, 2)).toBeDisabled();
      }

      //Verify combo
      await expect(productPage.locatorVariantOption(oldComboName)).toBeEnabled();
      await expect(productPage.locatorVariantOption(conf.caseConf.fulfill_with_combo)).toBeDisabled();
      await productPage.clickOnBtnWithLabel("Cancel");

      //Verify hiển thị cột To be fulfilled with với variant Shoe size
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await expect(productPage.locatorVariantOption(secondVariant)).toBeDisabled();
      await productPage.isTextVisible("To be fulfilled with");
      for (const size of listSize) {
        await expect(productPage.locatorVariantOption(size)).toBeEnabled();
        await expect(productPage.locatorVariantOption(size, 2)).toBeDisabled();
      }
      await productPage.clickOnBtnWithLabel("Cancel");
    });

    await test.step(`Edit variant value > Click button cancel`, async () => {
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.locatorVariantOption(oldColor).fill(newColor);
      await productPage.locatorVariantOption(oldComboName).fill(newComboName);
      await productPage.clickOnBtnWithLabel("Cancel");
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await productPage.locatorVariantOption(oldSize).fill(newSize);
      await productPage.clickOnBtnWithLabel("Cancel");

      //Verify list variant
      for (const color of listColor) {
        await expect(productPage.locatorVariant(color)).toBeVisible();
      }

      for (const size of listSize) {
        await expect(productPage.locatorVariant(size)).toBeVisible();
      }
    });

    await test.step(`Edit variant value > Click button Save`, async () => {
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.locatorVariantOption(oldColor).fill(newColor);
      await productPage.locatorVariantOption(oldComboName).fill(newComboName);
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await productPage.editVariantProduct(oldSize, newSize);
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
      for (const variant of listVariant) {
        await expect(productPage.locatorVariant(variant)).toBeVisible();
      }

      const [newPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductOnSF()]);
      homePage = new SFHome(newPage, shopDomain);
      await expect(homePage.isTextVisible(newColor)).toBeTruthy();
      await expect(homePage.isTextVisible(newSize)).toBeTruthy();
      await expect(homePage.isTextVisible(newComboName)).toBeTruthy();
      await homePage.page.close();

      //Back lại product detail trong dashboard > Edit lại variant của product như ban đầu
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.locatorVariantOption(newColor).fill(oldColor);
      await productPage.locatorVariantOption(newComboName).fill(oldComboName);
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await productPage.editVariantProduct(newSize, oldSize);
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
    });
  });

  test(`@SB_PLB_CTL_PC_06 Verify các field options tại màn variant detail bị disable`, async ({ conf }) => {
    await test.step(`Vào Products > All products > Click on any product > Click icon Edit at variant combo >
    Hover vào các field ở mục options`, async () => {
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productId);
      await productPage.clickIconEditVariant(conf.caseConf.combo_name);
      const attributeValueColor = await productPage.getAttributeValueOptionVariant(firstVariant, "disabled");
      expect(attributeValueColor).toEqual("disabled");
      const attributeValueSize = await productPage.getAttributeValueOptionVariant(secondVariant, "disabled");
      expect(attributeValueSize).toEqual("disabled");
      expect(await productPage.getAttributeValueOptionVariant("To be fulfilled with", "disabled")).toEqual("disabled");
      await expect(productPage.locatorTextboxByLabel("To be fulfilled with")).toBeDisabled();
      await productPage.locatorTextboxByLabel(firstVariant).hover();
      expect(await productPage.isElementExisted(productPage.xpathTooltipInVariantDetail)).toBe(true);
    });

    await test.step(`Click icon Edit at any variant đơn > Hover vào các field ở mục options`, async () => {
      for (const variant of listVariant) {
        await productPage.clickOnTextLinkWithLabel(variant);
        const attributeValueColor = await productPage.getAttributeValueOptionVariant(firstVariant, "disabled");
        expect(attributeValueColor).toEqual("disabled");
        const attributeValueSize = await productPage.getAttributeValueOptionVariant(secondVariant, "disabled");
        expect(attributeValueSize).toEqual("disabled");
        expect(await productPage.getAttributeValueOptionVariant("To be fulfilled with", "disabled")).toEqual(
          "disabled",
        );

        await productPage.locatorTextboxByLabel(firstVariant).hover();
        expect(await productPage.isElementExisted(productPage.xpathTooltipInVariantDetail)).toBe(true);
      }
    });
  });

  test(`@SB_PLB_CTL_PC_07 Verify màn SO detail hiển thị list product được import từ SO`, async ({
    authRequest,
    conf,
    odoo,
  }) => {
    const aliUrlRes = conf.caseConf.urls_request[0].ali_url;
    const maxRetry = conf.caseConf.max_retry_time;
    const state = conf.caseConf.urls_request[0].state;
    const fullProductName = conf.caseConf.full_product_name;
    await test.step(`vào Dropship Products > AliExpress products > Request product from ali`, async () => {
      const plusbaseProductAPI = new PlusbaseProductAPI(shopDomain, authRequest);

      // Clean data before request
      await plusbasePage.cleanProductAfterRequest(odoo, plusbaseProductAPI, {
        url: aliUrlRes,
        odoo_partner_id: conf.suiteConf.odoo_partner_id,
        cancel_reason_id: conf.suiteConf.cancel_reason_id,
        skip_if_not_found: true,
      });

      //Request ali product
      const aliProduct: RequestProductData = {
        user_id: parseInt(conf.suiteConf.user_id),
        products: [{ url: aliUrlRes, note: "" }],
        is_plus_base: true,
      };
      await plusbasePage.goToProductRequest();
      await plusbaseProductAPI.requestProductByAPI(aliProduct);
      await plusbasePage.waitProductCrawlSuccessWithUrl(plusbaseProductAPI, aliUrlRes, maxRetry);
      expect(await plusbasePage.isTextVisible(state, 2)).toBe(true);
      await plusbasePage.searchAndClickViewRequestDetail(aliUrlRes);
      await plusbasePage.waitForQuotationDetailLoaded();
      expect(await plusbasePage.isTextVisible(state)).toBe(true);
      expect(await plusbasePage.isTextVisible(fullProductName)).toBe(true);

      await test.step(`Click button " Import to your store"`, async () => {
        await plusbasePage.clickBtnImportToStore();
        await plusbasePage.importFirstProductToStore();
        expect(await plusbasePage.isVisibleProductImportSuccess(conf.caseConf.product_name)).toBe(true);
      });

      await test.step(`Open SO detail > Verify Time line section ứng với action import`, async () => {
        await plusbasePage.goToProductRequest();
        await plusbasePage.searchWithKeyword(aliUrlRes);
        await plusbasePage.waitTabItemLoaded();
        expect(await plusbasePage.countSearchResult()).toEqual(1);
        await plusbasePage.clickProductItemBaseOnUrl(aliUrlRes);
        await plusbasePage.waitForQuotationDetailLoaded();
        expect(await plusbasePage.isTextVisible("Product imported to store")).toBe(true);
        expect(await plusbasePage.isTextVisible(fullProductName, 2)).toBe(true);
      });

      await test.step(`Click vào link imported product`, async () => {
        await plusbasePage.clickOnTextLinkWithLabel(fullProductName);
        await productPage.page.waitForLoadState("load");
        expect(await productPage.isSubMenuActived("All products")).toBe(true);
        await productPage.page.waitForSelector(productPage.xpathProductVariantDetail);
        expect(await productPage.isTextVisible(fullProductName, 2)).toBe(true);
      });

      await test.step(`Verify thứ tự variant trong product detail `, async () => {
        let i = 1;
        for (const variant of listSize) {
          expect(await productPage.getTextContent(productPage.xpathVariantOptionValue("Shoe Size", i))).toEqual(
            variant,
          );
          i++;
        }

        //delete product after run test case
        await productPage.clickOnBtnWithLabel("Delete product", 1);
        await productPage.clickOnBtnWithLabel("Delete product", 2);
      });
    });
  });

  test(`@SB_PLB_CTL_PC_08 Verify UI màn create combo`, async ({ conf }) => {
    let variant = conf.caseConf.data[0].combo.variant;
    let quantityCombo = conf.caseConf.data[0].combo.quantity_combo;
    let sellingPrice = conf.caseConf.data[0].combo.selling_price;
    let comboName = conf.caseConf.data[0].combo.name;
    const fulfillValueInPopup = conf.caseConf.data[0].combo.fulfill_value_in_popup_create_combo;
    let actComboName: string;
    await test.step(`Vào Products > All products > Click on any product > Create combo > Choose 'Group combo by' > Choose 'option to create combo'>   Hover icon 'i' at Combo name`, async () => {
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productId);

      // Xoá variant combo
      const res = await productAPI.countComboInProduct(productId.toString());
      const comboIds = res.combo_variant_ids;
      for (let i = 0; i < comboIds.length; i++) {
        await productAPI.deleteVariantById(productId, comboIds[i]);
      }

      //Tạo combo
      await productPage.page.reload();
      await productPage.createCombo(variant, quantityCombo, sellingPrice);
      expect(await productPage.getTooltipInCreateCombo()).toEqual(
        "Please name the combo according to the correct quantity of items in one set to avoid order cancellations caused by incorrect mapping!",
      );
      expect(await productPage.isTextVisible("to be fulfill with")).toBe(true);
      for (let i = 1; i <= quantityCombo; i++) {
        actComboName = await productPage.page.locator(productPage.xpathTextboxInCreateCombo(i, 1)).inputValue();
        expect(actComboName).toEqual(comboName);
        await expect(productPage.page.locator(productPage.xpathTextboxInCreateCombo(i, 2))).toHaveValue(
          fulfillValueInPopup,
        );
        await expect(productPage.page.locator(productPage.xpathTextboxInCreateCombo(i, 2))).toHaveAttribute("disabled");
      }
    });

    await test.step(`Click button Save`, async () => {
      await productPage.clickOnBtnWithLabel("Save", 1);
      await productPage.clickOnBtnWithLabel("Finish", 1);
      await productPage.page.reload();
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await expect(productPage.locatorVariantOption(comboName)).toBeEnabled();
      await expect(productPage.locatorVariantOption(conf.caseConf.data[0].combo.fulfill_with_combo)).toBeDisabled();
      await productPage.clickOnBtnWithLabel("Cancel");
    });

    await test.step(`Tại section Variant options> Edit variant value > Tạo combo với variant vừa sửa > CLick Save`, async () => {
      variant = conf.caseConf.data[1].combo.variant;
      quantityCombo = conf.caseConf.data[1].combo.quantity_combo;
      sellingPrice = conf.caseConf.data[1].combo.selling_price;
      comboName = conf.caseConf.data[1].combo.name;
      const fulfillWith = conf.caseConf.data[1].combo.fulfill_value_in_popup_create_combo;
      const productId1 = conf.caseConf.product_id1;

      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productId1);
      // Xoá variant combo
      const res = await productAPI.countComboInProduct(productId1);
      const comboIds = res.combo_variant_ids;
      for (let i = 0; i < comboIds.length; i++) {
        await productAPI.deleteVariantById(productId1, comboIds[i]);
      }
      await productPage.page.reload();

      //Reset data
      await productPage.page.waitForSelector(productPage.xpathProductVariantDetail);
      if (await productPage.isTextVisible(conf.caseConf.data[1].new_size, 1, duration)) {
        await productPage.clickOnBtnWithLabel("Edit", 2);
        await productPage.editVariantProduct(conf.caseConf.data[1].new_size, conf.caseConf.data[1].old_size);
        await productPage.clickOnBtnWithLabel("Save changes");
        expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
        await productPage.waitForToastMessageHide("Product was successfully saved!");
        await productPage.page.reload();
        await productPage.page.waitForSelector(productPage.xpathProductVariantDetail);
      }

      //Edit variant
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await productPage.locatorVariantOption(conf.caseConf.data[1].old_size).fill(conf.caseConf.data[1].new_size);
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
      await productPage.page.reload();
      await productPage.page.waitForSelector(productPage.xpathProductVariantDetail);
      await expect(productPage.locatorVariant(conf.caseConf.data[1].new_size)).toBeVisible();

      //Tạo combo
      await productPage.createCombo(variant, quantityCombo, sellingPrice);
      for (let i = 1; i <= quantityCombo; i++) {
        actComboName = await productPage.page.locator(productPage.xpathTextboxInCreateCombo(i, 1)).inputValue();
        expect(actComboName).toEqual(comboName);
        await expect(productPage.page.locator(productPage.xpathTextboxInCreateCombo(i, 2))).toHaveValue(fulfillWith);
        await expect(productPage.page.locator(productPage.xpathTextboxInCreateCombo(i, 2))).toHaveAttribute("disabled");
      }
      await productPage.clickOnBtnWithLabel("Save", 1);
      await productPage.clickOnBtnWithLabel("Finish", 1);
      await productPage.page.reload();
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await expect(productPage.locatorVariantOption(comboName)).toBeEnabled();
      await expect(productPage.locatorVariantOption(conf.caseConf.data[1].combo.fulfill_with_combo)).toBeDisabled();

      //Update data after run test case
      await productPage.locatorVariantOption(conf.caseConf.data[1].new_size).fill(conf.caseConf.data[1].old_size);
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Save changes");
    });
  });

  test(`@SB_PLB_CTL_PC_01 Verify hiển thị product catalog unpublished`, async ({ conf, odoo }) => {
    const productName = conf.caseConf.product_name;
    const productOdoo = OdooService(odoo);
    const productIdOdoo = conf.caseConf.product_id_odoo;

    await test.step(`Vào odoo > Sale > Product template detail > Click checkbox " Publish PlusBase Product" > Save`, async () => {
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productId);
      await productPage.page.waitForLoadState("load");
      expect(await productPage.isTextVisible(productName, 2)).toBe(true);
      const dataUnpublish = {
        x_is_plusbase_published: false,
      };

      await productOdoo.updateProductTemplate([productIdOdoo], dataUnpublish);

      //verify unpublish thành công
      expect(await productOdoo.isPublishProduct(productIdOdoo)).toBe(false);
    });

    await test.step(`Vào Dropship products > Catalog > Search product`, async () => {
      await plusbasePage.goToCatalogPage(shopDomain);
      await plusbasePage.searchProductcatalog(productName);
      expect(await plusbasePage.isTextVisible(`Sorry, there's no matched product for “${productName}”`)).toBe(true);
    });

    await test.step(`Vào All product > Search product > Vào product detail > Click "View on catatog" > Verify màn SO detail`, async () => {
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productId);
      await productPage.clickOnBtnWithLabel("View on catalog");
      await plusbasePage.page.waitForLoadState("load");
      expect(await plusbasePage.isTextVisible(productName)).toBe(true);
      expect(await plusbasePage.isTextVisible("This quotation has expired")).toBe(true);

      //update lại data: publish sản phẩm catalog
      const dataPublish = {
        x_is_plusbase_published: true,
      };

      await productOdoo.updateProductTemplate([productIdOdoo], dataPublish);
      await plusbasePage.page.reload();
      expect(await plusbasePage.isTextVisible("Import to your store")).toBe(true);
      await expect(plusbasePage.page.locator(plusbasePage.xpathBtnImportToYourStore)).toBeEnabled();
    });
  });

  test(`@SB_PLB_CTL_PC_09 Verify UI màn import list`, async ({ conf, context }) => {
    const aliUrlRes = conf.caseConf.urls_request[0].ali_url;
    const fullProductName = conf.caseConf.full_product_name;

    await test.step(`vào Dropship Products > AliExpress products > Click on any item > Click button Import to your  store`, async () => {
      await plusbasePage.goToProductRequest();
      await plusbasePage.searchWithKeyword(aliUrlRes);
      await plusbasePage.waitTabItemLoaded();
      expect(await plusbasePage.countSearchResult()).toEqual(1);
      await plusbasePage.clickProductItemBaseOnUrl(aliUrlRes);
      await plusbasePage.waitForQuotationDetailLoaded();
      expect(await plusbasePage.isTextVisible(fullProductName, 1)).toBe(true);
      await plusbasePage.clickBtnImportToStore();

      //verify UI màn import list
      expect(await plusbasePage.isTextVisible("Pricing", 1)).toBe(false);
      expect(await plusbasePage.isTextVisible("Variants")).toBe(true);
      expect(await plusbasePage.isTextVisible("Group", 1)).toBe(true);
      expect(await plusbasePage.isTextVisible("Cost", 1)).toBe(true);
      expect(await plusbasePage.isTextVisible("Selling price", 1)).toBe(true);
      expect(await plusbasePage.isTextVisible("Compare at price", 1)).toBe(true);
      expect(await plusbasePage.isTextVisible("Profit margin", 1)).toBe(true);
      const imageUrl = conf.caseConf.image_url;
      let i = 1;
      for (const variant of listVariant) {
        expect(await plusbasePage.genLoc(plusbasePage.xpathImgVariantImport(i, 2)).getAttribute("src")).toContain(
          imageUrl,
        );
        expect(await plusbasePage.isTextVisible(variant, 1)).toBe(true);
        i++;
      }
    });

    await test.step(`Click button Import`, async () => {
      await plusbasePage.importFirstProductToStore();
      expect(await plusbasePage.isVisibleProductImportSuccess(conf.caseConf.product_name)).toBe(true);

      //clear data after run test case
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        (await plusbasePage.editProductLocator()).click(), // Opens a new tab
      ]);
      productPage = new ProductPage(newPage, shopDomain);
      await productPage.page.waitForSelector(productPage.xpathProductVariantDetail);
      await productPage.deleteProductInProductDetail();
    });
  });

  test(`@SB_PLB_CTL_PC_12 Verify result sau khi search product catalog kết hợp nhiều điều kiện`, async ({
    conf,
    context,
  }) => {
    await test.step(`Vào Dropship products > Catalog > Search product by product name`, async () => {
      //Precondition: Checkout product
      const listProduct = conf.caseConf.list_product;
      const productsCheckout = conf.caseConf.products_checkout;
      for (let i = 0; i < conf.caseConf.number_order; i++) {
        checkoutInfo = await checkoutApi.createAnOrderWithCreditCard({ productsCheckout: productsCheckout });
        expect(checkoutInfo.order.id).toBeGreaterThan(0);
      }

      //Search product by product name and view product
      await plusbasePage.goToCatalogPage(shopDomain);
      let newPage: Page;
      for (const productName of listProduct) {
        await plusbasePage.searchProductcatalog(productName);
        expect(await plusbasePage.isTextVisible(productName)).toBe(true);
        newPage = await plusbasePage.clickElementAndNavigateNewTab(
          context,
          await plusbasePage.productSearchResult(productName),
        );
        await newPage.close();
      }
    });

    await test.step(`Click Filter > Chọn range product cost > Chọn range shipping fee > Chọn Best seller: This month > Input number of view > Input number of sold > Click button Apply`, async () => {
      await plusbasePage.searchProductcatalog("");
      await plusbasePage.filterProductCatalog(conf.caseConf.filter_catalog);
      await expect(plusbasePage.page.locator(plusbasePage.xpathCatalogProductView).first()).toBeVisible({
        timeout: 60000,
      });
      expect(
        await plusbasePage.checkValidProductCost(
          Number(conf.caseConf.min_product_cost),
          Number(conf.caseConf.max_product_cost),
        ),
      ).toBe(true);
    });
  });
});
