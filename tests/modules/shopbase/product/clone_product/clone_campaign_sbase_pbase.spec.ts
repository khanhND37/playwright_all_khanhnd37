import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { loadData } from "@core/conf/conf";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { Apps } from "@pages/dashboard/apps";
import { Personalize } from "@pages/dashboard/personalize";

test.describe("Clone product from shopbase to shopbase", () => {
  let dashboardPageFirst: DashboardPage;
  let dashboardPageSecond: DashboardPage;
  let productPageFirst: ProductPage;
  let productPageSecond: ProductPage;
  let printbase: PrintBasePage;
  let appPage: Apps;
  let personalizePage: Personalize;
  test.beforeEach(async ({ conf, token, dashboard, page }) => {
    if (process.env.CI_ENV === "prodtest") {
      return;
    }
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
    await dashboardPageFirst.navigateToMenu("Products");
    productPageFirst = new ProductPage(dashboardPageFirst.page, domainFirst);
    printbase = new PrintBasePage(dashboardPageFirst.page, domainFirst);
    appPage = new Apps(dashboardPageFirst.page, domainFirst);
    personalizePage = new Personalize(dashboardPageFirst.page, conf.suiteConf.domain);
  });

  const testName = "CLONE_PRODUCT_SB_TO_PB";
  const testConf = loadData(__dirname, testName);
  testConf.caseConf.data.forEach(testCase => {
    test(` ${testCase.title} @${testCase.case_id}`, async ({ conf, authRequest }) => {
      if (process.env.CI_ENV === "prodtest") {
        return;
      }
      test.setTimeout(conf.suiteConf.timeout);
      const cloneInfos = testCase.clone_infos;
      for (let i = 0; i < cloneInfos.length; i++) {
        const productName = cloneInfos[i].product_name;
        await test.step("Clone chọn 'Override product' khi trùng handle các product sau: - 'Campaign override update'", async () => {
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
          await dashboardPageFirst.navigateToMenu("Products");
          await dashboardPageFirst.page.waitForSelector(productPageSecond.xpathTableLoad, { state: "hidden" });
        });
        if (cloneInfos[i].product_validate_detail) {
          const productInfo = cloneInfos[i].product_validate_detail;
          await test.step("Tại Shop đích vào màn product detail products được clone", async () => {
            const pBasePageSecond = new PrintBasePage(dashboardPageSecond.page, conf.suiteConf.domain);
            await pBasePageSecond.searchWithKeyword(productName);
            const productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.domain);
            await productPageSecond.chooseProduct(productName);
            const productId = await productPageSecond.getProductId(authRequest, productName, conf.suiteConf.domain);
            expect(
              await productPageSecond.getProductInfoDashboardByApi(
                authRequest,
                conf.suiteConf.domain,
                productId,
                productInfo,
              ),
            ).toEqual(productInfo);
          });
        }
      }
    });
  });
});
