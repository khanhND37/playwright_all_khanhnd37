import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { ProducFeedPage } from "@pages/dashboard/products/product_feeds";
import type { FeedInfo } from "@types";
import { ProductAPI } from "@pages/api/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { ProductPage } from "@pages/dashboard/products";
import { loadData } from "@core/conf/conf";

test.describe("Veirfy create feed setting", () => {
  let productFeedPage: ProducFeedPage;
  let productApi: ProductAPI;
  let product: ProductPage;
  let feedInfo: Array<FeedInfo>;
  let domain;
  let primaryDomain;
  let domainFeedApi;
  let listSku, listSize;
  let type;
  let condition;
  let variantInfo, totalProductFeed;
  let productId, productInfo, firstVariantTitle, firstVariantId, totalProduct, productSearch;

  const addDomain = async productFeedPage => {
    await productFeedPage.page.click(productFeedPage.xpathAddDomain);
    await productFeedPage.page.locator(productFeedPage.xpathFildDomain).fill(domainFeedApi);
    await productFeedPage.clickOnBtnWithLabel("Next");
    await productFeedPage.clickOnBtnWithLabel("Verify connection");
    await expect(productFeedPage.page.locator(productFeedPage.xpathMessAddDomainSuccess(domainFeedApi))).toBeVisible();
  };

  const changeDomain = async productFeedPage => {
    await productFeedPage.page.click(productFeedPage.xpathChangePrimaryDomain);
    await productFeedPage.clickChangePrimaryDomain(domainFeedApi);
    await productFeedPage.clickOnBtnLinkWithLabel("Save");
    await expect(productFeedPage.page.locator(productFeedPage.xpathMessChangeDomainSuccess)).toBeVisible();
  };

  test.beforeEach(async ({ conf, dashboard }) => {
    productFeedPage = new ProducFeedPage(dashboard, conf.suiteConf.domain);
    product = new ProductPage(dashboard, conf.suiteConf.domain);

    //Navigate to Product Feeds

    feedInfo = conf.caseConf.feed_info;
    domain = conf.suiteConf.domain;
    primaryDomain = conf.caseConf.primary_domain;
    domainFeedApi = conf.suiteConf.snake_case;

    await productFeedPage.goto("admin/domain");
    let domainConnect = (
      await productFeedPage.page.locator(productFeedPage.xpathGetPrimaryDomain).textContent()
    ).trim();
    switch (primaryDomain) {
      case "disconnect":
        if (domainConnect !== domain) {
          let shouldContinueLoop = true;
          while (shouldContinueLoop) {
            if (await productFeedPage.page.locator(productFeedPage.xpathDeleteDomain).isVisible()) {
              await productFeedPage.page.click(productFeedPage.xpathDeleteDomain);
              await productFeedPage.clickOnBtnWithLabel("Remove");
              await productFeedPage.page.waitForSelector(productFeedPage.xpathMessDeleteDomainSuccess);
              continue;
            }
            domainConnect = (
              await productFeedPage.page.locator(productFeedPage.xpathGetPrimaryDomain).textContent()
            ).trim();
            if (domainConnect === domain) {
              shouldContinueLoop = false;
            }
          }
          await expect(domainConnect).toEqual(domain);
        }
        break;
      case "connect":
        if (domainConnect !== domainFeedApi) {
          if (await productFeedPage.page.locator(productFeedPage.xpathTitleBlogDomain).isVisible()) {
            const xpathListDomain = await productFeedPage.page.locator(productFeedPage.xpathCheckExistingDomain);
            const listDomain = await xpathListDomain.evaluateAll(list =>
              list.map(element => element.textContent.trim()),
            );
            let checkDomain = false;
            for (const domain of listDomain) {
              if (domain === domainFeedApi) {
                checkDomain = true;
                break;
              }
            }
            if (checkDomain) {
              await addDomain(productFeedPage);
            } else {
              // add domain connect
              await addDomain(productFeedPage);
              // change domain after add success
              await changeDomain(productFeedPage);
            }
          } else {
            // add domain connect
            await addDomain(productFeedPage);
            // change domain after add success
            await changeDomain(productFeedPage);
          }
        }
        break;
    }
    await productFeedPage.goto("admin/product-feeds");
    // //Delete all current Feed
    await productFeedPage.deleteAllFeed();
    expect(await productFeedPage.countFeed()).toBe(0);
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_11 Kiểm tra Điều kiện "Export all variant of a Product" trong Product settings trong feed setting feed Google (feed api)`, async ({
    conf,
    authRequest,
  }) => {
    productApi = new ProductAPI(conf.suiteConf.domain, authRequest);
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`Click vào Manage Product Data-> search Product với title`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      const allVariants = await productApi.countAllVariants();
      const quantityProdFeed = await productFeedPage.getTotalProductsFeedAPI(authRequest, conf.suiteConf.domain);
      expect(quantityProdFeed).toEqual(allVariants);
    });
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_6 - Kiểm tra Điều kiện "Export all variant of all product Except SKU contain" trong Product settings trong feed setting feed Google (feed api)`, async ({
    authRequest,
    conf,
  }) => {
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`get data product trong "Manage Product Data"`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      listSku = await productFeedPage.getAllSkuCurentPage(authRequest, domain);
      const dataCompare = feedInfo[0].export_rules.value;
      type = conf.caseConf.type;
      expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSku)).toBeTruthy();
    });

    await test.step("click button 'More filter' -> Filter MPN contains NS-LM", async () => {
      const filterCondition = conf.caseConf.filter_feed;
      await productFeedPage.filterWithConditionDashboard("More filters", filterCondition);
      await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
    });
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_7 Kiểm tra Điều kiện "Export all variant of all product Except SKU start with" trong Product settings trong feed setting feed Google (feed api)`, async ({
    authRequest,
    conf,
  }) => {
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`get data product trong "Manage Product Data"`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      listSku = await productFeedPage.getAllSkuCurentPage(authRequest, domain);
      const dataCompare = feedInfo[0].export_rules.value;
      type = conf.caseConf.type;
      condition = conf.caseConf.condition;
      expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSku, condition)).toBeTruthy();
    });

    await test.step(`click button 'More filter'-> Filter MPN contains NS`, async () => {
      const filterCondition = conf.caseConf.filter_feed;
      await productFeedPage.filterWithConditionDashboard("More filters", filterCondition);
      await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
    });
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_8 Kiểm tra Điều kiện "Export all variant of all product Except SKU end with" trong Product settings trong feed setting feed Google (feed api)`, async ({
    authRequest,
    conf,
  }) => {
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`get data product trong "Manage Product Data"`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      listSku = await productFeedPage.getAllSkuCurentPage(authRequest, domain);
      const dataCompare = feedInfo[0].export_rules.value;
      type = conf.caseConf.type;
      condition = conf.caseConf.condition;
      expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSku, condition)).toBeTruthy();
    });

    await test.step(`click button 'More filter'-> Filter MPN contains NS`, async () => {
      const filterCondition = conf.caseConf.filter_feed;
      await productFeedPage.filterWithConditionDashboard("More filters", filterCondition);
      await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
    });
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_9 Kiểm tra Điều kiện "Export all variant of a Product except SKU is equal to" trong Product settings trong feed setting feed File Google`, async ({
    authRequest,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`get data product trong "Manage Product Data"`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      listSku = await productFeedPage.getAllSkuCurentPage(authRequest, domain);
      const dataCompare = feedInfo[0].export_rules.value;
      type = conf.caseConf.type;
      condition = conf.caseConf.condition;
      expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSku, condition)).toBeTruthy();
    });

    await test.step(`- Click button More filter -> Filter MPN contains 'ql-bl166'`, async () => {
      const filterCondition = conf.caseConf.filter_feed;
      await productFeedPage.filterWithConditionDashboard("More filters", filterCondition);
      await productFeedPage.genLoc(productFeedPage.xpathFirstProduct).click();
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductFeedSku);
      await snapshotFixture.verify({
        page: productFeedPage.page,
        selector: productFeedPage.xpathProductFeedSku,
        snapshotName: "SET_FEED_V2_9_sku.png",
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_23 - kiểm tra tạo feed api với data ko phải là default`, async ({
    conf,
    authRequest,
  }) => {
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`get data product trong "Manage Product Data"`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      listSku = await productFeedPage.getAllSkuCurentPage(authRequest, domain);
      const dataCompare = feedInfo[0].export_rules.value;
      type = conf.caseConf.type;
      expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSku)).toBeTruthy();
    });

    await test.step(`click button More filter -> input data và kiểm tra products hiển thị`, async () => {
      await productFeedPage.filterWithConditionDashboard("More filters", conf.caseConf.filter_feed);
      await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
      await productFeedPage.clearAllFilterDashboard("More filters");
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      await productFeedPage.searchProd(conf.caseConf.title_prod_search);
      await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
    });

    await test.step(`Go to product bất kỳ -> kiểm tra data product`, async () => {
      variantInfo = conf.caseConf.variant_info;
      await productFeedPage.page.goto(`https://${conf.suiteConf.domain}/admin/product-feeds/v2/manage`);
      await productFeedPage.filterWithConditionDashboard("More filters", conf.caseConf.filter_variant);
      await productFeedPage.page.click(productFeedPage.xpathFirstProduct);
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductHeader);
      const getVariantInfo = await productFeedPage.getFeedItemInfoAPI(
        authRequest,
        conf.suiteConf.domain,
        variantInfo.variant_id,
      );
      expect(variantInfo.title).toBe(await getVariantInfo.title);
      expect(variantInfo.description).toBe(await getVariantInfo.description);
      expect(variantInfo.product_identifier).toBe(await getVariantInfo.product_identifier);
      expect(variantInfo.brand).toBe(await getVariantInfo.vendor);
      expect(variantInfo.google_product_category).toBe(await getVariantInfo.google_product_category);
      expect(variantInfo.gender).toBe(await getVariantInfo.gender);
      expect(variantInfo.are_group).toBe(await getVariantInfo.are_group);
    });
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_22 - Kiểm tra Điều kiện "Export only variations of a product matching" > contains > multi SKU trong Product settings trong feed setting feed Google (feed api)`, async ({
    conf,
    authRequest,
  }) => {
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`get data product trong "Manage Product Data"`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      listSku = await productFeedPage.getAllSkuCurentPage(authRequest, domain);
      const dataCompare = feedInfo[0].export_rules.value;
      type = conf.caseConf.type;
      expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSku)).toBeTruthy();
    });

    await test.step(`click button 'More filter' -> Filter MPN > SKU khác data đã setting khi tạo feed -> kiểm tra hiển thị`, async () => {
      const filterCondition = conf.caseConf.filter_feed;
      await productFeedPage.filterWithConditionDashboard("More filters", filterCondition);
      await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
    });
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_21 - Kiểm tra "Export all variant of all product Except SKU contain" trong Products feed > Google (feed api) với nhiều keywork`, async ({
    conf,
    authRequest,
  }) => {
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`get data product trong "Manage Product Data"`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      listSku = await productFeedPage.getAllSkuCurentPage(authRequest, domain);
      const dataCompare = feedInfo[0].export_rules.value;
      type = conf.caseConf.type;
      expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSku)).toBeTruthy();
    });

    await test.step(`click button 'More filter' -> Filter MPN contains NS-LM hoặc DT-BL`, async () => {
      const filterCondition = conf.caseConf.filter_feed;
      await productFeedPage.filterWithConditionDashboard("More filters", filterCondition);
      await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
    });
  });

  test(`@SB_SET_SC_Feed_GMC_CR_SET_FEED_33 - Check feed API với điều kiện All products kết hợp với điều kiện Export only variations of a product matching SKU contains thỏa mãn`, async ({
    conf,
    authRequest,
  }) => {
    await test.step(`Tạo Product setting refer với info settings: `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`get data product trong "Manage Product Data"`, async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      listSku = await productFeedPage.getAllSkuCurentPage(authRequest, domain);
      const dataCompare = feedInfo[0].export_rules.value;
      type = conf.caseConf.type;
      expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSku)).toBeTruthy();
    });

    await test.step(`click button 'More filter' -> Filter MPN > SKU khác data đã setting khi tạo feed -> kiểm tra hiển thị`, async () => {
      const filterCondition = conf.caseConf.filter_feed;
      await productFeedPage.filterWithConditionDashboard("More filters", filterCondition);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
    });
  });

  test(`@SB_SET_SC_Feed_GMC_CR_SET_FEED_32 - Check feed API với điều kiện All products kết hợp với điều kiện Export only first variation of each value in the first option of a product`, async ({
    conf,
    authRequest,
  }) => {
    let countSize;
    productSearch = conf.caseConf.product_title_search;
    await test.step("Pre-condition: Create product -> Go to product detail and get product id", async () => {
      await product.goToProductList();
      await product.searchProduct(productSearch);
      if (await product.page.locator(product.xpathNoProduct).isVisible()) {
        await product.addNewProductWithData(conf.caseConf.product_all_info);
      } else {
        await product.page.click(product.xpathFirstProduct);
        await product.page.waitForSelector(product.xpathProductTitleTxt);
      }
      await product.page.waitForURL("**/admin/products/**");
      productId = await product.page.url().replace(`https://${conf.suiteConf.domain}/admin/products/`, "");
      productInfo = await product.getProductInfoByIdAPI(authRequest, conf.suiteConf.domain, parseInt(productId));
      for (let i = 0; i < (await productInfo.options.length); i++) {
        //count size
        if (productInfo.options[i].name === "Size") {
          countSize = productInfo.options[i].values.length;
        }
      }
    });

    await test.step(
      "Tại dashboard > Product feeds page (url link: {{store_domain}}/admin/product-feeds/v2)" +
        "-> Click button Add product feed -> tạo popup chọn radio Google -> Click button confirm" +
        " -> intput data-> Click button Save",
      async () => {
        await productFeedPage.goto("admin/product-feeds");
        await productFeedPage.createFeeds(feedInfo);
        for (const i of feedInfo) {
          await productFeedPage.isFeedCreated(i);
        }
      },
    );

    await test.step("Click button Manage product data -> filter theo product bất kỳ -> kiểm tra hiển thị products", async () => {
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      await productFeedPage.searchProd(productSearch);
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductFeed(productSearch));
      const countProductFeed = await productFeedPage.page
        .locator(productFeedPage.xpathProductFeed(productSearch))
        .count();
      expect(countSize).toEqual(countProductFeed);
    });
  });

  test(`@SB_SET_SC_Feed_GMC_CR_SET_FEED_31 - Check feed API với điều kiện All products kết hợp với điều kiện Export only first variation of a product`, async ({
    conf,
    authRequest,
  }) => {
    productSearch = conf.caseConf.product_title_search;
    await test.step("Pre-condition: Create product -> Go to product detail and get product id", async () => {
      await product.goToProductList();
      await product.searchProduct(productSearch);
      if (await product.page.locator(product.xpathNoProduct).isVisible()) {
        await product.addNewProductWithData(conf.caseConf.product_all_info);
      } else {
        await product.page.click(product.xpathFirstProduct);
        await product.page.waitForSelector(product.xpathProductTitleTxt);
      }
      await product.page.waitForURL("**/admin/products/**");
      productId = await product.page.url().replace(`https://${conf.suiteConf.domain}/admin/products/`, "");
      productInfo = await product.getProductInfoByIdAPI(authRequest, conf.suiteConf.domain, parseInt(productId));
      firstVariantTitle = await productInfo.variants[0].option1;
      firstVariantId = await productInfo.variants[0].id;
    });

    await test.step(
      "Tại dashboard > Product feeds page (url link: {{store_domain}}/admin/product-feeds/v2)" +
        "-> Click button Add product feed -> tạo popup chọn radio Google -> Click button confirm" +
        " -> intput data-> Click button Save",
      async () => {
        await productFeedPage.goto("admin/product-feeds");
        await productFeedPage.createFeeds(feedInfo);
        for (const i of feedInfo) {
          await productFeedPage.isFeedCreated(i);
        }
      },
    );

    await test.step("Click button Manage product data -> kiểm tra số lượng products", async () => {
      totalProduct = await product.getTotalProductBeforeDelete(authRequest, conf.suiteConf.domain);
      await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
      await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      totalProductFeed = await productFeedPage.getTotalProductsFeedAPI(authRequest, conf.suiteConf.domain);
      expect(totalProductFeed).toEqual(totalProduct);
    });

    await test.step("Filter product -> kiểm tra hiển thị products", async () => {
      await productFeedPage.searchProd(productSearch);
      await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
      await productFeedPage.page.waitForSelector(productFeedPage.xpathProductFeed(productSearch));
      const countProductFeed = await productFeedPage.page
        .locator(productFeedPage.xpathProductFeed(productSearch))
        .count();
      expect(countProductFeed).toEqual(1);
      const variantInfo = await productFeedPage.getFeedItemInfoAPI(authRequest, conf.suiteConf.domain, firstVariantId);
      expect(firstVariantTitle).toEqual(variantInfo.size);
    });
  });

  const drivenExculdeOptionValue = "EXCLUDE_OPTION_VALUE";
  const confExculdeOptionValue = loadData(__dirname, drivenExculdeOptionValue);
  confExculdeOptionValue.caseConf.data.forEach(data => {
    test(`@${data.case_id} ${data.description}`, async ({ conf, authRequest }) => {
      domain = conf.suiteConf.domain;
      feedInfo = data.feed_info;
      const dataCompare = feedInfo[0].export_rules.value;
      type = data.type;
      condition = data.condition;
      const filterCondition = data.filter_feed;
      await test.step(
        "Tại dashboard > Product feeds page (url link: {{store_domain}}/admin/product-feeds/v2)" +
          "-> Click button Add product feed -> tạo popup chọn radio Google -> Click button confirm" +
          " -> intput data-> Click button Save",
        async () => {
          await productFeedPage.goto("admin/product-feeds");
          await productFeedPage.createFeeds(feedInfo);
          for (const i of feedInfo) {
            await productFeedPage.isFeedCreated(i);
          }
        },
      );

      await test.step(`get data product trong "Manage Product Data"`, async () => {
        await productFeedPage.navigateToFeedDetail(feedInfo[0].name);
        await productFeedPage.page.click(productFeedPage.xpathBtnManageProdData);
        await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
        listSize = await productFeedPage.getAllSizeProductFeed(authRequest, domain);
        expect(await productFeedPage.checkExistMultiData(type, dataCompare, listSize, condition)).toBeTruthy();
      });

      await test.step(`click button 'More filter' -> Filter MPN > SKU khác data đã setting khi tạo feed -> kiểm tra hiển thị`, async () => {
        await productFeedPage.filterWithConditionDashboard("More filters", filterCondition);
        await productFeedPage.waitForElementVisibleThenInvisible(productFeedPage.xpathLoadListProd);
        await expect(productFeedPage.genLoc(productFeedPage.xpathNoProdInMngProdDta)).toBeVisible();
      });
    });
  });
});
