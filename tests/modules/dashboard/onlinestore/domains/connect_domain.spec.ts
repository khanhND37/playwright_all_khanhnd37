import { expect, test } from "@core/fixtures";
import { OnlineStoreDomainPage } from "@pages/dashboard/online_store_domains";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";

test.describe("Verify domain", () => {
  let domainsPage: OnlineStoreDomainPage, themesPage: ThemeDashboard;

  test.beforeEach(async ({ dashboard, conf }) => {
    domainsPage = new OnlineStoreDomainPage(dashboard, conf.suiteConf.domain);
    themesPage = new ThemeDashboard(dashboard, conf.suiteConf.domain);

    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/domain`);
    await domainsPage.page.waitForSelector(domainsPage.sidebarSelector);
    await domainsPage.page.waitForSelector(domainsPage.pageDomainSelector);
  });

  test("Remove all domains @SB_OLS_DM_189", async ({ conf }) => {
    const countDomainsBefore = await domainsPage.page
      .locator(domainsPage.xpathListDomains(conf.caseConf.title))
      .count();

    if (countDomainsBefore) {
      await test.step("Remove domains", async () => {
        for (let i = 0; i < countDomainsBefore - 1; i++) {
          // không xoá được domain onshopbase
          await domainsPage.page.locator(domainsPage.xpathRemoveDomain).last().click();
          await domainsPage.page.locator(domainsPage.xpathModalPrimaryBtn).click();
          await domainsPage.page.waitForSelector(domainsPage.xpathModal, { state: "hidden" });
        }

        const countDomainAfter = await domainsPage.page
          .locator(domainsPage.xpathListDomains(conf.caseConf.title))
          .count();
        expect(countDomainAfter).toEqual(0);
      });
    }
  });

  test("Verify connect domain @SB_OLS_DM_187", async ({ conf, context }) => {
    test.slow();
    await test.step("Pre-condition: Remove existing domain", async () => {
      const countDomains = await domainsPage.page.locator(domainsPage.xpathListDomains(conf.caseConf.title)).count();

      if (countDomains > 1) {
        await test.step("Remove domains", async () => {
          for (let i = 0; i < countDomains - 1; i++) {
            // không xoá được domain onshopbase
            await domainsPage.page.locator(domainsPage.xpathRemoveDomain).last().click();
            await domainsPage.page.locator(domainsPage.xpathModalPrimaryBtn).click();
            await domainsPage.page.waitForSelector(domainsPage.xpathModal, { state: "hidden" });
          }
        });
      }
    });
    await test.step("Click button Connect domain", async () => {
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomain).hover();
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomain).click();
      await domainsPage.page.waitForSelector(domainsPage.connectDomainPage);
    });

    await test.step("Nhập Domain chứa đuôi các đuôi .TK, .ML, .GA, .CF, .GQ", async () => {
      const data = conf.caseConf.domain_GQ;
      await domainsPage.page.locator(domainsPage.xpathInputDomain).fill(data.domain);
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainNextBtn).click();
      await expect(domainsPage.page.locator(domainsPage.alertSelector)).toHaveText(data.alert);
      await domainsPage.page.click(domainsPage.closeIcon);
    });

    await test.step("Connect domain có chứa shopbase", async () => {
      const data = conf.caseConf.domain_shopbase;
      await domainsPage.page.locator(domainsPage.xpathInputDomain).fill(data.domain);
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainNextBtn).click();
      await expect(domainsPage.page.locator(domainsPage.errorSelector)).toHaveText(data.error);
    });

    await test.step("Connect domain có chứa printbase", async () => {
      const data = conf.caseConf.domain_printbase;
      await domainsPage.page.locator(domainsPage.xpathInputDomain).fill(data.domain);
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainNextBtn).click();
      await expect(domainsPage.page.locator(domainsPage.errorSelector)).toHaveText(data.error);
    });

    await test.step("Connect domain có chứa plusbase", async () => {
      const data = conf.caseConf.domain_plusbase;
      await domainsPage.page.locator(domainsPage.xpathInputDomain).fill(data.domain);
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainNextBtn).click();
      await expect(domainsPage.page.locator(domainsPage.errorSelector)).toHaveText(data.error);
    });

    await test.step("Connect domain không tồn tại", async () => {
      const data = conf.caseConf.domain_not_exist;
      await domainsPage.page.locator(domainsPage.xpathInputDomain).fill(data.domain);
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainNextBtn).click();
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainVerifyBtn).click();
      await domainsPage.page.waitForSelector(domainsPage.outlineBtnIsLoading, { state: "hidden" });

      await expect(domainsPage.page.locator(domainsPage.alertSelector)).toHaveText(data.alert);
      await domainsPage.page.click(domainsPage.closeIcon);
    });

    await test.step("Connect domain thành công", async () => {
      const data = conf.caseConf.connect_success;
      await domainsPage.page.locator(domainsPage.xpathInputDomain).fill(data.domain);
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainNextBtn).click();
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainVerifyBtn).click();
      await domainsPage.page.waitForSelector(domainsPage.outlineBtnIsLoading, { state: "hidden" });
      await expect(domainsPage.page.locator(domainsPage.successMsgSelector)).toHaveText(data.success);
      await expect(domainsPage.page.locator(domainsPage.pageDomainSelector)).toBeVisible();
    });

    await test.step("Click button Connect domain", async () => {
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomain).hover();
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomain).click();
      await domainsPage.page.waitForSelector(domainsPage.connectDomainPage);
    });

    await test.step("Connect domain đã được connect rồi", async () => {
      const data = conf.caseConf.domain_already;
      await domainsPage.page.locator(domainsPage.xpathInputDomain).fill(data.domain);
      await domainsPage.page.locator(domainsPage.xpathConnectExistingDomainNextBtn).click();
      await expect(domainsPage.page.locator(domainsPage.alertSelector)).toHaveText(data.alert);
    });

    await test.step("Verify primary domain", async () => {
      let index = 0;
      const data = conf.caseConf.connect_success;

      await domainsPage.page.locator(domainsPage.xpathMenuDomains).click();
      await domainsPage.page.waitForSelector(domainsPage.pageDomainSelector);
      let primaryDomain = await domainsPage.getPrimaryDomain();

      while (index < 3 && primaryDomain !== data.domain) {
        await domainsPage.waitAbit(20000); // Chờ gen SSL
        await domainsPage.page.reload();
        await domainsPage.page.waitForSelector(domainsPage.pageDomainSelector);
        primaryDomain = await domainsPage.getPrimaryDomain();
        index++;
      }
      expect(primaryDomain).toEqual(data.domain);
    });

    await test.step("Verify preview on theme editor", async () => {
      const webbuilder = new WebBuilder(themesPage.page, conf.suiteConf.domain);
      await themesPage.goToCustomizeThemeV3();
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        webbuilder.clickBtnNavigationBar("preview"),
      ]);
      await expect(previewTab).toHaveURL(new RegExp(conf.caseConf.connect_success.domain));
    });
  });

  test("Verify change and redirect domain @SB_OLS_DM_188", async ({ conf, page }) => {
    const shopBaseDomain = conf.suiteConf.domain,
      data = conf.caseConf.data;

    await test.step("Pre-condition: connect domain và Enable redirect domain", async () => {
      const countDomain = await domainsPage.page.locator(domainsPage.xpathListDomains(conf.caseConf.title)).count();
      if (countDomain < 2) {
        await domainsPage.connectDomain(data.connect_domain);
      }
      await domainsPage.changeRedirectDomain(true);
    });

    await test.step("Change primary domain", async () => {
      const currentPrimaryDomain = await domainsPage.getPrimaryDomain();
      if (currentPrimaryDomain !== data.connect_domain) {
        await domainsPage.page.locator(domainsPage.xpathChangePrimaryDomain).click();
        await domainsPage.changePrimaryDomain(data.connect_domain);
        await expect(domainsPage.page.locator(domainsPage.alertSelector)).toHaveText(data.change_domain_alert);

        const primaryDomainAfter = await domainsPage.getPrimaryDomain();
        expect(primaryDomainAfter).toEqual(data.connect_domain);
      }
    });

    await test.step("Mở tab browser mới: mở SF của shop với shop domain: https://{domain}", async () => {
      let index = 0;
      await page.goto(`https://${shopBaseDomain}`);
      await page.waitForLoadState("networkidle");
      let url = page.url();

      while (index < 3 && !url.includes(data.connect_domain)) {
        await page.reload();
        await page.waitForLoadState("networkidle");
        url = page.url();
        index++;
      }
      expect(url).toContain(data.connect_domain);
    });

    await test.step("Disable redirect domain", async () => {
      await domainsPage.changeRedirectDomain(false);
      await expect(domainsPage.page.locator(domainsPage.redirectSuccessMsgSelector)).toHaveText(
        data.redirect_domain_alert,
      );
    });

    await test.step("Tại tab SF, mở home page bằng domain shopbase", async () => {
      let index = 0;
      await page.goto(`https://${shopBaseDomain}`);
      await page.waitForLoadState("networkidle");
      let url = page.url();

      while (index < 3 && !url.includes(shopBaseDomain)) {
        await page.reload();
        await page.waitForLoadState("networkidle");
        url = page.url();
        index++;
      }
      expect(url).toContain(shopBaseDomain);
    });

    await test.step("Tại tab SF, mở home page bằng connected domain", async () => {
      await page.goto(`https://${data.connect_domain}`);
      await page.waitForLoadState("networkidle");
      const url = page.url();
      expect(url).toContain(data.connect_domain);
    });
  });
});
