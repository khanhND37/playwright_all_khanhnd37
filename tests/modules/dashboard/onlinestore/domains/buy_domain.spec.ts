import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { OnlineStoreDomainPage } from "@pages/dashboard/online_store_domains";

test.describe("Verify buy domain", async () => {
  const conf = loadData(__dirname, "BUY_DOMAIN");
  conf.caseConf.data.forEach(caseInfo => {
    test(`${caseInfo.description} @${caseInfo.case_id}`, async ({ dashboard }) => {
      let hasDomains = false;
      const domainsPage = new OnlineStoreDomainPage(dashboard, conf.suiteConf.domain);
      const buyDomain = domainsPage.generateDomain();

      await test.step("Search domain", async () => {
        await dashboard.goto(`https://${caseInfo.domain}/admin/domain`);
        await dashboard.waitForSelector(domainsPage.sidebarSelector);
        await dashboard.waitForSelector(domainsPage.pageDomainSelector);
        if (await domainsPage.sbManagedDomains.isVisible()) {
          hasDomains = true;
        }

        await dashboard.click(domainsPage.btnBuyNewDomain);
        await dashboard.fill(domainsPage.xpathInputDomain, buyDomain);
        await dashboard.waitForSelector(domainsPage.searchDomainResult);
      });

      await test.step("Buy domain", async () => {
        await dashboard.click(domainsPage.btnBuyPopularDomain);
        await dashboard.waitForSelector(domainsPage.buyNewDomainPage);
        await dashboard.click(domainsPage.btnBuyDomain);

        const topUp = await dashboard.locator(domainsPage.topUp).count();
        if (topUp) {
          await dashboard.click(domainsPage.topUp);
          await dashboard.click(domainsPage.btnConfirmTopUp);
          await expect(dashboard.locator(domainsPage.topUpSuccessMsg)).toBeVisible();

          await dashboard.reload();
          await dashboard.waitForSelector(domainsPage.sidebarSelector);
          await dashboard.waitForSelector(domainsPage.buyNewDomainPage);
          await dashboard.click("button.is-primary");
        }

        await dashboard.click(domainsPage.btnPayNow);
        await dashboard.waitForSelector(domainsPage.primaryBtnIsLoading, { state: "hidden" });
        await expect(dashboard.locator(domainsPage.purchaseSuccessMsg)).toBeVisible();
      });

      await test.step("Verify buy domain", async () => {
        const expectedText = !hasDomains
          ? `Congratulations, Your domain was successfully purchased.
        An email has been sent to the ${caseInfo.username} for verification.`
          : `Congratulations, Your domain was successfully purchased.`;
        await expect(dashboard.locator(".s-alert__content")).toHaveText(expectedText);
        await dashboard.locator(".finish-buy-domain .router-link-active").hover();
        await dashboard.locator(".finish-buy-domain .router-link-active").click();
        await dashboard.waitForSelector(".page-domain");
        await expect(dashboard.locator(`//tr[descendant::td[normalize-space()= "${buyDomain}"]]`)).toBeVisible();
      });
    });
  });
});
