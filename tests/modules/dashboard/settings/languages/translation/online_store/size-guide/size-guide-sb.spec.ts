import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { SizeChartPage } from "@pages/dashboard/products/size_chart";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { ProducDetailV3 } from "@pages/new_ecom/storefront/product_page";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Translation entity size guide shopbase", () => {
  let dashboardPage: TranslationDetail, sizeChartPage: SizeChartPage, productPage: ProducDetailV3, language;

  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    sizeChartPage = new SizeChartPage(dashboard, conf.suiteConf.domain, authRequest);
    language = conf.caseConf.language;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages([language.name]);
      await dashboardPage.waitUntilMessHidden();
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLangList.languageItemByName(language.status, language.name)),
      ).toBeVisible();

      await dashboardPage.openLanguageDetail(language.status, language.name);
      for (const item of conf.caseConf.block) {
        await dashboardPage.switchToggleAutoTranslate(item.name, item.status);
      }
    });
  });

  test(`@SB_SET_TL_70 [DB - UI/UX] Kiểm tra màn translate detail của store data -Online store - Size guide`, async ({
    conf,
    snapshotFixture,
    dashboard,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    const sizeGuide = caseConf.size_guide;
    const timeStamp = Date.now();
    const newStyle = `${conf.suiteConf.size_guide_outdate.name}${timeStamp}`;

    const listSizeChart = await sizeChartPage.getListSizeChartsByAPI();
    await test.step(`Click vào details của Online store - Size guide`, async () => {
      await dashboardPage.clickEntityDetail(caseConf.entity);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.fieldColumn);
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(conf.caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });

      await expect(
        dashboardPage.genLoc(dashboardPage.xpathLD.titleLanguageDetail(language.title_entity_detail_page)).first(),
      ).toBeVisible();
      await expect(
        dashboardPage
          .genLoc(dashboardPage.xpathTD.translationTable.heading.languageColumn(caseConf.default_language))
          .first(),
      ).toBeVisible();
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.languageColumn(language.name)).first(),
      ).toBeVisible();
    });

    await test.step(`Kiểm tra droplist pages`, async () => {
      const droplistPages = await dashboardPage.getDropListPagesOptions();
      expect(droplistPages).toEqual(expect.arrayContaining(dashboardPage.dropListPages));
    });

    await test.step(`Kiểm tra droplist size guide `, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathTD.searchBar.sizeGuide.input).click();
      const searchResult = await dashboardPage.getSizeGuideSearchResults();
      expect(searchResult.length).toEqual(listSizeChart.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listSizeChart[i].style);
      }
    });

    await test.step(`Thực hiện search keyword không tồn tại`, async () => {
      await dashboardPage.searchSizeGuide(sizeGuide.not_exist);
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.searchBar.noResult)).toHaveText(
        `No result found for “${sizeGuide.not_exist}”`,
      );
    });

    await test.step(`Thực hiện search keyword có tồn tại`, async () => {
      await dashboardPage.searchSizeGuide(sizeGuide.exist);
      const searchResult = await dashboardPage.getSizeGuideSearchResults();
      expect(searchResult).toEqual(expect.arrayContaining(sizeGuide.expected_search_result));
    });

    await test.step(`Kiểm tra các field`, async () => {
      for (const item of caseConf.size_guide_field) {
        await dashboardPage.searchSizeGuide(item.name);
        await dashboardPage.chooseSizeGuide(item.name);
        await dashboardPage.waitAbit(3000);
        for (const fieldItem of item.expected_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(fieldItem))).toBeVisible();
        }
      }
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      await dashboardPage.searchSizeGuide(caseConf.size_guide_tooltip_auto_translate);
      await dashboardPage.chooseSizeGuide(caseConf.size_guide_tooltip_auto_translate);
      // icon auto translate
      await dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.sizeGuide.iconAutoTranslateTinymce).hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.tooltip,
        snapshotName: `${process.env.ENV}-tooltip-auto-traslate.png`,
      });

      // manual translate
      for (const field of caseConf.edit_manual_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: 0,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });

      await dashboardPage.waitAbit(3000); //đợi load xong data size chart
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: `${process.env.ENV}-icon-edit-translation.png`,
      });

      // icon outdate translation
      await dashboardPage.genLoc(dashboardPage.xpathLD.btnBack).click();
      await dashboardPage.switchToggleAutoTranslate("Online store", false);
      await dashboardPage.goto(`admin/size-chart/edit/${conf.suiteConf.size_guide_outdate.chart_id}`);
      await dashboardPage.waitAbit(2000); // đợi load ra field style để edit
      await dashboardPage.page.getByPlaceholder("Size chart style").fill(newStyle);
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage("Updated Success")).toBeVisible();
      await dashboardPage.toastWithMessage("Updated Success").waitFor({ state: "hidden" });
      await dashboardPage.goToTranslationDetailScreen(language.status, language.name, caseConf.entity);

      await dashboardPage.searchSizeGuide(newStyle);
      await dashboardPage.chooseSizeGuide(newStyle);

      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.iconTranslate(caseConf.field_name_check_outdate_icon))
        .hover();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.tooltip,
        snapshotName: `${process.env.ENV}-tooltip-outdate.png`,
      });
    });
  });

  test(`@SB_SET_TL_87 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable auto translate Online store - Size guide`, async ({
    conf,
    snapshotFixture,
    dashboard,
    context,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    let editChartResult, chartResult, dataStyle: string;
    const caseConf = conf.caseConf;
    const timeStamp = Date.now();
    const storefront = await context.newPage();

    await test.step(`Pre-condition: chuẩn bị data size chart để edit original content`, async () => {
      const editChart = { shop_id: conf.suiteConf.shop_id, ...conf.suiteConf.precondition_edit_chart };
      chartResult = await sizeChartPage.editSizeChartByAPI(editChart);
    });

    await test.step(`Enable auto translate ở Online store > Mở màn Size guide Translation > Mở droplist Size guide`, async () => {
      const listSizeChart = await sizeChartPage.getListSizeChartsByAPI();
      await dashboardPage.clickEntityDetail(caseConf.entity);
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translationTable.heading.fieldColumn);
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });
      await dashboardPage.genLoc(dashboardPage.xpathTD.searchBar.sizeGuide.input).click();
      const searchResult = await dashboardPage.getSizeGuideSearchResults();

      expect(searchResult.length).toEqual(listSizeChart.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listSizeChart[i].style);
      }

      // kiểm tra data của 1 size chart (size guide)
      await dashboardPage.searchSizeGuide(caseConf.data_translation.size_guide);
      await dashboardPage.chooseSizeGuide(caseConf.data_translation.size_guide);
      await dashboardPage.waitAbit(5000); //chờ load xong data sc, ảnh trong description thường load chậm

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: `${process.env.ENV}-data-size-chart-${conf.caseName}.png`,
      });
    });

    await test.step(`Thực hiện thêm / xóa Size Chart tại dashboard > Mở màn Size Chart Translation > Mở droplist`, async () => {
      const addChart = {
        style: `${caseConf.add_size_chart.style}${timeStamp}`,
        description_html: caseConf.add_size_chart.description_html,
      };

      // thêm size chart -> verify hiển thị thêm size chart ở màn detail entity
      const addChartResult = await sizeChartPage.addSizeChartByAPI(addChart);
      const listSizeChartAfter = await sizeChartPage.getListSizeChartsByAPI();
      await dashboardPage.page.reload();
      await dashboardPage.page.waitForLoadState("domcontentloaded");

      await dashboardPage.genLoc(dashboardPage.xpathTD.searchBar.sizeGuide.input).click();
      const searchResult = await dashboardPage.getSizeGuideSearchResults();
      expect(searchResult.length).toEqual(listSizeChartAfter.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listSizeChartAfter[i].style);
      }

      // xóa size guide (size chart) trong admin/size-chart -> verify không hiện size guide đã xóa
      await sizeChartPage.gotoSizeChart("admin/size-chart");
      await sizeChartPage.searchAndDeleteSizecharts(addChartResult.style);
      const listSizeChartAfterRemoveChart = await sizeChartPage.getListSizeChartsByAPI();
      await dashboardPage.goToTranslationDetailScreen(language.status, language.name, caseConf.entity);
      await dashboardPage.genLoc(dashboardPage.xpathTD.searchBar.sizeGuide.input).click();
      const searchResultAfter = await dashboardPage.getSizeGuideSearchResults();
      expect(searchResultAfter.length).toEqual(listSizeChartAfterRemoveChart.length);
      for (let i = 0; i < searchResultAfter.length; i++) {
        expect(searchResultAfter[i]).toEqual(listSizeChartAfterRemoveChart[i].style);
      }
    });

    await test.step(`- DB menu products > Size Charts > Thực hiện edit content Size guide.
    - Mở màn Size guide Translation của Size guide A đã edit`, async () => {
      await dashboardPage.searchSizeGuide(chartResult.style);
      await dashboardPage.chooseSizeGuide(chartResult.style);
      await dashboardPage.waitAbit(3000); //khi select size guide thì cần đợi 1 chút để load hết các field

      await dashboardPage.waitForTranslationAfterEditContent(caseConf.retry, chartResult.style);
      await dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn).click();
      await dashboardPage.waitAbit(3000); //đợi load hết bản dịch

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: `${process.env.ENV}-sc-before-edit-original-content-${conf.caseName}.png`,
      });

      // edit size chart tại admin
      const editChart = { shop_id: conf.suiteConf.shop_id, ...conf.suiteConf.edit_chart };
      editChartResult = await sizeChartPage.editSizeChartByAPI(editChart);

      // verify original content và bản dịch ở màn detail entity
      await dashboardPage.page.reload();
      await dashboardPage.page.waitForLoadState("domcontentloaded");
      await dashboardPage.searchSizeGuide(editChartResult.style);
      await dashboardPage.chooseSizeGuide(editChartResult.style);
      await dashboardPage.waitAbit(5000);

      for (let i = 0; i < conf.caseConf.retry; i++) {
        dataStyle = await dashboardPage
          .genLoc(dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel("Style"))
          .inputValue();
        if (dataStyle === chartResult.style) {
          await dashboardPage.waitAbit(10 * 1000);
          await dashboardPage.page.reload();
          await dashboardPage.page.waitForLoadState("domcontentloaded");
          await dashboardPage.searchSizeGuide(editChartResult.style);
          await dashboardPage.chooseSizeGuide(editChartResult.style);
          await dashboardPage.waitAbit(3000);
        } else {
          break;
        }
      }

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: `${process.env.ENV}-sc-after-edit-original-content-${conf.caseName}.png`,
      });

      // verify bản dịch size chart (size guide) ở product detail

      const homePage = new SFHome(storefront, conf.suiteConf.domain);
      productPage = new ProducDetailV3(storefront, conf.suiteConf.domain);
      await homePage.goto(`https://${conf.suiteConf.domain}/products/${conf.suiteConf.product_handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(caseConf.choose_language_sf);

      await productPage.page.waitForSelector(productPage.xpathVariantPicker);
      await productPage.genLoc(productPage.btnSizeChart).click();
      await productPage.waitAbit(2000); //đợi hiện popup size chart ổn định để chụp ảnh

      for (let i = 0; i < 4; i++) {
        const chartTitle = await productPage.genLoc(productPage.xpathSizeChartTitle).innerText();
        if (chartTitle !== dataStyle) {
          await productPage.waitAbit(15 * 1000);
          await productPage.page.reload();
          await productPage.page.waitForLoadState("networkidle");
          await productPage.page.waitForSelector(productPage.xpathVariantPicker);
          await productPage.genLoc(productPage.btnSizeChart).click();
          await productPage.waitAbit(3000); //đợi load data popup sỉz chart
        } else {
          break;
        }
      }
      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-size-chart.png`,
      });
    });

    await test.step(`Thực hiện edit bản dịch > save`, async () => {
      for (const field of caseConf.edit_manual_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: 0,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });
      await productPage.waitAbit(2000);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: `${process.env.ENV}-sc-after-edit-translation-${conf.caseName}.png`,
      });

      // call api chart sf, kiểm tra update bản dịch manual
      await productPage.page.reload();
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page.waitForSelector(productPage.xpathVariantPicker);
      await productPage.genLoc(productPage.btnSizeChart).click();
      await productPage.waitAbit(3000); //đợi hiện popup size chart ổn định để chụp ảnh

      for (let i = 0; i < 4; i++) {
        const chartTitle = await productPage.genLoc(productPage.xpathSizeChartTitle).innerText();
        if (chartTitle !== caseConf.edit_manual_translate[0].content) {
          await productPage.waitAbit(15 * 1000);
          await productPage.page.reload();
          await productPage.page.waitForLoadState("networkidle");
          await productPage.page.waitForSelector(productPage.xpathVariantPicker);
          await productPage.genLoc(productPage.btnSizeChart).click();
          await productPage.waitAbit(3000); //đợi load data popup sỉz chart
        } else {
          break;
        }
      }

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-size-chart-when-manual-translate.png`,
      });
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();

      // đợi dịch xong, cần check lại vì dịch lâu
      await dashboardPage.page.waitForSelector(
        dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate),
      );
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });

      // verify bản dịch trong dashboard
      await dashboardPage.waitAbit(3000); //đợi page ổn định trước khi chụp ảnh

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: `${process.env.ENV}-sc-when-manual-translate-then-auto-translate-${conf.caseName}.png`,
      });

      // verify bản dịch ở sf
      await productPage.page.reload();
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page.waitForSelector(productPage.xpathVariantPicker);
      await productPage.genLoc(productPage.btnSizeChart).click();
      await productPage.waitAbit(3000); //đợi hiện popup size chart ổn định để chụp ảnh

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-size-chart-when-manual-translate-then-auto-translate.png`,
      });
    });

    await test.step(`Xóa Bản dịch manual > save
    Ra ngoài SF > chọn ngôn ngữ tiếng French >  mở product base A`, async () => {
      for (const field of caseConf.delete_translation) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: 0,
            fieldName: field.field_name,
          },
        });
      }

      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });

      await dashboardPage.waitAbit(3000); // đợi load hết các field của size chart
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: `${process.env.ENV}-remove-translation.png`,
      });

      // verify hiển thị original content khi trong dashboard xóa bản dịch
      await productPage.page.reload();
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page.waitForSelector(productPage.xpathVariantPicker);
      await productPage.genLoc(productPage.btnSizeChart).click();
      await productPage.waitAbit(3000); // đợi hiện popup size chart ổn định để chụp ảnh

      for (let i = 0; i < 4; i++) {
        const chartTitle = await productPage.genLoc(productPage.xpathSizeChartTitle).innerText();
        if (chartTitle !== editChartResult.style) {
          await productPage.waitAbit(15 * 1000);
          await productPage.page.reload();
          await productPage.page.waitForLoadState("networkidle");
          await productPage.page.waitForSelector(productPage.xpathVariantPicker);
          await productPage.genLoc(productPage.btnSizeChart).click();
          await productPage.waitAbit(3000); //đợi load data popup sỉz chart
        } else {
          break;
        }
      }

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-size-chart-when-remove-translation.png`,
      });
    });

    await test.step(`Click Auto translate`, async () => {
      const xpathAlertTranslateSuccessVisible = await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_translate_success))
        .isVisible();
      if (xpathAlertTranslateSuccessVisible) {
        await dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.iconCloseAlert).click();
        await expect(
          dashboardPage.genLoc(
            dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_translate_success),
          ),
        ).toBeHidden();
      }

      await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Auto translate")).click();

      // đợi dịch xong -> check lại có thể bị lâu
      await dashboardPage.page.waitForSelector(
        dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate),
      );
      await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.alertTranslate(caseConf.alert_text_in_translate))
        .waitFor({ state: "hidden", timeout: 180 * 1000 });

      // verify content được dịch theo original content
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathTD.translationTable.body,
        snapshotName: `${process.env.ENV}-sc-when-click-auto-translate-${conf.caseName}.png`,
      });
      dataStyle = await dashboardPage
        .genLoc(dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel("Style"))
        .inputValue();
      // verify hiển thị bản dịch theo language ở SF
      await productPage.page.reload();
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page.waitForSelector(productPage.xpathVariantPicker);
      await productPage.genLoc(productPage.btnSizeChart).click();
      await productPage.waitAbit(3000); // đợi hiện popup size chart ổn định để chụp ảnh

      for (let i = 0; i < 4; i++) {
        const chartTitle = await productPage.genLoc(productPage.xpathSizeChartTitle).innerText();
        if (chartTitle !== dataStyle) {
          await productPage.waitAbit(15 * 1000);
          await productPage.page.reload();
          await productPage.page.waitForLoadState("networkidle");
          await productPage.page.waitForSelector(productPage.xpathVariantPicker);
          await productPage.genLoc(productPage.btnSizeChart).click();
          await productPage.waitAbit(3000); //đợi load data popup sỉz chart
        } else {
          break;
        }
      }

      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: productPage.popupSizeChart,
        snapshotName: `${process.env.ENV}-popup-size-chart-when-auto-translate.png`,
      });
    });
  });
});
