import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { snapshotDir } from "@utils/theme";
import { SFProduct } from "@sf_pages/product";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { removeCurrencySymbol } from "@core/utils/string";

test.describe("Duplicate campaign after edit", () => {
  let printbasePage: PrintBasePage;
  let SFPage;
  let campaignId;
  let campaignOrigin;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.time_out);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);

    await test.step("Pre: Create campaign origin", async () => {
      campaignOrigin = conf.caseConf.campaign_origin;
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);

      if (
        await dashboard
          .locator(`(//span[normalize-space() = '${campaignOrigin.pricing_info.title}'])[1]`)
          .isVisible({ timeout: 10000 })
      ) {
        return;
      } else {
        await printbasePage.navigateToMenu("Catalog");
        campaignId = await printbasePage.launchCamp(campaignOrigin);
        if (!campaignOrigin.is_campaign_draft) {
          const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
          expect(isAvailable).toBeTruthy();
        }
      }
    });
  });

  test(`@SB_PRB_DC_67 Verify khi thực hiện duplicate campaign sau khi edit price`, async ({ conf, context }) => {
    const caseData = conf.caseConf;
    const keepArtwork = caseData.keep_artwork;
    const pricingInfor = caseData.pricing_infor;
    campaignOrigin = conf.caseConf.campaign_origin;

    await test.step(`1. Vào màn hình All campaigns > Search campaign ${campaignOrigin} > Mở màn hình campaign detail > Click vào checkbox select variant ->Click vào Action > Click vào edit variant ->Thực hiện edit thông tin price,compare at price của variant bất kỳ -> click vào Save > Trở màn màn hình campaign detail ->Click btn Duplicate campaign`, async () => {
      await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      // delete camp duplicate
      await printbasePage.searchWithKeyword(pricingInfor.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);

      // search original camp
      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.openEditCamp(campaignOrigin.pricing_info.title);
      await printbasePage.selectAllVariant();
      await printbasePage.selectActionForVariant(caseData.action, caseData.new_price);
      await printbasePage.clickOnBtnWithLabel("Save changes");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
      await printbasePage.clickOnBtnWithLabel("Duplicate");
      await expect(printbasePage.page.locator(".s-input__inner").first()).toHaveValue(
        `Copy of ${campaignOrigin.pricing_info.title}`,
      );
    });

    await test.step("2. Click checkbox keep artwork > Click btn Duplicate >Click vào btn Continue > Input title mới cho campaign duplicate ở màn pricing > Click btn Launch campaign", async () => {
      if (keepArtwork) {
        await printbasePage.verifyCheckedThenClick(printbasePage.xpathCheckboxKeepArtwork, true);
      }
      await printbasePage.clickOnBtnWithLabel("Duplicate", 2);
      await printbasePage.removeLiveChat();
      await printbasePage.clickOnBtnWithLabel("Continue");
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfor);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step("4. Mở màn campaign detail >  Verify price vả compare at price", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(pricingInfor.title);
      await printbasePage.openCampaignDetail(pricingInfor.title);
      await printbasePage.waitUntilElementVisible(printbasePage.xpathTitle);
      await expect(
        printbasePage.page
          .locator("//table[@id='all-variants']/tbody/tr/td[6]")
          .filter({ hasNotText: `${caseData.new_price}` }),
      ).toHaveCount(0);
    });

    await test.step("4. View campaign ngoài SF > Verify thông tin", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      const sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      await sfProduct.waitResponseWithUrl("/assets/landing.css", 500000);
      const productPrice = await removeCurrencySymbol(
        (await sfProduct.page.locator(sfProduct.xpathPriceOnSF).textContent()).trim(),
      );
      await expect(productPrice).toEqual(caseData.new_price);
    });

    await test.step("Reset về data cũ sau khi edit", async () => {
      await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.openEditCamp(campaignOrigin.pricing_info.title);
      await printbasePage.selectAllVariant();
      await printbasePage.selectActionForVariant(caseData.action, caseData.old_price);
      await printbasePage.clickOnBtnWithLabel("Save changes");
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathToastMessage);
    });
  });

  test(`@SB_PRB_DC_68 Verify khi thực hiện duplicate campaign sau khi add/remove size, color`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    const caseData = conf.caseConf;
    const campaignOrigin = caseData.campaign_origin;
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const keepArtwork = caseData.keep_artwork;
    const picture = caseData.picture;
    const pricingInfor = caseData.pricing_infor;

    await test.step(`-  Vào màn All campaigns > Search "Campaign origin 4" > Mở màn hình campaign detail > Click vào edit campaign setting->Thực hiện edit thông tin color, và size:+ select color:white, black,dark chocolate,Ash,purple,royal blue,light blue,red,forest green,daisy,dark heather,+ select size: S,M,L,XL, 2XL- Click vào Save change ->Click Continue`, async () => {
      await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      // delete camp duplicate
      await printbasePage.searchWithKeyword(pricingInfor.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);

      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.openEditorCampaign(campaignOrigin.pricing_info.title);
      await printbasePage.page.hover(
        printbasePage.xpathTitleBaseProductOnEditor(campaignOrigin.product_infos[0].base_product),
      );
      await printbasePage.selectVariantForBase(caseData.variant);
      await printbasePage.clickOnBtnWithLabel("Save change");
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`-Click vào btn Duplicate`, async () => {
      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.openEditCamp(campaignOrigin.pricing_info.title);
      await printbasePage.clickOnBtnWithLabel("Duplicate");
      await expect(printbasePage.page.locator(".s-input__inner").first()).toHaveValue(
        `Copy of ${campaignOrigin.pricing_info.title}`,
      );
    });

    await test.step(`-  Click vào checkbox keep artwork > Click vào btn Duplicate- Click vào btn Continue > Input title mới cho campaign duplicate ở màn pricing > Click btn Launch campaign`, async () => {
      if (keepArtwork) {
        await printbasePage.verifyCheckedThenClick(printbasePage.xpathCheckboxKeepArtwork, true);
      }
      await printbasePage.clickOnBtnWithLabel("Duplicate", 2);
      await printbasePage.removeLiveChat();
      await printbasePage.clickOnBtnWithLabel("Continue");
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfor);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`- Mở campaign detail > Verify color va size `, async () => {
      await printbasePage.openEditorCampaign(pricingInfor.title);
      await snapshotFixture.verify({
        page: dashboard,
        selector: ".color-size-select-section",
        snapshotName: picture.color_size_editor,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
      await printbasePage.page.click(printbasePage.xpathBackToCatalog);
    });

    await test.step(`- View campaign vừa duplicate ngoài SF > Verify các thông tin campaign trên SF`, async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      const sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      await sfProduct.waitResponseWithUrl("/assets/landing.css", 500000);
      await snapshotFixture.verify({
        page: SFPage,
        selector: sfProduct.xpathProductVariant,
        snapshotName: picture.picture_sf,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Reset về data cũ sau khi edit", async () => {
      await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.openEditorCampaign(campaignOrigin.pricing_info.title);
      await printbasePage.page.hover(
        printbasePage.xpathTitleBaseProductOnEditor(campaignOrigin.product_infos[0].base_product),
      );
      await printbasePage.selectVariantForBase(caseData.variant);
      await printbasePage.clickOnBtnWithLabel("Save change");
      await printbasePage.clickOnBtnWithLabel("Continue");
    });
  });

  test(`@SB_PRB_DC_69 Verify khi thực hiện duplicate campaign sau khi add/remove base product`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const caseData = conf.caseConf;
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    const campaignOrigin = caseData.campaign_origin;
    const keepArtwork = caseData.keep_artwork;
    const baseList = caseData.base_list;
    const pricingInfor = caseData.pricing_infor;

    await test.step(`-  Vào màn All campaigns > Search "Campaign origin 4" > Mở màn hình campaign detail > Click vào edit campaign setting->Thực hiện add thêm base Ladies T-shirt- Click vào Save change ->Click Continue`, async () => {
      await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      // delete camp duplicate
      await printbasePage.searchWithKeyword(pricingInfor.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.deleteAllCampaign(conf.suiteConf.password);

      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.openEditorCampaign(campaignOrigin.pricing_info.title);
      await printbasePage.addOrRemoveProduct("Apparel", baseList[0]);
      await printbasePage.clickOnBtnWithLabel("Save change");
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.clickOnBtnWithLabel("Continue");
      await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      const isAvailable = await printbasePage.checkCampaignStatus(
        campaignId,
        ["available", "available with basic images"],
        30 * 60 * 1000,
      );
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`Click vào btn Duplicate`, async () => {
      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.openEditCamp(campaignOrigin.pricing_info.title);
      await printbasePage.clickOnBtnWithLabel("Duplicate");
      await expect(printbasePage.page.locator(".s-input__inner").first()).toHaveValue(
        `Copy of ${campaignOrigin.pricing_info.title}`,
      );
    });

    await test.step(`-  Click vào checkbox keep artwork > Click vào btn Duplicate- Click vào btn Continue > Input title mới cho campaign duplicate ở màn pricing > Click btn Launch campaign`, async () => {
      if (keepArtwork) {
        await printbasePage.verifyCheckedThenClick(printbasePage.xpathCheckboxKeepArtwork, true);
      }
      await printbasePage.clickOnBtnWithLabel("Duplicate", 2);
      await printbasePage.removeLiveChat();
      await printbasePage.clickOnBtnWithLabel("Continue");
      campaignId = printbasePage.getCampaignIdInPricingPage();
      await printbasePage.inputPricingInfo(pricingInfor);
      await printbasePage.clickOnBtnWithLabel("Launch");
      const isAvailable = await printbasePage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });

    await test.step(`- Mở campaign detail > Verify base product`, async () => {
      await printbasePage.openEditorCampaign(pricingInfor.title);
      for (let i = 0; i < baseList.length; i++) {
        await printbasePage.clickBaseProduct(baseList[i]);
        expect(
          await printbasePage.page.locator(printbasePage.xpathTitleBaseProductOnEditor(baseList[i])).isVisible(),
        ).toBeTruthy();
      }
      await printbasePage.page.click(printbasePage.xpathBackToCatalog);
    });

    await test.step(`- View campaign vừa duplicate ngoài SF  > Verify các thông tin campaign trên SF`, async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
      const sfProduct = new SFProduct(SFPage, conf.suiteConf.domain);
      await sfProduct.waitResponseWithUrl("/assets/landing.css", 500000);
      for (let i = 0; i < baseList.length; i++) {
        await sfProduct.chooseVariantByClickImage(i + 1);
        expect((await sfProduct.page.locator(sfProduct.xpathLabelvariant).first().textContent()).trim()).toEqual(
          baseList[i],
        );
      }
    });

    await test.step("Reset về data cũ sau khi edit", async () => {
      await printbasePage.navigateToSubMenu("Campaigns", "All campaigns");
      await printbasePage.searchWithKeyword(campaignOrigin.pricing_info.title);
      await printbasePage.waitForElementVisibleThenInvisible(printbasePage.xpathProductDetailLoading);
      await printbasePage.openEditorCampaign(campaignOrigin.pricing_info.title);
      await printbasePage.deleteBaseProduct(baseList[0]);
      await printbasePage.clickOnBtnWithLabel("Save change");
      await printbasePage.clickOnBtnWithLabel("Continue");
    });
  });
});
