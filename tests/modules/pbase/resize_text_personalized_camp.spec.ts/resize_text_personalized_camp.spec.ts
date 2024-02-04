import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

test.describe("Resize text tự động cho personalized campaign", () => {
  let printbase: PrintBasePage;
  let productSF: SFProduct;
  test.beforeEach(async ({ page, conf }) => {
    printbase = new PrintBasePage(page, conf.suiteConf.shop_domain);
    productSF = new SFProduct(page, conf.suiteConf.shop_domain);
  });

  test("[Printbase] Check Preview campaign không có setting resize text @TC_PB_PRB_RTPC_1", async ({ page, conf }) => {
    const campaignName = conf.caseConf.campaign.name;
    const homePage = new SFHome(page, conf.suiteConf.domain);

    await test.step(`Đi đến store ngoài SF > search and select campaign`, async () => {
      await homePage.searchThenViewProduct(campaignName);
      await expect(page.locator(`//h1[normalize-space()='${campaignName}']`)).toBeVisible();
    });
    await test.step(`Input CO "Test text layer" > click Preview your design > verify ảnh preview`, async () => {
      await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await productSF.clickOnBtnPreviewSF();
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_1.png`, {
        threshold: 0.1,
      });
    });
  });

  test("	[Printbase] Check Preview resize text campaign có CO type Text area @TC_PB_PRB_RTPC_8", async ({
    dashboard,
    conf,
    authRequest,
    page,
  }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.shop_domain);
    const layerList = conf.caseConf.layer;
    const category = conf.caseConf.category;
    const productName = conf.caseConf.product;

    await test.step(`Lên camp với base Unisex T-shirt> input CO Text area có setting resize text`, async () => {
      await dashboardPage.navigateToMenu("Catalog");
      await printbase.addProductFromCatalog(category, productName);
      for (let i = 0; i < layerList.length; i++) {
        await printbase.addNewLayer(layerList[i]);
      }

      await printbase.clickBtnAddCO();
      await printbase.addCustomOption(conf.caseConf.custom_option);
      await printbase.createLayerWithSettingResizeText();
      await expect(page.locator("//span[normalize-space()='Text']")).toBeVisible();
    });

    await test.step(`Click button Continue > input data màn pricing > click btn Launch`, async () => {
      await printbase.clickOnBtnWithLabel("Continue");
      await printbase.inputTextBoxWithLabel("Title", conf.caseConf.campaign_info.name);
      await printbase.clickOnBtnWithLabel("Launch");
      expect(
        (
          await dashboard
            .locator(`//div[@class='product-page col-xs-12']//h2[contains(text(), 'Campaigns')]`)
            .textContent()
        ).trim(),
      ).toEqual("Campaigns");
    });

    await test.step(`Open camp ngoài SF > input CO > verify ảnh preview`, async () => {
      const isVisible = await printbase.getStatusOfFirstCampaign(authRequest, conf.suiteConf.domain);
      if (isVisible) {
        await printbase.openCampaignSF();
      }
      await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await productSF.clickOnBtnPreviewSF();
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_8.png`, {
        threshold: 0.1,
      });
    });
  });

  test("[Printbase] Check Preview campaign có CO type Text field,Radio,Droplist TC_PB_PRB_RTPC_7", async ({
    page,
    conf,
  }) => {
    const campaignTextField = conf.caseConf.campaign.campaignCOTextField;
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const campaignRadio = conf.caseConf.campaign.campaignCORadio;
    const campaignDroplist = conf.caseConf.campaignCODroplist;

    await test.step(`Đi đến store ngoài SF > search and select campaign`, async () => {
      await homePage.searchThenViewProduct(campaignTextField);
      await expect(page.locator(`//h1[normalize-space()='${campaignTextField}']`)).toBeVisible();
    });
    await test.step(`Input text có độ dài > layer box: "Test text layer" > click btn Preview your design`, async () => {
      await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await productSF.clickOnBtnPreviewSF();
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_7.1.png`, {
        threshold: 0.1,
      });
    });
    await test.step(`Tiếp tục search and select campaign`, async () => {
      await homePage.searchThenViewProduct(campaignRadio);
      await expect(page.locator(`//h1[normalize-space()='${campaignRadio}']`)).toBeVisible();
    });
    await test.step(`Input text có độ dài > layer box: "Test text layer" > click btn Preview your design`, async () => {
      await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await productSF.clickOnBtnPreviewSF();
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_7.2.png`, {
        threshold: 0.1,
      });
    });
    await test.step(`Search and select campaign tiếp theo`, async () => {
      await homePage.searchThenViewProduct(campaignDroplist);
      await expect(page.locator(`//h1[normalize-space()='${campaignDroplist}']`)).toBeVisible();
    });
    await test.step(`Input text có độ dài > layer box: Test text layer > verify ảnh preview`, async () => {
      await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await productSF.clickOnBtnPreviewSF();
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_7.3.png`, {
        threshold: 0.1,
      });
    });
  });

  test("[Printbase] Check Preview resize text campaign có mặt back @TC_PB_PRB_RTPC_15", async ({ page, conf }) => {
    const campaignName = conf.caseConf.campaign.name;
    const homePage = new SFHome(page, conf.suiteConf.domain);

    await test.step(`Đi đến trang SF > search and select campaign`, async () => {
      await homePage.searchThenViewProduct(campaignName);
      await expect(page.locator(`//h1[normalize-space()='${campaignName}']`)).toBeVisible();
    });
    await test.step(`Input text có độ dài > layer box: Test text layer > verify ảnh preview`, async () => {
      await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await productSF.clickOnBtnPreviewSF();
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_15.png`, {
        threshold: 0.1,
      });
    });
  });

  test("[Printbase] Check Preview resize text campaign có PSD preview được @TC_PB_PRB_RTPC_16", async ({
    page,
    conf,
  }) => {
    const campaignName = conf.caseConf.campaign.name;
    const homePage = new SFHome(page, conf.suiteConf.domain);

    await test.step(`Đi đến trang SF > search and select campaign`, async () => {
      await homePage.searchThenViewProduct(campaignName);
      await expect(page.locator(`//h1[normalize-space()='${campaignName}']`)).toBeVisible();
    });
    await test.step(`Input text vào CO1 có độ dài > layer box: Test text layer > verify ảnh preview`, async () => {
      await productSF.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await productSF.clickOnBtnPreviewSF();
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_16.png`, {
        threshold: 0.1,
      });
    });
  });
});
