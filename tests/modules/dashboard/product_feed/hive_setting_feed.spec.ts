import { test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { ProductPage } from "@pages/dashboard/products";
import { expect } from "@playwright/test";

test.describe("Check update setting feed sales channel", async () => {
  test.describe.configure({ mode: "serial" });
  const caseName = "CHECK_UPDATE_SETTING_FEED";
  const conf = loadData(__dirname, caseName);
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const updSettingFeed = conf.caseConf.data[i];
    const dataUpdate = updSettingFeed.obj;

    test(`Update setting feed sales channel @TC_${updSettingFeed.case_id}`, async ({ hiveSBase, dashboard, conf }) => {
      const hiveSbase = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);

      /**
       * Delete these old feeds for creating new one
       */
      const numberOfFeed = await dashboard.locator("//i[contains(@class,'delete')]").count();
      for (let i = 0; i < numberOfFeed; i++) {
        await dashboard.locator("(//i[contains(@class,'delete')]//parent::span)[i]").click();
        await dashboard.locator("//span[normalize-space()='Delete']//parent::button").click();
      }

      await test.step(`Open feed Other test on hive`, async () => {
        await hiveSbase.goToProductFeedsHive();
        await hiveSbase.openSettingFeed(dataUpdate.name_before);
        await hiveSBase.waitForLoadState("networkidle");
      });

      await test.step(`Update feed Other test with object data`, async () => {
        await hiveSbase.fulfillDataOnSettingFeed(dataUpdate);
        await hiveSbase.updateSettingFeedLimitation(dataUpdate);
        await hiveSbase.saveSettingFeed();
      });

      await test.step(`Create feed with current setting feed`, async () => {
        const productFeed = new ProductPage(dashboard, conf.suiteConf.domain);
        await productFeed.goToProductFeedList();
        await productFeed.addProductFeed(dataUpdate);
      });

      await test.step(`Check feed limitation, file type and the number of products`, async () => {
        const productFeed = new ProductPage(dashboard, conf.suiteConf.domain);
        await productFeed.goToProductFeedList();
        const feedTotalProduct = await dashboard
          .locator("//tbody//tr[@class='draggable-item']//td[@class='text-left s-pr16']")
          .textContent();

        for (let i = 0; i < 5; i++) {
          if (feedTotalProduct === "0") {
            await dashboard.reload();
          } else {
            break;
          }
        }

        const xpathFeedURL =
          `//span[normalize-space()='Create feed test ${dataUpdate.name}']` + `//ancestor::td//following::td[3]//a`;
        const xpathTotalProducts =
          `//span[normalize-space()='Create feed test ${dataUpdate.name}']` + `//ancestor::td//following::td[1]`;
        await expect(await dashboard.locator(xpathFeedURL).getAttribute("href")).toContain("txt");
        await productFeed.openPopupFeed();
        if (dataUpdate.name == "Other test") {
          await expect(
            await dashboard.locator(`//div[@class='s-modal-body']//h5[normalize-space()='${dataUpdate.name}']`),
          ).toBeEnabled();
          expect(await dashboard.locator(xpathTotalProducts).textContent()).toContain("92");
        } else {
          await expect(
            await dashboard.locator(`//div[@class='s-modal-body']//h5[normalize-space()='${dataUpdate.name}']`),
          ).toBeDisabled();
          expect(await dashboard.locator(xpathTotalProducts).allTextContents()).toContain("10");
        }
      });
    });
  }
});

test.describe("Check enable product feed on dashboard", async () => {
  test.describe.configure({ mode: "serial" });
  const caseName = "CHECK_ENABLE_PRODUCT_FEED";
  const conf = loadData(__dirname, caseName);
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const enableData = conf.caseConf.data[i];

    test(`Verify feed sales channel @TC_${enableData.case_id}`, async ({ dashboard, hiveSBase, conf }) => {
      const hiveSbase = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);

      await test.step(`Go to product feed in hive`, async () => {
        await hiveSbase.goToProductFeedsHive();
        await hiveSbase.openSettingFeed("Other test");
        await hiveSbase.setupEnableSettingFeed(enableData.enabled, enableData.sandbox_id, enableData.approved);
        await hiveSbase.saveSettingFeed();
      });

      await test.step(`Verify show up product feed on popup create feed`, async () => {
        const productFeed = new ProductPage(dashboard, conf.suiteConf.domain);
        await productFeed.goToProductFeedList();
        await dashboard.reload();
        await productFeed.openPopupFeed();
        const xpathFeed = "//div[@class='s-modal-body']//label//h5[normalize-space()='Other test']";
        if (
          enableData.approved == "checked" ||
          (enableData.approved !== "checked" && enableData.enabled == "checked" && enableData.sandbox_id != "")
        ) {
          await expect(await dashboard.locator(xpathFeed)).toBeVisible();
        } else {
          await expect(await dashboard.locator(xpathFeed)).not.toBeVisible();
        }
      });
    });
  }
});

test.describe(`Check logic exceeding limitation`, async () => {
  test.describe.configure({ mode: "serial" });
  const caseName = "CHECK_LOGIC_EXCEEDING_LIMITATION";
  const conf = loadData(__dirname, caseName);
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const limitationCase = conf.caseConf.data[i];
    test(`Verify logic limit product and exceeding limitation @TC_${limitationCase.case_id}`, async ({
      dashboard,
      hiveSBase,
      conf,
    }) => {
      const hiveSbase = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);

      await test.step(`Update setting Other feed`, async () => {
        await hiveSbase.goToProductFeedsHive();
        await hiveSbase.openSettingFeed("Other test");
        await hiveSbase.updateSettingFeedLimitation(limitationCase);
        await hiveSbase.saveSettingFeed();
      });

      await test.step(`Create feed Other test`, async () => {
        const productFeed = new ProductPage(dashboard, conf.suiteConf.domain);
        await productFeed.goToProductFeedList();
        await dashboard.waitForLoadState("networkidle");
        const numberOfFeed = await dashboard.locator("//i[contains(@class,'delete')]").count();
        for (let i = 1; i <= numberOfFeed; i++) {
          await dashboard.locator("(//i[contains(@class,'delete')]//parent::span)[i]").click();
          await dashboard.locator("//span[normalize-space()='Delete']//parent::button").click();
        }
        await dashboard.reload();
        await productFeed.addProductFeed(limitationCase);
      });

      await test.step(`Verify total products and banner limitation`, async () => {
        const productFeed = new ProductPage(dashboard, conf.suiteConf.domain);
        const xpathFeedURL = "//span[@class='s-tag']";
        const count: number = await dashboard.locator(xpathFeedURL).count();
        expect(count).toEqual(limitationCase.the_number_of_link);
        await productFeed.goToProductFeedList();
        const xpathTotalProducts =
          `//span[normalize-space()='Create feed test ${limitationCase.feed_name}']` +
          `//ancestor::td//following::td[1]`;
        const totalProduct = await dashboard.locator(xpathTotalProducts).textContent();
        expect(totalProduct).toContain(limitationCase.total_products_verify);
      });
    });
  }
});
