import { expect, test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { CollectionAPI } from "@pages/api/dashboard/collection";
import { waitTimeout } from "@core/utils/api";
import { CollectionPage } from "@pages/dashboard/collections";
import { SFHome } from "@pages/storefront/homepage";
import { pressControl } from "@core/utils/keyboard";

test.describe("Automate testcase for entity collection(feature translation)", () => {
  let dashboardPage: TranslationDetail;
  let collectionInfo;
  let collectionDataSF;
  let dashboardDataTranslated;

  const collectionJson = {
    custom_collection: {
      collection_type: "custom",
      disjunctive: true,
      body_html: "",
      title: "",
      rules: [
        {
          column: "tag",
          relation: "equals",
          condition: "",
        },
      ],
      metafields: [
        {
          namespace: "global",
          key: "description_tag",
          value: "",
          value_type: "string",
        },
        {
          namespace: "global",
          key: "title_tag",
          value: "",
          value_type: "string",
        },
        {
          namespace: "global",
          key: "tracking_id",
          value: "",
          value_type: "string",
        },
        {
          namespace: "global",
          key: "tracking_access_token",
          value: "",
          value_type: "string",
        },
      ],
      collection_availability: 1,
      handle: "",
    },
  };

  const createCollectionAPI = async (collectionData, conf, authRequest) => {
    collectionJson.custom_collection.body_html = collectionData.description;
    collectionJson.custom_collection.title = collectionData.title;
    collectionJson.custom_collection.metafields[0].value = collectionData.meta_description;
    collectionJson.custom_collection.metafields[1].value = collectionData.meta_title;

    const collectionsAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);
    collectionInfo = (await collectionsAPI.create(collectionJson)).custom_collection;
    return collectionInfo;
  };

  const createCollectionManual = async (collectionData, conf) => {
    collectionJson.custom_collection.body_html = collectionData.description;
    collectionJson.custom_collection.title = collectionData.title;
    collectionJson.custom_collection.metafields[0].value = collectionData.meta_description;
    collectionJson.custom_collection.metafields[1].value = collectionData.meta_title;

    const collectionManual = new CollectionPage(dashboardPage.page, conf.suiteConf.domain);
    await dashboardPage.goto("admin/collections");
    await dashboardPage.page.locator(collectionManual.xpathCreateCollection).click();
    await collectionManual.createCustomCollection(collectionJson);
    await dashboardPage.page.waitForSelector("//div[contains(text(),'uccessfully')]", { state: "visible" });
    await dashboardPage.page.waitForSelector("//div[contains(text(),'uccessfully')]", { state: "hidden" });
    await dashboardPage.genLoc(dashboardPage.xpathTD.loading).waitFor({ state: "hidden" });
  };

  const setDataFillTranslationDetails = async (conf, data) => {
    conf.suiteConf.data_input_dashboard[0].inputData = data.title;
    conf.suiteConf.data_input_dashboard[1].inputData = data.description;
    conf.suiteConf.data_input_dashboard[2].inputData = data.meta_description;
    conf.suiteConf.data_input_dashboard[3].inputData = data.meta_title;
    return conf.suiteConf.data_input_dashboard;
  };

  test.beforeEach("Set data for shop", async ({ conf, authRequest, dashboard }) => {
    await test.step("Login Shop", async () => {
      dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    });

    await test.step("Delete all collection", async () => {
      const collectionsAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);
      await collectionsAPI.deleteAllSmartCollection();
    });
  });

  test(`@SB_SET_TL_60 [DB - UI/UX] Kiểm tra màn translate detail của store data - Products - Collections`, async ({
    conf,
    authRequest,
    snapshotFixture,
  }) => {
    await test.step("Pre-condition: Create collection", async () => {
      for (const collectionData of conf.caseConf.collection_data) {
        await createCollectionAPI(collectionData, conf, authRequest);
      }
    });

    await test.step("Click vào details của collections", async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.suiteConf.publish_language,
        "Collections",
      );

      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.suiteConf.publish_language} Translation`,
      );
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language),
        ),
      ).toBeVisible();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.publish_language),
        ),
      ).toBeVisible();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
    });

    await test.step(`Kiểm tra droplist collections`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.collection.input).click();
      await waitTimeout(1000); //wait show search result on dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-60-translation-detail.png`,
      });
    });

    await test.step(`Thực hiện search keyword không tồn tại`, async () => {
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.collection.input)
        .fill(conf.caseConf.invalid_value);

      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.xpathNotFound)).toBeVisible();
    });

    await test.step(`Thực hiện search keyword có tồn tại`, async () => {
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.collection.input)
        .fill(conf.caseConf.valid_value);
      const numberOfResult = await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown)
        .count();
      for (let i = 0; i < numberOfResult; i++) {
        await expect(
          dashboardPage.page.locator(`(${dashboardPage.xpathTD.searchBar.valueOptionOnDropdown})[${i + 1}]`),
        ).toContainText(conf.caseConf.valid_value);
      }
    });

    await test.step(`Chọn lần lượt các Collection theo data >  Kiểm tra các field`, async () => {
      for (const collection of conf.caseConf.collection_data) {
        await dashboardPage.chooseCollection(collection.title);

        for (const showField of collection.show_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(showField))).toBeVisible();
        }
        for (const hideField of collection.hide_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(hideField))).toBeHidden();
        }
      }
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.iconAutoTranslation)
        .first()
        .hover({ timeout: 500 });
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-60-icon-auto.png`,
      });

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel("Title"))
        .fill(conf.caseConf.valid_value);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-60-icon-manual.png`,
      });
    });

    await test.step(`Kiểm tra UI edit bản dịch`, async () => {
      //1. Thêm text vào text field - checked above
      //2. Thêm text nhiều vào text editor
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.inputTextAreaWithLabel("Description"))
        .frameLocator("//iframe")
        .locator("body")
        .click();
      await pressControl(dashboardPage.page, "A");
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.inputTextAreaWithLabel("Description"))
        .frameLocator("//iframe")
        .locator("body")
        .pressSequentially(conf.caseConf.more_characters);

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-60-more-characters.png`,
      });
    });
  });

  test(`@SB_SET_TL_79 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable Auto translate Products - Collections`, async ({
    conf,
    authRequest,
    snapshotFixture,
    page,
  }) => {
    const collectionManual = new CollectionPage(dashboardPage.page, conf.suiteConf.domain);
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const collectionsAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);

    await test.step("Pre-condition: Create collection", async () => {
      for (const collectionData of conf.caseConf.collection_data) {
        await createCollectionAPI(collectionData, conf, authRequest);
      }
    });

    await test.step("Enable auto translate ở Products > Mở màn colletions Translation   > Mở droplist colletion ", async () => {
      //Mở màn colletions Translation
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.caseConf.publish_language,
        "Collections",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );
      //Mở droplist colletion
      const isCloseButtonEnabled = await dashboardPage.page.locator(dashboardPage.xpathTD.closeAlertButton).isVisible({
        timeout: 3000,
      });
      if (isCloseButtonEnabled) {
        await dashboardPage.page.locator(dashboardPage.xpathTD.closeAlertButton).click();
      }
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.collection.input).click();
      await waitTimeout(1000); //wait show search result on dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-79-translation-detail.png`,
      });
    });

    await test.step(`Thực hiện thêm / xóa / đổi tên colletion tại dashboard > Mở màn colletions Translation > Mở droplist`, async () => {
      //Thực hiện thêm / xóa / đổi tên colletion tại dashboard
      await createCollectionManual(conf.caseConf.collection_data_manual, conf);
      await collectionManual.editCustomCollection(
        conf.caseConf.collection_data_edit,
        conf.caseConf.collection_data[1].title,
      );
      await dashboardPage.goto("admin/collections");
      await collectionManual.deleteCollection(conf.caseConf.collection_data[2].title);

      //Mở màn colletions Translation > Mở droplist
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.caseConf.publish_language,
        "Collections",
      );
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.collection.input).click();
      await waitTimeout(1000); //wait show search result on dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-79-edit-collection-title.png`,
      });
    });

    await test.step(`Thực hiện edit content  colletion B > Mở màn colletions Translation của colletion đã edit > đợi đến khi thông báo translating biến mất`, async () => {
      //Thực hiện edit content  colletion B - edited above
      //Mở màn colletions Translation của colletion đã edit
      await dashboardPage.chooseCollection(conf.caseConf.collection_data_edit.title);
      //đợi đến khi thông báo translating biến mất
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      //verify dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-79-auto-translate-collection-data.png`,
      });
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();
      //verify SF
      await homePage.page.goto(
        `https://${conf.suiteConf.domain}/collections/${conf.caseConf.collection_data_edit.handle}`,
      );
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait SF apply data
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];

      expect(collectionDataSF.description).toEqual(
        `translated <p>${conf.caseConf.collection_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(collectionDataSF.title).toEqual(dashboardDataTranslated[0].destination.value);
      expect(collectionDataSF.meta_title).toEqual(dashboardDataTranslated[2].destination.value);
      expect(collectionDataSF.meta_description).toEqual(dashboardDataTranslated[3].destination.value);
    });

    await test.step(`Thực hiện edit bản dịch > save > reload`, async () => {
      await dashboardPage.fillTranslationDetails([
        {
          inputDataType: "text",
          inputData: conf.caseConf.edit_dashboard_translation.title,
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Title",
          },
        },
        {
          inputDataType: "html",
          inputData: conf.caseConf.edit_dashboard_translation.description,
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Description (optional)",
          },
        },
        {
          inputDataType: "text",
          inputData: conf.caseConf.edit_dashboard_translation.meta_description,
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Meta description",
          },
        },
        {
          inputDataType: "text",
          inputData: conf.caseConf.edit_dashboard_translation.meta_title,
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Page title",
          },
        },
      ]);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();

      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();
      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(conf.caseConf.edit_dashboard_translation.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(
        `<p>${conf.caseConf.edit_dashboard_translation.description}</p>`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(conf.caseConf.edit_dashboard_translation.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(
        conf.caseConf.edit_dashboard_translation.meta_description,
      );
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" });
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];

      expect(collectionDataSF.description).toEqual(`<p>${conf.caseConf.edit_dashboard_translation.description}</p>`);
      expect(collectionDataSF.title).toEqual(conf.caseConf.edit_dashboard_translation.title);
      expect(collectionDataSF.meta_title).toEqual(conf.caseConf.edit_dashboard_translation.meta_title);
      expect(collectionDataSF.meta_description).toEqual(conf.caseConf.edit_dashboard_translation.meta_description);
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click({ delay: 1000 });
      await waitTimeout(2000);
      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(conf.caseConf.edit_dashboard_translation.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(
        `<p>${conf.caseConf.edit_dashboard_translation.description}</p>`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(conf.caseConf.edit_dashboard_translation.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(
        conf.caseConf.edit_dashboard_translation.meta_description,
      );
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" });
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];

      expect(collectionDataSF.description).toEqual(`<p>${conf.caseConf.edit_dashboard_translation.description}</p>`);
      expect(collectionDataSF.title).toEqual(conf.caseConf.edit_dashboard_translation.title);
      expect(collectionDataSF.meta_title).toEqual(conf.caseConf.edit_dashboard_translation.meta_title);
      expect(collectionDataSF.meta_description).toEqual(conf.caseConf.edit_dashboard_translation.meta_description);
    });

    await test.step(`Xóa Bản dịch manual > save  > reload - Ra ngoài SF > chọn ngôn ngữ tiếng Vietnamese > Collection A`, async () => {
      //Xóa Bản dịch manual > save  > reload
      await dashboardPage.fillTranslationDetails([
        {
          inputDataType: "text",
          inputData: "",
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Title",
          },
        },
        {
          inputDataType: "html",
          inputData: "",
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Description (optional)",
          },
        },
        {
          inputDataType: "text",
          inputData: "",
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Meta description",
          },
        },
        {
          inputDataType: "text",
          inputData: "",
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Page title",
          },
        },
      ]);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual("");
      expect(dashboardDataTranslated[1].destination.value).toEqual('<p><br data-mce-bogus="1"></p>');
      expect(dashboardDataTranslated[2].destination.value).toEqual("");
      expect(dashboardDataTranslated[3].destination.value).toEqual("");
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" });
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];

      expect(collectionDataSF.description).toEqual(`<p>${conf.caseConf.collection_data_edit.description}</p>`);
      expect(collectionDataSF.title).toEqual(conf.caseConf.collection_data_edit.title);
      expect(collectionDataSF.meta_title).toEqual(conf.caseConf.collection_data_edit.meta_title);
      expect(collectionDataSF.meta_description).toEqual(conf.caseConf.collection_data_edit.meta_description);
    });

    await test.step(`(DB Translation đang rỗng)Click button Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click({ delay: 1000 });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(conf.caseConf.auto_translation_data.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(
        `<p>translated</p><p>${conf.caseConf.collection_data_edit.description}</p><p>to ${conf.caseConf.publish_language}</p>`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(conf.caseConf.auto_translation_data.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(
        conf.caseConf.auto_translation_data.meta_description,
      );
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" });
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];

      expect(collectionDataSF.description).toEqual(
        `translated <p>${conf.caseConf.collection_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(collectionDataSF.title).toEqual(conf.caseConf.auto_translation_data.title);
      expect(collectionDataSF.meta_title).toEqual(conf.caseConf.auto_translation_data.meta_title);
      expect(collectionDataSF.meta_description).toEqual(conf.caseConf.auto_translation_data.meta_description);
    });
  });

  test(`@SB_SET_TL_78 [DB+SF - Function] Kiểm tra tính năng auto translate khi Disable Auto translate của Products - Collections`, async ({
    conf,
    authRequest,
    snapshotFixture,
    page,
  }) => {
    const collectionManual = new CollectionPage(dashboardPage.page, conf.suiteConf.domain);
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const collectionsAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);

    await test.step("Pre-condition: Create collection", async () => {
      for (const collectionData of conf.caseConf.collection_data) {
        await createCollectionAPI(collectionData, conf, authRequest);
      }
    });

    await test.step("Disable auto translate ở Products > Mở màn colletions Translation   > Mở droplist colletion ", async () => {
      //Mở màn colletions Translation
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.caseConf.publish_language,
        "Collections",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );
      //Mở droplist colletion
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.collection.input).click();
      await waitTimeout(1000); //wait show search result on Dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-78-translation-detail.png`,
      });
    });

    await test.step(`Thực hiện thêm / xóa / đổi tên colletion tại dashboard > Mở màn colletions Translation > Mở droplist`, async () => {
      //Thực hiện thêm / xóa / đổi tên colletion tại dashboard
      await createCollectionManual(conf.caseConf.collection_data_manual, conf);
      await collectionManual.editCustomCollection(
        conf.caseConf.collection_data_edit,
        conf.caseConf.collection_data[1].title,
      );
      await dashboardPage.goto("admin/collections");
      await collectionManual.deleteCollection(conf.caseConf.collection_data[2].title);

      //Mở màn colletions Translation > Mở droplist
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.caseConf.publish_language,
        "Collections",
      );
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.collection.input).click();
      await waitTimeout(1000); //wait show search result on Dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-78-edit-collection-title.png`,
      });
    });

    await test.step(`Thực hiện edit content  colletion B > Mở màn colletions Translation của colletion đã edit > đợi đến khi thông báo translating biến mất`, async () => {
      //Thực hiện edit content  colletion B - edited above
      //Mở màn colletions Translation của colletion đã edit
      await dashboardPage.chooseCollection(conf.caseConf.collection_data_edit.title);

      //verify dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-78-auto-translate-collection-data.png`,
      });
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click({ delay: 1000 });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();
      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(conf.caseConf.auto_translation_data.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(
        `<p>translated</p><p>${conf.caseConf.collection_data_edit.description}</p><p>to ${conf.caseConf.publish_language}</p>`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(conf.caseConf.auto_translation_data.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(
        conf.caseConf.auto_translation_data.meta_description,
      );
      //verify SF
      await homePage.page.goto(
        `https://${conf.suiteConf.domain}/collections/${conf.caseConf.collection_data_edit.handle}`,
      );
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];
      expect(collectionDataSF.description).toEqual(
        `translated <p>${conf.caseConf.collection_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(collectionDataSF.title).toEqual(conf.caseConf.auto_translation_data.title);
      expect(collectionDataSF.meta_title).toEqual(conf.caseConf.auto_translation_data.meta_title);
      expect(collectionDataSF.meta_description).toEqual(conf.caseConf.auto_translation_data.meta_description);
    });

    await test.step(`Thực hiện edit bản dịch > save > Click Auto translate`, async () => {
      await dashboardPage.fillTranslationDetails(
        await setDataFillTranslationDetails(conf, conf.caseConf.edit_dashboard_translation),
      );

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click({ delay: 1000 });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();
      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(conf.caseConf.edit_dashboard_translation.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(
        `<p>${conf.caseConf.edit_dashboard_translation.description}</p>`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(conf.caseConf.edit_dashboard_translation.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(
        conf.caseConf.edit_dashboard_translation.meta_description,
      );
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" });
      await waitTimeout(2000); //wait for SF apply data
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];
      expect(collectionDataSF.description).toEqual(`<p>${conf.caseConf.edit_dashboard_translation.description}</p>`);
      expect(collectionDataSF.title).toEqual(conf.caseConf.edit_dashboard_translation.title);
      expect(collectionDataSF.meta_title).toEqual(conf.caseConf.edit_dashboard_translation.meta_title);
      expect(collectionDataSF.meta_description).toEqual(conf.caseConf.edit_dashboard_translation.meta_description);
    });

    await test.step(`Xóa Bản dịch manual > save  > reload - Ra ngoài SF > chọn ngôn ngữ tiếng Vietnamese > Collection A`, async () => {
      //Xóa Bản dịch manual > save  > reload
      await dashboardPage.fillTranslationDetails(await setDataFillTranslationDetails(conf, conf.caseConf.blank_data));

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual("");
      expect(dashboardDataTranslated[1].destination.value).toEqual('<p><br data-mce-bogus="1"></p>');
      expect(dashboardDataTranslated[2].destination.value).toEqual("");
      expect(dashboardDataTranslated[3].destination.value).toEqual("");
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" });
      await waitTimeout(2000); //wait for SF apply data
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];

      expect(collectionDataSF.description).toEqual(`<p>${conf.caseConf.collection_data_edit.description}</p>`);
      expect(collectionDataSF.title).toEqual(conf.caseConf.collection_data_edit.title);
      expect(collectionDataSF.meta_title).toEqual(conf.caseConf.collection_data_edit.meta_title);
      expect(collectionDataSF.meta_description).toEqual(conf.caseConf.collection_data_edit.meta_description);
    });

    await test.step(`(DB Translation đang rỗng)Click button Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click({ delay: 1000 });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(conf.caseConf.auto_translation_data.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(
        `<p>translated</p><p>${conf.caseConf.collection_data_edit.description}</p><p>to ${conf.caseConf.publish_language}</p>`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(conf.caseConf.auto_translation_data.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(
        conf.caseConf.auto_translation_data.meta_description,
      );
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" });
      await waitTimeout(2000); //wait for SF apply data
      collectionDataSF = (
        await collectionsAPI.getCollectionDataOnSF(conf.caseConf.collection_data_edit.handle, conf.caseConf.locale_info)
      ).result.items[0];

      expect(collectionDataSF.description).toEqual(
        `translated <p>${conf.caseConf.collection_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(collectionDataSF.title).toEqual(conf.caseConf.auto_translation_data.title);
      expect(collectionDataSF.meta_title).toEqual(conf.caseConf.auto_translation_data.meta_title);
      expect(collectionDataSF.meta_description).toEqual(conf.caseConf.auto_translation_data.meta_description);
    });
  });
});
