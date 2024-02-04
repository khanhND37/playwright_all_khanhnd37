import { expect } from "@core/fixtures";
import { test } from "@fixtures/website_builder";

import {
  btnCancelPopupSaveAs,
  btnSavePopupSaveAs,
  customizeTheme,
  getXpathInputPreview,
  getXpathUploadFileBtn,
  inputSaveAsTemplate,
  popupSaveAsTemplate,
  publishTheme,
  removeFirstTheme,
  uploadImgPreview,
  xpathActionByShopThemeName,
  xpathActionFirst,
  xpathSaveAsTemplateInAction,
} from "../util";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { snapshotDir } from "@utils/theme";
import { TemplateStorePage } from "@sf_pages/template_store";
import { WbLibrary } from "@pages/dashboard/wb_library";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { OnlineStorePage } from "@pages/dashboard/online_store";

test.describe("Save web as template", () => {
  let dashboardPage: DashboardPage;
  let templateStore: TemplateStorePage;
  let library: WbLibrary;
  let authConfig;
  let themes: ThemeEcom, accessToken: string;
  let onlineStore: OnlineStorePage;

  test.beforeEach(async ({ conf, dashboard, token }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    authConfig = {
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    };

    const domainShop = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, domainShop);
    templateStore = new TemplateStorePage(dashboard);
    library = new WbLibrary(dashboard, domainShop);
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    onlineStore = new OnlineStorePage(dashboard, domainShop);

    await test.step("Go to Online Store > Online Store", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      const titleOfPublishTheme = await onlineStore.publishThemeTitle.innerText();
      if (!titleOfPublishTheme.includes("Copy of Casual Clothing")) {
        await publishTheme(dashboard, "Copy of Casual Clothing");
      }

      const { access_token: shopToken } = await token.getWithCredentials(authConfig);
      accessToken = shopToken;
      await themes.deleteAllThemesUnPublish(accessToken);

      if (conf.caseName === "SB_WEB_BUILDER_SAT_SWAT_01") {
        await onlineStore.createNew("Themes", "Inside");
        await onlineStore.createNew("Themes", "Criadora");
      }
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_01 Web template_Check UI popup Add new web template`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Click dropdown action của publish theme`, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await expect(dashboard.locator(xpathSaveAsTemplateInAction)).toBeVisible();
    });

    await test.step(`Click Save as template`, async () => {
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
      await expect(dashboard.locator("//input[@placeholder='Template name']")).toBeVisible();
      await expect(dashboard.locator("//input[@placeholder='Choose library']")).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: popupSaveAsTemplate,
        snapshotName: conf.caseConf.expect.snapshot_popup_save_as_template,
        combineOptions: { maxDiffPixelRatio: 0.01 },
      });
      //close popup
      await dashboard.locator(".sb-popup__header-close").click();
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeHidden();
    });

    await test.step(`Click action button của theme v3 không publish`, async () => {
      await dashboard.locator(xpathActionByShopThemeName(conf.caseConf.theme_v3)).click({ timeout: 5000 });
      await expect(dashboard.locator(xpathSaveAsTemplateInAction)).toBeVisible();
    });

    await test.step(`Click Save as template`, async () => {
      await dashboard.locator(xpathSaveAsTemplateInAction).click();
      await expect(dashboard.locator("//input[@placeholder='Template name']")).toBeVisible();
      await expect(dashboard.locator("//input[@placeholder='Choose library']")).toBeVisible();
      await snapshotFixture.verify({
        page: dashboard,
        selector: popupSaveAsTemplate,
        snapshotName: conf.caseConf.expect.snapshot_popup_save_as_template,
        combineOptions: { maxDiffPixelRatio: 0.01 },
      });
      //close popup
      await dashboard.locator(btnCancelPopupSaveAs).click();
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeHidden();
    });

    await test.step(`Click action button của theme v2 không publish`, async () => {
      await dashboard.locator(xpathActionByShopThemeName(conf.caseConf.theme_v2)).click();
      await expect(dashboard.locator(xpathSaveAsTemplateInAction)).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_02 Web template_Check trường Template name trong popup Save web as template`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Precondition: Click Action, Save as template `, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
    });

    for (const data of conf.caseConf.input_data) {
      await test.step(`Step : Nhập các giá trị của template name`, async () => {
        await inputSaveAsTemplate(dashboard, data);
      });
      await test.step(`Nhấn save`, async () => {
        await dashboard.locator(btnSavePopupSaveAs).click();

        if (data.template_name === "") {
          await expect(dashboard.locator(".sb-form-item__message")).toHaveText(data.expected.ex_message_err);
        } else {
          await expect(dashboard.locator(".sb-toast__message--pr12")).toContainText(
            `Save ${data.expected.exp_template_name} as a template to ${data.library}  successfully`,
            { timeout: 5000 },
          );
          await expect(dashboard.locator(".sb-toast__message").getByRole("link")).toContainText(`Open library`, {
            timeout: 5000,
          });
          await dashboard.waitForTimeout(2000);
        }
      });
    }
    await test.step(`After: delete template,`, async () => {
      await library.editLibrary(conf.caseConf.library);
      await dashboard.locator(".sb-relative > span > .sb-button").first().click();
      await dashboard.getByRole("tooltip").getByText("Delete").click();
      await dashboard.getByRole("button", { name: "Delete template" }).click();
      await expect(dashboard.getByText("Delete template successfully")).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_03 Web template_Check trường Libary trong popup Save web as template khi tạo/sửa/xóa library`, async ({
    dashboard,
    conf,
    builder,
  }) => {
    await test.step(`Tạo thêm Library 02 cho shop, mở lại popup Save as web template của publish theme`, async () => {
      await builder.createLibrary(conf.caseConf.pre_condition);
      await dashboard.reload();
      await dashboard.waitForLoadState("networkidle");
    });

    await test.step(` Click Action, Save as template `, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
    });
    await test.step(`Click textbox`, async () => {
      await dashboard.getByPlaceholder("Choose library").click();
      await expect(
        dashboard.locator(
          `(//div[ @role="tooltip" and not(contains(@style, 'display: none'))]//div[normalize-space()='${conf.caseConf.expect_lib}'])[last()]`,
        ),
      ).toBeVisible();
    });

    await test.step(`Bỏ trống library name`, async () => {
      await inputSaveAsTemplate(dashboard, conf.caseConf.data);
      await dashboard.locator(btnSavePopupSaveAs).click();
      await expect(dashboard.locator(".sb-form-item__message")).toHaveText(conf.caseConf.data.expected.ex_message_err);
    });

    await test.step(`Sửa tên library 02, mở lại popup Save as web template của publish theme`, async () => {
      await dashboard.locator(".sb-popup__header > .sb-absolute").click();
      await dashboard.getByRole("button", { name: "Edit" }).first().click();
      await dashboard.waitForTimeout(2 * 1000);
      await dashboard.getByPlaceholder("Library name").fill(conf.caseConf.lib_edit);
      await dashboard.getByRole("button", { name: "Save library" }).click();
      await dashboard.getByRole("link", { name: "Design" }).click();
      await dashboard.getByRole("button", { name: "Actions" }).click();
      await dashboard
        .getByRole("tooltip", { name: "Edit language Rename Duplicate Mark as Public Save as template" })
        .getByText("Save as template")
        .click();
      await dashboard.getByPlaceholder("Choose library").click();
      await expect(
        dashboard.locator(
          `(//div[ @role="tooltip" and not(contains(@style, 'display: none'))]//div[normalize-space()='${conf.caseConf.lib_edit}'])[last()]`,
        ),
      ).toBeVisible();
      await expect(
        dashboard.locator(
          `(//div[ @role="tooltip" and not(contains(@style, 'display: none'))]//div[normalize-space()='${conf.caseConf.expect_lib}'])[last()]`,
        ),
      ).toBeHidden();
    });

    await test.step(`Xóa library 02 edit, mở lại popup Save as web template của publish theme`, async () => {
      await dashboard.locator(".sb-popup__header > .sb-absolute").click();
      await dashboard.getByRole("button", { name: "Delete" }).first().click();
      await dashboard.getByRole("button", { name: "Delete library" }).click();
      await dashboard.getByRole("button", { name: "Actions" }).click();
      await dashboard
        .getByRole("tooltip", { name: "Edit language Rename Duplicate Mark as Public Save as template" })
        .getByText("Save as template")
        .click();
      await dashboard.getByPlaceholder("Choose library").click();
      await expect(
        dashboard.locator(
          `(//div[ @role="tooltip" and not(contains(@style, 'display: none'))]//div[normalize-space()='${conf.caseConf.lib_edit}'])[last()]`,
        ),
      ).toBeHidden();
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_04 Web template_Check thêm mới library ngay tại popup save web as template`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(` Click Action, Save as template `, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
    });

    await test.step(`Nhập tên library mới`, async () => {
      await dashboard.getByPlaceholder("Choose library").click();
      await dashboard.getByPlaceholder("Choose library").fill(conf.caseConf.lib_title);
      await expect(dashboard.getByText(`Add "${conf.caseConf.lib_title}"`)).toBeVisible();
    });

    await test.step(`Click add library`, async () => {
      await dashboard.getByText(`Add "${conf.caseConf.lib_title}"`).click();
      await expect(dashboard.getByPlaceholder("Choose library")).toHaveValue(conf.caseConf.lib_title);
    });

    await test.step(`Điền các trường khác đủ, nhấn save`, async () => {
      await dashboard.getByPlaceholder("Template name").fill(conf.caseConf.lib_title);
      await dashboard.locator(btnSavePopupSaveAs).click();
      await expect(dashboard.locator(".sb-toast__message").getByRole("link")).toContainText(`Open library`);
    });

    await test.step(`Click Open library`, async () => {
      await dashboard.getByRole("link", { name: "Open library" }).click();
      await expect(dashboard.getByPlaceholder("Library name")).toHaveValue(conf.caseConf.lib_title);
    });

    await test.step(`After : Xóa library 02 edit, mở lại popup Save as web template của publish theme`, async () => {
      await dashboard.getByRole("link", { name: "Design" }).click();
      await dashboard.getByRole("button", { name: "Delete" }).first().click();
      await dashboard.getByRole("button", { name: "Delete library" }).click();
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_07 Web template_Check trường Store type trong popup save web as template`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Check Store type`, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
      await expect(dashboard.locator("label").filter({ hasText: "E-commerce" }).locator("span").first()).toBeChecked();
    });

    await test.step(`Untick E-commerce`, async () => {
      await dashboard.locator("label").filter({ hasText: "E-commerce" }).locator("span").first().click();
      await dashboard.getByText("Store type", { exact: true }).click();
      await dashboard.waitForTimeout(3000);
      await expect(dashboard.getByText("Please choose store type")).toBeVisible();
    });

    await test.step(`Tick Creator`, async () => {
      await dashboard.locator("label").filter({ hasText: "Creator" }).locator("span").first().click();
      await dashboard.getByText("Store type", { exact: true }).click();
      await dashboard.waitForTimeout(3000);
      await expect(dashboard.getByText("Please choose store type")).toBeHidden();
    });

    await test.step(`Tick E-commerce`, async () => {
      await dashboard.locator("label").filter({ hasText: "E-commerce" }).locator("span").first().click();
      await expect(dashboard.locator("label").filter({ hasText: "E-commerce" }).locator("span").first()).toBeChecked();
      await expect(dashboard.locator("label").filter({ hasText: "Creator" }).locator("span").first()).toBeChecked();
    });

    await test.step(`Điền các trường khác đủ, nhấn save`, async () => {
      await dashboard.getByPlaceholder("Template name").fill(conf.caseConf.template_name);
      await dashboard.getByPlaceholder("Choose library").click();
      await dashboard.getByText(conf.caseConf.library).nth(2).click();
      await dashboard.getByPlaceholder("Dropship, Clothes, Home and garden,..").click();
      await dashboard.locator(".sb-selection > div > div:nth-child(2) > .sb-checkbox > .sb-check").click();
      await dashboard.getByRole("button", { name: "Save" }).click();
      await expect(dashboard.locator(".sb-toast__message").getByRole("link")).toContainText(`Open library`);
    });

    await test.step(`After: delete template,`, async () => {
      await library.editLibrary(conf.caseConf.library);
      await dashboard.locator(".sb-relative > span > .sb-button").first().click();
      await dashboard.getByRole("tooltip").getByText("Delete").click();
      await dashboard.getByRole("button", { name: "Delete template" }).click();
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_08 Web template_Check trường preview images desktop`, async ({ dashboard, conf }) => {
    await test.step(`Check hiển thị trường Upload desktop image trên popup`, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
      await expect(dashboard.getByText("Recommend size: 876x623px")).toBeVisible();
      await expect(dashboard.locator(getXpathUploadFileBtn("Desktop"))).toBeVisible();
    });

    await test.step(`Check tải ảnh không đúng định dạng, không đúng size`, async () => {
      await dashboard.setInputFiles(getXpathInputPreview("Desktop"), conf.caseConf.file_over_2MB);
      await expect(dashboard.getByText("This file exceeds 2MB")).toBeVisible();
    });

    await test.step(`Check tải ảnh đúng định dạng, đúng size, đúng tỷ lệ recommend `, async () => {
      await dashboard.locator(".upload-error").first().click();
      await uploadImgPreview(dashboard, "Desktop", conf.caseConf.file_preview_desktop);
      await dashboard.waitForTimeout(2000);
      await expect(dashboard.getByText("This file exceeds 2MB")).toBeHidden();
      await expect(dashboard.locator("#modal-save-as-template img")).toBeVisible();
      await dashboard.waitForTimeout(5000);
      await expect(dashboard.locator(".sb-spinner")).toBeHidden();
    });

    await test.step(`Không nhấn save, xóa ảnh trên popup`, async () => {
      await dashboard.locator("#modal-save-as-template img").hover();
      await dashboard.locator(".sb-flex > span > .sb-button").click();
      await expect(dashboard.locator(getXpathUploadFileBtn("Desktop"))).toBeVisible();
    });

    await test.step(`Upload ảnh hợp lệ`, async () => {
      await uploadImgPreview(dashboard, "Desktop", conf.caseConf.file_preview_desktop);
    });

    await test.step(`Điền các trường khác đủ, nhấn save`, async () => {
      await dashboard.getByPlaceholder("Template name").fill(conf.caseConf.template_name);
      await dashboard.getByPlaceholder("Choose library").click();
      await dashboard.getByText(conf.caseConf.library).nth(2).click();
      await dashboard.getByPlaceholder("Dropship, Clothes, Home and garden,..").click();
      await dashboard.locator(".sb-selection > div > div:nth-child(2) > .sb-checkbox > .sb-check").click();
      await dashboard.getByRole("button", { name: "Save" }).click();
      await expect(dashboard.locator(".sb-toast__message").getByRole("link")).toContainText(`Open library`);
    });

    await test.step(`Online store>Design> add theme base Web template 03, publish theme vừa add`, async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await dashboard.getByRole("button", { name: "Browse templates" }).click();
      await dashboard.locator(templateStore.xpathLoading).first().waitFor({ state: "hidden" });
      await dashboard.waitForTimeout(2 * 1000); //wait for page stable
      await dashboard.getByRole("button", { name: "Your templates" }).click();
      await dashboard.locator(".sb-tooltip__reference > .sb-ml-small").first().hover();
      await dashboard.locator(".sb-tooltip__reference > .sb-ml-small").first().click();
      await dashboard.waitForSelector("//*[normalize-space() = 'Apply template successfully']");
      await expect(dashboard.getByText(conf.caseConf.template_name).first()).toBeVisible();
      await expect(dashboard.getByText("Just added")).toBeVisible();
    });

    await test.step(`After: delete template,`, async () => {
      await removeFirstTheme(dashboard);
      await library.editLibrary(conf.caseConf.library);
      await dashboard.locator(".sb-relative > span > .sb-button").first().click();
      await dashboard.getByRole("tooltip").getByText("Delete").click();
      await dashboard.getByRole("button", { name: "Delete template" }).click();
      await expect(dashboard.getByText("Delete template successfully")).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_09 Web template_Check trường preview images mobile`, async ({ dashboard, conf }) => {
    await test.step(`Check hiển thị trường Upload desktop image trên popup`, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
      await expect(dashboard.getByText("Recommend size: 294x523px")).toBeVisible();
      await expect(dashboard.locator(getXpathUploadFileBtn("Mobile"))).toBeVisible();
    });

    await test.step(`Check tải ảnh không đúng định dạng, không đúng size`, async () => {
      await dashboard.setInputFiles(getXpathInputPreview("Mobile"), conf.caseConf.file_over_2MB);
      await expect(dashboard.getByText("This file exceeds 2MB")).toBeVisible();
    });

    await test.step(`Check tải ảnh đúng định dạng, đúng size, đúng tỷ lệ recommend `, async () => {
      await dashboard.locator("div:nth-child(2) > .upload-error > .upload-error-content").click();
      await uploadImgPreview(dashboard, "Mobile", conf.caseConf.file_preview_mobile);
      await dashboard.waitForTimeout(2000);
      await expect(dashboard.getByText("This file exceeds 2MB")).toBeHidden();
      await expect(dashboard.locator("#modal-save-as-template img")).toBeVisible();
      await dashboard.waitForTimeout(5000);
      await expect(dashboard.locator(".sb-spinner")).toBeHidden();
    });

    await test.step(`Không nhấn save, xóa ảnh trên popup`, async () => {
      await dashboard.locator("#modal-save-as-template img").hover();
      await dashboard.locator(".sb-flex > span > .sb-button").click();
      await expect(dashboard.locator(getXpathUploadFileBtn("Mobile"))).toBeVisible();
    });

    await test.step(`Upload ảnh hợp lệ`, async () => {
      await uploadImgPreview(dashboard, "Mobile", conf.caseConf.file_preview_mobile);
    });

    await test.step(`Điền các trường khác đủ, nhấn save`, async () => {
      await dashboard.getByPlaceholder("Template name").fill(conf.caseConf.template_name);
      await dashboard.getByPlaceholder("Choose library").click();
      await dashboard.getByText(conf.caseConf.library).nth(2).click();
      await dashboard.getByPlaceholder("Dropship, Clothes, Home and garden,..").click();
      await dashboard.locator(".sb-selection > div > div:nth-child(2) > .sb-checkbox > .sb-check").click();
      await dashboard.getByRole("button", { name: "Save" }).click();
      await expect(dashboard.locator(".sb-toast__message").getByRole("link")).toContainText(`Open library`);
    });

    await test.step(`Online store>Design> add theme base Web template 03, publish theme vừa add`, async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await dashboard.getByRole("button", { name: "Browse templates" }).click();
      await dashboard.locator(templateStore.xpathLoading).first().waitFor({ state: "hidden" });
      await dashboard.waitForTimeout(2 * 1000); //wait for page stable
      await dashboard.getByRole("button", { name: "Your templates" }).click();
      await dashboard.locator(".sb-tooltip__reference > .sb-ml-small").first().hover();
      await dashboard.locator(".sb-tooltip__reference > .sb-ml-small").first().click();
      await dashboard.waitForSelector("//*[normalize-space() = 'Apply template successfully']");
      await expect(dashboard.getByText(conf.caseConf.template_name).first()).toBeVisible();
      await expect(dashboard.getByText("Just added")).toBeVisible();
    });

    await test.step(`After: delete template,`, async () => {
      await removeFirstTheme(dashboard);
      await library.editLibrary(conf.caseConf.library);
      await dashboard.locator(".sb-relative > span > .sb-button").first().click();
      await dashboard.getByRole("tooltip").getByText("Delete").click();
      await dashboard.getByRole("button", { name: "Delete template" }).click();
      await expect(dashboard.getByText("Delete template successfully")).toBeVisible();
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_10 Web template_Check trường preview images thumbnail in library`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Check hiển thị trường Upload Thumbnail Library image trên popup`, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
      await expect(dashboard.getByText("Recommend size: 592x592px")).toBeVisible();
      await expect(dashboard.locator(getXpathUploadFileBtn("Thumbnail Library"))).toBeVisible();
    });

    await test.step(`Check tải ảnh không đúng định dạng, không đúng size`, async () => {
      await dashboard.setInputFiles(getXpathInputPreview("Thumbnail Library"), conf.caseConf.file_over_2MB);
      await expect(dashboard.getByText("This file exceeds 2MB")).toBeVisible();
    });

    await test.step(`Check tải ảnh đúng định dạng, đúng size, đúng tỷ lệ recommend `, async () => {
      await dashboard.locator("div:nth-child(3) > .upload-error > .upload-error-content").click();
      await uploadImgPreview(dashboard, "Thumbnail Library", conf.caseConf.file_preview_thumbnail);
      await dashboard.waitForTimeout(2000);
      await expect(dashboard.getByText("This file exceeds 2MB")).toBeHidden();
      await expect(dashboard.locator("#modal-save-as-template img")).toBeVisible();
      await dashboard.waitForTimeout(5000);
      await expect(dashboard.locator(".sb-spinner")).toBeHidden();
    });

    await test.step(`Không nhấn save, xóa ảnh trên popup`, async () => {
      await dashboard.locator("#modal-save-as-template img").hover();
      await dashboard.locator(".sb-flex > span > .sb-button").click();
      await expect(dashboard.locator(getXpathUploadFileBtn("Thumbnail Library"))).toBeVisible();
    });

    await test.step(`Upload ảnh hợp lệ`, async () => {
      await uploadImgPreview(dashboard, "Thumbnail Library", conf.caseConf.file_preview_thumbnail);
    });

    await test.step(`Điền các trường khác đủ, nhấn save`, async () => {
      await dashboard.getByPlaceholder("Template name").fill(conf.caseConf.template_name);
      await dashboard.getByPlaceholder("Choose library").click();
      await dashboard.getByText(conf.caseConf.library).nth(2).click();
      await dashboard.getByPlaceholder("Dropship, Clothes, Home and garden,..").click();
      await dashboard.locator(".sb-selection > div > div:nth-child(2) > .sb-checkbox > .sb-check").click();
      await dashboard.getByRole("button", { name: "Save" }).click();
      await expect(dashboard.locator(".sb-toast__message").getByRole("link")).toContainText(`Open library`);
    });

    await test.step(`Online store>Design> add theme base Web template 03`, async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await dashboard.getByRole("button", { name: "Browse templates" }).click();
      await dashboard.locator(templateStore.xpathLoading).first().waitFor({ state: "hidden" });
      await dashboard.waitForTimeout(2 * 1000); //wait for page stable
      await dashboard.getByRole("button", { name: "Your templates" }).click();
      await dashboard.locator(".sb-tooltip__reference > .sb-ml-small").first().hover();
      await dashboard.locator(".sb-tooltip__reference > .sb-ml-small").first().click();
      await dashboard.waitForSelector("//*[normalize-space() = 'Apply template successfully']");
      await expect(dashboard.getByText(conf.caseConf.template_name).first()).toBeVisible();
      await expect(dashboard.getByText("Just added")).toBeVisible();
    });

    await test.step(`After: delete template,`, async () => {
      await removeFirstTheme(dashboard);
      await library.editLibrary(conf.caseConf.library);
      await dashboard.locator(".sb-relative > span > .sb-button").first().click();
      await dashboard.getByRole("tooltip").getByText("Delete").click();
      await dashboard.getByRole("button", { name: "Delete template" }).click();
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_11 Web template_Check lưu template vào library detail khi save web template`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Nhập đủ các trường hợp lệ trong popup, nhấn save`, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();

      await dashboard.getByPlaceholder("Template name").fill(conf.caseConf.template_name);
      await dashboard.getByPlaceholder("Choose library").click();
      await dashboard.getByText(conf.caseConf.library).nth(2).click();
      await dashboard.getByPlaceholder("Dropship, Clothes, Home and garden,..").click();
      await dashboard.locator(".sb-selection > div > div:nth-child(2) > .sb-checkbox > .sb-check").click();
      await dashboard.getByRole("button", { name: "Save" }).click();
      await expect(dashboard.locator(".sb-toast__message").getByRole("link")).toContainText(`Open library`);
    });

    await test.step(`Click Open library`, async () => {
      await dashboard.getByRole("link", { name: "Open library" }).click();
      await expect(dashboard.getByPlaceholder("Library name")).toHaveValue(conf.caseConf.library);
    });

    await test.step(`Check hiển thị template vừa add trong library detail`, async () => {
      await expect(dashboard.getByText(conf.caseConf.template_name).first()).toBeVisible();
      await expect(dashboard.locator(".sb-switch__switch").first()).toBeChecked();
      await expect(dashboard.locator(".card-template__badge").first()).toContainText("Just added");
    });

    await test.step(`Reload dashboard page`, async () => {
      await dashboard.reload();
      await dashboard.waitForLoadState("networkidle");
    });

    await test.step(`Click vào Web template 03 trong library detail`, async () => {
      await dashboard.locator(".card-template__image--actions").first().click();
      await expect(dashboard.locator(".card-template").first()).not.toContainText("Just added");
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_12 Web template_Check UI popup Browse templates khi muốn sử dụng web template đã tạo`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Click button Browse templates http://joxi.ru/DmB6RLKC6Kzz5m  `, async () => {
      await dashboard.getByRole("button", { name: "Browse templates" }).click();
      await expect(dashboard.getByText("Unlock the Power of Premium Templates")).toBeVisible();
      await expect(
        dashboard.getByText(
          "Effortlessly customizable with ShopBase Web Builder. No coding or design skills needed, packed with built-in apps. All at Zero Cost.",
        ),
      ).toBeVisible();
      await dashboard
        .locator(
          `//div[contains(@class, 'sb-choose-template-v2__filter--wrapper')]//span[contains(@class, 'sb-input__prefix')]`,
        )
        .click();
      await expect(dashboard.getByPlaceholder('Try "Pets, .."')).toBeVisible();
      await expect(dashboard.locator("#filtersEl")).toBeVisible();
    });

    await test.step(`Check hiển thị các item trên popup`, async () => {
      await expect(dashboard.locator(".sb-choose-template__templates")).toBeVisible();
      await expect(dashboard.locator(templateStore.xpathNumberOfTemplates)).toBeVisible();
    });

    await test.step(`Hover vào item`, async () => {
      await dashboard.getByRole("button", { name: "Your templates" }).click();
      await dashboard.locator(".sb-choose-template__template img").first().hover();
      await expect(dashboard.locator("span > .sb-w-100").first()).toBeVisible();
      await expect(
        dashboard
          .locator(`//img[@alt = '${conf.caseConf.template_name}']//following-sibling::figcaption//button`)
          .first(),
      ).toBeVisible();
    });

    await test.step(`Check click vào icon preview`, async () => {
      await templateStore.previewTemplate(conf.caseConf.template_name);
      await expect(dashboard.locator(".template-preview")).toBeVisible();
      await expect(
        dashboard.locator("//div[@class='template-preview']//button[normalize-space()='Apply']"),
      ).toBeVisible();
      await expect(dashboard.locator(".template-preview__header-left--back")).toBeVisible();
    });

    await test.step(`Switch sang view mobile`, async () => {
      await templateStore.switchDevice("Mobile");
      await expect(dashboard.locator(".template-preview__body.is-mobile")).toBeVisible();
    });

    await test.step(`Click Apply button`, async () => {
      await dashboard.locator("//div[@class='template-preview']//button[normalize-space()='Apply']").click();
      await expect(dashboard.getByText("Apply template successfully")).toBeVisible();
      await expect(dashboard.getByText(conf.caseConf.template_name).first()).toBeVisible();
      await expect(dashboard.getByText("Just added")).toBeVisible();
    });

    await test.step(`Click customize theme mới add`, async () => {
      await customizeTheme(dashboard, conf.caseConf.template_name);
    });

    await test.step(`Back về dashboard theme`, async () => {
      await dashboard.getByTestId("exit").click();
      expect(dashboard.url()).toContain("/admin/themes");
    });

    await test.step(`Remove theme`, async () => {
      await removeFirstTheme(dashboard);
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_13 Web template_Check click Add template tại Browse templates popup`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Hover vào item Web template 03`, async () => {
      await dashboard.getByRole("button", { name: "Browse templates" }).click();
      await dashboard.locator(templateStore.xpathLoading).first().waitFor({ state: "hidden" });
      await dashboard.waitForTimeout(2 * 1000); //wait for page stable
      await dashboard.getByRole("button", { name: "Your templates" }).click();
      await dashboard.locator(".sb-choose-template__template img").first().hover();
      await expect(dashboard.locator("span > .sb-w-100").first()).toBeVisible();
      await expect(
        dashboard
          .locator(`//img[@alt = '${conf.caseConf.template_name}']//following-sibling::figcaption//button`)
          .first(),
      ).toBeVisible();
    });

    await test.step(`Click Add template`, async () => {
      try {
        await templateStore.previewTemplate(conf.caseConf.template_name);
      } catch (error) {
        await dashboard.locator(".template-preview__header-left--back").click();
        await templateStore.previewTemplate(conf.caseConf.template_name);
      }
      await dashboard.locator("//div[@class='template-preview']//button[normalize-space()='Apply']").click();
      await expect(dashboard.getByText("Apply template successfully")).toBeVisible();
      await expect(dashboard.getByText(conf.caseConf.template_name).first()).toBeVisible();
      await expect(dashboard.getByText("Just added")).toBeVisible();
    });

    await test.step(`Click customize theme mới add`, async () => {
      await customizeTheme(dashboard, conf.caseConf.template_name);
      await dashboard.waitForLoadState("networkidle");
    });

    await test.step(`Click preview theme`, async () => {
      await dashboard.getByTestId("preview").click();
      //verify data đúng, chưa nghĩ ra sol
    });

    await test.step(`After: delete template, publish theme v3`, async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
      await library.editLibrary(conf.caseConf.library);
      await dashboard.locator(".sb-relative > span > .sb-button").first().click();
      await dashboard.getByRole("tooltip").getByText("Delete").click();
      await dashboard.waitForTimeout(2 * 1000);
      await dashboard.getByRole("button", { name: "Delete template" }).click();
      await expect(dashboard.getByText("Delete template successfully")).toBeVisible();
      await dashboardPage.navigateToMenu("Online Store");
    });
  });

  test(`@SB_WEB_BUILDER_SAT_SWAT_24 Check bỏ trống các trường image trong Save web as template popup`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Không tải ảnh cả 3 field Desktop, Mobile, Thumbnail in library, điền đầy đủ các trường khác`, async () => {
      await dashboard.locator(xpathActionFirst).click();
      await dashboard.locator(xpathSaveAsTemplateInAction).click({ timeout: 4000 });
      await expect(dashboard.locator(popupSaveAsTemplate)).toBeVisible();
      await dashboard.getByPlaceholder("Template name").fill(conf.caseConf.template_name);
      await dashboard.getByPlaceholder("Choose library").click();
      await dashboard.getByText(conf.caseConf.library).nth(2).click();
      await dashboard.getByPlaceholder("Dropship, Clothes, Home and garden,..").click();
      await dashboard.locator(".sb-selection > div > div:nth-child(2) > .sb-checkbox > .sb-check").click();
      await expect(dashboard.getByRole("button", { name: "Save" })).toBeEnabled();
    });

    await test.step(`nhấn save`, async () => {
      await dashboard.getByRole("button", { name: "Save" }).click();
      await expect(dashboard.locator(".sb-toast__message").getByRole("link")).toContainText(`Open library`);
      await dashboard.locator(".sb-toast__message").getByRole("link").waitFor({ state: "hidden" });
    });

    await test.step(`Online store>Design> add theme base Web template 03`, async () => {
      await dashboard.getByRole("button", { name: "Browse templates" }).click();
      await dashboard.locator(templateStore.xpathLoading).first().waitFor({ state: "hidden" });
      await dashboard.waitForTimeout(2 * 1000); //wait for page stable
      await dashboard.getByRole("button", { name: "Your templates" }).click();
      await dashboard.locator(".sb-choose-template__template img").first().hover();
      try {
        await templateStore.previewTemplate(conf.caseConf.template_name);
      } catch (error) {
        await dashboard.locator(".template-preview__header-left--back").click();
        await templateStore.previewTemplate(conf.caseConf.template_name);
      }
      await dashboard.locator("//div[@class='template-preview']//button[normalize-space()='Apply']").click();
      await expect(dashboard.getByText("Apply template successfully")).toBeVisible();
      await dashboard.getByText("Apply template successfully").waitFor({ state: "detached" });
      await snapshotFixture.verify({
        page: dashboard,
        selector: "(//div[@class='page-designs__theme']/div)[1]",
        snapshotName: "preview_add_template.png",
        combineOptions: { maxDiffPixelRatio: 0.01 },
      });
    });

    await test.step(`Publish theme vừa add`, async () => {
      await publishTheme(dashboard, conf.caseConf.template_name);
      await snapshotFixture.verify({
        page: dashboard,
        selector: dashboardPage.xpathPreviewPushTemplate,
        snapshotName: "preview_push_template.png",
        combineOptions: { maxDiffPixelRatio: 0.01 },
      });
    });

    await test.step(`Online store>Design> Library 03: web template tab`, async () => {
      await library.editLibrary(conf.caseConf.library);
      await snapshotFixture.verify({
        page: dashboard,
        selector: "(//div[contains(@class,'card-template')])[1]",
        snapshotName: "preview_lib_template.png",
        combineOptions: { maxDiffPixelRatio: 0.01 },
      });
    });

    await test.step(`After: delete template, publish theme v3`, async () => {
      await dashboard.locator(".sb-relative > span > .sb-button").first().click();
      await dashboard.getByRole("tooltip").getByText("Delete").click();
      await dashboard.getByRole("button", { name: "Delete template" }).click();
      await expect(dashboard.getByText("Delete template successfully")).toBeVisible();
      await dashboardPage.navigateToMenu("Online Store");
      await publishTheme(dashboard, "Copy of Casual Clothing");
    });
  });
});
