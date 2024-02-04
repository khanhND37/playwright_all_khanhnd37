import { loadData } from "@core/conf/conf";
import { test } from "@core/fixtures";
import { ProductAPI } from "@pages/api/product";
import { SFHome } from "@sf_pages/homepage";
import { SFProduct } from "@sf_pages/product";
import { snapshotDir } from "@utils/theme";

test.describe("Live preview campaigns on mobile", () => {
  let productSF: SFProduct;
  let homePage: SFHome;
  let productAPI: ProductAPI;

  test.beforeEach(async ({ pageMobile, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    productSF = new SFProduct(pageMobile, conf.suiteConf.shop_domain);
    homePage = new SFHome(pageMobile, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    await productAPI.setPersonalizationPreview(conf.suiteConf.setting_preview.personalize, conf.suiteConf.shop_id);
  });

  const confdata = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < confdata.caseConf.data.length; i++) {
    const caseData = confdata.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_id}`, async ({ conf, snapshotFixture }) => {
      await test.step(`${caseData.step}`, async () => {
        await homePage.searchThenViewProduct(caseData.campaign.name);
        for (let i = 0; i < caseData.custom_option_info.length; i++) {
          await productSF.inputCustomOptionSF(caseData.custom_option_info[i]);
        }
        if (caseData.picture) {
          for (let i = 0; i < caseData.picture.length; i++) {
            await productSF.page.waitForTimeout(1000);
            await snapshotFixture.verify({
              page: productSF.page,
              selector: `${caseData.picture[i]}`,
              snapshotName: `Picture_${i}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
            });
          }
        }
        await productSF.clickOnBtnPreviewSF();
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await productSF.waitForElementVisibleThenInvisible(productSF.xpathImageLoad);
        await productSF.page.waitForTimeout(1000);

        await snapshotFixture.verify({
          page: productSF.page,
          selector: productSF.xpathPopupLivePreview(),
          snapshotName: `${caseData.case_id}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
    });
  }
});
