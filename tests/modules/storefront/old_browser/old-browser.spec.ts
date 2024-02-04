import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import { SFBlocks } from "@pages/storefront/block";
import { loadData } from "@core/conf/conf";

test.describe("Verify Storefront Support Old Browser @SB_OLS_THE_TCD_SFOB", () => {
  const confHomePage = loadData(__dirname, "HOMEPAGE_CASE_01_04");
  for (let caseIndex = 0; caseIndex < confHomePage.caseConf.data.length; caseIndex++) {
    const caseData = confHomePage.caseConf.data[caseIndex];
    test(`${caseData.description} @${caseData.case_id}`, async ({ conf, snapshotFixture, pageMobile }) => {
      const mobilePage = pageMobile;
      const mobileOldBrowser = new SFBlocks(mobilePage, conf.suiteConf.domain);
      const expected = conf.caseConf.data.expect;

      await test.step("Mở SF, page Home. Check hiển thị các block ở Header", async () => {
        await mobileOldBrowser.page.goto(`https://${conf.suiteConf.domain}`);
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.sectionHeader,
          snapshotName: expected.screenshot_header,
        });
      });

      await test.step("Click mở Menu hamburger, click menu items đầu tiên", async () => {
        await mobileOldBrowser.menuHamburger.click();
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.menuContent,
          snapshotName: expected.screenshot_menu_items,
        });
        await mobileOldBrowser
          .genLoc(mobileOldBrowser.menuItems)
          .first()
          .click({ position: { x: 5, y: 5 } });
        await expect(mobileOldBrowser.page).toHaveURL(new RegExp(`/pages/contact-us`));
      });

      await test.step("Click vào logo image của shop", async () => {
        await mobileOldBrowser.genLoc(mobileOldBrowser.shopLogo).first().click();
        await expect(mobileOldBrowser.page).toHaveURL(new RegExp(`${conf.suiteConf.domain}`));
      });

      await test.step("Check hiển thị block Featured Collection", async () => {
        await mobileOldBrowser.page.locator(mobileOldBrowser.blockFeaturedCollection).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.blockFeaturedCollection,
          snapshotName: expected.screenshot_featured_collection,
        });
      });

      await test.step("Check hiển thị block Collection list", async () => {
        await mobileOldBrowser.page.locator(mobileOldBrowser.blockCollectionList).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.blockCollectionList,
          snapshotName: expected.screenshot_collection_list,
        });
      });

      await test.step("Check hiển thị block Form", async () => {
        await mobileOldBrowser.page.locator(mobileOldBrowser.blockForm).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.blockForm,
          snapshotName: expected.screenshot_form,
        });
      });

      await test.step("Check hiển thị block All review", async () => {
        await mobileOldBrowser.page.locator(mobileOldBrowser.blockAllReview).scrollIntoViewIfNeeded();
        await expect(mobileOldBrowser.page.locator("//span[normalize-space()='Write a review']")).toBeVisible();
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.blockAllReview,
          snapshotName: expected.screenshot_all_review,
        });
      });

      await test.step("Check hiển thị block Social ở footer", async () => {
        await mobileOldBrowser.page.locator(mobileOldBrowser.blockSocial).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.blockSocial,
          snapshotName: expected.screenshot_social,
        });
      });
    });
  }

  const confColProPage = loadData(__dirname, "COLPROPAGE_CASE_02_05");
  for (let caseIndex = 0; caseIndex < confColProPage.caseConf.data.length; caseIndex++) {
    const caseData = confColProPage.caseConf.data[caseIndex];
    test(`${caseData.description} @${caseData.case_id}`, async ({ conf, snapshotFixture, pageMobile }) => {
      const mobilePage = pageMobile;
      const mobileOldBrowser = new SFBlocks(mobilePage, conf.suiteConf.domain);
      const expected = conf.caseConf.data.expect;

      await test.step("Mở SF, page Collection detail. Check hiển thị list các product có trong Collections", async () => {
        await mobileOldBrowser.page.goto(`https://${conf.suiteConf.domain}/collections/toys`);
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.blockProductList,
          snapshotName: expected.screenshot_product_list,
        });
      });

      await test.step("Mở SF trang Product detail.Check hiển thị trang product detail", async () => {
        await mobileOldBrowser.page.goto(
          `https://${conf.suiteConf.domain}/collections/toys/products/funny-interactive-cat-toy-with-feather-ball-stick-gun`,
        );
        await snapshotFixture.verifyWithAutoRetry({
          page: mobileOldBrowser.page,
          selector: mobileOldBrowser.sectionProductDetail,
          snapshotName: expected.screenshot_product_detail,
        });
      });
    });
  }
});
