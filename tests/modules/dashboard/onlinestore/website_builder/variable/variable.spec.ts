import { expect, test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@core/utils/theme";
import { FrameLocator, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import {
  addBlockIntoElement,
  addBlockIntoWB,
  clickPreviewButton,
  setVariableOnQuickbar,
  setVariableTypeImage,
  setVariableTypeText,
} from "./variable-util";
import { loadData } from "@core/conf/conf";
import { PageSettingsData } from "@types";
import { waitTimeout } from "@core/utils/api";

let frameLocator: FrameLocator, xpathBlock: Blocks;
let settingsData: PageSettingsData;
let settingsDataPublish: PageSettingsData;
let blocks: Blocks;
let webBuilder: WebBuilder;
let currentPage: Page;
let dashboardPage: DashboardPage;

test.beforeAll(async ({ builder, conf }) => {
  await test.step("Get theme default", async () => {
    const response = await builder.pageSiteBuilder(conf.suiteConf.page_id);
    settingsData = response.settings_data as PageSettingsData;
  });
});

test.beforeEach(async ({ conf, dashboard, builder }, testInfo) => {
  const suiteConf = conf.suiteConf;

  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);

  xpathBlock = new Blocks(dashboard, suiteConf.domain);
  frameLocator = xpathBlock.frameLocator;
  webBuilder = new WebBuilder(dashboard, suiteConf.domain);
  blocks = new Blocks(dashboard, suiteConf.domain);

  await test.step("Update theme", async () => {
    if (!settingsData) {
      const response = await builder.pageSiteBuilder(conf.suiteConf.shop_theme_id);
      settingsData = response.settings_data as PageSettingsData;
    }

    //get publish theme data
    const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.shop_theme_id);
    settingsDataPublish = responsePublish.settings_data as PageSettingsData;

    //Update page data for publish theme
    if (conf.caseConf.page_setting) {
      settingsDataPublish.pages[conf.caseConf.page_setting].default.elements =
        settingsData.pages[conf.caseConf.page_setting].default.elements;
      await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);
    } else {
      settingsDataPublish.pages["home"].default.elements = settingsData.pages["home"].default.elements;
      await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);
    }
  });

  await test.step("Pre-condition: Open web builder", async () => {
    dashboardPage = new DashboardPage(dashboard, suiteConf.domain);
    //Go to web front by page ID
    await dashboardPage.navigateToMenu("Online Store");
    await dashboardPage.page.getByRole("button", { name: "Customize" }).first().click();
    await frameLocator.locator(blocks.overlay).waitFor({ state: "hidden" });
  });
});

test.describe("Check setting variable", () => {
  const conf = loadData(__dirname, "TC_NORMAL_BLOCK");
  const blockData = conf.suiteConf.block_data;
  const suiteConf = conf.suiteConf;
  const blockPosition = blockData.block_position;
  let numberOfValue: number;

  for (const [caseId, caseConf] of Object.entries(conf.caseConf)) {
    test(`@${caseId} ${caseConf.description}`, async ({ dashboard, context }) => {
      const dataType = caseConf.source_type_section.toLowerCase();
      numberOfValue = caseConf.variable_fields_text.length;
      await dashboard.locator('header [name="Layer"]').click();
      await webBuilder.setVariableForSection({
        sectionName: "Single column",
        sourceType: caseConf.source_type_section,
        sourceData: caseConf.source_data_section,
        sectionIndex: 1,
      });

      //check variable with block setting on quickbar
      for (const blockQuickBar of blockData.setting_on_quickbar) {
        const blockSelector = webBuilder.getSelectorByIndex(blockPosition);

        await test.step("Add block into section", async () => {
          await addBlockIntoWB(suiteConf, dashboard, blockQuickBar, blockPosition.section);
          await webBuilder.frameLocator.locator(blockSelector).dblclick();
          await expect(webBuilder.frameLocator.locator('[id="quick-settings"]')).toBeVisible();
        });

        await test.step("Set variable for block", async () => {
          for (const variableFieldsText of caseConf.variable_fields_text) {
            await webBuilder.frameLocator.locator(blockSelector).dblclick();
            await setVariableOnQuickbar(
              suiteConf,
              dashboard,
              caseConf.source_type_section,
              variableFieldsText.variable,
            );

            await webBuilder.backBtn.click({
              delay: 1000, //lỗi block heading/paragraph không apply setting nếu click khỏi text editor quá nhanh
            });

            if (variableFieldsText.attribute == "shop.name") {
              variableFieldsText.value = conf.suiteConf.shop_name;
            }
            if (variableFieldsText.attribute == "shop.domain") {
              variableFieldsText.value = conf.suiteConf.domain;
            }
            await expect(
              webBuilder.frameLocator
                .locator(`[component=${blockQuickBar.block_component}] span[data-type='variable']`)
                .first(),
            ).toHaveText(`${variableFieldsText.value}`);
          }
        });

        await test.step("Save & click icon preview", async () => {
          await webBuilder.clickSaveButton();
          currentPage = await clickPreviewButton({ context, dashboard });
          for (const variableFieldsText of caseConf.variable_fields_text) {
            await expect(
              currentPage
                .locator(`[component=${blockQuickBar.block_component}] [value='${variableFieldsText.attribute}']`)
                .first(),
            ).toHaveText(`${variableFieldsText.value}`);

            //verify block match variable on SF
            await currentPage.goto(`https://${suiteConf.domain}`);
            await currentPage.waitForLoadState("load");
            await expect(
              currentPage
                .locator(`[component=${blockQuickBar.block_component}] [value='${variableFieldsText.attribute}']`)
                .first(),
            ).toHaveText(`${variableFieldsText.value}`);
          }
        });
      }

      //check variable with block setting on sidebar
      //block Image
      await test.step("Add block into web builder & open Content tab", async () => {
        await addBlockIntoWB(suiteConf, dashboard, blockData.setting_on_sidebar.block_image, blockPosition.section);
        await dashboard.locator(".sb-tab--inside .sb-tab-navigation__item--default").first().click();
        await expect(webBuilder.frameLocator.locator('[component="block_image"]')).toBeVisible();
      });

      if (caseConf.variable_fields_image) {
        for (const variableFieldsImage of caseConf.variable_fields_image) {
          await test.step("Set variable for image field", async () => {
            await webBuilder.switchToTab("Content");
            await setVariableTypeImage(
              dashboard,
              blockData.setting_on_sidebar.block_image.widget_image,
              dataType,
              variableFieldsImage.variable,
            );

            if (variableFieldsImage.variable == "Product's media Image") {
              variableFieldsImage.value = conf.suiteConf.product_01_image;
            }
            if (variableFieldsImage.variable == "Collection's Thumbnail Image") {
              variableFieldsImage.value = conf.suiteConf.colletion_01_image;
            }
            await expect(webBuilder.frameLocator.locator('[component="block_image"] img').first()).toHaveAttribute(
              "src",
              new RegExp(variableFieldsImage.value),
            );
          });

          await test.step("Save & click icon preview", async () => {
            await webBuilder.clickSaveButton();
            currentPage = await clickPreviewButton({ context, dashboard });

            await expect(currentPage.locator('[component="block_image"] img').first()).toHaveAttribute(
              "src",
              new RegExp(variableFieldsImage.value),
            );

            //verify block image match variable on SF
            await currentPage.goto(`https://${suiteConf.domain}`);
            await currentPage.waitForLoadState("load");

            await expect(currentPage.locator('[component="block_image"] img').first()).toHaveAttribute(
              "src",
              new RegExp(variableFieldsImage.value),
            );
          });
        }
      }
      for (const variableFieldsText of caseConf.variable_fields_text) {
        await test.step("Set variable for Alt text field", async () => {
          await webBuilder.switchToTab("Content");
          await setVariableTypeText(
            dashboard,
            blockData.setting_on_sidebar.block_image.widget_text,
            dataType,
            variableFieldsText.variable,
          );

          await expect(webBuilder.frameLocator.locator('[component="block_image"] img').first()).toHaveAttribute(
            "alt",
            `${variableFieldsText.value}`,
          );
        });
      }

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });

        await expect(currentPage.locator('[component="block_image"] img').first()).toHaveAttribute(
          "alt",
          `${caseConf.variable_fields_text[numberOfValue - 1].value}`,
        );

        //verify block match variable on SF
        await currentPage.goto(`https://${suiteConf.domain}`);
        await currentPage.waitForLoadState("load");

        await expect(currentPage.locator('[component="block_image"] img').first()).toHaveAttribute(
          "alt",
          `${caseConf.variable_fields_text[numberOfValue - 1].value}`,
        );
      });

      //block Button
      await test.step("Add block into web builder & open Content tab", async () => {
        await addBlockIntoWB(suiteConf, dashboard, blockData.setting_on_sidebar.block_button, blockPosition.section);
        await dashboard.locator(".sb-tab--inside .sb-tab-navigation__item--default").first().click();
        await expect(webBuilder.frameLocator.locator('[component="button"]')).toBeVisible();
      });

      for (const variableFieldsText of caseConf.variable_fields_text) {
        await test.step("Set variable for Label field", async () => {
          await webBuilder.switchToTab("Content");
          await setVariableTypeText(
            dashboard,
            blockData.setting_on_sidebar.block_button.widget_text,
            dataType,
            variableFieldsText.variable,
          );

          await expect(webBuilder.frameLocator.locator('[component="button"] span').first()).toHaveText(
            `${variableFieldsText.value}`,
          );
        });
      }

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });

        await expect(currentPage.locator('[component="button"] span').first()).toHaveText(
          `${caseConf.variable_fields_text[numberOfValue - 1].value}`,
        );

        //verify block match variable on SF
        await currentPage.goto(`https://${suiteConf.domain}`);
        await currentPage.waitForLoadState("load");

        await expect(currentPage.locator('[component="button"] span').first()).toHaveText(
          `${caseConf.variable_fields_text[numberOfValue - 1].value}`,
        );
      });
    });
  }

  test("@SB_SC_SCWB_6 Check set block variable with data source = Current page", async ({
    dashboard,
    conf,
    context,
    builder,
  }) => {
    settingsDataPublish.pages["collection"].default.elements = settingsData.pages["collection"].default.elements;
    await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);
    await dashboard.reload();
    await frameLocator.locator(blocks.overlay).waitFor({ state: "hidden" });

    for (const caseData of conf.caseConf.data) {
      await test.step("Verify block when data source = Current page", async () => {
        await webBuilder.selectPageOnPageSelector(`${caseData.page_name}`);
        await dashboard.waitForSelector('.sb-selection-group-item:has-text("Preview:")');

        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: "Current page",
          sectionIndex: 1,
        });
        //verify section on web front apply variable
        await expect(webBuilder.frameLocator.locator("section .layer-selector").first()).toHaveAttribute(
          "class",
          /is-source-connected/,
        );
      });

      //check variable with block setting on quickbar
      for (const blockQuickBar of blockData.setting_on_quickbar) {
        const blockSelector = webBuilder.getSelectorByIndex(blockPosition);

        await test.step("Add block into section", async () => {
          await addBlockIntoWB(suiteConf, dashboard, blockQuickBar, blockPosition.section);
          await webBuilder.frameLocator.locator(blockSelector).dblclick();
          await expect(webBuilder.frameLocator.locator('[id="quick-settings"]')).toBeVisible();
        });
        for (const variableFieldsText of caseData.variable_fields_text) {
          await test.step("Set variable for block", async () => {
            await webBuilder.frameLocator.locator(blockSelector).dblclick();
            await setVariableOnQuickbar(suiteConf, dashboard, caseData.source_type_page, variableFieldsText.variable);

            await webBuilder.backBtn.click({
              delay: 1000,
            });
            await expect(
              webBuilder.frameLocator
                .locator(`[component=${blockQuickBar.block_component}] span[data-type='variable']`)
                .first(),
            ).toHaveText(`${variableFieldsText.value}`);
          });

          await test.step("Save & click icon preview", async () => {
            await webBuilder.clickSaveButton();
            currentPage = await clickPreviewButton({ context, dashboard });
            await expect(
              currentPage.locator(`[component=${blockQuickBar.block_component}] span[data-type='variable']`).first(),
            ).toHaveText(`${variableFieldsText.value}`);
          });
        }
      }
    }
  });

  test("@SB_SC_SCWB_15 Verify list source tại trường data source của các page", async ({ dashboard, conf }) => {
    await test.step("Verify page not entity is no have option current page", async () => {
      for (const pageNotEntity of conf.caseConf.page_not_entity) {
        await webBuilder.selectPageOnPageSelector(pageNotEntity);

        await dashboard.locator('header [name="Layer"]').click({ delay: 500 });
        await webBuilder.openLayerSettings({
          sectionName: "Section",
          sectionIndex: 1,
        });

        await dashboard.locator(".sb-tab-navigation__item div:text-is('Content')").click();
        await dashboard.locator("[id='search-data-source']").click();

        await expect(dashboard.locator("[class='list-source'] span:has-text('Current page')")).toBeHidden();
      }
    });

    await test.step("Verify entity page is have option current page", async () => {
      for (const pageEntity of conf.caseConf.page_entity) {
        await webBuilder.selectPageOnPageSelector(pageEntity);
        await dashboard.waitForSelector('.sb-selection-group-item:has-text("Preview:")');

        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.openLayerSettings({
          sectionName: "Section",
          sectionIndex: 1,
        });

        await dashboard.locator(".sb-tab-navigation__item div:text-is('Content')").click();
        await dashboard.locator("[id='search-data-source']").click();

        await expect(dashboard.locator("[class='list-source'] span:has-text('Current page')")).toBeVisible();
      }
    });
  });

  test("@SB_SC_SCWB_8 Verify set variable cho block khi block nằm trong container và container nằm trong section với data source của container # None", async ({
    conf,
    dashboard,
    context,
  }) => {
    let containerPosition = { section: 0, block: 0 };
    await test.step("Kéo block container vào section", async () => {
      await webBuilder.dragAndDropInWebBuilder({
        from: {
          category: "Basics",
          template: "Container",
        },
        to: {
          position: {
            section: 1,
            column: 1,
          },
          isBottom: false,
        },
      });

      containerPosition = { section: 1, block: 1 };
      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block được chọn vào container ", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: containerPosition,
        position: "Top",
        category: "Basics",
        template: "Heading",
      });
      await expect(webBuilder.frameLocator.locator('[id="quick-settings"]')).toBeVisible();

      await dashboard.locator('header [name="Layer"]').click();
      await dashboard.locator(".w-builder__layers-body button").first().click();
    });

    for (const containerSource of conf.caseConf.container_source) {
      await test.step("Connect data source cho container", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Container",
          sourceType: containerSource.source_type,
          sourceData: containerSource.source_data,
          sectionIndex: 1,
        });

        await dashboard.waitForTimeout(1000); //set variable quá nhanh, block trong iframe chưa apply kịp
        await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
          containerSource.source_data,
        );
      });

      await test.step("Verify data source của block", async () => {
        await webBuilder.frameLocator.locator('[component="heading"]').dblclick();
        await setVariableOnQuickbar(suiteConf, dashboard, containerSource.source_type, containerSource.variable);
        await webBuilder.backBtn.click({
          delay: 1000, //lỗi block heading/paragraph không apply setting nếu click khỏi text editor quá nhanh
        });

        await expect(
          webBuilder.frameLocator.locator("[component='heading'] span[data-type='variable']").first(),
        ).toHaveText(containerSource.source_data);
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        await expect(currentPage.locator("[component='heading'] span[data-type='variable']").first()).toHaveText(
          containerSource.source_data,
        );
      });
    }
  });

  test("@SB_SC_SCWB_9 Verify set variable cho block khi block nằm trong container và container nằm trong section với data source của container = None", async ({
    conf,
    dashboard,
    context,
  }) => {
    let containerPosition = { section: 0, block: 0 };

    await test.step("Kéo block container vào section", async () => {
      await webBuilder.dragAndDropInWebBuilder({
        from: {
          category: "Basics",
          template: "Container",
        },
        to: {
          position: {
            section: 1,
            column: 1,
          },
          isBottom: false,
        },
      });

      containerPosition = { section: 1, block: 1 };
      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block được chọn vào container ", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: containerPosition,
        position: "Top",
        category: "Basics",
        template: "Heading",
      });

      await expect(webBuilder.frameLocator.locator('[id="quick-settings"]')).toBeVisible();

      await dashboard.locator('header [name="Layer"]').click();
      await dashboard.locator(".w-builder__layers-body button").first().click();
    });

    for (const sectionSource of conf.caseConf.section_source) {
      await test.step("Connect data source cho section", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource.source_type,
          sourceData: sectionSource.source_data,
          sectionIndex: 1,
        });

        await dashboard.waitForTimeout(1000); //set variable quá nhanh, block trong iframe chưa apply kịp
        await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(sectionSource.source_data);
      });

      await test.step("Verify data source của container vẫn = None", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.openLayerSettings({
          sectionName: "Container",
          sectionIndex: 1,
        });

        await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
      });

      await test.step("Verify data source của block", async () => {
        await webBuilder.frameLocator.locator('[component="heading"]').dblclick();
        await setVariableOnQuickbar(suiteConf, dashboard, sectionSource.source_type, sectionSource.variable);
        await webBuilder.backBtn.click({
          delay: 1000, //lỗi block heading/paragraph không apply setting nếu click khỏi text editor quá nhanh
        });

        await expect(
          webBuilder.frameLocator.locator("[component='heading'] span[data-type='variable']").first(),
        ).toHaveText(sectionSource.source_data);
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        await expect(currentPage.locator("[component='heading'] span[data-type='variable']").first()).toHaveText(
          sectionSource.source_data,
        );
      });
    }
  });

  test("@SB_SC_SCWB_22 Verify popup connect data source tại tab content của block", async ({ conf, dashboard }) => {
    for (const caseData of conf.caseConf.data) {
      await test.step("Kéo block vào web builder", async () => {
        await addBlockIntoWB(suiteConf, dashboard, { block_name: caseData.block_name }, blockPosition.section);
        await dashboard.locator(".w-builder .w-builder__header").hover();
        await webBuilder.frameLocator
          .locator(
            `//div[@data-block-component="${caseData.block_component}"]//div[contains(@class, 'validate-source-msg')]`,
          )
          .hover();

        await expect(
          webBuilder.frameLocator.locator(`[data-block-component="${caseData.block_component}"]`),
        ).toHaveAttribute("class", /hover/);
        await expect(webBuilder.frameLocator.locator("//p[contains(@class, 'element-name__breadcrumb')]")).toHaveText(
          `${caseData.block_name}: missing data`,
        );
      });

      await test.step("Click trường Data source của block", async () => {
        await dashboard.locator(".sb-tab-navigation__item div:text-is('Content')").click();
        await dashboard.locator(webBuilder.selectorDataSourceWidget).click();

        await expect(dashboard.locator(".sb-popup__wrapper .sb-popup__container")).toBeVisible();
        await expect(dashboard.locator(".sb-popup__header .modal-select-source__header")).toHaveText(
          `Change ${caseData.block_type.toLowerCase()}`,
        );
        await expect(dashboard.locator(".sb-popup__body .modal-select-source__description").first()).toHaveText(
          `You need to connect section to a ${caseData.block_type.toLowerCase()} to use this block`,
        );
      });

      await test.step(`Chọn variable cho ${caseData.block_type}`, async () => {
        await dashboard.locator('[id="search-data-source"]').click();
        await expect(dashboard.locator(`.list-source span:text-is('${caseData.block_type}')`)).toBeVisible();
      });

      await test.step("Check search function", async () => {
        await dashboard.locator(`.list-source span:text-is('${caseData.block_type}')`).click();
        await dashboard.locator(`[placeholder="Search ${caseData.block_type.toLowerCase()}"]`).click();

        //dien ki tu khong match voi ket qua nao
        await dashboard
          .locator(`[placeholder="Search ${caseData.block_type.toLowerCase()}"]`)
          .fill(`${conf.caseConf.search_no_result}`);
        await expect(dashboard.locator(".list-search-result label")).toHaveText(
          `Could not find any results for '${conf.caseConf.search_no_result}'`,
        );

        //dien ki tu co ket qua
        await dashboard
          .locator(`[placeholder="Search ${caseData.block_type.toLowerCase()}"]`)
          .fill(`${conf.caseConf.search_have_result}`);
        const numberOfResult = await dashboard.locator(".list-search-result .source-result-title").count();
        for (let i = 1; i < numberOfResult; i++) {
          await expect(dashboard.locator(`.list-search-result .source-result-title >> nth=${i - 1}`)).toContainText(
            `${conf.caseConf.search_have_result}`,
          );
        }

        await dashboard.locator(".list-search-result .source-result-title").first().click();
        await expect(dashboard.locator('[class="data-source-title connected"]')).toContainText(
          `${conf.caseConf.search_have_result}`,
        );
        await dashboard.locator('.sb-popup__footer span:text-is("Save")').click();
      });

      await test.step("Verfy data source của section cha", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.openLayerSettings({
          sectionName: "Single column",
          sectionIndex: 1,
        });

        await expect(dashboard.locator('[class="data-source-title connected"]')).toContainText(
          `${conf.caseConf.search_have_result}`,
        );
      });
    }
  });

  test("@SB_SC_SCWB_10 Verify set variable cho block khi block nằm trong tabs và tabs nằm trong section với data source của tabs # None", async ({
    conf,
    dashboard,
    context,
  }) => {
    await test.step("Kéo block tabs vào section", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          column: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Tabs",
      });

      await dashboard.locator(".sb-tab--inside .sb-tab-navigation__item--default").first().click();
      await webBuilder.switchToTab("Content");
      await dashboard.locator(`//label[contains(text(), '${conf.caseConf.item}')]`).click();
      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block được chọn vào tabs ", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          block: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Heading",
      });
      await expect(webBuilder.frameLocator.locator('[id="quick-settings"]')).toBeVisible();

      await dashboard.locator('header [name="Layer"]').click();
      await dashboard.locator(".w-builder__layers-body button").first().click();
    });

    for (const tabsSource of conf.caseConf.tabs_source) {
      await test.step("Connect data source cho tabs", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: conf.caseConf.item,
          sourceType: tabsSource.source_type,
          sourceData: tabsSource.source_data,
          sectionIndex: 1,
        });
        await dashboard.waitForTimeout(1000); //set variable quá nhanh, block trong iframe chưa apply kịp

        await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(tabsSource.source_data);
      });

      await test.step("Verify data source của block", async () => {
        await webBuilder.frameLocator.locator('[component="heading"]').dblclick();
        await setVariableOnQuickbar(suiteConf, dashboard, tabsSource.source_type, tabsSource.variable);
        await webBuilder.backBtn.click({
          delay: 1000, //loi block heading/paragraph khong apply setting neu click khoi text editor qua nhanh
        });

        await expect(
          webBuilder.frameLocator.locator("[component='heading'] span[data-type='variable']").first(),
        ).toHaveText(tabsSource.source_data);
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        await expect(currentPage.locator("[component='heading'] span[data-type='variable']").first()).toHaveText(
          tabsSource.source_data,
        );
      });
    }
  });

  test("@SB_SC_SCWB_11 Verify set variable cho block khi block nằm trong tabs và tabs nằm trong section với data source của tabs = None", async ({
    conf,
    dashboard,
    context,
  }) => {
    await test.step("Kéo block tabs vào section", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          column: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Tabs",
      });

      await dashboard.locator(".sb-tab--inside .sb-tab-navigation__item--default").first().click();
      await webBuilder.switchToTab("Content");
      await dashboard.locator(`//label[contains(text(), '${conf.caseConf.item}')]`).click();
      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block được chọn vào tabs ", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          block: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Heading",
      });
      await expect(webBuilder.frameLocator.locator('[id="quick-settings"]')).toBeVisible();

      await dashboard.locator('header [name="Layer"]').click();
      await dashboard.locator(".w-builder__layers-body button").first().click();
    });

    for (const sectionSource of conf.caseConf.section_source) {
      await test.step("Connect data source cho section", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource.source_type,
          sourceData: sectionSource.source_data,
          sectionIndex: 1,
        });
        await dashboard.waitForTimeout(1000); //set variable quá nhanh, block trong iframe chưa apply kịp

        await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(sectionSource.source_data);
      });

      await test.step("Verify data source của tabs vẫn = None", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.openLayerSettings({
          sectionName: "Item 1",
          sectionIndex: 1,
        });

        await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
      });

      await test.step("Verify data source của block", async () => {
        await webBuilder.frameLocator.locator('[component="heading"]').dblclick();
        await setVariableOnQuickbar(suiteConf, dashboard, sectionSource.source_type, sectionSource.variable);
        await webBuilder.backBtn.click({
          delay: 1000, //loi block heading/paragraph khong apply setting neu click khoi text editor qua nhanh
        });

        await expect(
          webBuilder.frameLocator.locator("[component='heading'] span[data-type='variable']").first(),
        ).toHaveText(sectionSource.source_data);
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        await expect(currentPage.locator("[component='heading'] span[data-type='variable']").first()).toHaveText(
          sectionSource.source_data,
        );
      });
    }
  });

  test("@SB_SC_SCWB_12 Verify set variable cho block khi block nằm trong container , container > tabs > section với data source của containe và tabs = None, section # None", async ({
    conf,
    dashboard,
    context,
  }) => {
    await test.step("Kéo block tabs vào section và không setting data source ", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          column: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Tabs",
      });

      await dashboard.locator(".sb-tab--inside .sb-tab-navigation__item--default").first().click();
      await webBuilder.switchToTab("Content");
      await dashboard.locator(`//label[contains(text(), '${conf.caseConf.item}')]`).click();
      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block container vào tabs và không setting data source", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          block: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Container",
      });

      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
      await webBuilder.backBtn.click({
        delay: 1000, //loi block heading/paragraph khong apply setting neu click khoi text editor qua nhanh
      });
    });

    await test.step("Kéo block được chọn vào container", async () => {
      const containerElementXpath = '[data-block-component="container"] >> nth=1';
      await addBlockIntoElement(containerElementXpath, "Heading", conf.suiteConf, dashboard);

      await dashboard.locator('header [name="Layer"]').click();
      await dashboard.locator(".w-builder__layers-body button").first().click();
    });

    for (const sectionSource of conf.caseConf.section_source) {
      await test.step("Connect data source cho section", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource.source_type,
          sourceData: sectionSource.source_data,
          sectionIndex: 1,
        });
        await dashboard.waitForTimeout(1000);

        await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(sectionSource.source_data);
      });

      await test.step("Verify data source của block", async () => {
        await webBuilder.frameLocator.locator('[component="heading"]').dblclick();
        await setVariableOnQuickbar(suiteConf, dashboard, sectionSource.source_type, sectionSource.variable);
        await webBuilder.backBtn.click({
          delay: 1000, //loi block heading/paragraph khong apply setting neu click khoi text editor qua nhanh
        });

        await expect(
          webBuilder.frameLocator.locator("[component='heading'] span[data-type='variable']").first(),
        ).toHaveText(sectionSource.source_data);
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        await expect(currentPage.locator("[component='heading'] span[data-type='variable']").first()).toHaveText(
          sectionSource.source_data,
        );
      });
    }
  });

  test("@SB_SC_SCWB_13 Verify set variable cho block khi block nằm trong container , container >  tabs > section với data source của container = None, Tabs # None", async ({
    conf,
    dashboard,
    context,
  }) => {
    await test.step("Kéo block tabs vào section", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          column: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Tabs",
      });

      await dashboard.locator(".sb-tab--inside .sb-tab-navigation__item--default").first().click();
      await webBuilder.switchToTab("Content");
      await dashboard.locator(`//label[contains(text(), '${conf.caseConf.item}')]`).click();
      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block container vào tabs và không setting data source ", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          block: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Container",
      });

      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block vào container ", async () => {
      const containerElementXpath = '[data-block-component="container"] >> nth=1';
      await addBlockIntoElement(containerElementXpath, "Heading", conf.suiteConf, dashboard);
      await expect(webBuilder.frameLocator.locator('[id="quick-settings"]')).toBeVisible();

      await dashboard.locator('header [name="Layer"]').click();
      await dashboard.locator(".w-builder__layers-body button").first().click();
    });

    for (const tabsSource of conf.caseConf.tabs_source) {
      await test.step("Connect data source cho tabs", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Item 1",
          sourceType: tabsSource.source_type,
          sourceData: tabsSource.source_data,
          sectionIndex: 1,
        });
        await dashboard.waitForTimeout(1000);
        await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(tabsSource.source_data);
      });

      await test.step("Verify data source của block", async () => {
        await webBuilder.frameLocator.locator('[component="heading"]').dblclick();
        await setVariableOnQuickbar(suiteConf, dashboard, tabsSource.source_type, tabsSource.variable);
        await webBuilder.backBtn.click({
          delay: 1000, //loi block heading/paragraph khong apply setting neu click khoi text editor qua nhanh
        });

        await expect(
          webBuilder.frameLocator.locator("[component='heading'] span[data-type='variable']").first(),
        ).toHaveText(tabsSource.source_data);
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        await expect(currentPage.locator("[component='heading'] span[data-type='variable']").first()).toHaveText(
          tabsSource.source_data,
        );
      });
    }
  });

  test("@SB_SC_SCWB_14 Verify set variable cho block khi block nằm trong container , container > tabs > section với data source của containe # None", async ({
    conf,
    dashboard,
    context,
  }) => {
    await test.step("Kéo block tabs vào section", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          column: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Tabs",
      });

      await dashboard.locator(".sb-tab--inside .sb-tab-navigation__item--default").first().click();
      await webBuilder.switchToTab("Content");
      await dashboard.locator(`//label[contains(text(), '${conf.caseConf.item}')]`).click();
      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block container vào Tabs", async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: {
          section: 1,
          block: 1,
        },
        position: "Top",
        category: "Basics",
        template: "Container",
      });

      await expect(dashboard.locator('[id="search-data-source"] button span >> nth=0')).toHaveText("None");
    });

    await test.step("Kéo block vào container", async () => {
      const containerElementXpath = '[data-block-component="container"] >> nth=1';
      await addBlockIntoElement(containerElementXpath, "Heading", conf.suiteConf, dashboard);

      await expect(webBuilder.frameLocator.locator('[id="quick-settings"]')).toBeVisible();
    });

    for (const containerSource of conf.caseConf.container_source) {
      await test.step("Connect data source cho container", async () => {
        await webBuilder.setVariableForSection({
          sectionName: "Container",
          sourceType: containerSource.source_type,
          sourceData: containerSource.source_data,
          sectionIndex: 1,
          sectionFrameXpath: '(//div[@data-block-component="container"])[1]',
        });
        await dashboard.waitForTimeout(1000); //set variable quá nhanh, block trong iframe chưa apply kịp

        await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
          containerSource.source_data,
        );
      });

      await test.step("Verify data source của block", async () => {
        await webBuilder.frameLocator.locator('[component="heading"]').dblclick();
        await setVariableOnQuickbar(suiteConf, dashboard, containerSource.source_type, containerSource.variable);
        await webBuilder.backBtn.click({
          delay: 1000, //loi block heading/paragraph khong apply setting neu click khoi text editor qua nhanh
        });

        await expect(
          webBuilder.frameLocator.locator("[component='heading'] span[data-type='variable']").first(),
        ).toHaveText(containerSource.source_data);
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        await expect(currentPage.locator("[component='heading'] span[data-type='variable']").first()).toHaveText(
          containerSource.source_data,
        );
      });
    }
  });

  test("@SB_SC_SCWB_18 Verify block force bind khi connect data source = None hoặc khác loại block", async ({
    conf,
    dashboard,
    context,
    snapshotFixture,
    builder,
  }) => {
    //Check data section khong hop le voi block type = product
    for (const blockTypeProduct of conf.caseConf.block_type_product) {
      await test.step("(Block type = Product)Add block into web builder", async () => {
        await addBlockIntoWB(suiteConf, dashboard, { block_name: blockTypeProduct.block_name }, blockPosition.section);
        await webBuilder.backBtn.click();
        await webBuilder.frameLocator
          .locator(
            `//div[@data-block-component="${blockTypeProduct.block_component}"]//div[contains(@class, 'validate-source-msg')]`,
          )
          .hover();

        await expect(
          webBuilder.frameLocator.locator(`[data-block-component="${blockTypeProduct.block_component}"]`),
        ).toHaveAttribute("class", /hover/);
        await expect(webBuilder.frameLocator.locator("//p[contains(@class, 'element-name__breadcrumb')]")).toHaveText(
          `${blockTypeProduct.block_name}: missing data`,
        );
      });

      await test.step("Block type = Product)Verify block tại web front", async () => {
        await expect(
          webBuilder.frameLocator.locator(
            `[data-block-component="${blockTypeProduct.block_component}"] [class="pointer-events-none layer-selector is-invalid"]`,
          ),
        ).toBeVisible();
      });
    }

    await test.step("(Block type = Product)Click Save & click icon preview", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await clickPreviewButton({ context, dashboard });

      await expect(currentPage.locator('[component="media"]')).toHaveAttribute("visible", /true/);
      await expect(currentPage.locator('[component="price"]')).toHaveAttribute("visible", /true/);
      await expect(currentPage.locator('[component="quantity_selector"]')).toHaveAttribute("visible", /true/);
    });

    for (const sectionSource of ["Collection", "Blog", "Blog post"]) {
      await test.step("Trong web builder, đổi source section khác block type", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource,
          sectionIndex: 1,
        });

        for (const blockTypeProduct of conf.caseConf.block_type_product) {
          await webBuilder.frameLocator
            .locator(
              `//div[@data-block-component="${blockTypeProduct.block_component}"]//div[contains(@class, 'validate-source-msg')]`,
            )
            .hover();

          await expect(
            webBuilder.frameLocator.locator(`[data-block-component="${blockTypeProduct.block_component}"]`),
          ).toHaveAttribute("class", /hover/);
        }
      });
    }

    //check data section khong hop le voi block type = collection
    settingsDataPublish.pages["home"].default.elements = settingsData.pages["home"].default.elements;
    await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);
    await dashboard.reload();
    await frameLocator.locator(blocks.overlay).waitFor({ state: "hidden" });

    await test.step("(Block type = Collection)Add block into web builder", async () => {
      await addBlockIntoWB(
        suiteConf,
        dashboard,
        { block_name: conf.caseConf.block_type_collection.block_name },
        blockPosition.section,
      );
      await webBuilder.backBtn.click({});

      await webBuilder.frameLocator
        .locator(`//div[@data-block-component="featured_collection"]//div[contains(@class, 'validate-source-msg')]`)
        .hover();

      await expect(webBuilder.frameLocator.locator(`[data-block-component="featured_collection"]`)).toHaveAttribute(
        "class",
        /hover/,
      );
    });

    await test.step("(Block type = Collection)Verify block tại web front", async () => {
      await webBuilder.frameLocator
        .locator('[component="featured_collection"] img[data-loaded="true"] >> nth = 1')
        .waitFor({ state: "visible" });

      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: '[id="wb-main"] .section >> nth=0',
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${conf.caseConf.expected.WF_type_collection}`,
      });
    });

    await test.step("(Block type = Collection)Click Save & click icon preview", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await clickPreviewButton({ context, dashboard });
      await webBuilder.frameLocator
        .locator('[component="featured_collection"] img[data-loaded="true"] >> nth = 1')
        .waitFor({ state: "visible" });
      await snapshotFixture.verifyWithAutoRetry({
        page: currentPage,
        selector: '[component="featured_collection"] .featured_collection__container',
        snapshotName: `${process.env.ENV}-${conf.caseConf.expected.SF_type_collection}`,
      });
    });

    for (const sectionSource of ["Shop", "Blog", "Blog post", "Product"]) {
      await test.step("Trong web builder, đổi source section khác block type", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource,
          sectionIndex: 1,
        });

        await webBuilder.frameLocator
          .locator(`//div[@data-block-component="featured_collection"]//div[contains(@class, 'validate-source-msg')]`)
          .hover();

        await expect(webBuilder.frameLocator.locator(`[data-block-component="featured_collection"]`)).toHaveAttribute(
          "class",
          /hover/,
        );
      });
    }

    //check data section khong hop le voi block type = blog list
    settingsDataPublish.pages["home"].default.elements = settingsData.pages["home"].default.elements;
    await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);
    await dashboard.reload();
    await frameLocator.locator(blocks.overlay).waitFor({ state: "hidden" });

    await test.step("(Block type = Blog post)Add block into web builder", async () => {
      await addBlockIntoWB(
        suiteConf,
        dashboard,
        { block_name: conf.caseConf.block_type_blog_post.block_name },
        blockPosition.section,
      );
      await webBuilder.backBtn.click({});
      await webBuilder.frameLocator
        .locator(
          `//div[@data-block-component="${conf.caseConf.block_type_blog_post.block_component}"]//div[contains(@class, 'validate-source-msg')]`,
        )
        .hover();

      await expect(
        webBuilder.frameLocator.locator(
          `[data-block-component="${conf.caseConf.block_type_blog_post.block_component}"]`,
        ),
      ).toHaveAttribute("class", /hover/);
    });

    await test.step("(Block type = Blog post)Verify block tại web front", async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: '[id="wb-main"] .section >> nth=0',
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${conf.caseConf.expected.WF_type_blog_post}`,
      });
    });

    await test.step("(Block type = Blog post)Click Save & click icon preview", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await clickPreviewButton({ context, dashboard });

      await expect(currentPage.locator('[component="comment"] .comment')).toBeHidden();
    });

    for (const sectionSource of ["Shop", "Product", "Blog", "Collection"]) {
      await test.step("Trong web builder, đổi source section khác block type", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource,
          sectionIndex: 1,
        });

        await webBuilder.frameLocator
          .locator(
            `//div[@data-block-component="${conf.caseConf.block_type_blog_post.block_component}"]//div[contains(@class, 'validate-source-msg')]`,
          )
          .hover();

        await expect(
          webBuilder.frameLocator.locator(
            `[data-block-component="${conf.caseConf.block_type_blog_post.block_component}"]`,
          ),
        ).toHaveAttribute("class", /hover/);
      });
    }
  });

  test("@SB_SC_SCWB_16 Verify tab content của section", async ({ dashboard, conf, context, snapshotFixture }) => {
    await test.step("Open Product page detail", async () => {
      await webBuilder.selectPageOnPageSelector("Product detail");
      await expect(dashboard.locator('.sb-selection-group-item:has-text("Preview:")')).toBeVisible();
    });

    await test.step("Kéo section vào web builder", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_blank_section);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: ".w-builder__sidebar-content .w-builder__settings",
        snapshotName: conf.caseConf.snapshot_content_section,
      });
    });

    await test.step("Hover vào section", async () => {
      const elemetSelector = webBuilder.getSelectorByIndex({ section: 2 });
      await webBuilder.hoverElementInIframe(webBuilder.frameLocator, elemetSelector, dashboard);
      await expect(webBuilder.frameLocator.locator('[id="element-name"]')).toHaveAttribute(
        "class",
        /is-source-connected/,
      );
    });

    await test.step("Hover vào text box trường data source", async () => {
      await dashboard.locator('[id="search-data-source"]').hover();

      await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
        `Current page product: ${conf.caseConf.first_product}`,
      );
    });

    await test.step("Select data source = None ", async () => {
      await dashboard.locator('header [name="Layer"]').click();
      await webBuilder.setVariableForSection({ sectionName: "Single column", sourceType: "Shop", sectionIndex: 1 });

      await expect(dashboard.locator('[id="search-data-source"] span:text-is("None")')).toBeVisible();
      await expect(webBuilder.frameLocator.locator('[id="element-name"]')).not.toHaveAttribute(
        "class",
        /is-source-connected/,
      );
    });

    await test.step("Click vào Learn more tại help docs", async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: '.w-builder__container--inline a:text-is("Learn more.")',
        context,
        redirectUrl: "https://help.shopbase.com/en",
      });
    });
  });

  test("@SB_SC_SCWB_17 Verify widget khi chọn data variable tại tab content", async ({ dashboard, conf }) => {
    await test.step("Select data source cho section", async () => {
      await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_blank_section);
      await dashboard.locator(".sb-tab-navigation__item div:text-is('Content')").click();
      await dashboard.locator("[id='search-data-source']").click();

      if (await dashboard.locator(".search-source__search-bar button").isVisible()) {
        await dashboard.locator(".search-source__search-bar button").click();
      }
      await dashboard.locator(`[class='list-source'] span:text-is('Product')`).click();
    });

    await test.step("Search data source theo data", async () => {
      //dien ki tu khong match voi ket qua nao
      await dashboard.locator(`[placeholder="Search product"]`).fill(`${conf.caseConf.search_no_result}`);
      await expect(dashboard.locator(".list-search-result label")).toHaveText(
        `Could not find any results for '${conf.caseConf.search_no_result}'`,
      );

      //dien ki tu co ket qua
      await dashboard.locator(`[placeholder="Search product"]`).fill(`${conf.caseConf.search_have_result}`);
      const numberOfResult = await dashboard.locator(".list-search-result .source-result-title").count();
      for (let i = 1; i < numberOfResult; i++) {
        await expect(dashboard.locator(`.list-search-result .source-result-title >> nth=${i - 1}`)).toContainText(
          `${conf.caseConf.search_have_result}`,
        );
      }
    });

    await test.step("Select source variable", async () => {
      await dashboard.locator(".list-search-result .source-result-title").first().click();

      await expect(dashboard.locator('[class="data-source-title connected"]')).toContainText(
        `${conf.caseConf.search_have_result}`,
      );
    });
  });

  test("@SB_SC_SCWB_19 Verify block force bind khi connect data source # None cùng loại với block", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
    builder,
  }) => {
    settingsDataPublish.pages["collection"].default.elements = settingsData.pages["collection"].default.elements;
    settingsDataPublish.pages["blog_post"].default.elements = settingsData.pages["blog_post"].default.elements;

    await builder.updateSiteBuilder(conf.suiteConf.shop_theme_id, settingsDataPublish);
    await dashboard.reload();
    await frameLocator.locator(blocks.overlay).waitFor({ state: "hidden" });

    //Check data section hop le voi block type = product
    await test.step("Pre-condition: Open product page", async () => {
      await webBuilder.selectPageOnPageSelector("Product detail");
      await expect(dashboard.locator('.sb-selection-group-item:has-text("Preview:")')).toBeVisible();
    });

    await test.step("Pre-condition: Add block into Product page", async () => {
      for (const blockTypeProduct of conf.caseConf.block_type_product) {
        await addBlockIntoWB(suiteConf, dashboard, { block_name: blockTypeProduct.block_name }, blockPosition.section);
        await webBuilder.backBtn.click();
      }
    });

    for (const sectionSource of ["Current page", "Product"]) {
      await test.step("Sellect data source theo cột Data source chi tiết tại file", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource,
          sourceData: `${conf.caseConf.data_source.product}`,
          sectionIndex: 1,
        });

        //Verify source-connected state of all block
        for (const blockTypeProduct of conf.caseConf.block_type_product) {
          await expect(
            webBuilder.frameLocator.locator(
              `[data-block-component="${blockTypeProduct.block_component}"] div >> nth=0`,
            ),
          ).toHaveAttribute("class", /is-source-connected/);
        }
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        for (const blockTypeProduct of conf.caseConf.block_type_product) {
          await expect(currentPage.locator(`[component='${blockTypeProduct.block_component}']`)).toHaveAttribute(
            "visible",
            /true/,
          );
        }
      });
    }

    //Check data section hop le voi block type = collection
    await test.step("Pre-condition: Open collection page", async () => {
      await webBuilder.selectPageOnPageSelector("Collection detail");
      await expect(dashboard.locator('.sb-selection-group-item:has-text("Preview:")')).toBeVisible();
    });

    await test.step("Pre-condition: Add block into Collection page", async () => {
      await addBlockIntoWB(suiteConf, dashboard, { block_name: "Featured Collection" }, blockPosition.section);
      await webBuilder.backBtn.click({});
    });

    for (const sectionSource of ["Current page", "Collection"]) {
      let snapshotNameSF;
      if (sectionSource == "Current page") {
        snapshotNameSF = conf.caseConf.expected.SF_type_collection_current;
      } else {
        snapshotNameSF = conf.caseConf.expected.SF_type_collection_select;
      }

      await test.step("Sellect data source theo cột Data source chi tiết tại file", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource,
          sourceData: `${conf.caseConf.data_source.collection}`,
          sectionIndex: 1,
        });

        await expect(
          webBuilder.frameLocator.locator('[data-block-component="featured_collection"] div >> nth=0'),
        ).toHaveAttribute("class", /is-source-connected/);
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });

        await webBuilder.frameLocator
          .locator('[component="featured_collection"] img[data-loaded="true"] >> nth = 1')
          .waitFor({ state: "visible" });
        await waitTimeout(2000);
        await snapshotFixture.verify({
          page: currentPage,
          selector: '[component="featured_collection"] .featured_collection__container',
          snapshotName: `${process.env.ENV}-${snapshotNameSF}`,
        });
      });
    }

    //Check data section hop le voi block type = blog post
    await test.step("Pre-condition: Open Blog post page", async () => {
      await webBuilder.selectPageOnPageSelector("Blog post");
      await expect(dashboard.locator('.sb-selection-group-item:has-text("Preview:")')).toBeVisible();
    });

    await test.step("Pre-condition: Add block into Blog post page", async () => {
      await addBlockIntoWB(suiteConf, dashboard, { block_name: "Comments" }, blockPosition.section);
      await webBuilder.backBtn.click({});
    });

    for (const sectionSource of ["Current page", "Blog post"]) {
      let snapshotNameSF;
      if (sectionSource == "Current page") {
        snapshotNameSF = conf.caseConf.expected.SF_type_blogpost_current;
      } else {
        snapshotNameSF = conf.caseConf.expected.SF_type_blogpost_select;
      }

      await test.step("Sellect data source theo cột Data source chi tiết tại file", async () => {
        await dashboard.locator('header [name="Layer"]').click();
        await webBuilder.setVariableForSection({
          sectionName: "Single column",
          sourceType: sectionSource,
          sourceData: `${conf.caseConf.data_source.blog_post}`,
          sectionIndex: 1,
        });

        await expect(webBuilder.frameLocator.locator('[data-block-component="comment"] div >> nth=0')).toHaveAttribute(
          "class",
          /is-source-connected/,
        );
      });

      await test.step("Save & click icon preview", async () => {
        await webBuilder.clickSaveButton();
        currentPage = await clickPreviewButton({ context, dashboard });
        await waitTimeout(2000);
        await snapshotFixture.verify({
          page: currentPage,
          selector: '[id="wb-main"] .section >> nth=0',
          snapshotName: `${process.env.ENV}-${snapshotNameSF}`,
        });
      });
    }
  });

  test("@SB_SC_SCWB_21 Verify Connect data source cho section tại tab content của block", async ({
    dashboard,
    conf,
    context,
  }) => {
    //Check connect data voi block type = product
    for (const blockTypeProduct of conf.caseConf.block_type_product) {
      await test.step("(Product type)Add block vào Home page", async () => {
        await addBlockIntoWB(suiteConf, dashboard, { block_name: blockTypeProduct.block_name }, blockPosition.section);
      });
    }

    await test.step("(Product type) Click field Data source của block", async () => {
      await dashboard.locator(".sb-tab-navigation__item div:text-is('Content')").click();
      await dashboard.locator(webBuilder.selectorDataSourceWidget).click();

      await expect(dashboard.locator(".sb-popup__wrapper .sb-popup__container")).toBeVisible();
    });

    await test.step("Chọn variant cho product tại popup", async () => {
      await dashboard.locator('[id="search-data-source"]').click();

      if (await dashboard.locator(".search-source__search-bar button").isVisible()) {
        await dashboard.locator(".search-source__search-bar button").click();
      }
      await dashboard.locator('.list-source span:text-is("Product")').click();
      await dashboard
        .locator(`.w-builder__search-data-source-result span:text-is('${conf.caseConf.product_source}') >> nth=0`)
        .click();

      await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
        `${conf.caseConf.product_source}`,
      );
      await dashboard.locator('.sb-popup__footer span:text-is("Save")').click();
    });

    await test.step("Verfy data source của section cha", async () => {
      await dashboard.locator('header [name="Layer"]').click();
      await webBuilder.openLayerSettings({
        sectionName: "Single column",
        sectionIndex: 1,
      });

      await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
        `${conf.caseConf.product_source}`,
      );
    });

    await test.step("Save & click icon preview", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await clickPreviewButton({ context, dashboard });

      for (const blockTypeProduct of conf.caseConf.block_type_product) {
        await expect(currentPage.locator(`[component='${blockTypeProduct.block_component}']`)).toHaveAttribute(
          "visible",
          /true/,
        );
      }
    });

    //Check connect data voi block type = collection
    await test.step("(Collection type) Add block vào Home page", async () => {
      await addBlockIntoWB(suiteConf, dashboard, { block_name: "Featured Collection" }, blockPosition.section);
    });

    await test.step("(Collection type) Click field Data source của block", async () => {
      await dashboard.locator(".sb-tab-navigation__item div:text-is('Content')").click();
      await dashboard.locator(webBuilder.selectorDataSourceWidget).click();

      await expect(dashboard.locator(".sb-popup__wrapper .sb-popup__container")).toBeVisible();
    });

    await test.step("Chọn variant cho block tại popup", async () => {
      await dashboard.locator('[id="search-data-source"]').click();

      if (await dashboard.locator(".search-source__search-bar button").isVisible()) {
        await dashboard.locator(".search-source__search-bar button").click();
      }
      await dashboard.locator('.list-source span:text-is("Collection")').click();
      await dashboard
        .locator(`.w-builder__search-data-source-result span:text-is('${conf.caseConf.collection_source}') >> nth=0`)
        .click();

      await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
        `${conf.caseConf.collection_source}`,
      );

      await dashboard.locator('.sb-popup__footer span:text-is("Save")').click();
      for (const blockTypeProduct of conf.caseConf.block_type_product) {
        await webBuilder.frameLocator
          .locator(`//div[@data-block-component="${blockTypeProduct.block_component}"]`)
          .hover();

        await expect(
          webBuilder.frameLocator.locator(`[data-block-component="${blockTypeProduct.block_component}"]`),
        ).toHaveAttribute("class", /hover/);
        await expect(webBuilder.frameLocator.locator("//p[contains(@class, 'element-name__breadcrumb')]")).toHaveText(
          `${blockTypeProduct.block_name}: missing data`,
        );
      }
    });

    await test.step("Verfy data source của section cha", async () => {
      await dashboard.locator('header [name="Layer"]').click();
      await webBuilder.openLayerSettings({
        sectionName: "Single column",
        sectionIndex: 1,
      });

      await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
        `${conf.caseConf.collection_source}`,
      );
    });

    await test.step("Save & click icon preview", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await clickPreviewButton({ context, dashboard });

      await expect(
        currentPage.locator(`[component='${conf.caseConf.block_type_collection.block_component}']`),
      ).toHaveAttribute("visible", /true/);
    });

    //Check connect data voi block type = blog post
    await test.step("(Blog post type) Add block vào Home page", async () => {
      await addBlockIntoWB(suiteConf, dashboard, { block_name: "Comments" }, blockPosition.section);
    });

    await test.step("(Blog post type) Click field Data source của block", async () => {
      await dashboard.locator(".sb-tab-navigation__item div:text-is('Content')").click();
      await dashboard.locator(webBuilder.selectorDataSourceWidget).click();

      await expect(dashboard.locator(".sb-popup__wrapper .sb-popup__container")).toBeVisible();
    });

    await test.step("Chọn variant cho block tại popup", async () => {
      await dashboard.locator('[id="search-data-source"]').click();

      if (await dashboard.locator(".search-source__search-bar button").isVisible()) {
        await dashboard.locator(".search-source__search-bar button").click();
      }
      await dashboard.locator('.list-source span:text-is("Blog post")').click();
      await dashboard
        .locator(`.w-builder__search-data-source-result span:text-is('${conf.caseConf.blogpost_source}') >> nth=0`)
        .click();

      await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
        `${conf.caseConf.blogpost_source}`,
      );
      await dashboard.locator('.sb-popup__footer span:text-is("Save")').click();
    });

    await test.step("Verfy data source của section cha", async () => {
      await dashboard.locator('header [name="Layer"]').click();
      await webBuilder.openLayerSettings({
        sectionName: "Single column",
        sectionIndex: 1,
      });

      await expect(dashboard.locator('[class="data-source-title connected"]')).toHaveText(
        `${conf.caseConf.blogpost_source}`,
      );
    });

    await test.step("Save & click icon preview", async () => {
      await webBuilder.clickSaveButton();
      currentPage = await clickPreviewButton({ context, dashboard });

      await expect(
        currentPage.locator(`[component='${conf.caseConf.block_type_blog_post.block_component}']`),
      ).toHaveAttribute("visible", /true/);
    });
  });
});
