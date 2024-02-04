import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@pages/storefront/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { ProductAPI } from "@pages/api/product";
import { CollectionAPI } from "@pages/api/dashboard/collection";

test.describe("Filter on Product list", async () => {
  let product: ProductPage;
  let productStoreFront;
  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    product = new ProductPage(dashboard, conf.suiteConf["domain"]);
    await product.navigateToMenu("Products");
  });

  const conf = loadData(__dirname, "DATA_DRIVEN_FILTER_WITH_CONDITION");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ authRequest }) => {
        const loadConfigData = caseData.DATA_DRIVEN_STEP_FILTER.data;
        for (let j = 0; j < loadConfigData.length; j++) {
          const caseDataDriven = loadConfigData[j];

          await test.step(`${caseDataDriven.step}`, async () => {
            await product.clickDeleteFilters();
            const filterCondition = caseDataDriven.filter_condition;
            await product.filterWithConditionDashboard("More filters", filterCondition);
            await product.removeLiveChat();
            await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
            const prodIdList = await product.getProdIdList();
            const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);

            for (let i = 0; i < prodIdList.length; i++) {
              const prodDetail = await productAPI.getDataProductById(prodIdList[i]);
              const caseId = caseData.case_id;
              const filter = filterCondition[0];
              let isCheckValueFilter: boolean;

              switch (caseId) {
                case "SB_PRO_PL_220":
                  if (filter.radio === "Yes") {
                    expect([1, 2]).toContain(prodDetail.product.product_availability);
                  } else {
                    expect([0, 3]).toContain(prodDetail.product.product_availability);
                  }
                  break;
                case "SB_PRO_PL_221":
                  if (filter.radio === "Yes") {
                    expect([1, 3]).toContain(prodDetail.product.product_availability);
                  } else {
                    expect([0, 2]).toContain(prodDetail.product.product_availability);
                  }
                  break;
                case "SB_PRO_PL_222": {
                  const arrInputCollection = filter.input_ddl_value.split(",");
                  const collectionAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);
                  const customCol = await collectionAPI.getCustomCollectionsByProductId({
                    product_id: Number(prodIdList[i]),
                  });
                  const arrColTitle = customCol.custom_collections.map(customCollection => customCollection.title);
                  isCheckValueFilter = arrColTitle.some(value => arrInputCollection.includes(value));
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_223": {
                  const arrCostPerItem = prodDetail.product.variants.map(variant => variant.cost_per_item);
                  isCheckValueFilter = product.checkFilterValue(arrCostPerItem, filter.value_textbox, filter.radio);
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_224": {
                  if (filter.radio === "Yes") {
                    expect(prodDetail.product.custom_options.length).not.toEqual(0);
                  } else {
                    expect(prodDetail.product.custom_options.length).toEqual(0);
                  }
                  break;
                }
                case "SB_PRO_PL_225": {
                  if (filter.radio === "Has image") {
                    expect(prodDetail.product.image).not.toEqual(null);
                  } else {
                    expect(prodDetail.product.image).toEqual(null);
                  }
                  break;
                }
                case "SB_PRO_PL_226": {
                  const arrInputProdType = filter.input_ddl_value.split(",");
                  isCheckValueFilter = arrInputProdType.includes(prodDetail.product.product_type);
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_227": {
                  const arrInputTag = filter.input_ddl_value.split(",");
                  isCheckValueFilter = arrInputTag.some(value => prodDetail.product.tags.split(",").includes(value));
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_228":
                  if (filter.radio === "Doesn't contain") {
                    expect(prodDetail.product.title).not.toContain(filter.value_textbox);
                  } else {
                    expect(prodDetail.product.title).toContain(filter.value_textbox);
                  }
                  break;
                case "SB_PRO_PL_229": {
                  const arrBarcode = prodDetail.product.variants.map(variant => variant.barcode);
                  isCheckValueFilter = product.checkFilterValue(arrBarcode, filter.value_textbox, filter.radio);
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_230": {
                  const compareAtPrice = prodDetail.product.variants.map(variant => variant.compare_at_price);
                  isCheckValueFilter = product.checkFilterValue(
                    compareAtPrice,
                    parseInt(filter.value_textbox),
                    filter.radio,
                  );
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_233": {
                  const variantName = prodDetail.product.variants.map(variant => variant.option2);
                  isCheckValueFilter = product.checkFilterValue(variantName, filter.value_textbox, filter.radio);
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_235": {
                  const variantPrice = prodDetail.product.variants.map(variant => variant.price);
                  isCheckValueFilter = product.checkFilterValue(
                    variantPrice,
                    parseInt(filter.value_textbox),
                    filter.radio,
                  );
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_236": {
                  const variantName = prodDetail.product.variants.map(variant => variant.sku);
                  isCheckValueFilter = product.checkFilterValue(variantName, filter.value_textbox, filter.radio);
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                case "SB_PRO_PL_237": {
                  const arrInputVendors = filter.input_ddl_value.split(",");
                  isCheckValueFilter = arrInputVendors.includes(prodDetail.product.vendor);
                  expect(isCheckValueFilter).toEqual(true);
                  break;
                }
                default:
                  break;
              }
            }
          });
        }
      });
    }
  }

  test("Verify search product @SB_PRO_PL_209", async ({ conf }) => {
    await test.step("Verify UI thanh Search product", async () => {
      const placeHolder = await product.getPlaceHolder();
      expect(placeHolder).toEqual(conf.caseConf.place_holder);
    });
    const loadDataSearch = conf.caseConf.DATA_DRIVEN_STEP_SEARCH.data;
    for (let j = 0; j < loadDataSearch.length; j++) {
      const caseData = loadDataSearch[j];
      await test.step(`${caseData.step}`, async () => {
        await product.clickDeleteFilters();
        await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
        await product.searchProdByName(caseData.product_name);
        await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
        if (caseData.product_name == "not exist") {
          const textNotfound = await product.getTextContentResult();
          expect(textNotfound).toEqual(caseData.text_content);
        } else {
          const productNumber = await product.getNumberProduct();
          expect(productNumber).toContain(caseData.number);
        }
      });
    }
  });

  const confLoadData = loadData(__dirname, "DATA_DRIVEN_ACTION_PRODUCT");
  for (let i = 0; i < confLoadData.caseConf.data.length; i++) {
    const caseData = confLoadData.caseConf.data[i];
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, context }) => {
        await test.step(`Select product name > Select Action > Select ${caseData.action_name}`, async () => {
          await product.searchProduct(caseData.product_name);
          await product.selectProduct(caseData.product_name);
          await product.selectActionOnProductList(caseData.action_infor);
          await product.clicktabNameOnProductList(caseData.tab_name);
          await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
          if (caseData.action_infor.action_name == "Make products available") {
            await product.searchProduct(caseData.product_name);
            await expect(
              dashboard.locator(product.xpathStatusOfProduct(caseData.product_name, caseData.status)),
            ).toBeHidden();
          } else {
            await expect(
              dashboard.locator(product.xpathStatusOfProduct(caseData.product_name, caseData.status)),
            ).toBeVisible();
          }
        });

        await test.step("Click product name > View product on SF", async () => {
          await product.chooseProduct(caseData.product_name);
          if (caseData.action_infor.action_name == "Make products available") {
            const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
            await SFPage.waitForLoadState("networkidle");
            productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
            const titleProductOnSF = await productStoreFront.getProductTitle();
            expect(titleProductOnSF).toEqual(caseData.product_name);
          } else {
            const handle = await product.getTextContent(product.xpathUrl);
            await dashboard.goto(handle);
            await product.waitUntilElementVisible(product.xpathNotFound);
            await expect(product.genLoc(product.xpathNotFound)).toHaveText("404 Page Not Found");
          }
        });
      });
    }
  }

  const confDataCaseAction = loadData(__dirname, "DATA_DRIVEN_ACTION_WITH_VALUE");
  for (let i = 0; i < confDataCaseAction.caseConf.data.length; i++) {
    const caseData = confDataCaseAction.caseConf.data[i];
    if (caseData.enable) {
      test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, snapshotFixture }) => {
        const configDataStep = caseData.DATA_DRIVEN_ACTION.data;
        const productData = caseData.product_info;
        await test.step("Precondition: Add new product", async () => {
          for (let i = 0; i < productData.length; i++) {
            await product.navigateToMenu("Products");
            await product.addNewProductWithData(productData[i]);
            await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
          }
        });
        for (let j = 0; j < configDataStep.length; j++) {
          const caseDataDriven = configDataStep[j];
          await test.step(`Select checkbox product > Chọn Action > Chọn ${caseDataDriven.action_infor.action_name} > Select/input tags cho product > Click Apply changes button`, async () => {
            await product.navigateToMenu("Products");
            await product.selectProduct(caseDataDriven.product_name);
            await product.selectActionOnProductList(caseDataDriven.action_infor);
            await expect(dashboard.locator(product.xpathToastMessage)).toBeVisible();
            await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
          });

          await test.step("Tại All products, Click product name > verify thông tin tag", async () => {
            const productList = caseDataDriven.product_name;
            const products = productList.split(",").map(item => item.trim());
            for (let i = 0; i < products.length; i++) {
              await product.navigateToMenu("Products");
              await product.chooseProduct(products[i]);
              await snapshotFixture.verify({
                page: dashboard,
                selector: product.xpathTagsInProductDetail,
                snapshotName: `${caseDataDriven.picture}-${i + 1}.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                  threshold: defaultSnapshotOptions.threshold,
                  maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
                },
              });
            }
          });
        }

        await test.step("Search product name > Delete product", async () => {
          await product.navigateToMenu("Products");
          await product.searchProduct(caseData.product_delete);
          await product.deleteProduct(conf.suiteConf.password);
        });
      });
    }
  }

  test("Verify chức năng Edit products @SB_PRO_PL_213", async ({ conf, dashboard, context, snapshotFixture }) => {
    const picture = conf.caseConf.picture;
    const productInfo = conf.caseConf.product_info;
    await test.step("Precondition: Add new product", async () => {
      await product.addNewProductWithData(productInfo);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
    });

    await test.step("Click vào checkbox 1 product > Chọn Action > Chọn Edit products > edit thông tin price trong trang Bulk editor rồi Save lại", async () => {
      await product.navigateToMenu("Products");
      await product.selectProduct(productInfo.title);
      await product.selectActionOnProductList(conf.caseConf.action_infor);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await snapshotFixture.verify({
        page: dashboard,
        selector: product.xpathBulkEditorpage,
        snapshotName: picture.edit_success,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Tại All products> Click product name > verify thông tin price", async () => {
      await product.navigateToMenu("Products");
      await product.chooseProduct(productInfo.title);
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await snapshotFixture.verify({
        page: dashboard,
        selector: product.xpathPricingOnProductDetail,
        snapshotName: picture.price_new,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("View product on SF > Verify thông tin product on SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      const salePriceOnSF = await productStoreFront.getProductPriceSF();
      expect(salePriceOnSF).toEqual(conf.caseConf.action_infor.price_new);
    });

    await test.step("Search product name > Delete product", async () => {
      await product.navigateToMenu("Products");
      await product.searchProduct(productInfo.title);
      await product.deleteProduct(conf.suiteConf.password);
    });
  });
});
