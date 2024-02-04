import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { loadData } from "@core/conf/conf";
import { snapshotDir } from "@utils/theme";
import { PrintBasePage } from "@pages/dashboard/printbase";
import type { Shop } from "@types";
import { Personalize } from "@pages/dashboard/personalize";
import { Campaign } from "@sf_pages/campaign";
import { Apps } from "@pages/dashboard/apps";

const caseName = "CLONE_PRODUCT_SB_TO_SB";
const conf = loadData(__dirname, caseName);
test.describe("Clone product from shopbase to shopbase", () => {
  // let domainSBase: string;
  // let domainPBase: string;
  let dashboardSPageFirst: DashboardPage;
  let dashboardPageSecond: DashboardPage;
  let productPageFirst: ProductPage;
  let productPageSecond: ProductPage;
  let pBasePageFirst: PrintBasePage;
  let domainSFirst: string;
  let shopToken: Shop;
  let personalizePage: Personalize;
  let campaignSF: Campaign;
  let printbase: PrintBasePage;
  let appPage: Apps;
  test.beforeEach(async ({ conf, dashboard, page, token }, testInfo) => {
    if (process.env.CI_ENV === "prodtest") {
      return;
    }
    domainSFirst = conf.suiteConf.info_sbase_des.domain;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPageSecond = new DashboardPage(dashboard, conf.suiteConf.domain);
    dashboardSPageFirst = new DashboardPage(page, domainSFirst);
    printbase = new PrintBasePage(dashboardSPageFirst.page, domainSFirst);
    appPage = new Apps(dashboardSPageFirst.page, domainSFirst);
    shopToken = await token.getWithCredentials({
      domain: domainSFirst,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    test.setTimeout(conf.suiteConf.timeout);
  });

  test("Verify product khi Clone product theo search keyword @SB_PRO_CP_410", async ({ conf, token, page }) => {
    if (process.env.CI_ENV === "prodtest") {
      return;
    }
    test.setTimeout(conf.suiteConf.timeout);
    await test.step("Login vào first shop > đi đến màn hình All products và search product > Clone products SBase to SBase", async () => {
      productPageFirst = new ProductPage(dashboardSPageFirst.page, domainSFirst);
      const cloneInfo = conf.caseConf.clone_info_shopbase;
      const productInfo = conf.caseConf.info_product_shopbase;
      const accessToken = shopToken.access_token;
      await dashboardSPageFirst.loginWithToken(accessToken);
      await dashboardSPageFirst.navigateToMenu("Products");
      await productPageFirst.searchProduct(productInfo.title);
      const numberProduct = await productPageFirst.getTotalProductAfterSearch(accessToken, domainSFirst, productInfo);
      await productPageFirst.cloneProductToStore(cloneInfo);
      await productPageFirst.checkMsgAfterCreated({
        message: conf.caseConf.message_shopbase.replace("number", numberProduct),
      });
      const dashboardPageSecond = new DashboardPage(page, conf.suiteConf.info_sbase_source.domain);
      const productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.info_sbase_source.domain);
      const shopTokenSecond = await token.getWithCredentials({
        domain: conf.suiteConf.info_sbase_source.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessTokenSecond = shopTokenSecond.access_token;
      await dashboardPageSecond.loginWithToken(accessTokenSecond);
      await dashboardPageSecond.navigateToMenu("Products");
      let textStatus;
      let textProcess;
      let j = 0;
      do {
        await productPageSecond.clickProgressBar();
        textStatus = await productPageSecond.getStatus();
        textProcess = await productPageSecond.getProcess();
        await productPageSecond.page.waitForTimeout(1000);
        await productPageSecond.page.click(productPageSecond.xpathTitleProduct);
        j++;
      } while (textStatus != conf.suiteConf.status && j < 11);
      expect(textProcess).toEqual(`Imported 0/${numberProduct} products. Skipped ${numberProduct} products.`);
    });
    await test.step("Login vào first shop > đi đến màn hình All products và search product > Clone products PBase to PBase", async () => {
      const cloneInfo = conf.caseConf.clone_info_pbase;
      const productInfo = conf.caseConf.info_product_pbase;
      const shopToken = await token.getWithCredentials({
        domain: conf.suiteConf.info_pbase_des.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessToken = shopToken.access_token;
      const dashboardPage = new DashboardPage(page, conf.suiteConf.info_pbase_des.domain);
      await dashboardPage.loginWithToken(accessToken);
      await dashboardPage.navigateToMenu("Campaigns");
      const productPage = new ProductPage(dashboardPage.page, conf.suiteConf.info_pbase_des.domain);
      const printPage = new PrintBasePage(dashboardPage.page, conf.suiteConf.info_pbase_des.domain);
      await printPage.searchWithKeyword(productInfo.title);
      const numberProduct = await printPage.getTotalProductAfterSearch(
        accessToken,
        conf.suiteConf.info_pbase_des.domain,
        productInfo,
      );
      await productPage.cloneProductToStore(cloneInfo);
      await productPage.checkMsgAfterCreated({
        message: conf.caseConf.message_pbase.replace("number", numberProduct),
      });
      const dashboardPageSecond = new DashboardPage(page, conf.suiteConf.info_pbase_source.domain);
      const shopTokenSecond = await token.getWithCredentials({
        domain: conf.suiteConf.info_pbase_source.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessTokenSecond = shopTokenSecond.access_token;
      await dashboardPageSecond.loginWithToken(accessTokenSecond);
      await dashboardPageSecond.navigateToMenu("Campaigns");

      let textStatus;
      let textProcess;
      let j = 0;
      do {
        await productPage.clickProgressBar();
        textStatus = await productPage.getStatus();
        textProcess = await productPage.getProcess();
        await productPage.page.waitForTimeout(1000);
        await productPage.page.click(productPage.xpathTitleCampaign);
        j++;
      } while (textStatus != conf.suiteConf.status && j < 11);
      expect(textProcess).toEqual(`Imported 0/${numberProduct} products. Skipped ${numberProduct} products.`);
    });
  });

  conf.caseConf.data.forEach(testCase => {
    const cloneInfos = testCase.clone_infos;
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, authRequest, snapshotFixture, context }) => {
      if (process.env.CI_ENV === "prodtest") {
        return;
      }
      for (let i = 0; i < cloneInfos.length; i++) {
        const productName = cloneInfos[i].product_name;

        await test.step("Tại màn list product store gốc:", async () => {
          const accessToken = shopToken.access_token;
          await dashboardSPageFirst.loginWithToken(accessToken);
          await dashboardSPageFirst.navigateToMenu("Products");
          productPageFirst = new ProductPage(dashboardSPageFirst.page, domainSFirst);
          personalizePage = new Personalize(dashboardSPageFirst.page, domainSFirst);

          await productPageFirst.searchProduct(productName);
          const isProductVisible = await productPageFirst.page
            .locator(`(//*[normalize-space()="${productName}"])[1]`)
            .isVisible({ timeout: 10000 });
          if (!isProductVisible) {
            if (testCase.clone_campaign) {
              await printbase.navigateToMenu("Apps");
              await appPage.openApp("Print Hub");
              await printbase.navigateToMenu("Catalog");
              const campainId = await printbase.launchCamp(cloneInfos[i].campaign);
              const isAvailable = await printbase.checkCampaignStatus(
                campainId,
                ["available", "available with basic images"],
                30 * 60 * 1000,
              );
              expect(isAvailable).toBeTruthy();
            } else {
              await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
                cloneInfos[i].product_all_info,
                cloneInfos[i].image_preview,
                "Create Preview image",
              );
              await productPageFirst.addLayers(cloneInfos[i].layers);
              await personalizePage.clickBtnExpand();
              await personalizePage.clickOnBtnWithLabel("Customize layer");
              await personalizePage.addListCustomOptionOnEditor(cloneInfos[i].custom_options);
              await productPageFirst.clickOnBtnWithLabel("Next, create Print file");
              await productPageFirst.uploadImagePreviewOrPrintfile(cloneInfos[i].image_print_file);
              await productPageFirst.page.waitForSelector(productPageFirst.xpathImageUploadEditor, {
                state: "visible",
              });
              await personalizePage.clickOnBtnWithLabel("Save");
              await personalizePage.clickOnBtnWithLabel("Cancel");
              await productPageFirst.goto("admin/products/");
              await productPageFirst.searchProduct(productName);
            }
          }
          await productPageFirst.cloneProductToStore(cloneInfos[i].clone_info);

          //check hiển thị message thông báo clone thành công ở shop gốc
          await productPageFirst.checkMsgAfterCreated({
            message: `${conf.suiteConf.message} ${cloneInfos[i].clone_info.second_shop}`,
          });
          productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.domain);
          await productPageSecond.navigateToMenu("Products");
          let textStatus;
          let textProcess;
          let j = 0;
          do {
            await productPageSecond.clickProgressBar();
            textStatus = await productPageSecond.getStatus();
            textProcess = await productPageSecond.getProcess();
            await productPageSecond.page.waitForTimeout(1000);
            await productPageSecond.page.click(productPageFirst.xpathTitleProduct);
            j++;
          } while (textStatus != conf.suiteConf.status && j < 11);
          //Kiểm tra trạng thái quá trình clone
          expect(textProcess).toEqual(cloneInfos[i].process);
          await dashboardSPageFirst.navigateToMenu("Products");
          await dashboardSPageFirst.page.waitForSelector(productPageFirst.xpathTableLoad, { state: "hidden" });
        });

        if (cloneInfos[i].product_validate_detail) {
          const productValidateDetail = cloneInfos[i].product_validate_detail;
          await test.step("Tại Shop đích vào màn product detail products được clone", async () => {
            await productPageSecond.searchProduct(productName);
            await productPageSecond.chooseProduct(productName);
            const productId = await productPageSecond.getProductId(authRequest, productName, conf.suiteConf.domain);
            expect(
              await productPageSecond.getProductInfoDashboardByApi(
                authRequest,
                conf.suiteConf.domain,
                productId,
                productValidateDetail,
              ),
            ).toEqual(productValidateDetail);

            if (testCase.is_image_preview) {
              await productPageSecond.page.locator(productPageSecond.xpathImagePreview).scrollIntoViewIfNeeded();
              await productPageSecond.page.waitForTimeout(1000);
              await snapshotFixture.verify({
                page: productPageSecond.page,
                selector: productPageSecond.xpathImagePreview,
                snapshotName: `${testCase.case_id}_preview.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                  threshold: conf.suiteConf.param_threshold,
                  maxDiffPixels: conf.suiteConf.max_diff_pixels,
                },
              });
              await snapshotFixture.verify({
                page: productPageSecond.page,
                selector: productPageSecond.xpathImagePrint,
                snapshotName: `${testCase.case_id}_print.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                  threshold: conf.suiteConf.param_threshold,
                  maxDiffPixels: conf.suiteConf.max_diff_pixels,
                },
              });
            }
          });
        }

        if (cloneInfos[i].product_validate_sf) {
          const productValidateSF = cloneInfos[i].product_validate_sf;
          await test.step("Tại Shop đích view products được clone ở StoreFront", async () => {
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
                productValidateSF,
              ),
            ).toEqual(productValidateSF);
          });
          if (cloneInfos[i].custom_option_data_SF) {
            const customOptionSF = cloneInfos[i].custom_option_data_SF;
            await productPageSecond.page.reload();
            await productPageSecond.page.waitForLoadState("domcontentloaded");
            const [SFPage] = await Promise.all([
              context.waitForEvent("page"),
              productPageSecond.clickViewProductOnSF(),
            ]);
            campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
            await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
            await campaignSF.limitTimeWaitAttributeChange(campaignSF.xpathImageActive);
            await campaignSF.inputCustomAllOptionSF(customOptionSF);
            await campaignSF.clickOnBtnPreviewSF();
            await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
            await campaignSF.page.waitForTimeout(2000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: campaignSF.xpathPopupLivePreview(),
              snapshotName: `${testCase.case_id}-preview.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
            });
          }
        }
      }
    });
  });

  test("[Clone product] [ Shopbase sang Shopbase] Clone product giữ nguyên thứ tự variant @SB_PRO_CP_398", async ({
    conf,
    authRequest,
  }) => {
    if (process.env.CI_ENV === "prodtest") {
      return;
    }
    const variantsInfo = conf.caseConf.variants;
    const cloneInfo = conf.caseConf.clone_info;
    const productName = conf.caseConf.product_name;
    await test.step("Tại màn list product store gốc:", async () => {
      const accessToken = shopToken.access_token;
      await dashboardSPageFirst.loginWithToken(accessToken);
      await dashboardSPageFirst.navigateToMenu("Products");
      productPageFirst = new ProductPage(dashboardSPageFirst.page, domainSFirst);
      await productPageFirst.searchProduct(productName);
      const xpathProductName = await productPageFirst.getXpathProductName(productName);
      const isProductVisible = await productPageFirst.page
        .locator(`(${xpathProductName})[1]`)
        .isVisible({ timeout: 10000 });
      if (!isProductVisible) {
        await personalizePage.addProductAndUploadMockupPreviewOrPrintFile(
          conf.caseConf.product_all_info,
          conf.caseConf.image_preview,
          "Create Preview image",
        );
        await productPageFirst.addLayers(conf.caseConf.layers);
        await personalizePage.clickBtnExpand();
        await personalizePage.clickOnBtnWithLabel("Customize layer");
        await personalizePage.addListCustomOptionOnEditor(conf.caseConf.custom_options);
        await productPageFirst.clickOnBtnWithLabel("Next, create Print file");
        await productPageFirst.uploadImagePreviewOrPrintfile(conf.caseConf.image_print_file);
        await productPageFirst.page.waitForSelector(productPageFirst.xpathImageUploadEditor, {
          state: "visible",
        });
        await personalizePage.clickOnBtnWithLabel("Save");
        await personalizePage.clickOnBtnWithLabel("Cancel");
        await productPageFirst.goto("admin/products/");
        await productPageFirst.searchProduct(productName);
      }
      await productPageFirst.cloneProductToStore(cloneInfo);
      //check hiển thị message thông báo clone thành công ở shop gốc
      await productPageFirst.checkMsgAfterCreated({
        message: `${conf.suiteConf.message} ${cloneInfo["second_shop"]}`,
      });
      productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.domain);
      await productPageSecond.navigateToMenu("Products");
      let textStatus;
      let textProcess;
      let j = 0;
      do {
        await productPageSecond.clickProgressBar();
        textStatus = await productPageSecond.getStatus();
        textProcess = await productPageSecond.getProcess();
        await productPageSecond.page.waitForTimeout(1000);
        await productPageSecond.page.click(productPageSecond.xpathTitleProduct);
        j++;
      } while (textStatus != conf.suiteConf.status && j < 11);
      //Kiểm tra trạng thái quá trình clone
      expect(textProcess).toEqual(conf.caseConf.process);
    });

    await test.step("Tại Shop đích vào màn product detail products được clone", async () => {
      await productPageSecond.searchProduct(productName);
      await productPageSecond.chooseProduct(productName);
      const productID = await productPageSecond.getProductId(authRequest, productName, conf.suiteConf.domain);
      //check variant hiện thị đúng giá trị và đúng thứ tự
      const variantsResult = await productPageSecond.getVariantByAPI(
        authRequest,
        conf.suiteConf.domain,
        productID,
        conf.caseConf.variants[0],
      );
      for (let i = 0; i < variantsResult.length; i++) {
        expect(variantsResult[i]).toEqual(variantsInfo[i]);
      }
    });
  });

  const caseNamePbase = "CLONE_PRODUCT_PB_TO_SB";
  const confData = loadData(__dirname, caseNamePbase);
  confData.caseConf.data.forEach(testCase => {
    const cloneInfos = testCase.clone_infos;
    test(`${testCase.title} @${testCase.case_id}`, async ({ conf, authRequest, page, token }) => {
      if (process.env.CI_ENV === "prodtest") {
        return;
      }
      for (let i = 0; i < cloneInfos.length; i++) {
        const productName = cloneInfos[i].product_name;
        await test.step("Tại màn list product store gốc:", async () => {
          dashboardSPageFirst = new DashboardPage(page, conf.suiteConf.info_pbase_des.domain);
          const shopToken = await token.getWithCredentials({
            domain: conf.suiteConf.info_pbase_des.domain,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          });
          const accessToken = shopToken.access_token;
          await dashboardSPageFirst.loginWithToken(accessToken);
          await dashboardSPageFirst.navigateToMenu("Campaigns");
          pBasePageFirst = new PrintBasePage(dashboardSPageFirst.page, conf.suiteConf.domain);
          productPageFirst = new ProductPage(dashboardSPageFirst.page, conf.suiteConf.info_pbase_des.domain);

          await pBasePageFirst.searchWithKeyword(productName);
          const isProductVisible = await pBasePageFirst.page
            .locator(`(//*[normalize-space()="${productName}"])[1]`)
            .isVisible({ timeout: 10000 });
          if (!isProductVisible) {
            await pBasePageFirst.navigateToMenu("Catalog");
            const campainId = await pBasePageFirst.launchCamp(cloneInfos[i].campaign);
            const isAvailable = await pBasePageFirst.checkCampaignStatus(
              campainId,
              ["available", "available with basic images"],
              30 * 60 * 1000,
            );
            expect(isAvailable).toBeTruthy();
            await pBasePageFirst.page.reload();
            await pBasePageFirst.searchWithKeyword(productName);
          }
          await productPageFirst.cloneProductToStore(cloneInfos[i].clone_info);
          await productPageFirst.checkMsgAfterCreated({
            message: `${conf.suiteConf.message} ${cloneInfos[i].clone_info.second_shop}`,
          });

          await test.step("Login vào second shop sau đó verify hiển thị status và process ở progress bar", async () => {
            productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.domain);
            await dashboardPageSecond.navigateToMenu("Products");
            let textStatus;
            let textProcess;
            let j = 0;
            do {
              await productPageSecond.clickProgressBar();
              textStatus = await productPageSecond.getStatus();
              textProcess = await productPageSecond.getProcess();
              await productPageSecond.page.waitForTimeout(1000);
              await productPageSecond.page.click(productPageSecond.xpathTitleProduct);
              j++;
            } while (textStatus != conf.suiteConf.status && j < 11);
            //Kiểm tra trạng thái quá trình clone
            expect(textProcess).toEqual(cloneInfos[i].process);
            await dashboardSPageFirst.navigateToMenu("Campaigns");
            await dashboardSPageFirst.page.waitForSelector(dashboardPageSecond.xpathTableLoad, { state: "hidden" });
          });
        });

        if (cloneInfos[i].product_validate_detail) {
          const productValidateDetail = cloneInfos[i].product_validate_detail;
          await test.step("Mở màn hình campaign detail > verify thông tin campaign trong màn campaign detail", async () => {
            await productPageSecond.searchProduct(productName);
            await productPageSecond.chooseProduct(productName);
            await productPageSecond.page.waitForTimeout(10000);
            const productId = await productPageSecond.getProductId(authRequest, productName, conf.suiteConf.domain);
            expect(
              await productPageSecond.getProductInfoDashboardByApi(
                authRequest,
                conf.suiteConf.domain,
                productId,
                productValidateDetail,
              ),
            ).toEqual(productValidateDetail);
          });
        }
      }
    });
  });
});
