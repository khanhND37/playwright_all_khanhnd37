import { expect, test } from "@core/fixtures";
import { verifyRedirectUrl } from "@utils/theme";

test.describe("Verify robots.txt", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    const shopDomain = conf.suiteConf.domain;
    await dashboard.goto(`https://${shopDomain}/admin/preferences`);
    await dashboard.waitForLoadState("networkidle");
    await dashboard.waitForSelector(".nav-sidebar");
    await dashboard.waitForSelector(".page-preferences");
  });

  const section = "#edit-robots-txt-section";
  const btnEdit = "#edit-robots-txt-section .s-button";
  const pageEdit = ".page-edit-robots-txt";

  test("Verify redirect when clicking text link Learn more @SB_OLS_PFR_22", async ({ conf, dashboard, context }) => {
    await verifyRedirectUrl({
      page: dashboard,
      selector: "//div[@id='edit-robots-txt-section']//a[contains(text(),'Learn more')]",
      context,
      redirectUrl: conf.caseConf.expect.redirect_url,
    });
  });

  test("Verify robots.txt when clear all data at robots.txt file @SB_OLS_PFR_23", async ({ dashboard }) => {
    await test.step("Click button Edit robot.txt", async () => {
      await dashboard.locator(section).scrollIntoViewIfNeeded();
      await dashboard.locator(btnEdit).click();
      await dashboard.waitForSelector(pageEdit);
    });

    await test.step("Clear all data at robots.txt file ", async () => {
      await dashboard.focus("textarea.s-textarea__inner");
      await dashboard.keyboard.down("Shift");
      await dashboard.keyboard.press("Home");
      await dashboard.keyboard.up("Shift");
      await dashboard.keyboard.press("Backspace");

      await dashboard.locator("button", { hasText: "Save" }).click();
      await expect(dashboard.locator("s-toast is-danger is-bottom")).toBeHidden();
    });
  });

  test("Verify robots.txt when input invalid data into robots.txt file @SB_OLS_PFR_26", async ({ dashboard, conf }) => {
    const inputText = conf.caseConf.input_text;
    await test.step("Click button Edit robot.txt", async () => {
      await dashboard.locator(section).scrollIntoViewIfNeeded();
      await dashboard.locator(btnEdit).click();
      await dashboard.waitForSelector(pageEdit);
    });

    await test.step("Input invalid data ", async () => {
      await dashboard.focus("textarea.s-textarea__inner");
      await dashboard.keyboard.press("Control+A");
      await dashboard.keyboard.type(inputText);
      await dashboard.locator("button", { hasText: "Save" }).click();
      await dashboard.locator(".s-toast.is-danger").waitFor();
      await expect(dashboard.locator(".s-toast.is-danger")).toBeHidden();
    });

    await test.step("Click button Cancel ", async () => {
      await dashboard.locator("button", { hasText: "Cancel" }).click();
      await expect(dashboard.locator("textarea.s-textarea__inner")).not.toContainText(inputText);
    });
  });

  test("Verify robots.txt when input valid data into robots.txt file @SB_OLS_PFR_24", async ({
    dashboard,
    conf,
    context,
  }) => {
    const shopDomain = conf.suiteConf.domain;
    const inputText = conf.caseConf.input_text;
    const message = "//*[contains(text(), 'Upload robots.txt success')]";
    await test.step("Click button Edit robot.txt", async () => {
      await dashboard.locator(section).scrollIntoViewIfNeeded();
      await dashboard.locator(btnEdit).click();
      await dashboard.waitForSelector(pageEdit);
    });
    await test.step("Input valid data ", async () => {
      await dashboard.focus("textarea.s-textarea__inner");
      await dashboard.keyboard.type(inputText, { delay: 100 });
      await dashboard.locator("button", { hasText: "Save" }).click();
      await expect(dashboard.locator(message)).toBeVisible();
      await expect(dashboard.locator(message)).toBeHidden();
    });

    await test.step("Open page robots.txt on SF", async () => {
      const newTab = await context.newPage();
      await newTab.goto(`https://${shopDomain}/robots.txt`);
      const contentFile = newTab.locator("body");
      await expect
        .poll(
          async () => {
            const robotsTxt = await contentFile.innerText();
            if (!robotsTxt.includes(inputText)) {
              await newTab.reload();
              return false;
            } else {
              await expect(contentFile).toContainText(inputText);
              return true;
            }
          },
          { timeout: 30000, intervals: [3_000] },
        )
        .toBeTruthy();
      await newTab.close();
    });

    await test.step("Reset to ShopBase's default ", async () => {
      await dashboard.locator("button", { hasText: "Reset to ShopBase's default" }).click({ delay: 500 });
      await dashboard.locator("button", { hasText: "Save" }).click({ delay: 500 });
      await expect(dashboard.locator(message)).toBeVisible();
      await expect(dashboard.locator(message)).toBeHidden();
    });

    await test.step("Open page robots.txt on SF", async () => {
      const newTab = await context.newPage();
      await newTab.goto(`https://${shopDomain}/robots.txt`);
      const contentFile = newTab.locator("body");
      await expect
        .poll(
          async () => {
            const robotsTxt = await contentFile.innerText();
            if (robotsTxt.includes(inputText)) {
              await newTab.reload();
              return false;
            } else {
              await expect(contentFile).not.toContainText(inputText);
              return true;
            }
          },
          { timeout: 30000, intervals: [3_000] },
        )
        .toBeTruthy();
    });
  });

  test("Verify when click button Test with Google on edit robots.txt screen @SB_OLS_PFR_99", async ({
    dashboard,
    conf,
    context,
  }) => {
    await test.step("Click button Edit robot.txt", async () => {
      await dashboard.locator(section).scrollIntoViewIfNeeded();
      await dashboard.locator(btnEdit).click();
      await dashboard.waitForSelector(pageEdit);
    });

    await test.step("Click button Test with Google", async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: ".page-edit-robots-txt__test-with-google-tester-btn",
        context: context,
        redirectUrl: conf.caseConf.expect_url,
      });
    });
  });
});
