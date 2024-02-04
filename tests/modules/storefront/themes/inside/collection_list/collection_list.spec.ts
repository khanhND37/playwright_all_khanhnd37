import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeSection } from "@types";
import { SFHome } from "@sf_pages/homepage";
import {
  getElementComputedStyle,
  snapshotDir,
  verifyCountSelector,
  verifyRedirectUrl,
  waitForImageLoaded,
} from "@utils/theme";
import { loadData } from "@core/conf/conf";

test.describe("Verify section collection list @TS_INS_SF_COLLECTION_LIST", async () => {
  const sectionCollectionList = "[type='collection-list']";
  const collectionHeading = ".collection-list__heading";
  const buttonViewMore = ".collection-list .btn-view-all";
  const collectionCard = ".collection-list .collection-card";
  let shopTheme: ShopTheme;

  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test.beforeAll(async ({ theme }) => {
    await test.step("Create theme by API", async () => {
      const res = await theme.create(3);
      await theme.publish(res.id);
    });

    await test.step("Remove shop theme not active", async () => {
      const res = await theme.list();
      for (let i = 0; i < res.length; i++) {
        if (res[i].active) {
          continue;
        }

        await theme.delete(res[i].id);
      }
    });
  });

  const confBlock = loadData(__dirname, "BLOCK");
  for (let i = 0; i < confBlock.caseConf.length; i++) {
    const dataSetting = confBlock.caseConf[i];
    test(`${dataSetting.description} @${dataSetting.id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confBlock.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeSection>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await navigationPage.gotoHomePage();
      await page.waitForLoadState("networkidle");

      if (dataSetting.expect.screenshot_setting_data) {
        await test.step("Verify block collection list setting", async () => {
          await page.locator(sectionCollectionList).scrollIntoViewIfNeeded();
          await waitForImageLoaded(page, sectionCollectionList);
          await snapshotFixture.verify({
            page: page,
            selector: sectionCollectionList,
            snapshotName: dataSetting.expect.screenshot_setting_data,
          });
        });
      }

      if (dataSetting.expect.list) {
        const {
          title,
          heading,
          label_button: labelButton,
          product_count: productCount,
          product_per_row: productPerRow,
        } = dataSetting.expect.list;

        await test.step("Verify block collection list setting", async () => {
          // Verify heading
          expect(await page.locator(collectionHeading).textContent()).toEqual(heading);
          // Verify button load more text
          expect(await page.locator(buttonViewMore).textContent()).toEqual(labelButton);
          // Verify button load alignment
          expect(await getElementComputedStyle(page, buttonViewMore, "right")).not.toEqual("auto");
          // Verify collections count
          await verifyCountSelector(page, collectionCard, productCount);

          const collectionCardTitles = [];
          const collectionCardAlignments = [];
          const collectionCardRects: Array<Array<{ y: number }>> = [];
          let row = 0;
          for (let i = 1; i <= productCount; ++i) {
            const cardSelector = `${collectionCard}:nth-child(${i})`;
            collectionCardTitles.push(await page.locator(cardSelector).textContent());
            collectionCardAlignments.push(
              await getElementComputedStyle(page, `${cardSelector} .collection--name`, "left"),
            );
            if (!collectionCardRects[row]) {
              collectionCardRects[row] = [];
            }

            collectionCardRects[row].push(await page.locator(cardSelector).boundingBox());
            if (i === productPerRow) {
              row++;
            }
          }
          // Verify all collection card title
          expect(collectionCardTitles.every(cardTitle => cardTitle === title)).toBeTruthy();
          // Verify product per row
          expect(
            collectionCardRects.every(cardRects => cardRects.every(itemRect => itemRect.y === cardRects[0].y)),
          ).toBeTruthy();
          // Verify text inside collection card alignment
          expect(collectionCardAlignments.every(cardAlignment => cardAlignment !== "auto")).toBeTruthy();
        });
      }

      const { button } = dataSetting.expect;

      if (button) {
        await test.step("Verify click button View more collection list", async () => {
          await verifyRedirectUrl({
            page: page,
            selector: `.collection-list a>>text=${button.name_button}`,
            redirectUrl: button.link_button,
            waitForElement: ".collection__heading",
          });
          await page.goBack();
        });
      }

      if (dataSetting.expect.collection) {
        await test.step("Verify click collection list", async () => {
          for (const block of dataSetting.expect.collection) {
            await verifyRedirectUrl({
              page: page,
              selector: `.collection-card>>text=${block.name_collection}`,
              redirectUrl: block.link_collection,
              waitForElement: ".collection-detail",
            });
            await page.goBack();
          }
        });
      }
    });
  }

  const confSettingData = loadData(__dirname, "SETTING_DATA");
  for (let i = 0; i < confSettingData.caseConf.length; i++) {
    const dataSetting = confSettingData.caseConf[i];

    test(`${dataSetting.description} @${dataSetting.id}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confSettingData.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeSection>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await navigationPage.gotoHomePage();
      await page.waitForLoadState("networkidle");

      await test.step("Verify collection list with section + block setting", async () => {
        await page.locator(sectionCollectionList).scrollIntoViewIfNeeded();
        await waitForImageLoaded(page, sectionCollectionList);
        await snapshotFixture.verify({
          page: page,
          selector: sectionCollectionList,
          snapshotName: dataSetting.expect.screenshot_setting_data,
        });
      });
    });
  }

  const confSection = loadData(__dirname, "SECTION");
  for (let i = 0; i < confSection.caseConf.length; i++) {
    const dataSetting = confSection.caseConf[i];

    test(`${dataSetting.description} @${dataSetting.id}`, async ({ page, theme }) => {
      const navigationPage = new SFHome(page, confSection.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateThemeSettings({
          updateSections: dataSetting.data as unknown as Record<string, ThemeSection[]>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await navigationPage.gotoHomePage();
      await page.waitForLoadState("networkidle");
      await test.step("Verify setting section collection list on SF", async () => {
        for (const section of dataSetting.expect.index_section) {
          await expect(await page.locator(`.index-sections section >> nth=${section.index}`)).toHaveAttribute(
            "type",
            section.type_section,
          );
        }
      });
    });
  }
});
