import { test } from "@fixtures/theme";
import { CollectionPage } from "@pages/dashboard/collections";
import { expect } from "@core/fixtures";

/**
 * Shop co 4999 collection
 */
test.describe("Limit collection/store @TS_SB_CL_LM", async () => {
  test("[Limit collection/store] Verify limit tạo mới collections @SB_CL_SPC_10", async ({ dashboard, page, conf }) => {
    const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    const collectionLimit = conf.caseConf.collection_limit;
    const messageLimit = conf.caseConf.message_limit;
    const xpathButtonCreatCollection = "//button[normalize-space() = 'Create collection']";
    const xpathTitleCollectionList =
      `(//div[contains(@class,'collection-product-wrap')]` +
      `//h5[normalize-space()='${collectionLimit.collection_title}'])[1]`;
    const xpathTitleCollectionDetail = "//div[@class='container collection-detail']//h1";
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
        "Verify button Create collection",
      async () => {
        await collection.gotoCollectionList();
        await expect(await dashboard.locator(xpathButtonCreatCollection).isVisible()).toBe(true);
      },
    );

    await test.step(
      "Check btn [Create collection] > Input field Title > Chọn " +
        "Collection type = Automated > Chọn  Conditions > Click button [Save]",
      async () => {
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.createCollection(collectionLimit);
      },
    );

    await test.step("Đi đến màn Collections list > Verify button Create collection", async () => {
      await collection.gotoCollectionList();
      await expect(await dashboard.locator(xpathButtonCreatCollection).isDisabled()).toBe(true);
      await dashboard.locator(xpathButtonCreatCollection).hover();
      await expect(await dashboard.locator("//span[contains(@class,'s-tooltip-fixed-content')]//span")).toHaveText(
        messageLimit,
      );
    });

    await test.step("Tại màn SF, đi đến collection list page", async () => {
      await page.goto(`https://${conf.suiteConf.domain}/collections`);
      await page.waitForSelector("(//img[contains(@class,'image sb-lazy loading hover-secondary')])[1]", {
        state: "hidden",
      });
      await expect(await page.locator(xpathTitleCollectionList).isVisible()).toBe(true);
    });

    await test.step("Tại màn collection list SF, click open collection", async () => {
      await page
        .locator(
          `(//div[contains(@class,'collection-product-wrap')]//a[descendant::h5[normalize-space()='${collectionLimit.collection_title}']])[1]`,
        )
        .click();
      await page.waitForSelector("//div[@class='container collection-detail']//h1");
      await expect(await page.locator(xpathTitleCollectionDetail)).toHaveText(collectionLimit.collection_title);
    });

    await test.step(
      "Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail >" +
        " Click button Disable collection > Click button Save",
      async () => {
        await collection.gotoCollectionDetail(collectionLimit.collection_title);
        await collection.clickOnBtnWithLabel("Disable collection");
        await dashboard.waitForSelector("//button[@class='s-button is-outline is-small is-loading']", {
          state: "hidden",
        });
      },
    );

    await test.step("Đi đến màn Collections list > Verify button Create collection", async () => {
      await collection.gotoCollectionList();
      await expect(await dashboard.locator(xpathButtonCreatCollection).isDisabled()).toBe(true);
      await dashboard.locator(xpathButtonCreatCollection).hover();
      await expect(await dashboard.locator("//span[contains(@class,'s-tooltip-fixed-content')]//span")).toHaveText(
        messageLimit,
      );
    });

    await test.step(
      "Tại dashboard, đi đến màn Collections list > Search collection > Check checkbox >" +
        " click button Action > Click button Delete selected collections",
      async () => {
        await collection.gotoCollectionList();
        await collection.deleteCollection(collectionLimit.collection_title);
      },
    );

    await test.step("Đi đến màn Collections list > Verify button Create collection", async () => {
      await collection.gotoCollectionList();
      await expect(await dashboard.locator(xpathButtonCreatCollection)).toBeEnabled();
    });
  });
});
