import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Add new product custom only", () => {
  let productOnSF: SFProduct;
  let product;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    await product.navigateToMenu("Products");
    await product.deleteProduct(conf.suiteConf["pass"]);
  });

  test(`Check tạo CO only thành công với type = Text field @TC_SB_PRO_DFPP_763`, async ({ conf, page }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;
    const customOption = conf.caseConf.custom_option_info;
    const customOptionSF = conf.caseConf.custom_option_sf;

    await test.step(`Tại Menu: Chọn Products >chọn [All products]
    Click btn[Add product]
    Input title và input ảnh`, async () => {
      await product.addNewProductWithData(productInfo);
    });

    await test.step(`1.Click button "Create custom option only"
    2. Add custom option với Type = "Text field"`, async () => {
      await product.clickBtnCustomOptionOnly();
      for (let i = 0; i < customOption.length; i++) {
        await product.addNewCustomOptionWithData(customOption[i]);
      }
      await product.clickOnBtnWithLabel("Save changes");
    });

    await test.step(`Click View on SF > Input data vào Custom option > Click button Add to cart`, async () => {
      const homepage = new SFHome(page, conf.suiteConf["domain"]);
      productOnSF = await homepage.searchThenViewProduct(productInfo.title);
      for (let i = 0; i < customOptionSF.length; i++) {
        await productOnSF.inputCustomOptionSF(customOptionSF[i]);
      }
      await productOnSF.addProductToCart();
    });

    await test.step(`Verify value custom option`, async () => {
      for (let i = 0; i < customOptionSF.length; i++) {
        expect(
          (
            await page
              .locator(
                `//div[contains(@class, 'product-cart__details') and descendant::a[text()='${productInfo.title}']]` +
                  `//p[contains(@class,'product-cart__property')][${i + 1}]`,
              )
              .textContent()
          ).trim(),
        ).toContain(customOptionSF[i].value);
      }
    });
  });
});
