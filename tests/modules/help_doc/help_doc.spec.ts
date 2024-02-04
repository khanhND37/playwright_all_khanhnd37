import { snapshotDir } from "@core/utils/theme";
import { expect, test } from "@core/fixtures";
import { HelpDocAPI } from "@pages/thirdparty/helpdoc";

test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

test.describe("Verify hiển thi section Shopbase Creator", async () => {
  test("Verify hiển thị section Shopbase Creator tại trang chủ của Crisp @SB_HC_12", async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    await page.goto(conf.suiteConf.help_link);
    const xpathSectionCreator =
      "(//section[descendant::h4[normalize-space()='About us']]" +
      "//li[descendant::span[normalize-space()='About ShopBase Creator']])[2]";

    await test.step("Verify hiển thị section Shopbase Creator tại mục About us theo language", async () => {
      await snapshotFixture.verify({
        page: page,
        selector: xpathSectionCreator,
        snapshotName: conf.caseConf.screenshot_on_about_us,
      });
    });

    await test.step("Click section Shopbase Creator", async () => {
      await page.locator(xpathSectionCreator).click();
      expect(page.url()).toContain(conf.caseConf.category_link);
      await page.goBack();
    });

    await test.step("Verify hiển thị mục Explore Shopbase Creator Features", async () => {
      const xpathTitle = "//div[child::h4[normalize-space()='Explore ShopBase Creator Features']]";
      await snapshotFixture.verify({
        page: page,
        selector: xpathTitle,
        snapshotName: conf.caseConf.screenshot_on_explore_title,
      });
      for (let i = 0; i < conf.caseConf.section_on_explore.length; i++) {
        const xpathSection =
          `(//div[child::h4[normalize-space()='Explore ShopBase Creator Features']]` +
          `//following::li[descendant::span[normalize-space()='${conf.caseConf.section_on_explore[i].section}']])[1]`;

        await snapshotFixture.verify({
          page: page,
          selector: xpathSection,
          snapshotName: conf.caseConf.section_on_explore[i].screenshot,
        });
      }
    });

    await test.step("Click các section trong mục Explore Shopbase Creator", async () => {
      for (let i = 0; i < conf.caseConf.section_on_explore.length; i++) {
        const xpathSection =
          `//div[child::h4[normalize-space()='Explore ShopBase Creator Features']]` +
          `//following::li[descendant::span[normalize-space()='${conf.caseConf.section_on_explore[i].section}']][1]`;
        const link = `/category/${conf.caseConf.section_on_explore[i].section.replaceAll(" ", "-").toLowerCase()}`;
        await page.locator(xpathSection).click();
        expect(page.url()).toContain(link);
        await page.goBack();
      }
    });
  });

  test("Verify search result help doc theo keyword @SB_HC_IMS_6", async ({ page, conf }) => {
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const caseData = conf.caseConf.data[i];
      const helpAPI = new HelpDocAPI(page, conf.suiteConf.help_link);
      await test.step(`Send request với ${caseData.case_name}`, async () => {
        const actualTitle = await helpAPI.getSearchData(conf.suiteConf.typesense_key_value, caseData.param);
        expect(actualTitle.title).toContain(caseData.result.title);
        expect(actualTitle.content).toContain(caseData.result.content);
      });
    }
  });
});
