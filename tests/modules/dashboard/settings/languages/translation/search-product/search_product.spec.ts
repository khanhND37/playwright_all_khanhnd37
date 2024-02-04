import { expect, test } from "@fixtures/website_builder";
import { SFHome } from "@pages/storefront/homepage";
import { SfTranslation } from "@pages/dashboard/sf-translation";
import { pressControl } from "@core/utils/keyboard";

let sfPage: SFHome;
let sfTranslation: SfTranslation;

test.describe("Verify block Product Search", () => {
  test(`@SB_NEWECOM_PS_179 [SF - Desktop - Function] Kiểm tra tính năng search product khi chọn ngôn ngữ khác ngôn ngữ default`, async ({
    page,
    conf,
    cConf,
  }) => {
    test.slow();
    sfPage = new SFHome(page, conf.suiteConf.domain);
    sfTranslation = new SfTranslation(page, conf.suiteConf.domain);
    let result = [];

    await test.step(`Pre-condition`, async () => {
      await sfPage.gotoHomePage();
      await sfTranslation.changeSettingLanguage({ language: cConf.language_sf });
      await sfTranslation.page.waitForTimeout(5 * 1000); //wait for page stable
    });

    for (const data of cConf.data) {
      await test.step(`${data.step_desc}`, async () => {
        await sfTranslation.waitUntilElementVisible(sfPage.xpathSearchBar);
        await sfTranslation.genLoc(sfPage.xpathSearchBar).click();
        await sfTranslation.genLoc(sfPage.xpathSearchBar).fill(data.key);
        await expect(sfTranslation.genLoc(sfPage.xpathSearchSuggestion)).toBeVisible();

        result = await sfTranslation.getSearchSuggestion();
        expect.soft(result).toEqual(expect.arrayContaining(data.expected_result));

        await pressControl(sfTranslation.page, "Enter");
        await sfTranslation.page.waitForLoadState("networkidle");

        try {
          await expect(sfTranslation.genLoc(sfTranslation.xpathSearch.productListSearch)).toBeVisible();
        } catch (error) {
          await sfTranslation.page.reload();
          await sfTranslation.page.waitForLoadState("networkidle");
          await expect(sfTranslation.genLoc(sfTranslation.xpathSearch.productListSearch)).toBeVisible();
        }

        result = await sfTranslation.getSearchResultOnProductListSearch();
        expect.soft(result).toEqual(expect.arrayContaining(data.expected_result));

        await sfPage.gotoHomePage();
        await sfTranslation.page.waitForLoadState("networkidle");
      });
    }

    await test.step(`Chọn về ngôn ngữ English ngoài SF, search keyword tiếng Việt`, async () => {
      await sfTranslation.changeSettingLanguage({ language: cConf.default_language_sf });
      await sfTranslation.page.waitForTimeout(5 * 1000); //wait for page stable

      await sfTranslation.waitUntilElementVisible(sfPage.xpathSearchBar);
      await sfTranslation.genLoc(sfPage.xpathSearchBar).click();
      await sfTranslation.genLoc(sfPage.xpathSearchBar).fill(cConf.data_step_3.key);
      await expect(sfTranslation.genLoc(sfPage.xpathSearchSuggestion)).toBeVisible();

      result = await sfTranslation.getSearchSuggestion();
      expect.soft(result).toEqual(expect.arrayContaining(cConf.data_step_3.expected_result));

      await pressControl(sfTranslation.page, "Enter");
      await sfTranslation.page.waitForLoadState("networkidle");

      try {
        await expect(sfTranslation.genLoc(sfTranslation.xpathSearch.productListSearch)).toBeVisible();
      } catch (error) {
        await sfTranslation.page.reload();
        await sfTranslation.page.waitForLoadState("networkidle");
        await expect(sfTranslation.genLoc(sfTranslation.xpathSearch.productListSearch)).toBeVisible();
      }

      result = await sfTranslation.getSearchResultOnProductListSearch();
      expect.soft(result).toEqual(expect.arrayContaining(cConf.data_step_3.expected_result));
    });
  });

  test(`@SB_NEWECOM_PS_178 [SF - Mobile - Function] Kiểm tra tính năng search product khi chọn ngôn ngữ khác ngôn ngữ default`, async ({
    pageMobile,
    conf,
    cConf,
  }) => {
    test.slow();
    sfPage = new SFHome(pageMobile, conf.suiteConf.domain);
    sfTranslation = new SfTranslation(pageMobile, conf.suiteConf.domain);
    let result = [];

    await test.step(`Pre-condition`, async () => {
      await sfPage.gotoHomePage();
      await sfTranslation.changeSettingLanguage({ language: cConf.language_sf });
      await sfTranslation.page.waitForTimeout(5 * 1000); //wait for page stable
    });

    for (const data of cConf.data) {
      await test.step(`${data.step_desc}`, async () => {
        await sfTranslation.waitUntilElementVisible(sfPage.xpathSearchBar);
        await sfTranslation.genLoc(sfPage.xpathSearchBar).click();
        await sfTranslation.genLoc(sfPage.xpathSearchBar).fill(data.key);
        await expect(sfTranslation.genLoc(sfPage.xpathSearchSuggestion)).toBeVisible();

        result = await sfTranslation.getSearchSuggestion();
        expect.soft(result).toEqual(expect.arrayContaining(data.expected_result));

        await pressControl(sfTranslation.page, "Enter");
        await sfTranslation.page.waitForLoadState("networkidle");

        try {
          await expect(sfTranslation.genLoc(sfTranslation.xpathSearch.productListSearch)).toBeVisible();
        } catch (error) {
          await sfTranslation.page.reload();
          await sfTranslation.page.waitForLoadState("networkidle");
          await expect(sfTranslation.genLoc(sfTranslation.xpathSearch.productListSearch)).toBeVisible();
        }

        result = await sfTranslation.getSearchResultOnProductListSearch();
        expect.soft(result).toEqual(expect.arrayContaining(data.expected_result));

        await sfPage.gotoHomePage();
        await sfTranslation.page.waitForLoadState("networkidle");
      });
    }

    await test.step(`Chọn về ngôn ngữ English ngoài SF, search keyword tiếng Việt`, async () => {
      await sfTranslation.changeSettingLanguage({ language: cConf.default_language_sf });
      await sfTranslation.page.waitForTimeout(5 * 1000); //wait for page stable

      await sfTranslation.waitUntilElementVisible(sfPage.xpathSearchBar);
      await sfTranslation.genLoc(sfPage.xpathSearchBar).click();
      await sfTranslation.genLoc(sfPage.xpathSearchBar).fill(cConf.data_step_3.key);
      await expect(sfTranslation.genLoc(sfPage.xpathSearchSuggestion)).toBeVisible();

      result = await sfTranslation.getSearchSuggestion();
      expect.soft(result).toEqual(expect.arrayContaining(cConf.data_step_3.expected_result));

      await pressControl(sfTranslation.page, "Enter");
      await sfTranslation.page.waitForLoadState("networkidle");

      try {
        await expect(sfTranslation.genLoc(sfTranslation.xpathSearch.productListSearch)).toBeVisible();
      } catch (error) {
        await sfTranslation.page.reload();
        await sfTranslation.page.waitForLoadState("networkidle");
        await expect(sfTranslation.genLoc(sfTranslation.xpathSearch.productListSearch)).toBeVisible();
      }

      result = await sfTranslation.getSearchResultOnProductListSearch();
      expect.soft(result).toEqual(expect.arrayContaining(cConf.data_step_3.expected_result));
    });
  });
});
