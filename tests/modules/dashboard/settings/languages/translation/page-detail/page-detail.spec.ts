import { expect, test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { waitTimeout } from "@core/utils/api";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { SFHome } from "@pages/storefront/homepage";
import { AccountPage } from "@pages/dashboard/accounts";

test.describe("Automate testcase for entity pages(feature translation)", () => {
  let dashboardPage: TranslationDetail;
  let otherPageAPI: OtherPage;
  let accountPage: AccountPage;
  let pageInfo;
  let accessToken: string;
  let pageDataSF;
  let dashboardDataTranslated;

  const setDataFillTranslationDetails = async (conf, data) => {
    conf.suiteConf.data_fill_dashboard[0].inputData = data.title;
    conf.suiteConf.data_fill_dashboard[1].inputData = data.description;
    conf.suiteConf.data_fill_dashboard[2].inputData = data.meta_description;
    conf.suiteConf.data_fill_dashboard[3].inputData = data.meta_title;
    return conf.suiteConf.data_fill_dashboard;
  };

  const createPageAPI = async (pageData, conf, token, page) => {
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    otherPageAPI = new OtherPage(page, conf.suiteConf.domain);
    otherPageAPI.setAccessToken(accessToken);
    conf.suiteConf.pageJson.body_html = pageData.description;
    conf.suiteConf.pageJson.title = pageData.title;
    conf.suiteConf.pageJson.search_engine_meta_description = pageData.meta_description;
    conf.suiteConf.pageJson.search_engine_title = pageData.meta_title;

    pageInfo = await otherPageAPI.createPage(conf.suiteConf.pageJson);
    return pageInfo;
  };

  const editPageManual = async (conf, page, dataEdit, originPage) => {
    otherPageAPI = new OtherPage(page, conf.suiteConf.domain);

    await otherPageAPI.goToUrlPath();
    await page.locator(otherPageAPI.xpathPageByName(originPage)).click();

    await page.locator(otherPageAPI.getTextboxOnPageDetail("Title")).fill(dataEdit.title);
    await page.locator(otherPageAPI.getTextboxOnPageDetail("Page title")).fill(dataEdit.meta_title);
    await page
      .frameLocator(otherPageAPI.xpathTextAreaFrame)
      .locator(otherPageAPI.xpathAreaDescription)
      .fill(dataEdit.description);
    await page.locator(otherPageAPI.descriptionPageTextArea).fill(dataEdit.meta_description);

    await page.locator(otherPageAPI.buttonSavePageDetail).click();
    await page.waitForSelector("//div[contains(text(),'updated')]", { state: "visible" });
    await page.waitForSelector("//div[contains(text(),'updated')]", { state: "hidden" });
  };

  test.beforeEach("Login shop & set language", async ({ conf, account, page }) => {
    await test.step("Login Shop", async () => {
      accountPage = new AccountPage(account, conf.suiteConf.accounts_domain);
      await accountPage.selectShopByName(conf.suiteConf.shop_name);
    });

    await test.step("Delete all page", async () => {
      otherPageAPI = new OtherPage(page, conf.suiteConf.domain);
      otherPageAPI.setAccessToken(accessToken);
      await otherPageAPI.deleteAllPages();
    });

    await test.step("Setting ngôn ngữ tiếng Đức (German), trạng thái published; ngôn ngữ tiếng Pháp (France), trạng thái unpublished", async () => {
      dashboardPage = new TranslationDetail(account, conf.suiteConf.domain);
      await dashboardPage.chooseLanguageDefault(conf.suiteConf.default_language);
      await dashboardPage.setLanguageStatus(conf.suiteConf.publish_language, "Publish");
      await dashboardPage.setLanguageStatus(conf.suiteConf.unpublish_language, "Unpublish");
    });
  });

  test(`@SB_SET_TL_82 [DB - UI/UX] Kiểm tra màn translate detail của store data - Pages - Page details`, async ({
    conf,
    snapshotFixture,
    token,
  }) => {
    await test.step("Pre-condition: Create Page", async () => {
      for (const pageData of conf.caseConf.page_data) {
        await createPageAPI(pageData, conf, token, dashboardPage.page);
      }
    });

    await test.step("Click vào details của Pages - Page details", async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.suiteConf.publish_language,
        "Page details",
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

    await test.step(`Kiểm tra droplist pages`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).click();
      await waitTimeout(2000);
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-82-translation-detail.png`,
      });
    });

    await test.step(`Thực hiện search keyword không tồn tại`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).fill(conf.caseConf.invalid_value);

      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.xpathNotFound)).toBeVisible();
    });

    await test.step(`Thực hiện search keyword có tồn tại`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).fill(conf.caseConf.valid_value);
      const numberOfResult = await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown)
        .count();
      for (let i = 0; i < numberOfResult; i++) {
        await expect(
          dashboardPage.page.locator(`(${dashboardPage.xpathTD.searchBar.valueOptionOnDropdown})[${i + 1}]`),
        ).toContainText(conf.caseConf.valid_value);
      }
    });

    await test.step(`Chọn lần lượt các Page theo data >  Kiểm tra các field`, async () => {
      for (const page of conf.caseConf.page_data) {
        await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).fill(page.title);
        await expect(dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown)).toHaveText(
          page.title,
        );
        await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).click();

        for (const showField of page.show_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(showField))).toBeVisible();
        }
        for (const hideField of page.hide_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(hideField))).toBeHidden();
        }
      }
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-82-icon-auto.png`,
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
        snapshotName: `${process.env.ENV}-82-icon-manual.png`,
      });
    });

    await test.step(`Kiểm tra UI edit bản dịch`, async () => {
      //1. Thêm text vào text field - checked above
      //2. Thêm text nhiều vào text editor
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel("Content"))
        .fill(conf.caseConf.more_characters);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-82-more-characters.png`,
      });
    });
  });

  test(`@SB_SET_TL_100 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable Auto translate Pages`, async ({
    conf,
    snapshotFixture,
    page,
    token,
  }) => {
    const homePage = new SFHome(page, conf.suiteConf.domain);
    otherPageAPI = new OtherPage(page, conf.suiteConf.domain);
    const dataAutoTranslation = conf.caseConf.auto_translation_data;
    const dataPageEdit = conf.caseConf.page_data_edit;
    const dataEditDashboardManual = conf.caseConf.edit_dashboard_translation;

    await test.step(`Pre-condition: set publish language`, async () => {
      await dashboardPage.setLanguageStatus(conf.caseConf.publish_language, "Publish");
    });

    await test.step("Pre-condition: Create page", async () => {
      for (const pageData of conf.caseConf.page_data) {
        await createPageAPI(pageData, conf, token, dashboardPage.page);
      }
    });

    await test.step("Enable auto translate ở Products > Mở màn pages Translation   > Mở droplist page ", async () => {
      //Enable auto translate ở Products
      await dashboardPage.openLanguageDetail("Published languages", conf.caseConf.publish_language);
      await dashboardPage.switchToggleAutoTranslate("Pages", true);
      //Mở màn pages Translation
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.caseConf.publish_language,
        "Page details",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );
      //Mở droplist page
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).click();
      await waitTimeout(2000);
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-100-translation-detail.png`,
      });
    });

    await test.step(`Thực hiện thêm / xóa / đổi tên page tại dashboard > Mở màn pages Translation > Mở droplist`, async () => {
      //Thực hiện thêm / xóa / đổi tên page tại dashboard
      await editPageManual(conf, dashboardPage.page, dataPageEdit, conf.caseConf.page_data[1].title);
      await otherPageAPI.goToUrlPath();
      await dashboardPage.page.locator(otherPageAPI.getButtonDeleteOfPage(conf.caseConf.page_data[2].title)).click();
      await dashboardPage.page.locator(otherPageAPI.getButtonOfPopup(2)).click();
      // Mở màn page Translation > Mở droplist
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.caseConf.publish_language,
        "Page details",
      );
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).click();
      await waitTimeout(1000); //wait for search result
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-100-edit-page-title.png`,
      });
    });

    await test.step(`Thực hiện edit content  page B > Mở màn pages Translation của page đã edit > đợi đến khi thông báo translating biến mất`, async () => {
      //Thực hiện edit content  page B - edited above
      //Mở màn pages Translation của page đã edit
      await dashboardPage.choosePage(`${dataPageEdit.title} `);
      //đợi đến khi thông báo translating biến mất
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      //verify dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-100-auto-translate-page-data.png`,
      });
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify SF
      await homePage.page.goto(`https://${conf.suiteConf.domain}/pages/${dataPageEdit.handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000);
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;

      expect(pageDataSF.body_html).toContain(dashboardDataTranslated[1].destination.value);
      expect(pageDataSF.title).toEqual(dashboardDataTranslated[0].destination.value);
      expect(pageDataSF.meta_title).toEqual(dashboardDataTranslated[2].destination.value);
      expect(pageDataSF.meta_description).toEqual(dashboardDataTranslated[3].destination.value);
    });

    await test.step(`Thực hiện edit bản dịch > save > reload`, async () => {
      await dashboardPage.fillTranslationDetails(await setDataFillTranslationDetails(conf, dataEditDashboardManual));
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();

      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();
      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(dataEditDashboardManual.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(dataEditDashboardManual.description);
      expect(dashboardDataTranslated[2].destination.value).toEqual(dataEditDashboardManual.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(dataEditDashboardManual.meta_description);
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" }); //reload to apply setting on dashboard
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;

      expect(pageDataSF.body_html).toContain(dataEditDashboardManual.description);
      expect(pageDataSF.title).toEqual(dataEditDashboardManual.title);
      expect(pageDataSF.meta_title).toEqual(dataEditDashboardManual.meta_title);
      expect(pageDataSF.meta_description).toEqual(dataEditDashboardManual.meta_description);
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000);
      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(dataEditDashboardManual.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(dataEditDashboardManual.description);
      expect(dashboardDataTranslated[2].destination.value).toEqual(dataEditDashboardManual.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(dataEditDashboardManual.meta_description);
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" }); //reload to apply setting on dashboard
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;

      expect(pageDataSF.body_html).toContain(dataEditDashboardManual.description);
      expect(pageDataSF.title).toEqual(dataEditDashboardManual.title);
      expect(pageDataSF.meta_title).toEqual(dataEditDashboardManual.meta_title);
      expect(pageDataSF.meta_description).toEqual(dataEditDashboardManual.meta_description);
    });

    await test.step(`Xóa Bản dịch manual > save  > reload - Ra ngoài SF > chọn ngôn ngữ tiếng Vietnamese > page A`, async () => {
      //Xóa Bản dịch manual > save  > reload
      await dashboardPage.fillTranslationDetails(await setDataFillTranslationDetails(conf, conf.caseConf.blank_data));
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual("");
      expect(dashboardDataTranslated[1].destination.value).toEqual("");
      expect(dashboardDataTranslated[2].destination.value).toEqual("");
      expect(dashboardDataTranslated[3].destination.value).toEqual("");
      //verify SF
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;

      expect(pageDataSF.body_html).toContain(dataPageEdit.description);
      expect(pageDataSF.title).toEqual(dataPageEdit.title);
      expect(pageDataSF.meta_title).toEqual(dataPageEdit.meta_title);
      expect(pageDataSF.meta_description).toEqual(dataPageEdit.meta_description);
    });

    await test.step(`(DB Translation đang rỗng)Click button Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000);
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(dataAutoTranslation.title);
      expect(dashboardDataTranslated[1].destination.value).toEqual(
        `translated <p>${conf.caseConf.page_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(dataAutoTranslation.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(dataAutoTranslation.meta_description);
      //verify SF
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait SF apply data
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;

      expect(pageDataSF.body_html).toContain(
        `translated <p>${conf.caseConf.page_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(pageDataSF.title).toEqual(dataAutoTranslation.title);
      expect(pageDataSF.meta_title).toEqual(dataAutoTranslation.meta_title);
      expect(pageDataSF.meta_description).toEqual(dataAutoTranslation.meta_description);
    });
  });

  test(`@SB_SET_TL_99 [DB+SF - Function] Kiểm tra tính năng Disable auto translate khi Disable auto translate Pages - Page details`, async ({
    conf,
    token,
    snapshotFixture,
    page,
  }) => {
    const homePage = new SFHome(page, conf.suiteConf.domain);
    otherPageAPI = new OtherPage(page, conf.suiteConf.domain);
    const dataAutoTranslation = conf.caseConf.auto_translation_data;
    const dataPageEdit = conf.caseConf.page_data_edit;
    const dataEditDashboardManual = conf.caseConf.edit_dashboard_translation;

    await test.step(`Pre-condition: set publish language`, async () => {
      await dashboardPage.setLanguageStatus(conf.caseConf.publish_language, "Publish");
    });

    await test.step("Pre-condition: Create page", async () => {
      for (const pageData of conf.caseConf.page_data) {
        await createPageAPI(pageData, conf, token, dashboardPage.page);
      }
    });

    await test.step("Disable auto translate ở Products > Mở màn pages Translation   > Mở droplist page ", async () => {
      //Enable auto translate ở Products
      await dashboardPage.openLanguageDetail("Published languages", conf.caseConf.publish_language);
      await dashboardPage.switchToggleAutoTranslate("Pages", false);
      //Mở màn pages Translation
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.caseConf.publish_language,
        "Page details",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );
      //Mở droplist page
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).click();
      await waitTimeout(1000); //wait for load search result
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-99-translation-detail.png`,
      });
    });

    await test.step(`Thực hiện thêm / xóa / đổi tên page tại dashboard > Mở màn pages Translation > Mở droplist`, async () => {
      //Thực hiện thêm / xóa / đổi tên page tại dashboard
      await editPageManual(conf, dashboardPage.page, dataPageEdit, conf.caseConf.page_data[1].title);
      await otherPageAPI.goToUrlPath();
      await dashboardPage.page.locator(otherPageAPI.getButtonDeleteOfPage(conf.caseConf.page_data[2].title)).click();
      await dashboardPage.page.locator(otherPageAPI.getButtonOfPopup(2)).click();
      // Mở màn page Translation > Mở droplist
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        conf.caseConf.publish_language,
        "Page details",
      );
      const isCloseButtonEnabled = await dashboardPage.page.locator(dashboardPage.xpathTD.closeAlertButton).isVisible({
        timeout: 3000,
      });
      if (isCloseButtonEnabled) {
        await dashboardPage.page.locator(dashboardPage.xpathTD.closeAlertButton).click();
      }
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).click();
      await waitTimeout(1000); //wait for load search result
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-99-edit-page-title.png`,
      });
    });

    await test.step(`Thực hiện edit content  Page details A tại dashboard > Mở màn Page details Translation của Page details đã edit`, async () => {
      //Thực hiện edit content  page B - edited above
      //Mở màn pages Translation của page đã edit
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.page.input).fill(`${dataPageEdit.title} `);
      await waitTimeout(2000);
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).click();

      //verify dashboard
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-99-auto-translate-page-data.png`,
      });
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();
      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(dataAutoTranslation.title);
      expect(dashboardDataTranslated[1].destination.value).toContain(
        `translated <p>${conf.caseConf.page_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(dataAutoTranslation.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(dataAutoTranslation.meta_description);
      //verify SF
      await homePage.page.goto(`https://${conf.suiteConf.domain}/pages/${dataPageEdit.handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000);
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;
      expect(pageDataSF.body_html).toContain(
        `translated <p>${conf.caseConf.page_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(pageDataSF.title).toEqual(dataAutoTranslation.title);
      expect(pageDataSF.meta_title).toEqual(dataAutoTranslation.meta_title);
      expect(pageDataSF.meta_description).toEqual(dataAutoTranslation.meta_description);
    });

    await test.step(`Thực hiện edit bản dịch > save > Click Auto translate`, async () => {
      await dashboardPage.fillTranslationDetails(await setDataFillTranslationDetails(conf, dataEditDashboardManual));
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();
      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(dataEditDashboardManual.title);
      expect(dashboardDataTranslated[1].destination.value).toContain(dataEditDashboardManual.description);
      expect(dashboardDataTranslated[2].destination.value).toEqual(dataEditDashboardManual.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(dataEditDashboardManual.meta_description);
      //verify SF
      await homePage.page.reload({ waitUntil: "networkidle" }); //reload to apply setting on dashboard
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;

      expect(pageDataSF.body_html).toContain(dataEditDashboardManual.description);
      expect(pageDataSF.title).toEqual(dataEditDashboardManual.title);
      expect(pageDataSF.meta_title).toEqual(dataEditDashboardManual.meta_title);
      expect(pageDataSF.meta_description).toEqual(dataEditDashboardManual.meta_description);
    });

    await test.step(`Xóa Bản dịch manual > save  > reload - Ra ngoài SF > chọn ngôn ngữ tiếng Vietnamese > page A`, async () => {
      //Xóa Bản dịch manual > save  > reload
      await dashboardPage.fillTranslationDetails(await setDataFillTranslationDetails(conf, conf.caseConf.blank_data));
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await dashboardPage.page.reload();
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual("");
      expect(dashboardDataTranslated[1].destination.value).toEqual("");
      expect(dashboardDataTranslated[2].destination.value).toEqual("");
      expect(dashboardDataTranslated[3].destination.value).toEqual("");
      //verify SF
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      await waitTimeout(2000); //wait for SF apply data
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;

      expect(pageDataSF.body_html).toContain(dataPageEdit.description);
      expect(pageDataSF.title).toEqual(dataPageEdit.title);
      expect(pageDataSF.meta_title).toEqual(dataPageEdit.meta_title);
      expect(pageDataSF.meta_description).toEqual(dataPageEdit.meta_description);
    });

    await test.step(`(DB Translation đang rỗng)Click button Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(dataAutoTranslation.title);
      expect(dashboardDataTranslated[1].destination.value).toContain(
        `translated <p>${conf.caseConf.page_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(dashboardDataTranslated[2].destination.value).toEqual(dataAutoTranslation.meta_title);
      expect(dashboardDataTranslated[3].destination.value).toEqual(dataAutoTranslation.meta_description);
      //verify SF
      await homePage.chooseCountryAndLanguageOnSF(conf.caseConf.language_global_switcher);
      pageDataSF = (await otherPageAPI.getPageDataOnSF(dataPageEdit.handle, conf.caseConf.locale_info)).result.page;

      expect(pageDataSF.body_html).toContain(
        `translated <p>${conf.caseConf.page_data_edit.description}</p> to ${conf.caseConf.publish_language}`,
      );
      expect(pageDataSF.title).toEqual(dataAutoTranslation.title);
      expect(pageDataSF.meta_title).toEqual(dataAutoTranslation.meta_title);
      expect(pageDataSF.meta_description).toEqual(dataAutoTranslation.meta_description);
    });
  });
});
