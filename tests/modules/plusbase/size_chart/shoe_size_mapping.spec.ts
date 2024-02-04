import { expect } from "@core/fixtures";
import { test } from "@fixtures/odoo";
import { ProductPage } from "@pages/dashboard/products";
import { loadData } from "@core/conf/conf";
import { SizeChartPlusBaseAPI } from "@pages/api/plusbase/size_charts";
import { OdooService } from "@services/odoo";

test.describe("Feature update variant để hạn chế map sai các sản phẩm giày dép", async () => {
  let shopDomain: string;
  let productPage: ProductPage;
  let productId: number;
  let listSizeToSell: string[];
  let plbTemplateShopDomain: string;

  let sizeChartAPI: SizeChartPlusBaseAPI;

  test.beforeEach(async ({ conf }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    listSizeToSell = conf.suiteConf.list_size_to_sell;
    plbTemplateShopDomain = conf.suiteConf.plb_template.domain;
  });

  test.describe("Verify convert size thành công trước khi map size chart", async () => {
    const caseName = "SB_PLB_OTMSC_25";
    const conf = loadData(__dirname, caseName);
    conf.caseConf.data.forEach(
      ({
        case_id: caseId,
        description: caseDescription,
        origin_size: originSize,
        size_convert: sizeConvert,
        number_of_variant: numberOfVariant,
        size_to_sell: sizeToSell,
        fulfill_value_origin: fulfillValueOrigin,
        variant_after_convert: variantAfterConvert,
        variant_after_edit: variantAfterEdit,
        old_variant: oldVariant,
        invalid_variant: invalidVariant,
        new_variant: newVariant,
        list_convert_from: listConvertFromSize,
        invalid_size_convert: invalidSizeConvert,
        invalid_size_convert_mess: invalidSizeConvertMess,
        convert_from: convertFromSize,
        invalid_variant_message: invalidVariantMessage,
      }) => {
        test(`@${caseId} ${caseDescription}`, async ({ dashboard, conf }) => {
          productPage = new ProductPage(dashboard, shopDomain);
          productId = conf.caseConf.product_id;

          await test.step(`Vào product detail >Tại Variant options : Click button Edit variant Shoe size > Hover variant name Shoe Size`, async () => {
            await productPage.navigateToMenu("Dropship products");
            await productPage.navigateToMenu("All products");
            await productPage.goToProdDetailByID(shopDomain, productId);
            //Click button Edit variant Shoe size
            await productPage.clickOnBtnWithLabel("Edit", 2);

            //Hover variant name Shoe Size
            expect(await productPage.getTextAwareShoeSize()).toEqual(
              "The name of variant option size cannot be changed as it may affect fulfillment process",
            );
          });

          await test.step(`Verify size type `, async () => {
            expect(await productPage.isTextVisible(originSize)).toBe(true);
          });

          await test.step(`Click on Size type > Select value in drop down " Select the size type you would like to sell"`, async () => {
            await productPage.clickElementWithLabel("p", originSize, 1);
            expect(
              await productPage.verifySelectOptions(
                productPage.xpathShoeSizeDropDown("Select the size type you would like to sell"),
                listSizeToSell,
              ),
            ).toBe(true);
            await productPage.selectShoeSize("Select the size type you would like to sell", sizeToSell[0]);
            expect(
              await productPage.verifySelectOptions(
                productPage.xpathShoeSizeDropDown("Select the size type you want to convert from"),
                listConvertFromSize,
              ),
            ).toBe(true);
          });

          await test.step(`Select value in drop down "Select the size type you want to convert from" > verify error message`, async () => {
            await productPage.selectShoeSize("Select the size type you want to convert from", invalidSizeConvert);
            expect(await productPage.isTextVisible(invalidSizeConvertMess)).toBe(true);
          });

          await test.step(`Select value in drop down "Select the size type you want to convert from" > Click button Save`, async () => {
            await productPage.selectShoeSize("Select the size type you want to convert from", convertFromSize);
            expect(await productPage.isTextVisible(invalidSizeConvertMess)).toBe(false);
            await productPage.clickBtnSaveOnPopup();
            expect(await productPage.isTextVisible(sizeConvert)).toBe(true);
            await productPage.clickOnBtnWithLabel("Save");
            await productPage.clickOnBtnWithLabel("Save changes");
            await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
            for (const variant of variantAfterConvert) {
              await expect(productPage.locatorVariant(variant)).toBeVisible();
            }
          });

          await test.step(`edit variant value`, async () => {
            await productPage.page.reload();
            await productPage.clickOnBtnWithLabel("Edit", 2);
            for (let i = 0; i < numberOfVariant; i++) {
              await expect(productPage.locatorVariantOption(variantAfterConvert[i])).toBeEnabled();
              await expect(productPage.locatorVariantOption(fulfillValueOrigin[i])).toBeDisabled();
            }
            await productPage.locatorVariantOption(oldVariant).fill(invalidVariant);
            await expect(productPage.isToastMsgVisible(invalidVariantMessage)).toBeTruthy();
          });

          await test.step(`edit variant value > Click Save`, async () => {
            await productPage.locatorVariantOption(oldVariant).fill(newVariant);
            await productPage.clickOnBtnWithLabel("Save");
            await productPage.clickOnBtnWithLabel("Save changes");
            await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
            for (let i = 0; i < numberOfVariant; i++) {
              await expect(productPage.locatorVariant(variantAfterEdit[i])).toBeVisible();
            }
          });

          await test.step(`Click on Size type > Select value in drop down " Select the size type you would like to sell" > Click Save > edit variant value > Click Save`, async () => {
            await productPage.page.reload();
            await productPage.clickOnBtnWithLabel("Edit", 2);
            await productPage.clickElementWithLabel("p", sizeConvert, 1);
            await productPage.selectShoeSize("Select the size type you would like to sell", sizeToSell[1]);

            await productPage.clickBtnSaveOnPopup();
            for (let i = 0; i < numberOfVariant; i++) {
              await productPage.locatorVariantOption(variantAfterEdit[i]).fill(fulfillValueOrigin[i]);
            }
            await productPage.clickOnBtnWithLabel("Save");
            await productPage.clickOnBtnWithLabel("Save changes");
            await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
            let i = 1;
            for (const variant of fulfillValueOrigin) {
              expect(await productPage.getTextContent(productPage.xpathVariantOptionValue("Shoe Size", i))).toEqual(
                variant,
              );
              i++;
            }
            for (const value of fulfillValueOrigin) {
              await expect(productPage.locatorVariant(value)).toBeVisible();
            }
          });
        });
      },
    );
  });

  test(`@SB_PLB_OTMSC_30 Verify màn product admin sau khi ops map size chart cho product`, async ({
    dashboard,
    conf,
    authRequest,
    token,
    odoo,
  }) => {
    let fulfillValueOrigin: string[];
    let numberOfVariant: number;
    let variantAfterConvert: string[];
    let variantAfterMapping: string[];
    productPage = new ProductPage(dashboard, shopDomain);
    const productIds = conf.caseConf.product_ids;
    sizeChartAPI = new SizeChartPlusBaseAPI(plbTemplateShopDomain, authRequest);
    const productOdoo = OdooService(odoo);
    await test.step(`Vào product list > Search product>  Vào product detail >Tại Variant options : Click button Edit variant Shoe size `, async () => {
      numberOfVariant = conf.caseConf.us_size.number_of_variant;
      fulfillValueOrigin = conf.caseConf.us_size.fulfill_value_origin;
      variantAfterConvert = conf.caseConf.us_size.variant_after_convert;
      variantAfterMapping = conf.caseConf.us_size.variant_after_mapping;

      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productIds[0]);

      //Click button Edit variant Shoe size > Verify variant option value trước khi product được map size chart
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariantOption(variantAfterConvert[i])).toBeEnabled();
        await expect(productPage.locatorVariantOption(fulfillValueOrigin[i])).toBeDisabled();
      }
      await productPage.clickOnBtnWithLabel("Cancel");

      //map size chart cho product
      const accessToken = (
        await token.getWithCredentials({
          domain: conf.suiteConf.plb_template.domain,
          username: conf.suiteConf.plb_template.username,
          password: conf.suiteConf.plb_template.password,
        })
      ).access_token;

      const dataMapSizeChart = conf.caseConf.us_size_mapping.data_map_size_chart;
      sizeChartAPI = new SizeChartPlusBaseAPI(plbTemplateShopDomain, authRequest);
      await sizeChartAPI.mapSizeChart(dataMapSizeChart, accessToken, productOdoo);

      // Verify variant option value sau khi map size chart thành công
      await productPage.page.reload();
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariant(variantAfterMapping[i])).toBeVisible();
      }
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariantOption(variantAfterMapping[i])).toBeDisabled();
        await expect(productPage.locatorVariantOption(variantAfterMapping[i], 2)).toBeDisabled();
      }

      //Remove map size chart
      const dataRemoveSizeChart = conf.suiteConf.data_remove;
      dataRemoveSizeChart.product_tmpl_id = conf.caseConf.us_size_mapping.product_template_id;
      await sizeChartAPI.mapSizeChart(dataRemoveSizeChart, accessToken, productOdoo);

      //Reset variant option value về giá trị ban đầu
      await productPage.page.reload();
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await productPage.locatorVariantOption(variantAfterMapping[i]).fill(variantAfterConvert[i]);
      }
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
    });

    await test.step(`Vào product list > Search product> product detail  >Tại Variant options : Click button Edit variant Shoe size `, async () => {
      numberOfVariant = conf.caseConf.eu_size.number_of_variant;
      fulfillValueOrigin = conf.caseConf.eu_size.fulfill_value_origin;
      variantAfterConvert = conf.caseConf.eu_size.variant_after_convert;
      variantAfterMapping = conf.caseConf.eu_size.variant_after_mapping;
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productIds[1]);

      //Click button Edit variant Shoe size  > Verify variant option value trước khi product được map size chart
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariantOption(variantAfterConvert[i])).toBeEnabled();
        await expect(productPage.locatorVariantOption(fulfillValueOrigin[i])).toBeDisabled();
      }
      await productPage.clickOnBtnWithLabel("Cancel");

      //map size chart cho product
      const accessToken = (
        await token.getWithCredentials({
          domain: conf.suiteConf.plb_template.domain,
          username: conf.suiteConf.plb_template.username,
          password: conf.suiteConf.plb_template.password,
        })
      ).access_token;

      const dataMapSizeChart = conf.caseConf.eu_size_mapping.data_map_size_chart;
      sizeChartAPI = new SizeChartPlusBaseAPI(plbTemplateShopDomain, authRequest);
      await sizeChartAPI.mapSizeChart(dataMapSizeChart, accessToken, productOdoo);

      //Verify variant option value sau khi product được map size chart thành công
      await productPage.page.reload();
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariant(variantAfterMapping[i])).toBeVisible();
      }
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariantOption(variantAfterMapping[i])).toBeDisabled();
        await expect(productPage.locatorVariantOption(variantAfterMapping[i], 2)).toBeDisabled();
      }

      //Remove map size chart
      const dataRemoveSizeChart = conf.suiteConf.data_remove;
      dataRemoveSizeChart.product_tmpl_id = conf.caseConf.eu_size_mapping.product_template_id;
      await sizeChartAPI.mapSizeChart(dataRemoveSizeChart, accessToken, productOdoo);

      //Reset variant option value về giá trị ban đầu
      await productPage.page.reload();
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await productPage.locatorVariantOption(variantAfterMapping[i]).fill(variantAfterConvert[i]);
      }
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
    });

    await test.step(`Vào product list > Search product>  Vào product detail >Tại Variant options : Click button Edit variant Shoe size `, async () => {
      numberOfVariant = conf.caseConf.other_size.number_of_variant;
      fulfillValueOrigin = conf.caseConf.other_size.fulfill_value_origin;
      variantAfterConvert = conf.caseConf.other_size.variant_after_convert;
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.goToProdDetailByID(shopDomain, productIds[2]);

      //Click button Edit variant Shoe size > Verify variant option value trước khi product được map size chart
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariantOption(variantAfterConvert[i])).toBeEnabled();
        await expect(productPage.locatorVariantOption(fulfillValueOrigin[i])).toBeDisabled();
      }
      await productPage.clickOnBtnWithLabel("Cancel");

      //map size chart cho product
      const accessToken = (
        await token.getWithCredentials({
          domain: conf.suiteConf.plb_template.domain,
          username: conf.suiteConf.plb_template.username,
          password: conf.suiteConf.plb_template.password,
        })
      ).access_token;

      const dataMapSizeChart = conf.caseConf.other_size_mapping.data_map_size_chart;
      sizeChartAPI = new SizeChartPlusBaseAPI(plbTemplateShopDomain, authRequest);
      await sizeChartAPI.mapSizeChart(dataMapSizeChart, accessToken, productOdoo);

      //Verify variant option value sau khi product được map size chart thành công
      await productPage.page.reload();
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariantOption(variantAfterConvert[i])).toBeEnabled();
        await expect(productPage.locatorVariantOption(fulfillValueOrigin[i])).toBeDisabled();
      }
    });

    await test.step(`Edit variant value với những variant option value khác fulfilled value > Click save`, async () => {
      // Update variant option value
      for (let i = 0; i < numberOfVariant; i++) {
        await productPage.locatorVariantOption(variantAfterConvert[i]).fill(fulfillValueOrigin[i]);
      }
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Save changes");

      // Verify variant option value sau khi update variant value = fulfillment value
      await productPage.page.reload();
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariant(fulfillValueOrigin[i])).toBeVisible();
      }
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await expect(productPage.locatorVariantOption(fulfillValueOrigin[i])).toBeDisabled();
        await expect(productPage.locatorVariantOption(fulfillValueOrigin[i], 2)).toBeDisabled();
      }
      //Remove map size chart
      const accessToken = (
        await token.getWithCredentials({
          domain: conf.suiteConf.plb_template.domain,
          username: conf.suiteConf.plb_template.username,
          password: conf.suiteConf.plb_template.password,
        })
      ).access_token;
      const dataRemoveSizeChart = conf.suiteConf.data_remove;
      dataRemoveSizeChart.product_tmpl_id = conf.caseConf.other_size_mapping.product_template_id;
      await sizeChartAPI.mapSizeChart(dataRemoveSizeChart, accessToken, productOdoo);

      //Reset variant option value về giá trị ban đầu
      await productPage.page.reload();
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (let i = 0; i < numberOfVariant; i++) {
        await productPage.locatorVariantOption(fulfillValueOrigin[i]).fill(variantAfterConvert[i]);
      }
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
    });
  });

  test(`@SB_PLB_OTMSC_31 Verify variant combo sau khi product được map size chart`, async ({ dashboard, conf }) => {
    const oldComboName = conf.caseConf.old_combo_name;
    const newComboName = conf.caseConf.new_combo_name;
    const fulfillCombo = conf.caseConf.fulfill_combo;
    productPage = new ProductPage(dashboard, shopDomain);
    await productPage.navigateToMenu("Dropship products");
    await productPage.navigateToMenu("All products");
    await productPage.goToProdDetailByID(shopDomain, conf.caseConf.product_id);
    await test.step(`Vào product detail >Tại Variant options : Click button Edit variant Shoe size > Hover combo name `, async () => {
      //Click button Edit variant Shoe size
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await expect(productPage.locatorVariantOption(oldComboName)).toBeEnabled();
      if (process.env.ENV == "prod")
        await expect(productPage.locatorVariantOption(conf.caseConf.fulfill_combo_pro)).toBeDisabled();
      else await expect(productPage.locatorVariantOption(fulfillCombo)).toBeDisabled();
    });

    await test.step(`Edit combo name >Click Save`, async () => {
      await productPage.locatorVariantOption(oldComboName).fill(newComboName);
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
      await expect(productPage.locatorVariant(newComboName)).toBeVisible();

      //Reset combo name về giá trị ban đầu
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await productPage.locatorVariantOption(newComboName).fill(oldComboName);
      await productPage.clickOnBtnWithLabel("Save");
      await productPage.clickOnBtnWithLabel("Save changes");
      await expect(productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
    });
  });
});
