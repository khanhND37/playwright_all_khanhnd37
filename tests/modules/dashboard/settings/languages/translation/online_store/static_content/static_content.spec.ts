import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation//translation-detail";
import { SFHome } from "@pages/storefront/homepage";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SfTranslation } from "@pages/dashboard/sf-translation";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";

test.describe("Verify Translation detail của Online store - static content V3 ", () => {
  let staticContentPage: TranslationDetail;
  let sfTranslation: SfTranslation;
  let sfPage: SFHome;
  let reloadTime;

  test.beforeEach(async ({ dashboard, page, conf, theme }) => {
    staticContentPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    sfPage = new SFHome(page, conf.suiteConf.domain);
    reloadTime = conf.suiteConf.reload_time;

    await test.step("Publish theme V3 ", async () => {
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
    });
  });

  test.afterEach(async () => {
    await staticContentPage.resetKeyToDefault();
  });

  test(`@SB_SET_TL_37 [DB+SF - Function] Check change ngôn ngữ thành data trống  Online store - static content`, async ({
    page,
    dashboard,
    conf,
  }) => {
    test.slow();
    const data = conf.caseConf.data;
    const domain = conf.suiteConf.domain;

    await test.step(`- Chọn thông tin:  
    Page = Products + theme Ciadora + language = ${data.language} `, async () => {
      await dashboard.goto(
        `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=668`,
      );
      await dashboard.waitForLoadState("networkidle");
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.chooseEntityTranslate(data.entity_translate);
      await staticContentPage.searchKey(data.key_search);
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.key(data.key_name))).toBeVisible();
    });

    await test.step(`Edit phrase ${data.original_content} về data trống > click ra vùng trống > Click button Save `, async () => {
      await staticContentPage.genLoc(staticContentPage.getXpathPhrase(data.key_name)).clear();
      await staticContentPage.genLoc(staticContentPage.xpathTD.keyHeader).click();
      await staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save")).waitFor({ state: "visible" });
      await staticContentPage.clickBtnSave();
      await staticContentPage.chooseEntityTranslate(data.entity_translate);
      await expect.soft(staticContentPage.genLoc(staticContentPage.getXpathEmptyPhrase(data.key_name))).toBeVisible();
    });

    await test.step(`Reload màn translation detail   ( dev < 60s, prod prodtest < 30s )`, async () => {
      for (let i = 0; i < reloadTime; i++) {
        await staticContentPage.page.waitForTimeout(10 * 1000);
        await staticContentPage.page.reload({ waitUntil: "networkidle" });
        await staticContentPage.chooseEntityTranslate(data.entity_translate);
        await staticContentPage.searchKey(data.key_search);
        const targetValue = await staticContentPage.page.getAttribute(
          staticContentPage.getXpathPhrase(data.key_name),
          "title",
        );
        if (targetValue === data.phrase_default) {
          break;
        }
      }
      await expect
        .soft(staticContentPage.genLoc(staticContentPage.getXpathPhrase(data.key_name)))
        .toHaveAttribute("title", data.phrase_default);
    });

    await test.step(` open product page ngoài SF > Scroll xuống product detail`, async () => {
      await sfPage.goto(`https://${domain}/${data.subfolder}/${data.product_handle}`);
      await sfPage.page.waitForLoadState("networkidle");
      for (let i = 0; i < reloadTime; i++) {
        await sfPage.page.waitForTimeout(10 * 1000);
        await sfPage.page.reload({ waitUntil: "networkidle" });
        await page.locator(staticContentPage.xpathSF.customerReview).scrollIntoViewIfNeeded();
        const expectVisible = await sfPage.genLoc(staticContentPage.getXpathByText(data.phrase_default)).isVisible();
        if (expectVisible) {
          break;
        }
      }
      await expect.soft(sfPage.genLoc(staticContentPage.xpathSF.btnAddCartSticky)).toHaveText(data.phrase_default);
    });
  });

  test(`@SB_SET_TL_34 [DB+SF - Function] Check change ngôn ngữ thành công Online store - static content với Product Review App + language = Vietnamese`, async ({
    page,
    dashboard,
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    const data = conf.caseConf.data;
    const domain = conf.suiteConf.domain;

    await test.step(`- Chọn thông tin:  
  + type = Product Review App  
  + language = Vietnamese  
  + key search = Be the first to write a review`, async () => {
      await dashboard.goto(
        `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=review`,
      );
      await dashboard.waitForLoadState("networkidle");
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.searchKey(data.key_search);
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.key(data.key_name))).toBeVisible();
    });

    await test.step(`Edit data phrase của english phrase "Be the first to write a review"  > click ra vùng ngoài `, async () => {
      await staticContentPage.editPhrase(data.key_name, data.edit_phrase);
      await expect(staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save"))).toBeVisible();
    });

    await test.step(`Click button Save > open product page ngoài SF language = Vietnamese > Scroll đến review app`, async () => {
      await staticContentPage.clickBtnSave();
      await sfPage.goto(`https://${domain}/${data.subfolder}/${data.product_handle}`);
      await page.waitForLoadState("networkidle");
      for (let i = 0; i < reloadTime; i++) {
        await sfPage.page.waitForTimeout(10 * 1000);
        await sfPage.page.reload({ waitUntil: "networkidle" });
        await page.locator(staticContentPage.xpathSF.customerReview).scrollIntoViewIfNeeded();
        const expectVisible = await sfPage.genLoc(staticContentPage.getXpathByText(caseConf.expect)).isVisible();
        if (expectVisible) {
          break;
        }
      }
      await expect.soft(page.locator(staticContentPage.getXpathByText(caseConf.expect))).toBeVisible();
    });

    await test.step(`Vào lại language editor trong DB > Click button Reset to default`, async () => {
      await staticContentPage.resetKeyToDefault();
      await expect
        .soft(staticContentPage.genLoc(staticContentPage.getXpathPhrase(data.key_name)))
        .toHaveAttribute("title", data.phrase_default);
    });
  });

  test(`@SB_SET_TL_33 [DB+SF - Function] Check change ngôn ngữ thành công Online store - static content với Boost Upsell App + language = Polish`, async ({
    page,
    dashboard,
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    const data = conf.caseConf.data;
    const domain = conf.suiteConf.domain;

    await test.step(`- Chọn thông tin:  
  + type = Boost Upsell App  
  + key search = cta`, async () => {
      await dashboard.goto(
        `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=usell`,
      );
      await dashboard.waitForLoadState("networkidle");
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.searchKey(data.key_search);
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.key(data.key_name))).toBeVisible();
    });

    await test.step(`Edit data phrase của english phrase "Add more items"  > click ra vùng ngoài `, async () => {
      await staticContentPage.editPhrase(data.key_name, data.edit_phrase);
      await expect(staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save"))).toBeVisible();
    });

    await test.step(`Click button Save > open product page ngoài SF > Add product bất kỳ > Open cart page `, async () => {
      await staticContentPage.clickBtnSave();
      await sfPage.goto(`https://${domain}/${data.subfolder}/${data.product_handle}`);
      await sfPage.page.waitForLoadState("networkidle");
      await sfPage.genLoc(staticContentPage.xpathSF.btnAddCart).click();
      await sfPage.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await sfPage.goto(`https://${conf.suiteConf.domain}/${data.subfolder}/cart`);
      await page.waitForLoadState("networkidle");

      for (let i = 0; i < reloadTime; i++) {
        await sfPage.page.waitForTimeout(10 * 1000);
        await sfPage.page.reload({ waitUntil: "networkidle" });
        await page.waitForSelector(staticContentPage.xpathSF.addMoreItem);
        const expectVisible = await sfPage.genLoc(staticContentPage.getXpathByText(caseConf.expect)).isVisible();
        if (expectVisible) {
          break;
        }
      }
      await expect.soft(sfPage.genLoc(staticContentPage.xpathSF.addMoreItem)).toHaveText(caseConf.expect);
    });

    await test.step(`Vào lại language editor trong DB > Click button Reset to default`, async () => {
      await staticContentPage.resetKeyToDefault();
      await expect
        .soft(staticContentPage.genLoc(staticContentPage.getXpathPhrase(data.key_name)))
        .toHaveAttribute("title", data.phrase_default);

      for (let i = 0; i < reloadTime; i++) {
        await sfPage.page.waitForTimeout(10 * 1000);
        await sfPage.page.reload({ waitUntil: "networkidle" });
        await page.waitForSelector(staticContentPage.xpathSF.addMoreItem);
        const expectVisible = await sfPage.genLoc(staticContentPage.getXpathByText(data.phrase_default)).isVisible();
        if (expectVisible) {
          break;
        }
      }
      await expect.soft(sfPage.genLoc(staticContentPage.xpathSF.addMoreItem)).toHaveText(data.phrase_default);
    });
  });

  test(`@SB_SET_TL_30 [DB+SF - Function] Check change ngôn ngữ thành công Online store - static content với Page = Products + theme Ciadora + language = Polish / French`, async ({
    dashboard,
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    const domain = conf.suiteConf.domain;

    for (const data of caseConf.data_languages) {
      await test.step(`${data.language} Chọn Page = Products `, async () => {
        await dashboard.goto(
          `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=668`,
        );
        await dashboard.waitForLoadState("networkidle");
        await staticContentPage.resetKeyToDefault();
        await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
        await expect(staticContentPage.genLoc(staticContentPage.xpathTD.key(caseConf.key_name))).toBeVisible();
      });

      await test.step(`Search ${data.language} Phrase = Add to cart`, async () => {
        await staticContentPage.searchKey(caseConf.key_search);
        await expect(staticContentPage.genLoc(staticContentPage.xpathTD.key(caseConf.key_name))).toBeVisible();
      });

      await test.step(`Edit phrase của key add_to_cart  > click ra vùng ngoài `, async () => {
        await staticContentPage.editPhrase(caseConf.key_name, data.data_phrase1.edit_phrase);
        await expect(staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save"))).toBeVisible();
      });

      await test.step(`Click button Save > open product page ngoài SF > Scroll xuống product detail`, async () => {
        await staticContentPage.clickBtnSave();
        await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
        const preview = await staticContentPage.clickActionBtn("Preview");
        await preview.waitForLoadState("networkidle");
        sfTranslation = new SfTranslation(preview, conf.suiteConf.domain);
        await sfTranslation.goto(`https://${domain}/${caseConf.product_handle}`);
        await sfTranslation.page.waitForLoadState("networkidle");
        await sfTranslation.changeSettingLanguage({ language: data.language_sf });
        await sfTranslation.page.waitForLoadState("networkidle");

        for (let i = 0; i < reloadTime; i++) {
          await sfTranslation.page.waitForTimeout(10 * 1000);
          await sfTranslation.page.reload({ waitUntil: "networkidle" });
          await sfTranslation.genLoc(staticContentPage.xpathSF.customerReview).scrollIntoViewIfNeeded();
          const expectVisible = await sfTranslation
            .genLoc(staticContentPage.getXpathByText(data.data_phrase1.expect))
            .isVisible();
          if (expectVisible) {
            break;
          }
        }
        await expect
          .soft(sfTranslation.genLoc(staticContentPage.xpathSF.btnAddCartSticky))
          .toHaveText(data.data_phrase1.expect);
      });

      await test.step(`Vào lại language editor trong DB > Change Edit phrase của key add_to_cart  lần nữa`, async () => {
        await staticContentPage.editPhrase(caseConf.key_name, data.data_phrase2.edit_phrase);
        await expect(staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save"))).toBeVisible();
      });

      await test.step(`Click button Save > open product page ngoài SF > Scroll xuống product detail`, async () => {
        await staticContentPage.clickBtnSave();
        for (let i = 0; i < reloadTime; i++) {
          await sfTranslation.page.waitForTimeout(10 * 1000);
          await sfTranslation.page.reload({ waitUntil: "networkidle" });
          await sfTranslation.genLoc(staticContentPage.xpathSF.customerReview).scrollIntoViewIfNeeded();
          const expectVisible = await sfTranslation
            .genLoc(staticContentPage.getXpathByText(data.data_phrase2.expect))
            .isVisible();
          if (expectVisible) {
            break;
          }
        }
        await expect
          .soft(sfTranslation.genLoc(staticContentPage.xpathSF.btnAddCartSticky))
          .toHaveText(data.data_phrase2.expect);
        await sfTranslation.page.close();
      });
    }
  });

  test(`@SB_SET_TL_38 [DB+SF - Function] Check button Reset to default  Online store - static content`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const domain = conf.suiteConf.domain;
    const data = conf.caseConf.data;

    await test.step(`Precondition: edit key Zulu Translation `, async () => {
      await dashboard.goto(`https://${domain}/admin/settings/language/zu/edit?type=static-content&handle=668`);
      await dashboard.waitForLoadState("networkidle");
      await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
      const btnReset = await staticContentPage
        .genLoc(staticContentPage.xpathBtnWithLabel("Reset to default"))
        .isDisabled();
      if (btnReset) {
        await staticContentPage.editPhrase(caseConf.key_name, data.edit_zulu_phrase);
        await staticContentPage.clickBtnSave();
        await expect(staticContentPage.genLoc(staticContentPage.xpathTD.btnResetToDefault)).toBeEnabled();
      }
    });

    await test.step(`Chọn Page = Products`, async () => {
      await dashboard.goto(
        `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=668`,
      );
      await dashboard.waitForLoadState("networkidle");
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.btnResetToDefault)).toBeDisabled();
    });

    await test.step(`Edit phrase của key đầu tiên về data trống > click ra vùng trống`, async () => {
      await staticContentPage.genLoc(staticContentPage.getXpathPhrase(caseConf.key_name)).clear();
      await staticContentPage.genLoc(staticContentPage.xpathTD.keyHeader).click();
      await expect(staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save"))).toBeVisible();
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.btnResetToDefault)).toBeDisabled();
    });

    await test.step(`Click button Save`, async () => {
      await staticContentPage.clickBtnSave();
      await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
      await expect(staticContentPage.genLoc(staticContentPage.getXpathEmptyPhrase(caseConf.key_name))).toBeVisible();
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.btnResetToDefault)).toBeEnabled();
    });

    await test.step(`Click button Reset to default`, async () => {
      await staticContentPage.clickOnBtnWithLabel("Reset to default");
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.popupResetToDefault)).toBeVisible();
      await expect(
        staticContentPage.genLoc(staticContentPage.getXpathByText(caseConf.expect.popup_text)),
      ).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: staticContentPage.xpathTD.popupResetToDefault,
        snapshotName: "popup_reset_to_default.png",
      });
    });

    await test.step(`Click button Cancel`, async () => {
      await staticContentPage.clickOnBtnWithLabel("Cancel");
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.btnResetToDefault)).toBeEnabled();
    });

    await test.step(`Click button Continue`, async () => {
      await staticContentPage.clickOnBtnWithLabel("Reset to default");
      await staticContentPage.clickOnBtnWithLabel("Continue");
      await staticContentPage.genLoc(staticContentPage.xpathTD.loading).waitFor({ state: "hidden" });
      await staticContentPage.waitForToastMessageHide("Saved successfully");
      await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.btnResetToDefault)).toBeDisabled();
      await expect(staticContentPage.genLoc(staticContentPage.getXpathPhrase(caseConf.key_name))).toHaveAttribute(
        "title",
        data.phrase_default,
      );

      // Không đưa về default translation với ngôn ngữ khác (Zulu Translation)
      await dashboard.goto(`https://${domain}/admin/settings/language/zu/edit?type=static-content&handle=668`);
      await dashboard.waitForLoadState("networkidle");
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.btnResetToDefault)).toBeEnabled();
    });
  });

  test(`@SB_SET_TL_29 [DB - UI/UX] Kiểm tra màn translate detail của Online store - static content`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const domain = conf.suiteConf.domain;
    const data = conf.caseConf.data;

    await test.step(`Click Static content - Details`, async () => {
      await dashboard.goto(
        `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=668`,
      );
      await dashboard.waitForLoadState("networkidle");
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: staticContentPage.xpathTD.tableTranslation,
        snapshotName: "translation_table_static_content.png",
      });
    });

    await test.step(`Click vào droplist theme`, async () => {
      await staticContentPage.genLoc(staticContentPage.xpathTD.pageDropdownBtn).nth(0).getByRole("button").click();
      for (const step2Expect of caseConf.step2_expects) {
        await expect(staticContentPage.genLoc(staticContentPage.xpathTD.pageOptionStatic(step2Expect))).toBeVisible();
      }
    });

    for (const optionTheme of caseConf.data_themes) {
      await test.step(`Change type = ${optionTheme.entity_translate.theme}`, async () => {
        await staticContentPage.genLoc(staticContentPage.xpathTD.entityDropdownBtn).getByRole("button").click();
        await staticContentPage.chooseEntityTranslate(optionTheme.entity_translate);
        await staticContentPage.page.waitForSelector(
          staticContentPage.xpathTD.dropdownbtn(optionTheme.entity_translate.theme),
        );
        await expect(staticContentPage.genLoc(staticContentPage.xpathTD.dropdownAllPagesbtn)).toBeVisible();
      });

      await test.step(`${optionTheme.entity_translate.theme} Click vào droplist page`, async () => {
        await staticContentPage.genLoc(staticContentPage.xpathTD.pageDropdownBtn).nth(1).getByRole("button").click();
        for (const optionPage of optionTheme.expect) {
          await expect(staticContentPage.genLoc(staticContentPage.xpathTD.pageOptionStatic(optionPage))).toBeVisible();
        }
      });
    }

    for (const optionApp of caseConf.data_apps) {
      await test.step(`Change type = ${optionApp.entity_translate.theme}`, async () => {
        await staticContentPage.genLoc(staticContentPage.xpathTD.entityDropdownBtn).getByRole("button").click();
        await staticContentPage.chooseEntityTranslate(optionApp.entity_translate);
        await staticContentPage.page.waitForSelector(
          staticContentPage.xpathTD.dropdownbtn(optionApp.entity_translate.theme),
        );
        await expect(staticContentPage.genLoc(staticContentPage.xpathTD.dropdownAllPagesbtn)).toBeHidden();
      });
    }
  });

  test(`@SB_SET_TL_36 [DB+SF - Function] Check change ngôn ngữ thành công Online store - static content với Checkout + language = Vietnamese`, async ({
    dashboard,
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    const data = conf.caseConf.data;
    const domain = conf.suiteConf.domain;

    await test.step(`- Chọn thông tin:  
    + type = chekout
    + key search = Add a tip to support us`, async () => {
      await dashboard.goto(
        `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=checkout`,
      );
      await dashboard.waitForLoadState("domcontentloaded");
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.searchKey(data.key_search);
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.key(data.key_name))).toBeVisible();
    });

    await test.step(`Edit data phrase của english phrase "Add a tip to support us"  > click ra vùng ngoài `, async () => {
      await staticContentPage.editPhrase(data.key_name, data.edit_phrase);
      await expect(staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save"))).toBeVisible();
    });

    await test.step(`Click button Save > open product page ngoài SF > Click btn Buynow > Redirect đến trang checkout`, async () => {
      await staticContentPage.clickBtnSave();
      await sfPage.goto(`https://${domain}/${data.subfolder}/${data.product_handle}`);
      await sfPage.page.waitForResponse(/theme.css/);
      await sfPage.genLoc(staticContentPage.xpathSF.btnBuynow).click();
      await sfPage.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await sfPage.page.waitForURL(/\/checkouts/);

      for (let i = 0; i < reloadTime; i++) {
        // static content khi edit khoảng 1p sau ngoài SF mới hiện key trên dev, 30s vs prod/prodtest
        await sfPage.page.waitForTimeout(10 * 1000);
        await sfPage.page.reload({ waitUntil: "domcontentloaded" });
        await scrollUntilElementIsVisible({
          page: sfPage.page,
          scrollEle: sfPage.genLoc(staticContentPage.xpathSF.checkoutFooterSF),
          viewEle: sfPage.genLoc(staticContentPage.xpathSF.tippingTitle),
        });
        const expectVisible = await sfPage.genLoc(staticContentPage.getXpathByText(caseConf.expect)).isVisible();
        if (expectVisible) {
          break;
        }
      }
      await expect.soft(sfPage.genLoc(staticContentPage.xpathSF.tippingTitle)).toHaveText(caseConf.expect);
    });

    await test.step(`Vào lại language editor trong DB > Click button Reset to default`, async () => {
      await staticContentPage.resetKeyToDefault();
      await expect
        .soft(staticContentPage.genLoc(staticContentPage.getXpathPhrase(data.key_name)))
        .toHaveAttribute("title", data.phrase_default);
    });
  });
});

test.describe("Verify Translation detail của Online store - static content V2 ", () => {
  let staticContentPage: TranslationDetail;
  let sfPage: SfTranslation;
  let themePage: ThemeEcom;
  let dashboardPage: DashboardPage;
  let data;
  let xpath: Blocks;
  let reloadTime;

  test.beforeEach(async ({ dashboard, page, conf, theme }) => {
    staticContentPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    themePage = new ThemeEcom(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    xpath = new Blocks(dashboard, conf.suiteConf.domain);
    sfPage = new SfTranslation(page, conf.suiteConf.domain);
    data = conf.caseConf.data;
    reloadTime = conf.suiteConf.reload_time;

    await test.step("Pre-condition: setting Theme Layout ", async () => {
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
      await dashboardPage.navigateToMenu("Online Store");
      await themePage.publishTheme(data.template_name);
    });
  });

  test.afterEach(async () => {
    await dashboardPage.navigateToMenu("Online Store");
    await themePage.publishTheme("Packwise( auto cấm xóa )");
  });

  test(`@SB_SET_TL_32 [DB+SF - Function] Check change ngôn ngữ thành công Online store - static content với Page = All page + theme Inside + language = Spanish`, async ({
    conf,
    dashboard,
    page,
  }) => {
    test.slow();
    const domain = conf.suiteConf.domain;
    const caseConf = conf.caseConf;

    await test.step(`- Chọn thông tin:    
  + theme = Inside theme    
  + key search = feaT`, async () => {
      await dashboard.goto(
        `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=3`,
      );
      await dashboard.waitForLoadState("networkidle");
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.searchKey(data.key_search);
      await expect.soft(staticContentPage.genLoc(staticContentPage.xpathTD.key(data.key_name))).toBeVisible();
    });

    await test.step(`Edit data phrase của key "sort_by"  > click ra vùng ngoài `, async () => {
      await staticContentPage.editPhrase(data.key_name, data.edit_phrase);
      await expect.soft(staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save"))).toBeVisible();
    });

    await test.step(`Click button Save > open collection all`, async () => {
      await staticContentPage.clickBtnSave();
      await sfPage.goto(`https://${domain}/${data.collection_handle}`);
      await page.waitForLoadState("networkidle");
      await sfPage.changeLanguageSfInside(data.change_lang);
      await sfPage.waitResponseWithUrl(`/apps/assets/locales/${data.language_code}.json`);

      for (let i = 0; i < reloadTime; i++) {
        await sfPage.page.waitForTimeout(10 * 1000);
        await sfPage.page.reload({ waitUntil: "networkidle" });
        const expectVisible = await sfPage.genLoc(staticContentPage.getXpathByText(caseConf.expect)).isVisible();
        if (expectVisible) {
          break;
        }
      }
      await expect.soft(sfPage.genLoc(xpath.optionManual)).toHaveText(caseConf.expect);
    });

    await test.step(`Vào lại language editor trong DB > Click button Reset to default`, async () => {
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.searchKey(data.key_search);
      await expect
        .soft(staticContentPage.genLoc(staticContentPage.getXpathPhrase(data.key_name)))
        .toHaveAttribute("title", data.phrase_default);
    });
  });
});
