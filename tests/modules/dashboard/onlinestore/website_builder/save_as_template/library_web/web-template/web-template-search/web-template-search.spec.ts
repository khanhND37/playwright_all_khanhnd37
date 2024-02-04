import { expect, test } from "@fixtures/website_builder";
import { WbLibrary } from "@pages/dashboard/wb_library";

test.describe("Verify setting của web template", () => {
  let wbPage: WbLibrary;
  test(`@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_122 Check search template tại library detail với web template & page template`, async ({
    snapshotFixture,
    conf,
    dashboard,
  }) => {
    const env = process.env.ENV;
    // On prodtest, we can't search. So skip this case on prodtest env
    // https://ocgwp.slack.com/archives/C03NUUEHGLU/p1690446596169259?thread_ts=1690440604.439379&cid=C03NUUEHGLU
    if (env === "prodtest") {
      return;
    }
    wbPage = new WbLibrary(dashboard, conf.suiteConf.domain);
    const webTemplatePos = wbPage.libraryTabs["Web templates"].position;
    const pageTemplatePos = wbPage.libraryTabs["Page templates"].position;

    await test.step(`Dash board > library detail: mở tab web template`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.editLibrary(conf.suiteConf.library_info.id);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);

      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathSearchBar(webTemplatePos),
        snapshotName: `${env}-122-1-${conf.caseConf.snapshot.web_template.search_bar}.png`,
      });
    });

    await test.step(`Nhập kí tự có kết quả`, async () => {
      let searchValue: string;
      //search by ID
      const templateID: string = await wbPage.page
        .locator(
          `//p[@class="card-template__info--name" and contains(text(), '${conf.caseConf.web_template_name}')]/parent::div//p[@class="card-template__info--template-id"]`,
        )
        .first()
        .innerText();
      searchValue = templateID.split(":").map(v => v.trim())[1];

      const tabName = "Web templates";
      const tabPosition = wbPage.libraryTabs[tabName].position;

      await wbPage.inputSearch(searchValue, tabName);
      await expect(wbPage.getLocatorNotEmptyTab(tabPosition)).toHaveCount(1);

      //search by Name
      searchValue = `${conf.caseConf.web_template_name}`;
      await wbPage.inputSearch(searchValue, "Web templates");
      await expect(wbPage.getLocatorNotEmptyTab(tabPosition)).toHaveCount(2);
    });

    await test.step(`Switch sang các tab còn lại`, async () => {
      await wbPage.switchToTab(wbPage.libraryTabs["Page templates"].name);
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathSearchBar(pageTemplatePos),
        snapshotName: `${env}-122-1-${conf.caseConf.snapshot.web_template.search_bar}.png`,
      });
    });

    await test.step(`Nhập kí tự không có kết quả`, async () => {
      const tabName = "Web templates";
      await wbPage.switchToTab(tabName);
      //search by id
      let searchValue = `${conf.suiteConf.search.web_template.empty_result.id}`;
      await wbPage.inputSearch(searchValue, tabName);

      await expect(
        wbPage.page.locator(`//p[contains(text(),'Could not find any results for ${searchValue}')] >> nth=0`),
      ).toBeVisible();

      //search by name
      searchValue = `${conf.suiteConf.search.web_template.empty_result.name}`;
      await wbPage.inputSearch(searchValue, "Web templates");

      await expect(
        wbPage.page.locator(`//p[contains(text(),'Could not find any results for ${searchValue}')] >> nth=0`),
      ).toBeVisible();
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathTabPanel(webTemplatePos),
        snapshotName: `${env}-122-6-${conf.caseConf.snapshot.web_template.search_empty.by_name}.png`,
      });
    });

    await test.step(`Dash board > library detail: mở tab page template`, async () => {
      await wbPage.switchToTab("Page templates");

      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathSearchBar(pageTemplatePos),
        snapshotName: `${env}-122-1-${conf.caseConf.snapshot.web_template.search_bar}.png`,
      });
    });

    await test.step(`Nhập kí tự có kết quả`, async () => {
      let searchValue: string;
      //search by ID
      const templateID: string = await wbPage.page
        .locator(
          `//p[@class="card-template__info--name" and contains(text(), '${conf.caseConf.page_template_name}')]/parent::div//p[@class="card-template__info--template-id"]`,
        )
        .first()
        .innerText();
      searchValue = templateID.split(":").map(v => v.trim())[1];

      const tabName = "Page templates";
      const tabPosition = wbPage.libraryTabs[tabName].position;

      await wbPage.inputSearch(searchValue, "Page templates");
      await expect(wbPage.getLocatorNotEmptyTab(tabPosition)).toHaveCount(1);

      //search by Name
      searchValue = `${conf.caseConf.page_template_name}`;
      await wbPage.inputSearch(searchValue, "Page templates");
      await expect(wbPage.getLocatorNotEmptyTab(tabPosition)).toHaveCount(2);
    });

    await test.step(`Switch sang các tab còn lại`, async () => {
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathSearchBar(webTemplatePos),
        snapshotName: `${env}-122-1-${conf.caseConf.snapshot.web_template.search_bar}.png`,
      });
    });

    await test.step(`Nhập kí tự không có kết quả`, async () => {
      const tabName = "Page templates";
      await wbPage.switchToTab(tabName);
      //search by id
      let searchValue = `${conf.suiteConf.search.page_template.empty_result.id}`;
      await wbPage.inputSearch(searchValue, tabName);
      await expect(
        wbPage.page.locator(`//p[contains(text(),'Could not find any results for ${searchValue}')] >> nth=0`),
      ).toBeVisible();

      //search by name
      searchValue = `${conf.suiteConf.search.page_template.empty_result.name}`;
      await wbPage.inputSearch(searchValue, "Page templates");

      await expect(
        wbPage.page.locator(`//p[contains(text(),'Could not find any results for ${searchValue}')] >> nth=0`),
      ).toBeVisible();
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathTabPanel(pageTemplatePos),
        snapshotName: `${env}-122-12-${conf.caseConf.snapshot.page_template.search_empty.by_name}.png`,
      });
    });
  });
});
