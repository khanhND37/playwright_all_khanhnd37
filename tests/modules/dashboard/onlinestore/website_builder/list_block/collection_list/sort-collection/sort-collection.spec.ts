import { test } from "@fixtures/website_builder";
import { Page, expect } from "@playwright/test";
import { CollectionAPI } from "@pages/api/dashboard/collection";
import { WebBuilderCollectionList } from "@pages/dashboard/wb_collection_list";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { CollectionPage } from "@pages/dashboard/collections";
import { dragAndDropCollection } from "../utils";
import { ProductAPI } from "@pages/api/product";
import { CheckoutAPI } from "@pages/api/checkout";
import { Collect } from "@types";

test.describe("Verify sort collection in WB", () => {
  let collectionApi: CollectionAPI,
    webBuilder: WebBuilderCollectionList,
    collectionPage: CollectionPage,
    themeId: number,
    authConfig,
    accessToken: string,
    listSortedCollectionDB: string[],
    themes: ThemeEcom,
    sfPage: Page,
    listCollection: string[],
    listCollectionVisibleWB: string[],
    listCollectionVisibleSF: string[];
  const collectionIds: number[] = [];

  test.beforeEach(async ({ theme, token, dashboard, conf, authRequest, cConf }) => {
    test.slow();
    collectionApi = new CollectionAPI(conf.suiteConf.domain, authRequest);
    collectionPage = new CollectionPage(dashboard, conf.suiteConf.domain);
    (webBuilder = new WebBuilderCollectionList(dashboard, conf.suiteConf.domain)),
    (themes = new ThemeEcom(dashboard, conf.suiteConf.domain));
    authConfig = {
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    };

    await test.step("Publish theme data and delete all unpublished themes", async () => {
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
      const { access_token: shopToken } = await token.getWithCredentials(authConfig);
      accessToken = shopToken;
      await themes.deleteAllThemesUnPublish(accessToken);
    });

    await test.step("Duplicate and publish theme", async () => {
      const duplicatedTheme = await theme.duplicate(conf.suiteConf.theme_id);
      themeId = duplicatedTheme.id;
      await theme.publish(themeId);
    });

    await test.step("Delete all collections and create new collection", async () => {
      await collectionApi.deleteAllSmartCollection();
      for (const collectionInfo of cConf.pre_data.collections) {
        if (conf.caseName === "SB_WEB_BUILDER_LB_NCL_25") {
          const newCollectionInfo = await collectionApi.create(collectionInfo);
          collectionIds.push(newCollectionInfo.custom_collection.id);
        } else {
          await collectionApi.createSmartCollection(collectionInfo);
        }
        await collectionPage.page.waitForTimeout(1000); //wait để created at khác nhau
      }
    });

    await test.step("Choose sort type", async () => {
      await collectionPage.gotoCollectionList();
      listSortedCollectionDB = await collectionPage.getListCollectionInDB();
    });

    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "collections" });
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_22 [WB] Kiểm tra update UI/UX tab content của block collection list tại page All collections`, async ({
    snapshotFixture,
    cConf,
  }) => {
    const expected = cConf.expected;

    await test.step(`Mở tab content block Collection list`, async () => {
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Show"))).toHaveText(
        expected.show_default,
      );
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting"))).toHaveText(
        expected.sort_default,
      );
      await snapshotFixture.verify({
        page: webBuilder.page,
        selector: webBuilder.xpathCL.sidebar.settingList,
        snapshotName: `${process.env.ENV}-UI-default-setting-collection-to-show.png`,
      });
    });

    await test.step(`Click dropdown Show`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Show")).click();
      const numberOfOptions = await webBuilder
        .genLoc(webBuilder.xpathCL.sidebar.optionList)
        .last()
        .locator(`//li`)
        .count();
      expect(numberOfOptions).toEqual(expected.show_options.length);

      for (let i = 0; i < expected.show_options.length; i++) {
        await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.option(expected.show_options[i]))).toBeVisible();
      }
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.optionActive).last()).toHaveText(expected.show_default);
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Show")).click();
    });

    await test.step(`Click dropdown Sort`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting")).click();
      const numberOfOptions = await webBuilder
        .genLoc(webBuilder.xpathCL.sidebar.optionList)
        .last()
        .locator(`//li`)
        .count();
      expect(numberOfOptions).toEqual(expected.sort_options.length);

      for (let i = 0; i < expected.show_options.length; i++) {
        await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.option(expected.sort_options[i]))).toBeVisible();
      }
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.optionActive).last()).toHaveText(expected.sort_default);
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting")).click();
    });

    await test.step(`Chọn Show: Selected collections`, async () => {
      await webBuilder.selectDropDown(`option_show`, expected.show_options[1]);
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting"))).toBeHidden();
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.selectCollectionBtn)).toBeVisible();
      await snapshotFixture.verify({
        page: webBuilder.page,
        selector: webBuilder.xpathCL.sidebar.settingList,
        snapshotName: `${process.env.ENV}-UI-selected-collections.png`,
      });
    });

    await test.step(`Click Select collection`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.selectCollectionBtn).click();
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.searchCollection).click();
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.popupSelectCollection)).toBeVisible();
      const listCollection = await webBuilder.getListCollectionOnPopup();
      expect(listCollection).toEqual(listSortedCollectionDB);
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_24 [WB] Kiểm tra sort thủ công collection khi chọn Show Selected collection`, async ({
    conf,
    cConf,
    context,
  }) => {
    await test.step(`Chọn Show Selected collections, Click Select collection, search keyword có tồn tại`, async () => {
      await webBuilder.selectDropDown("option_show", cConf.setting.show);
      await webBuilder.searchCollectionOnPopup(cConf.existed_key);
      const listCollection = await webBuilder.getListCollectionOnPopup();
      for (const collection of listCollection) {
        expect(collection).toContain(cConf.existed_key);
      }
    });

    await test.step(`Click Select collection, search keyword không tồn tại`, async () => {
      await webBuilder.searchCollectionOnPopup(cConf.not_existed_key);
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.noSearchResult)).toBeVisible();
    });

    await test.step(`Chọn các collection A,B,C`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.closeSearchBtn).last().click();
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.selectCollectionBtn).click();

      for (const collection of cConf.selected_collection) {
        await webBuilder.selectCollectionOnPopup(collection);
      }
      await webBuilder.clickSaveButton();

      //Verify on sidebar
      listCollection = await webBuilder.getListCollectionOnSidebar();
      expect.soft(listCollection).toEqual(cConf.selected_collection);
    });

    await test.step(`View preview trong WB và SF`, async () => {
      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.selected_collection);

      //Verify on SF
      sfPage = await context.newPage();
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.selected_collection);
    });

    await test.step(`Kéo thả collection B lên trên collection A`, async () => {
      const from = webBuilder.xpathCL.sidebar.drapAndDropIcon(cConf.selected_collection[2]);
      const to = webBuilder.xpathCL.sidebar.drapAndDropIcon(cConf.selected_collection[0]);
      await dragAndDropCollection(webBuilder.page, from, to, 20);
      await webBuilder.clickSaveButton();

      //verify on sidebar
      listCollection = await webBuilder.getListCollectionOnSidebar();
      expect.soft(listCollection).toEqual(cConf.expected.selected_collection_after_dnd);

      //verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.selected_collection_after_dnd);

      //verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.selected_collection_after_dnd);
    });

    await test.step(`click btn xóa collection C`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.deleteIcon(cConf.selected_collection[2])).click();
      await expect
        .soft(webBuilder.genLoc(webBuilder.xpathCL.sidebar.collectionOnSidebarByName(cConf.selected_collection[2])))
        .toBeHidden();

      //verify on sidebar
      listCollection = await webBuilder.getListCollectionOnSidebar();
      expect.soft(listCollection).toEqual(cConf.expected.selected_collection_after_delete);

      //verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.selected_collection_after_delete);

      //verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.selected_collection_after_delete);
    });

    await test.step(`Select thêm 2 collection D, E`, async () => {
      for (const collection of cConf.selected_collection_2) {
        await webBuilder.selectCollectionOnPopup(collection);
      }
      await webBuilder.clickSaveButton();

      //verify on sidebar
      listCollection = await webBuilder.getListCollectionOnSidebar();
      expect.soft(listCollection).toEqual(cConf.expected.selected_collection_after_add);

      //verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.selected_collection_after_add);

      //verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.selected_collection_after_add);
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_25 [WB] Kiểm tra sort collection theo Best selling`, async ({
    cConf,
    conf,
    authRequest,
    context,
  }) => {
    test.slow();
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
    const productIds: number[] = [];
    const variantIds: number[] = [];
    const addCollectionToProd: Collect[] = [];

    await test.step(`Precondition: Create products and checkout`, async () => {
      await productAPI.deleteProductByAPI();

      for (const productInfo of cConf.pre_data.product_info) {
        const newProductInfo = await productAPI.createNewProduct(productInfo);
        productIds.push(newProductInfo.id);
        variantIds.push(newProductInfo.variants[0].id);
      }

      //Add product to collection
      addCollectionToProd.push({
        product_id: productIds[0],
        collection_id: collectionIds[0],
      });

      addCollectionToProd.push({
        product_id: productIds[1],
        collection_id: collectionIds[1],
      });

      addCollectionToProd.push({
        product_id: productIds[2],
        collection_id: collectionIds[3],
      });

      for (const addCollection of addCollectionToProd) {
        await productAPI.addCollectionToProd(addCollection);
      }

      //checkout các product đã tạo để có sale count
      for (let i = 0; i < variantIds.length; i++) {
        for (let j = 0; j < cConf.pre_data.product_info[i].sale_count; j++) {
          const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
            productsCheckout: [
              {
                variant_id: variantIds[i],
                quantity: 1,
              },
            ],
          });
          expect(checkoutInfos).not.toBeUndefined();
        }
      }
      await collectionApi.triggerUpdate();
    });

    await test.step(`Chọn sort theo Best selling`, async () => {
      await webBuilder.reload();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");

      await webBuilder.chooseSortTypeInWB(cConf.sort_by);
      expect(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by);
      await webBuilder.clickSaveButton();

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.best_selling);

      //Verify on SF
      sfPage = await context.newPage();
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.best_selling);
    });

    await test.step(`Click dropdown sort by`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting")).click();
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.optionActive).last()).toHaveText(cConf.sort_by);
    });

    await test.step(`Add 1 product có doanh số (sale count) = 1 vào Collection 3 `, async () => {
      await productAPI.addCollectionToProd({
        product_id: productIds[1],
        collection_id: collectionIds[2],
      });
      await collectionApi.triggerUpdate();

      await webBuilder.reload();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");
      expect(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by);

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.best_selling_after_add);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.best_selling_after_add);
    });

    await test.step(`Xóa 1 product có doanh số (sale count) = 2 khỏi Collection 1 `, async () => {
      await collectionPage.goToProdDetailByID(conf.suiteConf.domain, productIds[0]);
      await collectionPage.removeCollectionFromProductDetailPage(cConf.pre_data.collections[0].custom_collection.title);
      await collectionPage.clickOnBtnWithLabel("Save changes");
      await collectionApi.triggerUpdate();

      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "collections" });
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");
      expect(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by);

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.best_selling_after_delete);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.best_selling_after_delete);
    });

    await test.step(`Checkout product trong collection 4 thêm 2 order`, async () => {
      for (let i = 0; i < 2; i++) {
        const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: [
            {
              variant_id: variantIds[2],
              quantity: 1,
            },
          ],
        });
        expect(checkoutInfos).not.toBeUndefined();
      }
      await collectionApi.triggerUpdate();

      await webBuilder.reload();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");
      expect(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by);

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.best_selling_after_checkout);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.best_selling_after_checkout);
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_27 [WB] Kiểm tra sort collection theo Date created`, async ({
    context,
    cConf,
    conf,
  }) => {
    await test.step(`Chọn sort theo Date created - New to old`, async () => {
      await webBuilder.chooseSortTypeInWB(cConf.sort_by_1);
      expect(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by_1);
      await webBuilder.clickSaveButton();

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.new_to_old);

      //Verify on SF
      sfPage = await context.newPage();
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.new_to_old);
    });

    await test.step(`Click dropdown sort by`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting")).click();
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.optionActive).last()).toHaveText(cConf.sort_by_1);
    });

    await test.step(`Tạo thêm 1 collection `, async () => {
      await collectionApi.createSmartCollection(cConf.add_collection_1);
      await webBuilder.page.reload();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");
      expect(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by_1);

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.new_to_old_after_add);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.new_to_old_after_add);
    });

    await test.step(`Chọn sort theo Date created - Old to new`, async () => {
      await webBuilder.chooseSortTypeInWB(cConf.sort_by_2);
      expect(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by_2);
      await webBuilder.clickSaveButton();

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.old_to_new);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.old_to_new);
    });

    await test.step(`Click dropdown sort by`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting")).click();
      await expect(webBuilder.genLoc(webBuilder.xpathCL.sidebar.optionActive).last()).toHaveText(cConf.sort_by_2);
    });

    await test.step(`Tạo thêm 1 collection `, async () => {
      await collectionApi.createSmartCollection(cConf.add_collection_2);
      await webBuilder.page.reload();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");
      expect(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by_2);

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.old_to_new_after_add);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.old_to_new_after_add);
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_29 [WB] Kiểm tra sort collection theo Most viewed`, async ({ context, cConf, conf }) => {
    await test.step(`Precondition: set up lượt view cho các collection`, async () => {
      for (const collection of cConf.pre_data.collections) {
        for (let i = 0; i < collection.smart_collection.view_count; i++) {
          const newTab = await context.newPage();
          await newTab.goto(`https://${conf.suiteConf.domain}/collections/${collection.smart_collection.handle}`);
          await newTab.waitForResponse(/theme.css/);
          await newTab.close();
        }
      }
      await collectionApi.triggerUpdateViewCount();
    });
    await test.step(`Chọn sort theo Most viewed first`, async () => {
      await webBuilder.page.reload();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");

      await webBuilder.chooseSortTypeInWB(cConf.sort_by_1);
      expect.soft(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by_1);
      await webBuilder.clickSaveButton();

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.most_viewed_first);

      //Verify on SF
      sfPage = await context.newPage();
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.most_viewed_first);
    });

    await test.step(`Click dropdown sort by`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting")).click();
      await expect.soft(webBuilder.genLoc(webBuilder.xpathCL.sidebar.optionActive).last()).toHaveText(cConf.sort_by_1);
    });

    await test.step(`View collection xếp thứ 2 để vượt số view của collection thứ nhất`, async () => {
      //add view
      for (let i = 0; i < cConf.add_view_1.value; i++) {
        const newTab = await context.newPage();
        await newTab.goto(`https://${conf.suiteConf.domain}/collections/${cConf.add_view_1.collection_handle}`);
        await newTab.waitForResponse(/theme.css/);
        await newTab.close();
      }
      await collectionApi.triggerUpdateViewCount();

      await webBuilder.page.reload();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");
      expect.soft(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by_1);

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.most_viewed_first_after_add);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.most_viewed_first_after_add);
    });

    await test.step(`Chọn sort theo Most viewed last`, async () => {
      await webBuilder.chooseSortTypeInWB(cConf.sort_by_2);
      expect.soft(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by_2);
      await webBuilder.clickSaveButton();

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.most_viewed_last);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.most_viewed_last);
    });

    await test.step(`Click dropdown sort by`, async () => {
      await webBuilder.genLoc(webBuilder.xpathCL.sidebar.dropdownBtnLabel("Sorting")).click();
      await expect.soft(webBuilder.genLoc(webBuilder.xpathCL.sidebar.optionActive).last()).toHaveText(cConf.sort_by_2);
    });

    await test.step(`View collection xếp thứ 2 để vượt số view của collection thứ nhất`, async () => {
      //add view
      for (let i = 0; i < cConf.add_view_2.value; i++) {
        const newTab = await context.newPage();
        await newTab.goto(`https://${conf.suiteConf.domain}/collections/${cConf.add_view_2.collection_handle}`);
        await newTab.waitForResponse(/theme.css/);
        await newTab.close();
      }
      await collectionApi.triggerUpdateViewCount();

      await webBuilder.page.reload();
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathCL.loadingWb);
      await webBuilder.genLoc(webBuilder.xpathLayoutIcon(`All collections`)).click();
      await webBuilder.genLoc(webBuilder.xpathLayoutBlock("All collections", "Collection list")).click();
      await webBuilder.switchToTab("Content");
      expect.soft(await webBuilder.getLabelSortTypeBtn()).toEqual(cConf.sort_by_2);

      //Verify on preview WB
      listCollectionVisibleWB = await webBuilder.getListCollectionOnPreviewWB();
      expect.soft(listCollectionVisibleWB).toEqual(cConf.expected.most_viewed_last_after_add);

      //Verify on SF
      await sfPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await sfPage.waitForResponse(/theme.css/);
      listCollectionVisibleSF = await webBuilder.getListCollectionOnSF(sfPage);
      expect.soft(listCollectionVisibleSF).toEqual(cConf.expected.most_viewed_last_after_add);
    });
  });
});

test.describe("Verify sort collection in DB", () => {
  let collectionApi: CollectionAPI, collectionPage: CollectionPage, listSortedCollection;
  const collectionIds: number[] = [];

  test.beforeEach(async ({ dashboard, conf, authRequest, cConf }) => {
    test.slow();
    collectionApi = new CollectionAPI(conf.suiteConf.domain, authRequest);
    collectionPage = new CollectionPage(dashboard, conf.suiteConf.domain);

    await test.step("Delete all collections and create new collection", async () => {
      await collectionApi.deleteAllSmartCollection();
      for (const collectionInfo of cConf.pre_data.collections) {
        if (conf.caseName === "SB_WEB_BUILDER_LB_NCL_16") {
          const newCollectionInfo = await collectionApi.create(collectionInfo);
          collectionIds.push(newCollectionInfo.custom_collection.id);
        } else {
          await collectionApi.createSmartCollection(collectionInfo);
        }
        await collectionPage.page.waitForTimeout(500); //wait để created at khác nhau
      }
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_16 [Dashboard] Kiểm tra sort collection theo Best selling`, async ({
    cConf,
    conf,
    authRequest,
  }) => {
    test.slow();
    const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
    const productIds: number[] = [];
    const variantIds: number[] = [];
    const addCollectionToProd: Collect[] = [];

    await test.step(`Precondition: Create products and checkout`, async () => {
      await productAPI.deleteProductByAPI();

      for (const productInfo of cConf.pre_data.product_info) {
        const newProductInfo = await productAPI.createNewProduct(productInfo);
        productIds.push(newProductInfo.id);
        variantIds.push(newProductInfo.variants[0].id);
      }

      //Add product to collection
      addCollectionToProd.push({
        product_id: productIds[0],
        collection_id: collectionIds[0],
      });

      addCollectionToProd.push({
        product_id: productIds[1],
        collection_id: collectionIds[1],
      });

      addCollectionToProd.push({
        product_id: productIds[2],
        collection_id: collectionIds[3],
      });

      for (const addCollection of addCollectionToProd) {
        await productAPI.addCollectionToProd(addCollection);
      }

      //checkout các product đã tạo để có sale count
      for (let i = 0; i < variantIds.length; i++) {
        for (let j = 0; j < cConf.pre_data.product_info[i].sale_count; j++) {
          const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
            productsCheckout: [
              {
                variant_id: variantIds[i],
                quantity: 1,
              },
            ],
          });
          expect(checkoutInfos).not.toBeUndefined();
        }
      }
      await collectionApi.triggerUpdate();
    });

    await test.step(`Chọn sort theo Best selling`, async () => {
      await collectionPage.gotoCollectionList();
      await collectionPage.chooseSortTypeInDB("Alphabetically, A to Z");
      await collectionPage.chooseSortTypeInDB("Best selling");
      await collectionPage.waitForElementVisibleThenInvisible(collectionPage.xpathTableLoading);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by);
      expect.soft(listSortedCollection).toEqual(cConf.expected.best_selling);
    });

    await test.step(`Add 1 product có doanh số (sale count) = 1 vào Collection 3 `, async () => {
      await productAPI.addCollectionToProd({
        product_id: productIds[1],
        collection_id: collectionIds[2],
      });
      await collectionApi.triggerUpdate();

      await collectionPage.page.reload();
      await collectionPage.waitForElementVisibleThenInvisible(collectionPage.xpathTableLoading);
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(listSortedCollection).toEqual(cConf.expected.best_selling_after_add);
    });

    await test.step(`Xóa 1 product có doanh số (sale count) = 2 khỏi Collection 1 `, async () => {
      await collectionPage.goToProdDetailByID(conf.suiteConf.domain, productIds[0]);
      await collectionPage.removeCollectionFromProductDetailPage(cConf.pre_data.collections[0].custom_collection.title);
      await collectionPage.clickOnBtnWithLabel("Save changes");
      await collectionApi.triggerUpdate();

      await collectionPage.gotoCollectionList();
      await collectionPage.chooseSortTypeInDB("Alphabetically, A to Z");
      await collectionPage.chooseSortTypeInDB("Best selling");
      await collectionPage.waitForElementVisibleThenInvisible(collectionPage.xpathTableLoading);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(listSortedCollection).toEqual(cConf.expected.best_selling_after_delete);
    });

    await test.step(`Checkout product trong Collection 4 thêm 2 order`, async () => {
      for (let i = 0; i < 2; i++) {
        const checkoutInfos = await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: [
            {
              variant_id: variantIds[2],
              quantity: 1,
            },
          ],
        });
        expect(checkoutInfos).not.toBeUndefined();
      }
      await collectionApi.triggerUpdate();

      await collectionPage.page.reload();
      await collectionPage.waitForElementVisibleThenInvisible(collectionPage.xpathTableLoading);
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(listSortedCollection).toEqual(cConf.expected.best_selling_after_checkout);
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_18 [Dashboard] Kiểm tra sort collection theo Date created`, async ({ cConf }) => {
    await test.step(`Chọn sort theo Date created - New to old`, async () => {
      await collectionPage.gotoCollectionList();
      await collectionPage.chooseSortTypeInDB(cConf.sort_by_1);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by_1);
      expect.soft(listSortedCollection).toEqual(cConf.expected.new_to_old);
    });

    await test.step(`Tạo thêm 1 collection`, async () => {
      await collectionApi.createSmartCollection(cConf.add_collection_1);
      await collectionPage.page.reload();
      await collectionPage.waitForElementVisibleThenInvisible(collectionPage.xpathTableLoading);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by_1);
      expect.soft(listSortedCollection).toEqual(cConf.expected.new_to_old_after_add);
    });

    await test.step(`Chọn sort theo Date created - Old to new`, async () => {
      await collectionPage.chooseSortTypeInDB(cConf.sort_by_2);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by_2);
      expect.soft(listSortedCollection).toEqual(cConf.expected.old_to_new);
    });

    await test.step(`Tạo thêm 1 collection `, async () => {
      await collectionApi.createSmartCollection(cConf.add_collection_2);
      await collectionPage.page.reload();
      await collectionPage.waitForElementVisibleThenInvisible(collectionPage.xpathTableLoading);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by_2);
      expect.soft(listSortedCollection).toEqual(cConf.expected.old_to_new_after_add);
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_20 [Dashboard] Kiểm tra sort collection theo Most viewed`, async ({
    context,
    cConf,
    conf,
  }) => {
    await test.step(`Precondition: set up lượt view cho các collection`, async () => {
      for (const collection of cConf.pre_data.collections) {
        for (let i = 0; i < collection.smart_collection.view_count; i++) {
          const newTab = await context.newPage();
          await newTab.goto(`https://${conf.suiteConf.domain}/collections/${collection.smart_collection.handle}`);
          await newTab.waitForResponse(/theme.css/);
          await newTab.close();
        }
      }
      await collectionApi.triggerUpdateViewCount();
    });

    await test.step(`Chọn sort theo Most viewed first`, async () => {
      await collectionPage.gotoCollectionList();
      await collectionPage.chooseSortTypeInDB(cConf.sort_by_1);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by_1);
      expect.soft(listSortedCollection).toEqual(cConf.expected.most_viewed_first);
    });

    await test.step(`View collection xếp thứ 2 để vượt số view của collection thứ nhất`, async () => {
      // add view
      for (let i = 0; i < cConf.add_view_1.value; i++) {
        const newTab = await context.newPage();
        await newTab.goto(`https://${conf.suiteConf.domain}/collections/${cConf.add_view_1.collection_handle}`);
        await newTab.waitForResponse(/theme.css/);
        await newTab.close();
      }
      await collectionApi.triggerUpdateViewCount();

      await collectionPage.page.reload();
      await collectionPage.waitForElementVisibleThenInvisible(collectionPage.xpathTableLoading);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by_1);
      expect.soft(listSortedCollection).toEqual(cConf.expected.most_viewed_first_after_add);
    });

    await test.step(`Chọn sort theo Most viewed last`, async () => {
      await collectionPage.chooseSortTypeInDB(cConf.sort_by_2);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by_2);
      expect.soft(listSortedCollection).toEqual(cConf.expected.most_viewed_last);
    });

    await test.step(`View collection xếp thứ 2 để vượt số view của collection thứ nhất`, async () => {
      // add view
      for (let i = 0; i < cConf.add_view_2.value; i++) {
        const newTab = await context.newPage();
        await newTab.goto(`https://${conf.suiteConf.domain}/collections/${cConf.add_view_2.collection_handle}`);
        await newTab.waitForResponse(/theme.css/);
        await newTab.close();
      }
      await collectionApi.triggerUpdateViewCount();

      await collectionPage.page.reload();
      await collectionPage.waitForElementVisibleThenInvisible(collectionPage.xpathTableLoading);
      listSortedCollection = await collectionPage.getListCollectionInDB();
      expect.soft(await collectionPage.getLabelSortTypeBtn()).toEqual(cConf.sort_by_2);
      expect.soft(listSortedCollection).toEqual(cConf.expected.most_viewed_last_after_add);
    });
  });
});
