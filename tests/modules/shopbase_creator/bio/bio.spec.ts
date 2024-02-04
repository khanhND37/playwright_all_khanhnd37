import { test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { expect } from "@playwright/test";
import { snapshotDir } from "@utils/theme";
import { waitTimeout } from "@utils/api";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { CreatorPage } from "@pages/dashboard/creator";

test.describe("Verify bio", () => {
  const dProIds = [];
  let dashboardPage: DashboardPage, creatorPage: CreatorPage, webBuilder: WebBuilder, dProAPI: ProductAPI;

  test.beforeAll(async ({ authRequest, conf }) => {
    dProAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    await test.step("Create product test", async () => {
      const response = await dProAPI.createProduct(conf.suiteConf.create_product);
      dProIds.push(response.data.product.id);
      await dProAPI.publishProduct(dProIds, true);
    });
  });

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    creatorPage = new CreatorPage(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await dashboardPage.navigateToMenu("Online Store");
    const inputName = dashboard.getByPlaceholder("Name");
    await inputName.fill(conf.suiteConf.default_name);
    const inputBio = dashboard.getByPlaceholder("Bio");
    await inputBio.fill(conf.suiteConf.default_bio);

    const inputFbLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).first();
    const inputIgLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).nth(1);
    const inputYtbLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).nth(2);
    const inputTtLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).last();

    await inputFbLink.fill(conf.suiteConf.facebook_default);
    await inputIgLink.fill(conf.suiteConf.instagram_default);
    await inputYtbLink.fill(conf.suiteConf.youtube_default);
    await inputTtLink.fill(conf.suiteConf.tiktok_default);

    const buttonSave = dashboard.locator(creatorPage.xpathButtonSaveBio);
    if ((await buttonSave.count()) === 1) {
      await buttonSave.click();
      await expect(dashboard.locator(creatorPage.xpathToastSuccessBio)).toBeVisible();
      await dashboard.locator(creatorPage.xpathToastSuccessBio).waitFor({ state: "hidden" });
    }
  });

  test.afterAll(async ({}) => {
    await test.step("Delete product after test", async () => {
      await dProAPI.deleteProduct(dProIds);
    });
  });

  test(`@SB_NEWECOM_BIO_01 Check data default khi mở Your Profile ở My store`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`- Mở dashboard của shop- Click Online store > Design`, async () => {
      const actualName = await dashboard.getByPlaceholder("Name").inputValue();
      const actualBio = await dashboard.getByPlaceholder("Bio").inputValue();
      const actualFbLink = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).first().inputValue();
      const actualIgLink = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).nth(1).inputValue();
      const actualYtbLink = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).nth(2).inputValue();
      const actualTtLink = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).last().inputValue();

      expect(actualName).toEqual(conf.suiteConf.default_name);
      expect(actualBio).toEqual(conf.suiteConf.default_bio);
      expect(actualFbLink).toEqual(conf.suiteConf.facebook_default);
      expect(actualIgLink).toEqual(conf.suiteConf.instagram_default);
      expect(actualYtbLink).toEqual(conf.suiteConf.youtube_default);
      expect(actualTtLink).toEqual(conf.suiteConf.tiktok_default);
      await snapshotFixture.verify({
        page: dashboard,
        selector: creatorPage.xpathAvatarBio,
        snapshotName: conf.caseConf.screenshot,
      });
    });
  });

  test(`@SB_NEWECOM_BIO_02 Check edit các field data tại Your profile`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const buttonSave = dashboard.locator(creatorPage.xpathButtonSaveBio);

    await test.step(`Xóa Avatar ban đầu của shop `, async () => {
      const avatar = await dashboard.waitForSelector(creatorPage.xpathAvatarBio);
      await avatar.hover();
      const buttonDeleteAvatar = await dashboard
        .locator(creatorPage.xpathAvatarActionBarBio)
        .getByRole("button")
        .nth(2);
      await buttonDeleteAvatar.click();
      await buttonSave.click();
      await expect(dashboard.locator(creatorPage.xpathToastSuccessBio)).toBeVisible();
      await dashboard.locator(creatorPage.xpathToastSuccessBio).waitFor({ state: "hidden" });
      await snapshotFixture.verify({
        page: dashboard,
        selector: creatorPage.xpathAvatarUploadBio,
        snapshotName: conf.caseConf.screenshot_upload,
      });
    });

    for (let i = 0; i < conf.caseConf.steps_update_avatar_name_bio.length; i++) {
      const step = conf.caseConf.steps_update_avatar_name_bio[i];
      await test.step(`${step.title}`, async () => {
        let element;
        if (step.name === "Avatar") {
          element = dashboard.locator(creatorPage.xpathInputAvatarBio);
          await element.setInputFiles(conf.suiteConf.default_avatar);
        } else {
          element = dashboard.getByPlaceholder(step.name);
          await element.fill(step.value);
        }

        await buttonSave.click();
        await expect(dashboard.locator(creatorPage.xpathToastSuccessBio)).toBeVisible();
        await dashboard.locator(creatorPage.xpathToastSuccessBio).waitFor({ state: "hidden" });

        if (step.name === "Avatar") {
          await snapshotFixture.verify({
            page: dashboard,
            selector: creatorPage.xpathAvatarBio,
            snapshotName: conf.caseConf.screenshot,
          });
        } else {
          const actualValue = await element.inputValue();
          expect(actualValue).toEqual(step.expect_value);
        }
      });
    }

    await test.step(`Edit Social links default hiển thị tại My profile`, async () => {
      const inputFbLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).first();
      const inputIgLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).nth(1);
      const inputYtbLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).nth(2);
      const inputTtLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).last();

      await inputFbLink.fill(conf.caseConf.facebook_sb);
      await inputIgLink.fill(conf.caseConf.instagram_sb);
      await inputYtbLink.fill(conf.caseConf.youtube_sb);
      await inputTtLink.fill(conf.caseConf.tiktok_sb);

      const buttonSave = dashboard.locator(creatorPage.xpathButtonSaveBio);
      await buttonSave.click();
      await expect(dashboard.locator(creatorPage.xpathToastSuccessBio)).toBeVisible();
      await dashboard.locator(creatorPage.xpathToastSuccessBio).waitFor({ state: "hidden" });

      const actualFbLink = await inputFbLink.inputValue();
      const actualIgLink = await inputIgLink.inputValue();
      const actualYtbLink = await inputYtbLink.inputValue();
      const actualTtLink = await inputTtLink.inputValue();

      expect(actualFbLink).toEqual(conf.caseConf.facebook_sb);
      expect(actualIgLink).toEqual(conf.caseConf.instagram_sb);
      expect(actualYtbLink).toEqual(conf.caseConf.youtube_sb);
      expect(actualTtLink).toEqual(conf.caseConf.tiktok_sb);
    });
    await test.step(`Click Add link Nhập đường link social `, async () => {
      const buttonAdd = dashboard.getByRole("button").filter({ hasText: "Add link" });
      await buttonAdd.click();

      const inputNewLink = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).last();
      expect(await inputNewLink.inputValue()).toEqual("");
      await inputNewLink.fill(conf.caseConf.twitter_sb);

      await buttonSave.click();
      await expect(await dashboard.locator(creatorPage.xpathToastSuccessBio)).toBeVisible();
      await dashboard.locator(creatorPage.xpathToastSuccessBio).waitFor({ state: "hidden" });

      const actualNewLink = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).last().inputValue();
      expect(actualNewLink).toEqual(conf.caseConf.twitter_sb);
    });
    await test.step(`CLick icon Delete ở social links Tiktok`, async () => {
      const buttonDeleteTiktok = dashboard.locator(creatorPage.xpathButtonDeleteSocialLinkBio).nth(3);
      await buttonDeleteTiktok.click();

      await buttonSave.click();
      await expect(await dashboard.locator(creatorPage.xpathToastSuccessBio)).toBeVisible();
      await dashboard.locator(creatorPage.xpathToastSuccessBio).waitFor({ state: "hidden" });

      const countLink = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).count();
      expect(countLink).toEqual(conf.caseConf.social_link_count);
    });
    await test.step(`Xoá all social links đang có tại My profile`, async () => {
      const buttonDeleteFirst = dashboard.locator(creatorPage.xpathButtonDeleteSocialLinkBio).first();
      await buttonDeleteFirst.click();
      await buttonDeleteFirst.click();
      await buttonDeleteFirst.click();
      await buttonDeleteFirst.click();

      await buttonSave.click();
      await expect(await dashboard.locator(creatorPage.xpathToastSuccessBio)).toBeVisible();
      await dashboard.locator(creatorPage.xpathToastSuccessBio).waitFor({ state: "hidden" });

      const countLink = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).count();
      expect(countLink).toEqual(0);

      const buttonAdd = dashboard.getByRole("button").filter({ hasText: "Add link" });
      await buttonAdd.click();
      await buttonAdd.click();
      await buttonAdd.click();
      await buttonAdd.click();

      // Add lại data để lần chạy sau không bị lệch data default
      const inputFbLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).first();
      const inputIgLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).nth(1);
      const inputYtbLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).nth(2);
      const inputTtLink = dashboard.locator(creatorPage.xpathInputSocialLinkBio).last();

      await inputFbLink.fill(conf.suiteConf.facebook_default);
      await inputIgLink.fill(conf.suiteConf.instagram_default);
      await inputYtbLink.fill(conf.suiteConf.youtube_default);
      await inputTtLink.fill(conf.suiteConf.tiktok_default);

      await buttonSave.click();
      await expect(await dashboard.locator(creatorPage.xpathToastSuccessBio)).toBeVisible();
      await dashboard.locator(creatorPage.xpathToastSuccessBio).waitFor({ state: "hidden" });
      const countLinkAtEnd = await dashboard.locator(creatorPage.xpathInputSocialLinkBio).count();
      expect(countLinkAtEnd).toEqual(conf.caseConf.social_link_count);
    });
  });

  test(`@SB_NEWECOM_BIO_04 Check hiển thị thông tin đã nhập trong Your profile khi edit Page`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Open web builder", async () => {
      await webBuilder.openWebBuilder({ type: "sale page", id: dProIds[0] });
    });

    await test.step(`- Add 1 blank section vào Page- Add vào section+ 1 block Heading+ 1 block Image+ 1 block Paragraph+ 1 block Social`, async () => {
      const addSection = conf.caseConf.add_section;
      await webBuilder.insertSectionBlock({
        parentPosition: addSection.parent_position,
        category: addSection.category,
        template: addSection.template,
      });
    });
    await test.step(`- Double CLick vào block Heading, xóa content default của block- Chọn Insert variable- Chọn variable: Social Profile> Profile name- Click ra ngoài block`, async () => {
      const firstSection = webBuilder.getSelectorByIndex(conf.caseConf.first_section);
      await webBuilder.clickOnElement(firstSection, webBuilder.iframe);

      const addBlockHeading = conf.caseConf.add_block_heading;
      await webBuilder.insertSectionBlock({
        parentPosition: addBlockHeading.parent_position,
        category: addBlockHeading.category,
        template: addBlockHeading.template,
      });

      const blockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
      await webBuilder.clickOnElement(blockHeading, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await dashboard.keyboard.press("Control+A");
      await webBuilder.frameLocator.locator(blockHeading).type(" ");
      // Chờ vì thay đổi data quá nhanh bị sai input mong muốn
      await waitTimeout(150);
      await webBuilder.selectOptionOnQuickBar("Get text from");
      await webBuilder.frameLocator.locator(creatorPage.xpathQuickBarActionGetTextLinkMenuLv1("Profile")).click();
      await webBuilder.frameLocator.locator(creatorPage.xpathQuickBarActionGetTextLinkMenuLv2("Profile Name")).click();
      // Chờ vì thay đổi data quá nhanh bị sai input mong muốn
      await waitTimeout(150);
      await webBuilder.selectOptionOnQuickBar("Get text from");
      await webBuilder.frameLocator.locator(creatorPage.xpathQuickBarActionGetTextLinkMenuLv1("Profile")).click();
      await webBuilder.frameLocator.locator(creatorPage.xpathQuickBarActionGetTextLinkMenuLv2("Profile Bio")).click();
      // Chờ vì thay đổi data quá nhanh bị sai input mong muốn
      await waitTimeout(150);
    });
    await test.step(`- Click vào block Image- CLick sang tab Content của block- CLick icon variable- Chọn variable = Profile image`, async () => {
      const addBlockImage = conf.caseConf.add_block_image;
      await webBuilder.dragAndDropInWebBuilder(addBlockImage);

      await webBuilder.switchToTab("Content");
      await webBuilder.selectMultiLevelMenu("image", [4, 1]);
    });
    await test.step(`- Double CLick vào block Paragraph, xóa content default của block- Chọn Insert variable- Chọn variable: Social Profile > Profile bio- Click ra ngoài block`, async () => {
      const addBlockParagraph = conf.caseConf.add_block_paragraph;
      await webBuilder.dragAndDropInWebBuilder(addBlockParagraph);

      const blockParagraph = webBuilder.getSelectorByIndex(conf.caseConf.block_position);
      await webBuilder.clickOnElement(blockParagraph, webBuilder.iframe);
      await webBuilder.selectOptionOnQuickBar("Edit text");
      await dashboard.keyboard.press("Control+A");
      await webBuilder.frameLocator.locator(blockParagraph).type(" ");
      // Chờ vì thay đổi data quá nhanh bị sai input mong muốn
      await waitTimeout(150);
      await webBuilder.selectOptionOnQuickBar("Get text from");
      await webBuilder.frameLocator.locator(creatorPage.xpathQuickBarActionGetTextLinkMenuLv1("Profile")).click();
      await webBuilder.frameLocator.locator(creatorPage.xpathQuickBarActionGetTextLinkMenuLv2("Profile Name")).click();
      // Chờ vì thay đổi data quá nhanh bị sai input mong muốn
      await waitTimeout(150);
      await webBuilder.selectOptionOnQuickBar("Get text from");
      await webBuilder.frameLocator.locator(creatorPage.xpathQuickBarActionGetTextLinkMenuLv1("Profile")).click();
      await webBuilder.frameLocator.locator(creatorPage.xpathQuickBarActionGetTextLinkMenuLv2("Profile Bio")).click();
      // Chờ vì thay đổi data quá nhanh bị sai input mong muốn
      await waitTimeout(150);
    });
    await test.step(`- Click vào block Social- CLick sang tab setting của block- Switch ON "Use profile link"`, async () => {
      const addBlockSocial = conf.caseConf.add_block_social;
      await webBuilder.dragAndDropInWebBuilder(addBlockSocial);
      await webBuilder.switchToTab("Content");
      await webBuilder.switchToggle("socials", true);
      // Chờ render lại giao diện
      await waitTimeout(500);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: webBuilder.getSelectorByIndex(conf.caseConf.first_section),
        iframe: webBuilder.iframe,
        snapshotName: conf.caseConf.screenshot,
      });
    });
  });
});
