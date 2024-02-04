import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Locator } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { PageSettingsData } from "@types";

let webBuilder: WebBuilder,
  addBlockBtn: Locator,
  basicsCate: Locator,
  blankSectionTemplate: Locator,
  addSectionBtnTop: Locator,
  addSectionBtnBottom: Locator,
  libId: number,
  settingsData: PageSettingsData,
  blocks: Blocks;
const dProId = [];

test.describe("Check chức năng Insert panel trong web builder @SB_WEB_BUILDER_INSERT_PANEL", () => {
  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsData = response.settings_data as PageSettingsData;
    });

    await test.step("Create Library test", async () => {
      const libInfo = await builder.createLibrary(conf.suiteConf.test_lib);
      libId = libInfo.id;
    });
  });

  test.afterAll(async ({ builder }) => {
    const listLibs = await builder.listLibrary({ action: "all" });
    for (const lib of listLibs) {
      if (lib.id !== 1) {
        await builder.deleteLibrary(lib.id);
      }
    }
  });

  test.beforeEach(async ({ dashboard, conf, builder }) => {
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);

    const dndInfo = Object.assign(conf.suiteConf.dnd_blank_section, {
      isBottom: false,
    });
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

    await test.step("Pre-condition: Add blank section ", async () => {
      await webBuilder.dragAndDropInWebBuilder(dndInfo);
      await webBuilder.backBtn.click();
      addBlockBtn = webBuilder.getAddBlockBtn({ section: 1 });
      basicsCate = webBuilder.getCategoryByName("Basics");
      blankSectionTemplate = webBuilder.getTemplatePreviewByName("Single column");
      addSectionBtnTop = webBuilder.getAddSectionBtn({ section: 1 });
      addSectionBtnBottom = webBuilder.getAddSectionBtn({ section: 1, position: "after" });
    });
  });

  test.describe("@SB_IP_SUITE_1  - Verify category khi click vào button Add block & Add Section ko có category trong library", () => {
    test("@SB_WEB_BUILDER_INSERT_PANEL_01 - Add block TH không có category trong library", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const blankColumn = webBuilder.getSelectorByIndex(conf.caseConf.blank_column);
      await test.step("Click Add block button", async () => {
        await webBuilder.frameLocator.locator(blankColumn).hover();
        await addBlockBtn.click();
      });

      await test.step("Verify basics category is selected when open insert panel", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        const blockCate = await webBuilder.getAllCateInsertPanel();
        expect(blockCate).toContainEqual(expected.category);
        await expect(blankSectionTemplate).toBeHidden();
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_10 - Close insert panel khi click Add Block", async ({ conf }) => {
      const blankColumn = webBuilder.getSelectorByIndex(conf.caseConf.blank_column);
      await test.step("Click Add block", async () => {
        await webBuilder.frameLocator.locator(blankColumn).hover();
        await addBlockBtn.click();
      });

      await test.step("Close insert panel", async () => {
        await webBuilder.closeInsertPanelBtn.click();
      });

      await test.step("Verify insert panel is closed", async () => {
        await expect(webBuilder.insertCateList).toBeHidden();
        await expect(webBuilder.insertPreview).toBeHidden();
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_11 - Add section TH không có category trong library", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      await test.step("Click Add section button", async () => {
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await addSectionBtnBottom.click();
      });

      await test.step("Verify basics category is selected when open insert panel", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        for (const cate of expected.default_section_categories) {
          const defaultSectionCate = webBuilder.getCategoryByName(cate);
          await expect(defaultSectionCate).toBeVisible();
        }
        for (const template of expected.default_templates) {
          const defaultTemplate = webBuilder.getTemplatePreviewByName(template);
          await expect(defaultTemplate).toBeVisible();
        }
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_17 - Close insert panel khi click Add Section", async ({ conf }) => {
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      await test.step("Click Add section button", async () => {
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await addSectionBtnBottom.click();
      });

      await test.step("Close insert panel", async () => {
        await webBuilder.closeInsertPanelBtn.click();
      });

      await test.step("Verify insert panel is closed", async () => {
        await expect(webBuilder.insertCateList).toBeHidden();
        await expect(webBuilder.insertPreview).toBeHidden();
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_18 - Click icon (+) TH không có category trong library", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      await test.step("Click Add section button", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Verify basics category is selected when open insert panel", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        for (const cate of expected.default_section_categories) {
          const defaultSectionCate = webBuilder.getCategoryByName(cate);
          await expect(defaultSectionCate).toBeVisible();
        }
        for (const template of expected.default_templates) {
          const defaultTemplate = webBuilder.getTemplatePreviewByName(template);
          await expect(defaultTemplate).toBeVisible();
        }
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_23 - Close insert panel khi click icon (+)", async ({}) => {
      await test.step("Click icon (+) insert panel", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Close insert panel", async () => {
        await webBuilder.closeInsertPanelBtn.click();
      });

      await test.step("Verify insert panel is closed", async () => {
        await expect(webBuilder.insertCateList).toBeHidden();
        await expect(webBuilder.insertPreview).toBeHidden();
      });
    });
  });

  test.describe("@SB_IP_SUITE_2 - Verify category khi click vào button Add block & Add Section có category trong library", () => {
    const cateIds = [];
    test.beforeAll(async ({ builder, conf }) => {
      await test.step("Pre-condition: Create category and templates for testing", async () => {
        for (const data of conf.suiteConf.cate_data) {
          const cateData = Object.assign(data, { library_id: libId });
          const cateInfo = await builder.createCategoryByAPI(cateData);
          cateIds.push(cateInfo.id);
          const componentData = Object.assign(data.template, {
            library_id: libId,
            category_id: cateInfo.id,
          });
          await builder.createComponent(componentData);
        }
      });
    });

    test.afterAll(async ({ builder }) => {
      for (const cateId of cateIds) {
        await builder.deleteCategory(cateId);
      }
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_02 - Add block TH có category chứa block trong library", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const blankColumn = webBuilder.getSelectorByIndex(conf.caseConf.blank_column);
      await test.step("Click Add block button", async () => {
        await webBuilder.frameLocator.locator(blankColumn).hover();
        await addBlockBtn.click();
      });

      await test.step("Verify Basics cate is selected by default, test category appear", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        for (const data of expected.display_categories) {
          const testCate = webBuilder.getCategoryByName(data);
          await expect(testCate).toBeVisible();
        }
        await expect(blankSectionTemplate).toBeHidden();
      });

      const sameNameCate = webBuilder.getCategoryByName(expected.merge_cate);
      await test.step("Verify cate with same name is merged", async () => {
        await expect(sameNameCate).toHaveCount(1);
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_12 - Add section TH có category trong library", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      await test.step("Click Add Section button", async () => {
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await addSectionBtnBottom.click();
      });

      await test.step("Verify Basics cate is selected by default, test category appear", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        for (const cate of expected.categories) {
          const sectionCate = webBuilder.getCategoryByName(cate);
          await expect(sectionCate).toBeVisible();
        }
        for (const template of expected.templates) {
          const expectedTemplate = webBuilder.getTemplatePreviewByName(template);
          await expect(expectedTemplate).toBeVisible();
        }
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_19 - Click icon (+) TH có category trong library", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      await test.step("Click insert panel button", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Verify Basics cate is selected by default, test category appear", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        for (const cate of expected.categories) {
          const expectedCate = webBuilder.getCategoryByName(cate);
          await expect(expectedCate).toBeVisible();
        }
        for (const template of expected.templates) {
          const expectedTemplate = webBuilder.getTemplatePreviewByName(template);
          await expect(expectedTemplate).toBeVisible();
        }
      });
    });
  });

  test.describe("@SB_IP_SUITE_3 - Verify category khi save as templates vào category", () => {
    test.afterEach(async ({ builder }) => {
      const libList = await builder.listLibrary({ action: "all" });
      for (const lib of libList) {
        if (lib.id !== libId && lib.id !== 1) {
          await builder.deleteLibrary(lib.id);
        }
      }
    });
    test("@SB_WEB_BUILDER_INSERT_PANEL_03 - Save block as templates", async ({ dashboard, builder, conf }) => {
      const addBlock = conf.caseConf.add_block;
      const blockTest = webBuilder.getSelectorByIndex(conf.caseConf.block_test);
      const expected = conf.caseConf.expected;

      await test.step("Pre-condition: Add test block and category", async () => {
        const addCate = Object.assign(conf.caseConf.category, {
          library_id: libId,
        });
        await builder.createCategoryByAPI(addCate);
        await webBuilder.insertSectionBlock({
          parentPosition: addBlock.parent_position,
          category: addBlock.category,
          template: addBlock.template,
        });
      });

      await test.step("Add block to existed category", async () => {
        await webBuilder.clickOnElement(blockTest, webBuilder.iframe);
        await webBuilder.saveAsTemplate(conf.caseConf.save_block_exist_cate);
      });

      await test.step("Verify label New in category name", async () => {
        //NOTE: Chưa làm phần này ở web builder -> chờ update sau
      });

      await test.step("Verify save successfully", async () => {
        const testCate = webBuilder.getCategoryByName(conf.caseConf.save_block_exist_cate.category.title);
        const savedBlock = webBuilder.getTemplatePreviewByName(conf.caseConf.save_block_exist_cate.template_name);
        await expect(webBuilder.toastMessage).toHaveText(expected.success_message);
        await webBuilder.clickBtnNavigationBar("insert");
        await testCate.click();
        await expect(savedBlock).toBeVisible();
        await webBuilder.closeInsertPanelBtn.click();
      });

      await test.step("Add block to new category", async () => {
        await webBuilder.clickOnElement(blockTest, webBuilder.iframe);
        await webBuilder.saveAsTemplate(conf.caseConf.save_block_new_cate);
        await webBuilder.toastMessage.waitFor({ state: "hidden" });
        await dashboard.reload();
        await webBuilder.reloadIfNotShow();
      });

      await test.step("Verify new category is created and block is saved", async () => {
        const newCate = webBuilder.getCategoryByName(conf.caseConf.save_block_new_cate.category.title);
        const savedBlock = webBuilder.getTemplatePreviewByName(conf.caseConf.save_block_new_cate.template_name);
        await webBuilder.clickBtnNavigationBar("insert");
        await expect(newCate).toBeVisible();
        await newCate.click();
        await expect(savedBlock).toBeVisible();
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_13 - Save Section as templates", async ({ dashboard, builder, conf }) => {
      const sectionTest = webBuilder.getSelectorByIndex(conf.caseConf.section_test);
      const saveSectionNewCate = conf.caseConf.save_section_new_cate;
      const saveSectionExistCate = conf.caseConf.save_section_exist_cate;
      const expected = conf.caseConf.expected;

      await test.step("Pre-condition: Create new category", async () => {
        await webBuilder.clickBtnNavigationBar("save");
        const addCate = Object.assign(conf.caseConf.category, {
          library_id: libId,
        });
        await builder.createCategoryByAPI(addCate);
        await dashboard.reload();
        await webBuilder.reloadIfNotShow();
      });

      await test.step("Add section to existed category", async () => {
        await webBuilder.clickOnElement(sectionTest, webBuilder.iframe);
        await webBuilder.saveAsTemplate(saveSectionExistCate);
      });

      await test.step("Verify label New in category name", async () => {
        //NOTE: Chưa làm phần này ở web builder -> chờ update sau
      });

      await test.step("Verify save successfully", async () => {
        const testCate = webBuilder.getCategoryByName(saveSectionExistCate.category.title);
        const savedSection = webBuilder.getTemplatePreviewByName(saveSectionExistCate.template_name);
        await expect(webBuilder.toastMessage).toHaveText(expected.success_message);
        await webBuilder.clickBtnNavigationBar("insert");
        await testCate.click();
        await expect(savedSection).toBeVisible();
        await webBuilder.closeInsertPanelBtn.click();
      });

      await test.step("Add section to new category", async () => {
        await webBuilder.clickOnElement(sectionTest, webBuilder.iframe);
        await webBuilder.saveAsTemplate(saveSectionNewCate);
        await webBuilder.toastMessage.waitFor({ state: "hidden" });
        await dashboard.reload();
        await webBuilder.reloadIfNotShow();
      });

      await test.step("Verify new category is created and section is saved", async () => {
        const newCate = webBuilder.getCategoryByName(saveSectionNewCate.category.title);
        const savedSection = webBuilder.getTemplatePreviewByName(saveSectionNewCate.template_name);
        await webBuilder.clickBtnNavigationBar("insert");
        await expect(newCate).toBeVisible();
        await newCate.click();
        await expect(savedSection).toBeVisible();
      });
    });
  });

  test.describe("@SB_IP_SUITE_4 - Verify template list trong category", () => {
    const cateIds = [];
    test.beforeAll(async ({ builder, conf }) => {
      await test.step("Pre-condition: Create category and templates for testing", async () => {
        for (const data of conf.suiteConf.cate_data) {
          const cateData = Object.assign(data, { library_id: libId });
          const cateInfo = await builder.createCategoryByAPI(cateData);
          cateIds.push(cateInfo.id);
          const componentData = Object.assign(data.template, {
            library_id: libId,
            category_id: cateInfo.id,
          });
          await builder.createComponent(componentData);
        }
      });
    });

    test.afterAll(async ({ builder }) => {
      for (const cateId of cateIds) {
        await builder.deleteCategory(cateId);
      }
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_04 - Khi ấn add block", async ({ dashboard, builder, conf }) => {
      const componentIds = [];
      const expected = conf.caseConf.expected;
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      const blankColumn = webBuilder.getSelectorByIndex(conf.caseConf.blank_column);
      await test.step("Pre-condition: Create > 24 block templates", async () => {
        for (let i = 0; i < 25; i++) {
          const templateInfo = { ...conf.caseConf.test_block, title: `Block Template - #${i}` };
          const createData = Object.assign(templateInfo, { library_id: libId, category_id: cateIds[0] });
          const info = await builder.createComponent(createData);
          componentIds.push(info.id);
        }
      });

      await test.step("Click add block button", async () => {
        await webBuilder.frameLocator.locator(blankSection).click();
        await webBuilder.frameLocator.locator(blankColumn).hover();
        await addBlockBtn.click();
      });

      await test.step("Verify categories appear", async () => {
        await expect(basicsCate).toBeVisible();
        const allCateNames = await webBuilder.getAllCateInsertPanel();
        for (const cate of expected.add_block_cate) {
          expect(allCateNames).toContainEqual(cate);
        }
      });

      await test.step("Click on block cate test", async () => {
        const testCate = webBuilder.getCategoryByName(conf.caseConf.block_cate);
        await testCate.click();
      });

      await test.step("Verify only show 24 templates by default in preview list", async () => {
        await expect(webBuilder.genLoc(webBuilder.templatePreview)).toHaveCount(expected.default_template_number);
      });

      await test.step("Scroll to bottom and verify lazy loaded the rest", async () => {
        const lazyLoadTemplate = webBuilder.getTemplatePreviewByName(expected.extra_template);
        await scrollUntilElementIsVisible({
          page: dashboard,
          scrollEle: webBuilder.templateContainer,
          viewEle: lazyLoadTemplate,
        });
        await expect(webBuilder.genLoc(webBuilder.templatePreview)).toHaveCount(expected.all_template_number);
      });

      await test.step("Delete template in block cate", async () => {
        await builder.deleteComponent(componentIds[0]);
        await webBuilder.clickSave();
        await dashboard.reload();
        await webBuilder.reloadIfNotShow();
      });

      await test.step("Click on block cate test", async () => {
        const testCate = webBuilder.getCategoryByName(conf.caseConf.block_cate);
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await webBuilder.frameLocator.locator(blankColumn).hover();
        await addBlockBtn.click();
        await testCate.click();
      });

      await test.step("Verify deleted template is removed from preview", async () => {
        const deletedTemplate = webBuilder.getTemplatePreviewByName(conf.caseConf.deleted_block);
        await expect(deletedTemplate).toBeHidden();
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_14 - Khi ấn add section", async ({ dashboard, builder, conf }) => {
      const componentIds = [];
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      const expected = conf.caseConf.expected;
      await test.step("Pre-condition: Create > 24 section templates", async () => {
        for (let i = 1; i <= 24; i++) {
          const templateInfo = { ...conf.caseConf.test_section, title: `Section Template - #${i}` };
          const createData = Object.assign(templateInfo, { library_id: libId, category_id: cateIds[1] });
          const info = await builder.createComponent(createData);
          componentIds.push(info.id);
        }
      });

      await test.step("Click add section button", async () => {
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await addSectionBtnBottom.hover();
        await addSectionBtnBottom.click();
      });

      await test.step("Verify categories appear", async () => {
        for (const cate of expected.add_section_cate) {
          const sectionCate = webBuilder.getCategoryByName(cate);
          await expect(sectionCate).toBeVisible();
        }
      });

      await test.step("Click on section cate test", async () => {
        const testCate = webBuilder.getCategoryByName(conf.caseConf.section_cate);
        await testCate.click();
      });

      await test.step("Verify only show 24 templates by default in preview list", async () => {
        await expect(webBuilder.genLoc(webBuilder.templatePreview)).toHaveCount(expected.default_template_number);
      });

      await test.step("Scroll to bottom and verify lazy loaded the rest", async () => {
        const lazyLoadTemplate = webBuilder.getTemplatePreviewByName(expected.extra_template);
        await scrollUntilElementIsVisible({
          page: dashboard,
          scrollEle: webBuilder.templateContainer,
          viewEle: lazyLoadTemplate,
        });
        await expect(webBuilder.genLoc(webBuilder.templatePreview)).toHaveCount(expected.all_template_number);
      });

      await test.step("Delete template in section cate", async () => {
        await builder.deleteComponent(componentIds[0]);
        await webBuilder.clickSave();
        await dashboard.reload();
        await webBuilder.reloadIfNotShow();
      });

      await test.step("Click on section cate test", async () => {
        const testCate = webBuilder.getCategoryByName(conf.caseConf.section_cate);
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await addSectionBtnBottom.click();
        await testCate.click();
      });

      await test.step("Verify deleted template is removed from preview", async () => {
        const deletedTemplate = webBuilder.getTemplatePreviewByName(conf.caseConf.deleted_section);
        await expect(deletedTemplate).toBeHidden();
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_20 - Khi ấn icon (+)", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      await test.step("Click insert panel button", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Verify categories appear", async () => {
        for (const cate of expected.insert_panel_cate) {
          const sectionCate = webBuilder.getCategoryByName(cate);
          await expect(sectionCate).toBeVisible();
        }
      });

      await test.step("Click on merge cate test", async () => {
        const testCate = webBuilder.getCategoryByName(conf.caseConf.merge_cate);
        await testCate.click();
      });

      await test.step("Verify show both section and block template", async () => {
        await expect(webBuilder.genLoc(webBuilder.templatePreview).first()).toBeVisible();
        const allTemplates = await webBuilder.getAllTemplatePreview();
        expect(allTemplates).toEqual(expected.merge_cate_templates);
      });
    });
  });

  test.describe("@SB_IP_SUITE_5 - Verify Search template theo keyword", () => {
    const cateIds = [];
    test.beforeAll(async ({ builder, conf }) => {
      await test.step("Pre-condition: Create category and templates for testing", async () => {
        for (const data of conf.suiteConf.cate_data) {
          const cateData = Object.assign(data, { library_id: libId });
          const cateInfo = await builder.createCategoryByAPI(cateData);
          cateIds.push(cateInfo.id);
          const componentData = Object.assign(data.template, {
            library_id: libId,
            category_id: cateInfo.id,
          });
          await builder.createComponent(componentData);
        }
      });
    });

    test.afterAll(async ({ builder }) => {
      for (const cateId of cateIds) {
        await builder.deleteCategory(cateId);
      }
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_05 - Search khi click add block", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const invalid = conf.caseConf.search_invalid;
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      const blankColumn = webBuilder.getSelectorByIndex(conf.caseConf.blank_column);
      await test.step("Click add block button", async () => {
        await webBuilder.frameLocator.locator(blankSection).click();
        await webBuilder.frameLocator.locator(blankColumn).hover();
        await addBlockBtn.click();
      });

      await test.step("Verify data insert panel", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        await webBuilder.getCategoryByName("Same name cate").click();
      });

      for (const valid of conf.caseConf.search_valid) {
        await test.step(`Enter search keyword which is ${valid.title} to searchbar`, async () => {
          await webBuilder.removeSearchKey();
          await Promise.all([
            webBuilder.searchbarTemplate.pressSequentially(valid.keyword),
            webBuilder.waitForSearchResult(),
          ]);
        });

        await test.step("Verify search result", async () => {
          await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
          for (const template of valid.expected_result) {
            await expect(webBuilder.getTemplatePreviewByName(template)).toBeVisible();
          }
        });
      }

      await test.step(`Enter search keyword which has ${invalid.max_char_title} to searchbar`, async () => {
        await webBuilder.removeSearchKey();
        await Promise.all([
          webBuilder.searchbarTemplate.pressSequentially(invalid.more_than_255_chars),
          webBuilder.waitForSearchResult(),
        ]);
      });

      await test.step("Verify search result", async () => {
        await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.invalid_255_chars);
        await expect(webBuilder.searchEmpty).toHaveText(expected.result_255_chars);
      });

      await test.step("Close insert panel and reopen", async () => {
        await webBuilder.closeInsertPanelBtn.click();
        await webBuilder.frameLocator.locator(blankColumn).hover();
        await addBlockBtn.click();
      });

      await test.step("Verify search keyword is still applied", async () => {
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.last_search);
        await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
      });

      await test.step("Click on basics cate", async () => {
        await basicsCate.click();
      });

      await test.step("Verify keysearch is reset", async () => {
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.reset_search);
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_15 - Search khi click add section", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const invalid = conf.caseConf.search_invalid;
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      await test.step("Click add section button", async () => {
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await addSectionBtnBottom.click();
        await expect(webBuilder.getTemplatePreviewByName("Single column")).toBeVisible();
        await expect(webBuilder.getTemplatePreviewByName("Popup")).toBeVisible();
      });

      await test.step("Verify data insert panel", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        await webBuilder.getCategoryByName("Same name cate").click();
      });

      for (const valid of conf.caseConf.search_valid) {
        await test.step(`Enter search keyword which is ${valid.title} to searchbar`, async () => {
          await Promise.all([webBuilder.searchbarTemplate.fill(valid.keyword), webBuilder.waitForSearchResult()]);
        });

        await test.step("Verify search result", async () => {
          await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
          for (const template of valid.expected_result) {
            await expect(webBuilder.getTemplatePreviewByName(template)).toBeVisible();
          }
          await webBuilder.searchbarTemplate.fill("");
        });
      }

      await test.step(`Enter search keyword which has ${invalid.max_char_title} to searchbar`, async () => {
        await Promise.all([
          webBuilder.searchbarTemplate.fill(invalid.more_than_255_chars),
          webBuilder.waitForSearchResult(),
        ]);
      });

      await test.step("Verify search result", async () => {
        await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.invalid_255_chars);
        await expect(webBuilder.searchEmpty).toHaveText(expected.result_255_chars);
      });

      await test.step("Close insert panel and reopen", async () => {
        await webBuilder.closeInsertPanelBtn.click();
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await addSectionBtnBottom.click();
      });

      await test.step("Verify search keyword is still applied", async () => {
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.last_search);
        await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
      });

      await test.step("Click on basics cate", async () => {
        await basicsCate.click();
      });

      await test.step("Verify keysearch is reset", async () => {
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.reset_search);
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_21 - Search khi click icon (+)", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const invalid = conf.caseConf.search_invalid;
      await test.step("Click insert panel button", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Verify data insert panel", async () => {
        await expect(basicsCate).toHaveAttribute(expected.attribute, new RegExp(expected.value));
        await webBuilder.getCategoryByName("Same name cate").click();
      });

      for (const valid of conf.caseConf.search_valid) {
        await test.step(`Enter search keyword which is ${valid.title} to searchbar`, async () => {
          await Promise.all([webBuilder.searchbarTemplate.fill(valid.keyword), webBuilder.waitForSearchResult()]);
        });

        await test.step("Verify search result", async () => {
          await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
          for (const template of valid.expected_results) {
            await expect(webBuilder.getTemplatePreviewByName(template)).toBeVisible();
          }
        });
      }

      await test.step(`Enter search keyword which has ${invalid.max_char_title} to searchbar`, async () => {
        await Promise.all([
          webBuilder.searchbarTemplate.fill(invalid.more_than_255_chars),
          webBuilder.waitForSearchResult(),
        ]);
      });

      await test.step("Verify search result", async () => {
        await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.invalid_255_chars);
        await expect(webBuilder.searchEmpty).toHaveText(expected.result_255_chars);
      });

      await test.step("Close insert panel and reopen", async () => {
        await webBuilder.closeInsertPanelBtn.click();
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Verify search keyword is still applied", async () => {
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.last_search);
        await expect(basicsCate).not.toHaveAttribute(expected.attribute, new RegExp(expected.value));
      });

      await test.step("Click on basics cate", async () => {
        await basicsCate.click();
      });

      await test.step("Verify keysearch is reset", async () => {
        await expect(webBuilder.searchbarTemplate).toHaveValue(expected.reset_search);
      });
    });
  });

  test.describe("@SB_IP_SUITE_6 - Verify filter library", () => {
    const libIds = [];
    test.beforeAll(async ({ builder, conf }) => {
      await test.step("Create 24 libraries for test", async () => {
        for (let i = 1; i <= 24; i++) {
          const createData = Object.assign(conf.suiteConf.test_lib, { title: `Test lib - #${i}` });
          const libInfo = await builder.createLibrary(createData);
          libIds.push(libInfo.id);
        }
      });
    });

    test.beforeEach(async ({ dashboard }) => {
      await test.step("Pre-condition: reload for libraries to display", async () => {
        await dashboard.reload();
      });
    });

    test.afterAll(async ({ builder }) => {
      for (const id of libIds) {
        await builder.deleteLibrary(id);
      }
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_06 - Hiển thị library ban đầu", async ({ conf }) => {
      test.slow();
      const expected = conf.caseConf.expected;
      await test.step("Open insert panel", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Click library filters", async () => {
        await webBuilder.libraryFilterBtn.click();
      });

      await test.step("Verify all libraries appear", async () => {
        await expect(webBuilder.libraryFilterOption).toHaveCount(expected.default_libraries_number);
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_07 - Hiển thị library khi có > 24", async ({ conf }) => {
      test.slow();
      const expected = conf.caseConf.expected;
      await test.step("Open insert panel", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Click library filters", async () => {
        await webBuilder.libraryFilterBtn.click();
      });

      await test.step("Verify all libraries appear", async () => {
        await expect(webBuilder.libraryFilterOption).toHaveCount(expected.all_libraries_number);
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_08 - Verify dropdown list library trong trường hợp shop add, delete, edit library", async ({
      builder,
      dashboard,
      conf,
    }) => {
      test.slow();
      const expected = conf.caseConf.expected;
      await test.step("Edit libraries test", async () => {
        for (const id of libIds) {
          await builder.updateLibrary(id, conf.caseConf.disable_lib);
        }
        await dashboard.reload();
      });

      await test.step("Click library filters", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
        await webBuilder.libraryFilterBtn.click();
      });

      await test.step("Verify disabled library is hidden", async () => {
        await webBuilder.libraryFilterDropdown.waitFor();
        const actualLibraryFilter = await webBuilder.getAllLibraryFilters();
        expect(actualLibraryFilter).toEqual(expected.default_libraries);
      });
    });
  });

  test.describe("@SB_IP_SUITE_7 - Kết hợp filter + search", () => {
    const cateIds = [];
    test.beforeAll(async ({ builder, conf }) => {
      await test.step("Pre-condition: Create category and templates for testing", async () => {
        for (const data of conf.suiteConf.cate_data) {
          const cateData = Object.assign(data, { library_id: libId });
          const cateInfo = await builder.createCategoryByAPI(cateData);
          cateIds.push(cateInfo.id);
          const componentData = Object.assign(data.template, {
            library_id: libId,
            category_id: cateInfo.id,
          });
          await builder.createComponent(componentData);
        }
      });
    });

    test.afterAll(async ({ builder }) => {
      for (const cateId of cateIds) {
        await builder.deleteCategory(cateId);
      }
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_09 - Case click add block", async ({ conf }) => {
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      const blankColumn = webBuilder.getSelectorByIndex(conf.caseConf.blank_column);
      await test.step("Click Add block button ", async () => {
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await webBuilder.frameLocator.locator(blankColumn).hover();
        await addBlockBtn.click();
        await webBuilder.getCategoryByName("Same name cate").click();
      });

      for (const data of conf.caseConf.valid_data) {
        await test.step("Combine filter and search keyword", async () => {
          await webBuilder.chooseLibraryFilter(data.lib_filter);
          await Promise.all([webBuilder.searchbarTemplate.fill(data.search_keyword), webBuilder.waitForSearchResult()]);
        });

        await test.step("Verify results", async () => {
          for (const template of data.expected_block) {
            await expect(webBuilder.templateContainer).toContainText(template);
          }
        });
      }

      for (const noResult of conf.caseConf.no_result_data) {
        await test.step("Combine filter and search keyword", async () => {
          await webBuilder.chooseLibraryFilter(noResult.lib_filter);
          await Promise.all([
            webBuilder.searchbarTemplate.fill(noResult.search_keyword),
            webBuilder.waitForSearchResult(),
          ]);
        });

        await test.step("Verify results", async () => {
          await expect(webBuilder.searchEmpty).toBeVisible();
          await expect(webBuilder.searchEmpty).toHaveText(noResult.message);
        });
      }
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_16 - Case click add section", async ({ conf }) => {
      const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
      await test.step("Click Add section button ", async () => {
        await webBuilder.clickOnElement(blankSection, webBuilder.iframe);
        await addSectionBtnBottom.click();
        await webBuilder.getCategoryByName("Same name cate").click();
      });

      for (const data of conf.caseConf.valid_data) {
        await test.step("Combine filter and search keyword", async () => {
          await webBuilder.chooseLibraryFilter(data.lib_filter);
          await Promise.all([webBuilder.searchbarTemplate.fill(data.search_keyword), webBuilder.waitForSearchResult()]);
        });

        await test.step("Verify results", async () => {
          for (const template of data.expected_section) {
            await expect(webBuilder.templateContainer).toContainText(template);
          }
        });
      }

      for (const noResult of conf.caseConf.no_result_data) {
        await test.step("Combine filter and search keyword", async () => {
          await webBuilder.chooseLibraryFilter(noResult.lib_filter);
          await Promise.all([
            webBuilder.searchbarTemplate.fill(noResult.search_keyword),
            webBuilder.waitForSearchResult(),
          ]);
        });

        await test.step("Verify results", async () => {
          await expect(webBuilder.searchEmpty).toBeVisible();
          await expect(webBuilder.searchEmpty).toHaveText(noResult.message);
        });
      }
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_22 - Case click icon (+)", async ({ conf }) => {
      await test.step("Click insert panel button ", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
        await webBuilder.getCategoryByName("Same name cate").click();
      });

      for (const data of conf.caseConf.valid_data) {
        await test.step("Combine filter and search keyword", async () => {
          await webBuilder.chooseLibraryFilter(data.lib_filter);
          await webBuilder.removeSearchKey();
          await webBuilder.getCategoryByName("Same name cate").click();
          await Promise.all([
            webBuilder.searchbarTemplate.pressSequentially(data.search_keyword),
            webBuilder.waitForSearchResult(),
          ]);
        });

        await test.step("Verify results", async () => {
          for (const template of data.expected_templates) {
            await expect(webBuilder.templateContainer).toContainText(template);
          }
        });
      }

      for (const noResult of conf.caseConf.no_result_data) {
        await test.step("Combine filter and search keyword", async () => {
          await webBuilder.chooseLibraryFilter(noResult.lib_filter);
          await webBuilder.removeSearchKey();
          await webBuilder.getCategoryByName("Same name cate").click();
          await Promise.all([
            webBuilder.searchbarTemplate.pressSequentially(noResult.search_keyword),
            webBuilder.waitForSearchResult(),
          ]);
        });

        await test.step("Verify results", async () => {
          await expect(webBuilder.searchEmpty).toBeVisible();
          await expect(webBuilder.searchEmpty).toHaveText(noResult.message);
        });
      }
    });
  });

  test("@SB_WEB_BUILDER_INSERT_PANEL_24 - Check drag and drop block từ Insert Panel sang Preview page", async ({
    dashboard,
    conf,
  }) => {
    const expected = conf.caseConf.expected;
    const firstBlockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_first);
    const secondBlockHeading = webBuilder.getSelectorByIndex(conf.caseConf.block_second);
    const manualBlock = webBuilder.getSelectorByIndex(conf.caseConf.block_manual);

    await test.step("Drag and drop block Heading to column 1", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_heading1_auto);
    });

    await test.step("Verify position block = auto after dropped", async () => {
      await webBuilder.frameLocator.locator(firstBlockHeading).click();
      const positionSetting = await dashboard
        .locator(`${webBuilder.getSelectorByLabel("position")}//button`)
        .innerText();
      expect(positionSetting).toBe(expected.auto_position);
      await expect(webBuilder.frameLocator.locator(firstBlockHeading)).toHaveClass(new RegExp(expected.selected));
    });

    await test.step("Drag and drop another block Heading to the bottom of first block", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_heading2_auto);
    });

    await test.step("Verify position block = auto after dropped", async () => {
      await webBuilder.frameLocator.locator(secondBlockHeading).click();
      const positionSetting = await dashboard
        .locator(`${webBuilder.getSelectorByLabel("position")}//button`)
        .innerText();
      expect(positionSetting).toBe(expected.auto_position);
      await expect(webBuilder.frameLocator.locator(secondBlockHeading)).toHaveClass(new RegExp(expected.selected));
    });

    await test.step("Drag and drop block to manual position", async () => {
      const dndInfo = Object.assign(conf.caseConf.dnd_manual, {
        async callBack({ page, x, y }) {
          await page.mouse.move(x, y * 0.9);
        },
      });
      await webBuilder.dragAndDropInWebBuilder(dndInfo);
    });

    await test.step("Verify position block = auto after dropped", async () => {
      await webBuilder.backBtn.click();
      await webBuilder.frameLocator.locator(manualBlock).click();
      const positionSetting = await dashboard
        .locator(`${webBuilder.getSelectorByLabel("position")}//button`)
        .innerText();
      expect(positionSetting).toBe(expected.auto_position);
      await expect(webBuilder.frameLocator.locator(manualBlock)).toHaveClass(new RegExp(expected.selected));
    });
  });

  test("@SB_WEB_BUILDER_INSERT_PANEL_25 - Check drag and drop blank section ở Insert panel", async ({ conf }) => {
    const expected = conf.caseConf.expected;
    const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
    const sectionStyle = webBuilder.frameLocator.locator(blankSection).locator(webBuilder.sectionsInPreview);
    const rowInSection = webBuilder.frameLocator.locator(blankSection).locator(webBuilder.rowsInPreview);
    const columnInSection = webBuilder.frameLocator.locator(blankSection).locator(webBuilder.columnsInPreview);
    const fullWidth = webBuilder.genLoc(webBuilder.getSelectorByLabel("full_width")).getByRole("checkbox");
    const padding = webBuilder.genLoc(webBuilder.getSelectorByLabel("padding")).getByRole("textbox");
    const margin = webBuilder.genLoc(webBuilder.getSelectorByLabel("margin")).getByRole("textbox");

    await test.step("Drag and drop blank section between 2 sections", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_blank_section);
      await webBuilder.switchToTab("Design");
    });

    await test.step("Verify blank section default settings", async () => {
      const sectionMinHeight = await sectionStyle.evaluate(section =>
        getComputedStyle(section).getPropertyValue("height"),
      );
      await expect(webBuilder.frameLocator.locator(blankSection)).toHaveClass(new RegExp(expected.selected));
      await expect(fullWidth).not.toBeChecked();
      expect(sectionMinHeight).toBe(expected.height);
      await expect(rowInSection).toHaveCount(expected.row);
      await expect(columnInSection).toHaveCount(expected.column);
      await expect(padding).toHaveValue(expected.padding);
      await expect(margin).toHaveValue(expected.margin);
    });
  });

  test("@SB_WEB_BUILDER_INSERT_PANEL_26 - Check hiển thị khi click button Add section khi button nằm giữa 2 section", async ({
    conf,
  }) => {
    const blankSection = webBuilder.getSelectorByIndex(conf.caseConf.blank_section);
    await test.step("Hover on section", async () => {
      await webBuilder.frameLocator.locator(blankSection).click({ position: { x: 5, y: 5 } });
    });

    await test.step("Verify add section buttons appear", async () => {
      await expect(addSectionBtnTop).toBeVisible();
      await expect(addSectionBtnBottom).toBeVisible();
    });

    await test.step("Click add section button", async () => {
      await addSectionBtnBottom.click();
    });

    await test.step("Verify placeholder and insert panel display", async () => {
      await expect(webBuilder.addSectionPlaceHolder).toBeVisible();
      await expect(webBuilder.insertCateList).toBeVisible();
      await expect(webBuilder.insertPreview).toBeVisible();
    });
  });

  test("@SB_WEB_BUILDER_INSERT_PANEL_27 - Check hiển thị khi click button Add section khi button nằm ở section đầu/cuối	", async ({
    conf,
  }) => {
    addSectionBtnTop = webBuilder.getAddSectionBtn({ section: 2 });
    addSectionBtnBottom = webBuilder.getAddSectionBtn({ section: 2, position: "after" });
    const lastSection = webBuilder.getSelectorByIndex(conf.caseConf.last_section);

    await test.step("Click on last section", async () => {
      await webBuilder.clickOnElement(lastSection, webBuilder.iframe);
    });

    await test.step("Verify add section button", async () => {
      await expect(addSectionBtnTop).toBeVisible();
      await expect(addSectionBtnBottom).toBeVisible();
    });

    await test.step("Add section at the bottom", async () => {
      await addSectionBtnBottom.scrollIntoViewIfNeeded();
      await addSectionBtnBottom.click();
    });

    await test.step("Verify placeholder and insert panel display", async () => {
      await expect(webBuilder.addSectionPlaceHolder).toBeVisible();
      await expect(webBuilder.insertCateList).toBeVisible();
      await expect(webBuilder.insertPreview).toBeVisible();
    });
  });

  test.describe("@SB_IP_SUITE_8 - Check update store type filter", () => {
    test("@SB_WEB_BUILDER_INSERT_PANEL_28 - Check default filter shoptype of Creator shop", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const creatorFilter = webBuilder.getFilterOptionStoreTypeLocator("Creator");
      const ecomFilter = webBuilder.getFilterOptionStoreTypeLocator("E-commerce");

      await test.step("Open insert panel", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Open store type filter", async () => {
        await webBuilder.storeTypeFilterBtn.click();
      });

      await test.step("Verify default filter", async () => {
        await expect(webBuilder.storeTypeFilterOption).toHaveCount(expected.filter_count);
        await expect(creatorFilter).toBeVisible();
        await expect(creatorFilter).toBeDisabled();
        await expect(ecomFilter).toBeVisible();
        await expect(creatorFilter).toBeChecked();
        await expect(ecomFilter).not.toBeChecked();
      });
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_29 - Check kết hợp filter và search", async ({ dashboard, builder, conf }) => {
      await test.step("Pre-condition: Create data test", async () => {
        for (const lib of conf.caseConf.create_libs) {
          const libInfo = await builder.createLibrary(lib);
          for (const cate of lib.cate_data) {
            const createCate = Object.assign(cate, { library_id: libInfo.id });
            const cateInfo = await builder.createCategoryByAPI(createCate);
            const createTemplate = Object.assign(cate.template, { library_id: libInfo.id, category_id: cateInfo.id });
            await builder.createComponent(createTemplate);
          }
        }
        await dashboard.reload();
        await blocks.frameLocator.locator(blocks.xpathAddSection).click({ delay: 200 });
        await blocks.page.getByTestId("section_default").click();
      });

      await test.step("Open insert panel", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
        await webBuilder.getCategoryByName("About").click();
      });

      for (const searchData of conf.caseConf.valid_search_data) {
        await test.step("Combine filter and enter keyword search", async () => {
          await webBuilder.storeTypeFilter(searchData.store_type);
          await webBuilder.chooseLibraryFilter(searchData.library_filter);
          await Promise.all([webBuilder.searchbarTemplate.fill(searchData.keyword), webBuilder.waitForSearchResult()]);
        });

        await test.step("Verify valid search result", async () => {
          const actualResults = await webBuilder.getAllTemplatePreview();
          expect(actualResults).toEqual(searchData.expected_results);
        });
      }

      for (const searchData of conf.caseConf.invalid_search_data) {
        await test.step("Combine filter and enter keyword search", async () => {
          await webBuilder.storeTypeFilter(searchData.store_type);
          await webBuilder.chooseLibraryFilter(searchData.library_filter);
          await webBuilder.searchbarTemplate.fill(searchData.keyword);
        });

        await test.step("Verify invalid search result", async () => {
          await expect(webBuilder.searchEmpty).toBeVisible();
        });
      }
    });

    test("@SB_WEB_BUILDER_INSERT_PANEL_30 - Check thay đổi filter shoptype", async ({ conf }) => {
      const expected = conf.caseConf.expected;
      const creatorFilter = webBuilder.getFilterOptionStoreTypeLocator("Creator");
      const ecomFilter = webBuilder.getFilterOptionStoreTypeLocator("E-commerce");
      await test.step("Open insert panel", async () => {
        await webBuilder.clickBtnNavigationBar("insert");
      });

      await test.step("Open store type filter", async () => {
        await webBuilder.storeTypeFilterBtn.click();
      });

      await test.step("Untick ecommece filter", async () => {
        // eslint-disable-next-line playwright/no-force-option
        await ecomFilter.click({ force: true });
      });

      await test.step("Verify filter", async () => {
        await expect(ecomFilter).toBeDisabled();
        await expect(ecomFilter).toBeChecked();
      });

      await test.step("Tick creator filter", async () => {
        await creatorFilter.click();
      });

      await test.step("Verify changes", async () => {
        await expect(creatorFilter).toBeEnabled();
        await expect(ecomFilter).toBeEnabled();
        await expect(ecomFilter).toBeChecked();
        for (const template of expected.templates) {
          await expect(webBuilder.templateContainer).toContainText(template);
        }
      });
    });
  });

  test(`@SB_WEB_BUILDER_INSERT_PANEL_31 Check UI khi page không có section nào và insert first section trong web builder`, async ({
    builder,
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const expected = conf.caseConf.expected;
    let addedSectionBox: { x: number; y: number; height: number; width: number };
    const insertBtn = webBuilder.frameLocator.getByRole("button");
    const image = webBuilder.frameLocator.locator(webBuilder.emptyPageImage);
    const heading = webBuilder.frameLocator.locator(webBuilder.emptyPageHeading);
    const description = webBuilder.frameLocator.locator(webBuilder.emptyPageDescription);
    const firstSectionAdded = webBuilder.frameLocator.locator(webBuilder.getSelectorByIndex({ section: 1 }));
    const blankSection = webBuilder.getTemplatePreviewByName("Single column");
    const popup = webBuilder.getTemplatePreviewByName("Popup");
    const oldBlankPage = webBuilder.genLoc(webBuilder.oldBlankPage);

    await test.step("Pre-condition: Apply template rỗng", async () => {
      const pageID = (await builder.getPageInfoByProductId(dProId[0], "product")).id;
      const page = await builder.pageBuilder(pageID);
      const variant = "product-" + dProId[0];
      page.settings_data.pages.product[variant].sections = conf.caseConf.theme_data.blank;
      page.settings_data.pages.product[variant].elements = conf.caseConf.theme_data.blank;
      await builder.updatePageBuilder(pageID, page.settings_data);
      await dashboard.reload();
      await webBuilder.reloadIfNotShow();
      if (await oldBlankPage.isVisible()) {
        await oldBlankPage.evaluate(ele => {
          ele.style.position = "unset";
        });
      }
    });

    await test.step(`Check UI khi template không có section nào`, async () => {
      await expect(image).toBeVisible();
      await expect(insertBtn).toBeVisible();
      await expect(insertBtn).toHaveText(expected.button_label);
      await expect(heading).toHaveText(expected.heading_blank_page);
      await expect(description).toHaveText(expected.description_blank_page);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        iframe: webBuilder.iframe,
        selector: webBuilder.emptyPageImage,
        snapshotName: expected.snapshot_name,
      });
    });

    await test.step(`Ấn Add something`, async () => {
      await insertBtn.click();
    });

    const placeholderBox = await webBuilder.addSectionPlaceHolder.boundingBox();
    await test.step("Verify placeholder and template in insert panel", async () => {
      await expect(webBuilder.addSectionPlaceHolder).toBeVisible();
      await expect(blankSection).toBeVisible();
      await expect(popup).toBeVisible();
    });

    await test.step(`Chọn 1 section bất kỳ`, async () => {
      await blankSection.click();
    });

    addedSectionBox = await firstSectionAdded.boundingBox();
    await test.step("Verify add section success and in right place", async () => {
      await expect(firstSectionAdded).toBeVisible();
      await expect(firstSectionAdded).toHaveClass(new RegExp(expected.selected));
      expect(addedSectionBox.x).toEqual(placeholderBox.x);
      expect(addedSectionBox.y).toEqual(placeholderBox.y);
      await webBuilder.removeLayer({ sectionName: "Single column" });
      if (await oldBlankPage.isVisible()) {
        await oldBlankPage.evaluate(ele => {
          ele.style.position = "unset";
        });
      }
    });

    await test.step(`Drag and drop section vào page trống`, async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.caseConf.dnd_section);
    });

    addedSectionBox = await firstSectionAdded.boundingBox();
    await test.step("Verify add section success and in right place", async () => {
      await expect(firstSectionAdded).toBeVisible();
      await expect(firstSectionAdded).toHaveClass(new RegExp(expected.selected));
      expect(addedSectionBox.x).toEqual(placeholderBox.x);
      expect(addedSectionBox.y).toEqual(placeholderBox.y);
    });
  });
});
