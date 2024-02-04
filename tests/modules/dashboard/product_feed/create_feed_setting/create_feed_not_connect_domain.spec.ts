import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { ProducFeedPage } from "@pages/dashboard/products/product_feeds";
import { readFileCSV } from "@helper/file";
import type { FeedInfo, VariantInfoAPI } from "@types";

test.describe("Veirfy create feed setting", () => {
  let productFeedPage: ProducFeedPage;
  let arrSaleChannels: Array<string>;
  let feedInfo: Array<FeedInfo>;
  let feedFile: string;
  let expectVariant: VariantInfoAPI;
  let domain;
  let primaryDomain;
  let domainFeedApi;

  const addDomain = async productFeedPage => {
    await productFeedPage.page.click(productFeedPage.xpathAddDomain);
    await productFeedPage.page.locator(productFeedPage.xpathFildDomain).fill(domainFeedApi);
    await productFeedPage.clickOnBtnWithLabel("Next");
    await productFeedPage.clickOnBtnWithLabel("Verify connection");
    await expect(productFeedPage.page.locator(productFeedPage.xpathMessAddDomainSuccess(domainFeedApi))).toBeVisible();
  };

  const changeDomain = async productFeedPage => {
    await productFeedPage.page.click(productFeedPage.xpathChangePrimaryDomain);
    await productFeedPage.clickChangePrimaryDomain(domainFeedApi);
    await productFeedPage.clickOnBtnLinkWithLabel("Save");
    await expect(productFeedPage.page.locator(productFeedPage.xpathMessChangeDomainSuccess)).toBeVisible();
  };

  test.beforeEach(async ({ conf, dashboard }) => {
    productFeedPage = new ProducFeedPage(dashboard, conf.suiteConf.domain);

    //Navigate to Product Feeds

    arrSaleChannels = conf.suiteConf.arr_sale_channels;
    feedInfo = conf.caseConf.feed_info;
    expectVariant = conf.caseConf.variant_info;
    domain = conf.suiteConf.domain;
    primaryDomain = conf.caseConf.primary_domain;
    domainFeedApi = conf.suiteConf.snake_case;

    await productFeedPage.goto("admin/domain");
    let domainConnect = (
      await productFeedPage.page.locator(productFeedPage.xpathGetPrimaryDomain).textContent()
    ).trim();
    switch (primaryDomain) {
      case "disconnect":
        if (domainConnect !== domain) {
          let shouldContinueLoop = true;
          while (shouldContinueLoop) {
            if (await productFeedPage.page.locator(productFeedPage.xpathDeleteDomain).isVisible()) {
              await productFeedPage.page.click(productFeedPage.xpathDeleteDomain);
              await productFeedPage.clickOnBtnWithLabel("Remove");
              await productFeedPage.page.waitForSelector(productFeedPage.xpathMessDeleteDomainSuccess);
              continue;
            }
            domainConnect = (
              await productFeedPage.page.locator(productFeedPage.xpathGetPrimaryDomain).textContent()
            ).trim();
            if (domainConnect === domain) {
              shouldContinueLoop = false;
            }
          }
          await expect(domainConnect).toEqual(domain);
        }
        break;
      case "connect":
        if (domainConnect !== domainFeedApi) {
          if (await productFeedPage.page.locator(productFeedPage.xpathTitleBlogDomain).isVisible()) {
            const xpathListDomain = await productFeedPage.page.locator(productFeedPage.xpathCheckExistingDomain);
            const listDomain = await xpathListDomain.evaluateAll(list =>
              list.map(element => element.textContent.trim()),
            );
            let checkDomain = false;
            for (const domain of listDomain) {
              if (domain === domainFeedApi) {
                checkDomain = true;
                break;
              }
            }
            if (checkDomain) {
              await addDomain(productFeedPage);
            } else {
              // add domain connect
              await addDomain(productFeedPage);
              // change domain after add success
              await changeDomain(productFeedPage);
            }
          } else {
            // add domain connect
            await addDomain(productFeedPage);
            // change domain after add success
            await changeDomain(productFeedPage);
          }
        }
        break;
    }
    await productFeedPage.goto("admin/product-feeds");
    // //Delete all current Feed
    await productFeedPage.deleteAllFeed();
    expect(await productFeedPage.countFeed()).toBe(0);
  });

  test(`Kiểm tra popup tạo feed đối với trường hợp tạo feed khi shop chưa connect Primary domain @SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_1`, async () => {
    await test.step(`Kiểm tra popup feed khi không connect Primary domain
     - Click button Add product feed`, async () => {
      expect(await productFeedPage.isDBPageDisplay("Product feeds"));
      await productFeedPage.reloadPageUntilConditionFailed(await productFeedPage.isOldFeedPage());
      await productFeedPage.clickOnBtnWithLabel("Add product feed");
      expect(await productFeedPage.isPopUpDisplayed("Select sales channel")).toBeTruthy();
      const promises = arrSaleChannels.map(async channel => {
        const xpath = productFeedPage.getXpathSalesChannel(channel);
        const isGoogle = channel === "Google";
        const element = await productFeedPage.page.locator(xpath);
        if (isGoogle) {
          await expect(element).toBeDisabled();
        } else {
          await expect(element).toBeEnabled();
        }
      });

      await Promise.all(promises);
    });
  });

  test(`Kiểm tra tạo feed file đối với trường hợp shop chưa connect Primary domain @SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_2`, async () => {
    await test.step(`Tạo feed file với thông tin refer file 
    - Click button save `, async () => {
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
    });

    await test.step(`Kiểm tra file của feed vừa được tạo xong   
    - Wait for render product vào trong feed file   
    - Click vào link feed đ ể tải về   
    - Open file feed và kiểm tra`, async () => {
      for (const feed of feedInfo) {
        await productFeedPage.navigateToFeedDetail(feed.name);
        //Download Feed fil
        await productFeedPage.reloadPageUntilConditionFailed(await productFeedPage.isFeedFileGened());
        feedFile = await productFeedPage.downloadFeedFile();
        const feedFileData = await readFileCSV(feedFile, "\t");
        expect(await productFeedPage.isCSVFileContainVariant(feedFileData, expectVariant, feed)).toBeTruthy();
        await productFeedPage.clickOnBreadcrumb();
      }
    });

    await test.step(`Back lại trang List all Feed`, async () => {
      expect(await productFeedPage.isDBPageDisplay("Product feeds")).toBeTruthy();
      for (const feed of feedInfo) {
        expect(await productFeedPage.isWarningIconDisplayed(feed.name)).toBeTruthy();
      }
    });
  });

  test(`@SB_MAR_SALES_SC_Feed_GMC_CR_SET_FEED_V2_10 Kiểm tra update Product settings trong feed setting đối với các trường hợp khác nhau đối với feed File (Others và Klaviyo)`, async ({}) => {
    await test.step(`Tạo Product setting refer Case 10 settings theo từng case trong file`, async () => {
      let feedFileData;
      await productFeedPage.goto("admin/product-feeds");
      await productFeedPage.createFeeds(feedInfo);
      for (const i of feedInfo) {
        await productFeedPage.isFeedCreated(i);
      }
      for (const feed of feedInfo) {
        await productFeedPage.navigateToFeedDetail(feed.name);
        //Download Feed fil
        await productFeedPage.reloadPageUntilConditionFailed(await productFeedPage.isFeedFileGened());
        feedFile = await productFeedPage.downloadFeedFile();
        feedFileData = await readFileCSV(feedFile, "\t");
        expect(await productFeedPage.isCSVFileContainVariant(feedFileData, expectVariant, feed)).toBeTruthy();
        await productFeedPage.clickOnBreadcrumb();
      }
      const checkDuplicatesTitle = arr => new Set(arr.flatMap(col => col[1].split(","))).size !== arr.length;
      expect(checkDuplicatesTitle(feedFileData)).toBeFalsy();
    });
  });
});
