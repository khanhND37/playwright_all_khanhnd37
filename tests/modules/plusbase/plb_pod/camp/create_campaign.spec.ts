import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { SFProduct } from "@pages/storefront/product";
import { SFHome } from "@pages/storefront/homepage";
import { snapshotDir } from "@core/utils/theme";
import { SettingShipping } from "@pages/dashboard/setting_shipping";

test.describe("Create campaign success", () => {
  let printbasePage: PrintBasePage;
  let dashboardPage: DashboardPage;
  let productPage: SFProduct;
  let homePage: SFHome;
  let shopDomain: string;
  let campaignHandle: string;
  let campaignName: string;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    shopDomain = conf.suiteConf.domain;
    campaignHandle = conf.caseConf?.campaign_handle;
    campaignName = conf.caseConf?.pricing_info?.title;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    test.setTimeout(conf.suiteConf.time_out);
    await dashboardPage.page.goto(`https://${shopDomain}/admin/plusbase/campaigns/list`);
    // Xóa campaign cũ
    await printbasePage.deleteAllCampaign(conf.suiteConf.password, "PlusBase");
  });
  test("Verify tạo campaign không có Custom Option thành công trên shop PLB @SB_PLB_PODPL_CAM_1", async ({
    conf,
    page,
  }) => {
    homePage = new SFHome(page, shopDomain);
    await test.step(`Vào POD products > Catalog > Select base AOP Hoodie tại tab All Over Print 
      > Click Create new campaign`, async () => {
      await dashboardPage.navigateToSubMenu("POD products", "Catalog");
      // Select base product
      await printbasePage.addBaseProduct(conf.caseConf.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
    });

    await test.step(`Click btn Add text để add Text layer 1 > Click mũi tên back cạnh name Text layer 1 
      > Click btn Add image để add image layer`, async () => {
      for (let i = 0; i < conf.caseConf.layers.length; i++) {
        await printbasePage.addNewLayer(conf.caseConf.layers[i]);
      }
    });
    await test.step(`Click btn Continue > input title campaign`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
    });

    await test.step(`Click btn Launch`, async () => {
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(async () => {
        const status = await printbasePage.getDataTable(1, 1, 3);
        expect(status).toEqual("Available");
      }).toPass();
    });

    await test.step(`Chờ cho đến khi launching camp thành công > 
    Đi đến campaign ngoài SF > Verify data size, price của campaign`, async () => {
      productPage = await homePage.gotoProductDetailByHandle(campaignHandle, campaignName);
      for (let i = 0; i < conf.caseConf.variant.length; i++) {
        const variantCampaignSF = productPage.xpathVariantCampaign(conf.caseConf.variant[i]);
        await expect(variantCampaignSF).toBeVisible();
      }
      const salePriceCampaignSF = productPage.xpathSalePriceCampaign(conf.caseConf.price);
      await expect(salePriceCampaignSF).toBeVisible();
    });
  });

  test(`Verify tạo campaign có Custom Option thành công trên shop PLB @SB_PLB_PODPL_CAM_2`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Vào POD products > Catalog > Select base Sherpa Blanket tại tab Home living
    > Click btn Create new campaign`, async () => {
      await dashboardPage.navigateToSubMenu("POD products", "Catalog");
      // Select base product
      await printbasePage.addBaseProduct(conf.caseConf.product_info);
      await printbasePage.clickOnBtnWithLabel("Create new campaign");
    });

    await test.step(`Click btn Add text để add lần lượt các layer`, async () => {
      for (let i = 0; i < conf.caseConf.layers.length; i++) {
        await printbasePage.addNewLayer(conf.caseConf.layers[i]);
      }
    });

    await test.step(`Tại block bên phải, click btn dấu "<" > Click Customize layer để add Custom Option cho các layer`, async () => {
      await printbasePage.clickBtnExpand();
      await printbasePage.clickOnBtnWithLabel("Customize layer");
      for (let i = 0; i < conf.caseConf.custom_options.length; i++) {
        await printbasePage.addCustomOption(conf.caseConf.custom_options[i]);
      }
      for (let i = 0; i < conf.caseConf.custom_options.length; i++) {
        await expect(
          printbasePage.genLoc(printbasePage.xpathCustomOptionName(conf.caseConf.custom_options[i].label)),
        ).toBeVisible();
      }
    });

    await test.step(`Click btn Continue> input title campaign`, async () => {
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
    });
    await test.step(`Click btn Launch`, async () => {
      let isCheck = await printbasePage.isTextVisible("Campaign_personalize");
      let count = 0;
      while (!isCheck && count < 10) {
        await printbasePage.inputPricingInfo(conf.caseConf.pricing_info);
        isCheck = await printbasePage.isTextVisible("Campaign_personalize");
        count++;
      }
      await printbasePage.clickOnBtnWithLabel("Launch");
      await expect(async () => {
        const status = await printbasePage.getDataTable(1, 1, 3);
        expect(status).toEqual("Available");
      }).toPass();
    });

    await test.step(`Chờ cho đến khi launching camp thành công > Đi đến campaign ngoài SF 
    > Input CO > Verify preview image`, async () => {
      homePage = new SFHome(page, shopDomain);
      productPage = await homePage.gotoProductDetailByHandle(campaignHandle, campaignName);
      for (let i = 0; i < conf.caseConf.custom_option_info.length; i++) {
        await productPage.inputCustomOptionSF(conf.caseConf.custom_option_info[i]);
      }

      // Click button Preview your design then verify preview image
      await productPage.clickOnBtnPreviewSF();
      await snapshotFixture.verify({
        page: productPage.page,
        selector: productPage.xpathPreviewImageCampSF(),
        snapshotName: `${conf.caseName}-${process.env.ENV}.png`,
      });
    });
  });

  test(`Verify button Setup Shipping Fee trong trang Catalog POD Products @SB_PLB_PODPL_CAM_3`, async ({
    conf,
    dashboard,
  }) => {
    await test.step(`Vào POD products > Catalog > Tab All Over Print 
    > Click btn dropdown cạnh btn Add product > Select option Set up shipping fee`, async () => {
      const baseProductName = conf.caseConf.base_product_name;
      const shippingSetting = new SettingShipping(dashboard, shopDomain);

      await dashboardPage.navigateToSubMenu("POD products", "Catalog");
      await printbasePage.selectOptionDropDownOnCatalog(baseProductName, "Set up shipping fee");
      await expect(shippingSetting.xpathShippingZoneLabel()).toBeVisible();
    });
  });
});
