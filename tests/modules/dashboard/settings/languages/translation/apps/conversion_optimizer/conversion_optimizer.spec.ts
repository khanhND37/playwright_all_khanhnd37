import { expect, test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { BoostConvertInsidePage } from "@pages/dashboard/apps/boost_convert/boost_convert_inside";

const verifyAutomationData = async (dashboardData, dataConfig) => {
  expect(dashboardData[0].source.value).toEqual(dataConfig.source.title);
  expect(dashboardData[1].source.value).toEqual(dataConfig.source.product_name);
  expect(dashboardData[2].source.value).toEqual(dataConfig.source.time);

  expect(dashboardData[0].destination.value).toEqual(dataConfig.destination.title);
  expect(dashboardData[1].destination.value).toEqual(dataConfig.destination.product_name);
  expect(dashboardData[2].destination.value).toEqual(dataConfig.destination.time);
};

test.describe("Automate testcase for entity apps - conversion(feature translation)", () => {
  let dashboardPage: TranslationDetail;
  let coptPage: BoostConvertInsidePage;
  let dashboardDataTranslated;

  test.beforeEach("Set data for shop", async ({ dashboard, conf, authRequest }) => {
    const suiteConf = conf.suiteConf;
    coptPage = new BoostConvertInsidePage(dashboard, suiteConf.domain, authRequest);

    await test.step("Login Shop", async () => {
      dashboardPage = new TranslationDetail(dashboard, suiteConf.domain);
    });
  });

  test(`@SB_SET_TL_91 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable auto translate Apps - Conversion optimizer - Sales notifications`, async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Pre-condition: edit content Sale notifiction`, async () => {
      await dashboardPage.goto("admin/apps/boost-convert/social-proof/popup-type");
      await dashboardPage.navigateToMenu("Pop types");
      await coptPage.editSalesNotifications(caseConf.data_pre_condition.source);
    });

    await test.step(`1. Enable auto translate ở Apps  > Mở màn Conversion optimizer Translation`, async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.publish_language,
        "Conversion optimizer",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language),
        ),
      ).toBeVisible();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.caseConf.publish_language),
        ),
      ).toBeVisible();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();

      let retry = 0;
      while (retry++ < 5) {
        await dashboardPage.page.reload({ waitUntil: "load" });
        await dashboardPage.page.waitForLoadState("networkidle");
        await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
        await dashboardPage.waitAbit(2000); //wait for dashboard apply data
        dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

        const isApplyData =
          dashboardDataTranslated[0].destination.value === caseConf.data_pre_condition.destination.title;
        if (isApplyData) {
          break;
        }
      }
      expect(dashboardDataTranslated[0].destination.value).toEqual(caseConf.data_pre_condition.destination.title);

      await verifyAutomationData(dashboardDataTranslated, caseConf.data_pre_condition);
    });

    await test.step(`2. DB menu Apps  >  Conversion optimizer  > Thực hiện edit Sales notifications - Mở màn  Conversion optimizer Translation của  Offer A đã edit`, async () => {
      //DB menu Apps  >  Conversion optimizer  > Thực hiện edit Sales notifications
      await dashboardPage.goto("admin/apps/boost-convert/social-proof/popup-type");
      await dashboardPage.navigateToMenu("Pop types");
      await coptPage.editSalesNotifications(caseConf.data_step_2.source);

      //Mở màn  Conversion optimizer Translation của  Offer A đã edit
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.publish_language,
        "Conversion optimizer",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );

      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      await verifyAutomationData(dashboardDataTranslated, caseConf.data_step_2);
    });

    await test.step(`3. Thực hiện edit bản dịch > save > Reload lại page DB Translation`, async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.publish_language,
        "Conversion optimizer",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );
      await dashboardPage.fillTranslationDetails([
        {
          inputDataType: "text",
          inputData: caseConf.edit_step_3,
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Title",
          },
        },
        {
          inputDataType: "text",
          inputData: caseConf.edit_step_3,
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Product name",
          },
        },
        {
          inputDataType: "text",
          inputData: caseConf.edit_step_3,
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Time",
          },
        },
      ]);

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue("English"))
        .click();
      await dashboardPage.clickBtnSave();
      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      expect(dashboardDataTranslated[0].destination.value).toEqual(caseConf.edit_step_3);
      expect(dashboardDataTranslated[1].destination.value).toEqual(caseConf.edit_step_3);
      expect(dashboardDataTranslated[2].destination.value).toEqual(caseConf.edit_step_3);
    });

    await test.step(`4. Click Auto translate`, async () => {
      //verify dashboard
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      expect(dashboardDataTranslated[0].destination.value).toEqual(caseConf.edit_step_3);
      expect(dashboardDataTranslated[1].destination.value).toEqual(caseConf.edit_step_3);
      expect(dashboardDataTranslated[2].destination.value).toEqual(caseConf.edit_step_3);
    });

    await test.step(`5. Xóa Bản dịch manual > save > Reload lại page DB Translation - Ra ngoài SF > chọn ngôn ngữ tiếng French >  mở Offer A`, async () => {
      //Xóa Bản dịch manual > save > Reload lại page DB Translation
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
          inputDataType: "text",
          inputData: "",
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Product name",
          },
        },
        {
          inputDataType: "text",
          inputData: "",
          searchCondition: {
            fieldIndex: 0,
            fieldName: "Time",
          },
        },
      ]);

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue("English"))
        .click();
      await dashboardPage.clickBtnSave();
      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      expect(dashboardDataTranslated[0].destination.value).toEqual("");
      expect(dashboardDataTranslated[1].destination.value).toEqual("");
      expect(dashboardDataTranslated[2].destination.value).toEqual("");
    });

    await test.step(`6. Click Auto translate`, async () => {
      //verify dashboard
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      await verifyAutomationData(dashboardDataTranslated, caseConf.data_step_2);
    });
  });

  test(`@SB_SET_TL_92 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable auto translate Apps - Conversion optimizer - Checkout notifications`, async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Pre-condition: edit content Checkout notifiction`, async () => {
      await dashboardPage.goto("admin/apps/boost-convert/social-proof/popup-type");
      await dashboardPage.navigateToMenu("Pop types");
      await coptPage.editCheckoutNotifications(caseConf.data_pre_condition);
    });

    await test.step(`1. Enable auto translate ở Apps  > Mở màn Conversion optimizer Translation`, async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.publish_language,
        "Conversion optimizer",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );

      let retry = 0;
      while (retry++ < 5) {
        await dashboardPage.page.reload({ waitUntil: "load" });
        await dashboardPage.page.waitForLoadState("networkidle");
        await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
        await dashboardPage.waitAbit(2000); //wait for dashboard apply data
        dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

        const isApplyData = dashboardDataTranslated[3].destination.value === caseConf.data_pre_condition.destination;
        if (isApplyData) {
          break;
        }
      }
      expect(dashboardDataTranslated[3].destination.value).toEqual(caseConf.data_pre_condition.destination);

      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      expect(dashboardDataTranslated[3].source.value).toEqual(caseConf.data_pre_condition.message);
      expect(dashboardDataTranslated[3].destination.value).toEqual(caseConf.data_pre_condition.destination);
    });

    await test.step(`2. DB menu Apps  >  Conversion optimizer  > Thực hiện edit Checkout notifications - Mở màn  Conversion optimizer Translation của  Offer A đã edit`, async () => {
      //DB menu Apps  >  Conversion optimizer  > Thực hiện edit Sales notifications
      await dashboardPage.goto("admin/apps/boost-convert/social-proof/popup-type");
      await dashboardPage.navigateToMenu("Pop types");
      await coptPage.editCheckoutNotifications(caseConf.data_step_2);

      //Mở màn  Conversion optimizer Translation của  Offer A đã edit
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.publish_language,
        "Conversion optimizer",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );

      let retry = 0;
      while (retry++ < 5) {
        await dashboardPage.page.reload({ waitUntil: "load" });
        await dashboardPage.page.waitForLoadState("networkidle");
        await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
        await dashboardPage.waitAbit(5000); //wait for dashboard apply data
        dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

        const isApplyData = dashboardDataTranslated[3].destination.value === caseConf.data_step_2.destination;
        if (isApplyData) {
          break;
        }
      }
      expect(dashboardDataTranslated[3].destination.value).toEqual(caseConf.data_step_2.destination);
      expect(dashboardDataTranslated[3].source.value).toEqual(caseConf.data_step_2.message);
    });

    await test.step(`3. Thực hiện edit bản dịch > save > Reload lại page DB Translation`, async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.publish_language,
        "Conversion optimizer",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${conf.caseConf.publish_language} Translation`,
      );
      await dashboardPage.fillTranslationDetail({
        inputDataType: "text",
        inputData: caseConf.edit_step_3,
        searchCondition: {
          fieldIndex: 0,
          fieldName: "Checkout notifications message",
        },
      });

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue("English"))
        .click();
      await dashboardPage.clickBtnSave();
      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      expect(dashboardDataTranslated[3].destination.value).toEqual(caseConf.edit_step_3);
    });

    await test.step(`4. Click Auto translate`, async () => {
      //verify dashboard
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      expect(dashboardDataTranslated[3].destination.value).toEqual(caseConf.edit_step_3);
    });

    await test.step(`5. Xóa Bản dịch manual > save > Reload lại page DB Translation - Ra ngoài SF > chọn ngôn ngữ tiếng French >  mở Offer A`, async () => {
      //Xóa Bản dịch manual > save > Reload lại page DB Translation
      await dashboardPage.fillTranslationDetail({
        inputDataType: "text",
        inputData: "",
        searchCondition: {
          fieldIndex: 0,
          fieldName: "Checkout notifications message",
        },
      });

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue("English"))
        .click();
      await dashboardPage.clickBtnSave();
      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      expect(dashboardDataTranslated[3].destination.value).toEqual("");
    });

    await test.step(`6. Click Auto translate`, async () => {
      //verify dashboard
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      await dashboardPage.waitAbit(1000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      expect(dashboardDataTranslated[3].destination.value).toEqual(caseConf.data_step_2.destination);
    });
  });
});
