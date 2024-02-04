import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@pages/storefront/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import appRoot from "app-root-path";
import path from "path";

test.describe("Verify product variant", () => {
  let product;
  let dashboardPage;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    product = new ProductPage(dashboard, conf.suiteConf.domain);
    await dashboardPage.navigateToMenu("Products");
  });

  test(`Add thành công new variant cho product đã có variant @TC_SB_PRO_test_239`, async ({
    conf,
    authRequest,
    context,
    dashboard,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productVariantInfo = conf.caseConf.product_variant_info;
    const productValidateDetail = conf.caseConf.product_validate_detail;
    const productValidateSF = conf.caseConf.product_validate_sf;

    await test.step(`Precondition: Vào màn hình Products>All products sau đó import product by CSV`, async () => {
      await product.deleteProduct(conf.suiteConf.password);
      await dashboard.reload();
      const pathFile = path.join(appRoot + "/assets/import_product_csv/product_variant.csv");
      await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, false);
    });

    await test.step(`Search and Click product name > Click button [Add variant] >
    Input value vào các field > Click button [Save change]`, async () => {
      await product.searchProdByName(productVariantInfo.title);
      await product.chooseProduct(productVariantInfo.title);
      await product.clickAddVariant();
      await product.addOrEditVariantWithData(productVariantInfo);
      await product.checkMsgAfterCreated({
        message: productValidateDetail.message,
      });
    });

    await test.step(`Click bredcum để back lại màn product detail`, async () => {
      await product.clickBackProductDetail();
      expect(await product.getNumberProductAllVariant()).toContain(productValidateDetail.number_all_variant);
      const productId = await product.getProductId(authRequest, productVariantInfo.title, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          productValidateDetail,
        ),
      ).toEqual(productValidateDetail);
    });

    await test.step(`Verify thông tin product ngoài SF`, async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      expect(await productStoreFront.getProductTitle()).toEqual(productValidateSF.title);
      await productStoreFront.selectAndCheckVariant(productValidateSF.size, productValidateSF.type_size);
      await productStoreFront.selectAndCheckVariant(productValidateSF.color, productValidateSF.type_color);
    });
  });

  test(`Delete thành công variant @TC_SB_PRO_test_240`, async ({ conf, authRequest, context }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;
    const resultDelete = conf.caseConf.result_delete;
    const productInfoSF = conf.caseConf.product_info_sf;

    await test.step(`Search and Click product name [Product delete]> Click icon thùng rác tại variant >
    Click button [Delete] on popup [Delete variant ]`, async () => {
      await product.searchProdByName(productInfo.title);
      await product.chooseProduct(productInfo.title);
      await product.deleteOneVariantByIcon();
      await product.checkMsgAfterCreated({
        message: resultDelete.message,
      });
      expect(await product.getNumberProductAllVariant()).toContain(resultDelete.number_all_variant1);
    });

    await test.step(`Click check box 1 variant của Group [M] > Click Action> Chọn [Delete variant] >
    Click button [Delete] on popup [Delete variant ]`, async () => {
      await product.selectVariantOnGroup(productInfo.group);
      await product.selectActionForVariant(productInfo.action);
      expect(await product.getNumberProductAllVariant()).toContain(resultDelete.number_all_variant2);
    });

    await test.step(`Click check box của Group [M] > Click Action> Chọn [Delete variant] >
    Click button [Delete] on popup [Delete variant]`, async () => {
      await product.selectGroupVariant(productInfo.group);
      await product.selectActionForVariant(productInfo.action);
      expect(await product.getNumberProductAllVariant()).toContain(resultDelete.number_all_variant3);
      const productId = await product.getProductId(authRequest, resultDelete.title, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productId, resultDelete),
      ).toEqual(resultDelete);
    });

    await test.step(`Verify hiển thị thông tin product on SF`, async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.selectAndCheckVariant(productInfoSF.size, productInfoSF.type_size);
      await productStoreFront.selectAndCheckVariant(productInfoSF.color, productInfoSF.type_color);
      await productStoreFront.selectAndCheckVariant(productInfoSF.style, productInfoSF.type_style);
    });
  });

  test(`Change price thành công for variant từ list action @TC_SB_PRO_test_243`, async ({ conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productInfo = conf.caseConf.product_info;
    const resultChange1 = conf.caseConf.result_change1;
    const resultChange2 = conf.caseConf.result_change2;

    await test.step(`Search and click product name [Product change price]>Select checkbox Group variant`, async () => {
      await product.searchProdByName(productInfo.title);
      await product.chooseProduct(productInfo.title);
      await product.selectVariantOnGroup(productInfo.group1);
      expect(await product.getNumberVariantSelected()).toContain(productInfo.variant_selected);
    });

    await test.step(`Click button [Action] > chọn [Change price] > Edit filed [New price] >
    Click button [Save] on popup > Verify price của variant`, async () => {
      await product.selectActionForVariant(productInfo.action, productInfo.new_price1);
      const productId = await product.getProductId(authRequest, resultChange1.title, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productId, resultChange1),
      ).toEqual(resultChange1);
    });

    await test.step(`Select checkbox của Group varriant > Click button [Action] > chọn [Change price] >
    Edit filed [Price] > Click button [Save changes]`, async () => {
      await product.selectGroupVariant(productInfo.group1);
      await product.selectActionForVariant(productInfo.action, productInfo.new_price2);
      await product.clickOnBtnWithLabel("Save changes");
      const productId = await product.getProductId(authRequest, productInfo.title, conf.suiteConf.domain);
      expect(
        await product.getPriceOfGroupVariantDashboardByApi(
          authRequest,
          conf.suiteConf.domain,
          productId,
          resultChange2,
        ),
      ).toEqual(resultChange2);
    });
  });

  test(`Edit thành công variant tại màn variant detail @TC_SB_PRO_test_241`, async ({ conf, authRequest, context }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productVariantInfo = conf.caseConf.product_variant_info;
    const resultEdit = conf.caseConf.result_edit;
    const productInfoSF = conf.caseConf.product_info_sf;

    await test.step(`Search and Click product name > Click icon [Edit] tại dòng của variant >
    Edit các filed > Click button [Save changes`, async () => {
      await product.searchProdByName(productVariantInfo.title);
      await product.chooseProduct(productVariantInfo.title);
      await product.clickButtonEditVariant();
      await product.addOrEditVariantWithData(productVariantInfo);
      await product.checkMsgAfterCreated({
        message: resultEdit.message,
      });
      const productId = await product.getProductId(authRequest, resultEdit.title, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productId, resultEdit),
      ).toEqual(resultEdit);
    });

    await test.step(`Back lại màn product detail > Click button [View] > Verify info product on SF`, async () => {
      await product.clickBackProductDetail();
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.selectAndCheckVariant(productInfoSF.size, productInfoSF.type_size);
      await productStoreFront.selectAndCheckVariant(productInfoSF.color, productInfoSF.type_color);
    });
  });

  test(`Verify Duplicate failed for variant @TC_SB_PRO_test_244`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productVariantInfo = conf.caseConf.product_variant_info;
    const resultDuplicate = conf.caseConf.result_duplicate;

    await test.step(`Search and Click product name > Select checkbox 1 variant`, async () => {
      await product.searchProdByName(productVariantInfo.title);
      await product.chooseProduct(productVariantInfo.title);
      await product.selectVariantOnGroup(productVariantInfo.group);
      expect(await product.getNumberVariantSelected()).toContain(productVariantInfo.variant_selected);
    });

    await test.step(`Click button [Action] > chọn [... in another Size] > Edit filed [Size for duplicated variants] >
    Click button [Save] on popup`, async () => {
      await product.selectActionForVariant(productVariantInfo.action, productVariantInfo.size);
      await product.checkMsgAfterCreated({
        message: resultDuplicate.message,
      });
      expect(await product.getNumberProductAllVariant()).toContain(resultDuplicate.number_all_variant);
    });

    await test.step(`Select checkbox all variant > Click button [Action]`, async () => {
      await product.selectAllVariant();
      await product.clickButtonActionVariant();
      await product.verifyActionDisabled(productVariantInfo.action);
      await product.locator(`//span[normalize-space()='${productVariantInfo.action}']`).isDisabled();
    });
  });

  test(`Verify Duplicate variant thành công for product có 2 option name @TC_SB_PRO_test_245`, async ({
    conf,
    authRequest,
    context,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productVariantInfo = conf.caseConf.product_variant_info;
    const resultDuplicate1 = conf.caseConf.result_duplicate1;
    const resultDuplicate2 = conf.caseConf.result_duplicate2;
    const productInfoSF = conf.caseConf.product_info_sf;

    await test.step(`Search and Click product name > Select checkbox 1 variant`, async () => {
      await product.searchProdByName(productVariantInfo.title);
      await product.chooseProduct(productVariantInfo.title);
      await product.selectVariantOnGroup(productVariantInfo.group);
      expect(await product.getNumberVariantSelected()).toContain(productVariantInfo.variant_selected);
    });

    await test.step(`Click button [Action] > chọn [... in another Size] > Edit filed [Size for duplicated variants] >
    Click button [Save] on popup > Verify variant`, async () => {
      await product.selectActionForVariant(productVariantInfo.action, productVariantInfo.new_size1);
      await product.checkMsgAfterCreated({
        message: resultDuplicate1.message,
      });
      expect(await product.getNumberProductAllVariant()).toContain(resultDuplicate1.number_all_variant);
      const productId = await product.getProductId(authRequest, resultDuplicate1.title, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productId, resultDuplicate1),
      ).toEqual(resultDuplicate1);
    });

    await test.step(`Select checkbox của Group S > Click button [Action] > chọn [... in another Size] >
    Edit filed [Size for duplicated variants] > Click button [Save] on popup`, async () => {
      await product.selectGroupVariant(productVariantInfo.group);
      await product.selectActionForVariant(productVariantInfo.action, productVariantInfo.new_size2);
      await product.checkMsgAfterCreated({
        message: resultDuplicate2.message,
      });
      expect(await product.getNumberProductAllVariant()).toContain(resultDuplicate2.number_all_variant);
      const productId = await product.getProductId(authRequest, productVariantInfo.title, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productId, resultDuplicate2),
      ).toEqual(resultDuplicate2);
    });

    await test.step(`Click button View > verify info product on SF`, async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.selectAndCheckVariant(productInfoSF.size, productInfoSF.type_size);
      await productStoreFront.selectAndCheckVariant(productInfoSF.color, productInfoSF.type_color);
    });
  });

  test(`Verify edit option variant thành công @TC_SB_PRO_test_248`, async ({ conf, authRequest, context }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const productVariantInfo = conf.caseConf.product_variant_info;
    const resultEdit1 = conf.caseConf.result_edit1;
    const resultEdit2 = conf.caseConf.result_edit2;
    const productInfoSF = conf.caseConf.product_info_sf;

    await test.step(`Search and Click product name > Click button [Edit options] > Edit option name [Size] >
    Xóa option value M >Click button [Save]`, async () => {
      await product.searchProdByName(productVariantInfo.title);
      await product.chooseProduct(productVariantInfo.title);
      await product.editOptionNameVariant(productVariantInfo.variant);
      expect(await product.getNumberProductAllVariant()).toContain(resultEdit1.number_all_variant);
    });

    await test.step(`Click button [Edit options] > Click button [Add another option] > để trống option value >
    Click button [Save]`, async () => {
      await product.clickEditOption();
      await product.clickBtnAddOption();
      await product.clickBtnSaveOnPopup();
    });

    await test.step(`Input option name [Size] > Input option value > Click button [Save] on popup >
    Click button [Save change]`, async () => {
      await product.inputValueOption(productVariantInfo.add_option_name, productVariantInfo.add_option_value);
      expect(await product.getNumberProductAllVariant()).toContain(resultEdit2.number_all_variant);
      const productId = await product.getProductId(authRequest, productVariantInfo.title, conf.suiteConf.domain);
      expect(
        await product.getProductInfoDashboardByApi(authRequest, conf.suiteConf.domain, productId, resultEdit2),
      ).toEqual(resultEdit2);
    });

    await test.step(`Click buton [View] > verify thông tin product on SF`, async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await product.clickViewProductOnSF()]);
      await SFPage.waitForLoadState("networkidle");
      const productStoreFront = new SFProduct(SFPage, conf.suiteConf.domain);
      await productStoreFront.selectAndCheckVariant(productInfoSF.size, productInfoSF.type_size);
      await productStoreFront.selectAndCheckVariant(productInfoSF.color, productInfoSF.type_color);
      await productStoreFront.selectAndCheckVariant(productInfoSF.style, productInfoSF.type_style);
    });
  });
});
