import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import path from "path";
import { readFileCSV } from "@helper/file";
import { Page } from "@playwright/test";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";

import appRoot from "app-root-path";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { loadData } from "@core/conf/conf";

const checkDataOnFeedFile = async (
  dashboard: Page,
  product: ProductPage,
  feedName: string,
  value: string,
): Promise<boolean> => {
  await product.goToProductFeedList();
  await dashboard.reload();
  await product.goToProductFeedDetail(feedName);
  await dashboard.waitForSelector(`//strong[normalize-space()='Product feed URL']`);
  const feedFile = await product.downloadFile("//div[child::div[contains(text(),'URL')]]//a");
  await dashboard.waitForLoadState("load");
  const readFeedFile = await readFileCSV(feedFile, "\t");
  let checkData = false;
  for (let i = 0; i < readFeedFile.length; i++) {
    checkData = readFeedFile[i].some(data => data.replace("\n", "").trim() == value.trim());
    if (checkData == true) {
      return checkData;
    }
  }
  return false;
};

const generateFeedOnHive = async (hiveSB: HiveSBaseOld, shopId: string, feedID: string, isFeedGMC: boolean) => {
  await hiveSB.goToShopDetail(shopId);
  await hiveSB.generateFeed(feedID, isFeedGMC);
};

test.beforeAll(async ({ conf, browser }) => {
  const { domain, userId, shopId, username, password } = conf.suiteConf as never;
  const context = await browser.newContext();
  const page = await context.newPage();
  test.setTimeout(conf.suiteConf.timeout);
  const dashboardPage = new DashboardPage(page, domain);
  const product = new ProductPage(page, conf.suiteConf.domain);
  await dashboardPage.login({
    userId: userId,
    shopId: shopId,
    email: username,
    password: password,
  });

  await product.goToProductList();
  await product.deleteProduct(conf.suiteConf.password);
  await product.goToProductList();
  const pathFile = path.join(appRoot + "/assets/product_feed/product.csv");
  await product.importProduct(pathFile, `//input[@type='file' and @accept='.zip, .csv']`, false);
  await page.reload();
});

test.describe("Verify update product Feed file @TS_FEED_FILE", async () => {
  test.describe.configure({ mode: "serial" });
  test(`Check hide product and gen feed files @TC_SB_MAR_SALES_SC_Feed_GMC_UPD_PROD_FEED_GMC_3`, async ({
    dashboard,
    hiveSBase,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const feedName = conf.suiteConf.feedName;
    const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    const shopId = conf.suiteConf.shopId;
    const productName = conf.caseConf.product_title;

    await test.step("Check product on File CSV", async () => {
      const checkDataExitsOnFeedFile = await checkDataOnFeedFile(dashboard, product, feedName, productName);
      await expect(checkDataExitsOnFeedFile).toEqual(true);
    });

    await test.step("Hide product on Product list", async () => {
      await product.gotoProductDetail(productName);
      await product.hideProductOnProductDetail(true);
    });

    await test.step("Generate feed on Hive ", async () => {
      await generateFeedOnHive(hiveSB, shopId, conf.suiteConf.feedID, false);
    });

    await test.step("Check hidden products on CSV File", async () => {
      const checkDataExitsOnFeedFile = await checkDataOnFeedFile(dashboard, product, feedName, productName);
      await expect(checkDataExitsOnFeedFile).toEqual(false);
    });

    await test.step("Unhidden product on Product list", async () => {
      const productName = conf.caseConf.product_title;
      await product.gotoProductDetail(productName);
      await product.hideProductOnProductDetail(false);
    });

    await test.step("Generate feed on Hive ", async () => {
      await generateFeedOnHive(hiveSB, shopId, conf.suiteConf.feedID, false);
    });

    await test.step("Check show products on CSV File", async () => {
      const checkDataExitsOnFeedFile = await checkDataOnFeedFile(dashboard, product, feedName, productName);
      await expect(checkDataExitsOnFeedFile).toEqual(true);
    });
  });

  test(`Check update description and gen feed files @TC_SB_MAR_SALES_SC_Feed_GMC_UPD_PROD_FEED_GMC_8`, async ({
    dashboard,
    hiveSBase,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const feedName = conf.suiteConf.feedName;
    const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    const shopId = conf.suiteConf.shopId;
    const productName = conf.caseConf.product_title;
    const productDescription = conf.caseConf.product_description_edit;

    await test.step("Update description product", async () => {
      await product.gotoProductDetail(productName);
      await product.editDescriptionProduct(productDescription);
    });

    await test.step("Generate feed on Hive ", async () => {
      await generateFeedOnHive(hiveSB, shopId, conf.suiteConf.feedID, false);
    });

    await test.step("Check product update description on CSV File", async () => {
      const checkData = await checkDataOnFeedFile(dashboard, product, feedName, productDescription);
      await expect(checkData).toEqual(true);
    });
  });

  test(`Check update vendor and gen feed files @TC_SB_MAR_SALES_SC_Feed_GMC_UPD_PROD_FEED_GMC_10`, async ({
    dashboard,
    hiveSBase,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const feedName = conf.suiteConf.feedName;
    const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    const shopId = conf.suiteConf.shopId;
    const productName = conf.caseConf.product_title;
    const productVendor = conf.caseConf.product_vendor_edit;

    await test.step("Update vendor product on Product page", async () => {
      await product.gotoProductDetail(productName);
      await product.editVendorProduct(productVendor, "//div[child::*[normalize-space()='Vendor']]//input");
    });

    await test.step("Generate feed on Hive ", async () => {
      await generateFeedOnHive(hiveSB, shopId, conf.suiteConf.feedID, false);
    });

    await test.step("Check product update description on CSV File", async () => {
      const isCheck = await checkDataOnFeedFile(dashboard, product, feedName, productVendor);
      await expect(isCheck).toEqual(true);
    });
  });

  test(`Check using tags and gen feed files @TC_SB_MAR_SALES_SC_Feed_GMC_UPD_PROD_FEED_GMC_12`, async ({
    dashboard,
    hiveSBase,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const feedName = conf.suiteConf.feedName;
    const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    const shopId = conf.suiteConf.shopId;
    const productName = conf.caseConf.product_title;

    await test.step("Update tags for product ", async () => {
      await product.gotoProductDetail(productName);
      await product.editProductTag(conf.caseConf.product_tags);
    });

    await test.step("Generate feed on Hive ", async () => {
      await generateFeedOnHive(hiveSB, shopId, conf.suiteConf.feedID, false);
    });

    await test.step("Check  using tags for product updates on CSV File", async () => {
      const isCheck = await checkDataOnFeedFile(dashboard, product, feedName, "product test");
      await expect(isCheck).toEqual(true);
    });
  });

  test(`Check delete image product and gen feed files @TC_SB_MAR_SALES_SC_Feed_GMC_UPD_PROD_FEED_GMC_22`, async ({
    dashboard,
    hiveSBase,
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    const feedName = conf.suiteConf.feedName;
    const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    const shopId = conf.suiteConf.shopId;
    const productName = conf.caseConf.product_title;

    await test.step("Delete image product", async () => {
      await product.gotoProductDetail(productName);
      await product.deleteImageProduct();
    });

    await test.step("Generate feed on Hive ", async () => {
      await generateFeedOnHive(hiveSB, shopId, conf.suiteConf.feedID, false);
    });

    await test.step("Check product delete image on CSV File", async () => {
      const checkDataExitsOnFeedFile = await checkDataOnFeedFile(dashboard, product, feedName, productName);
      await expect(checkDataExitsOnFeedFile).toEqual(false);
    });
  });
});

test.describe("Verify update variant tag on Feed file @TS_VARIANT_TAG", async () => {
  test.describe.configure({ mode: "serial" });
  const caseName = "TC_SB_MAR_SALES_SC_Feed_GMC_VARIANT_TAG";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      product_title: productTitle,
      variant_title: variantTitle,
      variant_tags: variantTags,
      tag_id: tagID,
      case_id: caseID,
    }) => {
      test(`Check update ID in feed file when update variant tag @${caseID}`, async ({
        dashboard,
        hiveSBase,
        conf,
        authRequest,
      }) => {
        test.setTimeout(conf.suiteConf.timeout);
        const product = new ProductPage(dashboard, conf.suiteConf.domain);
        const feedName = conf.suiteConf.feedName;
        const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
        const shopId = conf.suiteConf.shopId;

        await test.step("Edit variant tags", async () => {
          await product.goToProductList();
          const productID = await product.getProductId(authRequest, productTitle, conf.suiteConf.domain);
          const variantID = await product.getVariantIdByAPI(authRequest, productID, variantTitle);
          if (tagID === "") {
            tagID = variantID;
          }
          await product.editVariantTag(productID, variantID, variantTags);
        });

        await test.step("Generate feed on Hive ", async () => {
          await generateFeedOnHive(hiveSB, shopId, conf.suiteConf.feedID, true);
        });

        await test.step("Check update ID in Feed File", async () => {
          const checkDataExitsOnFeedFile = await checkDataOnFeedFile(dashboard, product, feedName, tagID);
          await expect(checkDataExitsOnFeedFile).toEqual(false);
        });
      });
    },
  );
});
