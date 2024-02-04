import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { HiveSizeChart } from "@pages/hive/printbase/size_chart";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { ProducDetailV3 } from "@pages/new_ecom/storefront/product_page";
import { SFHome } from "@pages/storefront/homepage";
test.describe("Translation entity size guide POD", () => {
  let dashboardPage: TranslationDetail, hiveSizeChartPBase: HiveSizeChart, productPage: ProducDetailV3;
  test.beforeEach(async ({ dashboard, conf, hivePBase }, testInfo) => {
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    hiveSizeChartPBase = new HiveSizeChart(hivePBase, conf.suiteConf.hive_pb_domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });
  test(`@SB_SET_TL_107 [DB - UI/UX] Kiểm tra màn translate detail của store data -Online store - Size guide Printhhub, campaign printbase, pod plusbase`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const language = caseConf.language;
    const sizeGuide = caseConf.size_guide;
    if (process.env.CI_ENV === "dev") {
      await test.step(`Trong shop template, click vào 1 language > click vào details của Online store > Size guide`, async () => {
        await dashboardPage.goto(`admin/settings/language/${language.language_code}/edit?type=${caseConf.entity_type}`);
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

      //skip auto, chỉ test manual vì không kiểm soát được số lượng config trong hive
      // await test.step(`Kiểm tra droplist size guide`, async () => {
      //   // fill your code here
      // });

      await test.step(`Thực hiện search keyword không tồn tại`, async () => {
        await dashboardPage.searchSizeGuide(sizeGuide.not_exist);
        await expect(dashboardPage.genLoc(dashboardPage.xpathTD.searchBar.noResult)).toHaveText(
          `No result found for “${sizeGuide.not_exist}”`,
        );
      });

      await test.step(`Thực hiện search keyword có tồn tại`, async () => {
        for (const item of sizeGuide.exist) {
          await dashboardPage.searchSizeGuide(item.name);
          await dashboardPage.waitAbit(1000);
          const searchResult = await dashboardPage.getSizeGuideSearchResults();
          expect(searchResult).toEqual(expect.arrayContaining(item.expected_search_result));
        }
      });

      await test.step(`Kiểm tra các field`, async () => {
        for (const item of caseConf.size_guide_field) {
          await dashboardPage.searchSizeGuide(item.name);
          await dashboardPage.chooseSizeGuide(item.name);
          await dashboardPage.waitAbit(3000);
          const data = await dashboardPage.getTranslationDetailData();
          for (let i = 0; i < data.length; i++) {
            expect(data[i]).toEqual(
              expect.objectContaining({
                field: item.expected_field[i].field,
                destination: expect.objectContaining({
                  type: item.expected_field[i].destination_type,
                }),
              }),
            );
          }
        }
      });

      await test.step(`Kiểm tra icon các bản dịch`, async () => {
        await dashboardPage.searchSizeGuide(caseConf.size_guide_tooltip_auto_translate);
        await dashboardPage.chooseSizeGuide(caseConf.size_guide_tooltip_auto_translate);
        await dashboardPage.waitAbit(2000);
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: dashboardPage.xpathTD.translationTable.sizeGuide.textareaDescriptionInc,
          snapshotName: `${process.env.ENV}-auto-translate.png`,
        });

        await dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.sizeGuide.iconAutoTranslateTinymce).hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: dashboard,
          selector: dashboardPage.xpathTD.translationTable.tooltip,
          snapshotName: `${process.env.ENV}-tooltip-auto-traslate.png`,
        });
      });
    }
  });

  test(`@SB_SET_TL_106 [DB+SF - Function]  Kiểm tra tính năng auto translate khi Enable auto translate Online store - Size guide Printbase, POD trong shop template`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const language = caseConf.language;
    let dataSizeChartInHive: { descriptionHtml: string; descriptionInc: string };

    if (process.env.CI_ENV === "dev") {
      await test.step(`Get data description size chart base product POD`, async () => {
        await hiveSizeChartPBase.goto(`/admin/app/pbasesizechart/${conf.suiteConf.chart_id}/edit`);
        dataSizeChartInHive = await hiveSizeChartPBase.getDescriptionSizeChart();
      });

      await test.step(`Enable auto translate ở Online store shop template > Mở màn Size guideTranslation > Mở droplist Size guide`, async () => {
        await dashboardPage.goToLanguageDetail(language.status, language.name);
        await dashboardPage.switchToggleAutoTranslate("Online store", true);
        await dashboardPage.clickEntityDetail(caseConf.entity);
        await dashboardPage.genLoc(dashboardPage.xpathTD.searchBar.sizeGuide.input).click();

        // kiểm tra data của 1 size chart (size guide)
        await dashboardPage.searchSizeGuide(conf.suiteConf.size_chart);
        await dashboardPage.chooseSizeGuide(conf.suiteConf.size_chart);
        await dashboardPage.waitAbit(3000); //khi select size guide thì cần đợi 1 chút để load hết các field
        await dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn).click();
        const data = await dashboardPage.getTranslationDetailData();

        for (const item of data) {
          if (item.field === "Description Inc") {
            expect(item.source.value).toEqual(dataSizeChartInHive.descriptionInc);
          }
        }
        const descriptionInc = data.find(item => item.field === "Description Inc");
        expect(descriptionInc.destination.value).toEqual(conf.suiteConf.expected_translation.target_value);
      });
    }

    await test.step(`Kiểm tra bản dịch của size guide tại trang product detail ngoài SF`, async () => {
      for (const shop of conf.suiteConf.storefront) {
        const homePage = new SFHome(page, shop.domain);
        productPage = new ProducDetailV3(page, shop.domain);
        await homePage.goto(`https://${shop.domain}`);
        await homePage.page.waitForLoadState("networkidle");
        await homePage.chooseCountryAndLanguageOnSF(caseConf.choose_language_sf);

        await homePage.goto(`https://${shop.domain}/products/${shop.product_handle}`);
        await homePage.page.waitForLoadState("networkidle");
        await homePage.page.waitForSelector(productPage.xpathBlockRating);
        await homePage.genLoc(productPage.btnSizeChart).click();
        await homePage.waitAbit(3000); //đợi hiện popup size chart ổn định để chụp ảnh

        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: productPage.popupSizeChart,
          snapshotName: `${process.env.ENV}-popup-size-chart-after-auto-translate.png`,
        });
      }
    });
  });
});
