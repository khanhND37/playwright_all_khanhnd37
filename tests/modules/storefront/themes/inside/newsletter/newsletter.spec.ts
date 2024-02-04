import { expect } from "@core/fixtures";
import { test } from "@fixtures/theme";
import { loadData } from "@core/conf/conf";
import { SFHome } from "@sf_pages/homepage";
import type { ShopTheme, ThemeSection } from "@types";
import { CustomerAPI } from "@pages/api/dashboard/customer";
import { generateEmail, snapshotDir, verifyCountSelector, waitForImageLoaded } from "@utils/theme";

/*
- Setup shop data:
  + signup account newsletter with email: havu+1@beeketing.net
  + Checkout order with email: havu@beeketing.net
 */

let shopTheme: ShopTheme;

test.describe("Verify Newsletter section in Storefront @TS_INS_SF_NEWSLETTER", () => {
  const sectionSelector = ":nth-match(section.newsletter-section div, 1)";

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
      const shopThemeId = res.find(shopTheme => shopTheme.active !== true);
      if (shopThemeId) {
        await theme.delete(shopThemeId.id);
      }
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const newsletter = conf.caseConf.data[i];

    test(`${newsletter.description} @${newsletter.id}`, async ({ page, theme, snapshotFixture }) => {
      const homePage = new SFHome(page, conf.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        if (newsletter.input) {
          const indexSection = shopTheme.settings_data.pages.home.default.findIndex(
            section => section.type === "newsletter",
          );

          if (indexSection !== -1) {
            shopTheme = await theme.updateSection({
              shopThemeId: shopTheme.id,
              updateSection: newsletter.input as unknown as Record<string, ThemeSection>,
              settingsData: shopTheme.settings_data,
            });
          } else {
            shopTheme = await theme.addSection({
              shopThemeId: shopTheme.id,
              settingsData: shopTheme.settings_data,
              addSection: newsletter.input as unknown as Record<string, ThemeSection>,
            });
          }
        }
      });

      await test.step("Verify show section on SF", async () => {
        await homePage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        await page.locator("[type='footer']").scrollIntoViewIfNeeded();
        await waitForImageLoaded(page, sectionSelector);

        if (typeof newsletter.expect.count_section !== "undefined") {
          await verifyCountSelector(page, `${sectionSelector}`, newsletter.expect.count_section);
        }

        if (newsletter.expect.snapshot) {
          await snapshotFixture.verify({
            page: page,
            selector: `${sectionSelector} >> nth=0`,
            snapshotName: newsletter.expect.snapshot,
          });
        }
      });
    });
  }

  test("Verify multiple section @SB_OLS_THE_INS_SF_NEWSLETTER_7", async ({ conf, theme, page, snapshotFixture }) => {
    const homePage = new SFHome(page, conf.suiteConf.domain);

    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }

    await test.step("Setting theme editor", async () => {
      for (const newsletter of conf.caseConf.data.input) {
        shopTheme = await theme.addSection({
          shopThemeId: shopTheme.id,
          settingsData: shopTheme.settings_data,
          addSection: newsletter as unknown as Record<string, ThemeSection>,
        });
      }
    });

    await test.step("Verify show section on SF", async () => {
      await homePage.gotoHomePage();
      await page.waitForLoadState("networkidle");
      await waitForImageLoaded(page, sectionSelector);
      const countSection = await page.locator(`${sectionSelector}`).count();

      const snapshots = conf.caseConf.data.expect.snapshot.split(",");
      let index = snapshots.length - 1;

      for (let i = countSection; i > countSection - conf.caseConf.data.input; i--) {
        await snapshotFixture.verify({
          page: page,
          selector: `${sectionSelector} >> nth=${i - 1}`,
          snapshotName: snapshots[index--].trim(),
        });
      }
    });
  });

  test("Verify signup email @SB_OLS_THE_INS_SF_NEWSLETTER_9", async ({
    page,
    conf,
    authRequest,
    theme,
    snapshotFixture,
  }) => {
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const customerAPI = new CustomerAPI(conf.suiteConf.domain, authRequest);
    let email;

    await test.step("Setting theme", async () => {
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      const indexSection = shopTheme.settings_data.pages.home.default.findIndex(
        section => section.type === "newsletter",
      );

      if (indexSection !== -1) {
        shopTheme = await theme.updateSection({
          shopThemeId: shopTheme.id,
          updateSection: conf.caseConf.input as unknown as Record<string, ThemeSection>,
          settingsData: shopTheme.settings_data,
        });
      } else {
        shopTheme = await theme.addSection({
          shopThemeId: shopTheme.id,
          settingsData: shopTheme.settings_data,
          addSection: conf.caseConf.input as unknown as Record<string, ThemeSection>,
        });
      }
    });

    for (const newsletter of conf.caseConf.data) {
      if (newsletter.input) {
        email = newsletter.input.email;
      } else {
        email = generateEmail();
      }

      await test.step("Signup email on SF", async () => {
        await homePage.gotoHomePage();
        await page.waitForLoadState("networkidle");
        await waitForImageLoaded(page, sectionSelector);
        await page.locator(`${sectionSelector} input`).first().fill(email);
        await page.locator(`${sectionSelector} button`).first().click();

        if (newsletter.expect.success) {
          await page.waitForSelector(`${sectionSelector} >> nth=0 .msg-success`);
        }
        await snapshotFixture.verify({
          page: page,
          selector: `${sectionSelector} >> nth=0`,
          snapshotName: newsletter.expect.snapshot,
        });
      });

      await test.step("Verify signup success on dashboard", async () => {
        if (typeof newsletter.expect.count_account !== "undefined") {
          const accounts = (await customerAPI.getCustomers({ query: email })) as unknown as Array<object>;
          expect(accounts.length).toEqual(newsletter.expect.count_account);
        }
      });
    }
  });
});
