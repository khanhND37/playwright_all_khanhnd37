import { expect, test } from "@core/fixtures";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

test.describe("Verify Upsell funnel dashboard", () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let checkoutPage: CheckoutForm;
  let orderPage: OrderPage;

  test.beforeEach(async ({ dashboard, conf, authRequest, page }) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);

    //create product
    const productListData = conf.suiteConf.product_list;
    for (let i = 0; i < productListData.length; i++) {
      await productAPI.createProduct(productListData[i]);
    }

    // update product
    //dùng wait timeout vì khi thực hiển mở tab memu và search product thì có thể API tạo product chưa tạo xong
    await productPage.page.waitForTimeout(conf.suiteConf.time_out);
    await productPage.navigateToMenu("Products");
    await productPage.searchProduct(conf.caseConf.product_name);
    await productPage.clickTitleProduct(conf.caseConf.product_name);
    await productPage.updateProductDigital(conf.caseConf.update_product);
    await productPage.switchTab("Checkout");
    await productPage.waitUntilElementInvisible(productPage.xpathLoadingTab);
  });

  test.afterEach(async ({ conf }) => {
    //Get product id
    const products = await productAPI.getProducts(conf.suiteConf.paging_param);
    const IdsArray = products?.data?.map(item => item.id);
    // Delete product
    await productAPI.deleteProduct(IdsArray);
  });
  test(` Verify checkout với product chỉ có upsell @SB_SC_SCP_124`, async ({ conf }) => {
    //create offer chỉ có product upSell
    const productUpsell = conf.caseConf.product_upsell_name;
    for (let i = 0; i < productUpsell.length; i++) {
      await productPage.clickBtnAddUpsell(conf.caseConf.button_text[i]);
      await productPage.searchAndSelectProductUpsell(productUpsell[i]);
      await productPage.clickBtnOnPopup(conf.caseConf.button_save);
      await productPage.clickSaveGeneral();
      //wait để active offer tiếp theo không hiển thị popup apply theme
      await productPage.page.waitForTimeout(conf.suiteConf.time_out);
      await productPage.clickToggleStatusUpsell(productUpsell[i]);
      const popup = await productPage.genLoc(productPage.xpathTitlePopup).isVisible();
      if (popup) {
        await productPage.applyDesignOffer(conf.caseConf.button_name, conf.caseConf.theme_name);
      }
    }
    await productPage.clickSaveGeneral();

    for (let i = 0; i < conf.caseConf.list_data_checkout_product.length; i++) {
      const data = conf.caseConf.list_data_checkout_product[i];
      await test.step(`${data.description}`, async () => {
        await checkoutPage.goto(`products/${data.original_product.product_handle}`);
        await checkoutPage.enterEmail(conf.suiteConf.checkout_info.email);
        await checkoutPage.completeInputCardInfo(conf.suiteConf.checkout_info.card);
        await checkoutPage.clickBtnCompleteOrder();
        for (let i = 0; i < data.upsell_downsell_products.length; i++) {
          await checkoutPage.acceptOrRejectProdUpsell(data.upsell_downsell_products[i].is_accept);
          await expect(checkoutPage.genLoc(checkoutPage.xpathBtnLoading)).toBeHidden();
        }
        await expect(checkoutPage.genLoc(checkoutPage.xpathThankYouPageHeader)).toBeVisible();
        const xpathOriginProduct = checkoutPage.getLocatorProductCheckout(data.original_product.product_name);
        await expect(xpathOriginProduct).toBeVisible();
        for (let i = 0; i < data.upsell_downsell_products.length; i++) {
          const productName = data.upsell_downsell_products[i].product_name;
          if (productName !== "") {
            const xpathProductUpsell = checkoutPage.getLocatorProductCheckout(productName);
            await expect(xpathProductUpsell).toBeVisible();
          } else {
            break;
          }
        }
      });

      await test.step(`Chuyển sang tab Order -> Verify thông tin order tại dashboard`, async () => {
        await orderPage.navigateToMenu("Orders");
        await orderPage.openNewestOrder();
        const xpathOriginProduct = orderPage.getLocatorProductOrder(data.original_product.product_name);
        await expect(xpathOriginProduct).toBeVisible();
        for (let i = 0; i < data.upsell_downsell_products.length; i++) {
          const productName = data.upsell_downsell_products[i].product_name;
          if (productName !== "") {
            const xpathProductUpsell = orderPage.getLocatorProductOrder(productName);
            await expect(xpathProductUpsell).toBeVisible();
          } else {
            break;
          }
        }
      });
    }
  });

  test(`Verify checkout với product có cặp upsell & downsell @SB_SC_SCP_125`, async ({ conf }) => {
    //create offer với cả product upsell và down sell
    const productUpsell = conf.caseConf.products_upsell_name;
    for (let i = 0; i < productUpsell.length; i++) {
      await productPage.clickBtnAddUpsell(conf.caseConf.button_text[i]);
      await productPage.searchAndSelectProductUpsell(productUpsell[i]);
      await productPage.clickBtnOnPopup(conf.caseConf.button_save);
      await productPage.clickBtnSelectProductDownSell(productUpsell[i]);
      await productPage.searchAndSelectProductUpsell(conf.caseConf.products_downsell_name[i]);
      await productPage.clickBtnOnPopup(conf.caseConf.button_save);
      await productPage.clickSaveGeneral();
      await productPage.page.waitForTimeout(conf.suiteConf.time_out);
      await productPage.clickToggleStatusUpsell(productUpsell[i]);
      const popup = await productPage.genLoc(productPage.xpathTitlePopup).isVisible();
      if (popup) {
        await productPage.applyDesignOffer(conf.caseConf.button_name, conf.caseConf.theme_name);
        //wait để active offer upseel tiếp theo không hiển thị popup apply theme
        await productPage.page.waitForTimeout(conf.suiteConf.time_out);
      }
      await productPage.clickToggleStatusUpsell(conf.caseConf.products_downsell_name[i]);
      await productPage.clickSaveGeneral();
    }

    for (let i = 0; i < conf.caseConf.checkout_products_upsell_downsell.length; i++) {
      const data = conf.caseConf.checkout_products_upsell_downsell[i];
      await test.step(`${data.description}`, async () => {
        await checkoutPage.goto(`products/${data.original_product.product_handle}`);
        await checkoutPage.enterEmail(conf.suiteConf.checkout_info.email);
        await checkoutPage.completeInputCardInfo(conf.suiteConf.checkout_info.card);
        await checkoutPage.clickBtnCompleteOrder();
        for (let i = 0; i < data.upsell_downsell_products.length; i++) {
          await checkoutPage.acceptOrRejectProdUpsell(data.upsell_downsell_products[i].is_accept);
          await expect(checkoutPage.genLoc(checkoutPage.xpathBtnLoading)).toBeHidden();
        }
        await expect(checkoutPage.genLoc(checkoutPage.xpathThankYouPageHeader)).toBeVisible();
        const xpathOriginProduct = checkoutPage.getLocatorProductCheckout(data.original_product.product_name);
        await expect(xpathOriginProduct).toBeVisible();
        for (let i = 0; i < data.upsell_downsell_products.length; i++) {
          const productName = data.upsell_downsell_products[i].product_name;
          if (productName !== "") {
            const xpathProductUpsell = checkoutPage.getLocatorProductCheckout(productName);
            await expect(xpathProductUpsell).toBeVisible();
          } else {
            break;
          }
        }
      });

      await test.step(`Chuyển sang tab Order -> Verify thông tin order tại dashboard`, async () => {
        await orderPage.navigateToMenu("Orders");
        await orderPage.openNewestOrder();
        const xpathOriginProduct = orderPage.getLocatorProductOrder(data.original_product.product_name);
        await expect(xpathOriginProduct).toBeVisible();
        for (let i = 0; i < data.upsell_downsell_products.length; i++) {
          const productName = data.upsell_downsell_products[i].product_name;
          if (productName !== "") {
            const xpathProductUpsell = orderPage.getLocatorProductOrder(productName);
            await expect(xpathProductUpsell).toBeVisible();
          } else {
            break;
          }
        }
      });
    }
  });

  test(`Verify checkout product free chứa product upsell downsell @SB_SC_SCP_126`, async ({ conf }) => {
    //tạo offer cho product free
    const productUpsell = conf.caseConf.products_upsell_name;
    await productPage.clickBtnAddUpsell(conf.caseConf.button_text);
    await productPage.searchAndSelectProductUpsell(productUpsell);
    await productPage.clickBtnOnPopup(conf.caseConf.button_save);
    await productPage.clickSaveGeneral();
    //wait để active offer tiếp theo không hiển thị popup apply theme
    await productPage.page.waitForTimeout(conf.suiteConf.time_out);
    await productPage.clickToggleStatusUpsell(productUpsell);
    await productPage.applyDesignOffer(conf.caseConf.button_name, conf.caseConf.theme_name);

    await test.step(`Thực hiện checkout product gốc và reject product upsel đầu tiên -> Verify thông tin hiển thị`, async () => {
      await checkoutPage.goto(`products/${conf.caseConf.product_handle}`);
      await checkoutPage.page.reload();
      await checkoutPage.enterEmail(conf.caseConf.email);
      await checkoutPage.clickBtnCompleteOrder();
      await expect(checkoutPage.genLoc(checkoutPage.xpathTextThankYou)).toBeVisible();
    });
  });
});
