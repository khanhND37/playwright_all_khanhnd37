import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import { Page } from "@playwright/test";
import type { Library } from "@types";
import type { LibrariesBuilder } from "@types";
import { CreatorPage } from "@pages/dashboard/creator";

/*
Data test:
- Root shop: shop libraries "Copy library", "Copied library", "Update and delete root library"
 */
let creatorPage: CreatorPage;
const verifyLibraryInList = async (page: Page, selector: string, library: Library) => {
  // Verify library title
  if (library.title) {
    await expect(page.locator(`${selector}//span[@class='sb-text-bold library-info']`)).toHaveText(library.title);
  }
  // Verify text linked library
  const textLinked = `${selector}//span[@class='sb-text-bold library-info']//span`;
  if (library.link) {
    await expect(page.locator(textLinked)).toHaveText(library.link);
  } else {
    await expect(page.locator(textLinked)).toBeHidden();
  }
  // Verify description
  const typeSelector = `${selector}//div[@class='page-designs__library--description']`;
  if (library.type) {
    await expect(page.locator(typeSelector)).toHaveText(library.type);
  } else {
    await expect(page.locator(typeSelector)).toBeHidden();
  }
  // Verify status
  if (library.status) {
    const actual = page.locator(`${selector}//div[contains(@class,'page-designs__library--toggle')]//input`);
    await expect(actual).toHaveValue(library.status);
  }

  // Verify show actions
  if (library.actions) {
    const actionsSelector = `${selector}//button`;
    const countAction = await page.locator(actionsSelector).count();
    expect(countAction).toEqual(library.actions.length);
    for (let i = 0; i < countAction; i++) {
      const action = await page.locator(`(${actionsSelector})[${i + 1}]`).innerText();
      expect(action).toEqual(library.actions[i]);
    }
  }
};

test.describe("Verify library list", () => {
  test.beforeEach(async ({ builder }) => {
    // Delete libraries and linked libraries in shop
    const libraries = await builder.listLibrary({ action: "all" });
    for (const library of libraries) {
      if (!library.published) {
        if (library.is_linked) {
          await builder.deleteLibraryLinked(library.id);
        } else {
          await builder.deleteLibrary(library.id);
        }
      }
    }
  });

  test("Verify library web base @SB_WEB_BUILDER_WB_LibraryAuto_1", async ({ dashboard, conf }) => {
    await test.step("Verify UI libraries block", async () => {
      creatorPage = new CreatorPage(dashboard, conf.suiteConf.domain);
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      await dashboard.waitForLoadState("networkidle");
    });

    await test.step("Verify show library web base", async () => {
      await verifyLibraryInList(
        dashboard,
        creatorPage.getXpathLibrarySelector(conf.caseConf.library.index),
        conf.caseConf.library,
      );
    });

    await test.step("verify data web base", async () => {
      await dashboard.locator(creatorPage.getXpathAction("View", conf.caseConf.library.index)).click();
      await dashboard.waitForSelector(creatorPage.xpathLibraryDetail);
      const alert = await dashboard.locator(creatorPage.xpathContentAlertInfo).innerText();
      expect(alert.trim()).toEqual(conf.caseConf.library.alert);

      await expect(dashboard.locator(creatorPage.xpathDisableInputName)).toBeVisible();
      await expect(dashboard.locator(creatorPage.xpathDisableInputDes)).toBeVisible();
    });
  });

  test("Verify create shop library @SB_WEB_BUILDER_WB_LibraryAuto_3", async ({ dashboard, conf, builder }) => {
    creatorPage = new CreatorPage(dashboard, conf.suiteConf.domain);
    await test.step("Pre-condition: Create shop library", async () => {
      await builder.createLibrary(conf.caseConf.pre_condition);
    });

    await test.step("Input data to create library", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      const libraries = conf.caseConf.input;
      for (let i = 0; i < libraries.length; i++) {
        if (libraries[i].click_create) {
          await dashboard.locator(creatorPage.xpathBtnCreateLib).click();
          await dashboard.waitForSelector(creatorPage.xpathPopup);
        }
        // Input data to create library
        await dashboard.locator(creatorPage.xpathInputLibName).fill(libraries[i].title);
        await dashboard.locator(creatorPage.xpathInputLibDescription).fill(libraries[i].description);
        if (libraries[i].button_selector) {
          await expect(dashboard.locator(libraries[i].button_selector)).toBeVisible();
        }
        if (libraries[i].click) {
          await dashboard.locator(libraries[i].click).click();
        }
        if (libraries[i].alert) {
          const alert = await dashboard.locator(libraries[i].alert_selector).innerText();
          expect(alert.trim()).toEqual(libraries[i].alert);
        }
      }
    });

    await test.step("Verify created library", async () => {
      for (const library of conf.caseConf.expect.libraries) {
        const librarySelector = creatorPage.getXpathLibrarySelector(library.index);
        await verifyLibraryInList(dashboard, librarySelector, library);
      }
    });
  });

  test("Verify action edit shop library @SB_WEB_BUILDER_WB_LibraryAuto_4", async ({ dashboard, conf, builder }) => {
    creatorPage = new CreatorPage(dashboard, conf.suiteConf.domain);
    let countLibraryBefore;
    let librarySelector = creatorPage.getXpathLibrarySelector();

    await test.step("Pre-condition: Create library", async () => {
      await builder.createLibrary(conf.caseConf.pre_condition);
    });

    await test.step("Open page library detail", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      await dashboard.waitForLoadState("networkidle");
      countLibraryBefore = await dashboard.locator(librarySelector).count();

      await dashboard.locator(creatorPage.getXpathAction("Edit", conf.caseConf.index)).click();
      await dashboard.waitForSelector(creatorPage.xpathLibraryDetail);
    });

    await test.step("Input data to edit library", async () => {
      const libraries = conf.caseConf.input;
      for (let i = 0; i < libraries.length; i++) {
        // Input data to edit library
        await dashboard.locator(creatorPage.xpathInputLibName).fill(libraries[i].title);
        await dashboard.locator(creatorPage.xpathInputLibDescription).fill(libraries[i].description);

        await dashboard.locator(creatorPage.xpathBtnSaveLib).click();
        await expect(dashboard.locator(`text=${libraries[i].toast}`)).toBeVisible();
      }
      await dashboard.locator(creatorPage.xpathBtnDesign).click();
    });

    await test.step("Verify edited library", async () => {
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      const countLibraryAfter = await dashboard.locator(creatorPage.getXpathLibrarySelector()).count();
      await expect(countLibraryAfter).toEqual(countLibraryBefore);
      librarySelector = creatorPage.getXpathLibrarySelector(conf.caseConf.expect.library.index);
      await verifyLibraryInList(dashboard, librarySelector, conf.caseConf.expect.library);
    });
  });

  test("Verify actions enable/disable and delete library @SB_WEB_BUILDER_WB_LibraryAuto_5", async ({
    dashboard,
    conf,
    builder,
  }) => {
    creatorPage = new CreatorPage(dashboard, conf.suiteConf.domain);
    const librarySelector = creatorPage.getXpathLibrarySelector(conf.caseConf.index);
    const buttonsOnModal = [creatorPage.xpathBtnClose, creatorPage.xpathBtnDiscard, creatorPage.xpathBtnDelete];

    await test.step("Pre-condition: Create library", async () => {
      await builder.createLibrary(conf.caseConf.pre_condition);
    });

    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
    await dashboard.waitForSelector(creatorPage.xpathLibraryList);
    await dashboard.waitForLoadState("networkidle");
    const countLibraryBefore = await dashboard.locator(creatorPage.getXpathLibrarySelector()).count();

    await test.step("Verify action enable/disable library", async () => {
      const toggleSelector = dashboard.locator(
        `${librarySelector}//div[contains(@class,'page-designs__library--toggle')]//input`,
      );
      const toggle = `${librarySelector}//div[contains(@class,'page-designs__library--toggle')]//span[@class='sb-switch__switch sb-relative is-default']`;
      await dashboard.locator(toggle).click();
      await expect(toggleSelector).toHaveValue(conf.caseConf.disable_status);
      await dashboard.locator(toggle).click();
      await expect(toggleSelector).toHaveValue(conf.caseConf.enable_status);
    });

    await test.step("Verify delete library", async () => {
      for (let i = 0; i < buttonsOnModal.length; i++) {
        await dashboard.pause();
        await dashboard.locator(creatorPage.getXpathAction("Delete", conf.caseConf.index)).click();
        await dashboard.waitForSelector(creatorPage.xpathPopup);
        await dashboard.locator(buttonsOnModal[i]).click();
        await dashboard.waitForSelector(creatorPage.xpathPopup, { state: "hidden" });
        const countLibraryAfter = await dashboard.locator(creatorPage.getXpathLibrarySelector()).count();
        if (buttonsOnModal[i].includes(creatorPage.xpathBtnDelete)) {
          await expect(dashboard.locator(`text=${conf.caseConf.toast}`)).toBeVisible();
          expect(countLibraryAfter).toEqual(countLibraryBefore - 1);
        } else {
          expect(countLibraryAfter).toEqual(countLibraryBefore);
        }
      }
    });
  });

  test("Verify create library linked @SB_WEB_BUILDER_WB_LibraryAuto_6", async ({ dashboard, conf, builder }) => {
    creatorPage = new CreatorPage(dashboard, conf.suiteConf.domain);
    let linkedLibrary, countLibraryBefore;

    await test.step("Pre-condition: Create libraries or link libraries", async () => {
      const libraries = conf.caseConf.pre_condition;
      for (const library of libraries) {
        if (library.shop) {
          const result = await builder.listLibrary({ action: "all" }, conf.suiteConf.other_shop);
          const id = result.find(item => item.title === library.title).id;
          await builder.createLibraryLinked(id);
        } else {
          await builder.createLibrary(library);
        }
      }
    });

    await test.step("Open model create library linked and verify UI popup", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      await dashboard.waitForLoadState("networkidle");
      countLibraryBefore = await dashboard.locator(creatorPage.getXpathLibrarySelector()).count();

      await dashboard.locator(creatorPage.xpathBtnLinkLib).click();
      await dashboard.waitForSelector(creatorPage.xpathPopup);
    });

    await test.step("Input library id and check validate", async () => {
      const libraries = conf.caseConf.input;
      for (const library of libraries) {
        // Get id to input
        let id;
        if (typeof library.id !== "undefined") {
          id = library.id;
        } else {
          let result;
          if (library.shop) {
            result = await builder.listLibrary({ action: "all" }, conf.suiteConf.other_shop);
          } else {
            result = await builder.listLibrary({ action: "all" });
          }
          linkedLibrary = result.find(item => item.title === library.title);
          id = linkedLibrary.id;
        }

        if (library.click_create) {
          await dashboard.locator(creatorPage.xpathBtnLinkLib).click();
          await dashboard.waitForSelector(creatorPage.xpathPopup);
        }
        // Input id and verify validate
        await dashboard.locator(`//input[@placeholder='Library ID']`).fill(id.toString());
        if (library.click) {
          await dashboard.locator(library.click).click();
        }
        if (library.alert) {
          const alert = await dashboard.locator(library.alert_selector).innerText();
          expect(alert.trim()).toEqual(library.alert);
          await dashboard.locator(".sb-alert__icon-close").click();
        }
        if (library.toast) {
          await expect(dashboard.locator(`text='${library.toast}'`)).toBeVisible();
        }
      }
    });

    await test.step("Verify created library in list", async () => {
      const libraries = conf.caseConf.expect.libraries;
      const countLibraryAfter = await dashboard.locator(creatorPage.getXpathLibrarySelector()).count();
      expect(countLibraryAfter).toEqual(countLibraryBefore + libraries.length);

      for (const library of libraries) {
        const librarySelector = creatorPage.getXpathLibrarySelector(library.index);
        await verifyLibraryInList(dashboard, librarySelector, library);
      }
    });
  });

  test("Verify update and delete root library @SB_WEB_BUILDER_WB_LibraryAuto_7", async ({
    dashboard,
    conf,
    builder,
  }) => {
    creatorPage = new CreatorPage(dashboard, conf.suiteConf.domain);
    const rootShop = conf.suiteConf.other_shop;
    const updateData = conf.caseConf.update;
    const deleteData = conf.caseConf.delete;
    let libraryId: number;
    const librarySelector = creatorPage.getXpathLibrarySelector();

    await test.step("Pre-condition: Create linked library", async () => {
      let library: LibrariesBuilder;
      const resultList = await builder.listLibrary({ action: "all" }, rootShop);
      library = resultList.find(item => item.title === conf.caseConf.library.title);
      if (!library) {
        await builder.createLibrary(conf.caseConf.library, rootShop);
        const resultList = await builder.listLibrary({ action: "all" }, rootShop);
        library = resultList.find(item => item.title === conf.caseConf.library.title);
      }
      libraryId = library.id;
      await builder.createLibraryLinked(libraryId);
    });

    await test.step("Update root library", async () => {
      await builder.updateLibrary(libraryId, updateData.input, rootShop);
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      await expect(
        dashboard.locator(creatorPage.getXpathLibrarySelector(updateData.expect.library_index)),
      ).toContainText(updateData.input.title);
    });

    await test.step("Delete library", async () => {
      await builder.deleteLibrary(libraryId, rootShop);
      await dashboard.reload();
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      await expect(
        dashboard.locator(creatorPage.getXpathLibrarySelector(updateData.expect.library_index)),
      ).toHaveAttribute("class", "page-designs__library--item page-designs__library--item-disabled");
      await expect(dashboard.locator(`${librarySelector}//span[contains(@class,'sb-icon__custom')]`)).toBeVisible();

      // Verify show action
      const actionsSelector = `${librarySelector}[${updateData.expect.library_index}]//button`;
      const countAction = await dashboard.locator(actionsSelector).count();
      expect(countAction).toEqual(deleteData.expect.actions.length);
      for (let i = 0; i < countAction; i++) {
        const action = await dashboard.locator(`(${actionsSelector})[${i + 1}]`).innerText();
        expect(action).toEqual(deleteData.expect.actions[i]);
      }
    });
  });

  test("Verify actions with linked library @SB_WEB_BUILDER_WB_LibraryAuto_8", async ({ dashboard, conf, builder }) => {
    creatorPage = new CreatorPage(dashboard, conf.suiteConf.domain);
    const data = conf.caseConf;

    await test.step("Pre-condition: Create library linked", async () => {
      const getList = await builder.listLibrary({ action: "all" });
      const getLibrary = getList.find(item => item.title === data.title);

      if (!getLibrary) {
        const result = await builder.listLibrary({ action: "all" }, conf.suiteConf.other_shop);
        const id = result.find(item => item.title === data.title).id;
        await builder.createLibraryLinked(id);
      }
    });

    await test.step("Verify action View linked library", async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      await dashboard.locator(creatorPage.getXpathAction("View", data.library_index)).click();
      await dashboard.waitForSelector(creatorPage.xpathLibraryDetail);
      const alert = await dashboard.locator(creatorPage.xpathContentAlertInfo).innerText();
      expect(alert.trim()).toEqual(data.alert);
      await expect(dashboard.locator(creatorPage.xpathDisableInputName)).toBeVisible();
      await expect(dashboard.locator(creatorPage.xpathDisableInputDes)).toBeVisible();
      await dashboard.locator(creatorPage.xpathBtnDesign).click();
    });

    await test.step("Verify action remove linked library", async () => {
      const buttonsOnModal = [creatorPage.xpathBtnClose, creatorPage.xpathBtnDiscard, creatorPage.xpathBtnDelete];
      await dashboard.waitForSelector(creatorPage.xpathLibraryList);
      await dashboard.waitForLoadState("networkidle");
      const countLibraryBefore = await dashboard.locator(creatorPage.getXpathLibrarySelector()).count();

      for (let i = 0; i < buttonsOnModal.length; i++) {
        await dashboard.locator(creatorPage.getXpathAction("Remove", data.library_index)).click();
        await dashboard.waitForSelector(creatorPage.xpathPopup);

        await dashboard.locator(buttonsOnModal[i]).click();
        await dashboard.waitForSelector(creatorPage.xpathPopup, { state: "hidden" });
        const countLibraryAfter = await dashboard.locator(creatorPage.getXpathLibrarySelector()).count();

        if (buttonsOnModal[i].includes(".sb-button--danger")) {
          expect(countLibraryAfter).toEqual(countLibraryBefore - 1);
          await expect(dashboard.locator(creatorPage.getXpathLibrarySelector(data.library_index))).toBeHidden();
        } else {
          expect(countLibraryAfter).toEqual(countLibraryBefore);
        }
      }
    });
  });
});
