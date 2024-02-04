import type { Page } from "@playwright/test";
import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { OnlineStorePage } from "@pages/dashboard/online_store";

let shopThemeId = 0;
const preConditionTest = () => {
  test.beforeAll(async ({ theme }) => {
    const res = await theme.create(3);
    shopThemeId = res.id;
  });
  test.afterAll(async ({ theme }) => {
    const res = await theme.delete(shopThemeId);
    expect(res).toBeTruthy();
  });
  test.beforeEach(async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const onlineStorePage = new OnlineStorePage(dashboard, conf.suiteConf["domain"]);
    await onlineStorePage.gotoOnlineStore();
    await onlineStorePage.clickCustomizePublishTheme();
  });
};
const verifySave = async (dashboard: Page) => {
  await expect(await dashboard.locator('.theme-editor-v2__navigation button[data-action="save"]')).toBeEnabled();
  await dashboard.click('.theme-editor-v2__navigation button[data-action="save"]');
  await expect(await dashboard.locator('text="All changes were successfully saved"')).toBeVisible();
};
const changeStyleBlockText = async (dashboard: Page) => {
  await dashboard.click('[data-key="style"] button');
  await dashboard.click('#popover_select_style:visible li[data-select-label="Subtitle"]');
};

// Annotate entire file as serial.
test.describe.configure({ mode: "serial" });
test.describe("@TS_INS_DB_Product_Section", () => {
  const verifyHiddenIcon = async (dashboard: Page, selector: string, icon = "visible") => {
    await dashboard.hover(`${selector}`);
    await expect(await dashboard.locator(`${selector} [data-block-action="${icon}"]`)).toBeHidden();
  };
  const verifyVisibleIcon = async (dashboard: Page, selector: string, icon = "visible") => {
    await dashboard.hover(`${selector}`);
    await expect(await dashboard.locator(`${selector} [data-block-action="${icon}"]`)).toBeVisible();
  };
  const verifyCrossEye = async (dashboard: Page, selector: string) => {
    await dashboard.hover(`${selector}`);
    await dashboard.waitForSelector(`${selector} [data-block-action="visible"]`);
    await dashboard.click(`${selector} [data-block-action="visible"]`);
    await expect(await dashboard.locator(selector)).toHaveClass(/theme-editor-v2__is-hidden/);
  };
  const verifyIconEye = async (dashboard: Page, selector: string) => {
    await dashboard.hover(`${selector}`);
    await dashboard.waitForSelector(`${selector} [data-block-action="visible"]`);
    await dashboard.click(`${selector} [data-block-action="visible"]`);
    await expect(await dashboard.locator(`${selector}.theme-editor-v2__is-hidden`)).toHaveCount(0);
  };

  // Pre conditions test
  preConditionTest();

  // Todo: example create theme with step UI
  // eslint-disable-next-line
  test.skip("Create theme inside v2 @TC_INS_DB_Create_Theme", async ({ dashboard }) => {
    await test("Create theme inside v2", async () => {
      await dashboard.waitForSelector(".unite-ui-dashboard__main .heading h2");
      await dashboard.click(".li-online-store a");
      await dashboard.click('button:has-text("Explore more templates")');
      await dashboard.click('#modal-explore-themes-templates a:has-text("Themes")');
      await dashboard.click(":nth-match(.explore-themes-templates__grid-item, 3) img");
      await dashboard.click('button:has-text("Add Inside")');
      await expect(await dashboard.locator("text=You successfully added Inside")).toBeVisible();
    });
  });

  /* Start test section */
  test("Check UI and data default @TC_INS_DB_Product_Default", async ({ dashboard, conf }) => {
    await test.step("Verify default blocks", async () => {
      expect(await dashboard.innerText('[data-section-label="Product"] h6')).toEqual("Product");
      for (let i = 0; i < conf.caseConf["blocks"].length; i++) {
        await expect(await dashboard.locator(`${conf.caseConf["blocks"][i].selector}`)).toHaveCount(
          conf.caseConf["blocks"][i].count,
        );
      }
    });
  });

  test("Check collapse/expand/hide/show/copy @TC_INS_DB_Product_Section_Collapse_Expand", async ({ dashboard }) => {
    await test.step("Hover into Product section setting", async () => {
      await dashboard.waitForSelector('[data-section-label="Product"]');
      await dashboard.hover('[data-section-label="Product"] .theme-editor-v2__section');
      await expect(
        await dashboard.locator('[data-section-label="Product"] .theme-editor-v2__section [id$="/Down"]'),
      ).toBeVisible();
      await expect(
        await dashboard.locator('[data-section-label="Product"] .theme-editor-v2__section [id$="/Copy"]'),
      ).toBeHidden();
      await expect(
        await dashboard.locator('[data-section-label="Product"] .theme-editor-v2__section [id$="/Eye"]'),
      ).toBeHidden();
    });

    await test.step("Click on the down arrow icon", async () => {
      await dashboard.click(`[data-section-label="Product"] .theme-editor-v2__section .theme-editor-v2__element-icon`);
      await dashboard.hover('[data-section-label="Product"] .theme-editor-v2__section');
      await expect(
        await dashboard.locator('[data-section-label="Product"] .theme-editor-v2__section [id$="/Right"]'),
      ).toBeVisible();
      await expect(
        await dashboard.locator('[data-section-label="Product"] .theme-editor-v2__section-child'),
      ).toBeHidden();
      await expect(await dashboard.locator('.theme-editor-v2__navigation button[data-action="save"]')).toBeDisabled();
    });

    await test.step("Click on the arrow pointing to the right", async () => {
      await dashboard.click('[data-section-label="Product"] .theme-editor-v2__section .theme-editor-v2__element-icon');
      await dashboard.hover('[data-section-label="Product"] .theme-editor-v2__section');
      await expect(
        await dashboard.locator('[data-section-label="Product"] .theme-editor-v2__section [id$="/Down"]'),
      ).toBeVisible();
      await expect(
        await dashboard.locator('[data-section-label="Product"] .theme-editor-v2__section-child'),
      ).toBeVisible();
    });
  });

  test("Check add/remove section Product @TC_INS_DB_Product_Section_Add_Remove", async ({ dashboard }) => {
    await test.step("Open product section setting", async () => {
      await dashboard.click('[data-section-label="Product"] .theme-editor-v2__section');
      await expect(await dashboard.locator('button[data-action-remove="section"]')).toBeHidden();
    });

    await test.step("Click button back to list section của Product page", async () => {
      await dashboard.click('.theme-editor-v2__title button [id$="/Left"]');
      await expect(await dashboard.locator('[data-section-label="Product"] .theme-editor-v2__section')).toBeVisible();
    });

    await test.step("Click button Add section", async () => {
      await dashboard.click(':nth-match(.theme-editor-v2__sections-by-area, 2) button:has-text("Add section")');
      const sections = await dashboard.locator(".sb-tab-panel:visible .theme-editor-v2__new-element").allInnerTexts();
      expect(sections.every(name => name !== "Product")).toBeTruthy();
    });
  });

  test("Check draggable section Product page @TC_INS_DB_Product_Section_Draggable", async ({ dashboard }) => {
    await test.step("Switch position section", async () => {
      const firstLocator = await dashboard.waitForSelector('[data-section-label="Product"] .theme-editor-v2__section');
      const thirdLocator = await dashboard.waitForSelector(
        '[data-section-label="Products From The Same Collections"] .theme-editor-v2__section',
      );
      await firstLocator.hover();
      await dashboard.mouse.down();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const box = (await thirdLocator.boundingBox())!;
      await dashboard.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await thirdLocator.hover();
      await dashboard.waitForTimeout(500);
      await dashboard.mouse.up();
      await expect(
        await dashboard.locator('[data-section-index="0"][data-section-label="Collection List"]'),
      ).toBeVisible();
      await verifySave(dashboard);
    });
  });
  /* End test section */

  /* Start test blocks */
  test("Check add and blocks into section @TC_INS_DB_Product_Add_Remove_Show_Hide_Duplicate_Blocks", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Remove blocks default can remove", async () => {
      for (let i = 0; i < conf.caseConf["blocks_default_can_remove"].length; i++) {
        await dashboard.click(
          `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_default_can_remove"][i]}"]`,
        );
        await dashboard.click('button[data-action-remove="block"]');
      }
    });

    await test.step("Click Add block Product section", async () => {
      // Verify block can add in screen add blocks
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      const sections = await dashboard
        .locator(".theme-editor-v2__new-elements [data-add-element-label]")
        .allInnerTexts();
      expect(sections.every(name => conf.caseConf["blocks_can_add"].indexOf(name) > -1)).toBeTruthy();
    });

    await test.step("Add blocks into section", async () => {
      // Click add block into section
      for (let i = 0; i < conf.caseConf["blocks_add_section"].length; i++) {
        await dashboard.click(
          `.theme-editor-v2__new-elements [data-add-element-label="${conf.caseConf["blocks_add_section"][i]}"]`,
        );
        if (i < conf.caseConf["blocks_add_section"].length - 1) {
          await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
        }
      }

      // Verify block added in section
      const sectionsAdded = await dashboard
        .locator('[data-section-label="Product"] [data-block-label]')
        .allInnerTexts();
      expect(
        sectionsAdded.every(
          name =>
            conf.caseConf["blocks_default"].indexOf(name) > -1 ||
            conf.caseConf["blocks_add_section"].indexOf(name) > -1,
        ),
      ).toBeTruthy();

      // Verify block not exist in screen add blocks
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      const sections = await dashboard
        .locator(".theme-editor-v2__new-elements [data-add-element-label]")
        .allInnerTexts();
      expect(sections.every(name => conf.caseConf["blocks_add_section"].indexOf(name) === -1)).toBeTruthy();
    });

    await test.step("Add block Collapse tab into section", async () => {
      // Add and verify block "Collapse tab" exist in list blocks added
      await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Collapse tab"]');
      await expect(
        await dashboard.locator('[data-section-label="Product"] [data-block-label="Collapse tab"]'),
      ).toBeVisible();

      // Verify block "Collapse tab" exist in screen add block
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      await expect(
        await dashboard.locator('.theme-editor-v2__new-elements [data-add-element-label="Collapse tab"]'),
      ).toBeVisible();
    });

    await test.step("Add max 4 block Collapse tab into section", async () => {
      // Add more three block collapse tab
      for (let i = 0; i < 3; i++) {
        await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Collapse tab"]');
        await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      }

      // Verify block "Collapse tab" can not add
      await expect(
        await dashboard.locator('.theme-editor-v2__new-elements [data-add-element-label="Collapse tab"]'),
      ).toBeHidden();
    });

    await test.step("Add block Page into section", async () => {
      await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Page"]');
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      await expect(
        await dashboard.locator('.theme-editor-v2__new-elements [data-add-element-label="Page"]'),
      ).toBeVisible();
    });

    await test.step("Add max 2 block Page into section", async () => {
      // Add more block Page into section
      await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Page"]');
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      await expect(
        await dashboard.locator('.theme-editor-v2__new-elements [data-add-element-label="Page"]'),
      ).toBeHidden();
    });

    await test.step("Add block text into section", async () => {
      await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Text"]');
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      await expect(
        await dashboard.locator('.theme-editor-v2__new-elements [data-add-element-label="Text"]'),
      ).toBeVisible();
    });

    await test.step("Add max 5 block Text into section", async () => {
      // Add more four block Text
      for (let i = 0; i < 4; i++) {
        await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Text"]');
        if (i < 3) {
          await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
        }
      }

      // Verify button Add Block
      await expect(await dashboard.locator('[data-section-label="Product"] [data-block-action="add"]')).toBeHidden();
    });

    await test.step("Click Save button on top bar", async () => {
      await verifySave(dashboard);
    });
  });

  test("Check remove blocks in section @TC_INS_DB_Product_Add_Remove_Show_Hide_Duplicate_Blocks", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Open product Title, Price, Variants selector, Buy buttons, Estimate shipping time", async () => {
      // Verify not show button Remove block
      for (let i = 0; i < conf.caseConf["blocks_default"].length; i++) {
        await dashboard.click(
          `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_default"][i]}"]`,
        );
        await expect(await dashboard.locator('button[data-action-remove="block"]')).toBeHidden();
        await dashboard.click(".theme-editor-v2__title button:visible");
      }
    });

    await test.step("Open blocks can add into section", async () => {
      for (let i = 0; i < conf.caseConf["blocks_can_add"].length; i++) {
        await dashboard.click(
          `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_can_add"][i]}"]`,
        );
        // Verify show button Remove block
        await expect(await dashboard.locator('button[data-action-remove="block"]')).toBeVisible();
        await dashboard.click('button[data-action-remove="block"]');
      }

      // Remove block added multiple
      for (let i = 0; i < conf.caseConf["blocks_can_add_multiple"].length; i++) {
        // eslint-disable-next-line max-len
        const selector = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_can_add_multiple"][i]}"]`;
        let totalEl = await dashboard.locator(selector).count();

        while (totalEl--) {
          await dashboard.click(selector);
          await dashboard.click('button[data-action-remove="block"]');
        }
      }

      // Verify blocks removed in section
      const blocks = await dashboard.locator('[data-section-label="Product"] [data-block-label]').allInnerTexts();
      expect(blocks.every(name => conf.caseConf["blocks_can_add"].indexOf(name) === -1)).toBeTruthy();
    });

    await test.step("Click button Add block", async () => {
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      // Verify blocks removed in screen add block
      const sections = await dashboard
        .locator(".theme-editor-v2__new-elements [data-add-element-label]")
        .allInnerTexts();
      expect(sections.every(name => conf.caseConf["blocks_can_add"].indexOf(name) > -1)).toBeTruthy();
    });

    await test.step("Click Save button on top bar", async () => {
      await verifySave(dashboard);
    });
  });

  test("Check remove blocks that can add more @TC_INS_DB_Product_Add_Remove_Show_Hide_Duplicate_Blocks", async ({
    dashboard,
  }) => {
    await test.step("Add 4 blocks Collapse tab into section", async () => {
      // Add 4 block collapse tab
      for (let i = 0; i < 4; i++) {
        await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
        await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Collapse tab"]');
      }
    });

    await test.step("Open first block Collapse tab and click Remove block button", async () => {
      await dashboard.click(':nth-match([data-section-label="Product"] [data-block-label="Collapse tab"], 1)');
      // Verify show button Remove block
      await expect(await dashboard.locator('button[data-action-remove="block"]')).toBeVisible();
      await dashboard.click('button[data-action-remove="block"]');
      // Verify remaining 3 block Collapse tab
      await expect(
        await dashboard.locator('[data-section-label="Product"] [data-block-label="Collapse tab"]'),
      ).toHaveCount(3);
    });
  });

  test("Check show/hide blocks into section @TC_INS_DB_Product_Add_Remove_Show_Hide_Duplicate_Blocks", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Hover into blocks Product title, Price, Variants selector, buy buttons", async () => {
      for (let i = 0; i < conf.caseConf["blocks_default"].length; i++) {
        // Ignore ETA shipping time when verify hover not display icon show/hide
        if (conf.caseConf["blocks_default"][i] === conf.caseConf["blocks_default_can_show_hide"]) {
          continue;
        }

        const selector = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_default"][i]}"]`;
        await verifyHiddenIcon(dashboard, selector);
      }
    });

    await test.step("Add block can add into section", async () => {
      for (let i = 0; i < conf.caseConf["blocks_add_section"].length; i++) {
        await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
        await dashboard.click(
          `.theme-editor-v2__new-elements [data-add-element-label="${conf.caseConf["blocks_add_section"][i]}"]`,
        );
      }
    });

    await test.step("Hover into blocks can display icon show/hide", async () => {
      for (let i = 0; i < conf.caseConf["blocks_add_section"].length; i++) {
        // eslint-disable-next-line max-len
        const selector = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_add_section"][i]}"]`;
        await verifyVisibleIcon(dashboard, selector);
      }
      // eslint-disable-next-line max-len
      const etaShippingTime = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_default_can_show_hide"]}"]`;
      await verifyVisibleIcon(dashboard, etaShippingTime);
    });

    await test.step("Click icon eye", async () => {
      for (let i = 0; i < conf.caseConf["blocks_add_section"].length; i++) {
        // eslint-disable-next-line max-len
        const selector = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_add_section"][i]}"]`;
        await verifyCrossEye(dashboard, selector);
      }
      // eslint-disable-next-line max-len
      const etaShippingTime = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_default_can_show_hide"]}"]`;
      await verifyCrossEye(dashboard, etaShippingTime);

      // Verify block default not disabled
      for (let i = 0; i < conf.caseConf["blocks_default"].length; i++) {
        // Ignore ETA shipping time when verify block disabled
        if (conf.caseConf["blocks_default"][i] === conf.caseConf["blocks_default_can_show_hide"]) {
          continue;
        }

        // eslint-disable-next-line max-len
        const selector = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_default"][i]}"].theme-editor-v2__is-hidden`;
        await expect(await dashboard.locator(selector)).toHaveCount(0);
      }
    });

    await test.step("Click icon cross-eye when hover block", async () => {
      for (let i = 0; i < conf.caseConf["blocks_add_section"].length; i++) {
        // eslint-disable-next-line max-len
        const selector = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_add_section"][i]}"]`;
        await verifyIconEye(dashboard, selector);
      }
      // eslint-disable-next-line max-len
      const etaShippingTime = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_default_can_show_hide"]}"]`;
      await verifyIconEye(dashboard, etaShippingTime);
    });
  });

  test("Check show/hide block that can add more @TC_INS_DB_Product_Add_Remove_Show_Hide_Duplicate_Blocks", async ({
    dashboard,
  }) => {
    await test.step("Add 2 blocks Collapse tab into section", async () => {
      // Add 3 block collapse tab
      for (let i = 0; i < 3; i++) {
        await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
        await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Collapse tab"]');
      }
    });

    await test.step("Hover one block Collapse tab", async () => {
      const selector = '[data-section-label="Product"] [data-block-label="Collapse tab"]';
      await verifyVisibleIcon(dashboard, `:nth-match(${selector}, 1)`);
      await verifyCrossEye(dashboard, `:nth-match(${selector}, 1)`);
      await expect(await dashboard.locator(`${selector}:not(.theme-editor-v2__is-hidden)`)).toHaveCount(2);
      await verifyIconEye(dashboard, `:nth-match(${selector}, 1)`);
      await verifySave(dashboard);
    });
  });

  test("Check duplicate block in section @TC_INS_DB_Product_Add_Remove_Show_Hide_Duplicate_Blocks", async ({
    dashboard,
    conf,
  }) => {
    const checkedAndBack = async (selector: string) => {
      await dashboard.waitForSelector(selector);
      await dashboard.click(selector);
      await dashboard.check('.theme-editor-v2__settings [data-key="collapsed"] .sb-check');
      await dashboard.click(".theme-editor-v2__title button:visible");
    };

    await test.step("Add blocks can add one more time", async () => {
      for (let i = 0; i < conf.caseConf["blocks_add_section"].length; i++) {
        await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
        await dashboard.click(
          `.theme-editor-v2__new-elements [data-add-element-label="${conf.caseConf["blocks_add_section"][i]}"]`,
        );
      }
    });

    await test.step("Hover blocks can add one more time", async () => {
      for (let i = 0; i < conf.caseConf["blocks_add_section"].length; i++) {
        // eslint-disable-next-line max-len
        const selector = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks_add_section"][i]}"]`;
        await verifyHiddenIcon(dashboard, selector, "duplicate");
      }
    });

    await test.step("Hover block collapse tab 1", async () => {
      const firstSelector = ':nth-match([data-section-label="Product"] [data-block-label="Collapse tab"], 1)';
      await checkedAndBack(firstSelector);
      await verifyVisibleIcon(dashboard, firstSelector, "duplicate");
      await dashboard.click(`${firstSelector} [data-block-action="duplicate"]`);
      await expect(
        await dashboard.locator('[data-section-label="Product"] [data-block-label="Collapse tab"]'),
      ).toHaveCount(4);
      await verifyHiddenIcon(dashboard, firstSelector, "duplicate");
    });

    await test.step("Open block duplicate verify setting with Collapse tab 1", async () => {
      const blockSelector = '[data-section-label="Product"] [data-block-label="Collapse tab"]';
      const allSelector = await dashboard.locator(blockSelector).count();
      for (let i = 0; i < allSelector; i++) {
        await dashboard.click(`:nth-match(${blockSelector}, ${i + 1})`);
        let options = {};
        if (i > 1) {
          options = { checked: false };
        }
        await expect(await dashboard.locator('.theme-editor-v2__settings [data-key="collapsed"] input')).toBeChecked(
          options,
        );
        await dashboard.click(".theme-editor-v2__title button:visible");
      }
    });

    await test.step("Click remove button block duplicate from collapse tab 1", async () => {
      const blockSelector = '[data-section-label="Product"] [data-block-label="Collapse tab"]';
      await dashboard.click(`:nth-match(${blockSelector}, 2)`);
      await dashboard.click('button[data-action-remove="block"]');
      await verifyVisibleIcon(dashboard, `:nth-match(${blockSelector}, 1)`, "duplicate");
    });

    await test.step("Add block Page and hover verify visible icon duplicate", async () => {
      const blockPageSelector = '[data-section-label="Product"] [data-block-label="Page"]';
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Page"]');
      await checkedAndBack(blockPageSelector);
      await verifyVisibleIcon(dashboard, blockPageSelector, "duplicate");
    });

    await test.step("Click icon duplicate block Page 1", async () => {
      const blockPageSelector = '[data-section-label="Product"] [data-block-label="Page"]';
      await dashboard.click(`${blockPageSelector} [data-block-action="duplicate"]`);
      await expect(await dashboard.locator(blockPageSelector)).toHaveCount(2);
    });

    await test.step("Hover block Page 2 and verify same setting Page 1 after remove block", async () => {
      const blockPageSelector = '[data-section-label="Product"] [data-block-label="Page"]';
      await verifyHiddenIcon(dashboard, `:nth-match(${blockPageSelector}, 2)`, "duplicate");
      await dashboard.click(`:nth-match(${blockPageSelector}, 2)`);
      await expect(await dashboard.locator('.theme-editor-v2__settings [data-key="collapsed"] input')).toBeChecked();
      await dashboard.click('button[data-action-remove="block"]');
      await verifyVisibleIcon(dashboard, blockPageSelector, "duplicate");
    });

    await test.step("Add 4 block Text into section", async () => {
      for (let i = 0; i < 4; i++) {
        await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
        await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Text"]');
      }
    });

    await test.step("Change setting block Text 1", async () => {
      await dashboard.click(':nth-match([data-section-label="Product"] [data-block-label="Text"], 1)');
      await changeStyleBlockText(dashboard);
      await dashboard.click(".theme-editor-v2__title button:visible");
    });

    await test.step("Hover block Text 1 verify visible icon duplicate", async () => {
      const blockTextSelector = ':nth-match([data-section-label="Product"] [data-block-label="Text"], 1)';
      await verifyVisibleIcon(dashboard, blockTextSelector, "duplicate");
    });

    await test.step("click icon duplicate block Text 1", async () => {
      const blockTextSelector = ':nth-match([data-section-label="Product"] [data-block-label="Text"], 1)';
      await dashboard.click(`${blockTextSelector} [data-block-action="duplicate"]`);
      await verifyHiddenIcon(dashboard, blockTextSelector, "duplicate");
    });

    await test.step("Open block duplicate from block Text 1 verify same setting and remove", async () => {
      const blockSelector = '[data-section-label="Product"] [data-block-label="Text"]';
      const allSelector = await dashboard.locator(blockSelector).count();
      for (let i = 0; i < allSelector; i++) {
        await dashboard.click(`:nth-match(${blockSelector}, ${i + 1})`);
        const expected = i < 2 ? "Subtitle" : "Bodytext";
        await expect(await dashboard.innerText('[data-key="style"] button')).toEqual(expected);
        await dashboard.click(".theme-editor-v2__title button:visible");
      }
      await dashboard.click(`:nth-match(${blockSelector}, 2)`);
      await dashboard.click('button[data-action-remove="block"]');
      await verifyVisibleIcon(dashboard, `:nth-match(${blockSelector}, 1)`, "duplicate");
    });
  });
  /* End test blocks */
});

test.describe("@TS_INS_DB_Product_Section", () => {
  const defaultThemeSetting = async (dashboard: Page) => {
    await expect(await dashboard.locator('input[name="Settings by theme settings"]')).toBeChecked();
    await expect(await dashboard.locator('input[name="Customize"]')).toBeChecked({ checked: false });
  };
  const checkedCustomize = async (dashboard: Page) => {
    await dashboard.check('span[for="Customize"]');
    await expect(await dashboard.locator('input[name="Settings by theme settings"]')).toBeChecked({ checked: false });
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verifyCustomize = async (dashboard: Page, items: [{ [key: string]: any }]) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.is_dropdown) {
        expect(await dashboard.innerText(item.selector)).toEqual(item.expected);
        continue;
      }
      await expect(dashboard.locator(item.selector)).toBeChecked(item.expected);
    }
  };
  const verifyDropdown = async (dashboard: Page, attrs: string, values: string[]) => {
    await dashboard.click(`[data-key="${attrs}"] button`);
    await dashboard.waitForSelector(`#popover_select_${attrs}:visible li`);
    const positions = await dashboard.locator(`#popover_select_${attrs}:visible li`).allInnerTexts();
    expect(positions.every(p => values.includes(p))).toBeTruthy();
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkedSettingByTheme = async (dashboard: Page, items: [{ [key: string]: any }]) => {
    await dashboard.check('span[for="Settings by theme settings"]');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await expect(dashboard.locator(item.selector)).toBeHidden();
    }
  };
  const addTwoBlock = async (dashboard: Page, block: string) => {
    for (let i = 0; i < 2; i++) {
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      await dashboard.click(`.theme-editor-v2__new-elements [data-add-element-label="${block}"]`);
    }
  };
  const checkedCollapse = async (dashboard: Page) => {
    await expect(await dashboard.locator('label[data-key="collapsed"] input')).toBeChecked({ checked: false });
    await dashboard.check('.theme-editor-v2__settings [data-key="collapsed"] .sb-check');
    await expect(await dashboard.locator('label[data-key="collapsed"] input')).toBeChecked();
  };
  const verifyTitleNewTab = async ({ dashboard, context, linkSelector, titleSelector, titleExpect }) => {
    const [newPage] = await Promise.all([context.waitForEvent("page"), await dashboard.click(linkSelector)]);
    await newPage.waitForLoadState("networkidle");
    await expect(await newPage.innerText(titleSelector)).toEqual(titleExpect);
    await newPage.close();
  };
  const verifyNewTabAndBack = async ({ dashboard, context, label, helpText, titleSelector, titleExpect }) => {
    await dashboard.click(`[data-section-label="Product"] [data-block-label="${label}"]`);
    expect(await dashboard.innerText('[type="help_text"] p')).toEqual(helpText);
    await verifyTitleNewTab({
      dashboard,
      context,
      linkSelector: '[type="help_text"] a',
      titleSelector,
      titleExpect,
    });
    expect(await dashboard.innerText('[type="help_text"] p')).toEqual(helpText);
    await dashboard.click(".theme-editor-v2__title button:visible");
  };

  // Pre conditions test
  preConditionTest();

  test("Check UI and data default Product section setting @TC_INS_DB_Product_Default_Setting", async ({
    dashboard,
    conf,
  }) => {
    const verifyDefaultSettingCustomize = async () => {
      for (let i = 0; i < conf.caseConf["product_settings_default"].length; i++) {
        const item = conf.caseConf["product_settings_default"][i];
        await expect(await dashboard.locator(item.selector)).toBeChecked(item.expected);
      }
    };

    await test.step("Open product section and verify default setting", async () => {
      await dashboard.click('[data-section-label="Product"] .theme-editor-v2__section-title');
      await defaultThemeSetting(dashboard);
      await verifyDefaultSettingCustomize();
    });

    await test.step("Click set radio button Customize button", async () => {
      await checkedCustomize(dashboard);
      await verifyCustomize(dashboard, conf.caseConf["customize_settings_default"]);
      await verifyDefaultSettingCustomize();
    });

    await test.step("Open dropdown Description position", async () => {
      await verifyDropdown(dashboard, "template_product", conf.caseConf["description_positions"]);
    });

    await test.step("Click radio button Settings by theme settings button", async () => {
      await checkedSettingByTheme(dashboard, conf.caseConf["customize_settings_default"]);
      await verifyDefaultSettingCustomize();
    });
  });

  test("Check UI and data default block Price @TC_INS_DB_Product_Default_Block_Price", async ({ dashboard, conf }) => {
    await test.step("Open block Price", async () => {
      await dashboard.click('[data-section-label="Product"] [data-block-label="Price"]');
      await defaultThemeSetting(dashboard);
    });

    await test.step("Choose radio button Customize button", async () => {
      await checkedCustomize(dashboard);
      await verifyCustomize(dashboard, conf.caseConf["customize_settings_default"]);
      await verifyDropdown(dashboard, "saving_format", conf.caseConf["sale_type"]);
      await checkedSettingByTheme(dashboard, conf.caseConf["customize_settings_default"]);
    });
  });

  test("Check UI and data default của block Buy Buttons @TC_INS_DB_Product_Default_Block_Buy_Buttons", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Open block Buy button", async () => {
      await dashboard.click('[data-section-label="Product"] [data-block-label="Buy buttons"]');
      await defaultThemeSetting(dashboard);
    });

    await test.step("Choose radio button Customize button", async () => {
      await checkedCustomize(dashboard);
      await verifyCustomize(dashboard, conf.caseConf["customize_settings_default"]);
    });

    await test.step("Uncheck Show quantity box", async () => {
      await dashboard.uncheck('[data-key="show_quantity_box"] .sb-check');
      await verifyCustomize(dashboard, conf.caseConf["uncheck_show_quantity"]);
      expect(await dashboard.isHidden('label[data-key="enable_same_line_quantity_box"]')).toBeTruthy();
    });

    await test.step("Check checkbox Show quantity box", async () => {
      await dashboard.check('[data-key="show_quantity_box"] .sb-check');
      await verifyCustomize(dashboard, conf.caseConf["customize_settings_default"]);
    });

    await test.step("Check checkbox Show dynamic checkout button", async () => {
      await dashboard.check('[data-key="show_dynamic_checkout_button"] .sb-check');
      await verifyCustomize(dashboard, conf.caseConf["checked_show_dynamic_checkout"]);
    });

    await test.step("Uncheck Show dynamic checkout button", async () => {
      await dashboard.uncheck('[data-key="show_dynamic_checkout_button"] .sb-check');
      await verifyCustomize(dashboard, conf.caseConf["customize_settings_default"]);
      expect(await dashboard.isHidden('label[data-key="buy_with_paypal"]')).toBeTruthy();
    });
  });

  test("Check UI and data default block Variants selector @TC_INS_DB_Product_Default_Block_Variant", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Open block Variants selector", async () => {
      await dashboard.click('[data-section-label="Product"] [data-block-label="Variants selector"]');
      await defaultThemeSetting(dashboard);
    });

    await test.step("Choose radio button Customize button", async () => {
      await checkedCustomize(dashboard);
      await verifyCustomize(dashboard, conf.caseConf["customize_settings_default"]);
      await verifyDropdown(dashboard, "options_style", conf.caseConf["options_style"]);
      await checkedSettingByTheme(dashboard, conf.caseConf["customize_settings_default"]);
    });
  });

  test("Check UI and data default block Trust badge @TC_INS_DB_Product_Default_Block_Trust_Badge", async ({
    dashboard,
  }) => {
    await test.step("Open block Trust badge", async () => {
      await dashboard.click('[data-section-label="Product"] [data-block-label="Trust badge"]');
      await defaultThemeSetting(dashboard);
    });
    await test.step("Choose radio button Customize button", async () => {
      await checkedCustomize(dashboard);
      expect(await dashboard.getAttribute('[data-key="trust_badge"] img', "src")).toEqual(
        "https://img.btdmp.com/themes/3/assets/trust_badge.png",
      );
      expect(await dashboard.inputValue('[data-key="trust_badge_alt_text"] input')).toEqual("");
      await dashboard.check('span[for="Settings by theme settings"]');
      await expect(await dashboard.locator('[data-key="trust_badge"]')).toBeHidden();
      await expect(await dashboard.locator('[data-key="trust_badge_alt_text"]')).toBeHidden();
    });
  });

  test("Check UI and data default block Social share buttons @TC_INS_DB_Product_Default_Block_Social", async ({
    dashboard,
    conf,
  }) => {
    await test.step("Open block Social share buttons", async () => {
      await dashboard.click('[data-section-label="Product"] [data-block-label="Social share buttons"]');
      for (let i = 0; i < conf.caseConf["key_settings"].length; i++) {
        await expect(
          await dashboard.locator(`label[data-key="${conf.caseConf["key_settings"][i]}"] input`),
        ).toBeChecked();
      }
    });
  });

  test("Check UI and data default block Product description @TC_INS_DB_Product_Default_Block_Description", async ({
    dashboard,
  }) => {
    await test.step("Open block Product description", async () => {
      await dashboard.click('[data-section-label="Product"] [data-block-label="Product description"]');
      expect(await dashboard.inputValue('input[data-value="Product description"]')).toEqual("Product description");
      await expect(await dashboard.locator('label[data-key="collapsed"]')).toBeChecked({ checked: false });
      await dashboard.click(".theme-editor-v2__title button:visible");
    });
  });

  test("Check UI and data default block Collapse tab default @TC_INS_DB_Product_Default_Block_Collapse_Tab", async ({
    dashboard,
  }) => {
    const contentDefault =
      // eslint-disable-next-line max-len
      "<ul><li><strong>100% Secure payment</strong> with SSL Encryption.</li><li>If you're not <strong>100% satisfied</strong>, let us know and we'll make it right.</li></ul>";
    const verifyDefaultSetting = async (selector: string, heading: string, content: string) => {
      await dashboard.click(selector);
      expect(await dashboard.inputValue('input[data-key="heading"]')).toEqual(heading);
      await dashboard.waitForSelector('[type="text_editor"] .tox-tinymce:visible');
      const contentValue = await dashboard.getAttribute('[data-key="content"]', "data-value");
      expect(JSON.stringify(contentValue)).toEqual(JSON.stringify(content));
      await expect(await dashboard.locator('label[data-key="collapsed"]')).toBeChecked({ checked: false });
      await dashboard.click(".theme-editor-v2__title button:visible");
    };

    await test.step("Open block Collapse tab 1", async () => {
      await verifyDefaultSetting(
        ':nth-match([data-section-label="Product"] [data-block-label="Collapse tab"], 1)',
        "RETURN & WARRANTY",
        contentDefault,
      );
    });

    await test.step("Open block Collapse tab 2", async () => {
      const content =
        // eslint-disable-next-line max-len
        "<ul><li>Orders ship within <strong>5 to 10 business days</strong>.</li><li><strong>Tip:</strong> Buying 2 products or more at the same time will save you quite a lot on shipping fees.</li></ul>";
      await verifyDefaultSetting(
        ':nth-match([data-section-label="Product"] [data-block-label="Collapse tab"], 2)',
        "Shipping & Policies",
        content,
      );
    });

    await test.step("Check UI and data default block Collapse tab when add new block", async () => {
      await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
      await dashboard.click('.theme-editor-v2__new-elements [data-add-element-label="Collapse tab"]');
      await verifyDefaultSetting(
        ':nth-match([data-section-label="Product"] [data-block-label="Collapse tab"], 3)',
        "Return & Warranty",
        contentDefault,
      );
    });
  });

  // eslint-disable-next-line max-len
  test("Check change setting block Collapse tab when section many block Collapse tab @TC_INS_DB_Product_Change_Block_Collapse_Tab", async ({
    dashboard,
  }) => {
    await test.step("Open collapse tab 1 change setting block", async () => {
      await dashboard.click(':nth-match([data-section-label="Product"] [data-block-label="Collapse tab"], 1)');
      await checkedCollapse(dashboard);
      await verifySave(dashboard);
      await dashboard.click(".theme-editor-v2__title button:visible");
    });

    await test.step("Open collapse tab 2", async () => {
      await dashboard.click(':nth-match([data-section-label="Product"] [data-block-label="Collapse tab"], 2)');
      await expect(await dashboard.locator('label[data-key="collapsed"] input')).toBeChecked({ checked: false });
      await dashboard.click(".theme-editor-v2__title button:visible");
    });
  });

  test("Check UI and data default block Page @TC_INS_DB_Product_Change_Block_Page", async ({ dashboard, context }) => {
    await test.step("Add 2 block Page into section Product", async () => {
      await addTwoBlock(dashboard, "Page");
    });

    await test.step("Open block Page", async () => {
      await dashboard.click(':nth-match([data-section-label="Product"] [data-block-label="Page"], 1)');
      await expect(await dashboard.locator('[label="Content page"] .theme-editor-v2__link')).toBeVisible();
      expect(await dashboard.innerText('[data-key="page"] button')).toEqual("Select a page");
      await expect(await dashboard.locator('label[data-key="collapsed"] input')).toBeChecked({ checked: false });
    });

    await test.step("Click Create page button", async () => {
      await verifyTitleNewTab({
        dashboard,
        context,
        linkSelector: '[label="Content page"] .theme-editor-v2__link',
        titleSelector: ".page-add h1.title-bar__title",
        titleExpect: "Add page",
      });
    });

    await test.step("Check change setting block Page 1 not update setting block Page 2", async () => {
      await checkedCollapse(dashboard);
      await dashboard.click(".theme-editor-v2__title button:visible");
      await dashboard.click(':nth-match([data-section-label="Product"] [data-block-label="Page"], 2)');
      await expect(await dashboard.locator('label[data-key="collapsed"] input')).toBeChecked({ checked: false });
      await dashboard.click(".theme-editor-v2__title button:visible");
    });
  });

  test("Check UI and data default block Text @TC_INS_DB_Product_Change_Block_Text", async ({ dashboard, conf }) => {
    await test.step("Add 2 block Text into section Product", async () => {
      await addTwoBlock(dashboard, "Text");
    });

    await test.step("Open block Text 1", async () => {
      await dashboard.click(':nth-match([data-section-label="Product"] [data-block-label="Text"], 1)');
      expect(await dashboard.inputValue('[data-key="content"] input[type="text"]')).toEqual("Text block");
      expect(await dashboard.innerText('[data-key="style"] button')).toEqual("Bodytext");
    });

    await test.step("Open dropdown Style", async () => {
      await verifyDropdown(dashboard, "style", conf.caseConf["style"]);
      await dashboard.click(".theme-editor-v2__title-text");
      await changeStyleBlockText(dashboard);
      await verifySave(dashboard);
      await dashboard.click(".theme-editor-v2__title button:visible");
    });

    await test.step("Open block Text 2", async () => {
      await dashboard.click(':nth-match([data-section-label="Product"] [data-block-label="Text"], 2)');
      expect(await dashboard.innerText('[data-key="style"] button')).toEqual("Bodytext");
      await dashboard.click(".theme-editor-v2__title button:visible");
    });
  });

  test("Check UI block Third party app @TC_INS_DB_Product_Change_Block_Third_Party_App", async ({
    dashboard,
    conf,
    context,
  }) => {
    await test.step("Open block Review", async () => {
      await verifyNewTabAndBack({
        dashboard,
        context,
        label: "Review",
        helpText: "To customize and change settings of this block, please go to Product Reviews.",
        titleSelector: ".page-reviews h1.fs-large",
        titleExpect: "All reviews",
      });
    });

    await test.step("Open block app Upsell", async () => {
      for (let i = 0; i < conf.caseConf["upsell"].length; i++) {
        const item = conf.caseConf["upsell"][i];
        await verifyNewTabAndBack({
          dashboard,
          context,
          label: `${item.label}`,
          helpText: "To customize and change settings of this block, please go to Boost Upsell.",
          titleSelector: ".list-offer__container h2",
          titleExpect: `${item.title_expect}`,
        });
      }
    });

    await test.step("Open block app Review", async () => {
      for (let i = 0; i < conf.caseConf["boost_convert"].length; i++) {
        const item = conf.caseConf["boost_convert"][i];
        await verifyNewTabAndBack({
          dashboard,
          context,
          label: `${item.label}`,
          helpText: "To customize and change settings of this block, please go to Boost Convert.",
          titleSelector: `${item.title_selector}`,
          titleExpect: `${item.title_expect}`,
        });
      }
    });
  });

  test("Check UI block no customize @TC_INS_DB_Product_Change_Block_No_Customize", async ({ dashboard, conf }) => {
    await test.step("Open block no customize", async () => {
      await dashboard.waitForSelector('[data-section-label="Product"]');
      for (let i = 0; i < conf.caseConf["blocks"].length; i++) {
        const selector = `[data-section-label="Product"] [data-block-label="${conf.caseConf["blocks"][i]}"]`;
        const block = await dashboard.locator(selector).count();
        if (block === 0) {
          await dashboard.click('[data-section-label="Product"] [data-block-action="add"]');
          await dashboard.click(
            `.theme-editor-v2__new-elements [data-add-element-label="${conf.caseConf["blocks"][i]}"]`,
          );
        }

        await dashboard.click(selector);
        expect(await dashboard.innerText(".theme-editor-v2__input-help-text")).toEqual(
          "No customizable settings available",
        );
        await dashboard.click(".theme-editor-v2__title button:visible");
      }
    });
  });
});
