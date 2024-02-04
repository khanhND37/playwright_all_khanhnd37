import { expect, test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { AppsAPI } from "@pages/api/apps";
import { waitTimeout } from "@core/utils/api";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Automate testcase for entity apps - usell(feature translation)", () => {
  let dashboardPage: TranslationDetail;
  let incartOfferID, accessoryOfferID, bundleOfferID, prePurchaseOfferID, quantityOfferID, postPurchaseOfferID: number;
  let offerList;
  let dataSF;

  const getDataOnSF = async (domain: string, productId: number, authRequest, locale) => {
    const appsAPI = new AppsAPI(domain, authRequest);
    const appsData = await appsAPI.getListOfferInfoOfProductOnSF(domain, productId, locale);
    let postPurchaseMessageData,
      quantityMessageData,
      prePurchaseMessageData,
      bundleMessageData,
      accessoryMessageData,
      inCartMessageData;

    for (const appData of appsData) {
      if (appData.offer_type == "post-purchase") {
        postPurchaseMessageData = appData.offer_message;
      }
      if (appData.offer_type == "quantity") {
        quantityMessageData = appData.offer_message;
      }
      if (appData.offer_type == "pre-purchase") {
        prePurchaseMessageData = appData.offer_message;
      }
      if (appData.offer_type == "bundle") {
        bundleMessageData = appData.offer_message;
      }
      if (appData.offer_type == "accessory") {
        accessoryMessageData = appData.offer_message;
      }
      if (appData.offer_type == "in-cart") {
        inCartMessageData = appData.offer_message;
      }
    }
    return {
      postPurchaseMessage: postPurchaseMessageData,
      quantityMessage: quantityMessageData,
      prePurchaseMessage: prePurchaseMessageData,
      bundleMessage: bundleMessageData,
      accessoryMessage: accessoryMessageData,
      inCartMessage: inCartMessageData,
    };
  };

  test.beforeEach("Set data for shop", async ({ dashboard, conf, authRequest }) => {
    const suiteConf = conf.suiteConf;
    const appsAPI = new AppsAPI(suiteConf.domain, authRequest);
    const accessoriesData = suiteConf.accessories_offer.data;
    const bundleData = suiteConf.bundle_offer.data;
    const prePurchaseData = suiteConf.pre_purchase_offer.data;
    const quantityData = suiteConf.quantity_offer.data;
    const incartData = suiteConf.in_cart_offer.data;
    const postPurchaseData = suiteConf.post_purchase_offer.data;

    await test.step("Get offer list đã tạo", async () => {
      offerList = await appsAPI.getListUpsellOffers();
    });

    const requestData = suiteConf.delete_offer;
    const offerIds = requestData.ids;
    await test.step("Delete offer đã tạo truoc khi test", async () => {
      for (let i = 0; i < offerList.length; i++) {
        offerIds.push(offerList[i].id);
      }
      if (offerIds.length) {
        await appsAPI.deleteAllUpsellOffers(offerIds);
      }
    });

    await test.step(`Set data for create usell`, async () => {
      accessoriesData.recommend_ids = suiteConf.recommend_ids;
      bundleData.recommend_ids = suiteConf.recommend_ids;
      prePurchaseData.recommend_ids = suiteConf.recommend_ids;
      quantityData.recommend_ids = suiteConf.recommend_ids;
      incartData.recommend_ids = suiteConf.recommend_ids;
      postPurchaseData.recommend_ids = suiteConf.recommend_ids;

      accessoriesData.target_ids = suiteConf.target_ids;
      bundleData.target_ids = suiteConf.target_bundle;
      prePurchaseData.target_ids = suiteConf.target_ids;
      quantityData.target_ids = suiteConf.target_ids;
      incartData.target_ids = suiteConf.target_ids;
      postPurchaseData.target_ids = suiteConf.target_ids;
    });

    await test.step("Login Shop", async () => {
      dashboardPage = new TranslationDetail(dashboard, suiteConf.domain);
    });
  });

  test(`@SB_SET_TL_63 [DB - UI/UX] Kiểm tra màn translate detail của store data - Apps - Boots upsell`, async ({
    conf,
    snapshotFixture,
    authRequest,
  }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;
    const accessoriesData = suiteConf.accessories_offer.data;
    const bundleData = suiteConf.bundle_offer.data;
    const prePurchaseData = suiteConf.pre_purchase_offer.data;
    const quantityData = suiteConf.quantity_offer.data;
    const incartData = suiteConf.in_cart_offer.data;
    const postPurchaseData = suiteConf.post_purchase_offer.data;

    await test.step("Create offer", async () => {
      const appsAPI = new AppsAPI(suiteConf.domain, authRequest);
      await appsAPI.createNewUpsellOffer(accessoriesData);
      await appsAPI.createNewUpsellOffer(bundleData);
      await appsAPI.createNewUpsellOffer(prePurchaseData);
      await appsAPI.createNewUpsellOffer(quantityData);
      await appsAPI.createNewUpsellOffer(incartData);
      await appsAPI.createNewUpsellOffer(postPurchaseData);
    });

    await test.step("Click vào details của app boost upsell", async () => {
      await dashboardPage.goToTranslationDetailScreen("Published languages", caseConf.publish_language, "Boost upsell");

      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${suiteConf.publish_language} Translation`,
      );
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language),
        ),
      ).toBeVisible();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.publish_language),
        ),
      ).toBeVisible();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
    });

    await test.step(`Kiểm tra droplist offer `, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.inputOffer).click();
      expect(await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).count()).toEqual(
        6,
      );
    });

    await test.step(`Thực hiện search keyword không tồn tại`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.inputOffer).fill(caseConf.invalid_value);
      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.xpathNotFound)).toBeVisible();
    });

    await test.step(`Thực hiện search keyword có tồn tại`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.inputOffer).fill(caseConf.valid_value);
      const numberOfResult = await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown)
        .count();
      for (let i = 0; i < numberOfResult; i++) {
        await expect(
          dashboardPage.page.locator(`(${dashboardPage.xpathTD.searchBar.valueOptionOnDropdown})[${i + 1}]`),
        ).toContainText(caseConf.valid_value);
      }
    });

    await test.step(`Kiểm tra các field`, async () => {
      await dashboardPage.chooseOffer(postPurchaseData.offer_name);
      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName("Offer's message"))).toBeVisible();
      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName("Offer title"))).toBeVisible();
      await dashboardPage.chooseOffer(accessoriesData.offer_name);
      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName("Offer's message"))).toBeVisible();
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.iconAutoTranslation, {
        state: "visible",
      });
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.iconAutoTranslation)
        .hover({ timeout: 500 });
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-63-icon-auto.png`,
      });

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel("Offer's message"))
        .fill(caseConf.valid_value);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-63-icon-manual.png`,
      });
    });

    await test.step(`Kiểm tra UI edit bản dịch`, async () => {
      //1. Thêm text vào text field - checked above
      //2. Thêm text nhiều vào text editor
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel("Offer's message"))
        .click();
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel("Offer's message"))
        .fill(caseConf.more_characters);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-63-more-characters.png`,
      });
    });
  });

  test(`@SB_SET_TL_90 [DB+SF - Function] Kiểm tra tính năng auto translate khi Disable Auto translate của Apps - Boots upsell`, async ({
    conf,
    authRequest,
    page,
    context,
  }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;
    const appsAPI = new AppsAPI(suiteConf.domain, authRequest);
    const accessoriesData = suiteConf.accessories_offer.data;
    const bundleData = suiteConf.bundle_offer.data;
    const prePurchaseData = suiteConf.pre_purchase_offer.data;
    const quantityData = suiteConf.quantity_offer.data;
    const incartData = suiteConf.in_cart_offer.data;
    const postPurchaseData = suiteConf.post_purchase_offer.data;

    await test.step("Create offer", async () => {
      accessoryOfferID = (await appsAPI.createNewUpsellOffer(accessoriesData)).id;
      bundleOfferID = (await appsAPI.createNewUpsellOffer(bundleData)).id;
      prePurchaseOfferID = (await appsAPI.createNewUpsellOffer(prePurchaseData)).id;
      quantityOfferID = (await appsAPI.createNewUpsellOffer(quantityData)).id;
      incartOfferID = (await appsAPI.createNewUpsellOffer(incartData)).id;
    });

    await test.step("Disable auto translate ở Online store  > Mở màn offerTranslation   > Mở droplist offer", async () => {
      await dashboardPage.goToTranslationDetailScreen("Published languages", caseConf.publish_language, "Boost upsell");
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${suiteConf.publish_language} Translation`,
      );
      //Mở droplist offer
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.inputOffer).click();
      expect(await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).count()).toEqual(
        5,
      );
    });

    await test.step(`Thực hiện thêm / xóa Offer tại dashboard > Mở màn Offer Translation > Mở droplist`, async () => {
      //Add new offer
      postPurchaseOfferID = (await appsAPI.createNewUpsellOffer(postPurchaseData)).id;
      //Delete offer
      await appsAPI.deleteAllUpsellOffers([incartOfferID]);
      //Update offer
      accessoriesData.offer_name = caseConf.edit_offer_name;
      await appsAPI.updateOffer(accessoryOfferID, accessoriesData);
      //Mở màn Offer Translation > Mở droplist
      await dashboardPage.goToTranslationDetailScreen("Published languages", caseConf.publish_language, "Boost upsell");
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.inputOffer).click();
      expect(await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).count()).toEqual(
        5,
      );
      await expect(
        dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueSearchResult(postPurchaseData.offer_name)),
      ).toBeVisible();
      await expect(
        dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueSearchResult(caseConf.edit_offer_name)),
      ).toBeVisible();
      await expect(
        dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueSearchResult(incartData.offer_name)),
      ).toBeHidden();
    });

    await test.step(`DB menu Apps > Offers > Thực hiện edit content offer - Mở màn offer Translation của offer A đã edit`, async () => {
      //edit content offer
      incartOfferID = (await appsAPI.createNewUpsellOffer(incartData)).id;
      incartData.offer_message = caseConf.edit_message.in_cart;
      await appsAPI.updateOffer(incartOfferID, incartData);

      accessoriesData.offer_message = caseConf.edit_message.accessories;
      await appsAPI.updateOffer(accessoryOfferID, accessoriesData);

      bundleData.offer_message = caseConf.edit_message.bundle;
      await appsAPI.updateOffer(bundleOfferID, bundleData);

      prePurchaseData.offer_message = caseConf.edit_message.pre_purchase;
      await appsAPI.updateOffer(prePurchaseOfferID, prePurchaseData);

      quantityData.offer_message = caseConf.edit_message.quantity;
      await appsAPI.updateOffer(quantityOfferID, quantityData);

      postPurchaseData.offer_message = caseConf.edit_message.post_purchase;
      await appsAPI.updateOffer(postPurchaseOfferID, postPurchaseData);

      //Mở màn offer Translation của offer A đã edit
      await dashboardPage.goToTranslationDetailScreen("Published languages", caseConf.publish_language, "Boost upsell");

      //check dashboard
      expect((await dashboardPage.getDataOnTableByField(incartData.offer_name)).source).toEqual(
        caseConf.edit_message.in_cart,
      );
      expect((await dashboardPage.getDataOnTableByField(incartData.offer_name)).destination).toEqual("");

      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name)).source,
      ).toEqual(caseConf.edit_message.post_purchase);
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name)).destination,
      ).toEqual("");

      expect((await dashboardPage.getDataOnTableByField(accessoriesData.offer_name)).source).toEqual(
        caseConf.edit_message.accessories,
      );
      expect((await dashboardPage.getDataOnTableByField(accessoriesData.offer_name)).destination).toEqual("");

      expect((await dashboardPage.getDataOnTableByField(bundleData.offer_name)).source).toEqual(
        caseConf.edit_message.bundle,
      );
      expect((await dashboardPage.getDataOnTableByField(bundleData.offer_name)).destination).toEqual("");

      expect((await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name)).source).toEqual(
        caseConf.edit_message.pre_purchase,
      );
      expect((await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name)).destination).toEqual("");

      expect((await dashboardPage.getDataOnTableByField(quantityData.offer_name)).source).toEqual(
        caseConf.edit_message.quantity,
      );
      expect((await dashboardPage.getDataOnTableByField(quantityData.offer_name)).destination).toEqual("");

      // check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();

      expect(dataSF.postPurchaseMessage).toEqual(caseConf.edit_message.post_purchase);
      expect(dataSF.quantityMessage).toEqual(caseConf.edit_message.quantity);
      expect(dataSF.prePurchaseMessage).toEqual(caseConf.edit_message.pre_purchase);
      expect(dataSF.inCartMessage).toEqual(caseConf.edit_message.in_cart);
      expect(dataSF.bundleMessage).toEqual(caseConf.edit_message.bundle);
      expect(dataSF.accessoryMessage).toEqual(caseConf.edit_message.accessories);
    });

    await test.step(`click btn auto translate`, async () => {
      //verify dashboard
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.in_cart} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.post_purchase} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.accessories} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.bundle} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.pre_purchase} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.quantity} to ${caseConf.publish_language}`);

      //Check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await homePage.page.waitForSelector(
        `//div[contains(@class, 'block-qty-discount__title') and contains(text(), 'translated')]`,
        { state: "visible" },
      );
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();

      expect(dataSF.postPurchaseMessage).toEqual(
        `translated ${caseConf.edit_message.post_purchase} to ${caseConf.publish_language}`,
      );
      expect(dataSF.quantityMessage).toEqual(
        `translated ${caseConf.edit_message.quantity} to ${caseConf.publish_language}`,
      );
      expect(dataSF.prePurchaseMessage).toEqual(
        `translated ${caseConf.edit_message.pre_purchase} to ${caseConf.publish_language}`,
      );
      expect(dataSF.inCartMessage).toEqual(
        `translated ${caseConf.edit_message.in_cart} to ${caseConf.publish_language}`,
      );
      expect(dataSF.bundleMessage).toEqual(
        `translated ${caseConf.edit_message.bundle} to ${caseConf.publish_language}`,
      );
      expect(dataSF.accessoryMessage).toEqual(
        `translated ${caseConf.edit_message.accessories} to ${caseConf.publish_language}`,
      );
    });

    await test.step(`Thực hiện edit bản dịch > save > Click Auto translate`, async () => {
      //check dashoard
      await dashboardPage.editManualTranslation(incartData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(postPurchaseData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(accessoriesData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(bundleData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(prePurchaseData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(quantityData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      // Check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();

      expect(dataSF.postPurchaseMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.quantityMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.prePurchaseMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.inCartMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.bundleMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.accessoryMessage).toEqual(`${caseConf.edit_manual}`);
    });

    await test.step(`Xóa Bản dịch manual > save - Ra ngoài SF > chọn ngôn ngữ tiếng German > mở Offer`, async () => {
      //check dashoard
      await dashboardPage.editManualTranslation(incartData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(postPurchaseData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, false))
          .destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(accessoriesData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(bundleData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(prePurchaseData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(quantityData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      // Check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();

      expect(dataSF.postPurchaseMessage).toEqual(caseConf.edit_message.post_purchase);
      expect(dataSF.quantityMessage).toEqual(caseConf.edit_message.quantity);
      expect(dataSF.prePurchaseMessage).toEqual(caseConf.edit_message.pre_purchase);
      expect(dataSF.inCartMessage).toEqual(caseConf.edit_message.in_cart);
      expect(dataSF.bundleMessage).toEqual(caseConf.edit_message.bundle);
      expect(dataSF.accessoryMessage).toEqual(caseConf.edit_message.accessories);
    });

    await test.step(`click btn auto translate`, async () => {
      //verify dashboard
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.in_cart} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.post_purchase} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.accessories} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.bundle} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.pre_purchase} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.quantity} to ${caseConf.publish_language}`);

      //Check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await homePage.page.waitForSelector(
        `//div[contains(@class, 'block-qty-discount__title') and contains(text(), 'translated')]`,
        { state: "visible" },
      );
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();
      expect(dataSF.postPurchaseMessage).toEqual(
        `translated ${caseConf.edit_message.post_purchase} to ${caseConf.publish_language}`,
      );
      expect(dataSF.quantityMessage).toEqual(
        `translated ${caseConf.edit_message.quantity} to ${caseConf.publish_language}`,
      );
      expect(dataSF.prePurchaseMessage).toEqual(
        `translated ${caseConf.edit_message.pre_purchase} to ${caseConf.publish_language}`,
      );
      expect(dataSF.inCartMessage).toEqual(
        `translated ${caseConf.edit_message.in_cart} to ${caseConf.publish_language}`,
      );
      expect(dataSF.bundleMessage).toEqual(
        `translated ${caseConf.edit_message.bundle} to ${caseConf.publish_language}`,
      );
      expect(dataSF.accessoryMessage).toEqual(
        `translated ${caseConf.edit_message.accessories} to ${caseConf.publish_language}`,
      );
    });
  });

  test(`@SB_SET_TL_89 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable Auto translate của Apps - Boots upsell`, async ({
    conf,
    authRequest,
    page,
    context,
  }) => {
    await dashboardPage.page.pause();
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;
    const appsAPI = new AppsAPI(suiteConf.domain, authRequest);
    const accessoriesData = suiteConf.accessories_offer.data;
    const bundleData = suiteConf.bundle_offer.data;
    const prePurchaseData = suiteConf.pre_purchase_offer.data;
    const quantityData = suiteConf.quantity_offer.data;
    const incartData = suiteConf.in_cart_offer.data;
    const postPurchaseData = suiteConf.post_purchase_offer.data;

    await test.step("Create offer", async () => {
      accessoryOfferID = (await appsAPI.createNewUpsellOffer(accessoriesData)).id;
      bundleOfferID = (await appsAPI.createNewUpsellOffer(bundleData)).id;
      prePurchaseOfferID = (await appsAPI.createNewUpsellOffer(prePurchaseData)).id;
      quantityOfferID = (await appsAPI.createNewUpsellOffer(quantityData)).id;
      incartOfferID = (await appsAPI.createNewUpsellOffer(incartData)).id;
      postPurchaseOfferID = (await appsAPI.createNewUpsellOffer(postPurchaseData)).id;
    });

    await test.step("Enable auto translate ở Apps  > Mở màn Boots upsell Translation   > Mở droplist Offer name", async () => {
      await dashboardPage.goToTranslationDetailScreen("Published languages", caseConf.publish_language, "Boost upsell");
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${caseConf.publish_language} Translation`,
      );
      //Mở droplist offer
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.inputOffer).click();
      expect(await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).count()).toEqual(
        6,
      );
    });

    await test.step(`Mở droplist > chọn lần lượt từng offer của từng type`, async () => {
      await dashboardPage.goToTranslationDetailScreen("Published languages", caseConf.publish_language, "Boost upsell");

      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${incartData.offer_message} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${postPurchaseData.offer_message} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${accessoriesData.offer_message} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${bundleData.offer_message} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${prePurchaseData.offer_message} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${quantityData.offer_message} to ${caseConf.publish_language}`);
    });

    await test.step(`Thực hiện thêm / xóa Offer tại dashboard > Mở màn Offer Translation > Mở droplist`, async () => {
      //checked above case SB_SET_TL_90
    });

    await test.step(`DB menu Apps > Offers > Thực hiện edit content offer - Mở màn offer Translation của offer A đã edit`, async () => {
      //edit content offer
      incartData.offer_message = caseConf.edit_message.in_cart;
      await appsAPI.updateOffer(incartOfferID, incartData);

      accessoriesData.offer_message = caseConf.edit_message.accessories;
      await appsAPI.updateOffer(accessoryOfferID, accessoriesData);

      bundleData.offer_message = caseConf.edit_message.bundle;
      await appsAPI.updateOffer(bundleOfferID, bundleData);

      prePurchaseData.offer_message = caseConf.edit_message.pre_purchase;
      await appsAPI.updateOffer(prePurchaseOfferID, prePurchaseData);

      quantityData.offer_message = caseConf.edit_message.quantity;
      await appsAPI.updateOffer(quantityOfferID, quantityData);

      postPurchaseData.offer_message = caseConf.edit_message.post_purchase;
      await appsAPI.updateOffer(postPurchaseOfferID, postPurchaseData);

      //Mở màn offer Translation của offer A đã edit
      await dashboardPage.goToTranslationDetailScreen("Published languages", caseConf.publish_language, "Boost upsell");

      //check dashboard
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`translated ${caseConf.edit_message.in_cart} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, false))
          .destination,
      ).toEqual(`translated ${caseConf.edit_message.post_purchase} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`translated ${caseConf.edit_message.accessories} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`translated ${caseConf.edit_message.bundle} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`translated ${caseConf.edit_message.pre_purchase} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`translated ${caseConf.edit_message.quantity} to ${caseConf.publish_language}`);

      // check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();

      expect(dataSF.postPurchaseMessage).toEqual(
        `translated ${caseConf.edit_message.post_purchase} to ${caseConf.publish_language}`,
      );
      expect(dataSF.quantityMessage).toEqual(
        `translated ${caseConf.edit_message.quantity} to ${caseConf.publish_language}`,
      );
      expect(dataSF.prePurchaseMessage).toEqual(
        `translated ${caseConf.edit_message.pre_purchase} to ${caseConf.publish_language}`,
      );
      expect(dataSF.inCartMessage).toEqual(
        `translated ${caseConf.edit_message.in_cart} to ${caseConf.publish_language}`,
      );
      expect(dataSF.bundleMessage).toEqual(
        `translated ${caseConf.edit_message.bundle} to ${caseConf.publish_language}`,
      );
      expect(dataSF.accessoryMessage).toEqual(
        `translated ${caseConf.edit_message.accessories} to ${caseConf.publish_language}`,
      );
    });

    await test.step(`Thực hiện edit bản dịch > save > Reload lại page DB Translation `, async () => {
      //check dashoard
      await dashboardPage.editManualTranslation(incartData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(postPurchaseData.offer_name, caseConf.edit_manual, "Offer's message");
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, false))
          .destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(accessoriesData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(bundleData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(prePurchaseData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      await dashboardPage.editManualTranslation(quantityData.offer_name, caseConf.edit_manual);
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      // Check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();

      expect(dataSF.postPurchaseMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.quantityMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.prePurchaseMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.inCartMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.bundleMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.accessoryMessage).toEqual(`${caseConf.edit_manual}`);
    });

    await test.step(`Click Auto translate`, async () => {
      //check dashoard
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`${caseConf.edit_manual}`);

      //Check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await homePage.page.waitForSelector(
        `//div[contains(@class, 'block-qty-discount__title') and contains(text(), '${caseConf.edit_manual}')]`,
        { state: "visible" },
      );
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();

      expect(dataSF.postPurchaseMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.quantityMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.prePurchaseMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.inCartMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.bundleMessage).toEqual(`${caseConf.edit_manual}`);
      expect(dataSF.accessoryMessage).toEqual(`${caseConf.edit_manual}`);
    });

    await test.step(`Xóa Bản dịch manual > save - Ra ngoài SF > chọn ngôn ngữ tiếng German > mở Offer`, async () => {
      //check dashoard
      await dashboardPage.editManualTranslation(incartData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(postPurchaseData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, false))
          .destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(accessoriesData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(bundleData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(prePurchaseData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      await dashboardPage.editManualTranslation(quantityData.offer_name, "");
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, false)).destination,
      ).toEqual("");

      // Check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();

      expect(dataSF.postPurchaseMessage).toEqual(caseConf.edit_message.post_purchase);
      expect(dataSF.quantityMessage).toEqual(caseConf.edit_message.quantity);
      expect(dataSF.prePurchaseMessage).toEqual(caseConf.edit_message.pre_purchase);
      expect(dataSF.inCartMessage).toEqual(caseConf.edit_message.in_cart);
      expect(dataSF.bundleMessage).toEqual(caseConf.edit_message.bundle);
      expect(dataSF.accessoryMessage).toEqual(caseConf.edit_message.accessories);
    });

    await test.step(`Click Auto translate`, async () => {
      //verify dashboard
      expect(
        (await dashboardPage.getDataOnTableByField(incartData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.in_cart} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(postPurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.post_purchase} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(accessoriesData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.accessories} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(bundleData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.bundle} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(prePurchaseData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.pre_purchase} to ${caseConf.publish_language}`);
      expect(
        (await dashboardPage.getDataOnTableByField(quantityData.offer_name, caseConf.field_name, true)).destination,
      ).toEqual(`translated ${caseConf.edit_message.quantity} to ${caseConf.publish_language}`);

      //Check SF
      const homePage = new SFHome(page, conf.suiteConf.domain);
      homePage.page = await context.newPage();
      await homePage.page.goto(`https://${conf.suiteConf.domain}/products/${suiteConf.target_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await homePage.page.waitForSelector(
        `//div[contains(@class, 'block-qty-discount__title') and contains(text(), 'translated')]`,
        { state: "visible" },
      );
      dataSF = await getDataOnSF(suiteConf.domain, suiteConf.target_ids, authRequest, caseConf.locale_info);
      await homePage.page.close();
      expect(dataSF.postPurchaseMessage).toEqual(
        `translated ${caseConf.edit_message.post_purchase} to ${caseConf.publish_language}`,
      );
      expect(dataSF.quantityMessage).toEqual(
        `translated ${caseConf.edit_message.quantity} to ${caseConf.publish_language}`,
      );
      expect(dataSF.prePurchaseMessage).toEqual(
        `translated ${caseConf.edit_message.pre_purchase} to ${caseConf.publish_language}`,
      );
      expect(dataSF.inCartMessage).toEqual(
        `translated ${caseConf.edit_message.in_cart} to ${caseConf.publish_language}`,
      );
      expect(dataSF.bundleMessage).toEqual(
        `translated ${caseConf.edit_message.bundle} to ${caseConf.publish_language}`,
      );
      expect(dataSF.accessoryMessage).toEqual(
        `translated ${caseConf.edit_message.accessories} to ${caseConf.publish_language}`,
      );
    });
  });
});
