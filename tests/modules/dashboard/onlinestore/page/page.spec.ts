import { test } from "@fixtures/theme";
import { PagesInOnlineStore } from "@pages/dashboard/pages";
import { verifyRedirectUrl } from "@utils/theme";
import { expect, Page } from "@playwright/test";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Verify some Action with page @TS_PAGE", () => {
  let pagesInOnlineStore: PagesInOnlineStore, dataSetting;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    dataSetting = conf.caseConf;
    pagesInOnlineStore = new PagesInOnlineStore(dashboard, conf.suiteConf.domain);

    await test.step("Open Pages in dashboard", async () => {
      await pagesInOnlineStore.goto("/admin/pages");
      await pagesInOnlineStore.page.waitForLoadState("networkidle");
    });
  });

  test(`@SB_OLS_PG_7 Page_Check mở page khi thay đổi status của page`, async ({
    context,
    snapshotFixture,
    cConf,
    conf,
  }) => {
    let previewPage: Page;
    const expected = cConf.expect;

    await test.step("Pre-condition: Xoá all page", async () => {
      const countPages = await pagesInOnlineStore.countNumberOfPage();
      if (countPages) {
        await pagesInOnlineStore.page.click(pagesInOnlineStore.checkboxSelectAll);
        await pagesInOnlineStore.actionWithSelectedPages("Delete pages");
        const countPagesAfter = await pagesInOnlineStore.countNumberOfPage();
        expect(countPagesAfter).toEqual(0);
      }
    });

    await test.step(`Tạo 1 page với status là visible`, async () => {
      await pagesInOnlineStore.page.locator(pagesInOnlineStore.addPageButton).click();
      await pagesInOnlineStore.inputPageInfo(dataSetting.page);
      await pagesInOnlineStore.savePage("Your page was created");
    });

    await test.step(`mở page vừa tạo ngoài SF`, async () => {
      previewPage = await verifyRedirectUrl({
        page: pagesInOnlineStore.page,
        context: context,
        selector: pagesInOnlineStore.previewIcon,
        redirectUrl: dataSetting.expect.url,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: pagesInOnlineStore.pageContent,
        snapshotName: dataSetting.expect.snapshot_visible,
      });
    });

    await test.step(`Thay đổi status của page thành hidden`, async () => {
      await pagesInOnlineStore.inputPageInfo({ status: "Hidden" });
      await pagesInOnlineStore.savePage("Your page was updated");
    });

    await test.step(`mở page vừa tạo ngoài SF`, async () => {
      const homeSF = new SFHome(previewPage, conf.suiteConf.domain);
      await previewPage.reload();
      await previewPage.waitForLoadState("networkidle");
      await expect(homeSF.notFoundTitle).toHaveText(expected.not_found_title);
      await expect(homeSF.notFoundText).toHaveText(expected.not_found_text);
      await expect(homeSF.continueShoppingBtn).toBeVisible();
    });
  });

  test(`@SB_OLS_PG_9 Page_Check user edit page`, async ({ context, snapshotFixture }) => {
    await test.step("Pre-condition: create page", async () => {
      const countPages = await pagesInOnlineStore.countNumberOfPage(dataSetting.current_page.title);
      if (!countPages) {
        await pagesInOnlineStore.page.locator(pagesInOnlineStore.addPageButton).click();
        await pagesInOnlineStore.inputPageInfo(dataSetting.current_page);
        await pagesInOnlineStore.savePage("Your page was created");
        await pagesInOnlineStore.page.click(pagesInOnlineStore.breadcrumb);
      }
    });

    await test.step(`Trong dashboard, mở 1 page đã tạo`, async () => {
      await pagesInOnlineStore.page.fill(pagesInOnlineStore.searchBar, dataSetting.current_page.title);
      await pagesInOnlineStore.openPage(dataSetting.current_page.title);
    });

    await test.step(`Edit thông tin của page`, async () => {
      await pagesInOnlineStore.inputPageInfo(dataSetting.update_page);
      await pagesInOnlineStore.savePage("Your page was updated");
    });

    await test.step(`Ngoài SF, mở page đã edit`, async () => {
      const previewPage = await verifyRedirectUrl({
        page: pagesInOnlineStore.page,
        context: context,
        selector: pagesInOnlineStore.previewIcon,
        redirectUrl: dataSetting.update_page.url,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: pagesInOnlineStore.pageContent,
        snapshotName: dataSetting.expect.snapshot_edited,
      });
    });
  });

  test(`@SB_OLS_PG_10 Page_Check tạo page với các template`, async ({ context, snapshotFixture }) => {
    test.slow();
    let previewPage: Page;
    await test.step("Pre-condition: Xoá all page", async () => {
      const countPages = await pagesInOnlineStore.countNumberOfPage();
      if (countPages) {
        await pagesInOnlineStore.page.click(pagesInOnlineStore.checkboxSelectAll);
        await pagesInOnlineStore.actionWithSelectedPages("Delete pages");
        const countPagesAfter = await pagesInOnlineStore.countNumberOfPage();
        expect(countPagesAfter).toEqual(0);
      }
    });

    await test.step(`Tạo page với template là Contact us`, async () => {
      await pagesInOnlineStore.page.locator(pagesInOnlineStore.addPageButton).click();
      await pagesInOnlineStore.inputPageInfo(dataSetting.contact_us);
      await pagesInOnlineStore.savePage("Your page was created");
    });

    await test.step(`Mở page đã tạo ngoài sf`, async () => {
      previewPage = await verifyRedirectUrl({
        page: pagesInOnlineStore.page,
        context: context,
        selector: pagesInOnlineStore.previewIcon,
        redirectUrl: dataSetting.expect.url,
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: pagesInOnlineStore.pageContent,
        snapshotName: dataSetting.expect.snapshot_contact_us,
      });
    });

    await test.step(`Đổi template của page thành template Review page`, async () => {
      await pagesInOnlineStore.inputPageInfo(dataSetting.all_reviews);
      await pagesInOnlineStore.savePage("Your page was updated");
    });

    await test.step(`Mở page ngoài SF`, async () => {
      await previewPage.reload();
      await previewPage.waitForLoadState("networkidle");
      await previewPage.waitForSelector(pagesInOnlineStore.reviewWidget);

      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: pagesInOnlineStore.pageContent,
        snapshotName: dataSetting.expect.snapshot_all_reviews,
      });
    });
  });

  test(`@SB_OLS_PG_13 Page_Check user delete page`, async ({ page, conf, cConf }) => {
    await test.step("Pre-condition: create page", async () => {
      const countPages = await pagesInOnlineStore.countNumberOfPage(dataSetting.page.title);
      if (!countPages) {
        await pagesInOnlineStore.page.locator(pagesInOnlineStore.addPageButton).click();
        await pagesInOnlineStore.inputPageInfo(dataSetting.page);
        await pagesInOnlineStore.savePage("Your page was created");
        await pagesInOnlineStore.page.click(pagesInOnlineStore.breadcrumb);
      }
    });

    await test.step(`Delete 1 page`, async () => {
      await pagesInOnlineStore.openPage(dataSetting.page.title);
      await pagesInOnlineStore.deletePage();
    });

    await test.step(`Mở page ngoài SF`, async () => {
      const homeSF = new SFHome(page, conf.suiteConf.domain);
      const url = `https://${conf.suiteConf.domain}/pages/${dataSetting.page.url}`;

      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await expect(homeSF.notFoundTitle).toHaveText(cConf.expect.not_found_title);
      await expect(homeSF.notFoundText).toHaveText(cConf.expect.not_found_text);
      await expect(homeSF.continueShoppingBtn).toBeVisible();
    });
  });
});
