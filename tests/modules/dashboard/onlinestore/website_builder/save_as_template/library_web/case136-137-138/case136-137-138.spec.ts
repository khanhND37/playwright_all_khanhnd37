import { expect, test } from "@fixtures/website_builder";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { SaveAsTemplateInput } from "@types";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";

test.describe("Verify library detail của web template", () => {
  let wbPage: WbLibrary;
  let authConfig;
  let themes: ThemeEcom, accessToken: string;
  let libraryList;

  test.beforeEach(async ({ dashboard, conf, builder, token }) => {
    test.slow();
    authConfig = {
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    };
    wbPage = new WbLibrary(dashboard, conf.suiteConf.domain);

    await test.step(`Create new library`, async () => {
      await builder.createLibrary({ title: conf.caseConf.template_data.libraryName });
    });

    await test.step(`Delete all unpublish theme`, async () => {
      const { access_token: shopToken } = await token.getWithCredentials(authConfig);
      accessToken = shopToken;
      themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
      await themes.deleteAllThemesUnPublish(accessToken);
    });

    await test.step(`Save new web template`, async () => {
      await wbPage.navigateToMenu("Online Store");
      await wbPage.waitUtilSkeletonDisappear();

      if (conf.caseConf.template_data) {
        const saveAsTemplateIntput: SaveAsTemplateInput = conf.caseConf.template_data;
        await wbPage.saveActiveTemplate(saveAsTemplateIntput);
      }
    });
  });

  test.afterEach(async ({ builder, conf }) => {
    test.slow();
    await test.step("Delete invalid library", async () => {
      libraryList = await builder.listLibrary({ action: "all" }, authConfig);

      for (const item of libraryList) {
        if (item.title == conf.caseConf.template_data.libraryName) {
          await builder.deleteLibrary(item.id);
        }
      }
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_136 Check trường preview images desktop", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Pre-condition: open edit template popup", async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
    });

    await test.step("Hover vào preview desktop image, click xóa ảnh trên popup", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.imgXpath("Desktop")).hover();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.deleteImageButton("Desktop")).click({ delay: 1000 });

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Desktop"))).toBeVisible();
    });

    await test.step("Nhấn save", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeVisible();
    });

    await test.step("Mở popup Edit info web template của template A: Check tải ảnh không đúng định dạng, không đúng size", async () => {
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Desktop")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_over_size);

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.warningUploadImage("Desktop"))).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: wbPage.xpathLib.editInfoPopup.uploadError("Desktop"),
        snapshotName: "error_upload_image.png",
      });
    });

    await test.step("Upload image khác recommend size", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.warningUploadImage("Desktop")).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Desktop")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_not_match_size);

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadNotMatchSize("Desktop"))).toHaveText(
        conf.caseConf.warning_not_match_size,
      );
    });

    await test.step("Upload ảnh hợp lệ", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.imgXpath("Desktop")).hover();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.deleteImageButton("Desktop")).click({ delay: 1000 });
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Desktop")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_valid);
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_137 Check trường preview images mobile", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Pre-condition: open edit template popup", async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
    });

    await test.step("Hover vào preview desktop image, click xóa ảnh trên popup", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.imgXpath("Mobile")).hover();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.deleteImageButton("Mobile")).click({ delay: 1000 });

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Mobile"))).toBeVisible();
    });

    await test.step("Nhấn save", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeVisible();
    });

    await test.step("Mở popup Edit info web template của template A: Check tải ảnh không đúng định dạng, không đúng size", async () => {
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Mobile")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_over_size);

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.warningUploadImage("Mobile"))).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: wbPage.xpathLib.editInfoPopup.uploadError("Mobile"),
        snapshotName: "error_upload_image.png",
      });
    });

    await test.step("Upload image khác recommend size", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.warningUploadImage("Mobile")).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Mobile")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_not_match_size);

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadNotMatchSize("Mobile"))).toHaveText(
        conf.caseConf.warning_not_match_size,
      );
    });

    await test.step("Upload ảnh hợp lệ", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.imgXpath("Mobile")).hover();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.deleteImageButton("Mobile")).click({ delay: 1000 });
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Mobile")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_valid);
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_WB_LibraryAuto_LIBRARY_DETAIL_138 Check trường preview images thumbnail image", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step("Pre-condition: open edit template popup", async () => {
      await wbPage.editLibrary(conf.caseConf.template_data.libraryName);
      await wbPage.switchToTab(wbPage.libraryTabs["Web templates"].name);
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
    });

    await test.step("Hover vào preview thumbnail image, click xóa ảnh trên popup", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.imgXpath("Thumbnail Library")).hover();
      await dashboard
        .locator(wbPage.xpathLib.editInfoPopup.deleteImageButton("Thumbnail Library"))
        .click({ delay: 1000 });

      await expect(
        dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Thumbnail Library")),
      ).toBeVisible();
    });

    await test.step("Nhấn save", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeVisible();
    });

    await test.step("Mở popup Edit info web template của template A: Check tải ảnh không đúng định dạng, không đúng size", async () => {
      await dashboard.locator(wbPage.xpathLib.libraryDetail.moreOptionButton).click();
      await dashboard.locator(wbPage.xpathLib.libraryDetail.editInfoButton).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.imgXpath("Thumbnail Library")).hover();
      await dashboard
        .locator(wbPage.xpathLib.editInfoPopup.deleteImageButton("Thumbnail Library"))
        .click({ delay: 1000 });

      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Thumbnail Library")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_over_size);

      await expect(
        dashboard.locator(wbPage.xpathLib.editInfoPopup.warningUploadImage("Thumbnail Library")),
      ).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: wbPage.xpathLib.editInfoPopup.uploadError("Thumbnail Library"),
        snapshotName: "error_upload_image.png",
      });
    });

    await test.step("Upload image khác recommend size", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.warningUploadImage("Thumbnail Library")).click();
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Thumbnail Library")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_not_match_size);

      await expect(dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadNotMatchSize("Thumbnail Library"))).toHaveText(
        conf.caseConf.warning_not_match_size,
      );
    });

    await test.step("Upload ảnh hợp lệ", async () => {
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.imgXpath("Thumbnail Library")).hover();
      await dashboard
        .locator(wbPage.xpathLib.editInfoPopup.deleteImageButton("Thumbnail Library"))
        .click({ delay: 1000 });
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.uploadFileButton("Thumbnail Library")).click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", conf.caseConf.image_valid);
      await dashboard.locator(wbPage.xpathLib.editInfoPopup.saveButton).click();

      await expect(dashboard.locator(`text=Save ${conf.caseConf.template_data.name} info successfully`)).toBeVisible();
    });
  });
});
