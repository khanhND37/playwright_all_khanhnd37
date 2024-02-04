import { test } from "@core/fixtures";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { expect } from "@playwright/test";

const caseConf = {
  caseCode: "SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_123",
  libraryEmpty: {},
  search: {
    sectionTemplate: {
      haveResult: {
        name: "COLLECTION 01",
        collectionName: "Category collection",
      },
      emptyResult: {
        id: 6257,
        name: "A fake collection",
      },
    },
    blockTemplate: {
      haveResult: {
        name: "HeADinG 02",
        collectionName: "Category heading",
      },
      emptyResult: {
        id: 6259,
        name: "A fake heading",
      },
    },
    styleTemplate: {
      haveResult: {
        name: "COLOR 02",
      },
      emptyResult: {
        name: "A fake color",
      },
    },
  },
  snapshot: {
    sectionTemplate: {
      searchBar: "section-search-bar",
      searchHaveResult: {
        byName: "section-search-have-result-name",
      },
      searchEmpty: {
        byId: "section-search-empty-id",
        byName: "section-search-empty-name",
      },
    },
    blockTemplate: {
      searchBar: "block-search-bar",
      searchHaveResult: {
        byName: "block-search-have-result-name",
      },
      searchEmpty: {
        byId: "block-search-empty-id",
        byName: "block-search-empty-name",
      },
    },
    styleTemplate: {
      searchBar: "style-search-bar",
      searchHaveResult: {
        byName: "style-search-have-result-name",
      },
      searchEmpty: {
        byId: "style-search-empty-id",
        byName: "style-search-empty-name",
      },
    },
  },
};

test.describe("Verify setting của web template", () => {
  let wbPage: WbLibrary;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.slow();
    if (process.env.ENV === "prodtest") {
      return;
    }
    wbPage = new WbLibrary(dashboard, conf.suiteConf.domain);
    await test.step(`Login vào shop, vào menu Online Store`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.waitUtilSkeletonDisappear();
      await wbPage.goToLibraryDetail(conf.suiteConf.library_info.id);
    });
  });

  test(`@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_123 Check search template tại library detail với section, block, style template`, async ({
    snapshotFixture,
  }) => {
    const env = process.env.ENV;
    // On prodtest, we can't search. So skip this case on prodtest env
    // https://ocgwp.slack.com/archives/C03NUUEHGLU/p1690446596169259?thread_ts=1690440604.439379&cid=C03NUUEHGLU
    if (env === "prodtest") {
      return;
    }

    const sectionTemplatePos = wbPage.libraryTabs["Section templates"].position;
    const blockTemplatePos = wbPage.libraryTabs["Block templates"].position;

    await test.step(`Dashboard > library detail: mở tab section template`, async () => {
      await wbPage.switchToTab(wbPage.libraryTabs["Section templates"].name);

      const searchInputValue = await wbPage.getLocatorSearchInput(sectionTemplatePos).inputValue();
      expect(searchInputValue).toEqual("");
    });

    await test.step(`Nhập kí tự có kết quả: (chỉ có tính năng search theo tên, không có search theo ID)- Tên template: nhập 1 phần, không phân biệt hoa thường`, async () => {
      const searchValue = `${caseConf.search.sectionTemplate.haveResult.name}`;
      const collectionName = caseConf.search.sectionTemplate.haveResult.collectionName;
      await wbPage.switchToTab(wbPage.libraryTabs["Section templates"].name);
      await wbPage.inputSearch(searchValue, "Section templates");

      const searchCategoryLoc = wbPage.genLoc(wbPage.getXpathCategory(collectionName));
      await expect(searchCategoryLoc).toBeVisible();
      // Click open category
      await wbPage.genLoc(wbPage.getXpathCategory(collectionName)).click();
      await wbPage.page.waitForTimeout(4 * 1000); // wait for css transition completed

      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathTabPanel(sectionTemplatePos),
        snapshotName: `${env}-123-1-${caseConf.snapshot.sectionTemplate.searchHaveResult.byName}.png`,
      });
    });

    await test.step(`Nhập kí tự không có kết quả`, async () => {
      let searchValue = `${caseConf.search.sectionTemplate.emptyResult.id}`;
      const tabPosition = wbPage.libraryTabs["Section templates"].position;
      await wbPage.inputSearch(searchValue, "Section templates");
      await wbPage.genLoc(wbPage.xpathLib.titleLibrary).click({ delay: 2000 });

      await expect(wbPage.getLocatorEmptyTab(tabPosition)).toBeVisible();
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathTabPanel(sectionTemplatePos),
        snapshotName: `${env}-123-2-${caseConf.snapshot.sectionTemplate.searchEmpty.byId}.png`,
      });

      searchValue = `${caseConf.search.sectionTemplate.emptyResult.name}`;
      await wbPage.inputSearch(searchValue, "Section templates");
      await wbPage.genLoc(wbPage.xpathLib.titleLibrary).click({ delay: 2000 });
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathTabPanel(sectionTemplatePos),
        snapshotName: `${env}-123-3-${caseConf.snapshot.sectionTemplate.searchEmpty.byName}.png`,
      });
    });

    await test.step(`Switch sang tab "Block templates"`, async () => {
      await wbPage.switchToTab("Block templates");

      const searchInputValue = await wbPage.getLocatorSearchInput(blockTemplatePos).inputValue();
      expect(searchInputValue).toEqual("");
    });

    await test.step(`Nhập kí tự có kết quả: (chỉ có tính năng search theo tên, không có search theo ID)- Tên template: nhập 1 phần, không phân biệt hoa thường`, async () => {
      const searchValue = `${caseConf.search.blockTemplate.haveResult.name}`;
      const collectionName = caseConf.search.blockTemplate.haveResult.collectionName;
      await wbPage.inputSearch(searchValue, "Block templates");
      await wbPage.genLoc(wbPage.xpathLib.titleLibrary).click({ delay: 3000 });

      const searchCategoryLoc = wbPage.genLoc(wbPage.getXpathCategory(collectionName));
      await expect(searchCategoryLoc).toBeVisible();
      // Click open category
      await wbPage.genLoc(wbPage.getXpathCategory(collectionName)).click();
      await wbPage.page.waitForTimeout(2 * 1000); // wait for css transition completed

      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathTabPanel(blockTemplatePos),
        snapshotName: `${env}-123-4-${caseConf.snapshot.blockTemplate.searchHaveResult.byName}.png`,
      });
    });

    await test.step(`Nhập kí tự không có kết quả`, async () => {
      let searchValue = `${caseConf.search.blockTemplate.emptyResult.id}`;
      const tabPosition = wbPage.libraryTabs["Block templates"].position;
      await wbPage.inputSearch(searchValue, "Block templates");
      await wbPage.genLoc(wbPage.xpathLib.titleLibrary).click({ delay: 2000 });

      await expect(wbPage.getLocatorEmptyTab(tabPosition)).toBeVisible();
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathTabPanel(blockTemplatePos),
        snapshotName: `${env}-123-5-${caseConf.snapshot.blockTemplate.searchEmpty.byId}.png`,
      });

      searchValue = `${caseConf.search.blockTemplate.emptyResult.name}`;
      await wbPage.inputSearch(searchValue, "Block templates");
      await wbPage.genLoc(wbPage.xpathLib.titleLibrary).click({ delay: 2000 });
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.getXpathTabPanel(blockTemplatePos),
        snapshotName: `${env}-123-6-${caseConf.snapshot.blockTemplate.searchEmpty.byName}.png`,
      });
    });

    await test.step(`Switch sang tab "Styles"`, async () => {
      await wbPage.switchToTab("Styles");

      const searchInputValue = await wbPage.genLoc("//input[@placeholder='Search template']").last().inputValue();
      await expect(searchInputValue).toEqual("");
    });

    await test.step(`Nhập kí tự có kết quả: (chỉ có tính năng search theo tên, không có search theo ID)
- Tên template: nhập 1 phần, không phân biệt hoa thường`, async () => {
      const searchValue = `${caseConf.search.styleTemplate.haveResult.name}`;
      await wbPage.inputSearch(searchValue, "Styles");
      await wbPage.genLoc(wbPage.xpathLib.titleLibrary).click({ delay: 3000 });

      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.xpathLib.xpathOnWB.stylesTab,
        snapshotName: `${env}-123-7-${caseConf.snapshot.styleTemplate.searchHaveResult.byName}.png`,
      });
    });

    await test.step(`Nhập kí tự không có kết quả`, async () => {
      const searchValue = `${caseConf.search.styleTemplate.emptyResult.name}`;
      await wbPage.inputSearch(searchValue, "Styles");
      await wbPage.genLoc(wbPage.xpathLib.titleLibrary).click({ delay: 2000 });

      await expect(
        wbPage.genLoc(`//p[normalize-space()='Could not find any results for ${searchValue}']`).last(),
      ).toBeVisible();
      await snapshotFixture.verify({
        page: wbPage.page,
        selector: wbPage.xpathLib.xpathOnWB.stylesTab,
        snapshotName: `${env}-123-8-${caseConf.snapshot.styleTemplate.searchEmpty.byName}.png`,
      });
    });
  });
});
