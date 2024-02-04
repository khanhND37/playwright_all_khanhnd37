import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { CollectionPage } from "@pages/dashboard/collections";
import { SFCollection } from "@sf_pages/collection";
import { ProductPage } from "@pages/dashboard/products";

test.describe("POD for plusbase - Campaign", () => {
  let printbasePage: PrintBasePage;
  let dashboardPage: DashboardPage;
  let productDBPage: ProductPage;
  let collection: CollectionPage;
  let shopDomain: string;
  let campaignName: string;

  test.beforeEach(async ({ dashboard, conf }) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    shopDomain = conf.suiteConf.domain;
    campaignName = conf.caseConf?.campaign_name;
    test.setTimeout(conf.suiteConf.time_out);
    await dashboardPage.page.goto(`https://${shopDomain}/admin/plusbase/campaigns/list`);
  });

  test(`@SB_PLB_PODPL_CAM_4 Verify search campaign  trong shop Plusbase`, async ({ dashboard }) => {
    await test.step(`Vào POD products > All campaigns > Search campaign `, async () => {
      await printbasePage.searchWithKeyword(campaignName);
      await printbasePage.waitUntilElementInvisible(printbasePage.xpathLoadingTable);
      expect(await printbasePage.page.locator(printbasePage.xpathCampaignsResults).count()).toEqual(1);
      expect(await printbasePage.isTextVisible(campaignName)).toEqual(true);
    });
    await test.step(`Vào Dropship products > All products > Search campaign`, async () => {
      await dashboardPage.navigateToMenu("Dropship products");
      await dashboardPage.navigateToMenu("All products");
      productDBPage = new ProductPage(dashboard, shopDomain);
      await productDBPage.searchProduct(campaignName);
      await printbasePage.waitUntilElementInvisible(printbasePage.xpathLoadingTable);
      expect(await printbasePage.isTextVisible("Could not find any products matching")).toEqual(true);
      expect(await printbasePage.isTextVisible("Try changing the search term")).toEqual(true);
    });
  });

  test(`@SB_PLB_PODPL_CAM_5 Verify add campaign to collection`, async ({ conf, dashboard, context }) => {
    const collectionInfo = conf.caseConf.collection_info;
    const productCollection = conf.caseConf.product_add;
    let SFPage;
    let collectionSF;
    await test.step(`Vào shop PLB > Product setting > Collections > Click đi đến collection detail > Add product > Click Refresh`, async () => {
      collection = new CollectionPage(dashboard, shopDomain);
      await collection.gotoCollectionDetail(collectionInfo.collection_title, "plusbase");
      await collection.page.waitForSelector(collection.xpathBlockProduct);
      await collection.clickOnBtnWithLabel("Add product");
      await dashboard.waitForSelector(collection.xpathItemList);
      await collection.addProductToCollectionDetail(productCollection);
      await dashboard.waitForSelector(collection.xpathBtnRefresh, { timeout: 9000 });
      await collection.clickOnBtnWithLabel("Refresh");
      await collection.waitForElementVisibleThenInvisible(collection.xpathLoadIcon);
      let limit = 0;
      while (
        (await collection.page
          .locator(await collection.getXpathProductInCollection(productCollection[0]))
          .isHidden()) &&
        limit <= 10
      ) {
        limit++;
        await collection.page.reload();
        await collection.page.waitForLoadState("networkidle");
      }
      await collection.gotoCollectionList("plusbase");
    });

    await test.step(`Click campaign trong list product của collection`, async () => {
      await collection.gotoCollectionDetail(collectionInfo.collection_title, "plusbase");
      await dashboard.waitForSelector(collection.xpathBlockProduct);
      await expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(true);
    });

    await test.step(`Click button View > Verify product trong collection ngoài SF`, async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitUntilElementVisible(collectionSF.xpathCollectionDetail);
      await expect(await collectionSF.checkProductSyncToCollectionSF(productCollection)).toBe(true);
      SFPage.close();

      //xóa campaign trong collection
      await collection.gotoCollectionDetail(collectionInfo.collection_title, "plusbase");
      await collection.deleteProductInCollectionDetailPage(productCollection);
      expect(await collection.checkProductSyncToCollectionDetailPage(productCollection)).toBe(false);
    });
  });
});
