import { test } from "@core/fixtures";
import { ProductAPI } from "@pages/api/product";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";

let dashboardPage: DashboardPage;
let printbasePage: PrintBasePage;
let productAPI: ProductAPI;

test.describe("Upload artwork", async () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    await productAPI.deleteAllArtwork();
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.deleteAllCampaign(conf.suiteConf.password);
  });

  test("Check khi khi upload artwork @SB_PRB_LB_AL_2", async ({ conf, snapshotFixture }) => {
    //Prodtest không upload được artwork
    if (process.env.CI_ENV === "prodtest") {
      return;
    }
    const images = conf.caseConf.images;
    for (const image of images) {
      await test.step(
        "-Đi đến màn Library>Artwork:/admin/pod/artwork" + "-Click button Upload artworks" + "-Chọn file upload",
        async () => {
          await dashboardPage.navigateToMenu("Library");
          for (let i = 0; i < image.paths.length; i++) {
            await dashboardPage.uploadFile("file", image.paths[i]);
            await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProcessUploadArtwork);
          }
          if (image.message_error) {
            await dashboardPage.page.waitForTimeout(1000);
            await snapshotFixture.verify({
              page: dashboardPage.page,
              selector: dashboardPage.xpathBlockError,
              snapshotName: `${image.image_name}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
            });
          } else {
            await dashboardPage.page.click(dashboardPage.xpathTabAll);
            await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
            await snapshotFixture.verify({
              page: dashboardPage.page,
              selector: dashboardPage.xpathBlockArtwork,
              snapshotName: `${image.image_name}_tab_all.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
            });

            await dashboardPage.page.click(dashboardPage.xpathTabStatic);
            await dashboardPage.page.waitForSelector(`${dashboardPage.xpathTabActive}${dashboardPage.xpathTabStatic}`);
            await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
            await snapshotFixture.verify({
              page: dashboardPage.page,
              selector: dashboardPage.xpathBlockArtwork,
              snapshotName: `${image.image_name}_tab_static.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
            });

            await dashboardPage.page.click(dashboardPage.xpathTabPsd);
            await dashboardPage.page.waitForSelector(`${dashboardPage.xpathTabActive}${dashboardPage.xpathTabPsd}`);
            await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathTableLoad);
            await snapshotFixture.verify({
              page: dashboardPage.page,
              selector: dashboardPage.xpathBlockArtwork,
              snapshotName: `${image.image_name}_tab_psd.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
            });
          }
        },
      );
    }
  });
});
