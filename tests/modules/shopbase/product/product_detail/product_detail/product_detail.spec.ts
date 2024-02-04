import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@sf_pages/product";
import { snapshotDir } from "@utils/theme";
import type { ProductValue } from "@types";
import { loadData } from "@core/conf/conf";
import { SFHome } from "@sf_pages/homepage";
import { Apps } from "@pages/dashboard/apps";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { csvToJson } from "@helper/file";
import path from "path";
import { waitForImageLoaded } from "@utils/theme";
import type { ProductInfo } from "./product_info";
import { OcgLogger } from "@core/logger";

test.describe("Verify product detail", () => {
  let productPage: ProductPage;
  let sfProduct: SFProduct;
  let homePage: SFHome;
  let productInfo: ProductValue;
  let newPage;
  let campaignId;
  let maxDiffPixelRatio, threshold, maxDiffPixels, snapshotName;
  let scheduleData: ProductInfo;
  const logger = OcgLogger.get();

  test.beforeEach(async ({ dashboard, conf, scheduler }, testInfo) => {
    test.setTimeout(conf.suiteConf.timeout);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as ProductInfo;
    } else {
      scheduleData = {
        status: "no product is importing",
      };
    }

    await test.step("Delete old product", async () => {
      await productPage.navigateToMenu("Products");
      if (scheduleData.status == "no product is importing") {
        await productPage.deleteProduct(conf.suiteConf.password);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      }
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const productAvailability = conf.caseConf.data[i];
    test(`@${productAvailability.case_id} : ${productAvailability.case_name}`, async ({ conf, context }) => {
      productInfo = productAvailability.product_all_info;
      const expectResult = productAvailability.expected_result;

      await test.step("Tại màn [All products] > Click btn Create product > Input Title product > Click save", async () => {
        await productPage.addNewProductWithData(productInfo);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      });

      await test.step("Click button Preview product trên product detail page on dashboard", async () => {
        [newPage] = await Promise.all([context.waitForEvent("page"), productPage.clickViewProductOnSF()]);
        sfProduct = new SFProduct(newPage, conf.suiteConf.domain);
        homePage = new SFHome(newPage, conf.suiteConf.domain);
        await sfProduct.page.waitForSelector(sfProduct.xpathProductSectionDetail, { timeout: 5000 });
        await expect(sfProduct.page.locator(sfProduct.xpathTitleProduct(productInfo.title))).toBeVisible();
      });

      await test.step("Mở trong all product của shop trên storefront", async () => {
        await sfProduct.goto("/collections/all");
        await sfProduct.page.waitForSelector(sfProduct.xpathProductDivFirst, { timeout: 65000 });
        if (await sfProduct.page.isVisible(sfProduct.xpathSortList)) {
          await sfProduct.page.selectOption(sfProduct.xpathSortList, "created:desc");
          await sfProduct.page.waitForSelector(sfProduct.xpathProductDivFirst, { timeout: 65000 });
        }
        if (productAvailability.case_id == "SB_PRO_test_110") {
          let exampleProducts = await sfProduct.page.locator(sfProduct.xpathProductExampleInCollection).count();
          while (exampleProducts > 0) {
            await sfProduct.page.reload();
            await sfProduct.page.waitForSelector(sfProduct.xpathProductDivFirst, { timeout: 25000 });
            if (await sfProduct.page.isVisible(sfProduct.xpathSortList)) {
              await sfProduct.page.selectOption(sfProduct.xpathSortList, "created:desc");
              await sfProduct.page.waitForSelector(sfProduct.xpathProductDivFirst, { timeout: 65000 });
            }
            exampleProducts = await sfProduct.page.locator(sfProduct.xpathProductExampleInCollection).count();
          }
        }
        expect(await sfProduct.page.locator(sfProduct.xpathProductOnCollectionPage(productInfo.title)).count()).toEqual(
          expectResult,
        );
      });

      await test.step("Mở trang collection detail có chứa product trên storefront", async () => {
        await sfProduct.goto(conf.suiteConf.collection_url);
        await waitForImageLoaded(newPage, '//div[@id="list-collections"]');
        await sfProduct.openCollectionInCollectionList(productInfo.collections[0]);
        await sfProduct.page.waitForSelector(`//h1[normalize-space()="${productInfo.collections[0]}"]`, {
          timeout: 90000,
        });
        await sfProduct.page.waitForSelector(sfProduct.xpathProductDivFirst, { timeout: 65000 });
        if (await sfProduct.page.isVisible(sfProduct.xpathSortList)) {
          await sfProduct.page.selectOption(sfProduct.xpathSortList, "created:desc");
          await sfProduct.page.waitForSelector(sfProduct.xpathProductDivFirst, { timeout: 65000 });
        }
        if (productAvailability.case_id == "SB_PRO_test_110") {
          let exampleProducts = await sfProduct.page.locator(sfProduct.xpathProductExampleInCollection).count();
          while (exampleProducts > 0) {
            await sfProduct.goto(conf.suiteConf.collection_url);
            await waitForImageLoaded(newPage, '//div[@id="list-collections"]');
            await sfProduct.openCollectionInCollectionList(productInfo.collections[0]);
            await sfProduct.page.waitForSelector(`//h1[normalize-space()="${productInfo.collections[0]}"]`, {
              timeout: 90000,
            });
            await sfProduct.page.waitForSelector(sfProduct.xpathProductDivFirst, { timeout: 65000 });
            if (await sfProduct.page.isVisible(sfProduct.xpathSortList)) {
              await sfProduct.page.selectOption(sfProduct.xpathSortList, "created:desc");
              await sfProduct.page.waitForSelector(sfProduct.xpathProductDivFirst, { timeout: 65000 });
            }
            exampleProducts = await sfProduct.page.locator(sfProduct.xpathProductExampleInCollection).count();
          }
        }
        expect(await sfProduct.page.locator(sfProduct.xpathProductOnCollectionPage(productInfo.title)).count()).toEqual(
          expectResult,
        );
      });

      await test.step("Mở trang product detail của product trên storefront", async () => {
        await sfProduct.goto("/search");
        await homePage.searchProduct(productInfo.title);
        expect(await sfProduct.page.locator(sfProduct.xpathProductOnCollectionPage(productInfo.title)).count()).toEqual(
          expectResult,
        );
      });
    });
  }

  test("[Sbase-variants] Check UI add media cho từng variants @SB_PRO_PD_93", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const appPage = new Apps(dashboard, conf.suiteConf.domain);
    const printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const productInfo = conf.caseConf.product_info;
    const layerList = conf.caseConf.layers;
    const pricingInfo = conf.caseConf.pricing_info;
    snapshotName = conf.caseConf.snapshot_name;

    await test.step("Tại app PrintHub, Tạo campaign với base Ladies T-shirt", async () => {
      await printbasePage.navigateToMenu("Apps");
      await appPage.openApp("Print Hub");
      await printbasePage.navigateToMenu("Catalog");
      await dashboard.waitForResponse(
        response =>
          response.url().includes("/admin/pbase-product-base/catalogs.json") ||
          (response.url().includes("/admin/pbase-product-base/shipping-combos.json") && response.status() === 200),
      );
      await printbasePage.addBaseProducts(productInfo);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
      await printbasePage.addNewLayers(layerList);
      await printbasePage.clickOnBtnWithLabel("Continue", 1);
      await printbasePage.inputPricingInfo(pricingInfo);
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Launch", 1);
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step("Tại màn hình Edit variants > Check UI add media Tại màn variants", async () => {
      await printbasePage.navigateToMenu("Products");
      await productPage.gotoProductDetail(pricingInfo.title);
      await dashboard.locator(productPage.xpathProductVariantDetail).scrollIntoViewIfNeeded({ timeout: 5000 });
      await printbasePage.waitImagesLoaded(printbasePage.xpathMediaContainerVariant);
      await dashboard.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: productPage.xpathProductVariantDetail,
        snapshotName: snapshotName.variant_detail,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("@SB_PRO_test_102 - [Add product] Verify add media thành công cho product", async ({ conf, context }) => {
    const productDetail = conf.caseConf.product_detail;
    const productDetailSF = conf.caseConf.product_detail_sf;

    await test.step("Create product và add media cho product", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickOnBtnWithLabel("Add product");
      await productPage.setProductTitle(productDetail.product_name);
      await productPage.setProductMediasByURL(productDetail.image_URL);
      await productPage.setProductMedias(productDetail.image_name);
      await productPage.clickOnBtnWithLabel("Save changes");
    });

    await test.step("View product ngoài SF -> Verify thông tin media ngoài product ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductOnSF()]);
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      const listProductSf = productDetailSF.medias.split(",");
      await productStoreFront.page.waitForSelector('(//div[@class="VueCarousel-inner"])', { timeout: 69000 });
      expect(await productStoreFront.countProductMedias()).toEqual(listProductSf.length);
    });
  });

  test("@SB_PRO_test_103 - [Add product] Verify media của product khi thực hiện Import, Export", async ({
    conf,
    context,
  }) => {
    const productDetail = conf.caseConf.product_detail;
    const productDetailSF = conf.caseConf.product_detail_sf;
    const importInfo = conf.caseConf.import_info;
    let fileCSV: string;

    await test.step("Tại All product, search product, chọn products trong search result, click Export -> Selected products -> Export", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickOnBtnWithLabel("Add product");
      await productPage.setProductTitle(productDetail.product_name);
      await productPage.setProductMediasByURL(productDetail.image_URL);
      await productPage.clickOnBtnWithLabel("Save changes");
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      await productPage.navigateToMenu("Products");
      await productPage.searchProduct(productDetail.product_name);
      await productPage.closeOnboardingPopup();
      fileCSV = await productPage.exportProduct(conf.caseConf.export_info, conf.caseConf.forder_name);
      const dataFileExport = await csvToJson(fileCSV);
      const listImage = conf.caseConf.image_URL;
      for (let i = 0; i < dataFileExport.length; i++) {
        const imageProduct = dataFileExport[i]["Image Src"].split("?")[0];
        expect(listImage.includes(imageProduct)).toBeTruthy();
      }
    });

    await test.step("Tại All product, xóa products vừa export. Click Import -> chọn File -> Upload File > Verify list media được import từ file csv", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.deleteProduct(conf.suiteConf.password);
      await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
      const pathFile = path.join(fileCSV);
      await productPage.importProduct(pathFile, productPage.xpathImportFile, importInfo.override, true);
      await productPage.navigateToMenu("Products");
      let statusImport: string;
      do {
        await productPage.page.waitForTimeout(30000);
        await productPage.clickProgressBar();
        statusImport = (await productPage.page.textContent('//span[contains(@class,"status-tag")]/span')).trim();
        await productPage.clickProgressBar();
      } while (statusImport == "Processing" || statusImport == "Preparing");
      await productPage.clickProgressBar();
      expect(await productPage.getStatus(fileCSV.split("/").pop())).toEqual(importInfo.status);
      expect(await productPage.getProcess(fileCSV.split("/").pop())).toEqual(importInfo.process);
    });

    await test.step("Click vào icon View View product A ngoài SF > Verify media của product A ngoài SF", async () => {
      await productPage.gotoProductDetail(productDetail.product_name);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductOnSF()]);
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      const listProductSf = productDetailSF.medias.split(",");
      await productStoreFront.waitResponseWithUrl("/assets/landing.css");
      await productStoreFront.page.waitForSelector('(//div[@class="VueCarousel-inner"])', { timeout: 69000 });
      expect(await productStoreFront.countProductMedias()).toEqual(listProductSf.length);
    });
  });

  test("@SB_PRO_test_100 - [Add product] Verify medias của product khi thực hiện Clone", async ({
    conf,
    context,
    dashboard,
    token,
    snapshotFixture,
  }) => {
    const productDetail = conf.caseConf.product_detail;
    const cloneInfo = conf.caseConf.clone_info;
    let productPageSecond: ProductPage;
    test.setTimeout(conf.suiteConf.timeout);

    if (process.env.ENV == "prodtest") {
      return; //On prodtest env, ignore clone and import product function
    }

    await test.step("Precondition: Add a product", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickOnBtnWithLabel("Add product");
      await productPage.setProductTitle(productDetail.product_name);
      await productPage.setProductMediasByURL(productDetail.image_URL);
      await productPage.clickOnBtnWithLabel("Save changes");
      await productPage.page.waitForSelector(productPage.xpathToastMessage, { timeout: 30000 });
      await productPage.page.waitForSelector(productPage.xpathToastMessage, { state: "hidden", timeout: 12000 });
      await waitForImageLoaded(productPage.page, productPage.getXpathImageInMedia());
      await productPage.page.waitForTimeout(2500);
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.getXpathImageInMedia(),
        snapshotName: conf.caseConf.img_name,
      });
    });

    await test.step(
      "Tại màn hình All product > Search product title > Chọn Product > " +
        "Action chọn Import to store -> Import product > Tại shop thứ 2: Verify medias of product",
      async () => {
        await productPage.goToProductList();
        await productPage.searchProduct(productDetail.product_name);
        await productPage.cloneProductToStore(cloneInfo);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
        productPageSecond = new ProductPage(dashboard, conf.suiteConf.info_sbase_source.domain);
        const shopTokenSecond = await token.getWithCredentials({
          domain: conf.suiteConf.info_sbase_source.domain,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const accessTokenSecond = shopTokenSecond.access_token;
        await productPageSecond.loginWithToken(accessTokenSecond);
        await productPageSecond.navigateToMenu("Products");
        await productPageSecond.closeOnboardingPopup();
        let textStatus: string;
        do {
          await productPageSecond.clickProgressBar();
          textStatus = await productPageSecond.getStatus();
          await productPageSecond.page.waitForTimeout(3000);
          await productPageSecond.page.click(productPageSecond.xpathTitleProduct);
        } while (textStatus != cloneInfo.status);
        do {
          await productPageSecond.navigateToMenu("Products");
          await productPageSecond.gotoProductDetail(productDetail.product_name);
          await productPageSecond.waitAbit(90000);
        } while ((await productPageSecond.page.locator(productPageSecond.finishedLoading).count()) == 0);
        await waitForImageLoaded(productPageSecond.page, productPageSecond.getXpathImageInMedia());
        await productPageSecond.page.waitForTimeout(2500);
        await snapshotFixture.verify({
          page: productPageSecond.page,
          selector: productPageSecond.getXpathImageInMedia(),
          snapshotName: conf.caseConf.img_name,
        });
        //so sanh url cua video
        const countVideo = await productPageSecond.page.locator(productPageSecond.xpathVideoUrlInMedia).count();
        let videoUrl: string;
        for (let i = 1; i <= countVideo; i++) {
          videoUrl = await productPageSecond.page.getAttribute(
            `(${productPageSecond.xpathVideoUrlInMedia})[${i}]`,
            "src",
          );
          logger.info(`Video Url = ${videoUrl}`);
          videoUrl = videoUrl.slice(0, videoUrl.indexOf("?"));
          const videoId = videoUrl.slice(videoUrl.lastIndexOf("/") + 1);
          logger.info(`Video Id = ${videoId}`);
          expect(productDetail.image_URL.includes(videoId)).toBeTruthy();
        }
      },
    );

    await test.step("Click vào icon View , View product A ngoài SF > Verify media của product A ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), productPageSecond.clickViewProductOnSF()]);
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      const listProductSf = productDetail.image_URL.split(",");
      await productStoreFront.page.waitForSelector('(//div[@class="VueCarousel-inner"])', { timeout: 29000 });
      expect(await productStoreFront.countProductMedias()).toEqual(listProductSf.length);
      //so sanh url cua video
      const countVideo = await productStoreFront.page.locator(productStoreFront.xpathVideoUrlInMedia).count();
      for (let i = 1; i <= countVideo; i++) {
        const url = await productStoreFront.page.getAttribute(
          `(${productStoreFront.xpathVideoUrlInMedia})[${i}]`,
          "data-src",
        );
        const idVideo = url.slice(url.lastIndexOf("/") + 1);
        expect(productDetail.image_URL.includes(idVideo)).toBeTruthy();
      }
    });

    await test.step("After case: Delete the product of this case", async () => {
      await productPageSecond.navigateToMenu("Products");
      await productPageSecond.searchProduct(productDetail.product_name);
      await productPageSecond.deleteProduct(conf.suiteConf.password);
      await productPageSecond.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
    });
  });
});
