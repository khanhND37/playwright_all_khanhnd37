import { expect, test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { pressControl } from "@core/utils/keyboard";
import { ProductPage } from "@pages/dashboard/products";
import { SFHome } from "@pages/storefront/homepage";
import { waitTimeout } from "@core/utils/api";

test.describe("Automate testcase for entity POD-Description(feature translation)", () => {
  let dashboardPage: TranslationDetail;
  let date;
  let productPage: ProductPage;
  let dashboardDataTranslated;

  test.beforeEach("Login shop & setup data", async ({ conf, dashboard }) => {
    const suiteConf = conf.suiteConf;
    const caseConf = conf.caseConf;
    date = new Date().getTime();
    dashboardPage = new TranslationDetail(dashboard, suiteConf.domain);
    productPage = new ProductPage(dashboard, suiteConf.domain);

    await test.step(`Clear translation data`, async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.language,
        "POD description template",
      );
      await dashboardPage.choosePOD(caseConf.pod);
      await dashboardPage.page.locator("//button[@aria-label='Source code'] >> nth=1").click();
      await dashboardPage.page.locator("//textarea[@class='tox-textarea']").fill("");
      await dashboardPage.page.locator("//button[@title='Save']").first().click();
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();

      const isSaveEnable = await dashboardPage.page.locator(dashboardPage.xpathTD.actionBarHeader).isVisible();
      if (isSaveEnable) {
        await dashboardPage.clickBtnSave();
      }
      expect(isSaveEnable === false);
    });
  });

  test(`@SB_SET_TL_69 [DB - UI/UX] Kiểm tra màn translate detail của store data - Online store - POD description template`, async ({
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;

    await test.step(`Pre-condition: edit POD`, async () => {
      for (const dataSetup of suiteConf.precondition_data) {
        await productPage.editPODDescription(dataSetup.pod_name, `${dataSetup.description} ${date}`);
      }
    });

    await test.step("Click vào details của static content - POD description template", async () => {
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.language,
        "POD description template",
      );

      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${caseConf.language} Translation`,
      );
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language),
        ),
      ).toBeVisible();
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(caseConf.language)),
      ).toBeVisible();
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
    });

    await test.step(`Kiểm tra droplist POD product`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.podDescription.input).click();
      await dashboardPage.page.waitForSelector(`${dashboardPage.xpathTD.searchBar.valueOptionOnDropdown} >> nth=1`);
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-69-translation-detail.png`,
      });
    });

    await test.step(`Thực hiện search keyword không tồn tại`, async () => {
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.podDescription.input)
        .fill(caseConf.invalid_value);
      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.xpathNotFound)).toBeVisible();
    });

    await test.step(`Thực hiện search keyword có tồn tại`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.podDescription.input).fill(caseConf.valid_value);
      await dashboardPage.page.waitForSelector(`${dashboardPage.xpathTD.searchBar.valueOptionOnDropdown} >> nth=1`);
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
      await dashboardPage.choosePOD(suiteConf.precondition_data[0].pod_name);
      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName("Description"))).toBeVisible();
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await dashboardPage.page.waitForLoadState("domcontentloaded");
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
        snapshotName: `${process.env.ENV}-69-icon-auto.png`,
      });

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
        .pressSequentially(caseConf.valid_value);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-69-icon-manual.png`,
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
        .pressSequentially(caseConf.more_characters);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-69-more-characters.png`,
      });
    });
  });

  test(`@SB_SET_TL_81 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable Auto translate Online store - POD description template`, async ({
    conf,
    page,
  }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;
    const homePage = new SFHome(page, suiteConf.domain);
    const autoTranslationDataDB = `<p>translated</p><p>Thêm vào đây !@@#$, 在这里添加另一种语言的文本 ${date}</p><p>to Vietnamese</p>`;
    const autoTranslationDataSF = `Thêm vào đây !@@#$, 在这里添加另一种语言的文本 ${date}`;

    await test.step("Enable auto translate ở Online store  > Mở màn POD description Translation   > Mở droplist POD description ", async () => {
      //Mở màn pages Translation
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.language,
        "POD description template",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${caseConf.language} Translation`,
      );
      //Mở droplist pod
      await dashboardPage.page.waitForLoadState("domcontentloaded");
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.podDescription.input).click();
      await dashboardPage.page.waitForSelector(`${dashboardPage.xpathTD.searchBar.valueOptionOnDropdown} >> nth=1`);
    });

    await test.step(`Thực hiện edit content product base - Mở màn POD description template Translation của product đã edit`, async () => {
      //Thực hiện edit content product base
      await productPage.editPODDescription(caseConf.data_edit.pod_name, `${caseConf.data_edit.description} ${date}`);
      //Mở màn POD description template Translation của product đã edit
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.language,
        "POD description template",
      );

      await dashboardPage.choosePOD(caseConf.data_edit.pod_name);
      await dashboardPage.page.waitForLoadState("domcontentloaded");
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });

      //verify dashboard
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify SF
      await homePage.page.goto(`https://${suiteConf.domain}/products/${caseConf.data_edit.handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(caseConf.language_global_switcher);

      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toContainText(autoTranslationDataSF);
    });

    await test.step(`Thực hiện edit bản dịch > save > reload`, async () => {
      //Thực hiện edit bản dịch
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
        .pressSequentially(caseConf.edit_dashboard_translation);

      //save
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(`<p>${caseConf.edit_dashboard_translation}</p>`);

      //verify SF
      let retry = 0;
      while (retry++ < 5) {
        await waitTimeout(3000);
        await homePage.page.reload(); //reload to apply setting on dashboard

        const isApplyData = (await homePage.page.locator(dashboardPage.xpathSF.descriptionPOD).innerText()).includes(
          caseConf.edit_dashboard_translation,
        );
        if (isApplyData) {
          break;
        }
      }
      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toContainText(
        caseConf.edit_dashboard_translation,
      );
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await homePage.page.waitForLoadState("domcontentloaded");
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await dashboardPage.page.waitForSelector(
        dashboardPage.xpathTD.translationTable.alertTranslate(`Your online store is ready`),
        { state: "visible" },
      );
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(`<p>${caseConf.edit_dashboard_translation}</p>`);
      //verify SF
      let retry = 0;
      while (retry++ < 5) {
        await waitTimeout(3000);
        await homePage.page.reload(); //reload to apply setting on dashboard

        const isApplyData = (await homePage.page.locator(dashboardPage.xpathSF.descriptionPOD).innerText()).includes(
          caseConf.edit_dashboard_translation,
        );
        if (isApplyData) {
          break;
        }
      }
      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toContainText(
        caseConf.edit_dashboard_translation,
      );
    });

    await test.step(`Xóa Bản dịch manual > save  > reload - Ra ngoài SF > chọn ngôn ngữ tiếng Vietnamese >  mở product base A`, async () => {
      //Xóa Bản dịch manual
      await dashboardPage.page.locator("//button[@aria-label='Source code'] >> nth=1").click();
      await dashboardPage.page.locator("//textarea[@class='tox-textarea']").fill("");
      await dashboardPage.page.locator("//button[@title='Save']").first().click();

      //save
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual('<p><br data-mce-bogus="1"></p>');

      //verify SF
      let retry = 0;
      while (retry++ < 5) {
        await waitTimeout(3000);
        await homePage.page.reload(); //reload to apply setting on dashboard

        const isApplyData = (await homePage.page.locator(dashboardPage.xpathSF.descriptionPOD).innerText()).includes(
          `${caseConf.data_edit.description} ${date}`,
        );
        if (isApplyData) {
          break;
        }
      }
      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toHaveText(
        `${caseConf.data_edit.description} ${date}`,
      );
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await homePage.page.waitForLoadState("domcontentloaded");
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await dashboardPage.page.waitForSelector(
        dashboardPage.xpathTD.translationTable.alertTranslate(`Your online store is ready`),
        { state: "visible" },
      );
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(autoTranslationDataDB);
      //verify SF
      let retry = 0;
      while (retry++ < 5) {
        await waitTimeout(3000);
        await homePage.page.reload({ waitUntil: "load" });
        if (homePage.page.locator(`${dashboardPage.xpathSF.descriptionPOD}:text-is(${autoTranslationDataSF})`)) {
          return;
        }
      }
      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toContainText(autoTranslationDataSF);
    });
  });

  test(`@SB_SET_TL_80 [DB+SF - Function] Kiểm tra tính năng auto translate khi Disable Auto translate của Online store - POD description template`, async ({
    conf,
    page,
  }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;
    const homePage = new SFHome(page, suiteConf.domain);
    const autoTranslationDataDB = `<p>translated</p><p>Thêm vào đây !@@#$, 在这里添加另一种语言的文本 ${date}</p><p>to German</p>`;
    const autoTranslationDataSF = `Thêm vào đây !@@#$, 在这里添加另一种语言的文本 ${date}`;

    await test.step("Disable auto translate ở Online store  > Mở màn POD description template Translation   > Mở droplist product base", async () => {
      //Mở màn pages Translation
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.language,
        "POD description template",
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.titleTranslationDetail)).toHaveText(
        `${caseConf.language} Translation`,
      );
      //Mở droplist pod
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.podDescription.input).click();
      await dashboardPage.page.waitForSelector(`${dashboardPage.xpathTD.searchBar.valueOptionOnDropdown} >> nth=1`, {
        state: "visible",
      });
    });

    await test.step(`Thực hiện edit content product base - Mở màn POD description template Translation của product đã edit`, async () => {
      //Thực hiện edit content product base
      await productPage.editPODDescription(caseConf.data_edit.pod_name, `${caseConf.data_edit.description} ${date}`);

      //Mở màn POD description template Translation của product đã edit
      await dashboardPage.goToTranslationDetailScreen(
        "Published languages",
        caseConf.language,
        "POD description template",
      );
      await dashboardPage.choosePOD(caseConf.data_edit.pod_name);

      //verify dashboard
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify SF
      await homePage.page.goto(`https://${suiteConf.domain}/products/${caseConf.data_edit.handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await homePage.chooseCountryAndLanguageOnSF(caseConf.language_global_switcher);

      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toContainText(
        caseConf.data_edit.description,
      );
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await homePage.page.waitForLoadState("domcontentloaded");
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await dashboardPage.page.waitForSelector(
        dashboardPage.xpathTD.translationTable.alertTranslate(`Your online store is ready`),
        { state: "visible" },
      );
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(autoTranslationDataDB);
      //verify SF
      await homePage.page.goto(`https://${suiteConf.domain}/products/${caseConf.data_edit.handle}`);
      await homePage.page.waitForLoadState("networkidle");
      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toContainText(autoTranslationDataSF);
    });

    await test.step(`Thực hiện edit bản dịch > save > reload`, async () => {
      //Thực hiện edit bản dịch
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
        .pressSequentially(caseConf.edit_dashboard_translation);

      //save
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(`<p>${caseConf.edit_dashboard_translation}</p>`);

      //verify SF
      let retry = 0;
      while (retry++ < 5) {
        await waitTimeout(3000);
        await homePage.page.reload(); //reload to apply setting on dashboard
        await dashboardPage.page.waitForLoadState("networkidle");

        const isApplyData = (await homePage.page.locator(dashboardPage.xpathSF.descriptionPOD).innerText()).includes(
          caseConf.edit_dashboard_translation,
        );
        if (isApplyData) {
          break;
        }
      }
      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toContainText(
        caseConf.edit_dashboard_translation,
      );
    });

    await test.step(`Xóa Bản dịch manual > save  > reload - Ra ngoài SF > chọn ngôn ngữ tiếng Vietnamese >  mở product base A`, async () => {
      //Xóa Bản dịch manual
      await dashboardPage.page.locator("//button[@aria-label='Source code'] >> nth=1").click();
      await dashboardPage.page.locator("//textarea[@class='tox-textarea']").fill("");
      await dashboardPage.page.locator("//button[@title='Save']").first().click();

      //save
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await waitTimeout(2000); //wait for dashboard apply data after auto translating
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual('<p><br data-mce-bogus="1"></p>');

      //verify SF
      let retry = 0;
      while (retry++ < 5) {
        await waitTimeout(3000);
        await homePage.page.reload(); //reload to apply setting on dashboard
        await dashboardPage.page.waitForLoadState("networkidle");

        const isApplyData = (await homePage.page.locator(dashboardPage.xpathSF.descriptionPOD).innerText()).includes(
          `${caseConf.data_edit.description} ${date}`,
        );
        if (isApplyData) {
          break;
        }
      }
      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toHaveText(
        `${caseConf.data_edit.description} ${date}`,
      );
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.page.locator(dashboardPage.xpathTD.autoTranslateButton).click();
      await homePage.page.waitForLoadState("domcontentloaded");
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "visible" });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathTD.translatingAlert, { state: "hidden" });
      await dashboardPage.page.waitForSelector(
        dashboardPage.xpathTD.translationTable.alertTranslate(`Your online store is ready`),
        { state: "visible" },
      );
      await waitTimeout(2000); //wait for dashboard apply data
      dashboardDataTranslated = await dashboardPage.getTranslationDetailData();

      //verify dashboard
      expect(dashboardDataTranslated[0].destination.value).toEqual(autoTranslationDataDB);
      // verify SF
      let retry = 0;
      while (retry++ < 5) {
        await waitTimeout(3000);
        await homePage.page.reload({ waitUntil: "load" });
        await homePage.page.waitForLoadState("networkidle");
        if (homePage.page.locator(`${dashboardPage.xpathSF.descriptionPOD}:text-is(${autoTranslationDataSF})`)) {
          return;
        }
      }
      await expect(homePage.page.locator(dashboardPage.xpathSF.descriptionPOD)).toContainText(autoTranslationDataSF);
    });
  });
});
