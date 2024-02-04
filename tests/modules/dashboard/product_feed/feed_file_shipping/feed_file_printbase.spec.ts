import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { Page } from "@playwright/test";
import { readFileCSV } from "@helper/file";

const shippingOnFeedFile = async (
  dashboard: Page,
  product: ProductPage,
  feedName: string,
  value: string,
): Promise<boolean> => {
  await product.goToProductFeedList();
  await product.goToProductFeedDetail(feedName);
  await dashboard.waitForSelector(`//strong[normalize-space()='Product feed URL']`);
  const feedFile = await product.downloadFile("//div[child::div[contains(text(),'URL')]]//a");
  const readFeedFile = await readFileCSV(feedFile, "\t");
  let checkData = false;
  for (let i = 0; i < readFeedFile.length; i++) {
    checkData = readFeedFile[i].some(data => data.replace("\n", "").trim() == value.trim());
    return checkData;
  }
};

test.describe.parallel("Verify create feed file with country that is no support product on PrintBase", async () => {
  test(`verify Feed file status = Processing @SB_MAR_SALES_SC_FEED_GMC_SYNC_SHIP_FEE_22`, async ({
    authRequest,
    conf,
    dashboard,
  }) => {
    const feedFileShipping = conf.caseConf.data;
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    await test.step("Go to Product feed", async () => {
      await product.goToProductFeedList();
      await dashboard.locator("//table[contains(@class, 'table-product-feed')]").isVisible();
    });
    if (
      (await dashboard
        .locator(
          `//tr[descendant::span[normalize-space()='${feedFileShipping.feed_name}']]//i[contains(@class,'mdi-delete')]`,
        )
        .count()) > 0
    ) {
      await product.deleteFeedByAPI(authRequest, feedFileShipping.feed_name, conf.suiteConf.domain);
    }
    await test.step("create Feed file", async () => {
      await product.addProductFeed(feedFileShipping);
      test.setTimeout(conf.suiteConf.timeout);
      await expect(
        dashboard.locator("//div[contains(text(), 'Product feed was created successfully!')]"),
      ).toBeVisible();
    });

    await test.step("Check feed file with status = processing", async () => {
      await product.goToProductFeedList();
      test.setTimeout(conf.caseConf.timeout);
      await product.goToProductFeedDetail(conf.caseConf.feed_name);
      const xpath = "//strong[contains(text(), 'Product feed URL')]";
      await dashboard.waitForSelector(xpath);
      expect(
        await dashboard
          .locator(`(${xpath}//parent::div)//following-sibling::div//span[contains(@class,'s-tag')]`)
          .textContent(),
      ).toContain("Processing");
    });
  });
});

test.describe.parallel(`verify create feed file Printbase with option country `, async () => {
  test(`@SB_MAR_SALES_SC_FEED_GMC_SYNC_SHIP_FEE_18 `, async ({ authRequest, page, conf }) => {
    const dataTest = conf.caseConf.data;
    for (let i = 0; i < Object(dataTest).length; i++) {
      const product = new ProductPage(page, conf.suiteConf.domain);
      await test.step("Go to Product feed", async () => {
        await product.goToProductFeedList();
      });
      if (
        (await page
          .locator(
            `//tr[descendant::span[normalize-space()='${dataTest[i].feed_name}']]//i[contains(@class,'mdi-delete')]`,
          )
          .count()) > 0
      ) {
        await product.deleteFeedByAPI(authRequest, dataTest[i].feed_name, conf.suiteConf.domain);
      }
      await test.step("create Feed file", async () => {
        await product.addProductFeed(dataTest[i]);
        await expect(page.locator("//div[contains(text(), 'Product feed was created successfully!')]")).toBeVisible();
      });
      await test.step("Check product with shipping on CSV file", async () => {
        const product = new ProductPage(page, conf.suiteConf.domain);
        const productShipping = dataTest[i].product_shipping;
        const checkDataExitsOnFeedFile = await shippingOnFeedFile(
          page,
          product,
          dataTest[i].feed_name,
          productShipping,
        );
        await expect(checkDataExitsOnFeedFile).toEqual(dataTest[i].expect);
      });
    }
  });
});
