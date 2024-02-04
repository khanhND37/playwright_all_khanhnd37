import { DefaultGetProductAPIParam } from "@constants/shopbase_creator/product/param";
import { expect } from "@core/fixtures";
import { test } from "@fixtures/website_builder";
import { waitTimeout } from "@core/utils/api";
import { snapshotDir, waitSelector } from "@core/utils/theme";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { AllProductStorefront } from "@pages/shopbase_creator/storefront/all_product";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import type { ProductDetailElement } from "@types";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";

test.describe("Verify product list", () => {
  let allProduct: AllProductStorefront;
  let productAPI: ProductAPI;
  let productDataList: Array<ProductDetailElement>;

  test.beforeEach(async ({ conf, authRequest, page }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    allProduct = new AllProductStorefront(page, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  test(`Verify product list default @SB_SC_SCSF_SCSP_2`, async ({ conf, builder, snapshotFixture }) => {
    productDataList = conf.caseConf.list_products;

    await test.step(`Đi đến trang home page của shop -> Click All product trên menu bar. Check giao diện trang all products default khi không có product`, async () => {
      await allProduct.gotoHomePage();
      await allProduct.genLoc(allProduct.xpathLabelAllProduct).click();
      await expect(allProduct.genLoc(allProduct.xpathLabelAllProduct)).toBeVisible();
      await waitTimeout(conf.suiteConf.timeout);
      const urlPage = await allProduct.getURL();
      expect(urlPage).toEqual(`https://${conf.suiteConf.domain}/collections/all`);

      await snapshotFixture.verify({
        page: allProduct.page,
        selector: allProduct.xpathAllProduct,
        snapshotName: `PREVIEW - ${conf.caseConf.thumbnail_default}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });

      await test.step(`Click vào một vị trí bất kỳ product trong list product`, async () => {
        await allProduct.clickTitleProduct(conf.caseConf.product_sample_title);
        expect(urlPage).toEqual(`https://${conf.suiteConf.domain}/collections/all`);
      });

      await test.step(`Tạo 3 product bằng API -> Đi đến trang  All product của shop. Check giao diện trang all products`, async () => {
        //Create product with api
        for (let i = 0; i < productDataList.length; i++) {
          const dataProduct = await productAPI.createProduct(productDataList[i]);
          const productId = dataProduct.data.product.id;
          //apply template
          await builder.applyTemplate({
            templateId: conf.suiteConf.apply_template.template_id,
            productId: productId,
            type: conf.suiteConf.apply_template.type,
          });
        }
        await allProduct.gotoHomePage();
        await allProduct.genLoc(allProduct.xpathLabelAllProduct).click();
        await waitTimeout(conf.suiteConf.timeout);
        await expect(allProduct.genLoc(allProduct.xpathLabelAllProduct)).toBeVisible();
        const urlPage = await allProduct.getURL();
        expect(urlPage).toEqual(`https://${conf.suiteConf.domain}/collections/all`);

        // check List product hiển thị theo "Newest"
        const length = conf.caseConf.list_products.length;
        for (let i = 0; i < length; i++) {
          const productName = await allProduct.getTextContent(`(${allProduct.xpathLabelProduct})[${i + 1}]`);
          const index = Number(length) - i - 1;
          expect(productName).toEqual(productDataList[index].product.title);
        }
      });
    });

    await test.step(`Click vào thumbnail của sản phẩm`, async () => {
      await allProduct.clickTitleProduct(productDataList[1].product.title);
      await expect(allProduct.genLoc(allProduct.xpathLabelCheckoutForm)).toBeVisible();
    });
  });

  test(`Verify product trên trang All product thay đổi tương ứng với khi edit trong dashboard @SB_SC_SCSF_SCSP_3`, async ({
    builder,
    conf,
    dashboard,
  }) => {
    const productInfo = conf.caseConf.product_info;
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const updateProduct = conf.caseConf.update_products;

    await test.step(`Tạo 1 product có giá free. Check hiển thị product vừa tạo ngoài storefront`, async () => {
      const dataProduct = await productAPI.createProduct(productInfo);
      const productId = dataProduct.data.product.id;
      //apply template
      await builder.applyTemplate({
        templateId: conf.suiteConf.apply_template.template_id,
        productId: productId,
        type: conf.suiteConf.apply_template.type,
      });

      await allProduct.gotoCollectionsAll(conf.suiteConf.domain);
      const productName = await allProduct.getTextContent(`(${allProduct.xpathLabelProduct})[1]`);
      expect(productName).toEqual(productInfo.product.title);
    });

    await test.step(`Vào dashboard. Thực hiện edit tên, giá product vừa tạo -> Save`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct(productInfo.product.title);
      await productPage.updateProductDigital(updateProduct);
    });

    await test.step(`Đi đến trang home page của shop -> Click All product trên menu bar. Check giao diện trang all products, tại product vừa edit`, async () => {
      await waitTimeout(conf.suiteConf.timeout);
      await allProduct.gotoCollectionsAll(conf.suiteConf.domain);
      const productName = await allProduct.getTextContent(`(${allProduct.xpathLabelProduct})[1]`);
      expect(productName).toEqual(updateProduct.product_title);
      const productPrice = await allProduct.getTextContent(`(${allProduct.xpathPriceProduct})[1]`);
      expect(productPrice).toEqual(`$${updateProduct.pricing_amount}`);
    });
  });

  test(`Kiểm tra chức năng sort product trên trang All product @SB_SC_SCSF_SCSP_7`, async ({ conf, dashboard }) => {
    const sortOption = conf.caseConf.sort_by;
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    //Create product with api
    const productDataList = conf.caseConf.products;
    for (let i = 0; i < productDataList.length; i++) {
      await productAPI.createProduct(productDataList[i]);
      const updateProduct = productDataList[i].update_products;
      await productPage.navigateToMenu("Products");
      await productPage.page.waitForTimeout(1000);
      await productPage.searchProduct(productDataList[i].product.title);
      await productPage.clickTitleProduct(productDataList[i].product.title);
      await productPage.updateProductDigital(updateProduct);
    }

    await test.step(`Trên menu bar, click dropdown button "Sort" > Select lần lượt các option sort`, async () => {
      await allProduct.gotoCollectionsAll(conf.suiteConf.domain);
      const sortOptions = await allProduct.getAllTextContents(allProduct.xpathSortOption);
      expect(sortOptions).toEqual(conf.caseConf.option_sort);
      for (let i = 0; i < sortOption.length; i++) {
        await allProduct.clickSortProduct(sortOption[i].selected_sort);
        await allProduct.page.waitForTimeout(conf.suiteConf.timeout);
        const productSort = sortOption[i].product_sorted;
        for (let j = 0; j < productSort.length; j++) {
          const nameProduct = await allProduct.getTextContent(`(${allProduct.xpathLabelProduct})[${j + 1}]`);
          expect(nameProduct).toEqual(productSort[j].product_name);
        }
      }
    });
  });

  test(`Verify hiển thị product title, price, label của product trên trên trang All product @SB_SC_SCSF_SCSP_5`, async ({
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);

    await test.step(`Tạo 1 product online course có giá free, với kích thước title product <3 dòng bằng API 
    -> Đi đến trang home page của shop 
    -> Click All product trên menu bar. Check giao diện trang all products`, async () => {
      await productAPI.createProduct(conf.caseConf.products.product_free);
      await allProduct.gotoHomePage();
      await allProduct.genLoc(allProduct.xpathLabelAllProduct).click();
      await expect(allProduct.genLoc(allProduct.xpathLabelAllProduct)).toBeVisible();
      await waitTimeout(conf.suiteConf.timeout);
      const urlPage = await allProduct.getURL();
      const productFreeInfo = conf.caseConf.products.product_free;
      expect(urlPage).toEqual(`https://${conf.suiteConf.domain}/collections/all`);
      //get title
      const titleProduct = await allProduct.getInfoProduct(allProduct.xpathTitleProducts, 1);
      expect(titleProduct).toEqual(productFreeInfo.product.title);
      //get price
      const priceProduct = await allProduct.getInfoProduct(allProduct.xpathPriceProducts, 1);
      expect(priceProduct).toEqual("Free");
      //get label
      const labelProduct = await allProduct.getInfoProduct(allProduct.xpathLabelProducts, 1);
      expect(labelProduct).toEqual(productFreeInfo.product.label);
    });

    await test.step(`Tao 1 product Digital download với giá là "One-time payment" với value = 0 với tên title > 3 dòng bằng API 
    -> Đi đến trang home page của shop 
    -> Click All product trên menu bar. Check giao diện trang all products`, async () => {
      const productOnTimePayment = conf.caseConf.products.one_time_payment_free;
      await productAPI.createProduct(productOnTimePayment);
      await productPage.updateProduct(productOnTimePayment.product.title, productOnTimePayment.update_product);
      await allProduct.gotoHomePage();
      await allProduct.genLoc(allProduct.xpathLabelAllProduct).click();
      await expect(allProduct.genLoc(allProduct.xpathLabelAllProduct)).toBeVisible();
      await waitTimeout(conf.suiteConf.timeout);
      //verify pricing
      const priceProduct = await allProduct.getInfoProduct(allProduct.xpathPriceProducts, 1);
      expect(priceProduct).toEqual("Free");
      //verify label
      const labelProduct = await allProduct.getInfoProduct(allProduct.xpathLabelProducts, 1);
      expect(labelProduct).toEqual(productOnTimePayment.product.label);
      //get title
      await snapshotFixture.verify({
        page: allProduct.page,
        selector: allProduct.xpathAllProduct,
        snapshotName: `${conf.caseConf.content}.png`,
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });
    });

    await test.step(`Tạo 1 product type là Coaching session với giá là "One-time payment" với value = $30, tên title < 3 dòng có chứa các ký tự đặc biệt
    -> Đi đến trang home page của shop 
    -> Click All product trên menu bar. Check giao diện trang all products`, async () => {
      const productOnTimePayment = conf.caseConf.products.one_time_payment;
      await productAPI.createProduct(productOnTimePayment);
      await productPage.updateProduct(productOnTimePayment.product.title, productOnTimePayment.update_product);
      await allProduct.gotoHomePage();
      await allProduct.genLoc(allProduct.xpathLabelAllProduct).click();
      await expect(allProduct.genLoc(allProduct.xpathLabelAllProduct)).toBeVisible();
      await waitTimeout(conf.suiteConf.timeout);
      //get title
      const titleProduct = await allProduct.getInfoProduct(allProduct.xpathTitleProducts, 1);
      expect(titleProduct).toEqual(productOnTimePayment.product.title);
      //get price
      const priceProduct = await allProduct.getInfoProduct(allProduct.xpathPriceProducts, 1);
      expect(priceProduct).toContain(productOnTimePayment.update_product.pricing_amount);
      //get label
      const labelProduct = await allProduct.getInfoProduct(allProduct.xpathLabelProducts, 1);
      expect(labelProduct).toEqual(productOnTimePayment.product.label);
    });
  });

  test(`Verify đi đến sale page khi click vào vị trí bất kỳ trong product card @SB_SC_SCSF_SCSP_6`, async ({
    builder,
    dashboard,
    conf,
    page,
  }) => {
    //pre-condition
    const productInfo = conf.caseConf.product_info;
    const dataProduct = await productAPI.createProduct(productInfo);
    const productHandle = dataProduct.data.product.handle;
    const productId = dataProduct.data.product.id;
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const checkoutPage = new CheckoutForm(page, conf.suiteConf.domain);
    //apply template
    await builder.applyTemplate({
      templateId: conf.suiteConf.apply_template.template_id,
      productId: productId,
      type: conf.suiteConf.apply_template.type,
    });
    //update product (price, thumbnail)
    await productPage.updateProduct(productInfo.product.title, productInfo.update_product);
    const locator = conf.caseConf.product_card;

    for (let i = 0; i < locator.length; i++) {
      await test.step(`Tại màn All product -> Click vào vị trí trên product card: ${locator[i].step}`, async () => {
        await allProduct.gotoCollectionsAll(conf.suiteConf.domain);
        await waitSelector(allProduct.page, allProduct.xpathThumbnailProducts);
        await allProduct.clickProductCard(locator[i].locator, productInfo.product.title);
        await allProduct.page.waitForTimeout(conf.caseConf.timeout);
        await (await checkoutPage.page.waitForSelector(checkoutPage.xpathBtnPayNow)).isVisible();
        const urlPage = await allProduct.getURL();
        expect(urlPage).toEqual(`https://${conf.suiteConf.domain}/products/${productHandle}`);
      });
    }

    await test.step(`Điền thông tin vào form checkout:  
       + email: thupham@beekting.netcard checkout:
         + Card number: 4111 1111 1111 1111 
         + Card date: 02/25
         + Card CVV:   113
      -> click Pay now`, async () => {
      await checkoutPage.enterEmail(conf.caseConf.email);
      await checkoutPage.completeOrderWithMethod("Stripe");
      await expect(checkoutPage.genLoc(checkoutPage.xpathThankYouPageHeader)).toBeVisible();
    });
  });

  test(`Verify hiển thị ảnh thumbnail product trên trên trang All product @SB_SC_SCSF_SCSP_4`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    //pre-condition
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const typeThumbnail = conf.caseConf.product_info.thumbnail_link;
    const productInfo = conf.caseConf.product_info;
    const xpathThumbnailFirstProduct = `(${allProduct.xpathThumbnailProducts})[1]`;
    await productAPI.createProduct(productInfo);
    await productPage.navigateToMenu("Products");
    await test.step(` Đi đến trang home page của shop -> Click All product trên menu bar.
     Check giao diện trang all products, tại product vừa tạo `, async () => {
      await allProduct.gotoHomePage();
      await allProduct.genLoc(allProduct.xpathLabelAllProduct).click();
      await expect(allProduct.genLoc(allProduct.xpathLabelAllProduct)).toBeVisible();
      await waitSelector(allProduct.page, xpathThumbnailFirstProduct);
      await snapshotFixture.verify({
        page: allProduct.page,
        selector: xpathThumbnailFirstProduct,
        snapshotName: `Thumbnail default.png`,
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });

      for (let i = 0; i < typeThumbnail.length; i++) {
        await test.step(`Tại màn All product -> Click vào vị trí trên product card: ${typeThumbnail[i].step}`, async () => {
          if (i == 0) {
            await productPage.updateProduct(productInfo.product.title, typeThumbnail[i]);
          } else {
            await productPage.clickButtonDeleteImage();
            await productPage.uploadFileOrMedia(typeThumbnail[i].thumbnail_type, typeThumbnail[i].thumbnail_file_path);
          }
          await allProduct.gotoCollectionsAll(conf.suiteConf.domain);
          await waitSelector(allProduct.page, xpathThumbnailFirstProduct);
          const box = await allProduct.genLoc(xpathThumbnailFirstProduct).boundingBox();
          const ratio = box.width / box.height;
          expect(ratio.toFixed(2)).toEqual((16 / 9).toFixed(2));
          expect(Math.round(box.width)).toEqual(conf.caseConf.size_default.width);
          expect(Math.round(box.height)).toEqual(conf.caseConf.size_default.height);
          await snapshotFixture.verify({
            page: allProduct.page,
            selector: xpathThumbnailFirstProduct,
            snapshotName: `${typeThumbnail[i].thumbnail_name}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: 0.05,
              threshold: 0.1,
              maxDiffPixels: 2000,
            },
          });
        });
      }
    });
  });

  test(`Verify product list trên mobile (Android, IOS) @SB_DP_LPS_16`, async ({ dashboard, pageMobile, conf }) => {
    const typePage = pageMobile;
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    allProduct = new AllProductStorefront(typePage, conf.suiteConf.domain);
    const productDataList = conf.caseConf.products;
    const xpathThumbnailFirstProduct = `(${allProduct.xpathThumbnailProducts})[1]`;
    // Create product with api
    for (const product of productDataList) {
      await productAPI.createProduct(product.product_body);
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct(product.product_body.product.title);
      await productPage.updateProductDigital(product.update_products);
    }
    await productPage.navigateToMenu("Products");

    await test.step(`View all product ngoài SF`, async () => {
      await allProduct.gotoCollectionsAll(conf.suiteConf.domain);
      await expect(allProduct.genLoc(allProduct.xpathLabelAllProduct)).toBeVisible();
    });

    await test.step(`Verify Thumbnail image các product`, async () => {
      const box = await allProduct.genLoc(xpathThumbnailFirstProduct).boundingBox();
      const ratio = box.width / box.height;
      expect(ratio.toFixed(2)).toEqual((16 / 9).toFixed(2));
      expect(Math.round(box.width)).toEqual(conf.caseConf.size_default.width);
      expect(Math.round(box.height)).toEqual(conf.caseConf.size_default.height);
    });

    await test.step(`Verify trường Title các product`, async () => {
      for (const product of productDataList) {
        await expect(allProduct.getXpathProductName(product.product_body.product.title)).toBeVisible();
      }
    });

    await test.step(`Check trường Type các product`, async () => {
      for (const product of productDataList) {
        await expect(
          allProduct.getXpathProductType(product.product_body.product.title, product.product_body.product.product_type),
        ).toBeVisible();
      }
    });

    await test.step(`Check hiển thị trường Price các product`, async () => {
      for (const product of productDataList) {
        if (product.update_products.pricing_amount) {
          expect(await allProduct.getXpathProductPrice(product.product_body.product.title).textContent()).toEqual(
            `$${product.update_products.pricing_amount}`,
          );
        } else {
          expect(await allProduct.getXpathProductPrice(product.product_body.product.title).textContent()).toEqual(
            "Free",
          );
        }
      }
    });

    await test.step(`Click vào vị trí bất kỳ của sản phẩm`, async () => {
      for (const product of productDataList) {
        await allProduct.page.click(allProduct.getXpathProductCard(product.product_body.product.title));
        await expect(allProduct.genLoc(allProduct.getXpathWithLabel("Order Summary"))).toBeVisible();
        await allProduct.gotoCollectionsAll(conf.suiteConf.domain);
        await allProduct.page.waitForSelector(allProduct.getXpathProductCard(product.product_body.product.title));
      }
    });

    await test.step(`Phần dropdown sort chọn Oldest`, async () => {
      const sortProduct = conf.caseConf.sort_product;
      for (const sortItem of sortProduct) {
        await allProduct.clickSortProduct(sortItem.sort_option);
        await allProduct.page.waitForTimeout(3 * 1000);
        for (let j = 0; j < sortItem.product_list.length; j++) {
          expect(await allProduct.getProductName(j + 1)).toEqual(sortItem.product_list[j]);
        }
      }
    });
  });
});
