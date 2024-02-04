import { OcgLogger } from "@core/logger";
import { test } from "@fixtures/website_builder";
import { ProductAPI } from "@pages/api/product";
import { ProductStorefrontAPI } from "@pages/api/product_storefront";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation//translation-detail";
import { SupportedLanguage } from "@pages/new_ecom/dashboard/translation/language-detail";
import { TranslationAPI } from "@pages/new_ecom/dashboard/translation/translation-api";
import { expect } from "@playwright/test";
import { AvailableLocale, TranslationDetailProductSearchData } from "@types";
import { transformSFProductData } from "./product.util";
import { ProductTranslationCaseData76 } from "./product";

const logger = OcgLogger.get();

test.describe("Verify Translation detail của Online store - Product ", () => {
  let dashboardPage: TranslationDetail;
  let translationAPI: TranslationAPI;
  let productAPI: ProductAPI;
  let storefrontAPI: ProductStorefrontAPI;

  test.setTimeout(10 * 60 * 1000); // increase timeout because sometime it take much time to complete translate

  test.beforeEach(async ({ dashboard, conf, authRequestWithExchangeToken, request }) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    translationAPI = new TranslationAPI(conf.suiteConf.domain, authRequestWithExchangeToken);
    storefrontAPI = new ProductStorefrontAPI(conf.suiteConf.domain, request);
  });

  test(`@SB_SET_TL_76 [DB+SF - Function] Kiểm tra tính năng auto translate khi  Disable Auto translate của Products - products`, async ({
    conf,
    authRequestWithExchangeToken,
    scheduler,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    let scheduleData: ProductTranslationCaseData76;
    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as ProductTranslationCaseData76;
    } else {
      logger.info("Init default object");
      scheduleData = {
        step4Done: false,
        productId: 0,
        retryTime: 0,
        productStep2Data: {
          handle: "",
          id: 0,
        },
      };

      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }

    await test.step(`Pre-condition: delete old product if exist; create new product`, async () => {
      if (!scheduleData.step4Done) {
        // Disable auto translate
        const isAutoTranslateEnable = await translationAPI.isAutoTranslateEnable(
          caseConf.language.code as AvailableLocale,
          "products",
        );
        logger.info(`isAutoTranslateEnable: ${isAutoTranslateEnable}`);

        if (isAutoTranslateEnable) {
          await translationAPI.updateAutoTranslateSetting(caseConf.language.code as AvailableLocale, "products", false);
        }

        const authRequest = await authRequestWithExchangeToken.changeToken();
        productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);

        // Search product
        const products = await productAPI.getProducts({
          query: caseConf.test_product,
        });

        logger.info(`Got num of product: ${JSON.stringify(products?.length)}`);

        // Delete product
        if (products.length > 0) {
          const productIds = products.map(item => item.id);
          await productAPI.deleteProducts(productIds);
        }

        // Create product
        const createResponse = await productAPI.createNewProduct({
          title: "SB_SET_TL_76 - test product",
          ...caseConf.test_product.data,
        });
        scheduleData.productId = createResponse.id;
      } else {
        logger.info("Step prepare already done, skip this step");
      }
    });

    await test.step(`Step 1: Disable auto translate ở Products > Mở màn products Translation  http://joxi.ru/nAy76xluk1WzNm  > Mở droplist product `, async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.language.name as SupportedLanguage,
        "Products",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      if (!scheduleData.step4Done) {
        await dashboardPage.focusOnSearchBar();
        await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
        const searchResult = await dashboardPage.getProductSearchResults();
        expect(searchResult).toEqual(expect.arrayContaining([caseConf.test_product.title]));
      }
    });

    await test.step(`Step 2: Thực hiện thêm / xóa product tại dashboard > Mở màn products Translation > Mở droplist`, async () => {
      if (!scheduleData.step4Done) {
        // Create product
        const productCreateResponse = await productAPI.createNewProduct({
          title: caseConf.update_translation_step2.name,
          ...caseConf.test_product.data,
        });

        scheduleData.productStep2Data = {
          id: productCreateResponse.id,
          handle: productCreateResponse.handle,
        };

        // Update product
        await productAPI.updateProduct({
          id: scheduleData.productId,
          title: caseConf.update_translation_step2.updated_name,
        });

        // Reload page & check
        await dashboardPage.page.reload();
        await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
        await dashboardPage.focusOnSearchBar();
        await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
        let searchResult = await dashboardPage.getProductSearchResults();
        expect(searchResult).toEqual(
          expect.arrayContaining([
            caseConf.update_translation_step2.updated_name,
            caseConf.update_translation_step2.name,
          ]),
        );

        // Delete product
        const productIds = [scheduleData.productId];
        await productAPI.deleteProducts(productIds);

        // Reload page & check
        await dashboardPage.page.reload();
        await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
        await dashboardPage.focusOnSearchBar();
        await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
        searchResult = await dashboardPage.getProductSearchResults();
        expect(searchResult).toEqual(expect.arrayContaining([caseConf.update_translation_step2.name]));
      }
    });

    await test.step(`Step 3: Thực hiện edit content  product A, Mở màn products Translation của product đã edit`, async () => {
      if (!scheduleData.step4Done) {
        // Update product
        const { product: oldProduct } = await productAPI.getDataProductById(scheduleData.productStep2Data.id);
        const optionSets = oldProduct.option_sets;
        const options = oldProduct.options;
        const customOptions = oldProduct.custom_options;

        const step3Data = caseConf.update_translation_step3.update_data;
        const updateBody = {
          id: scheduleData.productStep2Data.id,
          title: step3Data.title,
          body_html: step3Data.body_html,
          update_option_value: [
            {
              option_set_id: optionSets[0].id,
              old_option_value: optionSets[0].options[0].value,
              new_option_value: step3Data.options_1[0],
            },
            {
              option_set_id: optionSets[0].id,
              old_option_value: optionSets[0].options[1].value,
              new_option_value: step3Data.options_1[1],
            },
            {
              option_set_id: optionSets[0].id,
              old_option_value: optionSets[0].options[2].value,
              new_option_value: step3Data.options_1[2],
            },
            {
              option_set_id: optionSets[1].id,
              old_option_value: optionSets[1].options[0].value,
              new_option_value: step3Data.options_2[0],
            },
            {
              option_set_id: optionSets[1].id,
              old_option_value: optionSets[1].options[1].value,
              new_option_value: step3Data.options_2[1],
            },
            {
              option_set_id: optionSets[1].id,
              old_option_value: optionSets[1].options[2].value,
              new_option_value: step3Data.options_2[2],
            },
          ],
          options: [
            {
              ...options[0],
              name: step3Data.option_sets[0],
            },
            {
              ...options[1],
              name: step3Data.option_sets[1],
            },
          ],
          custom_options: [
            {
              ...customOptions[0],
              ...step3Data.custom_options.text,
            },
            {
              ...customOptions[1],
              ...step3Data.custom_options.textarea,
            },
            {
              ...customOptions[2],
              ...step3Data.custom_options.image,
            },
            {
              ...customOptions[3],
              ...step3Data.custom_options.radio_button,
            },
            {
              ...customOptions[4],
              ...step3Data.custom_options.droplist,
            },
            {
              ...customOptions[5],
              ...step3Data.custom_options.checkbox,
            },
            {
              ...customOptions[6],
              ...step3Data.custom_options.picture_choice,
            },
          ],
        };

        await productAPI.updateProduct(updateBody);
        await dashboardPage.page.reload();
        await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
        await dashboardPage.focusOnSearchBar();
        await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
        await dashboardPage.chooseProduct(step3Data.title);

        const tableData = await dashboardPage.getTranslationDetailData();
        const transformedData = tableData.map(item => {
          return {
            field_name: item.field,
            source_value: item.source.value,
            target_value: item.destination.value,
          };
        });

        logger.info(`step3 - dashboard: ${JSON.stringify(transformedData)}`);
        expect.soft(transformedData).toMatchObject(caseConf.update_translation_step3.expect.dashboard);

        // Verify storefront
        const productDetail = await storefrontAPI.getProductDetail(scheduleData.productStep2Data.handle, {
          "x-lang": caseConf.language.code,
        });
        const transformedSFData = transformSFProductData(productDetail.result);
        logger.info(`step3 - sf: ${JSON.stringify(transformedSFData)}`);
        logger.info(`step3 - expected: ${JSON.stringify(caseConf.update_translation_step3.expect.storefront)}`);

        expect.soft(transformedSFData).toMatchObject(caseConf.update_translation_step3.expect.storefront);
      }
    });

    await test.step(`Step 4: click btn auto translate `, async () => {
      if (!scheduleData.step4Done) {
        await dashboardPage.clickActionBtn("Auto translate");
      }

      try {
        await expect(dashboardPage.genLoc(dashboardPage.xpathTD.alertArea.title)).toHaveText(
          /Your online store is ready in */,
          { timeout: 2 * 60 * 1000 }, // wait up to 2 minutes
        );
      } catch (e) {
        logger.info(`Error when wait auto translate complete: ${e}`);
        if (scheduleData.retryTime > 0) {
          // Only retry 1 time
          throw e;
        }

        scheduleData.retryTime++;
        scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 10 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
      }

      scheduleData.step4Done = true;
      scheduleData.retryTime = 0;

      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      const tableData = await dashboardPage.getTranslationDetailData();
      const transformedData = tableData.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      logger.info(`step4 - dashboard: ${JSON.stringify(transformedData)}`);
      expect.soft(transformedData).toMatchObject(caseConf.update_translation_step4.expect.dashboard);
    });

    await test.step(`Step 5: Thực hiện edit bản dịch> Save > Click Auto translate`, async () => {
      const updateData = caseConf.update_translation_step5.edit_data as TranslationDetailProductSearchData[];
      let tableData = await dashboardPage.getTranslationDetailData();
      await dashboardPage.fillTranslationDetails(updateData);
      await dashboardPage.clickBtnSave();
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      tableData = await dashboardPage.getTranslationDetailData();
      const transformedData = tableData.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      logger.info(`transformedData step 5: ${JSON.stringify(transformedData)}`);

      // await dashboardPage.page.pause();
      expect.soft(transformedData).toMatchObject(caseConf.update_translation_step5.expect.dashboard);

      // Verify storefront
      const productDetail = await storefrontAPI.getProductDetail(scheduleData.productStep2Data.handle, {
        "x-lang": caseConf.language_locale,
      });
      const transformedSFData = transformSFProductData(productDetail.result);
      logger.info(`transformedSFData step 5: ${JSON.stringify(transformedSFData)}`);
      expect.soft(transformedSFData).toMatchObject(caseConf.update_translation_step5.expect.storefront);
    });

    await test.step(`Step 6: Xóa Bản dịch manual > save
  Ra ngoài SF > chọn ngôn ngữ tiếng Croatian > mở Page details`, async () => {
      const updateData = caseConf.update_translation_step6.edit_data as TranslationDetailProductSearchData[];
      let tableData = await dashboardPage.getTranslationDetailData();
      await dashboardPage.fillTranslationDetails(updateData);
      await dashboardPage.clickBtnSave();
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      tableData = await dashboardPage.getTranslationDetailData();
      const transformedData = tableData.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      logger.info(`transformedData step 6: ${JSON.stringify(transformedData)}`);
      expect.soft(transformedData).toMatchObject(caseConf.update_translation_step6.expect.dashboard);

      // Verify storefront
      const productDetail = await storefrontAPI.getProductDetail(scheduleData.productStep2Data.handle, {
        "x-lang": caseConf.language_locale,
      });
      const transformedSFData = transformSFProductData(productDetail.result);
      logger.info(`transformedSFData step 6: ${JSON.stringify(transformedSFData)}`);

      expect.soft(transformedSFData).toMatchObject(caseConf.update_translation_step6.expect.storefront);
    });

    await test.step(`Step 7: click btn auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.alertArea.title)).toHaveText(
        /Your online store is ready in */,
        { timeout: 120000 },
      );
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      const tableData = await dashboardPage.getTranslationDetailData();
      const transformedData = tableData.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      logger.info(`transformedData step 7: ${JSON.stringify(transformedData)}`);
      expect.soft(transformedData).toMatchObject(caseConf.update_translation_step7.expect.dashboard);

      // Verify storefront
      const productDetail = await storefrontAPI.getProductDetail(scheduleData.productStep2Data.handle, {
        "x-lang": caseConf.language_locale,
      });
      const transformedSFData = transformSFProductData(productDetail.result);
      logger.info(`transformedSFData step 7: ${JSON.stringify(transformedSFData)}`);
      expect.soft(transformedSFData).toMatchObject(caseConf.update_translation_step7.expect.storefront);
    });
  });

  test(`@SB_SET_TL_77 [DB+SF - Function]  Kiểm tra tính năng auto translate khi enable auto translate Products - products`, async ({
    authRequestWithExchangeToken,
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    let productId = 0;
    let productCreateResponse;

    await test.step(`Pre-condition: delete old product if exist; create new product`, async () => {
      const authRequest = await authRequestWithExchangeToken.changeToken();
      productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);

      // Search product
      const products = await productAPI.getProducts({
        query: caseConf.test_product,
      });

      logger.info(`Got num of product: ${JSON.stringify(products?.length)}`);

      // Delete product
      if (products.length > 0) {
        const productIds = products.map(item => item.id);
        await productAPI.deleteProducts(productIds);
      }

      // Create product
      const createResponse = await productAPI.createNewProduct({
        title: "SB_SET_TL_77 - test product",
        ...caseConf.test_product.data,
      });

      productId = createResponse.id;
    });

    await test.step(`Enable auto translate ở Products > Mở màn products Translation   > Mở droplist product `, async () => {
      const isAutoTranslateEnable = await translationAPI.isAutoTranslateEnable(
        caseConf.language.code as AvailableLocale,
        "products",
      );
      logger.info(`isAutoTranslateEnable: ${isAutoTranslateEnable}`);

      if (!isAutoTranslateEnable) {
        await translationAPI.updateAutoTranslateSetting(caseConf.language.code as AvailableLocale, "products", true);
      }

      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.language.name as SupportedLanguage,
        "Products",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      await dashboardPage.focusOnSearchBar();
      await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
      const searchResult = await dashboardPage.getProductSearchResults();
      expect.soft(searchResult).toMatchObject([caseConf.test_product.title]);
    });

    await test.step(`Thực hiện thêm / xóa/ đổi tên product tại dashboard > Mở màn products Translation > Mở droplist`, async () => {
      // Create product
      productCreateResponse = await productAPI.createNewProduct({
        title: caseConf.update_translation_step2.name,
        ...caseConf.test_product.data,
      });

      // Update product
      await productAPI.updateProduct({
        id: productId,
        title: caseConf.update_translation_step2.updated_name,
      });

      // Reload page & check
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
      await dashboardPage.focusOnSearchBar();
      await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
      let searchResult = await dashboardPage.getProductSearchResults();
      expect
        .soft(searchResult)
        .toMatchObject([caseConf.update_translation_step2.name, caseConf.update_translation_step2.updated_name]);

      // Delete product
      const productIds = [productId];
      await productAPI.deleteProducts(productIds);

      // Reload page & check
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
      await dashboardPage.focusOnSearchBar();
      await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
      searchResult = await dashboardPage.getProductSearchResults();
      expect.soft(searchResult).toMatchObject([caseConf.update_translation_step2.name]);
    });

    await test.step(`Thực hiện edit content  product A
  Mở màn products Translation của product đã edit`, async () => {
      // Update product
      const { product: oldProduct } = await productAPI.getDataProductById(productCreateResponse.id);
      const optionSets = oldProduct.option_sets;
      const options = oldProduct.options;
      const customOptions = oldProduct.custom_options;

      const step3Data = caseConf.update_translation_step3.update_data;
      const updateBody = {
        id: productCreateResponse.id,
        title: step3Data.title,
        body_html: step3Data.body_html,
        update_option_value: [
          {
            option_set_id: optionSets[0].id,
            old_option_value: optionSets[0].options[0].value,
            new_option_value: step3Data.options_1[0],
          },
          {
            option_set_id: optionSets[0].id,
            old_option_value: optionSets[0].options[1].value,
            new_option_value: step3Data.options_1[1],
          },
          {
            option_set_id: optionSets[0].id,
            old_option_value: optionSets[0].options[2].value,
            new_option_value: step3Data.options_1[2],
          },
          {
            option_set_id: optionSets[1].id,
            old_option_value: optionSets[1].options[0].value,
            new_option_value: step3Data.options_2[0],
          },
          {
            option_set_id: optionSets[1].id,
            old_option_value: optionSets[1].options[1].value,
            new_option_value: step3Data.options_2[1],
          },
          {
            option_set_id: optionSets[1].id,
            old_option_value: optionSets[1].options[2].value,
            new_option_value: step3Data.options_2[2],
          },
        ],
        options: [
          {
            ...options[0],
            name: step3Data.option_sets[0],
          },
          {
            ...options[1],
            name: step3Data.option_sets[1],
          },
        ],
        custom_options: [
          {
            ...customOptions[0],
            ...step3Data.custom_options.text,
          },
          {
            ...customOptions[1],
            ...step3Data.custom_options.textarea,
          },
          {
            ...customOptions[2],
            ...step3Data.custom_options.image,
          },
          {
            ...customOptions[3],
            ...step3Data.custom_options.radio_button,
          },
          {
            ...customOptions[4],
            ...step3Data.custom_options.droplist,
          },
          {
            ...customOptions[5],
            ...step3Data.custom_options.checkbox,
          },
          {
            ...customOptions[6],
            ...step3Data.custom_options.picture_choice,
          },
        ],
      };

      await productAPI.updateProduct(updateBody);
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
      await dashboardPage.focusOnSearchBar();
      await dashboardPage.page.waitForTimeout(2000); // wait for animation completed
      await dashboardPage.chooseProduct(step3Data.title);

      const tableData = await dashboardPage.getTranslationDetailData();
      const transformedData = tableData.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      logger.info(`step3 - dashboard: ${JSON.stringify(transformedData)}`);
      expect.soft(transformedData).toMatchObject(caseConf.update_translation_step3.expect.dashboard);

      // Verify storefront
      const productDetail = await storefrontAPI.getProductDetail(productCreateResponse.handle, {
        "x-lang": caseConf.language_locale,
      });
      const transformedSFData = transformSFProductData(productDetail.result);
      logger.info(`step3 - sf: ${JSON.stringify(transformedSFData)}`);
      logger.info(`step3 - expected: ${JSON.stringify(caseConf.update_translation_step3.expect.storefront)}`);

      expect
        .soft(transformedSFData)
        .toEqual(expect.arrayContaining(caseConf.update_translation_step3.expect.storefront));
    });

    await test.step(`Thực hiện edit bản dịch`, async () => {
      const updateData = caseConf.update_translation_step4.edit_data as TranslationDetailProductSearchData[];
      await dashboardPage.fillTranslationDetails(updateData);
      await dashboardPage.clickBtnSave();
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.alertArea.title)).toHaveText(
        /Your online store is ready in */,
        { timeout: 120000 },
      );
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      const tableData = await dashboardPage.getTranslationDetailData();
      const transformedData = tableData.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      logger.info(`transformedData step 6: ${JSON.stringify(transformedData)}`);
      expect.soft(transformedData).toMatchObject(caseConf.expect_step4.dashboard);

      // Verify storefront
      const productDetail = await storefrontAPI.getProductDetail(productCreateResponse.handle, {
        "x-lang": caseConf.language_locale,
      });
      const transformedSFData = transformSFProductData(productDetail.result);
      logger.info(`transformedSFData step 6: ${JSON.stringify(transformedSFData)}`);
      expect.soft(transformedSFData).toMatchObject(caseConf.expect_step4.storefront);
    });

    await test.step(`Xóa Bản dịch manual > save  > reload
  Ra ngoài SF > chọn ngôn ngữ tiếng French >  Ra ngoài SF product A`, async () => {
      const updateData = caseConf.update_translation_step5.edit_data as TranslationDetailProductSearchData[];
      let tableData = await dashboardPage.getTranslationDetailData();
      await dashboardPage.fillTranslationDetails(updateData);
      await dashboardPage.clickBtnSave();
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      tableData = await dashboardPage.getTranslationDetailData();
      const transformedData = tableData.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      logger.info(`transformedData step 5: ${JSON.stringify(transformedData)}`);
      expect.soft(transformedData).toMatchObject(caseConf.expect_step5.dashboard);

      // Verify storefront
      const productDetail = await storefrontAPI.getProductDetail(productCreateResponse.handle, {
        "x-lang": caseConf.language_locale,
      });
      const transformedSFData = transformSFProductData(productDetail.result);
      logger.info(`transformedSFData step 5: ${JSON.stringify(transformedSFData)}`);
      expect.soft(transformedData).toMatchObject(caseConf.expect_step5.storefront);
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.alertArea.title)).toHaveText(
        /Your online store is ready in */,
        { timeout: 120000 },
      );
      await dashboardPage.page.reload();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      const tableData = await dashboardPage.getTranslationDetailData();
      const transformedData = tableData.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      logger.info(`transformedData step 6: ${JSON.stringify(transformedData)}`);
      expect.soft(transformedData).toMatchObject(caseConf.expect_step6.dashboard);

      // Verify storefront
      const productDetail = await storefrontAPI.getProductDetail(productCreateResponse.handle, {
        "x-lang": caseConf.language_locale,
      });
      const transformedSFData = transformSFProductData(productDetail.result);
      logger.info(`transformedSFData step 6: ${JSON.stringify(transformedSFData)}`);
      expect.soft(transformedSFData).toMatchObject(caseConf.expect_step6.storefront);
    });
  });
});
