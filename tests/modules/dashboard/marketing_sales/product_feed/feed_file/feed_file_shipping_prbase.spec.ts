import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { loadData } from "@core/conf/conf";
import { GoogleMerchantCenter } from "@pages/thirdparty/gmc";
import { SFCheckout } from "@pages/storefront/checkout";

let productPage: ProductPage;
let gmcPage: GoogleMerchantCenter;
let sfCheckout: SFCheckout;
let fileUrl;
let shippingPrice;
let numberOfFeedProduct;
let isFeedDisapperDashboard;
let shippingInfoCsv;
let isWarningFeedAlreadyDisplay;

test.describe("Feed file shipping_kiểm tra sync shipping product lên GMC bằng cách upload file csv Feed file cho shop PrintBase", async () => {
  const caseId = "SB_MAR_SALES_SC_FEED_GMC_SYNC_SHIP_FEE_18";
  const conf = loadData(__dirname, caseId);
  conf.caseConf.data.forEach(
    ({
      product_link: productLink,
      shipping_address: shippingAddess,
      feed_info: feedInfo,
      collection_status: collectionStatus,
      collection_name: collectionName,
      status_contain: statusContain,
      folder_name: folderName,
      file_name: fileName,
      region: region,
      langue: langue,
      feed_name_input: feedNameInput,
      method: method,
      file_name_input: fileNameInput,
      filter_title_feed: filterTitleFeed,
      product_name: productName,
      handling_transit_time: handlingTransitTime,
      data_shipping_gmc: dataShippingGmc,
    }) => {
      test(`@${caseId} ${feedInfo.feed_title}`, async ({ dashboard, page, authRequest, ggPage, scheduler }) => {
        productPage = new ProductPage(dashboard, conf.suiteConf.domain);
        sfCheckout = new SFCheckout(page, conf.suiteConf.domain);
        gmcPage = new GoogleMerchantCenter(ggPage, "");
        await test.step(
          "- Tại Product feed -> Click button Add product feed" +
            "- click chọn Feed file: Others" +
            "- input Feed name, select các options -> click Save",
          async () => {
            //get shipping at checkout page
            shippingPrice = await sfCheckout.getShippingAtCheckoutPage(productLink, shippingAddess);
            shippingInfoCsv = feedInfo.country + ":" + shippingPrice.replace("$", "") + handlingTransitTime;
            await page.close();
            //add product feed
            await productPage.goToProductFeedList();
            isFeedDisapperDashboard = await dashboard
              .locator(productPage.getXpathProductFeed(feedInfo.feed_title))
              .isVisible();
            if (!isFeedDisapperDashboard) {
              await productPage.addProductFeed(feedInfo, collectionStatus, collectionName);
              await expect(dashboard.locator(productPage.xpathLabelProductFeedURL)).toBeVisible();
            }
          },
        );

        await test.step("Tại Product feed URL -> click URL -> kiểm tra hiển thị product trong file csv đã download", async () => {
          const checkDataExitsOnFeedFile = await productPage.shippingOnFeedFile(
            feedInfo.feed_title,
            folderName,
            fileName,
            shippingInfoCsv,
          );
          await expect(checkDataExitsOnFeedFile).toEqual(statusContain);
        });

        await test.step(
          "- Kiểm tra product sync lên GMC" +
            "1. Loign đến GMC account -> click Product -> click Feed -> click button + để tạo thêm New primary feed" +
            "2. -> Tại tab Basic Information -> chọn Target countries, chọn Language -> click Continue" +
            "3. -> Tại tab Name and input method -> input `Name your feed and choose an input method`," +
            "tại 'Choose how to set up your feed and connect your data to Merchant Center' > chọn 'Scheduled fetch' " +
            "-> click Continue" +
            "4. - Go to dashboard store -> vào product feed list page -> vào product feed detail page bất kỳ -> copy URL link của feed detail Tại GMC account, tab Setup -> Input 'Enter the name of your feed file and create a fetch schedule', input URL đã copy vào field 'Feed URL'" +
            "5. Click button Create feed" +
            "6. Tại Gmc, feed detail -> click button Fetch now",
          async () => {
            await gmcPage.goToCreateFeed();
            await gmcPage.inputBaseInfo(region, langue);
            await gmcPage.inputNameAndMethod(feedNameInput, method);
            isWarningFeedAlreadyDisplay = await ggPage.locator(gmcPage.xpathWarningFeedAlready).isHidden();
            if (isWarningFeedAlreadyDisplay) {
              fileUrl = await productPage.getFeedUrl(feedInfo.feed_title);
              await gmcPage.inputSetupAndFinishCreateFeed(fileNameInput, fileUrl);
            }
          },
        );

        await test.step(`Tại All product feed, click product bất kỳ -> kiểm tra thông tin product đã được upload lên GMC của Feed file`, async () => {
          await gmcPage.goToFeeds();
          await ggPage.locator(gmcPage.xpathHeaderFeedPage).click();
          await ggPage.keyboard.down("PageDown");
          await ggPage.waitForSelector(gmcPage.getXpathFeedNameAtFeedsPage(feedNameInput));
          numberOfFeedProduct = await gmcPage
            .genLoc(gmcPage.getXpathNumberProductWithFeed(feedNameInput))
            .textContent();
          if (numberOfFeedProduct === "0") {
            await scheduler.schedule({ mode: "later", minutes: 30 });
            // eslint-disable-next-line playwright/no-skipped-test
            test.skip();
            return;
          }
          await scheduler.clear();
          await gmcPage.viewProductListWithFeedName(feedNameInput);
          await gmcPage.goToProductDetailWithFilter(filterTitleFeed, productName);
          if (statusContain) {
            expect(await gmcPage.getInfoAttributesPreviewCol("Shipping")).toEqual(shippingPrice);
            expect(await gmcPage.getInforShippingFinalAttributesCol("country")).toEqual(feedInfo.country);
            expect(await gmcPage.getInforShippingFinalAttributesCol("price")).toEqual(shippingPrice);
            expect(await gmcPage.getInforShippingFinalAttributesCol("min handling time")).toEqual(
              dataShippingGmc.min_handling_time,
            );
            expect(await gmcPage.getInforShippingFinalAttributesCol("max handling time")).toEqual(
              dataShippingGmc.max_handling_time,
            );
            expect(await gmcPage.getInforShippingFinalAttributesCol("min transit time")).toEqual(
              dataShippingGmc.min_transit_time,
            );
            expect(await gmcPage.getInforShippingFinalAttributesCol("max transit time")).toEqual(
              dataShippingGmc.max_transit_time,
            );
          } else {
            expect(await gmcPage.getInfoAttributesPreviewCol("Shipping")).toEqual(
              dataShippingGmc.emty_product_shipping,
            );
            expect(await ggPage.locator(gmcPage.xpathLableFinalAttributes("shipping")).isHidden()).toBeTruthy();
          }

          //delete feed file at store's dashboard and gmc after completed verify
          await productPage.goToProductFeedList();
          if ((await dashboard.locator(productPage.getXpathProductFeed(feedInfo.feed_title)).count()) > 0) {
            await productPage.deleteFeedByAPI(authRequest, feedInfo.feed_title, conf.suiteConf.domain);
          }
          await gmcPage.deleteFeed(feedNameInput);
        });
      });
    },
  );
});
