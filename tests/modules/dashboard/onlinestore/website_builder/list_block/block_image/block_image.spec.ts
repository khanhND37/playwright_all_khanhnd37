import { expect, test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl, waitForImageLoaded } from "@utils/theme";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";

test.describe("Verify block Image", () => {
  let settingsData: PageSettingsData;
  let blocks: Blocks;
  let sfUrl: URL;

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ context, conf, builder, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition: create product, apply blank template and open web builder", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      settingsData.pages["home"].default.elements = [];
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsData);
      await blocks.openWebBuilder({
        id: conf.suiteConf.theme_id,
        type: "site",
      });
      await blocks.reloadIfNotShow("/");
      await blocks.frameLocator.locator(blocks.xpathAddSection).click({ delay: 200 });
      await blocks.page.getByTestId("section_default").click();
      await blocks.genLoc(`${blocks.layerDetailLoc} [data-id]`).waitFor();
      await blocks.insertSectionBlock({
        parentPosition: { section: 1, column: 1 },
        category: "Basics",
        template: "Image",
      });
      await blocks.backBtn.click();
      await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        onlyClickSave: true,
      });
      const previewUrl = await blocks.genLoc(blocks.previewWb).getAttribute("src");
      sfUrl = new URL(previewUrl);
      sfUrl.searchParams.delete("preview");
      sfUrl.searchParams.delete("token");
    });
  });

  test("Check data default when add block image @SB_WEB_BUILDER_LB_BI_01", async ({ conf, snapshotFixture }) => {
    const blockSelector = blocks.getSelectorByIndex({ section: 1, column: 1, block: 1 });

    await test.step("Add section and add block image for section", async () => {
      await blocks.frameLocator.locator(blockSelector).click();
      await blocks.switchToTab("Content");
    });

    await test.step("Verify block image in sidebar + preview", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.xpathSidebar,
        snapshotName: conf.caseConf.expect.sidebar,
      });
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        iframe: blocks.iframe,
        selector: blocks.sectionsInPreview,
        snapshotName: conf.caseConf.expect.preview,
      });
    });

    await test.step("Save > click preview image, verify block image on SF", async () => {
      await blocks.goto(sfUrl.href);
      await waitForImageLoaded(blocks.page, blocks.bodySF);
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sectionsInPreview,
        snapshotName: conf.caseConf.expect.storefront,
      });
    });
  });

  test("Check setting image với action = Open a link in setting tab @SB_WEB_BUILDER_LB_BI_04", async ({
    builder,
    conf,
    context,
  }) => {
    const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
    const newSettingsData = response.settings_data as PageSettingsData;
    for (const data of conf.caseConf.data) {
      await test.step("Settings block", async () => {
        newSettingsData.pages["home"].default.elements[0].elements[0].elements[0].elements[0].settings = data.settings;
        await builder.updateSiteBuilder(conf.suiteConf.theme_id, newSettingsData);
      });

      await test.step("Verify setting block in Storefront", async () => {
        await blocks.goto(sfUrl.href);
        await waitForImageLoaded(blocks.page, blocks.bodySF);

        if (data.expect.image) {
          const src = await blocks.page.getAttribute(blocks.imageOnSF, "src");
          expect(src).toMatch(new RegExp(data.expect.image));
        }

        if (data.expect.alt) {
          const altImage = await blocks.page.getAttribute(blocks.imageOnSF, "alt");
          expect(altImage).toEqual(data.expect.alt);
        }

        if (data.expect.redirect) {
          if (!data.expect.newTab) {
            context = undefined;
          }

          await verifyRedirectUrl({
            context,
            page: blocks.page,
            redirectUrl: data.expect.redirect,
            selector: blocks.imageOnSF,
          });
        }
      });
    }
  });

  test("Check setting image with action = Go to page @SB_WEB_BUILDER_LB_BI_05", async ({ builder, conf, context }) => {
    const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
    const newSettingsData = response.settings_data as PageSettingsData;
    for (const data of conf.caseConf.data) {
      await test.step("Settings block", async () => {
        newSettingsData.pages["home"].default.elements[0].elements[0].elements[0].elements[0].settings = data.settings;
        await builder.updateSiteBuilder(conf.suiteConf.theme_id, newSettingsData);
      });

      await test.step("Verify setting block in Storefront", async () => {
        await blocks.goto(sfUrl.href);
        await waitForImageLoaded(blocks.page, blocks.bodySF);

        if (data.expect.redirect) {
          if (!data.expect.newTab) {
            context = undefined;
          }

          await verifyRedirectUrl({
            context,
            page: blocks.page,
            redirectUrl: data.expect.redirect,
            selector: blocks.imageOnSF,
          });
        }
      });
    }
  });

  test(`Tab setting_Check setting image với action = Go to section @SB_WEB_BUILDER_LB_BI_06`, async ({
    context,
    conf,
  }) => {
    let storefront;
    await test.step(`Click block image`, async () => {
      await blocks.genLoc(blocks.getSidebarSelectorByIndex({ section: 1 })).click();
      await blocks.getAddSectionBtn({ section: 1, position: "after" }).click({ delay: 200 });
      await blocks.page.getByTestId("section_default").click();
      await blocks.insertSectionBlock({
        parentPosition: { section: 2, column: 1 },
        category: "Basics",
        template: "Image",
      });
      await blocks.backBtn.click();
      await blocks.genLoc(blocks.getSidebarSelectorByIndex({ section: 2 })).click();
      await blocks.getAddSectionBtn({ section: 2, position: "after" }).click({ delay: 200 });
      await blocks.page.getByTestId("section_default").click();
      await blocks.inputTextBox("name", conf.caseConf.data.section_name);
      await blocks.insertSectionBlock({
        parentPosition: { section: 3, column: 1 },
        category: "Basics",
        template: "Form",
      });
    });

    await test.step(`Chọn tab setting trên sidebar`, async () => {
      await blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 })).click();
      await blocks.switchToTab("Content");
    });

    await test.step(`- Setting image trong section 1 Action = Go to section 3`, async () => {
      await blocks.selectDropDown("link", conf.caseConf.data.action);
      await blocks.selectDropDown("link", conf.caseConf.data.section_name, 2);
      await blocks.backBtn.click();
    });

    await test.step(`Click image save > click icon preview trên thanh bar`, async () => {
      storefront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        isNextStep: true,
        snapshotName: "",
      });
    });

    await test.step(`Click vào image 1`, async () => {
      await storefront.locator(blocks.imageOnSF).click();
      await expect(storefront.locator(blocks.getSelectorByIndex({ section: 3 }))).toBeInViewport();
      await storefront.close();
    });

    await test.step(`- Trong DB:+ Xóa section 3`, async () => {
      await blocks.genLoc(blocks.getSidebarSelectorByIndex({ section: 3 })).click();
      await blocks.removeBtn.click();
    });

    await test.step(`Open sale page ở step 1 ở ngoài SF`, async () => {
      storefront = await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        isNextStep: true,
        snapshotName: "",
      });
    });

    await test.step(`Click vào image 1`, async () => {
      await storefront.locator(blocks.imageOnSF).click();
      await expect(storefront.locator(blocks.getSelectorByIndex({ section: 1 }))).toBeInViewport();
    });
  });

  test("Check setting image with action = Make a call @SB_WEB_BUILDER_LB_BI_07", async ({ builder, conf }) => {
    const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
    const newSettingsData = response.settings_data as PageSettingsData;
    for (const data of conf.caseConf.data) {
      await test.step("Settings block", async () => {
        newSettingsData.pages["home"].default.elements[0].elements[0].elements[0].elements[0].settings = data.settings;
        await builder.updateSiteBuilder(conf.suiteConf.theme_id, newSettingsData);
      });

      await test.step("Verify setting block in Storefront", async () => {
        await blocks.goto(sfUrl.href);
        await waitForImageLoaded(blocks.page, blocks.bodySF);

        if (data.expect.href) {
          await expect(blocks.genLoc(blocks.linkImage)).toHaveAttribute("href", `${data.expect.href}`);
        }
      });
    }
  });

  test("Check setting image with action = Send email to @SB_WEB_BUILDER_LB_BI_08", async ({ builder, conf }) => {
    const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
    const newSettingsData = response.settings_data as PageSettingsData;
    for (const data of conf.caseConf.data) {
      await test.step("Settings block", async () => {
        newSettingsData.pages["home"].default.elements[0].elements[0].elements[0].elements[0].settings = data.settings;
        await builder.updateSiteBuilder(conf.suiteConf.theme_id, newSettingsData);
      });

      await test.step("Verify setting block in Storefront", async () => {
        await blocks.goto(sfUrl.href);
        await waitForImageLoaded(blocks.page, blocks.bodySF);

        if (data.expect.href) {
          await expect(blocks.genLoc(blocks.linkImage)).toHaveAttribute("href", `${data.expect.href}`);
        }
      });
    }
  });

  test("Check setting image with action = Copy to clipboard @SB_WEB_BUILDER_LB_BI_09", async ({
    context,
    builder,
    conf,
  }) => {
    await blocks.genLoc(blocks.getSidebarSelectorByIndex({ section: 1 })).click();
    await blocks.getAddSectionBtn({ section: 1, position: "after" }).click({ delay: 200 });
    await blocks.page.getByTestId("section_default").click();
    await blocks.insertSectionBlock({
      parentPosition: { section: 2, column: 1 },
      category: "Basics",
      template: "Form",
    });
    await blocks.clickSaveAndVerifyPreview({
      context,
      dashboard: blocks.page,
      onlyClickSave: true,
    });
    const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
    const newSettingsData = response.settings_data as PageSettingsData;
    for (const data of conf.caseConf.data) {
      await test.step("Settings block", async () => {
        newSettingsData.pages["home"].default.elements[0].elements[0].elements[0].elements[0].settings = data.settings;
        await builder.updateSiteBuilder(conf.suiteConf.theme_id, newSettingsData);
      });

      await test.step("Verify setting block in Storefront", async () => {
        await blocks.goto(sfUrl.href);
        await blocks.page.waitForLoadState("networkidle");
        await waitForImageLoaded(blocks.page, blocks.bodySF);
        await blocks.genLoc(blocks.imageOnSF).click();

        if (data.expect.paste) {
          await blocks.genLoc("text='Copied to clipboard'").waitFor();
          await blocks.genLoc(blocks.lastNamePlaceholder).click();
          await blocks.genLoc(blocks.lastNamePlaceholder).focus();
          await blocks.page.keyboard.press("Control+KeyV");
          await blocks.page.keyboard.press("Enter");
          await expect(blocks.genLoc(blocks.lastNamePlaceholder)).toHaveValue(data.expect.paste);
          await blocks.page.keyboard.press("Control+KeyA");
          await blocks.page.keyboard.press("Backspace");
        } else {
          await expect(blocks.genLoc("text='Copied to clipboard'")).toHaveCount(0);
        }
      });
    }
  });

  test("Check setting width, height block image @SB_WEB_BUILDER_LB_BI_11", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    await test.step("Add section and add block image for section", async () => {
      await blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 })).click();
      await blocks.selectOptionOnQuickBar("Duplicate");
    });

    await test.step("Setting style image in sidebar ", async () => {
      let blockIndex = 0;
      for (const settingBlock of conf.caseConf.data.section_1.settings_block) {
        blockIndex++;
        await blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: blockIndex })).click();
        await blocks.changeDesign(settingBlock);
      }
    });

    await test.step("Verify image setting in webfront", async () => {
      await blocks.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1 })),
        snapshotName: conf.caseConf.expect.preview,
        sizeCheck: true,
        combineOptions: { expectToPass: { timeout: 15000 } },
      });
    });

    await test.step("Save > click preview image, verify block image on SF", async () => {
      await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: conf.caseConf.expect.saved,
        onlyClickSave: true,
      });

      await blocks.goto(sfUrl.href);
      await waitForImageLoaded(blocks.page, blocks.bodySF);
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sectionsInPreview,
        snapshotName: conf.caseConf.expect.storefront,
        combineOptions: { expectToPass: { timeout: 15000 } },
      });
    });
  });

  test("Check border, opacity, radius, shadow, padding, margin block Image @SB_WEB_BUILDER_LB_BI_12", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const sectionSetting = conf.caseConf.data.section_1;

    await test.step("Add section and add block image for section", async () => {
      await blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 })).click();
      for (let i = 0; i < sectionSetting.duplicate; i++) {
        await blocks.selectOptionOnQuickBar("Duplicate");
      }
    });

    await test.step("Setting style image in sidebar ", async () => {
      let blockIndex = 0;
      for (const settingBlock of conf.caseConf.data.section_1.settings_block) {
        blockIndex++;
        await blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: blockIndex })).click();
        await blocks.changeDesign(settingBlock);
        await blocks.backBtn.click();
      }
    });

    await test.step("Verify image setting in webfront", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1 })),
        sizeCheck: true,
        snapshotName: conf.caseConf.expect.preview,
      });
    });

    await test.step("Save > click preview image, verify block image on SF", async () => {
      await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: conf.caseConf.expect.saved,
        onlyClickSave: true,
      });

      await blocks.goto(sfUrl.href);
      await waitForImageLoaded(blocks.page, blocks.bodySF);
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.sectionsInPreview,
        snapshotName: conf.caseConf.expect.storefront,
      });
    });
  });

  test("Check remove block image @SB_WEB_BUILDER_LB_BI_13", async ({ context }) => {
    await test.step("Add section and add block image for section", async () => {
      await blocks.frameLocator.locator(blocks.getSelectorByIndex({ section: 1, block: 1 })).click();
      for (let i = 0; i < 2; i++) {
        await blocks.selectOptionOnQuickBar("Duplicate");
      }
    });

    await test.step("Remove block image", async () => {
      const buttonRemove = blocks.getXpathByText("Delete block");
      await blocks.genLoc(buttonRemove).click();
      await expect(blocks.frameLocator.locator(blocks.blockImage)).toHaveCount(2);
    });

    await test.step("Save template", async () => {
      await blocks.clickSaveAndVerifyPreview({
        context,
        dashboard: blocks.page,
        savedMsg: "All changes are saved",
        onlyClickSave: true,
      });
    });

    await test.step("Verify remove image in SF", async () => {
      await blocks.goto(sfUrl.href);
      await waitForImageLoaded(blocks.page, blocks.bodySF);
      await expect(blocks.genLoc(blocks.blockImage)).toHaveCount(2);
    });
  });
});
