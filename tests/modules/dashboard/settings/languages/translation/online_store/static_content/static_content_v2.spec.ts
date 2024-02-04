import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation//translation-detail";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SfTranslation } from "@pages/dashboard/sf-translation";

test.describe("Verify Translation detail của Online store - static content Roller ", () => {
  let staticContentPage: TranslationDetail;
  let sfPage: SfTranslation;
  let data;
  let xpath: Blocks;
  let reloadTime;

  test.beforeEach(async ({ dashboard, page, conf, theme }) => {
    staticContentPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    xpath = new Blocks(dashboard, conf.suiteConf.domain);
    sfPage = new SfTranslation(page, conf.suiteConf.domain);
    data = conf.caseConf.data;
    reloadTime = conf.suiteConf.reload_time;

    await test.step("Pre-condition: setting Theme Layout ", async () => {
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.theme_id) {
        await theme.publish(conf.suiteConf.theme_id);
      }
    });
  });

  test(`@SB_SET_TL_31 [DB+SF - Function] Check change ngôn ngữ thành công Online store - static content với Page = Cart + theme Roller + language = French`, async ({
    conf,
    dashboard,
    page,
  }) => {
    test.slow();
    const domain = conf.suiteConf.domain;
    const caseConf = conf.caseConf;

    await test.step(`- Chọn thông tin:  
    + theme = roller theme  
    + page = Cart  
    + language = French`, async () => {
      await dashboard.goto(
        `https://${domain}/admin/settings/language/${data.language_code}/edit?type=static-content&handle=2`,
      );
      await dashboard.waitForLoadState("networkidle");
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
      await staticContentPage.searchKey(data.key_search);
      await expect(staticContentPage.genLoc(staticContentPage.xpathTD.key(data.key_name))).toBeVisible();
    });

    await test.step(`Edit data phrase của key "empty"  > click ra vùng ngoài `, async () => {
      await staticContentPage.editPhrase(data.key_name, data.edit_phrase);
      await expect(staticContentPage.genLoc(staticContentPage.xpathBtnWithLabel("Save"))).toBeVisible();
    });

    await test.step(`Click button Save > open cart page ngoài SF > Change ngôn ngữ = Francaise `, async () => {
      await staticContentPage.clickBtnSave();
      await sfPage.goto(`https://${domain}/${data.cart_handle}`);
      await page.waitForLoadState("networkidle");
      await page.locator(xpath.btnLocaleRoller).scrollIntoViewIfNeeded();
      await page.locator(xpath.btnLocaleRoller).click();
      await page.locator(xpath.getXpathLocaleRoller(data.change_lang)).click();
      await sfPage.clickOnBtnWithLabel("Done");
      await sfPage.waitResponseWithUrl(`/apps/assets/locales/${data.language_code}.json`);

      for (let i = 0; i < reloadTime; i++) {
        await sfPage.page.waitForTimeout(10 * 1000);
        await sfPage.page.reload({ waitUntil: "networkidle" });
        const expectVisible = await sfPage.genLoc(staticContentPage.getXpathByText(caseConf.expect)).isVisible();
        if (expectVisible) {
          break;
        }
      }
      await expect(page.locator(xpath.cartEmpty)).toHaveText(caseConf.expect);
    });

    await test.step(`Vào lại language editor trong DB > Click button Reset to default`, async () => {
      await staticContentPage.resetKeyToDefault();
      await staticContentPage.chooseEntityTranslate(caseConf.entity_translate);
      await staticContentPage.searchKey(data.key_search);
      await expect(staticContentPage.genLoc(staticContentPage.getXpathPhrase(data.key_name))).toHaveAttribute(
        "title",
        data.phrase_default,
      );
    });
  });
});
