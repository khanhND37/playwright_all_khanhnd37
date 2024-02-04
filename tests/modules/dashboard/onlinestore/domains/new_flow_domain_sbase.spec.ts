import { expect, test } from "@core/fixtures";
import { verifyRedirectUrl } from "@core/utils/theme";
import { OnlineStoreNewFlowDomainPage } from "@pages/dashboard/online_store_new_domains";

let domainsPage: OnlineStoreNewFlowDomainPage;

test.describe("Verify new flow domain", async () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    domainsPage = new OnlineStoreNewFlowDomainPage(dashboard, conf.suiteConf.domain);
    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/domain`);
  });

  test("SB_Check UI của màn domain @SB_OLS_DM_233", async ({ dashboard, conf }) => {
    await test.step("Tại dashboard chọn Online store > Domains", async () => {
      const elementsNeedVisible = [
        domainsPage.backBtnSelector,
        domainsPage.xpathDomainTitle,
        domainsPage.xpathConnectDomainBtn,
        domainsPage.xpathBuyDomainBtn,
        domainsPage.xpathShopDomainTab,
        domainsPage.xpathSbaseManagedTab,
      ];
      for (const elementNeedVisible of elementsNeedVisible) {
        await expect(dashboard.locator(elementNeedVisible)).toBeVisible();
      }

      await domainsPage.verifyDomainRowActions("Connected", "Set as primary");
      await domainsPage.verifyDomainRowActions("Not connected", "Check DNS");
    });

    await test.step("Select tab ShopBase-managed domains", async () => {
      await Promise.all([
        dashboard.locator(domainsPage.xpathSbaseManagedTab).click(),
        domainsPage.waitResponseWithUrl("/admin/domains.json"),
      ]);
      const cols = ["Domain name", "Status", "Expired date", "Auto renew", ""];
      for (const i in cols) {
        await expect(domainsPage.getManagedTableColXpath(i)).toHaveText(cols[i]);
      }

      const sbaseManagedDomainRows = await domainsPage.getShopBaseManagedDomains();

      const tableDomains = sbaseManagedDomainRows.map(row => row.find(item => item.key === "domain").value);
      const domainConfigs = conf.caseConf.expect.shopbase_managed_domains;
      for (const domain of Object.keys(domainConfigs)) {
        expect(tableDomains).toContain(domain);
        const tableDomain = sbaseManagedDomainRows.find(
          row => row.find(item => item.key === "domain").value === domain,
        );
        const domainConf = domainConfigs[domain];
        Object.keys(domainConf).forEach(key => {
          expect(domainConf[key]).toEqual(tableDomain.find(item => item.key === key).value);
        });
      }
    });

    await test.step("Click Back ", async () => {
      await dashboard.locator(domainsPage.backBtnSelector).click();
      await expect(dashboard).toHaveURL(/\/admin\/themes$/);
    });
  });

  test("SB_Check các action trong tab Shop domains @SB_OLS_DM_234", async ({ dashboard, context, page, conf }) => {
    let closeBtn, setAsPrimaryBtn, checkDNSModal, availableDomainToRedirect, connectedDomains;

    await test.step("Click Set as primary ở Domain A", async () => {
      setAsPrimaryBtn = dashboard.getByRole("button", { name: "Set as primary" }).first();
      await setAsPrimaryBtn.click();
      await expect(dashboard.locator(domainsPage.changePrimaryDomainModalSelector)).toBeAttached();
      await expect(domainsPage.getSetPrimaryDomainHeaderSelector()).toHaveText("Set primary domain");
      await expect(domainsPage.getSetPrimaryDomainContentSelector().first()).toContainText(
        /Are you sure you set .* as your primary domain\? This will be what your customers and search engines see\./,
      );
      await expect(dashboard.locator(domainsPage.xpathSetAsPrimaryModalBtn)).toBeVisible();
      await expect(dashboard.locator(domainsPage.xpathCancelPrimaryModalBtn)).toBeVisible();
      closeBtn = domainsPage.getSetPrimaryDomainCloseBtnSelector();
      await expect(closeBtn).toBeVisible();
    });

    await test.step("Click x/Cancel", async () => {
      const currentPrimaryDomain = await domainsPage.getCurrentPrimaryDomain();
      await closeBtn.click();
      expect(currentPrimaryDomain).toEqual(await domainsPage.getCurrentPrimaryDomain());
    });

    await test.step("Click Set as Primary", async () => {
      const selectedDomain = await domainsPage.getSelectedPrimaryDomain();
      await setAsPrimaryBtn.click();
      await Promise.all([
        dashboard.locator(domainsPage.xpathSetAsPrimaryModalBtn).click(),
        domainsPage.waitResponseWithUrl("/admin/setting/domains.json"),
      ]);
      expect(await domainsPage.getCurrentPrimaryDomain()).toEqual(selectedDomain);
    });

    await test.step("Click Check DNS", async () => {
      const checkDNSBtn = dashboard.locator(domainsPage.xpathCheckDNSBtn);
      await checkDNSBtn.click();
      checkDNSModal = dashboard.locator(domainsPage.popupSelector);
      await expect(checkDNSModal).toBeAttached();
      await expect(dashboard.locator(domainsPage.popupSelector).locator(domainsPage.alertTitleSelector)).toHaveText(
        conf.caseConf.expect.check_dns_text,
      );
    });

    await test.step("Icon copy", async () => {
      const copyIcon = dashboard.locator(domainsPage.xpathDNSRequiredText).first();
      await copyIcon.click();
      await expect(dashboard.locator(domainsPage.xpathToastMessage)).toBeAttached();
    });

    await test.step("Click CTA button step-by-step instructions", async () => {
      await verifyRedirectUrl({
        page: dashboard,
        context,
        selector: domainsPage.xpathStepByStepInstructions,
        redirectUrl: domainsPage.stepByStepUrl,
      });
    });

    await test.step("Click X/Cancel", async () => {
      await checkDNSModal.locator(domainsPage.popupXButtonSelector).click();
      expect(checkDNSModal).not.toBeAttached();
    });

    const rowWithRemoveAction = dashboard
      .locator(`${domainsPage.connectedDomainTabTableSelector} tbody tr`)
      .filter({
        hasNot: dashboard.locator(domainsPage.xpathPrimaryDomainRow),
      })
      .filter({
        hasNotText: /.*.(myshopbase.net|onshopbase.com)/gm,
      })
      .filter({
        hasNotText: /Not connected/gm,
      })
      .first();
    const domainWillRemove = await rowWithRemoveAction.locator("td").first().textContent();

    await test.step("Click ...", async () => {
      await rowWithRemoveAction.locator(domainsPage.popoverReferenceSelector).click();
    });

    await test.step("Click remove", async () => {
      const popoverId = await dashboard
        .getByRole("tooltip")
        .filter({
          has: dashboard.locator(domainsPage.xpathRemoveDomainBtn),
        })
        .evaluateAll(popovers => popovers.find(popover => popover.style.display !== "none").id);
      const removeMenuItem = domainsPage.getRemoveFromShopXpath(popoverId);
      await removeMenuItem.click();
      await expect(dashboard.getByText("Remove domain")).toBeVisible();
      await Promise.all([
        dashboard.locator(domainsPage.modalPrimaryBtnSelector).click(),
        domainsPage.waitResponseWithUrl("/admin/setting/domains.json"),
      ]);
      connectedDomains = await domainsPage.getConnectedDomains();
      expect(connectedDomains.map(row => row.find(item => item.key === "domain").value)).not.toContain(
        domainWillRemove,
      );
    });

    const redirectionLocator = dashboard.locator(`${domainsPage.xpathTrafficFrom}//parent::p//a`);

    await test.step("Click enable redirection", async () => {
      await redirectionLocator.click();
      await expect(dashboard.getByText("Enable redirection?")).toBeVisible();
    });

    await test.step("Click enable redirect", async () => {
      await Promise.all([
        dashboard.locator(domainsPage.modalPrimaryBtnSelector).click(),
        domainsPage.waitResponseWithUrl("set_traffic_redirect.json"),
      ]);
      await expect(dashboard.locator(domainsPage.xpathTrafficFrom)).toHaveText(
        "Traffic from all your domains redirects to this primary domain.",
      );
      await expect(redirectionLocator).toHaveText("Disable redirection");
    });

    await test.step("Check mở SF", async () => {
      availableDomainToRedirect = await dashboard.evaluate(() => location.origin);
      await page.goto(availableDomainToRedirect);
      await page.waitForLoadState("load");
      const primaryDomain = await domainsPage.getCurrentPrimaryDomain();
      await expect(page).toHaveURL(new RegExp(primaryDomain));
    });

    await test.step("Click Disable redirect", async () => {
      await redirectionLocator.click();
      await expect(dashboard.getByText("Disable redirection?")).toBeVisible();
      await Promise.all([
        dashboard.locator(domainsPage.modalPrimaryBtnSelector).click(),
        domainsPage.waitResponseWithUrl("set_traffic_redirect.json"),
      ]);
      await expect(dashboard.locator(domainsPage.xpathTrafficFrom)).toHaveText(
        "Traffic from your domains is not being redirected to this primary domain.",
      );
      await expect(redirectionLocator).toHaveText("Enable redirection");
    });

    await test.step("Check mở SF", async () => {
      // Wait for domain DNS redirect
      await page.waitForTimeout(5000);
      await page.goto(availableDomainToRedirect);
      await page.waitForLoadState("load");
      await expect(page).toHaveURL(new RegExp(availableDomainToRedirect));
    });
  });

  test("SB_Check các actions trong tab ShopBase-managed Domains @SB_OLS_DM_235", async ({ dashboard }) => {
    await dashboard.waitForLoadState("networkidle");
    await test.step("Tại màn domain click tab Shopbase-managed domains", async () => {
      await Promise.all([
        dashboard.locator(domainsPage.xpathSbaseManagedTab).click(),
        domainsPage.waitResponseWithUrl("/admin/domains.json"),
      ]);
      const cols = ["Domain name", "Status", "Expired date", "Auto renew", ""];
      for (const i in cols) {
        await expect(domainsPage.getManagedTableColXpath(i)).toHaveText(cols[i]);
      }
    });

    await test.step("Click Domain name", async () => {
      const domainLocator = dashboard.locator(`${domainsPage.sbaseManagedTabTableSelector} td a`).first();
      const domainName = await domainLocator.textContent();
      await domainLocator.click();
      await dashboard.waitForURL(/admin\/domain\/view/);
      await expect(dashboard.locator(domainsPage.viewDomainTextSelector)).toHaveText(domainName);
      await expect(dashboard.locator(domainsPage.xpathExpireAt)).toBeVisible();
      await dashboard.goBack();
      await Promise.all([
        dashboard.locator(domainsPage.xpathSbaseManagedTab).click(),
        domainsPage.waitResponseWithUrl("/admin/domains.json"),
      ]);
    });

    await test.step("Click Renew Domain C", async () => {
      await dashboard.locator(domainsPage.xpathRenewBtn).click();
      await dashboard.waitForURL(/\/domain\/renew/);
      await expect(dashboard.locator(domainsPage.xpathRenewTitle)).toBeVisible();
    });
  });

  test("SB_Check luồng Connect existing domain valid @SB_OLS_DM_236", async ({ dashboard, conf, context }) => {
    const { connectDomainBtn, connectDomainInput, connectBtn, closeConnectModalBtn } = domainsPage.getConnectModalBtn();

    await test.step("Click Connect existing domain", async () => {
      await connectDomainBtn.click();
      expect(await connectDomainInput.getAttribute("placeholder")).toBe("example.com");
      expect(await connectBtn.getAttribute("disabled")).toBe("disabled");
    });

    await test.step("Click x/Cancel", async () => {
      await closeConnectModalBtn.click();
      await expect(dashboard.locator(domainsPage.connectDomainModalSelector)).not.toBeAttached();
    });

    const { shopbase_domain: shopbaseDomain } = conf.caseConf.connect_existing_domain.input;

    const fillConnectDomain = async (text: string, closeModal = true) => {
      if (closeModal && (await closeConnectModalBtn.isVisible())) {
        await closeConnectModalBtn.click();
      }
      await connectDomainBtn.click();
      await connectDomainInput.fill(text);
      await connectBtn.click();
    };

    await test.step("- Click Connect existing domain  - nhập domain vào text box và Next", async () => {
      // Case 1: Internal Domain (Domain mua từ shopbase)
      await fillConnectDomain(shopbaseDomain, false);
      await expect(dashboard.locator(domainsPage.xpathViewInstructionsBtn)).toBeVisible();
      // Case 2: External domain ( Domain mua từ chỗ  khác )
      await fillConnectDomain(domainsPage.getRandomDomain());
      await expect(dashboard.locator(domainsPage.xpathVerifyConnection)).toBeVisible();
    });

    await test.step("Click edit", async () => {
      await fillConnectDomain(shopbaseDomain);
      await dashboard.locator(domainsPage.xpathConnectDomainModalEditBtn).click();
      await expect(connectBtn).toBeVisible();
    });

    await test.step("Tại popup Verify Connection click Verify connection", async () => {
      const timestamp = new Date().getTime();
      const sbdevDomain = `auto-domain-${timestamp}.sbdev.tk`;
      await fillConnectDomain(sbdevDomain);
      await dashboard.locator(domainsPage.xpathVerifyConnection).click();
      await expect(
        dashboard.locator(
          `//p[normalize-space()="Your domain “${sbdevDomain}” is now pointing to your online store. It can take up 24 hours for the changes to propagate and 60 minutes to generating SSL."]`,
        ),
      ).toBeVisible();
      await Promise.all([
        dashboard.locator(domainsPage.xpathCloseBtn).click(),
        domainsPage.waitResponseWithUrl("/admin/setting/domains.json"),
      ]);
      await expect(dashboard.locator(domainsPage.shopDomainTabSelector)).toHaveClass(
        new RegExp(/sb-tab-navigation__item--active/),
      );
      const connectedDomains = await domainsPage.getConnectedDomains();
      expect(connectedDomains.map(row => row.find(item => item.key === "domain").value)).toContain(sbdevDomain);
    });

    await test.step("Tại popup Verify Connection click View instruction", async () => {
      await fillConnectDomain(shopbaseDomain);
      await verifyRedirectUrl({
        page: dashboard,
        context,
        selector: domainsPage.xpathViewInstructionsBtn,
        redirectUrl: domainsPage.stepByStepUrl,
      });
    });
  });

  test("SB_Check luồng Connect existing domain invalid @SB_OLS_DM_237", async ({ dashboard, context, conf }) => {
    const { shopbase_domain: shopbaseDomain, connected_to_other_store: domainConnectedToOtherStore } =
      conf.caseConf.connect_existing_domain.input;
    const { connectBtn, connectDomainBtn, connectDomainInput } = domainsPage.getConnectModalBtn();

    await test.step("Click Connect existing domain", async () => {
      await connectDomainBtn.click();
      expect(await connectDomainInput.getAttribute("placeholder")).toBe("example.com");
      expect(await connectBtn.getAttribute("disabled")).toBe("disabled");
    });

    await test.step("Nhập domain vào text box và Next", async () => {
      // Case error DNS
      await domainsPage.fillConnectDomain(shopbaseDomain);
      await Promise.all([
        dashboard.locator(domainsPage.xpathVerifyConnection).click(),
        domainsPage.waitResponseWithUrl("verify_domain_dns_v2.json"),
      ]);
      await expect(dashboard.locator(domainsPage.xpathConnectYourDomainText)).toBeVisible();
      // Case connected to other store
      await domainsPage.fillConnectDomain(domainConnectedToOtherStore);
      await expect(dashboard.locator(domainsPage.xpathConnectedToOtherStoreText)).toBeVisible();
    });

    await test.step("Tại popup check lỗi DNS click Edit", async () => {
      await domainsPage.fillConnectDomain(shopbaseDomain);
      await Promise.all([
        dashboard.locator(domainsPage.xpathVerifyConnection).click(),
        domainsPage.waitResponseWithUrl("verify_domain_dns_v2.json"),
      ]);
      await dashboard.locator(domainsPage.xpathConnectDomainModalEditBtn).click();
      await expect(connectBtn).toBeVisible();
    });

    await test.step("Click View instruction", async () => {
      await domainsPage.fillConnectDomain(shopbaseDomain);
      await verifyRedirectUrl({
        page: dashboard,
        context,
        selector: domainsPage.xpathViewInstructionsBtn,
        redirectUrl: domainsPage.stepByStepUrl,
      });
    });

    await test.step("Click Verify again", async () => {
      await domainsPage.fillConnectDomain(shopbaseDomain);
      await Promise.all([
        dashboard.locator(domainsPage.xpathVerifyConnection).click(),
        domainsPage.waitResponseWithUrl("verify_domain_dns_v2.json"),
      ]);
      await expect(dashboard.locator(domainsPage.xpathConnectYourDomainText)).toBeVisible();
    });
  });
});
