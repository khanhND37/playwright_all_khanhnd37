import { loadData } from "@core/conf/conf";
import { ProductAPI } from "@pages/api/product";
import { expect, test } from "@core/fixtures";
import { SFHome } from "@sf_pages/homepage";
import { SFProduct } from "@sf_pages/product";
import { snapshotDir } from "@utils/theme";

test.describe("Live preview campaigns", () => {
  let productSF: SFProduct;
  let homePage: SFHome;
  let productAPI: ProductAPI;

  test.beforeEach(async ({ page, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    productSF = new SFProduct(page, conf.suiteConf.shop_domain);
    homePage = new SFHome(page, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    await productAPI.setPersonalizationPreview(conf.suiteConf.personalize, conf.suiteConf.shop_id);
  });

  test(`Check thông tin camp personalized ở Storefont @SB_PRB_LP_218`, async ({ page, conf }) => {
    await test.step(`View camp detail ngoài Storefont.
    Verify hiển thị các thông tin của camp: list variants, Sale price, Compare at price`, async () => {
      await homePage.searchThenViewProduct(conf.caseConf.campaign.name);
      await expect(page.locator(`//h1[normalize-space()='${conf.caseConf.campaign.name}']`)).toBeVisible();
      await expect(page.locator(`${conf.caseConf.xpath_variant_color_1}`)).toBeVisible();
      await expect(page.locator(`${conf.caseConf.xpath_variant_color_2}`)).toBeVisible();
      await expect(page.locator(`${conf.caseConf.xpath_variant_size_1}`)).toBeVisible();
      await expect(page.locator(`${conf.caseConf.xpath_variant_size_2}`)).toBeVisible();
      await expect(page.locator(`${conf.caseConf.price}`)).toBeVisible();
      await expect(page.locator(`${conf.caseConf.price_original}`)).toBeVisible();
    });
  });

  const conf = loadData(__dirname, "DATA_INPUT_CO_VALID");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async ({ page, snapshotFixture }) => {
      await test.step(`${caseData.step}`, async () => {
        await homePage.searchThenViewProduct(caseData.campaign.name);
        await expect(page.locator(`//h1[normalize-space()='${caseData.campaign.name}']`)).toBeVisible();
        if (caseData.message_error) {
          for (let i = 0; i < caseData.custom_option_info.length; i++) {
            await productSF.inputCustomOptionSF(caseData.custom_option_info[i]);
            await expect(page.locator(`//button[normalize-space()='Preview your design']`)).toBeVisible();
            await productSF.clickOnBtnPreviewSF();
            await productSF.closePreview(caseData.themes_setting);
            await expect(page.locator(`(//div[normalize-space()='${caseData.message_error[i]}'])[1]`)).toBeVisible();
          }
        }
        if (caseData.data_success) {
          for (let i = 0; i < caseData.data_success.custom_option_info.length; i++) {
            await productSF.inputCustomOptionSF(caseData.data_success.custom_option_info[i]);

            await expect(page.locator(productSF.xpathPopupLivePreview())).toBeVisible();
            await productSF.clickOnBtnPreviewSF();

            await productSF.waitForElementVisibleThenInvisible(productSF.xpathImageLoad);
            await productSF.page.waitForTimeout(1000);

            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathPopupLivePreview(),
              snapshotName: `${caseData.case_name}_${i}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
            });
            await productSF.closePreview(caseData.themes_setting);
          }
        }
      });
    });
  }

  const confdata = loadData(__dirname, "DATA_VERIFY_PREVIEW");
  for (let i = 0; i < confdata.caseConf.data.length; i++) {
    const caseData = confdata.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async ({ page, snapshotFixture }) => {
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
              snapshotName: `Picture_${caseData.case_name}_${i}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
            });
          }
        }
        await expect(page.locator(productSF.xpathPopupLivePreview())).toBeVisible();
        await productSF.clickOnBtnPreviewSF();
        await productSF.waitForElementVisibleThenInvisible(productSF.xpathImageLoad);
        await productSF.page.waitForTimeout(1000);

        await snapshotFixture.verify({
          page: productSF.page,
          selector: productSF.xpathPopupLivePreview(),
          snapshotName: `${caseData.case_name}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
        });
      });
    });
  }

  const confDataNotPreview = loadData(__dirname, "DATA_NOT_PREVIEW");
  for (let i = 0; i < confDataNotPreview.caseConf.data.length; i++) {
    const caseData = confDataNotPreview.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async ({ page }) => {
      await test.step(`${caseData.step}`, async () => {
        await homePage.searchThenViewProduct(caseData.campaign.name);
        for (let i = 0; i < caseData.custom_option_info.length; i++) {
          await productSF.inputCustomOptionSF(caseData.custom_option_info[i]);
        }
        await expect(page.locator(productSF.xpathPopupLivePreview())).not.toBeVisible();
      });
    });
  }

  test(`Check preview và instant  preview theo setting @SB_PRB_LP_267`, async ({ page, conf, snapshotFixture }) => {
    await test.step(`Setting shop disable preview for personalized campaigns.
    Check không hiển thị nút Preview ngoài SF`, async () => {
      for (let i = 0; i < conf.caseConf.personalize.length; i++) {
        const setting = conf.caseConf.personalize[i];
        await productAPI.setPersonalizationPreview(setting, conf.suiteConf.shop_id);
        await homePage.searchThenViewProduct(conf.caseConf.campaign.name);
        if (setting.enable === false) {
          await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
          await expect(page.locator(productSF.xpathPopupLivePreview())).not.toBeVisible();
        } else {
          if (setting.mode === "button") {
            await page.reload();
            await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
            await expect(page.locator(productSF.xpathPopupLivePreview())).toBeVisible();
          } else if (setting.mode === "instant_button") {
            await page.reload();
            await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
            await expect(page.locator(productSF.xpathPopupLivePreview())).toBeVisible();
          } else if (setting.mode === "instant") {
            await page.reload();
            await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
            await expect(page.locator(productSF.xpathPopupLivePreview())).not.toBeVisible();
            // eslint-disable-next-line playwright/no-wait-for-timeout
            await productSF.waitForElementVisibleThenInvisible(productSF.xpathImageLoad);
            await productSF.page.waitForTimeout(1000);
            await snapshotFixture.verify({
              page: productSF.page,
              selector: productSF.xpathPopupLivePreview(),
              snapshotName: `SB_PRB_LP_267_${[i]}.png`,
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
});
