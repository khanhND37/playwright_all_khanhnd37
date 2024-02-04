import { expect, test } from "@core/fixtures";
import { Page } from "@playwright/test";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";

test.describe("Verify connect domain shop Creator", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test("Verify connect domain shop Creator @SB_OLS_DM_190", async ({ dashboard, conf, context, snapshotFixture }) => {
    let previewSF: Page;
    const domainShopBase = conf.suiteConf.domain;
    const data = conf.caseConf;

    await test.step("Open domain page dashboard", async () => {
      await dashboard.goto(`https://${domainShopBase}/admin/domain`);
      await dashboard.waitForSelector(".nav-sidebar");
      await dashboard.waitForSelector(".page-domain");
    });

    await test.step("Remove all domains", async () => {
      const countConnectDomain = await dashboard
        .locator("//section[descendant::h4[normalize-space()='Domains']]//tr")
        .count();
      if (countConnectDomain) {
        for (let i = 0; i < countConnectDomain - 2; i++) {
          await dashboard.locator("//a[normalize-space()='Remove']").last().click();
          await dashboard.locator(".modal-domain button.is-primary").click();
          await dashboard.waitForSelector(".s-modal", { state: "hidden" });
        }
      }
      const primaryDomain = await dashboard
        .locator("//section[descendant::h4[normalize-space()='Primary domain']]//tbody//td")
        .first()
        .innerText();
      expect(primaryDomain).toEqual(`${domainShopBase}`);
    });

    await test.step("Connect domain", async () => {
      await dashboard.locator("a:has-text('Connect Existing Domain')").hover();
      await dashboard.locator("a:has-text('Connect Existing Domain')").click();
      await dashboard.waitForSelector("text='Connect Existing Domain'");
      await dashboard.locator("#title").fill(data.domain);
      await dashboard.locator("button.btn-next").click();
      await dashboard.locator("button.is-outline").click();
      await dashboard.waitForSelector("button.is-outline.is-loading", { state: "hidden" });
      await dashboard.waitForSelector(".nav-sidebar");
      await dashboard.waitForSelector(".page-domain");
      await dashboard.reload();
      await dashboard.waitForSelector(".nav-sidebar");
      await dashboard.waitForSelector(".page-domain");
      const primaryDomain = await dashboard
        .locator(
          "//section[contains(@class,'domain-type') and descendant::h4[normalize-space()='Primary domain']]//tbody//td",
        )
        .first()
        .innerText();
      expect(primaryDomain).toEqual(`www.${data.domain}`);
    });

    await test.step("Verify preview web builder sale page", async () => {
      await dashboard.goto(`https://${domainShopBase}/admin/builder/page/${data.salePage}`);
      await dashboard.waitForSelector("//div[contains(@class,'overlay')]", { state: "attached" });
      await dashboard.waitForSelector("//div[contains(@class,'overlay')]", { state: "hidden" });
      await dashboard.waitForLoadState("domcontentloaded");
      await dashboard.waitForLoadState("load");
      await dashboard.waitForLoadState("networkidle");
      await snapshotFixture.verify({
        page: dashboard,
        snapshotName: data.snapshot_web_builder,
      });

      previewSF = await verifyRedirectUrl({
        page: dashboard,
        selector: "[id='Icons/Eye']",
        context,
        redirectUrl: data.domain,
      });

      await snapshotFixture.verify({
        page: previewSF,
        snapshotName: data.snapshot_sf,
      });
    });
  });
});
