/* eslint-disable playwright/no-wait-for-timeout */
import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { snapshotDir } from "@utils/theme";
import { TemplateStorePage } from "@sf_pages/template_store";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { AccountPage } from "@pages/dashboard/accounts";
import { WebBuilder } from "@pages/dashboard/web_builder";

let accessToken: string,
  templateStore: TemplateStorePage,
  themes: ThemeEcom,
  accountPage: AccountPage,
  webBuilder: WebBuilder;

test.describe("Verify update template store", () => {
  test.beforeEach(async ({ dashboard, conf, token }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    await themes.deleteAllThemesUnPublish(accessToken);
  });

  test(`@SB_NEWECOM_TS_80 Check list web templates trên Template store được lấy từ list web template trong Web Base Library`, async ({
    context,
    dashboard,
    page,
    conf,
    builder,
  }) => {
    if (process.env.ENV === "prod") {
      return;
    }
    templateStore = new TemplateStorePage(page);
    const template = conf.suiteConf.shop_template;
    await test.step(`Đi đến Template store tab Web template từ url`, async () => {
      await page.goto(conf.suiteConf.link_web);
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      const isAllBtnSelected = (
        await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isAllBtnSelected).toEqual(true);

      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      for (const title of titleList) {
        await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
      }
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      expect(titleList.length).toEqual(noOfTemplatesMatch);
    });

    await test.step(`Add thêm 1 web template trong Web Base Library (Chỉ test trên môi trường dev, prodtest)`, async () => {
      accountPage = new AccountPage(dashboard, template.domain);
      await accountPage.login({
        email: template.username,
        password: template.password,
        redirectToAdmin: true,
      });
      await dashboard.waitForLoadState("networkidle");
      await dashboard.goto(`https://${template.domain}/admin/themes/library/1`);
      await dashboard.waitForLoadState("networkidle");
      await templateStore.addWebBaseTemplate(dashboard, template.new_template_id);
      const store = await context.newPage();
      await store.goto(conf.suiteConf.link_web), await store.waitForLoadState("networkidle");
      const xpathTemplateCard = `//*[@alt="${template.template_name}"]//ancestor::div[contains(@class, 'sb-choose-template__wrap')]`;
      await expect(store.locator(xpathTemplateCard)).toBeVisible();
      await store.close();
    });

    await test.step(`deactive 1 web template trong Web Base Library (Chỉ test trên môi trường dev, prodtest)`, async () => {
      await templateStore.switchToggleActiveTemplate(dashboard, template.new_template_id, false);
      const store = await context.newPage();
      await store.goto(conf.suiteConf.link_web), await store.waitForLoadState("networkidle");
      const xpathTemplateCard = `//*[@alt="${template.template_name}"]//ancestor::div[contains(@class, 'sb-choose-template__wrap')]`;
      await expect(store.locator(xpathTemplateCard)).toBeHidden();
      await store.close();
    });

    await test.step(`Active 1 web template trong Web Base Library (Chỉ test trên môi trường dev, prodtest)`, async () => {
      await templateStore.switchToggleActiveTemplate(dashboard, template.new_template_id, true);
      const store = await context.newPage();
      await store.goto(conf.suiteConf.link_web), await store.waitForLoadState("networkidle");
      const xpathTemplateCard = `//*[@alt="${template.template_name}"]//ancestor::div[contains(@class, 'sb-choose-template__wrap')]`;
      await expect(store.locator(xpathTemplateCard)).toBeVisible();
      await store.close();
    });

    await test.step(`Xóa 1 web template trong Web Base Library (Chỉ test trên môi trường dev, prodtest)`, async () => {
      await dashboard
        .locator(
          `//*[contains(text(),'${template.new_template_id}')]//ancestor::div[@class="card-template__info"]//div[contains(@class, 'info--actions')]`,
        )
        .click();
      await dashboard
        .getByRole("tooltip", { name: /Edit info/i })
        .getByText("Delete")
        .click();
      await dashboard.getByRole("button", { name: "Delete template" }).click();
      const store = await context.newPage();
      await store.goto(conf.suiteConf.link_web), await store.waitForLoadState("networkidle");
      const xpathTemplateCard = `//*[@alt="${template.template_name}"]//ancestor::div[contains(@class, 'sb-choose-template__wrap')]`;
      await expect(store.locator(xpathTemplateCard)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_TS_83 Check hiển thị thông tin Merchant có thể xem được của các web template trên Template store`, async ({
    builder,
    dashboard,
    page,
    conf,
    context,
    snapshotFixture,
  }) => {
    if (process.env.ENV === "prod") {
      return;
    }
    test.slow();
    templateStore = new TemplateStorePage(page);
    const template = conf.suiteConf.shop_template;
    await test.step(`Đi đến Template store tab Web template từ url`, async () => {
      templateStore = new TemplateStorePage(page);
      await page.goto(conf.suiteConf.link_web);
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      const isAllBtnSelected = (
        await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isAllBtnSelected).toEqual(true);

      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      for (const title of titleList) {
        await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
      }
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      expect(titleList.length).toEqual(noOfTemplatesMatch);

      for (const data of conf.suiteConf.data) {
        const xpathTemplateCard = `//*[@alt="${data.template_name}"]//ancestor::div[contains(@class, 'sb-choose-template__wrap')]`;
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: xpathTemplateCard,
          snapshotName: `${process.env.ENV}-${data.template_name}-${data.snapshot}`,
        });
      }
    });

    await test.step(`Edit web template name, tags, ảnh thumbnail trong Web Base Library (Chỉ test trên môi trường dev, prodtest)`, async () => {
      accountPage = new AccountPage(dashboard, template.domain);
      await accountPage.login({
        email: template.username,
        password: template.password,
        redirectToAdmin: true,
      });
      await dashboard.waitForLoadState("networkidle");
      await dashboard.goto(`https://${template.domain}/admin/themes/library/1`);
      await dashboard.waitForLoadState("networkidle");
      await templateStore.addWebBaseTemplate(dashboard, template.new_template_id);
      const store = await context.newPage();
      await store.goto(conf.suiteConf.link_web), await store.waitForLoadState("networkidle");
      const xpathTemplateCard = `//*[@alt="${template.template_name}"]//ancestor::div[contains(@class, 'sb-choose-template__wrap')]`;
      await snapshotFixture.verifyWithAutoRetry({
        page: store,
        selector: xpathTemplateCard,
        snapshotName: `${process.env.ENV}-${template.template_name}-UI-default.png`,
      });

      await templateStore.editTemplate(
        dashboard,
        template.new_template_id,
        template.selling_type,
        template.industry,
        conf.caseConf.label_image,
        conf.caseConf.file_thumbnail,
      );
      await store.reload();
      await store.waitForLoadState("networkidle");
      await store.waitForSelector(xpathTemplateCard, { state: "visible" });
      const popupCloseBtn = dashboard.locator(templateStore.templateModalCloseBtnSelector);
      if (await popupCloseBtn.isVisible()) {
        await popupCloseBtn.click();
      }
      await snapshotFixture.verifyWithAutoRetry({
        page: store,
        selector: xpathTemplateCard,
        snapshotName: `${process.env.ENV}-${template.template_name}-UI-change-image.png`,
      });
    });
    await test.step(`After: delete template,`, async () => {
      await dashboard
        .locator(
          `//*[contains(text(),'${template.new_template_id}')]//ancestor::div[@class="card-template__info"]//div[contains(@class, 'info--actions')]`,
        )
        .click();
      await dashboard
        .getByRole("tooltip", { name: /Edit info/i })
        .getByText("Delete")
        .click();
      await dashboard.getByRole("button", { name: "Delete template" }).click();
    });
  });

  test(`@SB_NEWECOM_TS_84 Check search function tab Web template trên Template store`, async ({
    page,
    conf,
    builder,
    snapshotFixture,
  }) => {
    if (process.env.ENV === "prodtest") {
      return;
    }
    const data = conf.caseConf.data;
    await test.step(`Đi đến Template store tab Web template từ url`, async () => {
      templateStore = new TemplateStorePage(page);
      await page.goto(conf.suiteConf.link_web);
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      const isAllBtnSelected = (
        await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isAllBtnSelected).toEqual(true);

      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      for (const title of titleList) {
        await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
      }
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      expect(titleList.length).toEqual(noOfTemplatesMatch);
    });

    await test.step(`Nhập chính xác name/tag web template`, async () => {
      for (const dataSearch of data.search_1.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "desktop");
        await page.waitForTimeout(2000); //wait for search result visible
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
        await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

        const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain, dataSearch);
        const titleList = templateStoreThemeInfo.map(obj => obj.title);
        const tagList = templateStoreThemeInfo.map(obj => obj.tags);

        for (const title of titleList) {
          await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
          if (title !== dataSearch) {
            for (const tag of tagList) {
              expect(tag[0]).toEqual(dataSearch);
            }
          }
        }
        const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
        expect(titleList.length).toEqual(noOfTemplatesMatch);
      }
    });

    await test.step(`Nhập text có kết quả phù hợp với template name/tag (không phân biệt hoa thường)`, async () => {
      for (const dataSearch of data.search_2.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "desktop");
        await page.waitForTimeout(2000); //wait for search result visible
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
        await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

        const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain, dataSearch);

        const titleList = templateStoreThemeInfo.map(obj => obj.title);
        const tagList = templateStoreThemeInfo.map(obj => obj.tags);
        for (const title of titleList) {
          await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
          if (!title.toLowerCase().includes(dataSearch.toLowerCase())) {
            const indexTemplate = titleList.indexOf(title);
            expect(await templateStore.isArrayItemContainText(tagList[indexTemplate], dataSearch)).toEqual(true);
          }
        }
        const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
        expect(titleList.length).toEqual(noOfTemplatesMatch);
      }
    });

    await test.step(`Nhập text không có template name và tag match`, async () => {
      for (const dataSearch of data.search_3.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "desktop");
        await page.waitForTimeout(2000); //wait for search result visible
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await page.waitForSelector(`//span[contains(text(), '${dataSearch}')]`, { state: "visible" });
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: templateStore.xpathEmpty,
          snapshotName: `${process.env.ENV}-data-search-${dataSearch}-${data.snapshot_name.empty_result}`,
        });
      }
    });
  });

  test(`@SB_NEWECOM_TS_85 Check filter theo Selling type tab Web template trên Template store`, async ({
    page,
    conf,
    builder,
  }) => {
    templateStore = new TemplateStorePage(page);
    const data = conf.caseConf.data;
    const xpathSellingType1 = templateStore.xpathSellingTypeDesktop.replace("sellingtype", data.type_1);
    const xpathSellingType2 = templateStore.xpathSellingTypeDesktop.replace("sellingtype", data.type_2);

    await test.step(`Đi đến Template store tab Web template từ url`, async () => {
      await page.goto(conf.suiteConf.link_web);
      const listSellingType = (await builder.getListTagTemplateStore(conf.suiteConf.domain)).default_store_type_tags;
      for (const sellingtype of listSellingType) {
        await page.waitForSelector(`//div[@id="list-selling-type"]//span[normalize-space()='${sellingtype}']`, {
          state: "visible",
        });
      }
      const isAllBtnSelected = (
        await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isAllBtnSelected).toEqual(true);
    });

    await test.step(`Chọn 1 thuộc tính Selling type`, async () => {
      await page.locator(xpathSellingType1).click();
      const isSellingType1Selected = (
        await page.locator(`${xpathSellingType1}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isSellingType1Selected).toEqual(true);
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain, data.type_1);
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      const tagList = templateStoreThemeInfo.map(obj => obj.tags);
      expect(titleList.length).toEqual(noOfTemplatesMatch);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList.length; i++) {
        await page.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
        expect(tagList[i][0]).toEqual(data.type_1);
      }
    });

    await test.step(`Chọn thêm 1 thuộc tính Selling type`, async () => {
      await page.locator(xpathSellingType2).click();
      const isSellingType2Selected = (
        await page.locator(`${xpathSellingType2}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isSellingType2Selected).toEqual(true);
      const isSellingType1Selected = (
        await page.locator(`${xpathSellingType1}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isSellingType1Selected).toEqual(false);
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain, data.type_2);
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      const tagList = templateStoreThemeInfo.map(obj => obj.tags);
      expect(titleList.length).toEqual(noOfTemplatesMatch);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList.length; i++) {
        await page.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
        expect(tagList[i][0]).toEqual(data.type_2);
      }
    });
  });

  test(`@SB_NEWECOM_TS_98 Check popup Template store trong page Product`, async ({ page, conf, builder }) => {
    test.slow();
    const data = conf.caseConf.data;
    templateStore = new TemplateStorePage(page);
    let isListTemplateEmpty: boolean;
    const shopLibraryActiveData = (await builder.listLibrary({ action: "all" }))
      .filter(obj => obj.status.toString().includes("1"))
      .slice(1);
    const shopLibraryActiveIds = shopLibraryActiveData.map(obj => obj.id).toString();

    await test.step(`Mở tab Design của 1 product trong dashboard, click "Create a custom layout"`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await templateStore.getProductNameXpath(data.product_name).click();
      await templateStore.clickElementWithLabel("p", "Design");
      await page.locator(templateStore.xapthCreateCustomLayout).click();
      await page.waitForLoadState("networkidle");
      await page.waitForSelector(templateStore.xpathLoading, { state: "hidden" });
      const isAllBtnSelected = (
        await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isAllBtnSelected).toEqual(true);

      await expect(page.locator(templateStore.templateSearchInputSelector)).toHaveValue(data.search);
      isListTemplateEmpty = await page.locator(templateStore.xpathEmpty).isVisible();

      if (isListTemplateEmpty == false) {
        await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
        await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
        await page.locator(templateStore.xpathTemplateTagList).last().scrollIntoViewIfNeeded();

        const popupPageInfo = await builder.getPageTemplateInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          data.type,
          data.search,
        );

        const titleList = popupPageInfo.map(obj => obj.title);
        const tagList = popupPageInfo.map(obj => obj.tags);
        for (const title of titleList) {
          await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
          if (!title.toLowerCase().includes(data.search.toLowerCase())) {
            const indexTemplate = titleList.indexOf(title);
            expect(await templateStore.isArrayItemContainText(tagList[indexTemplate], data.search)).toEqual(true);
          }
        }
        const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
        expect(titleList.length).toEqual(noOfTemplatesMatch);
      }
    });

    if (isListTemplateEmpty == false) {
      await test.step(`Click 1 tag trên template card`, async () => {
        await page
          .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${data.tag}']`)
          .first()
          .click();
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
        await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
        await templateStore.waitForResponseIfExist("themes.json");
        await page.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });
        const isAllBtnSelected = (
          await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
        ).includes("selected");
        expect(isAllBtnSelected).toEqual(true);

        const popupPageInfo = await builder.getPageTemplateInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          data.type,
          data.search,
          data.tag,
        );
        const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
        const titleList = popupPageInfo.map(obj => obj.title);
        expect(titleList.length).toEqual(noOfTemplatesMatch);

        /*Check Tag được hiển thị lên vị trí đầu tiên của template card
          (nếu có tag trùng với keyword search thì tag được click xếp thứ 2 sau tag được search)*/
        for (let i = 0; i < titleList.length; i++) {
          await page.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
          const textOfFirstTag = await templateStore.getTextOfTag(
            page,
            `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
            1,
          );
          if (textOfFirstTag !== data.tag) {
            const textOfSecondTag = await templateStore.getTextOfTag(
              page,
              `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
              2,
            );
            expect(textOfSecondTag).toEqual(data.tag);
          }
        }
      });
    }
    await test.step(`Click Your templates`, async () => {
      await page.locator(templateStore.xpathYourTemplates).click();
      const shoplibPageInfo = await builder.getShopLibPageInfoInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        data.type,
        shopLibraryActiveIds,
        data.search,
      );

      //verify count đúng số lượng shop library đang active
      const noOfLibrariesDefault = await templateStore.getNumberOfTemplates(page);
      expect(noOfLibrariesDefault).toEqual(shoplibPageInfo.templates.length);

      //Verify list theme visible
      const titleListDefault = shoplibPageInfo.templates.map(obj => obj.title);
      for (const title of titleListDefault) {
        await expect(page.locator(`//p[@title="${title}"]`)).toBeVisible();
      }

      //Verify hiển thị đúng tên lib và số lượng template của từng lib
      if (Array.isArray(shoplibPageInfo.total_libraries)) {
        const shopLibVisibleIdsDefault = shoplibPageInfo.total_libraries.map(obj => obj.library_id);
        const shopLibVisibleTotalDefault = shoplibPageInfo.total_libraries.map(obj => obj.total);

        for (let i = 0; i < shopLibVisibleIdsDefault.length; i++) {
          const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIdsDefault[i])).title;
          await expect(page.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
          const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(page, libraryVisibleTitle);
          expect(templateNumberOfLib).toEqual(shopLibVisibleTotalDefault[i]);
        }
      }
    });

    await test.step(`Click 1 tag trên template card`, async () => {
      await page
        .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${data.tag_your_template}']`)
        .first()
        .click();
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });
      const isYourTemplatesBtnSelected = (
        await page.locator(`${templateStore.xpathYourTemplates}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isYourTemplatesBtnSelected).toEqual(true);

      //Check hiển thị đúng số lượng template
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      const shoplibPageInfo = await builder.getShopLibPageInfoInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        data.type,
        shopLibraryActiveIds,
        data.search,
        data.tag_your_template,
      );

      //verify count đúng số lượng shop library đang active
      const noOfLibraries = await templateStore.getNumberOfTemplates(page);
      expect(noOfLibraries).toEqual(shoplibPageInfo.templates.length);

      //Verify list theme trả về match với tag, tag được filter hiển thị lên đầu
      const titleList = shoplibPageInfo.templates.map(obj => obj.title);
      for (let i = 0; i < titleList.length; i++) {
        await page.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          page,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        if (textOfFirstTag !== data.tag_your_template) {
          const textOfSecondTag = await templateStore.getTextOfTag(
            page,
            `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
            2,
          );
          expect(textOfSecondTag).toEqual(data.tag_your_template);
        }
      }

      //Verify hiển thị đúng tên lib và số lượng template của từng lib
      const shopLibVisibleIds = shoplibPageInfo.total_libraries.map(obj => obj.library_id);
      const shopLibVisibleTotal = shoplibPageInfo.total_libraries.map(obj => obj.total);

      for (let i = 0; i < shopLibVisibleIds.length; i++) {
        const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIds[i])).title;
        await expect(page.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
        const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(page, libraryVisibleTitle);
        expect(templateNumberOfLib).toEqual(shopLibVisibleTotal[i]);
      }
    });

    await test.step(`Nhấn phím ESC`, async () => {
      await page.keyboard.press("Escape");
      await expect(page.locator(templateStore.xpathTemplateStoreHeading)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_TS_99 Check popup Template store trong Online store/page`, async ({
    page,
    conf,
    builder,
    snapshotFixture,
  }) => {
    test.slow();
    const data = conf.caseConf.data;
    const dataYourTemplates = data.data_your_templates;
    templateStore = new TemplateStorePage(page);

    //Lấy data các shop library đang active (trừ Web Base library)
    const shopLibraryActiveData = (await builder.listLibrary({ action: "all" }))
      .filter(obj => obj.status.toString().includes("1"))
      .slice(1);
    const shopLibraryActiveIds = shopLibraryActiveData.map(obj => obj.id).toString();

    await test.step(`Click Online store/Pages -> Click Add new page`, async () => {
      await templateStore.goto(`https://${conf.suiteConf.domain}/admin/pages`);
      await page.locator(templateStore.xpathAddNewPage).click();
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      const isAllBtnSelected = (
        await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isAllBtnSelected).toEqual(true);
      await page.locator(templateStore.xpathTemplateTagList).last().scrollIntoViewIfNeeded();

      const popupPageInfo = await builder.getPageTemplateInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        data.type,
      );
      const titleList = popupPageInfo.map(obj => obj.title);
      for (const title of titleList) {
        await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
      }
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      expect(titleList.length).toEqual(noOfTemplatesMatch);
    });

    await test.step(`Search theo input data`, async () => {
      for (const dataSearch of dataYourTemplates.search) {
        await templateStore.searchTemplateNewUI(dataSearch, "wrapper");
        await page.waitForTimeout(2000); //wait for search result visible
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        const popupPageInfo = await builder.getPageTemplateInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          data.type,
          dataSearch,
        );

        const isEmptyResultVisible = await page.locator(templateStore.xpathEmpty).isVisible();
        if (isEmptyResultVisible == true) {
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: templateStore.xpathEmpty,
            snapshotName: `${process.env.ENV}-popup-your-page-templates-data-search-${dataSearch}-${data.snapshot_name.empty_result}`,
          });
        } else {
          //Verify list theme trả về match với keywword
          const titleList = popupPageInfo.map(obj => obj.title);
          const tagList = popupPageInfo.map(obj => obj.tags);
          for (const title of titleList) {
            await expect(page.locator(`//p[@title="${title}"]`)).toBeVisible();
            if (!title.toLowerCase().includes(dataSearch.toLowerCase())) {
              const indexTemplate = titleList.indexOf(title);
              expect(await templateStore.isArrayItemContainText(tagList[indexTemplate], dataSearch)).toEqual(true);
            }
          }
          const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
          expect(noOfTemplatesMatch).toEqual(titleList.length);
        }
      }
      //Clear search
      await templateStore.searchTemplateNewUI("", "wrapper");
    });

    await test.step(`Filter by Selling type`, async () => {
      const xpathSellingType = templateStore.xpathSellingTypeDesktop.replace("sellingtype", data.selling_type);
      await page.locator(xpathSellingType).click();
      const isSellingTypeSelected = (
        await page.locator(`${xpathSellingType}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isSellingTypeSelected).toEqual(true);
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const popupPageInfo = await builder.getPageTemplateInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        data.type,
        data.selling_type,
      );
      const titleList = popupPageInfo.map(obj => obj.title);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList.length; i++) {
        await page.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          page,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(data.selling_type);
      }

      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      expect(noOfTemplatesMatch).toEqual(titleList.length);
    });

    await test.step(`Click Your templates`, async () => {
      await page.locator(templateStore.xpathYourTemplates).click();
      const shoplibPageInfo = await builder.getShopLibPageInfoInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        data.type,
        shopLibraryActiveIds,
      );

      //verify count đúng số lượng shop library đang active
      const noOfLibrariesDefault = await templateStore.getNumberOfTemplates(page);
      expect(noOfLibrariesDefault).toEqual(shoplibPageInfo.templates.length);

      //Verify list theme visible
      const titleListDefault = shoplibPageInfo.templates.map(obj => obj.title);
      for (const title of titleListDefault) {
        await expect(page.locator(`//p[@title="${title}"]`)).toBeVisible();
      }

      //Verify hiển thị đúng tên lib và số lượng template của từng lib
      const shopLibVisibleIdsDefault = shoplibPageInfo.total_libraries.map(obj => obj.library_id);
      const shopLibVisibleTotalDefault = shoplibPageInfo.total_libraries.map(obj => obj.total);

      for (let i = 0; i < shopLibVisibleIdsDefault.length; i++) {
        const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIdsDefault[i])).title;
        await expect(page.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
        const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(page, libraryVisibleTitle);
        expect(templateNumberOfLib).toEqual(shopLibVisibleTotalDefault[i]);
      }
    });

    await test.step(`Search theo input data`, async () => {
      for (const dataSearch of dataYourTemplates.search) {
        await templateStore.searchTemplateNewUI(dataSearch, "wrapper");
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await page.waitForTimeout(2000); //wait for search result visible
        const shoplibPageInfo = await builder.getShopLibPageInfoInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          data.type,
          shopLibraryActiveIds,
          dataSearch,
        );

        const isEmptyResultVisible = await page.locator(templateStore.xpathEmpty).isVisible();
        if (isEmptyResultVisible == true) {
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: templateStore.xpathEmpty,
            snapshotName: `${process.env.ENV}-popup-your-web-templates-data-search-${dataSearch}-${data.snapshot_name.empty_result}`,
          });
        } else {
          //verify count đúng số lượng shop library đang active
          const noOfLibraries = await templateStore.getNumberOfTemplates(page);
          expect(noOfLibraries).toEqual(shoplibPageInfo.templates.length);

          //Verify list theme trả về match với keywword
          const titleThemeList = shoplibPageInfo.templates.map(obj => obj.title);
          const tagList = shoplibPageInfo.templates.map(obj => obj.tags);
          for (const title of titleThemeList) {
            await expect(page.locator(`//p[@title="${title}"]`)).toBeVisible();
            if (!title.toLowerCase().includes(dataSearch.toLowerCase())) {
              const indexTemplate = titleThemeList.indexOf(title);
              expect(await templateStore.isArrayItemContainText(tagList[indexTemplate], dataSearch)).toEqual(true);
            }
          }

          //Verify hiển thị đúng tên lib và số lượng template của từng lib
          const shopLibVisibleIds = shoplibPageInfo.total_libraries.map(obj => obj.library_id);
          const shopLibVisibleTotal = shoplibPageInfo.total_libraries.map(obj => obj.total);

          for (let i = 0; i < shopLibVisibleIds.length; i++) {
            const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIds[i])).title;
            await expect(page.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
            const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(page, libraryVisibleTitle);
            expect(templateNumberOfLib).toEqual(shopLibVisibleTotal[i]);
          }
        }
      }
    });

    await test.step(`Click 1 tag trên template card`, async () => {
      //Clear search
      await templateStore.searchTemplateNewUI("", "wrapper");

      //Click 1 tag trên template card
      await page
        .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${dataYourTemplates.tag}']`)
        .first()
        .click();
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });
      const isYourTemplatesBtnSelected = (
        await page.locator(`${templateStore.xpathYourTemplates}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isYourTemplatesBtnSelected).toEqual(true);

      //Check hiển thị đúng số lượng template
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      const shoplibPageInfo = await builder.getShopLibPageInfoInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        data.type,
        shopLibraryActiveIds,
        dataYourTemplates.tag,
      );

      //verify count đúng số lượng shop library đang active
      const noOfLibraries = await templateStore.getNumberOfTemplates(page);
      expect(noOfLibraries).toEqual(shoplibPageInfo.templates.length);

      //Verify list theme trả về match với tag, tag được filter hiển thị lên đầu
      const titleList = shoplibPageInfo.templates.map(obj => obj.title);
      for (let i = 0; i < titleList.length; i++) {
        await page.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          page,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(dataYourTemplates.tag);
      }

      //Verify hiển thị đúng tên lib và số lượng template của từng lib
      const shopLibVisibleIds = shoplibPageInfo.total_libraries.map(obj => obj.library_id);
      const shopLibVisibleTotal = shoplibPageInfo.total_libraries.map(obj => obj.total);

      for (let i = 0; i < shopLibVisibleIds.length; i++) {
        const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIds[i])).title;
        await expect(page.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
        const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(page, libraryVisibleTitle);
        expect(templateNumberOfLib).toEqual(shopLibVisibleTotal[i]);
      }
    });

    await test.step(`Nhấn phím ESC`, async () => {
      await page.keyboard.press("Escape");
      await expect(page.locator(templateStore.xpathTemplateStoreHeading)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_TS_100 Check popup Template store trong Online store/Design`, async ({
    page,
    conf,
    builder,
    snapshotFixture,
  }) => {
    if (process.env.ENV === "prodtest") {
      return;
    }
    test.slow();
    const data = conf.caseConf.data;
    const dataYourTemplates = data.data_your_templates;
    templateStore = new TemplateStorePage(page);

    //Lấy data các shop library đang active (trừ Web Base library)
    const shopLibraryActiveData = (await builder.listLibrary({ action: "all" }))
      .filter(obj => obj.status.toString().includes("1"))
      .slice(1);
    const shopLibraryActiveIds = shopLibraryActiveData.map(obj => obj.id).toString();

    await test.step(`Click Online store -> Click Explore templates`, async () => {
      await templateStore.goto(`https://${conf.suiteConf.domain}/admin/themes`);
      await page.locator(templateStore.xpathBrowseTemplates).click();
      const isAllBtnSelected = (
        await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isAllBtnSelected).toEqual(true);
      await page.locator(templateStore.xpathTemplateTagList).last().scrollIntoViewIfNeeded();

      const popupThemeInfo = await builder.getThemeTemplateInPopup(conf.suiteConf.domain, conf.suiteConf.store_type);
      const titleList = popupThemeInfo.map(obj => obj.title);

      for (const title of titleList) {
        await expect(page.locator(`//p[@title="${title}"]`)).toBeVisible();
      }
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      expect(titleList.length).toEqual(noOfTemplatesMatch);
    });

    await test.step(`Search theo input data`, async () => {
      //Nhập chính xác name/tag của web template
      for (const dataSearch of data.search_1.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "wrapper");
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await page.waitForTimeout(2000); //wait for search result visible

        const popupThemeInfo = await builder.getThemeTemplateInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          dataSearch,
        );
        const titleList = popupThemeInfo.map(obj => obj.title);
        const tagList = popupThemeInfo.map(obj => obj.tags);

        for (const title of titleList) {
          await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
          if (title !== dataSearch) {
            for (const tag of tagList) {
              expect(tag[0]).toEqual(dataSearch);
            }
          }
        }
        const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
        expect(titleList.length).toEqual(noOfTemplatesMatch);
      }

      //Nhập text có kết quả phù hợp với template name/tag (không phân biệt hoa thường)
      for (const dataSearch of data.search_2.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "wrapper");
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await page.waitForTimeout(2000); //wait for search result visible

        const popupThemeInfo = await builder.getThemeTemplateInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          dataSearch,
        );

        const titleList = popupThemeInfo.map(obj => obj.title);
        const tagList = popupThemeInfo.map(obj => obj.tags);
        for (const title of titleList) {
          await page.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
          if (!title.toLowerCase().includes(dataSearch.toLowerCase())) {
            const indexTemplate = titleList.indexOf(title);
            expect(await templateStore.isArrayItemContainText(tagList[indexTemplate], dataSearch)).toEqual(true);
          }
        }
        const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
        expect(titleList.length).toEqual(noOfTemplatesMatch);
      }

      //Nhập text không có template name và tag match
      for (const dataSearch of data.search_3.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "wrapper");
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await page.waitForSelector(`//span[contains(text(), '${dataSearch}')]`, { state: "visible" });
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: templateStore.xpathEmpty,
          snapshotName: `${process.env.ENV}-popup-web-template-data-search-${dataSearch}-${data.snapshot_name.empty_result}`,
        });
      }
      await page.locator(templateStore.xpathClosePopup).click();
    });

    await test.step(`Filter by Selling type`, async () => {
      await page.locator(templateStore.xpathBrowseTemplates).click();

      const sellingType = data.selling_type;
      const xpathSellingType1 = templateStore.xpathSellingTypeDesktop.replace("sellingtype", sellingType.type_1);
      const xpathSellingType2 = templateStore.xpathSellingTypeDesktop.replace("sellingtype", sellingType.type_2);

      //Chọn 1 Selling type
      await page.locator(xpathSellingType1).click();
      const isSellingType1Selected = (
        await page.locator(`${xpathSellingType1}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isSellingType1Selected).toEqual(true);
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const popupThemeInfo1 = await builder.getThemeTemplateInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        sellingType.type_1,
      );
      const noOfTemplatesMatch1 = await templateStore.getNumberOfTemplates(page);
      const titleList1 = popupThemeInfo1.map(obj => obj.title);
      expect(titleList1.length).toEqual(noOfTemplatesMatch1);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList1.length; i++) {
        await page.evaluate(() => {
          const popupEl = document.querySelector(".sb-choose-template-v2");
          popupEl.scrollTo(0, popupEl.scrollHeight);
        });
        await page.waitForSelector(`//p[@title="${titleList1[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          page,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(sellingType.type_1);
      }

      //Chọn thêm 1 Selling type
      await page.locator(xpathSellingType2).click();
      const isSellingType2Selected = (
        await page.locator(`${xpathSellingType2}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isSellingType2Selected).toEqual(true);
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const popupThemeInfo2 = await builder.getThemeTemplateInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        sellingType.type_2,
      );
      const noOfTemplatesMatch2 = await templateStore.getNumberOfTemplates(page);
      const titleList2 = popupThemeInfo2.map(obj => obj.title);
      expect(titleList2.length).toEqual(noOfTemplatesMatch2);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList2.length; i++) {
        await page.waitForSelector(`//p[@title="${titleList2[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          page,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(sellingType.type_2);
      }
      await page.locator(templateStore.xpathClosePopup).click();
    });

    await test.step(`Click 1 tag trên template card`, async () => {
      await page.locator(templateStore.xpathBrowseTemplates).click();
      await page
        .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${data.tag}']`)
        .first()
        .click();
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      await page.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });
      const isAllBtnSelected = (
        await page.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isAllBtnSelected).toEqual(true);

      //Check hiển thị đúng số lượng template
      const popupThemeInfo = await builder.getThemeTemplateInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        data.tag,
      );
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      const titleList = popupThemeInfo.map(obj => obj.title);
      expect(titleList.length).toEqual(noOfTemplatesMatch);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList.length; i++) {
        await page.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          page,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(data.tag);
      }
    });

    await test.step(`Click Your templates`, async () => {
      await page.locator(templateStore.xpathYourTemplates).click();
      const shoplibThemeInfo = await builder.getShopLibThemeInfoInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        shopLibraryActiveIds,
      );

      //verify count đúng số lượng shop library đang active
      const noOfLibrariesDefault = await templateStore.getNumberOfTemplates(page);
      expect(noOfLibrariesDefault).toEqual(shoplibThemeInfo.templates.length);

      //Verify list theme visible
      const titleListDefault = shoplibThemeInfo.templates.map(obj => obj.title);
      for (const title of titleListDefault) {
        await expect(page.locator(`//p[@title="${title}"]`)).toBeVisible();
      }

      //Verify hiển thị đúng tên lib và số lượng template của từng lib
      const shopLibVisibleIdsDefault = shoplibThemeInfo.total_libraries.map(obj => obj.library_id);
      const shopLibVisibleTotalDefault = shoplibThemeInfo.total_libraries.map(obj => obj.total);

      for (let i = 0; i < shopLibVisibleIdsDefault.length; i++) {
        const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIdsDefault[i])).title;
        await expect(page.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
        const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(page, libraryVisibleTitle);
        expect(templateNumberOfLib).toEqual(shopLibVisibleTotalDefault[i]);
      }
    });

    await test.step(`Search theo input data`, async () => {
      for (const dataSearch of dataYourTemplates.search) {
        await templateStore.searchTemplateNewUI(dataSearch, "wrapper");
        await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await page.waitForTimeout(2000); //wait for search result visible
        const shoplibThemeInfo = await builder.getShopLibThemeInfoInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          shopLibraryActiveIds,
          dataSearch,
        );

        const isEmptyResultVisible = await page.locator(templateStore.xpathEmpty).isVisible();
        if (isEmptyResultVisible == true) {
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: templateStore.xpathEmpty,
            snapshotName: `${process.env.ENV}-popup-your-web-templates-data-search-${dataSearch}-${data.snapshot_name.empty_result}`,
          });
        } else {
          //verify count đúng số lượng shop library đang active
          const noOfLibraries = await templateStore.getNumberOfTemplates(page);
          expect(noOfLibraries).toEqual(shoplibThemeInfo.templates.length);

          //Verify list theme trả về match với keywword
          const titleThemeList = shoplibThemeInfo.templates.map(obj => obj.title);
          const tagList = shoplibThemeInfo.templates.map(obj => obj.tags);
          for (const title of titleThemeList) {
            await expect(page.locator(`//p[@title="${title}"]`)).toBeVisible();
            if (!title.toLowerCase().includes(dataSearch.toLowerCase())) {
              const indexTemplate = titleThemeList.indexOf(title);
              expect(await templateStore.isArrayItemContainText(tagList[indexTemplate], dataSearch)).toEqual(true);
            }
          }

          //Verify hiển thị đúng tên lib và số lượng template của từng lib
          const shopLibVisibleIds = shoplibThemeInfo.total_libraries.map(obj => obj.library_id);
          const shopLibVisibleTotal = shoplibThemeInfo.total_libraries.map(obj => obj.total);

          for (let i = 0; i < shopLibVisibleIds.length; i++) {
            const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIds[i])).title;
            await expect(page.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
            const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(page, libraryVisibleTitle);
            expect(templateNumberOfLib).toEqual(shopLibVisibleTotal[i]);
          }
        }
      }
    });

    await test.step(`Click 1 tag trên template card`, async () => {
      //Clear search
      await templateStore.searchTemplateNewUI("", "wrapper");

      //Click 1 tag trên template card
      await page
        .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${data.tag}']`)
        .first()
        .click();
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });
      const isYourTemplatesBtnSelected = (
        await page.locator(`${templateStore.xpathYourTemplates}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isYourTemplatesBtnSelected).toEqual(true);

      //Check hiển thị đúng số lượng template
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      const shoplibThemeInfo = await builder.getShopLibThemeInfoInPopup(
        conf.suiteConf.domain,
        conf.suiteConf.store_type,
        shopLibraryActiveIds,
        dataYourTemplates.tag,
      );

      //verify count đúng số lượng shop library đang active
      const noOfLibraries = await templateStore.getNumberOfTemplates(page);
      expect(noOfLibraries).toEqual(shoplibThemeInfo.templates.length);

      //Verify list theme trả về match với tag, tag được filter hiển thị lên đầu
      const titleThemeList = shoplibThemeInfo.templates.map(obj => obj.title);
      for (let i = 0; i < titleThemeList.length; i++) {
        await page.waitForSelector(`//p[@title="${titleThemeList[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          page,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(data.tag);
      }

      //Verify hiển thị đúng tên lib và số lượng template của từng lib
      const shopLibVisibleIds = shoplibThemeInfo.total_libraries.map(obj => obj.library_id);
      const shopLibVisibleTotal = shoplibThemeInfo.total_libraries.map(obj => obj.total);

      for (let i = 0; i < shopLibVisibleIds.length; i++) {
        const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIds[i])).title;
        await expect(page.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
        const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(page, libraryVisibleTitle);
        expect(templateNumberOfLib).toEqual(shopLibVisibleTotal[i]);
      }
    });

    await test.step(`Nhấn phím ESC`, async () => {
      await page.keyboard.press("Escape");
      await expect(page.locator(templateStore.xpathTemplateStoreHeading)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_TS_101 Check popup Template store Webbuiler ở tất cả các page`, async ({
    dashboard,
    builder,
    page,
    conf,
  }) => {
    test.slow();
    templateStore = new TemplateStorePage(page);
    let isListTemplateEmpty: boolean;
    const shopLibraryActiveData = (await builder.listLibrary({ action: "all" }))
      .filter(obj => obj.status.toString().includes("1"))
      .slice(1);
    const shopLibraryActiveIds = shopLibraryActiveData.map(obj => obj.id).toString();
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    for (const data of conf.caseConf.data) {
      await test.step(`Chọn lần lượt từng page trong Page selector, tại Navigation Bar: click vào Btn "Templates"`, async () => {
        await webBuilder.openWebBuilder({ type: "site", id: conf.suiteConf.theme_id, page: data.type });
        await dashboard.waitForLoadState("networkidle");
        await dashboard.locator(templateStore.xpathChangeTemplateBtn).click();
        await dashboard.waitForSelector(templateStore.xpathLoading, { state: "hidden" });
        await webBuilder.waitForXpathState(templateStore.dataSearchFilter, "stable");
        const isAllBtnSelected = (
          await dashboard.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
        ).includes("selected");
        expect(isAllBtnSelected).toEqual(true);

        isListTemplateEmpty = await dashboard.locator(templateStore.xpathEmpty).isVisible();

        if (isListTemplateEmpty == false) {
          await dashboard.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
          await dashboard.locator(templateStore.xpathTemplateTagList).last().scrollIntoViewIfNeeded();

          const popupPageInfo = await builder.getPageTemplateInPopup(
            conf.suiteConf.domain,
            conf.suiteConf.store_type,
            data.type,
            data.search,
          );

          const titleList = popupPageInfo.map(obj => obj.title);
          const tagList = popupPageInfo.map(obj => obj.tags);
          for (const title of titleList) {
            await dashboard.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
            if (!title.toLowerCase().includes(data.search.toLowerCase())) {
              const indexTemplate = titleList.indexOf(title);
              expect(await templateStore.isArrayItemContainText(tagList[indexTemplate], data.search)).toEqual(true);
            }
          }
          const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(dashboard);
          expect(titleList.length).toEqual(noOfTemplatesMatch);
        }
      });

      if (isListTemplateEmpty == false) {
        await test.step(`Click 1 tag trên template card`, async () => {
          await dashboard.locator(`${templateStore.xpathAllBtn}//parent::button`).click();
          await dashboard
            .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${data.tag}']`)
            .first()
            .click();
          await dashboard.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
          await dashboard.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
          await dashboard.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });
          const isAllBtnSelected = (
            await dashboard.locator(`${templateStore.xpathAllBtn}//parent::button`).getAttribute("class")
          ).includes("selected");
          expect(isAllBtnSelected).toEqual(true);

          const popupPageInfo = await builder.getPageTemplateInPopup(
            conf.suiteConf.domain,
            conf.suiteConf.store_type,
            data.type,
            data.search,
            data.tag,
          );
          const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(dashboard);
          const titleList = popupPageInfo.map(obj => obj.title);
          expect(titleList.length).toEqual(noOfTemplatesMatch);

          /*Check Tag được hiển thị lên vị trí đầu tiên của template card
          (nếu có tag trùng với keyword search thì tag được click xếp thứ 2 sau tag được search)*/
          for (let i = 0; i < titleList.length; i++) {
            await dashboard.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
            const textOfFirstTag = await templateStore.getTextOfTag(
              dashboard,
              `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
              1,
            );
            if (textOfFirstTag !== data.tag) {
              const textOfSecondTag = await templateStore.getTextOfTag(
                dashboard,
                `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
                2,
              );
              expect(textOfSecondTag).toEqual(data.tag);
            }
          }
        });
      }
      await test.step(`Click Your templates`, async () => {
        await dashboard.locator(templateStore.xpathYourTemplates).click();
        const shoplibPageInfo = await builder.getShopLibPageInfoInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          data.type,
          shopLibraryActiveIds,
          data.search,
        );

        //verify count đúng số lượng shop library đang active
        const noOfLibrariesDefault = await templateStore.getNumberOfTemplates(dashboard);
        expect(noOfLibrariesDefault).toEqual(shoplibPageInfo.templates.length);

        //Verify list theme visible
        const titleListDefault = shoplibPageInfo.templates.map(obj => obj.title);
        for (const title of titleListDefault) {
          await expect(dashboard.locator(`//p[@title="${title}"]`)).toBeVisible();
        }

        //Verify hiển thị đúng tên lib và số lượng template của từng lib
        const shopLibVisibleIdsDefault = shoplibPageInfo.total_libraries.map(obj => obj.library_id);
        const shopLibVisibleTotalDefault = shoplibPageInfo.total_libraries.map(obj => obj.total);

        for (let i = 0; i < shopLibVisibleIdsDefault.length; i++) {
          const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIdsDefault[i])).title;
          await expect(dashboard.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
          const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(dashboard, libraryVisibleTitle);
          expect(templateNumberOfLib).toEqual(shopLibVisibleTotalDefault[i]);
        }
      });
      await test.step(`Click 1 tag trên template card`, async () => {
        await dashboard
          .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${data.tag_your_template}']`)
          .first()
          .click();
        await dashboard.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await dashboard.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });
        const isYourTemplatesBtnSelected = (
          await dashboard.locator(`${templateStore.xpathYourTemplates}//parent::button`).getAttribute("class")
        ).includes("selected");
        expect(isYourTemplatesBtnSelected).toEqual(true);

        //Check hiển thị đúng số lượng template
        await dashboard.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        const shoplibPageInfo = await builder.getShopLibPageInfoInPopup(
          conf.suiteConf.domain,
          conf.suiteConf.store_type,
          data.type,
          shopLibraryActiveIds,
          data.search,
          data.tag_your_template,
        );

        //verify count đúng số lượng shop library đang active
        const noOfLibraries = await templateStore.getNumberOfTemplates(dashboard);
        expect(noOfLibraries).toEqual(shoplibPageInfo.templates.length);

        //Verify list theme trả về match với tag, tag được filter hiển thị lên đầu
        const titleList = shoplibPageInfo.templates.map(obj => obj.title);
        for (let i = 0; i < titleList.length; i++) {
          await dashboard.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
          const textOfFirstTag = await templateStore.getTextOfTag(
            dashboard,
            `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
            1,
          );
          if (textOfFirstTag !== data.tag_your_template) {
            const textOfSecondTag = await templateStore.getTextOfTag(
              dashboard,
              `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
              2,
            );
            expect(textOfSecondTag).toEqual(data.tag_your_template);
          }
        }

        //Verify hiển thị đúng tên lib và số lượng template của từng lib
        const shopLibVisibleIds = shoplibPageInfo.total_libraries.map(obj => obj.library_id);
        const shopLibVisibleTotal = shoplibPageInfo.total_libraries.map(obj => obj.total);

        for (let i = 0; i < shopLibVisibleIds.length; i++) {
          const libraryVisibleTitle = (await builder.libraryDetail(shopLibVisibleIds[i])).title;
          await expect(dashboard.locator(`//h3[normalize-space()='${libraryVisibleTitle}']`)).toBeVisible();
          const templateNumberOfLib = await templateStore.getTemplateNumberOfShopLib(dashboard, libraryVisibleTitle);
          expect(templateNumberOfLib).toEqual(shopLibVisibleTotal[i]);
        }
      });

      await test.step(`Nhấn phím ESC`, async () => {
        await dashboard.keyboard.press("Escape");
        await expect(dashboard.locator(templateStore.xpathTemplateStoreHeading)).toBeHidden();
      });
    }
  });

  test(`@SB_NEWECOM_TS_102 Check Click vào tag trên template card tại tab Web template trên Template store`, async ({
    page,
    conf,
    builder,
  }) => {
    const data = conf.caseConf.data;
    await test.step(`Click 1 tag trên template card`, async () => {
      await page.goto(conf.suiteConf.link_web);
      templateStore = new TemplateStorePage(page);
      await page
        .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${data.tag}']`)
        .first()
        .click();
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      await page.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain, data.tag);
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      expect(titleList.length).toEqual(noOfTemplatesMatch);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList.length; i++) {
        await page.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          page,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(data.tag);
      }
    });

    await test.step(`Click clear tag`, async () => {
      await page.locator(templateStore.xpathRemoveTag).click();
      await page.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      for (const title of titleList) {
        await expect(page.locator(`//p[@title="${title}"]`)).toBeVisible();
      }
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await page.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(page);
      expect(noOfTemplatesMatch).toEqual(titleList.length);
    });
  });

  test(`@SB_NEWECOM_TS_103 Check list web templates trên Template store trên mobile`, async ({
    conf,
    builder,
    pageMobile,
    snapshotFixture,
  }) => {
    if (process.env.ENV === "prodtest") {
      return;
    }
    test.slow();
    const data = conf.caseConf.data;
    templateStore = new TemplateStorePage(pageMobile);

    await test.step(`Đi đến Template store tab Web template từ url`, async () => {
      await templateStore.goto(conf.suiteConf.link_web);
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await pageMobile.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      for (const title of titleList) {
        await pageMobile.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
      }
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(pageMobile);
      expect(titleList.length).toEqual(noOfTemplatesMatch);
    });

    await test.step(`Search theo input data`, async () => {
      //Nhập chính xác name/tag của web template
      for (const dataSearch of data.search_1.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "mobile");
        await pageMobile.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await pageMobile.waitForTimeout(2000); //wait for search result visible

        const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain, dataSearch);
        const titleList = templateStoreThemeInfo.map(obj => obj.title);
        const tagList = templateStoreThemeInfo.map(obj => obj.tags);

        for (const title of titleList) {
          await pageMobile.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
          if (title !== dataSearch) {
            for (const tag of tagList) {
              expect(tag[0]).toEqual(dataSearch);
            }
          }
        }
        const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(pageMobile);
        expect(titleList.length).toEqual(noOfTemplatesMatch);
      }

      //Nhập text có kết quả phù hợp với template name/tag (không phân biệt hoa thường)
      for (const dataSearch of data.search_2.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "mobile");
        await pageMobile.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await pageMobile.waitForTimeout(2000); //wait for search result visible

        const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain, dataSearch);

        const titleList = templateStoreThemeInfo.map(obj => obj.title);
        const tagList = templateStoreThemeInfo.map(obj => obj.tags);
        for (const title of titleList) {
          await pageMobile.waitForSelector(`//p[@title="${title}"]`, { state: "visible" });
          if (!title.toLowerCase().includes(dataSearch.toLowerCase())) {
            const indexTemplate = titleList.indexOf(title);
            expect(await templateStore.isArrayItemContainText(tagList[indexTemplate], dataSearch)).toEqual(true);
          }
        }
        const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(pageMobile);
        expect(titleList.length).toEqual(noOfTemplatesMatch);
      }

      //Nhập text không có template name và tag match
      for (const dataSearch of data.search_3.data) {
        await templateStore.searchTemplateNewUI(dataSearch, "mobile");
        await pageMobile.waitForSelector(templateStore.xpathFetching, { state: "hidden" });
        await pageMobile.waitForSelector(`//span[contains(text(), '${dataSearch}')]`, { state: "visible" });
        await snapshotFixture.verifyWithAutoRetry({
          page: pageMobile,
          selector: templateStore.xpathEmpty,
          snapshotName: `${process.env.ENV}-mobile-data-search-${dataSearch}-${data.snapshot_name.empty_result}`,
        });
      }
    });

    await test.step(`Filter by Selling type`, async () => {
      await templateStore.goto(conf.suiteConf.link_web);
      const sellingType = data.selling_type;
      const xpathSellingType1 = templateStore.xpathSellingTypeMobile.replace("sellingtype", sellingType.type_1);
      const xpathSellingType2 = templateStore.xpathSellingTypeMobile.replace("sellingtype", sellingType.type_2);

      //Chọn 1 Selling type
      await pageMobile.locator(xpathSellingType1).click();
      const isSellingType1Selected = (
        await pageMobile.locator(`${xpathSellingType1}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isSellingType1Selected).toEqual(true);
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await pageMobile.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const templateStoreThemeInfo1 = await builder.getThemeTemplateStore(conf.suiteConf.domain, sellingType.type_1);
      const noOfTemplatesMatch1 = await templateStore.getNumberOfTemplates(pageMobile);
      const titleList1 = templateStoreThemeInfo1.map(obj => obj.title);
      expect(titleList1.length).toEqual(noOfTemplatesMatch1);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList1.length; i++) {
        await pageMobile.waitForSelector(`//p[@title="${titleList1[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          pageMobile,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(sellingType.type_1);
      }

      //Chọn thêm 1 Selling type
      await pageMobile.locator(xpathSellingType2).click();
      const isSellingType2Selected = (
        await pageMobile.locator(`${xpathSellingType2}//parent::button`).getAttribute("class")
      ).includes("selected");
      expect(isSellingType2Selected).toEqual(true);

      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await pageMobile.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const templateStoreThemeInfo2 = await builder.getThemeTemplateStore(conf.suiteConf.domain, sellingType.type_2);
      const noOfTemplatesMatch2 = await templateStore.getNumberOfTemplates(pageMobile);
      const titleList2 = templateStoreThemeInfo2.map(obj => obj.title);
      expect(titleList2.length).toEqual(noOfTemplatesMatch2);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList2.length; i++) {
        await pageMobile.waitForSelector(`//p[@title="${titleList2[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          pageMobile,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(sellingType.type_2);
      }
    });

    await test.step(`Click 1 tag trên template card`, async () => {
      await templateStore.goto(conf.suiteConf.link_web);
      await pageMobile
        .locator(`//div[contains(@class, 'sb-tag__caption') and normalize-space()='${data.tag}']`)
        .first()
        .click();
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await pageMobile.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      await pageMobile.waitForSelector(templateStore.xpathFilterBy, { state: "visible" });

      //Check hiển thị đúng số lượng template
      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain, data.tag);
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(pageMobile);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      expect(titleList.length).toEqual(noOfTemplatesMatch);

      //Check Tag được hiển thị lên vị trí đầu tiên của template card
      for (let i = 0; i < titleList.length; i++) {
        await pageMobile.waitForSelector(`//p[@title="${titleList[i]}"]`, { state: "visible" });
        const textOfFirstTag = await templateStore.getTextOfTag(
          pageMobile,
          `(${templateStore.xpathTemplateTagList})[${i + 1}]`,
          1,
        );
        expect(textOfFirstTag).toEqual(data.tag);
      }
    });

    await test.step(`Click clear tag`, async () => {
      await pageMobile.locator(templateStore.xpathRemoveTag).click();
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await pageMobile.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });

      const templateStoreThemeInfo = await builder.getThemeTemplateStore(conf.suiteConf.domain);
      const titleList = templateStoreThemeInfo.map(obj => obj.title);
      for (const title of titleList) {
        await expect(pageMobile.locator(`//p[@title="${title}"]`)).toBeVisible();
      }
      await templateStore.waitForXpathState(templateStore.xpathNumberOfTemplates, "stable");
      await pageMobile.waitForSelector(templateStore.xpathTemplateList, { state: "visible" });
      const noOfTemplatesMatch = await templateStore.getNumberOfTemplates(pageMobile);
      expect(noOfTemplatesMatch).toEqual(titleList.length);
    });
  });
});
