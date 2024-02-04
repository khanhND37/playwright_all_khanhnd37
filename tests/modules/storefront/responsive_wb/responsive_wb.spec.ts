import { test } from "@fixtures/theme";
import { SFHome } from "@sf_pages/homepage";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir } from "@utils/theme";
import { expect } from "@playwright/test";

test.describe(`Responsive webbuilder`, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test(`@SB_OLS_THE_TCD_SFRPV_02 Check UI của page trên thiết bị large tablet`, async ({
    conf,
    pageMobile,
    snapshotFixture,
  }) => {
    const SFPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const blocks = new Blocks(pageMobile, conf.suiteConf.domain);

    for (const caseData of conf.caseConf.data) {
      await test.step(`Go to ${caseData.page}`, async () => {
        await SFPage.goto(caseData.url);
        await pageMobile.waitForLoadState("domcontentloaded");
      });

      await test.step("Snapshot section on page to verify", async () => {
        const selectorList: string[] = [];
        const count = await pageMobile.locator(blocks.sectionSF).count();
        for (let i = 0; i < count; i++) {
          selectorList.push(`${blocks.sectionSF}[${i + 1}]`);
        }

        for (const locator of selectorList) {
          const element = await pageMobile.waitForSelector(locator);
          await pageMobile.locator(locator).scrollIntoViewIfNeeded();
          await pageMobile.waitForLoadState("networkidle");
          await element.waitForElementState("stable");
          await snapshotFixture.verifyWithAutoRetry({
            page: pageMobile,
            selector: locator,
            snapshotName: `${caseData.page}_section_${selectorList.indexOf(locator)}.png`,
          });
        }
      });
    }
  });

  test(`@SB_OLS_THE_TCD_SFRPV_03 Check UI của page trên thiết bị small tablet`, async ({
    conf,
    pageMobile,
    snapshotFixture,
  }) => {
    const SFPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const blocks = new Blocks(pageMobile, conf.suiteConf.domain);

    for (const caseData of conf.caseConf.data) {
      await test.step(`Go to ${caseData.page}`, async () => {
        await SFPage.goto(caseData.url);
        await pageMobile.waitForLoadState("domcontentloaded");
      });

      await test.step("Snapshot section on page to verify", async () => {
        const selectorList: string[] = [];
        const count = await pageMobile.locator(blocks.sectionSF).count();
        for (let i = 0; i < count; i++) {
          selectorList.push(`${blocks.sectionSF}[${i + 1}]`);
        }

        for (const locator of selectorList) {
          const element = await pageMobile.waitForSelector(locator);
          await pageMobile.locator(locator).scrollIntoViewIfNeeded();
          await pageMobile.waitForLoadState("networkidle");
          await element.waitForElementState("stable");
          await snapshotFixture.verifyWithAutoRetry({
            page: pageMobile,
            selector: locator,
            snapshotName: `${caseData.page}_section_${selectorList.indexOf(locator)}.png`,
          });
        }
      });
    }
  });

  test(`@SB_OLS_THE_TCD_SFRPV_06 Check action tap vào object (button/ link/ product card) trên large tablet`, async ({
    conf,
    pageMobile,
  }) => {
    const SFPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const blocks = new Blocks(pageMobile, conf.suiteConf.domain);
    const data = conf.caseConf.data;

    await test.step("Go to Homepage", async () => {
      await SFPage.goto("/");
      await pageMobile.waitForLoadState("domcontentloaded");
    });

    await test.step("Click button Shop now on slideshow", async () => {
      await pageMobile.locator(blocks.buttonSlideshow).click();
      await pageMobile.waitForSelector(blocks.titleProduct);
      await pageMobile.waitForLoadState("networkidle");
      expect(pageMobile.url()).toContain(data.slideshow.url);
    });

    await test.step("Click product card", async () => {
      await pageMobile.locator(blocks.productCard).nth(0).click();
      await pageMobile.waitForSelector(blocks.titleProduct);
      await pageMobile.waitForLoadState("networkidle");
      expect(pageMobile.url()).toContain(data.product.url);
    });

    await test.step("Click menu item", async () => {
      await pageMobile.locator(blocks.menuLink).nth(4).click();
      await pageMobile.waitForLoadState("networkidle");
      expect(pageMobile.url()).toContain(data.menu.url);
    });
  });

  test(`@SB_OLS_THE_TCD_SFRPV_07 Check action tap vào object (button/ link/ product card) trên small tablet`, async ({
    conf,
    pageMobile,
  }) => {
    const SFPage = new SFHome(pageMobile, conf.suiteConf.domain);
    const blocks = new Blocks(pageMobile, conf.suiteConf.domain);
    const data = conf.caseConf.data;

    await test.step("Go to Homepage", async () => {
      await SFPage.goto("/");
      await pageMobile.waitForLoadState("domcontentloaded");
    });

    await test.step("Click button Shop now on slideshow", async () => {
      await pageMobile.locator(blocks.buttonSlideshow).click();
      await pageMobile.waitForSelector(blocks.titleProduct);
      await pageMobile.waitForLoadState("networkidle");
      await expect(pageMobile.url()).toContain(data.slideshow.url);
    });

    await test.step("Click product card", async () => {
      await pageMobile.locator(blocks.productCard).nth(0).click();
      await pageMobile.waitForSelector(blocks.titleProduct);
      await pageMobile.waitForLoadState("networkidle");
      await expect(pageMobile.url()).toContain(data.product.url);
    });

    await test.step("Click menu item", async () => {
      await pageMobile.locator(blocks.menuLink).nth(4).click();
      await pageMobile.waitForLoadState("networkidle");
      await expect(pageMobile.url()).toContain(data.menu.url);
    });
  });
});
