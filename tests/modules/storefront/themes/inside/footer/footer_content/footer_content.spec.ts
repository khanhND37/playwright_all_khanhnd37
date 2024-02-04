import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeFixed } from "@types";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { SFHome } from "@sf_pages/homepage";
import { loadData } from "@core/conf/conf";

test.describe("Verify footer content section @TS_INS_SF_FOOTER_CONTENT", async () => {
  const sectionFooterContent = "[type='footer-content']";
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
      const shopThemeId = res.find(shopTheme => shopTheme.active !== true);
      if (shopThemeId) {
        await theme.delete(shopThemeId.id);
      }
    });
  });

  test("@SB_OLS_THE_INS_SF_FOOTER_SECTION_10 Check show Footer content on SF with data default", async ({
    page,
    conf,
    pageMobile,
    theme,
    snapshotFixture,
  }) => {
    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }

    const listPage = conf.caseConf.expect.list_page;
    await test.step("Verify section footer content setting default on desktop", async () => {
      if (listPage) {
        for (const namePage of listPage) {
          let typePage;
          if (namePage.page == "mobile") {
            typePage = pageMobile;
          } else typePage = page;

          const navigationPage = new SFHome(typePage, conf.suiteConf.domain);
          await navigationPage.gotoHomePage();
          await typePage.waitForResponse(/theme.css/);
          await typePage.locator(sectionFooterContent).scrollIntoViewIfNeeded();
          const footerContent = await typePage.waitForSelector(sectionFooterContent);
          await footerContent.waitForElementState("stable");
          await snapshotFixture.verifyWithAutoRetry({
            page: typePage,
            selector: sectionFooterContent,
            snapshotName: namePage.screenshot_setting_data,
          });
        }
      }
    });
  });

  const confStoreInfo = loadData(__dirname, "STORE_INFO");
  for (let i = 0; i < confStoreInfo.caseConf.length; i++) {
    const dataSetting = confStoreInfo.caseConf[i];

    test(`@${dataSetting.id} ${dataSetting.description}`, async ({
      page,
      pageMobile,
      context,
      theme,
      snapshotFixture,
    }) => {
      const navigationPage = new SFHome(page, confStoreInfo.suiteConf.domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeFixed>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      const { desktop } = dataSetting.expect;

      if (desktop) {
        await test.step("Verify section Footer menu on web", async () => {
          await navigationPage.gotoHomePage();
          await navigationPage.page.reload();
          await navigationPage.page.waitForResponse(/theme.css/);
          await page
            .locator(sectionFooterContent)
            .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
          const footerContent = await page.waitForSelector(sectionFooterContent);
          await footerContent.waitForElementState("stable");
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: sectionFooterContent,
            snapshotName: desktop.screenshot_setting_data,
          });
        });

        if (desktop.link_text_url) {
          await test.step("Verify click link text", async () => {
            await verifyRedirectUrl({
              page: page,
              selector: `css=.footer__content a>>text=${desktop.link_text_url.text}`,
              redirectUrl: desktop.link_text_url.url,
            });
          });

          await test.step("Go back previous page", async () => {
            await page.goBack();
          });

          await page.locator(sectionFooterContent).scrollIntoViewIfNeeded();

          await test.step("Verify click on other text (not text link)", async () => {
            await verifyRedirectUrl({
              page: page,
              selector: "[type= 'footer-content'] strong",
              redirectUrl: confStoreInfo.suiteConf.domain,
            });
          });
        }

        let icon;
        if (desktop.link_icon_social_media) {
          await test.step("Verify click icon social media", async () => {
            for (icon of desktop.link_icon_social_media) {
              await verifyRedirectUrl({
                page: page,
                selector: `[title = ${icon.name_icon}]`,
                context: context,
                redirectUrl: icon.link_icon,
              });
            }
          });
        }
      }

      const navigationMobilePage = new SFHome(pageMobile, confStoreInfo.suiteConf.domain);
      const { mobile } = dataSetting.expect;
      if (mobile) {
        await navigationMobilePage.gotoHomePage();
        await navigationPage.page.reload();
        await navigationPage.page.waitForResponse(/theme.css/);
        await test.step("Verify block store information setting", async () => {
          await pageMobile
            .locator(sectionFooterContent)
            .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
          const footerContent = await pageMobile.waitForSelector(sectionFooterContent);
          await footerContent.waitForElementState("stable");
          await snapshotFixture.verifyWithAutoRetry({
            page: pageMobile,
            selector: sectionFooterContent,
            snapshotName: mobile.close_collapse_section.screenshot_setting_data,
          });
        });

        await test.step("Verify click title block Store information", async () => {
          const title = "[type='footer-content'] .site-footer__header >> nth=0";
          await pageMobile.locator(title).click();
          await pageMobile
            .locator(sectionFooterContent)
            .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
          const footerContent = await pageMobile.waitForSelector(sectionFooterContent);
          await footerContent.waitForElementState("stable");
          await snapshotFixture.verifyWithAutoRetry({
            page: pageMobile,
            selector: sectionFooterContent,
            snapshotName: mobile.open_collapse_section.screenshot_setting_data,
          });
          await pageMobile.locator(title).click();
          await pageMobile
            .locator(sectionFooterContent)
            .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
          await footerContent.waitForElementState("stable");
          await snapshotFixture.verifyWithAutoRetry({
            page: pageMobile,
            selector: sectionFooterContent,
            snapshotName: mobile.close_collapse_section.screenshot_setting_data,
          });
        });
      }
    });
  }

  const confNewsletter = loadData(__dirname, "NEWSLETTER");
  for (let i = 0; i < confNewsletter.caseConf.length; i++) {
    const dataSetting = confNewsletter.caseConf[i];

    test(`@${dataSetting.id} ${dataSetting.description}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confNewsletter.suiteConf.domain);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeFixed>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await test.step("Verify block Newsletter setting", async () => {
        await navigationPage.gotoHomePage();
        await navigationPage.page.reload();
        await navigationPage.page.waitForResponse(/theme.css/);
        await page
          .locator(sectionFooterContent)
          .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
        const footerContent = await page.waitForSelector(sectionFooterContent);
        await footerContent.waitForElementState("stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: sectionFooterContent,
          snapshotName: dataSetting.expect.screenshot_setting_data,
        });
      });

      if (dataSetting.expect.link_text_url) {
        await test.step("Verify click link text", async () => {
          await verifyRedirectUrl({
            page: page,
            selector: "[for = 'newsletter'] a",
            redirectUrl: dataSetting.expect.link_text_url.url,
          });
        });

        await test.step("Click button back", async () => {
          await page.goBack();
        });

        await page.locator(sectionFooterContent).scrollIntoViewIfNeeded();

        await test.step("Verify click on other text (not text link)", async () => {
          await verifyRedirectUrl({
            page: page,
            selector: "[for = 'newsletter'] strong",
            redirectUrl: confNewsletter.suiteConf.domain,
          });
        });
      }

      const signUp = dataSetting.expect.sign_up;
      if (signUp) {
        await test.step("Sign up newsletter", async () => {
          await page.fill("#newsletter", signUp.sign_up_fail.data);
          await page.locator(".footer-section__newsletter button").click();
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: sectionFooterContent,
            snapshotName: signUp.sign_up_fail.screenshot,
          });

          await page.fill("#newsletter", signUp.sign_up_success.data);
          await page.locator(".footer-section__newsletter button").click();
          await page.waitForSelector(".footer-section__newsletter .msg-success");
          await snapshotFixture.verifyWithAutoRetry({
            page: page,
            selector: sectionFooterContent,
            snapshotName: signUp.sign_up_success.screenshot,
          });
        });
      }
    });
  }

  const confMenu = loadData(__dirname, "MENU");
  for (let i = 0; i < confMenu.caseConf.length; i++) {
    const dataSetting = confMenu.caseConf[i];

    test(`@${dataSetting.id} ${dataSetting.description}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confMenu.suiteConf.domain);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeFixed>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await test.step("Verify block Menu setting", async () => {
        await navigationPage.gotoHomePage();
        await navigationPage.page.reload();
        await navigationPage.page.waitForResponse(/theme.css/);
        await page
          .locator(sectionFooterContent)
          .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
        const footerContent = await page.waitForSelector(sectionFooterContent);
        await footerContent.waitForElementState("stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: sectionFooterContent,
          snapshotName: dataSetting.expect.screenshot_setting_data,
        });
      });
    });
  }

  const confText = loadData(__dirname, "TEXT");
  for (let i = 0; i < confText.caseConf.length; i++) {
    const dataSetting = confText.caseConf[i];

    test(`@${dataSetting.id} ${dataSetting.description} `, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confText.suiteConf.domain);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeFixed>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await test.step("Verify block Text setting", async () => {
        await navigationPage.gotoHomePage();
        await navigationPage.page.reload();
        await navigationPage.page.waitForResponse(/theme.css/);
        await page
          .locator(sectionFooterContent)
          .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
        const footerContent = await page.waitForSelector(sectionFooterContent);
        await footerContent.waitForElementState("stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: sectionFooterContent,
          snapshotName: dataSetting.expect.screenshot_setting_data,
        });
      });

      if (dataSetting.expect.link_text_url) {
        await test.step("Verify click link text", async () => {
          await verifyRedirectUrl({
            page: page,
            selector: ".footer__content a >> nth=0",
            redirectUrl: dataSetting.expect.link_text_url.url,
          });
        });

        await test.step("Click button back", async () => {
          await page.goBack();
        });

        await page.locator(sectionFooterContent).scrollIntoViewIfNeeded();

        await test.step("Verify click on other text (not text link)", async () => {
          await verifyRedirectUrl({
            page: page,
            selector: ".footer__content strong >> nth=0",
            redirectUrl: confText.suiteConf.domain,
          });
        });
      }
    });
  }

  const confPage = loadData(__dirname, "PAGE");
  for (let i = 0; i < confPage.caseConf.length; i++) {
    const dataSetting = confPage.caseConf[i];

    test(`@${dataSetting.id} ${dataSetting.description}`, async ({ page, theme, snapshotFixture }) => {
      const navigationPage = new SFHome(page, confPage.suiteConf.domain);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.updateSection({
          updateSection: dataSetting.data as unknown as Record<string, ThemeFixed>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await test.step("Verify block Page setting", async () => {
        await navigationPage.gotoHomePage();
        await navigationPage.page.reload();
        await navigationPage.page.waitForResponse(/theme.css/);
        await page
          .locator(sectionFooterContent)
          .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
        const footerContent = await page.waitForSelector(sectionFooterContent);
        await footerContent.waitForElementState("stable");
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: sectionFooterContent,
          snapshotName: dataSetting.expect.screenshot_setting_data,
        });
      });
    });
  }
});
