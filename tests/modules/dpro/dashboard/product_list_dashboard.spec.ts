import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { expect, test } from "@core/fixtures";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { convertDate } from "@core/utils/datetime";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { DefaultGetProductAPIParam } from "@constants";
import { SbScSCP8 } from "./product_list_dashboard";

test.describe("Verify product list", () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let checkoutPage: CheckoutForm;
  let orderPage: OrderPage;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    const productListData = conf.suiteConf.product_list;
    for (let i = 0; i < productListData.length; i++) {
      await productAPI.createProduct(productListData[i]);
    }
    await productPage.navigateToMenu("Products");
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  test(`Kiểm tra thông tin hiển thị trên list product @SB_SC_SCP_10`, async ({ conf, context }) => {
    const pricingSetting = conf.suiteConf.set_pricing;
    await productPage.clickTitleProduct(pricingSetting.product_name);
    await productPage.settingPricingTab(
      pricingSetting.pricing_type,
      pricingSetting.pricing_title,
      pricingSetting.pricing_amount,
    );
    await productPage.clickSaveBar();
    await productPage.getXpathBtnPublishOrUnpublish(pricingSetting.status).click();
    await productPage.page.waitForSelector(
      `//div[@id='page-header']//span[normalize-space()='${pricingSetting.status}ed']`,
    );
    await productPage.clickToViewFromDetail("Preview sales page");
    const [newPage] = await Promise.all([context.waitForEvent("page")]);
    checkoutPage = new CheckoutForm(newPage, conf.suiteConf.domain);
    await checkoutPage.enterEmail(pricingSetting.email);
    await checkoutPage.completeOrderWithMethod("Stripe");
    await checkoutPage.waitUntilElementVisible(checkoutPage.xpathThankYouPageHeader);
    await productPage.navigateToMenu("Products");

    await test.step(`Kiểm tra thông tin hiển thị trên list product`, async () => {
      await expect(productPage.getXpathColumnProductList("Products")).toBeVisible();
      await expect(productPage.getXpathColumnProductList("Members")).toBeVisible();
      await expect(productPage.getXpathColumnProductList("Sales")).toBeVisible();
      await expect(productPage.getXpathColumnProductList("Created date")).toBeVisible();
      await expect(productPage.getXpathColumnProductList("Status")).toBeVisible();
    });

    await test.step(`Verify Thumbnail image các product`, async () => {
      const dataUploadThumbnail = conf.caseConf.pre_thumnail;
      await productPage.clickTitleProduct(dataUploadThumbnail.product_name);
      await productPage.uploadThumbnailProduct(dataUploadThumbnail.file_path);
      await expect(productPage.genLoc(productPage.xpathImageProductDetail)).toBeVisible();
      await productPage.navigateToMenu("Products");
      const productThumbnail = conf.caseConf.product_thumbnails;
      for (let i = 0; i < productThumbnail.length; i++) {
        await productPage.searchProduct(productThumbnail[i].product_name);
        if (productThumbnail[i].image_default) {
          expect(await productPage.getAttributeImage(productThumbnail[i].image_default)).toEqual(
            productThumbnail[i].image_thumbnail,
          );
        } else {
          await expect(productPage.genLoc(productPage.xpathThumbnailOnList)).toHaveJSProperty("complete", true);
        }
      }
    });

    await test.step(`Click vào Thumbnail image product`, async () => {
      const productName = conf.caseConf.verify_click_thumbnail;
      await productPage.clickThumbnailProduct(productName);
      await expect(productPage.getXpathProductNameOnDetail(productName)).toBeVisible();
      await productPage.clickBackScreen();
    });

    await test.step(`Click vào name product`, async () => {
      const productName = conf.caseConf.verify_click_name;
      await productPage.clickTitleProduct(productName);
      await expect(productPage.getXpathProductNameOnDetail(productName)).toBeVisible();
      await productPage.clickBackScreen();
    });

    await test.step(`Check trường Title các product`, async () => {
      const productData = conf.caseConf.verify_names;
      for (let i = 0; i < productData.length; i++) {
        await expect(productPage.getXpathProductNameOnList(productData[i].product_name)).toBeVisible();
      }
    });

    await test.step(`Check trường Type các product`, async () => {
      const productType = conf.caseConf.verify_types;
      for (let i = 0; i < productType.length; i++) {
        await expect(
          productPage.getXpathTypeProduct(productType[i].product_name, productType[i].product_type),
        ).toBeVisible();
      }
    });

    await test.step(`Check hiển thị trường Sales các product`, async () => {
      const productSale = conf.caseConf.verify_sales;
      for (let i = 0; i < productSale.length; i++) {
        await productPage.searchProduct(productSale[i].product_name);
        await expect(
          productPage.getXpathValueOfCell(productSale[i].product_name, productSale[i].product_sales),
        ).toBeVisible();
      }
    });

    await test.step(`Check hiển thị Created date`, async () => {
      const productCreateDate = conf.caseConf.verify_create_dates;
      for (let i = 0; i < productCreateDate.length; i++) {
        productCreateDate[i].create_date = convertDate(Date.now());
        await expect(
          productPage.getXpathValueOfCell(productCreateDate[i].product_name, productCreateDate[i].create_date),
        ).toBeVisible();
      }
    });

    await test.step(`Check hiển thị Status product các product`, async () => {
      const productStatus = conf.caseConf.verify_status;
      for (let i = 0; i < productStatus.length; i++) {
        await expect(
          productPage.getXpathValueOfCell(productStatus[i].product_name, productStatus[i].status),
        ).toBeVisible();
      }
    });

    await test.step(`Check hiển thị số Members các product`, async () => {
      const productMember = conf.caseConf.verify_members;
      await productPage.navigateToMenu("Orders");
      await orderPage.waitForFirstOrderStatus("paid");

      for (let i = 0; i < productMember.length; i++) {
        await productPage.navigateToMenu("Products");
        await expect(
          productPage.getXpathValueOfCell(productMember[i].product_name, productMember[i].product_member),
        ).toBeVisible();
      }
    });

    await test.step(`Click số members của product`, async () => {
      const productMember = conf.caseConf.has_member;
      await productPage.clickMemberProduct(productMember.product_member);
      await expect(productPage.genLoc(productPage.xpathVerifyMemberHeader)).toBeVisible();
    });
  });

  test(`Verify filter theo Status @SB_SC_SCP_7`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.filters_status.length; i++) {
      const filterStatusData = conf.caseConf.filters_status[i];
      await test.step(`${filterStatusData.description}`, async () => {
        const productList = await productPage.getProductOnListByStatus(filterStatusData.status);
        await productPage.filterByValue(filterStatusData.type, filterStatusData.value);
        await expect(productPage.genLoc(productPage.xpathTooltipFilter)).toBeVisible();
        expect(await productPage.genLoc(productPage.xpathRowProduct).count()).toEqual(productList);
        await productPage.genLoc("//div[contains(@class,'sb-tag__icon')]").click();
        await expect(productPage.genLoc("//div[contains(@class,'sb-skeleton__table-content')]")).toBeHidden();
      });
    }
  });

  test(`Verify filter theo Product type @SB_SC_SCP_6`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.filters_type_product.length; i++) {
      const filterTypeData = conf.caseConf.filters_type_product[i];
      await test.step(`${filterTypeData.description}`, async () => {
        const productList = await productPage.getProductOnListByType(filterTypeData.value);
        await productPage.filterByValue(filterTypeData.type, filterTypeData.value);
        await expect(productPage.genLoc(productPage.xpathTooltipFilter)).toBeVisible();
        expect(await productPage.genLoc(productPage.xpathRowProduct).count()).toEqual(productList);
        await productPage.genLoc("//div[contains(@class,'sb-tag__icon')]").click();
        await expect(productPage.genLoc("//div[contains(@class,'sb-skeleton__table-content')]")).toBeHidden();
      });
    }
  });

  test(`Verify filter theo title @SB_SC_SCP_5`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.filters_title.length; i++) {
      const filterTitleData = conf.caseConf.filters_title[i];
      await test.step(`${filterTitleData.description}`, async () => {
        const productList = await productPage.getProductOnListByTitle(filterTitleData.text_filter);
        await productPage.filterByValue(filterTitleData.type, filterTitleData.value, filterTitleData.text_filter);
        await expect(productPage.genLoc(productPage.xpathTooltipFilter)).toBeVisible();
        expect(await productPage.genLoc(productPage.xpathRowProduct).count()).toEqual(productList);
        await productPage.genLoc("//div[contains(@class,'sb-tag__icon')]").click();
        await expect(productPage.genLoc("//div[contains(@class,'sb-skeleton__table-content')]")).toBeHidden();
      });
    }
    await test.step(`Filter theo trường Title: Doesn't contain input text dài > Click Apply`, async () => {
      const productAll = await productPage.genLoc(productPage.xpathRowProduct).count();
      const productTitleContains = await productPage.getProductOnListByTitle(conf.caseConf.text_filter);
      const productList = productAll - productTitleContains;
      await productPage.filterByValue(conf.caseConf.type, conf.caseConf.value, conf.caseConf.text_filter);
      await expect(productPage.genLoc(productPage.xpathTooltipFilter)).toBeVisible();
      expect(await productPage.genLoc(productPage.xpathRowProduct).count()).toEqual(productList);
    });
  });

  test(`Verify chức năng "More Actions" multi products @SB_SC_SCP_2`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.more_actions.length; i++) {
      const actionData = conf.caseConf.more_actions[i];
      await test.step(`${actionData.description}`, async () => {
        await productPage.moreActionMultiProducts(actionData.action);
        if (actionData.status_verify) {
          await expect(
            productPage.getXpathValueOfCell(actionData.product_name, actionData.status_verify),
          ).toBeVisible();
        } else {
          await expect(productPage.genLoc(productPage.xpathNoProduct)).toBeVisible();
        }
      });
    }
  });

  test(`Verify chức năng "More Actions" từng dòng product @SB_SC_SCP_1`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.more_actions.length; i++) {
      const stepData = conf.caseConf.more_actions[i];
      await test.step(`${stepData.description}`, async () => {
        await productPage.moreAction(stepData.product_name, stepData.action);
        if (stepData.status_verify) {
          await expect(productPage.getXpathValueOfCell(stepData.product_name, stepData.status_verify)).toBeVisible();
        } else if (stepData.product_copy) {
          await expect(productPage.getXpathProductNameOnList(stepData.product_copy)).toBeVisible();
        } else {
          await expect(productPage.getXpathProductNameOnList(stepData.product_name)).toBeHidden();
        }
      });
    }
  });

  test(`Kiểm tra UI Filter format và Values khi click button Filter product @SB_SC_SCP_8`, async ({ conf }) => {
    await productPage.clickOnBtnWithLabel("More filters");
    const caseConf = conf.caseConf as SbScSCP8;
    for (const filtersData of caseConf.filters) {
      const locatorClear = await productPage.getXpathClearValueFilter(filtersData.type);

      await test.step(`Click Filter > Kiểm tra các Field có trong Filter`, async () => {
        await expect(productPage.getXpathTypeFilterProduct(filtersData.type)).toBeVisible();
      });

      await test.step(`Click Filter > Kiểm tra các Filter format và Values có trong Filter`, async () => {
        await productPage.getXpathTypeFilterProduct(filtersData.type).click();
        for (let i = 0; i < filtersData.value.length; i++) {
          await expect(productPage.getXpathValueFilterProduct(filtersData.type, filtersData.value[i])).toBeVisible();
        }
      });

      await test.step(`Click Filter > Kiểm tra các Placeholder / Default tại các Field có trong Filter`, async () => {
        for (let j = 0; j < filtersData.value.length; j++) {
          if (filtersData.type === "Title" || filtersData.type === "Number of members") {
            await productPage.getXpathValueFilterProduct(filtersData.type, filtersData.value[j]).click();
            await expect(productPage.getxpathTextFilter(filtersData.placeholder)).toBeVisible();
          }
        }
      });

      await test.step(`Kiểm tra trạng thái button "Clear"`, async () => {
        await expect(locatorClear).toHaveCSS("cursor", "not-allowed");
        await productPage.getXpathValueFilterProduct(filtersData.type, filtersData.value[0]).click();
        if (filtersData.type === "Title" || filtersData.type === "Number of members") {
          await productPage.getxpathTextFilter(filtersData.placeholder).fill(filtersData.fill_text);
        }
        await expect(locatorClear).toHaveCSS("cursor", "pointer");
      });
    }

    await test.step(`Kiểm tra trạng thái button "Clear all filters"`, async () => {
      await expect(productPage.getXpathClearAllFilters()).toHaveCSS("cursor", "not-allowed");
      await productPage.clickOnBtnWithLabel("Apply");
      await productPage.clickOnBtnWithLabel("More filters");
      await expect(productPage.getXpathClearAllFilters()).toHaveCSS("cursor", "pointer");
    });
  });
});
