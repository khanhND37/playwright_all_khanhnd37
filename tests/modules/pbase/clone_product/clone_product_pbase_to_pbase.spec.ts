import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFProduct } from "@pages/storefront/product";
import { snapshotDir } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { SFCheckout } from "@sf_pages/checkout";
import { removeCurrencySymbol } from "@utils/string";
import { OrdersPage } from "@pages/dashboard/orders";

test.describe("Clone campaign from pbase to pbase", () => {
  let productPageFirst: ProductPage;
  let printbasePageFirst: PrintBasePage;
  let dashboardPageFirst: DashboardPage;
  let dashboardPageSecond: DashboardPage;
  let productPageSecond: ProductPage;
  let printbasePageSecond: PrintBasePage;
  let checkoutSF: SFCheckout;
  let orderPage: OrdersPage;
  let orderId;
  let newCampaignId;

  test.beforeEach(async ({ conf, token, dashboard, page }, testInfo) => {
    // Skip all case on prodtest env
    if (process.env.ENV === "prodtest") {
      return;
    }
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    const domainFirst = conf.suiteConf.info_shop_first.domain;
    dashboardPageSecond = new DashboardPage(dashboard, conf.suiteConf.domain);
    dashboardPageFirst = new DashboardPage(page, domainFirst);
    const shopToken = await token.getWithCredentials({
      domain: domainFirst,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = shopToken.access_token;
    await dashboardPageFirst.loginWithToken(accessToken);
    await dashboardPageFirst.navigateToMenu("Campaigns");
    printbasePageFirst = new PrintBasePage(dashboardPageFirst.page, domainFirst);
    productPageFirst = new ProductPage(dashboardPageFirst.page, domainFirst);
    orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
  });

  const caseName = "CLONE_PRODUCT_PB_TO_PB";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(testCase => {
    const cloneInfos = testCase.clone_infos;
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, authRequest }) => {
      // Skip all case on prodtest env
      if (process.env.ENV === "prodtest") {
        return;
      }
      test.setTimeout(conf.suiteConf.timeout);
      for (let i = 0; i < cloneInfos.length; i++) {
        const campaignOrigin = cloneInfos[i].campaign;
        const productName = campaignOrigin.pricing_info.title;
        await test.step("Login vào first shop > đi đến màn hình All campaigns và search campaign  > Clone campaign  sang second shop", async () => {
          await printbasePageFirst.searchWithKeyword(productName);
          const isProductVisible = await printbasePageFirst.page
            .locator(`(//span[normalize-space()="${productName}"])[1]`)
            .isVisible({ timeout: 10000 });
          if (!isProductVisible) {
            await printbasePageFirst.navigateToMenu("Catalog");
            const campainId = await printbasePageFirst.launchCamp(campaignOrigin);
            const isAvailable = await printbasePageFirst.checkCampaignStatus(
              campainId,
              ["available", "available with basic images"],
              30 * 60 * 1000,
            );
            expect(isAvailable).toBeTruthy();
            await printbasePageFirst.page.reload();
            await printbasePageFirst.searchWithKeyword(productName);
          }
          await productPageFirst.cloneProductToStore(cloneInfos[i].clone_info);
          await productPageFirst.checkMsgAfterCreated({
            message: `${conf.suiteConf.message} ${cloneInfos[i].clone_info["second_shop"]}`,
          });
        });
        await test.step("Login vào second shop > Click vào Campaigns>Click vào icon process sau đó verify hiển thị status và process ở progress bar", async () => {
          productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.domain);
          await dashboardPageSecond.navigateToMenu("Campaigns");
          let textStatus;
          let textProcess;
          let j = 0;
          do {
            await productPageSecond.clickProgressBar();
            textStatus = await productPageSecond.getStatus();
            textProcess = await productPageSecond.getProcess();
            await productPageSecond.page.waitForTimeout(1000);
            await productPageSecond.page.click(productPageSecond.xpathTitleCampaign);
            j++;
          } while (textStatus != conf.suiteConf.status && j < 11);
          //Kiểm tra trạng thái quá trình clone
          expect(textProcess).toEqual(cloneInfos[i].process);
          await dashboardPageFirst.navigateToMenu("Campaigns");
          await dashboardPageFirst.page.waitForSelector(dashboardPageFirst.xpathTableLoad, { state: "hidden" });
        });

        if (cloneInfos[i].product_validate_detail) {
          const productValidateDetail = cloneInfos[i].product_validate_detail;
          await test.step("Mở màn hình campaign detail > verify thông tin campaign trong màn campaign detail", async () => {
            printbasePageSecond = new PrintBasePage(dashboardPageSecond.page, conf.suiteConf.domain);
            await printbasePageSecond.searchWithKeyword(productName);
            await printbasePageSecond.openCampaignDetail(productName);
            const campaignID = await printbasePageSecond.getCampaignID();
            expect(
              await printbasePageSecond.getCampaignInfo(
                authRequest,
                conf.suiteConf.domain,
                campaignID,
                productValidateDetail,
              ),
            ).toEqual(productValidateDetail);
          });
        }
      }
    });
  });

  const caseNameDriven = "CLONE_PRODUCT_HAS_IMAGE";
  const confDriven = loadData(__dirname, caseNameDriven);
  confDriven.caseConf.data.forEach(testCase => {
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, authRequest, snapshotFixture, context }) => {
      // Skip all case on prodtest env
      if (process.env.ENV === "prodtest") {
        return;
      }
      test.setTimeout(conf.suiteConf.timeout);
      const dataTest = testCase.data_test;
      let campainId;
      printbasePageSecond = new PrintBasePage(dashboardPageSecond.page, conf.suiteConf.domain);
      for (let i = 0; i < dataTest.length; i++) {
        const productName = dataTest[i].campaign.pricing_info.title;

        await test.step("Login vào first shop > đi đến màn hình All campaigns và search campaign > Clone products  sang  shop", async () => {
          await printbasePageFirst.searchWithKeyword(productName);
          const isProductVisible = await printbasePageFirst.page
            .locator(`(//span[normalize-space()="${productName}"])[1]`)
            .isVisible({ timeout: 10000 });
          if (!isProductVisible || testCase.case_id === "SB_PRB_PPB_197") {
            if (testCase.case_id === "SB_PRB_PPB_197") {
              await printbasePageFirst.deleteAllCampaign(conf.suiteConf.password);
            }
            await printbasePageFirst.navigateToMenu("Catalog");
            campainId = await printbasePageFirst.launchCamp(dataTest[i].campaign);
            const isAvailable = await printbasePageFirst.checkCampaignStatus(campainId, ["available"], 30 * 60 * 1000);
            expect(isAvailable).toBeTruthy();
            await printbasePageFirst.page.reload();
          }
          if (testCase.case_id === "SB_PRB_PPB_197") {
            await test.step("Delete custom option > Click btn Save changes > Click btn Continue > Verify edit campaign thành công", async () => {
              await printbasePageFirst.openEditorCampaign(productName);
              await printbasePageFirst.waitForElementVisibleThenInvisible(printbasePageFirst.xpathIconLoading);
              await printbasePageFirst.clickBtnExpand();
              await printbasePageFirst.deleteCustomOptionInList(dataTest[i].campaign.custom_options[0].label);
              await printbasePageFirst.clickOnBtnWithLabel("Save change");
              newCampaignId = printbasePageFirst.getCampaignIdInPricingPage();
              await printbasePageFirst.waitForElementVisibleThenInvisible(printbasePageFirst.xpathIconLoading);
              await printbasePageFirst.clickOnBtnWithLabel("Continue");
              await printbasePageFirst.page.waitForTimeout(3000);
              await printbasePageFirst.navigateToMenu("Campaigns");
              const isAvailable = await printbasePageFirst.checkCampaignStatus(
                newCampaignId,
                ["available"],
                30 * 60 * 1000,
              );
              expect(isAvailable).toBeTruthy();
            });
          }
          await printbasePageFirst.searchWithKeyword(productName);
          await productPageFirst.cloneProductToStore(dataTest[i].clone_info);
          await productPageFirst.checkMsgAfterCreated({
            message: `${conf.suiteConf.message} ${[dataTest[i].clone_info.second_shop]}`,
          });
        });
        await test.step("Login vào second shop sau đó verify hiển thị status và process ở progress bar", async () => {
          productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.domain);
          await dashboardPageSecond.navigateToMenu("Campaigns");
          let textStatus;
          let textProcess;
          let j = 0;
          do {
            await productPageSecond.clickProgressBar();
            textStatus = await productPageSecond.getStatus();
            textProcess = await productPageSecond.getProcess();
            await productPageSecond.page.waitForTimeout(1000);
            await productPageSecond.page.click(productPageSecond.xpathTitleCampaign);
            j++;
          } while (textStatus != conf.suiteConf.status && j < 11);
          //Kiểm tra trạng thái quá trình clone
          expect(textProcess).toEqual(dataTest[i].process);
        });

        if (testCase.case_id === "SB_PRB_PPB_200" || testCase.case_id === "SB_PRB_PPB_197") {
          if (testCase.case_id === "SB_PRB_PPB_200") {
            await test.step("Delete custom option > Click btn Save changes > Click btn Continue > Verify edit campaign thành công", async () => {
              await printbasePageSecond.openEditorCampaign(productName);
              await printbasePageSecond.waitForElementVisibleThenInvisible(printbasePageSecond.xpathIconLoading);
              await printbasePageSecond.clickBtnExpand();
              await printbasePageSecond.deleteCustomOptionInList(dataTest[i].campaign.custom_options[0].label);
              await printbasePageSecond.clickOnBtnWithLabel("Save change");
              newCampaignId = printbasePageSecond.getCampaignIdInPricingPage();
              await printbasePageSecond.waitForElementVisibleThenInvisible(printbasePageSecond.xpathIconLoading);
              await printbasePageSecond.clickOnBtnWithLabel("Continue");
              await printbasePageSecond.page.waitForTimeout(3000);
              await printbasePageSecond.navigateToMenu("Campaigns");
              const isAvailable = await printbasePageSecond.checkCampaignStatus(
                newCampaignId,
                ["available"],
                30 * 60 * 1000,
              );
              expect(isAvailable).toBeTruthy();
            });
          }

          await test.step("View campaign ngoài SF > Order campaign > Check profit", async () => {
            await printbasePageSecond.searchWithKeyword(productName);
            await printbasePageSecond.openCampaignDetail(productName);
            const [SFPage] = await Promise.all([context.waitForEvent("page"), printbasePageSecond.openCampaignSF()]);
            const campaignSF = new SFProduct(SFPage, conf.suiteConf.domain);
            await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
            await campaignSF.waitForImagesMockupLoaded();
            await campaignSF.selectVariant(testCase.variant_name);
            checkoutSF = new SFCheckout(SFPage, conf.suiteConf.domain);
            await checkoutSF.checkoutProductWithUsellNoVerify(conf.suiteConf.customer_info, conf.suiteConf.card_info);
            orderId = await checkoutSF.getOrderIdBySDK();
            await printbasePageSecond.goToOrderDetails(orderId, "printbase");
            //verify profit
            await orderPage.waitForProfitCalculated();
            await orderPage.clickShowCalculation();
            const actProfit = Number(removeCurrencySymbol(await orderPage.getProfit())).toFixed(2);
            expect(actProfit).toEqual(conf.caseConf.profit);
          });
        } else {
          await test.step("Mở màn hình campaign detail > verify thông tin campaign trong màn campaign detail", async () => {
            printbasePageSecond = new PrintBasePage(dashboardPageSecond.page, conf.suiteConf.domain);
            await printbasePageSecond.searchWithKeyword(productName);
            await printbasePageSecond.openCampaignDetail(productName);
            await printbasePageSecond.page.waitForLoadState("networkidle");
            const campaignID = await printbasePageSecond.getCampaignID();
            expect(
              await printbasePageSecond.getCampaignInfo(
                authRequest,
                conf.suiteConf.domain,
                campaignID,
                dataTest[i].campaign_detail,
              ),
            ).toEqual(dataTest[i].campaign_detail);
          });

          await test.step("Input các custom option sau đó verify ảnh preview ngoài SF", async () => {
            const productId = await productPageSecond.getProductId(authRequest, productName, conf.suiteConf.domain);
            const productHandle = await productPageSecond.getProductHandlebyApi(
              authRequest,
              conf.suiteConf.domain,
              productId,
            );
            expect(
              await productPageSecond.getProductInfoStoreFrontByApi(
                authRequest,
                conf.suiteConf.domain,
                productHandle,
                dataTest[i].validate_product_sf,
              ),
            ).toEqual(dataTest[i].validate_product_sf);

            const [newPage] = await Promise.all([
              dashboardPageSecond.page.context().waitForEvent("page"),
              await productPageSecond.clickViewProductOnSF(),
            ]);
            await newPage.waitForLoadState("networkidle");
            const pageStoreFront = new SFProduct(newPage, conf.suiteConf.domain);
            const customOptionSF = dataTest[i].custom_options_sf;
            for (let k = 0; k < customOptionSF.length; k++) {
              await pageStoreFront.inputCustomOptionSF(customOptionSF[k]);
              await pageStoreFront.page.waitForTimeout(1000);
              await pageStoreFront.clickOnBtnPreviewSF();
              await pageStoreFront.waitForElementVisibleThenInvisible(pageStoreFront.xpathImageLoad);
              await pageStoreFront.page.waitForTimeout(1000);
              await snapshotFixture.verify({
                page: pageStoreFront.page,
                selector: pageStoreFront.xpathPopupLivePreview(),
                snapshotName: `${testCase.case_id}_${i}_${k}.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                  threshold: conf.suiteConf.threshold,
                  maxDiffPixels: conf.suiteConf.max_diff_pixels,
                },
              });
              await pageStoreFront.closePreview("Inside");
            }
            await pageStoreFront.page.close();
          });
        }
        await dashboardPageFirst.navigateToMenu("Campaigns");
      }
    });
  });
});
