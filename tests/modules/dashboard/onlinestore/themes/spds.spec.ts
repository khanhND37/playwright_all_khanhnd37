import merge from "lodash.merge";
import { expect } from "@core/fixtures";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { test } from "@fixtures/theme";
import type { ClickEyeIcon, GetThemeBlock, ShopTheme, ThemeBlock, ThemeSection } from "@types";
import { Page } from "@playwright/test";
import { verifyRedirectUrl } from "@utils/theme";
import { removeAllKeys } from "@utils/object";

/*
Data:
- products: product 1
 */

let shopTheme: ShopTheme;

/**
 * Get block in section of shop theme
 * @param args
 */
const getSectionBlock = async (args: GetThemeBlock): Promise<ThemeSection | ThemeBlock> => {
  let path;
  let response;
  if (args.settingsData) {
    response = { settings_data: args.settingsData };
  } else {
    response = await args.theme.single(args.id);
  }

  const sections = response.settings_data.pages[args.page].default;
  const indexSection = sections.findIndex(section => section.type === args.section);

  if (indexSection !== -1) {
    if (args.block) {
      const indexBlock = sections[indexSection].blocks.findIndex(block => block.type === args.block);

      if (indexBlock !== -1) {
        path = sections[indexSection].blocks[indexBlock];
      } else {
        throw Error("Error: Data block error");
      }
    } else {
      path = sections[indexSection];
    }
  } else {
    throw Error("Error: Data section error");
  }

  return path;
};

/**
 * Click and verify checkbox checked or unchecked status
 * @param page
 * @param currentStatus
 * @param field
 */
const verifyCheckBox = async (page: Page, currentStatus: boolean, field: string) => {
  await page.locator(`[data-key=${field}]`).click();
  const newStatus = Boolean(await page.locator(`[data-key=${field}] input:checked`).count());

  expect(newStatus).toEqual(!currentStatus);
  return newStatus;
};

/**
 * Click and verify block show or hide
 * @param args
 */
const verifyClickShowHideBlock = async (args: ClickEyeIcon) => {
  await args.page.locator(`[data-block-label='${args.block}'] >> nth=0`).hover();
  await args.page.locator(`:nth-match([data-block-label='${args.block}'], 1) [data-block-action='visible']`).click();

  const newStatus = !(await args.page.locator(`[data-block-label='${args.block}'].theme-editor-v2__is-hidden`).count());
  expect(newStatus).toEqual(!args.currentStatus);

  const iconEye = newStatus ? "Icons/Eye" : "Icons/Eye-Cross";

  await expect(await args.page.locator(`[data-block-label='${args.block}'] [id$="${iconEye}"]`)).toBeVisible();
  return newStatus;
};

/**
 * Click and verify section show or hide
 * @param args
 */
const verifyClickShowHideSection = async (args: ClickEyeIcon) => {
  await args.page.locator(`[data-section-label='${args.section}'] .theme-editor-v2__section >> nth=0`).hover();
  await args.page
    .locator(`:nth-match([data-section-label='${args.section}'] .theme-editor-v2__section, 1) [id*="Eye"]`)
    .click();

  const newStatus = !(await args.page
    .locator(`[data-section-label='${args.section}'].theme-editor-v2__is-hidden`)
    .count());
  expect(newStatus).toEqual(!args.currentStatus);

  const iconEye = newStatus ? "Icons/Eye" : "Icons/Eye-Cross";

  await expect(
    await args.page.locator(
      `:nth-match([data-section-label='${args.section}'] .theme-editor-v2__section, 1) [id$="${iconEye}"]`,
    ),
  ).toBeVisible();
  return newStatus;
};

/**
 * Click and verify section collapse or expand
 * @param page
 * @param section
 * @param isCollapse
 */
const verifyCollapse = async (page: Page, section: string, isCollapse: boolean) => {
  await page.hover(`[data-section-label=${section}] .theme-editor-v2__section`);
  await page.click(`[data-section-label=${section}] .theme-editor-v2__section .theme-editor-v2__element-icon`);

  if (!isCollapse) {
    await page.hover(`[data-section-label=${section}] .theme-editor-v2__section`);
    await expect(
      await page.locator(`[data-section-label=${section}] .theme-editor-v2__section [id$="/Right"]`),
    ).toBeVisible();
    await expect(await page.locator(`[data-section-label=${section}] .theme-editor-v2__section-child`)).toBeHidden();
  } else {
    await page.hover(`[data-section-label=${section}] .theme-editor-v2__section`);
    await expect(
      await page.locator(`[data-section-label=${section}] .theme-editor-v2__section [id$="/Down"]`),
    ).toBeVisible();
    await expect(await page.locator(`[data-section-label=${section}] .theme-editor-v2__section-child`)).toBeVisible();
  }
  return !isCollapse;
};

const waitForToastHidden = async (page: Page) => {
  await page.waitForSelector(".sb-toast__message", {
    state: "hidden",
  });
};

test.describe("Verify elements of SPDS", () => {
  test.beforeAll(async ({ theme }) => {
    shopTheme = await theme.getPublishedTheme();
    shopTheme = await theme.single(shopTheme.id);
  });

  test("Pre-condition: Setting theme @TC_PRE_CONDITION", async ({ theme, conf }) => {
    for (const data of conf.caseConf.data) {
      shopTheme = await theme.updateThemeSettings({
        shopThemeId: shopTheme.id,
        settingsData: shopTheme.settings_data,
        updateSections: data,
      });
    }
  });

  test("@SB_OLS_THE_INS_DB_SPDS_1 Check element upload and textbox", async ({ dashboard, conf, theme }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;
    const sectionType = conf.caseConf.data.section_type;
    const block = conf.caseConf.data.block;
    const blockType = conf.caseConf.data.block_type;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);
    await themeDashboard.openSectionBlock(section, block);

    await test.step("Check element upload", async () => {
      for (const image of conf.caseConf.data.images) {
        const uploadedImage = await dashboard.locator(".theme-editor-v2__image img").count();

        // If already uploaded image, remove uploaded image
        if (uploadedImage) {
          await dashboard.locator(".theme-editor-v2__image img").first().hover();
          await dashboard.locator(".theme-editor-v2__image [id$='Icons/Trash']").first().click();
        }

        // upload image
        if (image.filePath) {
          await dashboard.setInputFiles("input[type='file'] >> nth=0", image.filePath);
          await dashboard.waitForSelector(".sb-upload__image-progress-bar-container >> nth=0", { state: "hidden" });
        }

        // if alert, do not save theme
        // else, save theme and get data json and verify
        if (image.alert) {
          const text = await dashboard.locator(".sb-toast__message").textContent();
          expect(text).toEqual(image.alert);
          await waitForToastHidden(dashboard);
        } else {
          await themeDashboard.saveTheme();
          const blockData = await getSectionBlock({
            theme,
            id: shopTheme.id,
            page: previewPage,
            section: sectionType,
            block: blockType,
          });

          expect(blockData.settings[image.field]).toContain(image.image);
          await waitForToastHidden(dashboard);
        }
      }
    });

    await test.step("Check element text box", async () => {
      for (const input of conf.caseConf.data.inputs) {
        await dashboard.locator("input[type='text']").first().fill(input.text);

        await themeDashboard.saveTheme();
        const blockData = await getSectionBlock({
          theme,
          id: shopTheme.id,
          page: previewPage,
          section: sectionType,
          block: blockType,
        });

        expect(blockData.settings[input.field]).toEqual(input.text);
        await waitForToastHidden(dashboard);
      }
    });
  });

  test("@SB_OLS_THE_INS_DB_SPDS_2 Verify element Auto complete and tag", async ({ dashboard, conf, theme }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;
    const sectionType = conf.caseConf.data.section_type;
    const block = conf.caseConf.data.block;
    const blockType = conf.caseConf.data.block_type;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);
    await themeDashboard.openSectionBlock(section, block);

    await test.step("Verify element Auto complete and tag", async () => {
      for (const autoComplete of conf.caseConf.data.auto_completes.select_value) {
        // select value in auto complete
        await dashboard.locator(`[label='${autoComplete.input.label}']`).click();
        await dashboard
          .locator(
            `.sb-popover__popper:not([style*='display: none;'])                                                                                                                                                                                                                                                               [data-select-label='${autoComplete.input.type}']`,
          )
          .click();

        // If show auto complete one more time (Products, Collections, Pages ...)
        if (autoComplete.input.title) {
          await dashboard.locator(`[label='${autoComplete.input.label}']`).click();
          await dashboard
            .locator(`[label='${autoComplete.input.label}'] input >> nth=1`)
            .fill(autoComplete.input.title);
          await dashboard
            .locator(
              `.sb-popover__popper:not([style*='display: none;']) [data-select-label='${autoComplete.input.title}'] >> nth=0`,
            )
            .click();
        }

        // Verify show tags after select value auto complete
        for (const tag of autoComplete.output.tags) {
          const selectedType = await dashboard
            .locator(
              `//div[contains(@class,'sb-mb-medium') and
              descendant::label[normalize-space()='${autoComplete.input.label}']]
              //div[contains(@class,'sb-tag') and descendant::div[normalize-space()='${tag}']]
              //div[contains(@class,'sb-tag__icon')]`,
            )
            .count();
          expect(selectedType).toEqual(1);
        }

        await themeDashboard.saveTheme();
        let data = await getSectionBlock({
          theme,
          id: shopTheme.id,
          page: previewPage,
          section: sectionType,
          block: blockType,
        });
        removeAllKeys(data.settings[autoComplete.output.field] as object, "subject_id");
        removeAllKeys(autoComplete.output.value, "subject_id");
        expect(data.settings[autoComplete.output.field]).toEqual(autoComplete.output.value);
        await waitForToastHidden(dashboard);

        // click on close tag icon to remove selected value and verify
        await dashboard
          .locator(
            `(//div[contains(@class,'sb-mb-medium') and
            descendant::label[normalize-space()='${autoComplete.input.label}']]
            //div[contains(@class,'sb-tag__icon')])[1]`,
          )
          .click();
        await themeDashboard.saveTheme();

        data = await getSectionBlock({
          theme,
          id: shopTheme.id,
          page: previewPage,
          section: sectionType,
          block: blockType,
        });
        expect(data.settings[autoComplete.output.field]).toEqual(autoComplete.output.default);
        await waitForToastHidden(dashboard);
      }
    });

    await test.step("Verify search no result value in auto complete", async () => {
      for (const autoComplete of conf.caseConf.data.auto_completes.search_value) {
        // Enter key search into auto complete
        await dashboard
          .locator(`[label='${autoComplete.input.label}'] .sb-input:not([style*='display: none;']) input`)
          .click();
        await dashboard
          .locator(`[label='${autoComplete.input.label}'] .sb-input:not([style*='display: none;']) input`)
          .fill(autoComplete.input.type);

        // if alert, verify alert
        if (autoComplete.output.alert) {
          const isShowAlert = await dashboard
            .locator("#popover_autocomplete_select_link_type_image_link .sb-autocomplete__no-results")
            .count();
          expect(isShowAlert).toEqual(1);
        } else {
          // Search and select value auto complete one more time (Products, Collections, Pages ...)
          await dashboard
            .locator(
              `.sb-popover__popper:not([style*='display: none;']) [data-select-label='${autoComplete.input.type}']`,
            )
            .click();
          if (autoComplete.input.title) {
            await dashboard
              .locator(`[label='${autoComplete.input.label}'] .sb-input:not([style*='display: none;']) input`)
              .fill(autoComplete.input.title);
            await dashboard
              .locator(
                `.sb-popover__popper:not([style*='display: none;']) [data-select-label='${autoComplete.input.title}']`,
              )
              .click();
          }

          // Verify tags after select value auto complete
          for (const tag of autoComplete.output.tags) {
            const selectedType = await dashboard
              .locator(
                `//div[contains(@class,'sb-mb-medium') and
                descendant::label[normalize-space()='${autoComplete.input.label}']]
                //div[contains(@class,'sb-tag') and descendant::div[normalize-space()='${tag}']]
                //div[contains(@class,'sb-tag__icon')]`,
              )
              .count();
            expect(selectedType).toEqual(1);
          }

          // Save theme and verify json
          await themeDashboard.saveTheme();
          const data = await getSectionBlock({
            theme,
            id: shopTheme.id,
            page: previewPage,
            section: sectionType,
            block: blockType,
          });
          removeAllKeys(data.settings[autoComplete.output.field] as object, "subject_id");
          removeAllKeys(autoComplete.output.value, "subject_id");
          expect(data.settings[autoComplete.output.field]).toEqual(autoComplete.output.value);
          await waitForToastHidden(dashboard);

          // click on close tag icon to remove selected value
          await dashboard
            .locator(
              `(//div[contains(@class,'sb-mb-medium') and
              descendant::label[normalize-space()='${autoComplete.input.label}']]
              //div[contains(@class,'sb-tag__icon')])[1]`,
            )
            .click();
          await themeDashboard.saveTheme();
        }
      }
    });

    await test.step("Verify add link into auto complete", async () => {
      const autoComplete = conf.caseConf.data.auto_completes.add_link;

      // Input and add link into auto complete
      await dashboard
        .locator(`[label='${autoComplete.input.label}'] .sb-input:not([style*='display: none;']) input`)
        .click();
      await dashboard
        .locator(`[label='${autoComplete.input.label}'] .sb-input:not([style*='display: none;']) input`)
        .fill(autoComplete.input.link);

      const addLink = await dashboard
        .locator(
          "#popover_autocomplete_select_link_type_image_link .sb-autocomplete__addable-row .sb-text-body-medium-bold",
        )
        .textContent();
      expect(addLink.trim()).toEqual(autoComplete.input.link);

      await dashboard
        .locator(
          "#popover_autocomplete_select_link_type_image_link .sb-autocomplete__addable-row .sb-text-body-medium-bold",
        )
        .click();

      // Verify tag
      const selectedType = await dashboard
        .locator(
          `//div[contains(@class,'sb-mb-medium') and
          descendant::label[normalize-space()='${autoComplete.input.label}']]
          //div[contains(@class,'sb-tag') and descendant::div[normalize-space()='${autoComplete.output.tags}']]
          //div[contains(@class,'sb-tag__icon')]`,
        )
        .count();
      expect(selectedType).toEqual(1);

      // Save theme and verify json
      await themeDashboard.saveTheme();
      const data = await getSectionBlock({
        theme,
        id: shopTheme.id,
        page: previewPage,
        section: sectionType,
        block: blockType,
      });
      removeAllKeys(data.settings[autoComplete.output.field] as object, "subject_id");
      removeAllKeys(autoComplete.output.value, "subject_id");
      expect(data.settings[autoComplete.output.field]).toEqual(autoComplete.output.value);
      await waitForToastHidden(dashboard);

      // click on close tag icon to remove selected value
      await dashboard
        .locator(
          `(//div[contains(@class,'sb-mb-medium') and
          descendant::label[normalize-space()='${autoComplete.input.label}']]
          //div[contains(@class,'sb-tag__icon')])[1]`,
        )
        .click();
      await themeDashboard.saveTheme();
    });
  });

  test(`@SB_OLS_THE_INS_DB_SPDS_3 Check element color picker`, async ({ dashboard, theme, conf, cConf }) => {
    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    const previewPage = conf.caseConf.page;
    const section = conf.caseConf.section;
    const sectionType = conf.caseConf.section_type;
    const block = conf.caseConf.block;
    const blockType = conf.caseConf.block_type;

    await test.step(`Click vào block Slideshow bất kỳ `, async () => {
      await themeDashboard.openThemeEditor(shopTheme.id, previewPage);
      await themeDashboard.openSectionBlock(section, block);
    });
    await test.step(`Click vào textbox background color picker`, async () => {
      await dashboard.locator(`[label='${cConf.label}']`).click();
      await expect(dashboard.locator(themeDashboard.colorPickerPopover)).toBeVisible();
    });
    for (let i = 0; i < conf.caseConf.color_picker.length; i++) {
      const step = conf.caseConf.color_picker[i];
      await test.step(`Nhập đúng mã màu không có opacity`, async () => {
        const currentHex = await dashboard.locator(`[label='${cConf.label}'] input`).inputValue();
        if (currentHex === step.input) {
          await dashboard.locator(`[label='${cConf.label}'] input`).fill(cConf.default_hex);
        }

        await dashboard.locator(`[label='${cConf.label}'] input`).fill(step.input);
        await dashboard.locator(themeDashboard.titleEditor).click();
      });
      await test.step("Click button save, Check json trả về`", async () => {
        await themeDashboard.saveBtn.click();
        const response = await themeDashboard.waitResponseWithUrl(`/admin/themes/${shopTheme.id}.json`);
        const json = await response.json();
        const section = await getSectionBlock({
          theme,
          id: shopTheme.id,
          page: previewPage,
          section: sectionType,
          block: blockType,
          settingsData: json.shop_theme.settings_data,
        });
        expect(section.settings[cConf.field]).toEqual(step.output);
      });
    }
  });

  test("@SB_OLS_THE_INS_DB_SPDS_4 Verify text editor", async ({ dashboard, conf, theme }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);
    await themeDashboard.openSectionBlock(section);

    for (const editor of conf.caseConf.data.text_editors) {
      await test.step("Input text", async () => {
        await dashboard.waitForSelector("[title='Rich Text Area']");
        await dashboard.frameLocator("[title='Rich Text Area']").locator("#tinymce").fill(editor.input.text);
      });

      await test.step("Input image", async () => {
        if (editor.input.image) {
          // tox-tool bar is closed, click to open toolbar
          if ((await dashboard.locator(".tox-tinymce .tox-toolbar__overflow--closed").count()) === 1) {
            await dashboard.locator("[data-key='announcement_message'] [aria-label='More...']").click();
          }
          await dashboard.locator("[data-key='announcement_message'] [aria-label='Insert/edit image']").click();
          await dashboard.setInputFiles(".tox-dialog__body input[type='file']", editor.input.image);
          await dashboard.locator(".tox-dialog__footer [title='Save']").click();
          // Wait to load image
          await dashboard.waitForTimeout(500);
        }
      });

      await test.step("Input link", async () => {
        if (editor.input.link) {
          // tox-tool bar is closed, click to open toolbar
          if ((await dashboard.locator(".tox-tinymce .tox-toolbar__overflow--closed").count()) === 1) {
            await dashboard.locator("[data-key='announcement_message'] [aria-label='More...']").click();
          }

          // Input link
          await dashboard.locator("[data-key='announcement_message'] [aria-label='Insert/edit link']").click();
          await dashboard.locator(".tox-form [type='url']").fill(editor.input.link);
          await dashboard.locator(".tox-dialog__footer [title='Save']").click();
        }
        await expect(await dashboard.locator("[data-key='announcement_message']").getAttribute("data-value")).toContain(
          editor.output,
        );
        await dashboard.waitForTimeout(500);
        await themeDashboard.saveTheme();
      });

      await test.step("Verify json", async () => {
        // Verify after input text editor
        const response = await theme.single(shopTheme.id);
        const value = response.settings_data.fixed["announcement-bar"].settings.announcement_message;
        await expect(value).toContain(editor.output);
        await waitForToastHidden(dashboard);
      });
    }
  });

  test("@SB_OLS_THE_INS_DB_SPDS_5 Verify element radio button and checkbox, dropdown", async ({
    dashboard,
    conf,
    theme,
  }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;
    const sectionType = conf.caseConf.data.section_type;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);
    await themeDashboard.openSectionBlock(section);

    await test.step("Verify element radio button", async () => {
      // Checked "Settings by theme settings" if checkbox "customize" active
      const value = await dashboard.locator(themeDashboard.checkboxCustomize).isChecked();
      if (value) {
        await dashboard.locator(themeDashboard.spanCheckboxThemeSetting).click();
      }

      for (const radio of conf.caseConf.data.radio_buttons) {
        const selectedValue = radio.customize ? "Customize" : "Settings by theme settings";
        await dashboard.locator(`span[for="${selectedValue}"]`).click();

        // Verify status of radio button "Customize"
        const customize = Boolean(
          await dashboard.locator("[data-key='customize'] input[name='Customize']:checked").count(),
        );
        expect(customize).toEqual(radio.customize);

        // Verify status of radio button "Settings by theme settings"
        const byThemeSettings = Boolean(
          await dashboard.locator("[data-key='customize'] input[name='Settings by theme settings']:checked").count(),
        );
        expect(byThemeSettings).toEqual(!radio.customize);

        // Save theme and verify json
        await themeDashboard.saveTheme();
        const sectionData = await getSectionBlock({
          theme,
          id: shopTheme.id,
          page: previewPage,
          section: sectionType,
        });
        expect(sectionData.settings.customize).toEqual(radio.customize);
        await waitForToastHidden(dashboard);
      }
    });

    await test.step("Verify element checkbox", async () => {
      const field = conf.caseConf.data.check_box.field;
      // Pre-condition: if current is 'Settings by theme settings', change to 'customize'
      const byThemeSettings = await dashboard
        .locator("[data-key='customize'] input[name='Settings by theme settings']:checked")
        .count();
      if (byThemeSettings) {
        await dashboard.locator(`span[for="Customize"]`).click();
      }

      const currentStatus = Boolean(await dashboard.locator("[data-key='enable_image_zoom'] input:checked").count());
      // click on checkbox
      const newStatus = await verifyCheckBox(dashboard, currentStatus, field);
      await themeDashboard.saveTheme();
      let data = await getSectionBlock({
        theme,
        id: shopTheme.id,
        page: previewPage,
        section: sectionType,
      });
      expect(data.settings[field]).toEqual(!currentStatus);
      await waitForToastHidden(dashboard);

      // click on checkbox one more time
      await verifyCheckBox(dashboard, newStatus, field);
      await themeDashboard.saveTheme();
      data = await getSectionBlock({
        theme,
        id: shopTheme.id,
        page: previewPage,
        section: sectionType,
      });

      expect(data.settings[field]).toEqual(!newStatus);
    });

    await test.step("Verify element dropdown", async () => {
      for (const dropdown of conf.caseConf.data.dropdowns) {
        // select value in dropdown
        await dashboard.locator(`[label='${dropdown.input.label}']`).click();
        await dashboard
          .locator(`.sb-popover__popper:not([style*='display: none;']) [data-select-label='${dropdown.input.value}']`)
          .click();

        // Verify caption text
        const captionText = await dashboard
          .locator(`[data-key='${dropdown.output.field}'] .sb-text-caption`)
          .innerText();
        expect(captionText.trim()).toEqual(dropdown.input.value);

        await themeDashboard.saveTheme();
        const data = await getSectionBlock({
          theme,
          id: shopTheme.id,
          page: previewPage,
          section: sectionType,
        });
        expect(data.settings[dropdown.output.field]).toEqual(dropdown.output.value);
        await waitForToastHidden(dashboard);
      }
    });
  });

  test("@SB_OLS_THE_INS_DB_SPDS_6 Verify element text area", async ({ dashboard, conf, theme }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;
    const sectionType = conf.caseConf.data.section_type;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);
    await themeDashboard.openSectionBlock(section);

    for (const input of conf.caseConf.data.inputs) {
      await dashboard.locator("textarea[class=sb-input__inner]").first().fill(input.text);

      await themeDashboard.saveTheme();
      const sectionData = await getSectionBlock({
        theme,
        id: shopTheme.id,
        page: previewPage,
        section: sectionType,
      });

      expect(sectionData.settings[input.field]).toEqual(input.text);
      await waitForToastHidden(dashboard);
    }
  });

  test("@SB_OLS_THE_INS_DB_SPDS_7 Verify element show/hide section and block, expand/collapse section, drag and drop section", async ({
    dashboard,
    conf,
    theme,
  }) => {
    const previewPage = conf.caseConf.data.page;
    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);

    await test.step("Verify show/hide block", async () => {
      const sectionType = conf.caseConf.data.hide_block.section_type;
      const field = conf.caseConf.data.hide_block.field;
      const block = conf.caseConf.data.hide_block.block;
      const blockType = conf.caseConf.data.hide_block.block_type;

      const selector = `[data-block-label='${block}'].theme-editor-v2__is-hidden`;
      let status = !(await dashboard.locator(selector).count());

      // Click on eye icon
      status = await verifyClickShowHideBlock({
        page: dashboard,
        currentStatus: status,
        block: block,
      });

      await themeDashboard.saveTheme();
      let visible = status ? true : undefined;

      let data = await getSectionBlock({
        theme,
        id: shopTheme.id,
        page: previewPage,
        section: sectionType,
        block: blockType,
      });
      expect(data[field]).toEqual(visible);
      await waitForToastHidden(dashboard);

      // Click on eye icon on more time
      status = await verifyClickShowHideBlock({ page: dashboard, currentStatus: status, block: block });

      await themeDashboard.saveTheme();
      visible = status ? true : undefined;

      data = await getSectionBlock({
        theme,
        id: shopTheme.id,
        page: previewPage,
        section: sectionType,
        block: blockType,
      });
      expect(data[field]).toEqual(visible);
    });

    await test.step("Verify show/hide section", async () => {
      const section = conf.caseConf.data.hide_section.section;
      const sectionType = conf.caseConf.data.hide_section.section_type;
      const field = conf.caseConf.data.hide_section.field;

      const currentSection = await dashboard.locator(`[data-section-label='${section}']`).count();
      // If number of section = 0, add a new section
      if (!currentSection) {
        await themeDashboard.addSection(section);
      }

      const selector = `:nth-match([data-section-label='${section}'], 1).theme-editor-v2__is-hidden`;
      let status = !(await dashboard.locator(selector).count());
      // Click on eye icon
      status = await verifyClickShowHideSection({ page: dashboard, currentStatus: status, section: section });

      await themeDashboard.saveTheme();
      let visible = status ? true : undefined;

      let data = await getSectionBlock({
        theme,
        id: shopTheme.id,
        page: previewPage,
        section: sectionType,
      });

      expect(data[field]).toEqual(visible);
      await waitForToastHidden(dashboard);
      // Click on eye icon on more time
      status = await verifyClickShowHideSection({ page: dashboard, currentStatus: status, section: section });

      await themeDashboard.saveTheme();
      visible = status ? true : undefined;
      data = await getSectionBlock({
        theme,
        id: shopTheme.id,
        page: previewPage,
        section: sectionType,
      });
      expect(data[field]).toEqual(visible);
    });

    await test.step("Verify drag and drop section", async () => {
      const sectionDragDropFrom = "Product";
      const sectionDragDropTo = "Products From The Same Collections";

      const locatorFrom = await dashboard.waitForSelector(
        `[data-section-label="${sectionDragDropFrom}"] .theme-editor-v2__section`,
      );
      const locatorTo = await dashboard.waitForSelector(
        `[data-section-label="${sectionDragDropTo}"] .theme-editor-v2__section`,
      );

      const indexSectionTo = await themeDashboard.getSectionIndex(sectionDragDropTo);

      // Drag and drop section from sectionDragDropFrom to sectionDragDropTo
      await locatorFrom.hover();
      await dashboard.mouse.down();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const box = (await locatorTo.boundingBox())!;
      await dashboard.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await locatorTo.hover();
      await dashboard.waitForTimeout(500);
      await dashboard.mouse.up();

      // Verify position of collection sectionDragDropFrom after move
      await expect(
        await dashboard.locator(
          `[data-section-index="${indexSectionTo}"][data-section-label="${sectionDragDropFrom}"]`,
        ),
      ).toBeVisible();

      await themeDashboard.saveTheme();
    });

    await test.step("Verify collapse/expand section", async () => {
      const sectionCollapse = "Product";

      // Get current status: collapse or expand
      let isCollapseSection = Boolean(
        await dashboard
          .locator(`[data-section-label="${sectionCollapse}"] .theme-editor-v2__section [id$="/Right"]`)
          .count(),
      );

      // Collapse or expand section
      isCollapseSection = await verifyCollapse(dashboard, sectionCollapse, isCollapseSection);
      // Collapse or expand section one more time
      await verifyCollapse(dashboard, sectionCollapse, isCollapseSection);
    });
  });

  test("@SB_OLS_THE_INS_DB_SPDS_8 Verify duplicate block in section", async ({ dashboard, conf, theme }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;
    const block = conf.caseConf.data.block;
    const sectionType = conf.caseConf.data.section_type;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);

    await test.step("Verify duplicate block", async () => {
      // Count number of blocks
      const countBlockBefore = Number(
        await dashboard.locator(`[data-section-label='${section}'] [data-block-label='${block}']`).count(),
      );

      // If number of blocks = 0, add a new block
      // If number of blocks > 1, delete blocks until only one
      if (!countBlockBefore) {
        await themeDashboard.addBlock(section, block);
      } else {
        await themeDashboard.deleteBlock(section, block, countBlockBefore - 1);
      }

      // Hover and click duplicate block
      await dashboard.locator(`[data-section-label='${section}'] [data-block-label='${block}']`).hover();
      await dashboard.locator(`[data-section-label='${section}'] [data-block-label='${block}'] [id$='/Copy']`).click();

      const countBlock = await dashboard
        .locator(`[data-section-label='${section}'] [data-block-label='${block}']`)
        .count();

      // Verify duplicate
      expect(countBlock).toEqual(2);
      await themeDashboard.saveTheme();

      const response = await theme.single(shopTheme.id);
      const index = response.settings_data.pages[previewPage].default.findIndex(
        section => section.type === sectionType,
      );
      const blockItem = response.settings_data.pages[previewPage].default[index];
      expect(blockItem.blocks[0]).toEqual(blockItem.blocks[1]);
      await waitForToastHidden(dashboard);
    });

    await test.step("Verify duplicate section", async () => {
      const countSectionBefore = await dashboard.locator(`[data-section-label='${section}']`).count();

      // If number of sections = 0, add a new section
      // If number of sections > 1, delete blocks until only one
      if (!countSectionBefore) {
        await themeDashboard.addSection(section, 1);
      } else {
        await themeDashboard.deleteSections(section, countSectionBefore - 1);
      }

      const indexSection = await themeDashboard.getSectionIndex(section);

      // Hover and click duplicate section
      await dashboard.locator(`[data-section-label='${section}'] .theme-editor-v2__section`).first().hover();
      await dashboard
        .locator(`[data-section-label='${section}'] .theme-editor-v2__section [id$='/Copy']`)
        .first()
        .click();

      const countSection = await dashboard.locator(`[data-section-label='${section}']`).count();

      // Verify duplicate section
      expect(countSection).toEqual(2);
      await themeDashboard.saveTheme();

      const response = await theme.single(shopTheme.id);
      const sections = response.settings_data.pages[previewPage];
      removeAllKeys(sections.default[indexSection], "id");
      removeAllKeys(sections.default[indexSection + 1], "id");
      expect(sections.default[indexSection]).toEqual(sections.default[indexSection + 1]);
    });
  });

  test(`@SB_OLS_THE_INS_DB_SPDS_9 Check sync color`, async ({ dashboard, conf, cConf }) => {
    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);

    // Reset data
    await themeDashboard.openThemeEditor(shopTheme.id, cConf.page);
    await themeDashboard.openSetting("Colors");
    const isExpandAdvanced = await dashboard.locator(themeDashboard.iconExpandSelector).isVisible();
    if (isExpandAdvanced) {
      await dashboard.locator(themeDashboard.referenceExpandSelector).click();
    }
    const isButtonUnSyncColor = await dashboard
      .locator(`${themeDashboard.widgetColorBgButton} ${themeDashboard.iconUnSync}`)
      .isHidden();
    if (isButtonUnSyncColor) {
      await themeDashboard.onClickIconSync(themeDashboard.widgetColorBgButton);
    }
    const isMenuHoverUnSyncColor = await dashboard
      .locator(`${themeDashboard.widgetColorMenuTextHover} ${themeDashboard.iconUnSync}`)
      .isHidden();
    if (isMenuHoverUnSyncColor) {
      await themeDashboard.onClickIconSync(themeDashboard.widgetColorMenuTextHover);
    }

    for (let i = 0; i < cConf.steps.length; i++) {
      const step = cConf.steps[i];
      await test.step(`Setting icon sync + color primary`, async () => {
        await dashboard.locator(`${themeDashboard.widgetColorBgButton} input`).first().fill(step.button);
        await dashboard.locator(`${themeDashboard.widgetColorMenuTextHover} input`).first().fill(step.menu);
        if (step.click_button_sync) {
          await themeDashboard.onClickIconSync(themeDashboard.widgetColorBgButton);
        }
        if (step.click_menu_sync) {
          await themeDashboard.onClickIconSync(themeDashboard.widgetColorMenuTextHover);
        }

        await dashboard.locator(`${themeDashboard.widgetColorPrimary}`).click();
        await dashboard.locator(`${themeDashboard.widgetColorPrimary} input`).first().fill(step.primary_1);
        await dashboard.locator(themeDashboard.titleEditor).click();

        await dashboard.locator(`${themeDashboard.widgetColorPrimary}`).click();
        await dashboard.locator(`${themeDashboard.widgetColorPrimary} input`).first().fill(step.primary_2);
        await dashboard.locator(themeDashboard.titleEditor).click();

        if (step.expected.sync_button) {
          await expect(
            dashboard.locator(`${themeDashboard.widgetColorBgButton} ${themeDashboard.iconUnSync}`),
          ).toBeHidden();
        } else {
          await expect(
            dashboard.locator(`${themeDashboard.widgetColorBgButton} ${themeDashboard.iconUnSync}`),
          ).toBeVisible();
        }

        await expect(dashboard.locator(`${themeDashboard.widgetColorPrimary} input`)).toHaveValue(
          step.expected.primary_2,
        );
        await expect(dashboard.locator(`${themeDashboard.widgetColorBgButton} input`)).toHaveValue(
          step.expected.button,
        );
        await dashboard.locator(`${themeDashboard.widgetColorBgButton} ${themeDashboard.iconUnSyncColor}`).hover();
        await expect(dashboard.locator(themeDashboard.tooltipContent)).toHaveText(step.expected.button_tooltip);

        if (step.expected.sync_menu) {
          await expect(
            dashboard.locator(`${themeDashboard.widgetColorMenuTextHover} ${themeDashboard.iconUnSync}`),
          ).toBeHidden();
        } else {
          await expect(
            dashboard.locator(`${themeDashboard.widgetColorMenuTextHover} ${themeDashboard.iconUnSync}`),
          ).toBeVisible();
        }

        await expect(dashboard.locator(`${themeDashboard.widgetColorMenuTextHover} input`)).toHaveValue(
          step.expected.menu,
        );
        await dashboard.locator(`${themeDashboard.widgetColorMenuTextHover} ${themeDashboard.iconUnSyncColor}`).hover();
        await expect(dashboard.locator(themeDashboard.tooltipContent)).toHaveText(step.expected.menu_tooltip);
      });
      await test.step("Click button save, Check json trả về.", async () => {
        await themeDashboard.saveBtn.click();
        const response = await themeDashboard.waitResponseWithUrl(`/admin/themes/${shopTheme.id}.json`);
        const json = await response.json();
        const setting = json.shop_theme.settings_data.settings.colors;
        expect(setting["color_background_button"]).toEqual(step.expected.button);
        expect(setting["color_main_menu_text_hover"]).toEqual(step.expected.menu);
        expect(setting["color_primary"]).toEqual(step.expected.primary_2);
      });
    }
  });

  test(`@SB_OLS_THE_INS_DB_SPDS_10 Checkelement call to action`, async ({ dashboard, theme, conf, cConf }) => {
    const res = await theme.single(shopTheme.id);
    const headerId = res.settings_data.fixed.header.id;
    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, cConf.page);
    const totalSection = await dashboard.locator(themeDashboard.allSectionIgnoreApp).count();
    let currentAction = "";

    await test.step(`Click vào section Button setting`, async () => {
      await themeDashboard.openSectionBlock(cConf.section);
      currentAction = await dashboard
        .locator(`${themeDashboard.widgetButtonLink} [data-key='link']`)
        .getAttribute("data-value");
    });
    for (let i = 0; i < cConf.steps.length; i++) {
      const step = cConf.steps[i];
      await test.step(`Setting data với Button link = ${step.title}`, async () => {
        if (step.action || currentAction === '"scrollToSection"') {
          await dashboard.locator(`${themeDashboard.widgetButtonLink} button`).click();
          await dashboard
            .locator(`${themeDashboard.sectionLinkPopover} [data-select-label='${step.action || "Go to link"}']`)
            .click();
        }

        await expect(
          dashboard.locator(`${themeDashboard.widgetButtonLink} [data-sub-key='link'] input`),
        ).toHaveAttribute("placeholder", step.placeholder);
      });
      await test.step(`Click vào ô search page dưới droplist button link`, async () => {
        const tagBtnLink = dashboard.locator(".theme-editor-v2__link").locator(".sb-tag");
        if (await tagBtnLink.isVisible()) {
          await tagBtnLink.locator(".sb-tag__icon").click();
        }
        await dashboard.locator(`${themeDashboard.widgetButtonLink} [data-sub-key='link'] .sb-input input`).click();
        await expect(
          dashboard.locator(
            `${themeDashboard.getSelectorLinkPopover(step.popover_id)} [data-select-label]${step.condition}`,
          ),
        ).toHaveCount(step.expected.total_page || totalSection);
      });
      await test.step(`Chọn page thành công`, async () => {
        await dashboard
          .locator(`${themeDashboard.getSelectorLinkPopover(step.popover_id)} [data-select-label='${step.selected}']`)
          .click();
      });
      await test.step("Click button save, Check json trả về.", async () => {
        await themeDashboard.saveTheme("");
        const response = await themeDashboard.waitResponseWithUrl(`/admin/themes/${shopTheme.id}.json`);
        const json = await response.json();
        const section = await getSectionBlock({
          theme,
          id: shopTheme.id,
          page: cConf.page,
          section: cConf.section_type,
          settingsData: json.shop_theme.settings_data,
        });
        const expected = merge(
          step.expected.link,
          step.expected.link.type === "section" ? { type_options: { subject: headerId } } : {},
        );
        expect(section.settings["link"]).toEqual(expected);
      });
    }
  });

  test("@SB_OLS_THE_INS_DB_SPDS_11 Verify element popup when delete section", async ({ dashboard, conf, theme }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;
    const sectionType = conf.caseConf.data.section_type;
    let countSectionDB: number;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);

    await test.step("Pre-condition: already exist Collection List section", async () => {
      await themeDashboard.openThemeEditor(shopTheme.id, previewPage);

      countSectionDB = await dashboard.locator(`[data-section-label='${section}']`).count();

      // If number of section = 0, add a new section
      if (!countSectionDB) {
        await themeDashboard.addSection(section);
        countSectionDB = 1;
        await themeDashboard.saveTheme();
      }

      const response = await theme.single(shopTheme.id);
      const countSectionJson = response.settings_data.pages[previewPage].default.filter(
        section => section.type === sectionType,
      ).length;
      expect(countSectionJson).toEqual(countSectionDB);
    });

    await test.step("Verify click Close icon", async () => {
      // Open section setting then click Remove section
      await dashboard.locator(`[data-section-label='${section}'] .theme-editor-v2__section`).first().click();
      await dashboard.locator("[data-action-remove='section']").click();
      await expect(dashboard.locator(".sb-popup__container")).toBeVisible();

      // Click Close icon on popup
      await dashboard.locator(".sb-popup__container .sb-button--subtle--medium").click();
      await expect(dashboard.locator(".sb-popup__container")).toBeHidden();

      // Verify section is not deleted
      const countSectionAfter = Number(await dashboard.locator(`[data-section-label='${section}']`).count());
      await expect(countSectionAfter).toEqual(countSectionDB);
    });

    await test.step("Verify click Cancel button", async () => {
      // Open section setting then click Remove section
      await dashboard.locator(`[data-section-label='${section}'] .theme-editor-v2__section`).first().click();
      await dashboard.locator("[data-action-remove='section']").click();
      await expect(dashboard.locator(".sb-popup__container")).toBeVisible();

      // Click Cancel button on popup
      await dashboard.locator(".sb-popup__container .sb-button--default--medium").click();
      await expect(dashboard.locator(".sb-popup__container")).toBeHidden();

      // Verify section is not deleted
      const countSectionAfter = await dashboard.locator(`[data-section-label='${section}']`).count();
      await expect(countSectionAfter).toEqual(countSectionDB);
    });

    await test.step("Verify click Delete button", async () => {
      // Open section setting then click Remove section
      await dashboard.locator(`[data-section-label='${section}'] .theme-editor-v2__section`).first().click();
      await dashboard.locator("[data-action-remove='section']").click();
      await expect(dashboard.locator(".sb-popup__container")).toBeVisible();

      // Click Remove button on popup
      await dashboard.locator(".sb-popup__container .sb-button--danger--medium").click();
      await expect(dashboard.locator(".sb-popup__container")).toBeHidden();

      // Verify section is deleted
      const countSectionAfter = await dashboard.locator(`[data-section-label='${section}']`).count();
      await expect(countSectionAfter).toEqual(countSectionDB - 1);

      await themeDashboard.saveTheme();
      const response = await theme.single(shopTheme.id);
      const countSectionInJson = response.settings_data.pages[previewPage].default.filter(
        section => section.type === sectionType,
      ).length;
      expect(countSectionInJson).toEqual(countSectionDB - 1);
    });
  });

  test("@SB_OLS_THE_INS_DB_SPDS_12 Verify element button group and slider", async ({ dashboard, conf, theme }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;
    const sectionType = conf.caseConf.data.section_type;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);
    await themeDashboard.openSectionBlock(section);

    await test.step("Verify element Button group", async () => {
      for (const button of conf.caseConf.data.buttons_group) {
        await dashboard
          .locator(
            `//div[contains(@class,'sb-mb-medium') and descendant::label[normalize-space()='${button.input.label}']]
            //button[normalize-space()='${button.input.value}']`,
          )
          .click();
        await expect(
          dashboard.locator(
            `//div[contains(@class,'sb-mb-medium') and descendant::label[normalize-space()='${button.input.label}']]
            //button[normalize-space()='${button.input.value}' and contains(@class,'sb-button--selected')]`,
          ),
        ).toBeVisible();

        await themeDashboard.saveTheme();
        const data = await getSectionBlock({
          theme,
          id: shopTheme.id,
          page: previewPage,
          section: sectionType,
        });
        expect(data.settings[button.output.field]).toEqual(button.output.value);
        await waitForToastHidden(dashboard);
      }
    });
  });

  test("@SB_OLS_THE_INS_DB_SPDS_13 Verify element text link", async ({ dashboard, conf, context }) => {
    const previewPage = conf.caseConf.data.page;
    const section = conf.caseConf.data.section;
    const block = conf.caseConf.data.block;
    const redirectUrl = conf.caseConf.data.redirect_url;

    const themeDashboard = new ThemeDashboard(dashboard, conf.suiteConf.domain);
    await themeDashboard.openThemeEditor(shopTheme.id, previewPage);
    await themeDashboard.openSectionBlock(section, block);

    await verifyRedirectUrl({
      page: dashboard,
      redirectUrl: redirectUrl,
      selector: ".theme-editor-v2__input-help-text a >> nth=0",
      context,
    });
  });
});
