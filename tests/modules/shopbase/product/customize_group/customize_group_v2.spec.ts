import { test } from "@core/fixtures";
import { snapshotDir, waitForImageLoaded } from "@core/utils/theme";
import {
  prepareProduct,
  addLayer,
  addGroupLayer,
  addCustomOption,
  previewWithOptionValue,
  addConditionalLogic,
  editCustomizeGroupAndCheckSF,
  verifyPrintFile,
  validateFieldCustomizeGroup,
} from "./customize_group_utils";
import { ProductPage } from "@pages/dashboard/products";
import { SFProduct } from "@sf_pages/product";
import { Personalize } from "@pages/dashboard/personalize";
import { SFHome } from "@sf_pages/homepage";
import { SFCheckout } from "@sf_pages/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { expect } from "@fixtures/website_builder";

let product: ProductPage;
let ordersPage: OrdersPage;
let productSF: SFProduct;
let homePage: SFHome;
let sfCheckout: SFCheckout;
let personalize: Personalize;
let SFPage;
test.describe("Verify customize group", () => {
  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);

    product = new ProductPage(dashboard, conf.suiteConf.domain);
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    personalize = new Personalize(dashboard, conf.suiteConf.domain);
  });

  test(`@SB_CGSB_3 Verify [Customize group] type Droplist`, async ({ conf, dashboard, snapshotFixture }) => {
    await test.step(`Pre conditions: "Products" > Click "Add product"> Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"
      - Click "Upload your Preview image" add ảnh preview
      - Tạo group layer:
      [Group1] gồm "Text layer 1",
      [Group2] gồm "Text layer 2" ,
      [Group3] gồm "Image 1"
      - Phần custom option bên tay phải:
      Add custom option 1: type "Text field", target layer "Text layer 1"
      Add custom option 2: type "Text field", target layer "Text layer 2"
      Click "[Customize group]" `, async () => {
      await prepareProduct(product, "SB_CGSB_3", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await addCustomOption(product, conf);
      await product.clickOnBtnWithLabel("Customize group", 1);
    });

    await test.step(`Tại trường option, select value = "Droplist" > Verify trường Label `, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_verify_label, snapshotFixture);
    });

    await test.step(`Check value Group và cột "Show the group"`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_show_group, snapshotFixture);
    });

    await test.step(`Sửa value Group > Click enter`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_edit_value_group, snapshotFixture);
    });

    await test.step(`Verify drag Group`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_drag_group, snapshotFixture);
    });
  });

  test(`@SB_CGSB_4 Verify [Customize group] type Radio`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Pre conditions: "Products" > Click "Add product"> Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"
      - Click "Upload your Preview image" add ảnh preview
      - Tạo group layer:
      [Group1] gồm "Text layer 1",
      [Group2] gồm "Text layer 2" ,
      [Group3] gồm "Image 1"
      - Phần custom option bên tay phải:
      Add custom option 1: type "Text field", target layer "Text layer 1"
      Add custom option 2: type "Text field", target layer "Text layer 2"
      Click "[Customize group]" `, async () => {
      await prepareProduct(product, "SB_CGSB_4", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await addCustomOption(product, conf);
      await product.clickOnBtnWithLabel("Customize group", 1);
    });

    await test.step(`Tại trường option, select value = "Radio" > Verify trường Label `, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_verify_label, snapshotFixture);
    });

    await test.step(`Check value Group và cột "Show the group"`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_show_group, snapshotFixture);
    });

    await test.step(`Sửa value Group > Click enter`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_edit_value_group, snapshotFixture);
    });

    await test.step(`Verify drag Group`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_drag_group, snapshotFixture);
    });
  });

  test(`@SB_CGSB_5 Verify [Customize group] type Picture choice`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Pre conditions: "Products" > Click "Add product"> Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"
      - Click "Upload your Preview image" add ảnh preview
      - Tạo group layer:
      [Group1] gồm "Text layer 1",
      [Group2] gồm "Text layer 2" ,
      [Group3] gồm "Image 1"
      - Phần custom option bên tay phải:
      Add custom option 1: type "Text field", target layer "Text layer 1"
      Add custom option 2: type "Text field", target layer "Text layer 2"
      Click "[Customize group]" `, async () => {
      await prepareProduct(product, "SB_CGSB_5", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await addCustomOption(product, conf);
      await product.clickOnBtnWithLabel("Customize group", 1);
    });

    await test.step(`Tại trường option, select value = "Picture choice" > Verify trường Label `, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_verify_label, snapshotFixture);
    });
    await test.step(`Check value Group và cột "Show the group"`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_show_group, snapshotFixture);
    });
    await test.step(`Check validate upload image`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_edit_value_group, snapshotFixture);
    });
    await test.step(`Verify drag Group`, async () => {
      await validateFieldCustomizeGroup(personalize, conf.caseConf.customize_group_drag_group, snapshotFixture);
    });
  });

  test(`@SB_CGSB_6 Check [Customize group] ngoài list CO`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Pre conditions: "Products" > Click "Add product"> Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"
      - Click "Upload your Preview image" add ảnh preview
      - Tạo group layer:
      [Group1] gồm "Text layer 1",
      [Group2] gồm "Text layer 2" ,
      [Group3] gồm "Image 1"
      - Phần custom option bên tay phải:
      Add custom option 1: type "Text field", target layer "Text layer 1"
      Add custom option 2: type "Text field", target layer "Text layer 2"
      Click "[Customize group]" `, async () => {
      await prepareProduct(product, "SB_CGSB_6", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await addCustomOption(product, conf);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
    });

    await test.step(`Move [Customize group] xuống cuối list CO`, async () => {
      await product.dragAndDrop({
        from: {
          selector: product.xpathDragAndDropItemCustomOption("CO2"),
        },
        to: {
          selector: product.xpathDragAndDropItemCustomOption("CO1"),
        },
      });
      await product.clickOnBtnWithLabel("Save");
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: conf.caseConf.picture.dashboard_customize_group_move,
        selector: personalize.xpathListLabelInCO,
      });
    });

    await test.step(`Click Delete [Customize group]`, async () => {
      // expect Enable button [Customize group]
      await product.deleteCustomOptionInList("CG");
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: conf.caseConf.picture.dashboard_customize_group_enable,
        selector: personalize.xpathCustomOption,
      });
    });
  });

  test(`@SB_CGSB_7 Tạo product có [Preview image] có [Customize group] và nhiều custom option`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const listCustomOption = conf.caseConf.list_custom_options;
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"
      - Click "Upload your Preview image" add ảnh preview
      - Tạo group layer:
      [Group1] gồm "Text layer 1",  "Text layer 2"
      [Group2] gồm "Image 1", "Image 2"`, async () => {
      await prepareProduct(product, "SB_CGSB_7", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
    });
    await test.step(`1. Tạo Custom option - CO1: type Droplist với value 1 và 2   - CO2: type Text Field + Target [Text layer 2]   - CO3: type Text area + Target [Text layer 1]  - CO4: type Radio button với value gồm a,b,c   - CO5: type Picture choice gồm upload với 3 image : Image 2, Image 3, Image 4 + show Thumbnail + Target [Image 2]  - CO6: type Image + Target [Image 1]"- CO7: type checkbox + Target [Text layer 2]2. Tạo [Customize group] 3. Click Save Preview image`, async () => {
      await addCustomOption(product, conf);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: conf.caseConf.picture.dashboard_customize_group,
        selector: personalize.xpathListLabelInCO,
      });
    });
    await test.step(`Click back ra màn product detail > Click "View" product ngoài storefront`, async () => {
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.waitForCLipartImagesLoaded();
      await productSF.page.waitForTimeout(6000);
      const listCO = listCustomOption.split(",").map(item => item.trim());
      for (let i = 0; i < listCO.length; i++) {
        await expect(productSF.page.locator(productSF.getXpathCustomOptionName(listCO[i]))).toBeVisible();
      }
    });
    await test.step(`1. Select [Customize group] chọn option [Group 1]2. Input CO tương ứng > Click button "Preview"`, async () => {
      await previewWithOptionValue(productSF, conf, conf.caseConf.custom_option_group_1_preview, snapshotFixture);
    });
    await test.step(`1. Select [Customize group] chọn option [Group 2] 2. Input CO tương ứng > Click button "Preview"`, async () => {
      await productSF.page.reload();
      await previewWithOptionValue(productSF, conf, conf.caseConf.custom_option_group_2_preview, snapshotFixture);
    });
  });

  test(`@SB_CGSB_10 Tạo product có [Preview image] có [Customize group] và [Conditional logic CO droplist]`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"
      - Click "Upload your Preview image" add ảnh preview
      - Tạo group layer:
      [Group1] gồm "Text layer 1",  "Text layer 2"
      [Group2] gồm "Image 1", "Image 2"`, async () => {
      await prepareProduct(product, "SB_CGSB_10", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
    });

    await test.step(`1. Tạo Custom option  - CO1: droplist gồm value "a" và "b" + target [Text layer 3] - CO2: type Text Field + Target [Text layer 1] ,  [Text layer 2]- CO3: type PC folder 1 gồm "Image 1" và "Image 2" + Target [Image 1],[Image 2],Tạo conditional logic: CO1: Chọn "is equal to" value "a" then show CO2Chọn "is not equal to" value "b" then show CO3
    2. Tạo [Customize group] 3. Click Save Preview image4. Click back ra màn product detail > Click "View" product ngoài storefront`, async () => {
      await addCustomOption(product, conf);
      await addConditionalLogic(product, personalize, conf, dashboard, conf.caseConf.condition_info);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: conf.caseConf.picture.dashboard_customize_group,
        selector: personalize.xpathListLabelInCO,
      });
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
    });

    await test.step(`1. Select [Customize group] chọn option [Group 1]2. Input CO tương ứng > Click button "Preview"`, async () => {
      await previewWithOptionValue(productSF, conf, conf.caseConf.custom_option_group_1_preview, snapshotFixture);
    });

    await test.step(`1. Select [Customize group] chọn option [Group 2]2. Input CO tương ứng > Click button "Preview"`, async () => {
      await productSF.page.reload();
      await previewWithOptionValue(productSF, conf, conf.caseConf.custom_option_group_2_preview, snapshotFixture);
    });
  });

  test(`@SB_CGSB_12 Edit product có Preview image có [Customize group]`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"`, async () => {
      await prepareProduct(product, "SB_CGSB_12", conf);
    });

    await test.step(`1. Tạo group layer:[Group1] gồm "Text layer 1",  "Text layer 2" [Group2] gồm "Image 1", "Image 2"2. Tạo [Customize group] type Picture choice3. Click Save Preview image4. Click back ra màn product detail > Click "View" product ngoài storefront`, async () => {
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);

      await productSF.page.waitForSelector(productSF.xpathButtonPreview);
      await productSF.waitForCLipartImagesLoaded();
      await snapshotFixture.verify({
        page: productSF.page,
        snapshotName: conf.caseConf.picture.storefront_customize_group,
        selector: productSF.xpathListCustomOption,
      });
    });
    await test.step(`Vào lại dashboard màn product detail > Click  Edit Preview imageEdit type customize thành Droplist`, async () => {
      await dashboard.locator(personalize.xpathIconActionPreviewImageWithLabel("Preview Images", 2)).click();
      await dashboard.click(product.xpathIconExpand);
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_droplist,
        false,
        "image",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
    await test.step(`Vào lại dashboard màn product detail > Click  Edit Preview imageEdit type customize thành Radio`, async () => {
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_radio,
        false,
        "image",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
    await test.step(`Vào lại dashboard màn product detail > Click  Edit Preview imageEdit label của customize group`, async () => {
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_label,
        false,
        "image",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
    await test.step(`Vào lại dashboard màn product detail > Click  Edit Preview imageEdit value của group trong customize group detail`, async () => {
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_edit_value,
        false,
        "image",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
    await test.step(`Vào lại dashboard màn product detail > Click  Edit Preview image >  Edit vị trí group trong [Customize group]`, async () => {
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_drag_drop,
        true,
        "image",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
  });

  test(`@SB_CGSB_13 Tạo product có [Print file] có [Customize group] và nhiều custom option`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let orderName = "";
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"`, async () => {
      await prepareProduct(product, "SB_CGSB_13", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
    });

    await test.step(`1. Tạo Custom option - CO1: type Droplist với value 1 và 2   - CO2: type Text Field + Target [Text layer 2]   - CO3: type Text area + Target [Text layer 1]  - CO4: type Radio button với value gồm a,b,c   - CO5: type Picture choice gồm upload với 3 image : Image 2, Image 3, Image 4 + show Thumbnail + Target [Image 2]  - CO6: type Image + Target [Image 1]"- CO7: type checkbox
      2. Click Save Preview image`, async () => {
      await addCustomOption(product, conf);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: conf.caseConf.picture.dashboard_customize_group,
        selector: personalize.xpathListLabelInCO,
      });
    });

    await test.step(`3. Click back ra màn product detail > Click "View" product ngoài storefront`, async () => {
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await snapshotFixture.verify({
        page: productSF.page,
        snapshotName: conf.caseConf.picture.storefront_customize_group,
        selector: productSF.xpathListCustomOption,
      });
    });
    await test.step(`1. Select [Customize group] chọn option [Group 1]2. Input CO tương ứng > Click "Add to cart"`, async () => {
      sfCheckout = new SFCheckout(SFPage, conf.suiteConf.domain);
      homePage = new SFHome(SFPage, conf.suiteConf.domain);
      for (const option of conf.caseConf.custom_option_group1_fill) {
        await productSF.inputCustomOptionSF(option);
      }
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
      await productSF.clickOnBtnWithLabel("Add to cart");
    });
    await test.step(`1. Select [Customize group] chọn option [Group 2] 2. Input CO tương ứng > Click button "Preview"`, async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(`${conf.suiteConf.product_info.title} SB_CGSB_13`);
      for (const option of conf.caseConf.custom_option_group2_fill) {
        await productSF.inputCustomOptionSF(option);
      }
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
      await productSF.clickOnBtnWithLabel("Add to cart");
      sfCheckout = await productSF.navigateToCheckoutPage();
      await sfCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sfCheckout.continueToPaymentMethod();
      await sfCheckout.completeOrderWithCardInfo(conf.suiteConf.card_info);
      orderName = await sfCheckout.getOrderName();
    });
    await test.step(`Check out với 2 item trên tạo orderVào lại dashboard >  Tại Menu: "Order" > Click vào order vừa tạo
      Click 3 chấm lineitem số 1 > Click "Preview"http://joxi.ru/a2XgdZ9uQqyX3m`, async () => {
      await product.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 25);
      // line item first
      await verifyPrintFile(1, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
    await test.step(`Click 3 chấm lineitem số 2 > Click "Preview"`, async () => {
      // line item second
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 2, 25);
      await verifyPrintFile(2, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
  });

  test(`@SB_CGSB_14 Tạo product có [Print file] có [Customize group] group có layer trạng thái ẩn`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let orderName = "";
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"`, async () => {
      await prepareProduct(product, "SB_CGSB_14", conf);
    });

    await test.step(`1. Tạo group layer:[Group1] gồm "Text layer 1",  "Text layer 2" [Group2] gồm "Image 1", "Image 2"Click ẩn [Group 1] 2. Tạo [Customize group] 3. Click Save print file4. Click back ra màn product detail > Click "View" product ngoài storefront 5. Chọn lần lượt các option [Customize group] > > Click "Add to cart" và check out`, async () => {
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);

      sfCheckout = new SFCheckout(SFPage, conf.suiteConf.domain);
      homePage = new SFHome(SFPage, conf.suiteConf.domain);
      for (const value of conf.caseConf.add_to_cart_customize_group) {
        if (value.need_search_product) {
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(`${conf.suiteConf.product_info.title} SB_CGSB_14`);
        }
        for (const option of value.custom_option_fill) {
          await productSF.inputCustomOptionSF(option);
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
        }
        await productSF.clickOnBtnWithLabel("Add to cart");
      }
      await homePage.gotoCheckout();
      await sfCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sfCheckout.continueToPaymentMethod();
      await sfCheckout.completeOrderWithCardInfo(conf.suiteConf.card_info);
      orderName = await sfCheckout.getOrderName();
    });
    await test.step(`Vào lại dashboard >  Tại Menu: "Order" > Click vào order vừa tạo
    Click 3 chấm lineitem số 1 > Click "Preview"http://joxi.ru/a2XgdZ9uQqyX3m`, async () => {
      await product.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 25);
      // line item first
      await verifyPrintFile(1, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
    await test.step(`Click 3 chấm lineitem số 2 > Click "Preview"`, async () => {
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 2, 25);
      await verifyPrintFile(2, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
  });

  test(`@SB_CGSB_15 Tạo product có [Print file] có [Customize group] và [Conditional logic CO radio]`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let orderName = "";
    const listCustomOption = conf.caseConf.list_custom_options;
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Print file"
      - Click "Upload your Print file" add ảnh Print file
      - Tạo group layer:
      [Group1] gồm "Text layer 1",  "Text layer 2"
      [Group2] gồm "Image 1", "Image 2"`, async () => {
      await prepareProduct(product, "SB_CGSB_15", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
    });

    await test.step(`1. Tạo Custom option  - CO1: Radio gồm value a và b- CO2: type Text Field + Target [Text layer 1] ,  [Text layer 2]- CO3: type PC folder 1 gồm "Image 1" và "Image 2" + Target [Image 1],[Image 2],Tạo conditional logic: CO1: Chọn "is equal to" value "a" then show CO2Chọn "is not equal to" value "b" then show CO3
      2. Tạo [Customize group] 3. Click Save Print file4. Click back ra màn product detail > Click "View" product ngoài storefront`, async () => {
      await addCustomOption(product, conf);
      await addConditionalLogic(product, personalize, conf, dashboard, conf.caseConf.condition_info);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.waitForImagesMockupLoaded();
      await productSF.page.waitForTimeout(6000);
      const listCO = listCustomOption.split(",").map(item => item.trim());
      for (let i = 0; i < listCO.length; i++) {
        await expect(productSF.page.locator(productSF.getXpathCustomOptionName(listCO[i]))).toBeVisible();
      }
    });
    await test.step(`1. Select [Customize group] chọn option [Group 1]2. Input CO tương ứng > Click "Add to cart"`, async () => {
      sfCheckout = new SFCheckout(SFPage, conf.suiteConf.domain);
      homePage = new SFHome(SFPage, conf.suiteConf.domain);
      for (const option of conf.caseConf.custom_option_group1_fill) {
        await productSF.inputCustomOptionSF(option);
      }
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
      await productSF.clickOnBtnWithLabel("Add to cart");
    });
    await test.step(`1. Select [Customize group] chọn option [Group 2]2. Input CO tương ứng > Click "Add to cart"`, async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(`${conf.suiteConf.product_info.title} SB_CGSB_15`);
      for (const option of conf.caseConf.custom_option_group2_fill) {
        await productSF.inputCustomOptionSF(option);
      }
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
      await productSF.clickOnBtnWithLabel("Add to cart");
      await homePage.gotoCheckout();
      await sfCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sfCheckout.continueToPaymentMethod();
      await sfCheckout.completeOrderWithCardInfo(conf.suiteConf.card_info);
      orderName = await sfCheckout.getOrderName();
    });
    await test.step(`Check out với 2 item trên tạo orderVào lại dashboard >  Tại Menu: "Order" > Click vào order vừa tạo
      Click 3 chấm lineitem số 1 > Click "Preview"http://joxi.ru/a2XgdZ9uQqyX3m`, async () => {
      await product.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 25);
      // line item first
      await verifyPrintFile(1, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
    await test.step(`Click 3 chấm lineitem số 2 > Click "Preview"`, async () => {
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 2, 25);
      // line item second
      await verifyPrintFile(2, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
  });

  test(`@SB_CGSB_16 Tạo product có [Print file] có [Customize group] và [Conditional logic CO droplist]`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let orderName = "";
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Print file"
      - Click "Upload your Print file" add ảnh Print file
      - Tạo group layer:
      [Group1] gồm "Text layer 1",  "Text layer 2", "Text layer 3"
      [Group2] gồm "Image 1", "Image 2"`, async () => {
      await prepareProduct(product, "SB_CGSB_16", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
    });

    await test.step(`1. Tạo Custom option  - CO1: droplist gồm value "test 1" và "test 2" + target [Text layer 3] - CO2: type Text Field + Target [Text layer 1] ,  [Text layer 2]- CO3: type PC folder 1 gồm "Image 1" và "Image 2" + Target [Image 1],[Image 2],Tạo conditional logic: CO1: Chọn "is equal to" value "a" then show CO2Chọn "is not equal to" value "b" then show CO3
    2. Tạo [Customize group] 3. Click Save Print file4. Click back ra màn product detail > Click "View" product ngoài storefront`, async () => {
      await addCustomOption(product, conf);
      await addConditionalLogic(product, personalize, conf, dashboard, conf.caseConf.condition_info);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await snapshotFixture.verify({
        page: productSF.page,
        snapshotName: conf.caseConf.picture.storefront_customize_group,
        selector: productSF.xpathListCustomOption,
      });
    });
    await test.step(`1. Select [Customize group] chọn option [Group 1]2. Input CO tương ứng > Click "Add to cart"`, async () => {
      sfCheckout = new SFCheckout(SFPage, conf.suiteConf.domain);
      homePage = new SFHome(SFPage, conf.suiteConf.domain);
      for (const option of conf.caseConf.custom_option_group1_fill) {
        await productSF.inputCustomOptionSF(option);
      }
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
      await productSF.clickOnBtnWithLabel("Add to cart");
    });
    await test.step(`1. Select [Customize group] chọn option [Group 1]2. Input CO tương ứng > Click "Add to cart"`, async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(`${conf.suiteConf.product_info.title} SB_CGSB_16`);
      for (const option of conf.caseConf.custom_option_group11_fill) {
        await productSF.inputCustomOptionSF(option);
      }
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
      await productSF.clickOnBtnWithLabel("Add to cart");
    });
    await test.step(`1. Select [Customize group] chọn option [Group 2]2. Input CO tương ứng > Click "Add to cart"`, async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(`${conf.suiteConf.product_info.title} SB_CGSB_16`);
      for (const option of conf.caseConf.custom_option_group2_fill) {
        await productSF.inputCustomOptionSF(option);
      }
      await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
      await productSF.clickOnBtnWithLabel("Add to cart");
      sfCheckout = await productSF.navigateToCheckoutPage();
      await sfCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sfCheckout.continueToPaymentMethod();
      await sfCheckout.completeOrderWithCardInfo(conf.suiteConf.card_info);
      orderName = await sfCheckout.getOrderName();
    });
    await test.step(`Check out với 2 item trên tạo orderVào lại dashboard >  Tại Menu: "Order" > Click vào order vừa tạo
      Click 3 chấm lineitem số 1 > Click "Preview"http://joxi.ru/a2XgdZ9uQqyX3m`, async () => {
      await product.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 25);
      // line item first
      await verifyPrintFile(1, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
    await test.step(`Click 3 chấm lineitem số 2 > Click "Preview"`, async () => {
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 2, 25);
      // line item first
      await verifyPrintFile(2, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
    await test.step(`Click 3 chấm lineitem số 3 > Click "Preview"`, async () => {
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 3, 25);
      // line item first
      await verifyPrintFile(3, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
  });

  test(`@SB_CGSB_17 Check add print file có [Customize group] trong màn order detail`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    let orderName = "";
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save`, async () => {
      await prepareProduct(product, "SB_CGSB_17", conf);
    });

    await test.step(`1. Tạo group layer:[Group1] gồm "Text layer 1",  "Text layer 2" [Group2] gồm "Image 1", "Image 2"Click ẩn [Group 1] 2. Tạo [Customize group] 3. Click Save Preview image4. Click back ra màn product detail > Click "View" product ngoài storefront 5. Chọn lần lượt các option [Customize group] > Click "Add to cart" và checkout`, async () => {
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);

      sfCheckout = new SFCheckout(SFPage, conf.suiteConf.domain);
      homePage = new SFHome(SFPage, conf.suiteConf.domain);
      for (const value of conf.caseConf.add_to_cart_customize_group) {
        if (value.need_search_product) {
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(`${conf.suiteConf.product_info.title} SB_CGSB_17`);
        }
        for (const option of value.custom_option_fill) {
          await productSF.inputCustomOptionSF(option);
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathCustomOptionLoad);
        }
        await productSF.clickOnBtnWithLabel("Add to cart");
      }
      sfCheckout = await productSF.navigateToCheckoutPage();
      await sfCheckout.enterShippingAddress(conf.suiteConf.shipping_address);
      await sfCheckout.continueToPaymentMethod();
      await sfCheckout.completeOrderWithCardInfo(conf.suiteConf.card_info);
      orderName = await sfCheckout.getOrderName();
    });
    await test.step(`- Vào lại dashboard >  Tại Menu: "Order" > Click vào order vừa tạo- Click "Add Print file" tại line item 1- Click "Upload your Print file" add ảnh print file- Click save print file- Load lại trang `, async () => {
      await product.navigateToMenu("Orders");
      await ordersPage.searchOrder(orderName);
      await ordersPage.goToOrderDetailSBase(orderName);
      await dashboard.click(personalize.xpathLinkTextPrintFile("Add print file"));
      await product.uploadImagePreviewOrPrintfile(conf.caseConf.image_print_file);
      await product.clickOnBtnWithLabel("Save");
      await product.clickOnBtnWithLabel("Create");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await product.clickOnBtnWithLabel("Cancel");
      await dashboard.reload();
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
    });
    await test.step(`Click 3 chấm lineitem số 1 > Click "Preview"http://joxi.ru/a2XgdZ9uQqyX3m`, async () => {
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 1, 25);
      await verifyPrintFile(1, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
    await test.step(`Click 3 chấm lineitem số 2 > Click "Preview"http://joxi.ru/a2XgdZ9uQqyX3m`, async () => {
      await ordersPage.waitForStatusGeneratePrintFile("Print file has been generated", orderName, 2, 25);
      await verifyPrintFile(2, ordersPage, personalize, conf, dashboard, context, snapshotFixture);
    });
  });

  test(`@SB_CGSB_19 Edit product có Print file có [Customize group]`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save`, async () => {
      await prepareProduct(product, "SB_CGSB_19", conf);
    });
    await test.step(`1. Tạo group layer:[Group1] gồm "Text layer 1",  "Text layer 2" [Group2] gồm "Image 1", "Image 2"2. Tạo [Customize group] type Picture choice3. Click Save Print file4. Click back ra màn product detail > Click "View" product ngoài storefront`, async () => {
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
      productSF = new SFProduct(SFPage, conf.suiteConf.domain);
      await productSF.waitForCLipartImagesLoaded();
      await snapshotFixture.verify({
        page: productSF.page,
        snapshotName: conf.caseConf.picture.storefront_customize_group,
        selector: productSF.xpathListCustomOption,
      });
    });
    await test.step(`Vào lại dashboard màn product detail > Click  Edit Print fileEdit type customize thành Droplist`, async () => {
      await dashboard.locator(personalize.xpathIconActionPreviewImageWithLabel("Print Files", 2)).click();
      await dashboard.click(product.xpathIconExpand);
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_droplist,
        false,
        "print_file",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
    await test.step(`Làm tương tự step trên Edit type customize thành Radio`, async () => {
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_radio,
        false,
        "print_file",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
    await test.step(`Làm tương tự step trên Edit Label [Customize group] `, async () => {
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_label,
        false,
        "print_file",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
    await test.step(`Làm tương tự step trên  Edit Value [Customize group] `, async () => {
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_edit_value,
        false,
        "print_file",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
    await test.step(`Làm tương tự step trên  Edit vị trí group trong [Customize group]`, async () => {
      await editCustomizeGroupAndCheckSF(
        product,
        personalize,
        productSF,
        conf.caseConf.customize_group_drag_drop,
        true,
        "print_file",
        conf,
        dashboard,
        snapshotFixture,
      );
    });
  });

  test(`@SB_CGSB_20 Duplicate product có Preview image và Print file có [Customize group]`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save`, async () => {
      await prepareProduct(product, "SB_CGSB_20", conf);
    });

    await test.step(`1. Tạo group layer:[Group1] gồm "Text layer 1",  "Text layer 2" [Group2] gồm "Image 1", "Image 2"Click ẩn [Group 1] 2. Tạo [Customize group] 3. Click "Next, Create Print file" 4. Click Save 5. Click back ra màn product detail `, async () => {
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
      await product.setupCustomizeGroup(conf.caseConf.customize_group);
      await product.clickOnBtnWithLabel("Next, create Print file");
      await product.uploadImagePreviewOrPrintfile(conf.caseConf.image_preview_print_file);
      await product.clickOnBtnWithLabel("Save");
      await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
      await product.clickOnBtnWithLabel("Cancel");
      await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
      await product.removeBlockTitleDescription();
      // check hiển thị đủ ảnh image preview và print file
      for (let i = 1; i <= 2; i++) {
        await waitForImageLoaded(dashboard, `(${personalize.xpathSectionCustomOption}//img)[${i}]`);
      }
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: conf.caseConf.picture.dashboard_preview_image_print_file,
        selector: personalize.xpathSectionCustomOption,
      });
    });
    await test.step(`Click Duplcate productInput title. Click chọn "Duplicate product medias"Click "Duplicate"`, async () => {
      const ProductTitleDuplicate = "Duplicate product medias";
      await product.waitForElementVisibleThenInvisible(product.xpathToastMessage);
      await product.clickOnBtnWithLabel("Duplicate");
      await product.duplicateProduct(true, ProductTitleDuplicate);
      await product.removeBlockTitleDescription();
      // check hiển thị đủ ảnh image preview và print file
      for (let i = 1; i <= 2; i++) {
        await waitForImageLoaded(dashboard, `(${personalize.xpathSectionCustomOption}//img)[${i}]`);
      }
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: conf.caseConf.picture.dashboard_duplicate_preview_image_print_file,
        selector: personalize.xpathSectionCustomOption,
      });
      // xóa đi để tránh thừa dữ liệu
      await product.navigateToMenu("Products");
      await product.searchProduct(ProductTitleDuplicate);
      await product.deleteProduct(conf.suiteConf.password);
    });
  });

  test("@SB_CGSB_8 Tạo product có [Preview image] có [Customize group] group có layer trạng thái ẩn", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const customOptionSF = conf.caseConf.custom_options_sf;
    const pictures = conf.caseConf.pictures;
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"`, async () => {
      await prepareProduct(product, "SB_CGSB_8", conf);
    });

    await test.step(
      "1.Tạo group layer:" +
        "[Group1] gồm Text layer 1, Text layer 2" +
        "[Group2] gồm Image 1 , Image 2" +
        "Click ẩn [Group 1]" +
        "2. Tạo [Customize group]" +
        "3. Click Save Preview image" +
        "4. Click back ra màn product detail > Click View product ngoài storefront" +
        "5. Chọn lần lượt các option [Customize group]",
      async () => {
        await addLayer(product, conf);
        await addGroupLayer(product, personalize, conf, dashboard);
        await product.setupCustomizeGroup(conf.caseConf.customize_group);
        await product.clickOnBtnWithLabel("Save");
        await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
        await product.clickOnBtnWithLabel("Cancel");
        await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
        [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
        productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await productSF.waitForImagesMockupLoaded();
        for (let i = 0; i < customOptionSF.length; i++) {
          await productSF.inputCustomAllOptionSF(customOptionSF[i]);
          await productSF.page.click(productSF.xpathBtnWithLabel("Preview your design"));
          await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
          await snapshotFixture.verifyWithAutoRetry({
            page: productSF.page,
            selector: productSF.xpathPopupLivePreview(),
            snapshotName: `${pictures}-${i + 1}.png`,
            sizeCheck: true,
          });
          await productSF.page.click(productSF.xpathBtbClose);
        }
      },
    );
  });

  test("@SB_CGSB_9 Tạo product có [Preview image] có [Customize group] và [Conditional logic CO radio]", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const customOptionSF = conf.caseConf.custom_options_sf;
    const pictures = conf.caseConf.pictures;
    const listCustomOption = conf.caseConf.list_custom_option;
    await test.step(`Pre conditions: "Products" > Click "Add product" > Add ảnh product > Save
      Tại màn product detail, click "Create Preview image"
      - Click "Upload your Preview image" add ảnh Preview image
      - Tạo group layer:
      [Group1] gồm "Text layer 1",  "Text layer 2"
      [Group2] gồm "Image 1", "Image 2"`, async () => {
      await prepareProduct(product, "SB_CGSB_9", conf);
      await addLayer(product, conf);
      await addGroupLayer(product, personalize, conf, dashboard);
    });

    await test.step(
      "1. Tạo Custom option" +
        "- CO1: Radio gồm value a và b" +
        "- CO2: type Text Field + Target [Text layer 1] , [Text layer 2]" +
        "- CO3: type PC folder 1 gồm Image 1 và Image 2 + Target [Image 1],[Image 2]," +
        "Tạo conditional logic:" +
        "CO1: Chọn is equal to value a then show CO2" +
        "Chọn is not equal to value b then show CO3" +
        "2. Tạo [Customize group]" +
        "3. Click Save Preview image\n" +
        "4. Click back ra màn product detail > Click View product ngoài storefront",
      async () => {
        await addCustomOption(product, conf);
        await addConditionalLogic(product, personalize, conf, dashboard, conf.caseConf.condition_info);
        await product.setupCustomizeGroup(conf.caseConf.customize_group);
        await product.clickOnBtnWithLabel("Save");
        await product.waitForElementVisibleThenInvisible(personalize.xpathToastMessage);
        await product.clickOnBtnWithLabel("Cancel");
        await product.waitForElementVisibleThenInvisible(product.xpathLoadingFulfillmentSetup);
        [SFPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductSF()]);
        productSF = new SFProduct(SFPage, conf.suiteConf.domain);
        await productSF.waitForImagesMockupLoaded();
        await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
        await productSF.page.waitForTimeout(5000);
        const customOption = listCustomOption.split(",").map(item => item.trim());
        for (let i = 0; i < customOption.length; i++) {
          await expect(productSF.page.locator(productSF.getXpathCustomOptionName(customOption[i]))).toBeVisible();
        }
      },
    );

    await test.step("Select từng Group > Input các CO tương ứng > Click vào btn Preview your design", async () => {
      for (let i = 0; i < customOptionSF.length; i++) {
        await productSF.inputCustomAllOptionSF(customOptionSF[i]);
        await productSF.page.click(productSF.xpathBtnWithLabel("Preview your design"));
        await productSF.waitForElementVisibleThenInvisible(productSF.xpathIconLoading);
        await snapshotFixture.verifyWithAutoRetry({
          page: productSF.page,
          selector: productSF.xpathPopupLivePreview(),
          snapshotName: `${pictures.preview}-${i + 1}.png`,
          sizeCheck: true,
        });
        await productSF.page.click(productSF.xpathBtbClose);
      }
    });
  });
});
