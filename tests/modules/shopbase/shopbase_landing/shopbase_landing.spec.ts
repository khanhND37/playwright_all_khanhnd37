import { test } from "@core/fixtures";
import { expect } from "@playwright/test";
import { snapshotDir } from "@utils/theme";
import { ShopBaseLanding } from "./shopbase_landing";
test.describe("Verify page ShopBase Landing", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test(`@SB_SBL_01 Verify UI của Shopbase Landing`, async ({ page, conf, snapshotFixture }) => {
    const data = conf.caseConf.data;
    const expected = conf.caseConf.expect;
    const shopBase = new ShopBaseLanding();

    await test.step(`Truy cập domain shopbase.com`, async () => {
      await page.goto(`https://${conf.suiteConf.domain_shopbase}`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator(shopBase.homeTitle)).toBeVisible();

      for (const dataSnapshot of data.selector_snapshot) {
        await page.locator(dataSnapshot.selector).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: dataSnapshot.selector,
          snapshotName: dataSnapshot.snapshot,
        });
      }
    });

    await test.step(`Ở Header, click vào Login`, async () => {
      await page.locator(shopBase.btnLoginSB).nth(1).click();
      await expect(page.getByText("Sign in").nth(2)).toBeVisible();
      await expect(page.url()).toContain(expected.url_login);
      await page.goBack();
      await expect(page.locator(shopBase.homeTitle)).toBeVisible();
    });

    await test.step(`Enter your mail -> click button Join us`, async () => {
      await page.getByPlaceholder("Enter Your Email").fill(data.email);
      await page.getByRole("button", { name: "Join us", exact: true }).click();
      await expect(page.getByText(data.text)).toBeVisible();

      await expect(page.url()).toContain(expected.url_signup_email);
      await page.goBack();
      await expect(page.locator(shopBase.homeTitle)).toBeVisible();
    });

    await test.step(`Ở Header, click vào Start 14-Day free trial`, async () => {
      await page.locator(shopBase.btnFreeTrialSB).last().click();
      await expect(page.getByText(data.text)).toBeVisible();
      await expect(page.url()).toContain(expected.url_signup);
      await page.goBack();
      await expect(page.locator(shopBase.homeTitle)).toBeVisible();
    });

    await test.step(`Ở section Feature, click vào Get started for free`, async () => {
      await page.getByText("Full cycle support for every E-commerce businesses").scrollIntoViewIfNeeded();
      await page.locator(shopBase.btnGetForFreeSB).click();
      await expect(page.getByText(data.text)).toBeVisible();

      await expect(page.url()).toContain(expected.url_signup);
      await page.goBack();
      await expect(page.locator(shopBase.homeTitle)).toBeVisible();
    });

    await test.step(`Ở section Always here, whenever & wherever you need, click vào Start 14-Day free trial`, async () => {
      await page.getByText("Always here, whenever & wherever you need").scrollIntoViewIfNeeded();
      await page.locator(shopBase.btn14DayFreeTrialSB).click();
      await expect(page.getByText(data.text)).toBeVisible();

      await expect(page.url()).toContain(expected.url_signup);
      await page.goBack();
      await expect(page.locator(shopBase.homeTitle)).toBeVisible();
    });

    await test.step(`Ở Footer, click vào Get started for free`, async () => {
      await page
        .getByText("Kickstart your path to success today and grow your business at scale with ShopBase")
        .scrollIntoViewIfNeeded();
      await page.locator(shopBase.btnFooter).click();
      await expect(page.getByText(data.text)).toBeVisible();

      await expect(page.url()).toContain(expected.url_signup);
      await page.goBack();
      await expect(page.locator(shopBase.homeTitle)).toBeVisible();
    });
  });

  test(`@SB_SBL_05 Verify UI của Plusbase Landing`, async ({ page, conf, snapshotFixture, context }) => {
    const data = conf.caseConf.data;
    const expected = conf.caseConf.expect;
    let newPage;
    const plusBase = new ShopBaseLanding();

    await test.step(`Truy cập domain plusbase.com`, async () => {
      await page.goto(`https://${conf.suiteConf.domain_plusbase}`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByText("Run A Profitable Dropshipping, Print-on-demand Business Without")).toBeVisible();

      for (const dataSnapshot of data.selector_snapshot) {
        await page.locator(dataSnapshot.selector).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: dataSnapshot.selector,
          snapshotName: dataSnapshot.snapshot,
        });
      }
    });

    await test.step(`Ở Header, click vào Login`, async () => {
      [newPage] = await Promise.all([context.waitForEvent("page"), await page.locator(plusBase.btnLoginPLB).click()]);

      await expect(newPage.getByText("Sign in").nth(2)).toBeVisible();
      await expect(newPage.url()).toContain(expected.url_login);
      await newPage.close();
    });

    await test.step(`Ở Header, click vào Start free trial`, async () => {
      [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await page.locator(plusBase.btnFreeTrialPLB).first().click(),
      ]);

      await expect(newPage.getByText(data.text)).toBeVisible();
      await expect(newPage.url()).toContain(expected.url_signup);
      await newPage.close();
    });

    await test.step(`Enter your mail -> click button Start free trial`, async () => {
      await page.getByPlaceholder("Enter your email").first().fill(data.email);
      await page.getByRole("button", { name: "Start 14-Day Free Trial", exact: true }).first().click();
      await expect(page.getByText(data.text)).toBeVisible();
      await expect(page.url()).toContain(expected.url_signup_email);
    });
  });

  test(`@SB_SBL_08 Verify UI của PrintBase Landing`, async ({ page, conf, snapshotFixture, context }) => {
    const data = conf.caseConf.data;
    const expected = conf.caseConf.expect;
    const printBase = new ShopBaseLanding();
    let newPage;

    await test.step(`Truy cập domain printbase.com`, async () => {
      await page.goto(`https://${conf.suiteConf.domain_printbase}`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByText("Run A Profitable Print-on-Demand Business With Minimal Effort")).toBeVisible();

      for (const dataSnapshot of data.selector_snapshot) {
        await page.locator(dataSnapshot.selector).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithAutoRetry({
          page: page,
          selector: dataSnapshot.selector,
          snapshotName: dataSnapshot.snapshot,
        });
      }
    });

    await test.step(`Ở Header, click vào Login`, async () => {
      [newPage] = await Promise.all([context.waitForEvent("page"), await page.locator(printBase.btnLoginPLB).click()]);

      await expect(newPage.getByText("Sign in").nth(2)).toBeVisible();
      await expect(newPage.url()).toContain(expected.url_login);
      await newPage.close();
    });

    await test.step(`Ở Header, click vào Start free trial`, async () => {
      [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await page.locator(printBase.btnStartFreeTrialPB).click(),
      ]);

      await expect(newPage.getByText(data.text)).toBeVisible();
      await expect(newPage.url()).toContain(expected.url_signup);
      await newPage.close();
    });

    await test.step(`Enter your mail -> click button Start free trial`, async () => {
      await page.getByPlaceholder("Enter your email").first().fill(data.email);
      await page.getByRole("button", { name: "Start Free Trial", exact: true }).first().click();
      await expect(page.getByText(data.text)).toBeVisible();
      await expect(page.url()).toContain(expected.url_signup_email);
    });
  });
});
